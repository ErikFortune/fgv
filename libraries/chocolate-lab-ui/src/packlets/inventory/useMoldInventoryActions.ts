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

/**
 * Mold inventory action hooks for creating, updating, and deleting inventory entries.
 *
 * Returns composite MoldInventoryEntryIds per the UI–Runtime boundary contract.
 * Callers look up materialized objects via `workspace.userData.moldInventory.get(id)`.
 *
 * @packageDocumentation
 */

import { useCallback } from 'react';

import { fail, succeed, type Result } from '@fgv/ts-utils';

import {
  type CollectionId,
  Converters as ChocolateConverters,
  type LocationId,
  type MoldId,
  Entities
} from '@fgv/ts-chocolate';

/** Pre-validated well-known collection ID for mold inventory. */
const MOLD_INVENTORY_COLLECTION_ID: CollectionId = ChocolateConverters.collectionId
  .convert('mold-inventory')
  .orThrow();
type IMoldInventoryEntryEntity = Entities.Inventory.IMoldInventoryEntryEntity;

import { useReactiveWorkspace, useWorkspace } from '../workspace';
import { useMutableCollection } from '../navigation';

// ============================================================================
// Types
// ============================================================================

type MoldInventoryEntryId = Entities.Inventory.MoldInventoryEntryId;
type MoldInventoryEntryBaseId = Entities.Inventory.MoldInventoryEntryBaseId;

/**
 * Mold inventory action callbacks returned by useMoldInventoryActions.
 * @public
 */
export interface IMoldInventoryActions {
  /**
   * Add a new mold inventory entry.
   * @param moldId - The composite MoldId of the mold being inventoried
   * @param count - Number of this mold owned
   * @param locationId - Optional storage location ID
   * @returns Result with the composite MoldInventoryEntryId
   */
  readonly addEntry: (
    moldId: MoldId,
    count: number,
    locationId?: LocationId
  ) => Promise<Result<MoldInventoryEntryId>>;

  /**
   * Update an existing mold inventory entry.
   * @param entryId - The composite MoldInventoryEntryId to update
   * @param entity - The updated entity data
   * @returns Result with the composite MoldInventoryEntryId
   */
  readonly updateEntry: (
    entryId: MoldInventoryEntryId,
    entity: IMoldInventoryEntryEntity
  ) => Promise<Result<MoldInventoryEntryId>>;

  /**
   * Delete a mold inventory entry.
   * @param entryId - The composite MoldInventoryEntryId to delete
   * @returns Result with the removed entity
   */
  readonly deleteEntry: (entryId: MoldInventoryEntryId) => Promise<Result<IMoldInventoryEntryEntity>>;

  /**
   * Check if an inventory entry already exists for a given mold.
   * @param moldId - The composite MoldId to check
   * @returns True if an inventory entry exists
   */
  readonly hasForMold: (moldId: MoldId) => boolean;

  /**
   * The default mutable collection ID for new inventory entries.
   * Undefined if no mutable collection exists.
   */
  readonly defaultCollectionId: CollectionId | undefined;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Provides mold inventory action callbacks wired to the workspace.
 *
 * Actions create/update/delete inventory entries through the entity library
 * and trigger workspace cache invalidation + reactive notification after mutations.
 *
 * @public
 */
export function useMoldInventoryActions(): IMoldInventoryActions {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();

  const defaultCollectionId = useMutableCollection(workspace.userData.entities.moldInventory.collections, [
    workspace,
    reactiveWorkspace.version
  ]);

  /**
   * Ensures a mutable mold inventory collection exists, creating one if necessary.
   *
   * Follows the same pattern as `useCollectionActions.createCollection`.
   */
  const ensureCollectionId = useCallback(async (): Promise<Result<CollectionId>> => {
    if (defaultCollectionId) {
      return succeed(defaultCollectionId);
    }

    const moldInventory = workspace.userData.entities.moldInventory;
    const collectionId = MOLD_INVENTORY_COLLECTION_ID;

    const manager = workspace.userData.entities.getCollectionManager(moldInventory);
    const createResult = await manager.createWithFile(collectionId, {
      name: 'Mold Inventory'
    });

    if (createResult.isFailure()) {
      return fail(`Failed to create mold inventory collection: ${createResult.message}`);
    }

    workspace.data.clearCache();
    reactiveWorkspace.notifyChange();
    workspace.data.logger.info(`Created mold inventory collection '${collectionId}'`);
    return succeed(collectionId);
  }, [workspace, reactiveWorkspace, defaultCollectionId]);

  /**
   * Gets the persisted collection wrapper for the given collection ID.
   * This provides domain-aware mutations with automatic persistence.
   */
  const getPersistedCollection = useCallback(
    (collectionId: CollectionId) => {
      return workspace.userData.entities.getPersistedMoldInventoryCollection(collectionId);
    },
    [workspace]
  );

  const addEntry = useCallback(
    async (moldId: MoldId, count: number, locationId?: LocationId): Promise<Result<MoldInventoryEntryId>> => {
      const collectionResult = await ensureCollectionId();
      if (collectionResult.isFailure()) {
        return fail(collectionResult.message);
      }
      const collectionId = collectionResult.value;

      const persistedResult = getPersistedCollection(collectionId);
      if (persistedResult.isFailure()) {
        return fail(persistedResult.message);
      }
      const persisted = persistedResult.value;

      // Generate a base ID from the mold ID, with suffix to avoid collisions
      const moldBaseId = moldId.includes('.') ? moldId.split('.').slice(1).join('.') : moldId;
      let baseId = `inv-${moldBaseId}` as MoldInventoryEntryBaseId;
      const moldInventory = workspace.userData.entities.moldInventory;

      let suffix = 2;
      const compositeExists = (bid: string): boolean => {
        const cid = `${collectionId}.${bid}`;
        for (const [id] of moldInventory.entries()) {
          if (id === cid) return true;
        }
        return false;
      };
      while (compositeExists(baseId)) {
        baseId = `inv-${moldBaseId}-${suffix}` as MoldInventoryEntryBaseId;
        suffix++;
      }

      const entity: IMoldInventoryEntryEntity = {
        inventoryType: 'mold',
        moldId,
        count,
        ...(locationId ? { locationId } : {})
      };

      const result = await persisted.addItem(baseId, entity);
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to add mold inventory entry: ${result.message}`);
        return fail(result.message);
      }

      reactiveWorkspace.notifyChange();
      workspace.data.logger.info(`Added mold inventory entry '${result.value}'`);
      return succeed(result.value as MoldInventoryEntryId);
    },
    [workspace, reactiveWorkspace, ensureCollectionId, getPersistedCollection]
  );

  const updateEntry = useCallback(
    async (
      entryId: MoldInventoryEntryId,
      entity: IMoldInventoryEntryEntity
    ): Promise<Result<MoldInventoryEntryId>> => {
      const parsed = Entities.Inventory.Converters.parsedMoldInventoryEntryId.convert(entryId);
      if (parsed.isFailure()) {
        return fail(parsed.message);
      }
      const { collectionId, itemId } = parsed.value;

      const persistedResult = getPersistedCollection(collectionId);
      if (persistedResult.isFailure()) {
        return fail(persistedResult.message);
      }

      const result = await persistedResult.value.upsertItem(itemId, entity);
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to update mold inventory entry: ${result.message}`);
        return fail(result.message);
      }

      reactiveWorkspace.notifyChange();
      workspace.data.logger.info(`Updated mold inventory entry '${entryId}'`);
      return succeed(result.value as MoldInventoryEntryId);
    },
    [workspace, reactiveWorkspace, getPersistedCollection]
  );

  const deleteEntry = useCallback(
    async (entryId: MoldInventoryEntryId): Promise<Result<IMoldInventoryEntryEntity>> => {
      const parsed = Entities.Inventory.Converters.parsedMoldInventoryEntryId.convert(entryId);
      if (parsed.isFailure()) {
        return fail(parsed.message);
      }
      const { collectionId, itemId: baseId } = parsed.value;

      const persistedResult = getPersistedCollection(collectionId);
      if (persistedResult.isFailure()) {
        return fail(persistedResult.message);
      }

      const result = await persistedResult.value.removeItem(baseId);
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to delete mold inventory entry: ${result.message}`);
        return result;
      }

      reactiveWorkspace.notifyChange();
      workspace.data.logger.info(`Deleted mold inventory entry '${entryId}'`);
      return result;
    },
    [workspace, reactiveWorkspace, getPersistedCollection]
  );

  const hasForMold = useCallback(
    (moldId: MoldId): boolean => {
      return workspace.userData.entities.moldInventory.hasForMold(moldId);
    },
    [workspace]
  );

  return {
    addEntry,
    updateEntry,
    deleteEntry,
    hasForMold,
    defaultCollectionId
  };
}
