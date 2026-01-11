/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState, useMemo } from 'react';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { SearchInput, UnlockCollectionModal } from '../../components/common';
import { useChocolate } from '../../contexts/ChocolateContext';
import { TagBadge, CollectionBadge } from '@fgv/ts-chocolate-ui';
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
  const { runtime, collections } = useChocolate();
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [collectionToUnlock, setCollectionToUnlock] = useState<string | null>(null);

  // Get all unique tags from ingredients
  const allTags = useMemo(() => {
    if (!runtime) return [];
    return runtime.getAllIngredientTags();
  }, [runtime]);

  // Filter collections to only show those with ingredients
  const ingredientCollections = useMemo(() => {
    return collections.filter((c) => c.subLibraries.includes('ingredients'));
  }, [collections]);

  // Handle clicking on a locked collection
  const handleCollectionClick = (collectionId: string, isLocked: boolean): void => {
    if (isLocked) {
      setCollectionToUnlock(collectionId);
      setUnlockModalOpen(true);
    } else {
      toggleCollection(collectionId);
    }
  };

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

      {/* Categories */}
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

      {/* Collections */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Collections
        </label>
        <div className="flex flex-wrap gap-2">
          {ingredientCollections.map((collection) => {
            const isLocked = collection.isProtected && !collection.isUnlocked;
            return (
              <button
                key={collection.id}
                type="button"
                onClick={() => handleCollectionClick(collection.id, isLocked)}
                className={`transition-opacity ${
                  isLocked
                    ? 'opacity-50 hover:opacity-75'
                    : filters.collections.includes(collection.id)
                    ? 'opacity-100'
                    : 'opacity-60 hover:opacity-100'
                }`}
                title={isLocked ? `Click to unlock ${collection.name}` : collection.name}
              >
                {isLocked ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    <LockClosedIcon className="w-3 h-3" />
                    {collection.name}
                  </span>
                ) : (
                  <CollectionBadge name={collection.name} isProtected={collection.isProtected} size="sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {allTags.slice(0, 20).map((tag) => (
              <TagBadge
                key={tag}
                tag={tag}
                size="sm"
                isActive={filters.tags.includes(tag)}
                onClick={() => toggleTag(tag)}
              />
            ))}
            {allTags.length > 20 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">+{allTags.length - 20} more</span>
            )}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="w-full py-2 text-sm text-chocolate-600 dark:text-chocolate-400 hover:text-chocolate-700 dark:hover:text-chocolate-300"
        >
          Clear all filters
        </button>
      )}

      {/* Unlock Modal */}
      {collectionToUnlock && (
        <UnlockCollectionModal
          isOpen={unlockModalOpen}
          onClose={() => {
            setUnlockModalOpen(false);
            setCollectionToUnlock(null);
          }}
          collectionId={collectionToUnlock}
        />
      )}
    </div>
  );
}
