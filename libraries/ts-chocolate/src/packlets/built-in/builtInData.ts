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

import { Failure, Result, Success } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  getConfectionsDirectory,
  getIngredientsDirectory,
  getMoldsDirectory,
  getProceduresDirectory,
  getFillingsDirectory,
  getTasksDirectory
} from '../library-data';
import {
  confectionCollections,
  ingredientCollections,
  moldCollections,
  procedureCollections,
  recipeCollections,
  taskCollections
} from './builtInData.generated';

/**
 * Built-in library file specifications for creating the InMemoryFileTree.
 * Transforms the generated collections into file tree entries.
 * @internal
 */
const builtInLibraryFiles: FileTree.IInMemoryFile[] = [
  ...Object.entries(ingredientCollections).map(([name, data]) => ({
    path: `/data/ingredients/${name}.json`,
    contents: data
  })),
  ...Object.entries(recipeCollections).map(([name, data]) => ({
    path: `/data/fillings/${name}.json`,
    contents: data
  })),
  ...Object.entries(moldCollections).map(([name, data]) => ({
    path: `/data/molds/${name}.json`,
    contents: data
  })),
  ...Object.entries(procedureCollections).map(([name, data]) => ({
    path: `/data/procedures/${name}.json`,
    contents: data
  })),
  ...Object.entries(taskCollections).map(([name, data]) => ({
    path: `/data/tasks/${name}.json`,
    contents: data
  })),
  ...Object.entries(confectionCollections).map(([name, data]) => ({
    path: `/data/confections/${name}.json`,
    contents: data
  }))
];

// Cached tree instance
let cachedTree: FileTree.IFileTreeDirectoryItem | undefined;

/**
 * Provides access to built-in chocolate library data as an InMemoryFileTree.
 * @public
 */
export class BuiltInData {
  /**
   * Gets the full built-in library tree.
   * The tree is structured to mirror a real filesystem library:
   * ```
   * /
   * └── data/
   *     ├── ingredients/
   *     │   ├── common.json
   *     │   ├── felchlin.json
   *     │   ├── cacao-barry.json
   *     │   └── guittard.json
   *     ├── fillings/
   *     │   └── common.json
   *     ├── molds/
   *     │   └── common.json
   *     ├── procedures/
   *     │   └── common.json
   *     ├── tasks/
   *     │   └── common.json
   *     └── confections/
   *         └── common.json
   * ```
   * @returns `Success` with the library tree root directory, or `Failure` with an error message.
   */
  public static getLibraryTree(): Result<FileTree.IFileTreeDirectoryItem> {
    if (cachedTree !== undefined) {
      return Success.with(cachedTree);
    }

    return FileTree.inMemory(builtInLibraryFiles).onSuccess((tree) => {
      // The tree root is '/', but we want to return the root directory item
      return tree.getItem('/').onSuccess((root) => {
        /* c8 ignore next 3 - defensive: root should always be a directory */
        if (root.type !== 'directory') {
          return Failure.with('Built-in library tree root is not a directory');
        }
        cachedTree = root;
        return Success.with(cachedTree);
      });
    });
  }

  /**
   * Gets the ingredients directory from the built-in library tree.
   * @returns `Success` with the ingredients directory, or `Failure` if not found.
   */
  public static getIngredientsDirectory(): Result<FileTree.IFileTreeDirectoryItem> {
    return BuiltInData.getLibraryTree().onSuccess((tree) => getIngredientsDirectory(tree));
  }

  /**
   * Gets the recipes directory from the built-in library tree.
   * @returns `Success` with the recipes directory, or `Failure` if not found.
   */
  public static getFillingsDirectory(): Result<FileTree.IFileTreeDirectoryItem> {
    return BuiltInData.getLibraryTree().onSuccess((tree) => getFillingsDirectory(tree));
  }

  /**
   * Gets the molds directory from the built-in library tree.
   * @returns `Success` with the molds directory, or `Failure` if not found.
   */
  public static getMoldsDirectory(): Result<FileTree.IFileTreeDirectoryItem> {
    return BuiltInData.getLibraryTree().onSuccess((tree) => getMoldsDirectory(tree));
  }

  /**
   * Gets the procedures directory from the built-in library tree.
   * @returns `Success` with the procedures directory, or `Failure` if not found.
   */
  public static getProceduresDirectory(): Result<FileTree.IFileTreeDirectoryItem> {
    return BuiltInData.getLibraryTree().onSuccess((tree) => getProceduresDirectory(tree));
  }

  /**
   * Gets the tasks directory from the built-in library tree.
   * @returns `Success` with the tasks directory, or `Failure` if not found.
   */
  public static getTasksDirectory(): Result<FileTree.IFileTreeDirectoryItem> {
    return BuiltInData.getLibraryTree().onSuccess((tree) => getTasksDirectory(tree));
  }

  /**
   * Gets the confections directory from the built-in library tree.
   * @returns `Success` with the confections directory, or `Failure` if not found.
   */
  public static getConfectionsDirectory(): Result<FileTree.IFileTreeDirectoryItem> {
    return BuiltInData.getLibraryTree().onSuccess((tree) => getConfectionsDirectory(tree));
  }

  /**
   * Clears the cached tree (primarily for testing).
   * @internal
   */
  public static clearCache(): void {
    cachedTree = undefined;
  }
}
