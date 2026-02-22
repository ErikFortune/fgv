import React, { useCallback, useRef, useState } from 'react';

import { CascadeContainer, type ICascadeColumn } from '@fgv/ts-app-shell';

import { useWorkspace } from '../workspace';

import { useSettingsDraft } from './useSettingsDraft';
import { BootstrapSection } from './sections/BootstrapSection';
import { WorkspaceSection } from './sections/WorkspaceSection';
import { ScalingSection } from './sections/ScalingSection';
import { WorkflowSection } from './sections/WorkflowSection';
import { StorageSection } from './sections/StorageSection';
import { LibrarySection } from './sections/LibrarySection';
import { SecuritySection } from './sections/SecuritySection';

// ============================================================================
// Section definitions
// ============================================================================

type SettingsSection =
  | 'startup'
  | 'workspace'
  | 'scaling'
  | 'workflow'
  | 'storage'
  | 'libraries'
  | 'security';

interface ISectionDef {
  readonly id: SettingsSection;
  readonly label: string;
}

const SECTIONS: ReadonlyArray<ISectionDef> = [
  { id: 'startup', label: 'Startup' },
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
// Section list column content
// ============================================================================

function SectionListColumn({
  activeSection,
  onSelectSection
}: {
  readonly activeSection: SettingsSection | undefined;
  readonly onSelectSection: (section: ISectionDef) => void;
}): React.ReactElement {
  const [sectionFilter, setSectionFilter] = useState('');
  const filtered = SECTIONS.filter(
    (s) => sectionFilter === '' || s.label.toLowerCase().includes(sectionFilter.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 py-1.5 border-b border-gray-200 shrink-0">
        <input
          type="search"
          value={sectionFilter}
          onChange={(e): void => setSectionFilter(e.target.value)}
          placeholder="Filter…"
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-choco-accent focus:border-choco-accent"
        />
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {filtered.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={(): void => onSelectSection(section)}
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
    </div>
  );
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
  const { bootstrap, common, device, hasBootstrapChanges, updateBootstrap, updateCommon, updateDevice } =
    draft;

  function handleSquashColumns(subCols: ReadonlyArray<ICascadeColumn>): void {
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
    onSetColumns([sectionCol, ...subCols]);
  }

  switch (section) {
    case 'startup':
      return (
        <BootstrapSection
          bootstrap={bootstrap}
          onChange={updateBootstrap}
          hasRestartPending={hasBootstrapChanges}
        />
      );
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
      return (
        <StorageSection
          onSquashColumns={handleSquashColumns}
          onUpdateCommon={updateCommon}
          currentStorageTargets={common.defaultStorageTargets}
        />
      );
    case 'libraries':
      return <LibrarySection />;
    case 'security':
      return <SecuritySection />;
    default:
      return <div className="p-6 text-sm text-gray-400">Unknown section.</div>;
  }
}

// ============================================================================
// Component
// ============================================================================

export function SettingsCascadeView(props: ISettingsCascadeViewProps): React.ReactElement {
  const { onClose, onDirtyClose } = props;
  const draft = useSettingsDraft();
  const [activeSection, setActiveSection] = useState<SettingsSection | undefined>(undefined);

  // Stable ref so handlePopTo/handleSelectSection can be called without stale closures
  const handleSelectSectionRef = useRef<(section: ISectionDef) => void>(() => undefined);

  // Column 0 is always the section list; columns 1+ are section content and detail panels
  const [detailColumns, setDetailColumns] = useState<ReadonlyArray<ICascadeColumn>>([]);

  // depth 0 = section list only; depth 1+ = section list + detail columns
  const handlePopTo = useCallback((depth: number): void => {
    if (depth <= 1) {
      setActiveSection(undefined);
      setDetailColumns([]);
    } else {
      setDetailColumns((prev) => prev.slice(0, depth - 1));
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
    setDetailColumns([
      {
        key: section.id,
        label: section.label,
        content: (
          <SectionContent
            section={section.id}
            draft={resolvedDraft}
            sectionKey={section.id}
            sectionLabel={section.label}
            onSetColumns={setDetailColumns}
          />
        )
      }
    ]);
  }

  // Keep the ref current so handlePopTo always calls the latest handleSelectSection
  handleSelectSectionRef.current = handleSelectSection;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar: full-width, above sidebar+cascade */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 border-b border-gray-200 bg-gray-50 shrink-0">
        <div className="flex-1" />
        {saveError && <span className="text-xs text-red-600">{saveError}</span>}
        {isDirty && (
          <button
            type="button"
            onClick={revert}
            disabled={isSaving}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Revert
          </button>
        )}
        <button
          type="button"
          onClick={handleClose}
          disabled={isSaving}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors text-gray-600 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors text-white bg-choco-primary hover:bg-choco-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <CascadeContainer
        columns={[
          {
            key: '__sections__',
            label: 'Settings',
            content: (
              <SectionListColumn
                activeSection={activeSection}
                onSelectSection={(s): void => handleSelectSectionRef.current(s)}
              />
            )
          },
          ...detailColumns
        ]}
        onPopTo={handlePopTo}
        rootLabel="Settings"
      />
    </div>
  );
}
