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

import JSZip from 'jszip';
import { Result, succeed, fail, captureResult, Converter, Validator, FileTree } from '@fgv/ts-utils';

/**
 * Implementation of {@link FileTree.IFileTreeFileItem} for files in a ZIP archive (browser version).
 */
export class BrowserZipFileItem implements FileTree.IFileTreeFileItem {
  /**
   * Indicates that this {@link FileTree.FileTreeItem} is a file.
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
   * The pre-loaded contents of the file.
   */
  private readonly _contents: string;

  /**
   * The ZIP file tree accessors that created this item.
   */
  private readonly _accessors: BrowserZipFileTreeAccessors;

  /**
   * Constructor for BrowserZipFileItem.
   * @param zipFilePath - The path of the file within the ZIP.
   * @param contents - The pre-loaded contents of the file.
   * @param accessors - The ZIP file tree accessors.
   */
  public constructor(zipFilePath: string, contents: string, accessors: BrowserZipFileTreeAccessors) {
    this._contents = contents;
    this._accessors = accessors;
    this.absolutePath = '/' + zipFilePath;
    this.name = accessors.getBaseName(zipFilePath);
    this.extension = accessors.getExtension(zipFilePath);
    this.baseName = accessors.getBaseName(zipFilePath, this.extension);
  }

  /**
   * Gets the contents of the file as parsed JSON.
   */
  public getContents(): Result<unknown>;
  public getContents<T>(converter: Validator<T> | Converter<T>): Result<T>;
  public getContents<T>(converter?: Validator<T> | Converter<T>): Result<T | unknown> {
    return this.getRawContents()
      .onSuccess((contents) => {
        return captureResult(() => {
          const parsed = JSON.parse(contents);
          if (converter) {
            if ('convert' in converter) {
              return converter.convert(parsed);
            } else {
              return (converter as Validator<T>).validate(parsed);
            }
          }
          return succeed(parsed);
        }).onFailure((err) => {
          return fail(`${this.absolutePath}: JSON parse error: ${err}`);
        });
      })
      .onFailure((error) => {
        return fail(`${this.absolutePath}: read raw contents failed${error}`);
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
 * Implementation of {@link FileTree.IFileTreeDirectoryItem} for directories in a ZIP archive (browser version).
 */
export class BrowserZipDirectoryItem implements FileTree.IFileTreeDirectoryItem {
  /**
   * Indicates that this {@link FileTree.FileTreeItem} is a directory.
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
  private readonly _accessors: BrowserZipFileTreeAccessors;

  /**
   * Constructor for BrowserZipDirectoryItem.
   * @param directoryPath - The path of the directory within the ZIP.
   * @param accessors - The ZIP file tree accessors.
   */
  public constructor(directoryPath: string, accessors: BrowserZipFileTreeAccessors) {
    this._accessors = accessors;
    this.absolutePath = '/' + directoryPath.replace(/\/$/, ''); // Normalize path
    this.name = accessors.getBaseName(directoryPath);
  }

  /**
   * Gets the children of the directory.
   */
  public getChildren(): Result<ReadonlyArray<FileTree.FileTreeItem>> {
    return this._accessors.getChildren(this.absolutePath);
  }
}

/**
 * File tree accessors for ZIP archives (browser version using JSZip).
 */
export class BrowserZipFileTreeAccessors implements FileTree.IFileTreeAccessors {
  /**
   * The JSZip instance containing the archive.
   */
  private readonly _zip: JSZip;

  /**
   * Optional prefix to prepend to paths.
   */
  private readonly _prefix: string;

  /**
   * Cache of all items in the ZIP for efficient lookups.
   */
  private readonly _itemCache: Map<string, FileTree.FileTreeItem> = new Map();

  /**
   * Cache of all file contents pre-loaded from the ZIP.
   */
  private readonly _fileContents: Map<string, string> = new Map();

  /**
   * Constructor for BrowserZipFileTreeAccessors.
   * @param zip - The JSZip instance.
   * @param fileContents - Pre-loaded file contents.
   * @param prefix - Optional prefix to prepend to paths.
   */
  private constructor(zip: JSZip, fileContents: Map<string, string>, prefix?: string) {
    this._zip = zip;
    this._fileContents = fileContents;
    this._prefix = prefix || '';
    this._buildItemCache();
  }

  /**
   * Creates a new BrowserZipFileTreeAccessors instance from a ZIP file buffer.
   * @param zipBuffer - The ZIP file as an ArrayBuffer or Uint8Array.
   * @param prefix - Optional prefix to prepend to paths.
   * @returns Result containing the BrowserZipFileTreeAccessors instance.
   */
  public static async fromBuffer(
    zipBuffer: ArrayBuffer | Uint8Array,
    prefix?: string
  ): Promise<Result<BrowserZipFileTreeAccessors>> {
    try {
      const zip = new JSZip();
      await zip.loadAsync(zipBuffer);
      const fileContents = new Map<string, string>();

      // Pre-load all file contents
      const promises: Promise<void>[] = [];
      zip.forEach((relativePath, zipObject) => {
        if (!zipObject.dir) {
          const promise = zipObject.async('string').then((content) => {
            fileContents.set(relativePath, content);
          });
          promises.push(promise);
        }
      });

      await Promise.all(promises);
      return succeed(new BrowserZipFileTreeAccessors(zip, fileContents, prefix));
    } catch (error) {
      return fail(`Failed to load ZIP archive: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Creates a new BrowserZipFileTreeAccessors instance from a File object (browser environment).
   * @param file - The File object containing ZIP data.
   * @param prefix - Optional prefix to prepend to paths.
   * @returns Result containing the BrowserZipFileTreeAccessors instance.
   */
  public static async fromFile(file: File, prefix?: string): Promise<Result<BrowserZipFileTreeAccessors>> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      return await BrowserZipFileTreeAccessors.fromBuffer(arrayBuffer, prefix);
    } catch (error) {
      return fail(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Builds the cache of all items in the ZIP archive.
   */
  private _buildItemCache(): void {
    const directories = new Set<string>();

    // First pass: collect all directories from file paths
    this._zip.forEach((relativePath, zipObject) => {
      if (!zipObject.dir) {
        // Extract directory path from file path
        const pathParts = relativePath.split('/');
        for (let i = 1; i < pathParts.length; i++) {
          const dirPath = pathParts.slice(0, i).join('/');
          directories.add(dirPath);
        }
      }
    });

    // Add directory items to cache
    directories.forEach((dirPath) => {
      const absolutePath = this.resolveAbsolutePath(dirPath);
      const item = new BrowserZipDirectoryItem(dirPath, this);
      this._itemCache.set(absolutePath, item);
    });

    // Add file items to cache
    this._zip.forEach((relativePath, zipObject) => {
      if (!zipObject.dir) {
        const absolutePath = this.resolveAbsolutePath(relativePath);
        const contents = this._fileContents.get(relativePath) || '';
        const item = new BrowserZipFileItem(relativePath, contents, this);
        this._itemCache.set(absolutePath, item);
      }
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
  public getItem(path: string): Result<FileTree.FileTreeItem> {
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
   * Gets the children of a directory in the file tree.
   */
  public getChildren(path: string): Result<ReadonlyArray<FileTree.FileTreeItem>> {
    const absolutePath = this.resolveAbsolutePath(path);
    const children: FileTree.FileTreeItem[] = [];

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
