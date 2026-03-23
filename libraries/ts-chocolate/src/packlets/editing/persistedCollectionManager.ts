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
 * Collection manager that automatically persists structural changes to disk.
 *
 * This is the intended storage orchestrator for all collection-level mutations.
 * All mutating operations are async and await disk sync before returning.
 *
 * @packageDocumentation
 */

import { Collections, fail, Result, succeed } from '@fgv/ts-utils';
import { CollectionId } from '../common';
import { ICollectionFileMetadata, ICollectionRuntimeMetadata, SubLibraryBase } from '../library-data';
import { CollectionManager } from './collectionManager';
import { IMergeResult, MergeConflictStrategy } from './model';
import { ISyncProvider } from './persistedEditableCollection';

/**
 * Parameters for creating a {@link PersistedCollectionManager}.
 * @typeParam TCompositeId - Composite ID type (e.g., IngredientId)
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @typeParam TItem - Item type (e.g., Ingredient)
 * @public
 */
export interface IPersistedCollectionManagerParams<
  TCompositeId extends string,
  TBaseId extends string,
  TItem
> {
  /**
   * The sub-library containing the collection data.
   */
  readonly subLibrary: SubLibraryBase<TCompositeId, TBaseId, TItem>;

  /**
   * Optional sync provider for flushing FileTree changes to disk.
   */
  readonly syncProvider?: ISyncProvider;
}

/**
 * Persistent wrapper around {@link CollectionManager} that triggers disk syncs
 * after structural mutations (create, delete, rename, merge, metadata update).
 *
 * All mutating operations are async and await disk sync before returning.
 * For read-only queries (get, getAll, exists, isMutable), synchronous pass-through
 * methods are provided.
 *
 * @typeParam TCompositeId - Composite ID type
 * @typeParam TBaseId - Base ID type
 * @typeParam TItem - Item type
 * @public
 */
export class PersistedCollectionManager<TCompositeId extends string, TBaseId extends string, TItem> {
  private readonly _manager: CollectionManager<TCompositeId, TBaseId, TItem>;
  private readonly _subLibrary: SubLibraryBase<TCompositeId, TBaseId, TItem>;
  private readonly _syncProvider: ISyncProvider | undefined;

  /**
   * Creates a new persisted collection manager.
   * @param params - Configuration parameters
   */
  public constructor(params: IPersistedCollectionManagerParams<TCompositeId, TBaseId, TItem>) {
    this._subLibrary = params.subLibrary;
    this._manager = new CollectionManager(params.subLibrary);
    this._syncProvider = params.syncProvider;
  }

  /**
   * Syncs changes to disk if a provider is configured.
   * @returns `Success<true>` if sync succeeded or no provider configured, `Failure` otherwise
   * @internal
   */
  private async _syncToDisk(): Promise<Result<true>> {
    if (!this._syncProvider) {
      return succeed(true as const);
    }
    return this._syncProvider.syncToDisk();
  }

  // ==========================================================================
  // Read-Only Operations (synchronous pass-through)
  // ==========================================================================

  /**
   * Get all collection IDs in the library.
   */
  public getAll(): ReadonlyArray<CollectionId> {
    return this._manager.getAll();
  }

  /**
   * Get metadata for a specific collection by ID.
   */
  public get(collectionId: CollectionId): Result<ICollectionRuntimeMetadata> {
    return this._manager.get(collectionId);
  }

  /**
   * Check if a collection exists.
   */
  public exists(collectionId: CollectionId): boolean {
    return this._manager.exists(collectionId);
  }

  /**
   * Check if a collection is mutable.
   */
  public isMutable(collectionId: CollectionId): Result<boolean> {
    return this._manager.isMutable(collectionId);
  }

  // ==========================================================================
  // Mutating Operations (async with disk sync)
  // ==========================================================================

  /**
   * Create a new mutable collection in memory.
   * Note: This does not create a backing file. Use {@link createWithFile} for persistence.
   */
  public create(
    collectionId: CollectionId,
    metadata: ICollectionFileMetadata
  ): Result<Collections.AggregatedResultMapEntry<CollectionId, TBaseId, TItem>> {
    return this._manager.create(collectionId, metadata);
  }

  /**
   * Create a new mutable collection with a backing YAML file on disk and sync.
   *
   * @param collectionId - ID for the new collection
   * @param metadata - Collection metadata
   * @returns Success with the collection entry, or Failure
   */
  public async createWithFile(
    collectionId: CollectionId,
    metadata: ICollectionFileMetadata
  ): Promise<
    Result<Collections.AggregatedResultMapEntry<CollectionId, TBaseId, TItem, ICollectionRuntimeMetadata>>
  > {
    const result = this._manager.createWithFile(collectionId, metadata);
    if (result.isSuccess()) {
      const syncResult = await this._syncToDisk();
      if (syncResult.isFailure()) {
        return fail(`Collection created but sync failed: ${syncResult.message}`);
      }
    }
    return result;
  }

  /**
   * Import a collection with items and metadata, then sync to disk.
   *
   * Unlike {@link createWithFile}, this accepts pre-existing items (e.g., from
   * a file import) and does not create a backing YAML file — the items are
   * added in-memory and synced via the sync provider.
   *
   * @param collectionId - ID for the new collection
   * @param items - Array of [baseId, item] entries to add
   * @param metadata - Optional runtime metadata for the collection
   * @returns Success with the collection entry, or Failure
   */
  public async importCollection(
    collectionId: CollectionId,
    items: ReadonlyArray<[string, TItem]> | undefined,
    metadata?: ICollectionRuntimeMetadata
  ): Promise<Result<CollectionId>> {
    const result = this._subLibrary.addCollectionWithItems(collectionId, items, { metadata });
    if (result.isSuccess()) {
      const syncResult = await this._syncToDisk();
      if (syncResult.isFailure()) {
        return fail(`Collection imported but sync failed: ${syncResult.message}`);
      }
    }
    return result;
  }

  /**
   * Delete a mutable collection and sync to disk.
   */
  public async delete(
    collectionId: CollectionId
  ): Promise<
    Result<Collections.AggregatedResultMapEntry<CollectionId, TBaseId, TItem, ICollectionRuntimeMetadata>>
  > {
    const result = this._manager.delete(collectionId);
    if (result.isSuccess()) {
      const syncResult = await this._syncToDisk();
      if (syncResult.isFailure()) {
        return fail(`Collection deleted but sync failed: ${syncResult.message}`);
      }
    }
    return result;
  }

  /**
   * Update collection metadata and sync to disk.
   */
  public async updateMetadata(
    collectionId: CollectionId,
    metadata: Partial<ICollectionRuntimeMetadata>
  ): Promise<Result<ICollectionRuntimeMetadata>> {
    const result = this._manager.updateMetadata(collectionId, metadata);
    if (result.isSuccess()) {
      const syncResult = await this._syncToDisk();
      if (syncResult.isFailure()) {
        return fail(`Metadata updated but sync failed: ${syncResult.message}`);
      }
    }
    return result;
  }

  /**
   * Delete an entity from its collection.
   * Note: Prefer using PersistedEditableCollection for entity mutations.
   */
  public deleteEntity(compositeId: string): Result<unknown> {
    return this._manager.deleteEntity(compositeId);
  }

  /**
   * Copy an entity to another collection.
   */
  public copyEntity(
    compositeId: string,
    targetCollectionId: CollectionId,
    newBaseId?: string
  ): Result<string> {
    return this._manager.copyEntity(compositeId, targetCollectionId, newBaseId);
  }

  /**
   * Move an entity to another collection (copy + delete).
   */
  public moveEntity(
    compositeId: string,
    targetCollectionId: CollectionId,
    newBaseId?: string
  ): Result<string> {
    return this._manager.moveEntity(compositeId, targetCollectionId, newBaseId);
  }

  /**
   * Rename a mutable collection to a new ID and sync to disk.
   */
  public async rename(
    oldCollectionId: CollectionId,
    newCollectionId: CollectionId
  ): Promise<Result<CollectionId>> {
    const result = this._manager.rename(oldCollectionId, newCollectionId);
    if (result.isSuccess()) {
      const syncResult = await this._syncToDisk();
      if (syncResult.isFailure()) {
        return fail(`Collection renamed but sync failed: ${syncResult.message}`);
      }
    }
    return result;
  }

  /**
   * Merge all items from a source collection into a target collection and sync to disk.
   */
  public async merge(
    sourceCollectionId: CollectionId,
    targetCollectionId: CollectionId,
    onConflict: MergeConflictStrategy
  ): Promise<Result<IMergeResult>> {
    const result = this._manager.merge(sourceCollectionId, targetCollectionId, onConflict);
    if (result.isSuccess()) {
      const syncResult = await this._syncToDisk();
      if (syncResult.isFailure()) {
        return fail(`Collections merged but sync failed: ${syncResult.message}`);
      }
    }
    return result;
  }
}
