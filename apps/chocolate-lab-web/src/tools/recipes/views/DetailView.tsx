/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeftIcon, ScaleIcon, BeakerIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { useChocolate } from '../../../contexts/ChocolateContext';
import { LoadingSpinner } from '../../../components/common';
import { CollectionBadge, TagBadge, DetailSection, RecipeCategoryBadge } from '@fgv/ts-chocolate-ui';
import type { RecipeId, IngredientId } from '@fgv/ts-chocolate';

/**
 * Extract source ID from composite ID
 */
function getSourceId(id: RecipeId | IngredientId): string {
  return id.split('.')[0] ?? '';
}

/**
 * Props for the DetailView component
 */
export interface IDetailViewProps {
  /** Recipe ID to display */
  recipeId: RecipeId;
  /** Back button handler */
  onBack: () => void;
}

/**
 * Detail view for a single recipe
 */
export function DetailView({ recipeId, onBack }: IDetailViewProps): React.ReactElement {
  const { runtime, loadingState } = useChocolate();

  if (loadingState === 'loading' || !runtime) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  const recipeResult = runtime.recipes.get(recipeId);
  if (!recipeResult.isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 dark:text-red-400 mb-4">Recipe not found</p>
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

  const recipe = recipeResult.value;
  const sourceId = getSourceId(recipeId);
  const goldenVersion = recipe.goldenVersion;

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{recipe.name}</h1>
            {recipe.description && <p className="text-gray-600 dark:text-gray-400">{recipe.description}</p>}
          </div>
          <RecipeCategoryBadge category={recipe.raw.category} size="lg" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CollectionBadge name={sourceId} size="md" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Version: {goldenVersion.versionSpec}
          </span>
          {recipe.versionCount > 1 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">({recipe.versionCount} versions)</span>
          )}
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {recipe.tags.map((tag: string) => (
              <TagBadge key={tag} tag={tag} size="md" />
            ))}
          </div>
        )}
      </div>

      {/* Recipe Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<BeakerIcon className="w-5 h-5" />}
          label="Ingredients"
          value={goldenVersion.raw.ingredients.length.toString()}
        />
        <StatCard
          icon={<ScaleIcon className="w-5 h-5" />}
          label="Base Weight"
          value={`${goldenVersion.baseWeight}g`}
        />
        {goldenVersion.yield && <StatCard label="Yield" value={goldenVersion.yield} />}
        {goldenVersion.createdDate && (
          <StatCard
            label="Created"
            value={goldenVersion.createdDate.split('T')[0] ?? goldenVersion.createdDate}
          />
        )}
      </div>

      {/* Ingredients List */}
      <DetailSection title="Ingredients" defaultCollapsed={false} className="mb-6">
        <IngredientsList recipeId={recipeId} />
      </DetailSection>

      {/* Version Notes */}
      {goldenVersion.notes && (
        <DetailSection title="Notes" defaultCollapsed={false} className="mb-6">
          <p className="text-gray-700 dark:text-gray-300">{goldenVersion.notes}</p>
        </DetailSection>
      )}

      {/* Version History */}
      {recipe.versionCount > 1 && (
        <DetailSection title="Version History" defaultCollapsed={true} className="mb-6">
          <ul className="space-y-2">
            {recipe.versions.map((version) => (
              <li
                key={version.versionSpec}
                className={`flex items-center justify-between p-2 rounded ${
                  version.versionSpec === goldenVersion.versionSpec
                    ? 'bg-chocolate-50 dark:bg-chocolate-900/20 border border-chocolate-200 dark:border-chocolate-800'
                    : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <span className="text-gray-700 dark:text-gray-300">{version.versionSpec}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {version.createdDate.split('T')[0]}
                </span>
                {version.versionSpec === goldenVersion.versionSpec && (
                  <span className="text-xs px-2 py-0.5 bg-chocolate-100 dark:bg-chocolate-900/40 text-chocolate-700 dark:text-chocolate-300 rounded">
                    Golden
                  </span>
                )}
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      {/* URLs */}
      {recipe.raw.urls && recipe.raw.urls.length > 0 && (
        <DetailSection title="Links" defaultCollapsed={true} className="mb-6">
          <ul className="space-y-2">
            {recipe.raw.urls.map((url, idx) => (
              <li key={idx}>
                <a
                  href={url.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-chocolate-600 dark:text-chocolate-400 hover:underline"
                >
                  {url.label ?? url.category}
                </a>
                {url.notes && (
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">- {url.notes}</span>
                )}
              </li>
            ))}
          </ul>
        </DetailSection>
      )}
    </div>
  );
}

/**
 * Stat card component
 */
function StatCard({
  icon,
  label,
  value
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

/**
 * Popover component for showing alternate ingredients
 */
function AlternatesPopover({
  alternates,
  children
}: {
  alternates: ReadonlyArray<{ name: string; manufacturer?: string }>;
  children: React.ReactNode;
}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent): void => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="ml-2 p-0.5 text-chocolate-500 dark:text-chocolate-400 hover:text-chocolate-700 dark:hover:text-chocolate-300 transition-colors"
        title={`${alternates.length} alternate${alternates.length > 1 ? 's' : ''} available`}
      >
        {children}
      </button>
      {isOpen && position && (
        <div
          ref={popoverRef}
          style={{ top: position.top, left: position.left }}
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-48"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Alternates
          </p>
          <ul className="space-y-1">
            {alternates.map((alt, idx) => (
              <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                {alt.name}
                {alt.manufacturer && (
                  <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({alt.manufacturer})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/**
 * Component showing ingredients list for a recipe
 */
function IngredientsList({ recipeId }: { recipeId: RecipeId }): React.ReactElement {
  const { runtime } = useChocolate();

  if (!runtime) {
    return <p className="text-gray-400 dark:text-gray-500">Loading...</p>;
  }

  const recipeResult = runtime.recipes.get(recipeId);
  if (recipeResult.isFailure()) {
    return <p className="text-gray-400 dark:text-gray-500">Recipe not found</p>;
  }

  const recipe = recipeResult.value;
  const goldenVersion = recipe.goldenVersion;
  const ingredientsResult = goldenVersion.getIngredients();

  if (ingredientsResult.isFailure()) {
    // Fall back to raw ingredients if resolution fails
    return (
      <ul className="space-y-2">
        {goldenVersion.raw.ingredients.map((ing, idx) => {
          const preferredId = ing.ingredient.preferredId ?? ing.ingredient.ids[0];
          return (
            <li
              key={idx}
              className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <span className="text-gray-700 dark:text-gray-300">{preferredId}</span>
              <span className="text-gray-500 dark:text-gray-400">
                {ing.amount}
                {ing.unit ?? 'g'}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  const ingredients = [...ingredientsResult.value];

  return (
    <ul className="space-y-2">
      {ingredients.map((ing, idx) => (
        <li
          key={idx}
          className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
        >
          <div className="flex items-center">
            <span className="text-gray-700 dark:text-gray-300">{ing.ingredient.name}</span>
            {ing.ingredient.manufacturer && (
              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                ({ing.ingredient.manufacturer})
              </span>
            )}
            {ing.alternates.length > 0 && (
              <AlternatesPopover alternates={ing.alternates}>
                <ArrowsRightLeftIcon className="w-4 h-4" />
              </AlternatesPopover>
            )}
            {ing.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ing.notes}</p>}
          </div>
          <span className="text-gray-500 dark:text-gray-400 font-mono">
            {ing.amount}
            {ing.unit ?? 'g'}
          </span>
        </li>
      ))}
    </ul>
  );
}
