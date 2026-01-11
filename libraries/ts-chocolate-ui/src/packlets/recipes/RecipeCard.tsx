/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import type { Runtime, RecipeId } from '@fgv/ts-chocolate';
import { CollectionBadge, TagBadge } from '../common';
import { RecipeCategoryBadge } from './RecipeCategoryBadge';

/**
 * Extract source ID from composite recipe ID
 * Inlined to avoid importing Helpers which pulls in crypto module
 * @internal
 */
function getRecipeSourceId(id: RecipeId): string {
  return id.split('.')[0] ?? '';
}

/**
 * Props for the RecipeCard component
 * @public
 */
export interface IRecipeCardProps {
  /** Recipe to display */
  recipe: Runtime.RuntimeRecipe;
  /** Whether to show collection badge */
  showCollection?: boolean;
  /** Optional additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Whether this card is currently selected */
  isSelected?: boolean;
}

/**
 * Displays a recipe as a summary card for browse views
 * @public
 */
export function RecipeCard({
  recipe,
  showCollection = true,
  className = '',
  onClick,
  isSelected = false
}: IRecipeCardProps): React.ReactElement {
  const sourceId = getRecipeSourceId(recipe.id);
  const goldenVersion = recipe.goldenVersion;
  const isClickable = onClick !== undefined;

  const baseClasses = 'block rounded-lg border p-4 transition-all duration-150 bg-white dark:bg-gray-800';

  const borderClasses = isSelected
    ? 'border-chocolate-500 ring-2 ring-chocolate-500 dark:border-chocolate-400 dark:ring-chocolate-400'
    : 'border-gray-200 dark:border-gray-700';

  const interactiveClasses = isClickable
    ? 'cursor-pointer hover:border-chocolate-300 hover:shadow-md dark:hover:border-chocolate-600'
    : '';

  const combinedClasses = `${baseClasses} ${borderClasses} ${interactiveClasses} ${className}`;

  const content = (
    <>
      {/* Header row with name and category */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base leading-tight">
          {recipe.name}
        </h3>
        <RecipeCategoryBadge category={recipe.raw.category} size="sm" />
      </div>

      {/* Description if available */}
      {recipe.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{recipe.description}</p>
      )}

      {/* Recipe stats */}
      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
        <span>{goldenVersion.raw.ingredients.length} ingredients</span>
        <span>{goldenVersion.baseWeight}g base</span>
        {goldenVersion.yield && (
          <span className="text-gray-400 dark:text-gray-500">{goldenVersion.yield}</span>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-2 flex-wrap">
        {showCollection && <CollectionBadge name={sourceId} size="sm" />}
        {recipe.versionCount > 1 && (
          <span className="text-xs text-gray-500 dark:text-gray-500">{recipe.versionCount} versions</span>
        )}
      </div>

      {/* Tags preview */}
      {recipe.tags && recipe.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {recipe.tags.slice(0, 3).map((tag: string) => (
            <TagBadge key={tag} tag={tag} size="sm" />
          ))}
          {recipe.tags.length > 3 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">+{recipe.tags.length - 3} more</span>
          )}
        </div>
      )}
    </>
  );

  if (isClickable) {
    return (
      <button type="button" className={`${combinedClasses} text-left w-full`} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={combinedClasses}>{content}</div>;
}
