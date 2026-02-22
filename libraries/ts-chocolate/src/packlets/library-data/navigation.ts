// Copyright (c) 2024 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import * as fs from 'fs';
import * as path from 'path';

import { captureResult, fail, Failure, Result, Success } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

/**
 * Canonical paths within a chocolate library tree.
 * @public
 */
export const LibraryPaths = {
  /**
   * Path to the ingredients data directory.
   */
  ingredients: 'data/ingredients',
  /**
   * Path to the fillings data directory.
   */
  fillings: 'data/fillings',
  /**
   * Path to the journals data directory.
   */
  journals: 'data/journals',
  /**
   * Path to the molds data directory.
   */
  molds: 'data/molds',
  /**
   * Path to the procedures data directory.
   */
  procedures: 'data/procedures',
  /**
   * Path to the tasks data directory.
   */
  tasks: 'data/tasks',
  /**
   * Path to the confections data directory.
   */
  confections: 'data/confections',
  /**
   * Path to the decorations data directory.
   */
  decorations: 'data/decorations',
  /**
   * Path to the sessions data directory (user library).
   */
  sessions: 'data/sessions',
  /**
   * Path to the mold inventory data directory (user library).
   */
  moldInventory: 'data/mold-inventory',
  /**
   * Path to the ingredient inventory data directory (user library).
   */
  ingredientInventory: 'data/ingredient-inventory',
  /**
   * Path to the settings directory.
   */
  settings: 'data/settings',
  /**
   * Filename for bootstrap settings (within settings directory).
   */
  settingsBootstrap: 'bootstrap.json',
  /**
   * Filename for preferences settings (within settings directory).
   */
  settingsPreferences: 'preferences.json',
  /**
   * Filename for common settings (within settings directory).
   * @deprecated Use settingsBootstrap and settingsPreferences.
   */
  settingsCommon: 'common.json',
  /**
   * Filename prefix for device-specific settings (within settings directory).
   * Full filename is `device-{deviceId}.json`.
   * @deprecated Device settings are vestigial.
   */
  settingsDevicePrefix: 'device-',
  /**
   * Default filename for key store (within user library root).
   */
  keyStore: 'keystore.json'
} as const;

/**
 * Navigates to a subdirectory within a FileTree by path.
 * @param tree - The root FileTree item to navigate from.
 * @param path - The path to navigate to (e.g., 'data/ingredients').
 * @returns `Success` with the directory item or `Failure` if not found or not a directory.
 * @public
 */
export function navigateToDirectory(
  tree: FileTree.FileTreeItem,
  path: string
): Result<FileTree.IFileTreeDirectoryItem> {
  if (tree.type !== 'directory') {
    return Failure.with(`${tree.name}: Not a directory.`);
  }

  const parts = path.split('/').filter((p) => p.length > 0);
  if (parts.length === 0) {
    return Success.with(tree);
  }

  let current: FileTree.IFileTreeDirectoryItem = tree;

  for (const part of parts) {
    const childrenResult = current.getChildren();
    /* c8 ignore next 3 - defensive: would only fail if FileTree implementation is broken */
    if (childrenResult.isFailure()) {
      return Failure.with(`${path}: Failed to get children at '${current.name}': ${childrenResult.message}`);
    }

    const child = childrenResult.value.find((c) => c.name === part);
    if (child === undefined) {
      return Failure.with(`${path}: Directory not found at '${part}'.`);
    }

    if (child.type !== 'directory') {
      return Failure.with(`${path}: '${part}' is not a directory.`);
    }

    current = child;
  }

  return Success.with(current);
}

/**
 * Gets the ingredients directory from a library tree.
 * @param tree - The root library FileTree item.
 * @returns `Success` with the ingredients directory or `Failure` if not found.
 * @public
 */
export function getIngredientsDirectory(
  tree: FileTree.FileTreeItem
): Result<FileTree.IFileTreeDirectoryItem> {
  return navigateToDirectory(tree, LibraryPaths.ingredients);
}

/**
 * Gets the fillings directory from a library tree.
 * @param tree - The root library FileTree item.
 * @returns `Success` with the fillings directory or `Failure` if not found.
 * @public
 */
export function getFillingsDirectory(tree: FileTree.FileTreeItem): Result<FileTree.IFileTreeDirectoryItem> {
  return navigateToDirectory(tree, LibraryPaths.fillings);
}

/**
 * Gets the journals directory from a library tree.
 * @param tree - The root library FileTree item.
 * @returns `Success` with the journals directory or `Failure` if not found.
 * @public
 */
export function getJournalsDirectory(tree: FileTree.FileTreeItem): Result<FileTree.IFileTreeDirectoryItem> {
  return navigateToDirectory(tree, LibraryPaths.journals);
}

/**
 * Gets the molds directory from a library tree.
 * @param tree - The root library FileTree item.
 * @returns `Success` with the molds directory or `Failure` if not found.
 * @public
 */
export function getMoldsDirectory(tree: FileTree.FileTreeItem): Result<FileTree.IFileTreeDirectoryItem> {
  return navigateToDirectory(tree, LibraryPaths.molds);
}

/**
 * Gets the procedures directory from a library tree.
 * @param tree - The root library FileTree item.
 * @returns `Success` with the procedures directory or `Failure` if not found.
 * @public
 */
export function getProceduresDirectory(tree: FileTree.FileTreeItem): Result<FileTree.IFileTreeDirectoryItem> {
  return navigateToDirectory(tree, LibraryPaths.procedures);
}

/**
 * Gets the tasks directory from a library tree.
 * @param tree - The root library FileTree item.
 * @returns `Success` with the tasks directory or `Failure` if not found.
 * @public
 */
export function getTasksDirectory(tree: FileTree.FileTreeItem): Result<FileTree.IFileTreeDirectoryItem> {
  return navigateToDirectory(tree, LibraryPaths.tasks);
}

/**
 * Gets the confections directory from a library tree.
 * @param tree - The root library FileTree item.
 * @returns `Success` with the confections directory or `Failure` if not found.
 * @public
 */
export function getConfectionsDirectory(
  tree: FileTree.FileTreeItem
): Result<FileTree.IFileTreeDirectoryItem> {
  return navigateToDirectory(tree, LibraryPaths.confections);
}

/**
 * Gets the decorations directory from a library tree.
 * @param tree - The root library FileTree item.
 * @returns `Success` with the decorations directory or `Failure` if not found.
 * @public
 */
export function getDecorationsDirectory(
  tree: FileTree.FileTreeItem
): Result<FileTree.IFileTreeDirectoryItem> {
  return navigateToDirectory(tree, LibraryPaths.decorations);
}

/**
 * Gets the sessions directory from a library tree.
 * @param tree - The root library FileTree item.
 * @returns `Success` with the sessions directory or `Failure` if not found.
 * @public
 */
export function getSessionsDirectory(tree: FileTree.FileTreeItem): Result<FileTree.IFileTreeDirectoryItem> {
  return navigateToDirectory(tree, LibraryPaths.sessions);
}

/**
 * Gets the mold inventory directory from a library tree.
 * @param tree - The root library FileTree item.
 * @returns `Success` with the mold inventory directory or `Failure` if not found.
 * @public
 */
export function getMoldInventoryDirectory(
  tree: FileTree.FileTreeItem
): Result<FileTree.IFileTreeDirectoryItem> {
  return navigateToDirectory(tree, LibraryPaths.moldInventory);
}

/**
 * Gets the ingredient inventory directory from a library tree.
 * @param tree - The root library FileTree item.
 * @returns `Success` with the ingredient inventory directory or `Failure` if not found.
 * @public
 */
export function getIngredientInventoryDirectory(
  tree: FileTree.FileTreeItem
): Result<FileTree.IFileTreeDirectoryItem> {
  return navigateToDirectory(tree, LibraryPaths.ingredientInventory);
}

/**
 * Creates the standard library data directories at the given root path.
 * Creates directories for ingredients, fillings, confections, molds, procedures, and tasks.
 *
 * @param rootPath - Absolute path to the root directory
 * @returns Success or failure
 * @public
 */
export function createDefaultLibraryDirectories(rootPath: string): Result<void> {
  // Node.js fs-based implementation. For a platform-agnostic FileTree-based
  // equivalent, see ensureWorkspaceDirectoriesInTree in the workspace packlet.
  const directories = [
    LibraryPaths.ingredients,
    LibraryPaths.fillings,
    LibraryPaths.confections,
    LibraryPaths.decorations,
    LibraryPaths.molds,
    LibraryPaths.procedures,
    LibraryPaths.tasks
  ];

  return captureResult(() => {
    for (const dir of directories) {
      const fullPath = path.join(rootPath, dir);
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }).onFailure((msg) => fail(`Failed to create library directories: ${msg}`));
}
