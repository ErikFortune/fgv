import React, { useCallback, useMemo } from 'react';
import { EntityList, type ICascadeColumn, EntityTabLayout } from '@fgv/ts-app-shell';
import type { JournalId } from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  useTabNavigation,
  useEntityList,
  useFilteredEntities,
  JournalEntryDetail
} from '@fgv/chocolate-lab-ui';

import { JOURNAL_DESCRIPTOR, JOURNAL_FILTER_SPEC, type IJournalListEntry, collectionFromId } from '../shared';

// ============================================================================
// Tab Content
// ============================================================================

export function JournalTabContent(): React.ReactElement {
  const {
    workspace,
    reactiveWorkspace,
    squashCascade,
    popCascadeTo,
    cascadeStack,
    listCollapsed,
    collapseList
  } = useTabNavigation();

  // ============================================================================
  // Entity List — wraps materialized journal entries with composite IDs
  // ============================================================================

  const { entities: journalEntries, selectedId } = useEntityList<IJournalListEntry, JournalId>({
    getAll: () => {
      const entries: IJournalListEntry[] = [];
      for (const [id, entry] of workspace.userData.journals.entries()) {
        entries.push({ id, entry });
      }
      return entries;
    },
    compare: (a, b) => {
      // Newest first
      return b.entry.timestamp.localeCompare(a.entry.timestamp);
    },
    entityType: 'journal-entry',
    cascadeStack,
    deps: [workspace, reactiveWorkspace.version]
  });

  // ============================================================================
  // Selection Handler
  // ============================================================================

  const handleSelect = useCallback(
    (id: JournalId): void => {
      const entry: ICascadeEntry = { entityType: 'journal-entry', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  // ============================================================================
  // Cascade Columns
  // ============================================================================

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, _index) => {
      if (entry.entityType === 'journal-entry') {
        const result = workspace.userData.journals.get(entry.entityId as JournalId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load journal entry: {entry.entityId}</div>
          };
        }

        const journalEntry = result.value;
        return {
          key: entry.entityId,
          label: journalEntry.recipe.name,
          content: <JournalEntryDetail entry={journalEntry} onClose={(): void => popCascadeTo(_index)} />
        };
      }

      return {
        key: entry.entityId,
        label: entry.entityId,
        content: <div className="p-4 text-gray-500">Unknown entity type: {entry.entityType}</div>
      };
    });
  }, [cascadeStack, workspace, popCascadeTo]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <EntityTabLayout
      list={
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <EntityList<IJournalListEntry, JournalId>
              entities={useFilteredEntities(journalEntries, JOURNAL_FILTER_SPEC)}
              descriptor={JOURNAL_DESCRIPTOR}
              selectedId={selectedId}
              onSelect={handleSelect}
              onDrill={collapseList}
              emptyState={{
                title: 'No Journal Entries',
                description: 'Journal entries are created when you commit a session.'
              }}
            />
          </div>
        </div>
      }
      cascadeColumns={cascadeColumns}
      onPopTo={popCascadeTo}
      listCollapsed={listCollapsed}
      onListCollapse={collapseList}
    />
  );
}
