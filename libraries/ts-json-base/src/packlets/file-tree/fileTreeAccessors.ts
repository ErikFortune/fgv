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
   *
   * @remarks
   * The bytes are decoded as UTF-8 with the *lenient* WHATWG default, so malformed
   * input is silently replaced with U+FFFD rather than reported. Accessors whose
   * backing store is byte-native also implement
   * {@link FileTree.IBinaryFileTreeFileItem | IBinaryFileTreeFileItem}; narrow with
   * {@link FileTree.isBinaryFileItem | isBinaryFileItem} and call
   * {@link FileTree.IBinaryFileTreeFileItem.getRawBytes | getRawBytes} to read the
   * undecoded bytes — for a strict decode that fails loudly on malformed UTF-8:
   *
   * ```ts
   * new TextDecoder('utf-8', { fatal: true }).decode(bytes)
   * ```
   *
   * @returns `Success` with the raw contents if successful, or
   * `Failure` with an error message otherwise.
   */
  getRawContents(): Result<string>;
}

/**
 * Extended file item interface for files whose contents can be read as raw bytes.
 *
 * @remarks
 * This is an *optional capability* — it is deliberately not part of
 * {@link FileTree.IFileTreeFileItem}. Use
 * {@link FileTree.isBinaryFileItem | isBinaryFileItem} to narrow.
 *
 * **The file-item guard narrows the type; it does not promise the call succeeds.**
 * {@link FileTree.FileItem} — the generic wrapper backing every adapter except zip —
 * implements this interface unconditionally and delegates to its accessors, reporting
 * an accessor that lacks the capability as a `Failure` rather than by omitting the
 * method. So `isBinaryFileItem` is `true` for any `FileItem` regardless of what backs
 * it. That mirrors the pre-existing `setRawContents` / `getIsMutable` shape on
 * {@link FileTree.IMutableFileTreeFileItem} rather than introducing a new convention.
 * For a capability check that *is* a success guarantee, narrow the **accessors** with
 * {@link FileTree.isBinaryAccessors | isBinaryAccessors} instead; either way, handle
 * the returned `Result`.
 * @public
 */
export interface IBinaryFileTreeFileItem<TCT extends string = string> extends IFileTreeFileItem<TCT> {
  /**
   * Gets the raw contents of the file as bytes, with no text decoding applied.
   *
   * @remarks
   * The returned array must be treated as read-only — implementations are free to
   * return their internal buffer rather than a copy.
   *
   * @returns `Success` with the raw bytes if successful, or `Failure` with an
   * error message otherwise.
   */
  getRawBytes(): Result<Uint8Array>;
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
   *
   * @remarks
   * The string is encoded as UTF-8. To write bytes that are not valid UTF-8, narrow
   * with {@link FileTree.isMutableBinaryFileItem | isMutableBinaryFileItem} and use
   * {@link FileTree.IMutableBinaryFileTreeFileItem.setRawBytes | setRawBytes} instead.
   *
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

/**
 * Extended file item interface for files whose contents can be both read and written
 * as raw bytes.
 *
 * @remarks
 * This is an *optional capability* — use
 * {@link FileTree.isMutableBinaryFileItem | isMutableBinaryFileItem} to narrow.
 *
 * **At the accessors level**, only backing stores that persist bytes verbatim
 * implement the mutable half; stores that persist text (in-memory, `localStorage`,
 * HTTP JSON transport) implement only the read-only
 * {@link FileTree.IBinaryFileTreeAccessors}, because a byte write could not
 * round-trip.
 *
 * **At the file-item level that distinction is not visible to the guard.**
 * {@link FileTree.FileItem} implements this interface unconditionally and delegates to
 * its accessors, so `isMutableBinaryFileItem` is `true` for any `FileItem` — including
 * one backed by a text-persisting store, whose `setRawBytes` then returns a `Failure`.
 * Narrow the **accessors** with
 * {@link FileTree.isMutableBinaryAccessors | isMutableBinaryAccessors} when you need
 * the capability check to be a success guarantee.
 * @public
 */
export interface IMutableBinaryFileTreeFileItem<TCT extends string = string>
  extends IBinaryFileTreeFileItem<TCT>,
    IMutableFileTreeFileItem<TCT> {
  /**
   * Sets the raw contents of the file from bytes, with no text encoding applied.
   * @param bytes - The bytes to save.
   * @returns `Success` with the bytes that were saved, or `Failure` with an error message.
   */
  setRawBytes(bytes: Uint8Array): Result<Uint8Array>;
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
   *
   * @remarks
   * The bytes are decoded as UTF-8 with the *lenient* WHATWG default, so malformed
   * input is silently replaced with U+FFFD rather than reported. Accessors whose
   * backing store is byte-native also implement
   * {@link FileTree.IBinaryFileTreeAccessors | IBinaryFileTreeAccessors}; narrow with
   * {@link FileTree.isBinaryAccessors | isBinaryAccessors} and call
   * {@link FileTree.IBinaryFileTreeAccessors.getFileBytes | getFileBytes} to read the
   * undecoded bytes — for a strict decode that fails loudly on malformed UTF-8:
   *
   * ```ts
   * new TextDecoder('utf-8', { fatal: true }).decode(bytes)
   * ```
   *
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
   *
   * @remarks
   * The string is encoded as UTF-8. To write bytes that are not valid UTF-8, narrow
   * with {@link FileTree.isMutableBinaryAccessors | isMutableBinaryAccessors} and use
   * {@link FileTree.IMutableBinaryFileTreeAccessors.saveFileBytes | saveFileBytes} instead.
   *
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
 * Extended accessors interface for trees whose file contents can be read as raw bytes.
 *
 * @remarks
 * This is an *optional capability* — it is deliberately not part of
 * {@link FileTree.IFileTreeAccessors}, so implementations with no byte-native backing
 * store simply do not implement it and existing implementations are unaffected. Use
 * {@link FileTree.isBinaryAccessors | isBinaryAccessors} to narrow.
 * @public
 */
export interface IBinaryFileTreeAccessors<TCT extends string = string> extends IFileTreeAccessors<TCT> {
  /**
   * Gets the contents of a file in the file tree as bytes, with no text decoding applied.
   *
   * @remarks
   * The returned array must be treated as read-only — implementations are free to
   * return their internal buffer rather than a copy.
   *
   * @param path - Absolute path of the file.
   * @returns `Success` with the raw bytes of the file, or `Failure` with an error message.
   */
  getFileBytes(path: string): Result<Uint8Array>;
}

/**
 * Extended accessors interface for trees whose file contents can be both read and
 * written as raw bytes.
 *
 * @remarks
 * This is an *optional capability* — use
 * {@link FileTree.isMutableBinaryAccessors | isMutableBinaryAccessors} to narrow. Only
 * backing stores that persist bytes verbatim implement it; stores that persist text
 * (in-memory, `localStorage`, HTTP JSON transport) implement the read-only
 * {@link FileTree.IBinaryFileTreeAccessors} instead, because a byte write could not
 * round-trip.
 * @public
 */
export interface IMutableBinaryFileTreeAccessors<TCT extends string = string>
  extends IBinaryFileTreeAccessors<TCT>,
    IMutableFileTreeAccessors<TCT> {
  /**
   * Saves bytes to a file at the given path, with no text encoding applied.
   * @param path - The path of the file to save.
   * @param bytes - The bytes to save.
   * @returns `Success` with the bytes that were saved, or `Failure` with an error message.
   */
  saveFileBytes(path: string, bytes: Uint8Array): Result<Uint8Array>;
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
 * Type guard to check if accessors support reading raw bytes.
 * @param accessors - The accessors to check.
 * @returns `true` if the accessors implement {@link FileTree.IBinaryFileTreeAccessors}.
 * @public
 */
export function isBinaryAccessors<TCT extends string = string>(
  accessors: IFileTreeAccessors<TCT>
): accessors is IBinaryFileTreeAccessors<TCT> {
  const binary = accessors as IBinaryFileTreeAccessors<TCT>;
  return typeof binary.getFileBytes === 'function';
}

/**
 * Type guard to check if accessors support both reading and writing raw bytes.
 * @param accessors - The accessors to check.
 * @returns `true` if the accessors implement {@link FileTree.IMutableBinaryFileTreeAccessors}.
 * @public
 */
export function isMutableBinaryAccessors<TCT extends string = string>(
  accessors: IFileTreeAccessors<TCT>
): accessors is IMutableBinaryFileTreeAccessors<TCT> {
  const binary = accessors as IMutableBinaryFileTreeAccessors<TCT>;
  return (
    isBinaryAccessors(accessors) &&
    isMutableAccessors(accessors) &&
    typeof binary.saveFileBytes === 'function'
  );
}

/**
 * Type guard narrowing a file item to {@link FileTree.IBinaryFileTreeFileItem}.
 *
 * @remarks
 * Narrows the type; does **not** promise `getRawBytes()` will succeed.
 * {@link FileTree.FileItem} implements the interface unconditionally and delegates to
 * its accessors, so this returns `true` for any `FileItem` and the call reports a
 * non-byte-capable backing store as a `Failure`. Use
 * {@link FileTree.isBinaryAccessors | isBinaryAccessors} for a capability check that
 * is a success guarantee.
 * @param item - The file item to check.
 * @returns `true` if the item implements {@link FileTree.IBinaryFileTreeFileItem}.
 * @public
 */
export function isBinaryFileItem<TCT extends string = string>(
  item: AnyFileTreeFileItem<TCT> | FileTreeItem<TCT>
): item is IBinaryFileTreeFileItem<TCT> {
  const binary = item as IBinaryFileTreeFileItem<TCT>;
  return binary.type === 'file' && typeof binary.getRawBytes === 'function';
}

/**
 * Type guard narrowing a file item to {@link FileTree.IMutableBinaryFileTreeFileItem}.
 *
 * @remarks
 * Narrows the type; does **not** promise `setRawBytes()` will succeed — see
 * {@link FileTree.isBinaryFileItem | isBinaryFileItem}. Byte writes are supported only
 * by byte-persisting stores, and that is knowable at the accessors level: use
 * {@link FileTree.isMutableBinaryAccessors | isMutableBinaryAccessors} when the check
 * needs to be a success guarantee.
 * @param item - The file item to check.
 * @returns `true` if the item implements {@link FileTree.IMutableBinaryFileTreeFileItem}.
 * @public
 */
export function isMutableBinaryFileItem<TCT extends string = string>(
  item: AnyFileTreeFileItem<TCT> | FileTreeItem<TCT>
): item is IMutableBinaryFileTreeFileItem<TCT> {
  const binary = item as IMutableBinaryFileTreeFileItem<TCT>;
  return isBinaryFileItem(item) && isMutableFileItem(item) && typeof binary.setRawBytes === 'function';
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
