/**
 * Factory for creating per-config DirectoryHandleStore instances.
 * Maps a workspace configName to an isolated IndexedDB database name,
 * preventing cross-config leakage of saved directory handles.
 * @packageDocumentation
 */

import { DEFAULT_DIRECTORY_HANDLE_DB, DirectoryHandleStore } from '@fgv/ts-web-extras';

/**
 * Creates a {@link DirectoryHandleStore} scoped to the given config name.
 * - Default config (undefined): uses the standard `'chocolate-lab-storage'` DB
 * - Named config (e.g. 'debug'): uses `'chocolate-lab-storage:debug'`
 *
 * @param configName - Optional configuration name from the workspace
 * @returns A DirectoryHandleStore backed by a config-specific IndexedDB
 * @public
 */
export function createDirectoryStore(configName: string | undefined): DirectoryHandleStore {
  const dbName = configName ? `${DEFAULT_DIRECTORY_HANDLE_DB}:${configName}` : DEFAULT_DIRECTORY_HANDLE_DB;
  return new DirectoryHandleStore(dbName);
}
