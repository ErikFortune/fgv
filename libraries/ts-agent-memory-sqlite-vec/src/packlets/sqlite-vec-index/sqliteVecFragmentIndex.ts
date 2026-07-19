/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import type BetterSqlite3 from 'better-sqlite3';
import { load as loadSqliteVec } from 'sqlite-vec';
import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import {
  IEdgeTarget,
  IEmbeddedFragment,
  IFragmentVectorIndex,
  IVectorQueryHit,
  MemoryId,
  MemoryScopeKey,
  edgeTargetKey
} from '@fgv/ts-agent-memory';
import { ISqliteVecFragmentIndexCreateParams } from './model';

/** Default name for the fragment `vec0` virtual table. */
const DEFAULT_TABLE_NAME: string = 'memory_fragments';

/** A simple SQL identifier — the only shape allowed for the table name (it is interpolated into DDL). */
const IDENTIFIER_RE: RegExp = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** One KNN row as returned by the fragment `vec0` MATCH query. */
interface IKnnRow {
  readonly target_key: string;
  readonly start_off: number;
  readonly end_off: number;
  readonly distance: number;
}

/**
 * A persistent, `sqlite-vec`-backed {@link IFragmentVectorIndex} for
 * `@fgv/ts-agent-memory` — the fragment-granular sibling of
 * {@link SqliteVecVectorIndex}, and the **durable** counterpart to the in-memory
 * `InMemoryFragmentCosineIndex`.
 *
 * @remarks
 * Where {@link SqliteVecVectorIndex} keys one vector per record on a
 * `target_key` primary key, this index holds **many** vectors per record — one per
 * in-record `[start, end)` span — so it keys the `vec0` table on `target_key` as a
 * **`PARTITION KEY`** (many rows may share it) and stores each fragment's locator
 * offsets in two auxiliary columns (`+start_off`, `+end_off`) that ride alongside
 * the vector and are returned on query but never filtered. A query is a brute-force
 * `vec0` KNN scan across all partitions returning per-fragment hits, each carrying
 * its record `target` and the matched `locator`.
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
 * The `better-sqlite3` `Database` is consumer-owned (bring-your-own): this index
 * loads the `sqlite-vec` extension onto it and reads/writes the table, but never
 * opens or closes the connection.
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
    return (this._stmts.recordCount.get() as { c: number }).c;
  }

  /** The total number of fragments currently held across all records. Zero before the first add. */
  public get fragmentCount(): number {
    if (this._stmts === undefined) {
      return 0;
    }
    return (this._stmts.fragmentCount.get() as { c: number }).c;
  }

  /**
   * Family-convention factory. Loads the `sqlite-vec` extension onto the supplied
   * `better-sqlite3` connection and, if the fragment table already exists (a
   * reopened persistent file), recovers its established dimension so no
   * re-embedding is needed on open.
   *
   * @param params - See {@link ISqliteVecFragmentIndexCreateParams}.
   * @returns `Success` with the index, or `Failure` if the table name is not a
   * simple identifier or the extension fails to load.
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
          this._createTable(dimension as number);
          this._dimension = dimension;
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
          maxPerRecord === undefined ? topK : (stmts.fragmentCount.get() as { c: number }).c;
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
          hits.push({
            target: SqliteVecFragmentIndex._parseKey(row.target_key),
            score: 1 - row.distance,
            locator: { start: row.start_off, end: row.end_off }
          });
        }
        return hits;
      }).withErrorFormat((e) => `fragment index: query failed: ${e}`)
    );
  }

  /** Create the fragment `vec0` virtual table with the established dimension. */
  private _createTable(dimension: number): void {
    this._db.exec(
      `CREATE VIRTUAL TABLE IF NOT EXISTS "${this._table}" USING vec0(` +
        `target_key TEXT PARTITION KEY, embedding float[${dimension}] distance_metric=cosine, ` +
        `+start_off integer, +end_off integer)`
    );
  }

  /** Prepare the statements the index reuses. Requires the table to exist. */
  private _prepare(): IFragmentStatements {
    const del: BetterSqlite3.Statement = this._db.prepare(
      `DELETE FROM "${this._table}" WHERE target_key = ?`
    );
    const ins: BetterSqlite3.Statement = this._db.prepare(
      `INSERT INTO "${this._table}"(target_key, embedding, start_off, end_off) VALUES (?, ?, ?, ?)`
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
          // vec0 typed columns reject a JS float; bind the offsets as integers.
          BigInt(fragment.locator.start),
          BigInt(fragment.locator.end)
        );
      }
    });
    return {
      deleteByTarget: del,
      replace: (key: string, fragments: ReadonlyArray<IEmbeddedFragment>): void => {
        replaceTxn(key, fragments);
      },
      query: this._db.prepare(
        `SELECT target_key, start_off, end_off, distance FROM "${this._table}" WHERE embedding MATCH ? AND k = ?`
      ),
      fragmentCount: this._db.prepare(`SELECT count(*) AS c FROM "${this._table}"`),
      recordCount: this._db.prepare(`SELECT count(DISTINCT target_key) AS c FROM "${this._table}"`)
    };
  }

  /**
   * Recover the established dimension of an existing fragment `vec0` table from its
   * stored `CREATE VIRTUAL TABLE` SQL (`float[<n>]`). Returns `undefined` when the
   * table does not exist yet (a fresh database — dimension is set by the first add).
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
   * Reverse `edgeTargetKey` — the canonical key is `scope\0id` with NUL excluded
   * from both components, so the first NUL splits it unambiguously.
   */
  private static _parseKey(key: string): IEdgeTarget {
    const nul: number = key.indexOf('\0');
    return {
      scope: key.slice(0, nul) as unknown as MemoryScopeKey,
      id: key.slice(nul + 1) as unknown as MemoryId
    };
  }
}

/** The prepared statements / helpers the fragment index reuses once its table exists. */
interface IFragmentStatements {
  readonly deleteByTarget: BetterSqlite3.Statement;
  readonly replace: (key: string, fragments: ReadonlyArray<IEmbeddedFragment>) => void;
  readonly query: BetterSqlite3.Statement;
  readonly fragmentCount: BetterSqlite3.Statement;
  readonly recordCount: BetterSqlite3.Statement;
}
