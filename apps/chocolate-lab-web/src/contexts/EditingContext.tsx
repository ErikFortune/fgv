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
  type SourceId,
  type LibraryData
} from '@fgv/ts-chocolate';
import type { Result } from '@fgv/ts-utils';
import { fail, recordFromEntries, succeed } from '@fgv/ts-utils';
import { useChocolate } from './ChocolateContext';

const LOCAL_INGREDIENT_COLLECTIONS_KEY = 'chocolate-lab-web:ingredients:collections:v1';

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

// Type alias for Ingredient from Entities
type Ingredient = Entities.Ingredients.Ingredient;

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

  /** Commit current editor state back into the runtime library and refresh runtime caches */
  commitCollection: (collectionId: SourceId) => Result<void>;

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
  commitCollection: () => fail('No EditingProvider'),
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
    return Object.keys(readLocalIngredientCollections()) as SourceId[];
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
        setLocalCollections(Object.keys(existing) as SourceId[]);
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
          setLocalCollections(Object.keys(existing) as SourceId[]);
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
            setLocalCollections(Object.keys(existing) as SourceId[]);
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
            (stored as Record<string, unknown>).metadata = metadata;
            existing[collectionId] = stored;
            writeLocalIngredientCollections(existing);
            setLocalCollections(Object.keys(existing) as SourceId[]);
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
        setLocalCollections(Object.keys(existing) as SourceId[]);
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
      commitCollection,
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
      commitCollection,
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
