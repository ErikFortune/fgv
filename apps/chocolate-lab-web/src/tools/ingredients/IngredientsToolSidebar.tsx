/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState, useMemo } from 'react';
import { SearchInput, CollapsibleSection } from '../../components/common';
import { CollectionManagementPanel } from '../../components/collections';
import { useChocolate } from '../../contexts/ChocolateContext';
import { TagBadge } from '@fgv/ts-chocolate-ui';
import type { IngredientCategory } from '@fgv/ts-chocolate';

/**
 * Filter state for ingredients
 */
export interface IIngredientFilters {
  search: string;
  categories: IngredientCategory[];
  collections: string[];
  tags: string[];
}

/**
 * Props for the IngredientsToolSidebar component
 */
export interface IIngredientsToolSidebarProps {
  /** Current filters */
  filters: IIngredientFilters;
  /** Filter change handler */
  onFiltersChange: (filters: IIngredientFilters) => void;
}

const CATEGORIES: { value: IngredientCategory; label: string }[] = [
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'sugar', label: 'Sugar' },
  { value: 'fat', label: 'Fat' },
  { value: 'liquid', label: 'Liquid' },
  { value: 'flavor', label: 'Flavor' },
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'other', label: 'Other' }
];

/**
 * Sidebar for the ingredients tool with search and filters
 */
export function IngredientsToolSidebar({
  filters,
  onFiltersChange
}: IIngredientsToolSidebarProps): React.ReactElement {
  const { runtime } = useChocolate();
  const [showFilters, setShowFilters] = useState(true);
  const [showTags, setShowTags] = useState(false);
  const [showCollections, setShowCollections] = useState(true);

  // Get all unique tags from ingredients
  const allTags = useMemo(() => {
    if (!runtime) return [];
    return runtime.getAllIngredientTags();
  }, [runtime]);

  // Handle category toggle
  const toggleCategory = (category: IngredientCategory): void => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  // Handle collection toggle
  const toggleCollection = (collectionId: string): void => {
    const newCollections = filters.collections.includes(collectionId)
      ? filters.collections.filter((c) => c !== collectionId)
      : [...filters.collections, collectionId];
    onFiltersChange({ ...filters, collections: newCollections });
  };

  // Handle tag toggle
  const toggleTag = (tag: string): void => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  // Clear all filters
  const clearFilters = (): void => {
    onFiltersChange({
      search: '',
      categories: [],
      collections: [],
      tags: []
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.categories.length > 0 ||
    filters.collections.length > 0 ||
    filters.tags.length > 0;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Search
        </label>
        <SearchInput
          value={filters.search}
          onChange={(search) => onFiltersChange({ ...filters, search })}
          placeholder="Search ingredients..."
        />
      </div>

      <CollapsibleSection title="Filters" isOpen={showFilters} onToggle={() => setShowFilters(!showFilters)}>
        <div className="space-y-4">
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
        <CollectionManagementPanel
          toolId="ingredients"
          selectedCollectionIds={filters.collections}
          onToggleSelected={toggleCollection}
          showHeader={true}
          headerTitle={null}
        />
      </CollapsibleSection>
    </div>
  );
}
