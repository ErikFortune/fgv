/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, ReactNode } from 'react';
import {
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
  type SourceId,
  type LibraryData
} from '@fgv/ts-chocolate';
import type { Result } from '@fgv/ts-utils';
import { fail, recordFromEntries, succeed } from '@fgv/ts-utils';
import { useChocolate } from './ChocolateContext';

const LOCAL_INGREDIENT_COLLECTIONS_KEY = 'chocolate-lab-web:ingredients:collections:v1';
const LOCAL_FILLING_COLLECTIONS_KEY = 'chocolate-lab-web:fillings:collections:v1';
const LOCAL_MOLD_COLLECTIONS_KEY = 'chocolate-lab-web:molds:collections:v1';
const LOCAL_PROCEDURE_COLLECTIONS_KEY = 'chocolate-lab-web:procedures:collections:v1';
const LOCAL_TASK_COLLECTIONS_KEY = 'chocolate-lab-web:tasks:collections:v1';

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
  return Array.from(ids) as SourceId[];
}

// Type alias for Ingredient from Entities
type Ingredient = Entities.Ingredients.Ingredient;
type Filling = Entities.Fillings.IFillingRecipe;
type Procedure = Entities.Procedures.IProcedure;
type Task = Entities.Tasks.ITaskData;
type Mold = Entities.Molds.IMold;

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
  createCollection: (params: ICreateCollectionParams) => Result<void>;
  /** Delete a mutable collection */
  deleteCollection: (collectionId: SourceId) => Result<void>;
  /** Rename a collection (update metadata) */
  renameCollection: (collectionId: SourceId, newName: string, newDescription?: string) => Result<void>;
  /** Check if a collection is mutable */
  isCollectionMutable: (collectionId: SourceId) => boolean;

  // Export/Import
  /** Export a collection to string */
  exportCollection: (params: IExportParams) => Result<string>;
  /** Import a collection from string */
  importCollection: (params: IImportParams) => Result<void>;

  // Mold collection management
  createMoldCollection: (params: ICreateCollectionParams) => Result<void>;
  deleteMoldCollection: (collectionId: SourceId) => Result<void>;
  renameMoldCollection: (collectionId: SourceId, newName: string, newDescription?: string) => Result<void>;
  exportMoldCollection: (params: IExportParams) => Result<string>;
  importMoldCollection: (params: IImportParams) => Result<void>;

  // Filling collection management
  createFillingCollection: (params: ICreateCollectionParams) => Result<void>;
  deleteFillingCollection: (collectionId: SourceId) => Result<void>;
  renameFillingCollection: (collectionId: SourceId, newName: string, newDescription?: string) => Result<void>;
  exportFillingCollection: (params: IExportParams) => Result<string>;
  importFillingCollection: (params: IImportParams) => Result<void>;

  // Procedure collection management
  createProcedureCollection: (params: ICreateCollectionParams) => Result<void>;
  deleteProcedureCollection: (collectionId: SourceId) => Result<void>;
  renameProcedureCollection: (
    collectionId: SourceId,
    newName: string,
    newDescription?: string
  ) => Result<void>;
  exportProcedureCollection: (params: IExportParams) => Result<string>;
  importProcedureCollection: (params: IImportParams) => Result<void>;

  // Task collection management
  createTaskCollection: (params: ICreateCollectionParams) => Result<void>;
  deleteTaskCollection: (collectionId: SourceId) => Result<void>;
  renameTaskCollection: (collectionId: SourceId, newName: string, newDescription?: string) => Result<void>;
  exportTaskCollection: (params: IExportParams) => Result<string>;
  importTaskCollection: (params: IImportParams) => Result<void>;

  /** Commit current editor state back into the runtime library and refresh runtime caches */
  commitCollection: (collectionId: SourceId) => Result<void>;

  /** Persist a mutable mold collection to localStorage and refresh runtime caches */
  commitMoldCollection: (collectionId: SourceId) => Result<void>;

  /** Persist a mutable filling collection to localStorage and refresh runtime caches */
  commitFillingCollection: (collectionId: SourceId) => Result<void>;

  /** Persist a mutable procedure collection to localStorage and refresh runtime caches */
  commitProcedureCollection: (collectionId: SourceId) => Result<void>;

  /** Persist a mutable task collection to localStorage and refresh runtime caches */
  commitTaskCollection: (collectionId: SourceId) => Result<void>;

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
  createCollection: () => fail('No EditingProvider'),
  deleteCollection: () => fail('No EditingProvider'),
  renameCollection: () => fail('No EditingProvider'),
  isCollectionMutable: () => false,
  exportCollection: () => fail('No EditingProvider'),
  importCollection: () => fail('No EditingProvider'),
  createMoldCollection: () => fail('No EditingProvider'),
  deleteMoldCollection: () => fail('No EditingProvider'),
  renameMoldCollection: () => fail('No EditingProvider'),
  exportMoldCollection: () => fail('No EditingProvider'),
  importMoldCollection: () => fail('No EditingProvider'),
  createFillingCollection: () => fail('No EditingProvider'),
  deleteFillingCollection: () => fail('No EditingProvider'),
  renameFillingCollection: () => fail('No EditingProvider'),
  exportFillingCollection: () => fail('No EditingProvider'),
  importFillingCollection: () => fail('No EditingProvider'),
  createProcedureCollection: () => fail('No EditingProvider'),
  deleteProcedureCollection: () => fail('No EditingProvider'),
  renameProcedureCollection: () => fail('No EditingProvider'),
  exportProcedureCollection: () => fail('No EditingProvider'),
  importProcedureCollection: () => fail('No EditingProvider'),
  createTaskCollection: () => fail('No EditingProvider'),
  deleteTaskCollection: () => fail('No EditingProvider'),
  renameTaskCollection: () => fail('No EditingProvider'),
  exportTaskCollection: () => fail('No EditingProvider'),
  importTaskCollection: () => fail('No EditingProvider'),
  commitCollection: () => fail('No EditingProvider'),
  commitMoldCollection: () => fail('No EditingProvider'),
  commitFillingCollection: () => fail('No EditingProvider'),
  commitProcedureCollection: () => fail('No EditingProvider'),
  commitTaskCollection: () => fail('No EditingProvider'),
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
export function EditingProvider({ children }: IEditingProviderProps): React.ReactElement {
  const { runtime, notifyLibraryChanged } = useChocolate();

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
    (collectionId: SourceId): Result<void> => {
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

      // Persist to localStorage
      try {
        const items: Record<BaseIngredientId, Ingredient> = recordFromEntries(
          collectionEntry.items.entries()
        );
        const sourceFile: LibraryData.ICollectionSourceFile<Ingredient> = {
          metadata: collectionEntry.metadata ?? { name: collectionId },
          items
        };

        const existing = readLocalIngredientCollections();
        existing[collectionId] = sourceFile as unknown;
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
    [notifyLibraryChanged, runtime]
  );

  const commitMoldCollection = useCallback(
    (collectionId: SourceId): Result<void> => {
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

        const existing = readLocalMoldCollections();
        existing[collectionId] = sourceFile as unknown;
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
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const createFillingCollection = useCallback(
    (params: ICreateCollectionParams): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<FillingId, BaseFillingId, Filling>(
        runtime.library.fillings
      );
      const metadata: LibraryData.ICollectionSourceMetadata =
        params.description !== undefined
          ? { name: params.name, description: params.description }
          : { name: params.name };

      return manager.create(params.collectionId, metadata).onSuccess(() => {
        try {
          const existing = readLocalFillingCollections();
          const sourceFile: LibraryData.ICollectionSourceFile<Filling> = {
            metadata,
            items: {}
          };
          existing[params.collectionId] = sourceFile as unknown;
          writeLocalFillingCollections(existing);
          setLocalCollections(getAllLocalCollectionIds());
        } catch {
          // ignore
        }

        incrementVersion();
        return notifyLibraryChanged();
      });
    },
    [incrementVersion, notifyLibraryChanged, runtime]
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

      return result.onSuccess(() => {
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
      });
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const renameFillingCollection = useCallback(
    (collectionId: SourceId, newName: string, newDescription?: string): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<FillingId, BaseFillingId, Filling>(
        runtime.library.fillings
      );
      const metadata: Partial<LibraryData.ICollectionSourceMetadata> =
        newDescription !== undefined ? { name: newName, description: newDescription } : { name: newName };

      return manager.updateMetadata(collectionId, metadata).onSuccess(() => {
        try {
          const existing = readLocalFillingCollections();
          const stored = existing[collectionId];
          if (typeof stored === 'object' && stored !== null && !Array.isArray(stored)) {
            const record = stored as Record<string, unknown>;
            const existingMetadata = record.metadata;
            const mergedMetadata =
              typeof existingMetadata === 'object' &&
              existingMetadata !== null &&
              !Array.isArray(existingMetadata)
                ? {
                    ...(existingMetadata as Record<string, unknown>),
                    ...(metadata as Record<string, unknown>)
                  }
                : (metadata as unknown);
            record.metadata = mergedMetadata;
            existing[collectionId] = stored;
            writeLocalFillingCollections(existing);
            setLocalCollections(getAllLocalCollectionIds());
          }
        } catch {
          // ignore
        }

        incrementVersion();
        return notifyLibraryChanged();
      });
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const exportFillingCollection = useCallback(
    (params: IExportParams): Result<string> => {
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

      return Editing.serializeCollection(sourceFile, params.format);
    },
    [runtime]
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
    (collectionId: SourceId): Result<void> => {
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

        const existing = readLocalFillingCollections();
        existing[collectionId] = sourceFile as unknown;
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
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const commitProcedureCollection = useCallback(
    (collectionId: SourceId): Result<void> => {
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

        const existing = readLocalProcedureCollections();
        existing[collectionId] = sourceFile as unknown;
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
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const commitTaskCollection = useCallback(
    (collectionId: SourceId): Result<void> => {
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

        const existing = readLocalTaskCollections();
        existing[collectionId] = sourceFile as unknown;
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
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const createMoldCollection = useCallback(
    (params: ICreateCollectionParams): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<MoldId, BaseMoldId, Mold>(runtime.library.molds);
      const metadata: LibraryData.ICollectionSourceMetadata =
        params.description !== undefined
          ? { name: params.name, description: params.description }
          : { name: params.name };

      return manager.create(params.collectionId, metadata).onSuccess(() => {
        try {
          const existing = readLocalMoldCollections();
          const sourceFile: LibraryData.ICollectionSourceFile<Mold> = {
            metadata,
            items: {}
          };
          existing[params.collectionId] = sourceFile as unknown;
          writeLocalMoldCollections(existing);
          setLocalCollections(getAllLocalCollectionIds());
        } catch {
          // ignore
        }

        incrementVersion();
        return notifyLibraryChanged();
      });
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const deleteMoldCollection = useCallback(
    (collectionId: SourceId): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<MoldId, BaseMoldId, Mold>(runtime.library.molds);
      const result = manager.delete(collectionId);

      return result.onSuccess(() => {
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
      });
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const renameMoldCollection = useCallback(
    (collectionId: SourceId, newName: string, newDescription?: string): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<MoldId, BaseMoldId, Mold>(runtime.library.molds);
      const metadata: Partial<LibraryData.ICollectionSourceMetadata> =
        newDescription !== undefined ? { name: newName, description: newDescription } : { name: newName };

      return manager.updateMetadata(collectionId, metadata).onSuccess(() => {
        try {
          const existing = readLocalMoldCollections();
          const stored = existing[collectionId];
          if (typeof stored === 'object' && stored !== null && !Array.isArray(stored)) {
            const record = stored as Record<string, unknown>;
            const existingMetadata = record.metadata;
            const mergedMetadata =
              typeof existingMetadata === 'object' &&
              existingMetadata !== null &&
              !Array.isArray(existingMetadata)
                ? {
                    ...(existingMetadata as Record<string, unknown>),
                    ...(metadata as Record<string, unknown>)
                  }
                : (metadata as unknown);
            record.metadata = mergedMetadata;
            existing[collectionId] = stored;
            writeLocalMoldCollections(existing);
            setLocalCollections(getAllLocalCollectionIds());
          }
        } catch {
          // ignore
        }

        incrementVersion();
        return notifyLibraryChanged();
      });
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const exportMoldCollection = useCallback(
    (params: IExportParams): Result<string> => {
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

      return Editing.serializeCollection(sourceFile, params.format);
    },
    [runtime]
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
    (params: ICreateCollectionParams): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<ProcedureId, BaseProcedureId, Procedure>(
        runtime.library.procedures
      );
      const metadata: LibraryData.ICollectionSourceMetadata =
        params.description !== undefined
          ? { name: params.name, description: params.description }
          : { name: params.name };

      return manager.create(params.collectionId, metadata).onSuccess(() => {
        try {
          const existing = readLocalProcedureCollections();
          const sourceFile: LibraryData.ICollectionSourceFile<Procedure> = {
            metadata,
            items: {}
          };
          existing[params.collectionId] = sourceFile as unknown;
          writeLocalProcedureCollections(existing);
          setLocalCollections(getAllLocalCollectionIds());
        } catch {
          // ignore
        }

        incrementVersion();
        return notifyLibraryChanged();
      });
    },
    [incrementVersion, notifyLibraryChanged, runtime]
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

      return result.onSuccess(() => {
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
      });
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const renameProcedureCollection = useCallback(
    (collectionId: SourceId, newName: string, newDescription?: string): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<ProcedureId, BaseProcedureId, Procedure>(
        runtime.library.procedures
      );
      const metadata: Partial<LibraryData.ICollectionSourceMetadata> =
        newDescription !== undefined ? { name: newName, description: newDescription } : { name: newName };

      return manager.updateMetadata(collectionId, metadata).onSuccess(() => {
        try {
          const existing = readLocalProcedureCollections();
          const stored = existing[collectionId];
          if (typeof stored === 'object' && stored !== null && !Array.isArray(stored)) {
            const record = stored as Record<string, unknown>;
            const existingMetadata = record.metadata;
            const mergedMetadata =
              typeof existingMetadata === 'object' &&
              existingMetadata !== null &&
              !Array.isArray(existingMetadata)
                ? {
                    ...(existingMetadata as Record<string, unknown>),
                    ...(metadata as Record<string, unknown>)
                  }
                : (metadata as unknown);
            record.metadata = mergedMetadata;
            existing[collectionId] = stored;
            writeLocalProcedureCollections(existing);
            setLocalCollections(getAllLocalCollectionIds());
          }
        } catch {
          // ignore
        }

        incrementVersion();
        return notifyLibraryChanged();
      });
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const exportProcedureCollection = useCallback(
    (params: IExportParams): Result<string> => {
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

      return Editing.serializeCollection(sourceFile, params.format);
    },
    [runtime]
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
    (params: ICreateCollectionParams): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<TaskId, BaseTaskId, Task>(runtime.library.tasks);
      const metadata: LibraryData.ICollectionSourceMetadata =
        params.description !== undefined
          ? { name: params.name, description: params.description }
          : { name: params.name };

      return manager.create(params.collectionId, metadata).onSuccess(() => {
        try {
          const existing = readLocalTaskCollections();
          const sourceFile: LibraryData.ICollectionSourceFile<Task> = {
            metadata,
            items: {}
          };
          existing[params.collectionId] = sourceFile as unknown;
          writeLocalTaskCollections(existing);
          setLocalCollections(getAllLocalCollectionIds());
        } catch {
          // ignore
        }

        incrementVersion();
        return notifyLibraryChanged();
      });
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const deleteTaskCollection = useCallback(
    (collectionId: SourceId): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<TaskId, BaseTaskId, Task>(runtime.library.tasks);
      const result = manager.delete(collectionId);

      return result.onSuccess(() => {
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
      });
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const renameTaskCollection = useCallback(
    (collectionId: SourceId, newName: string, newDescription?: string): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<TaskId, BaseTaskId, Task>(runtime.library.tasks);
      const metadata: Partial<LibraryData.ICollectionSourceMetadata> =
        newDescription !== undefined ? { name: newName, description: newDescription } : { name: newName };

      return manager.updateMetadata(collectionId, metadata).onSuccess(() => {
        try {
          const existing = readLocalTaskCollections();
          const stored = existing[collectionId];
          if (typeof stored === 'object' && stored !== null && !Array.isArray(stored)) {
            const record = stored as Record<string, unknown>;
            const existingMetadata = record.metadata;
            const mergedMetadata =
              typeof existingMetadata === 'object' &&
              existingMetadata !== null &&
              !Array.isArray(existingMetadata)
                ? {
                    ...(existingMetadata as Record<string, unknown>),
                    ...(metadata as Record<string, unknown>)
                  }
                : (metadata as unknown);
            record.metadata = mergedMetadata;
            existing[collectionId] = stored;
            writeLocalTaskCollections(existing);
            setLocalCollections(getAllLocalCollectionIds());
          }
        } catch {
          // ignore
        }

        incrementVersion();
        return notifyLibraryChanged();
      });
    },
    [incrementVersion, notifyLibraryChanged, runtime]
  );

  const exportTaskCollection = useCallback(
    (params: IExportParams): Result<string> => {
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

      return Editing.serializeCollection(sourceFile, params.format);
    },
    [runtime]
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
    (params: ICreateCollectionParams): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<IngredientId, BaseIngredientId, Ingredient>(
        runtime.library.ingredients
      );

      const metadata: LibraryData.ICollectionSourceMetadata =
        params.description !== undefined
          ? { name: params.name, description: params.description }
          : { name: params.name };

      return manager.create(params.collectionId, metadata).onSuccess(() => {
        // Persist empty collection file immediately so it survives reload
        try {
          const existing = readLocalIngredientCollections();
          const sourceFile: LibraryData.ICollectionSourceFile<Ingredient> = {
            metadata,
            items: {}
          };
          existing[params.collectionId] = sourceFile as unknown;
          writeLocalIngredientCollections(existing);
          setLocalCollections(getAllLocalCollectionIds());
        } catch {
          // ignore persistence errors here; collection still exists in runtime
        }

        incrementVersion();
        return notifyLibraryChanged();
      });
    },
    [notifyLibraryChanged, runtime, incrementVersion]
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

      return result.onSuccess(() => {
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
      });
    },
    [runtime, closeEditor, incrementVersion, notifyLibraryChanged]
  );

  // Rename a collection
  const renameCollection = useCallback(
    (collectionId: SourceId, newName: string, newDescription?: string): Result<void> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      const manager = new Editing.CollectionManager<IngredientId, BaseIngredientId, Ingredient>(
        runtime.library.ingredients
      );

      const metadata: Partial<LibraryData.ICollectionSourceMetadata> =
        newDescription !== undefined ? { name: newName, description: newDescription } : { name: newName };

      return manager.updateMetadata(collectionId, metadata).onSuccess(() => {
        // If locally persisted, update stored metadata
        try {
          const existing = readLocalIngredientCollections();
          const stored = existing[collectionId];
          if (typeof stored === 'object' && stored !== null && !Array.isArray(stored)) {
            const record = stored as Record<string, unknown>;
            const existingMetadata = record.metadata;
            const mergedMetadata =
              typeof existingMetadata === 'object' &&
              existingMetadata !== null &&
              !Array.isArray(existingMetadata)
                ? {
                    ...(existingMetadata as Record<string, unknown>),
                    ...(metadata as Record<string, unknown>)
                  }
                : (metadata as unknown);
            record.metadata = mergedMetadata;
            existing[collectionId] = stored;
            writeLocalIngredientCollections(existing);
            setLocalCollections(getAllLocalCollectionIds());
          }
        } catch {
          // ignore
        }

        incrementVersion();
        return notifyLibraryChanged();
      });
    },
    [notifyLibraryChanged, runtime, incrementVersion]
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
    (params: IExportParams): Result<string> => {
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

      // Serialize based on format
      return Editing.serializeCollection(sourceFile, params.format);
    },
    [runtime]
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
      commitCollection,
      commitMoldCollection,
      commitFillingCollection,
      commitProcedureCollection,
      commitTaskCollection,
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
      commitCollection,
      commitMoldCollection,
      commitFillingCollection,
      commitProcedureCollection,
      commitTaskCollection,
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
  createCollection: (params: ICreateCollectionParams) => Result<void>;
  deleteCollection: (collectionId: SourceId) => Result<void>;
  renameCollection: (collectionId: SourceId, newName: string, newDescription?: string) => Result<void>;
  isCollectionMutable: (collectionId: SourceId) => boolean;
  exportCollection: (params: IExportParams) => Result<string>;
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
  createCollection: (params: ICreateCollectionParams) => Result<void>;
  deleteCollection: (collectionId: SourceId) => Result<void>;
  renameCollection: (collectionId: SourceId, newName: string, newDescription?: string) => Result<void>;
  exportCollection: (params: IExportParams) => Result<string>;
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
  createCollection: (params: ICreateCollectionParams) => Result<void>;
  deleteCollection: (collectionId: SourceId) => Result<void>;
  renameCollection: (collectionId: SourceId, newName: string, newDescription?: string) => Result<void>;
  exportCollection: (params: IExportParams) => Result<string>;
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
  createCollection: (params: ICreateCollectionParams) => Result<void>;
  deleteCollection: (collectionId: SourceId) => Result<void>;
  renameCollection: (collectionId: SourceId, newName: string, newDescription?: string) => Result<void>;
  exportCollection: (params: IExportParams) => Result<string>;
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
  createCollection: (params: ICreateCollectionParams) => Result<void>;
  deleteCollection: (collectionId: SourceId) => Result<void>;
  renameCollection: (collectionId: SourceId, newName: string, newDescription?: string) => Result<void>;
  exportCollection: (params: IExportParams) => Result<string>;
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
