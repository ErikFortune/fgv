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

import { Result } from '@fgv/ts-utils';
import { Converter, Validator } from '@fgv/ts-utils';
import { JsonValue } from '../json';

/**
 * Type of item in a file tree.
 * @public
 */
export type FileTreeItemType = 'directory' | 'file';

/**
 * Initialization parameters for a file tree.
 * @public
 */
export interface IFileTreeInitParams<TCT extends string = string> {
  prefix?: string;
  inferContentType?: (filePath: string) => Result<TCT | undefined>;
}

/**
 * Interface for a file in a file tree.
 * @public
 */
export interface IFileTreeFileItem<TCT extends string = string> {
  /**
   * Indicates that this {@link FileTree.FileTreeItem | file tree item} is a file.
   */
  readonly type: 'file';

  /**
   * The absolute path of the file.
   */
  readonly absolutePath: string;

  /**
   * The name of the file
   */
  readonly name: string;

  /**
   * The base name of the file (without extension)
   */
  readonly baseName: string;

  /**
   * The extension of the file
   */
  readonly extension: string;

  /**
   * An optional content type (e.g. mime type) for the file.
   */
  readonly contentType: TCT | undefined;

  /**
   * Gets the contents of the file as parsed JSON.
   * @returns `Success` with the parsed JSON-compatible contents if successful, or
   * `Failure` with an error message otherwise.
   */
  getContents(): Result<JsonValue>;

  /**
   * Gets the contents of the file as parsed JSON, converted to a specific type.
   * @param converter - A `Validator` or `Converter`
   * to convert the parsed JSON contents to the desired type.
   * @returns `Success` with the converted contents if successful, or
   * `Failure` with an error message otherwise.
   */
  getContents<T>(converter: Validator<T> | Converter<T>): Result<T>;

  /**
   * Gets the raw contents of the file as a string.
   * @returns `Success` with the raw contents if successful, or
   * `Failure` with an error message otherwise.
   */
  getRawContents(): Result<string>;
}

/**
 * Interface for a directory in a file tree.
 * @public
 */
export interface IFileTreeDirectoryItem<TCT extends string = string> {
  /**
   * Indicates that this {@link FileTree.FileTreeItem | file tree item} is a directory
   */
  readonly type: 'directory';

  /**
   * The absolute path of the directory.
   */
  readonly absolutePath: string;

  /**
   * The name of the directory
   */
  readonly name: string;

  /**
   * Gets the children of the directory.
   * @returns `Success` with the children of the directory if successful,
   * or `Failure` with an error message otherwise.
   */
  getChildren(): Result<ReadonlyArray<FileTreeItem<TCT>>>;
}

/**
 * Type for an item in a file tree.
 * @public
 */
export type FileTreeItem<TCT extends string = string> = IFileTreeFileItem<TCT> | IFileTreeDirectoryItem<TCT>;

/**
 * Common abstraction layer interface for a tree of files
 * (e.g. a file system or a zip file).
 * @public
 */
export interface IFileTreeAccessors<TCT extends string = string> {
  /**
   * Resolves paths to an absolute path.
   * @param paths - Paths to resolve.
   * @returns The resolved absolute path.
   */
  resolveAbsolutePath(...paths: string[]): string;

  /**
   * Gets the extension of a path.
   * @param path - Path to get the extension of.
   * @returns The extension of the path.
   */
  getExtension(path: string): string;

  /**
   * Gets the base name of a path.
   * @param path - Path to get the base name of.
   * @param suffix - Optional suffix to remove from the base name.
   * @returns The base name of the path.
   */
  getBaseName(path: string, suffix?: string): string;

  /**
   * Joins paths together.
   * @param paths - Paths to join.
   * @returns The joined paths.
   */
  joinPaths(...paths: string[]): string;

  /**
   * Gets an item from the file tree.
   * @param path - Path of the item to get.
   * @returns The item if it exists.
   */
  getItem(path: string): Result<FileTreeItem<TCT>>;

  /**
   * Gets the contents of a file in the file tree.
   * @param path - Absolute path of the file.
   * @returns The contents of the file.
   */
  getFileContents(path: string): Result<string>;

  /**
   * Gets the content type of a file in the file tree.
   * @param path - Absolute path of the file.
   * @returns The content type of the file.
   */
  getFileContentType(path: string): Result<TCT | undefined>;

  /**
   * Gets the children of a directory in the file tree.
   * @param path - Path of the directory.
   * @returns The children of the directory.
   */
  getChildren(path: string): Result<ReadonlyArray<FileTreeItem<TCT>>>;
}
