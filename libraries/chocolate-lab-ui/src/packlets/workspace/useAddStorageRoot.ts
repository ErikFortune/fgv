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
 * Hook for adding a new storage root from the settings panel.
 * Loads all entity sub-libraries from the selected directory.
 * @packageDocumentation
 */

import { useCallback } from 'react';

import { type FileTree } from '@fgv/ts-json-base';
import { LibraryData } from '@fgv/ts-chocolate';
import {
  DirectoryHandleStore,
  FileApiTreeAccessors,
  safeShowDirectoryPicker,
  supportsFileSystemAccess
} from '@fgv/ts-web-extras';

import { useReactiveWorkspace, useWorkspace } from './useWorkspace';

// ============================================================================
// Public API
// ============================================================================

/**
 * Result returned by useAddStorageRoot.
 * @public
 */
export interface IAddStorageRootActions {
  /** Whether the File System Access API is available in this browser */
  readonly canAddStorageRoot: boolean;
  /** Open a directory picker and register it as a new storage root, loading all sub-libraries */
  readonly addStorageRoot: () => Promise<void>;
}

/**
 * Hook that provides an action to add a new local directory as a full storage root.
 * Unlike the sidebar's addDirectory (which loads only the active tab's sub-library),
 * this loads all entity sub-libraries from the selected directory.
 *
 * Intended for use in the settings panel.
 * @public
 */
export function useAddStorageRoot(): IAddStorageRootActions {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();

  const canAddStorageRoot = typeof window !== 'undefined' && supportsFileSystemAccess(window);

  const addStorageRoot = useCallback(async (): Promise<void> => {
    if (!canAddStorageRoot) {
      workspace.data.logger.warn('File System Access API not supported in this browser');
      return;
    }

    const dirHandle = await safeShowDirectoryPicker(window, {
      mode: 'readwrite',
      id: 'chocolate-lab-add-storage-root'
    });

    if (!dirHandle) {
      return;
    }

    const treeResult = await FileApiTreeAccessors.createPersistent(dirHandle);
    if (treeResult.isFailure()) {
      workspace.data.logger.error(`Failed to open directory: ${treeResult.message}`);
      return;
    }

    const tree = treeResult.value;
    const sourceName = dirHandle.name;
    const entities = workspace.data.entities;

    const subLibraries: Array<{ path: string; lib: LibraryData.SubLibraryBase<string, string, unknown> }> = [
      { path: LibraryData.LibraryPaths.ingredients, lib: entities.ingredients },
      { path: LibraryData.LibraryPaths.fillings, lib: entities.fillings },
      { path: LibraryData.LibraryPaths.confections, lib: entities.confections },
      { path: LibraryData.LibraryPaths.decorations, lib: entities.decorations },
      { path: LibraryData.LibraryPaths.molds, lib: entities.molds },
      { path: LibraryData.LibraryPaths.procedures, lib: entities.procedures },
      { path: LibraryData.LibraryPaths.tasks, lib: entities.tasks }
    ];

    let totalLoaded = 0;
    for (const { path, lib } of subLibraries) {
      const dirResult = tree.getDirectory(`/${path}`);
      if (dirResult.isFailure()) {
        continue;
      }
      const loadResult = lib.loadFromFileTreeSource({
        sourceName,
        directory: dirResult.value,
        load: true,
        mutable: true
      });
      if (loadResult.isSuccess()) {
        totalLoaded += loadResult.value;
      }
    }

    workspace.data.logger.info(`Loaded ${totalLoaded} collection(s) from "${sourceName}"`);

    const accessors = tree.hal;
    if ('syncToDisk' in accessors && 'isDirty' in accessors) {
      reactiveWorkspace.registerPersistentTree(sourceName, {
        tree,
        accessors: accessors as FileTree.IPersistentFileTreeAccessors,
        label: sourceName
      });
    }

    const store = new DirectoryHandleStore();
    const saveResult = await store.save(sourceName, dirHandle);
    if (saveResult.isFailure()) {
      workspace.data.logger.warn(`Failed to persist directory handle: ${saveResult.message}`);
    }

    workspace.data.clearCache();
    reactiveWorkspace.notifyChange();
  }, [canAddStorageRoot, workspace, reactiveWorkspace]);

  return { canAddStorageRoot, addStorageRoot };
}
