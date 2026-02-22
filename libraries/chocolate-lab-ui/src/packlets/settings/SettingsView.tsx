import React, { useState } from 'react';

import { useWorkspace } from '../workspace';

import { useSettingsDraft } from './useSettingsDraft';
import { BootstrapSection } from './sections/BootstrapSection';
import { WorkspaceSection } from './sections/WorkspaceSection';
import { ScalingSection } from './sections/ScalingSection';
import { WorkflowSection } from './sections/WorkflowSection';
import { ExternalLibrariesSection } from './sections/ExternalLibrariesSection';
import { SecuritySection } from './sections/SecuritySection';

// ============================================================================
// Nav tabs
// ============================================================================

type SettingsTab = 'startup' | 'workspace' | 'scaling' | 'workflow' | 'libraries' | 'security';

interface ITabDef {
  readonly id: SettingsTab;
  readonly label: string;
}

const TABS: ReadonlyArray<ITabDef> = [
  { id: 'startup', label: 'Startup' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'scaling', label: 'Scaling' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'libraries', label: 'Libraries' },
  { id: 'security', label: 'Security' }
];

// ============================================================================
// Props
// ============================================================================

export interface ISettingsViewProps {
  readonly onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function SettingsView(props: ISettingsViewProps): React.ReactElement {
  const { onClose } = props;
  const workspace = useWorkspace();
  const deviceId = workspace.settings?.deviceId;
  const draft = useSettingsDraft();
  const [activeTab, setActiveTab] = useState<SettingsTab>('workspace');

  if (!draft) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">Loading settings…</div>
    );
  }

  const {
    bootstrap,
    preferences,
    isDirty,
    hasBootstrapChanges,
    isSaving,
    saveError,
    updateBootstrap,
    updatePreferences,
    save,
    revert
  } = draft;

  async function handleSave(): Promise<void> {
    await save();
    if (!draft?.saveError) {
      onClose();
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab nav */}
      <div className="flex border-b border-gray-200 bg-gray-50 px-4 flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={(): void => setActiveTab(tab.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-choco-accent text-choco-accent'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'startup' && (
          <BootstrapSection
            bootstrap={bootstrap}
            onChange={updateBootstrap}
            hasRestartPending={hasBootstrapChanges}
          />
        )}
        {activeTab === 'workspace' && deviceId !== undefined && (
          <WorkspaceSection deviceId={deviceId} bootstrap={bootstrap} onBootstrapChange={updateBootstrap} />
        )}
        {activeTab === 'scaling' && (
          <ScalingSection scaling={preferences.scaling} onChange={updatePreferences} />
        )}
        {activeTab === 'workflow' && (
          <WorkflowSection workflow={preferences.workflow} onChange={updatePreferences} />
        )}
        {activeTab === 'libraries' && (
          <ExternalLibrariesSection
            externalLibraries={preferences.externalLibraries}
            onChange={updatePreferences}
          />
        )}
        {activeTab === 'security' && <SecuritySection />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex-1">{saveError && <p className="text-sm text-red-600">{saveError}</p>}</div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={revert}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
            >
              Revert
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="px-4 py-1.5 text-sm bg-choco-accent text-white rounded-md hover:bg-choco-accent/90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
