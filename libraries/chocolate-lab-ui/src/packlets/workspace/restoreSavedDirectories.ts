/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Startup restoration of saved local directories from IndexedDB.
 * @packageDocumentation
 */

import { type FileTree } from '@fgv/ts-json-base';
import { LibraryData, type LibraryRuntime, type UserEntities } from '@fgv/ts-chocolate';
import { FileApiTreeAccessors, supportsFileSystemAccess } from '@fgv/ts-web-extras';

import { createDirectoryStore } from './directoryStoreFactory';

import { type ReactiveWorkspace } from './reactiveWorkspace';

// ============================================================================
// Sub-library loading helpers
// ============================================================================

/**
 * Loads all entity sub-libraries from a given tree root directory.
 * Tries each sub-library path in turn; skips silently if a path doesn't exist.
 * @returns Total number of collections loaded across all sub-libraries.
 * @internal
 */
function loadAllSubLibrariesFromTree(
  tree: FileTree.FileTree,
  entities: LibraryRuntime.ChocolateEntityLibrary,
  userEntities: UserEntities.IUserEntityLibrary | undefined,
  sourceName: string,
  logger?: { detail(msg: string): void; warn(msg: string): void; info(msg: string): void }
): number {
  // Get the tree root — loadFromFileTreeSource expects the root directory,
  // not the data subdirectory (the navigator handles the path).
  const rootResult = tree.getDirectory('/');
  if (rootResult.isFailure()) {
    logger?.warn(`loadAllSubLibrariesFromTree: failed to get tree root: ${rootResult.message}`);
    return 0;
  }

  const subLibraries: ReadonlyArray<{ lib: LibraryData.SubLibraryBase<string, string, unknown> }> = [
    // Shared library sub-libraries
    { lib: entities.ingredients },
    { lib: entities.fillings },
    { lib: entities.confections },
    { lib: entities.decorations },
    { lib: entities.molds },
    { lib: entities.procedures },
    { lib: entities.tasks },
    // User entity sub-libraries
    ...(userEntities
      ? [
          { lib: userEntities.sessions },
          { lib: userEntities.journals },
          { lib: userEntities.moldInventory },
          { lib: userEntities.ingredientInventory }
        ]
      : [])
  ];

  let totalLoaded = 0;
  for (const { lib } of subLibraries) {
    const loadResult = lib.loadFromFileTreeSource({
      sourceName,
      directory: rootResult.value,
      load: true,
      mutable: true,
      skipMissingDirectories: true
    });
    if (loadResult.isSuccess()) {
      totalLoaded += loadResult.value;
    } else {
      logger?.warn(`loadAllSubLibrariesFromTree: failed to load from "${sourceName}": ${loadResult.message}`);
    }
  }
  return totalLoaded;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Parameters for restoreSavedDirectories.
 * @public
 */
export interface IRestoreSavedDirectoriesParams {
  /** The reactive workspace to register restored trees into */
  readonly reactiveWorkspace: ReactiveWorkspace;
  /** The entity library to load collections into */
  readonly entities: LibraryRuntime.ChocolateEntityLibrary;
  /** The user entity library to load user collections into (sessions, journals, inventory) */
  readonly userEntities?: UserEntities.IUserEntityLibrary;
  /** Optional config name for per-config IndexedDB isolation */
  readonly configName?: string;
  /** Optional logger for diagnostics */
  readonly logger?: { detail(msg: string): void; warn(msg: string): void; info(msg: string): void };
}

/**
 * Restores all previously saved local directory handles from IndexedDB.
 * For each handle with an already-granted permission, opens the directory
 * as a persistent FileTree, loads all entity sub-libraries, and registers
 * the tree in the ReactiveWorkspace.
 *
 * Handles that no longer have permission are silently skipped — the user
 * will need to re-add them manually.
 *
 * @returns Number of directories successfully restored.
 * @public
 */
export async function restoreSavedDirectories(params: IRestoreSavedDirectoriesParams): Promise<number> {
  const { reactiveWorkspace, entities, userEntities, logger } = params;

  if (typeof window === 'undefined' || !supportsFileSystemAccess(window)) {
    return 0;
  }

  const store = createDirectoryStore(params.configName);
  const allResult = await store.getAll();
  if (allResult.isFailure()) {
    logger?.warn(`restoreSavedDirectories: failed to load handles: ${allResult.message}`);
    return 0;
  }

  let restoredCount = 0;

  for (const { label, handle } of allResult.value) {
    const permission = await handle.queryPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      continue;
    }

    const treeResult = await FileApiTreeAccessors.createPersistent(handle, { autoSync: true });
    if (treeResult.isFailure()) {
      logger?.warn(`restoreSavedDirectories: failed to open "${label}": ${treeResult.message}`);
      continue;
    }

    const tree = treeResult.value;
    const loaded = loadAllSubLibrariesFromTree(tree, entities, userEntities, label, logger);

    const accessors = tree.hal;
    if ('syncToDisk' in accessors && 'isDirty' in accessors) {
      reactiveWorkspace.registerPersistentTree(label, {
        tree,
        accessors: accessors as FileTree.IPersistentFileTreeAccessors,
        label
      });
    }

    logger?.detail(`restoreSavedDirectories: restored "${label}" (${loaded} collection(s))`);
    restoredCount++;
  }

  return restoredCount;
}
