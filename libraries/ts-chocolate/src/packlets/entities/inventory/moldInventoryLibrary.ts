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
 * Mold inventory library for managing user mold inventory
 * @packageDocumentation
 */

import { captureResult, fail, Logging, Result, succeed } from '@fgv/ts-utils';

import { MoldId, CollectionId } from '../../common';
import {
  getMoldInventoryDirectory,
  ICollectionRuntimeMetadata,
  ISubLibraryAsyncParams,
  ISubLibraryCreateParams,
  ISubLibraryParams,
  SubLibraryBase,
  SubLibraryFileTreeSource,
  SubLibraryMergeSource
} from '../../library-data';
import { BuiltInData } from '../../built-in';
import { IMoldInventoryEntryEntity, MoldInventoryEntryBaseId, MoldInventoryEntryId } from './model';
import {
  moldInventoryEntryEntity as moldInventoryEntryConverter,
  moldInventoryEntryBaseId,
  moldInventoryEntryId,
  parsedMoldInventoryEntryId
} from './converters';
import { MoldInventoryCollectionEntryInit } from './collection';

// ============================================================================
// Re-export collection types for convenience
// ============================================================================

export {
  MoldInventoryCollectionEntry,
  MoldInventoryCollectionEntryInit,
  MoldInventoryCollectionValidator,
  MoldInventoryCollection
} from './collection';

// ============================================================================
// Parameters Interfaces
// ============================================================================

/**
 * File tree source for mold inventory data.
 * @public
 */
export type IMoldInventoryFileTreeSource = SubLibraryFileTreeSource;

/**
 * Specifies a mold inventory library to merge into a new library.
 * @public
 */
export type MoldInventoryMergeSource = SubLibraryMergeSource<MoldInventoryLibrary>;

/**
 * Parameters for creating a MoldInventoryLibrary instance synchronously.
 * @public
 */
export type IMoldInventoryLibraryParams = ISubLibraryParams<
  MoldInventoryLibrary,
  MoldInventoryCollectionEntryInit
>;

/**
 * Parameters for creating a MoldInventoryLibrary instance asynchronously with encryption support.
 * @public
 */
export type IMoldInventoryLibraryAsyncParams = ISubLibraryAsyncParams<
  MoldInventoryLibrary,
  MoldInventoryCollectionEntryInit
>;

// ============================================================================
// MoldInventoryLibrary Class
// ============================================================================

/**
 * A library for managing user {@link Entities.Inventory.IMoldInventoryEntryEntity | mold inventory entries}.
 *
 * Inventory entries track which molds the user has on hand, including quantity
 * and storage location. Each entry has its own base ID within the inventory collection,
 * and contains a `moldId` field with the composite MoldId of the mold being inventoried.
 *
 * Provides:
 * - Multi-collection storage with FileTree persistence
 * - Direct lookup by mold ID (searches entries by their moldId field)
 * - CRUD operations for inventory entries
 *
 * @public
 */
export class MoldInventoryLibrary extends SubLibraryBase<
  MoldInventoryEntryId,
  MoldInventoryEntryBaseId,
  IMoldInventoryEntryEntity
> {
  private constructor(params?: IMoldInventoryLibraryParams) {
    super({
      itemIdConverter: moldInventoryEntryBaseId,
      itemConverter: moldInventoryEntryConverter,
      directoryNavigator: getMoldInventoryDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params
    });
  }

  /**
   * Creates a new {@link Entities.Inventory.MoldInventoryLibrary | MoldInventoryLibrary} instance.
   * @param params - Optional {@link Entities.Inventory.IMoldInventoryLibraryParams | creation parameters}
   * @returns `Success` with new instance, or `Failure` with error message
   * @public
   */
  public static create(params?: IMoldInventoryLibraryParams): Result<MoldInventoryLibrary> {
    return captureResult(() => new MoldInventoryLibrary(params));
  }

  /**
   * Creates a MoldInventoryLibrary instance asynchronously with encrypted file support.
   * @param params - {@link Entities.Inventory.IMoldInventoryLibraryAsyncParams | Async creation parameters}
   * @returns Promise resolving to Success with new instance, or Failure
   * @public
   */
  public static async createAsync(
    params?: IMoldInventoryLibraryAsyncParams
  ): Promise<Result<MoldInventoryLibrary>> {
    /* c8 ignore next 1 - default fallback to empty params */
    params = params ?? {};
    const logger = Logging.LogReporter.createDefault(params.logger).orThrow();

    const createParams: ISubLibraryCreateParams<
      MoldInventoryLibrary,
      MoldInventoryEntryBaseId,
      IMoldInventoryEntryEntity
    > = {
      itemIdConverter: moldInventoryEntryBaseId,
      itemConverter: moldInventoryEntryConverter,
      directoryNavigator: getMoldInventoryDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params,
      logger
    };

    const loadResult = (await SubLibraryBase.loadAllCollectionsAsync(createParams)).report(logger);
    return loadResult.onSuccess((loaded) =>
      MoldInventoryLibrary.create({
        ...params,
        builtin: false,
        fileSources: undefined,
        collections: loaded.collections,
        protectedCollections: loaded.protectedCollections
      })
    );
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  /**
   * Gets the inventory entry for a specific mold by searching all entries.
   * @param moldId - The composite MoldId of the mold to look up
   * @returns Success with the inventory entry, or Failure if not found
   * @public
   */
  public getForMold(moldId: MoldId): Result<IMoldInventoryEntryEntity> {
    // Search all collections for an entry with matching moldId
    for (const [, entry] of this.entries()) {
      if (entry.moldId === moldId) {
        return succeed(entry);
      }
    }
    return fail(`No inventory entry found for mold: ${moldId}`);
  }

  /**
   * Checks if inventory exists for a specific mold.
   * @param moldId - The composite MoldId to check
   * @returns True if inventory exists
   * @public
   */
  public hasForMold(moldId: MoldId): boolean {
    return this.getForMold(moldId).isSuccess();
  }

  /**
   * Gets all inventory entries.
   * @returns Array of all mold inventory entries
   * @public
   */
  public getAllEntries(): ReadonlyArray<IMoldInventoryEntryEntity> {
    return Array.from(this.values());
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Adds a new inventory entry.
   * @param collectionId - The inventory collection to add to
   * @param entryId - The base ID for this inventory entry
   * @param entry - The inventory entry data
   * @returns Success with the composite entry ID, or Failure if add fails
   * @public
   */
  public addEntry(
    collectionId: CollectionId,
    entryId: MoldInventoryEntryBaseId,
    entry: IMoldInventoryEntryEntity
  ): Result<MoldInventoryEntryId> {
    return this.addToCollection(collectionId, entryId, entry)
      .asResult.withErrorFormat((msg) => `Failed to add mold inventory ${entryId} to ${collectionId}: ${msg}`)
      .onSuccess(() => moldInventoryEntryId.convert(`${collectionId}.${entryId}`));
  }

  /**
   * Adds or updates an inventory entry.
   * @param collectionId - The inventory collection to upsert into
   * @param entryId - The base ID for this inventory entry
   * @param entry - The inventory entry data
   * @returns Success with the composite entry ID, or Failure if upsert fails
   * @public
   */
  public upsertEntry(
    collectionId: CollectionId,
    entryId: MoldInventoryEntryBaseId,
    entry: IMoldInventoryEntryEntity
  ): Result<MoldInventoryEntryId> {
    return this.setInCollection(collectionId, entryId, entry)
      .asResult.withErrorFormat(
        (msg) => `Failed to upsert mold inventory ${entryId} in ${collectionId}: ${msg}`
      )
      .onSuccess(() => moldInventoryEntryId.convert(`${collectionId}.${entryId}`));
  }

  /**
   * Removes an inventory entry by its composite entry ID.
   * @param entryId - The composite inventory entry ID to remove
   * @returns Success with the removed entry, or Failure if not found or remove fails
   * @public
   */
  public removeEntry(entryId: MoldInventoryEntryId): Result<IMoldInventoryEntryEntity> {
    return this.get(entryId)
      .asResult.withErrorFormat((msg) => `Inventory entry ${entryId} not found: ${msg}`)
      .onSuccess((entry) => {
        const parsed = parsedMoldInventoryEntryId.convert(entryId).orThrow();
        return this.collections
          .get(parsed.collectionId)
          .asResult.withErrorFormat((msg) => `Collection ${parsed.collectionId} not found: ${msg}`)
          .onSuccess((collection) => {
            if (!collection.isMutable) {
              return fail(`Cannot remove entry from immutable collection ${parsed.collectionId}`);
            }
            return collection.items
              .delete(parsed.itemId)
              .asResult.withErrorFormat((msg) => `Failed to delete entry: ${msg}`)
              .onSuccess(() => succeed(entry));
          });
      });
  }

  /**
   * Removes an inventory entry for a specific mold.
   * Searches all collections for the entry with matching moldId.
   * @param moldId - The composite MoldId of the mold whose inventory to remove
   * @returns Success with the removed entry, or Failure if not found or remove fails
   * @public
   */
  public removeForMold(moldId: MoldId): Result<IMoldInventoryEntryEntity> {
    // Find the entry with this moldId
    for (const [compositeId, entry] of this.entries()) {
      if (entry.moldId === moldId) {
        return this.removeEntry(compositeId as MoldInventoryEntryId);
      }
    }
    return fail(`No inventory entry found for mold: ${moldId}`);
  }

  /**
   * Creates a new mutable collection for mold inventory.
   * @param collectionId - The ID for the new collection
   * @param metadata - Optional metadata for the collection
   * @returns Success with the collection ID, or Failure if creation fails
   * @public
   */
  public createCollection(
    collectionId: CollectionId,
    metadata?: ICollectionRuntimeMetadata
  ): Result<CollectionId> {
    if (this.collections.has(collectionId)) {
      return fail(`Collection ${collectionId} already exists`);
    }

    this.addCollectionEntry({
      id: collectionId,
      isMutable: true,
      items: {},
      metadata
    });

    return succeed(collectionId);
  }
}
