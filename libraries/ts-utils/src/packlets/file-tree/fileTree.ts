/*
 * Copyright (c) 2025 Erik Fortune
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

import { captureResult, Result, fail, succeed } from '../base';
import {
  FileTreeItem,
  IFileTreeAccessors,
  IFileTreeDirectoryItem,
  IFileTreeFileItem
} from './fileTreeAccessors';
import { FsFileTreeAccessors } from './fsTree';
import { IInMemoryFile, InMemoryTreeAccessors } from './in-memory';

/**
 * Represents a file tree.
 * @public
 */
export class FileTree {
  /**
   * The {@link FileTree.IFileTreeAccessors | accessors} to use for file system operations.
   * @public
   */
  public hal: IFileTreeAccessors;

  /**
   * Protected constructor for derived classes.
   * @param hal - The {@link FileTree.IFileTreeAccessors | accessors} to use for
   * file system operations.
   * @public
   */
  protected constructor(hal: IFileTreeAccessors) {
    this.hal = hal;
  }

  /**
   * Creates a new {@link FileTree.FileTree | FileTree} instance with the supplied
   * accessors.
   * @param hal - The {@link FileTree.IFileTreeAccessors | accessors} to use for
   * file system operations.
   */
  public static create(hal: IFileTreeAccessors): Result<FileTree> {
    return captureResult(() => new FileTree(hal));
  }

  /**
   * Creates a new {@link FileTree.FileTree | FileTree} instance with accessors
   * for the filesystem.
   * @param prefix - An optional prefix to prepended to supplied relative
   * paths.
   */
  public static forFilesystem(prefix?: string): Result<FileTree> {
    return captureResult(() => new FileTree(new FsFileTreeAccessors(prefix)));
  }

  /**
   * Creates a new {@link FileTree.FileTree | FileTree} instance with accessors
   * for an in-memory file tree.
   * @param files - An array of {@link FileTree.IInMemoryFile | in-memory files} to
   * include in the tree.
   * @param prefix - An optional prefix to add to the paths of all files in the tree.
   */
  public static inMemory(files: IInMemoryFile[], prefix?: string): Result<FileTree> {
    return InMemoryTreeAccessors.create(files, prefix).onSuccess((hal) =>
      captureResult(() => new FileTree(hal))
    );
  }

  /**
   * Gets an item from the tree.
   * @param itemPath - The path to the item.
   * @returns {@link Success | Success} with the item if successful,
   * or {@link Failure | Failure} with an error message otherwise.
   */
  public getItem(itemPath: string): Result<FileTreeItem> {
    const absolutePath = this.hal.resolveAbsolutePath(itemPath);
    return this.hal.getItem(absolutePath);
  }

  /**
   * Gets a file item from the tree.
   * @param filePath - The path to the file.
   * @returns {@link Success | Success} with the {@link FileTree.IFileTreeFileItem | file item}
   * if successful, or {@link Failure | Failure} with an error message otherwise.
   */
  public getFile(filePath: string): Result<IFileTreeFileItem> {
    return this.getItem(filePath).onSuccess((item) => {
      if (item.type === 'file') {
        return succeed(item);
      }
      return fail(`${filePath}: not a file`);
    });
  }

  /**
   * Gets a directory item from the tree.
   * @param directoryPath - The path to the directory.
   * @returns {@link Success | Success} with the {@link FileTree.IFileTreeDirectoryItem | directory item}
   * if successful, or {@link Failure | Failure} with an error message otherwise.
   */
  public getDirectory(directoryPath: string): Result<IFileTreeDirectoryItem> {
    return this.getItem(directoryPath).onSuccess((item) => {
      if (item.type === 'directory') {
        return succeed(item);
      }
      return fail(`${directoryPath}: not a directory`);
    });
  }
}

/**
 * Helper function to create a new {@link FileTree.FileTree | FileTree} instance
 * with accessors for the filesystem.
 * @param prefix - An optional prefix to prepended to supplied relative paths.
 * @returns {@link Success | Success} with the new {@link FileTree.FileTree | FileTree} instance
 * if successful, or {@link Failure | Failure} with an error message otherwise.
 * @public
 */
export function forFilesystem(prefix?: string): Result<FileTree> {
  return FileTree.forFilesystem(prefix);
}

/**
 * Helper function to create a new {@link FileTree.FileTree | FileTree} instance
 * with accessors for an in-memory file tree.
 * @param files - An array of {@link FileTree.IInMemoryFile | in-memory files} to include in the tree.
 * @param prefix - An optional prefix to add to the paths of all files in the tree.
 * @returns {@link Success | Success} with the new {@link FileTree.FileTree | FileTree} instance
 * if successful, or {@link Failure | Failure} with an error message otherwise.
 * @public
 */
export function inMemory(files: IInMemoryFile[], prefix?: string): Result<FileTree> {
  return FileTree.inMemory(files, prefix);
}
