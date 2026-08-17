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
  FragmentEmbedder,
  IEdgeTarget,
  IEmbeddedFragment,
  IFragmentLocator,
  IFragmentVectorIndex,
  IFragmentVectorRebuildReport,
  IMemoryRecordListing,
  IMemoryRecordSource,
  ISkippedVectorRecord,
  IVectorQueryHit,
  IVectorRebuildOptions,
  Kind,
  MemoryId,
  MemoryScopeKey,
  edgeTargetKey
} from '@fgv/ts-agent-memory';
import { invokeHook, tally, withRollbackNote } from './rebuildHelpers';
import { closeOwnedConnection, openOwnedConnection } from './connection';
import {
  ISqliteVecFragmentIndexCreateParams,
  ISqliteVecFragmentIndexHandle,
  ISqliteVecFragmentIndexOpenParams
} from './model';

/** Default name for the fragment `vec0` virtual table. */
const DEFAULT_TABLE_NAME: string = 'memory_fragments';

/** Package-facing prefix for this class's failure messages. */
const LABEL: string = 'sqlite-vec fragment index';

/** A simple SQL identifier — the only shape allowed for the table name (it is interpolated into DDL). */
const IDENTIFIER_RE: RegExp = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * The auxiliary (`+`-prefixed) columns this version of the index writes. A table
 * created by an earlier version carries a different set; see
 * {@link SqliteVecFragmentIndex._readExistingDimension} for why that has to be
 * detected explicitly rather than migrated.
 */
const AUXILIARY_COLUMNS: ReadonlyArray<string> = ['start_off', 'end_off', 'fragment_id'];

/**
 * Matches one `+name` auxiliary-column declaration in a `vec0` `CREATE VIRTUAL TABLE`
 * statement. Only ever consumed via `String.matchAll`, which iterates a clone rather
 * than advancing this instance's `lastIndex`, so the shared `/g` regex is reusable.
 */
const AUXILIARY_COLUMN_RE: RegExp = /\+\s*([A-Za-z_][A-Za-z0-9_]*)/g;

/**
 * One KNN row as returned by the fragment `vec0` MATCH query. The offset columns are
 * typed `number | bigint` because `better-sqlite3` returns integer columns as
 * `bigint` when a consumer enables its safe-integer mode (`defaultSafeIntegers`);
 * {@link SqliteVecFragmentIndex._toOffset} coerces them to a plain `number` (and
 * fails loudly on an out-of-safe-range value) before they reach the public locator.
 * All three identity columns are nullable: a fragment stored without a locator has
 * `NULL` offsets, and one stored without a `fragmentId` has a `NULL` `fragment_id`.
 */
interface IKnnRow {
  readonly target_key: string;
  // eslint-disable-next-line @rushstack/no-new-null -- SQLite returns NULL (not undefined) for an absent locator offset
  readonly start_off: number | bigint | null;
  // eslint-disable-next-line @rushstack/no-new-null -- SQLite returns NULL (not undefined) for an absent locator offset
  readonly end_off: number | bigint | null;
  // eslint-disable-next-line @rushstack/no-new-null -- SQLite returns NULL (not undefined) for an absent fragment id
  readonly fragment_id: string | null;
  readonly distance: number;
}

/**
 * The identity fields of a fragment hit, in `IVectorQueryHit` shape: a field the
 * stored fragment did not carry is *absent*, never present-but-`undefined`, so a hit
 * for a fragment stored without a `fragmentId` is structurally identical to one this
 * index produced before `fragment_id` existed.
 */
type FragmentIdentity = Pick<IVectorQueryHit, 'locator' | 'fragmentId'>;

/**
 * A persistent, `sqlite-vec`-backed `IFragmentVectorIndex` (from
 * `@fgv/ts-agent-memory`) — the fragment-granular sibling of
 * {@link SqliteVecVectorIndex}, and the **durable** counterpart to the in-memory
 * `InMemoryFragmentCosineIndex`.
 *
 * @remarks
 * Where {@link SqliteVecVectorIndex} keys one vector per record on a
 * `target_key` primary key, this index holds **many** vectors per record — one per
 * fragment — so it keys the `vec0` table on `target_key` as a **`PARTITION KEY`**
 * (many rows may share it) and stores each fragment's identity in three auxiliary
 * columns (`+start_off`, `+end_off`, `+fragment_id`) that ride alongside the vector
 * and are returned on query but never filtered — in particular `fragment_id` is
 * stored and returned verbatim, never parsed and never part of the query path. A
 * query is a brute-force `vec0` KNN scan across all partitions returning per-fragment
 * hits, each carrying its record `target` plus whichever identity fields the stored
 * fragment was added with (a fragment must carry at least one).
 *
 * **`vec0` schema changes require a drop-and-re-index.** A
 * `CREATE VIRTUAL TABLE IF NOT EXISTS` is a no-op against an existing table (SQLite
 * does not compare schemas) and `vec0` has no `ALTER TABLE ADD COLUMN`, so a database written by an
 * earlier version of this package keeps its old auxiliary columns. `create` detects
 * that by parsing the stored `CREATE VIRTUAL TABLE` SQL and fails with an actionable
 * message naming the expected and found columns, rather than letting a widened
 * `INSERT` surface an opaque `no such column` at statement-prepare time. There are no
 * in-place migrations: drop the table (or use a fresh `tableName`) and re-index.
 * Fragment vectors are re-derivable from the records, so this costs embedding time,
 * never data.
 *
 * Semantics match `InMemoryFragmentCosineIndex` exactly: `addFragments` is
 * whole-record-replace (a single transaction deletes every prior fragment of the
 * target, then inserts the new set), `remove` drops every fragment of a target,
 * and `query` applies the optional `maxPerRecord` cap **during selection, before
 * the topK cut** — so one long document cannot crowd others out. The dimension is
 * established by the first `addFragments` (the `vec0` column is fixed-width) and
 * recovered from the table schema when a persistent file is reopened; similarity is
 * cosine (`score = 1 - cosineDistance`), byte-identical to the in-memory index.
 * Large-N ANN indexing is explicitly out of scope, same regime as the record index.
 *
 * **Connection ownership depends on which factory you use.** With
 * {@link SqliteVecFragmentIndex.create} the `Database` is consumer-owned
 * (bring-your-own): this index loads the `sqlite-vec` extension onto it and
 * reads/writes the table, but never opens or closes the connection — and that is
 * the seam for backing this index and a record index with one connection. With
 * {@link SqliteVecFragmentIndex.open} this package opens the file itself and hands
 * back a handle carrying the disposer for the connection it created.
 * @public
 */
export class SqliteVecFragmentIndex implements IFragmentVectorIndex {
  private readonly _db: BetterSqlite3.Database;
  private readonly _table: string;
  /** The dimension of every stored fragment vector; `undefined` until the table exists. */
  private _dimension: number | undefined;
  /** Prepared statements; created once the table exists (established or recovered). */
  private _stmts: IFragmentStatements | undefined;

  private constructor(db: BetterSqlite3.Database, table: string, dimension: number | undefined) {
    this._db = db;
    this._table = table;
    this._dimension = dimension;
    this._stmts = dimension === undefined ? undefined : this._prepare();
  }

  /** The number of records that currently have at least one stored fragment. Zero before the first add. */
  public get recordCount(): number {
    if (this._stmts === undefined) {
      return 0;
    }
    // `Number(...)` narrows the count in case the consumer enabled better-sqlite3
    // safe-integer mode (which returns `count(*)` as a `bigint`).
    return Number((this._stmts.recordCount.get() as { c: number | bigint }).c);
  }

  /** The total number of fragments currently held across all records. Zero before the first add. */
  public get fragmentCount(): number {
    if (this._stmts === undefined) {
      return 0;
    }
    return Number((this._stmts.fragmentCount.get() as { c: number | bigint }).c);
  }

  /**
   * Family-convention factory. Loads the `sqlite-vec` extension onto the supplied
   * `better-sqlite3` connection and, if the fragment table already exists (a
   * reopened persistent file), verifies its auxiliary-column set matches this
   * version's and recovers its established dimension so no re-embedding is needed on
   * open.
   *
   * @param params - See {@link ISqliteVecFragmentIndexCreateParams}.
   * @returns `Success` with the index, or `Failure` if the table name is not a
   * simple identifier, the extension fails to load, or the existing table was
   * written by a version with a different auxiliary-column set (which requires a
   * drop-and-re-index — `vec0` cannot be altered in place).
   */
  public static create(params: ISqliteVecFragmentIndexCreateParams): Promise<Result<SqliteVecFragmentIndex>> {
    const table: string = params.tableName ?? DEFAULT_TABLE_NAME;
    if (!IDENTIFIER_RE.test(table)) {
      return Promise.resolve(
        fail(`sqlite-vec fragment index: table name '${table}' is not a simple SQL identifier`)
      );
    }
    return Promise.resolve(
      captureResult(() => {
        loadSqliteVec(params.database);
        const dimension: number | undefined = SqliteVecFragmentIndex._readExistingDimension(
          params.database,
          table
        );
        return new SqliteVecFragmentIndex(params.database, table, dimension);
      }).withErrorFormat((e) => `sqlite-vec fragment index: failed to initialize: ${e}`)
    );
  }

  /**
   * Path-based factory. Opens the database file itself and returns the index
   * together with a disposer for the connection it created.
   *
   * @remarks
   * The fragment-granular sibling of {@link SqliteVecVectorIndex.open}, and present
   * for the same reason: a consumer doing sub-document retrieval only would
   * otherwise still value-import `better-sqlite3` and hand-roll a `captureResult`
   * around a constructor that throws.
   *
   * **Use `create` instead when one connection must back both a fragment index and
   * a record index** — the intended shared-handle case. Two `open` calls on one path
   * give two independent connections, not a shared one.
   *
   * If initialization fails after the file is opened, the connection is closed
   * before returning — a failed `open` leaks nothing. That includes the
   * auxiliary-column mismatch failure, which is reported by `create` only after the
   * file is open.
   *
   * @param params - See {@link ISqliteVecFragmentIndexOpenParams}.
   * @returns `Success` with a {@link ISqliteVecFragmentIndexHandle}, or `Failure` if
   * the driver could not be loaded, the file could not be opened, the table name is
   * not a simple identifier, the extension fails to load, or the existing table was
   * written by a version with a different auxiliary-column set.
   */
  public static async open(
    params: ISqliteVecFragmentIndexOpenParams
  ): Promise<Result<ISqliteVecFragmentIndexHandle>> {
    return (await openOwnedConnection(params.path, LABEL)).thenOnSuccess(async (database) =>
      (await SqliteVecFragmentIndex.create({ database, tableName: params.tableName }))
        .onFailure((message) => {
          // Best-effort cleanup: this call opened the connection, so a failure to
          // initialize on top of it must not leave the file handle behind. See the
          // sibling in SqliteVecVectorIndex.open for why the close result is not
          // folded into the message.
          closeOwnedConnection(database, LABEL);
          return fail(message);
        })
        .onSuccess((index) =>
          succeed({
            index,
            close: () => closeOwnedConnection(database, LABEL)
          })
        )
    );
  }

  /** {@inheritDoc IFragmentVectorIndex.addFragments} */
  public addFragments(
    target: IEdgeTarget,
    fragments: ReadonlyArray<IEmbeddedFragment>
  ): Promise<Result<number>> {
    const key: string = edgeTargetKey(target);
    // Validate every fragment before touching the database, so a bad fragment never
    // leaves the record half-replaced or the dimension half-established (whole-record
    // replace is all-or-nothing). The effective dimension is the established one, or —
    // on a still-dimensionless index — the first fragment's length; it is committed
    // (via table creation) only once the whole batch validates.
    let dimension: number | undefined = this._dimension;
    for (const fragment of fragments) {
      if (fragment.vector.length === 0) {
        return Promise.resolve(fail(`fragment index: cannot add '${key}': empty fragment vector`));
      }
      // A fragment carrying neither identity cannot be resolved back to anything by a
      // consumer holding the hit — the same invariant `embeddedFragmentConverter`
      // enforces at the untyped boundary, re-checked here at the index seam.
      if (fragment.locator === undefined && fragment.fragmentId === undefined) {
        return Promise.resolve(
          fail(
            `fragment index: cannot add '${key}': fragment requires at least one of 'locator' or 'fragmentId'`
          )
        );
      }
      // Locator offsets are persisted as SQLite integers (bound via BigInt). Reject a
      // non-safe-integer offset up front with a clear message, rather than letting
      // `BigInt(nonInteger)` throw cryptically inside the write transaction OR storing
      // a value the read-side `_toOffset` guard would later reject on every query.
      // An absent locator persists as a NULL offset pair and skips the check.
      if (
        fragment.locator !== undefined &&
        (!Number.isSafeInteger(fragment.locator.start) || !Number.isSafeInteger(fragment.locator.end))
      ) {
        return Promise.resolve(
          fail(
            `fragment index: cannot add '${key}': locator [${fragment.locator.start}, ${fragment.locator.end}) offsets must be safe integers`
          )
        );
      }
      if (dimension === undefined) {
        dimension = fragment.vector.length;
      } else if (fragment.vector.length !== dimension) {
        return Promise.resolve(
          fail(
            `fragment index: cannot add '${key}': fragment dimension ${fragment.vector.length} does not match index dimension ${dimension}`
          )
        );
      }
    }
    return Promise.resolve(
      captureResult(() => {
        // A same-target re-author (or an empty batch) still needs the table to exist
        // to delete prior fragments; create it lazily on the first non-empty add.
        if (this._stmts === undefined) {
          if (fragments.length === 0) {
            // Nothing stored yet and nothing to store: no table, no work.
            return 0;
          }
          // `fragments` is non-empty here (the empty case returned above), so the
          // validation loop proved every fragment shares `fragments[0]`'s length —
          // which IS the dimension to establish. Read it straight from the first
          // fragment: no cast, no invariant-dependent narrowing.
          const established: number = fragments[0].vector.length;
          this._createTable(established);
          this._dimension = established;
          this._stmts = this._prepare();
        }
        this._stmts.replace(key, fragments);
        return fragments.length;
      }).withErrorFormat((e) => `fragment index: cannot add '${key}': ${e}`)
    );
  }

  /** {@inheritDoc IFragmentVectorIndex.remove} */
  public remove(target: IEdgeTarget): Promise<Result<IEdgeTarget>> {
    return Promise.resolve(
      captureResult(() => {
        // Idempotent: removing a target with no fragments (or before any add created
        // the table) still succeeds.
        if (this._stmts !== undefined) {
          this._stmts.deleteByTarget.run(edgeTargetKey(target));
        }
        return target;
      }).withErrorFormat((e) => `fragment index: cannot remove '${edgeTargetKey(target)}': ${e}`)
    );
  }

  /** {@inheritDoc IFragmentVectorIndex.has} */
  public has(target: IEdgeTarget): Promise<Result<boolean>> {
    return Promise.resolve(
      captureResult(() => {
        // Before any add has created the table there is nothing held — a truthful
        // `false`, matching `remove`'s idempotence and the zero counts.
        if (this._stmts === undefined) {
          return false;
        }
        return this._stmts.has.get(edgeTargetKey(target)) !== undefined;
      }).withErrorFormat((e) => `fragment index: cannot check '${edgeTargetKey(target)}': ${e}`)
    );
  }

  /** {@inheritDoc IFragmentVectorIndex.rebuild} */
  public async rebuild(
    source: IMemoryRecordSource,
    embed: FragmentEmbedder,
    options?: IVectorRebuildOptions
  ): Promise<DetailedResult<IFragmentVectorRebuildReport, IFragmentVectorRebuildReport>> {
    const lenient: boolean = (options?.onRecordError ?? 'fail') === 'skip';
    // `source` is consumer-supplied, so a throw or rejection becomes a `Failure`
    // here rather than escaping as an exception.
    const listed: Result<IMemoryRecordListing> = await invokeHook(() => source.list());
    if (listed.isFailure()) {
      // Deliberately BEFORE any clear, matching both siblings: a failed list is no
      // evidence about the fragments already held, and clearing here would destroy
      // a healthy PERSISTED index over a transient read error. No detail — there is
      // nothing this call disturbed to describe.
      return failWithDetail(`fragment index rebuild: failed to list records: ${listed.message}`);
    }
    const cleared: Result<true> = this._clear();
    if (cleared.isFailure()) {
      // Also nothing established: the table still holds whatever it held.
      return failWithDetail(`fragment index rebuild: failed to clear the index: ${cleared.message}`);
    }
    const indexed: Map<Kind, number> = new Map<Kind, number>();
    const fragments: Map<Kind, number> = new Map<Kind, number>();
    const declined: Map<Kind, number> = new Map<Kind, number>();
    const skipped: ISkippedVectorRecord[] = [];
    // Absent stays absent — only the source knows whether it filtered anything.
    const report = (): IFragmentVectorRebuildReport => ({
      indexed,
      fragments,
      declined,
      excluded: listed.value.excluded,
      skipped
    });
    for (const scoped of listed.value.records) {
      const kind: Kind = scoped.record.envelope.kind;
      // Capture-wrapped: an embedder that throws mid-loop would otherwise escape
      // past the `'fail'` rollback below, leaving this DURABLE table holding a
      // partial index that survives the process.
      const embedded: Result<ReadonlyArray<IEmbeddedFragment>> = await invokeHook(() => embed(scoped.record));
      if (embedded.isFailure()) {
        const error: string = `fragment index rebuild: embedding '${edgeTargetKey(scoped.target)}' failed: ${
          embedded.message
        }`;
        if (!lenient) {
          // A rollback that also fails is said out loud: the `'fail'` path
          // promises an empty index, and on a DURABLE table a botched rollback
          // survives the process.
          return failWithDetail(withRollbackNote(error, this._clear()), report());
        }
        skipped.push({ target: scoped.target, error });
        continue;
      }
      // An empty array is this lane's decline, and it is still WRITTEN — the
      // whole-record-replace is what clears any stale fragments.
      const added: Result<number> = await this.addFragments(scoped.target, embedded.value);
      if (added.isFailure()) {
        const error: string = `fragment index rebuild: ${added.message}`;
        if (!lenient) {
          return failWithDetail(withRollbackNote(error, this._clear()), report());
        }
        skipped.push({ target: scoped.target, error });
        continue;
      }
      if (added.value === 0) {
        tally(declined, kind);
        continue;
      }
      tally(indexed, kind);
      tally(fragments, kind, added.value);
    }
    return succeedWithDetail(report());
  }

  /**
   * **Empties the rows; does NOT release the table's declared dimension.** That
   * is a `vec0` constraint rather than a choice — the dimension is schema, and
   * there is no `ALTER TABLE` for it — so a rebuild at a new dimension fails
   * here where it would succeed on the in-memory sibling, which forgets its
   * dimension on reset. Changing dimension needs a drop-and-re-index; see the
   * note on `IVectorIndex.rebuild`. Tolerates a table that does not exist yet.
   */
  private _clear(): Result<true> {
    if (this._stmts === undefined) {
      return succeed(true);
    }
    // Capture-wrapped like every other statement path: a closed connection or an
    // I/O error is a `Failure`, not an exception out of a `Result`-returning method.
    return captureResult(() => this._db.prepare(`DELETE FROM "${this._table}"`).run()).onSuccess(() =>
      succeed(true)
    );
  }

  /** {@inheritDoc IFragmentVectorIndex.query} */
  public query(
    vector: Float32Array,
    topK: number,
    maxPerRecord?: number
  ): Promise<Result<ReadonlyArray<IVectorQueryHit>>> {
    if (topK <= 0 || this._stmts === undefined) {
      return Promise.resolve(succeed([]));
    }
    if (vector.length !== this._dimension) {
      return Promise.resolve(
        fail(
          `fragment index: query dimension ${vector.length} does not match index dimension ${this._dimension}`
        )
      );
    }
    const stmts: IFragmentStatements = this._stmts;
    return Promise.resolve(
      captureResult<ReadonlyArray<IVectorQueryHit>>(() => {
        // With a per-record cap the topK winners may lie past the first topK rows (a
        // capped record's later fragments are skipped), so fetch the full ranked set
        // and apply the cap + topK cut here — exactly as the in-memory index does.
        // Uncapped, KNN's own `k = topK` is already the answer.
        const fetchK: number =
          maxPerRecord === undefined ? topK : Number((stmts.fragmentCount.get() as { c: number | bigint }).c);
        if (fetchK <= 0) {
          return [];
        }
        const rows: ReadonlyArray<IKnnRow> = stmts.query.all(
          SqliteVecFragmentIndex._toBlob(vector),
          fetchK
        ) as ReadonlyArray<IKnnRow>;
        // sqlite-vec returns rows ascending by distance (nearest first); score is
        // `1 - cosineDistance`, so this order is already descending score.
        const hits: IVectorQueryHit[] = [];
        const perRecord: Map<string, number> = new Map<string, number>();
        for (const row of rows) {
          if (hits.length >= topK) {
            break;
          }
          if (maxPerRecord !== undefined) {
            const used: number = perRecord.get(row.target_key) ?? 0;
            if (used >= maxPerRecord) {
              continue;
            }
            perRecord.set(row.target_key, used + 1);
          }
          const key: string = row.target_key;
          hits.push({
            target: SqliteVecFragmentIndex._parseKey(key),
            score: 1 - row.distance,
            ...SqliteVecFragmentIndex._toIdentity(row, key)
          });
        }
        return hits;
      }).withErrorFormat((e) => `fragment index: query failed: ${e}`)
    );
  }

  /**
   * Create the fragment `vec0` virtual table with the established dimension. The
   * auxiliary columns must stay in sync with `AUXILIARY_COLUMNS`, which
   * `create` compares against an existing table's stored DDL.
   */
  private _createTable(dimension: number): void {
    this._db.exec(
      `CREATE VIRTUAL TABLE IF NOT EXISTS "${this._table}" USING vec0(` +
        `target_key TEXT PARTITION KEY, embedding float[${dimension}] distance_metric=cosine, ` +
        `+start_off integer, +end_off integer, +fragment_id text)`
    );
  }

  /** Prepare the statements the index reuses. Requires the table to exist. */
  private _prepare(): IFragmentStatements {
    const del: BetterSqlite3.Statement = this._db.prepare(
      `DELETE FROM "${this._table}" WHERE target_key = ?`
    );
    const ins: BetterSqlite3.Statement = this._db.prepare(
      `INSERT INTO "${this._table}"(target_key, embedding, start_off, end_off, fragment_id) ` +
        `VALUES (?, ?, ?, ?, ?)`
    );
    // Whole-record replace: drop every prior fragment of the target, then insert the
    // new set, atomically. An empty set collapses to a pure delete.
    const replaceTxn: BetterSqlite3.Transaction<
      (key: string, fragments: ReadonlyArray<IEmbeddedFragment>) => void
    > = this._db.transaction((key: string, fragments: ReadonlyArray<IEmbeddedFragment>) => {
      del.run(key);
      for (const fragment of fragments) {
        ins.run(
          key,
          SqliteVecFragmentIndex._toBlob(fragment.vector),
          // vec0 typed columns reject a JS float; bind the offsets as integers. An
          // absent locator binds the pair as NULL — never a partial pair, so the read
          // side can treat a half-NULL pair as corruption rather than a legal shape.
          fragment.locator === undefined ? null : BigInt(fragment.locator.start),
          fragment.locator === undefined ? null : BigInt(fragment.locator.end),
          // Stored verbatim and never parsed; absent binds as NULL.
          fragment.fragmentId ?? null
        );
      }
    });
    return {
      deleteByTarget: del,
      replace: (key: string, fragments: ReadonlyArray<IEmbeddedFragment>): void => {
        replaceTxn(key, fragments);
      },
      query: this._db.prepare(
        `SELECT target_key, start_off, end_off, fragment_id, distance FROM "${this._table}" ` +
          `WHERE embedding MATCH ? AND k = ?`
      ),
      fragmentCount: this._db.prepare(`SELECT count(*) AS c FROM "${this._table}"`),
      recordCount: this._db.prepare(`SELECT count(DISTINCT target_key) AS c FROM "${this._table}"`),
      // `LIMIT 1`: membership needs existence, not cardinality.
      has: this._db.prepare(`SELECT 1 FROM "${this._table}" WHERE target_key = ? LIMIT 1`)
    };
  }

  /**
   * Recover the established dimension of an existing fragment `vec0` table from its
   * stored `CREATE VIRTUAL TABLE` SQL (`float[<n>]`), after checking that the table's
   * auxiliary columns match `AUXILIARY_COLUMNS`. Returns `undefined` when the
   * table does not exist yet (a fresh database — dimension is set by the first add).
   *
   * Throws when a table of that name exists but is not a usable fragment index (a
   * mismatched auxiliary-column set, or no `vec0` embedding column); the caller runs
   * this inside `captureResult`, so it surfaces as a loud `Failure` from `create`.
   * The same stored DDL answers every one of those questions, so the checks cost
   * nothing extra.
   */
  private static _readExistingDimension(db: BetterSqlite3.Database, table: string): number | undefined {
    const row: { sql: string } | undefined = db
      .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(table) as { sql: string } | undefined;
    if (row === undefined) {
      return undefined;
    }
    SqliteVecFragmentIndex._verifyAuxiliaryColumns(row.sql, table);
    const match: RegExpMatchArray | null = row.sql.match(/float\[(\d+)\]/);
    if (match === null) {
      // The auxiliary columns matched but there is no `float[<n>]` embedding column,
      // so this is not a usable fragment index table. Same remedy as a column
      // mismatch — and failing here beats handing back a dimensionless index whose
      // first add would `CREATE VIRTUAL TABLE IF NOT EXISTS` into a no-op.
      throw new Error(
        `existing table '${table}' has no vec0 embedding column, so it is not a usable fragment ` +
          `index table. Drop it (or pass a fresh tableName) and re-add every fragment.`
      );
    }
    return Number(match[1]);
  }

  /**
   * Compare an existing table's auxiliary columns against `AUXILIARY_COLUMNS`.
   *
   * `CREATE VIRTUAL TABLE IF NOT EXISTS` is a no-op against an existing table (SQLite
   * never compares schemas) and `vec0` has no `ALTER TABLE ADD COLUMN`, so a table
   * written by an earlier version of this package silently keeps its old columns and
   * only fails later — as an opaque `no such column` when the widened `INSERT` is
   * prepared. Detect it here instead and say what to do about it. Order is not
   * compared: every statement names its columns explicitly, so only the set matters.
   */
  private static _verifyAuxiliaryColumns(sql: string, table: string): void {
    const found: string[] = Array.from(sql.matchAll(AUXILIARY_COLUMN_RE), (m) => m[1]);
    const expected: ReadonlyArray<string> = AUXILIARY_COLUMNS;
    const matches: boolean =
      found.length === expected.length && expected.every((column) => found.includes(column));
    if (!matches) {
      throw new Error(
        `existing table '${table}' has auxiliary columns [${found.join(', ')}] but this index ` +
          `requires [${expected.join(', ')}] — it was written by a different version of ` +
          `@fgv/ts-agent-memory-sqlite-vec, or it is not a fragment index table at all. vec0 virtual ` +
          `tables cannot be altered in place, so this requires a drop-and-re-index: DROP TABLE ` +
          `"${table}" (or pass a fresh tableName) and re-add every fragment. Fragment vectors are ` +
          `re-derivable from the records, so this costs embedding time, never data.`
      );
    }
  }

  /**
   * Rebuild the identity fields of a hit from a persisted row, omitting each field
   * the stored fragment did not carry (so a hit is structurally identical to one this
   * index produced before `fragment_id` existed).
   *
   * A row carrying neither identity violates the write-side invariant and could not
   * be resolved by the caller, so it fails loudly instead of yielding an anonymous
   * hit.
   */
  private static _toIdentity(row: IKnnRow, key: string): FragmentIdentity {
    const locator: IFragmentLocator | undefined = SqliteVecFragmentIndex._toLocator(row, key);
    if (locator === undefined && row.fragment_id === null) {
      throw new Error(
        `fragment '${key}': row carries neither a locator nor a fragment id (corrupt persisted data)`
      );
    }
    return {
      ...(locator !== undefined ? { locator } : {}),
      ...(row.fragment_id !== null ? { fragmentId: row.fragment_id } : {})
    };
  }

  /**
   * Rebuild a fragment's locator from its persisted offsets, or `undefined` when the
   * fragment was stored without one (both offsets `NULL`).
   *
   * The pair is written all-or-nothing, so a half-`NULL` pair can only come from
   * corrupt / externally-edited data. Throw rather than coerce — `Number(null)` is
   * `0`, which would silently fabricate a span starting at the top of the body.
   */
  private static _toLocator(row: IKnnRow, key: string): IFragmentLocator | undefined {
    const start: number | bigint | null = row.start_off;
    const end: number | bigint | null = row.end_off;
    if (start === null && end === null) {
      return undefined;
    }
    if (start === null || end === null) {
      throw new Error(
        `fragment '${key}': locator has only one of its start/end offsets (corrupt persisted data)`
      );
    }
    return {
      start: SqliteVecFragmentIndex._toOffset(start, key),
      end: SqliteVecFragmentIndex._toOffset(end, key)
    };
  }

  /** Pack a `Float32Array` as the little-endian byte blob `vec0` stores. Copies, so the caller may reuse its buffer. */
  private static _toBlob(vector: Float32Array): Uint8Array {
    return new Uint8Array(Float32Array.from(vector).buffer);
  }

  /**
   * Reverse `edgeTargetKey` — the canonical key is `scope\0id` with NUL excluded
   * from both components, so the first NUL splits it unambiguously. A key with no
   * NUL cannot have been written by `edgeTargetKey`; rather than fabricate a wrong
   * `(scope, id)` from corrupt / externally-edited table data, throw so the query
   * surfaces it as a loud `Failure`.
   */
  private static _parseKey(key: string): IEdgeTarget {
    const nul: number = key.indexOf('\0');
    if (nul < 0) {
      throw new Error(`malformed target key '${key}': missing scope/id separator (corrupt persisted data)`);
    }
    return {
      scope: key.slice(0, nul) as unknown as MemoryScopeKey,
      id: key.slice(nul + 1) as unknown as MemoryId
    };
  }

  /**
   * Coerce a persisted locator offset to a plain `number`. `better-sqlite3` returns
   * integer columns as `bigint` under safe-integer mode, so an offset can arrive as
   * either; both narrow to `number` here. A value outside the safe-integer range
   * (only reachable via corrupt / externally-edited data — the index only ever
   * writes in-document offsets) throws rather than silently losing precision, so the
   * query surfaces it as a loud `Failure`.
   */
  private static _toOffset(value: number | bigint, key: string): number {
    const n: number = Number(value);
    if (!Number.isSafeInteger(n)) {
      throw new Error(
        `fragment '${key}': locator offset ${String(value)} is not a safe integer (corrupt persisted data)`
      );
    }
    return n;
  }
}

/** The prepared statements / helpers the fragment index reuses once its table exists. */
interface IFragmentStatements {
  readonly deleteByTarget: BetterSqlite3.Statement;
  readonly replace: (key: string, fragments: ReadonlyArray<IEmbeddedFragment>) => void;
  readonly query: BetterSqlite3.Statement;
  readonly fragmentCount: BetterSqlite3.Statement;
  readonly recordCount: BetterSqlite3.Statement;
  readonly has: BetterSqlite3.Statement;
}
