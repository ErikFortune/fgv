import React, { useCallback, useMemo, useState } from 'react';
import { EntityList, type ICascadeColumn, EntityTabLayout, useMessages } from '@fgv/ts-app-shell';
import {
  AiAssist,
  Entities,
  Helpers,
  UserLibrary,
  type BaseFillingId,
  type BaseIngredientId,
  type BaseProcedureId,
  type FillingId,
  type IngredientId,
  type ProcedureId,
  type SessionId,
  type SlotId,
  type ConfectionId,
  type FillingRecipeVariationSpec,
  LibraryRuntime,
  type Entities as EntitiesNS
} from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  type CascadeEntityType,
  type RecipeSaveOption,
  useTabNavigation,
  useEntityList,
  useEntityMutation,
  useFilteredEntities,
  useMutableCollection,
  FillingDetail,
  FillingSessionPanel,
  IngredientDetail,
  ProcedureDetail,
  SessionDetailView,
  useSessionActions,
  CreateSessionPanel,
  CommitSessionDialog,
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
// Recipe Save Helper
// ============================================================================

type MessageFn = (level: 'success' | 'error' | 'info', message: string) => void;

interface IFillingMutation {
  readonly saveEntity: (params: {
    readonly compositeId: FillingId;
    readonly baseId: BaseFillingId;
    readonly entity: Entities.Fillings.IFillingRecipeEntity;
    readonly persistToDisk?: boolean;
  }) => Promise<import('@fgv/ts-utils').Result<FillingId>>;
}

/**
 * Saves recipe changes from a session's produced state back to the entity library.
 *
 * For 'new-variation': creates a new variation entity from produced state, adds it to the recipe.
 * For 'alternatives': merges produced ingredient choices as alternatives into the existing variation.
 *
 * @returns `true` if the save succeeded, `false` if it failed (error reported via addMessage)
 */
async function saveRecipeFromSession(
  session: UserLibrary.Session.EditingSession,
  saveOption: RecipeSaveOption,
  fillingMutation: IFillingMutation,
  addMessage: MessageFn
): Promise<boolean> {
  const recipeEntity = session.baseRecipe.fillingRecipe.entity;

  // Generate a new variation spec for the save
  const existingSpecs = recipeEntity.variations.map((v) => v.variationSpec);
  const specResult = Helpers.generateFillingVariationSpec(existingSpecs);
  if (specResult.isFailure()) {
    addMessage('error', `Failed to generate variation spec: ${specResult.message}`);
    return false;
  }
  const newSpec = specResult.value;

  // Get the save result (variation entity + journal entry) from the session
  const saveResult =
    saveOption === 'new-variation'
      ? session.saveAsNewVariation({ variationSpec: newSpec })
      : session.saveAsAlternatives({ variationSpec: newSpec });

  if (saveResult.isFailure()) {
    addMessage('error', `Recipe save failed: ${saveResult.message}`);
    return false;
  }

  const { variationEntity } = saveResult.value;
  if (!variationEntity) {
    addMessage('error', 'Recipe save produced no variation entity');
    return false;
  }

  // Create an EditedFillingRecipe wrapper and integrate the variation
  const wrapperResult = LibraryRuntime.EditedFillingRecipe.create(recipeEntity);
  if (wrapperResult.isFailure()) {
    addMessage('error', `Failed to create recipe wrapper: ${wrapperResult.message}`);
    return false;
  }

  const wrapper = wrapperResult.value;
  const integrationResult =
    saveOption === 'new-variation'
      ? wrapper.addVariation(variationEntity)
      : wrapper.replaceVariation(newSpec, variationEntity);

  if (integrationResult.isFailure()) {
    addMessage('error', `Failed to integrate variation: ${integrationResult.message}`);
    return false;
  }

  // Persist the updated recipe entity
  const fillingId = session.baseRecipe.fillingId;
  const baseId = recipeEntity.baseId;

  const persistResult = await fillingMutation.saveEntity({
    compositeId: fillingId,
    baseId: baseId as BaseFillingId,
    entity: wrapper.current,
    persistToDisk: true
  });

  if (persistResult.isFailure()) {
    addMessage('error', `Failed to persist recipe: ${persistResult.message}`);
    return false;
  }

  return true;
}

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
  const { addMessage } = useMessages();

  const fillingMutation = useEntityMutation<Entities.Fillings.IFillingRecipeEntity, BaseFillingId, FillingId>(
    {
      saveToCollection: (collectionId, baseId, entity) =>
        workspace.data.entities.saveFillingRecipe(collectionId, baseId, entity),
      entityLabel: 'filling'
    }
  );

  // ============================================================================
  // Commit Dialog State
  // ============================================================================

  const [commitSessionId, setCommitSessionId] = useState<SessionId | undefined>(undefined);

  const commitSession = useMemo(() => {
    if (!commitSessionId) return undefined;
    const result = workspace.userData.sessions.get(commitSessionId);
    if (result.isFailure() || result.value.sessionType !== 'filling') return undefined;
    return result.value as UserLibrary.Session.EditingSession;
  }, [commitSessionId, workspace, reactiveWorkspace.version]);

  const handleCommitRequest = useCallback((sessionId: SessionId): void => {
    setCommitSessionId(sessionId);
  }, []);

  const handleCommitConfirm = useCallback(
    async (saveOption: RecipeSaveOption): Promise<void> => {
      if (!commitSessionId || !sessionActions.defaultJournalCollectionId) {
        addMessage('error', 'Cannot commit: no journal collection available');
        return;
      }

      // Step 1: Recipe save (if requested)
      if (saveOption !== 'journal-only' && commitSession) {
        const recipeSaveResult = await saveRecipeFromSession(
          commitSession,
          saveOption,
          fillingMutation,
          addMessage
        );
        if (!recipeSaveResult) {
          return; // Error already reported
        }
      }

      // Step 2: Journal commit + session status update
      const result = await sessionActions.commitFillingSession(
        commitSessionId,
        sessionActions.defaultJournalCollectionId
      );
      if (result.isSuccess()) {
        const saveLabel = saveOption === 'journal-only' ? '' : ' (recipe changes saved)';
        addMessage('success', `Session committed to journal: ${result.value.journalId}${saveLabel}`);
        setCommitSessionId(undefined);
      } else {
        addMessage('error', `Commit failed: ${result.message}`);
      }
    },
    [commitSessionId, commitSession, sessionActions, fillingMutation, addMessage]
  );

  const handleCommitCancel = useCallback((): void => {
    setCommitSessionId(undefined);
  }, []);

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

  const handleDelete = useCallback(
    async (id: SessionId): Promise<void> => {
      const result = await sessionActions.deleteSession(id);
      if (result.isSuccess()) {
        // If the deleted session is currently selected, clear the cascade
        if (selectedId === id) {
          squashCascade([]);
        }
      }
    },
    [sessionActions, selectedId, squashCascade]
  );

  const canDelete = useCallback(
    (id: SessionId): boolean => {
      const collectionId = Helpers.getSessionCollectionId(id);
      const collection = workspace.userData.entities.sessions.collections.get(collectionId);
      return collection.isSuccess() && collection.value.isMutable;
    },
    [workspace]
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
    async (
      selection: ISessionRecipeSelection,
      label: string,
      slug: string,
      initialYield?: EntitiesNS.Confections.BufferedConfectionYield
    ): Promise<void> => {
      if (!sessionActions.defaultCollectionId) {
        workspace.data.logger.error('Cannot create session: no mutable collection available');
        return;
      }

      if (selection.type === 'confection') {
        const result = await sessionActions.createConfectionSession(selection.confectionId as ConfectionId, {
          collectionId: sessionActions.defaultCollectionId,
          label,
          slug,
          params: initialYield ? { initialYield } : undefined
        });
        if (result.isSuccess()) {
          squashCascade([{ entityType: 'session', entityId: result.value, mode: 'view' }]);
        } else {
          addMessage('error', `Failed to create session: ${result.message}`);
        }
      } else {
        const variationId = Helpers.createFillingRecipeVariationId(
          selection.fillingId as FillingId,
          selection.variationSpec as FillingRecipeVariationSpec
        );
        const result = await sessionActions.createFillingSession(variationId, {
          collectionId: sessionActions.defaultCollectionId,
          label,
          slug
        });
        if (result.isSuccess()) {
          squashCascade([{ entityType: 'session', entityId: result.value, mode: 'view' }]);
        } else {
          addMessage('error', `Failed to create session: ${result.message}`);
        }
      }
    },
    [sessionActions, addMessage, workspace, squashCascade]
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

  const handleBrowseIngredientFromSession = useCallback(
    (sessionEntry: ICascadeEntry, ingredientId: IngredientId): void => {
      squashCascade([sessionEntry, { entityType: 'ingredient', entityId: ingredientId, mode: 'view' }]);
    },
    [squashCascade]
  );

  const handleBrowseProcedureFromSession = useCallback(
    (sessionEntry: ICascadeEntry, procedureId: ProcedureId): void => {
      squashCascade([sessionEntry, { entityType: 'procedure', entityId: procedureId, mode: 'view' }]);
    },
    [squashCascade]
  );

  const handleSelectFillingSlot = useCallback(
    (sessionEntry: ICascadeEntry, slotId: SlotId, label: string): void => {
      squashCascade([
        sessionEntry,
        {
          entityType: 'session',
          entityId: `${sessionEntry.entityId}::${String(slotId)}`,
          mode: 'view',
          sourceConfectionId: sessionEntry.entityId,
          sourceSlotId: String(slotId),
          prefillName: label
        }
      ]);
    },
    [squashCascade]
  );

  const handleBrowseIngredientFromEmbeddedSession = useCallback(
    (embeddedEntry: ICascadeEntry, ingredientId: IngredientId): void => {
      if (!embeddedEntry.sourceConfectionId) {
        return;
      }
      const parentEntry: ICascadeEntry = {
        entityType: 'session',
        entityId: embeddedEntry.sourceConfectionId,
        mode: 'view'
      };
      squashCascade([
        parentEntry,
        embeddedEntry,
        { entityType: 'ingredient', entityId: ingredientId, mode: 'view' }
      ]);
    },
    [squashCascade]
  );

  const handleBrowseProcedureFromEmbeddedSession = useCallback(
    (embeddedEntry: ICascadeEntry, procedureId: ProcedureId): void => {
      if (!embeddedEntry.sourceConfectionId) {
        return;
      }
      const parentEntry: ICascadeEntry = {
        entityType: 'session',
        entityId: embeddedEntry.sourceConfectionId,
        mode: 'view'
      };
      squashCascade([
        parentEntry,
        embeddedEntry,
        { entityType: 'procedure', entityId: procedureId, mode: 'view' }
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
    async (request: IRecipeSwapRequest): Promise<void> => {
      if (!sessionActions.defaultCollectionId) {
        workspace.data.logger.error('Cannot swap recipe: no mutable collection available');
        return;
      }

      // Both variation swap and recipe change create a new session for MVP.
      // Future: variation swap could replace in-place.
      const result = await sessionActions.createFillingSession(request.variationId, {
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

        if (entry.sourceConfectionId && entry.sourceSlotId) {
          const parentResult = workspace.userData.sessions.get(entry.sourceConfectionId as SessionId);
          if (parentResult.isFailure() || parentResult.value.sessionType !== 'confection') {
            return {
              key: entry.entityId,
              label: entry.prefillName ?? entry.entityId,
              content: <div className="p-4 text-red-500">Failed to load embedded filling session.</div>
            };
          }

          const embedded = parentResult.value.getFillingSession(entry.sourceSlotId as SlotId);
          if (!embedded) {
            return {
              key: entry.entityId,
              label: entry.prefillName ?? entry.entityId,
              content: <div className="p-4 text-red-500">Failed to find filling session for slot.</div>
            };
          }

          const embeddedLabel =
            entry.prefillName ?? `${embedded.baseRecipe.fillingRecipe.name} (${entry.sourceSlotId})`;

          return {
            key: entry.entityId,
            label: embeddedLabel,
            content: (
              <FillingSessionPanel
                session={embedded}
                embeddedLabel={embeddedLabel}
                embeddedParentSessionId={entry.sourceConfectionId as SessionId}
                onRequestCreateEntity={(entityType, prefillName): void =>
                  handleRequestCreateEntity(entry, entityType, prefillName)
                }
                onBrowseIngredient={(ingredientId: IngredientId): void =>
                  handleBrowseIngredientFromEmbeddedSession(entry, ingredientId)
                }
                onBrowseProcedure={(procedureId: ProcedureId): void =>
                  handleBrowseProcedureFromEmbeddedSession(entry, procedureId)
                }
                onSaveEmbedded={async (): Promise<void> => {
                  await sessionActions.saveSession(entry.sourceConfectionId as SessionId);
                }}
                onClose={(): void => popCascadeTo(_index)}
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
              onBrowseIngredient={(ingredientId: IngredientId): void =>
                handleBrowseIngredientFromSession(entry, ingredientId)
              }
              onBrowseProcedure={(procedureId: ProcedureId): void =>
                handleBrowseProcedureFromSession(entry, procedureId)
              }
              onSelectFillingSlot={(slotId: SlotId, label: string): void =>
                handleSelectFillingSlot(entry, slotId, label)
              }
              onCommit={(): void => handleCommitRequest(entry.entityId as SessionId)}
            />
          )
        };
      }

      if (entry.entityType === 'ingredient' && entry.mode === 'view') {
        const result = workspace.data.ingredients.get(entry.entityId as IngredientId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load ingredient: {entry.entityId}</div>
          };
        }

        return {
          key: entry.entityId,
          label: result.value.name,
          content: <IngredientDetail ingredient={result.value} onClose={(): void => popCascadeTo(_index)} />
        };
      }

      if (entry.entityType === 'procedure' && entry.mode === 'view') {
        const result = workspace.data.procedures.get(entry.entityId as ProcedureId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load procedure: {entry.entityId}</div>
          };
        }

        return {
          key: entry.entityId,
          label: result.value.name,
          content: <ProcedureDetail procedure={result.value} onClose={(): void => popCascadeTo(_index)} />
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
    handleBrowseIngredientFromSession,
    handleBrowseProcedureFromSession,
    handleSelectFillingSlot,
    handleBrowseIngredientFromEmbeddedSession,
    handleBrowseProcedureFromEmbeddedSession,
    sessionActions,
    newProcedureName
  ]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
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
                onDelete={handleDelete}
                canDelete={canDelete}
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

      {/* Commit dialog */}
      {commitSession && (
        <CommitSessionDialog
          isOpen={commitSessionId !== undefined}
          session={commitSession}
          onCommit={handleCommitConfirm}
          onCancel={handleCommitCancel}
        />
      )}
    </>
  );
}
