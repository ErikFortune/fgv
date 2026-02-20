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
 * Collection management action hooks for the sidebar.
 *
 * Provides callbacks for add-by-reference, create, and delete operations
 * on collections, wired to the workspace and reactive notification system.
 *
 * @packageDocumentation
 */

import { useCallback, useRef, useState } from 'react';

import { Converters as JsonConverters, type FileTree } from '@fgv/ts-json-base';
import { ZipFileTree } from '@fgv/ts-extras';
import { type CollectionId, Helpers, LibraryData, type LibraryRuntime } from '@fgv/ts-chocolate';
import {
  FileApiTreeAccessors,
  safeShowDirectoryPicker,
  safeShowOpenFilePicker,
  supportsFileSystemAccess
} from '@fgv/ts-web-extras';

import { selectActiveTab, useNavigationStore } from '../navigation';
import { useReactiveWorkspace, useWorkspace } from '../workspace';
import { type ICreateCollectionData } from './CreateCollectionDialog';
import { type ImportCollisionResolution } from './ImportCollisionDialog';

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

/**
 * Maps a tab name to the sub-library path within a library tree.
 * @internal
 */
function getSubLibraryPathForTab(tab: string): string | undefined {
  switch (tab) {
    case 'ingredients':
      return LibraryData.LibraryPaths.ingredients;
    case 'fillings':
      return LibraryData.LibraryPaths.fillings;
    case 'confections':
      return LibraryData.LibraryPaths.confections;
    case 'decorations':
      return LibraryData.LibraryPaths.decorations;
    case 'molds':
      return LibraryData.LibraryPaths.molds;
    case 'procedures':
      return LibraryData.LibraryPaths.procedures;
    case 'tasks':
      return LibraryData.LibraryPaths.tasks;
    default:
      return undefined;
  }
}

// ============================================================================
// Collection Actions Result
// ============================================================================

/**
 * Pending import state when a collection ID collision is detected.
 * @public
 */
export interface IPendingImport {
  /** The collection ID that collided */
  readonly collectionId: string;
  /** Number of items in the incoming collection */
  readonly itemCount: number;
}

/**
 * Collection management action callbacks returned by useCollectionActions.
 * @public
 */
export interface ICollectionActions {
  /** Whether the File System Access API is available */
  readonly canAddDirectory: boolean;
  /** Open a directory picker and load collections from the selected directory */
  readonly addDirectory: () => Promise<void>;
  /** Create a new empty mutable collection from dialog data */
  readonly createCollection: (data: ICreateCollectionData) => void;
  /** Delete a mutable collection by ID */
  readonly deleteCollection: (collectionId: string) => void;
  /** Export a mutable collection to a YAML file download */
  readonly exportCollection: (collectionId: string) => void;
  /** Export all mutable collections for the active tab as a zip download */
  readonly exportAllAsZip: () => void;
  /** Import a collection from a YAML/JSON file (opens file picker, in-memory only) */
  readonly importCollection: () => Promise<void>;
  /** Open a collection YAML/JSON file for in-place editing via File System Access API */
  readonly openCollectionFromFile: () => Promise<void>;
  /** Save all dirty persistent trees to disk */
  readonly saveAll: () => Promise<void>;
  /** Whether any persistent trees have unsaved changes */
  readonly hasDirtyTrees: boolean;
  /** Non-null when a collection ID collision is awaiting user resolution */
  readonly pendingImport: IPendingImport | null;
  /** Resolve a pending import collision with the user's chosen strategy */
  readonly resolveImportCollision: (resolution: ImportCollisionResolution) => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Provides collection management action callbacks wired to the workspace.
 *
 * Actions operate on the active tab's sub-library and trigger
 * workspace cache invalidation + reactive notification after mutations.
 *
 * @public
 */
export function useCollectionActions(): ICollectionActions {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const activeTab = useNavigationStore(selectActiveTab);

  const canAddDirectory = typeof window !== 'undefined' && supportsFileSystemAccess(window);

  const [pendingImport, setPendingImport] = useState<IPendingImport | null>(null);
  const collisionResolverRef = useRef<((resolution: ImportCollisionResolution) => void) | null>(null);

  const resolveImportCollision = useCallback((resolution: ImportCollisionResolution): void => {
    collisionResolverRef.current?.(resolution);
    collisionResolverRef.current = null;
    setPendingImport(null);
  }, []);

  const addDirectory = useCallback(async (): Promise<void> => {
    if (!canAddDirectory) {
      workspace.data.logger.warn('File System Access API not supported in this browser');
      return;
    }

    const dirHandle = await safeShowDirectoryPicker(window, {
      mode: 'readwrite',
      id: 'chocolate-lab-add-directory'
    });

    if (!dirHandle) {
      return; // User cancelled
    }

    // Create a persistent FileTree from the directory handle
    const treeResult = await FileApiTreeAccessors.createPersistent(dirHandle);
    if (treeResult.isFailure()) {
      workspace.data.logger.error(`Failed to open directory: ${treeResult.message}`);
      return;
    }

    const tree = treeResult.value;

    // Try to navigate to the sub-library directory for the active tab
    const subLibraryPath = getSubLibraryPathForTab(activeTab);
    const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);

    if (!subLibraryPath || !subLibrary) {
      workspace.data.logger.warn(`No sub-library for tab '${activeTab}'`);
      return;
    }

    // Try the sub-library path first (e.g., data/ingredients)
    // If that fails, try the root (user may have pointed at the sub-library dir directly)
    const dirResult = tree.getDirectory(`/${subLibraryPath}`);
    const sourceDirResult = dirResult.isSuccess() ? dirResult : tree.getDirectory('/');

    if (sourceDirResult.isFailure()) {
      workspace.data.logger.error(`Failed to find data directory: ${sourceDirResult.message}`);
      return;
    }

    const loadResult = subLibrary.loadFromFileTreeSource({
      directory: sourceDirResult.value,
      load: true,
      mutable: true
    });

    if (loadResult.isFailure()) {
      workspace.data.logger.error(`Failed to load collections: ${loadResult.message}`);
      return;
    }

    workspace.data.logger.info(`Loaded ${loadResult.value} collection(s) from directory for ${activeTab}`);

    // Register the persistent tree for dirty tracking / save-in-place
    const accessors = tree.hal;
    if ('syncToDisk' in accessors && 'isDirty' in accessors) {
      reactiveWorkspace.registerPersistentTree(dirHandle.name, {
        tree,
        accessors: accessors as FileTree.IPersistentFileTreeAccessors,
        label: dirHandle.name
      });
    }

    // Invalidate caches and notify React
    workspace.data.clearCache();
    reactiveWorkspace.notifyChange();
  }, [canAddDirectory, workspace, reactiveWorkspace, activeTab]);

  const createCollection = useCallback(
    (data: ICreateCollectionData): void => {
      const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);
      if (!subLibrary) {
        workspace.data.logger.warn(`No sub-library for tab '${activeTab}'`);
        return;
      }

      const metadata: LibraryData.ICollectionSourceMetadata = {
        name: data.name,
        ...(data.description ? { description: data.description } : {}),
        ...(data.tags && data.tags.length > 0 ? { tags: data.tags } : {})
      };

      const result = subLibrary.addCollectionWithItems(data.id, undefined, { metadata });
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to create collection '${data.id}': ${result.message}`);
        return;
      }

      // Build YAML content with metadata block
      const yamlContent = buildCollectionYaml(data);
      const fileResult = subLibrary.createCollectionFile(result.value as CollectionId, yamlContent);
      if (fileResult.isFailure()) {
        workspace.data.logger.info(
          `Collection '${data.id}' created in-memory (persistence failed: ${fileResult.message})`
        );
      } else {
        workspace.data.logger.info(`Collection '${data.id}' created with backing file`);
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
    },
    [workspace, reactiveWorkspace, activeTab]
  );

  const deleteCollection = useCallback(
    (collectionId: string): void => {
      const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);
      if (!subLibrary) {
        return;
      }

      // Use CollectionManager pattern: check mutability, then delete
      const isMutableResult = subLibrary.collections.get(collectionId as CollectionId).asResult;

      if (isMutableResult.isFailure()) {
        workspace.data.logger.error(`Collection '${collectionId}' not found`);
        return;
      }

      if (!isMutableResult.value.isMutable) {
        workspace.data.logger.warn(`Collection '${collectionId}' is immutable and cannot be deleted`);
        return;
      }

      const deleteResult = subLibrary.removeCollection(collectionId as CollectionId);
      if (deleteResult.isFailure()) {
        workspace.data.logger.error(`Failed to delete collection '${collectionId}': ${deleteResult.message}`);
        return;
      }

      workspace.data.logger.info(`Deleted collection '${collectionId}'`);
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
    },
    [workspace, reactiveWorkspace, activeTab]
  );

  const exportCollection = useCallback(
    (collectionId: string): void => {
      const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);
      if (!subLibrary) {
        workspace.data.logger.warn(`No sub-library for tab '${activeTab}'`);
        return;
      }

      const collectionResult = subLibrary.collections.get(collectionId as CollectionId).asResult;
      if (collectionResult.isFailure()) {
        workspace.data.logger.error(`Collection '${collectionId}' not found`);
        return;
      }

      const collection = collectionResult.value;
      const yamlResult = Helpers.serializeToYaml({
        metadata: collection.metadata ?? {},
        items: Object.fromEntries(collection.items.entries())
      });

      if (yamlResult.isFailure()) {
        workspace.data.logger.error(
          `Failed to serialize collection '${collectionId}': ${yamlResult.message}`
        );
        return;
      }

      const blob = new Blob([yamlResult.value], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collectionId}.yaml`;
      a.click();
      URL.revokeObjectURL(url);
      workspace.data.logger.info(`Exported collection '${collectionId}'`);
    },
    [workspace, activeTab]
  );

  const exportAllAsZip = useCallback((): void => {
    const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);
    if (!subLibrary) {
      workspace.data.logger.warn(`No sub-library for tab '${activeTab}'`);
      return;
    }

    const files: Array<{ path: string; contents: string }> = [];
    for (const [id, collection] of subLibrary.collections.entries()) {
      if (!collection.isMutable) continue;
      const yamlResult = Helpers.serializeToYaml({
        metadata: collection.metadata ?? {},
        items: Object.fromEntries(collection.items.entries())
      });
      if (yamlResult.isSuccess()) {
        files.push({ path: `${id}.yaml`, contents: yamlResult.value });
      } else {
        workspace.data.logger.warn(`Skipping collection '${id}': ${yamlResult.message}`);
      }
    }

    if (files.length === 0) {
      workspace.data.logger.warn('No mutable collections to export');
      return;
    }

    const zipResult = ZipFileTree.createZipFromTextFiles(files);
    if (zipResult.isFailure()) {
      workspace.data.logger.error(`Failed to create zip: ${zipResult.message}`);
      return;
    }

    const blob = new Blob([zipResult.value.buffer as ArrayBuffer], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-collections.zip`;
    a.click();
    URL.revokeObjectURL(url);
    workspace.data.logger.info(`Exported ${files.length} collection(s) as zip`);
  }, [workspace, activeTab]);

  const importCollection = useCallback(async (): Promise<void> => {
    const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);
    if (!subLibrary) {
      workspace.data.logger.warn(`No sub-library for tab '${activeTab}'`);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yaml,.yml,.json';

    const file = await new Promise<File | null>((resolve) => {
      input.onchange = (): void => resolve(input.files?.[0] ?? null);
      input.oncancel = (): void => resolve(null);
      input.click();
    });

    if (!file) return;

    const text = await file.text();
    const collectionId = file.name.replace(/\.(yaml|yml|json)$/i, '') as CollectionId;

    const parseResult = LibraryData.Converters.collectionYamlConverter(JsonConverters.jsonObject).convert(
      text
    );
    if (parseResult.isFailure()) {
      workspace.data.logger.error(`Failed to parse '${file.name}': ${parseResult.message}`);
      return;
    }

    const sourceFile = parseResult.value;
    const itemCount = Object.keys(sourceFile.items).length;

    let targetId = collectionId;

    if (subLibrary.collections.has(collectionId)) {
      const resolution = await new Promise<ImportCollisionResolution>((resolve) => {
        collisionResolverRef.current = resolve;
        setPendingImport({ collectionId, itemCount });
      });

      if (resolution === 'skip') {
        workspace.data.logger.info(`Skipped import of '${collectionId}' (already exists)`);
        return;
      } else if (resolution === 'overwrite') {
        const deleteResult = subLibrary.removeCollection(collectionId);
        if (deleteResult.isFailure()) {
          workspace.data.logger.error(`Cannot overwrite '${collectionId}': ${deleteResult.message}`);
          return;
        }
      } else {
        targetId = resolution.rename as CollectionId;
      }
    }

    const addResult = subLibrary.addCollectionWithItems(
      targetId,
      Array.from(Object.entries(sourceFile.items)),
      { metadata: sourceFile.metadata }
    );

    if (addResult.isFailure()) {
      workspace.data.logger.errorWithDetail(
        `Failed to import '${targetId}' into ${activeTab} — is this the right tab?`,
        addResult.message
      );
      return;
    }

    workspace.data.logger.info(`Imported collection '${targetId}' with ${itemCount} items`);
    workspace.data.clearCache();
    reactiveWorkspace.notifyChange();
  }, [workspace, reactiveWorkspace, activeTab]);

  const openCollectionFromFile = useCallback(async (): Promise<void> => {
    if (!canAddDirectory) {
      workspace.data.logger.warn('File System Access API not supported in this browser');
      return;
    }

    const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);
    if (!subLibrary) {
      workspace.data.logger.warn(`No sub-library for tab '${activeTab}'`);
      return;
    }

    const handles = await safeShowOpenFilePicker(window, {
      multiple: false,
      types: [{ description: 'Collection files', accept: { 'text/plain': ['.yaml', '.yml', '.json'] } }],
      id: 'chocolate-lab-open-collection'
    });

    if (!handles || handles.length === 0) return;
    const fileHandle = handles[0];

    // Place the file at the sub-library path so the navigator can find it
    // (e.g., /data/confections/common.yaml instead of /common.yaml)
    const subLibraryPath = getSubLibraryPathForTab(activeTab);
    const filePath = subLibraryPath ? `/${subLibraryPath}/${fileHandle.name}` : undefined;
    const treeResult = await FileApiTreeAccessors.createPersistentFromFile(fileHandle, { filePath });
    if (treeResult.isFailure()) {
      workspace.data.logger.error(`Failed to open file: ${treeResult.message}`);
      return;
    }

    const tree = treeResult.value;
    const rootResult = tree.getDirectory('/');
    if (rootResult.isFailure()) {
      workspace.data.logger.error(`Failed to access file tree root: ${rootResult.message}`);
      return;
    }

    const loadResult = subLibrary.loadFromFileTreeSource({
      directory: rootResult.value,
      load: true,
      mutable: true
    });

    if (loadResult.isFailure()) {
      workspace.data.logger.errorWithDetail(
        `Failed to load '${fileHandle.name}' into ${activeTab} — is this the right tab?`,
        loadResult.message
      );
      return;
    }

    workspace.data.logger.info(`Opened '${fileHandle.name}' (edits save back in place)`);

    // Register the persistent tree for dirty tracking / save-in-place
    const accessors = tree.hal;
    if ('syncToDisk' in accessors && 'isDirty' in accessors) {
      reactiveWorkspace.registerPersistentTree(fileHandle.name, {
        tree,
        accessors: accessors as FileTree.IPersistentFileTreeAccessors,
        label: fileHandle.name
      });
    }

    workspace.data.clearCache();
    reactiveWorkspace.notifyChange();
  }, [canAddDirectory, workspace, reactiveWorkspace, activeTab]);

  const saveAll = useCallback(async (): Promise<void> => {
    const result = await reactiveWorkspace.syncAllToDisk();
    if (result.isFailure()) {
      workspace.data.logger.error(`Save failed: ${result.message}`);
    } else {
      workspace.data.logger.info('All changes saved to disk');
    }
    reactiveWorkspace.notifyChange();
  }, [workspace, reactiveWorkspace]);

  return {
    canAddDirectory,
    addDirectory,
    createCollection,
    deleteCollection,
    exportCollection,
    exportAllAsZip,
    importCollection,
    openCollectionFromFile,
    saveAll,
    hasDirtyTrees: reactiveWorkspace.hasDirtyTrees,
    pendingImport,
    resolveImportCollision
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Builds YAML content for a new collection file with metadata.
 * @internal
 */
function buildCollectionYaml(data: ICreateCollectionData): string {
  const lines: string[] = [];

  // Metadata block
  const hasMetadata = data.name || data.description || (data.tags && data.tags.length > 0);
  if (hasMetadata) {
    lines.push('metadata:');
    if (data.name) {
      lines.push(`  name: ${yamlQuote(data.name)}`);
    }
    if (data.description) {
      lines.push(`  description: ${yamlQuote(data.description)}`);
    }
    if (data.tags && data.tags.length > 0) {
      lines.push('  tags:');
      for (const tag of data.tags) {
        lines.push(`    - ${yamlQuote(tag)}`);
      }
    }
    lines.push('');
  }

  // Empty items block
  lines.push('items: {}');
  lines.push('');

  return lines.join('\n');
}

/**
 * Wraps a string in quotes if it contains characters that need YAML escaping.
 * @internal
 */
function yamlQuote(value: string): string {
  if (/[:#{}[\],&*?|>!%@`'"]/.test(value) || value !== value.trim()) {
    return JSON.stringify(value);
  }
  return value;
}
