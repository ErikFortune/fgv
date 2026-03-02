import React, { useCallback, useMemo, useState } from 'react';
import { EntityList, type ICascadeColumn, EntityTabLayout } from '@fgv/ts-app-shell';
import {
  AiAssist,
  Entities,
  Helpers,
  type BaseIngredientId,
  type BaseProcedureId,
  type FillingId,
  type SessionId,
  type ConfectionId,
  type FillingRecipeVariationSpec,
  LibraryRuntime
} from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  type CascadeEntityType,
  useTabNavigation,
  useEntityList,
  useFilteredEntities,
  useMutableCollection,
  FillingDetail,
  SessionDetailView,
  useSessionActions,
  CreateSessionPanel,
  EntityCreateForm,
  type ISessionRecipeSelection,
  type IRecipeSwapRequest
} from '@fgv/chocolate-lab-ui';

import {
  SESSION_DESCRIPTOR,
  SESSION_FILTER_SPEC,
  type ISessionListEntry,
  slugify,
  createBlankIngredientEntity,
  createBlankRawProcedureEntity
} from '../shared';

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
          selection.fillingId as FillingId,
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

  const handleOpenFillingRecipeFromSession = useCallback(
    (sessionEntry: ICascadeEntry, fillingId: FillingId, variationSpec: FillingRecipeVariationSpec): void => {
      squashCascade([
        sessionEntry,
        {
          entityType: 'filling',
          entityId: fillingId,
          mode: 'view',
          prefillName: variationSpec
        }
      ]);
    },
    [squashCascade]
  );

  const handleCancelCreate = useCallback((): void => {
    squashCascade([]);
  }, [squashCascade]);

  // ============================================================================
  // Create Entity from Session (on-blur cascade)
  // ============================================================================

  const handleRequestCreateEntity = useCallback(
    (sessionEntry: ICascadeEntry, entityType: CascadeEntityType, prefillName: string): void => {
      squashCascade([sessionEntry, { entityType, entityId: '__new__', mode: 'create', prefillName }]);
    },
    [squashCascade]
  );

  // ============================================================================
  // Create Entity Handlers (from on-blur cascade)
  // ============================================================================

  const [newProcedureName, setNewProcedureName] = useState('');

  const mutableIngredientCollectionId = useMutableCollection(
    workspace.data.entities.ingredients.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.ingredients
  );

  const mutableProcedureCollectionId = useMutableCollection(
    workspace.data.entities.procedures.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.procedures
  );

  const handleIngredientCreated = useCallback(
    (entity: Entities.Ingredients.IngredientEntity, _source: 'manual' | 'ai'): void => {
      if (!mutableIngredientCollectionId) return;
      const baseId = entity.baseId as BaseIngredientId;
      const colResult = workspace.data.entities.ingredients.collections.get(mutableIngredientCollectionId);
      if (colResult.isFailure() || !colResult.value.isMutable) return;
      const setResult = colResult.value.items.set(baseId, entity);
      if (setResult.isFailure()) return;
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      // Pop the create column, leaving the session column
      const sessionEntry = cascadeStack.find((e) => e.entityType === 'session' && e.mode === 'view');
      if (sessionEntry) {
        squashCascade([sessionEntry]);
      }
    },
    [mutableIngredientCollectionId, workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  const handleProcedureCreated = useCallback((): void => {
    const trimmed = newProcedureName.trim();
    if (!trimmed || !mutableProcedureCollectionId) return;
    const baseId = slugify(trimmed) as BaseProcedureId;
    const entity = createBlankRawProcedureEntity(baseId, trimmed);
    const colResult = workspace.data.entities.procedures.collections.get(mutableProcedureCollectionId);
    if (colResult.isFailure() || !colResult.value.isMutable) return;
    const setResult = colResult.value.items.set(baseId, entity);
    if (setResult.isFailure()) return;
    workspace.data.clearCache();
    reactiveWorkspace.notifyChange();
    setNewProcedureName('');
    // Pop the create column, leaving the session column
    const sessionEntry = cascadeStack.find((e) => e.entityType === 'session' && e.mode === 'view');
    if (sessionEntry) {
      squashCascade([sessionEntry]);
    }
  }, [
    newProcedureName,
    mutableProcedureCollectionId,
    workspace,
    reactiveWorkspace,
    cascadeStack,
    squashCascade
  ]);

  const handleCancelCreateEntity = useCallback((): void => {
    setNewProcedureName('');
    const sessionEntry = cascadeStack.find((e) => e.entityType === 'session' && e.mode === 'view');
    if (sessionEntry) {
      squashCascade([sessionEntry]);
    }
  }, [cascadeStack, squashCascade]);

  // ============================================================================
  // Recipe Swap Handler
  // ============================================================================

  const handleRecipeSwap = useCallback(
    (request: IRecipeSwapRequest): void => {
      if (!sessionActions.defaultCollectionId) {
        workspace.data.logger.error('Cannot swap recipe: no mutable collection available');
        return;
      }

      // Both variation swap and recipe change create a new session for MVP.
      // Future: variation swap could replace in-place.
      const result = sessionActions.createFillingSession(request.variationId, {
        collectionId: sessionActions.defaultCollectionId
      });
      if (result.isSuccess()) {
        squashCascade([{ entityType: 'session', entityId: result.value, mode: 'view' }]);
      }
    },
    [sessionActions, workspace, squashCascade]
  );

  // ============================================================================
  // Cascade Columns
  // ============================================================================

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, _index) => {
      // Ingredient create (from on-blur cascade)
      if (entry.entityType === 'ingredient' && entry.mode === 'create') {
        return {
          key: '__new__ingredient',
          label: 'New Ingredient',
          content: (
            <EntityCreateForm<Entities.Ingredients.IngredientEntity>
              slugify={slugify}
              buildPrompt={AiAssist.buildIngredientAiPrompt}
              convert={(
                from: unknown
              ): ReturnType<typeof Entities.Ingredients.Converters.ingredientEntity.convert> =>
                Entities.Ingredients.Converters.ingredientEntity.convert(from)
              }
              makeBlank={(name: string, id: string): Entities.Ingredients.IngredientEntity =>
                createBlankIngredientEntity(id as BaseIngredientId, name)
              }
              onCreate={handleIngredientCreated}
              onCancel={handleCancelCreateEntity}
              namePlaceholder="e.g. Callebaut 811 Dark"
              entityLabel="Ingredient"
              initialName={entry.prefillName}
            />
          )
        };
      }

      // Procedure create (from on-blur cascade)
      if (entry.entityType === 'procedure' && entry.mode === 'create') {
        return {
          key: '__new__procedure',
          label: 'New Procedure',
          content: (
            <div className="p-4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">New Procedure</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Tempering"
                  value={newProcedureName || entry.prefillName || ''}
                  onChange={(e): void => setNewProcedureName(e.target.value)}
                  onKeyDown={(e): void => {
                    if (e.key === 'Enter') handleProcedureCreated();
                    if (e.key === 'Escape') handleCancelCreateEntity();
                  }}
                  autoFocus
                />
                {(newProcedureName.trim() || entry.prefillName) && (
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    ID: {slugify((newProcedureName || entry.prefillName || '').trim())}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleProcedureCreated}
                  disabled={!(newProcedureName.trim() || entry.prefillName)}
                  className="px-4 py-2 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={handleCancelCreateEntity}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )
        };
      }

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
              onRequestCreateEntity={(entityType, prefillName): void =>
                handleRequestCreateEntity(entry, entityType, prefillName)
              }
              onRecipeSwap={handleRecipeSwap}
              onOpenFillingRecipe={(fillingId: FillingId, variationSpec: FillingRecipeVariationSpec): void =>
                handleOpenFillingRecipeFromSession(entry, fillingId, variationSpec)
              }
            />
          )
        };
      }

      if (entry.entityType === 'filling') {
        const result = workspace.data.fillings.get(entry.entityId as FillingId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load filling: {entry.entityId}</div>
          };
        }

        return {
          key: `${entry.entityId}:${entry.prefillName ?? ''}`,
          label: result.value.name,
          content: (
            <FillingDetail
              filling={result.value}
              defaultVariationSpec={entry.prefillName as FillingRecipeVariationSpec | undefined}
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
    handleCancelCreate,
    handleRequestCreateEntity,
    handleIngredientCreated,
    handleProcedureCreated,
    handleCancelCreateEntity,
    handleRecipeSwap,
    handleOpenFillingRecipeFromSession,
    newProcedureName
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
              data-testid="sessions-new-session-button"
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
