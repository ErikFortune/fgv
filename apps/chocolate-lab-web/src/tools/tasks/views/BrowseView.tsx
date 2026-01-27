/*
 * MIT License
 * Copyright (c) 2026 Erik Fortune
 */

import * as React from 'react';
import { useMemo } from 'react';
import type { SourceId, TaskId } from '@fgv/ts-chocolate';
import { useRuntime } from '../../../contexts/RuntimeContext';
import { LoadingSpinner } from '../../../components/common';
import type { ITaskFilters } from '../TasksToolSidebar';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useSettings } from '../../../contexts/SettingsContext';
import { AddTaskDialog } from '../../../components/collections/TaskCollectionManagementPanel';

export interface IBrowseViewProps {
  filters: ITaskFilters;
  selectedId: TaskId | null;
  onSelect: (id: TaskId) => void;
}

function getSourceId(id: TaskId): string {
  return (id as string).split('.')[0] ?? '';
}

function TaskRow({
  id,
  task,
  isSelected,
  onClick
}: {
  id: TaskId;
  task: {
    name: string;
    template: string;
    tags?: ReadonlyArray<string>;
  };
  isSelected: boolean;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-4 transition-all duration-150 bg-white dark:bg-gray-800 ${
        isSelected
          ? 'border-chocolate-500 ring-2 ring-chocolate-500 dark:border-chocolate-400 dark:ring-chocolate-400'
          : 'border-gray-200 dark:border-gray-700 hover:border-chocolate-300 hover:shadow-md dark:hover:border-chocolate-600'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base leading-tight truncate">
            {task.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1 font-mono">
            {task.template}
          </p>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{id}</div>
      </div>

      {task.tags && task.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {task.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="inline-block text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 6 ? (
            <span className="text-xs text-gray-400 dark:text-gray-500">+{task.tags.length - 6} more</span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}

export function BrowseView({ filters, selectedId, onSelect }: IBrowseViewProps): React.ReactElement {
  const { runtime, loadingState, taskCount, dataVersion } = useRuntime();
  const { settings } = useSettings();
  const [showAddTask, setShowAddTask] = React.useState(false);

  const defaultCollectionId = useMemo((): SourceId | null => {
    if (!runtime) {
      return null;
    }

    const isMutable = (id: SourceId): boolean => {
      const collectionResult = runtime.library.tasks.collections.get(id);
      return collectionResult.isSuccess() && !!collectionResult.value && collectionResult.value.isMutable;
    };

    const isUnlocked = (id: SourceId): boolean => {
      const meta = settings.collections[id];
      return meta?.unlocked !== false;
    };

    const preferred = settings.defaultCollections?.tasks;
    if (preferred) {
      const preferredId = preferred as SourceId;
      if (isMutable(preferredId) && isUnlocked(preferredId)) {
        return preferredId;
      }
    }

    if (filters.collections.length === 1) {
      const filteredId = filters.collections[0] as SourceId;
      if (isMutable(filteredId) && isUnlocked(filteredId)) {
        return filteredId;
      }
    }

    const ids = Array.from(runtime.library.tasks.collections.keys()) as SourceId[];
    const firstMutable = ids.find((id) => isMutable(id) && isUnlocked(id));
    return firstMutable ?? null;
  }, [filters.collections, runtime, settings.collections, settings.defaultCollections]);

  const filteredTasks = useMemo(() => {
    void dataVersion;
    if (!runtime) return [];

    const tasks = Array.from(runtime.library.tasks.entries());

    return tasks
      .filter(([id, task]) => {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const nameMatch = task.name.toLowerCase().includes(searchLower);
          const templateMatch = task.template.toLowerCase().includes(searchLower);
          if (!nameMatch && !templateMatch) {
            return false;
          }
        }

        if (filters.collections.length > 0) {
          const sourceId = getSourceId(id);
          if (!filters.collections.includes(sourceId)) {
            return false;
          }
        }

        if (filters.tags.length > 0) {
          const taskTags = task.tags ?? [];
          const hasMatchingTag = filters.tags.some((tag) => taskTags.includes(tag));
          if (!hasMatchingTag) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [dataVersion, filters, runtime]);

  if (loadingState === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading tasks..." />
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 dark:text-red-400">Failed to load tasks</p>
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          {taskCount === 0 ? 'No tasks loaded' : 'No tasks match your filters'}
        </p>
        {taskCount > 0 && filters.search && (
          <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredTasks.length} of {taskCount} tasks
        </p>

        <button
          type="button"
          onClick={() => setShowAddTask(true)}
          disabled={!defaultCollectionId}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50"
        >
          <PlusIcon className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {showAddTask && defaultCollectionId && (
        <AddTaskDialog collectionId={defaultCollectionId} onClose={() => setShowAddTask(false)} />
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTasks.map(([id, task]) => (
          <TaskRow
            key={id as string}
            id={id}
            task={task}
            isSelected={id === selectedId}
            onClick={() => onSelect(id)}
          />
        ))}
      </div>
    </div>
  );
}
