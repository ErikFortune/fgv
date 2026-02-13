import React, { useMemo, useState } from 'react';
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
  SidebarLayout
} from '@fgv/ts-app-shell';
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
  TabSidebar
} from '@fgv/chocolate-lab-ui';

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
// Empty Tab Content
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
      <p className="text-gray-400 text-sm mt-6">Entity list + cascade coming in Phase 3+</p>
    </div>
  );
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

      {/* Main content area: sidebar + entity list */}
      <SidebarLayout sidebar={<TabSidebar />}>
        <TabPlaceholder tab={activeTab} />
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
  return (
    <KeyboardShortcutProvider>
      <MessagesProvider>
        <AppShell />
      </MessagesProvider>
    </KeyboardShortcutProvider>
  );
}
