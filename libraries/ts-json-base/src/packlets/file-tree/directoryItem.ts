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

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import {
  FileTreeItem,
  IDeleteChildOptions,
  IFileTreeAccessors,
  IMutableFileTreeDirectoryItem,
  IMutableFileTreeFileItem,
  isMutableAccessors,
  isMutableFileItem
} from './fileTreeAccessors';

/**
 * Class representing a directory in a file tree.
 * @public
 */
export class DirectoryItem<TCT extends string = string> implements IMutableFileTreeDirectoryItem<TCT> {
  /**
   * {@inheritDoc FileTree.IFileTreeDirectoryItem."type"}
   */
  public readonly type: 'directory' = 'directory';

  /**
   * {@inheritDoc FileTree.IFileTreeDirectoryItem.absolutePath}
   */
  public readonly absolutePath: string;

  /**
   * {@inheritDoc FileTree.IFileTreeDirectoryItem.name}
   */
  public get name(): string {
    return this._hal.getBaseName(this.absolutePath);
  }

  /**
   * The {@link FileTree.IFileTreeAccessors | accessors} to use for file system operations.
   * @public
   */
  protected readonly _hal: IFileTreeAccessors<TCT>;

  /**
   * Protected constructor for derived classes.
   * @param path - Relative path of the directory.
   * @param hal - The {@link FileTree.IFileTreeAccessors | accessors} to use for
   * file system operations.
   * @public
   */
  protected constructor(path: string, hal: IFileTreeAccessors<TCT>) {
    this._hal = hal;
    this.absolutePath = hal.resolveAbsolutePath(path);
  }

  /**
   * Creates a new DirectoryItem instance.
   * @param path - Relative path of the directory.
   * @param hal - The {@link FileTree.IFileTreeAccessors | accessors} to use for
   * file system operations.
   * @returns `Success` with the new {@link FileTree.DirectoryItem | DirectoryItem} instance if successful,
   * or `Failure` with an error message otherwise.
   */
  public static create<TCT extends string = string>(
    path: string,
    hal: IFileTreeAccessors<TCT>
  ): Result<DirectoryItem<TCT>> {
    return captureResult(() => new DirectoryItem<TCT>(path, hal));
  }

  /**
   * {@inheritDoc FileTree.IFileTreeDirectoryItem.getChildren}
   */
  public getChildren(): Result<ReadonlyArray<FileTreeItem<TCT>>> {
    return this._hal.getChildren(this.absolutePath);
  }

  /**
   * {@inheritDoc FileTree.IMutableFileTreeDirectoryItem.createChildFile}
   */
  public createChildFile(name: string, contents: string): Result<IMutableFileTreeFileItem<TCT>> {
    const hal = this._hal;
    if (!isMutableAccessors(hal)) {
      /* c8 ignore next 2 - defensive: all current accessor implementations support mutation interface */
      return fail(`${this.absolutePath}: mutation not supported`);
    }

    const filePath = hal.joinPaths(this.absolutePath, name);
    return hal.saveFileContents(filePath, contents).onSuccess(() =>
      hal.getItem(filePath).onSuccess((item) => {
        /* c8 ignore next 3 - defensive: verifies accessor returned correct item type after save */
        if (!isMutableFileItem(item)) {
          return fail(`${filePath}: expected mutable file but got ${item.type}`);
        }
        return succeed(item);
      })
    );
  }

  /**
   * {@inheritDoc FileTree.IMutableFileTreeDirectoryItem.createChildDirectory}
   */
  public createChildDirectory(name: string): Result<IMutableFileTreeDirectoryItem<TCT>> {
    const hal = this._hal;
    if (!isMutableAccessors(hal)) {
      /* c8 ignore next 2 - defensive: all current accessor implementations support mutation interface */
      return fail(`${this.absolutePath}: mutation not supported`);
    }

    const dirPath = hal.joinPaths(this.absolutePath, name);
    return hal.createDirectory(dirPath).onSuccess(() => DirectoryItem.create(dirPath, hal));
  }

  /**
   * {@inheritDoc FileTree.IMutableFileTreeDirectoryItem.deleteChild}
   */
  public deleteChild(name: string, options?: IDeleteChildOptions): Result<boolean> {
    const hal = this._hal;
    if (!isMutableAccessors(hal)) {
      /* c8 ignore next 2 - defensive: all current accessor implementations support mutation interface */
      return fail(`${this.absolutePath}: mutation not supported`);
    }

    const childPath = hal.joinPaths(this.absolutePath, name);
    return hal.getItem(childPath).onSuccess((item) => {
      if (item.type === 'file') {
        return hal.deleteFile(childPath);
      }
      // Directory child
      if (options?.recursive) {
        return this._deleteRecursive(childPath);
      }
      return hal.deleteDirectory(childPath);
    });
  }

  /**
   * {@inheritDoc FileTree.IMutableFileTreeDirectoryItem.delete}
   */
  public delete(): Result<boolean> {
    const hal = this._hal;
    if (!isMutableAccessors(hal)) {
      /* c8 ignore next 2 - defensive: all current accessor implementations support mutation interface */
      return fail(`${this.absolutePath}: mutation not supported`);
    }
    return hal.deleteDirectory(this.absolutePath);
  }

  /**
   * Recursively deletes all children of a directory and then the directory itself.
   * @param dirPath - The absolute path of the directory to delete.
   * @returns `Success` with `true` if the directory was deleted, or `Failure` with an error message.
   * @internal
   */
  private _deleteRecursive(dirPath: string): Result<boolean> {
    const hal = this._hal;
    /* c8 ignore next 2 - defensive: caller already verified mutable */
    if (!isMutableAccessors(hal)) {
      return fail(`${dirPath}: mutation not supported`);
    }
    return hal.getChildren(dirPath).onSuccess((children) => {
      for (const child of children) {
        if (child.type === 'file') {
          const result = hal.deleteFile(child.absolutePath);
          /* c8 ignore next 2 - defensive: error propagation during recursive delete */
          if (result.isFailure()) {
            return result;
          }
        } else {
          const result = this._deleteRecursive(child.absolutePath);
          /* c8 ignore next 2 - defensive: error propagation during recursive delete */
          if (result.isFailure()) {
            return result;
          }
        }
      }
      return hal.deleteDirectory(dirPath);
    });
  }
}
