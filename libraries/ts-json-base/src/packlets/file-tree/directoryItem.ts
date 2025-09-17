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

import { Result, captureResult } from '@fgv/ts-utils';
import { FileTreeItem, IFileTreeAccessors, IFileTreeDirectoryItem } from './fileTreeAccessors';

/**
 * Class representing a directory in a file tree.
 * @public
 */
export class DirectoryItem implements IFileTreeDirectoryItem {
  /**
   * {@inheritdoc IFileTreeDirectoryItem."type"}
   */
  public readonly type: 'directory' = 'directory';

  /**
   * {@inheritdoc IFileTreeDirectoryItem.absolutePath}
   */
  public readonly absolutePath: string;

  /**
   * {@inheritdoc IFileTreeDirectoryItem.name}
   */
  public get name(): string {
    return this._hal.getBaseName(this.absolutePath);
  }

  /**
   * The {@link IFileTreeAccessors | accessors} to use for file system operations.
   * @public
   */
  protected readonly _hal: IFileTreeAccessors;

  /**
   * Protected constructor for derived classes.
   * @param path - Relative path of the directory.
   * @param hal - The {@link IFileTreeAccessors | accessors} to use for
   * file system operations.
   * @public
   */
  protected constructor(path: string, hal: IFileTreeAccessors) {
    this._hal = hal;
    this.absolutePath = hal.resolveAbsolutePath(path);
  }

  /**
   * Creates a new DirectoryItem instance.
   * @param path - Relative path of the directory.
   * @param hal - The {@link IFileTreeAccessors | accessors} to use for
   * file system operations.
   * @returns A {@link Result} containing the new DirectoryItem instance if successful,
   * or a failure if an error occurs.
   */
  public static create(path: string, hal: IFileTreeAccessors): Result<DirectoryItem> {
    return captureResult(() => new DirectoryItem(path, hal));
  }

  /**
   * {@inheritdoc IFileTreeDirectoryItem.getChildren}
   */
  public getChildren(): Result<ReadonlyArray<FileTreeItem>> {
    return this._hal.getChildren(this.absolutePath);
  }
}
