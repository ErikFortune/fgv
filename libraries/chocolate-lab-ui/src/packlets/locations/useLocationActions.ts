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
 * Location action hooks for creating, updating, and deleting location entities.
 *
 * Returns composite LocationIds per the UI–Runtime boundary contract.
 *
 * @packageDocumentation
 */

import { useCallback } from 'react';

import { fail, succeed, type Result } from '@fgv/ts-utils';

import {
  type BaseLocationId,
  type CollectionId,
  Converters as ChocolateConverters,
  type LocationId,
  Entities
} from '@fgv/ts-chocolate';

/** Pre-validated well-known collection ID for locations. */
const LOCATIONS_COLLECTION_ID: CollectionId = ChocolateConverters.collectionId.convert('locations').orThrow();
type ILocationEntity = Entities.Locations.ILocationEntity;

import { useReactiveWorkspace, useWorkspace } from '../workspace';
import { useMutableCollection } from '../navigation';

// ============================================================================
// Types
// ============================================================================

/**
 * Location action callbacks returned by useLocationActions.
 * @public
 */
export interface ILocationActions {
  /**
   * Add a new location.
   * @param baseId - The base ID for the new location
   * @param entity - The location entity data
   * @returns Result with the composite LocationId
   */
  readonly addLocation: (baseId: BaseLocationId, entity: ILocationEntity) => Promise<Result<LocationId>>;

  /**
   * Update an existing location.
   * @param locationId - The composite LocationId to update
   * @param entity - The updated entity data
   * @returns Result with the composite LocationId
   */
  readonly updateLocation: (locationId: LocationId, entity: ILocationEntity) => Promise<Result<LocationId>>;

  /**
   * Delete a location.
   * @param locationId - The composite LocationId to delete
   * @returns Result with the removed entity
   */
  readonly deleteLocation: (locationId: LocationId) => Promise<Result<ILocationEntity>>;

  /**
   * The default mutable collection ID for new locations.
   * Undefined if no mutable collection exists.
   */
  readonly defaultCollectionId: CollectionId | undefined;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Provides location action callbacks wired to the workspace.
 *
 * Actions create/update/delete locations through the entity library
 * and trigger workspace cache invalidation + reactive notification after mutations.
 *
 * @public
 */
export function useLocationActions(): ILocationActions {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();

  const defaultCollectionId = useMutableCollection(workspace.userData.entities.locations.collections, [
    workspace,
    reactiveWorkspace.version
  ]);

  /**
   * Ensures a mutable locations collection exists, creating one if necessary.
   */
  const ensureCollectionId = useCallback(async (): Promise<Result<CollectionId>> => {
    if (defaultCollectionId) {
      // Ensure the collection has a backing file for persistence.
      // The sidebar may have created it in-memory without a file.
      const locations = workspace.userData.entities.locations;
      if (!locations.getCollectionSourceItem(defaultCollectionId)) {
        const fileResult = locations.createCollectionFile(defaultCollectionId, '{}\n', 'yaml');
        if (fileResult.isFailure()) {
          return fail(
            `Failed to create backing file for collection '${defaultCollectionId}': ${fileResult.message}`
          );
        }
      }
      return succeed(defaultCollectionId);
    }

    const locations = workspace.userData.entities.locations;
    const collectionId = LOCATIONS_COLLECTION_ID;

    const manager = workspace.userData.entities.getCollectionManager(locations);
    const createResult = await manager.createWithFile(collectionId, {
      name: 'Locations'
    });

    if (createResult.isFailure()) {
      return fail(`Failed to create locations collection: ${createResult.message}`);
    }

    workspace.data.clearCache();
    reactiveWorkspace.notifyChange();
    workspace.data.logger.info(`Created locations collection '${collectionId}'`);
    return succeed(collectionId);
  }, [workspace, reactiveWorkspace, defaultCollectionId]);

  /**
   * Gets the persisted collection wrapper for the given collection ID.
   */
  const getPersistedCollection = useCallback(
    (collectionId: CollectionId) => {
      return workspace.userData.entities.getPersistedLocationsCollection(collectionId);
    },
    [workspace]
  );

  const addLocation = useCallback(
    async (baseId: BaseLocationId, entity: ILocationEntity): Promise<Result<LocationId>> => {
      const collectionResult = await ensureCollectionId();
      if (collectionResult.isFailure()) {
        return fail(collectionResult.message);
      }
      const collectionId = collectionResult.value;

      const persistedResult = getPersistedCollection(collectionId);
      if (persistedResult.isFailure()) {
        return fail(persistedResult.message);
      }

      const result = await persistedResult.value.addItem(baseId, entity);
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to add location: ${result.message}`);
        return fail(result.message);
      }

      reactiveWorkspace.notifyChange();
      workspace.data.logger.info(`Added location '${result.value}'`);
      return succeed(result.value as LocationId);
    },
    [workspace, reactiveWorkspace, ensureCollectionId, getPersistedCollection]
  );

  const updateLocation = useCallback(
    async (locationId: LocationId, entity: ILocationEntity): Promise<Result<LocationId>> => {
      const parsed = ChocolateConverters.parsedLocationId.convert(locationId);
      if (parsed.isFailure()) {
        return fail(parsed.message);
      }
      const { collectionId, itemId: baseId } = parsed.value;

      const persistedResult = getPersistedCollection(collectionId);
      if (persistedResult.isFailure()) {
        return fail(persistedResult.message);
      }

      const result = await persistedResult.value.upsertItem(baseId, entity);
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to update location: ${result.message}`);
        return fail(result.message);
      }

      reactiveWorkspace.notifyChange();
      workspace.data.logger.info(`Updated location '${locationId}'`);
      return succeed(result.value as LocationId);
    },
    [workspace, reactiveWorkspace, getPersistedCollection]
  );

  const deleteLocation = useCallback(
    async (locationId: LocationId): Promise<Result<ILocationEntity>> => {
      const parsed = ChocolateConverters.parsedLocationId.convert(locationId);
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
        workspace.data.logger.error(`Failed to delete location: ${result.message}`);
        return result;
      }

      reactiveWorkspace.notifyChange();
      workspace.data.logger.info(`Deleted location '${locationId}'`);
      return result;
    },
    [workspace, reactiveWorkspace, getPersistedCollection]
  );

  return {
    addLocation,
    updateLocation,
    deleteLocation,
    defaultCollectionId
  };
}
