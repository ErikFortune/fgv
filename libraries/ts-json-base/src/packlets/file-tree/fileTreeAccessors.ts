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

import { DetailedResult, Result } from '@fgv/ts-utils';
import { Converter, Validator } from '@fgv/ts-utils';
import { JsonValue } from '../json';

/**
 * Indicates the persistence capability of a save operation.
 * - `persistent`: Changes are saved to durable storage (e.g., file system).
 * - `transient`: Changes are saved in memory only and will be lost on reload.
 * @public
 */
export type SaveCapability = 'persistent' | 'transient';

/**
 * Indicates the reason a save operation cannot be performed.
 * - `not-supported`: The accessors do not support mutation.
 * - `read-only`: The file or file system is read-only.
 * - `not-mutable`: Mutability is disabled in configuration.
 * - `path-excluded`: The path is excluded by the mutability filter.
 * - `permission-denied`: Insufficient permissions to write.
 * @public
 */
export type SaveFailureReason =
  | 'not-supported'
  | 'read-only'
  | 'not-mutable'
  | 'path-excluded'
  | 'permission-denied';

/**
 * Detail type for getIsMutable results.
 * @public
 */
export type SaveDetail = SaveCapability | SaveFailureReason;

/**
 * Filter specification for controlling which paths are mutable.
 * @public
 */
export interface IFilterSpec {
  /**
   * Paths or patterns to include. If specified, only matching paths are mutable.
   */
  include?: (string | RegExp)[];

  /**
   * Paths or patterns to exclude. Matching paths are not mutable.
   */
  exclude?: (string | RegExp)[];
}

/**
 * Type of item in a file tree.
 * @public
 */
export type FileTreeItemType = 'directory' | 'file';

/**
 * Type of function to infer the content type of a file.
 * @public
 */
export type ContentTypeFactory<TCT extends string = string> = (
  filePath: string,
  provided?: string
) => Result<TCT | undefined>;

/**
 * Initialization parameters for a file tree.
 * @public
 */
export interface IFileTreeInitParams<TCT extends string = string> {
  prefix?: string;
  inferContentType?: ContentTypeFactory<TCT>;

  /**
   * Controls mutability of the file tree.
   * - `undefined` or `false`: No files are mutable.
   * - `true`: All files are mutable.
   * - `IFilterSpec`: Only files matching the filter are mutable.
   */
  mutable?: boolean | IFilterSpec;
}

/**
 * Options for deleting a child item from a directory.
 * @public
 */
export interface IDeleteChildOptions {
  /**
   * If true, recursively delete directory children and their contents.
   * Default: false (fail if directory is non-empty).
   */
  recursive?: boolean;
}

// ============================================================================
// File Item Interfaces
// ============================================================================

/**
 * Interface for a read-only file in a file tree.
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
 * Extended file item interface that supports mutation operations.
 * Use {@link FileTree.isMutableFileItem | isMutableFileItem} type guard to narrow.
 * @public
 */
export interface IMutableFileTreeFileItem<TCT extends string = string> extends IFileTreeFileItem<TCT> {
  /**
   * Indicates whether this file can be saved.
   * @returns `DetailedSuccess` with {@link FileTree.SaveCapability} if the file can be saved,
   * or `DetailedFailure` with {@link FileTree.SaveFailureReason} if it cannot.
   */
  getIsMutable(): DetailedResult<boolean, SaveDetail>;

  /**
   * Sets the contents of the file from a JSON value.
   * @param json - The JSON value to serialize and save.
   * @returns `Success` if the file was saved, or `Failure` with an error message.
   */
  setContents(json: JsonValue): Result<JsonValue>;

  /**
   * Sets the raw contents of the file.
   * @param contents - The string contents to save.
   * @returns `Success` if the file was saved, or `Failure` with an error message.
   */
  setRawContents(contents: string): Result<string>;

  /**
   * Deletes this file from its backing store.
   * @returns `Success` with `true` if the file was deleted, or `Failure` with an error message.
   */
  delete(): Result<boolean>;
}

// ============================================================================
// Directory Item Interfaces
// ============================================================================

/**
 * Interface for a read-only directory in a file tree.
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
 * Extended directory item interface that supports mutation operations.
 * Use {@link FileTree.isMutableDirectoryItem | isMutableDirectoryItem} type guard to narrow.
 * @public
 */
export interface IMutableFileTreeDirectoryItem<TCT extends string = string>
  extends IFileTreeDirectoryItem<TCT> {
  /**
   * Creates a new file as a child of this directory.
   * @param name - The file name to create.
   * @param contents - The string contents to write.
   * @returns `Success` with the new file item, or `Failure` with an error message.
   */
  createChildFile(name: string, contents: string): Result<IMutableFileTreeFileItem<TCT>>;

  /**
   * Creates a new subdirectory as a child of this directory.
   * @param name - The directory name to create.
   * @returns `Success` with the new directory item, or `Failure` with an error message.
   */
  createChildDirectory(name: string): Result<IMutableFileTreeDirectoryItem<TCT>>;

  /**
   * Deletes a child item from this directory.
   * @param name - The name of the child to delete.
   * @param options - Optional {@link FileTree.IDeleteChildOptions | options} controlling deletion behavior.
   * @returns `Success` with `true` if the child was deleted, or `Failure` with an error message.
   */
  deleteChild(name: string, options?: IDeleteChildOptions): Result<boolean>;

  /**
   * Deletes this directory from its backing store.
   * The directory must be empty or the operation will fail.
   * @returns `Success` with `true` if the directory was deleted, or `Failure` with an error message.
   */
  delete(): Result<boolean>;
}

// ============================================================================
// Union Types
// ============================================================================

/**
 * Type for an item in a file tree.
 * @public
 */
export type FileTreeItem<TCT extends string = string> = IFileTreeFileItem<TCT> | IFileTreeDirectoryItem<TCT>;

/**
 * Type for a mutable item in a file tree.
 * @public
 */
export type MutableFileTreeItem<TCT extends string = string> =
  | IMutableFileTreeFileItem<TCT>
  | IMutableFileTreeDirectoryItem<TCT>;

/**
 * A file item that may or may not be mutable at runtime.
 *
 * Use this type for parameters or fields where the code checks for mutability
 * and handles the read-only case gracefully. Use {@link FileTree.IMutableFileTreeFileItem}
 * when mutation is required.
 *
 * Narrow with {@link FileTree.isMutableFileItem} to access mutation methods.
 * @public
 */
export type AnyFileTreeFileItem<TCT extends string = string> =
  | IFileTreeFileItem<TCT>
  | IMutableFileTreeFileItem<TCT>;

/**
 * A directory item that may or may not be mutable at runtime.
 *
 * Use this type for parameters or fields where the code checks for mutability
 * and handles the read-only case gracefully. Use {@link FileTree.IMutableFileTreeDirectoryItem}
 * when mutation is required.
 *
 * Narrow with {@link FileTree.isMutableDirectoryItem} to access mutation methods.
 * @public
 */
export type AnyFileTreeDirectoryItem<TCT extends string = string> =
  | IFileTreeDirectoryItem<TCT>
  | IMutableFileTreeDirectoryItem<TCT>;

// ============================================================================
// Accessor Interfaces
// ============================================================================

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
   * @param provided - Optional supplied content type.
   * @returns The content type of the file.
   */
  getFileContentType(path: string, provided?: string): Result<TCT | undefined>;

  /**
   * Gets the children of a directory in the file tree.
   * @param path - Path of the directory.
   * @returns The children of the directory.
   */
  getChildren(path: string): Result<ReadonlyArray<FileTreeItem<TCT>>>;
}

/**
 * Extended accessors interface that supports mutation operations.
 * All mutation methods are required — use {@link FileTree.isMutableAccessors | isMutableAccessors}
 * type guard to check if an accessor supports mutation.
 * @public
 */
export interface IMutableFileTreeAccessors<TCT extends string = string> extends IFileTreeAccessors<TCT> {
  /**
   * Checks if a file at the given path can be saved.
   * @param path - The path to check.
   * @returns `DetailedSuccess` with {@link FileTree.SaveCapability} if the file can be saved,
   * or `DetailedFailure` with {@link FileTree.SaveFailureReason} if it cannot.
   */
  fileIsMutable(path: string): DetailedResult<boolean, SaveDetail>;

  /**
   * Saves the contents to a file at the given path.
   * @param path - The path of the file to save.
   * @param contents - The string contents to save.
   * @returns `Success` if the file was saved, or `Failure` with an error message.
   */
  saveFileContents(path: string, contents: string): Result<string>;

  /**
   * Deletes a file at the given path.
   * @param path - The path of the file to delete.
   * @returns `Success` with `true` if the file was deleted, or `Failure` with an error message.
   */
  deleteFile(path: string): Result<boolean>;

  /**
   * Creates a directory at the given path, including any missing parent directories.
   * @param path - The path of the directory to create.
   * @returns `Success` with the absolute path if created, or `Failure` with an error message.
   */
  createDirectory(path: string): Result<string>;

  /**
   * Deletes a directory at the given path.
   * The directory must be empty or the operation will fail.
   * @param path - The path of the directory to delete.
   * @returns `Success` with `true` if the directory was deleted, or `Failure` with an error message.
   */
  deleteDirectory(path: string): Result<boolean>;
}

/**
 * Extended accessors interface that supports persistence operations.
 * @public
 */
export interface IPersistentFileTreeAccessors<TCT extends string = string>
  extends IMutableFileTreeAccessors<TCT> {
  /**
   * Synchronize all dirty files to persistent storage.
   * @returns Promise resolving to success or failure
   */
  syncToDisk(): Promise<Result<void>>;

  /**
   * Check if there are unsaved changes.
   * @returns True if there are dirty files
   */
  isDirty(): boolean;

  /**
   * Get paths of all files with unsaved changes.
   * @returns Array of dirty file paths
   */
  getDirtyPaths(): string[];
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if accessors support mutation.
 * @param accessors - The accessors to check.
 * @returns `true` if the accessors implement {@link FileTree.IMutableFileTreeAccessors}.
 * @public
 */
export function isMutableAccessors<TCT extends string = string>(
  accessors: IFileTreeAccessors<TCT>
): accessors is IMutableFileTreeAccessors<TCT> {
  const mutable = accessors as IMutableFileTreeAccessors<TCT>;
  return (
    typeof mutable.fileIsMutable === 'function' &&
    typeof mutable.saveFileContents === 'function' &&
    typeof mutable.deleteFile === 'function' &&
    typeof mutable.createDirectory === 'function' &&
    typeof mutable.deleteDirectory === 'function'
  );
}

/**
 * Type guard to check if accessors support persistence.
 * @param accessors - The accessors to check.
 * @returns `true` if the accessors implement {@link FileTree.IPersistentFileTreeAccessors}.
 * @public
 */
export function isPersistentAccessors<TCT extends string = string>(
  accessors: IFileTreeAccessors<TCT>
): accessors is IPersistentFileTreeAccessors<TCT> {
  const persistent = accessors as IPersistentFileTreeAccessors<TCT>;
  /* c8 ignore next 6 - no current accessor implements IPersistentFileTreeAccessors */
  return (
    isMutableAccessors(accessors) &&
    typeof persistent.syncToDisk === 'function' &&
    typeof persistent.isDirty === 'function' &&
    typeof persistent.getDirtyPaths === 'function'
  );
}

/**
 * Type guard to check if a file item supports mutation.
 * @param item - The file item to check.
 * @returns `true` if the item implements {@link FileTree.IMutableFileTreeFileItem}.
 * @public
 */
export function isMutableFileItem<TCT extends string = string>(
  item: AnyFileTreeFileItem<TCT> | FileTreeItem<TCT>
): item is IMutableFileTreeFileItem<TCT> {
  const mutable = item as IMutableFileTreeFileItem<TCT>;
  return (
    mutable.type === 'file' &&
    typeof mutable.getIsMutable === 'function' &&
    typeof mutable.setContents === 'function' &&
    typeof mutable.setRawContents === 'function' &&
    typeof mutable.delete === 'function'
  );
}

/**
 * Type guard to check if a directory item supports mutation.
 * @param item - The directory item to check.
 * @returns `true` if the item implements {@link FileTree.IMutableFileTreeDirectoryItem}.
 * @public
 */
export function isMutableDirectoryItem<TCT extends string = string>(
  item: AnyFileTreeDirectoryItem<TCT> | FileTreeItem<TCT>
): item is IMutableFileTreeDirectoryItem<TCT> {
  const mutable = item as IMutableFileTreeDirectoryItem<TCT>;
  return (
    mutable.type === 'directory' &&
    typeof mutable.createChildFile === 'function' &&
    typeof mutable.createChildDirectory === 'function' &&
    typeof mutable.deleteChild === 'function' &&
    typeof mutable.delete === 'function'
  );
}
