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
 * Hook for removing a local directory storage root from the settings panel.
 * @packageDocumentation
 */

import { useCallback } from 'react';

import { type Settings } from '@fgv/ts-chocolate';

import { createDirectoryStore } from './directoryStoreFactory';
import { useReactiveWorkspace, useWorkspace } from './useWorkspace';

// ============================================================================
// Public API
// ============================================================================

/**
 * Result returned by useRemoveStorageRoot.
 * @public
 */
export interface IRemoveStorageRootActions {
  /** Remove a local directory storage root by its id (directory name). */
  readonly removeStorageRoot: (id: string) => Promise<void>;
}

/**
 * Hook that provides an action to remove a local directory storage root.
 * Unregisters the tree from ReactiveWorkspace, removes the persisted handle,
 * unloads collections from all sub-libraries, and cleans up any
 * defaultStorageTargets settings that reference the removed root.
 *
 * Intended for use in the settings panel.
 * @public
 */
export function useRemoveStorageRoot(): IRemoveStorageRootActions {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();

  const removeStorageRoot = useCallback(
    async (id: string): Promise<void> => {
      const entities = workspace.data.entities;

      const subLibraries: ReadonlyArray<{ removeSource: (sourceName: string) => number }> = [
        entities.ingredients,
        entities.fillings,
        entities.confections,
        entities.decorations,
        entities.molds,
        entities.procedures,
        entities.tasks
      ];

      for (const lib of subLibraries) {
        lib.removeSource(id);
      }

      reactiveWorkspace.unregisterPersistentTree(id);

      const store = createDirectoryStore(workspace.configName);
      const removeResult = await store.remove(id);
      if (removeResult.isFailure()) {
        workspace.data.logger.warn(`Failed to remove persisted handle for "${id}": ${removeResult.message}`);
      }

      // Clean up any defaultStorageTargets referencing the removed root.
      // Uses updateDefaultStorageTargets which routes to the correct settings
      // file (preferences in bootstrap mode, common in legacy mode).
      const settingsManager = workspace.settings;
      if (settingsManager) {
        const resolved = settingsManager.getResolvedSettings();
        const targets = resolved.defaultStorageTargets;
        if (targets) {
          const rootId = id as Settings.StorageRootId;
          const newLibraryDefault = targets.libraryDefault === rootId ? undefined : targets.libraryDefault;
          const newUserDataDefault = targets.userDataDefault === rootId ? undefined : targets.userDataDefault;
          const existingOverrides = targets.sublibraryOverrides ?? {};
          const newOverrides: Record<string, Settings.StorageRootId> = {};
          for (const [key, val] of Object.entries(existingOverrides)) {
            if (val !== rootId) {
              newOverrides[key] = val as Settings.StorageRootId;
            }
          }
          const hasChanges =
            newLibraryDefault !== targets.libraryDefault ||
            newUserDataDefault !== targets.userDataDefault ||
            Object.keys(newOverrides).length !== Object.keys(existingOverrides).length;
          if (hasChanges) {
            settingsManager.updateDefaultStorageTargets({
              libraryDefault: newLibraryDefault,
              userDataDefault: newUserDataDefault,
              sublibraryOverrides: Object.keys(newOverrides).length > 0 ? newOverrides : undefined
            });
            settingsManager.save().catch(() => undefined);
          }
        }
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
    },
    [workspace, reactiveWorkspace]
  );

  return { removeStorageRoot };
}
