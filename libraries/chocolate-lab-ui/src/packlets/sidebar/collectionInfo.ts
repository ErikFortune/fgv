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
 * Collection info model and hook for the sidebar collection section.
 *
 * Provides per-tab collection metadata (name, item count, mutability,
 * protected status, visibility) by querying the workspace sub-libraries.
 *
 * @packageDocumentation
 */

import { useMemo, useSyncExternalStore } from 'react';

import type { LibraryData, LibraryRuntime, Settings } from '@fgv/ts-chocolate';

import {
  type AppTab,
  type ICollectionVisibility,
  isCollectionVisible,
  selectActiveTab,
  selectCurrentCollectionVisibility,
  useNavigationStore
} from '../navigation';

import { useReactiveWorkspace, useWorkspace } from '../workspace';

// ============================================================================
// Collection Info Model
// ============================================================================

/**
 * Information about a single collection for display in the sidebar.
 * @public
 */
export interface ICollectionInfo {
  /** Collection identifier */
  readonly id: string;
  /** Display name from collection metadata */
  readonly name: string | undefined;
  /** Number of items in this collection for the current tab's entity type */
  readonly itemCount: number;
  /** Whether this collection can be modified */
  readonly isMutable: boolean;
  /** Whether this collection is encrypted/protected */
  readonly isProtected: boolean;
  /** Whether the protected collection has been unlocked */
  readonly isUnlocked: boolean;
  /** Whether this collection is currently visible (not hidden by user) */
  readonly isVisible: boolean;
  /** Whether this collection is the default target for new entities in this sub-library */
  readonly isDefault: boolean;
}

// ============================================================================
// Sub-Library Accessor
// ============================================================================

/**
 * Maps a tab name to the corresponding key in IDefaultCollectionTargets.
 * @internal
 */
function getDefaultTargetKeyForTab(tab: AppTab): keyof Settings.IDefaultCollectionTargets | undefined {
  switch (tab) {
    case 'ingredients':
      return 'ingredients';
    case 'fillings':
      return 'fillings';
    case 'confections':
      return 'confections';
    case 'decorations':
      return undefined;
    case 'molds':
      return 'molds';
    case 'procedures':
      return 'procedures';
    case 'tasks':
      return 'tasks';
    default:
      return undefined;
  }
}

/**
 * Returns the entity-layer sub-library for a given tab, or undefined for
 * tabs that don't have sub-libraries (e.g., production tabs).
 * @internal
 */
function getSubLibraryForTab(
  entities: LibraryRuntime.ChocolateEntityLibrary,
  tab: AppTab
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

/**
 * Builds collection info array from a sub-library, visibility state, and default targets.
 * @internal
 */
function buildCollectionInfos(
  subLibrary: LibraryData.SubLibraryBase<string, string, unknown>,
  visibility: ICollectionVisibility,
  defaultCollectionId: string | undefined
): ReadonlyArray<ICollectionInfo> {
  const protectedIds = new Set(subLibrary.protectedCollections.map((pc) => pc.collectionId));
  const loadedCollectionIds = new Set<string>();

  const infos: ICollectionInfo[] = [];

  for (const entry of subLibrary.collections.values()) {
    loadedCollectionIds.add(entry.id);
    const metadata = entry.metadata as LibraryData.ICollectionRuntimeMetadata | undefined;
    const isProtected = protectedIds.has(entry.id) || metadata?.secretName !== undefined;

    infos.push({
      id: entry.id,
      name: metadata?.name,
      itemCount: entry.items.size,
      isMutable: entry.isMutable,
      isProtected,
      isUnlocked: isProtected ? entry.items.size > 0 : true,
      isVisible: isCollectionVisible(visibility, entry.id),
      isDefault: entry.id === defaultCollectionId
    });
  }

  // Add entries for protected collections that haven't been decrypted yet
  for (const pc of subLibrary.protectedCollections) {
    if (!loadedCollectionIds.has(pc.collectionId)) {
      infos.push({
        id: pc.collectionId,
        name: pc.description ?? pc.collectionId,
        itemCount: pc.itemCount ?? 0,
        isMutable: pc.isMutable,
        isProtected: true,
        isUnlocked: false,
        isVisible: isCollectionVisible(visibility, pc.collectionId),
        isDefault: pc.collectionId === defaultCollectionId
      });
    }
  }

  // Sort: mutable first, then alphabetical by id
  infos.sort((a, b) => {
    if (a.isMutable !== b.isMutable) {
      return a.isMutable ? -1 : 1;
    }
    return a.id.localeCompare(b.id);
  });

  return infos;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Returns collection info for the active tab's sub-library.
 *
 * Re-computes when the active tab, workspace data, or collection visibility changes.
 *
 * @returns Array of collection info objects, or empty array for tabs without sub-libraries.
 * @public
 */
export function useCollectionInfo(): ReadonlyArray<ICollectionInfo> {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const activeTab = useNavigationStore(selectActiveTab);
  const visibility = useNavigationStore(selectCurrentCollectionVisibility);

  // Subscribe to reactive version so useMemo recomputes after notifyChange()
  const version = useSyncExternalStore(reactiveWorkspace.subscribe, reactiveWorkspace.getSnapshot);

  return useMemo(() => {
    const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);
    if (!subLibrary) {
      return [];
    }
    const defaultTargetKey = getDefaultTargetKeyForTab(activeTab);
    const defaultTargets = workspace.settings?.getResolvedSettings().defaultTargets;
    const defaultCollectionId = defaultTargetKey ? defaultTargets?.[defaultTargetKey] : undefined;
    return buildCollectionInfos(subLibrary, visibility, defaultCollectionId);
  }, [workspace, activeTab, visibility, version]);
}
