/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import type BetterSqlite3 from 'better-sqlite3';
import type { Result } from '@fgv/ts-utils';
import type { SqliteVecFragmentIndex } from './sqliteVecFragmentIndex';
import type { SqliteVecVectorIndex } from './sqliteVecVectorIndex';

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
 * Parameters for {@link SqliteVecVectorIndex.open}.
 * @public
 */
export interface ISqliteVecVectorIndexOpenParams {
  /**
   * Filesystem path to the database file, opened by this package rather than by
   * the consumer. Created if it does not exist, exactly as `better-sqlite3` would.
   * `':memory:'` is accepted and yields an owned ephemeral connection.
   *
   * **Two `open` calls on one path produce two independent connections, not a
   * shared one.** That is legal in SQLite and has a different locking story than
   * the single-connection case — writes contend, and a reader can see a
   * `SQLITE_BUSY`. To put a record index and a fragment index on one connection
   * (the intended shared-handle case), open the connection yourself and pass it to
   * both `create` methods.
   */
  readonly path: string;

  /**
   * Name of the `vec0` virtual table that holds the embeddings. Must be a simple
   * SQL identifier (`[A-Za-z_][A-Za-z0-9_]*`). Defaults to `'memory_vectors'`.
   * Supply a distinct name to hold more than one independent index in a single
   * database file.
   */
  readonly tableName?: string;
}

/**
 * An index plus the connection {@link SqliteVecVectorIndex.open} opened for it.
 *
 * @public
 */
export interface ISqliteVecVectorIndexHandle {
  /** The index, ready to use. */
  readonly index: SqliteVecVectorIndex;

  /**
   * Closes the connection **this `open` call created**. Idempotent — a second
   * `close` succeeds rather than failing.
   *
   * @remarks
   * The disposer travels on this handle rather than on the index class because an
   * index built by `create` holds a connection the **consumer** owns, and must stay
   * incapable of closing it. A `close()` method meaningful on some instances and
   * forbidden on others would be a lie in the type; here, only the caller that
   * caused the connection to exist is handed the means to end it.
   *
   * The index is unusable afterwards — every operation on it will fail against a
   * closed connection.
   */
  close(): Result<true>;
}

/**
 * Parameters for {@link SqliteVecFragmentIndex.open}.
 * @public
 */
export interface ISqliteVecFragmentIndexOpenParams {
  /**
   * Filesystem path to the database file, opened by this package rather than by
   * the consumer. Created if it does not exist, exactly as `better-sqlite3` would.
   * `':memory:'` is accepted and yields an owned ephemeral connection.
   *
   * **Two `open` calls on one path produce two independent connections, not a
   * shared one** — see {@link ISqliteVecVectorIndexOpenParams.path}. To put a
   * fragment index and a record index on one connection, open it yourself and pass
   * it to both `create` methods.
   */
  readonly path: string;

  /**
   * Name of the `vec0` virtual table that holds the fragment embeddings. Must be a
   * simple SQL identifier (`[A-Za-z_][A-Za-z0-9_]*`). Defaults to
   * `'memory_fragments'`.
   */
  readonly tableName?: string;
}

/**
 * An index plus the connection {@link SqliteVecFragmentIndex.open} opened for it.
 *
 * @public
 */
export interface ISqliteVecFragmentIndexHandle {
  /** The index, ready to use. */
  readonly index: SqliteVecFragmentIndex;

  /**
   * Closes the connection **this `open` call created**. Idempotent — a second
   * `close` succeeds rather than failing. See
   * {@link ISqliteVecVectorIndexHandle.close} for why the disposer lives here
   * rather than on the index class.
   */
  close(): Result<true>;
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
