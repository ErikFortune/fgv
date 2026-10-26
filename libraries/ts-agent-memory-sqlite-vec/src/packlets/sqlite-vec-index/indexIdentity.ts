/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import type BetterSqlite3 from 'better-sqlite3';
import { Converter, Converters, Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { IIndexIdentityReport } from './model';

/**
 * The ordinary table that holds one identity row per index table.
 *
 * @remarks
 * Not `<table>_meta`: `vec0` owns the `<table>_*` namespace for its shadow tables.
 * Not `PRAGMA user_version`: a consumer that brings its own connection may already
 * use it. Keyed by table name because one file may hold several indexes.
 */
const META_TABLE: string = 'fgv_sqlite_vec_meta';

/** The row layout this version writes and the only one it reads. */
const META_VERSION: number = 1;

/** The two values the `state` column's `CHECK` constraint admits. */
type MetaState = 'complete' | 'rebuilding';

/** One row of {@link META_TABLE}, as read back. */
interface IMetaRow {
  // eslint-disable-next-line @rushstack/no-new-null -- SQL NULL boundary: SQLite returns NULL for an identity that was never committed
  readonly identity: string | null;
  readonly state: MetaState;
  readonly meta_version: number;
}

/**
 * Converts a raw row. `meta_version` arrives as a `bigint` when the consumer
 * enabled `better-sqlite3`'s safe-integer mode, so it is narrowed to a `number`
 * the same way the index counts are.
 */
const metaRowConverter: Converter<IMetaRow> = Converters.strictObject<IMetaRow>({
  identity: Converters.oneOf<string | null>([Converters.string, Converters.literal(null)]),
  state: Converters.enumeratedValue<MetaState>(['complete', 'rebuilding']),
  meta_version: Converters.isA(
    'integer',
    (v: unknown): v is number | bigint => typeof v === 'number' || typeof v === 'bigint'
  ).map((v) => succeed(Number(v)))
});

/**
 * The embedding identity of one `sqlite-vec` index table, stored in the same
 * database file as its vectors.
 *
 * @remarks
 * Package-internal; both index classes hold one. Every read goes to the database —
 * nothing is cached at open — because another connection, or a copy of the file,
 * can change the answer between two calls.
 *
 * The methods named `...InTransaction` must only be called inside a
 * `better-sqlite3` `transaction()`. Those returning `void` **throw** on a database
 * error, because a throw is what makes that transaction roll back; their callers
 * wrap the transaction in `captureResult`.
 *
 * Every statement this class prepares is held in a field and dropped by
 * {@link IndexIdentity.release}; after it, nothing is prepared or run.
 * @internal
 */
export class IndexIdentity {
  /** The identity the handle was opened with, or `undefined` when none was supplied. */
  public readonly expected: string | undefined;

  private readonly _db: BetterSqlite3.Database;
  private readonly _table: string;
  /** The `sqlite_master` lookup; `undefined` once released, which is what marks this instance released. */
  private _tableExists: BetterSqlite3.Statement | undefined;
  /** The meta table's statements, keyed by their SQL, prepared on first use and kept. */
  private readonly _prepared: Map<string, BetterSqlite3.Statement>;

  /**
   * Prepares only a `sqlite_master` lookup, which works on any connection —
   * including a read-only one — and writes nothing. The meta table's own
   * statements are prepared on first use, because they cannot be prepared before
   * that table exists, and it is created only by a write.
   */
  public constructor(db: BetterSqlite3.Database, table: string, expected: string | undefined) {
    this._db = db;
    this._table = table;
    this.expected = expected;
    this._prepared = new Map<string, BetterSqlite3.Statement>();
    this._tableExists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?");
  }

  /** Drops every statement this instance prepared and refuses all further work. Idempotent. */
  public release(): void {
    this._tableExists = undefined;
    this._prepared.clear();
  }

  /**
   * Read the stored identity and classify it against {@link IndexIdentity.expected}.
   * Never writes.
   *
   * @remarks
   * Whether the `vec0` table exists decides first, because a row whose table was
   * dropped describes vectors that no longer exist and must never read as a match
   * for new ones — **except a `rebuilding` row**, which reads as `'incomplete'`
   * even while the table does not exist yet. A rebuild of a fresh index is in
   * flight; reporting `'fresh'` would let another writer create the table and
   * certify its own identity over the rebuild's vectors.
   *
   * The reads run in one (deferred, read-only) transaction, so the report describes
   * a single snapshot of the file even when another connection is writing it.
   * Called inside an enclosing transaction, this becomes a savepoint of it.
   */
  public report(): Result<IIndexIdentityReport> {
    return captureResult(() =>
      this._db.transaction((): Result<IIndexIdentityReport> => {
        const indexExists: boolean = this.tableExists();
        return this._readMetaRow().onSuccess((row) =>
          succeed(
            indexExists || row?.state === 'rebuilding' ? this._classify(row) : { status: 'fresh' as const }
          )
        );
      })()
    ).onSuccess((report) => report);
  }

  /**
   * {@link IndexIdentity.report}, failing when the status forbids reading or
   * writing vectors: `'mismatch'` (another embedding space) or `'incomplete'`
   * (a partial table, or a rebuild in flight). The message names the status and
   * the remedy.
   */
  public fence(): Result<IIndexIdentityReport> {
    return this.report().onSuccess((report) => {
      if (report.status === 'mismatch') {
        return fail(
          `index identity is 'mismatch': the stored vectors were embedded as '${report.stored}' ` +
            `but this handle expects '${this.expected}'; rebuild the index`
        );
      }
      if (report.status === 'incomplete') {
        return fail(
          `index identity is 'incomplete': a rebuild cleared the index and has not finished, ` +
            `so it may hold any subset of the records; rebuild the index`
        );
      }
      return succeed(report);
    });
  }

  /** Whether the index's own `vec0` table exists in the file right now. Throws once released. */
  public tableExists(): boolean {
    return this._exists(this._table);
  }

  /**
   * Fix the identity at the moment the `vec0` table is created, in the same
   * transaction. With no expected identity, any row left behind by a dropped table
   * of the same name is deleted instead, so it cannot later describe these
   * vectors; and the meta table is not created just to record nothing.
   *
   * @remarks
   * Never touches a `rebuilding` row. The fence that runs first in the same
   * transaction already refuses one; the SQL is conditioned on `state = 'complete'`
   * as well, so a marker cannot be erased or overwritten through this path even if
   * that ordering changes.
   */
  public commitFirstWriteInTransaction(): void {
    if (this.expected === undefined) {
      if (this._exists(META_TABLE)) {
        this._statement(`DELETE FROM ${META_TABLE} WHERE table_name = ? AND state = 'complete'`).run(
          this._table
        );
      }
      return;
    }
    this._ensureMetaTable();
    this._statement(
      `INSERT INTO ${META_TABLE} (table_name, identity, state, meta_version) VALUES (?, ?, 'complete', ?) ` +
        `ON CONFLICT(table_name) DO UPDATE SET identity = excluded.identity, ` +
        `meta_version = excluded.meta_version WHERE state = 'complete'`
    ).run(this._table, this.expected, META_VERSION);
  }

  /**
   * Mark the table as being rebuilt, with no committed identity. Refuses — before
   * writing anything — a row this version cannot read (another `meta_version`, or
   * malformed), so a rebuild never overwrites what it would refuse to interpret.
   */
  public markRebuildingInTransaction(): Result<true> {
    return this.report().onSuccess(() => {
      this._ensureMetaTable();
      this._statement(
        `INSERT OR REPLACE INTO ${META_TABLE} (table_name, identity, state, meta_version) VALUES (?, NULL, 'rebuilding', ?)`
      ).run(this._table, META_VERSION);
      return succeed<true>(true);
    });
  }

  /**
   * Check, inside the transaction that would create the table during a rebuild,
   * that nothing moved underneath the rebuild: the table must still be absent, and
   * the row must still be this rebuild's uncommitted marker.
   */
  public checkRebuildTargetInTransaction(): Result<true> {
    if (this.tableExists()) {
      return fail(`table '${this._table}' appeared while the rebuild ran`);
    }
    return this._readMetaRow().onSuccess((row) =>
      row?.state === 'rebuilding' && row.identity === null
        ? succeed<true>(true)
        : fail(`the rebuild marker for '${this._table}' changed while the rebuild ran`)
    );
  }

  /**
   * Commit the expected identity at the end of a rebuild. Conditional on the row
   * still being marked as rebuilding: a row that changed underneath the rebuild
   * (deleted, or committed by another connection) fails loudly rather than being
   * overwritten. An immediate transaction, so it waits on `busy_timeout` rather than
   * failing a lock upgrade.
   */
  public commitRebuild(): Result<true> {
    return captureResult(() =>
      this._db
        .transaction(
          (): number =>
            this._statement(
              `UPDATE ${META_TABLE} SET identity = ?, state = 'complete' ` +
                `WHERE table_name = ? AND state = 'rebuilding'`
            ).run(this.expected ?? null, this._table).changes
        )
        .immediate()
    ).onSuccess((changes) =>
      changes === 1
        ? succeed<true>(true)
        : fail(`the rebuild marker for '${this._table}' changed while the rebuild ran`)
    );
  }

  /**
   * Record the expected identity over vectors that have none, without
   * re-embedding. Legal while the status is `'absent'`; idempotent on `'match'`,
   * where the stored identity already equals the expected one and nothing is
   * written. The check and the write share one immediate transaction, so no other
   * connection can change the status between them.
   */
  public adopt(): Result<IIndexIdentityReport> {
    return captureResult(() =>
      this._db
        .transaction((): Result<IIndexIdentityReport> => {
          const expected: string | undefined = this.expected;
          return this.report().onSuccess((report) => {
            if (report.status === 'match') {
              return succeed(report);
            }
            if (report.status !== 'absent' || expected === undefined) {
              return fail(
                `cannot adopt an identity while the status is '${report.status}'; adoption is only ` +
                  `for vectors with no stored identity` +
                  (report.status === 'mismatch' || report.status === 'incomplete'
                    ? ', so rebuild the index'
                    : '')
              );
            }
            this._ensureMetaTable();
            this._statement(
              `INSERT OR REPLACE INTO ${META_TABLE} (table_name, identity, state, meta_version) VALUES (?, ?, 'complete', ?)`
            ).run(this._table, expected, META_VERSION);
            return succeed<IIndexIdentityReport>({ status: 'match' });
          });
        })
        .immediate()
    ).onSuccess((adopted) => adopted);
  }

  /**
   * Lazily, and only from a write: a read never creates the table, so `open` and
   * `identity()` stay safe on a read-only or consumer-owned connection.
   */
  private _ensureMetaTable(): void {
    this._db.exec(
      `CREATE TABLE IF NOT EXISTS ${META_TABLE} (` +
        `table_name TEXT PRIMARY KEY, identity TEXT, ` +
        `state TEXT NOT NULL CHECK (state IN ('complete','rebuilding')), ` +
        `meta_version INTEGER NOT NULL)`
    );
  }

  private _readMetaRow(): Result<IMetaRow | undefined> {
    return captureResult((): unknown => {
      if (!this._exists(META_TABLE)) {
        return undefined;
      }
      return this._statement(
        `SELECT identity, state, meta_version FROM ${META_TABLE} WHERE table_name = ?`
      ).get(this._table);
    }).onSuccess((raw) =>
      raw === undefined
        ? succeed(undefined)
        : metaRowConverter
            .convert(raw)
            .withErrorFormat((e) => `malformed identity row for '${this._table}': ${e}`)
            .onSuccess((row) =>
              row.meta_version === META_VERSION
                ? succeed(row)
                : fail(
                    `identity row for '${this._table}' has meta_version ${row.meta_version}, but this ` +
                      `version of @fgv/ts-agent-memory-sqlite-vec reads only ${META_VERSION}`
                  )
            )
    );
  }

  private _classify(row: IMetaRow | undefined): IIndexIdentityReport {
    const stored: string | undefined = row?.identity ?? undefined;
    const storedField: { readonly stored?: string } = stored === undefined ? {} : { stored };
    // Checked before the caller's identity: a partial table is partial whatever
    // the handle expects, so an unchecked handle is fenced from it too.
    if (row?.state === 'rebuilding') {
      return { status: 'incomplete', ...storedField };
    }
    if (this.expected === undefined) {
      return { status: 'unchecked', ...storedField };
    }
    if (stored === undefined) {
      return { status: 'absent' };
    }
    return stored === this.expected ? { status: 'match' } : { status: 'mismatch', stored };
  }

  /**
   * The meta-table statement for `sql`, prepared on first use and kept, so a
   * repeated read or write never prepares a statement nothing retains. Refuses
   * once released, so nothing is prepared that `release()` could no longer drop.
   */
  private _statement(sql: string): BetterSqlite3.Statement {
    this._assertUsable();
    let statement: BetterSqlite3.Statement | undefined = this._prepared.get(sql);
    if (statement === undefined) {
      statement = this._db.prepare(sql);
      this._prepared.set(sql, statement);
    }
    return statement;
  }

  private _exists(name: string): boolean {
    return this._assertUsable().get(name) !== undefined;
  }

  /** The `sqlite_master` lookup, or a throw once this instance has been released. */
  private _assertUsable(): BetterSqlite3.Statement {
    if (this._tableExists === undefined) {
      throw new Error('the index has been released');
    }
    return this._tableExists;
  }
}
