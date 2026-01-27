/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRuntime } from '../../../contexts/RuntimeContext';
import { LoadingSpinner } from '../../../components/common';
import {
  CategoryBadge,
  CollectionBadge,
  TagBadge,
  GanacheCharacteristicsDisplay,
  TemperatureCurveDisplay,
  DetailSection
} from '@fgv/ts-chocolate-ui';
import type { IngredientId } from '@fgv/ts-chocolate';

/**
 * Extract source ID from composite ingredient ID (avoids importing Helpers which pulls in crypto)
 */
function getIngredientSourceId(id: IngredientId): string {
  return id.split('.')[0] ?? '';
}

/**
 * Props for the DetailView component
 */
export interface IDetailViewProps {
  /** Ingredient ID to display */
  ingredientId: IngredientId;
  /** Back button handler */
  onBack: () => void;
}

/**
 * Detail view for a single ingredient
 */
export function DetailView({ ingredientId, onBack }: IDetailViewProps): React.ReactElement {
  const { runtime, loadingState } = useRuntime();

  if (loadingState === 'loading' || !runtime) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  const ingredientResult = runtime.ingredients.get(ingredientId);
  if (!ingredientResult.isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 dark:text-red-400 mb-4">Ingredient not found</p>
        <button
          type="button"
          onClick={onBack}
          className="text-chocolate-600 dark:text-chocolate-400 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const ingredient = ingredientResult.value;
  const sourceId = getIngredientSourceId(ingredientId);

  return (
    <div className="max-w-4xl">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to browse
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{ingredient.name}</h1>
            {ingredient.description && (
              <p className="text-gray-600 dark:text-gray-400">{ingredient.description}</p>
            )}
          </div>
          <CategoryBadge category={ingredient.category} size="lg" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CollectionBadge name={sourceId} size="md" />
          {ingredient.manufacturer && (
            <span className="text-sm text-gray-500 dark:text-gray-400">by {ingredient.manufacturer}</span>
          )}
        </div>

        {/* Tags */}
        {ingredient.tags && ingredient.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {ingredient.tags.map((tag: string) => (
              <TagBadge key={tag} tag={tag} size="md" />
            ))}
          </div>
        )}
      </div>

      {/* Ganache Characteristics */}
      {ingredient.ganacheCharacteristics && (
        <DetailSection title="Ganache Characteristics" defaultCollapsed={false} className="mb-6">
          <GanacheCharacteristicsDisplay
            characteristics={ingredient.ganacheCharacteristics}
            showLegend={true}
            mode="detailed"
          />
        </DetailSection>
      )}

      {/* Temperature Curve */}
      {ingredient.temperatureCurve && (
        <DetailSection title="Temperature Curve" defaultCollapsed={false} className="mb-6">
          <TemperatureCurveDisplay
            curve={ingredient.temperatureCurve}
            showFahrenheit={true}
            mode="vertical"
          />
        </DetailSection>
      )}

      {/* Physical Properties */}
      {ingredient.density !== undefined && (
        <DetailSection title="Physical Properties" defaultCollapsed={false} className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            {ingredient.density !== undefined && (
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Density</dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {ingredient.density} g/mL
                </dd>
              </div>
            )}
          </div>
        </DetailSection>
      )}

      {/* URLs */}
      {ingredient.urls && Object.keys(ingredient.urls).length > 0 && (
        <DetailSection title="Links" defaultCollapsed={true} className="mb-6">
          <ul className="space-y-2">
            {Object.entries(ingredient.urls).map(([label, url]) => (
              <li key={label}>
                <a
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-chocolate-600 dark:text-chocolate-400 hover:underline"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      {/* Usage in Recipes */}
      <DetailSection title="Used in Recipes" defaultCollapsed={true} className="mb-6">
        <RecipeUsageList ingredientId={ingredientId} />
      </DetailSection>
    </div>
  );
}

/**
 * Component showing recipes that use this ingredient
 */
function RecipeUsageList({ ingredientId }: { ingredientId: IngredientId }): React.ReactElement {
  const { runtime } = useRuntime();

  if (!runtime) {
    return <p className="text-gray-400 dark:text-gray-500">Loading...</p>;
  }

  const usageResult = runtime.getIngredientUsage(ingredientId);
  if (usageResult.isFailure()) {
    return <p className="text-gray-400 dark:text-gray-500">No usage information available</p>;
  }

  const usage = usageResult.value;
  if (usage.length === 0) {
    return <p className="text-gray-400 dark:text-gray-500">Not used in any recipes</p>;
  }

  return (
    <ul className="space-y-2">
      {usage.map((info) => (
        <li key={`${info.recipeId}-${info.versionSpec}`} className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">{info.recipeId}</span>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {info.isPrimary ? 'Primary' : 'Alternate'}
          </span>
        </li>
      ))}
    </ul>
  );
}
