/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, ReactNode } from 'react';
import {
  Crypto,
  Editing,
  Entities,
  Converters as ChocolateConverters,
  type BaseIngredientId,
  type IngredientId,
  type BaseFillingId,
  type FillingId,
  type BaseProcedureId,
  type ProcedureId,
  type BaseTaskId,
  type TaskId,
  type BaseMoldId,
  type MoldId,
  type BaseConfectionId,
  type ConfectionId,
  type SourceId,
  type LibraryData
} from '@fgv/ts-chocolate';
import type { JsonObject } from '@fgv/ts-json-base';
import type { Result } from '@fgv/ts-utils';
import { fail, recordFromEntries, succeed } from '@fgv/ts-utils';
import { useRuntime } from './RuntimeContext';
import { useLibraryImport } from './LibraryImportContext';
import { useSettings } from './SettingsContext';
import { useSecrets } from './SecretsContext';

const LOCAL_INGREDIENT_COLLECTIONS_KEY = 'chocolate-lab-web:ingredients:collections:v1';
const LOCAL_FILLING_COLLECTIONS_KEY = 'chocolate-lab-web:fillings:collections:v1';
const LOCAL_MOLD_COLLECTIONS_KEY = 'chocolate-lab-web:molds:collections:v1';
const LOCAL_PROCEDURE_COLLECTIONS_KEY = 'chocolate-lab-web:procedures:collections:v1';
const LOCAL_TASK_COLLECTIONS_KEY = 'chocolate-lab-web:tasks:collections:v1';
const LOCAL_CONFECTION_COLLECTIONS_KEY = 'chocolate-lab-web:confections:collections:v1';

type ResolvedSecret = {
  keyBase64: string;
  keyDerivation?: Crypto.IKeyDerivationParams;
};

function readLocalIngredientCollections(): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(LOCAL_INGREDIENT_COLLECTIONS_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function exportItemsToEncryptedJsonIfNeeded(
  items: JsonObject,
  sourceMetadata: LibraryData.ICollectionSourceMetadata | undefined,
  collectionId: SourceId,
  cryptoProvider: Crypto.BrowserCryptoProvider,
  secrets: Record<string, ResolvedSecret>
): Promise<Result<string | undefined>> {
  const secretName = sourceMetadata?.secretName;
  if (!secretName) {
    return succeed(undefined);
  }

  const secret = secrets[secretName];
  const keyBase64 = secret?.keyBase64;
  if (!keyBase64) {
    return fail(
      `Collection is protected with secret "${secretName}" but no key is available. Unlock the collection to store its key, or add the key in settings.`
    );
  }

  const keyResult = decodeBase64Key(keyBase64);
  if (keyResult.isFailure()) {
    return fail(`Invalid stored key for secret "${secretName}": ${keyResult.message}`);
  }

  const encryptResult = await Crypto.createEncryptedCollectionFile({
    content: items,
    secretName,
    key: keyResult.value,
    metadata: {
      collectionId: collectionId as unknown as string,
      description: sourceMetadata?.description,
      itemCount: Object.keys(items).length
    },
    ...(secret?.keyDerivation ? { keyDerivation: secret.keyDerivation } : {}),
    cryptoProvider
  });
  if (encryptResult.isFailure()) {
    return fail(encryptResult.message);
  }

  try {
    return succeed(JSON.stringify(encryptResult.value));
  } catch (e) {
    return fail(`Failed to serialize encrypted export: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function writeLocalIngredientCollections(next: Record<string, unknown>): void {
  window.localStorage.setItem(LOCAL_INGREDIENT_COLLECTIONS_KEY, JSON.stringify(next));
}

function readLocalFillingCollections(): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(LOCAL_FILLING_COLLECTIONS_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeLocalFillingCollections(next: Record<string, unknown>): void {
  window.localStorage.setItem(LOCAL_FILLING_COLLECTIONS_KEY, JSON.stringify(next));
}

function readLocalMoldCollections(): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(LOCAL_MOLD_COLLECTIONS_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeLocalMoldCollections(next: Record<string, unknown>): void {
  window.localStorage.setItem(LOCAL_MOLD_COLLECTIONS_KEY, JSON.stringify(next));
}

function readLocalProcedureCollections(): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(LOCAL_PROCEDURE_COLLECTIONS_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeLocalProcedureCollections(next: Record<string, unknown>): void {
  window.localStorage.setItem(LOCAL_PROCEDURE_COLLECTIONS_KEY, JSON.stringify(next));
}

function readLocalTaskCollections(): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(LOCAL_TASK_COLLECTIONS_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeLocalTaskCollections(next: Record<string, unknown>): void {
  window.localStorage.setItem(LOCAL_TASK_COLLECTIONS_KEY, JSON.stringify(next));
}

function readLocalConfectionCollections(): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(LOCAL_CONFECTION_COLLECTIONS_KEY);
    console.log('[Confection Persistence] Reading from localStorage:', {
      key: LOCAL_CONFECTION_COLLECTIONS_KEY,
      hasData: !!raw,
      dataLength: raw?.length ?? 0
    });
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    console.log('[Confection Persistence] Parsed collections:', Object.keys(parsed));
    return parsed;
  } catch (e) {
    console.error('[Confection Persistence] Read error:', e);
    return {};
  }
}

function writeLocalConfectionCollections(next: Record<string, unknown>): void {
  const serialized = JSON.stringify(next);
  console.log('[Confection Persistence] Writing to localStorage:', {
    key: LOCAL_CONFECTION_COLLECTIONS_KEY,
    collectionIds: Object.keys(next),
    dataLength: serialized.length
  });
  window.localStorage.setItem(LOCAL_CONFECTION_COLLECTIONS_KEY, serialized);

  // Verify write
  const verify = window.localStorage.getItem(LOCAL_CONFECTION_COLLECTIONS_KEY);
  console.log('[Confection Persistence] Write verification:', {
    written: verify === serialized,
    verifyLength: verify?.length ?? 0
  });
}

function decodeBase64Key(value: string): Result<Uint8Array> {
  try {
    const bytes = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
    if (bytes.length !== 32) {
      return fail(`Key must be 32 bytes (got ${bytes.length})`);
    }
    return succeed(bytes);
  } catch (e) {
    return fail(`Invalid base64 key: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function encryptItemsIfNeeded(
  items: JsonObject,
  sourceMetadata: LibraryData.ICollectionSourceMetadata | undefined,
  collectionId: SourceId,
  existingRecord: unknown,
  cryptoProvider: Crypto.BrowserCryptoProvider,
  secrets: Record<string, ResolvedSecret>
): Promise<Result<unknown>> {
  const newSecretName = sourceMetadata?.secretName;

  // If the existing record is encrypted, verify we can decrypt it using its own secretName
  // (this protects against data loss and also enables re-keying).
  if (existingRecord && typeof existingRecord === 'object' && existingRecord !== null) {
    const asObj = existingRecord as Record<string, unknown>;
    if (Crypto.isEncryptedCollectionFile(asObj)) {
      const existingSecretName = (asObj.secretName as unknown as string) ?? '';
      const existingKeyBase64 = secrets[existingSecretName]?.keyBase64;
      if (!existingKeyBase64) {
        return fail(
          `Refusing to overwrite existing encrypted collection: no key is available for secret "${existingSecretName}". Unlock the collection to store its key, or add the key in settings.`
        );
      }

      const existingKeyResult = decodeBase64Key(existingKeyBase64);
      if (existingKeyResult.isFailure()) {
        return fail(
          `Refusing to overwrite existing encrypted collection: invalid stored key for secret "${existingSecretName}": ${existingKeyResult.message}`
        );
      }

      const verifyResult = await Crypto.tryDecryptCollectionFile(
        asObj as unknown as JsonObject,
        existingKeyResult.value,
        cryptoProvider
      );
      if (verifyResult.isFailure()) {
        return fail(
          `Refusing to overwrite existing encrypted collection: could not decrypt with secret "${existingSecretName}": ${verifyResult.message}`
        );
      }
    }
  }

  // If there is no new secretName, we are writing plaintext.
  if (!newSecretName) {
    return succeed(undefined);
  }

  const newSecret = secrets[newSecretName];
  const newKeyBase64 = newSecret?.keyBase64;
  if (!newKeyBase64) {
    return fail(
      `Collection is protected with secret "${newSecretName}" but no key is available. Unlock the collection to store its key, or add the key in settings.`
    );
  }

  const newKeyResult = decodeBase64Key(newKeyBase64);
  if (newKeyResult.isFailure()) {
    return fail(`Invalid stored key for secret "${newSecretName}": ${newKeyResult.message}`);
  }

  const encryptResult = await Crypto.createEncryptedCollectionFile({
    content: items,
    secretName: newSecretName,
    key: newKeyResult.value,
    metadata: {
      collectionId: collectionId as unknown as string,
      description: sourceMetadata?.description,
      itemCount: Object.keys(items).length
    },
    ...(newSecret?.keyDerivation ? { keyDerivation: newSecret.keyDerivation } : {}),
    cryptoProvider
  });

  return encryptResult.isSuccess() ? succeed(encryptResult.value as unknown) : fail(encryptResult.message);
}

function getAllLocalCollectionIds(): SourceId[] {
  const ids = new Set<string>();
  for (const k of Object.keys(readLocalIngredientCollections())) {
    ids.add(k);
  }
  for (const k of Object.keys(readLocalFillingCollections())) {
    ids.add(k);
  }
  for (const k of Object.keys(readLocalProcedureCollections())) {
    ids.add(k);
  }
  for (const k of Object.keys(readLocalTaskCollections())) {
    ids.add(k);
  }
  for (const k of Object.keys(readLocalMoldCollections())) {
    ids.add(k);
  }
  for (const k of Object.keys(readLocalConfectionCollections())) {
    ids.add(k);
  }
  return Array.from(ids) as SourceId[];
}

// Type alias for Ingredient from Entities
type Ingredient = Entities.Ingredients.Ingredient;
type Filling = Entities.Fillings.IFillingRecipe;
type Procedure = Entities.Procedures.IProcedure;
type Task = Entities.Tasks.ITaskData;
type Mold = Entities.Molds.IMold;
type Confection = Entities.Confections.ConfectionData;

// ============================================================================
// Types
// ============================================================================

/**
 * Parameters for creating a new collection
 */
export interface ICreateCollectionParams {
  /** Collection ID (must be unique, kebab-case) */
  collectionId: SourceId;
  /** Display name for the collection */
  name: string;
  /** Optional description */
  description?: string;
  secretName?: string;
}

/**
 * Parameters for exporting a collection
 */
export interface IExportParams {
  /** Collection ID to export */
  collectionId: SourceId;
  /** Export format */
  format: 'yaml' | 'json';
}

/**
 * Parameters for importing a collection
 */
export interface IImportParams {
  /** File content to import */
  content: string;
  /** Import mode */
  mode: 'replace' | 'create-new';
  /** Collection ID (for replace mode, or new ID for create-new mode) */
  collectionId: SourceId;
}

/**
 * Editor state for a single collection
 */
export interface IEditorState {
  /** The editor context instance */
  editor: Editing.Ingredients.IngredientEditorContext;
  /** Whether the editor has unsaved changes */
  isDirty: boolean;
  /** Timestamp of last modification */
  lastModified: number;
}

/**
 * Editing context value
 */
export interface IEditingContext {
  // Editor management
  /** Get or create an ingredient editor for a collection */
  getIngredientEditor: (collectionId: SourceId) => Result<Editing.Ingredients.IngredientEditorContext>;
  /** Check if an editor exists for a collection */
  hasEditor: (collectionId: SourceId) => boolean;
  /** Close an editor (discards unsaved changes) */
  closeEditor: (collectionId: SourceId) => void;
  /** Get all active editor collection IDs */
  activeEditors: ReadonlyArray<SourceId>;

  // Dirty state tracking
  /** Check if any editor has unsaved changes */
  hasUnsavedChanges: boolean;
  /** List of dirty collection IDs */
  dirtyCollections: ReadonlyArray<SourceId>;
  /** Mark a collection as dirty */
  markDirty: (collectionId: SourceId) => void;
  /** Mark a collection as clean */
  markClean: (collectionId: SourceId) => void;

  /** Collections that have locally persisted overrides */
  localCollections: ReadonlyArray<SourceId>;
  /** Whether any local overrides exist */
  hasLocalChanges: boolean;

  // Collection management
  /** Create a new mutable collection */
  createCollection: (params: ICreateCollectionParams) => Promise<Result<void>>;
  /** Delete a mutable collection */
  deleteCollection: (collectionId: SourceId) => Result<void>;
  /** Rename a collection (update metadata) */
  renameCollection: (
    collectionId: SourceId,
    newName: string,
    newDescription?: string,
    secretName?: string
  ) => Promise<Result<void>>;
  /** Check if a collection is mutable */
  isCollectionMutable: (collectionId: SourceId) => boolean;

  // Export/Import
  /** Export a collection to string */
  exportCollection: (params: IExportParams) => Promise<Result<string>>;
  /** Import a collection from string */
  importCollection: (params: IImportParams) => Result<void>;

  // Mold collection management
  createMoldCollection: (params: ICreateCollectionParams) => Promise<Result<void>>;
  deleteMoldCollection: (collectionId: SourceId) => Result<void>;
  renameMoldCollection: (
    collectionId: SourceId,
    newName: string,
    newDescription?: string,
    secretName?: string
  ) => Promise<Result<void>>;
  exportMoldCollection: (params: IExportParams) => Promise<Result<string>>;
  importMoldCollection: (params: IImportParams) => Result<void>;

  // Filling collection management
  createFillingCollection: (params: ICreateCollectionParams) => Promise<Result<void>>;
  deleteFillingCollection: (collectionId: SourceId) => Result<void>;
  renameFillingCollection: (
    collectionId: SourceId,
    newName: string,
    newDescription?: string,
    secretName?: string
  ) => Promise<Result<void>>;
  exportFillingCollection: (params: IExportParams) => Promise<Result<string>>;
  importFillingCollection: (params: IImportParams) => Result<void>;

  // Procedure collection management
  createProcedureCollection: (params: ICreateCollectionParams) => Promise<Result<void>>;
  deleteProcedureCollection: (collectionId: SourceId) => Result<void>;
  renameProcedureCollection: (
    collectionId: SourceId,
    newName: string,
    newDescription?: string,
    secretName?: string
  ) => Promise<Result<void>>;
  exportProcedureCollection: (params: IExportParams) => Promise<Result<string>>;
  importProcedureCollection: (params: IImportParams) => Result<void>;

  // Task collection management
  createTaskCollection: (params: ICreateCollectionParams) => Promise<Result<void>>;
  deleteTaskCollection: (collectionId: SourceId) => Result<void>;
  renameTaskCollection: (
    collectionId: SourceId,
    newName: string,
    newDescription?: string,
    secretName?: string
  ) => Promise<Result<void>>;
  exportTaskCollection: (params: IExportParams) => Promise<Result<string>>;
  importTaskCollection: (params: IImportParams) => Result<void>;

  // Confection collection management
  createConfectionCollection: (params: ICreateCollectionParams) => Promise<Result<void>>;
  deleteConfectionCollection: (collectionId: SourceId) => Result<void>;
  renameConfectionCollection: (
    collectionId: SourceId,
    newName: string,
    newDescription?: string,
    secretName?: string
  ) => Promise<Result<void>>;
  exportConfectionCollection: (params: IExportParams) => Promise<Result<string>>;
  importConfectionCollection: (params: IImportParams) => Result<void>;

  /** Commit current editor state back into the runtime library and refresh runtime caches */
  commitCollection: (collectionId: SourceId) => Promise<Result<void>>;

  /** Persist a mutable mold collection to localStorage and refresh runtime caches */
  commitMoldCollection: (collectionId: SourceId) => Promise<Result<void>>;

  /** Persist a mutable filling collection to localStorage and refresh runtime caches */
  commitFillingCollection: (collectionId: SourceId) => Promise<Result<void>>;

  /** Persist a mutable procedure collection to localStorage and refresh runtime caches */
  commitProcedureCollection: (collectionId: SourceId) => Promise<Result<void>>;

  /** Persist a mutable task collection to localStorage and refresh runtime caches */
  commitTaskCollection: (collectionId: SourceId) => Promise<Result<void>>;

  /** Persist a mutable confection collection to localStorage and refresh runtime caches */
  commitConfectionCollection: (collectionId: SourceId) => Promise<Result<void>>;

  // Data version - increments when editing operations complete
  editingVersion: number;
}

/**
 * Default editing context value
 */
const defaultEditingContext: IEditingContext = {
  getIngredientEditor: () => fail('No EditingProvider'),
  hasEditor: () => false,
  closeEditor: () => undefined,
  activeEditors: [],
  hasUnsavedChanges: false,
  dirtyCollections: [],
  markDirty: () => undefined,
  markClean: () => undefined,
  localCollections: [],
  hasLocalChanges: false,
  createCollection: async () => fail('Editing context not initialized'),
  deleteCollection: () => fail('Editing context not initialized'),
  renameCollection: async () => fail('Editing context not initialized'),
  isCollectionMutable: () => false,
  exportCollection: async () => fail('No EditingProvider'),
  importCollection: () => fail('No EditingProvider'),
  createMoldCollection: async () => fail('Editing context not initialized'),
  deleteMoldCollection: () => fail('Editing context not initialized'),
  renameMoldCollection: async () => fail('Editing context not initialized'),
  exportMoldCollection: async () => fail('Editing context not initialized'),
  importMoldCollection: () => fail('Editing context not initialized'),
  createFillingCollection: async () => fail('Editing context not initialized'),
  deleteFillingCollection: () => fail('Editing context not initialized'),
  renameFillingCollection: async () => fail('Editing context not initialized'),
  exportFillingCollection: async () => fail('Editing context not initialized'),
  importFillingCollection: () => fail('Editing context not initialized'),
  createProcedureCollection: async () => fail('Editing context not initialized'),
  deleteProcedureCollection: () => fail('Editing context not initialized'),
  renameProcedureCollection: async () => fail('Editing context not initialized'),
  exportProcedureCollection: async () => fail('Editing context not initialized'),
  importProcedureCollection: () => fail('Editing context not initialized'),
  createTaskCollection: async () => fail('Editing context not initialized'),
  deleteTaskCollection: () => fail('Editing context not initialized'),
  renameTaskCollection: async () => fail('Editing context not initialized'),
  exportTaskCollection: async () => fail('Editing context not initialized'),
  importTaskCollection: () => fail('Editing context not initialized'),
  createConfectionCollection: async () => fail('Editing context not initialized'),
  deleteConfectionCollection: () => fail('Editing context not initialized'),
  renameConfectionCollection: async () => fail('Editing context not initialized'),
  exportConfectionCollection: async () => fail('Editing context not initialized'),
  importConfectionCollection: () => fail('Editing context not initialized'),
  commitCollection: async () => fail('No EditingProvider'),
  commitMoldCollection: async () => fail('No EditingProvider'),
  commitFillingCollection: async () => fail('No EditingProvider'),
  commitProcedureCollection: async () => fail('No EditingProvider'),
  commitTaskCollection: async () => fail('No EditingProvider'),
  commitConfectionCollection: async () => fail('No EditingProvider'),
  editingVersion: 0
};

/**
 * React context for editing operations
 */
export const EditingContext = createContext<IEditingContext>(defaultEditingContext);

// ============================================================================
// Provider
// ============================================================================

/**
 * Props for the EditingProvider component
 */
export interface IEditingProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages editing state
 */
export function EditingProvider({ children }: { children: ReactNode }): React.ReactElement {
  const { runtime, notifyLibraryChanged } = useRuntime();
  const { getFileBackedCollectionExportFormat, tryWriteFileBackedCollection } = useLibraryImport();
  const { settings } = useSettings();
  const { secrets: sessionSecrets } = useSecrets();

  const resolvedSecrets = useMemo((): Record<string, ResolvedSecret> => {
    const merged: Record<string, ResolvedSecret> = {};
    for (const [name, keyBase64] of Object.entries(settings.secrets)) {
      merged[name] = { keyBase64 };
    }
    for (const [name, secret] of Object.entries(sessionSecrets)) {
      merged[name] = {
        keyBase64: secret.keyBase64,
        ...(secret.keyDerivation ? { keyDerivation: secret.keyDerivation } : {})
      };
    }
    return merged;
  }, [sessionSecrets, settings.secrets]);

  // Track active editors by collection ID
  const editorsRef = useRef<Map<SourceId, IEditorState>>(new Map());
  const [activeEditorIds, setActiveEditorIds] = useState<SourceId[]>([]);
  const [dirtyCollections, setDirtyCollections] = useState<SourceId[]>([]);
  const [localCollections, setLocalCollections] = useState<SourceId[]>(() => {
    return getAllLocalCollectionIds();
  });
  const [editingVersion, setEditingVersion] = useState(0);

  // Increment version to trigger re-renders
  const incrementVersion = useCallback((): void => {
    setEditingVersion((v) => v + 1);
  }, []);

  const commitCollection = useCallback(
    async (collectionId: SourceId): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const editorState = editorsRef.current.get(collectionId);
      if (!editorState) {
        return fail(`No active editor for collection "${collectionId}"`);
      }

      const collectionResult = runtime.library.ingredients.collections.get(collectionId).asResult;
      if (collectionResult.isFailure()) {
        return fail(`Collection "${collectionId}" not found`);
      }

      const collectionEntry = collectionResult.value;
      if (!collectionEntry.isMutable) {
        return fail(`Collection "${collectionId}" is immutable and cannot be modified`);
      }

      // Replace all items in the runtime library's mutable collection with the editor's current state
      collectionEntry.items.clear();
      for (const [, ingredient] of editorState.editor.getAll()) {
        const setResult = collectionEntry.items.set(ingredient.baseId, ingredient).asResult;
        if (setResult.isFailure()) {
          return fail(
            `Failed to write ingredient "${ingredient.baseId}" to collection "${collectionId}": ${setResult.message}`
          );
        }
      }

      try {
        const items: Record<BaseIngredientId, Ingredient> = recordFromEntries(
          collectionEntry.items.entries()
        );
        const sourceFile: LibraryData.ICollectionSourceFile<Ingredient> = {
          metadata: collectionEntry.metadata ?? { name: collectionId },
          items
        };

        const fileFormat = getFileBackedCollectionExportFormat(
          'ingredients',
          collectionId as unknown as string
        );
        if (fileFormat) {
          if (sourceFile.metadata?.secretName && fileFormat !== 'json') {
            return fail('Protected collections can only be exported as encrypted JSON');
          }

          let contents: string | undefined;
          if (sourceFile.metadata?.secretName) {
            const cryptoResult = Crypto.createBrowserCryptoProvider();
            if (cryptoResult.isFailure()) {
              return fail(`Crypto not available: ${cryptoResult.message}`);
            }

            const encrypted = await exportItemsToEncryptedJsonIfNeeded(
              items as unknown as JsonObject,
              sourceFile.metadata,
              collectionId,
              cryptoResult.value,
              resolvedSecrets
            );
            if (encrypted.isFailure()) {
              return fail(encrypted.message);
            }
            if (encrypted.value === undefined) {
              return fail('Failed to export protected collection');
            }
            contents = encrypted.value;
          } else {
            const serialized = Editing.serializeCollection(sourceFile, fileFormat);
            if (serialized.isFailure()) {
              return fail(serialized.message);
            }
            contents = serialized.value;
          }

          const writeResult = await tryWriteFileBackedCollection(
            'ingredients',
            collectionId as unknown as string,
            contents
          );
          if (writeResult.isFailure()) {
            return fail(writeResult.message);
          }

          // If we successfully wrote to the backing file, this is a real save.
          if (writeResult.value) {
            try {
              const existing = readLocalIngredientCollections();
              if (sourceFile.metadata?.secretName) {
                existing[collectionId as unknown as string] = JSON.parse(contents) as unknown;
              } else {
                existing[collectionId as unknown as string] = sourceFile as unknown;
              }
              writeLocalIngredientCollections(existing);
              setLocalCollections(getAllLocalCollectionIds());
            } catch {
              // ignore
            }

            editorState.isDirty = false;
            setDirtyCollections((prev) => prev.filter((id) => id !== collectionId));
            return notifyLibraryChanged();
          }
        }

        const cryptoResult = Crypto.createBrowserCryptoProvider();
        if (cryptoResult.isFailure()) {
          return fail(`Crypto not available: ${cryptoResult.message}`);
        }

        const existing = readLocalIngredientCollections();
        const prior = existing[collectionId as unknown as string];
        const encryptedResult = await encryptItemsIfNeeded(
          items as unknown as JsonObject,
          sourceFile.metadata,
          collectionId,
          prior,
          cryptoResult.value,
          resolvedSecrets
        );
        if (encryptedResult.isFailure()) {
          return fail(encryptedResult.message);
        }

        existing[collectionId] =
          encryptedResult.value !== undefined ? encryptedResult.value : (sourceFile as unknown);
        writeLocalIngredientCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch (e) {
        return fail(
          `Failed to persist collection "${collectionId}": ${e instanceof Error ? e.message : String(e)}`
        );
      }

      // Auto-persist means there are no unsaved changes after commit
      editorState.isDirty = false;
      setDirtyCollections((prev) => prev.filter((id) => id !== collectionId));

      return notifyLibraryChanged();
    },
    [
      getFileBackedCollectionExportFormat,
      notifyLibraryChanged,
      resolvedSecrets,
      runtime,
      tryWriteFileBackedCollection
    ]
  );

  const commitMoldCollection = useCallback(
    async (collectionId: SourceId): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const collectionResult = runtime.library.molds.collections.get(collectionId).asResult;
      if (collectionResult.isFailure()) {
        return fail(`Collection "${collectionId}" not found`);
      }

      const collectionEntry = collectionResult.value;
      if (!collectionEntry.isMutable) {
        return fail(`Collection "${collectionId}" is immutable and cannot be modified`);
      }

      try {
        const items: Record<BaseMoldId, Mold> = recordFromEntries(collectionEntry.items.entries());
        const sourceFile: LibraryData.ICollectionSourceFile<Mold> = {
          metadata: collectionEntry.metadata ?? { name: collectionId },
          items
        };

        const fileFormat = getFileBackedCollectionExportFormat('molds', collectionId as unknown as string);
        if (fileFormat) {
          if (sourceFile.metadata?.secretName && fileFormat !== 'json') {
            return fail('Protected collections can only be exported as encrypted JSON');
          }

          let contents: string | undefined;
          if (sourceFile.metadata?.secretName) {
            const cryptoResult = Crypto.createBrowserCryptoProvider();
            if (cryptoResult.isFailure()) {
              return fail(`Crypto not available: ${cryptoResult.message}`);
            }

            const encrypted = await exportItemsToEncryptedJsonIfNeeded(
              items as unknown as JsonObject,
              sourceFile.metadata,
              collectionId,
              cryptoResult.value,
              resolvedSecrets
            );
            if (encrypted.isFailure()) {
              return fail(encrypted.message);
            }
            if (encrypted.value === undefined) {
              return fail('Failed to export protected collection');
            }
            contents = encrypted.value;
          } else {
            const serialized = Editing.serializeCollection(sourceFile, fileFormat);
            if (serialized.isFailure()) {
              return fail(serialized.message);
            }
            contents = serialized.value;
          }

          const writeResult = await tryWriteFileBackedCollection(
            'molds',
            collectionId as unknown as string,
            contents
          );
          if (writeResult.isFailure()) {
            return fail(writeResult.message);
          }
          if (writeResult.value) {
            try {
              const existing = readLocalMoldCollections();
              if (sourceFile.metadata?.secretName) {
                existing[collectionId as unknown as string] = JSON.parse(contents) as unknown;
              } else {
                existing[collectionId as unknown as string] = sourceFile as unknown;
              }
              writeLocalMoldCollections(existing);
              setLocalCollections(getAllLocalCollectionIds());
            } catch {
              // ignore
            }

            incrementVersion();
            return notifyLibraryChanged();
          }
        }

        const cryptoResult = Crypto.createBrowserCryptoProvider();
        if (cryptoResult.isFailure()) {
          return fail(`Crypto not available: ${cryptoResult.message}`);
        }

        const existing = readLocalMoldCollections();
        const prior = existing[collectionId as unknown as string];
        const encryptedResult = await encryptItemsIfNeeded(
          items as unknown as JsonObject,
          sourceFile.metadata,
          collectionId,
          prior,
          cryptoResult.value,
          resolvedSecrets
        );
        if (encryptedResult.isFailure()) {
          return fail(encryptedResult.message);
        }

        existing[collectionId] =
          encryptedResult.value !== undefined ? encryptedResult.value : (sourceFile as unknown);
        writeLocalMoldCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch (e) {
        return fail(
          `Failed to persist collection "${collectionId}": ${e instanceof Error ? e.message : String(e)}`
        );
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [
      getFileBackedCollectionExportFormat,
      incrementVersion,
      notifyLibraryChanged,
      resolvedSecrets,
      runtime,
      tryWriteFileBackedCollection
    ]
  );

  const createFillingCollection = useCallback(
    async (params: ICreateCollectionParams): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<FillingId, BaseFillingId, Filling>(
        runtime.library.fillings
      );
      const secretName = params.secretName?.trim();
      const metadata: LibraryData.ICollectionSourceMetadata = {
        name: params.name,
        ...(params.description !== undefined ? { description: params.description } : {}),
        ...(secretName ? { secretName } : {})
      };

      const createResult = manager.create(params.collectionId, metadata);
      if (createResult.isFailure()) {
        return fail(createResult.message);
      }

      try {
        const existing = readLocalFillingCollections();
        const items = {} as unknown as JsonObject;
        const sourceFile: LibraryData.ICollectionSourceFile<Filling> = {
          metadata,
          items: {}
        };

        if (metadata.secretName) {
          const cryptoResult = Crypto.createBrowserCryptoProvider();
          if (cryptoResult.isFailure()) {
            return fail(`Crypto not available: ${cryptoResult.message}`);
          }
          const encrypted = await encryptItemsIfNeeded(
            items,
            metadata,
            params.collectionId,
            undefined,
            cryptoResult.value,
            resolvedSecrets
          );
          if (encrypted.isFailure()) {
            return fail(encrypted.message);
          }
          if (encrypted.value === undefined) {
            return fail('Failed to encrypt protected collection');
          }
          existing[params.collectionId] = encrypted.value;
        } else {
          existing[params.collectionId] = sourceFile as unknown;
        }

        writeLocalFillingCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch (e) {
        return fail(
          `Failed to persist collection "${params.collectionId}": ${
            e instanceof Error ? e.message : String(e)
          }`
        );
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [incrementVersion, notifyLibraryChanged, resolvedSecrets, runtime]
  );

  const deleteFillingCollection = useCallback(
    (collectionId: SourceId): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<FillingId, BaseFillingId, Filling>(
        runtime.library.fillings
      );
      const result = manager.delete(collectionId);

      if (result.isSuccess()) {
        try {
          const existing = readLocalFillingCollections();
          if (collectionId in existing) {
            delete existing[collectionId];
            writeLocalFillingCollections(existing);
            setLocalCollections(getAllLocalCollectionIds());
          }
        } catch {
          // ignore
        }

        incrementVersion();
        return notifyLibraryChanged();
      }

      // If the collection isn't loaded (e.g. locked protected collection), still allow deleting the
      // persisted local override so you can recover from unknown keys/bad data.
      try {
        const existing = readLocalFillingCollections();
        if (collectionId in existing) {
          delete existing[collectionId];
          writeLocalFillingCollections(existing);
          setLocalCollections(getAllLocalCollectionIds());
          incrementVersion();
          return notifyLibraryChanged();
        }
      } catch {
        // ignore
      }

      return fail(result.message);
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const exportFillingCollection = useCallback(
    async (params: IExportParams): Promise<Result<string>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const collectionResult = runtime.library.fillings.collections.get(params.collectionId);
      if (!collectionResult.isSuccess() || !collectionResult.value) {
        return fail(`Collection "${params.collectionId}" not found`);
      }

      const collection = collectionResult.value;
      const items: Record<BaseFillingId, Filling> = recordFromEntries(collection.items.entries());

      const sourceFile: LibraryData.ICollectionSourceFile<Filling> = {
        metadata: collection.metadata ?? { name: params.collectionId },
        items
      };

      if (sourceFile.metadata?.secretName) {
        if (params.format !== 'json') {
          return fail('Protected collections can only be exported as encrypted JSON');
        }

        const cryptoResult = Crypto.createBrowserCryptoProvider();
        if (cryptoResult.isFailure()) {
          return fail(`Crypto not available: ${cryptoResult.message}`);
        }

        const encrypted = await exportItemsToEncryptedJsonIfNeeded(
          items as unknown as JsonObject,
          sourceFile.metadata,
          params.collectionId,
          cryptoResult.value,
          resolvedSecrets
        );
        if (encrypted.isFailure()) {
          return fail(encrypted.message);
        }
        if (encrypted.value === undefined) {
          return fail('Failed to export protected collection');
        }
        return succeed(encrypted.value);
      }

      return Editing.serializeCollection(sourceFile, params.format);
    },
    [runtime, resolvedSecrets]
  );

  const importFillingCollection = useCallback(
    (params: IImportParams): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const parseResult = Editing.validateAndParseCollection<Filling>(params.content);
      if (parseResult.isFailure()) {
        return fail(`Invalid import file: ${parseResult.message}`);
      }

      const sourceFile = parseResult.value;
      const manager = new Editing.CollectionManager<FillingId, BaseFillingId, Filling>(
        runtime.library.fillings
      );

      if (params.mode === 'replace') {
        if (!manager.exists(params.collectionId)) {
          return fail(`Collection "${params.collectionId}" does not exist`);
        }

        const mutableResult = manager.isMutable(params.collectionId);
        if (mutableResult.isFailure() || !mutableResult.value) {
          return fail(`Collection "${params.collectionId}" is not mutable`);
        }

        const deleteResult = manager.delete(params.collectionId);
        if (deleteResult.isFailure()) {
          return fail(`Failed to delete existing collection: ${deleteResult.message}`);
        }
      } else if (manager.exists(params.collectionId)) {
        return fail(`Collection "${params.collectionId}" already exists`);
      }

      const createResult = runtime.library.fillings.addCollectionEntry({
        id: params.collectionId,
        isMutable: true,
        items: sourceFile.items,
        metadata: sourceFile.metadata
      });

      if (createResult.isFailure()) {
        return fail(`Failed to create collection: ${createResult.message}`);
      }

      try {
        const existing = readLocalFillingCollections();
        existing[params.collectionId] = {
          metadata: sourceFile.metadata,
          items: sourceFile.items
        } as unknown;
        writeLocalFillingCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch {
        // ignore
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const commitFillingCollection = useCallback(
    async (collectionId: SourceId): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const collectionResult = runtime.library.fillings.collections.get(collectionId).asResult;
      if (collectionResult.isFailure()) {
        return fail(`Collection "${collectionId}" not found`);
      }

      const collectionEntry = collectionResult.value;
      if (!collectionEntry.isMutable) {
        return fail(`Collection "${collectionId}" is immutable and cannot be modified`);
      }

      try {
        const items: Record<BaseFillingId, Filling> = recordFromEntries(collectionEntry.items.entries());
        const sourceFile: LibraryData.ICollectionSourceFile<Filling> = {
          metadata: collectionEntry.metadata ?? { name: collectionId },
          items
        };

        const fileFormat = getFileBackedCollectionExportFormat('fillings', collectionId as unknown as string);
        if (fileFormat) {
          if (sourceFile.metadata?.secretName && fileFormat !== 'json') {
            return fail('Protected collections can only be exported as encrypted JSON');
          }

          let contents: string | undefined;
          if (sourceFile.metadata?.secretName) {
            const cryptoResult = Crypto.createBrowserCryptoProvider();
            if (cryptoResult.isFailure()) {
              return fail(`Crypto not available: ${cryptoResult.message}`);
            }
            const encrypted = await exportItemsToEncryptedJsonIfNeeded(
              items as unknown as JsonObject,
              sourceFile.metadata,
              collectionId,
              cryptoResult.value,
              resolvedSecrets
            );
            if (encrypted.isFailure()) {
              return fail(encrypted.message);
            }
            if (encrypted.value === undefined) {
              return fail('Failed to export protected collection');
            }
            contents = encrypted.value;
          } else {
            const serialized = Editing.serializeCollection(sourceFile, fileFormat);
            if (serialized.isFailure()) {
              return fail(serialized.message);
            }
            contents = serialized.value;
          }

          const writeResult = await tryWriteFileBackedCollection(
            'fillings',
            collectionId as unknown as string,
            contents
          );
          if (writeResult.isFailure()) {
            return fail(writeResult.message);
          }
          if (writeResult.value) {
            try {
              const existing = readLocalFillingCollections();
              if (sourceFile.metadata?.secretName) {
                existing[collectionId as unknown as string] = JSON.parse(contents) as unknown;
              } else {
                existing[collectionId as unknown as string] = sourceFile as unknown;
              }
              writeLocalFillingCollections(existing);
              setLocalCollections(getAllLocalCollectionIds());
            } catch {
              // ignore
            }

            incrementVersion();
            return notifyLibraryChanged();
          }
        }

        const cryptoResult = Crypto.createBrowserCryptoProvider();
        if (cryptoResult.isFailure()) {
          return fail(`Crypto not available: ${cryptoResult.message}`);
        }

        const existing = readLocalFillingCollections();
        const prior = existing[collectionId as unknown as string];
        const encryptedResult = await encryptItemsIfNeeded(
          items as unknown as JsonObject,
          sourceFile.metadata,
          collectionId,
          prior,
          cryptoResult.value,
          resolvedSecrets
        );
        if (encryptedResult.isFailure()) {
          return fail(encryptedResult.message);
        }

        existing[collectionId] =
          encryptedResult.value !== undefined ? encryptedResult.value : (sourceFile as unknown);
        writeLocalFillingCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch (e) {
        return fail(
          `Failed to persist collection "${collectionId}": ${e instanceof Error ? e.message : String(e)}`
        );
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [
      getFileBackedCollectionExportFormat,
      incrementVersion,
      notifyLibraryChanged,
      resolvedSecrets,
      runtime,
      tryWriteFileBackedCollection
    ]
  );

  const renameFillingCollection = useCallback(
    async (
      collectionId: SourceId,
      newName: string,
      newDescription?: string,
      secretName?: string
    ): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const collectionResult = runtime.library.fillings.collections.get(collectionId).asResult;
      if (collectionResult.isFailure()) {
        return fail(`Collection "${collectionId}" not found`);
      }
      if (!collectionResult.value.isMutable) {
        return fail(`Collection "${collectionId}" is immutable and cannot be modified`);
      }
      const prevSecretName = collectionResult.value.metadata?.secretName;

      const manager = new Editing.CollectionManager<FillingId, BaseFillingId, Filling>(
        runtime.library.fillings
      );
      const metadata: Partial<LibraryData.ICollectionSourceMetadata> = {
        name: newName,
        ...(newDescription !== undefined ? { description: newDescription } : {}),
        ...(secretName !== undefined ? { secretName } : {})
      };

      const updateResult = manager.updateMetadata(collectionId, metadata);
      if (updateResult.isFailure()) {
        return fail(updateResult.message);
      }

      const commitResult = await commitFillingCollection(collectionId);
      if (commitResult.isFailure()) {
        try {
          const rollback: Partial<LibraryData.ICollectionSourceMetadata> = {
            name: collectionResult.value.metadata?.name ?? newName,
            ...(prevSecretName !== undefined ? { secretName: prevSecretName } : { secretName: '' })
          };
          manager.updateMetadata(collectionId, rollback);
        } catch {
          // ignore
        }
        return fail(commitResult.message);
      }

      return succeed(undefined);
    },
    [commitFillingCollection, runtime]
  );

  const commitProcedureCollection = useCallback(
    async (collectionId: SourceId): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const collectionResult = runtime.library.procedures.collections.get(collectionId).asResult;
      if (collectionResult.isFailure()) {
        return fail(`Collection "${collectionId}" not found`);
      }

      const collectionEntry = collectionResult.value;
      if (!collectionEntry.isMutable) {
        return fail(`Collection "${collectionId}" is immutable and cannot be modified`);
      }

      try {
        const items: Record<BaseProcedureId, Procedure> = recordFromEntries(collectionEntry.items.entries());
        const sourceFile: LibraryData.ICollectionSourceFile<Procedure> = {
          metadata: collectionEntry.metadata ?? { name: collectionId },
          items
        };

        const fileFormat = getFileBackedCollectionExportFormat(
          'procedures',
          collectionId as unknown as string
        );
        if (fileFormat) {
          if (sourceFile.metadata?.secretName && fileFormat !== 'json') {
            return fail('Protected collections can only be exported as encrypted JSON');
          }

          let contents: string | undefined;
          if (sourceFile.metadata?.secretName) {
            const cryptoResult = Crypto.createBrowserCryptoProvider();
            if (cryptoResult.isFailure()) {
              return fail(`Crypto not available: ${cryptoResult.message}`);
            }
            const encrypted = await exportItemsToEncryptedJsonIfNeeded(
              items as unknown as JsonObject,
              sourceFile.metadata,
              collectionId,
              cryptoResult.value,
              resolvedSecrets
            );
            if (encrypted.isFailure()) {
              return fail(encrypted.message);
            }
            if (encrypted.value === undefined) {
              return fail('Failed to export protected collection');
            }
            contents = encrypted.value;
          } else {
            const serialized = Editing.serializeCollection(sourceFile, fileFormat);
            if (serialized.isFailure()) {
              return fail(serialized.message);
            }
            contents = serialized.value;
          }

          const writeResult = await tryWriteFileBackedCollection(
            'procedures',
            collectionId as unknown as string,
            contents
          );
          if (writeResult.isFailure()) {
            return fail(writeResult.message);
          }
          if (writeResult.value) {
            try {
              const existing = readLocalProcedureCollections();
              if (sourceFile.metadata?.secretName) {
                existing[collectionId as unknown as string] = JSON.parse(contents) as unknown;
              } else {
                existing[collectionId as unknown as string] = sourceFile as unknown;
              }
              writeLocalProcedureCollections(existing);
              setLocalCollections(getAllLocalCollectionIds());
            } catch {
              // ignore
            }

            incrementVersion();
            return notifyLibraryChanged();
          }
        }

        const cryptoResult = Crypto.createBrowserCryptoProvider();
        if (cryptoResult.isFailure()) {
          return fail(`Crypto not available: ${cryptoResult.message}`);
        }

        const existing = readLocalProcedureCollections();
        const prior = existing[collectionId as unknown as string];
        const encryptedResult = await encryptItemsIfNeeded(
          items as unknown as JsonObject,
          sourceFile.metadata,
          collectionId,
          prior,
          cryptoResult.value,
          resolvedSecrets
        );
        if (encryptedResult.isFailure()) {
          return fail(encryptedResult.message);
        }

        existing[collectionId] =
          encryptedResult.value !== undefined ? encryptedResult.value : (sourceFile as unknown);
        writeLocalProcedureCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch (e) {
        return fail(
          `Failed to persist collection "${collectionId}": ${e instanceof Error ? e.message : String(e)}`
        );
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [
      getFileBackedCollectionExportFormat,
      incrementVersion,
      notifyLibraryChanged,
      resolvedSecrets,
      runtime,
      tryWriteFileBackedCollection
    ]
  );

  const commitTaskCollection = useCallback(
    async (collectionId: SourceId): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const collectionResult = runtime.library.tasks.collections.get(collectionId).asResult;
      if (collectionResult.isFailure()) {
        return fail(`Collection "${collectionId}" not found`);
      }

      const collectionEntry = collectionResult.value;
      if (!collectionEntry.isMutable) {
        return fail(`Collection "${collectionId}" is immutable and cannot be modified`);
      }

      try {
        const items: Record<BaseTaskId, Task> = recordFromEntries(collectionEntry.items.entries());
        const sourceFile: LibraryData.ICollectionSourceFile<Task> = {
          metadata: collectionEntry.metadata ?? { name: collectionId },
          items
        };

        const fileFormat = getFileBackedCollectionExportFormat('tasks', collectionId as unknown as string);
        if (fileFormat) {
          if (sourceFile.metadata?.secretName && fileFormat !== 'json') {
            return fail('Protected collections can only be exported as encrypted JSON');
          }

          let contents: string | undefined;
          if (sourceFile.metadata?.secretName) {
            const cryptoResult = Crypto.createBrowserCryptoProvider();
            if (cryptoResult.isFailure()) {
              return fail(`Crypto not available: ${cryptoResult.message}`);
            }
            const encrypted = await exportItemsToEncryptedJsonIfNeeded(
              items as unknown as JsonObject,
              sourceFile.metadata,
              collectionId,
              cryptoResult.value,
              resolvedSecrets
            );
            if (encrypted.isFailure()) {
              return fail(encrypted.message);
            }
            if (encrypted.value === undefined) {
              return fail('Failed to export protected collection');
            }
            contents = encrypted.value;
          } else {
            const serialized = Editing.serializeCollection(sourceFile, fileFormat);
            if (serialized.isFailure()) {
              return fail(serialized.message);
            }
            contents = serialized.value;
          }

          const writeResult = await tryWriteFileBackedCollection(
            'tasks',
            collectionId as unknown as string,
            contents
          );
          if (writeResult.isFailure()) {
            return fail(writeResult.message);
          }
          if (writeResult.value) {
            try {
              const existing = readLocalTaskCollections();
              if (sourceFile.metadata?.secretName) {
                existing[collectionId as unknown as string] = JSON.parse(contents) as unknown;
              } else {
                existing[collectionId as unknown as string] = sourceFile as unknown;
              }
              writeLocalTaskCollections(existing);
              setLocalCollections(getAllLocalCollectionIds());
            } catch {
              // ignore
            }

            incrementVersion();
            return notifyLibraryChanged();
          }
        }

        const cryptoResult = Crypto.createBrowserCryptoProvider();
        if (cryptoResult.isFailure()) {
          return fail(`Crypto not available: ${cryptoResult.message}`);
        }

        const existing = readLocalTaskCollections();
        const prior = existing[collectionId as unknown as string];
        const encryptedResult = await encryptItemsIfNeeded(
          items as unknown as JsonObject,
          sourceFile.metadata,
          collectionId,
          prior,
          cryptoResult.value,
          resolvedSecrets
        );
        if (encryptedResult.isFailure()) {
          return fail(encryptedResult.message);
        }

        existing[collectionId] =
          encryptedResult.value !== undefined ? encryptedResult.value : (sourceFile as unknown);
        writeLocalTaskCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch (e) {
        return fail(
          `Failed to persist collection "${collectionId}": ${e instanceof Error ? e.message : String(e)}`
        );
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [
      getFileBackedCollectionExportFormat,
      incrementVersion,
      notifyLibraryChanged,
      resolvedSecrets,
      runtime,
      tryWriteFileBackedCollection
    ]
  );

  const commitConfectionCollection = useCallback(
    async (collectionId: SourceId): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const collectionResult = runtime.library.confections.collections.get(collectionId).asResult;
      if (collectionResult.isFailure()) {
        return fail(`Collection "${collectionId}" not found`);
      }

      const collectionEntry = collectionResult.value;
      if (!collectionEntry.isMutable) {
        return fail(`Collection "${collectionId}" is immutable and cannot be modified`);
      }

      try {
        const items: Record<BaseConfectionId, Confection> = recordFromEntries(
          collectionEntry.items.entries()
        );
        const sourceFile: LibraryData.ICollectionSourceFile<Confection> = {
          metadata: collectionEntry.metadata ?? { name: collectionId },
          items
        };

        const fileFormat = getFileBackedCollectionExportFormat(
          'confections',
          collectionId as unknown as string
        );
        if (fileFormat) {
          if (sourceFile.metadata?.secretName && fileFormat !== 'json') {
            return fail('Protected collections can only be exported as encrypted JSON');
          }

          let contents: string | undefined;
          if (sourceFile.metadata?.secretName) {
            const cryptoResult = Crypto.createBrowserCryptoProvider();
            if (cryptoResult.isFailure()) {
              return fail(`Crypto not available: ${cryptoResult.message}`);
            }
            const encrypted = await exportItemsToEncryptedJsonIfNeeded(
              items as unknown as JsonObject,
              sourceFile.metadata,
              collectionId,
              cryptoResult.value,
              resolvedSecrets
            );
            if (encrypted.isFailure()) {
              return fail(encrypted.message);
            }
            if (encrypted.value === undefined) {
              return fail('Failed to export protected collection');
            }
            contents = encrypted.value;
          } else {
            const serialized = Editing.serializeCollection(sourceFile, fileFormat);
            if (serialized.isFailure()) {
              return fail(serialized.message);
            }
            contents = serialized.value;
          }

          const writeResult = await tryWriteFileBackedCollection(
            'confections',
            collectionId as unknown as string,
            contents
          );
          if (writeResult.isFailure()) {
            return fail(writeResult.message);
          }
          if (writeResult.value) {
            try {
              const existing = readLocalConfectionCollections();
              if (sourceFile.metadata?.secretName) {
                existing[collectionId as unknown as string] = JSON.parse(contents) as unknown;
              } else {
                existing[collectionId as unknown as string] = sourceFile as unknown;
              }
              writeLocalConfectionCollections(existing);
              setLocalCollections(getAllLocalCollectionIds());
            } catch {
              // ignore
            }

            incrementVersion();
            return notifyLibraryChanged();
          }
        }

        const cryptoResult = Crypto.createBrowserCryptoProvider();
        if (cryptoResult.isFailure()) {
          return fail(`Crypto not available: ${cryptoResult.message}`);
        }

        const existing = readLocalConfectionCollections();
        const prior = existing[collectionId as unknown as string];
        const encryptedResult = await encryptItemsIfNeeded(
          items as unknown as JsonObject,
          sourceFile.metadata,
          collectionId,
          prior,
          cryptoResult.value,
          resolvedSecrets
        );
        if (encryptedResult.isFailure()) {
          return fail(encryptedResult.message);
        }

        existing[collectionId] =
          encryptedResult.value !== undefined ? encryptedResult.value : (sourceFile as unknown);
        writeLocalConfectionCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch (e) {
        return fail(
          `Failed to persist collection "${collectionId}": ${e instanceof Error ? e.message : String(e)}`
        );
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [
      getFileBackedCollectionExportFormat,
      incrementVersion,
      notifyLibraryChanged,
      resolvedSecrets,
      runtime,
      tryWriteFileBackedCollection
    ]
  );

  const createMoldCollection = useCallback(
    async (params: ICreateCollectionParams): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<MoldId, BaseMoldId, Mold>(runtime.library.molds);
      const secretName = params.secretName?.trim();
      const metadata: LibraryData.ICollectionSourceMetadata = {
        name: params.name,
        ...(params.description !== undefined ? { description: params.description } : {}),
        ...(secretName ? { secretName } : {})
      };

      const createResult = manager.create(params.collectionId, metadata);
      if (createResult.isFailure()) {
        return fail(createResult.message);
      }

      try {
        const existing = readLocalMoldCollections();
        const items = {} as unknown as JsonObject;
        const sourceFile: LibraryData.ICollectionSourceFile<Mold> = {
          metadata,
          items: {}
        };

        if (metadata.secretName) {
          const cryptoResult = Crypto.createBrowserCryptoProvider();
          if (cryptoResult.isFailure()) {
            return fail(`Crypto not available: ${cryptoResult.message}`);
          }
          const encrypted = await encryptItemsIfNeeded(
            items,
            metadata,
            params.collectionId,
            undefined,
            cryptoResult.value,
            resolvedSecrets
          );
          if (encrypted.isFailure()) {
            return fail(encrypted.message);
          }
          if (encrypted.value === undefined) {
            return fail('Failed to encrypt protected collection');
          }
          existing[params.collectionId] = encrypted.value;
        } else {
          existing[params.collectionId] = sourceFile as unknown;
        }

        writeLocalMoldCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch (e) {
        return fail(
          `Failed to persist collection "${params.collectionId}": ${
            e instanceof Error ? e.message : String(e)
          }`
        );
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [incrementVersion, notifyLibraryChanged, resolvedSecrets, runtime]
  );

  const deleteMoldCollection = useCallback(
    (collectionId: SourceId): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<MoldId, BaseMoldId, Mold>(runtime.library.molds);
      const result = manager.delete(collectionId);

      if (result.isSuccess()) {
        try {
          const existing = readLocalMoldCollections();
          if (collectionId in existing) {
            delete existing[collectionId];
            writeLocalMoldCollections(existing);
            setLocalCollections(getAllLocalCollectionIds());
          }
        } catch {
          // ignore
        }

        incrementVersion();
        return notifyLibraryChanged();
      }

      try {
        const existing = readLocalMoldCollections();
        if (collectionId in existing) {
          delete existing[collectionId];
          writeLocalMoldCollections(existing);
          setLocalCollections(getAllLocalCollectionIds());
          incrementVersion();
          return notifyLibraryChanged();
        }
      } catch {
        // ignore
      }

      return fail(result.message);
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const renameMoldCollection = useCallback(
    async (
      collectionId: SourceId,
      newName: string,
      newDescription?: string,
      secretName?: string
    ): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<MoldId, BaseMoldId, Mold>(runtime.library.molds);
      const metadata: Partial<LibraryData.ICollectionSourceMetadata> = {
        name: newName,
        ...(newDescription !== undefined ? { description: newDescription } : {}),
        ...(secretName !== undefined ? { secretName } : {})
      };

      const updateResult = manager.updateMetadata(collectionId, metadata);
      if (updateResult.isFailure()) {
        return fail(updateResult.message);
      }

      return await commitMoldCollection(collectionId);
    },
    [commitMoldCollection, runtime]
  );

  const exportMoldCollection = useCallback(
    async (params: IExportParams): Promise<Result<string>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const collectionResult = runtime.library.molds.collections.get(params.collectionId);
      if (!collectionResult.isSuccess() || !collectionResult.value) {
        return fail(`Collection "${params.collectionId}" not found`);
      }

      const collection = collectionResult.value;
      const items: Record<BaseMoldId, Mold> = recordFromEntries(collection.items.entries());

      const sourceFile: LibraryData.ICollectionSourceFile<Mold> = {
        metadata: collection.metadata ?? { name: params.collectionId },
        items
      };

      if (sourceFile.metadata?.secretName) {
        if (params.format !== 'json') {
          return fail('Protected collections can only be exported as encrypted JSON');
        }

        const cryptoResult = Crypto.createBrowserCryptoProvider();
        if (cryptoResult.isFailure()) {
          return fail(`Crypto not available: ${cryptoResult.message}`);
        }

        const encrypted = await exportItemsToEncryptedJsonIfNeeded(
          items as unknown as JsonObject,
          sourceFile.metadata,
          params.collectionId,
          cryptoResult.value,
          resolvedSecrets
        );
        if (encrypted.isFailure()) {
          return fail(encrypted.message);
        }
        if (encrypted.value === undefined) {
          return fail('Failed to export protected collection');
        }
        return succeed(encrypted.value);
      }

      return Editing.serializeCollection(sourceFile, params.format);
    },
    [runtime, resolvedSecrets]
  );

  const importMoldCollection = useCallback(
    (params: IImportParams): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const parseResult = Editing.validateAndParseCollection<Mold>(params.content);
      if (parseResult.isFailure()) {
        return fail(`Invalid import file: ${parseResult.message}`);
      }

      const sourceFile = parseResult.value;
      const manager = new Editing.CollectionManager<MoldId, BaseMoldId, Mold>(runtime.library.molds);

      if (params.mode === 'replace') {
        if (!manager.exists(params.collectionId)) {
          return fail(`Collection "${params.collectionId}" does not exist`);
        }

        const mutableResult = manager.isMutable(params.collectionId);
        if (mutableResult.isFailure() || !mutableResult.value) {
          return fail(`Collection "${params.collectionId}" is not mutable`);
        }

        const deleteResult = manager.delete(params.collectionId);
        if (deleteResult.isFailure()) {
          return fail(`Failed to delete existing collection: ${deleteResult.message}`);
        }
      } else if (manager.exists(params.collectionId)) {
        return fail(`Collection "${params.collectionId}" already exists`);
      }

      const createResult = runtime.library.molds.addCollectionEntry({
        id: params.collectionId,
        isMutable: true,
        items: sourceFile.items,
        metadata: sourceFile.metadata
      });

      if (createResult.isFailure()) {
        return fail(`Failed to create collection: ${createResult.message}`);
      }

      try {
        const existing = readLocalMoldCollections();
        existing[params.collectionId] = {
          metadata: sourceFile.metadata,
          items: sourceFile.items
        } as unknown;
        writeLocalMoldCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch {
        // ignore
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const createProcedureCollection = useCallback(
    async (params: ICreateCollectionParams): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<ProcedureId, BaseProcedureId, Procedure>(
        runtime.library.procedures
      );
      const secretName = params.secretName?.trim();
      const metadata: LibraryData.ICollectionSourceMetadata = {
        name: params.name,
        ...(params.description !== undefined ? { description: params.description } : {}),
        ...(secretName ? { secretName } : {})
      };

      const createResult = manager.create(params.collectionId, metadata);
      if (createResult.isFailure()) {
        return fail(createResult.message);
      }

      try {
        const existing = readLocalProcedureCollections();
        const items = {} as unknown as JsonObject;
        const sourceFile: LibraryData.ICollectionSourceFile<Procedure> = {
          metadata,
          items: {}
        };

        if (metadata.secretName) {
          const cryptoResult = Crypto.createBrowserCryptoProvider();
          if (cryptoResult.isFailure()) {
            return fail(`Crypto not available: ${cryptoResult.message}`);
          }
          const encrypted = await encryptItemsIfNeeded(
            items,
            metadata,
            params.collectionId,
            undefined,
            cryptoResult.value,
            resolvedSecrets
          );
          if (encrypted.isFailure()) {
            return fail(encrypted.message);
          }
          if (encrypted.value === undefined) {
            return fail('Failed to encrypt protected collection');
          }
          existing[params.collectionId] = encrypted.value;
        } else {
          existing[params.collectionId] = sourceFile as unknown;
        }

        writeLocalProcedureCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch (e) {
        return fail(
          `Failed to persist collection "${params.collectionId}": ${
            e instanceof Error ? e.message : String(e)
          }`
        );
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [incrementVersion, notifyLibraryChanged, resolvedSecrets, runtime]
  );

  const deleteProcedureCollection = useCallback(
    (collectionId: SourceId): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<ProcedureId, BaseProcedureId, Procedure>(
        runtime.library.procedures
      );
      const result = manager.delete(collectionId);

      if (result.isSuccess()) {
        try {
          const existing = readLocalProcedureCollections();
          if (collectionId in existing) {
            delete existing[collectionId];
            writeLocalProcedureCollections(existing);
            setLocalCollections(getAllLocalCollectionIds());
          }
        } catch {
          // ignore
        }

        incrementVersion();
        return notifyLibraryChanged();
      }

      try {
        const existing = readLocalProcedureCollections();
        if (collectionId in existing) {
          delete existing[collectionId];
          writeLocalProcedureCollections(existing);
          setLocalCollections(getAllLocalCollectionIds());
          incrementVersion();
          return notifyLibraryChanged();
        }
      } catch {
        // ignore
      }

      return fail(result.message);
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const renameProcedureCollection = useCallback(
    async (
      collectionId: SourceId,
      newName: string,
      newDescription?: string,
      secretName?: string
    ): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const collectionResult = runtime.library.procedures.collections.get(collectionId).asResult;
      if (collectionResult.isFailure()) {
        return fail(`Collection "${collectionId}" not found`);
      }
      if (!collectionResult.value.isMutable) {
        return fail(`Collection "${collectionId}" is immutable and cannot be modified`);
      }
      const prevSecretName = collectionResult.value.metadata?.secretName;

      const manager = new Editing.CollectionManager<ProcedureId, BaseProcedureId, Procedure>(
        runtime.library.procedures
      );
      const metadata: Partial<LibraryData.ICollectionSourceMetadata> = {
        name: newName,
        ...(newDescription !== undefined ? { description: newDescription } : {}),
        ...(secretName !== undefined ? { secretName } : {})
      };

      const updateResult = manager.updateMetadata(collectionId, metadata);
      if (updateResult.isFailure()) {
        return fail(updateResult.message);
      }

      const commitResult = await commitProcedureCollection(collectionId);
      if (commitResult.isFailure()) {
        try {
          const rollback: Partial<LibraryData.ICollectionSourceMetadata> = {
            name: collectionResult.value.metadata?.name ?? newName,
            ...(prevSecretName !== undefined ? { secretName: prevSecretName } : { secretName: '' })
          };
          manager.updateMetadata(collectionId, rollback);
        } catch {
          // ignore
        }
        return fail(commitResult.message);
      }

      return succeed(undefined);
    },
    [commitProcedureCollection, runtime]
  );

  const exportProcedureCollection = useCallback(
    async (params: IExportParams): Promise<Result<string>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const collectionResult = runtime.library.procedures.collections.get(params.collectionId);
      if (!collectionResult.isSuccess() || !collectionResult.value) {
        return fail(`Collection "${params.collectionId}" not found`);
      }

      const collection = collectionResult.value;
      const items: Record<BaseProcedureId, Procedure> = recordFromEntries(collection.items.entries());

      const sourceFile: LibraryData.ICollectionSourceFile<Procedure> = {
        metadata: collection.metadata ?? { name: params.collectionId },
        items
      };

      if (sourceFile.metadata?.secretName) {
        if (params.format !== 'json') {
          return fail('Protected collections can only be exported as encrypted JSON');
        }

        const cryptoResult = Crypto.createBrowserCryptoProvider();
        if (cryptoResult.isFailure()) {
          return fail(`Crypto not available: ${cryptoResult.message}`);
        }

        const encrypted = await exportItemsToEncryptedJsonIfNeeded(
          items as unknown as JsonObject,
          sourceFile.metadata,
          params.collectionId,
          cryptoResult.value,
          resolvedSecrets
        );
        if (encrypted.isFailure()) {
          return fail(encrypted.message);
        }
        if (encrypted.value === undefined) {
          return fail('Failed to export protected collection');
        }
        return succeed(encrypted.value);
      }

      return Editing.serializeCollection(sourceFile, params.format);
    },
    [runtime, resolvedSecrets]
  );

  const importProcedureCollection = useCallback(
    (params: IImportParams): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const parseResult = Editing.validateAndParseCollection<Procedure>(params.content);
      if (parseResult.isFailure()) {
        return fail(`Invalid import file: ${parseResult.message}`);
      }

      const sourceFile = parseResult.value;
      const manager = new Editing.CollectionManager<ProcedureId, BaseProcedureId, Procedure>(
        runtime.library.procedures
      );

      if (params.mode === 'replace') {
        if (!manager.exists(params.collectionId)) {
          return fail(`Collection "${params.collectionId}" does not exist`);
        }

        const mutableResult = manager.isMutable(params.collectionId);
        if (mutableResult.isFailure() || !mutableResult.value) {
          return fail(`Collection "${params.collectionId}" is not mutable`);
        }

        const deleteResult = manager.delete(params.collectionId);
        if (deleteResult.isFailure()) {
          return fail(`Failed to delete existing collection: ${deleteResult.message}`);
        }
      } else if (manager.exists(params.collectionId)) {
        return fail(`Collection "${params.collectionId}" already exists`);
      }

      const createResult = runtime.library.procedures.addCollectionEntry({
        id: params.collectionId,
        isMutable: true,
        items: sourceFile.items,
        metadata: sourceFile.metadata
      });

      if (createResult.isFailure()) {
        return fail(`Failed to create collection: ${createResult.message}`);
      }

      try {
        const existing = readLocalProcedureCollections();
        existing[params.collectionId] = {
          metadata: sourceFile.metadata,
          items: sourceFile.items
        } as unknown;
        writeLocalProcedureCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch {
        // ignore
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const createTaskCollection = useCallback(
    async (params: ICreateCollectionParams): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<TaskId, BaseTaskId, Task>(runtime.library.tasks);
      const secretName = params.secretName?.trim();
      const metadata: LibraryData.ICollectionSourceMetadata = {
        name: params.name,
        ...(params.description !== undefined ? { description: params.description } : {}),
        ...(secretName ? { secretName } : {})
      };

      const createResult = manager.create(params.collectionId, metadata);
      if (createResult.isFailure()) {
        return fail(createResult.message);
      }

      try {
        const existing = readLocalTaskCollections();
        const items = {} as unknown as JsonObject;
        const sourceFile: LibraryData.ICollectionSourceFile<Task> = {
          metadata,
          items: {}
        };

        if (metadata.secretName) {
          const cryptoResult = Crypto.createBrowserCryptoProvider();
          if (cryptoResult.isFailure()) {
            return fail(`Crypto not available: ${cryptoResult.message}`);
          }
          const encrypted = await encryptItemsIfNeeded(
            items,
            metadata,
            params.collectionId,
            undefined,
            cryptoResult.value,
            resolvedSecrets
          );
          if (encrypted.isFailure()) {
            return fail(encrypted.message);
          }
          if (encrypted.value === undefined) {
            return fail('Failed to encrypt protected collection');
          }
          existing[params.collectionId] = encrypted.value;
        } else {
          existing[params.collectionId] = sourceFile as unknown;
        }

        writeLocalTaskCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch (e) {
        return fail(
          `Failed to persist collection "${params.collectionId}": ${
            e instanceof Error ? e.message : String(e)
          }`
        );
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [incrementVersion, notifyLibraryChanged, resolvedSecrets, runtime]
  );

  const deleteTaskCollection = useCallback(
    (collectionId: SourceId): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<TaskId, BaseTaskId, Task>(runtime.library.tasks);
      const result = manager.delete(collectionId);

      if (result.isSuccess()) {
        try {
          const existing = readLocalTaskCollections();
          if (collectionId in existing) {
            delete existing[collectionId];
            writeLocalTaskCollections(existing);
            setLocalCollections(getAllLocalCollectionIds());
          }
        } catch {
          // ignore
        }

        incrementVersion();
        return notifyLibraryChanged();
      }

      try {
        const existing = readLocalTaskCollections();
        if (collectionId in existing) {
          delete existing[collectionId];
          writeLocalTaskCollections(existing);
          setLocalCollections(getAllLocalCollectionIds());
          incrementVersion();
          return notifyLibraryChanged();
        }
      } catch {
        // ignore
      }

      return fail(result.message);
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const renameTaskCollection = useCallback(
    async (
      collectionId: SourceId,
      newName: string,
      newDescription?: string,
      secretName?: string
    ): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<TaskId, BaseTaskId, Task>(runtime.library.tasks);
      const metadata: Partial<LibraryData.ICollectionSourceMetadata> = {
        name: newName,
        ...(newDescription !== undefined ? { description: newDescription } : {}),
        ...(secretName !== undefined ? { secretName } : {})
      };

      const updateResult = manager.updateMetadata(collectionId, metadata);
      if (updateResult.isFailure()) {
        return fail(updateResult.message);
      }

      return await commitTaskCollection(collectionId);
    },
    [commitTaskCollection, runtime]
  );

  const exportTaskCollection = useCallback(
    async (params: IExportParams): Promise<Result<string>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const collectionResult = runtime.library.tasks.collections.get(params.collectionId);
      if (!collectionResult.isSuccess() || !collectionResult.value) {
        return fail(`Collection "${params.collectionId}" not found`);
      }

      const collection = collectionResult.value;
      const items: Record<BaseTaskId, Task> = recordFromEntries(collection.items.entries());

      const sourceFile: LibraryData.ICollectionSourceFile<Task> = {
        metadata: collection.metadata ?? { name: params.collectionId },
        items
      };

      if (sourceFile.metadata?.secretName) {
        if (params.format !== 'json') {
          return fail('Protected collections can only be exported as encrypted JSON');
        }

        const cryptoResult = Crypto.createBrowserCryptoProvider();
        if (cryptoResult.isFailure()) {
          return fail(`Crypto not available: ${cryptoResult.message}`);
        }

        const encrypted = await exportItemsToEncryptedJsonIfNeeded(
          items as unknown as JsonObject,
          sourceFile.metadata,
          params.collectionId,
          cryptoResult.value,
          resolvedSecrets
        );
        if (encrypted.isFailure()) {
          return fail(encrypted.message);
        }
        if (encrypted.value === undefined) {
          return fail('Failed to export protected collection');
        }
        return succeed(encrypted.value);
      }

      return Editing.serializeCollection(sourceFile, params.format);
    },
    [runtime, resolvedSecrets]
  );

  const importTaskCollection = useCallback(
    (params: IImportParams): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const parseResult = Editing.validateAndParseCollection<Task>(params.content);
      if (parseResult.isFailure()) {
        return fail(`Invalid import file: ${parseResult.message}`);
      }

      const sourceFile = parseResult.value;
      const manager = new Editing.CollectionManager<TaskId, BaseTaskId, Task>(runtime.library.tasks);

      if (params.mode === 'replace') {
        if (!manager.exists(params.collectionId)) {
          return fail(`Collection "${params.collectionId}" does not exist`);
        }

        const mutableResult = manager.isMutable(params.collectionId);
        if (mutableResult.isFailure() || !mutableResult.value) {
          return fail(`Collection "${params.collectionId}" is not mutable`);
        }

        const deleteResult = manager.delete(params.collectionId);
        if (deleteResult.isFailure()) {
          return fail(`Failed to delete existing collection: ${deleteResult.message}`);
        }
      } else if (manager.exists(params.collectionId)) {
        return fail(`Collection "${params.collectionId}" already exists`);
      }

      const createResult = runtime.library.tasks.addCollectionEntry({
        id: params.collectionId,
        isMutable: true,
        items: sourceFile.items,
        metadata: sourceFile.metadata
      });

      if (createResult.isFailure()) {
        return fail(`Failed to create collection: ${createResult.message}`);
      }

      try {
        const existing = readLocalTaskCollections();
        existing[params.collectionId] = {
          metadata: sourceFile.metadata,
          items: sourceFile.items
        } as unknown;
        writeLocalTaskCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch {
        // ignore
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  // ============================================================================
  // Confection Collection Management
  // ============================================================================

  const createConfectionCollection = useCallback(
    async (params: ICreateCollectionParams): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<ConfectionId, BaseConfectionId, Confection>(
        runtime.library.confections
      );
      const secretName = params.secretName?.trim();
      const metadata: LibraryData.ICollectionSourceMetadata = {
        name: params.name,
        ...(params.description !== undefined ? { description: params.description } : {}),
        ...(secretName ? { secretName } : {})
      };

      const createResult = manager.create(params.collectionId, metadata);
      if (createResult.isFailure()) {
        return fail(createResult.message);
      }

      try {
        const existing = readLocalConfectionCollections();
        const items = {} as unknown as JsonObject;
        const sourceFile: LibraryData.ICollectionSourceFile<Confection> = {
          metadata,
          items: {}
        };

        if (metadata.secretName) {
          const cryptoResult = Crypto.createBrowserCryptoProvider();
          if (cryptoResult.isFailure()) {
            return fail(`Crypto not available: ${cryptoResult.message}`);
          }
          const encrypted = await encryptItemsIfNeeded(
            items,
            metadata,
            params.collectionId,
            undefined,
            cryptoResult.value,
            resolvedSecrets
          );
          if (encrypted.isFailure()) {
            return fail(encrypted.message);
          }
          if (encrypted.value === undefined) {
            return fail('Failed to encrypt protected collection');
          }
          existing[params.collectionId] = encrypted.value;
        } else {
          existing[params.collectionId] = sourceFile as unknown;
        }

        writeLocalConfectionCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch (e) {
        return fail(
          `Failed to persist collection "${params.collectionId}": ${
            e instanceof Error ? e.message : String(e)
          }`
        );
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [incrementVersion, notifyLibraryChanged, resolvedSecrets, runtime]
  );

  const deleteConfectionCollection = useCallback(
    (collectionId: SourceId): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<ConfectionId, BaseConfectionId, Confection>(
        runtime.library.confections
      );
      const result = manager.delete(collectionId);

      if (result.isSuccess()) {
        try {
          const existing = readLocalConfectionCollections();
          if (collectionId in existing) {
            delete existing[collectionId];
            writeLocalConfectionCollections(existing);
            setLocalCollections(getAllLocalCollectionIds());
          }
        } catch {
          // ignore
        }

        incrementVersion();
        return notifyLibraryChanged();
      }

      try {
        const existing = readLocalConfectionCollections();
        if (collectionId in existing) {
          delete existing[collectionId];
          writeLocalConfectionCollections(existing);
          setLocalCollections(getAllLocalCollectionIds());
          incrementVersion();
          return notifyLibraryChanged();
        }
      } catch {
        // ignore
      }

      return fail(result.message);
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const exportConfectionCollection = useCallback(
    async (params: IExportParams): Promise<Result<string>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const collectionResult = runtime.library.confections.collections.get(params.collectionId);
      if (!collectionResult.isSuccess() || !collectionResult.value) {
        return fail(`Collection "${params.collectionId}" not found`);
      }

      const collection = collectionResult.value;
      const items: Record<BaseConfectionId, Confection> = recordFromEntries(collection.items.entries());

      const sourceFile: LibraryData.ICollectionSourceFile<Confection> = {
        metadata: collection.metadata ?? { name: params.collectionId },
        items
      };

      if (sourceFile.metadata?.secretName) {
        if (params.format !== 'json') {
          return fail('Protected collections can only be exported as encrypted JSON');
        }

        const cryptoResult = Crypto.createBrowserCryptoProvider();
        if (cryptoResult.isFailure()) {
          return fail(`Crypto not available: ${cryptoResult.message}`);
        }

        const encrypted = await exportItemsToEncryptedJsonIfNeeded(
          items as unknown as JsonObject,
          sourceFile.metadata,
          params.collectionId,
          cryptoResult.value,
          resolvedSecrets
        );
        if (encrypted.isFailure()) {
          return fail(encrypted.message);
        }
        if (encrypted.value === undefined) {
          return fail('Failed to export protected collection');
        }
        return succeed(encrypted.value);
      }

      return Editing.serializeCollection(sourceFile, params.format);
    },
    [runtime, resolvedSecrets]
  );

  const importConfectionCollection = useCallback(
    (params: IImportParams): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const parseResult = Editing.validateAndParseCollection<Confection>(params.content);
      if (parseResult.isFailure()) {
        return fail(`Invalid import file: ${parseResult.message}`);
      }

      const sourceFile = parseResult.value;
      const manager = new Editing.CollectionManager<ConfectionId, BaseConfectionId, Confection>(
        runtime.library.confections
      );

      if (params.mode === 'replace') {
        if (!manager.exists(params.collectionId)) {
          return fail(`Collection "${params.collectionId}" does not exist`);
        }

        const mutableResult = manager.isMutable(params.collectionId);
        if (mutableResult.isFailure() || !mutableResult.value) {
          return fail(`Collection "${params.collectionId}" is not mutable`);
        }

        const deleteResult = manager.delete(params.collectionId);
        if (deleteResult.isFailure()) {
          return fail(`Failed to delete existing collection: ${deleteResult.message}`);
        }
      } else if (manager.exists(params.collectionId)) {
        return fail(`Collection "${params.collectionId}" already exists`);
      }

      const createResult = runtime.library.confections.addCollectionEntry({
        id: params.collectionId,
        isMutable: true,
        items: sourceFile.items,
        metadata: sourceFile.metadata
      });

      if (createResult.isFailure()) {
        return fail(`Failed to create collection: ${createResult.message}`);
      }

      try {
        const existing = readLocalConfectionCollections();
        existing[params.collectionId] = {
          metadata: sourceFile.metadata,
          items: sourceFile.items
        } as unknown;
        writeLocalConfectionCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch {
        // ignore
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const renameConfectionCollection = useCallback(
    async (
      collectionId: SourceId,
      newName: string,
      newDescription?: string,
      secretName?: string
    ): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<ConfectionId, BaseConfectionId, Confection>(
        runtime.library.confections
      );
      const metadata: Partial<LibraryData.ICollectionSourceMetadata> = {
        name: newName,
        ...(newDescription !== undefined ? { description: newDescription } : {}),
        ...(secretName !== undefined ? { secretName } : {})
      };

      const updateResult = manager.updateMetadata(collectionId, metadata);
      if (updateResult.isFailure()) {
        return fail(updateResult.message);
      }

      return await commitConfectionCollection(collectionId);
    },
    [commitConfectionCollection, runtime]
  );

  // Get or create an ingredient editor
  const getIngredientEditor = useCallback(
    (collectionId: SourceId): Result<Editing.Ingredients.IngredientEditorContext> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      // Check if editor already exists
      const existing = editorsRef.current.get(collectionId);
      if (existing) {
        return succeed(existing.editor);
      }

      // Get the collection from the library
      const collectionResult = runtime.library.ingredients.collections.get(collectionId);
      if (!collectionResult.isSuccess()) {
        return fail(`Collection "${collectionId}" not found`);
      }

      const collectionEntry = collectionResult.value;
      if (!collectionEntry) {
        return fail(`Collection "${collectionId}" not found`);
      }

      // Check if collection is mutable
      if (!collectionEntry.isMutable) {
        return fail(`Collection "${collectionId}" is immutable and cannot be edited`);
      }

      // Convert ValidatingResultMap items to a plain Map for EditableCollection
      const itemsMap = new Map<BaseIngredientId, Ingredient>();
      for (const [key, value] of collectionEntry.items.entries()) {
        itemsMap.set(key, value);
      }

      // Create editable collection from the library data
      const editableResult = Editing.EditableCollection.createEditable<Ingredient, BaseIngredientId>({
        collectionId,
        metadata: collectionEntry.metadata ?? { name: collectionId },
        isMutable: true,
        initialItems: itemsMap,
        keyConverter: ChocolateConverters.baseIngredientId,
        valueConverter: Entities.Ingredients.Converters.ingredient
      });

      if (editableResult.isFailure()) {
        return fail(`Failed to create editable collection: ${editableResult.message}`);
      }

      // Create the editor context
      const editorResult = Editing.Ingredients.IngredientEditorContext.createFromCollection(
        editableResult.value
      );

      if (editorResult.isFailure()) {
        return fail(`Failed to create editor: ${editorResult.message}`);
      }

      // Store the editor
      const editorState: IEditorState = {
        editor: editorResult.value,
        isDirty: false,
        lastModified: Date.now()
      };
      editorsRef.current.set(collectionId, editorState);
      setActiveEditorIds((prev) => [...prev, collectionId]);

      return succeed(editorResult.value);
    },
    [runtime]
  );

  // Check if editor exists
  const hasEditor = useCallback((collectionId: SourceId): boolean => {
    return editorsRef.current.has(collectionId);
  }, []);

  // Close an editor
  const closeEditor = useCallback((collectionId: SourceId): void => {
    editorsRef.current.delete(collectionId);
    setActiveEditorIds((prev) => prev.filter((id) => id !== collectionId));
    setDirtyCollections((prev) => prev.filter((id) => id !== collectionId));
  }, []);

  // Mark collection as dirty
  const markDirty = useCallback((collectionId: SourceId): void => {
    const editor = editorsRef.current.get(collectionId);
    if (editor) {
      editor.isDirty = true;
      editor.lastModified = Date.now();
    }
    setDirtyCollections((prev) => {
      if (prev.includes(collectionId)) return prev;
      return [...prev, collectionId];
    });
  }, []);

  // Mark collection as clean
  const markClean = useCallback((collectionId: SourceId): void => {
    const editor = editorsRef.current.get(collectionId);
    if (editor) {
      editor.isDirty = false;
    }
    setDirtyCollections((prev) => prev.filter((id) => id !== collectionId));
  }, []);

  // Create a new collection
  const createCollection = useCallback(
    async (params: ICreateCollectionParams): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<IngredientId, BaseIngredientId, Ingredient>(
        runtime.library.ingredients
      );

      const secretName = params.secretName?.trim();
      const metadata: LibraryData.ICollectionSourceMetadata = {
        name: params.name,
        ...(params.description !== undefined ? { description: params.description } : {}),
        ...(secretName ? { secretName } : {})
      };

      const createResult = manager.create(params.collectionId, metadata);
      if (createResult.isFailure()) {
        return fail(createResult.message);
      }

      // Persist empty collection file immediately so it survives reload
      try {
        const existing = readLocalIngredientCollections();
        const items = {} as unknown as JsonObject;
        const sourceFile: LibraryData.ICollectionSourceFile<Ingredient> = {
          metadata,
          items: {}
        };

        if (metadata.secretName) {
          const cryptoResult = Crypto.createBrowserCryptoProvider();
          if (cryptoResult.isFailure()) {
            return fail(`Crypto not available: ${cryptoResult.message}`);
          }
          const encrypted = await encryptItemsIfNeeded(
            items,
            metadata,
            params.collectionId,
            undefined,
            cryptoResult.value,
            resolvedSecrets
          );
          if (encrypted.isFailure()) {
            return fail(encrypted.message);
          }
          if (encrypted.value === undefined) {
            return fail('Failed to encrypt protected collection');
          }
          existing[params.collectionId] = encrypted.value;
        } else {
          existing[params.collectionId] = sourceFile as unknown;
        }

        writeLocalIngredientCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch (e) {
        return fail(
          `Failed to persist collection "${params.collectionId}": ${
            e instanceof Error ? e.message : String(e)
          }`
        );
      }

      incrementVersion();
      return notifyLibraryChanged();
    },
    [incrementVersion, notifyLibraryChanged, resolvedSecrets, runtime]
  );

  // Delete a collection
  const deleteCollection = useCallback(
    (collectionId: SourceId): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      // Close any active editor first
      closeEditor(collectionId);

      const manager = new Editing.CollectionManager<IngredientId, BaseIngredientId, Ingredient>(
        runtime.library.ingredients
      );

      const result = manager.delete(collectionId);

      if (result.isSuccess()) {
        // Remove local persisted override (if any)
        try {
          const existing = readLocalIngredientCollections();
          if (collectionId in existing) {
            delete existing[collectionId];
            writeLocalIngredientCollections(existing);
            setLocalCollections(getAllLocalCollectionIds());
          }
        } catch {
          // ignore
        }

        incrementVersion();
        return notifyLibraryChanged();
      }

      // If the collection isn't loaded (e.g. locked protected collection), still allow deleting the
      // persisted local override so you can recover from unknown keys/bad data.
      try {
        const existing = readLocalIngredientCollections();
        if (collectionId in existing) {
          delete existing[collectionId];
          writeLocalIngredientCollections(existing);
          setLocalCollections(getAllLocalCollectionIds());
          incrementVersion();
          return notifyLibraryChanged();
        }
      } catch {
        // ignore
      }

      return fail(result.message);
    },
    [runtime, closeEditor, incrementVersion, notifyLibraryChanged]
  );

  // Rename a collection
  const renameCollection = useCallback(
    async (
      collectionId: SourceId,
      newName: string,
      newDescription?: string,
      secretName?: string
    ): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<IngredientId, BaseIngredientId, Ingredient>(
        runtime.library.ingredients
      );

      const metadata: Partial<LibraryData.ICollectionSourceMetadata> = {
        name: newName,
        ...(newDescription !== undefined ? { description: newDescription } : {}),
        ...(secretName !== undefined ? { secretName } : {})
      };

      const updateResult = manager.updateMetadata(collectionId, metadata);
      if (updateResult.isFailure()) {
        return fail(updateResult.message);
      }

      return await commitCollection(collectionId);
    },
    [commitCollection, runtime]
  );

  // Check if collection is mutable
  const isCollectionMutable = useCallback(
    (collectionId: SourceId): boolean => {
      if (!runtime) return false;

      const collectionResult = runtime.library.ingredients.collections.get(collectionId);
      if (!collectionResult.isSuccess() || !collectionResult.value) return false;

      return collectionResult.value.isMutable;
    },
    [runtime]
  );

  // Export a collection
  const exportCollection = useCallback(
    async (params: IExportParams): Promise<Result<string>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const collectionResult = runtime.library.ingredients.collections.get(params.collectionId);
      if (!collectionResult.isSuccess() || !collectionResult.value) {
        return fail(`Collection "${params.collectionId}" not found`);
      }

      const collection = collectionResult.value;

      // Build ICollectionSourceFile structure
      const items: Record<BaseIngredientId, Ingredient> = recordFromEntries(collection.items.entries());

      const sourceFile: LibraryData.ICollectionSourceFile<Ingredient> = {
        metadata: collection.metadata ?? { name: params.collectionId },
        items
      };

      if (sourceFile.metadata?.secretName) {
        if (params.format !== 'json') {
          return fail('Protected collections can only be exported as encrypted JSON');
        }

        const cryptoResult = Crypto.createBrowserCryptoProvider();
        if (cryptoResult.isFailure()) {
          return fail(`Crypto not available: ${cryptoResult.message}`);
        }

        const encrypted = await exportItemsToEncryptedJsonIfNeeded(
          items as unknown as JsonObject,
          sourceFile.metadata,
          params.collectionId,
          cryptoResult.value,
          resolvedSecrets
        );
        if (encrypted.isFailure()) {
          return fail(encrypted.message);
        }
        if (encrypted.value === undefined) {
          return fail('Failed to export protected collection');
        }
        return succeed(encrypted.value);
      }

      // Serialize based on format
      return Editing.serializeCollection(sourceFile, params.format);
    },
    [runtime, resolvedSecrets]
  );

  // Import a collection
  const importCollection = useCallback(
    (params: IImportParams): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      // Parse and validate the content
      const parseResult = Editing.validateAndParseCollection<Ingredient>(params.content);
      if (parseResult.isFailure()) {
        return fail(`Invalid import file: ${parseResult.message}`);
      }

      const sourceFile = parseResult.value;
      const manager = new Editing.CollectionManager<IngredientId, BaseIngredientId, Ingredient>(
        runtime.library.ingredients
      );

      if (params.mode === 'replace') {
        // Check if collection exists and is mutable
        if (!manager.exists(params.collectionId)) {
          return fail(`Collection "${params.collectionId}" does not exist`);
        }

        const mutableResult = manager.isMutable(params.collectionId);
        if (mutableResult.isFailure() || !mutableResult.value) {
          return fail(`Collection "${params.collectionId}" is not mutable`);
        }

        // Delete existing and recreate
        const deleteResult = manager.delete(params.collectionId);
        if (deleteResult.isFailure()) {
          return fail(`Failed to delete existing collection: ${deleteResult.message}`);
        }
      } else if (manager.exists(params.collectionId)) {
        return fail(`Collection "${params.collectionId}" already exists`);
      }

      // Create the collection with imported data
      const createResult = runtime.library.ingredients.addCollectionEntry({
        id: params.collectionId,
        isMutable: true,
        items: sourceFile.items,
        metadata: sourceFile.metadata
      });

      if (createResult.isFailure()) {
        return fail(`Failed to create collection: ${createResult.message}`);
      }

      // Persist imported content
      try {
        const existing = readLocalIngredientCollections();
        existing[params.collectionId] = {
          metadata: sourceFile.metadata,
          items: sourceFile.items
        } as unknown;
        writeLocalIngredientCollections(existing);
        setLocalCollections(getAllLocalCollectionIds());
      } catch {
        // ignore
      }

      // Close any existing editor (it's now stale)
      closeEditor(params.collectionId);
      incrementVersion();

      return notifyLibraryChanged();
    },
    [runtime, closeEditor, incrementVersion, notifyLibraryChanged]
  );

  // Compute hasUnsavedChanges
  const hasUnsavedChanges = dirtyCollections.length > 0;
  const hasLocalChanges = localCollections.length > 0;

  const value = useMemo(
    (): IEditingContext => ({
      getIngredientEditor,
      hasEditor,
      closeEditor,
      activeEditors: activeEditorIds,
      hasUnsavedChanges,
      dirtyCollections,
      markDirty,
      markClean,
      localCollections,
      hasLocalChanges,
      createCollection,
      deleteCollection,
      renameCollection,
      isCollectionMutable,
      exportCollection,
      importCollection,
      createMoldCollection,
      deleteMoldCollection,
      renameMoldCollection,
      exportMoldCollection,
      importMoldCollection,
      createFillingCollection,
      deleteFillingCollection,
      renameFillingCollection,
      exportFillingCollection,
      importFillingCollection,
      createProcedureCollection,
      deleteProcedureCollection,
      renameProcedureCollection,
      exportProcedureCollection,
      importProcedureCollection,
      createTaskCollection,
      deleteTaskCollection,
      renameTaskCollection,
      exportTaskCollection,
      importTaskCollection,
      createConfectionCollection,
      deleteConfectionCollection,
      renameConfectionCollection,
      exportConfectionCollection,
      importConfectionCollection,
      commitCollection,
      commitMoldCollection,
      commitFillingCollection,
      commitProcedureCollection,
      commitTaskCollection,
      commitConfectionCollection,
      editingVersion
    }),
    [
      getIngredientEditor,
      hasEditor,
      closeEditor,
      activeEditorIds,
      hasUnsavedChanges,
      dirtyCollections,
      markDirty,
      markClean,
      localCollections,
      hasLocalChanges,
      createCollection,
      deleteCollection,
      renameCollection,
      isCollectionMutable,
      exportCollection,
      importCollection,
      createMoldCollection,
      deleteMoldCollection,
      renameMoldCollection,
      exportMoldCollection,
      importMoldCollection,
      createFillingCollection,
      deleteFillingCollection,
      renameFillingCollection,
      exportFillingCollection,
      importFillingCollection,
      createProcedureCollection,
      deleteProcedureCollection,
      renameProcedureCollection,
      exportProcedureCollection,
      importProcedureCollection,
      createTaskCollection,
      deleteTaskCollection,
      renameTaskCollection,
      exportTaskCollection,
      importTaskCollection,
      createConfectionCollection,
      deleteConfectionCollection,
      renameConfectionCollection,
      exportConfectionCollection,
      importConfectionCollection,
      commitCollection,
      commitMoldCollection,
      commitFillingCollection,
      commitProcedureCollection,
      commitTaskCollection,
      commitConfectionCollection,
      editingVersion
    ]
  );

  return <EditingContext.Provider value={value}>{children}</EditingContext.Provider>;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the editing context
 */
export function useEditing(): IEditingContext {
  return useContext(EditingContext);
}

/**
 * Hook to get an ingredient editor for a specific collection.
 * Automatically creates the editor if it doesn't exist.
 */
export function useIngredientEditor(collectionId: SourceId | null): {
  editor: Editing.Ingredients.IngredientEditorContext | null;
  error: string | null;
  isDirty: boolean;
  markDirty: () => void;
  markClean: () => void;
} {
  const { getIngredientEditor, dirtyCollections, markDirty, markClean } = useEditing();

  const result = useMemo(() => {
    if (collectionId === null) {
      return { editor: null, error: null };
    }
    const editorResult = getIngredientEditor(collectionId);
    if (editorResult.isFailure()) {
      return { editor: null, error: editorResult.message };
    }
    return { editor: editorResult.value, error: null };
  }, [collectionId, getIngredientEditor]);

  const isDirty = collectionId === null ? false : dirtyCollections.includes(collectionId);
  const handleMarkDirty = useCallback(() => {
    if (collectionId !== null) {
      markDirty(collectionId);
    }
  }, [markDirty, collectionId]);
  const handleMarkClean = useCallback(() => {
    if (collectionId !== null) {
      markClean(collectionId);
    }
  }, [markClean, collectionId]);

  return {
    ...result,
    isDirty,
    markDirty: handleMarkDirty,
    markClean: handleMarkClean
  };
}

/**
 * Hook for collection management operations
 */
export function useCollectionManager(): {
  createCollection: (params: ICreateCollectionParams) => Promise<Result<void>>;
  deleteCollection: (collectionId: SourceId) => Result<void>;
  renameCollection: (
    collectionId: SourceId,
    newName: string,
    newDescription?: string,
    secretName?: string
  ) => Promise<Result<void>>;
  isCollectionMutable: (collectionId: SourceId) => boolean;
  exportCollection: (params: IExportParams) => Promise<Result<string>>;
  importCollection: (params: IImportParams) => Result<void>;
} {
  const {
    createCollection,
    deleteCollection,
    renameCollection,
    isCollectionMutable,
    exportCollection,
    importCollection
  } = useEditing();

  return {
    createCollection,
    deleteCollection,
    renameCollection,
    isCollectionMutable,
    exportCollection,
    importCollection
  };
}

export function useMoldCollectionManager(): {
  createCollection: (params: ICreateCollectionParams) => Promise<Result<void>>;
  deleteCollection: (collectionId: SourceId) => Result<void>;
  renameCollection: (
    collectionId: SourceId,
    newName: string,
    newDescription?: string,
    secretName?: string
  ) => Promise<Result<void>>;
  exportCollection: (params: IExportParams) => Promise<Result<string>>;
  importCollection: (params: IImportParams) => Result<void>;
} {
  const {
    createMoldCollection,
    deleteMoldCollection,
    renameMoldCollection,
    exportMoldCollection,
    importMoldCollection
  } = useEditing();

  return {
    createCollection: createMoldCollection,
    deleteCollection: deleteMoldCollection,
    renameCollection: renameMoldCollection,
    exportCollection: exportMoldCollection,
    importCollection: importMoldCollection
  };
}

export function useTaskCollectionManager(): {
  createCollection: (params: ICreateCollectionParams) => Promise<Result<void>>;
  deleteCollection: (collectionId: SourceId) => Result<void>;
  renameCollection: (
    collectionId: SourceId,
    newName: string,
    newDescription?: string,
    secretName?: string
  ) => Promise<Result<void>>;
  exportCollection: (params: IExportParams) => Promise<Result<string>>;
  importCollection: (params: IImportParams) => Result<void>;
} {
  const {
    createTaskCollection,
    deleteTaskCollection,
    renameTaskCollection,
    exportTaskCollection,
    importTaskCollection
  } = useEditing();

  return {
    createCollection: createTaskCollection,
    deleteCollection: deleteTaskCollection,
    renameCollection: renameTaskCollection,
    exportCollection: exportTaskCollection,
    importCollection: importTaskCollection
  };
}

export function useFillingCollectionManager(): {
  createCollection: (params: ICreateCollectionParams) => Promise<Result<void>>;
  deleteCollection: (collectionId: SourceId) => Result<void>;
  renameCollection: (
    collectionId: SourceId,
    newName: string,
    newDescription?: string,
    secretName?: string
  ) => Promise<Result<void>>;
  exportCollection: (params: IExportParams) => Promise<Result<string>>;
  importCollection: (params: IImportParams) => Result<void>;
} {
  const {
    createFillingCollection,
    deleteFillingCollection,
    renameFillingCollection,
    exportFillingCollection,
    importFillingCollection
  } = useEditing();

  return {
    createCollection: createFillingCollection,
    deleteCollection: deleteFillingCollection,
    renameCollection: renameFillingCollection,
    exportCollection: exportFillingCollection,
    importCollection: importFillingCollection
  };
}

export function useProcedureCollectionManager(): {
  createCollection: (params: ICreateCollectionParams) => Promise<Result<void>>;
  deleteCollection: (collectionId: SourceId) => Result<void>;
  renameCollection: (
    collectionId: SourceId,
    newName: string,
    newDescription?: string,
    secretName?: string
  ) => Promise<Result<void>>;
  exportCollection: (params: IExportParams) => Promise<Result<string>>;
  importCollection: (params: IImportParams) => Result<void>;
} {
  const {
    createProcedureCollection,
    deleteProcedureCollection,
    renameProcedureCollection,
    exportProcedureCollection,
    importProcedureCollection
  } = useEditing();

  return {
    createCollection: createProcedureCollection,
    deleteCollection: deleteProcedureCollection,
    renameCollection: renameProcedureCollection,
    exportCollection: exportProcedureCollection,
    importCollection: importProcedureCollection
  };
}

export function useConfectionCollectionManager(): {
  createCollection: (params: ICreateCollectionParams) => Promise<Result<void>>;
  deleteCollection: (collectionId: SourceId) => Result<void>;
  renameCollection: (
    collectionId: SourceId,
    newName: string,
    newDescription?: string,
    secretName?: string
  ) => Promise<Result<void>>;
  exportCollection: (params: IExportParams) => Promise<Result<string>>;
  importCollection: (params: IImportParams) => Result<void>;
} {
  const {
    createConfectionCollection,
    deleteConfectionCollection,
    renameConfectionCollection,
    exportConfectionCollection,
    importConfectionCollection
  } = useEditing();

  return {
    createCollection: createConfectionCollection,
    deleteCollection: deleteConfectionCollection,
    renameCollection: renameConfectionCollection,
    exportCollection: exportConfectionCollection,
    importCollection: importConfectionCollection
  };
}

/**
 * Hook for tracking unsaved changes across all editors
 */
export function useUnsavedChanges(): {
  hasUnsavedChanges: boolean;
  dirtyCollections: ReadonlyArray<SourceId>;
  confirmDiscard: () => boolean;
} {
  const { hasUnsavedChanges, dirtyCollections } = useEditing();

  const confirmDiscard = useCallback((): boolean => {
    if (!hasUnsavedChanges) return true;

    return window.confirm(
      `You have unsaved changes in ${dirtyCollections.length} collection(s). Discard changes?`
    );
  }, [hasUnsavedChanges, dirtyCollections.length]);

  return {
    hasUnsavedChanges,
    dirtyCollections,
    confirmDiscard
  };
}
