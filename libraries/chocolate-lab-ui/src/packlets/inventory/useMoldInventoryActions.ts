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

import { type CollectionId, type MoldId, Entities } from '@fgv/ts-chocolate';
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
   * @param location - Optional storage location
   * @returns Result with the composite MoldInventoryEntryId
   */
  readonly addEntry: (
    moldId: MoldId,
    count: number,
    location?: string
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
   * Follows the same pattern as `useCollectionActions.createCollection`:
   * 1. `addCollectionWithItems` creates the in-memory collection with metadata
   * 2. `createCollectionFile` creates the backing file so persistence works
   */
  const ensureCollectionId = useCallback((): Result<CollectionId> => {
    if (defaultCollectionId) {
      return succeed(defaultCollectionId);
    }

    const moldInventory = workspace.userData.entities.moldInventory;
    const collectionId = 'mold-inventory';
    const sourceName = moldInventory.mutableSourceName ?? 'localStorage';

    // Create in-memory collection (same as useCollectionActions.createCollection)
    const createResult = moldInventory.addCollectionWithItems(collectionId, undefined, {
      metadata: { sourceName, name: 'Mold Inventory' }
    });
    if (createResult.isFailure()) {
      return fail(`Failed to create mold inventory collection: ${createResult.message}`);
    }

    // Create backing file for persistence (same as useCollectionActions.createCollection)
    const fileResult = moldInventory.createCollectionFile(createResult.value, '{}\n', 'yaml');
    if (fileResult.isFailure()) {
      workspace.data.logger.info(
        `Collection '${collectionId}' created in-memory (persistence failed: ${fileResult.message})`
      );
    }

    workspace.data.clearCache();
    reactiveWorkspace.notifyChange();
    workspace.data.logger.info(`Created mold inventory collection '${collectionId}'`);
    return succeed(createResult.value);
  }, [workspace, reactiveWorkspace, defaultCollectionId]);

  const addEntry = useCallback(
    async (moldId: MoldId, count: number, location?: string): Promise<Result<MoldInventoryEntryId>> => {
      const collectionResult = ensureCollectionId();
      if (collectionResult.isFailure()) {
        return fail(collectionResult.message);
      }
      const collectionId = collectionResult.value;

      // Generate a base ID from the mold ID, with suffix to avoid collisions
      const moldBaseId = moldId.includes('.') ? moldId.split('.').slice(1).join('.') : moldId;
      let baseId = `inv-${moldBaseId}` as MoldInventoryEntryBaseId;
      const moldInventory = workspace.userData.entities.moldInventory;

      // If an entry with this base ID already exists, append a numeric suffix
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
        ...(location ? { location } : {})
      };

      const result = moldInventory.addEntry(collectionId, baseId, entity);
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to add mold inventory entry: ${result.message}`);
        return result;
      }

      const entryId = result.value;

      // Persist
      const persistResult = await workspace.userData.entities.saveCollection(
        collectionId,
        undefined,
        moldInventory
      );
      if (persistResult.isFailure()) {
        workspace.data.logger.error(`Failed to persist mold inventory: ${persistResult.message}`);
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      workspace.data.logger.info(`Added mold inventory entry '${entryId}'`);
      return result;
    },
    [workspace, reactiveWorkspace, ensureCollectionId]
  );

  const updateEntry = useCallback(
    async (
      entryId: MoldInventoryEntryId,
      entity: IMoldInventoryEntryEntity
    ): Promise<Result<MoldInventoryEntryId>> => {
      // Parse composite ID to get collection and base
      const dotIndex = entryId.indexOf('.');
      if (dotIndex < 0) {
        return fail(`Invalid composite inventory entry ID: ${entryId}`);
      }
      const collectionId = entryId.substring(0, dotIndex) as CollectionId;
      const baseId = entryId.substring(dotIndex + 1) as MoldInventoryEntryBaseId;

      const moldInventory = workspace.userData.entities.moldInventory;
      const result = moldInventory.upsertEntry(collectionId, baseId, entity);
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to update mold inventory entry: ${result.message}`);
        return result;
      }

      // Persist
      const persistResult = await workspace.userData.entities.saveCollection(
        collectionId,
        undefined,
        moldInventory
      );
      if (persistResult.isFailure()) {
        workspace.data.logger.error(`Failed to persist mold inventory: ${persistResult.message}`);
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      workspace.data.logger.info(`Updated mold inventory entry '${entryId}'`);
      return result;
    },
    [workspace, reactiveWorkspace]
  );

  const deleteEntry = useCallback(
    async (entryId: MoldInventoryEntryId): Promise<Result<IMoldInventoryEntryEntity>> => {
      const dotIndex = entryId.indexOf('.');
      if (dotIndex < 0) {
        return fail(`Invalid composite inventory entry ID: ${entryId}`);
      }
      const collectionId = entryId.substring(0, dotIndex) as CollectionId;

      const moldInventory = workspace.userData.entities.moldInventory;
      const result = moldInventory.removeEntry(entryId);
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to delete mold inventory entry: ${result.message}`);
        return result;
      }

      // Persist
      const persistResult = await workspace.userData.entities.saveCollection(
        collectionId,
        undefined,
        moldInventory
      );
      if (persistResult.isFailure()) {
        workspace.data.logger.error(`Failed to persist mold inventory: ${persistResult.message}`);
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      workspace.data.logger.info(`Deleted mold inventory entry '${entryId}'`);
      return result;
    },
    [workspace, reactiveWorkspace]
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
