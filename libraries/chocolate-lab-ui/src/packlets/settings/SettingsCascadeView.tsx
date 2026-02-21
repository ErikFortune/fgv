import React, { useCallback, useState } from 'react';

import { CascadeContainer, type ICascadeColumn } from '@fgv/ts-app-shell';

import { useWorkspace } from '../workspace';

import { useSettingsDraft } from './useSettingsDraft';
import { WorkspaceSection } from './sections/WorkspaceSection';
import { ScalingSection } from './sections/ScalingSection';
import { WorkflowSection } from './sections/WorkflowSection';
import { StorageSection } from './sections/StorageSection';
import { LibrarySection } from './sections/LibrarySection';
import { SecuritySection } from './sections/SecuritySection';

// ============================================================================
// Section definitions
// ============================================================================

type SettingsSection = 'workspace' | 'scaling' | 'workflow' | 'storage' | 'libraries' | 'security';

interface ISectionDef {
  readonly id: SettingsSection;
  readonly label: string;
}

const SECTIONS: ReadonlyArray<ISectionDef> = [
  { id: 'workspace', label: 'Workspace' },
  { id: 'scaling', label: 'Scaling' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'storage', label: 'Storage' },
  { id: 'libraries', label: 'Libraries' },
  { id: 'security', label: 'Security' }
];

// ============================================================================
// Props
// ============================================================================

export interface ISettingsCascadeViewProps {
  readonly onClose: () => void;
  readonly onDirtyClose?: () => void;
}

// ============================================================================
// Section content renderer
// ============================================================================

function SectionContent({
  section,
  draft,
  sectionKey,
  sectionLabel,
  onSetColumns
}: {
  readonly section: SettingsSection;
  readonly draft: NonNullable<ReturnType<typeof useSettingsDraft>>;
  readonly sectionKey: string;
  readonly sectionLabel: string;
  readonly onSetColumns: (cols: ReadonlyArray<ICascadeColumn>) => void;
}): React.ReactElement {
  const workspace = useWorkspace();
  const deviceId = workspace.settings?.deviceId;
  const { common, device, updateCommon, updateDevice } = draft;

  function handleSquashColumns(detailCols: ReadonlyArray<ICascadeColumn>): void {
    const sectionCol: ICascadeColumn = {
      key: sectionKey,
      label: sectionLabel,
      content: (
        <SectionContent
          section={section}
          draft={draft}
          sectionKey={sectionKey}
          sectionLabel={sectionLabel}
          onSetColumns={onSetColumns}
        />
      )
    };
    onSetColumns([sectionCol, ...detailCols]);
  }

  switch (section) {
    case 'workspace':
      return deviceId !== undefined ? (
        <WorkspaceSection deviceId={deviceId} device={device} onDeviceChange={updateDevice} />
      ) : (
        <div className="p-6 text-sm text-gray-400">No workspace device settings available.</div>
      );
    case 'scaling':
      return <ScalingSection scaling={common.scaling} onChange={updateCommon} />;
    case 'workflow':
      return <WorkflowSection workflow={common.workflow} onChange={updateCommon} />;
    case 'storage':
      return <StorageSection onSquashColumns={handleSquashColumns} />;
    case 'libraries':
      return <LibrarySection />;
    case 'security':
      return <SecuritySection />;
  }
}

// ============================================================================
// Component
// ============================================================================

export function SettingsCascadeView(props: ISettingsCascadeViewProps): React.ReactElement {
  const { onClose, onDirtyClose } = props;
  const draft = useSettingsDraft();
  const [cascadeColumns, setCascadeColumns] = useState<ReadonlyArray<ICascadeColumn>>([]);
  const [activeSection, setActiveSection] = useState<SettingsSection | undefined>(undefined);

  const handlePopTo = useCallback((depth: number): void => {
    setCascadeColumns((prev) => prev.slice(0, depth));
    if (depth === 0) {
      setActiveSection(undefined);
    }
  }, []);

  if (!draft) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">Loading settings…</div>
    );
  }

  const resolvedDraft = draft;
  const { isDirty, isSaving, saveError, save, revert } = resolvedDraft;

  async function handleSave(): Promise<void> {
    await save();
    if (!resolvedDraft.saveError) {
      onClose();
    }
  }

  function handleClose(): void {
    if (isDirty && onDirtyClose) {
      onDirtyClose();
    } else {
      onClose();
    }
  }

  function handleSelectSection(section: ISectionDef): void {
    setActiveSection(section.id);
    const sectionColumn: ICascadeColumn = {
      key: section.id,
      label: section.label,
      content: (
        <SectionContent
          section={section.id}
          draft={resolvedDraft}
          sectionKey={section.id}
          sectionLabel={section.label}
          onSetColumns={setCascadeColumns}
        />
      )
    };
    setCascadeColumns([sectionColumn]);
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: section list */}
      <div className="flex flex-col w-48 shrink-0 border-r border-gray-200 overflow-hidden bg-white">
        {/* Header */}
        <div className="flex items-center px-3 py-1.5 border-b border-gray-200 shrink-0 bg-gray-50">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Settings</span>
        </div>

        {/* Section nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={(): void => handleSelectSection(section)}
              className={[
                'w-full text-left px-4 py-2 text-sm transition-colors',
                activeSection === section.id
                  ? 'bg-choco-accent/10 text-choco-accent font-medium border-r-2 border-choco-accent'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              ].join(' ')}
            >
              {section.label}
            </button>
          ))}
        </nav>

        {/* Footer: save/revert/cancel */}
        <div className="border-t border-gray-200 px-3 py-3 shrink-0">
          {saveError && <p className="text-xs text-red-600 mb-2">{saveError}</p>}
          <div className="flex flex-col gap-1.5">
            {isDirty && (
              <button
                type="button"
                onClick={revert}
                disabled={isSaving}
                className="w-full px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Revert
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="w-full px-3 py-1.5 text-xs bg-choco-accent text-white rounded-md hover:bg-choco-accent/90 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Right: cascade columns */}
      {cascadeColumns.length > 0 ? (
        <CascadeContainer columns={cascadeColumns} onPopTo={handlePopTo} rootLabel="Settings" />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">Select a section</div>
      )}
    </div>
  );
}
