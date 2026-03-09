import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Logging, type MessageLogLevel, succeed, fail } from '@fgv/ts-utils';
import {
  createWorkspaceFromPlatform,
  validateResolvedSettings,
  type ISettingsValidationWarning,
  type Settings
} from '@fgv/ts-chocolate';
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
  applyStorageTargetsFromWorkspace,
  SettingsCascadeView,
  RecoveryDialog,
  type RecoveryAction,
  ProductionOverlayPanel,
  type ProductionPanelState,
  type IActiveSessionEntry
} from '@fgv/chocolate-lab-ui';

import { IngredientsTabContent } from './tabs/IngredientsTab';
import { FillingsTabContent } from './tabs/FillingsTab';
import { MoldsTabContent } from './tabs/MoldsTab';
import { TasksTabContent } from './tabs/TasksTab';
import { ProceduresTabContent } from './tabs/ProceduresTab';
import { ConfectionsTabContent } from './tabs/ConfectionsTab';
import { DecorationsTabContent } from './tabs/DecorationsTab';
import { SessionsTabContent } from './tabs/SessionsTab';
import { MoldInventoryTabContent } from './tabs/MoldInventoryTab';
import { LocationsTabContent } from './tabs/LocationsTab';

// ============================================================================
// Mode / Tab Configuration
// ============================================================================

const MODES: ReadonlyArray<IModeConfig<AppMode>> = [
  { id: 'production', label: MODE_LABELS.production },
  { id: 'library', label: MODE_LABELS.library }
];

const VALID_TABS_WITH_SETTINGS: Record<AppMode, ReadonlyArray<AppTab>> = {
  production: [...MODE_TABS.production, 'settings' as AppTab],
  library: [...MODE_TABS.library, 'settings' as AppTab]
};

const URL_SYNC_CONFIG: IUrlSyncConfig<AppMode, AppTab> = {
  validModes: ['production', 'library'],
  validTabs: VALID_TABS_WITH_SETTINGS,
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

const _defaultConfigNamespaceStorageKey = 'chocolate-lab:default-config-namespace';
const _configNamespaceRegex = /^[a-zA-Z0-9-]+$/;

type ConfigNamespaceSource = 'url' | 'default' | 'none';

interface IResolvedConfigNamespace {
  readonly effectiveConfigNamespace: string | undefined;
  readonly defaultConfigNamespace: string | undefined;
  readonly source: ConfigNamespaceSource;
}

/**
 * Read the `?config=xxx` URL parameter once at module load.
 * Only alphanumeric characters and hyphens are allowed.
 */
function _isValidConfigNamespace(raw: string): boolean {
  return _configNamespaceRegex.test(raw);
}

function _readUrlConfigNamespace(): string | undefined {
  const raw = new URLSearchParams(window.location.search).get('config');
  if (!raw) return undefined;
  if (!_isValidConfigNamespace(raw)) {
    _bootLogger.warn(`Ignoring invalid config namespace '${raw}' — only [a-zA-Z0-9-] allowed`);
    return undefined;
  }
  return raw;
}

function _readStoredDefaultConfigNamespace(): string | undefined {
  try {
    const raw = window.localStorage.getItem(_defaultConfigNamespaceStorageKey);
    if (!raw) return undefined;
    if (!_isValidConfigNamespace(raw)) {
      _bootLogger.warn(`Ignoring invalid stored default config namespace '${raw}' — clearing stored value`);
      window.localStorage.removeItem(_defaultConfigNamespaceStorageKey);
      return undefined;
    }
    return raw;
  } catch (err: unknown) {
    _bootLogger.warn(
      `Unable to read default config namespace from localStorage: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return undefined;
  }
}

function _resolveConfigNamespace(): IResolvedConfigNamespace {
  const fromUrl = _readUrlConfigNamespace();
  const fromDefault = _readStoredDefaultConfigNamespace();

  if (fromUrl) {
    return {
      effectiveConfigNamespace: fromUrl,
      defaultConfigNamespace: fromDefault,
      source: 'url'
    };
  }

  if (fromDefault) {
    return {
      effectiveConfigNamespace: fromDefault,
      defaultConfigNamespace: fromDefault,
      source: 'default'
    };
  }

  return {
    effectiveConfigNamespace: undefined,
    defaultConfigNamespace: undefined,
    source: 'none'
  };
}

const _resolvedConfigNamespace = _resolveConfigNamespace();
const _configNamespace = _resolvedConfigNamespace.effectiveConfigNamespace;

interface IBuildResult {
  reactiveWorkspace: ReactiveWorkspace;
  warnings: ReadonlyArray<ISettingsValidationWarning>;
  logSettings: Settings.ILogSettings | undefined;
  configNamespace: string | undefined;
  /** Set when local library data failed to load (e.g. old format). App runs with built-in data only. */
  dataError?: string;
}

async function _buildReactiveWorkspace(): Promise<IBuildResult> {
  const storageKeyPrefix = _configNamespace ? `chocolate-lab:${_configNamespace}` : 'chocolate-lab';
  const platformInit = await initializeBrowserPlatform({
    userLibraryPath: 'localStorage',
    storageKeyPrefix
  });

  // Read bootstrap flags to control what data sources are loaded
  const bootstrap = platformInit.value?.bootstrapSettings;
  const includeBuiltIn = bootstrap?.includeBuiltIn ?? true;
  const loadLocalLibrary = bootstrap?.localStorage?.library ?? true;
  const loadLocalUserData = bootstrap?.localStorage?.userData ?? true;
  const useLocalStorage = loadLocalLibrary || loadLocalUserData;

  _bootReporter?.detail(
    `_buildReactiveWorkspace: includeBuiltIn=${includeBuiltIn}, loadLocalLibrary=${loadLocalLibrary}, loadLocalUserData=${loadLocalUserData}, useLocalStorage=${useLocalStorage}`
  );

  // Use a silent logger for the first attempt — if it fails due to old-format local data,
  // we don't want verbose parse errors flooding the toast/log system.
  const workspaceResult = platformInit.onSuccess((init) =>
    createWorkspaceFromPlatform({
      platformInit: init,
      builtin: includeBuiltIn,
      preWarm: includeBuiltIn,
      userLibrarySourceName: useLocalStorage ? 'localStorage' : undefined,
      configName: _configNamespace,
      logger: Logging.LogReporter.createDefault(new Logging.NoOpLogger()).orThrow()
    })
  );

  // If workspace creation failed (e.g. local data in old format), try a fallback
  // with no user library source so the app can start with built-in data only.
  let dataError: string | undefined;
  let workspace;
  if (workspaceResult.isFailure()) {
    _bootReporter?.error(
      `Local library data could not be loaded (format changed after update). Running with built-in data only. Clear browser storage and reload to fix.`
    );
    dataError = workspaceResult.message;
    workspace = platformInit
      .onSuccess((init) =>
        createWorkspaceFromPlatform({
          platformInit: init,
          builtin: includeBuiltIn,
          preWarm: includeBuiltIn,
          userLibrarySourceName: undefined,
          configName: _configNamespace,
          logger: _bootReporter
        })
      )
      .orThrow();
  } else {
    workspace = workspaceResult.value;
  }
  const reactiveWorkspace = new ReactiveWorkspace(workspace, true);

  // Wire up persistence so PersistedEditableCollection wrappers can sync to disk
  // and can encrypt collections when the KeyStore is unlocked.
  // Wire up persistence for shared library entities
  workspace.data.entities.configurePersistence({
    syncProvider: {
      syncToDisk: async () => {
        const result = await reactiveWorkspace.syncAllToDisk();
        return result.isSuccess() ? succeed(true as const) : fail(result.message);
      }
    },
    encryptionProvider: () => workspace.keyStore
  });

  // Wire up persistence for user entities (sessions, journals, inventory)
  workspace.userData.entities.configurePersistence({
    syncProvider: {
      syncToDisk: async () => {
        const result = await reactiveWorkspace.syncAllToDisk();
        return result.isSuccess() ? succeed(true as const) : fail(result.message);
      }
    },
    encryptionProvider: () => workspace.keyStore
  });

  const localStorageRootDir = useLocalStorage ? platformInit.value?.userLibraryTree : undefined;

  if (useLocalStorage) {
    reactiveWorkspace.registerLocalStorageRoot('Browser Storage', localStorageRootDir);
  }

  await restoreSavedDirectories({
    reactiveWorkspace,
    entities: workspace.data.entities,
    userEntities: workspace.userData.entities,
    configName: _configNamespace,
    logger: _bootReporter
  });

  applyStorageTargetsFromWorkspace({
    localStorageRootDir,
    persistentTrees: reactiveWorkspace.persistentTrees,
    targets: workspace.settings?.getResolvedSettings().defaultStorageTargets,
    entities: workspace.data.entities,
    userEntities: workspace.userData.entities,
    logger: _bootReporter
  });

  // Log storage summary
  const storage = reactiveWorkspace.storageSummary;
  const storageParts: string[] = [];
  if (storage.hasBuiltIn) {
    storageParts.push('built-in library');
  }
  if (useLocalStorage) {
    storageParts.push('local storage');
  }
  if (storage.localDirectoryCount > 0) {
    storageParts.push(
      `${storage.localDirectoryCount} external director${storage.localDirectoryCount === 1 ? 'y' : 'ies'}`
    );
  } else {
    storageParts.push('no external files');
  }
  _bootReporter.info(`Storage: ${storageParts.join(', ')}`);

  // Post-construction validation
  const resolvedSettings = workspace.settings?.getResolvedSettings();
  const warnings: ReadonlyArray<ISettingsValidationWarning> = resolvedSettings
    ? validateResolvedSettings(resolvedSettings, {
        availableRoots: new Set(reactiveWorkspace.storageSummary.roots.map((r) => r.sourceName as never))
      })
    : [];

  const logSettings = workspace.settings?.getBootstrapSettings()?.logging;

  return { reactiveWorkspace, warnings, logSettings, configNamespace: _configNamespace, dataError };
}

// Cache the build result so React 18 StrictMode double-invocation
// of useEffect doesn't run workspace initialization twice.
let _cachedBuildResult: Promise<IBuildResult> | undefined;

function _getOrBuildWorkspace(): Promise<IBuildResult> {
  if (!_cachedBuildResult) {
    _cachedBuildResult = _buildReactiveWorkspace();
  }
  return _cachedBuildResult;
}

// ============================================================================
// Empty Tab Content (for tabs not yet implemented)
// ============================================================================

const TAB_DESCRIPTIONS: Record<string, string> = {
  sessions: 'Manage production sessions — plan, execute, and track your chocolate-making runs.',
  journal: 'View journal entries and production history.',
  'ingredient-inventory': 'Track your ingredient stock levels and locations.',
  'mold-inventory': 'Manage your mold collection and availability.',
  locations: 'Define and manage production and storage locations.',
  ingredients: 'Browse and manage chocolate ingredients with ganache characteristics.',
  fillings: 'Create and refine filling recipes with variation tracking.',
  confections: 'Design confection recipes combining fillings, molds, and chocolates.',
  decorations: 'Browse decoration techniques with ingredients, procedures, and ratings.',
  molds: 'Catalog your mold collection with cavity specifications.',
  tasks: 'Define reusable tasks for production procedures.',
  procedures: 'Build step-by-step procedures from task sequences.',
  settings: 'Configure storage roots, default targets, and workspace preferences.'
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
    case 'sessions':
      return <SessionsTabContent />;
    case 'mold-inventory':
      return <MoldInventoryTabContent />;
    case 'locations':
      return <LocationsTabContent />;
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

interface IAppShellProps {
  readonly displayLevel?: Logging.ReporterLogLevel;
  readonly toastLevel?: Logging.ReporterLogLevel;
  readonly configNamespace?: string;
  readonly configNamespaceSource: ConfigNamespaceSource;
  readonly initialDefaultConfigNamespace?: string;
  /** Set when local library data failed to load (e.g. old format after an update). */
  readonly dataError?: string;
}

function AppShell(props: IAppShellProps): React.ReactElement {
  const {
    displayLevel,
    toastLevel,
    configNamespace,
    configNamespaceSource,
    initialDefaultConfigNamespace,
    dataError
  } = props;
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

  const settingsOpen = (activeTab as string) === 'settings';
  const [defaultConfigNamespace, setDefaultConfigNamespace] = useState<string | undefined>(
    initialDefaultConfigNamespace
  );
  const [pendingSettingsClose, setPendingSettingsClose] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const { messages, activeToasts, addMessage, dismissMessage, clearMessages } = useMessages();
  const collectionActions = useCollectionActions();

  // Production overlay panel state
  const [productionPanelState, setProductionPanelState] = useState<ProductionPanelState>('collapsed');

  const activeSessions = useMemo((): ReadonlyArray<IActiveSessionEntry> => {
    const entries: IActiveSessionEntry[] = [];
    for (const [id, session] of workspace.userData.sessions.entries()) {
      if (session.status === 'active' || session.status === 'committing') {
        entries.push({ sessionId: id, session });
      }
    }
    return entries;
  }, [workspace, reactiveWorkspace.version]);

  // Set document title to include config namespace
  useEffect(() => {
    document.title = configNamespace ? `Chocolate Lab [${configNamespace}]` : 'Chocolate Lab';
  }, [configNamespace]);

  // Remind users to unlock when the keystore is locked (ref prevents duplicates from strict mode)
  const lockToastShownRef = useRef(false);
  useEffect(() => {
    if (workspaceState === 'locked' && !lockToastShownRef.current) {
      lockToastShownRef.current = true;
      addMessage('warning', 'Keystore is locked — edits will be saved to the default collection only.', {
        label: 'Unlock',
        onAction: (): void => setUnlockOpen(true)
      });
    } else if (workspaceState !== 'locked') {
      lockToastShownRef.current = false;
    }
  }, [workspaceState, addMessage]);

  const filteredToasts = useMemo(
    () =>
      toastLevel !== undefined
        ? activeToasts.filter((msg) => {
            const level = msg.severity === 'success' ? 'info' : (msg.severity as MessageLogLevel);
            return Logging.shouldLog(level, toastLevel);
          })
        : activeToasts,
    [activeToasts, toastLevel]
  );

  const dirtyEntries = useMemo(
    () => cascadeStack.filter((e) => (e.mode === 'edit' || e.mode === 'create') && e.hasChanges === true),
    [cascadeStack]
  );

  const hasUnsavedChanges = dirtyEntries.length > 0 || collectionActions.hasDirtyTrees;

  const unsavedChangesSummary = useMemo((): React.ReactNode => {
    const parts: string[] = [];
    for (const e of dirtyEntries) {
      parts.push(`${e.entityType} "${e.entityId}" (${e.mode})`);
    }
    if (collectionActions.hasDirtyTrees) {
      parts.push('collection tree changes');
    }
    if (parts.length === 0) {
      return 'You have unsaved changes. Discard them and navigate away?';
    }
    return (
      <div>
        <p>You have unsaved changes. Discard them and navigate away?</p>
        <ul className="mt-2 text-xs text-gray-500 list-disc list-inside">
          {parts.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>
    );
  }, [dirtyEntries, collectionActions.hasDirtyTrees]);

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

  const logUnsavedChanges = useCallback((): void => {
    const parts: string[] = [];
    for (const e of dirtyEntries) {
      parts.push(`${e.entityType}:${e.entityId} (${e.mode})`);
    }
    if (collectionActions.hasDirtyTrees) {
      parts.push('dirty collection trees');
    }
    workspace.data.logger.warn(`Navigation blocked — unsaved: [${parts.join(', ')}]`);
  }, [dirtyEntries, collectionActions.hasDirtyTrees, workspace]);

  const guardedSetTab = useCallback(
    (tab: AppTab): void => {
      if (hasUnsavedChanges) {
        logUnsavedChanges();
        setPendingNavigation(() => (): void => {
          setTab(tab);
        });
      } else {
        setTab(tab);
      }
    },
    [hasUnsavedChanges, logUnsavedChanges, setTab]
  );

  const guardedSetMode = useCallback(
    (newMode: AppMode): void => {
      if (hasUnsavedChanges) {
        logUnsavedChanges();
        setPendingNavigation(() => (): void => {
          setMode(newMode);
        });
      } else {
        setMode(newMode);
      }
    },
    [hasUnsavedChanges, logUnsavedChanges, setMode]
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

  const handleSetDefaultConfigNamespace = useCallback(
    (namespace: string | undefined): void => {
      try {
        if (namespace === undefined) {
          window.localStorage.removeItem(_defaultConfigNamespaceStorageKey);
        } else {
          window.localStorage.setItem(_defaultConfigNamespaceStorageKey, namespace);
        }
        setDefaultConfigNamespace(namespace);
      } catch (err: unknown) {
        workspace.data.logger.warn(
          `Unable to update default config namespace in localStorage: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    },
    [workspace]
  );

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
        message={unsavedChangesSummary}
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
          if (!err) {
            reactiveWorkspace.masterPassword = password;
            setUnlockOpen(false);
          }
          return err;
        }}
        onCancel={(): void => setUnlockOpen(false)}
      />

      {/* Top bar: mode selector */}
      <ModeSelector<AppMode>
        title={configNamespace ? `Chocolate Lab [${configNamespace}]` : 'Chocolate Lab'}
        modes={MODES}
        activeMode={mode}
        onModeChange={guardedSetMode}
        rightContent={
          workspaceState !== 'no-keystore' ? (
            <LockButton
              isLocked={workspaceState === 'locked'}
              onLock={(): void => {
                lock();
                reactiveWorkspace.masterPassword = undefined;
              }}
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
            onClick={(): void => guardedSetTab('settings' as AppTab)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              settingsOpen ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Settings
          </button>
        }
      />

      {/* Data format error banner — shown when local library data could not be loaded */}
      {dataError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-200 text-red-800 text-xs">
          <svg
            className="w-4 h-4 text-red-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <span>
            <strong>Local library data could not be loaded</strong> — the data format changed after an update.
            The app is running with built-in data only. Clear browser storage (DevTools → Application →
            Storage → Clear site data) and reload to fix.
          </span>
        </div>
      )}

      {/* Mitigated state banner — shown when some storage roots are unavailable */}
      {reactiveWorkspace.isMitigated && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
          <svg
            className="w-4 h-4 text-amber-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <span>
            <strong>Mitigated mode:</strong> Some configured storage roots are unavailable. Writes to those
            roots are blocked. Go to{' '}
            <button
              onClick={(): void => guardedSetTab('settings' as AppTab)}
              className="underline hover:text-amber-900"
            >
              Settings
            </button>{' '}
            to reset or reconfigure storage.
          </span>
        </div>
      )}

      {/* Main content area: sidebar + tab content, or settings cascade */}
      {settingsOpen ? (
        <SettingsCascadeView
          currentConfigNamespace={configNamespace}
          currentConfigNamespaceSource={configNamespaceSource}
          defaultConfigNamespace={defaultConfigNamespace}
          onSetDefaultConfigNamespace={handleSetDefaultConfigNamespace}
          onClose={(): void => guardedSetTab(modeTabs[0] as AppTab)}
          onDirtyClose={(): void => setPendingSettingsClose(true)}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <SidebarLayout
            sidebar={
              <TabSidebarWithActions optionProvider={filterOptionProvider} actions={collectionActions} />
            }
          >
            <TabContent tab={activeTab} />
          </SidebarLayout>
          {activeSessions.length > 0 && (
            <ProductionOverlayPanel
              sessions={activeSessions}
              panelState={productionPanelState}
              onStateChange={setProductionPanelState}
            />
          )}
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={filteredToasts} onDismiss={dismissMessage} />

      {/* Status bar / log panel */}
      <StatusBar messages={messages} onClear={clearMessages} initialFilterLevel={displayLevel} />

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
          guardedSetTab(modeTabs[0] as AppTab);
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
function WorkspaceBootstrap(): React.ReactElement {
  const [logSettings, setLogSettings] = useState<Settings.ILogSettings | undefined>(undefined);
  const reporter = useLogReporter({ logLevel: logSettings?.storeLevel ?? 'info' });
  const [reactiveWorkspace, setReactiveWorkspace] = useState<ReactiveWorkspace | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [dataError, setDataError] = useState<string | undefined>(undefined);
  const [pendingWarnings, setPendingWarnings] = useState<ReadonlyArray<ISettingsValidationWarning>>([]);
  const [pendingWorkspace, setPendingWorkspace] = useState<ReactiveWorkspace | undefined>(undefined);

  useEffect(() => {
    // Connect the boot logger to the real logger so buffered messages
    // are replayed as toasts and all future log calls go through it.
    _bootLogger.ready(reporter.logger);
  }, [reporter]);

  useEffect(() => {
    _getOrBuildWorkspace()
      .then(({ reactiveWorkspace: rw, warnings, logSettings: ls, dataError: de }) => {
        setLogSettings(ls);
        if (de) {
          setDataError(de);
        }
        if (warnings.length > 0) {
          // Hold the workspace and show the recovery dialog
          setPendingWorkspace(rw);
          setPendingWarnings(warnings);
        } else {
          setReactiveWorkspace(rw);
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const handleRecover = useCallback(
    (action: RecoveryAction): void => {
      if (!pendingWorkspace) return;
      if (action === 'quit') {
        window.close();
        return;
      }
      if (action === 'reset') {
        // Clear invalid references from settings, then proceed
        const settings = pendingWorkspace.workspace.settings;
        if (settings) {
          const prefs = settings.getPreferencesSettings();
          if (prefs) {
            void settings.updatePreferencesSettings({
              ...prefs,
              defaultStorageTargets: undefined,
              defaultTargets: {}
            });
            void settings.save();
          }
        }
      } else {
        // action === 'mitigate'
        pendingWorkspace.applyMitigation(pendingWarnings);
      }
      setPendingWarnings([]);
      setPendingWorkspace(undefined);
      setReactiveWorkspace(pendingWorkspace);
    },
    [pendingWorkspace, pendingWarnings]
  );

  if (error) {
    return <div className="p-8 text-red-600">Failed to initialize workspace: {error}</div>;
  }

  if (pendingWarnings.length > 0) {
    return <RecoveryDialog isOpen={true} warnings={pendingWarnings} onRecover={handleRecover} />;
  }

  if (!reactiveWorkspace) {
    return <div className="p-8 text-gray-500">Loading workspace…</div>;
  }

  return (
    <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
      <KeyboardShortcutProvider>
        <AppShell
          displayLevel={logSettings?.displayLevel}
          toastLevel={logSettings?.toastLevel ?? 'warning'}
          configNamespace={_configNamespace}
          configNamespaceSource={_resolvedConfigNamespace.source}
          initialDefaultConfigNamespace={_resolvedConfigNamespace.defaultConfigNamespace}
          dataError={dataError}
        />
      </KeyboardShortcutProvider>
    </WorkspaceProvider>
  );
}

export default function App(): React.ReactElement {
  return (
    <MessagesProvider>
      <WorkspaceBootstrap />
    </MessagesProvider>
  );
}
