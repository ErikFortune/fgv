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

import { unzipSync, unzip, Unzipped } from 'fflate';
import { Result, succeed, fail, captureResult, Converter, Validator } from '@fgv/ts-utils';
import { FileTree, JsonValue } from '@fgv/ts-json-base';

/**
 * Implementation of `FileTree.IFileTreeFileItem` for files in a ZIP archive.
 * @public
 */
export class ZipFileItem<TCT extends string = string> implements FileTree.IFileTreeFileItem<TCT> {
  /**
   * Indicates that this `FileTree.FileTreeItem` is a file.
   */
  public readonly type: 'file' = 'file';

  /**
   * The absolute path of the file within the ZIP archive.
   */
  public readonly absolutePath: string;

  /**
   * The name of the file
   */
  public readonly name: string;

  /**
   * The base name of the file (without extension)
   */
  public readonly baseName: string;

  /**
   * The extension of the file
   */
  public readonly extension: string;

  /**
   * The content type of the file.
   */
  public get contentType(): TCT | undefined {
    if (this._contentType === undefined && this._shouldInferContentType) {
      this._contentType = this._accessors.getFileContentType(this.absolutePath).orDefault();
      this._shouldInferContentType = false;
    }
    return this._contentType;
  }

  /**
   * The pre-loaded contents of the file.
   */
  private readonly _contents: string;

  /**
   * The ZIP file tree accessors that created this item.
   */
  private readonly _accessors: ZipFileTreeAccessors<TCT>;

  /**
   * Mutable content type of the file.
   */
  private _contentType: TCT | undefined;

  /**
   * Flag to track if content type should be inferred on first access.
   */
  private _shouldInferContentType: boolean = true;

  /**
   * Constructor for ZipFileItem.
   * @param zipFilePath - The path of the file within the ZIP.
   * @param contents - The pre-loaded contents of the file.
   * @param accessors - The ZIP file tree accessors.
   */
  public constructor(zipFilePath: string, contents: string, accessors: ZipFileTreeAccessors<TCT>) {
    this._contents = contents;
    this._accessors = accessors;
    this.absolutePath = '/' + zipFilePath;
    this.name = accessors.getBaseName(zipFilePath);
    this.extension = accessors.getExtension(zipFilePath);
    this.baseName = accessors.getBaseName(zipFilePath, this.extension);
  }

  /**
   * Sets the content type of the file.
   * @param contentType - The content type of the file.
   */
  public setContentType(contentType: TCT | undefined): void {
    this._contentType = contentType;
    this._shouldInferContentType = false;
  }

  /**
   * Gets the contents of the file as parsed JSON.
   */
  public getContents(): Result<JsonValue>;
  public getContents<T>(converter: Validator<T> | Converter<T>): Result<T>;
  public getContents<T>(converter?: Validator<T> | Converter<T>): Result<T | JsonValue> {
    return this.getRawContents()
      .onSuccess((contents) => {
        return captureResult(() => JSON.parse(contents))
          .onSuccess((parsed) => {
            if (converter) {
              return converter.convert(parsed) as Result<T | JsonValue>;
            }
            return succeed(parsed as JsonValue);
          })
          .onFailure(() => {
            return fail(`Failed to parse JSON from file: ${this.absolutePath}`);
          });
      })
      .onFailure((error) => {
        return fail(`Failed to get contents from file: ${error}`);
      });
  }

  /**
   * Gets the raw contents of the file as a string.
   */
  public getRawContents(): Result<string> {
    return succeed(this._contents);
  }
}

/**
 * Implementation of `IFileTreeDirectoryItem` for directories in a ZIP archive.
 * @public
 */
export class ZipDirectoryItem<TCT extends string = string> implements FileTree.IFileTreeDirectoryItem<TCT> {
  /**
   * Indicates that this `FileTree.FileTreeItem` is a directory.
   */
  public readonly type: 'directory' = 'directory';

  /**
   * The absolute path of the directory within the ZIP archive.
   */
  public readonly absolutePath: string;

  /**
   * The name of the directory
   */
  public readonly name: string;

  /**
   * The ZIP file tree accessors that created this item.
   */
  private readonly _accessors: ZipFileTreeAccessors<TCT>;

  /**
   * Constructor for ZipDirectoryItem.
   * @param directoryPath - The path of the directory within the ZIP.
   * @param accessors - The ZIP file tree accessors.
   */
  public constructor(directoryPath: string, accessors: ZipFileTreeAccessors<TCT>) {
    this._accessors = accessors;
    this.absolutePath = '/' + directoryPath.replace(/\/$/, ''); // Normalize path
    this.name = accessors.getBaseName(directoryPath);
  }

  /**
   * Gets the children of the directory.
   */
  public getChildren(): Result<ReadonlyArray<FileTree.FileTreeItem<TCT>>> {
    return this._accessors.getChildren(this.absolutePath);
  }
}

/**
 * File tree accessors for ZIP archives.
 * @public
 */
export class ZipFileTreeAccessors<TCT extends string = string> implements FileTree.IFileTreeAccessors<TCT> {
  /**
   * The unzipped file data.
   */
  private readonly _files: Unzipped;

  /**
   * Optional prefix to prepend to paths.
   */
  private readonly _prefix: string;

  /**
   * Content type inference function.
   */
  private readonly _inferContentType: FileTree.ContentTypeFactory<TCT>;

  /**
   * Cache of all items in the ZIP for efficient lookups.
   */
  private readonly _itemCache: Map<string, FileTree.FileTreeItem<TCT>> = new Map();

  /**
   * Constructor for ZipFileTreeAccessors.
   * @param files - The unzipped file data from fflate.
   * @param params - Optional initialization parameters.
   */
  private constructor(files: Unzipped, params?: FileTree.IFileTreeInitParams<TCT>) {
    this._files = files;
    this._prefix = params?.prefix || '';
    this._inferContentType = params?.inferContentType ?? ZipFileTreeAccessors.defaultInferContentType;
    this._buildItemCache();
  }

  /**
   * Default function to infer the content type of a file.
   * @param filePath - The path of the file.
   * @param provided - Optional supplied content type.
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
   * Creates a new ZipFileTreeAccessors instance from a ZIP file buffer (synchronous).
   * @param zipBuffer - The ZIP file as an ArrayBuffer or Uint8Array.
   * @param prefix - Optional prefix to prepend to paths.
   * @returns Result containing the ZipFileTreeAccessors instance.
   */
  public static fromBuffer<TCT extends string = string>(
    zipBuffer: ArrayBuffer | Uint8Array,
    prefix?: string
  ): Result<ZipFileTreeAccessors<TCT>>;

  /**
   * Creates a new ZipFileTreeAccessors instance from a ZIP file buffer (synchronous).
   * @param zipBuffer - The ZIP file as an ArrayBuffer or Uint8Array.
   * @param params - Optional initialization parameters.
   * @returns Result containing the ZipFileTreeAccessors instance.
   */
  public static fromBuffer<TCT extends string = string>(
    zipBuffer: ArrayBuffer | Uint8Array,
    params?: FileTree.IFileTreeInitParams<TCT>
  ): Result<ZipFileTreeAccessors<TCT>>;

  public static fromBuffer<TCT extends string = string>(
    zipBuffer: ArrayBuffer | Uint8Array,
    params?: FileTree.IFileTreeInitParams<TCT> | string
  ): Result<ZipFileTreeAccessors<TCT>> {
    try {
      /* c8 ignore next 1 - defense in depth */
      const uint8Buffer = zipBuffer instanceof Uint8Array ? zipBuffer : new Uint8Array(zipBuffer);
      const files = unzipSync(uint8Buffer);
      const normalizedParams = typeof params === 'string' ? { prefix: params } : params;
      return succeed(new ZipFileTreeAccessors<TCT>(files, normalizedParams));
    } catch (error) {
      /* c8 ignore next 1 - defensive coding: fflate always throws Error objects in practice */
      return fail(`Failed to load ZIP archive: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Creates a new ZipFileTreeAccessors instance from a ZIP file buffer (asynchronous).
   * @param zipBuffer - The ZIP file as an ArrayBuffer or Uint8Array.
   * @param prefix - Optional prefix to prepend to paths.
   * @returns Promise containing Result with the ZipFileTreeAccessors instance.
   */
  public static async fromBufferAsync<TCT extends string = string>(
    zipBuffer: ArrayBuffer | Uint8Array,
    prefix?: string
  ): Promise<Result<ZipFileTreeAccessors<TCT>>>;

  /**
   * Creates a new ZipFileTreeAccessors instance from a ZIP file buffer (asynchronous).
   * @param zipBuffer - The ZIP file as an ArrayBuffer or Uint8Array.
   * @param params - Optional initialization parameters.
   * @returns Promise containing Result with the ZipFileTreeAccessors instance.
   */
  public static async fromBufferAsync<TCT extends string = string>(
    zipBuffer: ArrayBuffer | Uint8Array,
    params?: FileTree.IFileTreeInitParams<TCT>
  ): Promise<Result<ZipFileTreeAccessors<TCT>>>;

  public static async fromBufferAsync<TCT extends string = string>(
    zipBuffer: ArrayBuffer | Uint8Array,
    params?: FileTree.IFileTreeInitParams<TCT> | string
  ): Promise<Result<ZipFileTreeAccessors<TCT>>> {
    return new Promise((resolve) => {
      try {
        /* c8 ignore next 1 - defense in depth */
        const uint8Buffer = zipBuffer instanceof Uint8Array ? zipBuffer : new Uint8Array(zipBuffer);
        unzip(uint8Buffer, (err, files) => {
          if (err) {
            resolve(fail(`Failed to load ZIP archive: ${err.message}`));
          } else {
            const normalizedParams = typeof params === 'string' ? { prefix: params } : params;
            resolve(succeed(new ZipFileTreeAccessors<TCT>(files, normalizedParams)));
          }
        });
      } catch (error) {
        /* c8 ignore next 5 - defensive coding: fflate always throws Error objects in practice */
        resolve(
          fail(`Failed to load ZIP archive: ${error instanceof Error ? error.message : String(error)}`)
        );
      }
    });
  }

  /**
   * Creates a new ZipFileTreeAccessors instance from a File object (browser environment).
   * @param file - The File object containing ZIP data.
   * @param params - Optional initialization parameters.
   * @returns Result containing the ZipFileTreeAccessors instance.
   */
  public static async fromFile<TCT extends string = string>(
    file: File,
    params?: FileTree.IFileTreeInitParams<TCT>
  ): Promise<Result<ZipFileTreeAccessors<TCT>>> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Buffer = new Uint8Array(arrayBuffer);

      return await ZipFileTreeAccessors.fromBufferAsync<TCT>(uint8Buffer, params);
    } catch (error) {
      return fail(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Builds the cache of all items in the ZIP archive.
   */
  private _buildItemCache(): void {
    const directories = new Set<string>();

    // Process all files and collect directory paths
    for (const [relativePath, fileData] of Object.entries(this._files)) {
      // Skip directories in fflate output (they have null data)
      /* c8 ignore next 5 - handles explicit directory entries from external ZIP tools (fflate doesn't create these) */
      if (fileData === null || fileData === undefined) {
        const dirPath = relativePath.replace(/\/$/, '');
        if (dirPath) {
          directories.add(dirPath);
        }
      } else {
        // Extract directory paths from file paths
        const pathParts = relativePath.split('/');
        for (let i = 1; i < pathParts.length; i++) {
          const dirPath = pathParts.slice(0, i).join('/');
          if (dirPath) {
            directories.add(dirPath);
          }
        }

        // Add the file item with its contents
        const absolutePath = this.resolveAbsolutePath(relativePath);
        const contents = new TextDecoder().decode(fileData);
        const item = new ZipFileItem<TCT>(relativePath, contents, this);
        this._itemCache.set(absolutePath, item);
      }
    }

    // Add directory items to cache
    directories.forEach((dirPath) => {
      const absolutePath = this.resolveAbsolutePath(dirPath);
      const item = new ZipDirectoryItem<TCT>(dirPath, this);
      this._itemCache.set(absolutePath, item);
    });
  }

  /**
   * Resolves paths to an absolute path.
   */
  public resolveAbsolutePath(...paths: string[]): string {
    const joinedPath = this.joinPaths(...paths);
    const prefixed = this._prefix ? this.joinPaths(this._prefix, joinedPath) : joinedPath;
    return prefixed.startsWith('/') ? prefixed : '/' + prefixed;
  }

  /**
   * Gets the extension of a path.
   */
  public getExtension(path: string): string {
    const name = this.getBaseName(path);
    const lastDotIndex = name.lastIndexOf('.');
    return lastDotIndex >= 0 ? name.substring(lastDotIndex) : '';
  }

  /**
   * Gets the base name of a path.
   */
  public getBaseName(path: string, suffix?: string): string {
    const normalizedPath = path.replace(/\/$/, ''); // Remove trailing slash
    const parts = normalizedPath.split('/');
    let baseName = parts[parts.length - 1] || '';

    if (suffix && baseName.endsWith(suffix)) {
      baseName = baseName.substring(0, baseName.length - suffix.length);
    }

    return baseName;
  }

  /**
   * Joins paths together.
   */
  public joinPaths(...paths: string[]): string {
    return paths
      .filter((p) => p && p.length > 0)
      .map((p) => p.replace(/^\/+|\/+$/g, '')) // Remove leading/trailing slashes
      .join('/')
      .replace(/\/+/g, '/'); // Normalize multiple slashes
  }

  /**
   * Gets an item from the file tree.
   */
  public getItem(path: string): Result<FileTree.FileTreeItem<TCT>> {
    const absolutePath = this.resolveAbsolutePath(path);
    const item = this._itemCache.get(absolutePath);

    if (item) {
      return succeed(item);
    }

    return fail(`Item not found: ${absolutePath}`);
  }

  /**
   * Gets the contents of a file in the file tree.
   */
  public getFileContents(path: string): Result<string> {
    return this.getItem(path).onSuccess((item) => {
      if (item.type !== 'file') {
        return fail(`Path is not a file: ${path}`);
      }
      return item.getRawContents();
    });
  }

  /**
   * Gets the content type of a file in the file tree.
   */
  public getFileContentType(path: string, provided?: string): Result<TCT | undefined> {
    // If provided contentType is given, use it directly (highest priority)
    if (provided !== undefined) {
      return succeed(provided as TCT);
    }

    // For files that exist in the ZIP, we don't store explicit contentType
    // so we always fall back to inference
    return this._inferContentType(path);
  }

  /**
   * Gets the children of a directory in the file tree.
   */
  public getChildren(path: string): Result<ReadonlyArray<FileTree.FileTreeItem<TCT>>> {
    const absolutePath = this.resolveAbsolutePath(path);
    const children: FileTree.FileTreeItem<TCT>[] = [];

    // Find all items that are direct children of this directory
    for (const [itemPath, item] of this._itemCache) {
      if (this._isDirectChild(absolutePath, itemPath)) {
        children.push(item);
      }
    }

    return succeed(children);
  }

  /**
   * Checks if childPath is a direct child of parentPath.
   */
  private _isDirectChild(parentPath: string, childPath: string): boolean {
    // Normalize paths
    const normalizedParent = parentPath.replace(/\/$/, '');
    const normalizedChild = childPath.replace(/\/$/, '');

    // Child must start with parent path
    if (!normalizedChild.startsWith(normalizedParent + '/')) {
      return false;
    }

    // Get the relative path from parent to child
    const relativePath = normalizedChild.substring(normalizedParent.length + 1);

    // Direct child means no additional slashes in the relative path
    return !relativePath.includes('/');
  }
}
