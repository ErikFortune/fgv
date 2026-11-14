/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import type BetterSqlite3 from 'better-sqlite3';
import { Result, captureAsyncResult, captureResult } from '@fgv/ts-utils';

/**
 * Opens a `better-sqlite3` connection this package owns.
 *
 * @remarks
 * **The value import of `better-sqlite3` lives here, and it is deliberately
 * lazy.** Every other module in this package imports the driver as `import type`
 * only, so merely importing `@fgv/ts-agent-memory-sqlite-vec` has never loaded the
 * native binding — a property the path-based factories must not cost consumers who
 * only ever call `create()`. A static import would move the native load (and its
 * failure mode) to package-load time for everyone. The dynamic `import()` keeps it
 * at the one call that actually needs a connection.
 *
 * Taking this import is the entire point of the path-based factories: it is the
 * only place this wrapper leaked its own dependency into consumer source.
 *
 * @param path - Filesystem path to the database file. `':memory:'` is accepted and
 * yields an owned ephemeral connection.
 * @param label - Package-facing prefix for the failure message.
 * @returns `Success` with a connection this package owns, or `Failure` if the
 * driver could not be loaded or the file could not be opened.
 * @internal
 */
export async function openOwnedConnection(
  path: string,
  label: string
): Promise<Result<BetterSqlite3.Database>> {
  return (await captureAsyncResult(async () => (await import('better-sqlite3')).default))
    .withErrorFormat((m) => `${label}: failed to load the 'better-sqlite3' driver: ${m}`)
    .onSuccess((driver) =>
      captureResult(() => new driver(path)).withErrorFormat((m) => `${label}: failed to open '${path}': ${m}`)
    );
}

/**
 * Closes a connection this package opened.
 *
 * @remarks
 * Only ever called on a connection produced by {@link openOwnedConnection}. A
 * connection supplied through a `create()` param is the consumer's and is never
 * closed here — that asymmetry is the reason `close` travels on the handle
 * returned by `open` rather than sitting on the index class.
 *
 * `better-sqlite3`'s own `close()` is safe to call on an already-closed
 * connection, so a second `close()` on the same handle succeeds rather than
 * failing.
 *
 * @internal
 */
export function closeOwnedConnection(db: BetterSqlite3.Database, label: string): Result<true> {
  return captureResult<true>(() => {
    db.close();
    return true;
  }).withErrorFormat((m) => `${label}: failed to close the connection: ${m}`);
}
