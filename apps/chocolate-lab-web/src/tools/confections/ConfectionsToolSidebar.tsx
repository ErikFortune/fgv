/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useMemo } from 'react';
import type { ConfectionType } from '@fgv/ts-chocolate';
import { FilterTools, type IFilterActions } from '@fgv/ts-chocolate-ui';
import { ConfectionCollectionManagementPanel } from '../../components/collections';
import { useRuntime } from '../../contexts/RuntimeContext';
import type { IConfectionFilters } from './types';

/**
 * Props for the ConfectionsToolSidebar component
 */
export interface IConfectionsToolSidebarProps {
  /** Current filters */
  filters: IConfectionFilters;
  /** Callback when filters change */
  onFiltersChange: (filters: IConfectionFilters) => void;
}

/**
 * Confection types for filtering
 */
const CONFECTION_TYPES: { value: ConfectionType; label: string }[] = [
  { value: 'molded-bonbon', label: 'Molded Bonbon' },
  { value: 'bar-truffle', label: 'Bar Truffle' },
  { value: 'rolled-truffle', label: 'Rolled Truffle' }
];

/**
 * Sidebar for the confections tool with filtering options
 */
export function ConfectionsToolSidebar({
  filters,
  onFiltersChange
}: IConfectionsToolSidebarProps): React.ReactElement {
  const { runtime } = useRuntime();

  // Get all unique tags from confections
  const allTags = useMemo(() => {
    if (!runtime) return [];
    return runtime.getAllConfectionTags();
  }, [runtime]);

  // Handle confection type toggle
  const toggleConfectionType = (confectionType: ConfectionType): void => {
    const newTypes = filters.confectionTypes.includes(confectionType)
      ? filters.confectionTypes.filter((t) => t !== confectionType)
      : [...filters.confectionTypes, confectionType];
    onFiltersChange({ ...filters, confectionTypes: newTypes });
  };

  // Create filter actions that delegate to onFiltersChange
  const filterActions: IFilterActions<IConfectionFilters> = useMemo(
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
      clearFilters: () =>
        onFiltersChange({
          search: '',
          confectionTypes: [],
          collections: [],
          tags: []
        }),
      setFilters: (newFilters: IConfectionFilters) => onFiltersChange(newFilters),
      hasActiveFilters:
        filters.search.length > 0 ||
        filters.confectionTypes.length > 0 ||
        filters.collections.length > 0 ||
        filters.tags.length > 0
    }),
    [filters, onFiltersChange]
  );

  // Confection-specific filter controls (confection types)
  const confectionTypeControls = (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Confection Types
      </label>
      <div className="flex flex-wrap gap-2">
        {CONFECTION_TYPES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => toggleConfectionType(value)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              filters.confectionTypes.includes(value)
                ? 'bg-chocolate-600 text-white dark:bg-chocolate-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <FilterTools.FilterSidebar
      filters={filters}
      actions={filterActions}
      tags={allTags}
      searchPlaceholder="Search confections..."
      collectionsPanel={
        <ConfectionCollectionManagementPanel
          toolId="confections"
          selectedCollectionIds={filters.collections}
          onToggleSelected={filterActions.toggleCollection}
          showHeader={true}
          headerTitle={null}
        />
      }
    >
      {confectionTypeControls}
    </FilterTools.FilterSidebar>
  );
}
