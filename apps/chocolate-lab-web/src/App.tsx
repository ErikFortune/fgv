import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import {
  ConfirmDialog,
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
  SidebarLayout
} from '@fgv/ts-app-shell';
import { Logging } from '@fgv/ts-utils';
import { createWorkspaceFromPlatform } from '@fgv/ts-chocolate';
import {
  type AppMode,
  type AppTab,
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
  WorkspaceFilterOptionProvider,
  useCollectionActions,
  initializeBrowserPlatform
} from '@fgv/chocolate-lab-ui';

import { IngredientsTabContent } from './tabs/IngredientsTab';
import { FillingsTabContent } from './tabs/FillingsTab';
import { MoldsTabContent } from './tabs/MoldsTab';
import { TasksTabContent } from './tabs/TasksTab';
import { ProceduresTabContent } from './tabs/ProceduresTab';
import { ConfectionsTabContent } from './tabs/ConfectionsTab';
import { DecorationsTabContent } from './tabs/DecorationsTab';

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
  readonly actions: ReturnType<typeof useCollectionActions>;
}): React.ReactElement {
  const {
    addDirectory,
    createCollection,
    deleteCollection,
    exportCollection,
    exportAllAsZip,
    importCollection,
    openCollectionFromFile,
    pendingImport,
    resolveImportCollision
  } = props.actions;

  return (
    <TabSidebar
      optionProvider={props.optionProvider}
      onAddDirectory={addDirectory}
      onCreateCollection={createCollection}
      onDeleteCollection={deleteCollection}
      onExportCollection={exportCollection}
      onExportAllAsZip={exportAllAsZip}
      onImportCollection={importCollection}
      onOpenCollectionFromFile={openCollectionFromFile}
      pendingImport={pendingImport}
      onResolveImportCollision={resolveImportCollision}
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
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const { messages, activeToasts, dismissMessage, clearMessages } = useMessages();
  const collectionActions = useCollectionActions();

  // NOTE: Guard fires whenever an edit/create pane is open, regardless of whether the user
  // has actually made changes. A finer-grained check (wrapper.hasChanges()) would require
  // threading editingRef up from each tab — a future refinement if the false-positive rate
  // becomes annoying.
  const hasActiveEdit = cascadeStack.some((e) => e.mode === 'edit' || e.mode === 'create');
  const hasUnsavedChanges = hasActiveEdit || collectionActions.hasDirtyTrees;

  // Warn on browser close/refresh when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return (): void => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const guardedSetTab = useCallback(
    (tab: AppTab): void => {
      if (hasUnsavedChanges) {
        setPendingNavigation(() => (): void => setTab(tab));
      } else {
        setTab(tab);
      }
    },
    [hasUnsavedChanges, setTab]
  );

  const guardedSetMode = useCallback(
    (newMode: AppMode): void => {
      if (hasUnsavedChanges) {
        setPendingNavigation(() => (): void => setMode(newMode));
      } else {
        setMode(newMode);
      }
    },
    [hasUnsavedChanges, setMode]
  );

  const handleNavConfirm = useCallback((): void => {
    if (pendingNavigation) {
      pendingNavigation();
    }
    setPendingNavigation(null);
  }, [pendingNavigation]);

  const handleNavCancel = useCallback((): void => {
    setPendingNavigation(null);
  }, []);

  const filterOptionProvider = useMemo(
    () => new WorkspaceFilterOptionProvider(workspace.data),
    [workspace, reactiveWorkspace.version]
  );

  // Sync navigation state ↔ URL hash
  useUrlSync(URL_SYNC_CONFIG, { mode, activeTab }, { setMode: guardedSetMode, setTab: guardedSetTab });

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
      <ConfirmDialog
        isOpen={pendingNavigation !== null}
        title="Unsaved Changes"
        message="You have unsaved changes. Discard them and navigate away?"
        confirmLabel="Discard"
        cancelLabel="Stay"
        severity="warning"
        onConfirm={handleNavConfirm}
        onCancel={handleNavCancel}
      />

      {/* Top bar: mode selector */}
      <ModeSelector<AppMode>
        title="Chocolate Lab"
        modes={MODES}
        activeMode={mode}
        onModeChange={guardedSetMode}
        rightContent={<SettingsButton onOpen={(): void => setSettingsOpen(true)} />}
      />

      {/* Second bar: tab selector */}
      <TabBar<AppTab> tabs={getTabConfigs(modeTabs)} activeTab={activeTab} onTabChange={guardedSetTab} />

      {/* Main content area: sidebar + tab content */}
      <SidebarLayout
        sidebar={<TabSidebarWithActions optionProvider={filterOptionProvider} actions={collectionActions} />}
      >
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
