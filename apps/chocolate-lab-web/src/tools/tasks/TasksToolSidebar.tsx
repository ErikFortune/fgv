/*
 * MIT License
 * Copyright (c) 2026 Erik Fortune
 */

import * as React from 'react';
import { useMemo } from 'react';
import { FilterTools, type IFilterActions, type IBaseFilterState } from '@fgv/ts-chocolate-ui';
import { useChocolate } from '../../contexts/ChocolateContext';
import { TaskCollectionManagementPanel } from '../../components/collections';

export interface ITaskFilters extends IBaseFilterState {
  // Task filters use base filter state - can extend if needed
}

export interface ITasksToolSidebarProps {
  filters: ITaskFilters;
  onFiltersChange: (filters: ITaskFilters) => void;
}

export function TasksToolSidebar({ filters, onFiltersChange }: ITasksToolSidebarProps): React.ReactElement {
  const { runtime, dataVersion } = useChocolate();

  const allTags = useMemo((): ReadonlyArray<string> => {
    void dataVersion;
    if (!runtime) return [];

    const tags = new Set<string>();
    for (const [, task] of runtime.library.tasks.entries()) {
      for (const t of task.tags ?? []) {
        tags.add(t);
      }
    }
    return Array.from(tags.values()).sort((a, b) => a.localeCompare(b));
  }, [dataVersion, runtime]);

  // Create filter actions that delegate to onFiltersChange
  const filterActions: IFilterActions<ITaskFilters> = useMemo(
    () => ({
      setSearch: (search: string) => onFiltersChange({ ...filters, search }),
      toggleCollection: (collectionId: string) => {
        const next = filters.collections.includes(collectionId)
          ? filters.collections.filter((c) => c !== collectionId)
          : [...filters.collections, collectionId];
        onFiltersChange({ ...filters, collections: next });
      },
      toggleTag: (tag: string) => {
        const next = filters.tags.includes(tag)
          ? filters.tags.filter((t) => t !== tag)
          : [...filters.tags, tag];
        onFiltersChange({ ...filters, tags: next });
      },
      clearFilters: () => onFiltersChange({ search: '', collections: [], tags: [] }),
      setFilters: (newFilters: ITaskFilters) => onFiltersChange(newFilters),
      hasActiveFilters: filters.search.length > 0 || filters.collections.length > 0 || filters.tags.length > 0
    }),
    [filters, onFiltersChange]
  );

  return (
    <FilterTools.FilterSidebar
      filters={filters}
      actions={filterActions}
      tags={allTags as string[]}
      searchPlaceholder="Search tasks..."
      collectionsPanel={
        <TaskCollectionManagementPanel
          toolId="tasks"
          selectedCollectionIds={filters.collections}
          onToggleSelected={filterActions.toggleCollection}
          showHeader={true}
          headerTitle={null}
        />
      }
    />
  );
}
