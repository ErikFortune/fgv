// Copyright (c) 2025 Erik Fortune
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

import { FileTree, isJsonObject, type JsonObject } from '@fgv/ts-json-base';

import * as Crypto from '../crypto';
import { LocalStorageKeys, SubLibraryDataPaths, type SubLibraryStorageKey } from './model';

/**
 * Validate that a collection object has the required structure for a non-encrypted collection.
 * Encrypted collections are validated separately by the crypto module.
 * @internal
 */
function isValidCollectionStructure(contents: JsonObject): boolean {
  // Must have items object
  if (!('items' in contents) || !isJsonObject(contents.items)) {
    return false;
  }
  // Metadata is optional but must be an object if present
  if ('metadata' in contents && contents.metadata !== undefined && !isJsonObject(contents.metadata)) {
    return false;
  }
  return true;
}

/**
 * Parse raw JSON string from storage into collection files.
 * This is the core validation and transformation logic, separated from
 * storage mechanism to allow for different storage backends.
 *
 * @param rawJson - The raw JSON string from storage, or undefined if not found
 * @param dataPath - The path prefix for the data directory (e.g., '/data/ingredients')
 * @returns Array of in-memory files representing the collections
 * @public
 */
export function parseCollectionStorageData(
  rawJson: string | undefined,
  dataPath: string
): FileTree.IInMemoryFile[] {
  if (!rawJson) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (!isJsonObject(parsed)) {
      return [];
    }

    const files: FileTree.IInMemoryFile[] = [];
    for (const [collectionId, contents] of Object.entries(parsed)) {
      if (!isJsonObject(contents)) {
        continue;
      }

      // Encrypted collections have a different structure
      const isEncrypted = Crypto.isEncryptedCollectionFile(contents);
      if (!isEncrypted && !isValidCollectionStructure(contents)) {
        continue;
      }

      files.push({
        path: `${dataPath}/${collectionId}.json`,
        contents
      });
    }
    return files;
  } catch {
    return [];
  }
}

/**
 * Parse collection storage data for a specific sublibrary using standard paths.
 *
 * @param subLibrary - The sublibrary type (e.g., 'ingredients', 'fillings')
 * @param rawJson - The raw JSON string from storage, or undefined if not found
 * @returns Array of in-memory files representing the collections
 * @public
 */
export function parseSubLibraryStorageData(
  subLibrary: SubLibraryStorageKey,
  rawJson: string | undefined
): FileTree.IInMemoryFile[] {
  const dataPath = SubLibraryDataPaths[subLibrary];
  return parseCollectionStorageData(rawJson, dataPath);
}

/**
 * Get the storage key for a sublibrary
 * @param subLibrary - The sublibrary type
 * @returns The storage key string
 * @public
 */
export function getStorageKey(subLibrary: SubLibraryStorageKey): string {
  return LocalStorageKeys[subLibrary];
}

/**
 * Serialize collections for storage.
 *
 * @param collections - Record of collection ID to collection data
 * @returns JSON string suitable for storage
 * @public
 */
export function serializeCollectionsForStorage(collections: Record<string, JsonObject>): string {
  return JSON.stringify(collections);
}

/**
 * Add or update a single collection in the storage data.
 *
 * @param existingJson - The existing JSON string from storage, or undefined
 * @param collectionId - The ID of the collection to add/update
 * @param collectionData - The collection data to store
 * @returns Updated JSON string for storage
 * @public
 */
export function upsertCollectionInStorage(
  existingJson: string | undefined,
  collectionId: string,
  collectionData: JsonObject
): string {
  let existing: Record<string, JsonObject> = {};
  if (existingJson) {
    try {
      const parsed = JSON.parse(existingJson);
      if (isJsonObject(parsed)) {
        existing = parsed as Record<string, JsonObject>;
      }
    } catch {
      // Start fresh if existing data is corrupted
    }
  }
  return JSON.stringify({ ...existing, [collectionId]: collectionData });
}

/**
 * Remove a collection from the storage data.
 *
 * @param existingJson - The existing JSON string from storage
 * @param collectionId - The ID of the collection to remove
 * @returns Updated JSON string for storage, or undefined if no collections remain
 * @public
 */
export function removeCollectionFromStorage(
  existingJson: string | undefined,
  collectionId: string
): string | undefined {
  if (!existingJson) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(existingJson);
    if (!isJsonObject(parsed)) {
      return undefined;
    }
    const existing = parsed as Record<string, JsonObject>;
    delete existing[collectionId];
    const remaining = Object.keys(existing);
    return remaining.length > 0 ? JSON.stringify(existing) : undefined;
  } catch {
    return undefined;
  }
}
