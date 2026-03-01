import React, { useCallback, useMemo } from 'react';
import { EntityList, type ICascadeColumn, EntityTabLayout } from '@fgv/ts-app-shell';
import type { SessionId } from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  useTabNavigation,
  useEntityList,
  useFilteredEntities,
  SessionDetailView
} from '@fgv/chocolate-lab-ui';

import { SESSION_DESCRIPTOR, SESSION_FILTER_SPEC, type ISessionListEntry } from '../shared';

// ============================================================================
// Tab Content
// ============================================================================

export function SessionsTabContent(): React.ReactElement {
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
  // Entity List — wraps materialized sessions with composite IDs
  // ============================================================================

  const { entities: sessionEntries, selectedId } = useEntityList<ISessionListEntry, SessionId>({
    getAll: () => {
      const entries: ISessionListEntry[] = [];
      for (const [id, session] of workspace.userData.sessions.entries()) {
        entries.push({ id, session });
      }
      return entries;
    },
    compare: (a, b) => {
      // Group by: group field if present, otherwise status
      const groupA = a.session.group ?? a.session.status;
      const groupB = b.session.group ?? b.session.status;
      if (groupA !== groupB) return groupA.localeCompare(groupB);
      // Within group, sort by label or baseId
      return (a.session.label ?? a.session.baseId).localeCompare(b.session.label ?? b.session.baseId);
    },
    entityType: 'session',
    cascadeStack,
    deps: [workspace, reactiveWorkspace.version]
  });

  // ============================================================================
  // Selection Handler
  // ============================================================================

  const handleSelect = useCallback(
    (id: SessionId): void => {
      const entry: ICascadeEntry = { entityType: 'session', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  // ============================================================================
  // Cascade Columns
  // ============================================================================

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, _index) => {
      if (entry.entityType === 'session') {
        const result = workspace.userData.sessions.get(entry.entityId as SessionId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load session: {entry.entityId}</div>
          };
        }

        const session = result.value;
        return {
          key: entry.entityId,
          label: session.label ?? session.baseId,
          content: (
            <SessionDetailView
              sessionId={entry.entityId as SessionId}
              session={session}
              onClose={(): void => popCascadeTo(_index)}
            />
          )
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
            <EntityList<ISessionListEntry, SessionId>
              entities={useFilteredEntities(sessionEntries, SESSION_FILTER_SPEC)}
              descriptor={SESSION_DESCRIPTOR}
              selectedId={selectedId}
              onSelect={handleSelect}
              onDrill={collapseList}
              emptyState={{
                title: 'No Sessions',
                description: 'No production sessions found. Create one from a Library recipe.'
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
