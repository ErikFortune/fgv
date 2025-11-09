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

import { captureResult, Result, succeed } from '@fgv/ts-utils';
import { Converter, Validator } from '@fgv/ts-utils';
import { JsonValue } from '../json';
import { IFileTreeAccessors, IFileTreeFileItem } from './fileTreeAccessors';

/**
 * Class representing a file in a file tree.
 * @public
 */
export class FileItem<TCT extends string = string> implements IFileTreeFileItem<TCT> {
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
   * {@inheritdoc FileTree.IFileTreeFileItem.baseName}
   */
  public get baseName(): string {
    return this._hal.getBaseName(this.absolutePath, this.extension);
  }

  /**
   * {@inheritdoc FileTree.IFileTreeFileItem.extension}
   */
  public get extension(): string {
    return this._hal.getExtension(this.absolutePath);
  }

  /**
   * {@inheritdoc FileTree.IFileTreeFileItem.contentType}
   */
  public get contentType(): TCT | undefined {
    return this._contentType;
  }

  /**
   * Mutable content type of the file.
   * @public
   */
  private _contentType: TCT | undefined;

  /**
   * The {@link FileTree.IFileTreeAccessors | accessors} to use for file system operations.
   * @public
   */
  protected readonly _hal: IFileTreeAccessors<TCT>;

  /**
   * Protected constructor for derived classes.
   * @param path - Relative path of the file.
   * @param hal - The {@link FileTree.IFileTreeAccessors | accessors} to use for
   * file system operations.
   * @public
   */
  protected constructor(path: string, hal: IFileTreeAccessors<TCT>) {
    this._hal = hal;
    this.absolutePath = hal.resolveAbsolutePath(path);
    this._contentType = hal.getFileContentType(this.absolutePath).orDefault();
  }

  /**
   * Creates a new {@link FileTree.FileItem} instance.
   * @param path - Relative path of the file.
   * @param hal - The {@link FileTree.IFileTreeAccessors | accessors} to use for
   * file system operations.
   * @public
   */
  public static create<TCT extends string = string>(
    path: string,
    hal: IFileTreeAccessors<TCT>
  ): Result<FileItem<TCT>> {
    return captureResult(() => new FileItem(path, hal));
  }

  /**
   * {@inheritdoc FileTree.IFileTreeFileItem.(getContents:1)}
   */
  public getContents(): Result<JsonValue>;
  /**
   * {@inheritdoc FileTree.IFileTreeFileItem.(getContents:2)}
   */
  public getContents<T>(converter: Validator<T> | Converter<T>): Result<T>;
  public getContents<T>(converter?: Validator<T> | Converter<T>): Result<T | JsonValue> {
    return this._hal
      .getFileContents(this.absolutePath)
      .onSuccess((body) => captureResult(() => JSON.parse(body)).onFailure(() => succeed(body)))
      .onSuccess<T | JsonValue>((parsed) => {
        if (converter !== undefined) {
          return converter.convert(parsed);
        }
        return succeed(parsed as JsonValue);
      });
  }

  /**
   * {@inheritdoc FileTree.IFileTreeFileItem.getRawContents}
   */
  public getRawContents(): Result<string> {
    return this._hal.getFileContents(this.absolutePath);
  }

  /**
   * Sets the content type of the file.
   * @param contentType - The content type of the file.
   */
  public setContentType(contentType: TCT | undefined): void {
    this._contentType = contentType;
  }

  /**
   * Default function to infer the content type of a file.
   * @param filePath - The path of the file.
   * @returns `Success` with the content type of the file if successful, or
   * `Failure` with an error message otherwise.
   * @remarks This default implementation always returns `Success` with `undefined`.
   * @public
   */
  public static defaultInferContentType<TCT extends string = string>(
    __filePath: string,
    __provided?: string
  ): Result<TCT | undefined> {
    return succeed(undefined);
  }

  /**
   * Default function to accept the content type of a file.
   * @param filePath - The path of the file.
   * @param provided - Optional supplied content type.
   * @returns `Success` with the content type of the file if successful, or
   * `Failure` with an error message otherwise.
   * @remarks This default implementation always returns `Success` with `undefined`.
   * @public
   */
  public static defaultAcceptContentType<TCT extends string = string>(
    __filePath: string,
    provided?: TCT
  ): Result<TCT | undefined> {
    return succeed(provided);
  }
}
