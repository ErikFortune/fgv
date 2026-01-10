/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useMemo } from 'react';
import { useChocolate } from '../../../contexts/ChocolateContext';
import { LoadingSpinner } from '../../../components/common';
import { IngredientCard } from '@fgv/ts-chocolate-ui';
import type { IngredientId, Helpers } from '@fgv/ts-chocolate';
import type { IIngredientFilters } from '../IngredientsToolSidebar';

/**
 * Props for the BrowseView component
 */
export interface IBrowseViewProps {
  /** Current filters */
  filters: IIngredientFilters;
  /** Selected ingredient ID */
  selectedId: IngredientId | null;
  /** Selection handler */
  onSelect: (id: IngredientId) => void;
}

/**
 * Browse view for ingredients
 */
export function BrowseView({ filters, selectedId, onSelect }: IBrowseViewProps): React.ReactElement {
  const { runtime, loadingState, ingredientCount } = useChocolate();

  // Filter and sort ingredients
  const filteredIngredients = useMemo(() => {
    if (!runtime) return [];

    const ingredients = Array.from(runtime.ingredients.entries());

    return ingredients
      .filter(([id, ingredient]) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const nameMatch = ingredient.name.toLowerCase().includes(searchLower);
          const descMatch = ingredient.description?.toLowerCase().includes(searchLower) ?? false;
          const mfgMatch = ingredient.manufacturer?.toLowerCase().includes(searchLower) ?? false;
          if (!nameMatch && !descMatch && !mfgMatch) {
            return false;
          }
        }

        // Category filter
        if (filters.categories.length > 0) {
          if (!filters.categories.includes(ingredient.category)) {
            return false;
          }
        }

        // Collection filter
        if (filters.collections.length > 0) {
          const sourceId = id.split('.')[0];
          if (!filters.collections.includes(sourceId)) {
            return false;
          }
        }

        // Tags filter
        if (filters.tags.length > 0) {
          const ingredientTags = ingredient.tags ?? [];
          const hasMatchingTag = filters.tags.some((tag) => ingredientTags.includes(tag));
          if (!hasMatchingTag) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [runtime, filters]);

  if (loadingState === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading ingredients..." />
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 dark:text-red-400">Failed to load ingredients</p>
      </div>
    );
  }

  if (filteredIngredients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          {ingredientCount === 0 ? 'No ingredients loaded' : 'No ingredients match your filters'}
        </p>
        {ingredientCount > 0 && filters.search && (
          <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredIngredients.length} of {ingredientCount} ingredients
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredIngredients.map(([id, ingredient]) => {
          const sourceId = id.split('.')[0];
          return (
            <IngredientCard
              key={id}
              ingredient={ingredient}
              ingredientId={id}
              isSelected={id === selectedId}
              onClick={() => onSelect(id)}
              showCollection={true}
            />
          );
        })}
      </div>
    </div>
  );
}
