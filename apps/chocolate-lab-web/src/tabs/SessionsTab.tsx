import React, { useCallback, useMemo } from 'react';
import { EntityList, type ICascadeColumn, EntityTabLayout } from '@fgv/ts-app-shell';
import {
  Helpers,
  type SessionId,
  type ConfectionId,
  type FillingRecipeVariationSpec
} from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  useTabNavigation,
  useEntityList,
  useFilteredEntities,
  useMutableCollection,
  SessionDetailView,
  useSessionActions,
  CreateSessionPanel,
  type ISessionRecipeSelection
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

  const sessionActions = useSessionActions();

  const mutableCollectionId = useMutableCollection(
    workspace.userData.entities.sessions.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.sessions
  );

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
  // New Session
  // ============================================================================

  const handleNewSession = useCallback((): void => {
    const entry: ICascadeEntry = { entityType: 'session', entityId: '__new__', mode: 'create' };
    squashCascade([entry]);
  }, [squashCascade]);

  const availableConfections = useMemo(
    () => Array.from(workspace.data.confections.values()).sort((a, b) => a.name.localeCompare(b.name)),
    [workspace, reactiveWorkspace.version]
  );

  const availableFillings = useMemo(
    () => Array.from(workspace.data.fillings.values()).sort((a, b) => a.name.localeCompare(b.name)),
    [workspace, reactiveWorkspace.version]
  );

  const handleCreateSession = useCallback(
    (selection: ISessionRecipeSelection, label: string, slug: string): void => {
      if (!sessionActions.defaultCollectionId) {
        workspace.data.logger.error('Cannot create session: no mutable collection available');
        return;
      }

      if (selection.type === 'confection') {
        const result = sessionActions.createConfectionSession(selection.confectionId as ConfectionId, {
          collectionId: sessionActions.defaultCollectionId,
          label,
          slug
        });
        if (result.isSuccess()) {
          squashCascade([{ entityType: 'session', entityId: result.value, mode: 'view' }]);
        }
      } else {
        const variationId = Helpers.createFillingRecipeVariationId(
          selection.fillingId,
          selection.variationSpec as FillingRecipeVariationSpec
        );
        const result = sessionActions.createFillingSession(variationId, {
          collectionId: sessionActions.defaultCollectionId,
          label,
          slug
        });
        if (result.isSuccess()) {
          squashCascade([{ entityType: 'session', entityId: result.value, mode: 'view' }]);
        }
      }
    },
    [sessionActions, workspace, squashCascade]
  );

  const handleCancelCreate = useCallback((): void => {
    squashCascade([]);
  }, [squashCascade]);

  // ============================================================================
  // Cascade Columns
  // ============================================================================

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, _index) => {
      if (entry.entityType === 'session') {
        // Create mode
        if (entry.mode === 'create') {
          return {
            key: '__new__',
            label: 'New Session',
            content: (
              <CreateSessionPanel
                createInfo={entry.createSessionInfo}
                availableConfections={availableConfections}
                availableFillings={availableFillings}
                onConfirm={handleCreateSession}
                onCancel={handleCancelCreate}
              />
            )
          };
        }

        // View mode
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
  }, [
    cascadeStack,
    workspace,
    popCascadeTo,
    availableConfections,
    availableFillings,
    handleCreateSession,
    handleCancelCreate
  ]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <EntityTabLayout
      list={
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
            <button
              onClick={handleNewSession}
              disabled={mutableCollectionId === undefined}
              title={mutableCollectionId === undefined ? 'No mutable collection available' : undefined}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + New Session
            </button>
          </div>
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
