import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
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
import { createWorkspaceFromPlatform, Entities, LibraryRuntime, type Percentage } from '@fgv/ts-chocolate';
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
  TaskDetail,
  ProcedureDetail,
  ConfectionDetail,
  DecorationDetail,
  WorkspaceFilterOptionProvider,
  useFilteredEntities,
  useCollectionActions,
  initializeBrowserPlatform,
  type IEntityFilterSpec
} from '@fgv/chocolate-lab-ui';
import type {
  BaseIngredientId,
  CollectionId,
  IngredientId,
  FillingId,
  MoldId,
  TaskId,
  ProcedureId,
  ConfectionId,
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

function makeBlankIngredient(baseId: BaseIngredientId, name: string): Entities.Ingredients.IIngredientEntity {
  return {
    baseId,
    name,
    category: 'other',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 0 as Percentage,
      milkFat: 0 as Percentage,
      water: 0 as Percentage,
      solids: 0 as Percentage,
      otherFats: 0 as Percentage
    }
  };
}

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

  // "New Ingredient" dialog state
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientIdOverride, setNewIngredientIdOverride] = useState('');

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

  // Create a new ingredient from a name, add to mutable collection, and open in edit mode
  const handleCreateIngredient = useCallback(
    (name: string, idOverride?: string): void => {
      if (!mutableCollectionId) {
        workspace.data.logger.error('Cannot add ingredient: no mutable collection available');
        return;
      }

      const baseId = (idOverride?.trim() || slugify(name)) as BaseIngredientId;
      const compositeId = `${mutableCollectionId}.${baseId}` as IngredientId;

      // Check for duplicate
      const existing = workspace.data.ingredients.get(compositeId);
      if (existing.isSuccess()) {
        workspace.data.logger.error(`Ingredient '${compositeId}' already exists`);
        return;
      }

      const entity = makeBlankIngredient(baseId, name);

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

      const entry: ICascadeEntry = { entityType: 'ingredient', entityId: compositeId, mode: 'edit' };
      squashCascade([entry]);
    },
    [workspace, reactiveWorkspace, mutableCollectionId, squashCascade]
  );

  const handleNewDialogConfirm = useCallback((): void => {
    const trimmed = newIngredientName.trim();
    if (trimmed) {
      handleCreateIngredient(trimmed, newIngredientIdOverride || undefined);
    }
    setShowNewDialog(false);
    setNewIngredientName('');
    setNewIngredientIdOverride('');
  }, [newIngredientName, newIngredientIdOverride, handleCreateIngredient]);

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

  // Build cascade columns from the cascade stack
  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack
      .filter((e) => e.entityType === 'ingredient')
      .map((entry) => {
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
  }, [cascadeStack, workspace, getOrCreateWrapper, handleSave, handleCancelEdit, handleEdit]);

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
          <div className="px-3 py-2 border-b border-gray-200">
            <button
              onClick={(): void => setShowNewDialog(true)}
              disabled={mutableCollectionId === undefined}
              title={mutableCollectionId === undefined ? 'No mutable collection available' : undefined}
              className="w-full px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + New Ingredient
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
          {showNewDialog && (
            <Modal
              isOpen={showNewDialog}
              title="New Ingredient"
              onClose={(): void => {
                setShowNewDialog(false);
                setNewIngredientName('');
                setNewIngredientIdOverride('');
              }}
            >
              <div className="flex flex-col gap-3 p-4">
                <label className="text-sm font-medium text-gray-700">Ingredient Name</label>
                <input
                  type="text"
                  value={newIngredientName}
                  onChange={(e): void => setNewIngredientName(e.target.value)}
                  onKeyDown={(e): void => {
                    if (e.key === 'Enter') handleNewDialogConfirm();
                  }}
                  placeholder="e.g. Callebaut 811 Dark"
                  className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
                  autoFocus
                />
                {newIngredientName.trim() && (
                  <>
                    <label className="text-sm font-medium text-gray-700">ID</label>
                    <input
                      type="text"
                      value={newIngredientIdOverride}
                      onChange={(e): void => setNewIngredientIdOverride(e.target.value)}
                      onKeyDown={(e): void => {
                        if (e.key === 'Enter') handleNewDialogConfirm();
                      }}
                      placeholder={slugify(newIngredientName.trim())}
                      className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary font-mono"
                    />
                  </>
                )}
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={(): void => {
                      setShowNewDialog(false);
                      setNewIngredientName('');
                      setNewIngredientIdOverride('');
                    }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNewDialogConfirm}
                    disabled={!newIngredientName.trim()}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </Modal>
          )}
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

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry) => {
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
      return {
        key: entry.entityId,
        label: entry.entityId,
        content: <div className="p-4 text-gray-500">Unknown entity type: {entry.entityType}</div>
      };
    });
  }, [cascadeStack, workspace]);

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

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry) => {
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
  }, [cascadeStack, workspace]);

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

  const procedures = useMemo<ReadonlyArray<LibraryRuntime.IProcedure>>(() => {
    return Array.from(workspace.data.procedures.values()).sort((a, b) => a.name.localeCompare(b.name));
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

  const decorations = useMemo<ReadonlyArray<LibraryRuntime.IDecoration>>(() => {
    return Array.from(workspace.data.decorations.values()).sort((a, b) => a.name.localeCompare(b.name));
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
  }, [cascadeStack, workspace, squashAt]);

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
