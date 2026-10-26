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
  // eslint-disable-next-line @rushstack/no-new-null -- SQLite returns NULL for an identity that was never committed
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
 * The methods named `...InTransaction` **throw** on a database error, and must only
 * be called inside a `better-sqlite3` `transaction()`: a throw is what makes that
 * transaction roll back. Their callers wrap the transaction in `captureResult`.
 *
 * Every statement this class prepares is held in a field and dropped by
 * {@link IndexIdentity.release}, so none outlives the index that made it.
 * @internal
 */
export class IndexIdentity {
  /** The identity the handle was opened with, or `undefined` when none was supplied. */
  public readonly expected: string | undefined;

  private readonly _db: BetterSqlite3.Database;
  private readonly _table: string;
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

  /** Drops every statement this instance prepared. Idempotent. */
  public release(): void {
    this._tableExists = undefined;
    this._prepared.clear();
  }

  /**
   * Read the stored identity and classify it against {@link IndexIdentity.expected}.
   * Never writes.
   *
   * @remarks
   * The two reads — whether the `vec0` table exists, then the meta row — run in one
   * (deferred, read-only) transaction, so the report describes a single snapshot
   * of the file even when another connection is writing it. Called inside an
   * enclosing transaction, this becomes a savepoint of it.
   */
  public report(): Result<IIndexIdentityReport> {
    return captureResult(() =>
      this._db.transaction(
        (): Result<IIndexIdentityReport> =>
          // The vec0 table decides first: a row whose table was dropped describes
          // vectors that no longer exist, and must never read as a match for new ones.
          this._exists(this._table)
            ? this._readMetaRow().onSuccess((row) => succeed(this._classify(row)))
            : succeed<IIndexIdentityReport>({ status: 'fresh' })
      )()
    ).onSuccess((report) => report);
  }

  /**
   * {@link IndexIdentity.report}, failing when the status forbids reading or
   * writing vectors: `'mismatch'` (another embedding space) or `'incomplete'`
   * (a partial table). The message names the status and the remedy.
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
          `index identity is 'incomplete': a rebuild cleared the index and never finished, ` +
            `so it may hold any subset of the records; rebuild the index`
        );
      }
      return succeed(report);
    });
  }

  /**
   * Fix the identity at the moment the `vec0` table is created, in the same
   * transaction. With no expected identity, any row left behind by a dropped table
   * of the same name is deleted instead, so it cannot later describe these
   * vectors; and the meta table is not created just to record nothing.
   */
  public commitFirstWriteInTransaction(): void {
    if (this.expected === undefined) {
      if (this._exists(META_TABLE)) {
        this._statement(`DELETE FROM ${META_TABLE} WHERE table_name = ?`).run(this._table);
      }
      return;
    }
    this._write(this.expected, 'complete');
  }

  /** Mark the table as being rebuilt, with no committed identity. */
  public markRebuildingInTransaction(): void {
    this._write(null, 'rebuilding');
  }

  /**
   * Commit the expected identity at the end of a rebuild. Conditional on the row
   * still being marked as rebuilding: a row that changed underneath the rebuild
   * (deleted, or committed by another connection) fails loudly rather than being
   * overwritten.
   */
  public commitRebuild(): Result<true> {
    return captureResult(
      () =>
        this._statement(
          `UPDATE ${META_TABLE} SET identity = ?, state = 'complete' ` +
            `WHERE table_name = ? AND state = 'rebuilding'`
        ).run(this.expected ?? null, this._table).changes
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
   * written. The check and the write share one transaction, so no other
   * connection can change the status between them.
   */
  public adopt(): Result<IIndexIdentityReport> {
    return captureResult(() =>
      this._db.transaction((): Result<IIndexIdentityReport> => {
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
          this._write(expected, 'complete');
          return succeed<IIndexIdentityReport>({ status: 'match' });
        });
      })()
    ).onSuccess((adopted) => adopted);
  }

  private _write(identity: string | null, state: MetaState): void {
    // Lazily, and only here: a read never creates the table, so `open` and
    // `identity()` stay safe on a read-only or consumer-owned connection.
    this._db.exec(
      `CREATE TABLE IF NOT EXISTS ${META_TABLE} (` +
        `table_name TEXT PRIMARY KEY, identity TEXT, ` +
        `state TEXT NOT NULL CHECK (state IN ('complete','rebuilding')), ` +
        `meta_version INTEGER NOT NULL)`
    );
    this._statement(
      `INSERT OR REPLACE INTO ${META_TABLE} (table_name, identity, state, meta_version) VALUES (?, ?, ?, ?)`
    ).run(this._table, identity, state, META_VERSION);
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
   * repeated read or write never prepares a statement nothing retains.
   */
  private _statement(sql: string): BetterSqlite3.Statement {
    let statement: BetterSqlite3.Statement | undefined = this._prepared.get(sql);
    if (statement === undefined) {
      statement = this._db.prepare(sql);
      this._prepared.set(sql, statement);
    }
    return statement;
  }

  private _exists(name: string): boolean {
    if (this._tableExists === undefined) {
      throw new Error('the index has been released');
    }
    return this._tableExists.get(name) !== undefined;
  }
}
