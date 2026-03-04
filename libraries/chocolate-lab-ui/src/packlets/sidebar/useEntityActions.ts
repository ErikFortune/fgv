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
 * Entity-level action hooks for delete, copy, and move operations.
 *
 * Provides callbacks wired to the workspace CollectionManager for
 * entity-level CRUD across collections, with reactive notification.
 *
 * @packageDocumentation
 */

import { useCallback } from 'react';

import { type CollectionId, Helpers, Editing } from '@fgv/ts-chocolate';

import { selectActiveTab, useNavigationStore } from '../navigation';
import { useReactiveWorkspace, useWorkspace } from '../workspace';
import { type IReferenceScanResult, EntityReferenceScanner } from '../editing';
import { getSubLibraryForTab } from './subLibraryLookup';

// ============================================================================
// Entity Actions Result
// ============================================================================

/**
 * Entity-level action callbacks returned by useEntityActions.
 * @public
 */
export interface IEntityActions {
  /**
   * Delete an entity from its collection and sync to disk.
   * @param compositeId - Composite entity ID (collectionId.baseId)
   * @returns true on success, false on failure
   */
  readonly deleteEntity: (compositeId: string) => Promise<boolean>;

  /**
   * Copy an entity to another collection and sync to disk.
   * @param compositeId - Source composite entity ID
   * @param targetCollectionId - Target collection ID
   * @param newBaseId - Optional new base ID; defaults to source base ID
   * @returns New composite ID on success, undefined on failure
   */
  readonly copyEntity: (
    compositeId: string,
    targetCollectionId: CollectionId,
    newBaseId?: string
  ) => Promise<string | undefined>;

  /**
   * Move an entity to another collection and sync to disk.
   * Does NOT update cross-entity references — callers must handle that separately.
   * @param compositeId - Source composite entity ID
   * @param targetCollectionId - Target collection ID
   * @param newBaseId - Optional new base ID; defaults to source base ID
   * @returns New composite ID on success, undefined on failure
   */
  readonly moveEntity: (
    compositeId: string,
    targetCollectionId: CollectionId,
    newBaseId?: string
  ) => Promise<string | undefined>;

  /**
   * Scan for all entities that reference the given composite ID.
   * Use before delete/move to warn the user about broken references.
   * @param compositeId - Composite entity ID to scan for references to
   * @returns Scan result with all referencing entities
   */
  readonly scanReferences: (compositeId: string) => IReferenceScanResult;

  /**
   * Export a single entity as a YAML file download.
   * @param compositeId - Composite entity ID (collectionId.baseId)
   */
  readonly exportEntity: (compositeId: string) => void;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract the collection ID prefix from a composite entity ID.
 * @param compositeId - e.g. "my-collection.my-entity"
 * @returns The collection ID portion, or undefined if the format is invalid
 */
function extractCollectionId(compositeId: string): CollectionId | undefined {
  const dotIndex = compositeId.indexOf('.');
  if (dotIndex < 1) {
    return undefined;
  }
  return compositeId.slice(0, dotIndex) as CollectionId;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Provides entity-level action callbacks wired to the workspace.
 *
 * Actions operate on the active tab's sub-library and trigger
 * workspace cache invalidation + reactive notification after mutations.
 *
 * @public
 */
export function useEntityActions(): IEntityActions {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const activeTab = useNavigationStore(selectActiveTab);

  /**
   * Persist one or more collections to disk after an in-memory mutation.
   *
   * Uses persisted collection singletons from the entity library, which
   * handle the full pipeline: re-snapshot from SubLibrary → FileTree write
   * → disk sync.
   *
   * @param subLibrary - The sub-library that was mutated. Required to
   *   disambiguate collection IDs that exist across multiple sub-libraries
   *   (e.g. "common" appears in ingredients, fillings, confections, etc.).
   * @param collectionIds - One or more collection IDs to persist.
   */
  const persistCollections = useCallback(
    async (
      subLibrary: { collections: { has(id: CollectionId): boolean } },
      ...collectionIds: CollectionId[]
    ): Promise<void> => {
      for (const collectionId of collectionIds) {
        const saveResult = await workspace.data.entities.saveCollection(
          collectionId,
          workspace.keyStore,
          subLibrary
        );
        if (saveResult.isFailure()) {
          workspace.data.logger.warn(
            `Collection '${collectionId}' not persisted (in-memory only): ${saveResult.message}`
          );
        }
      }
    },
    [workspace]
  );

  const deleteEntity = useCallback(
    async (compositeId: string): Promise<boolean> => {
      const subLibrary = getSubLibraryForTab(workspace.data.entities, workspace.userData.entities, activeTab);
      if (!subLibrary) {
        workspace.data.logger.warn(`No sub-library for tab '${activeTab}'`);
        return false;
      }

      const collectionId = extractCollectionId(compositeId);
      if (!collectionId) {
        workspace.data.logger.error(`Invalid composite ID '${compositeId}'`);
        return false;
      }

      const manager = new Editing.CollectionManager(subLibrary);
      const result = manager.deleteEntity(compositeId);
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to delete '${compositeId}': ${result.message}`);
        return false;
      }

      workspace.data.logger.info(`Deleted entity '${compositeId}'`);
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      await persistCollections(subLibrary, collectionId);
      return true;
    },
    [workspace, reactiveWorkspace, activeTab, persistCollections]
  );

  const copyEntity = useCallback(
    async (
      compositeId: string,
      targetCollectionId: CollectionId,
      newBaseId?: string
    ): Promise<string | undefined> => {
      const subLibrary = getSubLibraryForTab(workspace.data.entities, workspace.userData.entities, activeTab);
      if (!subLibrary) {
        workspace.data.logger.warn(`No sub-library for tab '${activeTab}'`);
        return undefined;
      }

      const manager = new Editing.CollectionManager(subLibrary);
      const result = manager.copyEntity(compositeId, targetCollectionId, newBaseId);
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to copy '${compositeId}': ${result.message}`);
        return undefined;
      }

      workspace.data.logger.info(`Copied '${compositeId}' → '${result.value}'`);
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      // Only the target collection was modified (item added)
      await persistCollections(subLibrary, targetCollectionId);
      return result.value;
    },
    [workspace, reactiveWorkspace, activeTab, persistCollections]
  );

  const moveEntity = useCallback(
    async (
      compositeId: string,
      targetCollectionId: CollectionId,
      newBaseId?: string
    ): Promise<string | undefined> => {
      const subLibrary = getSubLibraryForTab(workspace.data.entities, workspace.userData.entities, activeTab);
      if (!subLibrary) {
        workspace.data.logger.warn(`No sub-library for tab '${activeTab}'`);
        return undefined;
      }

      const sourceCollectionId = extractCollectionId(compositeId);
      if (!sourceCollectionId) {
        workspace.data.logger.error(`Invalid composite ID '${compositeId}'`);
        return undefined;
      }

      const manager = new Editing.CollectionManager(subLibrary);
      const result = manager.moveEntity(compositeId, targetCollectionId, newBaseId);
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to move '${compositeId}': ${result.message}`);
        return undefined;
      }

      workspace.data.logger.info(`Moved '${compositeId}' → '${result.value}'`);
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      // Both source (item removed) and target (item added) were modified
      if (sourceCollectionId === targetCollectionId) {
        await persistCollections(subLibrary, sourceCollectionId);
      } else {
        await persistCollections(subLibrary, sourceCollectionId, targetCollectionId);
      }
      return result.value;
    },
    [workspace, reactiveWorkspace, activeTab, persistCollections]
  );

  const scanReferences = useCallback(
    (compositeId: string): IReferenceScanResult => {
      const scanner = new EntityReferenceScanner(workspace.data.entities);
      return scanner.scan(compositeId);
    },
    [workspace]
  );

  const exportEntity = useCallback(
    (compositeId: string): void => {
      const subLibrary = getSubLibraryForTab(workspace.data.entities, workspace.userData.entities, activeTab);
      if (!subLibrary) {
        workspace.data.logger.warn(`No sub-library for tab '${activeTab}'`);
        return;
      }

      const [collectionId, baseId] = compositeId.split('.') as [CollectionId, string];
      const collectionResult = subLibrary.collections.get(collectionId).asResult;
      if (collectionResult.isFailure()) {
        workspace.data.logger.error(`Collection '${collectionId}' not found`);
        return;
      }

      const item = collectionResult.value.items.get(baseId);
      if (item === undefined) {
        workspace.data.logger.error(`Entity '${compositeId}' not found`);
        return;
      }

      const yamlResult = Helpers.serializeToYaml({ [baseId]: item });
      if (yamlResult.isFailure()) {
        workspace.data.logger.error(`Failed to serialize '${compositeId}': ${yamlResult.message}`);
        return;
      }

      const blob = new Blob([yamlResult.value], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${compositeId}.yaml`;
      a.click();
      URL.revokeObjectURL(url);
      workspace.data.logger.info(`Exported entity '${compositeId}'`);
    },
    [workspace, activeTab]
  );

  return {
    deleteEntity,
    copyEntity,
    moveEntity,
    scanReferences,
    exportEntity
  };
}
