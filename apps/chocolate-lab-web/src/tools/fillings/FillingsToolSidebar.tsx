/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useMemo } from 'react';
import type { FillingCategory } from '@fgv/ts-chocolate';
import { FilterTools, type IFilterActions, type IBaseFilterState } from '@fgv/ts-chocolate-ui';
import { useRuntime } from '../../contexts/RuntimeContext';
import { FillingCollectionManagementPanel } from '../../components/collections';

/**
 * Filling filter state
 */
export interface IFillingFilters extends IBaseFilterState {
  /** Selected categories */
  categories: FillingCategory[];
}

/**
 * Props for the FillingsToolSidebar component
 */
export interface IFillingsToolSidebarProps {
  /** Current filters */
  filters: IFillingFilters;
  /** Callback when filters change */
  onFiltersChange: (filters: IFillingFilters) => void;
}

/**
 * Filling categories for filtering
 */
const CATEGORIES: { value: FillingCategory; label: string }[] = [
  { value: 'ganache', label: 'Ganache' },
  { value: 'caramel', label: 'Caramel' },
  { value: 'gianduja', label: 'Gianduja' }
];

/**
 * Sidebar for the fillings tool with filtering options
 */
export function FillingsToolSidebar({
  filters,
  onFiltersChange
}: IFillingsToolSidebarProps): React.ReactElement {
  const { runtime } = useRuntime();

  // Get all unique tags from fillings
  const allTags = useMemo(() => {
    if (!runtime) return [];
    return runtime.getAllFillingTags();
  }, [runtime]);

  // Handle category toggle
  const toggleCategory = (category: FillingCategory): void => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  // Create filter actions that delegate to onFiltersChange
  const filterActions: IFilterActions<IFillingFilters> = useMemo(
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
          categories: [],
          collections: [],
          tags: []
        }),
      setFilters: (newFilters: IFillingFilters) => onFiltersChange(newFilters),
      hasActiveFilters:
        filters.search.length > 0 ||
        filters.categories.length > 0 ||
        filters.collections.length > 0 ||
        filters.tags.length > 0
    }),
    [filters, onFiltersChange]
  );

  // Filling-specific filter controls (categories)
  const categoryFilterControls = (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Categories
      </label>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => toggleCategory(value)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              filters.categories.includes(value)
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
      searchPlaceholder="Search fillings..."
      collectionsPanel={
        <FillingCollectionManagementPanel
          toolId="fillings"
          selectedCollectionIds={filters.collections}
          onToggleSelected={filterActions.toggleCollection}
          showHeader={true}
          headerTitle={null}
        />
      }
    >
      {categoryFilterControls}
    </FilterTools.FilterSidebar>
  );
}
