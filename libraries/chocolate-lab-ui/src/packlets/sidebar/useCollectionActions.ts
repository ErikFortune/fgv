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

import { CryptoUtils, ZipFileTree } from '@fgv/ts-extras';
import { type CollectionId, Helpers, LibraryData, type LibraryRuntime, Settings } from '@fgv/ts-chocolate';
import {
  FileApiTreeAccessors,
  safeShowDirectoryPicker,
  safeShowOpenFilePicker,
  supportsFileSystemAccess
} from '@fgv/ts-web-extras';

import { createDirectoryStore, getOrCreateKeystoreFileItem, saveKeystoreToFile } from '../workspace';

import { type AppTab, selectActiveTab, useNavigationStore } from '../navigation';
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
 * Pending secret setup state when a new secret password is needed during collection creation.
 * @public
 */
export interface IPendingSecretSetup {
  /** The secret name being set up */
  readonly secretName: string;
}

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
  readonly createCollection: (data: ICreateCollectionData) => Promise<void>;
  /** Delete a mutable collection by ID */
  readonly deleteCollection: (collectionId: string) => void;
  /** Set the default collection for new entities in the active tab's sub-library */
  readonly setDefaultCollection: (collectionId: string) => void;
  /** Export a mutable collection to a YAML file download (encrypted if the collection has a secretName and the key is available) */
  readonly exportCollection: (collectionId: string) => Promise<void>;
  /** Export all mutable collections for the active tab as a zip download (encrypted per-collection where keys are available) */
  readonly exportAllAsZip: () => Promise<void>;
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
  /** Secret names available from the keystore (empty when locked or no keystore) */
  readonly existingSecretNames: ReadonlyArray<string>;
  /** Non-null when a new secret password is needed during collection creation */
  readonly pendingSecretSetup: IPendingSecretSetup | null;
  /** Called by the password dialog: sets the password and completes collection creation. Returns error message on failure. */
  readonly resolveSecretSetup: (password: string) => Promise<string | undefined>;
  /** Called when the user skips encryption during collection creation */
  readonly skipSecretSetup: () => void;
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

  const existingSecretNames: ReadonlyArray<string> = (() => {
    const ks = workspace.keyStore;
    if (!ks) return [];
    const result = ks.listSecrets();
    return result.isSuccess() ? result.value : [];
  })();

  const canAddDirectory = typeof window !== 'undefined' && supportsFileSystemAccess(window);

  const [pendingImport, setPendingImport] = useState<IPendingImport | null>(null);
  const collisionResolverRef = useRef<((resolution: ImportCollisionResolution) => void) | null>(null);

  const [pendingSecretSetup, setPendingSecretSetup] = useState<IPendingSecretSetup | null>(null);
  const secretSetupResolverRef = useRef<((password: string) => Promise<string | undefined>) | null>(null);
  const secretSetupSkipRef = useRef<(() => void) | null>(null);

  const persistKeyStore = useCallback(
    async (ks: CryptoUtils.KeyStore.KeyStore, pw: string): Promise<void> => {
      const rootDir = reactiveWorkspace.localStorageRootDir;
      if (!rootDir) return;
      const fileItemResult = getOrCreateKeystoreFileItem(rootDir);
      if (fileItemResult.isFailure()) {
        workspace.data.logger.warn(`Keystore persist: ${fileItemResult.message}`);
        return;
      }
      const saveResult = await saveKeystoreToFile(ks, pw, fileItemResult.value);
      if (saveResult.isFailure()) {
        workspace.data.logger.warn(`Keystore persist: ${saveResult.message}`);
      }
    },
    [reactiveWorkspace, workspace]
  );

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
      sourceName: dirHandle.name,
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

    // Persist the handle to IndexedDB so it can be restored on next page load
    const store = createDirectoryStore(workspace.configName);
    const saveResult = await store.save(dirHandle.name, dirHandle);
    if (saveResult.isFailure()) {
      workspace.data.logger.warn(`Failed to persist directory handle: ${saveResult.message}`);
    }

    // Invalidate caches and notify React
    workspace.data.clearCache();
    reactiveWorkspace.notifyChange();
  }, [canAddDirectory, workspace, reactiveWorkspace, activeTab]);

  const resolveSecretSetup = useCallback(async (password: string): Promise<string | undefined> => {
    if (secretSetupResolverRef.current) {
      return secretSetupResolverRef.current(password);
    }
    return undefined;
  }, []);

  const skipSecretSetup = useCallback((): void => {
    secretSetupSkipRef.current?.();
    secretSetupSkipRef.current = null;
    secretSetupResolverRef.current = null;
    setPendingSecretSetup(null);
  }, []);

  const createCollection = useCallback(
    async (data: ICreateCollectionData): Promise<void> => {
      const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);
      if (!subLibrary) {
        workspace.data.logger.warn(`No sub-library for tab '${activeTab}'`);
        return;
      }

      const metadata: LibraryData.ICollectionRuntimeMetadata = {
        sourceName: subLibrary.mutableSourceName ?? 'unknown',
        name: data.name,
        ...(data.description ? { description: data.description } : {}),
        ...(data.tags && data.tags.length > 0 ? { tags: data.tags } : {}),
        ...(data.secretName ? { secretName: data.secretName } : {})
      };

      const result = subLibrary.addCollectionWithItems(data.id, undefined, { metadata });
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to create collection '${data.id}': ${result.message}`);
        return;
      }

      const collectionId = result.value as CollectionId;

      // Try to encrypt the file if a secretName is provided
      const keyStore = workspace.keyStore;
      let keyDerivation: CryptoUtils.IKeyDerivationParams | undefined;

      if (data.secretName && keyStore) {
        const hasSecretResult = keyStore.hasSecret(data.secretName);
        const hasSecret = hasSecretResult.isSuccess() && hasSecretResult.value;

        // If the secret doesn't exist yet, prompt for a password
        if (!hasSecret) {
          const setupResult = await new Promise<{
            error?: string;
            keyDerivation?: CryptoUtils.IKeyDerivationParams;
          }>((resolve) => {
            secretSetupResolverRef.current = async (password: string): Promise<string | undefined> => {
              secretSetupResolverRef.current = null;
              secretSetupSkipRef.current = null;
              setPendingSecretSetup(null);
              try {
                if (keyStore.state === 'locked') {
                  // Try initialize first (new keystore); fall back to unlock (existing keystore)
                  const initResult = await keyStore.initialize(password);
                  if (initResult.isFailure()) {
                    const unlockResult = await keyStore.unlock(password);
                    if (unlockResult.isFailure()) {
                      resolve({ error: unlockResult.message });
                      return unlockResult.message;
                    }
                  }
                }
                // Derive secret key from the password (not random)
                const addResult = await keyStore.addSecretFromPassword(data.secretName!, password);
                if (addResult.isFailure()) {
                  resolve({ error: addResult.message });
                  return addResult.message;
                }
                // Persist keystore so the new secret survives page reload
                await persistKeyStore(keyStore, password);
                resolve({ keyDerivation: addResult.value.keyDerivation });
                return undefined;
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                resolve({ error: msg });
                return msg;
              }
            };
            secretSetupSkipRef.current = (): void => resolve({});
            setPendingSecretSetup({ secretName: data.secretName! });
          });

          if (setupResult.error) {
            workspace.data.logger.warn(
              `Failed to set up secret '${data.secretName}': ${setupResult.error}. Collection created without encryption.`
            );
          } else {
            keyDerivation = setupResult.keyDerivation;
          }
        }

        // Now try to encrypt if the secret is available
        const secretResult = keyStore.getSecret(data.secretName);
        const encConfigResult = keyStore.getEncryptionConfig();
        if (secretResult.isSuccess() && encConfigResult.isSuccess()) {
          const contentResult = JsonConverters.jsonValue.convert({});
          if (contentResult.isSuccess()) {
            const encryptedResult = await CryptoUtils.createEncryptedFile({
              content: contentResult.value,
              secretName: data.secretName,
              key: secretResult.value.key,
              metadata: { collectionId, itemCount: 0 },
              keyDerivation,
              cryptoProvider: encConfigResult.value.cryptoProvider
            });
            if (encryptedResult.isSuccess()) {
              const jsonContent = JSON.stringify(encryptedResult.value, null, 2);
              const fileResult = subLibrary.createCollectionFile(collectionId, jsonContent, 'json');
              if (fileResult.isFailure()) {
                workspace.data.logger.info(
                  `Collection '${data.id}' created in-memory (persistence failed: ${fileResult.message})`
                );
              } else {
                workspace.data.logger.info(`Collection '${data.id}' created with encrypted backing file`);
              }
              workspace.data.clearCache();
              reactiveWorkspace.notifyChange();
              return;
            }
          }
        }
      }

      // Fallback: write plain YAML
      const yamlContent = buildCollectionYaml(data);
      const fileResult = subLibrary.createCollectionFile(collectionId, yamlContent, 'yaml');
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
    [workspace, reactiveWorkspace, activeTab, persistKeyStore]
  );

  const setDefaultCollection = useCallback(
    (collectionId: string): void => {
      const settingsManager = workspace.settings;
      if (!settingsManager) {
        workspace.data.logger.warn('No settings manager available');
        return;
      }

      const tabToKey: Partial<Record<AppTab, keyof Settings.IDefaultCollectionTargets>> = {
        ingredients: 'ingredients',
        fillings: 'fillings',
        confections: 'confections',
        molds: 'molds',
        procedures: 'procedures',
        tasks: 'tasks',
        decorations: 'decorations'
      };
      const key = tabToKey[activeTab as AppTab];
      if (!key) {
        workspace.data.logger.warn(`No default target key for tab '${activeTab}'`);
        return;
      }

      const result = settingsManager.updateDefaultTargets({ [key]: collectionId });
      if (result.isFailure()) {
        workspace.data.logger.error(`Failed to set default collection: ${result.message}`);
        return;
      }

      settingsManager
        .save()
        .then((saveResult) => {
          if (saveResult.isFailure()) {
            workspace.data.logger.warn(`Default collection set but save failed: ${saveResult.message}`);
          }
        })
        .catch((err: unknown) => {
          workspace.data.logger.warn(`Default collection set but save threw: ${String(err)}`);
        });

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
    async (collectionId: string): Promise<void> => {
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
      const secretName = collection.metadata?.secretName;
      const items = Object.fromEntries(collection.items.entries());

      // Attempt encrypted export if the collection has a secretName and the key is available
      if (secretName && workspace.keyStore) {
        const secretResult = workspace.keyStore.getSecret(secretName);
        const encConfigResult = workspace.keyStore.getEncryptionConfig();
        if (secretResult.isSuccess() && encConfigResult.isSuccess()) {
          const contentResult = JsonConverters.jsonValue.convert(items);
          const encryptedResult = contentResult.isSuccess()
            ? await CryptoUtils.createEncryptedFile({
                content: contentResult.value,
                secretName,
                key: secretResult.value.key,
                metadata: {
                  collectionId,
                  itemCount: collection.items.size
                },
                cryptoProvider: encConfigResult.value.cryptoProvider
              })
            : contentResult;
          if (encryptedResult.isSuccess()) {
            const blob = new Blob([JSON.stringify(encryptedResult.value, null, 2)], {
              type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${collectionId}.json`;
            a.click();
            URL.revokeObjectURL(url);
            workspace.data.logger.info(`Exported collection '${collectionId}' (encrypted)`);
            return;
          }
          workspace.data.logger.warn(
            `Encryption failed for '${collectionId}', falling back to plain YAML: ${encryptedResult.message}`
          );
        }
      }

      // Plain YAML export
      const yamlResult = Helpers.serializeToYaml({
        metadata: collection.metadata ?? {},
        items
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

  const exportAllAsZip = useCallback(async (): Promise<void> => {
    const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);
    if (!subLibrary) {
      workspace.data.logger.warn(`No sub-library for tab '${activeTab}'`);
      return;
    }

    const encConfigResult = workspace.keyStore?.getEncryptionConfig();
    const encConfig = encConfigResult?.isSuccess() ? encConfigResult.value : undefined;

    const files: Array<{ path: string; contents: string }> = [];
    for (const [id, collection] of subLibrary.collections.entries()) {
      if (!collection.isMutable) continue;
      const items = Object.fromEntries(collection.items.entries());
      const secretName = collection.metadata?.secretName;

      // Attempt encrypted export if collection has a secretName and key is available
      if (secretName && encConfig && workspace.keyStore) {
        const secretResult = workspace.keyStore.getSecret(secretName);
        if (secretResult.isSuccess()) {
          const contentResult = JsonConverters.jsonValue.convert(items);
          const encryptedResult = contentResult.isSuccess()
            ? await CryptoUtils.createEncryptedFile({
                content: contentResult.value,
                secretName,
                key: secretResult.value.key,
                metadata: {
                  collectionId: id,
                  itemCount: collection.items.size
                },
                cryptoProvider: encConfig.cryptoProvider
              })
            : contentResult;
          if (encryptedResult.isSuccess()) {
            files.push({
              path: `${id}.json`,
              contents: JSON.stringify(encryptedResult.value, null, 2)
            });
            continue;
          }
          workspace.data.logger.warn(
            `Encryption failed for '${id}', falling back to plain YAML: ${encryptedResult.message}`
          );
        }
      }

      // Plain YAML fallback
      const yamlResult = Helpers.serializeToYaml({
        metadata: collection.metadata ?? {},
        items
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

    const metadata: LibraryData.ICollectionRuntimeMetadata | undefined = sourceFile.metadata
      ? { ...sourceFile.metadata, sourceName: subLibrary.mutableSourceName ?? 'unknown' }
      : undefined;

    const addResult = subLibrary.addCollectionWithItems(
      targetId,
      Array.from(Object.entries(sourceFile.items)),
      { metadata }
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
      sourceName: fileHandle.name,
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
    setDefaultCollection,
    exportCollection,
    exportAllAsZip,
    importCollection,
    openCollectionFromFile,
    saveAll,
    hasDirtyTrees: reactiveWorkspace.hasDirtyTrees,
    pendingImport,
    resolveImportCollision,
    existingSecretNames,
    pendingSecretSetup,
    resolveSecretSetup,
    skipSecretSetup
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
  const hasMetadata = data.name || data.description || (data.tags && data.tags.length > 0) || data.secretName;
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
    if (data.secretName) {
      lines.push(`  secretName: ${yamlQuote(data.secretName)}`);
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
