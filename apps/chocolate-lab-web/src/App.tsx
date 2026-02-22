import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  useWorkspaceState,
  UnlockDialog,
  WorkspaceFilterOptionProvider,
  useCollectionActions,
  initializeBrowserPlatform,
  restoreSavedDirectories,
  SettingsCascadeView
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
// Lock Button
// ============================================================================

function LockButton({
  isLocked,
  onLock,
  onUnlock
}: {
  readonly isLocked: boolean;
  readonly onLock: () => void;
  readonly onUnlock: () => void;
}): React.ReactElement {
  if (isLocked) {
    return (
      <button
        onClick={onUnlock}
        className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Unlock workspace"
        title="Unlock workspace"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </button>
    );
  }
  return (
    <button
      onClick={onLock}
      className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
      aria-label="Lock workspace"
      title="Lock workspace"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75M3.75 21.75h16.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
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
            userLibrarySourceName: 'Browser Storage',
            logger: _bootReporter
          })
        )
        .orThrow();
      const reactiveWorkspace = new ReactiveWorkspace(workspace, true);
      reactiveWorkspace.registerLocalStorageRoot('Browser Storage');
      await restoreSavedDirectories({
        reactiveWorkspace,
        entities: workspace.data.entities,
        logger: _bootReporter
      });
      return reactiveWorkspace;
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
    setDefaultCollection,
    exportCollection,
    exportAllAsZip,
    importCollection,
    openCollectionFromFile,
    pendingImport,
    resolveImportCollision,
    existingSecretNames,
    pendingSecretSetup,
    resolveSecretSetup,
    skipSecretSetup
  } = props.actions;

  return (
    <TabSidebar
      optionProvider={props.optionProvider}
      onAddDirectory={addDirectory}
      onCreateCollection={createCollection}
      onDeleteCollection={deleteCollection}
      onSetDefaultCollection={setDefaultCollection}
      onExportCollection={exportCollection}
      onExportAllAsZip={exportAllAsZip}
      onImportCollection={importCollection}
      onOpenCollectionFromFile={openCollectionFromFile}
      pendingImport={pendingImport}
      onResolveImportCollision={resolveImportCollision}
      existingSecretNames={existingSecretNames}
      pendingSecretSetup={pendingSecretSetup}
      onResolveSecretSetup={resolveSecretSetup}
      onSkipSecretSetup={skipSecretSetup}
    />
  );
}

// ============================================================================
// App Shell (inner, needs MessagesProvider)
// ============================================================================

function AppShell(): React.ReactElement {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const { state: workspaceState, unlock, lock } = useWorkspaceState();
  const mode = useNavigationStore((s) => s.mode);
  const activeTab = useNavigationStore(selectActiveTab);
  const modeTabs = useNavigationStore(selectModeTabs);
  const setMode = useNavigationStore((s) => s.setMode);
  const setTab = useNavigationStore((s) => s.setTab);
  const popCascade = useNavigationStore((s) => s.popCascade);
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingSettingsClose, setPendingSettingsClose] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
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
        setPendingNavigation(() => (): void => {
          setSettingsOpen(false);
          setTab(tab);
        });
      } else {
        setSettingsOpen(false);
        setTab(tab);
      }
    },
    [hasUnsavedChanges, setTab]
  );

  const guardedSetMode = useCallback(
    (newMode: AppMode): void => {
      if (hasUnsavedChanges) {
        setPendingNavigation(() => (): void => {
          setSettingsOpen(false);
          setMode(newMode);
        });
      } else {
        setSettingsOpen(false);
        setMode(newMode);
      }
    },
    [hasUnsavedChanges, setMode]
  );

  const guardedOpenSettings = useCallback((): void => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => (): void => setSettingsOpen(true));
    } else {
      setSettingsOpen(true);
    }
  }, [hasUnsavedChanges]);

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

      <UnlockDialog
        isOpen={unlockOpen}
        onUnlock={async (password: string): Promise<string | undefined> => {
          const err = await unlock(password);
          if (!err) setUnlockOpen(false);
          return err;
        }}
        onCancel={(): void => setUnlockOpen(false)}
      />

      {/* Top bar: mode selector */}
      <ModeSelector<AppMode>
        title="Chocolate Lab"
        modes={MODES}
        activeMode={mode}
        onModeChange={guardedSetMode}
        rightContent={
          workspaceState !== 'no-keystore' ? (
            <LockButton
              isLocked={workspaceState === 'locked'}
              onLock={lock}
              onUnlock={(): void => setUnlockOpen(true)}
            />
          ) : undefined
        }
      />

      {/* Second bar: tab selector */}
      <TabBar<AppTab>
        tabs={getTabConfigs(modeTabs)}
        activeTab={activeTab}
        onTabChange={guardedSetTab}
        rightContent={
          <button
            onClick={(): void => {
              if (settingsOpen) {
                setSettingsOpen(false);
              } else {
                guardedOpenSettings();
              }
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              settingsOpen ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Settings
          </button>
        }
      />

      {/* Main content area: sidebar + tab content, or settings cascade */}
      {settingsOpen ? (
        <SettingsCascadeView
          onClose={(): void => setSettingsOpen(false)}
          onDirtyClose={(): void => setPendingSettingsClose(true)}
        />
      ) : (
        <SidebarLayout
          sidebar={
            <TabSidebarWithActions optionProvider={filterOptionProvider} actions={collectionActions} />
          }
        >
          <TabContent tab={activeTab} />
        </SidebarLayout>
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={activeToasts} onDismiss={dismissMessage} />

      {/* Status bar / log panel */}
      <StatusBar messages={messages} onClear={clearMessages} />

      {/* Settings dirty-close confirmation */}
      <ConfirmDialog
        isOpen={pendingSettingsClose}
        title="Unsaved Settings"
        message="You have unsaved settings changes. Discard them and close?"
        confirmLabel="Discard"
        cancelLabel="Stay"
        severity="warning"
        onConfirm={(): void => {
          setPendingSettingsClose(false);
          setSettingsOpen(false);
        }}
        onCancel={(): void => setPendingSettingsClose(false)}
      />
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
