/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import type BetterSqlite3 from 'better-sqlite3';
import { load as loadSqliteVec } from 'sqlite-vec';
import {
  DetailedResult,
  Result,
  captureResult,
  fail,
  failWithDetail,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';
import {
  IEdgeTarget,
  IMemoryRecordListing,
  IMemoryRecordSource,
  ISkippedVectorRecord,
  IVectorIndex,
  IVectorQueryHit,
  IVectorRebuildOptions,
  IVectorRebuildReport,
  Kind,
  MemoryEmbedder,
  MemoryId,
  MemoryScopeKey,
  edgeTargetKey
} from '@fgv/ts-agent-memory';
import { invokeHook, tally, withRollbackNote } from './rebuildHelpers';
import { closeOwnedConnection, openOwnedConnection } from './connection';
import {
  ISqliteVecVectorIndexCreateParams,
  ISqliteVecVectorIndexHandle,
  ISqliteVecVectorIndexOpenParams
} from './model';

/** Default name for the `vec0` virtual table. */
const DEFAULT_TABLE_NAME: string = 'memory_vectors';

/** Package-facing prefix for this class's failure messages. */
const LABEL: string = 'sqlite-vec index';

/** A simple SQL identifier — the only shape allowed for the table name (it is interpolated into DDL). */
const IDENTIFIER_RE: RegExp = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** One KNN row as returned by the `vec0` MATCH query. */
interface IKnnRow {
  readonly target_key: string;
  readonly distance: number;
}

/**
 * A persistent, `sqlite-vec`-backed `IVectorIndex` for `@fgv/ts-agent-memory`.
 *
 * @remarks
 * This is the **durable** counterpart to the in-memory `InMemoryCosineIndex`:
 * embeddings live in a `sqlite-vec` `vec0` virtual table inside a `better-sqlite3`
 * database, so they survive a process restart. A consumer that wires this index
 * into `FileTreeMemoryStore` (instead of the in-memory index) opens an existing
 * vault **without re-embedding it** — the vectors are already on disk. New writes
 * still flow through the store's incremental embed-on-write path; there is no core
 * store change.
 *
 * The index is keyed by the canonical `edgeTargetKey` of each record's
 * scope-qualified `(scope, id)` address (a `TEXT PRIMARY KEY` on the `vec0` table),
 * so two records that share a filename stem across scopes never collide. The
 * dimension is established by the first `add` (the `vec0` column is fixed-width) and
 * recovered from the table schema when a persistent file is reopened; every later
 * `add`/`query` must match it or fail loudly, exactly as the in-memory index does.
 * Similarity is cosine (`distance_metric=cosine`): the returned `score` is
 * `1 - cosineDistance`, i.e. cosine similarity in `[-1, 1]`, higher = more similar —
 * byte-for-byte the same scoring contract as `InMemoryCosineIndex`.
 *
 * Query is a brute-force `vec0` KNN scan (not an ANN structure): correct and
 * durable, appropriate for the same "thousands of records" regime the in-memory
 * index targets. Large-N ANN indexing is explicitly out of scope — see the README.
 *
 * **Connection ownership depends on which factory you use.** With
 * {@link SqliteVecVectorIndex.create} the `Database` is consumer-owned
 * (bring-your-own): this index loads the `sqlite-vec` extension onto it and
 * reads/writes the table, but never opens or closes the connection — and that is
 * the seam for backing a record index and a fragment index with one connection.
 * With {@link SqliteVecVectorIndex.open} this package opens the file itself and
 * hands back a handle carrying the disposer for the connection it created.
 * @public
 */
export class SqliteVecVectorIndex implements IVectorIndex {
  private readonly _db: BetterSqlite3.Database;
  private readonly _table: string;
  /** The dimension of every stored vector; `undefined` until the table exists (first `add` or a reopened non-empty file). */
  private _dimension: number | undefined;
  /** Prepared statements; created once the table exists (established or recovered). */
  private _stmts: ISqliteVecStatements | undefined;
  /**
   * Set by {@link SqliteVecVectorIndex.release}. Distinct from `_stmts === undefined`,
   * which means *no dimension established yet* — see the remarks on `release`.
   */
  private _released: boolean;

  private constructor(db: BetterSqlite3.Database, table: string, dimension: number | undefined) {
    this._db = db;
    this._table = table;
    this._dimension = dimension;
    this._released = false;
    this._stmts = dimension === undefined ? undefined : this._prepare();
  }

  /**
   * The number of vectors currently held. Zero before the first `add`.
   *
   * @remarks
   * **Throws on a released index**, where every other member returns a `Failure` —
   * because `IVectorIndex` declares this a synchronous `number` and there is no
   * `Result` to fail into. Throwing preserves the behaviour a released index had
   * before it had an explicit released state (the underlying statement threw
   * against the closed connection); the alternative, answering `0`, would be a
   * confident lie indistinguishable from an empty index.
   */
  public get size(): number {
    this._assertUsable('read size');
    if (this._stmts === undefined) {
      return 0;
    }
    // `Number(...)` narrows the count in case the consumer enabled better-sqlite3
    // safe-integer mode (`db.defaultSafeIntegers(true)`), which returns `count(*)`
    // as a `bigint`. Without it a `bigint` leaks through a `number`-typed contract
    // member — and now through `IIndexCoverage.indexSize`, which is also declared
    // `number`, so the coverage report would carry a value of the wrong runtime
    // type. `SqliteVecFragmentIndex`'s two counts have always converted; this one
    // was the outlier.
    return Number((this._stmts.count.get() as { c: number | bigint }).c);
  }

  /**
   * Family-convention factory. Loads the `sqlite-vec` extension onto the supplied
   * `better-sqlite3` connection and, if the vector table already exists (a reopened
   * persistent file), recovers its established dimension so no re-embedding is
   * needed on open.
   *
   * @param params - See {@link ISqliteVecVectorIndexCreateParams}.
   * @returns `Success` with the index, or `Failure` if the table name is not a
   * simple identifier or the extension fails to load.
   */
  public static create(params: ISqliteVecVectorIndexCreateParams): Promise<Result<SqliteVecVectorIndex>> {
    const table: string = params.tableName ?? DEFAULT_TABLE_NAME;
    if (!IDENTIFIER_RE.test(table)) {
      return Promise.resolve(fail(`sqlite-vec index: table name '${table}' is not a simple SQL identifier`));
    }
    return Promise.resolve(
      captureResult(() => {
        loadSqliteVec(params.database);
        const dimension: number | undefined = SqliteVecVectorIndex._readExistingDimension(
          params.database,
          table
        );
        return new SqliteVecVectorIndex(params.database, table, dimension);
      }).withErrorFormat((e) => `sqlite-vec index: failed to initialize: ${e}`)
    );
  }

  /**
   * Path-based factory. Opens the database file itself and returns the index
   * together with a disposer for the connection it created.
   *
   * @remarks
   * The convenience over {@link SqliteVecVectorIndex.create} is that the consumer
   * neither value-imports `better-sqlite3` nor re-establishes `Result` discipline
   * around a constructor that throws — this is the one place the package leaked its
   * own dependency into consumer source.
   *
   * **Use `create` instead when one connection must back more than one index** (a
   * record index and a fragment index in the same file, the intended shared-handle
   * case). Two `open` calls on one path give two independent connections, not a
   * shared one.
   *
   * If initialization fails after the file is opened, the connection is closed
   * before returning, so a failed `open` does not leak the descriptor it created.
   * Should that close *itself* fail — the connection is then genuinely leaked — the
   * returned message says so rather than hiding it.
   *
   * @param params - See {@link ISqliteVecVectorIndexOpenParams}.
   * @returns `Success` with a {@link ISqliteVecVectorIndexHandle}, or `Failure` if
   * the driver could not be loaded, the file could not be opened, the table name is
   * not a simple identifier, or the extension fails to load.
   */
  public static async open(
    params: ISqliteVecVectorIndexOpenParams
  ): Promise<Result<ISqliteVecVectorIndexHandle>> {
    return (await openOwnedConnection(params.path, LABEL)).thenOnSuccess(async (database) =>
      (await SqliteVecVectorIndex.create({ database, tableName: params.tableName }))
        .onFailure((message) =>
          // This call opened the connection, so a failure to initialize on top of it
          // must not leave the file handle behind. A close that ALSO fails is said out
          // loud rather than swallowed — the same reasoning, and the same helper, as
          // `withRollbackNote`: silently discarding it would make the "a failed open
          // leaks nothing" guarantee untrue exactly when it stopped holding, with no
          // way for a caller to detect it.
          fail(withRollbackNote(message, closeOwnedConnection(database, LABEL)))
        )
        .onSuccess((index) =>
          succeed({
            index,
            close: () => {
              // Drop the statements BEFORE closing, so there is never a moment where
              // a closed connection has live `Statement` objects pointing at it —
              // see `release`.
              index.release();
              return closeOwnedConnection(database, LABEL);
            }
          })
        )
    );
  }

  /**
   * Drops this index's prepared statements and marks it unusable. Does **not**
   * touch the connection.
   *
   * @remarks
   * `better-sqlite3` exposes no public `finalize()`, so releasing the last
   * reference to a `Statement` does not finalize it — it makes it collectable
   * *earlier*, while the environment is alive, rather than surviving to process
   * teardown. That narrows the window in which `Statement::~Statement()` runs
   * against a torn-down environment; it is not a proof against it.
   *
   * **Call this before closing a connection you own.** {@link
   * SqliteVecVectorIndex.open}'s handle does it for you. A `create()`-made index
   * holds a connection it does not own and stays structurally incapable of
   * closing it — this method drops only what the index itself allocated, which is
   * why it is safe to expose there.
   *
   * Idempotent. After it, every member fails (or, for `size`, throws) rather than
   * answering: a released index is deliberately distinguishable from one that has
   * simply never had an `add`, whose `_stmts` are also absent but which answers
   * `size === 0` truthfully.
   */
  public release(): void {
    this._released = true;
    this._stmts = undefined;
  }

  /**
   * Throw if this index has been released. The one member that calls it and cannot
   * return a `Result` is `size`; the rest convert the throw via `captureResult`.
   */
  private _assertUsable(what: string): void {
    if (this._released) {
      throw new Error(`vector index: cannot ${what}: the index has been released`);
    }
  }

  /** {@inheritDoc IVectorIndex.add} */
  public add(target: IEdgeTarget, vector: Float32Array): Promise<Result<string>> {
    const key: string = edgeTargetKey(target);
    if (this._released) {
      return Promise.resolve(fail(`vector index: cannot add '${key}': the index has been released`));
    }
    if (vector.length === 0) {
      return Promise.resolve(fail(`vector index: cannot add '${key}': empty vector`));
    }
    if (this._dimension !== undefined && vector.length !== this._dimension) {
      return Promise.resolve(
        fail(
          `vector index: cannot add '${key}': dimension ${vector.length} does not match index dimension ${this._dimension}`
        )
      );
    }
    return Promise.resolve(
      captureResult(() => {
        if (this._stmts === undefined) {
          this._createTable(vector.length);
          this._dimension = vector.length;
          this._stmts = this._prepare();
        }
        this._stmts.replace(key, SqliteVecVectorIndex._toBlob(vector));
        return key;
      }).withErrorFormat((e) => `vector index: cannot add '${key}': ${e}`)
    );
  }

  /** {@inheritDoc IVectorIndex.has} */
  public has(target: IEdgeTarget): Promise<Result<boolean>> {
    return Promise.resolve(
      captureResult(() => {
        this._assertUsable(`check '${edgeTargetKey(target)}'`);
        // Before any add has created the table there is nothing held, which is a
        // truthful `false` rather than an error — same posture as `remove`'s
        // idempotence and `size`'s zero.
        if (this._stmts === undefined) {
          return false;
        }
        return this._stmts.has.get(edgeTargetKey(target)) !== undefined;
      }).withErrorFormat((e) => `vector index: cannot check '${edgeTargetKey(target)}': ${e}`)
    );
  }

  /** {@inheritDoc IVectorIndex.remove} */
  public remove(target: IEdgeTarget): Promise<Result<IEdgeTarget>> {
    return Promise.resolve(
      captureResult(() => {
        this._assertUsable(`remove '${edgeTargetKey(target)}'`);
        // Idempotent: removing a target with no embedding (or before any `add`
        // created the table) still succeeds.
        if (this._stmts !== undefined) {
          this._stmts.delete.run(edgeTargetKey(target));
        }
        return target;
      }).withErrorFormat((e) => `vector index: cannot remove '${edgeTargetKey(target)}': ${e}`)
    );
  }

  /**
   * Re-embed every record from `source` and rebuild the persisted index — see
   * `IVectorIndex.rebuild` for the mode semantics, which this implementation
   * matches exactly.
   *
   * @remarks
   * **Not atomic, and cannot be.** `better-sqlite3` transactions are synchronous,
   * so one cannot span the `await embed(...)` calls this loop makes — unlike
   * {@link SqliteVecVectorIndex.add}, which wraps its delete-then-insert. The
   * `'fail'` / `'skip'` modes therefore cover only failures JavaScript can catch:
   * a process kill mid-rebuild leaves the table holding neither the old index nor
   * the complete new one, and the remedy is to run `rebuild` again.
   */
  public async rebuild(
    source: IMemoryRecordSource,
    embed: MemoryEmbedder,
    options?: IVectorRebuildOptions
  ): Promise<DetailedResult<IVectorRebuildReport, IVectorRebuildReport>> {
    const lenient: boolean = (options?.onRecordError ?? 'fail') === 'skip';
    // `source` is consumer-supplied, so a throw or rejection becomes a `Failure`
    // here rather than escaping as an exception.
    const listed: Result<IMemoryRecordListing> = await invokeHook(() => source.list());
    if (listed.isFailure()) {
      // Deliberately BEFORE any clear: a failed list is no evidence about the
      // vectors already held, and no re-embedding has been attempted, so there is
      // no half-rebuilt state to protect against. Clearing here would destroy a
      // healthy persisted index over a transient read error. No report either, for
      // the same reason — there is nothing this call disturbed to describe.
      return failWithDetail(`vector index rebuild: failed to list records: ${listed.message}`);
    }
    const cleared: Result<true> = this._clear();
    if (cleared.isFailure()) {
      // Also nothing established: the table still holds whatever it held.
      return failWithDetail(`vector index rebuild: failed to clear the index: ${cleared.message}`);
    }
    const indexed: Map<Kind, number> = new Map<Kind, number>();
    const declined: Map<Kind, number> = new Map<Kind, number>();
    const skipped: ISkippedVectorRecord[] = [];
    // Absent stays absent — only the source knows whether it filtered anything.
    const report = (): IVectorRebuildReport => ({
      indexed,
      declined,
      excluded: listed.value.excluded,
      skipped
    });
    for (const scoped of listed.value.records) {
      const kind: Kind = scoped.record.envelope.kind;
      // Likewise capture-wrapped: an embedder that throws mid-loop would
      // otherwise escape past the `'fail'` rollback below, leaving this DURABLE
      // table holding a partial index that survives the process.
      const embedded: Result<Float32Array | undefined> = await invokeHook(() => embed(scoped.record));
      if (embedded.isFailure()) {
        const error: string = `vector index rebuild: embedding '${edgeTargetKey(scoped.target)}' failed: ${
          embedded.message
        }`;
        if (!lenient) {
          return failWithDetail(withRollbackNote(error, this._clear()), report());
        }
        skipped.push({ target: scoped.target, error });
        continue;
      }
      if (embedded.value === undefined) {
        tally(declined, kind);
        continue;
      }
      const added: Result<string> = await this.add(scoped.target, embedded.value);
      if (added.isFailure()) {
        const error: string = `vector index rebuild: ${added.message}`;
        if (!lenient) {
          return failWithDetail(withRollbackNote(error, this._clear()), report());
        }
        skipped.push({ target: scoped.target, error });
        continue;
      }
      // Tallied in the loop rather than read back off `size` at the end. That
      // `COUNT` was also the only fallible step in assembling the report, so the
      // per-kind tally removes a failure path as well as a rounding of the answer.
      tally(indexed, kind);
    }
    return succeedWithDetail(report());
  }

  /**
   * **Empties the rows; does NOT release the table's declared dimension.** That
   * is a `vec0` constraint rather than a choice — the dimension is schema, and
   * there is no `ALTER TABLE` for it — so a rebuild at a new dimension fails
   * here where it would succeed on the in-memory sibling, which forgets its
   * dimension on reset. Changing dimension needs a drop-and-re-index; see the
   * note on `IVectorIndex.rebuild`.
   */
  private _clear(): Result<true> {
    if (this._released) {
      return fail('vector index: cannot clear: the index has been released');
    }
    if (this._stmts === undefined) {
      return succeed(true);
    }
    // `exec`, not `prepare(...).run()`, and the reason is lifetime rather than
    // style. A prepared statement here would be referenced by nothing the moment
    // it returned, so `release()` could not drop it — it is not in `_stmts` —
    // and its native destructor would run whenever GC reached it, possibly
    // during environment teardown, which is the frame the reported
    // `Statement::~Statement()` abort fires in. `exec` creates no `Statement` at
    // all, so there is no destructor and no cleanup hook to outlive anything.
    // Safe here because this runs outside any transaction: `rebuild` is async
    // and explicitly not transactional, and `add`'s transaction is its own.
    // Capture-wrapped like `add` / `remove` / `query`: a closed connection or an
    // I/O error here is a `Failure`, not an exception thrown out of a method
    // whose signature promises a `Result`.
    return captureResult(() => this._db.exec(`DELETE FROM "${this._table}"`)).onSuccess(() => succeed(true));
  }

  /** {@inheritDoc IVectorIndex.query} */
  public query(vector: Float32Array, topK: number): Promise<Result<ReadonlyArray<IVectorQueryHit>>> {
    if (this._released) {
      return Promise.resolve(fail('vector index: cannot query: the index has been released'));
    }
    if (topK <= 0 || this._stmts === undefined) {
      return Promise.resolve(succeed([]));
    }
    if (vector.length !== this._dimension) {
      return Promise.resolve(
        fail(
          `vector index: query dimension ${vector.length} does not match index dimension ${this._dimension}`
        )
      );
    }
    return Promise.resolve(
      captureResult<ReadonlyArray<IVectorQueryHit>>(() => {
        const rows: ReadonlyArray<IKnnRow> = this._stmts!.query.all(
          SqliteVecVectorIndex._toBlob(vector),
          topK
        ) as ReadonlyArray<IKnnRow>;
        // sqlite-vec returns rows in ascending distance (nearest first); score is
        // `1 - cosineDistance` = cosine similarity, so descending score is preserved.
        return rows.map((row) => ({
          target: SqliteVecVectorIndex._parseKey(row.target_key),
          score: 1 - row.distance
        }));
      }).withErrorFormat((e) => `vector index: query failed: ${e}`)
    );
  }

  /** Create the `vec0` virtual table with the established dimension. */
  private _createTable(dimension: number): void {
    this._db.exec(
      `CREATE VIRTUAL TABLE IF NOT EXISTS "${this._table}" USING vec0(` +
        `target_key TEXT PRIMARY KEY, embedding float[${dimension}] distance_metric=cosine)`
    );
  }

  /** Prepare the statements the index reuses. Requires the table to exist. */
  private _prepare(): ISqliteVecStatements {
    const del: BetterSqlite3.Statement = this._db.prepare(
      `DELETE FROM "${this._table}" WHERE target_key = ?`
    );
    const ins: BetterSqlite3.Statement = this._db.prepare(
      `INSERT INTO "${this._table}"(target_key, embedding) VALUES (?, ?)`
    );
    // vec0 rejects INSERT OR REPLACE on a TEXT primary key, so replace is a
    // delete-then-insert inside a single transaction.
    const replaceTxn: BetterSqlite3.Transaction<(key: string, blob: Uint8Array) => void> =
      this._db.transaction((key: string, blob: Uint8Array) => {
        del.run(key);
        ins.run(key, blob);
      });
    return {
      delete: del,
      replace: (key: string, blob: Uint8Array): void => {
        replaceTxn(key, blob);
      },
      query: this._db.prepare(
        `SELECT target_key, distance FROM "${this._table}" WHERE embedding MATCH ? AND k = ?`
      ),
      count: this._db.prepare(`SELECT count(*) AS c FROM "${this._table}"`),
      // `LIMIT 1` rather than a count: membership needs existence, not cardinality,
      // and vec0 can stop at the first row.
      has: this._db.prepare(`SELECT 1 FROM "${this._table}" WHERE target_key = ? LIMIT 1`)
    };
  }

  /**
   * Recover the established dimension of an existing `vec0` table from its stored
   * `CREATE VIRTUAL TABLE` SQL (`float[<n>]`). Returns `undefined` when the table
   * does not exist yet (a fresh database — dimension is set by the first `add`).
   */
  private static _readExistingDimension(db: BetterSqlite3.Database, table: string): number | undefined {
    const row: { sql: string } | undefined = db
      .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(table) as { sql: string } | undefined;
    if (row === undefined) {
      return undefined;
    }
    const match: RegExpMatchArray | null = row.sql.match(/float\[(\d+)\]/);
    return match === null ? undefined : Number(match[1]);
  }

  /** Pack a `Float32Array` as the little-endian byte blob `vec0` stores. Copies, so the caller may reuse its buffer. */
  private static _toBlob(vector: Float32Array): Uint8Array {
    return new Uint8Array(Float32Array.from(vector).buffer);
  }

  /**
   * Reverse `edgeTargetKey` — the canonical key is `scope\0id` with NUL
   * excluded from both components, so the first NUL splits it unambiguously.
   */
  private static _parseKey(key: string): IEdgeTarget {
    const nul: number = key.indexOf('\0');
    return {
      scope: key.slice(0, nul) as unknown as MemoryScopeKey,
      id: key.slice(nul + 1) as unknown as MemoryId
    };
  }
}

/** The prepared statements / helpers the index reuses once its table exists. */
interface ISqliteVecStatements {
  readonly delete: BetterSqlite3.Statement;
  readonly replace: (key: string, blob: Uint8Array) => void;
  readonly query: BetterSqlite3.Statement;
  readonly count: BetterSqlite3.Statement;
  readonly has: BetterSqlite3.Statement;
}
