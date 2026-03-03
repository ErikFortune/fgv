import React, { useCallback, useMemo, useRef, useState } from 'react';
import { CursorArrowRaysIcon } from '@heroicons/react/20/solid';
import {
  ConfirmDialog,
  EntityList,
  type ICascadeColumn,
  EntityTabLayout,
  type IComparisonColumn
} from '@fgv/ts-app-shell';
import { Editing, Entities, LibraryRuntime } from '@fgv/ts-chocolate';
import type { BaseProcedureId, CollectionId, TaskId, ProcedureId } from '@fgv/ts-chocolate';
import type { Result } from '@fgv/ts-utils';
import {
  type ICascadeEntry,
  type IReferenceScanResult,
  useTabNavigation,
  useEntityList,
  useMutableCollection,
  useCanDeleteFromCollections,
  useEntityActions,
  createSetInMutableCollection,
  useEntityMutation,
  ProcedureDetail,
  ProcedureEditView,
  ProcedurePreviewPanel,
  getWritableCollectionOptions,
  useFilteredEntities,
  useClipboardJsonImport,
  useSquashAt,
  useProcedureEditSession,
  useNavigationStore,
  ReadOnlyEditGate
} from '@fgv/chocolate-lab-ui';

import {
  PROCEDURE_DESCRIPTOR,
  PROCEDURE_FILTER_SPEC,
  slugify,
  createBlankRawProcedureEntity
} from '../shared';

export function ProceduresTabContent(): React.ReactElement {
  const {
    workspace,
    reactiveWorkspace,
    squashCascade,
    popCascadeTo,
    cascadeStack,
    listCollapsed,
    collapseList,
    compareMode,
    compareIds,
    toggleCompareMode,
    toggleCompareId,
    showingComparison,
    startComparison,
    exitComparison
  } = useTabNavigation();

  const editingRef = useRef<{ id: ProcedureId; wrapper: LibraryRuntime.EditedProcedure } | undefined>(
    undefined
  );
  const [previewVersion, setPreviewVersion] = useState(0);
  const [procedureToDelete, setProcedureToDelete] = useState<{
    id: ProcedureId;
    name: string;
    references: IReferenceScanResult;
  } | null>(null);
  const entityActions = useEntityActions();
  const updateCascadeEntryChanges = useNavigationStore((s) => s.updateCascadeEntryChanges);

  const [newProcedureName, setNewProcedureName] = useState('');

  const mutableCollectionId = useMutableCollection(
    workspace.data.entities.procedures.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.procedures
  );

  const writableProcedureCollections = useMemo(
    (): ReadonlyArray<{ id: string; label?: string }> =>
      getWritableCollectionOptions(
        workspace.data.entities.procedures.collections.entries(),
        workspace.settings?.getResolvedSettings().defaultTargets.procedures
      ),
    [workspace, reactiveWorkspace.version]
  );

  const canDeleteProcedure = useCanDeleteFromCollections(workspace.data.entities.procedures.collections, [
    workspace,
    reactiveWorkspace.version
  ]);

  type ProcedureCollectionResult = ReturnType<typeof workspace.data.entities.procedures.collections.get>;
  type ProcedureCollectionEntry = Exclude<ProcedureCollectionResult['value'], undefined>;
  type ProcedureMutableCollectionEntry = ProcedureCollectionEntry & {
    readonly items: {
      set: (id: BaseProcedureId, entity: Entities.Procedures.IProcedureEntity) => Result<unknown>;
    };
  };

  const procedureMutation = useEntityMutation<
    Entities.Procedures.IProcedureEntity,
    BaseProcedureId,
    ProcedureId
  >({
    setInMutableCollection: createSetInMutableCollection<
      Entities.Procedures.IProcedureEntity,
      BaseProcedureId,
      ProcedureCollectionEntry,
      ProcedureMutableCollectionEntry
    >({
      getCollection: (collectionId: CollectionId) =>
        workspace.data.entities.procedures.collections.get(collectionId),
      isMutable: (entry: ProcedureCollectionEntry): entry is ProcedureMutableCollectionEntry =>
        entry.isMutable && 'set' in entry.items,
      setEntity: (
        entry: ProcedureMutableCollectionEntry,
        baseId: BaseProcedureId,
        entity: Entities.Procedures.IProcedureEntity
      ) => entry.items.set(baseId, entity),
      entityLabel: 'procedure'
    }),
    entityLabel: 'procedure',
    getEditableCollection: (collectionId: CollectionId) =>
      workspace.data.entities.getEditableProceduresEntityCollection(collectionId, workspace.keyStore)
  });

  const { entities: procedures, selectedId } = useEntityList<LibraryRuntime.IProcedure, ProcedureId>({
    getAll: () => workspace.data.procedures.values(),
    compare: (a, b) => a.name.localeCompare(b.name),
    entityType: 'procedure',
    cascadeStack,
    deps: [workspace, reactiveWorkspace.version]
  });

  const availableTasks = useMemo<ReadonlyArray<LibraryRuntime.ITask>>(() => {
    return Array.from(workspace.data.tasks.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const procedureSession = useProcedureEditSession({
    procedureRef: editingRef,
    availableTasks,
    cascadeStack,
    squashCascade,
    slugify,
    onMutate: (): void => setPreviewVersion((v) => v + 1)
  });

  const handleSelect = useCallback(
    (id: ProcedureId): void => {
      const entry: ICascadeEntry = { entityType: 'procedure', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  const handleRequestDelete = useCallback(
    (id: ProcedureId): void => {
      const result = workspace.data.procedures.get(id);
      const name = result.isSuccess() ? result.value.name : id;
      const references = entityActions.scanReferences(id);
      setProcedureToDelete({ id, name, references });
    },
    [workspace, entityActions]
  );

  const handleConfirmDelete = useCallback((): void => {
    if (procedureToDelete) {
      entityActions.deleteEntity(procedureToDelete.id);
      if (cascadeStack.some((e) => e.entityId === procedureToDelete.id)) {
        squashCascade([]);
      }
    }
    setProcedureToDelete(null);
  }, [procedureToDelete, entityActions, cascadeStack, squashCascade]);

  const handleCancelDelete = useCallback((): void => {
    setProcedureToDelete(null);
  }, []);

  const getOrCreateWrapper = useCallback(
    (procedure: LibraryRuntime.IProcedure): LibraryRuntime.EditedProcedure | undefined => {
      const id = procedure.id;
      if (editingRef.current?.id === id) {
        return editingRef.current.wrapper;
      }
      const result = LibraryRuntime.EditedProcedure.create(procedure.entity);
      if (result.isFailure()) {
        return undefined;
      }
      editingRef.current = { id, wrapper: result.value };
      return result.value;
    },
    []
  );

  const handleEditProcedure = useCallback(
    (entityId: string): void => {
      const idx = cascadeStack.findIndex((e) => e.entityId === entityId && e.entityType === 'procedure');
      if (idx < 0) return;
      // Truncate everything to the right of the procedure entry and switch to edit mode
      squashCascade([...cascadeStack.slice(0, idx), { ...cascadeStack[idx], mode: 'edit' as const }]);
    },
    [cascadeStack, squashCascade]
  );

  const handleCancelProcedureEdit = useCallback(
    (entityId: string): void => {
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      procedureSession.cleanup();
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'procedure' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated.filter((e) => e.entityType !== 'task' || e.mode === 'view'));
    },
    [cascadeStack, squashCascade, procedureSession]
  );

  const handleSaveProcedureAs = useCallback(
    (wrapper: LibraryRuntime.EditedProcedure): void => {
      workspace.data.logger.info(
        `Save to... requested for procedure '${wrapper.current.name}' — collection picker not yet implemented`
      );
    },
    [workspace]
  );

  const handleSaveProcedure = useCallback(
    async (wrapper: LibraryRuntime.EditedProcedure): Promise<void> => {
      const entity = wrapper.current;
      const compositeId = editingRef.current?.id;
      if (!compositeId) {
        workspace.data.logger.error('Save failed: no composite ID for procedure editing wrapper');
        return;
      }

      const validationResult = Editing.Procedures.Validators.validateProcedureEntity(entity);
      if (validationResult.isFailure()) {
        workspace.data.logger.error(`Save failed: ${validationResult.message}`);
        return;
      }

      const baseId = entity.baseId as BaseProcedureId;

      const saveResult = await procedureMutation.saveEntity({
        compositeId,
        baseId,
        entity,
        persistToDisk: true
      });
      if (saveResult.isFailure()) {
        return;
      }

      if (editingRef.current?.id === compositeId) {
        editingRef.current = undefined;
      }
      procedureSession.cleanup();
      const updated = cascadeStack.map((e) =>
        e.entityId === compositeId && e.entityType === 'procedure' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated.filter((e) => e.entityType !== 'task' || e.mode === 'view'));
    },
    [workspace, procedureMutation, cascadeStack, squashCascade, procedureSession]
  );

  const handlePreviewProcedure = useCallback(
    (entityId: string): void => {
      const withoutAnyPreview = cascadeStack.filter(
        (e) => !(e.mode === 'preview' && (e.entityType === 'procedure' || e.entityType === 'task'))
      );
      squashCascade([...withoutAnyPreview, { entityType: 'procedure', entityId, mode: 'preview' }]);
    },
    [cascadeStack, squashCascade]
  );

  const handleCloseProcedurePreview = useCallback(
    (entityId: string): void => {
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'procedure' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated.filter((e) => e.entityType !== 'task' || e.mode === 'view'));
    },
    [cascadeStack, squashCascade]
  );

  const openProcedureForEdit = useCallback(
    async (entity: Entities.Procedures.IProcedureEntity): Promise<void> => {
      const baseId = entity.baseId as BaseProcedureId;
      const createResult = await procedureMutation.createEntity({
        targetCollectionId: mutableCollectionId,
        getCompositeId: (collectionId: CollectionId, nextBaseId: BaseProcedureId) =>
          `${collectionId}.${nextBaseId}` as ProcedureId,
        baseId,
        entity,
        exists: (id: ProcedureId) => workspace.data.procedures.get(id).isSuccess(),
        persistToDisk: false
      });
      if (createResult.isFailure()) {
        return;
      }

      const compositeId = createResult.value;

      const wrapperResult = LibraryRuntime.EditedProcedure.create(entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create procedure wrapper: ${wrapperResult.message}`);
        return;
      }
      editingRef.current = { id: compositeId, wrapper: wrapperResult.value };
      squashCascade([{ entityType: 'procedure', entityId: compositeId, mode: 'edit' }]);
    },
    [workspace, mutableCollectionId, procedureMutation, squashCascade]
  );

  const handleCreateProcedure = useCallback((): void => {
    const trimmed = newProcedureName.trim();
    if (!trimmed) {
      return;
    }

    const baseId = slugify(trimmed) as BaseProcedureId;
    const entity = createBlankRawProcedureEntity(baseId, trimmed);
    setNewProcedureName('');
    void openProcedureForEdit(entity);
  }, [newProcedureName, openProcedureForEdit]);

  const handleCreateProcedureCancel = useCallback((): void => {
    setNewProcedureName('');
    squashCascade([]);
  }, [squashCascade]);

  const handleListHeaderPaste = useClipboardJsonImport<Entities.Procedures.IProcedureEntity>({
    entityLabel: 'procedure',
    convert: (from: unknown) => Entities.Procedures.Converters.procedureEntity.convert(from),
    onValid: (entity: Entities.Procedures.IProcedureEntity) => openProcedureForEdit(entity),
    onValidSuccessMessage: (entity: Entities.Procedures.IProcedureEntity) =>
      `Opened '${entity.name}' for review — save when ready`
  });

  const squashAt = useSquashAt(cascadeStack, squashCascade);

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, index) => {
      const onTaskClick = (id: TaskId): void => {
        squashAt(index, { entityType: 'task', entityId: id, mode: 'view' });
      };

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
                  value={newProcedureName}
                  onChange={(e): void => setNewProcedureName(e.target.value)}
                  onKeyDown={(e): void => {
                    if (e.key === 'Enter') {
                      handleCreateProcedure();
                    }
                    if (e.key === 'Escape') {
                      handleCreateProcedureCancel();
                    }
                  }}
                  autoFocus
                />
                {newProcedureName.trim() && (
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    ID: {slugify(newProcedureName.trim())}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateProcedure}
                  disabled={!newProcedureName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={handleCreateProcedureCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )
        };
      }

      if (entry.entityType === 'procedure') {
        const result = workspace.data.procedures.get(entry.entityId as ProcedureId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load procedure: {entry.entityId}</div>
          };
        }

        if (entry.mode === 'preview') {
          const draftEntity =
            editingRef.current?.id === entry.entityId ? editingRef.current.wrapper.current : undefined;
          return {
            key: `${entry.entityId}:preview`,
            label: `${result.value.name} (preview)`,
            content: (
              <ProcedurePreviewPanel
                procedure={result.value}
                draftEntity={draftEntity}
                availableTasks={availableTasks}
                onClose={(): void => handleCloseProcedurePreview(entry.entityId)}
              />
            )
          };
        }

        if (entry.mode === 'edit') {
          const wrapper = getOrCreateWrapper(result.value);
          if (wrapper === undefined) {
            return {
              key: entry.entityId,
              label: result.value.name,
              content: <div className="p-4 text-red-500">Failed to create editing wrapper</div>
            };
          }

          const collectionId = entry.entityId.split('.')[0] as CollectionId;
          const collectionEntry = workspace.data.entities.procedures.collections.get(collectionId);
          const isReadOnly = collectionEntry.isSuccess() && !collectionEntry.value.isMutable;

          // Read-only source: show gate instead of full editor
          if (isReadOnly) {
            return {
              key: `${entry.entityId}:edit`,
              label: result.value.name,
              content: (
                <ReadOnlyEditGate
                  entityName={result.value.name}
                  onSaveCopy={
                    mutableCollectionId
                      ? (): void => void openProcedureForEdit(result.value.entity)
                      : undefined
                  }
                  onCancel={(): void => handleCancelProcedureEdit(entry.entityId)}
                />
              )
            };
          }

          return {
            key: `${entry.entityId}:edit`,
            label: `${result.value.name} (editing)`,
            content: (
              <ProcedureEditView
                wrapper={wrapper}
                availableTasks={availableTasks}
                onSave={handleSaveProcedure}
                onCancel={(): void => handleCancelProcedureEdit(entry.entityId)}
                onPreview={(): void => handlePreviewProcedure(entry.entityId)}
                onMutate={(): void => {
                  setPreviewVersion((v) => v + 1);
                  updateCascadeEntryChanges(entry.entityId, wrapper.hasChanges(wrapper.initial));
                }}
                onEditStepTask={procedureSession.onEditStepTask}
                onEditStepParams={procedureSession.onEditStepParams}
              />
            )
          };
        }

        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <ProcedureDetail
              procedure={result.value}
              onTaskClick={onTaskClick}
              onEdit={(): void => handleEditProcedure(entry.entityId)}
              onPreview={(): void => handlePreviewProcedure(entry.entityId)}
              onClose={(): void => popCascadeTo(index)}
            />
          )
        };
      }

      // Delegate step-params and task entries to the procedure editing session hook
      const hookColumn = procedureSession.renderCascadeEntry(entry, index);
      if (hookColumn) {
        return hookColumn;
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
    squashAt,
    newProcedureName,
    availableTasks,
    getOrCreateWrapper,
    handleSaveProcedure,
    handleSaveProcedureAs,
    handleCancelProcedureEdit,
    handleEditProcedure,
    handlePreviewProcedure,
    handleCloseProcedurePreview,
    handleCreateProcedure,
    handleCreateProcedureCancel,
    procedureSession,
    previewVersion
  ]);

  const comparisonColumns = useMemo<ReadonlyArray<IComparisonColumn>>(() => {
    return Array.from(compareIds).map((id) => {
      const result = workspace.data.procedures.get(id as ProcedureId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return {
        key: id,
        label: result.value.name,
        content: <ProcedureDetail procedure={result.value} />
      };
    });
  }, [compareIds, workspace]);

  return (
    <>
      <ConfirmDialog
        isOpen={procedureToDelete !== null}
        title="Delete Procedure"
        message={
          <>
            Delete <strong>{procedureToDelete?.name}</strong>? This cannot be undone.
            {procedureToDelete?.references.hasReferences && (
              <>
                <br />
                <br />
                <span className="text-red-600 font-medium">Referenced by:</span>
                <ul className="mt-1 ml-4 list-disc text-sm">
                  {procedureToDelete.references.hits.map((hit) => (
                    <li key={hit.compositeId}>
                      <span className="capitalize">{hit.entityType}</span>:{' '}
                      <strong>{hit.displayName ?? hit.compositeId}</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        }
        confirmLabel="Delete"
        severity="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <EntityTabLayout
        list={
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
              <button
                onClick={(): void =>
                  squashCascade([{ entityType: 'procedure', entityId: '__new__', mode: 'create' }])
                }
                disabled={mutableCollectionId === undefined}
                title={
                  mutableCollectionId === undefined ? 'No mutable procedure collection available' : undefined
                }
                className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                + New Procedure
              </button>
              <button
                onClick={handleListHeaderPaste}
                disabled={mutableCollectionId === undefined}
                title="Paste procedure from clipboard (JSON)"
                className="p-1.5 text-gray-500 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CursorArrowRaysIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <EntityList<LibraryRuntime.IProcedure, ProcedureId>
                entities={useFilteredEntities(procedures, PROCEDURE_FILTER_SPEC)}
                descriptor={PROCEDURE_DESCRIPTOR}
                selectedId={selectedId}
                onSelect={handleSelect}
                onDrill={collapseList}
                compareMode={compareMode}
                checkedIds={compareIds}
                onCheckedChange={toggleCompareId}
                onToggleCompare={toggleCompareMode}
                compareCount={compareIds.size}
                onStartComparison={startComparison}
                onDelete={handleRequestDelete}
                canDelete={canDeleteProcedure}
                emptyState={{
                  title: 'No Procedures',
                  description: 'No procedures found in the library.'
                }}
              />
            </div>
          </div>
        }
        cascadeColumns={cascadeColumns}
        onPopTo={popCascadeTo}
        listCollapsed={listCollapsed}
        onListCollapse={collapseList}
        compareMode={compareMode}
        comparisonColumns={comparisonColumns}
        showingComparison={showingComparison}
        onExitComparison={exitComparison}
      />
    </>
  );
}
