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
import type { BaseTaskId, CollectionId, TaskId } from '@fgv/ts-chocolate';
import type { Result } from '@fgv/ts-utils';
import {
  type IReferenceScanResult,
  useTabNavigation,
  useCascadeOps,
  useEntityList,
  useMutableCollection,
  useCanDeleteFromCollections,
  useEntityActions,
  createSetInMutableCollection,
  useEntityMutation,
  useClipboardJsonImport,
  TaskDetail,
  TaskEditView,
  TaskPreviewPanel,
  getWritableCollectionOptions,
  useFilteredEntities,
  useNavigationStore,
  ReadOnlyEditGate
} from '@fgv/chocolate-lab-ui';

import { TASK_DESCRIPTOR, TASK_FILTER_SPEC, slugify, createBlankRawTaskEntity } from '../shared';

type TaskMutableCollectionEntry = {
  readonly isMutable: boolean;
  readonly items: {
    set: (id: BaseTaskId, entity: Entities.Tasks.IRawTaskEntity) => Result<unknown>;
  };
};

export function TasksTabContent(): React.ReactElement {
  const {
    workspace,
    reactiveWorkspace,
    popCascadeTo,
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
  const cascade = useCascadeOps();

  const editingRef = useRef<{ id: TaskId; wrapper: LibraryRuntime.EditedTask } | undefined>(undefined);
  const [taskToDelete, setTaskToDelete] = useState<{
    id: TaskId;
    name: string;
    references: IReferenceScanResult;
  } | null>(null);
  const entityActions = useEntityActions();
  const updateCascadeEntryChanges = useNavigationStore((s) => s.updateCascadeEntryChanges);

  // Counter that increments on each edit mutation — forces the preview column to re-render with live data.
  const [previewVersion, setPreviewVersion] = useState(0);

  const mutableCollectionId = useMutableCollection(
    workspace.data.entities.tasks.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.tasks
  );

  const writableTaskCollections = useMemo(
    (): ReadonlyArray<{ id: string; label?: string }> =>
      getWritableCollectionOptions(
        workspace.data.entities.tasks.collections.entries(),
        workspace.settings?.getResolvedSettings().defaultTargets.tasks
      ),
    [workspace, reactiveWorkspace.version]
  );

  const canDeleteTask = useCanDeleteFromCollections(workspace.data.entities.tasks.collections, [
    workspace,
    reactiveWorkspace.version
  ]);

  const taskMutation = useEntityMutation<Entities.Tasks.IRawTaskEntity, BaseTaskId, TaskId>({
    setInMutableCollection: createSetInMutableCollection<
      Entities.Tasks.IRawTaskEntity,
      BaseTaskId,
      TaskMutableCollectionEntry
    >({
      getCollection: (collectionId: CollectionId) =>
        workspace.data.entities.tasks.collections.get(collectionId),
      isMutable: (entry: TaskMutableCollectionEntry) => entry.isMutable,
      setEntity: (
        entry: TaskMutableCollectionEntry,
        baseId: BaseTaskId,
        entity: Entities.Tasks.IRawTaskEntity
      ) => entry.items.set(baseId, entity),
      entityLabel: 'task'
    }),
    entityLabel: 'task',
    getPersistedCollection: (collectionId: CollectionId) =>
      workspace.data.entities.getPersistedTasksCollection(collectionId)
  });

  const handleCreateTask = useCallback(
    async (
      entity: Entities.Tasks.IRawTaskEntity,
      source: 'manual',
      targetCollectionId?: string
    ): Promise<void> => {
      const baseId = entity.baseId as BaseTaskId;
      const createResult = await taskMutation.createEntity({
        targetCollectionId: targetCollectionId as CollectionId | undefined,
        defaultCollectionId: mutableCollectionId,
        getCompositeId: (collectionId: CollectionId, nextBaseId: BaseTaskId) =>
          `${collectionId}.${nextBaseId}` as TaskId,
        baseId,
        entity,
        exists: (id: TaskId) => workspace.data.tasks.get(id).isSuccess(),
        persistToDisk: false
      });
      if (createResult.isFailure()) {
        return;
      }

      const compositeId = createResult.value;

      const wrapperResult = LibraryRuntime.EditedTask.create(entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create editing wrapper: ${wrapperResult.message}`);
        return;
      }
      editingRef.current = { id: compositeId, wrapper: wrapperResult.value };

      if (source === 'manual') {
        workspace.data.logger.info(`Created task '${entity.name}' — edit and save when ready`);
      }

      cascade.select({ entityType: 'task', entityId: compositeId, mode: 'edit' });
    },
    [workspace, mutableCollectionId, taskMutation, cascade]
  );

  const { entities: tasks, selectedId } = useEntityList<LibraryRuntime.ITask, TaskId>({
    getAll: () => workspace.data.tasks.values(),
    compare: (a, b) => a.name.localeCompare(b.name),
    entityType: 'task',
    cascadeStack: cascade.stack,
    deps: [workspace, reactiveWorkspace.version]
  });

  const taskCreateSourceOptions = useMemo(
    (): ReadonlyArray<{ id: string; name: string }> =>
      tasks.map((task) => ({
        id: task.id,
        name: task.name
      })),
    [tasks]
  );

  const handleCreateTaskFromSource = useCallback(
    (params: {
      mode: 'copy' | 'derive';
      sourceId: string;
      name: string;
      id: string;
      targetCollectionId?: string;
    }): void => {
      const sourceResult = workspace.data.tasks.get(params.sourceId as TaskId);
      if (sourceResult.isFailure()) {
        workspace.data.logger.error(`Cannot copy task '${params.sourceId}': not found`);
        return;
      }

      const nextEntity: Entities.Tasks.IRawTaskEntity = {
        ...sourceResult.value.entity,
        baseId: params.id as BaseTaskId,
        name: params.name as typeof sourceResult.value.entity.name
      };

      void handleCreateTask(nextEntity, 'manual', params.targetCollectionId);
    },
    [workspace, handleCreateTask]
  );

  const handleSelect = useCallback(
    (id: TaskId): void => {
      cascade.select({ entityType: 'task', entityId: id });
    },
    [cascade]
  );

  const handleRequestDelete = useCallback(
    (id: TaskId): void => {
      const result = workspace.data.tasks.get(id);
      const name = result.isSuccess() ? result.value.name : id;
      const references = entityActions.scanReferences(id);
      setTaskToDelete({ id, name, references });
    },
    [workspace, entityActions]
  );

  const handleConfirmDelete = useCallback((): void => {
    if (taskToDelete) {
      entityActions.deleteEntity(taskToDelete.id);
      cascade.clearById(taskToDelete.id);
    }
    setTaskToDelete(null);
  }, [taskToDelete, entityActions, cascade]);

  const handleCancelDelete = useCallback((): void => {
    setTaskToDelete(null);
  }, []);

  const handleEdit = useCallback(
    (_entityId: string): void => {
      // openEditor(0) trims views/previews above depth 0 and switches to edit mode
      cascade.openEditor(0);
    },
    [cascade]
  );

  const handleCancelEdit = useCallback(
    (entityId: string): void => {
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      cascade.popToView(0);
    },
    [cascade]
  );

  const handleSaveAs = useCallback(
    (wrapper: LibraryRuntime.EditedTask): void => {
      const entity = wrapper.current;
      workspace.data.logger.info(
        `Save to... requested for '${entity.name}' — collection picker not yet implemented`
      );
    },
    [workspace]
  );

  const handleSave = useCallback(
    async (wrapper: LibraryRuntime.EditedTask): Promise<void> => {
      const entity = wrapper.current;
      const compositeId = editingRef.current?.id;
      if (!compositeId) {
        workspace.data.logger.error('Save failed: no composite ID for editing wrapper');
        return;
      }

      const validationResult = Editing.Tasks.Validators.validateRawTaskEntity(entity);
      if (validationResult.isFailure()) {
        workspace.data.logger.error(`Save failed: ${validationResult.message}`);
        return;
      }

      const baseId = entity.baseId as BaseTaskId;

      const saveResult = await taskMutation.saveEntity({
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
      cascade.popToView(0);
    },
    [workspace, taskMutation, cascade]
  );

  const getOrCreateWrapper = useCallback(
    (task: LibraryRuntime.ITask): LibraryRuntime.EditedTask | undefined => {
      const id = task.id;
      if (editingRef.current?.id === id) {
        return editingRef.current.wrapper;
      }
      const result = LibraryRuntime.EditedTask.create(task.entity);
      if (result.isFailure()) {
        return undefined;
      }
      editingRef.current = { id, wrapper: result.value };
      return result.value;
    },
    []
  );

  const handlePreview = useCallback(
    (entityId: string): void => {
      // drillDown toggles: opens preview if not present, collapses if already showing
      cascade.drillDown(0, { entityType: 'task', entityId, mode: 'preview' });
    },
    [cascade]
  );

  const handleClosePreview = useCallback(
    (_entityId: string): void => {
      cascade.pop();
    },
    [cascade]
  );

  const handleListHeaderPaste = useClipboardJsonImport<Entities.Tasks.IRawTaskEntity>({
    entityLabel: 'task',
    convert: (from: unknown) => Entities.Tasks.Converters.rawTaskEntity.convert(from),
    onValid: (entity: Entities.Tasks.IRawTaskEntity) => handleCreateTask(entity, 'manual'),
    onValidSuccessMessage: (entity: Entities.Tasks.IRawTaskEntity) =>
      `Opened '${entity.name}' for review — save when ready`
  });

  const handleNewTask = useCallback((): void => {
    cascade.select({ entityType: 'task', entityId: '__new__', mode: 'create' });
  }, [cascade]);

  const [newTaskName, setNewTaskName] = useState('');

  const handleCreateFormSubmit = useCallback((): void => {
    const trimmed = newTaskName.trim();
    if (!trimmed) return;
    const id = slugify(trimmed);
    const entity = createBlankRawTaskEntity(id as BaseTaskId, trimmed);
    handleCreateTask(entity, 'manual');
    setNewTaskName('');
  }, [newTaskName, handleCreateTask]);

  const handleCreateFormCancel = useCallback((): void => {
    setNewTaskName('');
    cascade.clear();
  }, [cascade]);

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascade.stack
      .filter((e) => e.entityType === 'task')
      .map((entry) => {
        if (entry.mode === 'create') {
          return {
            key: '__new__',
            label: 'New Task',
            content: (
              <div className="p-4 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">New Task</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Melt Chocolate"
                    value={newTaskName}
                    onChange={(e): void => setNewTaskName(e.target.value)}
                    onKeyDown={(e): void => {
                      if (e.key === 'Enter') handleCreateFormSubmit();
                      if (e.key === 'Escape') handleCreateFormCancel();
                    }}
                    autoFocus
                  />
                  {newTaskName.trim() && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">ID: {slugify(newTaskName.trim())}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateFormSubmit}
                    disabled={!newTaskName.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={handleCreateFormCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )
          };
        }

        const result = workspace.data.tasks.get(entry.entityId as TaskId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load task: {entry.entityId}</div>
          };
        }

        if (entry.mode === 'preview') {
          const wrapper = editingRef.current?.id === entry.entityId ? editingRef.current.wrapper : undefined;
          const template = wrapper?.current.template ?? result.value.template;
          const defaults = wrapper?.current.defaults ?? result.value.defaults;
          const taskName = wrapper?.current.name ?? result.value.name;
          return {
            key: `${entry.entityId}:preview`,
            label: `${taskName} (preview)`,
            content: (
              <TaskPreviewPanel
                template={template}
                defaults={defaults}
                taskName={taskName}
                onClose={(): void => handleClosePreview(entry.entityId)}
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
          const collectionEntry = workspace.data.entities.tasks.collections.get(collectionId);
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
                      ? (): void => {
                          const today = new Date().toISOString().split('T')[0]!;
                          handleCreateTaskFromSource({
                            mode: 'copy',
                            sourceId: entry.entityId,
                            name: result.value.name,
                            id: `${result.value.entity.baseId}-copy-${today}`
                          });
                        }
                      : undefined
                  }
                  onCancel={(): void => handleCancelEdit(entry.entityId)}
                />
              )
            };
          }

          return {
            key: `${entry.entityId}:edit`,
            label: `${result.value.name} (editing)`,
            content: (
              <TaskEditView
                wrapper={wrapper}
                onSave={handleSave}
                onCancel={(): void => handleCancelEdit(entry.entityId)}
                onPreview={(): void => handlePreview(entry.entityId)}
                onMutate={(): void => {
                  setPreviewVersion((v) => v + 1);
                  updateCascadeEntryChanges(entry.entityId, wrapper.hasChanges(wrapper.initial));
                }}
              />
            )
          };
        }

        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <TaskDetail
              task={result.value}
              onEdit={(): void => handleEdit(entry.entityId)}
              onPreview={(): void => handlePreview(entry.entityId)}
            />
          )
        };
      });
  }, [
    cascade.stack,
    workspace,
    newTaskName,
    getOrCreateWrapper,
    handleSave,
    handleSaveAs,
    handleCancelEdit,
    handleEdit,
    handlePreview,
    handleClosePreview,
    handleCreateFormSubmit,
    handleCreateFormCancel,
    handleCreateTaskFromSource,
    taskCreateSourceOptions,
    writableTaskCollections,
    previewVersion
  ]);

  const comparisonColumns = useMemo<ReadonlyArray<IComparisonColumn>>(() => {
    return Array.from(compareIds).map((id) => {
      const result = workspace.data.tasks.get(id as TaskId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return { key: id, label: result.value.name, content: <TaskDetail task={result.value} /> };
    });
  }, [compareIds, workspace]);

  return (
    <>
      <ConfirmDialog
        isOpen={taskToDelete !== null}
        title="Delete Task"
        message={
          <>
            Delete <strong>{taskToDelete?.name}</strong>? This cannot be undone.
            {taskToDelete?.references.hasReferences && (
              <>
                <br />
                <br />
                <span className="text-red-600 font-medium">Referenced by:</span>
                <ul className="mt-1 ml-4 list-disc text-sm">
                  {taskToDelete.references.hits.map((hit) => (
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
                onClick={handleNewTask}
                disabled={mutableCollectionId === undefined}
                title={mutableCollectionId === undefined ? 'No mutable collection available' : undefined}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                + New Task
              </button>
              <button
                onClick={handleListHeaderPaste}
                disabled={mutableCollectionId === undefined}
                title="Paste task from clipboard (JSON)"
                className="p-1.5 text-gray-500 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CursorArrowRaysIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <EntityList<LibraryRuntime.ITask, TaskId>
                entities={useFilteredEntities(tasks, TASK_FILTER_SPEC)}
                descriptor={TASK_DESCRIPTOR}
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
                canDelete={canDeleteTask}
                emptyState={{
                  title: 'No Tasks',
                  description: 'No tasks found in the library.'
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
