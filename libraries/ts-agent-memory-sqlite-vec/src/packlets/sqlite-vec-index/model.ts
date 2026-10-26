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

  /**
   * The embedding identity this handle expects the stored vectors to have — an
   * opaque string such as a model name and version. Optional.
   *
   * @remarks
   * The identity is stored **inside the database file**, next to the vectors, so a
   * copy, restore or snapshot carries it along. {@link SqliteVecVectorIndex.identity}
   * compares it on every call, and `add` and `query` are fenced: while the stored
   * identity differs from this one (`'mismatch'`), or a rebuild started and never
   * finished (`'incomplete'`), they fail rather than mix vectors from two embedding
   * spaces. `rebuild` is always allowed and commits this identity when it completes.
   *
   * Omit it and the index behaves as it did before identities existed;
   * `identity()` then answers `'unchecked'`. The value is only ever bound as a SQL
   * parameter, never interpolated.
   */
  readonly identity?: string;
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

  /**
   * The embedding identity this handle expects — see
   * {@link ISqliteVecVectorIndexCreateParams.identity}.
   */
  readonly identity?: string;
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

  /**
   * The embedding identity this handle expects — see
   * {@link ISqliteVecFragmentIndexCreateParams.identity}.
   */
  readonly identity?: string;
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

  /**
   * The embedding identity this handle expects the stored fragment vectors to
   * have — an opaque string such as a model name and version. Optional.
   *
   * @remarks
   * Same contract as {@link ISqliteVecVectorIndexCreateParams.identity}:
   * stored in the database file, compared by
   * {@link SqliteVecFragmentIndex.identity}, and fenced on `addFragments` and
   * `query` while the status is `'mismatch'` or `'incomplete'`. Each table carries
   * its own identity, so a record index and a fragment index in one file are
   * checked independently.
   */
  readonly identity?: string;
}

/**
 * What {@link SqliteVecVectorIndex.identity} and
 * {@link SqliteVecFragmentIndex.identity} report about the embedding identity
 * stored in the database file, compared against the one the handle was opened
 * with.
 *
 * @remarks
 * - `'fresh'` — the index's `vec0` table does not exist yet. A row left behind by
 *   a dropped table is ignored, so a dropped-and-recreated index never reports
 *   `'match'` against vectors it did not write.
 * - `'match'` — the stored identity equals the handle's.
 * - `'mismatch'` — the stored identity differs; `stored` names it. Writes and
 *   queries are fenced until a `rebuild` completes.
 * - `'absent'` — vectors exist but no identity was ever stored (a file written
 *   before identities existed, or written by a handle without one). Not fenced;
 *   `adoptIdentity()` records the handle's identity without re-embedding.
 * - `'incomplete'` — a `rebuild` cleared the index and never committed, so the
 *   table may hold any subset of the records. Fenced until a `rebuild` completes,
 *   and reported whether or not the handle has an identity.
 * - `'unchecked'` — the handle was opened without an identity, so there is
 *   nothing to compare; `stored` names the stored one, if any.
 *
 * @public
 */
export type IIndexIdentityReport =
  | { readonly status: 'fresh' }
  | { readonly status: 'match' }
  | { readonly status: 'mismatch'; readonly stored: string }
  | { readonly status: 'absent' }
  | { readonly status: 'incomplete'; readonly stored?: string }
  | { readonly status: 'unchecked'; readonly stored?: string };
