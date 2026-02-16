import React, { useCallback, useMemo, useRef, useState } from 'react';
import { EntityList, type ICascadeColumn, EntityTabLayout, type IComparisonColumn } from '@fgv/ts-app-shell';
import { Editing, Entities, LibraryRuntime } from '@fgv/ts-chocolate';
import type { BaseTaskId, CollectionId, TaskId } from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  useTabNavigation,
  useEntityList,
  useMutableCollection,
  TaskDetail,
  TaskEditView,
  TaskPreviewPanel,
  useFilteredEntities
} from '@fgv/chocolate-lab-ui';

import { TASK_DESCRIPTOR, TASK_FILTER_SPEC, slugify, createBlankRawTaskEntity } from '../shared';

export function TasksTabContent(): React.ReactElement {
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

  const editingRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedTask } | undefined>(undefined);

  // Counter that increments on each edit mutation — forces the preview column to re-render with live data.
  const [previewVersion, setPreviewVersion] = useState(0);

  const mutableCollectionId = useMutableCollection(workspace.data.entities.tasks.collections, [
    workspace,
    reactiveWorkspace.version
  ]);

  const handleCreateTask = useCallback(
    (entity: Entities.Tasks.IRawTaskEntity, source: 'manual'): void => {
      if (!mutableCollectionId) {
        workspace.data.logger.error('Cannot add task: no mutable collection available');
        return;
      }

      const baseId = entity.baseId as BaseTaskId;
      const compositeId = `${mutableCollectionId}.${baseId}` as TaskId;

      const existing = workspace.data.tasks.get(compositeId);
      if (existing.isSuccess()) {
        workspace.data.logger.error(`Task '${compositeId}' already exists`);
        return;
      }

      const colResult = workspace.data.entities.tasks.collections.get(mutableCollectionId);
      if (colResult.isFailure()) {
        workspace.data.logger.error(`Collection '${mutableCollectionId}' not found: ${colResult.message}`);
        return;
      }
      if (!colResult.value.isMutable) {
        workspace.data.logger.error(`Collection '${mutableCollectionId}' is not mutable`);
        return;
      }
      const setResult = colResult.value.items.set(baseId, entity);
      if (setResult.isFailure()) {
        workspace.data.logger.error(`Failed to add task: ${setResult.message}`);
        return;
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      const wrapperResult = LibraryRuntime.EditedTask.create(entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create editing wrapper: ${wrapperResult.message}`);
        return;
      }
      editingRef.current = { id: compositeId, wrapper: wrapperResult.value };

      if (source === 'manual') {
        workspace.data.logger.info(`Created task '${entity.name}' — edit and save when ready`);
      }

      const entry: ICascadeEntry = { entityType: 'task', entityId: compositeId, mode: 'edit' };
      squashCascade([entry]);
    },
    [workspace, reactiveWorkspace, mutableCollectionId, squashCascade]
  );

  const { entities: tasks, selectedId } = useEntityList<LibraryRuntime.ITask, TaskId>({
    getAll: () => workspace.data.tasks.values(),
    compare: (a, b) => a.name.localeCompare(b.name),
    entityType: 'task',
    cascadeStack,
    deps: [workspace, reactiveWorkspace.version]
  });

  const handleSelect = useCallback(
    (id: TaskId): void => {
      const entry: ICascadeEntry = { entityType: 'task', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  const handleEdit = useCallback(
    (entityId: string): void => {
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'task' ? { ...e, mode: 'edit' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  const handleCancelEdit = useCallback(
    (entityId: string): void => {
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'task' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
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
    (wrapper: LibraryRuntime.EditedTask): void => {
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

      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseTaskId;

      const collectionEntry = workspace.data.entities.tasks.collections.get(collectionId);
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

      const editableResult = workspace.data.entities.getEditableTasksEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const saveResult = editable.save();
          if (saveResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed: ${saveResult.message}`);
          } else {
            workspace.data.logger.info(`Saved task '${entity.name}' to collection '${collectionId}'`);
          }
        } else {
          workspace.data.logger.info(
            `Updated task '${entity.name}' in-memory (collection '${collectionId}' has no backing file)`
          );
        }
      } else {
        workspace.data.logger.info(`Updated task '${entity.name}' in-memory only: ${editableResult.message}`);
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      const entityId = compositeId;
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'task' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
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
      const withoutPreview = cascadeStack.filter(
        (e) => !(e.entityType === 'task' && e.entityId === entityId && e.mode === 'preview')
      );
      squashCascade([...withoutPreview, { entityType: 'task', entityId, mode: 'preview' }]);
    },
    [cascadeStack, squashCascade]
  );

  const handleClosePreview = useCallback(
    (entityId: string): void => {
      squashCascade(cascadeStack.filter((e) => !(e.entityId === entityId && e.mode === 'preview')));
    },
    [cascadeStack, squashCascade]
  );

  const handleNewTask = useCallback((): void => {
    const entry: ICascadeEntry = { entityType: 'task', entityId: '__new__', mode: 'create' };
    squashCascade([entry]);
  }, [squashCascade]);

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
    squashCascade([]);
  }, [squashCascade]);

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack
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

          return {
            key: `${entry.entityId}:edit`,
            label: `${result.value.name} (editing)`,
            content: (
              <TaskEditView
                wrapper={wrapper}
                onSave={handleSave}
                onSaveAs={isReadOnly ? handleSaveAs : undefined}
                onCancel={(): void => handleCancelEdit(entry.entityId)}
                readOnly={isReadOnly}
                onPreview={(): void => handlePreview(entry.entityId)}
                onMutate={(): void => setPreviewVersion((v) => v + 1)}
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
    cascadeStack,
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
  );
}
