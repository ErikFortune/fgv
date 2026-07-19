/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import type BetterSqlite3 from 'better-sqlite3';
import { load as loadSqliteVec } from 'sqlite-vec';
import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import {
  IEdgeTarget,
  IVectorIndex,
  IVectorQueryHit,
  MemoryId,
  MemoryScopeKey,
  edgeTargetKey
} from '@fgv/ts-agent-memory';
import { ISqliteVecVectorIndexCreateParams } from './model';

/** Default name for the `vec0` virtual table. */
const DEFAULT_TABLE_NAME: string = 'memory_vectors';

/** A simple SQL identifier — the only shape allowed for the table name (it is interpolated into DDL). */
const IDENTIFIER_RE: RegExp = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** One KNN row as returned by the `vec0` MATCH query. */
interface IKnnRow {
  readonly target_key: string;
  readonly distance: number;
}

/**
 * A persistent, `sqlite-vec`-backed {@link IVectorIndex} for `@fgv/ts-agent-memory`.
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
 * The index is keyed by the canonical {@link edgeTargetKey} of each record's
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
 * The `better-sqlite3` `Database` is consumer-owned (bring-your-own): this index
 * loads the `sqlite-vec` extension onto it and reads/writes the table, but never
 * opens or closes the connection.
 * @public
 */
export class SqliteVecVectorIndex implements IVectorIndex {
  private readonly _db: BetterSqlite3.Database;
  private readonly _table: string;
  /** The dimension of every stored vector; `undefined` until the table exists (first `add` or a reopened non-empty file). */
  private _dimension: number | undefined;
  /** Prepared statements; created once the table exists (established or recovered). */
  private _stmts: ISqliteVecStatements | undefined;

  private constructor(db: BetterSqlite3.Database, table: string, dimension: number | undefined) {
    this._db = db;
    this._table = table;
    this._dimension = dimension;
    this._stmts = dimension === undefined ? undefined : this._prepare();
  }

  /** The number of vectors currently held. Zero before the first `add`. */
  public get size(): number {
    if (this._stmts === undefined) {
      return 0;
    }
    return (this._stmts.count.get() as { c: number }).c;
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

  /** {@inheritDoc IVectorIndex.add} */
  public add(target: IEdgeTarget, vector: Float32Array): Promise<Result<string>> {
    const key: string = edgeTargetKey(target);
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

  /** {@inheritDoc IVectorIndex.remove} */
  public remove(target: IEdgeTarget): Promise<Result<IEdgeTarget>> {
    return Promise.resolve(
      captureResult(() => {
        // Idempotent: removing a target with no embedding (or before any `add`
        // created the table) still succeeds.
        if (this._stmts !== undefined) {
          this._stmts.delete.run(edgeTargetKey(target));
        }
        return target;
      }).withErrorFormat((e) => `vector index: cannot remove '${edgeTargetKey(target)}': ${e}`)
    );
  }

  /** {@inheritDoc IVectorIndex.query} */
  public query(vector: Float32Array, topK: number): Promise<Result<ReadonlyArray<IVectorQueryHit>>> {
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
      count: this._db.prepare(`SELECT count(*) AS c FROM "${this._table}"`)
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
   * Reverse {@link edgeTargetKey} — the canonical key is `scope\0id` with NUL
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
}
