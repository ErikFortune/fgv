import React, { useCallback, useMemo, useRef, useState } from 'react';
import { EntityList, type ICascadeColumn, EntityTabLayout, type IComparisonColumn } from '@fgv/ts-app-shell';
import { Editing, Entities, LibraryRuntime } from '@fgv/ts-chocolate';
import type { BaseProcedureId, CollectionId, TaskId, ProcedureId } from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  useNavigationStore,
  useWorkspace,
  useReactiveWorkspace,
  ProcedureDetail,
  ProcedureEditView,
  ProcedurePreviewPanel,
  useFilteredEntities,
  useProcedureEditSession
} from '@fgv/chocolate-lab-ui';

import {
  PROCEDURE_DESCRIPTOR,
  PROCEDURE_FILTER_SPEC,
  slugify,
  createBlankRawProcedureEntity
} from '../shared';

export function ProceduresTabContent(): React.ReactElement {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const squashCascade = useNavigationStore((s) => s.squashCascade);
  const popCascadeTo = useNavigationStore((s) => s.popCascadeTo);
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);
  const listCollapsed = useNavigationStore((s) => s.listCollapsed);
  const collapseList = useNavigationStore((s) => s.collapseList);
  const compareMode = useNavigationStore((s) => s.compareMode);
  const compareIds = useNavigationStore((s) => s.compareIds);
  const toggleCompareMode = useNavigationStore((s) => s.toggleCompareMode);
  const toggleCompareId = useNavigationStore((s) => s.toggleCompareId);
  const showingComparison = useNavigationStore((s) => s.showingComparison);
  const startComparison = useNavigationStore((s) => s.startComparison);
  const exitComparison = useNavigationStore((s) => s.exitComparison);

  const editingRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedProcedure } | undefined>(undefined);
  const [previewVersion, setPreviewVersion] = useState(0);

  const [newProcedureName, setNewProcedureName] = useState('');

  const mutableProcedureCollectionId = useMemo<CollectionId | undefined>(() => {
    const collections = workspace.data.entities.procedures.collections;
    for (const [id, col] of collections.entries()) {
      if (col.isMutable) {
        return id as CollectionId;
      }
    }
    return undefined;
  }, [workspace, reactiveWorkspace.version]);

  const procedures = useMemo<ReadonlyArray<LibraryRuntime.IProcedure>>(() => {
    return Array.from(workspace.data.procedures.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

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

  const selectedId =
    cascadeStack.length > 0 && cascadeStack[0].entityType === 'procedure'
      ? (cascadeStack[0].entityId as ProcedureId)
      : undefined;

  const handleSelect = useCallback(
    (id: ProcedureId): void => {
      const entry: ICascadeEntry = { entityType: 'procedure', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

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
    (wrapper: LibraryRuntime.EditedProcedure): void => {
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

      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseProcedureId;

      const collectionEntry = workspace.data.entities.procedures.collections.get(collectionId);
      if (collectionEntry.isFailure()) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' not found`);
        return;
      }
      if (!collectionEntry.value.isMutable) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' is immutable`);
        return;
      }

      const inMemoryResult = collectionEntry.value.items.set(baseId, entity);
      if (inMemoryResult.isFailure()) {
        workspace.data.logger.error(`Save failed (in-memory): ${inMemoryResult.message}`);
        return;
      }

      const editableResult = workspace.data.entities.getEditableProceduresEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const saveResult = editable.save();
          if (saveResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed: ${saveResult.message}`);
          }
        }
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      if (editingRef.current?.id === compositeId) {
        editingRef.current = undefined;
      }
      procedureSession.cleanup();
      const updated = cascadeStack.map((e) =>
        e.entityId === compositeId && e.entityType === 'procedure' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated.filter((e) => e.entityType !== 'task' || e.mode === 'view'));
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade, procedureSession]
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
      squashCascade(
        cascadeStack.filter(
          (e) => !(e.entityType === 'procedure' && e.entityId === entityId && e.mode === 'preview')
        )
      );
    },
    [cascadeStack, squashCascade]
  );

  const handleCreateProcedure = useCallback((): void => {
    const trimmed = newProcedureName.trim();
    if (!trimmed || !mutableProcedureCollectionId) {
      return;
    }
    const baseId = slugify(trimmed) as BaseProcedureId;
    const entity = createBlankRawProcedureEntity(baseId, trimmed);
    const compositeId = `${mutableProcedureCollectionId}.${baseId}` as ProcedureId;

    const colResult = workspace.data.entities.procedures.collections.get(mutableProcedureCollectionId);
    if (colResult.isFailure() || !colResult.value.isMutable) {
      workspace.data.logger.error('Cannot create procedure: mutable collection not available');
      return;
    }
    colResult.value.items.set(baseId, entity);

    const wrapperResult = LibraryRuntime.EditedProcedure.create(entity);
    if (wrapperResult.isFailure()) {
      workspace.data.logger.error(`Failed to create procedure wrapper: ${wrapperResult.message}`);
      return;
    }
    editingRef.current = { id: compositeId, wrapper: wrapperResult.value };
    workspace.data.clearCache();
    reactiveWorkspace.notifyChange();
    setNewProcedureName('');
    squashCascade([{ entityType: 'procedure', entityId: compositeId, mode: 'edit' }]);
  }, [newProcedureName, mutableProcedureCollectionId, workspace, reactiveWorkspace, squashCascade]);

  const handleCreateProcedureCancel = useCallback((): void => {
    setNewProcedureName('');
    squashCascade([]);
  }, [squashCascade]);

  // Depth-aware squash: keep stack up to and including the pane at `depth`, then append the new entry.
  const squashAt = useCallback(
    (depth: number, entry: ICascadeEntry): void => {
      squashCascade([...cascadeStack.slice(0, depth + 1), entry]);
    },
    [squashCascade, cascadeStack]
  );

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

          return {
            key: `${entry.entityId}:edit`,
            label: `${result.value.name} (editing)`,
            content: (
              <ProcedureEditView
                wrapper={wrapper}
                availableTasks={availableTasks}
                onSave={handleSaveProcedure}
                onSaveAs={isReadOnly ? handleSaveProcedureAs : undefined}
                onCancel={(): void => handleCancelProcedureEdit(entry.entityId)}
                readOnly={isReadOnly}
                onPreview={(): void => handlePreviewProcedure(entry.entityId)}
                onMutate={(): void => setPreviewVersion((v) => v + 1)}
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
    <EntityTabLayout
      list={
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
            <button
              onClick={(): void =>
                squashCascade([{ entityType: 'procedure', entityId: '__new__', mode: 'create' }])
              }
              disabled={mutableProcedureCollectionId === undefined}
              title={
                mutableProcedureCollectionId === undefined
                  ? 'No mutable procedure collection available'
                  : undefined
              }
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + New Procedure
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
  );
}
