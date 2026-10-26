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
import { IndexIdentity } from './indexIdentity';
import { closeOwnedConnection, openOwnedConnection } from './connection';
import {
  IIndexIdentityReport,
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
 *
 * **The embedding identity lives in the file.** Pass `identity` (an opaque string
 * naming the embedding model) and the index stores it in an ordinary
 * `fgv_sqlite_vec_meta` table, one row per index table, so it travels with the
 * vectors through a copy or restore. {@link SqliteVecVectorIndex.identity} compares
 * it on every call. While the status is `'mismatch'` or `'incomplete'`, `add` and
 * `query` fail with a message naming the status; `rebuild` is always allowed and is
 * the remedy. The first `add` to a fresh index creates the table and stores the
 * identity in one transaction; each fence check shares a transaction with the read
 * or write it guards, and every write transaction is `IMMEDIATE`. Nothing is
 * deleted automatically. `has`, `remove` and `size` are deliberately unfenced, so
 * coverage reporting and cleanup still work on a mismatched or incomplete index.
 * A handle opened without an identity is fenced only on `'incomplete'`: it can
 * write under another handle's stored identity, and its rebuild leaves the status
 * `'absent'` — identity checking is opt-in, per handle. An older version of this
 * package ignores the meta table entirely, so a file written by it (or rebuilt by
 * it after a downgrade) carries a row that no longer describes its vectors.
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
  /** The embedding identity stored beside the vectors; see {@link SqliteVecVectorIndex.identity}. */
  private readonly _identity: IndexIdentity;

  private constructor(
    db: BetterSqlite3.Database,
    table: string,
    dimension: number | undefined,
    identity: IndexIdentity
  ) {
    this._db = db;
    this._table = table;
    this._dimension = dimension;
    this._released = false;
    this._identity = identity;
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
        return new SqliteVecVectorIndex(
          params.database,
          table,
          dimension,
          new IndexIdentity(params.database, table, params.identity)
        );
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
      (
        await SqliteVecVectorIndex.create({
          database,
          tableName: params.tableName,
          identity: params.identity
        })
      )
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
    this._identity.release();
  }

  /**
   * Report the embedding identity stored in the database file, compared against
   * the one this handle was opened with. Reads the database on every call and
   * never writes, so it is safe on a read-only connection.
   *
   * @remarks
   * See {@link IIndexIdentityReport} for what each status means. While the status
   * is `'mismatch'` or `'incomplete'`, `add` and `query` fail; `rebuild` is the
   * remedy, and nothing is ever deleted automatically. Both reads behind the
   * report run in one read transaction, so it describes a single snapshot.
   *
   * @returns `Success` with the report, or `Failure` if the index has been
   * released or the database could not be read.
   */
  public identity(): Result<IIndexIdentityReport> {
    if (this._released) {
      return fail('vector index: cannot read identity: the index has been released');
    }
    return this._identity.report().withErrorFormat((e) => `vector index: cannot read identity: ${e}`);
  }

  /**
   * Record this handle's identity over stored vectors that have none, without
   * re-embedding them — a one-time migration for a consumer that kept the identity
   * somewhere else.
   *
   * @remarks
   * Legal while {@link SqliteVecVectorIndex.identity} reports `'absent'`, and
   * idempotent on `'match'`, where it succeeds without writing. `'mismatch'` and
   * `'incomplete'` are refused because adopting would certify vectors that are
   * known to be wrong or partial; they need a `rebuild`. `'fresh'` and
   * `'unchecked'` are refused because there is nothing, or no identity, to adopt.
   * The status check and the write run in one transaction.
   *
   * @returns `Success` with the report (`'match'`), or `Failure` naming the
   * status that made adoption illegal, or a database error (for example on a
   * read-only connection).
   */
  public adoptIdentity(): Result<IIndexIdentityReport> {
    if (this._released) {
      return fail('vector index: cannot adopt identity: the index has been released');
    }
    return this._identity.adopt().withErrorFormat((e) => `vector index: cannot adopt identity: ${e}`);
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
    return Promise.resolve(this._add(target, vector, 'fenced'));
  }

  /**
   * The body of `add`. `'rebuild'` is `rebuild`'s own path: it skips the fence,
   * which would refuse the `'incomplete'` state the rebuild itself is in, and does
   * not commit an identity on table creation, which only the rebuild's final
   * commit may do.
   */
  private _add(target: IEdgeTarget, vector: Float32Array, mode: WriteMode): Result<string> {
    const key: string = edgeTargetKey(target);
    if (this._released) {
      return fail(`vector index: cannot add '${key}': the index has been released`);
    }
    if (vector.length === 0) {
      return fail(`vector index: cannot add '${key}': empty vector`);
    }
    if (this._dimension !== undefined && vector.length !== this._dimension) {
      return fail(
        `vector index: cannot add '${key}': dimension ${vector.length} does not match index dimension ${this._dimension}`
      );
    }
    const blob: Uint8Array = SqliteVecVectorIndex._toBlob(vector);
    return this._establish(vector.length, mode)
      .onSuccess((stmts) => {
        const write = (): Result<string> => {
          stmts.replace(key, blob);
          return succeed(key);
        };
        // Fenced writes run the identity check and the write in one IMMEDIATE
        // transaction, so another connection cannot start a rebuild or change the
        // stored identity between them — and the write lock is taken up front, so a
        // busy file waits on `busy_timeout` instead of failing a read-to-write
        // lock upgrade at once.
        return captureResult(() =>
          mode === 'rebuild'
            ? write()
            : this._db.transaction(() => this._identity.fence().onSuccess(write)).immediate()
        ).onSuccess((written) => written);
      })
      .withErrorFormat((e) => `vector index: cannot add '${key}': ${e}`);
  }

  /**
   * Make sure the `vec0` table exists and the statements are prepared, creating
   * the table at `dimension` if this handle has not seen it yet.
   *
   * @remarks
   * A fenced first write creates the table and stores the handle's identity in one
   * transaction, so they commit or roll back together — but only when the status
   * read inside that transaction is `'fresh'`. If another connection created the
   * table first, its row is left alone and the fence decides. A rebuild's own first
   * write creates the table only if it is still absent and the row is still this
   * rebuild's marker; anything else moved underneath the rebuild and fails it. The
   * statements are prepared and kept only after that transaction commits, so a
   * rolled-back creation leaves this handle exactly as it was.
   */
  private _establish(dimension: number, mode: WriteMode): Result<ISqliteVecStatements> {
    if (this._stmts !== undefined) {
      return succeed(this._stmts);
    }
    return captureResult(() =>
      this._db
        .transaction((): Result<true> => {
          if (mode === 'rebuild') {
            // The rebuild already marked the row; creating the table must not commit it.
            return this._identity.checkRebuildTargetInTransaction().onSuccess(() => {
              this._createTable(dimension);
              return succeed<true>(true);
            });
          }
          return this._identity.fence().onSuccess((report) => {
            this._createTable(dimension);
            if (report.status === 'fresh') {
              this._identity.commitFirstWriteInTransaction();
            }
            return succeed<true>(true);
          });
        })
        .immediate()
    )
      .onSuccess((established) => established)
      .onSuccess(() =>
        captureResult(() => {
          const stmts: ISqliteVecStatements = this._prepare();
          this._dimension = dimension;
          this._stmts = stmts;
          return stmts;
        })
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
   *
   * **A partial table is detectable.** The clear and a `'rebuilding'` marker in the
   * identity row commit in one transaction; only a final transaction at the end
   * replaces the marker with the handle's identity. Until then
   * {@link SqliteVecVectorIndex.identity} reports `'incomplete'` and `add` and
   * `query` are fenced — after a crash, after a `'fail'` rollback, and after a
   * final commit that could not be written (for example `SQLITE_BUSY` from another
   * connection on the same file). The marker is a crash marker, not a lock: two
   * rebuilds of one table on two connections at once are not coordinated.
   *
   * A rebuild cannot change the dimension. A vector whose width differs from the
   * table's is **not** a per-record error: the rebuild fails in every mode,
   * including `'skip'`, and leaves the index `'incomplete'`. A swap to a model of a
   * different width needs the table dropped (or a fresh `tableName`) and
   * re-indexed. A `release()` while the rebuild runs also fails it before the final
   * commit, leaving `'incomplete'`.
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
      // Also nothing established: the clear and its marker are one transaction,
      // so the table still holds whatever it held.
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
      // An empty vector is malformed rather than another width, and stays a
      // per-record rejection by `_add`.
      if (
        this._dimension !== undefined &&
        embedded.value.length !== 0 &&
        embedded.value.length !== this._dimension
      ) {
        // Not a per-record error, so not skippable: every later record would fail
        // the same way, and the table can never hold this model's vectors.
        const error: string =
          `vector index rebuild: '${edgeTargetKey(scoped.target)}' has dimension ${embedded.value.length} ` +
          `but the table is fixed at ${this._dimension}; a rebuild cannot change the dimension — drop ` +
          `the table (or use a fresh tableName) and re-index`;
        return failWithDetail(withRollbackNote(error, this._clear()), report());
      }
      const added: Result<string> = this._add(scoped.target, embedded.value, 'rebuild');
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
    if (this._released) {
      // Every write after the release was refused (and, in 'skip' mode, skipped),
      // so the table is partial. Leave the marker: the index stays 'incomplete'.
      return failWithDetail(
        'vector index rebuild: the index was released while the rebuild ran; it stays incomplete',
        report()
      );
    }
    const committed: Result<true> = this._identity.commitRebuild();
    if (committed.isFailure()) {
      // Every vector is written, but nothing says so: the marker stays, the index
      // reports `'incomplete'`, and a caller is told rather than handed a success.
      return failWithDetail(
        `vector index rebuild: failed to commit the index identity: ${committed.message}`,
        report()
      );
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
   *
   * Marks the identity row `'rebuilding'` in the same transaction, so a clear is
   * never committed without the marker that makes the partial table detectable.
   * The rollback after a `'fail'` abort calls this again, which leaves the marker
   * in place. On an index that has no table yet only the marker is written. A row
   * this version cannot read (another `meta_version`) is refused, not overwritten.
   *
   * Whether to delete is decided from the file, not from this handle: a table
   * another connection created after this handle opened is emptied too, and this
   * handle then adopts it (dimension and statements), so the rebuild never
   * certifies vectors it did not write.
   */
  private _clear(): Result<true> {
    if (this._released) {
      return fail('vector index: cannot clear: the index has been released');
    }
    // `exec`, not `prepare(...).run()`, and the reason is lifetime rather than
    // style. A prepared statement here would be referenced by nothing the moment
    // it returned, so `release()` could not drop it — it is not in `_stmts` —
    // and its native destructor would run whenever GC reached it, possibly
    // during environment teardown, which is the frame the reported
    // `Statement::~Statement()` abort fires in. `exec` creates no `Statement` at
    // all, so there is no destructor and no cleanup hook to outlive anything.
    // Capture-wrapped like `add` / `remove` / `query`: a closed connection or an
    // I/O error here is a `Failure`, not an exception thrown out of a method
    // whose signature promises a `Result`; a throw inside the transaction rolls
    // the delete and the marker back together.
    return captureResult(() =>
      this._db
        .transaction((): Result<boolean> => {
          const tableExists: boolean = this._identity.tableExists();
          return this._identity.markRebuildingInTransaction().onSuccess(() => {
            if (tableExists) {
              this._db.exec(`DELETE FROM "${this._table}"`);
            }
            return succeed(tableExists);
          });
        })
        .immediate()
    )
      .onSuccess((cleared) => cleared)
      .onSuccess((tableExists) =>
        tableExists && this._stmts === undefined
          ? captureResult(() => {
              const stmts: ISqliteVecStatements = this._prepare();
              this._dimension = SqliteVecVectorIndex._readExistingDimension(this._db, this._table);
              this._stmts = stmts;
              return true as const;
            })
          : succeed<true>(true)
      );
  }

  /** {@inheritDoc IVectorIndex.query} */
  public query(vector: Float32Array, topK: number): Promise<Result<ReadonlyArray<IVectorQueryHit>>> {
    if (this._released) {
      return Promise.resolve(fail('vector index: cannot query: the index has been released'));
    }
    if (topK <= 0 || this._stmts === undefined) {
      // Nothing to read, but the status still decides: a mismatched or incomplete
      // index fails rather than answering an empty list.
      return Promise.resolve(
        this._identity
          .fence()
          .onSuccess(() => succeed<ReadonlyArray<IVectorQueryHit>>([]))
          .withErrorFormat((e) => `vector index: query failed: ${e}`)
      );
    }
    if (vector.length !== this._dimension) {
      return Promise.resolve(
        fail(
          `vector index: query dimension ${vector.length} does not match index dimension ${this._dimension}`
        )
      );
    }
    const stmts: ISqliteVecStatements = this._stmts;
    return Promise.resolve(
      captureResult(() =>
        this._db.transaction(() =>
          this._identity.fence().onSuccess(() => {
            const rows: ReadonlyArray<IKnnRow> = stmts.query.all(
              SqliteVecVectorIndex._toBlob(vector),
              topK
            ) as ReadonlyArray<IKnnRow>;
            // sqlite-vec returns rows in ascending distance (nearest first); score is
            // `1 - cosineDistance` = cosine similarity, so descending score is preserved.
            return succeed<ReadonlyArray<IVectorQueryHit>>(
              rows.map((row) => ({
                target: SqliteVecVectorIndex._parseKey(row.target_key),
                score: 1 - row.distance
              }))
            );
          })
        )()
      )
        .onSuccess((hits) => hits)
        .withErrorFormat((e) => `vector index: query failed: ${e}`)
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

/**
 * How a write reaches the table: `'fenced'` for a caller's `add`, `'rebuild'` for
 * `rebuild`'s own writes, which run while the index is deliberately
 * `'incomplete'`.
 */
type WriteMode = 'fenced' | 'rebuild';

/** The prepared statements / helpers the index reuses once its table exists. */
interface ISqliteVecStatements {
  readonly delete: BetterSqlite3.Statement;
  readonly replace: (key: string, blob: Uint8Array) => void;
  readonly query: BetterSqlite3.Statement;
  readonly count: BetterSqlite3.Statement;
  readonly has: BetterSqlite3.Statement;
}
