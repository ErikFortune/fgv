/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import type { Ingredients, IngredientId } from '@fgv/ts-chocolate';
import { CategoryBadge, CollectionBadge } from '../common';

/**
 * Extract source ID from composite ingredient ID
 * Inlined to avoid importing Helpers which pulls in crypto module
 * @internal
 */
function getIngredientSourceId(id: IngredientId): string {
  return id.split('.')[0] ?? '';
}

/**
 * Props for the IngredientCard component
 * @public
 */
export interface IIngredientCardProps {
  /** Ingredient to display */
  ingredient: Ingredients.Ingredient;
  /** Ingredient ID */
  ingredientId: IngredientId;
  /** Whether the collection is protected */
  isProtected?: boolean;
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
 * Displays an ingredient as a summary card for browse views
 * @public
 */
export function IngredientCard({
  ingredient,
  ingredientId,
  isProtected = false,
  showCollection = true,
  className = '',
  onClick,
  isSelected = false
}: IIngredientCardProps): React.ReactElement {
  const sourceId = getIngredientSourceId(ingredientId);
  const isClickable = onClick !== undefined;

  const baseClasses = 'block rounded-lg border p-4 transition-all duration-150 bg-white dark:bg-gray-800';

  const borderClasses = isSelected
    ? 'border-indigo-500 ring-2 ring-indigo-500 dark:border-indigo-400 dark:ring-indigo-400'
    : 'border-gray-200 dark:border-gray-700';

  const interactiveClasses = isClickable
    ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-600'
    : '';

  const combinedClasses = `${baseClasses} ${borderClasses} ${interactiveClasses} ${className}`;

  const content = (
    <>
      {/* Header row with name and category */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base leading-tight">
          {ingredient.name}
        </h3>
        <CategoryBadge category={ingredient.category} size="sm" />
      </div>

      {/* Description if available */}
      {ingredient.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{ingredient.description}</p>
      )}

      {/* Metadata row */}
      <div className="flex items-center gap-2 flex-wrap">
        {showCollection && <CollectionBadge name={sourceId} isProtected={isProtected} size="sm" />}
        {ingredient.manufacturer && (
          <span className="text-xs text-gray-500 dark:text-gray-500">{ingredient.manufacturer}</span>
        )}
      </div>

      {/* Tags preview */}
      {ingredient.tags && ingredient.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {ingredient.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="inline-block text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5"
            >
              {tag}
            </span>
          ))}
          {ingredient.tags.length > 3 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              +{ingredient.tags.length - 3} more
            </span>
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
