/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useMemo } from 'react';
import { useChocolate } from '../../../contexts/ChocolateContext';
import { LoadingSpinner } from '../../../components/common';
import { RecipeCard } from '@fgv/ts-chocolate-ui';
import type { RecipeId } from '@fgv/ts-chocolate';
import type { IRecipeFilters } from '../RecipesToolSidebar';

/**
 * Props for the BrowseView component
 */
export interface IBrowseViewProps {
  /** Current filters */
  filters: IRecipeFilters;
  /** Selected recipe ID */
  selectedId: RecipeId | null;
  /** Selection handler */
  onSelect: (id: RecipeId) => void;
}

/**
 * Browse view for recipes
 */
export function BrowseView({ filters, selectedId, onSelect }: IBrowseViewProps): React.ReactElement {
  const { runtime, loadingState, recipeCount, dataVersion } = useChocolate();

  // Filter and sort recipes - dataVersion triggers recalculation when library data changes
  const filteredRecipes = useMemo(() => {
    if (!runtime) return [];

    const recipes = Array.from(runtime.recipes.entries());

    return recipes
      .filter(([id, recipe]) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const nameMatch = recipe.name.toLowerCase().includes(searchLower);
          const descMatch = recipe.description?.toLowerCase().includes(searchLower) ?? false;
          if (!nameMatch && !descMatch) {
            return false;
          }
        }

        // Category filter
        if (filters.categories.length > 0) {
          if (!filters.categories.includes(recipe.raw.category)) {
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
          const recipeTags = recipe.tags ?? [];
          const hasMatchingTag = filters.tags.some((tag) => recipeTags.includes(tag));
          if (!hasMatchingTag) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [runtime, filters, dataVersion]);

  if (loadingState === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading recipes..." />
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 dark:text-red-400">Failed to load recipes</p>
      </div>
    );
  }

  if (filteredRecipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          {recipeCount === 0 ? 'No recipes loaded' : 'No recipes match your filters'}
        </p>
        {recipeCount > 0 && filters.search && (
          <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredRecipes.length} of {recipeCount} recipes
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRecipes.map(([id, recipe]) => (
          <RecipeCard
            key={id}
            recipe={recipe}
            isSelected={id === selectedId}
            onClick={() => onSelect(id)}
            showCollection={true}
          />
        ))}
      </div>
    </div>
  );
}
