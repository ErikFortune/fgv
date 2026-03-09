// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Persistent storage for FileSystemDirectoryHandle objects using IndexedDB.
 * Allows directory handles to survive page reloads without re-prompting the user.
 * @packageDocumentation
 */

import { fail, Result, succeed } from '@fgv/ts-utils';
import { createStore, del, get, keys, set } from 'idb-keyval';
import { FileSystemDirectoryHandle } from '../file-api-types';

/**
 * Default IndexedDB database name for directory handles.
 * @public
 */
export const DEFAULT_DIRECTORY_HANDLE_DB = 'chocolate-lab-storage';

/**
 * Default IndexedDB store name for directory handles.
 * @public
 */
export const DEFAULT_DIRECTORY_HANDLE_STORE = 'directory-handles';

/**
 * Manages persistence of {@link FileSystemDirectoryHandle} objects in IndexedDB.
 * Keyed by a label (typically the directory name).
 * @public
 */
export class DirectoryHandleStore {
  private readonly _store: ReturnType<typeof createStore>;

  public constructor(
    dbName: string = DEFAULT_DIRECTORY_HANDLE_DB,
    storeName: string = DEFAULT_DIRECTORY_HANDLE_STORE
  ) {
    this._store = createStore(dbName, storeName);
  }

  /**
   * Saves a directory handle to IndexedDB under the given label.
   * @param label - Key to store the handle under (typically dirHandle.name)
   * @param handle - The FileSystemDirectoryHandle to persist
   * @returns Success or Failure
   */
  public async save(label: string, handle: FileSystemDirectoryHandle): Promise<Result<void>> {
    try {
      await set(label, handle, this._store);
      return succeed(undefined);
    } catch (e) {
      return fail(`DirectoryHandleStore.save "${label}": ${String(e)}`);
    }
  }

  /**
   * Retrieves a directory handle by label.
   * @param label - Key to look up
   * @returns Success with handle (or undefined if not found), or Failure on error
   */
  public async load(label: string): Promise<Result<FileSystemDirectoryHandle | undefined>> {
    try {
      const handle = await get<FileSystemDirectoryHandle>(label, this._store);
      return succeed(handle);
    } catch (e) {
      return fail(`DirectoryHandleStore.load "${label}": ${String(e)}`);
    }
  }

  /**
   * Removes a directory handle from IndexedDB.
   * @param label - Key to remove
   * @returns Success or Failure
   */
  public async remove(label: string): Promise<Result<void>> {
    try {
      await del(label, this._store);
      return succeed(undefined);
    } catch (e) {
      return fail(`DirectoryHandleStore.remove "${label}": ${String(e)}`);
    }
  }

  /**
   * Returns all stored labels (keys).
   * @returns Success with array of labels, or Failure
   */
  public async getAllLabels(): Promise<Result<string[]>> {
    try {
      const allKeys = await keys<string>(this._store);
      return succeed(allKeys);
    } catch (e) {
      return fail(`DirectoryHandleStore.getAllLabels: ${String(e)}`);
    }
  }

  /**
   * Returns all stored handles as label/handle pairs.
   * @returns Success with array of entries, or Failure
   */
  public async getAll(): Promise<Result<Array<{ label: string; handle: FileSystemDirectoryHandle }>>> {
    const labelsResult = await this.getAllLabels();
    if (labelsResult.isFailure()) {
      return fail(labelsResult.message);
    }

    const entries: Array<{ label: string; handle: FileSystemDirectoryHandle }> = [];
    for (const label of labelsResult.value) {
      const handleResult = await this.load(label);
      if (handleResult.isFailure()) {
        return fail(handleResult.message);
      }
      if (handleResult.value !== undefined) {
        entries.push({ label, handle: handleResult.value });
      }
    }
    return succeed(entries);
  }
}
