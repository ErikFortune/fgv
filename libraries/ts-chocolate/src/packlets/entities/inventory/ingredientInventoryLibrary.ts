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
 * Ingredient inventory library for managing user ingredient inventory
 * @packageDocumentation
 */

import { captureResult, fail, Logging, Result, succeed } from '@fgv/ts-utils';

import { IngredientId, CollectionId } from '../../common';
import {
  getIngredientInventoryDirectory,
  ICollectionSourceMetadata,
  ISubLibraryAsyncParams,
  ISubLibraryCreateParams,
  ISubLibraryParams,
  SubLibraryBase,
  SubLibraryFileTreeSource,
  SubLibraryMergeSource
} from '../../library-data';
import { BuiltInData } from '../../built-in';
import {
  IIngredientInventoryEntryEntity,
  IngredientInventoryEntryBaseId,
  IngredientInventoryEntryId
} from './model';
import {
  ingredientInventoryEntryEntity as ingredientInventoryEntryConverter,
  ingredientInventoryEntryBaseId,
  ingredientInventoryEntryId,
  parsedIngredientInventoryEntryId
} from './converters';
import { IngredientInventoryCollectionEntryInit } from './collection';

// ============================================================================
// Re-export collection types for convenience
// ============================================================================

export {
  IngredientInventoryCollectionEntry,
  IngredientInventoryCollectionEntryInit,
  IngredientInventoryCollectionValidator,
  IngredientInventoryCollection
} from './collection';

// ============================================================================
// Parameters Interfaces
// ============================================================================

/**
 * File tree source for ingredient inventory data.
 * @public
 */
export type IIngredientInventoryFileTreeSource = SubLibraryFileTreeSource;

/**
 * Specifies an ingredient inventory library to merge into a new library.
 * @public
 */
export type IngredientInventoryMergeSource = SubLibraryMergeSource<IngredientInventoryLibrary>;

/**
 * Parameters for creating an IngredientInventoryLibrary instance synchronously.
 * @public
 */
export type IIngredientInventoryLibraryParams = ISubLibraryParams<
  IngredientInventoryLibrary,
  IngredientInventoryCollectionEntryInit
>;

/**
 * Parameters for creating an IngredientInventoryLibrary instance asynchronously with encryption support.
 * @public
 */
export type IIngredientInventoryLibraryAsyncParams = ISubLibraryAsyncParams<
  IngredientInventoryLibrary,
  IngredientInventoryCollectionEntryInit
>;

// ============================================================================
// IngredientInventoryLibrary Class
// ============================================================================

/**
 * A library for managing user {@link Entities.Inventory.IIngredientInventoryEntryEntity | ingredient inventory entries}.
 *
 * Inventory entries track which ingredients the user has on hand, including quantity,
 * unit, and storage location. Each entry has its own base ID within the inventory collection,
 * and contains an `ingredientId` field with the composite IngredientId of the ingredient being inventoried.
 *
 * Provides:
 * - Multi-collection storage with FileTree persistence
 * - Direct lookup by ingredient ID (searches entries by their ingredientId field)
 * - CRUD operations for inventory entries
 *
 * @public
 */
export class IngredientInventoryLibrary extends SubLibraryBase<
  IngredientInventoryEntryId,
  IngredientInventoryEntryBaseId,
  IIngredientInventoryEntryEntity
> {
  private constructor(params?: IIngredientInventoryLibraryParams) {
    super({
      itemIdConverter: ingredientInventoryEntryBaseId,
      itemConverter: ingredientInventoryEntryConverter,
      directoryNavigator: getIngredientInventoryDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params
    });
  }

  /**
   * Creates a new {@link Entities.Inventory.IngredientInventoryLibrary | IngredientInventoryLibrary} instance.
   * @param params - Optional {@link Entities.Inventory.IIngredientInventoryLibraryParams | creation parameters}
   * @returns `Success` with new instance, or `Failure` with error message
   * @public
   */
  public static create(params?: IIngredientInventoryLibraryParams): Result<IngredientInventoryLibrary> {
    return captureResult(() => new IngredientInventoryLibrary(params));
  }

  /**
   * Creates an IngredientInventoryLibrary instance asynchronously with encrypted file support.
   * @param params - {@link Entities.Inventory.IIngredientInventoryLibraryAsyncParams | Async creation parameters}
   * @returns Promise resolving to Success with new instance, or Failure
   * @public
   */
  public static async createAsync(
    params?: IIngredientInventoryLibraryAsyncParams
  ): Promise<Result<IngredientInventoryLibrary>> {
    const logger = params?.logger ?? new Logging.LogReporter<unknown>();

    const createParams: ISubLibraryCreateParams<
      IngredientInventoryLibrary,
      IngredientInventoryEntryBaseId,
      IIngredientInventoryEntryEntity
    > = {
      itemIdConverter: ingredientInventoryEntryBaseId,
      itemConverter: ingredientInventoryEntryConverter,
      directoryNavigator: getIngredientInventoryDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params,
      logger
    };

    const loadResult = (await SubLibraryBase.loadAllCollectionsAsync(createParams)).report(logger);
    if (loadResult.isFailure()) {
      return fail(loadResult.message);
    }

    return captureResult(
      () =>
        new IngredientInventoryLibrary({
          ...params,
          builtin: false,
          fileSources: undefined,
          collections: loadResult.value.collections,
          protectedCollections: loadResult.value.protectedCollections
        })
    );
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  /**
   * Gets the inventory entry for a specific ingredient by searching all entries.
   * @param ingredientId - The composite IngredientId of the ingredient to look up
   * @returns Success with the inventory entry, or Failure if not found
   * @public
   */
  public getForIngredient(ingredientId: IngredientId): Result<IIngredientInventoryEntryEntity> {
    // Search all collections for an entry with matching ingredientId
    for (const [, entry] of this.entries()) {
      if (entry.ingredientId === ingredientId) {
        return succeed(entry);
      }
    }
    return fail(`No inventory entry found for ingredient: ${ingredientId}`);
  }

  /**
   * Checks if inventory exists for a specific ingredient.
   * @param ingredientId - The composite IngredientId to check
   * @returns True if inventory exists
   * @public
   */
  public hasForIngredient(ingredientId: IngredientId): boolean {
    return this.getForIngredient(ingredientId).isSuccess();
  }

  /**
   * Gets all inventory entries.
   * @returns Array of all ingredient inventory entries
   * @public
   */
  public getAllEntries(): ReadonlyArray<IIngredientInventoryEntryEntity> {
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
    entryId: IngredientInventoryEntryBaseId,
    entry: IIngredientInventoryEntryEntity
  ): Result<IngredientInventoryEntryId> {
    return this.addToCollection(collectionId, entryId, entry)
      .asResult.withErrorFormat(
        (msg) => `Failed to add ingredient inventory ${entryId} to ${collectionId}: ${msg}`
      )
      .onSuccess(() => ingredientInventoryEntryId.convert(`${collectionId}.${entryId}`));
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
    entryId: IngredientInventoryEntryBaseId,
    entry: IIngredientInventoryEntryEntity
  ): Result<IngredientInventoryEntryId> {
    return this.setInCollection(collectionId, entryId, entry)
      .asResult.withErrorFormat(
        (msg) => `Failed to upsert ingredient inventory ${entryId} in ${collectionId}: ${msg}`
      )
      .onSuccess(() => ingredientInventoryEntryId.convert(`${collectionId}.${entryId}`));
  }

  /**
   * Removes an inventory entry by its composite entry ID.
   * @param entryId - The composite inventory entry ID to remove
   * @returns Success with the removed entry, or Failure if not found or remove fails
   * @public
   */
  public removeEntry(entryId: IngredientInventoryEntryId): Result<IIngredientInventoryEntryEntity> {
    return this.get(entryId)
      .asResult.withErrorFormat((msg) => `Inventory entry ${entryId} not found: ${msg}`)
      .onSuccess((entry) => {
        const parsed = parsedIngredientInventoryEntryId.convert(entryId).orThrow();
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
   * Removes an inventory entry for a specific ingredient.
   * Searches all collections for the entry with matching ingredientId.
   * @param ingredientId - The composite IngredientId of the ingredient whose inventory to remove
   * @returns Success with the removed entry, or Failure if not found or remove fails
   * @public
   */
  public removeForIngredient(ingredientId: IngredientId): Result<IIngredientInventoryEntryEntity> {
    // Find the entry with this ingredientId
    for (const [compositeId, entry] of this.entries()) {
      if (entry.ingredientId === ingredientId) {
        return this.removeEntry(compositeId as IngredientInventoryEntryId);
      }
    }
    return fail(`No inventory entry found for ingredient: ${ingredientId}`);
  }

  /**
   * Creates a new mutable collection for ingredient inventory.
   * @param collectionId - The ID for the new collection
   * @param metadata - Optional metadata for the collection
   * @returns Success with the collection ID, or Failure if creation fails
   * @public
   */
  public createCollection(
    collectionId: CollectionId,
    metadata?: ICollectionSourceMetadata
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
