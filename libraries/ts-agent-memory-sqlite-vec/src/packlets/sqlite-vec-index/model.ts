/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import type BetterSqlite3 from 'better-sqlite3';

/**
 * Parameters for {@link SqliteVecVectorIndex.create}.
 * @public
 */
export interface ISqliteVecVectorIndexCreateParams {
  /**
   * A `better-sqlite3` `Database` the consumer owns (bring-your-own, mirroring
   * the boundary-package convention). The consumer opens it (`new Database(path)`
   * for a persistent file, or `new Database(':memory:')` for an ephemeral index)
   * and owns its lifecycle — this index never closes it. `create` loads the
   * `sqlite-vec` extension onto the connection and, if the vector table already
   * exists (a reopened persistent file), recovers its established dimension so no
   * re-embedding is required on open.
   */
  readonly database: BetterSqlite3.Database;

  /**
   * Name of the `vec0` virtual table that holds the embeddings. Must be a simple
   * SQL identifier (`[A-Za-z_][A-Za-z0-9_]*`). Defaults to `'memory_vectors'`.
   * Supply a distinct name to hold more than one independent index in a single
   * database file.
   */
  readonly tableName?: string;
}

/**
 * Parameters for {@link SqliteVecFragmentIndex.create}.
 * @public
 */
export interface ISqliteVecFragmentIndexCreateParams {
  /**
   * A `better-sqlite3` `Database` the consumer owns (bring-your-own, mirroring
   * {@link ISqliteVecVectorIndexCreateParams.database}). The consumer opens it and
   * owns its lifecycle — this index never closes it. `create` loads the
   * `sqlite-vec` extension onto the connection and, if the fragment table already
   * exists (a reopened persistent file), recovers its established dimension so no
   * re-embedding is required on open.
   */
  readonly database: BetterSqlite3.Database;

  /**
   * Name of the `vec0` virtual table that holds the fragment embeddings. Must be a
   * simple SQL identifier (`[A-Za-z_][A-Za-z0-9_]*`). Defaults to
   * `'memory_fragments'`. Supply a distinct name (distinct from any record-level
   * {@link SqliteVecVectorIndex} table) to hold more than one independent index in
   * a single database file.
   */
  readonly tableName?: string;
}
