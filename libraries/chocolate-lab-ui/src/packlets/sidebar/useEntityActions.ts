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

import { type CollectionId, type LibraryData, type LibraryRuntime, Editing } from '@fgv/ts-chocolate';

import { selectActiveTab, useNavigationStore } from '../navigation';
import { useReactiveWorkspace, useWorkspace } from '../workspace';
import { type IReferenceScanResult, EntityReferenceScanner } from '../editing';

// ============================================================================
// Sub-Library Accessor (maps tab → entity sub-library)
// ============================================================================

/**
 * Returns the entity-layer sub-library for a given tab.
 * @internal
 */
function getSubLibraryForTab(
  entities: LibraryRuntime.ChocolateEntityLibrary,
  tab: string
): LibraryData.SubLibraryBase<string, string, unknown> | undefined {
  switch (tab) {
    case 'ingredients':
      return entities.ingredients;
    case 'fillings':
      return entities.fillings;
    case 'confections':
      return entities.confections;
    case 'decorations':
      return entities.decorations;
    case 'molds':
      return entities.molds;
    case 'procedures':
      return entities.procedures;
    case 'tasks':
      return entities.tasks;
    default:
      return undefined;
  }
}

// ============================================================================
// Entity Actions Result
// ============================================================================

/**
 * Entity-level action callbacks returned by useEntityActions.
 * @public
 */
export interface IEntityActions {
  /**
   * Delete an entity from its collection.
   * @param compositeId - Composite entity ID (collectionId.baseId)
   * @returns true on success, false on failure
   */
  readonly deleteEntity: (compositeId: string) => boolean;

  /**
   * Copy an entity to another collection.
   * @param compositeId - Source composite entity ID
   * @param targetCollectionId - Target collection ID
   * @param newBaseId - Optional new base ID; defaults to source base ID
   * @returns New composite ID on success, undefined on failure
   */
  readonly copyEntity: (
    compositeId: string,
    targetCollectionId: CollectionId,
    newBaseId?: string
  ) => string | undefined;

  /**
   * Move an entity to another collection.
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
  ) => string | undefined;

  /**
   * Scan for all entities that reference the given composite ID.
   * Use before delete/move to warn the user about broken references.
   * @param compositeId - Composite entity ID to scan for references to
   * @returns Scan result with all referencing entities
   */
  readonly scanReferences: (compositeId: string) => IReferenceScanResult;
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

  const deleteEntity = useCallback(
    (compositeId: string): boolean => {
      const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);
      if (!subLibrary) {
        workspace.data.logger.warn(`No sub-library for tab '${activeTab}'`);
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
      return true;
    },
    [workspace, reactiveWorkspace, activeTab]
  );

  const copyEntity = useCallback(
    (compositeId: string, targetCollectionId: CollectionId, newBaseId?: string): string | undefined => {
      const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);
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
      return result.value;
    },
    [workspace, reactiveWorkspace, activeTab]
  );

  const moveEntity = useCallback(
    (compositeId: string, targetCollectionId: CollectionId, newBaseId?: string): string | undefined => {
      const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);
      if (!subLibrary) {
        workspace.data.logger.warn(`No sub-library for tab '${activeTab}'`);
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
      return result.value;
    },
    [workspace, reactiveWorkspace, activeTab]
  );

  const scanReferences = useCallback(
    (compositeId: string): IReferenceScanResult => {
      const scanner = new EntityReferenceScanner(workspace.data.entities);
      return scanner.scan(compositeId);
    },
    [workspace]
  );

  return {
    deleteEntity,
    copyEntity,
    moveEntity,
    scanReferences
  };
}
