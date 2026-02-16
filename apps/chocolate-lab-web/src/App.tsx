import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { CursorArrowRaysIcon } from '@heroicons/react/20/solid';
import {
  ModeSelector,
  type IModeConfig,
  TabBar,
  type ITabConfig,
  MessagesProvider,
  ToastContainer,
  StatusBar,
  useMessages,
  useLogReporter,
  useUrlSync,
  type IUrlSyncConfig,
  Modal,
  KeyboardShortcutProvider,
  useKeyboardShortcuts,
  type IShortcut,
  SidebarLayout,
  EntityList,
  type IEntityDescriptor,
  type ICascadeColumn,
  EntityTabLayout,
  type IComparisonColumn
} from '@fgv/ts-app-shell';
import { Logging } from '@fgv/ts-utils';
import { createWorkspaceFromPlatform, AiAssist, Editing, Entities, LibraryRuntime } from '@fgv/ts-chocolate';
import {
  type AppMode,
  type AppTab,
  type ICascadeEntry,
  DEFAULT_TABS,
  MODE_LABELS,
  MODE_TABS,
  TAB_LABELS,
  useNavigationStore,
  selectActiveTab,
  selectModeTabs,
  TabSidebar,
  ReactiveWorkspace,
  WorkspaceProvider,
  useWorkspace,
  useReactiveWorkspace,
  IngredientDetail,
  IngredientEditView,
  FillingDetail,
  MoldDetail,
  MoldEditView,
  TaskDetail,
  TaskEditView,
  TaskPreviewPanel,
  ProcedureDetail,
  ProcedureEditView,
  ProcedurePreviewPanel,
  StepParameterEditor,
  ConfectionDetail,
  DecorationDetail,
  DecorationEditView,
  WorkspaceFilterOptionProvider,
  useFilteredEntities,
  useCollectionActions,
  initializeBrowserPlatform,
  type IEntityFilterSpec,
  EntityCreateForm
} from '@fgv/chocolate-lab-ui';
import type {
  BaseIngredientId,
  BaseMoldId,
  BaseProcedureId,
  BaseTaskId,
  CollectionId,
  IngredientId,
  FillingId,
  MoldId,
  TaskId,
  ProcedureId,
  ConfectionId,
  BaseDecorationId,
  DecorationId
} from '@fgv/ts-chocolate';

// ============================================================================
// Mode / Tab Configuration
// ============================================================================

const MODES: ReadonlyArray<IModeConfig<AppMode>> = [
  { id: 'production', label: MODE_LABELS.production },
  { id: 'library', label: MODE_LABELS.library }
];

const URL_SYNC_CONFIG: IUrlSyncConfig<AppMode, AppTab> = {
  validModes: ['production', 'library'],
  validTabs: MODE_TABS,
  defaultTabs: DEFAULT_TABS
};

function getTabConfigs(tabs: ReadonlyArray<AppTab>): ReadonlyArray<ITabConfig<AppTab>> {
  return tabs.map((id) => ({ id, label: TAB_LABELS[id] }));
}

// ============================================================================
// Settings Button
// ============================================================================

function SettingsButton({ onOpen }: { readonly onOpen: () => void }): React.ReactElement {
  return (
    <button
      onClick={onOpen}
      className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
      aria-label="Settings"
      title="Settings"
    >
      <Cog6ToothIcon className="w-5 h-5" />
    </button>
  );
}

// ============================================================================
// Workspace Initialization (lazy — avoids webpack circular dep evaluation order)
// ============================================================================

const _bootLogger = new Logging.BootLogger();
const _bootReporter = new Logging.LogReporter<unknown>({ logger: _bootLogger });

let _reactiveWorkspacePromise: Promise<ReactiveWorkspace> | undefined;

function getReactiveWorkspaceAsync(): Promise<ReactiveWorkspace> {
  if (!_reactiveWorkspacePromise) {
    _reactiveWorkspacePromise = (async () => {
      const platformInit = await initializeBrowserPlatform({ userLibraryPath: 'localStorage' });
      const workspace = platformInit
        .onSuccess((init) =>
          createWorkspaceFromPlatform({
            platformInit: init,
            builtin: true,
            preWarm: true,
            logger: _bootReporter
          })
        )
        .orThrow();
      return new ReactiveWorkspace(workspace);
    })();
  }
  return _reactiveWorkspacePromise;
}

// ============================================================================
// Ingredient List Descriptor
// ============================================================================

const INGREDIENT_DESCRIPTOR: IEntityDescriptor<LibraryRuntime.AnyIngredient, IngredientId> = {
  getId: (i: LibraryRuntime.AnyIngredient): IngredientId => i.id,
  getLabel: (i: LibraryRuntime.AnyIngredient): string => i.name,
  getSublabel: (i: LibraryRuntime.AnyIngredient): string | undefined =>
    [i.manufacturer, i.category].filter(Boolean).join(' · ') || undefined,
  getStatus: undefined
};

// ============================================================================
// Filling List Descriptor
// ============================================================================

const FILLING_DESCRIPTOR: IEntityDescriptor<LibraryRuntime.FillingRecipe, FillingId> = {
  getId: (f: LibraryRuntime.FillingRecipe): FillingId => f.id,
  getLabel: (f: LibraryRuntime.FillingRecipe): string => f.name,
  getSublabel: (f: LibraryRuntime.FillingRecipe): string | undefined =>
    [f.entity.category, f.variationCount > 1 ? `${f.variationCount} variations` : undefined]
      .filter(Boolean)
      .join(' · ') || undefined,
  getStatus: undefined
};

const CONFECTION_DESCRIPTOR: IEntityDescriptor<LibraryRuntime.IConfectionBase, ConfectionId> = {
  getId: (c: LibraryRuntime.IConfectionBase): ConfectionId => c.id,
  getLabel: (c: LibraryRuntime.IConfectionBase): string => c.name,
  getSublabel: (c: LibraryRuntime.IConfectionBase): string | undefined =>
    [c.confectionType, c.description].filter(Boolean).join(' · ') || undefined,
  getStatus: undefined
};

const PROCEDURE_DESCRIPTOR: IEntityDescriptor<LibraryRuntime.IProcedure, ProcedureId> = {
  getId: (p: LibraryRuntime.IProcedure): ProcedureId => p.id,
  getLabel: (p: LibraryRuntime.IProcedure): string => p.name,
  getSublabel: (p: LibraryRuntime.IProcedure): string | undefined =>
    [p.category, `${p.stepCount} step${p.stepCount !== 1 ? 's' : ''}`].filter(Boolean).join(' · ') ||
    undefined,
  getStatus: undefined
};

const TASK_DESCRIPTOR: IEntityDescriptor<LibraryRuntime.ITask, TaskId> = {
  getId: (t: LibraryRuntime.ITask): TaskId => t.id,
  getLabel: (t: LibraryRuntime.ITask): string => t.name,
  getSublabel: (t: LibraryRuntime.ITask): string | undefined =>
    t.requiredVariables.length > 0
      ? `${t.requiredVariables.length} variable${t.requiredVariables.length > 1 ? 's' : ''}`
      : undefined,
  getStatus: undefined
};

const MOLD_DESCRIPTOR: IEntityDescriptor<LibraryRuntime.IMold, MoldId> = {
  getId: (m: LibraryRuntime.IMold): MoldId => m.id,
  getLabel: (m: LibraryRuntime.IMold): string => m.displayName,
  getSublabel: (m: LibraryRuntime.IMold): string | undefined =>
    [m.format, m.description].filter(Boolean).join(' · ') || undefined,
  getStatus: undefined
};

const DECORATION_DESCRIPTOR: IEntityDescriptor<LibraryRuntime.IDecoration, DecorationId> = {
  getId: (d: LibraryRuntime.IDecoration): DecorationId => d.id,
  getLabel: (d: LibraryRuntime.IDecoration): string => d.name,
  getSublabel: (d: LibraryRuntime.IDecoration): string | undefined =>
    [
      d.description,
      d.ingredients.length > 0
        ? `${d.ingredients.length} ingredient${d.ingredients.length > 1 ? 's' : ''}`
        : undefined
    ]
      .filter(Boolean)
      .join(' · ') || undefined,
  getStatus: undefined
};

// ============================================================================
// Filter Specs (how to extract filterable properties from each entity type)
// ============================================================================

function collectionFromId(id: string): string {
  return id.split('.')[0] ?? id;
}

const INGREDIENT_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.AnyIngredient> = {
  getSearchText: (i) => [i.name, i.manufacturer, i.category].filter(Boolean).join(' '),
  getCollectionId: (i) => i.collectionId,
  selectionExtractors: {
    collection: (i) => i.collectionId,
    category: (i) => i.category,
    tags: (i) => i.tags ?? []
  }
};

const FILLING_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.FillingRecipe> = {
  getSearchText: (f) => [f.name, f.entity.category].filter(Boolean).join(' '),
  getCollectionId: (f) => f.collectionId,
  selectionExtractors: {
    collection: (f) => f.collectionId,
    category: (f) => f.entity.category,
    tags: (f) => f.tags ?? []
  }
};

const CONFECTION_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.IConfectionBase> = {
  getSearchText: (c) => [c.name, c.confectionType, c.description].filter(Boolean).join(' '),
  getCollectionId: (c) => c.collectionId,
  selectionExtractors: {
    collection: (c) => c.collectionId,
    category: (c) => c.confectionType,
    tags: (c) => c.tags ?? []
  }
};

const MOLD_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.IMold> = {
  getSearchText: (m) => [m.displayName, m.manufacturer, m.format, m.description].filter(Boolean).join(' '),
  getCollectionId: (m) => m.collectionId,
  selectionExtractors: {
    collection: (m) => m.collectionId,
    shape: (m) => m.format,
    cavities: (m) => String(m.cavityCount)
  }
};

const PROCEDURE_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.IProcedure> = {
  getSearchText: (p) => [p.name, p.category, p.description].filter(Boolean).join(' '),
  getCollectionId: (p) => collectionFromId(p.id),
  selectionExtractors: {
    collection: (p) => collectionFromId(p.id),
    category: (p) => p.category,
    tags: (p) => p.tags ?? []
  }
};

const TASK_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.ITask> = {
  getSearchText: (t) => [t.name, t.template].filter(Boolean).join(' '),
  getCollectionId: (t) => collectionFromId(t.id),
  selectionExtractors: {
    collection: (t) => collectionFromId(t.id),
    tags: (t) => t.tags ?? []
  }
};

const DECORATION_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.IDecoration> = {
  getSearchText: (d) => [d.name, d.description].filter(Boolean).join(' '),
  getCollectionId: (d) => collectionFromId(d.id),
  selectionExtractors: {
    collection: (d) => collectionFromId(d.id),
    tags: (d) => d.tags ?? []
  }
};

// ============================================================================
// Helpers
// ============================================================================

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'unnamed'
  );
}

const { createBlankIngredientEntity } = Entities.Ingredients;
const { createBlankMoldEntity } = Entities.Molds;
const { createBlankRawTaskEntity } = Entities.Tasks;
const { createBlankRawProcedureEntity } = Entities.Procedures;

// ============================================================================
// Ingredients Tab Content
// ============================================================================

function IngredientsTabContent(): React.ReactElement {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const squashCascade = useNavigationStore((s) => s.squashCascade);
  const popCascadeTo = useNavigationStore((s) => s.popCascadeTo);
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);
  const listCollapsed = useNavigationStore((s) => s.listCollapsed);
  const collapseList = useNavigationStore((s) => s.collapseList);
  const compareMode = useNavigationStore((s) => s.compareMode);
  const compareIds = useNavigationStore((s) => s.compareIds);
  const toggleCompareMode = useNavigationStore((s) => s.toggleCompareMode);
  const toggleCompareId = useNavigationStore((s) => s.toggleCompareId);
  const showingComparison = useNavigationStore((s) => s.showingComparison);
  const startComparison = useNavigationStore((s) => s.startComparison);
  const exitComparison = useNavigationStore((s) => s.exitComparison);

  // Editing wrapper ref — persists the EditedIngredient across re-renders while editing.
  // Keyed by entity ID so switching ingredients creates a fresh wrapper.
  const editingRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedIngredient } | undefined>(undefined);

  // Find the first mutable collection ID (memoized)
  const mutableCollectionId = useMemo<CollectionId | undefined>(() => {
    const collections = workspace.data.entities.ingredients.collections;
    for (const [id, col] of collections.entries()) {
      if (col.isMutable) {
        return id as CollectionId;
      }
    }
    return undefined;
  }, [workspace, reactiveWorkspace.version]);

  // Create a new ingredient from an entity, add to mutable collection, and open in edit mode
  const handleCreateIngredient = useCallback(
    (entity: Entities.Ingredients.IngredientEntity, source: 'manual' | 'ai'): void => {
      if (!mutableCollectionId) {
        workspace.data.logger.error('Cannot add ingredient: no mutable collection available');
        return;
      }

      const baseId = entity.baseId as BaseIngredientId;
      const compositeId = `${mutableCollectionId}.${baseId}` as IngredientId;

      // Check for duplicate
      const existing = workspace.data.ingredients.get(compositeId);
      if (existing.isSuccess()) {
        workspace.data.logger.error(`Ingredient '${compositeId}' already exists`);
        return;
      }

      // Add to in-memory collection
      const colResult = workspace.data.entities.ingredients.collections.get(mutableCollectionId);
      if (colResult.isFailure()) {
        workspace.data.logger.error(`Collection '${mutableCollectionId}' not found: ${colResult.message}`);
        return;
      }
      if (!colResult.value.isMutable) {
        workspace.data.logger.error(`Collection '${mutableCollectionId}' is not mutable`);
        return;
      }
      const setResult = colResult.value.items.set(baseId, entity);
      if (setResult.isFailure()) {
        workspace.data.logger.error(`Failed to add ingredient: ${setResult.message}`);
        return;
      }

      // Invalidate caches so the new ingredient appears in the list
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      // Create editing wrapper and open in edit mode
      const wrapperResult = LibraryRuntime.EditedIngredient.create(entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create editing wrapper: ${wrapperResult.message}`);
        return;
      }
      editingRef.current = { id: compositeId, wrapper: wrapperResult.value };

      if (source === 'ai') {
        workspace.data.logger.info(`Created ingredient '${entity.name}' from AI-generated data`);
      }

      const entry: ICascadeEntry = { entityType: 'ingredient', entityId: compositeId, mode: 'edit' };
      squashCascade([entry]);
    },
    [workspace, reactiveWorkspace, mutableCollectionId, squashCascade]
  );

  // Handle paste from the list header drop target button
  const handleListHeaderPaste = useCallback((): void => {
    navigator.clipboard.readText().then(
      (text) => {
        if (!text.trim()) {
          workspace.data.logger.info('Clipboard is empty');
          return;
        }

        // Strip markdown code fences
        const stripped = text
          .trim()
          .replace(/^```(?:\w+)?\s*\n?([\s\S]*?)\n?\s*```$/, '$1')
          .trim();

        let parsed: unknown;
        try {
          parsed = JSON.parse(stripped);
        } catch (err: unknown) {
          const detail = err instanceof Error ? err.message : String(err);
          workspace.data.logger.error(`Clipboard does not contain valid JSON: ${detail}`);
          return;
        }

        const result = Entities.Ingredients.Converters.ingredientEntity.convert(parsed);
        if (result.isFailure()) {
          workspace.data.logger.error(`AI ingredient validation failed: ${result.message}`);
          return;
        }

        handleCreateIngredient(result.value, 'ai');
        workspace.data.logger.info(`Opened '${result.value.name}' for review — save when ready`);
      },
      () => {
        workspace.data.logger.error('Could not read clipboard — permission may be required');
      }
    );
  }, [workspace, handleCreateIngredient]);

  // Collect all ingredients into a sorted array (memoized on workspace version)
  const ingredients = useMemo<ReadonlyArray<LibraryRuntime.AnyIngredient>>(() => {
    return Array.from(workspace.data.ingredients.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  // Selected ingredient ID = first cascade entry of type 'ingredient'
  const selectedId =
    cascadeStack.length > 0 && cascadeStack[0].entityType === 'ingredient'
      ? (cascadeStack[0].entityId as IngredientId)
      : undefined;

  const handleSelect = useCallback(
    (id: IngredientId): void => {
      const entry: ICascadeEntry = { entityType: 'ingredient', entityId: id, mode: 'view' };
      // Replace the cascade with just this ingredient
      squashCascade([entry]);
    },
    [squashCascade]
  );

  // Switch a cascade entry from view → edit mode
  const handleEdit = useCallback(
    (entityId: string): void => {
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'ingredient' ? { ...e, mode: 'edit' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  // Switch a cascade entry from edit → view mode (cancel editing)
  const handleCancelEdit = useCallback(
    (entityId: string): void => {
      // Discard the editing wrapper
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'ingredient' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  // "Save to..." handler — triggered when editing a read-only ingredient.
  // TODO: open a collection picker dialog; for now just log.
  const handleSaveAs = useCallback(
    (wrapper: LibraryRuntime.EditedIngredient): void => {
      const entity = wrapper.current;
      workspace.data.logger.info(
        `Save to... requested for '${entity.name}' — collection picker not yet implemented`
      );
    },
    [workspace]
  );

  // Save handler — persists the edited entity back to its collection via EditableCollection
  const handleSave = useCallback(
    (wrapper: LibraryRuntime.EditedIngredient): void => {
      const entity = wrapper.current;
      const compositeId = editingRef.current?.id;
      if (!compositeId) {
        workspace.data.logger.error('Save failed: no composite ID for editing wrapper');
        return;
      }

      // Semantic validation before persisting
      const validationResult = Editing.Ingredients.Validators.validateIngredientEntity(entity);
      if (validationResult.isFailure()) {
        workspace.data.logger.error(`Save failed: ${validationResult.message}`);
        return;
      }

      // Derive collection ID from composite ID (prefix before '.')
      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseIngredientId;

      // 1. Update the underlying library collection in-memory so the data is immediately consistent
      const collectionEntry = workspace.data.entities.ingredients.collections.get(collectionId);
      if (collectionEntry.isFailure()) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' not found`);
        return;
      }
      if (!collectionEntry.value.isMutable) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' is immutable`);
        return;
      }
      const inMemoryResult = collectionEntry.value.items.set(baseId, entity);
      if (inMemoryResult.isFailure()) {
        workspace.data.logger.error(`Save failed (in-memory): ${inMemoryResult.message}`);
        return;
      }

      // 2. Persist to disk via EditableCollection (snapshot + sourceItem for YAML write)
      const editableResult = workspace.data.entities.getEditableIngredientsEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const saveResult = editable.save();
          if (saveResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed: ${saveResult.message}`);
          } else {
            workspace.data.logger.info(`Saved ingredient '${entity.name}' to collection '${collectionId}'`);
          }
        } else {
          workspace.data.logger.info(
            `Updated ingredient '${entity.name}' in-memory (collection '${collectionId}' has no backing file)`
          );
        }
      } else {
        workspace.data.logger.info(
          `Updated ingredient '${entity.name}' in-memory only: ${editableResult.message}`
        );
      }

      // 3. Invalidate caches and notify React so the UI reflects the saved data
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      // 4. Discard wrapper and switch back to view mode
      const entityId = compositeId;
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'ingredient' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  // Get or create an EditedIngredient wrapper for the given entity
  const getOrCreateWrapper = useCallback(
    (ingredient: LibraryRuntime.AnyIngredient): LibraryRuntime.EditedIngredient | undefined => {
      const id = ingredient.id;
      if (editingRef.current?.id === id) {
        return editingRef.current.wrapper;
      }
      const result = LibraryRuntime.EditedIngredient.create(ingredient.entity);
      if (result.isFailure()) {
        return undefined;
      }
      editingRef.current = { id, wrapper: result.value };
      return result.value;
    },
    []
  );

  // Open the cascade in 'create' mode for a new ingredient
  const handleNewIngredient = useCallback((): void => {
    const entry: ICascadeEntry = { entityType: 'ingredient', entityId: '__new__', mode: 'create' };
    squashCascade([entry]);
  }, [squashCascade]);

  // EntityCreateForm onCreate callback — wraps handleCreateIngredient with the blank entity builder
  const handleCreateFormSubmit = useCallback(
    (entity: Entities.Ingredients.IngredientEntity, source: 'manual' | 'ai'): void => {
      handleCreateIngredient(entity, source);
    },
    [handleCreateIngredient]
  );

  // Cancel the create form — clear the cascade
  const handleCreateFormCancel = useCallback((): void => {
    squashCascade([]);
  }, [squashCascade]);

  // Build cascade columns from the cascade stack
  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack
      .filter((e) => e.entityType === 'ingredient')
      .map((entry) => {
        // Create mode: render EntityCreateForm
        if (entry.mode === 'create') {
          return {
            key: '__new__',
            label: 'New Ingredient',
            content: (
              <EntityCreateForm<Entities.Ingredients.IngredientEntity>
                slugify={slugify}
                buildPrompt={AiAssist.buildIngredientAiPrompt}
                convert={Entities.Ingredients.Converters.ingredientEntity.convert}
                makeBlank={(name: string, id: string): Entities.Ingredients.IngredientEntity =>
                  createBlankIngredientEntity(id as BaseIngredientId, name)
                }
                onCreate={handleCreateFormSubmit}
                onCancel={handleCreateFormCancel}
                namePlaceholder="e.g. Callebaut 811 Dark"
                entityLabel="Ingredient"
              />
            )
          };
        }

        const result = workspace.data.ingredients.get(entry.entityId as IngredientId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load ingredient: {entry.entityId}</div>
          };
        }

        // Edit mode: render IngredientEditView
        if (entry.mode === 'edit') {
          const wrapper = getOrCreateWrapper(result.value);
          if (wrapper === undefined) {
            return {
              key: entry.entityId,
              label: result.value.name,
              content: <div className="p-4 text-red-500">Failed to create editing wrapper</div>
            };
          }

          // Detect whether the source collection is immutable
          const collectionId = entry.entityId.split('.')[0] as CollectionId;
          const collectionEntry = workspace.data.entities.ingredients.collections.get(collectionId);
          const isReadOnly = collectionEntry.isSuccess() && !collectionEntry.value.isMutable;

          return {
            key: `${entry.entityId}:edit`,
            label: `${result.value.name} (editing)`,
            content: (
              <IngredientEditView
                wrapper={wrapper}
                onSave={handleSave}
                onSaveAs={isReadOnly ? handleSaveAs : undefined}
                onCancel={(): void => handleCancelEdit(entry.entityId)}
                readOnly={isReadOnly}
              />
            )
          };
        }

        // View mode: render IngredientDetail with Edit button
        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <IngredientDetail ingredient={result.value} onEdit={(): void => handleEdit(entry.entityId)} />
          )
        };
      });
  }, [
    cascadeStack,
    workspace,
    getOrCreateWrapper,
    handleSave,
    handleSaveAs,
    handleCancelEdit,
    handleEdit,
    handleCreateFormSubmit,
    handleCreateFormCancel
  ]);

  const comparisonColumns = useMemo<ReadonlyArray<IComparisonColumn>>(() => {
    return Array.from(compareIds).map((id) => {
      const result = workspace.data.ingredients.get(id as IngredientId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return { key: id, label: result.value.name, content: <IngredientDetail ingredient={result.value} /> };
    });
  }, [compareIds, workspace]);

  return (
    <EntityTabLayout
      list={
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
            <button
              onClick={handleNewIngredient}
              disabled={mutableCollectionId === undefined}
              title={mutableCollectionId === undefined ? 'No mutable collection available' : undefined}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + New Ingredient
            </button>
            <button
              onClick={handleListHeaderPaste}
              disabled={mutableCollectionId === undefined}
              title="Paste ingredient from clipboard (AI-generated JSON)"
              className="p-1.5 text-gray-500 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CursorArrowRaysIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <EntityList<LibraryRuntime.AnyIngredient, IngredientId>
              entities={useFilteredEntities(ingredients, INGREDIENT_FILTER_SPEC)}
              descriptor={INGREDIENT_DESCRIPTOR}
              selectedId={selectedId}
              onSelect={handleSelect}
              onDrill={collapseList}
              compareMode={compareMode}
              checkedIds={compareIds}
              onCheckedChange={toggleCompareId}
              onToggleCompare={toggleCompareMode}
              compareCount={compareIds.size}
              onStartComparison={startComparison}
              emptyState={{
                title: 'No Ingredients',
                description: 'No ingredients found in the library.'
              }}
            />
          </div>
        </div>
      }
      cascadeColumns={cascadeColumns}
      onPopTo={popCascadeTo}
      listCollapsed={listCollapsed}
      onListCollapse={collapseList}
      compareMode={compareMode}
      comparisonColumns={comparisonColumns}
      showingComparison={showingComparison}
      onExitComparison={exitComparison}
    />
  );
}

// ============================================================================
// Fillings Tab Content
// ============================================================================

function FillingsTabContent(): React.ReactElement {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const squashCascade = useNavigationStore((s) => s.squashCascade);
  const popCascadeTo = useNavigationStore((s) => s.popCascadeTo);
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);
  const listCollapsed = useNavigationStore((s) => s.listCollapsed);
  const collapseList = useNavigationStore((s) => s.collapseList);
  const compareMode = useNavigationStore((s) => s.compareMode);
  const compareIds = useNavigationStore((s) => s.compareIds);
  const toggleCompareMode = useNavigationStore((s) => s.toggleCompareMode);
  const toggleCompareId = useNavigationStore((s) => s.toggleCompareId);
  const showingComparison = useNavigationStore((s) => s.showingComparison);
  const startComparison = useNavigationStore((s) => s.startComparison);
  const exitComparison = useNavigationStore((s) => s.exitComparison);
  const [variationCompare, setVariationCompare] = useState<
    { id: FillingId; specs: ReadonlyArray<string> } | undefined
  >(undefined);

  // Collect all fillings into a sorted array (memoized on workspace version)
  const fillings = useMemo<ReadonlyArray<LibraryRuntime.FillingRecipe>>(() => {
    return Array.from(workspace.data.fillings.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  // Selected filling ID = first cascade entry of type 'filling'
  const selectedId =
    cascadeStack.length > 0 && cascadeStack[0].entityType === 'filling'
      ? (cascadeStack[0].entityId as FillingId)
      : undefined;

  const handleSelect = useCallback(
    (id: FillingId): void => {
      const entry: ICascadeEntry = { entityType: 'filling', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  // Depth-aware squash: keep stack up to and including the pane at `depth`, then append the new entry.
  const squashAt = useCallback(
    (depth: number, entry: ICascadeEntry): void => {
      squashCascade([...cascadeStack.slice(0, depth + 1), entry]);
    },
    [squashCascade, cascadeStack]
  );

  // Build cascade columns from the cascade stack
  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, index) => {
      const onIngredientClick = (id: IngredientId): void => {
        squashAt(index, { entityType: 'ingredient', entityId: id, mode: 'view' });
      };
      const onProcedureClick = (id: ProcedureId): void => {
        squashAt(index, { entityType: 'procedure', entityId: id, mode: 'view' });
      };
      const onTaskClick = (id: TaskId): void => {
        squashAt(index, { entityType: 'task', entityId: id, mode: 'view' });
      };

      if (entry.entityType === 'filling') {
        const result = workspace.data.fillings.get(entry.entityId as FillingId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load filling: {entry.entityId}</div>
          };
        }
        const fillingId = entry.entityId as FillingId;
        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <FillingDetail
              filling={result.value}
              onIngredientClick={onIngredientClick}
              onProcedureClick={onProcedureClick}
              onCompareVariations={(specs): void => setVariationCompare({ id: fillingId, specs })}
            />
          )
        };
      }
      if (entry.entityType === 'ingredient') {
        const result = workspace.data.ingredients.get(entry.entityId as IngredientId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load ingredient: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: <IngredientDetail ingredient={result.value} />
        };
      }
      if (entry.entityType === 'procedure') {
        const result = workspace.data.procedures.get(entry.entityId as ProcedureId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load procedure: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: <ProcedureDetail procedure={result.value} onTaskClick={onTaskClick} />
        };
      }
      if (entry.entityType === 'task') {
        if (nestedTaskSession && entry.entityId === nestedTaskSession.taskEntityId) {
          if (entry.mode === 'preview') {
            return {
              key: `${entry.entityId}:preview`,
              label: `${nestedTaskSession.wrapper.current.name} (preview)`,
              content: (
                <TaskPreviewPanel
                  template={nestedTaskSession.wrapper.current.template}
                  defaults={nestedTaskSession.wrapper.current.defaults}
                  taskName={nestedTaskSession.wrapper.current.name}
                  onClose={(): void => handleCloseNestedTaskPreview(entry.entityId)}
                />
              )
            };
          }

          return {
            key: `${entry.entityId}:edit`,
            label: `${nestedTaskSession.wrapper.current.name} (editing)`,
            content: (
              <TaskEditView
                wrapper={nestedTaskSession.wrapper}
                onSave={handleNestedTaskSave}
                onCancel={handleNestedTaskCancel}
                onPreview={(): void => handleNestedTaskPreview(entry.entityId)}
                onMutate={(): void => setTaskPreviewVersion((v) => v + 1)}
              />
            )
          };
        }

        const result = workspace.data.tasks.get(entry.entityId as TaskId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load task: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: <TaskDetail task={result.value} />
        };
      }
      return {
        key: entry.entityId,
        label: entry.entityId,
        content: <div className="p-4 text-gray-500">Unknown entity type: {entry.entityType}</div>
      };
    });
  }, [
    cascadeStack,
    workspace,
    squashAt,
    availableTasks,
    getOrCreateWrapper,
    handleSaveProcedure,
    handleSaveProcedureAs,
    handleCancelProcedureEdit,
    handleEditProcedure,
    handlePreviewProcedure,
    handleCloseProcedurePreview,
    handleOpenStepTaskEditor,
    handleNestedTaskSave,
    handleNestedTaskCancel,
    handleNestedTaskPreview,
    handleCloseNestedTaskPreview,
    nestedTaskSession,
    previewVersion,
    taskPreviewVersion
  ]);

  const comparisonColumns = useMemo<ReadonlyArray<IComparisonColumn>>(() => {
    return Array.from(compareIds).map((id) => {
      const result = workspace.data.fillings.get(id as FillingId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return { key: id, label: result.value.name, content: <FillingDetail filling={result.value} /> };
    });
  }, [compareIds, workspace]);

  const variationCompareColumns = useMemo<ReadonlyArray<IComparisonColumn> | undefined>(() => {
    if (variationCompare === undefined) {
      return undefined;
    }
    const result = workspace.data.fillings.get(variationCompare.id);
    if (result.isFailure()) {
      return undefined;
    }
    const filling = result.value;
    const specsSet = new Set(variationCompare.specs);
    return filling.variations
      .filter((v) => specsSet.has(v.variationSpec))
      .map((v) => ({
        key: v.variationSpec,
        label: `${filling.name} — ${v.variationSpec}${
          v.variationSpec === filling.goldenVariationSpec ? ' ★' : ''
        }`,
        content: <FillingDetail filling={filling} defaultVariationSpec={v.variationSpec} />
      }));
  }, [variationCompare, workspace]);

  return (
    <EntityTabLayout
      list={
        <EntityList<LibraryRuntime.FillingRecipe, FillingId>
          entities={useFilteredEntities(fillings, FILLING_FILTER_SPEC)}
          descriptor={FILLING_DESCRIPTOR}
          selectedId={selectedId}
          onSelect={handleSelect}
          onDrill={collapseList}
          compareMode={compareMode}
          checkedIds={compareIds}
          onCheckedChange={toggleCompareId}
          onToggleCompare={toggleCompareMode}
          compareCount={compareIds.size}
          onStartComparison={startComparison}
          emptyState={{
            title: 'No Fillings',
            description: 'No filling recipes found in the library.'
          }}
        />
      }
      cascadeColumns={cascadeColumns}
      onPopTo={popCascadeTo}
      listCollapsed={listCollapsed}
      onListCollapse={collapseList}
      compareMode={compareMode}
      comparisonColumns={comparisonColumns}
      showingComparison={showingComparison}
      onExitComparison={exitComparison}
      variationCompareColumns={variationCompareColumns}
      onExitVariationCompare={(): void => setVariationCompare(undefined)}
    />
  );
}

// ============================================================================
// Molds Tab Content
// ============================================================================

function MoldsTabContent(): React.ReactElement {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const squashCascade = useNavigationStore((s) => s.squashCascade);
  const popCascadeTo = useNavigationStore((s) => s.popCascadeTo);
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);
  const listCollapsed = useNavigationStore((s) => s.listCollapsed);
  const collapseList = useNavigationStore((s) => s.collapseList);
  const compareMode = useNavigationStore((s) => s.compareMode);
  const compareIds = useNavigationStore((s) => s.compareIds);
  const toggleCompareMode = useNavigationStore((s) => s.toggleCompareMode);
  const toggleCompareId = useNavigationStore((s) => s.toggleCompareId);
  const showingComparison = useNavigationStore((s) => s.showingComparison);
  const startComparison = useNavigationStore((s) => s.startComparison);
  const exitComparison = useNavigationStore((s) => s.exitComparison);

  // Editing wrapper ref — persists the EditedMold across re-renders while editing.
  const editingRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedMold } | undefined>(undefined);

  // Find the first mutable collection ID (memoized)
  const mutableCollectionId = useMemo<CollectionId | undefined>(() => {
    const collections = workspace.data.entities.molds.collections;
    for (const [id, col] of collections.entries()) {
      if (col.isMutable) {
        return id as CollectionId;
      }
    }
    return undefined;
  }, [workspace, reactiveWorkspace.version]);

  // Create a new mold from an entity, add to mutable collection, and open in edit mode
  const handleCreateMold = useCallback(
    (entity: Entities.Molds.IMoldEntity, source: 'manual' | 'ai'): void => {
      if (!mutableCollectionId) {
        workspace.data.logger.error('Cannot add mold: no mutable collection available');
        return;
      }

      const baseId = entity.baseId as BaseMoldId;
      const compositeId = `${mutableCollectionId}.${baseId}` as MoldId;

      // Check for duplicate
      const existing = workspace.data.molds.get(compositeId);
      if (existing.isSuccess()) {
        workspace.data.logger.error(`Mold '${compositeId}' already exists`);
        return;
      }

      // Add to in-memory collection
      const colResult = workspace.data.entities.molds.collections.get(mutableCollectionId);
      if (colResult.isFailure()) {
        workspace.data.logger.error(`Collection '${mutableCollectionId}' not found: ${colResult.message}`);
        return;
      }
      if (!colResult.value.isMutable) {
        workspace.data.logger.error(`Collection '${mutableCollectionId}' is not mutable`);
        return;
      }
      const setResult = colResult.value.items.set(baseId, entity);
      if (setResult.isFailure()) {
        workspace.data.logger.error(`Failed to add mold: ${setResult.message}`);
        return;
      }

      // Invalidate caches so the new mold appears in the list
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      // Create editing wrapper and open in edit mode
      const wrapperResult = LibraryRuntime.EditedMold.create(entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create editing wrapper: ${wrapperResult.message}`);
        return;
      }
      editingRef.current = { id: compositeId, wrapper: wrapperResult.value };

      if (source === 'ai') {
        workspace.data.logger.info(
          `Created mold '${entity.manufacturer} ${entity.productNumber}' from AI-generated data`
        );
      }

      const entry: ICascadeEntry = { entityType: 'mold', entityId: compositeId, mode: 'edit' };
      squashCascade([entry]);
    },
    [workspace, reactiveWorkspace, mutableCollectionId, squashCascade]
  );

  // Handle paste from the list header drop target button
  const handleListHeaderPaste = useCallback((): void => {
    navigator.clipboard.readText().then(
      (text) => {
        if (!text.trim()) {
          workspace.data.logger.info('Clipboard is empty');
          return;
        }

        // Strip markdown code fences
        const stripped = text
          .trim()
          .replace(/^```(?:\w+)?\s*\n?([\s\S]*?)\n?\s*```$/, '$1')
          .trim();

        let parsed: unknown;
        try {
          parsed = JSON.parse(stripped);
        } catch (err: unknown) {
          const detail = err instanceof Error ? err.message : String(err);
          workspace.data.logger.error(`Clipboard does not contain valid JSON: ${detail}`);
          return;
        }

        const result = Entities.Molds.Converters.moldEntity.convert(parsed);
        if (result.isFailure()) {
          workspace.data.logger.error(`AI mold validation failed: ${result.message}`);
          return;
        }

        handleCreateMold(result.value, 'ai');
        workspace.data.logger.info(
          `Opened '${result.value.manufacturer} ${result.value.productNumber}' for review — save when ready`
        );
      },
      () => {
        workspace.data.logger.error('Could not read clipboard — permission may be required');
      }
    );
  }, [workspace, handleCreateMold]);

  const molds = useMemo<ReadonlyArray<LibraryRuntime.IMold>>(() => {
    return Array.from(workspace.data.molds.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [workspace, reactiveWorkspace.version]);

  const selectedId =
    cascadeStack.length > 0 && cascadeStack[0].entityType === 'mold'
      ? (cascadeStack[0].entityId as MoldId)
      : undefined;

  const handleSelect = useCallback(
    (id: MoldId): void => {
      const entry: ICascadeEntry = { entityType: 'mold', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  // Switch a cascade entry from view → edit mode
  const handleEdit = useCallback(
    (entityId: string): void => {
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'mold' ? { ...e, mode: 'edit' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  // Switch a cascade entry from edit → view mode (cancel editing)
  const handleCancelEdit = useCallback(
    (entityId: string): void => {
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'mold' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  // "Save to..." handler — triggered when editing a read-only mold.
  const handleSaveAs = useCallback(
    (wrapper: LibraryRuntime.EditedMold): void => {
      const entity = wrapper.current;
      workspace.data.logger.info(
        `Save to... requested for '${entity.manufacturer} ${entity.productNumber}' — collection picker not yet implemented`
      );
    },
    [workspace]
  );

  // Save handler — persists the edited entity back to its collection via EditableCollection
  const handleSave = useCallback(
    (wrapper: LibraryRuntime.EditedMold): void => {
      const entity = wrapper.current;
      const compositeId = editingRef.current?.id;
      if (!compositeId) {
        workspace.data.logger.error('Save failed: no composite ID for editing wrapper');
        return;
      }

      // Semantic validation before persisting
      const validationResult = Editing.Molds.Validators.validateMoldEntity(entity);
      if (validationResult.isFailure()) {
        workspace.data.logger.error(`Save failed: ${validationResult.message}`);
        return;
      }

      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseMoldId;

      // 1. Update the underlying library collection in-memory
      const collectionEntry = workspace.data.entities.molds.collections.get(collectionId);
      if (collectionEntry.isFailure()) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' not found`);
        return;
      }
      if (!collectionEntry.value.isMutable) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' is immutable`);
        return;
      }
      const inMemoryResult = collectionEntry.value.items.set(baseId, entity);
      if (inMemoryResult.isFailure()) {
        workspace.data.logger.error(`Save failed (in-memory): ${inMemoryResult.message}`);
        return;
      }

      // 2. Persist to disk via EditableCollection
      const editableResult = workspace.data.entities.getEditableMoldsEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const saveResult = editable.save();
          if (saveResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed: ${saveResult.message}`);
          } else {
            workspace.data.logger.info(
              `Saved mold '${entity.manufacturer} ${entity.productNumber}' to collection '${collectionId}'`
            );
          }
        } else {
          workspace.data.logger.info(
            `Updated mold '${entity.manufacturer} ${entity.productNumber}' in-memory (collection '${collectionId}' has no backing file)`
          );
        }
      } else {
        workspace.data.logger.info(
          `Updated mold '${entity.manufacturer} ${entity.productNumber}' in-memory only: ${editableResult.message}`
        );
      }

      // 3. Invalidate caches and notify React
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      // 4. Discard wrapper and switch back to view mode
      const entityId = compositeId;
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'mold' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  // Get or create an EditedMold wrapper for the given entity
  const getOrCreateWrapper = useCallback(
    (mold: LibraryRuntime.IMold): LibraryRuntime.EditedMold | undefined => {
      const id = mold.id;
      if (editingRef.current?.id === id) {
        return editingRef.current.wrapper;
      }
      const result = LibraryRuntime.EditedMold.create(mold.entity);
      if (result.isFailure()) {
        return undefined;
      }
      editingRef.current = { id, wrapper: result.value };
      return result.value;
    },
    []
  );

  // Open the cascade in 'create' mode for a new mold
  const handleNewMold = useCallback((): void => {
    const entry: ICascadeEntry = { entityType: 'mold', entityId: '__new__', mode: 'create' };
    squashCascade([entry]);
  }, [squashCascade]);

  // EntityCreateForm onCreate callback
  const handleCreateFormSubmit = useCallback(
    (entity: Entities.Molds.IMoldEntity, source: 'manual' | 'ai'): void => {
      handleCreateMold(entity, source);
    },
    [handleCreateMold]
  );

  // Cancel the create form
  const handleCreateFormCancel = useCallback((): void => {
    squashCascade([]);
  }, [squashCascade]);

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack
      .filter((e) => e.entityType === 'mold')
      .map((entry) => {
        // Create mode: render EntityCreateForm
        if (entry.mode === 'create') {
          return {
            key: '__new__',
            label: 'New Mold',
            content: (
              <EntityCreateForm<Entities.Molds.IMoldEntity>
                slugify={slugify}
                buildPrompt={AiAssist.buildMoldAiPrompt}
                convert={Entities.Molds.Converters.moldEntity.convert}
                makeBlank={(name: string, id: string): Entities.Molds.IMoldEntity =>
                  createBlankMoldEntity(id as BaseMoldId, name)
                }
                onCreate={handleCreateFormSubmit}
                onCancel={handleCreateFormCancel}
                namePlaceholder="e.g. Chocolate World CW1000"
                entityLabel="Mold"
              />
            )
          };
        }

        const result = workspace.data.molds.get(entry.entityId as MoldId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load mold: {entry.entityId}</div>
          };
        }

        // Edit mode: render MoldEditView
        if (entry.mode === 'edit') {
          const wrapper = getOrCreateWrapper(result.value);
          if (wrapper === undefined) {
            return {
              key: entry.entityId,
              label: result.value.displayName,
              content: <div className="p-4 text-red-500">Failed to create editing wrapper</div>
            };
          }

          // Detect whether the source collection is immutable
          const collectionId = entry.entityId.split('.')[0] as CollectionId;
          const collectionEntry = workspace.data.entities.molds.collections.get(collectionId);
          const isReadOnly = collectionEntry.isSuccess() && !collectionEntry.value.isMutable;

          return {
            key: `${entry.entityId}:edit`,
            label: `${result.value.displayName} (editing)`,
            content: (
              <MoldEditView
                wrapper={wrapper}
                onSave={handleSave}
                onSaveAs={isReadOnly ? handleSaveAs : undefined}
                onCancel={(): void => handleCancelEdit(entry.entityId)}
                readOnly={isReadOnly}
              />
            )
          };
        }

        // View mode: render MoldDetail with Edit button
        return {
          key: entry.entityId,
          label: result.value.displayName,
          content: <MoldDetail mold={result.value} onEdit={(): void => handleEdit(entry.entityId)} />
        };
      });
  }, [
    cascadeStack,
    workspace,
    getOrCreateWrapper,
    handleSave,
    handleSaveAs,
    handleCancelEdit,
    handleEdit,
    handleCreateFormSubmit,
    handleCreateFormCancel
  ]);

  const comparisonColumns = useMemo<ReadonlyArray<IComparisonColumn>>(() => {
    return Array.from(compareIds).map((id) => {
      const result = workspace.data.molds.get(id as MoldId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return { key: id, label: result.value.displayName, content: <MoldDetail mold={result.value} /> };
    });
  }, [compareIds, workspace]);

  return (
    <EntityTabLayout
      list={
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
            <button
              onClick={handleNewMold}
              disabled={mutableCollectionId === undefined}
              title={mutableCollectionId === undefined ? 'No mutable collection available' : undefined}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + New Mold
            </button>
            <button
              onClick={handleListHeaderPaste}
              disabled={mutableCollectionId === undefined}
              title="Paste mold from clipboard (AI-generated JSON)"
              className="p-1.5 text-gray-500 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CursorArrowRaysIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <EntityList<LibraryRuntime.IMold, MoldId>
              entities={useFilteredEntities(molds, MOLD_FILTER_SPEC)}
              descriptor={MOLD_DESCRIPTOR}
              selectedId={selectedId}
              onSelect={handleSelect}
              onDrill={collapseList}
              compareMode={compareMode}
              checkedIds={compareIds}
              onCheckedChange={toggleCompareId}
              onToggleCompare={toggleCompareMode}
              compareCount={compareIds.size}
              onStartComparison={startComparison}
              emptyState={{
                title: 'No Molds',
                description: 'No molds found in the library.'
              }}
            />
          </div>
        </div>
      }
      cascadeColumns={cascadeColumns}
      onPopTo={popCascadeTo}
      listCollapsed={listCollapsed}
      onListCollapse={collapseList}
      compareMode={compareMode}
      comparisonColumns={comparisonColumns}
      showingComparison={showingComparison}
      onExitComparison={exitComparison}
    />
  );
}

// ============================================================================
// Tasks Tab Content
// ============================================================================

function TasksTabContent(): React.ReactElement {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const squashCascade = useNavigationStore((s) => s.squashCascade);
  const popCascadeTo = useNavigationStore((s) => s.popCascadeTo);
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);
  const listCollapsed = useNavigationStore((s) => s.listCollapsed);
  const collapseList = useNavigationStore((s) => s.collapseList);
  const compareMode = useNavigationStore((s) => s.compareMode);
  const compareIds = useNavigationStore((s) => s.compareIds);
  const toggleCompareMode = useNavigationStore((s) => s.toggleCompareMode);
  const toggleCompareId = useNavigationStore((s) => s.toggleCompareId);
  const showingComparison = useNavigationStore((s) => s.showingComparison);
  const startComparison = useNavigationStore((s) => s.startComparison);
  const exitComparison = useNavigationStore((s) => s.exitComparison);

  // Editing wrapper ref — persists the EditedTask across re-renders while editing.
  const editingRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedTask } | undefined>(undefined);

  // Counter that increments on each edit mutation — forces the preview column to re-render with live data.
  const [previewVersion, setPreviewVersion] = useState(0);

  // Find the first mutable collection ID (memoized)
  const mutableCollectionId = useMemo<CollectionId | undefined>(() => {
    const collections = workspace.data.entities.tasks.collections;
    for (const [id, col] of collections.entries()) {
      if (col.isMutable) {
        return id as CollectionId;
      }
    }
    return undefined;
  }, [workspace, reactiveWorkspace.version]);

  // Create a new task from an entity, add to mutable collection, and open in edit mode
  const handleCreateTask = useCallback(
    (entity: Entities.Tasks.IRawTaskEntity, source: 'manual'): void => {
      if (!mutableCollectionId) {
        workspace.data.logger.error('Cannot add task: no mutable collection available');
        return;
      }

      const baseId = entity.baseId as BaseTaskId;
      const compositeId = `${mutableCollectionId}.${baseId}` as TaskId;

      // Check for duplicate
      const existing = workspace.data.tasks.get(compositeId);
      if (existing.isSuccess()) {
        workspace.data.logger.error(`Task '${compositeId}' already exists`);
        return;
      }

      // Add to in-memory collection
      const colResult = workspace.data.entities.tasks.collections.get(mutableCollectionId);
      if (colResult.isFailure()) {
        workspace.data.logger.error(`Collection '${mutableCollectionId}' not found: ${colResult.message}`);
        return;
      }
      if (!colResult.value.isMutable) {
        workspace.data.logger.error(`Collection '${mutableCollectionId}' is not mutable`);
        return;
      }
      const setResult = colResult.value.items.set(baseId, entity);
      if (setResult.isFailure()) {
        workspace.data.logger.error(`Failed to add task: ${setResult.message}`);
        return;
      }

      // Invalidate caches so the new task appears in the list
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      // Create editing wrapper and open in edit mode
      const wrapperResult = LibraryRuntime.EditedTask.create(entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create editing wrapper: ${wrapperResult.message}`);
        return;
      }
      editingRef.current = { id: compositeId, wrapper: wrapperResult.value };

      if (source === 'manual') {
        workspace.data.logger.info(`Created task '${entity.name}' — edit and save when ready`);
      }

      const entry: ICascadeEntry = { entityType: 'task', entityId: compositeId, mode: 'edit' };
      squashCascade([entry]);
    },
    [workspace, reactiveWorkspace, mutableCollectionId, squashCascade]
  );

  const tasks = useMemo<ReadonlyArray<LibraryRuntime.ITask>>(() => {
    return Array.from(workspace.data.tasks.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const selectedId =
    cascadeStack.length > 0 && cascadeStack[0].entityType === 'task'
      ? (cascadeStack[0].entityId as TaskId)
      : undefined;

  const handleSelect = useCallback(
    (id: TaskId): void => {
      const entry: ICascadeEntry = { entityType: 'task', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  // Switch a cascade entry from view → edit mode
  const handleEdit = useCallback(
    (entityId: string): void => {
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'task' ? { ...e, mode: 'edit' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  // Switch a cascade entry from edit → view mode (cancel editing)
  const handleCancelEdit = useCallback(
    (entityId: string): void => {
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'task' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  // "Save to..." handler — triggered when editing a read-only task.
  const handleSaveAs = useCallback(
    (wrapper: LibraryRuntime.EditedTask): void => {
      const entity = wrapper.current;
      workspace.data.logger.info(
        `Save to... requested for '${entity.name}' — collection picker not yet implemented`
      );
    },
    [workspace]
  );

  // Save handler — persists the edited entity back to its collection
  const handleSave = useCallback(
    (wrapper: LibraryRuntime.EditedTask): void => {
      const entity = wrapper.current;
      const compositeId = editingRef.current?.id;
      if (!compositeId) {
        workspace.data.logger.error('Save failed: no composite ID for editing wrapper');
        return;
      }

      // Semantic validation before persisting
      const validationResult = Editing.Tasks.Validators.validateRawTaskEntity(entity);
      if (validationResult.isFailure()) {
        workspace.data.logger.error(`Save failed: ${validationResult.message}`);
        return;
      }

      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseTaskId;

      // 1. Update the underlying library collection in-memory
      const collectionEntry = workspace.data.entities.tasks.collections.get(collectionId);
      if (collectionEntry.isFailure()) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' not found`);
        return;
      }
      if (!collectionEntry.value.isMutable) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' is immutable`);
        return;
      }
      const inMemoryResult = collectionEntry.value.items.set(baseId, entity);
      if (inMemoryResult.isFailure()) {
        workspace.data.logger.error(`Save failed (in-memory): ${inMemoryResult.message}`);
        return;
      }

      // 2. Persist to disk via EditableCollection
      const editableResult = workspace.data.entities.getEditableTasksEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const saveResult = editable.save();
          if (saveResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed: ${saveResult.message}`);
          } else {
            workspace.data.logger.info(`Saved task '${entity.name}' to collection '${collectionId}'`);
          }
        } else {
          workspace.data.logger.info(
            `Updated task '${entity.name}' in-memory (collection '${collectionId}' has no backing file)`
          );
        }
      } else {
        workspace.data.logger.info(`Updated task '${entity.name}' in-memory only: ${editableResult.message}`);
      }

      // 3. Invalidate caches and notify React
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      // 4. Discard wrapper and switch back to view mode
      const entityId = compositeId;
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'task' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  // Get or create an EditedTask wrapper for the given task
  const getOrCreateWrapper = useCallback(
    (task: LibraryRuntime.ITask): LibraryRuntime.EditedTask | undefined => {
      const id = task.id;
      if (editingRef.current?.id === id) {
        return editingRef.current.wrapper;
      }
      const result = LibraryRuntime.EditedTask.create(task.entity);
      if (result.isFailure()) {
        return undefined;
      }
      editingRef.current = { id, wrapper: result.value };
      return result.value;
    },
    []
  );

  // Open the cascade in 'preview' mode for a task.
  // Strips any existing preview entry first to avoid stacking duplicate panels.
  const handlePreview = useCallback(
    (entityId: string): void => {
      const withoutPreview = cascadeStack.filter(
        (e) => !(e.entityType === 'task' && e.entityId === entityId && e.mode === 'preview')
      );
      squashCascade([...withoutPreview, { entityType: 'task', entityId, mode: 'preview' }]);
    },
    [cascadeStack, squashCascade]
  );

  // Close the preview pane by removing preview entries from the cascade
  const handleClosePreview = useCallback(
    (entityId: string): void => {
      squashCascade(cascadeStack.filter((e) => !(e.entityId === entityId && e.mode === 'preview')));
    },
    [cascadeStack, squashCascade]
  );

  // Open the cascade in 'create' mode for a new task
  const handleNewTask = useCallback((): void => {
    const entry: ICascadeEntry = { entityType: 'task', entityId: '__new__', mode: 'create' };
    squashCascade([entry]);
  }, [squashCascade]);

  // Simple inline create form state
  const [newTaskName, setNewTaskName] = useState('');

  const handleCreateFormSubmit = useCallback((): void => {
    const trimmed = newTaskName.trim();
    if (!trimmed) return;
    const id = slugify(trimmed);
    const entity = createBlankRawTaskEntity(id as BaseTaskId, trimmed);
    handleCreateTask(entity, 'manual');
    setNewTaskName('');
  }, [newTaskName, handleCreateTask]);

  const handleCreateFormCancel = useCallback((): void => {
    setNewTaskName('');
    squashCascade([]);
  }, [squashCascade]);

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack
      .filter((e) => e.entityType === 'task')
      .map((entry) => {
        // Create mode: render a simple name input form (no AI assist)
        if (entry.mode === 'create') {
          return {
            key: '__new__',
            label: 'New Task',
            content: (
              <div className="p-4 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">New Task</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Melt Chocolate"
                    value={newTaskName}
                    onChange={(e): void => setNewTaskName(e.target.value)}
                    onKeyDown={(e): void => {
                      if (e.key === 'Enter') handleCreateFormSubmit();
                      if (e.key === 'Escape') handleCreateFormCancel();
                    }}
                    autoFocus
                  />
                  {newTaskName.trim() && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">ID: {slugify(newTaskName.trim())}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateFormSubmit}
                    disabled={!newTaskName.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={handleCreateFormCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )
          };
        }

        const result = workspace.data.tasks.get(entry.entityId as TaskId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load task: {entry.entityId}</div>
          };
        }

        // Preview mode: render TaskPreviewPanel
        if (entry.mode === 'preview') {
          // If we're editing, show live preview from the wrapper
          const wrapper = editingRef.current?.id === entry.entityId ? editingRef.current.wrapper : undefined;
          const template = wrapper?.current.template ?? result.value.template;
          const defaults = wrapper?.current.defaults ?? result.value.defaults;
          const taskName = wrapper?.current.name ?? result.value.name;
          return {
            key: `${entry.entityId}:preview`,
            label: `${taskName} (preview)`,
            content: (
              <TaskPreviewPanel
                template={template}
                defaults={defaults}
                taskName={taskName}
                onClose={(): void => handleClosePreview(entry.entityId)}
              />
            )
          };
        }

        // Edit mode: render TaskEditView
        if (entry.mode === 'edit') {
          const wrapper = getOrCreateWrapper(result.value);
          if (wrapper === undefined) {
            return {
              key: entry.entityId,
              label: result.value.name,
              content: <div className="p-4 text-red-500">Failed to create editing wrapper</div>
            };
          }

          // Detect whether the source collection is immutable
          const collectionId = entry.entityId.split('.')[0] as CollectionId;
          const collectionEntry = workspace.data.entities.tasks.collections.get(collectionId);
          const isReadOnly = collectionEntry.isSuccess() && !collectionEntry.value.isMutable;

          return {
            key: `${entry.entityId}:edit`,
            label: `${result.value.name} (editing)`,
            content: (
              <TaskEditView
                wrapper={wrapper}
                onSave={handleSave}
                onSaveAs={isReadOnly ? handleSaveAs : undefined}
                onCancel={(): void => handleCancelEdit(entry.entityId)}
                readOnly={isReadOnly}
                onPreview={(): void => handlePreview(entry.entityId)}
                onMutate={(): void => setPreviewVersion((v) => v + 1)}
              />
            )
          };
        }

        // View mode: render TaskDetail with Edit and Preview buttons
        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <TaskDetail
              task={result.value}
              onEdit={(): void => handleEdit(entry.entityId)}
              onPreview={(): void => handlePreview(entry.entityId)}
            />
          )
        };
      });
  }, [
    cascadeStack,
    workspace,
    newTaskName,
    getOrCreateWrapper,
    handleSave,
    handleSaveAs,
    handleCancelEdit,
    handleEdit,
    handlePreview,
    handleClosePreview,
    handleCreateFormSubmit,
    handleCreateFormCancel,
    previewVersion
  ]);

  const comparisonColumns = useMemo<ReadonlyArray<IComparisonColumn>>(() => {
    return Array.from(compareIds).map((id) => {
      const result = workspace.data.tasks.get(id as TaskId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return { key: id, label: result.value.name, content: <TaskDetail task={result.value} /> };
    });
  }, [compareIds, workspace]);

  return (
    <EntityTabLayout
      list={
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
            <button
              onClick={handleNewTask}
              disabled={mutableCollectionId === undefined}
              title={mutableCollectionId === undefined ? 'No mutable collection available' : undefined}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + New Task
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <EntityList<LibraryRuntime.ITask, TaskId>
              entities={useFilteredEntities(tasks, TASK_FILTER_SPEC)}
              descriptor={TASK_DESCRIPTOR}
              selectedId={selectedId}
              onSelect={handleSelect}
              onDrill={collapseList}
              compareMode={compareMode}
              checkedIds={compareIds}
              onCheckedChange={toggleCompareId}
              onToggleCompare={toggleCompareMode}
              compareCount={compareIds.size}
              onStartComparison={startComparison}
              emptyState={{
                title: 'No Tasks',
                description: 'No tasks found in the library.'
              }}
            />
          </div>
        </div>
      }
      cascadeColumns={cascadeColumns}
      onPopTo={popCascadeTo}
      listCollapsed={listCollapsed}
      onListCollapse={collapseList}
      compareMode={compareMode}
      comparisonColumns={comparisonColumns}
      showingComparison={showingComparison}
      onExitComparison={exitComparison}
    />
  );
}

// ============================================================================
// Procedures Tab Content
// ============================================================================

function ProceduresTabContent(): React.ReactElement {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const squashCascade = useNavigationStore((s) => s.squashCascade);
  const popCascadeTo = useNavigationStore((s) => s.popCascadeTo);
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);
  const listCollapsed = useNavigationStore((s) => s.listCollapsed);
  const collapseList = useNavigationStore((s) => s.collapseList);
  const compareMode = useNavigationStore((s) => s.compareMode);
  const compareIds = useNavigationStore((s) => s.compareIds);
  const toggleCompareMode = useNavigationStore((s) => s.toggleCompareMode);
  const toggleCompareId = useNavigationStore((s) => s.toggleCompareId);
  const showingComparison = useNavigationStore((s) => s.showingComparison);
  const startComparison = useNavigationStore((s) => s.startComparison);
  const exitComparison = useNavigationStore((s) => s.exitComparison);

  const editingRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedProcedure } | undefined>(undefined);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [taskPreviewVersion, setTaskPreviewVersion] = useState(0);
  const [editVersion, setEditVersion] = useState(0);

  const [newProcedureName, setNewProcedureName] = useState('');

  const [nestedTaskSession, setNestedTaskSession] = useState<
    | {
        readonly mode: 'inline' | 'library';
        readonly stepOrder: number;
        readonly taskEntityId: string;
        readonly wrapper: LibraryRuntime.EditedTask;
      }
    | undefined
  >(undefined);

  const [stepParamsSession, setStepParamsSession] = useState<
    | {
        readonly procedureId: string;
        readonly stepOrder: number;
      }
    | undefined
  >(undefined);

  const mutableProcedureCollectionId = useMemo<CollectionId | undefined>(() => {
    const collections = workspace.data.entities.procedures.collections;
    for (const [id, col] of collections.entries()) {
      if (col.isMutable) {
        return id as CollectionId;
      }
    }
    return undefined;
  }, [workspace, reactiveWorkspace.version]);

  const mutableTaskCollectionId = useMemo<CollectionId | undefined>(() => {
    const collections = workspace.data.entities.tasks.collections;
    for (const [id, col] of collections.entries()) {
      if (col.isMutable) {
        return id as CollectionId;
      }
    }
    return undefined;
  }, [workspace, reactiveWorkspace.version]);

  const procedures = useMemo<ReadonlyArray<LibraryRuntime.IProcedure>>(() => {
    return Array.from(workspace.data.procedures.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const availableTasks = useMemo<ReadonlyArray<LibraryRuntime.ITask>>(() => {
    return Array.from(workspace.data.tasks.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const selectedId =
    cascadeStack.length > 0 && cascadeStack[0].entityType === 'procedure'
      ? (cascadeStack[0].entityId as ProcedureId)
      : undefined;

  const handleSelect = useCallback(
    (id: ProcedureId): void => {
      const entry: ICascadeEntry = { entityType: 'procedure', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  const getOrCreateWrapper = useCallback(
    (procedure: LibraryRuntime.IProcedure): LibraryRuntime.EditedProcedure | undefined => {
      const id = procedure.id;
      if (editingRef.current?.id === id) {
        return editingRef.current.wrapper;
      }
      const result = LibraryRuntime.EditedProcedure.create(procedure.entity);
      if (result.isFailure()) {
        return undefined;
      }
      editingRef.current = { id, wrapper: result.value };
      return result.value;
    },
    []
  );

  const handleEditProcedure = useCallback(
    (entityId: string): void => {
      const idx = cascadeStack.findIndex((e) => e.entityId === entityId && e.entityType === 'procedure');
      if (idx < 0) return;
      // Truncate everything to the right of the procedure entry and switch to edit mode
      squashCascade([...cascadeStack.slice(0, idx), { ...cascadeStack[idx], mode: 'edit' as const }]);
    },
    [cascadeStack, squashCascade]
  );

  const handleCancelProcedureEdit = useCallback(
    (entityId: string): void => {
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      setNestedTaskSession(undefined);
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'procedure' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated.filter((e) => e.entityType !== 'task' || e.mode === 'view'));
    },
    [cascadeStack, squashCascade]
  );

  const handleSaveProcedureAs = useCallback(
    (wrapper: LibraryRuntime.EditedProcedure): void => {
      workspace.data.logger.info(
        `Save to... requested for procedure '${wrapper.current.name}' — collection picker not yet implemented`
      );
    },
    [workspace]
  );

  const handleSaveProcedure = useCallback(
    (wrapper: LibraryRuntime.EditedProcedure): void => {
      const entity = wrapper.current;
      const compositeId = editingRef.current?.id;
      if (!compositeId) {
        workspace.data.logger.error('Save failed: no composite ID for procedure editing wrapper');
        return;
      }

      const validationResult = Editing.Procedures.Validators.validateProcedureEntity(entity);
      if (validationResult.isFailure()) {
        workspace.data.logger.error(`Save failed: ${validationResult.message}`);
        return;
      }

      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseProcedureId;

      const collectionEntry = workspace.data.entities.procedures.collections.get(collectionId);
      if (collectionEntry.isFailure()) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' not found`);
        return;
      }
      if (!collectionEntry.value.isMutable) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' is immutable`);
        return;
      }

      const inMemoryResult = collectionEntry.value.items.set(baseId, entity);
      if (inMemoryResult.isFailure()) {
        workspace.data.logger.error(`Save failed (in-memory): ${inMemoryResult.message}`);
        return;
      }

      const editableResult = workspace.data.entities.getEditableProceduresEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const saveResult = editable.save();
          if (saveResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed: ${saveResult.message}`);
          }
        }
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      if (editingRef.current?.id === compositeId) {
        editingRef.current = undefined;
      }
      setNestedTaskSession(undefined);
      const updated = cascadeStack.map((e) =>
        e.entityId === compositeId && e.entityType === 'procedure' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated.filter((e) => e.entityType !== 'task' || e.mode === 'view'));
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  const handlePreviewProcedure = useCallback(
    (entityId: string): void => {
      const withoutAnyPreview = cascadeStack.filter(
        (e) => !(e.mode === 'preview' && (e.entityType === 'procedure' || e.entityType === 'task'))
      );
      squashCascade([...withoutAnyPreview, { entityType: 'procedure', entityId, mode: 'preview' }]);
    },
    [cascadeStack, squashCascade]
  );

  const handleCloseProcedurePreview = useCallback(
    (entityId: string): void => {
      squashCascade(
        cascadeStack.filter(
          (e) => !(e.entityType === 'procedure' && e.entityId === entityId && e.mode === 'preview')
        )
      );
    },
    [cascadeStack, squashCascade]
  );

  const handleOpenStepTaskEditor = useCallback(
    (stepOrder: number, mode: 'inline' | 'library', seed: string): void => {
      const procId = editingRef.current?.id;
      const procWrapper = editingRef.current?.wrapper;
      if (!procId || !procWrapper) {
        return;
      }

      // Check if editing existing step
      const currentStep = procWrapper.current.steps.find((s) => s.order === stepOrder);
      let wrapperResult: Result<LibraryRuntime.EditedTask>;

      if (currentStep && 'taskId' in currentStep.task) {
        // Editing existing library task reference
        const taskResult = workspace.data.tasks.get(currentStep.task.taskId);
        if (taskResult.isFailure()) {
          workspace.data.logger.error(
            `Failed to load library task ${currentStep.task.taskId}: ${taskResult.message}`
          );
          return;
        }
        wrapperResult = LibraryRuntime.EditedTask.create(taskResult.value.entity);
      } else if (currentStep && 'task' in currentStep.task) {
        // Editing existing inline task
        wrapperResult = LibraryRuntime.EditedTask.create(currentStep.task.task);
      } else if (mode === 'library') {
        // Creating new step with library task
        const taskResult = workspace.data.tasks.get(seed as TaskId);
        if (taskResult.isFailure()) {
          workspace.data.logger.error(`Failed to load library task ${seed}: ${taskResult.message}`);
          return;
        }
        wrapperResult = LibraryRuntime.EditedTask.create(taskResult.value.entity);

        // Create step with library task reference immediately
        procWrapper.addStep({
          task: { taskId: seed as TaskId, params: {} }
        });
      } else {
        // Creating new inline task
        const baseId = slugify(seed || `step-${stepOrder}`) as BaseTaskId;
        const rawTask = createBlankRawTaskEntity(baseId, seed || `Step ${stepOrder}`);
        wrapperResult = LibraryRuntime.EditedTask.create(rawTask);
      }

      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create task wrapper: ${wrapperResult.message}`);
        return;
      }

      const taskEntityId = `${procId}::__step_${stepOrder}_${mode}`;
      setNestedTaskSession({
        mode,
        stepOrder,
        taskEntityId,
        wrapper: wrapperResult.value
      });

      // Filter out preview and task entities to squash them, closing any open browser
      const baseStack = cascadeStack.filter((e) => e.mode !== 'preview' && e.entityType !== 'task');
      const ensuredProcedureEdit = baseStack.some(
        (e) => e.entityType === 'procedure' && e.entityId === procId && e.mode === 'edit'
      )
        ? baseStack
        : [{ entityType: 'procedure', entityId: procId, mode: 'edit' as const }, ...baseStack];
      squashCascade([...ensuredProcedureEdit, { entityType: 'task', entityId: taskEntityId, mode: 'edit' }]);
    },
    [cascadeStack, squashCascade, workspace]
  );

  const handleNestedTaskCancel = useCallback((): void => {
    const procId = editingRef.current?.id;
    setNestedTaskSession(undefined);
    if (procId) {
      squashCascade([{ entityType: 'procedure', entityId: procId, mode: 'edit' }]);
    }
  }, [squashCascade]);

  const handleNestedTaskSave = useCallback(
    (wrapper: LibraryRuntime.EditedTask): void => {
      const session = nestedTaskSession;
      const procWrapper = editingRef.current?.wrapper;
      const procId = editingRef.current?.id;
      if (!session || !procWrapper || !procId) {
        return;
      }

      const currentStep = procWrapper.current.steps.find((s) => s.order === session.stepOrder);
      const existingParams = currentStep
        ? 'taskId' in currentStep.task
          ? currentStep.task.params
          : currentStep.task.params
        : {};

      if (session.mode === 'inline') {
        if (currentStep) {
          procWrapper.updateStep(session.stepOrder, {
            task: {
              task: wrapper.current,
              params: { ...existingParams }
            }
          });
        } else {
          procWrapper.addStep({
            task: {
              task: wrapper.current,
              params: {}
            }
          });
        }
      } else {
        if (!mutableTaskCollectionId) {
          workspace.data.logger.error('Cannot save nested library task: no mutable task collection');
          return;
        }

        const baseId = wrapper.current.baseId as BaseTaskId;
        const compositeTaskId = `${mutableTaskCollectionId}.${baseId}` as TaskId;
        const colResult = workspace.data.entities.tasks.collections.get(mutableTaskCollectionId);
        if (colResult.isFailure() || !colResult.value.isMutable) {
          workspace.data.logger.error('Cannot save nested library task: mutable collection not available');
          return;
        }

        colResult.value.items.set(baseId, wrapper.current);

        const editableResult =
          workspace.data.entities.getEditableTasksEntityCollection(mutableTaskCollectionId);
        if (editableResult.isSuccess()) {
          editableResult.value.set(baseId, wrapper.current);
          if (editableResult.value.canSave()) {
            editableResult.value.save();
          }
        }

        if (currentStep) {
          procWrapper.updateStep(session.stepOrder, {
            task: { taskId: compositeTaskId, params: { ...existingParams } }
          });
        } else {
          procWrapper.addStep({
            task: {
              taskId: compositeTaskId,
              params: {}
            }
          });
        }
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      setPreviewVersion((v) => v + 1);
      setEditVersion((v) => v + 1);
      setNestedTaskSession(undefined);
      squashCascade([{ entityType: 'procedure', entityId: procId, mode: 'edit' }]);
    },
    [nestedTaskSession, mutableTaskCollectionId, workspace, reactiveWorkspace, squashCascade]
  );

  const handleNestedTaskPreview = useCallback(
    (entityId: string): void => {
      const withoutPreview = cascadeStack.filter(
        (e) => !(e.entityType === 'task' && e.entityId === entityId && e.mode === 'preview')
      );
      squashCascade([...withoutPreview, { entityType: 'task', entityId, mode: 'preview' }]);
    },
    [cascadeStack, squashCascade]
  );

  const handleCloseNestedTaskPreview = useCallback(
    (entityId: string): void => {
      squashCascade(
        cascadeStack.filter(
          (e) => !(e.entityType === 'task' && e.entityId === entityId && e.mode === 'preview')
        )
      );
    },
    [cascadeStack, squashCascade]
  );

  const handleNestedTaskConvertMode = useCallback(
    (targetMode: 'inline' | 'library'): void => {
      const session = nestedTaskSession;
      const procWrapper = editingRef.current?.wrapper;
      const procId = editingRef.current?.id;
      if (!session || !procWrapper || !procId) {
        return;
      }

      const currentStep = procWrapper.current.steps.find((s) => s.order === session.stepOrder);
      const existingParams = currentStep
        ? 'taskId' in currentStep.task
          ? currentStep.task.params
          : currentStep.task.params
        : {};

      if (targetMode === 'library') {
        // Convert inline → library
        if (!mutableTaskCollectionId) {
          workspace.data.logger.error('Cannot convert to library task: no mutable task collection');
          return;
        }

        const baseId = session.wrapper.current.baseId as BaseTaskId;
        const compositeTaskId = `${mutableTaskCollectionId}.${baseId}` as TaskId;
        const colResult = workspace.data.entities.tasks.collections.get(mutableTaskCollectionId);
        if (colResult.isFailure() || !colResult.value.isMutable) {
          workspace.data.logger.error('Cannot convert to library task: mutable collection not available');
          return;
        }

        // Save to library collection
        colResult.value.items.set(baseId, session.wrapper.current);

        const editableResult =
          workspace.data.entities.getEditableTasksEntityCollection(mutableTaskCollectionId);
        if (editableResult.isSuccess()) {
          editableResult.value.set(baseId, session.wrapper.current);
          if (editableResult.value.canSave()) {
            editableResult.value.save();
          }
        }

        // Update step to reference library task
        procWrapper.updateStep(session.stepOrder, {
          task: { taskId: compositeTaskId, params: { ...existingParams } }
        });

        // Update session mode
        setNestedTaskSession({ ...session, mode: 'library' });
      } else {
        // Convert library → inline
        // Copy task definition into step as inline
        procWrapper.updateStep(session.stepOrder, {
          task: { task: session.wrapper.current, params: { ...existingParams } }
        });

        // Update session mode
        setNestedTaskSession({ ...session, mode: 'inline' });
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      setEditVersion((v) => v + 1);
      setPreviewVersion((v) => v + 1);
    },
    [nestedTaskSession, mutableTaskCollectionId, workspace, reactiveWorkspace]
  );

  const handleEditStepParams = useCallback(
    (procedureId: string, stepOrder: number): void => {
      setStepParamsSession({ procedureId, stepOrder });
      const withoutPreviewOrStepParams = cascadeStack.filter(
        (e) => e.mode !== 'preview' && e.entityType !== 'step-params'
      );
      squashCascade([
        ...withoutPreviewOrStepParams,
        { entityType: 'step-params', entityId: `${procedureId}:${stepOrder}`, mode: 'edit' }
      ]);
    },
    [cascadeStack, squashCascade]
  );

  const handleSaveStepParams = useCallback(
    (params: Record<string, unknown>): void => {
      const session = stepParamsSession;
      const procWrapper = editingRef.current?.wrapper;
      if (!session || !procWrapper) {
        return;
      }

      const step = procWrapper.current.steps.find((s) => s.order === session.stepOrder);
      if (!step) {
        return;
      }

      procWrapper.updateStep(session.stepOrder, {
        task: 'taskId' in step.task ? { taskId: step.task.taskId, params } : { task: step.task.task, params }
      });

      setStepParamsSession(undefined);
      setEditVersion((v) => v + 1);
      setPreviewVersion((v) => v + 1);
      squashCascade([{ entityType: 'procedure', entityId: session.procedureId, mode: 'edit' }]);
    },
    [stepParamsSession, squashCascade]
  );

  const handleCancelStepParams = useCallback((): void => {
    if (!stepParamsSession) {
      return;
    }
    setStepParamsSession(undefined);
    squashCascade([{ entityType: 'procedure', entityId: stepParamsSession.procedureId, mode: 'edit' }]);
  }, [stepParamsSession, squashCascade]);

  const handleCreateProcedure = useCallback((): void => {
    const trimmed = newProcedureName.trim();
    if (!trimmed || !mutableProcedureCollectionId) {
      return;
    }
    const baseId = slugify(trimmed) as BaseProcedureId;
    const entity = createBlankRawProcedureEntity(baseId, trimmed);
    const compositeId = `${mutableProcedureCollectionId}.${baseId}` as ProcedureId;

    const colResult = workspace.data.entities.procedures.collections.get(mutableProcedureCollectionId);
    if (colResult.isFailure() || !colResult.value.isMutable) {
      workspace.data.logger.error('Cannot create procedure: mutable collection not available');
      return;
    }
    colResult.value.items.set(baseId, entity);

    const wrapperResult = LibraryRuntime.EditedProcedure.create(entity);
    if (wrapperResult.isFailure()) {
      workspace.data.logger.error(`Failed to create procedure wrapper: ${wrapperResult.message}`);
      return;
    }
    editingRef.current = { id: compositeId, wrapper: wrapperResult.value };
    workspace.data.clearCache();
    reactiveWorkspace.notifyChange();
    setNewProcedureName('');
    squashCascade([{ entityType: 'procedure', entityId: compositeId, mode: 'edit' }]);
  }, [newProcedureName, mutableProcedureCollectionId, workspace, reactiveWorkspace, squashCascade]);

  const handleCreateProcedureCancel = useCallback((): void => {
    setNewProcedureName('');
    squashCascade([]);
  }, [squashCascade]);

  // Depth-aware squash: keep stack up to and including the pane at `depth`, then append the new entry.
  const squashAt = useCallback(
    (depth: number, entry: ICascadeEntry): void => {
      squashCascade([...cascadeStack.slice(0, depth + 1), entry]);
    },
    [squashCascade, cascadeStack]
  );

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, index) => {
      const onTaskClick = (id: TaskId): void => {
        squashAt(index, { entityType: 'task', entityId: id, mode: 'view' });
      };

      if (entry.entityType === 'procedure' && entry.mode === 'create') {
        return {
          key: '__new__procedure',
          label: 'New Procedure',
          content: (
            <div className="p-4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">New Procedure</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Tempering"
                  value={newProcedureName}
                  onChange={(e): void => setNewProcedureName(e.target.value)}
                  onKeyDown={(e): void => {
                    if (e.key === 'Enter') {
                      handleCreateProcedure();
                    }
                    if (e.key === 'Escape') {
                      handleCreateProcedureCancel();
                    }
                  }}
                  autoFocus
                />
                {newProcedureName.trim() && (
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    ID: {slugify(newProcedureName.trim())}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateProcedure}
                  disabled={!newProcedureName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={handleCreateProcedureCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )
        };
      }

      if (entry.entityType === 'procedure') {
        const result = workspace.data.procedures.get(entry.entityId as ProcedureId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load procedure: {entry.entityId}</div>
          };
        }

        if (entry.mode === 'preview') {
          const draftEntity =
            editingRef.current?.id === entry.entityId ? editingRef.current.wrapper.current : undefined;
          return {
            key: `${entry.entityId}:preview`,
            label: `${result.value.name} (preview)`,
            content: (
              <ProcedurePreviewPanel
                procedure={result.value}
                draftEntity={draftEntity}
                availableTasks={availableTasks}
                onClose={(): void => handleCloseProcedurePreview(entry.entityId)}
              />
            )
          };
        }

        if (entry.mode === 'edit') {
          const wrapper = getOrCreateWrapper(result.value);
          if (wrapper === undefined) {
            return {
              key: entry.entityId,
              label: result.value.name,
              content: <div className="p-4 text-red-500">Failed to create editing wrapper</div>
            };
          }

          const collectionId = entry.entityId.split('.')[0] as CollectionId;
          const collectionEntry = workspace.data.entities.procedures.collections.get(collectionId);
          const isReadOnly = collectionEntry.isSuccess() && !collectionEntry.value.isMutable;

          return {
            key: `${entry.entityId}:edit`,
            label: `${result.value.name} (editing)`,
            content: (
              <ProcedureEditView
                wrapper={wrapper}
                availableTasks={availableTasks}
                onSave={handleSaveProcedure}
                onSaveAs={isReadOnly ? handleSaveProcedureAs : undefined}
                onCancel={(): void => handleCancelProcedureEdit(entry.entityId)}
                readOnly={isReadOnly}
                onPreview={(): void => handlePreviewProcedure(entry.entityId)}
                onMutate={(): void => setPreviewVersion((v) => v + 1)}
                onEditStepTask={handleOpenStepTaskEditor}
                onEditStepParams={(stepOrder): void => handleEditStepParams(entry.entityId, stepOrder)}
              />
            )
          };
        }

        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <ProcedureDetail
              procedure={result.value}
              onTaskClick={onTaskClick}
              onEdit={(): void => handleEditProcedure(entry.entityId)}
              onPreview={(): void => handlePreviewProcedure(entry.entityId)}
            />
          )
        };
      }

      if (entry.entityType === 'step-params') {
        const session = stepParamsSession;
        if (!session) {
          return {
            key: entry.entityId,
            label: 'Step Parameters',
            content: <div className="p-4 text-red-500">No step parameter session</div>
          };
        }

        const procWrapper = editingRef.current?.wrapper;
        if (!procWrapper) {
          return {
            key: entry.entityId,
            label: 'Step Parameters',
            content: <div className="p-4 text-red-500">No procedure wrapper</div>
          };
        }

        const step = procWrapper.current.steps.find((s) => s.order === session.stepOrder);
        if (!step) {
          return {
            key: entry.entityId,
            label: 'Step Parameters',
            content: <div className="p-4 text-red-500">Step not found</div>
          };
        }

        let template: string;
        let taskName: string;
        let params: Record<string, unknown>;
        let defaults: Readonly<Record<string, unknown>> | undefined;

        const taskInvocation = step.task;
        if ('taskId' in taskInvocation) {
          const task = availableTasks.find((t) => t.id === taskInvocation.taskId);
          if (!task) {
            return {
              key: entry.entityId,
              label: 'Step Parameters',
              content: <div className="p-4 text-red-500">Task not found</div>
            };
          }
          template = task.template;
          taskName = task.name;
          params = taskInvocation.params;
          defaults = task.defaults;
        } else {
          const inlineTask = taskInvocation.task;
          template = inlineTask.template;
          taskName = inlineTask.name;
          params = taskInvocation.params;
          defaults = inlineTask.defaults;
        }

        return {
          key: entry.entityId,
          label: `Step ${session.stepOrder} Parameters`,
          content: (
            <StepParameterEditor
              template={template}
              taskName={taskName}
              stepOrder={session.stepOrder}
              params={params}
              defaults={defaults}
              onSave={handleSaveStepParams}
              onCancel={handleCancelStepParams}
            />
          )
        };
      }

      if (entry.entityType === 'task') {
        if (nestedTaskSession && entry.entityId === nestedTaskSession.taskEntityId) {
          if (entry.mode === 'preview') {
            return {
              key: `${entry.entityId}:preview`,
              label: `${nestedTaskSession.wrapper.current.name} (preview)`,
              content: (
                <TaskPreviewPanel
                  template={nestedTaskSession.wrapper.current.template}
                  defaults={nestedTaskSession.wrapper.current.defaults}
                  taskName={nestedTaskSession.wrapper.current.name}
                  onClose={(): void => handleCloseNestedTaskPreview(entry.entityId)}
                />
              )
            };
          }

          return {
            key: `${entry.entityId}:edit`,
            label: `${nestedTaskSession.wrapper.current.name} (editing)`,
            content: (
              <TaskEditView
                wrapper={nestedTaskSession.wrapper}
                onSave={handleNestedTaskSave}
                onCancel={handleNestedTaskCancel}
                onPreview={(): void => handleNestedTaskPreview(entry.entityId)}
                onMutate={(): void => setTaskPreviewVersion((v) => v + 1)}
                isStepContext={true}
                currentMode={nestedTaskSession.mode}
                onConvertMode={handleNestedTaskConvertMode}
              />
            )
          };
        }

        const result = workspace.data.tasks.get(entry.entityId as TaskId);
        if (result.isFailure()) {
          // Task not in library — check if it's an inline task from a parent procedure's steps
          const parentProcEntry = cascadeStack
            .slice(0, index)
            .reverse()
            .find((e) => e.entityType === 'procedure');
          if (parentProcEntry) {
            const proc = workspace.data.procedures.get(parentProcEntry.entityId as ProcedureId);
            const steps = proc.isSuccess() ? proc.value.getSteps() : undefined;
            const inlineStep = steps?.isSuccess()
              ? steps.value.find((s) => s.isInline && s.resolvedTask.id === entry.entityId)
              : undefined;
            if (inlineStep) {
              return {
                key: entry.entityId,
                label: `${inlineStep.resolvedTask.name} (inline)`,
                content: <TaskDetail task={inlineStep.resolvedTask} />
              };
            }
          }
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load task: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: <TaskDetail task={result.value} />
        };
      }
      return {
        key: entry.entityId,
        label: entry.entityId,
        content: <div className="p-4 text-gray-500">Unknown entity type: {entry.entityType}</div>
      };
    });
  }, [
    cascadeStack,
    workspace,
    squashAt,
    newProcedureName,
    availableTasks,
    getOrCreateWrapper,
    handleSaveProcedure,
    handleSaveProcedureAs,
    handleCancelProcedureEdit,
    handleEditProcedure,
    handlePreviewProcedure,
    handleCloseProcedurePreview,
    handleCreateProcedure,
    handleCreateProcedureCancel,
    handleOpenStepTaskEditor,
    handleNestedTaskSave,
    handleNestedTaskCancel,
    handleNestedTaskPreview,
    handleCloseNestedTaskPreview,
    nestedTaskSession,
    stepParamsSession,
    handleEditStepParams,
    handleSaveStepParams,
    handleCancelStepParams,
    previewVersion,
    taskPreviewVersion,
    editVersion
  ]);

  const comparisonColumns = useMemo<ReadonlyArray<IComparisonColumn>>(() => {
    return Array.from(compareIds).map((id) => {
      const result = workspace.data.procedures.get(id as ProcedureId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return {
        key: id,
        label: result.value.name,
        content: <ProcedureDetail procedure={result.value} />
      };
    });
  }, [compareIds, workspace]);

  return (
    <EntityTabLayout
      list={
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
            <button
              onClick={(): void =>
                squashCascade([{ entityType: 'procedure', entityId: '__new__', mode: 'create' }])
              }
              disabled={mutableProcedureCollectionId === undefined}
              title={
                mutableProcedureCollectionId === undefined
                  ? 'No mutable procedure collection available'
                  : undefined
              }
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + New Procedure
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <EntityList<LibraryRuntime.IProcedure, ProcedureId>
              entities={useFilteredEntities(procedures, PROCEDURE_FILTER_SPEC)}
              descriptor={PROCEDURE_DESCRIPTOR}
              selectedId={selectedId}
              onSelect={handleSelect}
              onDrill={collapseList}
              compareMode={compareMode}
              checkedIds={compareIds}
              onCheckedChange={toggleCompareId}
              onToggleCompare={toggleCompareMode}
              compareCount={compareIds.size}
              onStartComparison={startComparison}
              emptyState={{
                title: 'No Procedures',
                description: 'No procedures found in the library.'
              }}
            />
          </div>
        </div>
      }
      cascadeColumns={cascadeColumns}
      onPopTo={popCascadeTo}
      listCollapsed={listCollapsed}
      onListCollapse={collapseList}
      compareMode={compareMode}
      comparisonColumns={comparisonColumns}
      showingComparison={showingComparison}
      onExitComparison={exitComparison}
    />
  );
}

// ============================================================================
// Confections Tab Content
// ============================================================================

function ConfectionsTabContent(): React.ReactElement {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const squashCascade = useNavigationStore((s) => s.squashCascade);
  const popCascadeTo = useNavigationStore((s) => s.popCascadeTo);
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);
  const listCollapsed = useNavigationStore((s) => s.listCollapsed);
  const collapseList = useNavigationStore((s) => s.collapseList);
  const compareMode = useNavigationStore((s) => s.compareMode);
  const compareIds = useNavigationStore((s) => s.compareIds);
  const toggleCompareMode = useNavigationStore((s) => s.toggleCompareMode);
  const toggleCompareId = useNavigationStore((s) => s.toggleCompareId);
  const showingComparison = useNavigationStore((s) => s.showingComparison);
  const startComparison = useNavigationStore((s) => s.startComparison);
  const exitComparison = useNavigationStore((s) => s.exitComparison);
  const [variationCompare, setVariationCompare] = useState<
    { id: ConfectionId; specs: ReadonlyArray<string> } | undefined
  >(undefined);

  const confections = useMemo<ReadonlyArray<LibraryRuntime.AnyConfectionRecipe>>(() => {
    return Array.from(workspace.data.confections.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const selectedId =
    cascadeStack.length > 0 && cascadeStack[0].entityType === 'confection'
      ? (cascadeStack[0].entityId as ConfectionId)
      : undefined;

  const handleSelect = useCallback(
    (id: ConfectionId): void => {
      const entry: ICascadeEntry = { entityType: 'confection', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  // Depth-aware squash: keep stack up to and including the pane at `depth`, then append the new entry.
  const squashAt = useCallback(
    (depth: number, entry: ICascadeEntry): void => {
      squashCascade([...cascadeStack.slice(0, depth + 1), entry]);
    },
    [squashCascade, cascadeStack]
  );

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, index) => {
      // Per-pane drill-down callbacks that squash to the right of this pane
      const onIngredientClick = (id: IngredientId): void => {
        squashAt(index, { entityType: 'ingredient', entityId: id, mode: 'view' });
      };
      const onFillingClick = (id: FillingId): void => {
        squashAt(index, { entityType: 'filling', entityId: id, mode: 'view' });
      };
      const onMoldClick = (id: MoldId): void => {
        squashAt(index, { entityType: 'mold', entityId: id, mode: 'view' });
      };
      const onProcedureClick = (id: ProcedureId): void => {
        squashAt(index, { entityType: 'procedure', entityId: id, mode: 'view' });
      };
      const onDecorationClick = (id: DecorationId): void => {
        squashAt(index, { entityType: 'decoration', entityId: id, mode: 'view' });
      };
      const onTaskClick = (id: TaskId): void => {
        squashAt(index, { entityType: 'task', entityId: id, mode: 'view' });
      };

      if (entry.entityType === 'confection') {
        const result = workspace.data.confections.get(entry.entityId as ConfectionId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load confection: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <ConfectionDetail
              confection={result.value}
              onFillingClick={onFillingClick}
              onIngredientClick={onIngredientClick}
              onMoldClick={onMoldClick}
              onProcedureClick={onProcedureClick}
              onDecorationClick={onDecorationClick}
              onCompareVariations={(specs): void =>
                setVariationCompare({ id: entry.entityId as ConfectionId, specs })
              }
            />
          )
        };
      }
      if (entry.entityType === 'filling') {
        const result = workspace.data.fillings.get(entry.entityId as FillingId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load filling: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <FillingDetail
              filling={result.value}
              onIngredientClick={onIngredientClick}
              onProcedureClick={onProcedureClick}
            />
          )
        };
      }
      if (entry.entityType === 'ingredient') {
        const result = workspace.data.ingredients.get(entry.entityId as IngredientId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load ingredient: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: <IngredientDetail ingredient={result.value} />
        };
      }
      if (entry.entityType === 'mold') {
        const result = workspace.data.molds.get(entry.entityId as MoldId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load mold: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.displayName,
          content: <MoldDetail mold={result.value} />
        };
      }
      if (entry.entityType === 'decoration') {
        const result = workspace.data.decorations.get(entry.entityId as DecorationId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load decoration: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <DecorationDetail
              decoration={result.value}
              onIngredientClick={onIngredientClick}
              onProcedureClick={onProcedureClick}
            />
          )
        };
      }
      if (entry.entityType === 'procedure') {
        const result = workspace.data.procedures.get(entry.entityId as ProcedureId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load procedure: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: <ProcedureDetail procedure={result.value} onTaskClick={onTaskClick} />
        };
      }
      if (entry.entityType === 'task') {
        const result = workspace.data.tasks.get(entry.entityId as TaskId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load task: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: <TaskDetail task={result.value} />
        };
      }
      return {
        key: entry.entityId,
        label: entry.entityId,
        content: <div className="p-4 text-gray-500">Unknown entity type: {entry.entityType}</div>
      };
    });
  }, [cascadeStack, workspace, squashAt]);

  const comparisonColumns = useMemo<ReadonlyArray<IComparisonColumn>>(() => {
    return Array.from(compareIds).map((id) => {
      const result = workspace.data.confections.get(id as ConfectionId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return { key: id, label: result.value.name, content: <ConfectionDetail confection={result.value} /> };
    });
  }, [compareIds, workspace]);

  const variationCompareColumns = useMemo<ReadonlyArray<IComparisonColumn> | undefined>(() => {
    if (variationCompare === undefined) {
      return undefined;
    }
    const result = workspace.data.confections.get(variationCompare.id);
    if (result.isFailure()) {
      return undefined;
    }
    const confection = result.value;
    const specsSet = new Set(variationCompare.specs);
    return confection.variations
      .filter((v) => specsSet.has(v.variationSpec))
      .map((v) => ({
        key: v.variationSpec,
        label: `${confection.name} — ${v.variationSpec}${
          v.variationSpec === confection.goldenVariationSpec ? ' ★' : ''
        }`,
        content: <ConfectionDetail confection={confection} defaultVariationSpec={v.variationSpec} />
      }));
  }, [variationCompare, workspace]);

  return (
    <EntityTabLayout
      list={
        <EntityList<LibraryRuntime.IConfectionBase, ConfectionId>
          entities={useFilteredEntities(confections, CONFECTION_FILTER_SPEC)}
          descriptor={CONFECTION_DESCRIPTOR}
          selectedId={selectedId}
          onSelect={handleSelect}
          onDrill={collapseList}
          compareMode={compareMode}
          checkedIds={compareIds}
          onCheckedChange={toggleCompareId}
          onToggleCompare={toggleCompareMode}
          compareCount={compareIds.size}
          onStartComparison={startComparison}
          emptyState={{
            title: 'No Confections',
            description: 'No confections found in the library.'
          }}
        />
      }
      cascadeColumns={cascadeColumns}
      onPopTo={popCascadeTo}
      listCollapsed={listCollapsed}
      onListCollapse={collapseList}
      compareMode={compareMode}
      comparisonColumns={comparisonColumns}
      showingComparison={showingComparison}
      onExitComparison={exitComparison}
      variationCompareColumns={variationCompareColumns}
      onExitVariationCompare={(): void => setVariationCompare(undefined)}
    />
  );
}

// ============================================================================
// Decorations Tab Content
// ============================================================================

function DecorationsTabContent(): React.ReactElement {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const squashCascade = useNavigationStore((s) => s.squashCascade);
  const popCascadeTo = useNavigationStore((s) => s.popCascadeTo);
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);
  const listCollapsed = useNavigationStore((s) => s.listCollapsed);
  const collapseList = useNavigationStore((s) => s.collapseList);
  const compareMode = useNavigationStore((s) => s.compareMode);
  const compareIds = useNavigationStore((s) => s.compareIds);
  const toggleCompareMode = useNavigationStore((s) => s.toggleCompareMode);
  const toggleCompareId = useNavigationStore((s) => s.toggleCompareId);
  const showingComparison = useNavigationStore((s) => s.showingComparison);
  const startComparison = useNavigationStore((s) => s.startComparison);
  const exitComparison = useNavigationStore((s) => s.exitComparison);

  const editingRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedDecoration } | undefined>(undefined);
  const [editVersion, setEditVersion] = useState(0);

  const decorations = useMemo<ReadonlyArray<LibraryRuntime.IDecoration>>(() => {
    return Array.from(workspace.data.decorations.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const availableIngredients = useMemo<ReadonlyArray<LibraryRuntime.AnyIngredient>>(() => {
    return Array.from(workspace.data.ingredients.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const availableProcedures = useMemo<ReadonlyArray<LibraryRuntime.IProcedure>>(() => {
    return Array.from(workspace.data.procedures.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const selectedId =
    cascadeStack.length > 0 && cascadeStack[0].entityType === 'decoration'
      ? (cascadeStack[0].entityId as DecorationId)
      : undefined;

  const handleSelect = useCallback(
    (id: DecorationId): void => {
      const entry: ICascadeEntry = { entityType: 'decoration', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  // Depth-aware squash: keep stack up to and including the pane at `depth`, then append the new entry.
  const squashAt = useCallback(
    (depth: number, entry: ICascadeEntry): void => {
      squashCascade([...cascadeStack.slice(0, depth + 1), entry]);
    },
    [squashCascade, cascadeStack]
  );

  const getOrCreateWrapper = useCallback(
    (decoration: LibraryRuntime.IDecoration): LibraryRuntime.EditedDecoration | undefined => {
      const id = decoration.id;
      if (editingRef.current?.id === id) {
        return editingRef.current.wrapper;
      }
      const result = LibraryRuntime.EditedDecoration.create(decoration.entity);
      if (result.isFailure()) {
        return undefined;
      }
      editingRef.current = { id, wrapper: result.value };
      return result.value;
    },
    []
  );

  const handleEditDecoration = useCallback(
    (entityId: string): void => {
      const idx = cascadeStack.findIndex((e) => e.entityId === entityId && e.entityType === 'decoration');
      if (idx < 0) return;
      squashCascade([...cascadeStack.slice(0, idx), { ...cascadeStack[idx], mode: 'edit' as const }]);
    },
    [cascadeStack, squashCascade]
  );

  const handleCancelDecorationEdit = useCallback(
    (entityId: string): void => {
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'decoration' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  const handleSaveDecorationAs = useCallback(
    (wrapper: LibraryRuntime.EditedDecoration): void => {
      workspace.data.logger.info(
        `Save to... requested for decoration '${wrapper.current.name}' — collection picker not yet implemented`
      );
    },
    [workspace]
  );

  const handleSaveDecoration = useCallback(
    (wrapper: LibraryRuntime.EditedDecoration): void => {
      const entity = wrapper.current;
      const compositeId = editingRef.current?.id;
      if (!compositeId) {
        workspace.data.logger.error('Save failed: no composite ID for decoration editing wrapper');
        return;
      }

      const validationResult = Editing.Decorations.Validators.validateDecorationEntity(entity);
      if (validationResult.isFailure()) {
        workspace.data.logger.error(`Save failed: ${validationResult.message}`);
        return;
      }

      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseDecorationId;

      const collectionEntry = workspace.data.entities.decorations.collections.get(collectionId);
      if (collectionEntry.isFailure()) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' not found`);
        return;
      }
      if (!collectionEntry.value.isMutable) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' is immutable`);
        return;
      }

      const inMemoryResult = collectionEntry.value.items.set(baseId, entity);
      if (inMemoryResult.isFailure()) {
        workspace.data.logger.error(`Save failed (in-memory): ${inMemoryResult.message}`);
        return;
      }

      const editableResult = workspace.data.entities.getEditableDecorationsEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const saveResult = editable.save();
          if (saveResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed: ${saveResult.message}`);
          }
        }
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      if (editingRef.current?.id === compositeId) {
        editingRef.current = undefined;
      }
      const updated = cascadeStack.map((e) =>
        e.entityId === compositeId && e.entityType === 'decoration' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, index) => {
      const onIngredientClick = (id: IngredientId): void => {
        squashAt(index, { entityType: 'ingredient', entityId: id, mode: 'view' });
      };
      const onProcedureClick = (id: ProcedureId): void => {
        squashAt(index, { entityType: 'procedure', entityId: id, mode: 'view' });
      };

      if (entry.entityType === 'decoration') {
        const result = workspace.data.decorations.get(entry.entityId as DecorationId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load decoration: {entry.entityId}</div>
          };
        }

        if (entry.mode === 'edit') {
          const wrapper = getOrCreateWrapper(result.value);
          if (!wrapper) {
            return {
              key: entry.entityId,
              label: result.value.name,
              content: <div className="p-4 text-red-500">Failed to create editing wrapper</div>
            };
          }
          return {
            key: `${entry.entityId}-edit-${editVersion}`,
            label: `Editing: ${result.value.name}`,
            content: (
              <DecorationEditView
                wrapper={wrapper}
                availableIngredients={availableIngredients}
                availableProcedures={availableProcedures}
                onSave={handleSaveDecoration}
                onSaveAs={handleSaveDecorationAs}
                onCancel={(): void => handleCancelDecorationEdit(entry.entityId)}
                onMutate={(): void => setEditVersion((v) => v + 1)}
              />
            )
          };
        }

        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <DecorationDetail
              decoration={result.value}
              onIngredientClick={onIngredientClick}
              onProcedureClick={onProcedureClick}
              onEdit={(): void => handleEditDecoration(entry.entityId)}
            />
          )
        };
      }
      if (entry.entityType === 'ingredient') {
        const result = workspace.data.ingredients.get(entry.entityId as IngredientId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load ingredient: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: <IngredientDetail ingredient={result.value} />
        };
      }
      if (entry.entityType === 'procedure') {
        const result = workspace.data.procedures.get(entry.entityId as ProcedureId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load procedure: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: <ProcedureDetail procedure={result.value} />
        };
      }
      return {
        key: entry.entityId,
        label: entry.entityId,
        content: <div className="p-4 text-gray-500">Unknown entity type: {entry.entityType}</div>
      };
    });
  }, [
    cascadeStack,
    workspace,
    squashAt,
    editVersion,
    availableIngredients,
    availableProcedures,
    getOrCreateWrapper,
    handleEditDecoration,
    handleCancelDecorationEdit,
    handleSaveDecoration,
    handleSaveDecorationAs
  ]);

  const comparisonColumns = useMemo<ReadonlyArray<IComparisonColumn>>(() => {
    return Array.from(compareIds).map((id) => {
      const result = workspace.data.decorations.get(id as DecorationId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return { key: id, label: result.value.name, content: <DecorationDetail decoration={result.value} /> };
    });
  }, [compareIds, workspace]);

  return (
    <EntityTabLayout
      list={
        <EntityList<LibraryRuntime.IDecoration, DecorationId>
          entities={useFilteredEntities(decorations, DECORATION_FILTER_SPEC)}
          descriptor={DECORATION_DESCRIPTOR}
          selectedId={selectedId}
          onSelect={handleSelect}
          onDrill={collapseList}
          compareMode={compareMode}
          checkedIds={compareIds}
          onCheckedChange={toggleCompareId}
          onToggleCompare={toggleCompareMode}
          compareCount={compareIds.size}
          onStartComparison={startComparison}
          emptyState={{
            title: 'No Decorations',
            description: 'No decorations found in the library.'
          }}
        />
      }
      cascadeColumns={cascadeColumns}
      onPopTo={popCascadeTo}
      listCollapsed={listCollapsed}
      onListCollapse={collapseList}
      compareMode={compareMode}
      comparisonColumns={comparisonColumns}
      showingComparison={showingComparison}
      onExitComparison={exitComparison}
    />
  );
}

// ============================================================================
// Empty Tab Content (for tabs not yet implemented)
// ============================================================================

const TAB_DESCRIPTIONS: Record<AppTab, string> = {
  sessions: 'Manage production sessions — plan, execute, and track your chocolate-making runs.',
  journal: 'View journal entries and production history.',
  'ingredient-inventory': 'Track your ingredient stock levels and locations.',
  'mold-inventory': 'Manage your mold collection and availability.',
  ingredients: 'Browse and manage chocolate ingredients with ganache characteristics.',
  fillings: 'Create and refine filling recipes with variation tracking.',
  confections: 'Design confection recipes combining fillings, molds, and chocolates.',
  decorations: 'Browse decoration techniques with ingredients, procedures, and ratings.',
  molds: 'Catalog your mold collection with cavity specifications.',
  tasks: 'Define reusable tasks for production procedures.',
  procedures: 'Build step-by-step procedures from task sequences.'
};

function TabPlaceholder({ tab }: { readonly tab: AppTab }): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h2 className="text-2xl font-semibold text-choco-primary mb-3">{TAB_LABELS[tab]}</h2>
      <p className="text-gray-500 max-w-md">{TAB_DESCRIPTIONS[tab]}</p>
      <p className="text-gray-400 text-sm mt-6">Coming in a future phase.</p>
    </div>
  );
}

// ============================================================================
// Tab Content Router
// ============================================================================

function TabContent({ tab }: { readonly tab: AppTab }): React.ReactElement {
  switch (tab) {
    case 'ingredients':
      return <IngredientsTabContent />;
    case 'fillings':
      return <FillingsTabContent />;
    case 'molds':
      return <MoldsTabContent />;
    case 'tasks':
      return <TasksTabContent />;
    case 'procedures':
      return <ProceduresTabContent />;
    case 'confections':
      return <ConfectionsTabContent />;
    case 'decorations':
      return <DecorationsTabContent />;
    default:
      return <TabPlaceholder tab={tab} />;
  }
}

// ============================================================================
// Sidebar with Collection Actions
// ============================================================================

function TabSidebarWithActions(props: {
  readonly optionProvider: WorkspaceFilterOptionProvider;
}): React.ReactElement {
  const { addDirectory, createCollection, deleteCollection } = useCollectionActions();

  return (
    <TabSidebar
      optionProvider={props.optionProvider}
      onAddDirectory={addDirectory}
      onCreateCollection={createCollection}
      onDeleteCollection={deleteCollection}
    />
  );
}

// ============================================================================
// App Shell (inner, needs MessagesProvider)
// ============================================================================

function AppShell(): React.ReactElement {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const mode = useNavigationStore((s) => s.mode);
  const activeTab = useNavigationStore(selectActiveTab);
  const modeTabs = useNavigationStore(selectModeTabs);
  const setMode = useNavigationStore((s) => s.setMode);
  const setTab = useNavigationStore((s) => s.setTab);
  const popCascade = useNavigationStore((s) => s.popCascade);
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const { messages, activeToasts, dismissMessage, clearMessages } = useMessages();

  const filterOptionProvider = useMemo(
    () => new WorkspaceFilterOptionProvider(workspace.data),
    [workspace, reactiveWorkspace.version]
  );

  // Sync navigation state ↔ URL hash
  useUrlSync(URL_SYNC_CONFIG, { mode, activeTab }, { setMode, setTab });

  // Global keyboard shortcuts
  const shortcuts = useMemo<ReadonlyArray<IShortcut>>(
    () => [
      {
        binding: { key: 'Escape' },
        description: 'Close rightmost cascade column',
        handler: (): boolean => {
          if (cascadeStack.length > 0) {
            popCascade();
            return true;
          }
          return false;
        }
      }
    ],
    [cascadeStack.length, popCascade]
  );
  useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex flex-col h-screen bg-choco-surface">
      {/* Top bar: mode selector */}
      <ModeSelector<AppMode>
        title="Chocolate Lab"
        modes={MODES}
        activeMode={mode}
        onModeChange={setMode}
        rightContent={<SettingsButton onOpen={(): void => setSettingsOpen(true)} />}
      />

      {/* Second bar: tab selector */}
      <TabBar<AppTab> tabs={getTabConfigs(modeTabs)} activeTab={activeTab} onTabChange={setTab} />

      {/* Main content area: sidebar + tab content */}
      <SidebarLayout sidebar={<TabSidebarWithActions optionProvider={filterOptionProvider} />}>
        <TabContent tab={activeTab} />
      </SidebarLayout>

      {/* Toast notifications */}
      <ToastContainer toasts={activeToasts} onDismiss={dismissMessage} />

      {/* Status bar / log panel */}
      <StatusBar messages={messages} onClear={clearMessages} />

      {/* Settings modal */}
      <Modal isOpen={settingsOpen} onClose={(): void => setSettingsOpen(false)} title="Settings">
        <p className="text-gray-500">Settings content coming soon.</p>
      </Modal>
    </div>
  );
}

// ============================================================================
// Root App
// ============================================================================

/**
 * Root application component for Chocolate Lab Web Edition.
 */
function WorkspaceBootstrap({ children }: { readonly children: React.ReactNode }): React.ReactElement {
  const reporter = useLogReporter();
  const [reactiveWorkspace, setReactiveWorkspace] = useState<ReactiveWorkspace | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Connect the boot logger to the real logger so buffered messages
    // are replayed as toasts and all future log calls go through it.
    _bootLogger.ready(reporter.logger);
  }, [reporter]);

  useEffect(() => {
    getReactiveWorkspaceAsync()
      .then(setReactiveWorkspace)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  if (error) {
    return <div className="p-8 text-red-600">Failed to initialize workspace: {error}</div>;
  }

  if (!reactiveWorkspace) {
    return <div className="p-8 text-gray-500">Loading workspace…</div>;
  }

  return <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>{children}</WorkspaceProvider>;
}

export default function App(): React.ReactElement {
  return (
    <MessagesProvider>
      <WorkspaceBootstrap>
        <KeyboardShortcutProvider>
          <AppShell />
        </KeyboardShortcutProvider>
      </WorkspaceBootstrap>
    </MessagesProvider>
  );
}
