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
 * Applies defaultStorageTargets settings to sub-libraries, routing new collection
 * creation to the correct storage root.
 * @packageDocumentation
 */

import { type FileTree } from '@fgv/ts-json-base';
import { LibraryData, type LibraryRuntime, type Settings, type UserEntities } from '@fgv/ts-chocolate';

import type { IPersistentTreeEntry } from './reactiveWorkspace';

// ============================================================================
// Types
// ============================================================================

/**
 * A map from storage root ID to the root directory item for that root.
 * Used to resolve which directory a sub-library should write to.
 * @public
 */
export type StorageRootTreeMap = ReadonlyMap<string, FileTree.IFileTreeDirectoryItem>;

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Maps a SubLibraryId to the corresponding sub-library instance.
 * @internal
 */
function getSubLibrary(
  entities: LibraryRuntime.ChocolateEntityLibrary,
  userEntities: UserEntities.IUserEntityLibrary | undefined,
  subLibId: LibraryData.SubLibraryId
): LibraryData.SubLibraryBase<string, string, unknown> | undefined {
  switch (subLibId) {
    case 'ingredients':
      return entities.ingredients;
    case 'fillings':
      return entities.fillings;
    case 'confections':
      return entities.confections;
    case 'decorations':
      return entities.decorations;
    case 'molds':
      return entities.molds;
    case 'procedures':
      return entities.procedures;
    case 'tasks':
      return entities.tasks;
    case 'sessions':
      return userEntities?.sessions;
    case 'journals':
      return userEntities?.journals;
    case 'moldInventory':
      return userEntities?.moldInventory;
    case 'ingredientInventory':
      return userEntities?.ingredientInventory;
    case 'locations':
      return userEntities?.locations;
    default:
      return undefined;
  }
}

/**
 * Resolves the data directory for a sub-library within a given root directory.
 * @internal
 */
function resolveSubLibraryDataDir(
  rootDir: FileTree.IFileTreeDirectoryItem,
  subLibId: LibraryData.SubLibraryId
): FileTree.IFileTreeDirectoryItem | undefined {
  const result = LibraryData.navigateToDirectory(rootDir, LibraryData.getSubLibraryPath(subLibId));
  return result.isSuccess() ? result.value : undefined;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Applies `defaultStorageTargets` to each entity sub-library, setting the active
 * mutable source so that new collections are created in the correct storage root.
 *
 * Call this:
 * - After workspace initialization (once all trees are loaded)
 * - After saving settings that include `defaultStorageTargets` changes
 *
 * @param targets - The resolved default storage targets from settings
 * @param entities - The entity library whose sub-libraries will be updated
 * @param localStorageRootDir - The localStorage root directory item (source name: 'localStorage')
 * @param persistentTrees - Map of persistent tree ID → root directory item (local directories)
 * @param logger - Optional logger for diagnostics
 * @public
 */
export function applyStorageTargets(
  targets: Settings.IDefaultStorageTargets | undefined,
  entities: LibraryRuntime.ChocolateEntityLibrary,
  localStorageRootDir: FileTree.IFileTreeDirectoryItem | undefined,
  persistentTrees: StorageRootTreeMap,
  additionalRootDirs: StorageRootTreeMap,
  logger?: { detail(msg: string): void; info(msg: string): void; warn(msg: string): void },
  userEntities?: UserEntities.IUserEntityLibrary
): void {
  const subLibIds: ReadonlyArray<LibraryData.SubLibraryId> = [
    'ingredients',
    'fillings',
    'confections',
    'decorations',
    'molds',
    'procedures',
    'tasks',
    'sessions',
    'journals',
    'moldInventory',
    'ingredientInventory',
    'locations'
  ];

  for (const subLibId of subLibIds) {
    const subLib = getSubLibrary(entities, userEntities, subLibId);
    if (!subLib) {
      continue;
    }

    const rootId = targets?.sublibraryOverrides?.[subLibId] ?? targets?.libraryDefault ?? 'localStorage';

    let rootDir: FileTree.IFileTreeDirectoryItem | undefined;
    let sourceName: string;

    if (rootId === 'localStorage') {
      rootDir = localStorageRootDir;
      sourceName = 'localStorage';
    } else {
      rootDir = persistentTrees.get(rootId) ?? additionalRootDirs.get(rootId);
      sourceName = rootId;
    }

    if (!rootDir) {
      if (localStorageRootDir) {
        logger?.warn(
          `applyStorageTargets: root '${rootId}' not found for '${subLibId}', falling back to localStorage`
        );
        rootDir = localStorageRootDir;
        sourceName = 'localStorage';
      } else {
        logger?.warn(
          `applyStorageTargets: root '${rootId}' not found for '${subLibId}' and no fallback root`
        );
      }
    }

    if (!rootDir) {
      continue;
    }

    const dataDir = resolveSubLibraryDataDir(rootDir, subLibId);
    if (!dataDir) {
      subLib.setActiveMutableSource(sourceName, undefined, rootDir);
      logger?.detail(`applyStorageTargets: '${subLibId}' → '${sourceName}' (data dir pending creation)`);
      continue;
    }

    subLib.setActiveMutableSource(sourceName, dataDir);
    logger?.detail(`applyStorageTargets: '${subLibId}' → '${sourceName}'`);
  }
}

/**
 * Convenience wrapper that builds a persistent tree root-directory map and applies
 * storage targets to all entity sub-libraries.
 *
 * @param params - Parameters for the operation
 * @public
 */
export function applyStorageTargetsFromWorkspace(params: {
  readonly localStorageRootDir: FileTree.IFileTreeDirectoryItem | undefined;
  readonly persistentTrees: ReadonlyMap<string, IPersistentTreeEntry>;
  readonly additionalRootDirs?: ReadonlyMap<string, FileTree.IFileTreeDirectoryItem>;
  readonly targets: Settings.IDefaultStorageTargets | undefined;
  readonly entities: LibraryRuntime.ChocolateEntityLibrary;
  readonly userEntities?: UserEntities.IUserEntityLibrary;
  readonly logger?: { detail(msg: string): void; info(msg: string): void; warn(msg: string): void };
}): void {
  const {
    localStorageRootDir,
    persistentTrees,
    additionalRootDirs,
    targets,
    entities,
    userEntities,
    logger
  } = params;

  const persistentTreeMap = new Map(
    Array.from(persistentTrees.entries()).flatMap(([id, entry]) => {
      const rootResult = entry.tree.getDirectory('/');
      return rootResult.isSuccess() ? [[id, rootResult.value] as const] : [];
    })
  );
  applyStorageTargets(
    targets,
    entities,
    localStorageRootDir,
    persistentTreeMap,
    additionalRootDirs ?? new Map(),
    logger,
    userEntities
  );
}
