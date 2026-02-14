import React, { useCallback, useMemo, useState } from 'react';
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
import type { Logging } from '@fgv/ts-utils';
import { Workspace, type LibraryRuntime } from '@fgv/ts-chocolate';
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
  IngredientDetail,
  FillingDetail,
  MoldDetail,
  TaskDetail,
  ProcedureDetail,
  ConfectionDetail,
  WorkspaceFilterOptionProvider,
  useFilteredEntities,
  type IEntityFilterSpec
} from '@fgv/chocolate-lab-ui';
import type { IngredientId, FillingId, MoldId, TaskId, ProcedureId, ConfectionId } from '@fgv/ts-chocolate';

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

let _reactiveWorkspace: ReactiveWorkspace | undefined;

function getReactiveWorkspace(logger?: Logging.LogReporter<unknown>): ReactiveWorkspace {
  if (!_reactiveWorkspace) {
    _reactiveWorkspace = new ReactiveWorkspace(Workspace.create({ preWarm: true, logger }).orThrow());
  }
  return _reactiveWorkspace;
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

// ============================================================================
// Filter Specs (how to extract filterable properties from each entity type)
// ============================================================================

function collectionFromId(id: string): string {
  return id.split('.')[0] ?? id;
}

const INGREDIENT_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.AnyIngredient> = {
  getSearchText: (i) => [i.name, i.manufacturer, i.category].filter(Boolean).join(' '),
  selectionExtractors: {
    collection: (i) => i.collectionId,
    category: (i) => i.category,
    tags: (i) => i.tags ?? []
  }
};

const FILLING_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.FillingRecipe> = {
  getSearchText: (f) => [f.name, f.entity.category].filter(Boolean).join(' '),
  selectionExtractors: {
    collection: (f) => f.collectionId,
    category: (f) => f.entity.category,
    tags: (f) => f.tags ?? []
  }
};

const CONFECTION_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.IConfectionBase> = {
  getSearchText: (c) => [c.name, c.confectionType, c.description].filter(Boolean).join(' '),
  selectionExtractors: {
    collection: (c) => c.collectionId,
    category: (c) => c.confectionType,
    tags: (c) => c.tags ?? []
  }
};

const MOLD_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.IMold> = {
  getSearchText: (m) => [m.displayName, m.manufacturer, m.format, m.description].filter(Boolean).join(' '),
  selectionExtractors: {
    collection: (m) => m.collectionId,
    shape: (m) => m.format,
    cavities: (m) => String(m.cavityCount)
  }
};

const PROCEDURE_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.IProcedure> = {
  getSearchText: (p) => [p.name, p.category, p.description].filter(Boolean).join(' '),
  selectionExtractors: {
    collection: (p) => collectionFromId(p.id),
    category: (p) => p.category,
    tags: (p) => p.tags ?? []
  }
};

const TASK_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.ITask> = {
  getSearchText: (t) => [t.name, t.template].filter(Boolean).join(' '),
  selectionExtractors: {
    collection: (t) => collectionFromId(t.id),
    tags: (t) => t.tags ?? []
  }
};

// ============================================================================
// Ingredients Tab Content
// ============================================================================

function IngredientsTabContent(): React.ReactElement {
  const workspace = useWorkspace();
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

  // Collect all ingredients into an array (memoized on workspace version)
  const ingredients = useMemo<ReadonlyArray<LibraryRuntime.AnyIngredient>>(() => {
    return Array.from(workspace.data.ingredients.values());
  }, [workspace]);

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
        return {
          key: entry.entityId,
          label: result.value.name,
          content: <IngredientDetail ingredient={result.value} />
        };
      });
  }, [cascadeStack, workspace]);

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

  // Collect all fillings into an array (memoized on workspace version)
  const fillings = useMemo<ReadonlyArray<LibraryRuntime.FillingRecipe>>(() => {
    return Array.from(workspace.data.fillings.values());
  }, [workspace]);

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
    return Array.from(workspace.data.molds.values());
  }, [workspace]);

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
    return Array.from(workspace.data.tasks.values());
  }, [workspace]);

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
    return Array.from(workspace.data.procedures.values());
  }, [workspace]);

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

  const confections = useMemo<ReadonlyArray<LibraryRuntime.IConfectionBase>>(() => {
    return Array.from(workspace.data.confections.values());
  }, [workspace]);

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
    default:
      return <TabPlaceholder tab={tab} />;
  }
}

// ============================================================================
// App Shell (inner, needs MessagesProvider)
// ============================================================================

function AppShell(): React.ReactElement {
  const workspace = useWorkspace();
  const mode = useNavigationStore((s) => s.mode);
  const activeTab = useNavigationStore(selectActiveTab);
  const modeTabs = useNavigationStore(selectModeTabs);
  const setMode = useNavigationStore((s) => s.setMode);
  const setTab = useNavigationStore((s) => s.setTab);
  const popCascade = useNavigationStore((s) => s.popCascade);
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const { messages, activeToasts, dismissMessage, clearMessages } = useMessages();

  const filterOptionProvider = useMemo(() => new WorkspaceFilterOptionProvider(workspace.data), [workspace]);

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
      <SidebarLayout sidebar={<TabSidebar optionProvider={filterOptionProvider} />}>
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
  const [reactiveWorkspace] = useState(() => getReactiveWorkspace(reporter));

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
