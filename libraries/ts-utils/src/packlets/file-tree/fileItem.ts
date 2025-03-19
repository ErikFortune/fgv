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

import { captureResult, Result, succeed } from '../base';
import { Converter } from '../conversion';
import { Validator } from '../validation';
import { IFileTreeAccessors, IFileTreeFileItem } from './fileTreeAccessors';

/**
 * Class representing a file in a file tree.
 * @public
 */
export class FileItem implements IFileTreeFileItem {
  /**
   * {@inheritdoc FileTree.IFileTreeFileItem."type"}
   */
  public readonly type: 'file' = 'file';

  /**
   * {@inheritdoc FileTree.IFileTreeFileItem.absolutePath}
   */
  public readonly absolutePath: string;

  /**
   * {@inheritdoc FileTree.IFileTreeFileItem.name}
   */
  public get name(): string {
    return this._hal.getBaseName(this.absolutePath);
  }

  /**
   * {@inheritdoc FileTree.IFileTreeFileItem.extension}
   */
  public get extension(): string {
    return this._hal.getExtension(this.absolutePath);
  }

  /**
   * The {@link FileTree.IFileTreeAccessors | accessors} to use for file system operations.
   * @public
   */
  protected readonly _hal: IFileTreeAccessors;

  /**
   * Protected constructor for derived classes.
   * @param path - Relative path of the file.
   * @param hal - The {@link FileTree.IFileTreeAccessors | accessors} to use for
   * file system operations.
   * @public
   */
  protected constructor(path: string, hal: IFileTreeAccessors) {
    this._hal = hal;
    this.absolutePath = hal.resolveAbsolutePath(path);
  }

  /**
   * Creates a new {@link FileTree.FileItem | FileItem} instance.
   * @param path - Relative path of the file.
   * @param hal - The {@link FileTree.IFileTreeAccessors | accessors} to use for
   * file system operations.
   * @public
   */
  public static create(path: string, hal: IFileTreeAccessors): Result<FileItem> {
    return captureResult(() => new FileItem(path, hal));
  }

  /**
   * {@inheritdoc FileTree.IFileTreeFileItem.(getContents:1)}
   */
  public getContents(): Result<unknown>;
  /**
   * {@inheritdoc FileTree.IFileTreeFileItem.(getContents:2)}
   */
  public getContents<T>(converter: Validator<T> | Converter<T>): Result<T>;
  public getContents<T>(converter?: Validator<T> | Converter<T>): Result<T | unknown> {
    return this._hal
      .getFileContents(this.absolutePath)
      .onSuccess((body) => captureResult(() => JSON.parse(body)).onFailure(() => succeed(body)))
      .onSuccess((parsed) => {
        if (converter !== undefined) {
          return converter.convert(parsed);
        }
        return succeed(parsed);
      });
  }

  /**
   * {@inheritdoc FileTree.IFileTreeFileItem.getRawContents}
   */
  public getRawContents(): Result<string> {
    return this._hal.getFileContents(this.absolutePath);
  }
}
