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
  useUrlSync,
  type IUrlSyncConfig,
  Modal,
  KeyboardShortcutProvider,
  useKeyboardShortcuts,
  type IShortcut,
  SidebarLayout,
  EntityList,
  type IEntityDescriptor,
  CascadeContainer,
  type ICascadeColumn
} from '@fgv/ts-app-shell';
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
  FillingDetail
} from '@fgv/chocolate-lab-ui';
import type { IngredientId, FillingId } from '@fgv/ts-chocolate';

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

function getReactiveWorkspace(): ReactiveWorkspace {
  if (!_reactiveWorkspace) {
    _reactiveWorkspace = new ReactiveWorkspace(Workspace.create({ preWarm: true }).orThrow());
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

// ============================================================================
// Ingredients Tab Content
// ============================================================================

function IngredientsTabContent(): React.ReactElement {
  const workspace = useWorkspace();
  const pushCascade = useNavigationStore((s) => s.pushCascade);
  const popCascadeTo = useNavigationStore((s) => s.popCascadeTo);
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);

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
      pushCascade(entry);
    },
    [pushCascade]
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

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Entity list (collapses when cascade is open) */}
      <div
        className={`flex flex-col overflow-hidden transition-all ${
          cascadeStack.length > 0 ? 'w-0 min-w-0' : 'flex-1'
        }`}
      >
        <EntityList<LibraryRuntime.AnyIngredient, IngredientId>
          entities={ingredients}
          descriptor={INGREDIENT_DESCRIPTOR}
          selectedId={selectedId}
          onSelect={handleSelect}
          emptyState={{
            title: 'No Ingredients',
            description: 'No ingredients found in the library.'
          }}
        />
      </div>

      {/* Cascade columns */}
      {cascadeStack.length > 0 && <CascadeContainer columns={cascadeColumns} onPopTo={popCascadeTo} />}
    </div>
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

  // Drill-down: clicking an ingredient inside a filling replaces the ingredient column
  const handleIngredientClick = useCallback(
    (ingredientId: IngredientId): void => {
      // Keep the filling (first entry) and replace everything after with the new ingredient
      const filling = cascadeStack[0];
      const entry: ICascadeEntry = { entityType: 'ingredient', entityId: ingredientId, mode: 'view' };
      squashCascade(filling ? [filling, entry] : [entry]);
    },
    [squashCascade, cascadeStack]
  );

  // Build cascade columns from the cascade stack
  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry) => {
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
          content: <FillingDetail filling={result.value} onIngredientClick={handleIngredientClick} />
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
      return {
        key: entry.entityId,
        label: entry.entityId,
        content: <div className="p-4 text-gray-500">Unknown entity type: {entry.entityType}</div>
      };
    });
  }, [cascadeStack, workspace, handleIngredientClick]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Entity list (collapses when cascade is open) */}
      <div
        className={`flex flex-col overflow-hidden transition-all ${
          cascadeStack.length > 0 ? 'w-0 min-w-0' : 'flex-1'
        }`}
      >
        <EntityList<LibraryRuntime.FillingRecipe, FillingId>
          entities={fillings}
          descriptor={FILLING_DESCRIPTOR}
          selectedId={selectedId}
          onSelect={handleSelect}
          emptyState={{
            title: 'No Fillings',
            description: 'No filling recipes found in the library.'
          }}
        />
      </div>

      {/* Cascade columns */}
      {cascadeStack.length > 0 && <CascadeContainer columns={cascadeColumns} onPopTo={popCascadeTo} />}
    </div>
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
    default:
      return <TabPlaceholder tab={tab} />;
  }
}

// ============================================================================
// App Shell (inner, needs MessagesProvider)
// ============================================================================

function AppShell(): React.ReactElement {
  const mode = useNavigationStore((s) => s.mode);
  const activeTab = useNavigationStore(selectActiveTab);
  const modeTabs = useNavigationStore(selectModeTabs);
  const setMode = useNavigationStore((s) => s.setMode);
  const setTab = useNavigationStore((s) => s.setTab);
  const popCascade = useNavigationStore((s) => s.popCascade);
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const { messages, activeToasts, dismissMessage, clearMessages } = useMessages();

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
      <SidebarLayout sidebar={<TabSidebar />}>
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
export default function App(): React.ReactElement {
  // Lazy-initialize once on first render (not at module evaluation time)
  const [reactiveWorkspace] = useState(getReactiveWorkspace);

  return (
    <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
      <KeyboardShortcutProvider>
        <MessagesProvider>
          <AppShell />
        </MessagesProvider>
      </KeyboardShortcutProvider>
    </WorkspaceProvider>
  );
}
