/*
 * Copyright (c) 2026 Erik Fortune
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

import { DetailedResult, fail, Result, succeed, succeedWithDetail } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { isJsonObject, type JsonObject } from '@fgv/ts-json-base';

/**
 * Configuration for LocalStorageTreeAccessors.
 * @public
 */
export interface ILocalStorageTreeParams<TCT extends string = string>
  extends FileTree.IFileTreeInitParams<TCT> {
  /**
   * Map of directory path prefixes to localStorage keys.
   * Files under each prefix are stored in the corresponding localStorage key.
   * Example: \{ '/data/ingredients': 'myapp:ingredients:v1' \}
   */
  pathToKeyMap: Record<string, string>;

  /**
   * Storage instance to use. Defaults to window.localStorage.
   * Can be overridden for testing with mock storage.
   */
  storage?: Storage;

  /**
   * If true, automatically sync changes to localStorage on every modification.
   * If false (default), changes are only synced when syncToDisk() is called.
   */
  autoSync?: boolean;
}

/**
 * Browser localStorage-backed file tree accessors with persistence support.
 *
 * Maps filesystem-like directory paths to localStorage keys, where each key stores
 * multiple collections as a JSON object. This provides a general-purpose implementation
 * for browser-based file tree persistence without requiring File System Access API.
 *
 * Storage format per key: `{ "collection-id": { ...collectionData }, ... }`
 * File paths map as: `/data/ingredients/collection-id.json` → stored in key for `/data/ingredients`
 *
 * @public
 */
export class LocalStorageTreeAccessors<TCT extends string = string>
  extends FileTree.InMemoryTreeAccessors<TCT>
  implements FileTree.IPersistentFileTreeAccessors<TCT>
{
  private readonly _storage: Storage;
  private readonly _pathToKeyMap: Map<string, string>;
  private readonly _keyToPathMap: Map<string, string>;
  private readonly _dirtyFiles: Set<string>;
  private readonly _autoSync: boolean;

  /**
   * Private constructor. Use fromStorage() factory method instead.
   * @internal
   */
  private constructor(
    files: FileTree.IInMemoryFile<TCT>[],
    storage: Storage,
    pathToKeyMap: Map<string, string>,
    params?: ILocalStorageTreeParams<TCT>
  ) {
    super(files, params);
    this._storage = storage;
    this._pathToKeyMap = pathToKeyMap;
    this._keyToPathMap = new Map(Array.from(pathToKeyMap.entries()).map(([k, v]) => [v, k]));
    this._dirtyFiles = new Set();
    this._autoSync = params?.autoSync ?? false;
  }

  /**
   * Create LocalStorageTreeAccessors from browser localStorage.
   * Loads all collections from the configured storage keys.
   *
   * @param params - Configuration including path-to-key mappings
   * @returns Result containing the accessors or an error
   * @public
   */
  public static fromStorage<TCT extends string = string>(
    params: ILocalStorageTreeParams<TCT>
  ): Result<LocalStorageTreeAccessors<TCT>> {
    try {
      const storage = params.storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
      if (!storage) {
        return fail('localStorage is not available');
      }

      const pathToKeyMap = new Map(Object.entries(params.pathToKeyMap));
      const files = this._loadFromStorage<TCT>(storage, pathToKeyMap, params);

      return succeed(new LocalStorageTreeAccessors<TCT>(files, storage, pathToKeyMap, params));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return fail(`Failed to create LocalStorageTreeAccessors: ${message}`);
    }
  }

  /**
   * Load all files from localStorage based on path-to-key mappings.
   * @internal
   */
  private static _loadFromStorage<TCT extends string = string>(
    storage: Storage,
    pathToKeyMap: Map<string, string>,
    params?: ILocalStorageTreeParams<TCT>
  ): FileTree.IInMemoryFile<TCT>[] {
    const files: FileTree.IInMemoryFile<TCT>[] = [];

    for (const [dataPath, storageKey] of pathToKeyMap.entries()) {
      const rawJson = storage.getItem(storageKey);
      if (!rawJson) {
        continue;
      }

      try {
        const parsed: unknown = JSON.parse(rawJson);
        if (!isJsonObject(parsed)) {
          continue;
        }

        for (const [collectionId, contents] of Object.entries(parsed)) {
          if (!isJsonObject(contents)) {
            continue;
          }

          const filePath = this._joinPath(dataPath, `${collectionId}.json`);
          const contentType = params?.inferContentType
            ? params.inferContentType(filePath, 'application/json').orDefault()
            : undefined;

          files.push({
            path: filePath,
            contents: JSON.stringify(contents),
            contentType
          });
        }
      } catch {
        // Skip corrupted data
        continue;
      }
    }

    return files;
  }

  /**
   * Join path components, handling leading/trailing slashes.
   * @internal
   */
  private static _joinPath(base: string, name: string): string {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanName = name.startsWith('/') ? name.slice(1) : name;
    return `${cleanBase}/${cleanName}`;
  }

  /**
   * Get the storage key for a given file path.
   * @internal
   */
  private _getStorageKeyForPath(path: string): string | undefined {
    // Find the longest matching prefix
    let bestMatch: { prefix: string; key: string } | undefined;
    for (const [prefix, key] of this._pathToKeyMap.entries()) {
      if (path.startsWith(prefix)) {
        if (!bestMatch || prefix.length > bestMatch.prefix.length) {
          bestMatch = { prefix, key };
        }
      }
    }
    return bestMatch?.key;
  }

  /**
   * Get the data path prefix for a given file path.
   * @internal
   */
  private _getDataPathForPath(path: string): string | undefined {
    for (const prefix of this._pathToKeyMap.keys()) {
      if (path.startsWith(prefix)) {
        return prefix;
      }
    }
    return undefined;
  }

  /**
   * Extract collection ID from a file path.
   * Example: '/data/ingredients/my-collection.json' → 'my-collection'
   * @internal
   */
  private _getCollectionIdFromPath(path: string): string {
    const dataPath = this._getDataPathForPath(path);
    if (!dataPath) {
      return path;
    }

    const relativePath = path.slice(dataPath.length);
    const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;

    // Remove .json extension if present
    return cleanPath.endsWith('.json') ? cleanPath.slice(0, -5) : cleanPath;
  }

  /**
   * Sync a single dirty file to localStorage.
   * @internal
   */
  private _syncFile(path: string): Result<void> {
    const storageKey = this._getStorageKeyForPath(path);
    if (!storageKey) {
      return fail(`No storage key configured for path: ${path}`);
    }

    const collectionId = this._getCollectionIdFromPath(path);
    const contentsResult = this.getFileContents(path);
    if (contentsResult.isFailure()) {
      return fail(`Failed to get file contents for ${path}: ${contentsResult.message}`);
    }

    try {
      const contents = contentsResult.value;
      const collectionData: JsonObject = JSON.parse(contents);

      // Load existing data from storage
      const existingJson = this._storage.getItem(storageKey);
      let existing: Record<string, JsonObject> = {};
      if (existingJson) {
        try {
          const parsed = JSON.parse(existingJson);
          if (isJsonObject(parsed)) {
            existing = parsed as Record<string, JsonObject>;
          }
        } catch {
          // Start fresh if corrupted
        }
      }

      // Update with new collection data
      existing[collectionId] = collectionData;
      this._storage.setItem(storageKey, JSON.stringify(existing));

      return succeed(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return fail(`Failed to sync file ${path}: ${message}`);
    }
  }

  /**
   * Sync all dirty files to localStorage.
   * @returns Result indicating success or failure
   * @public
   */
  public async syncToDisk(): Promise<Result<void>> {
    if (this._dirtyFiles.size === 0) {
      return succeed(undefined);
    }

    const errors: string[] = [];
    for (const path of this._dirtyFiles) {
      const result = this._syncFile(path);
      if (result.isFailure()) {
        errors.push(result.message);
      }
    }

    if (errors.length > 0) {
      return fail(`Failed to sync ${errors.length} file(s): ${errors.join('; ')}`);
    }

    this._dirtyFiles.clear();
    return succeed(undefined);
  }

  /**
   * Check if there are unsaved changes.
   * @returns True if there are dirty files
   * @public
   */
  public isDirty(): boolean {
    return this._dirtyFiles.size > 0;
  }

  /**
   * Get list of file paths with unsaved changes.
   * @returns Array of dirty file paths
   * @public
   */
  public getDirtyPaths(): string[] {
    return Array.from(this._dirtyFiles);
  }

  /**
   * Save file contents. Marks file as dirty and optionally auto-syncs.
   * @param path - File path
   * @param contents - New file contents
   * @returns Result with the saved contents or error
   * @public
   */
  public saveFileContents(path: string, contents: string): Result<string> {
    const result = super.saveFileContents(path, contents);
    if (result.isSuccess()) {
      this._dirtyFiles.add(path);
      if (this._autoSync) {
        const syncResult = this._syncFile(path);
        if (syncResult.isSuccess()) {
          this._dirtyFiles.delete(path);
        } else {
          return fail(syncResult.message);
        }
      }
    }
    return result;
  }

  /**
   * Check if a file is mutable and return persistence detail.
   * @param path - File path to check
   * @returns DetailedResult with mutability status and 'persistent' detail if mutable
   * @public
   */
  public fileIsMutable(path: string): DetailedResult<boolean, FileTree.SaveDetail> {
    const baseResult = super.fileIsMutable(path);
    if (baseResult.isSuccess() && baseResult.value === true) {
      return succeedWithDetail(true, 'persistent');
    }
    return baseResult;
  }
}
