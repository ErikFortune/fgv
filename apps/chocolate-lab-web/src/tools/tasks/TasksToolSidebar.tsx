/*
 * MIT License
 * Copyright (c) 2026 Erik Fortune
 */

import * as React from 'react';
import { useMemo, useState } from 'react';
import { SearchInput, CollapsibleSection } from '../../components/common';
import { useChocolate } from '../../contexts/ChocolateContext';
import { TagBadge } from '@fgv/ts-chocolate-ui';
import { TaskCollectionManagementPanel } from '../../components/collections';

export interface ITaskFilters {
  search: string;
  collections: string[];
  tags: string[];
}

export interface ITasksToolSidebarProps {
  filters: ITaskFilters;
  onFiltersChange: (filters: ITaskFilters) => void;
}

export function TasksToolSidebar({ filters, onFiltersChange }: ITasksToolSidebarProps): React.ReactElement {
  const { runtime, dataVersion } = useChocolate();

  const [showFilters, setShowFilters] = useState(true);
  const [showTags, setShowTags] = useState(false);
  const [showCollections, setShowCollections] = useState(true);

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

  const toggleCollection = (collectionId: string): void => {
    const next = filters.collections.includes(collectionId)
      ? filters.collections.filter((c) => c !== collectionId)
      : [...filters.collections, collectionId];
    onFiltersChange({ ...filters, collections: next });
  };

  const toggleTag = (tag: string): void => {
    const next = filters.tags.includes(tag) ? filters.tags.filter((t) => t !== tag) : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: next });
  };

  const clearFilters = (): void => {
    onFiltersChange({
      search: '',
      collections: [],
      tags: []
    });
  };

  const hasActiveFilters = filters.search || filters.collections.length > 0 || filters.tags.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Search
        </label>
        <SearchInput
          value={filters.search}
          onChange={(search) => onFiltersChange({ ...filters, search })}
          placeholder="Search tasks..."
        />
      </div>

      <CollapsibleSection title="Filters" isOpen={showFilters} onToggle={() => setShowFilters(!showFilters)}>
        <div className="space-y-4">
          {allTags.length > 0 && (
            <CollapsibleSection title="Tags" isOpen={showTags} onToggle={() => setShowTags(!showTags)}>
              <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                {allTags.map((tag) => (
                  <TagBadge
                    key={tag}
                    tag={tag}
                    size="sm"
                    isActive={filters.tags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="w-full py-2 text-sm text-chocolate-600 dark:text-chocolate-400 hover:text-chocolate-700 dark:hover:text-chocolate-300"
            >
              Clear all filters
            </button>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Collections"
        isOpen={showCollections}
        onToggle={() => setShowCollections(!showCollections)}
      >
        <TaskCollectionManagementPanel
          toolId="tasks"
          selectedCollectionIds={filters.collections}
          onToggleSelected={toggleCollection}
          showHeader={true}
          headerTitle={null}
        />
      </CollapsibleSection>
    </div>
  );
}
