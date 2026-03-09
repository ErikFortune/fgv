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
 * Ingredient inventory action hooks for creating, updating, and deleting inventory entries.
 *
 * Returns composite IngredientInventoryEntryIds per the UI–Runtime boundary contract.
 * Callers look up materialized objects via `workspace.userData.ingredientInventory.get(id)`.
 *
 * @packageDocumentation
 */

import { useCallback } from 'react';

import { fail, succeed, type Result } from '@fgv/ts-utils';

import {
  type CollectionId,
  type IngredientId,
  type LocationId,
  type Measurement,
  type MeasurementUnit,
  Entities
} from '@fgv/ts-chocolate';
type IIngredientInventoryEntryEntity = Entities.Inventory.IIngredientInventoryEntryEntity;

import { useReactiveWorkspace, useWorkspace } from '../workspace';
import { useMutableCollection } from '../navigation';

// ============================================================================
// Types
// ============================================================================

type IngredientInventoryEntryId = Entities.Inventory.IngredientInventoryEntryId;
type IngredientInventoryEntryBaseId = Entities.Inventory.IngredientInventoryEntryBaseId;

/**
 * Ingredient inventory action callbacks returned by useIngredientInventoryActions.
 * @public
 */
export interface IIngredientInventoryActions {
  /**
   * Add a new ingredient inventory entry.
   * @param ingredientId - The composite IngredientId of the ingredient being inventoried
   * @param quantity - Amount on hand
   * @param unit - Optional measurement unit (defaults to 'g')
   * @param locationId - Optional storage location ID
   * @returns Result with the composite IngredientInventoryEntryId
   */
  readonly addEntry: (
    ingredientId: IngredientId,
    quantity: Measurement,
    unit?: MeasurementUnit,
    locationId?: LocationId
  ) => Promise<Result<IngredientInventoryEntryId>>;

  /**
   * Update an existing ingredient inventory entry.
   * @param entryId - The composite IngredientInventoryEntryId to update
   * @param entity - The updated entity data
   * @returns Result with the composite IngredientInventoryEntryId
   */
  readonly updateEntry: (
    entryId: IngredientInventoryEntryId,
    entity: IIngredientInventoryEntryEntity
  ) => Promise<Result<IngredientInventoryEntryId>>;

  /**
   * Delete an ingredient inventory entry.
   * @param entryId - The composite IngredientInventoryEntryId to delete
   * @returns Result with the removed entity
   */
  readonly deleteEntry: (
    entryId: IngredientInventoryEntryId
  ) => Promise<Result<IIngredientInventoryEntryEntity>>;

  /**
   * Check if an inventory entry already exists for a given ingredient.
   * @param ingredientId - The composite IngredientId to check
   * @returns True if an inventory entry exists
   */
  readonly hasForIngredient: (ingredientId: IngredientId) => boolean;

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
 * Provides ingredient inventory action callbacks wired to the workspace.
 *
 * Actions create/update/delete inventory entries through the entity library
 * and trigger workspace cache invalidation + reactive notification after mutations.
 *
 * @public
 */
export function useIngredientInventoryActions(): IIngredientInventoryActions {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();

  const defaultCollectionId = useMutableCollection(
    workspace.userData.entities.ingredientInventory.collections,
    [workspace, reactiveWorkspace.version]
  );

  /**
   * Ensures a mutable ingredient inventory collection exists, creating one if necessary.
   */
  const ensureCollectionId = useCallback((): Result<CollectionId> => {
    if (defaultCollectionId) {
      return succeed(defaultCollectionId);
    }

    const ingredientInventory = workspace.userData.entities.ingredientInventory;
    const collectionId = 'ingredient-inventory';
    const sourceName = ingredientInventory.mutableSourceName ?? 'localStorage';

    const createResult = ingredientInventory.addCollectionWithItems(collectionId, undefined, {
      metadata: { sourceName, name: 'Ingredient Inventory' }
    });
    if (createResult.isFailure()) {
      return fail(`Failed to create ingredient inventory collection: ${createResult.message}`);
    }

    const fileResult = ingredientInventory.createCollectionFile(createResult.value, '{}\n', 'yaml');
    if (fileResult.isFailure()) {
      workspace.data.logger.info(
        `Collection '${collectionId}' created in-memory (persistence failed: ${fileResult.message})`
      );
    }

    workspace.data.clearCache();
    reactiveWorkspace.notifyChange();
    workspace.data.logger.info(`Created ingredient inventory collection '${collectionId}'`);
    return succeed(createResult.value);
  }, [workspace, reactiveWorkspace, defaultCollectionId]);

  /**
   * Gets the persisted collection wrapper for the given collection ID.
   */
  const getPersistedCollection = useCallback(
    (collectionId: CollectionId) => {
      return workspace.userData.entities.getPersistedIngredientInventoryCollection(collectionId);
    },
    [workspace]
  );

  const addEntry = useCallback(
    async (
      ingredientId: IngredientId,
      quantity: Measurement,
      unit?: MeasurementUnit,
      locationId?: LocationId
    ): Promise<Result<IngredientInventoryEntryId>> => {
      const collectionResult = ensureCollectionId();
      if (collectionResult.isFailure()) {
        return fail(collectionResult.message);
      }
      const collectionId = collectionResult.value;

      const persistedResult = getPersistedCollection(collectionId);
      if (persistedResult.isFailure()) {
        return fail(persistedResult.message);
      }
      const persisted = persistedResult.value;

      // Generate a base ID from the ingredient ID, with suffix to avoid collisions
      const ingredientBaseId = ingredientId.includes('.')
        ? ingredientId.split('.').slice(1).join('.')
        : ingredientId;
      let baseId = `inv-${ingredientBaseId}` as IngredientInventoryEntryBaseId;
      const ingredientInventory = workspace.userData.entities.ingredientInventory;

      let suffix = 2;
      const compositeExists = (bid: string): boolean => {
        const cid = `${collectionId}.${bid}`;
        for (const [id] of ingredientInventory.entries()) {
          if (id === cid) return true;
        }
        return false;
      };
      while (compositeExists(baseId)) {
        baseId = `inv-${ingredientBaseId}-${suffix}` as IngredientInventoryEntryBaseId;
        suffix++;
      }

      const entity: IIngredientInventoryEntryEntity = {
        inventoryType: 'ingredient',
        ingredientId,
        quantity,
        ...(unit ? { unit } : {}),
        ...(locationId ? { locationId } : {})
      };

      const result = await persisted.addItem(baseId, entity);
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to add ingredient inventory entry: ${result.message}`);
        return fail(result.message);
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      workspace.data.logger.info(`Added ingredient inventory entry '${result.value}'`);
      return succeed(result.value as IngredientInventoryEntryId);
    },
    [workspace, reactiveWorkspace, ensureCollectionId, getPersistedCollection]
  );

  const updateEntry = useCallback(
    async (
      entryId: IngredientInventoryEntryId,
      entity: IIngredientInventoryEntryEntity
    ): Promise<Result<IngredientInventoryEntryId>> => {
      const dotIndex = entryId.indexOf('.');
      if (dotIndex < 0) {
        return fail(`Invalid composite inventory entry ID: ${entryId}`);
      }
      const collectionId = entryId.substring(0, dotIndex) as CollectionId;
      const baseId = entryId.substring(dotIndex + 1) as IngredientInventoryEntryBaseId;

      const persistedResult = getPersistedCollection(collectionId);
      if (persistedResult.isFailure()) {
        return fail(persistedResult.message);
      }

      const result = await persistedResult.value.upsertItem(baseId, entity);
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to update ingredient inventory entry: ${result.message}`);
        return fail(result.message);
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      workspace.data.logger.info(`Updated ingredient inventory entry '${entryId}'`);
      return succeed(result.value as IngredientInventoryEntryId);
    },
    [workspace, reactiveWorkspace, getPersistedCollection]
  );

  const deleteEntry = useCallback(
    async (entryId: IngredientInventoryEntryId): Promise<Result<IIngredientInventoryEntryEntity>> => {
      const dotIndex = entryId.indexOf('.');
      if (dotIndex < 0) {
        return fail(`Invalid composite inventory entry ID: ${entryId}`);
      }
      const collectionId = entryId.substring(0, dotIndex) as CollectionId;
      const baseId = entryId.substring(dotIndex + 1) as IngredientInventoryEntryBaseId;

      const persistedResult = getPersistedCollection(collectionId);
      if (persistedResult.isFailure()) {
        return fail(persistedResult.message);
      }

      const result = await persistedResult.value.removeItem(baseId);
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to delete ingredient inventory entry: ${result.message}`);
        return result;
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      workspace.data.logger.info(`Deleted ingredient inventory entry '${entryId}'`);
      return result;
    },
    [workspace, reactiveWorkspace, getPersistedCollection]
  );

  const hasForIngredient = useCallback(
    (ingredientId: IngredientId): boolean => {
      return workspace.userData.entities.ingredientInventory.hasForIngredient(ingredientId);
    },
    [workspace]
  );

  return {
    addEntry,
    updateEntry,
    deleteEntry,
    hasForIngredient,
    defaultCollectionId
  };
}
