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
  IFileTreeAccessors,
  IFileTreeDirectoryItem,
  IFileTreeFileItem,
  isMutableAccessors
} from './fileTreeAccessors';

/**
 * Class representing a directory in a file tree.
 * @public
 */
export class DirectoryItem<TCT extends string = string> implements IFileTreeDirectoryItem<TCT> {
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
   * {@inheritDoc FileTree.IFileTreeDirectoryItem.createChildFile}
   */
  public createChildFile(name: string, contents: string): Result<IFileTreeFileItem<TCT>> {
    if (!isMutableAccessors(this._hal)) {
      return fail(`${this.absolutePath}: mutation not supported`);
    }

    const filePath = this._hal.joinPaths(this.absolutePath, name);
    return this._hal.saveFileContents(filePath, contents).onSuccess(() =>
      this._hal.getItem(filePath).onSuccess((item) => {
        /* c8 ignore next 3 - defensive: verifies accessor returned correct item type after save */
        if (item.type !== 'file') {
          return fail(`${filePath}: expected file but got ${item.type}`);
        }
        return succeed(item);
      })
    );
  }

  /**
   * {@inheritDoc FileTree.IFileTreeDirectoryItem.createChildDirectory}
   */
  public createChildDirectory(name: string): Result<IFileTreeDirectoryItem<TCT>> {
    if (!isMutableAccessors(this._hal)) {
      return fail(`${this.absolutePath}: mutation not supported`);
    }

    /* c8 ignore next 3 - defensive: createDirectory should always exist if isMutableAccessors is true */
    if (this._hal.createDirectory === undefined) {
      return fail(`${this.absolutePath}: directory creation not supported`);
    }

    const dirPath = this._hal.joinPaths(this.absolutePath, name);
    return this._hal.createDirectory(dirPath).onSuccess(() => DirectoryItem.create(dirPath, this._hal));
  }

  /**
   * {@inheritDoc FileTree.IFileTreeDirectoryItem.deleteChild}
   */
  public deleteChild(name: string): Result<boolean> {
    if (!isMutableAccessors(this._hal)) {
      return fail(`${this.absolutePath}: mutation not supported`);
    }

    if (this._hal.deleteFile === undefined) {
      return fail(`${this.absolutePath}: file deletion not supported`);
    }

    const filePath = this._hal.joinPaths(this.absolutePath, name);
    return this._hal.deleteFile(filePath);
  }
}
