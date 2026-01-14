/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useChocolate } from '../../../contexts/ChocolateContext';
import { useIngredientEditor, useEditing } from '../../../contexts/EditingContext';
import { LoadingSpinner } from '../../../components/common';
import {
  CategoryBadge,
  CollectionBadge,
  TagBadge,
  GanacheCharacteristicsDisplay,
  TemperatureCurveDisplay,
  DetailSection
} from '@fgv/ts-chocolate-ui';
import { IngredientEditForm, type IIngredientFormData } from '../components/IngredientEditForm';
import { Helpers, type IngredientId, type SourceId, type Entities } from '@fgv/ts-chocolate';
import { succeed, fail } from '@fgv/ts-utils';

// Type alias
type Ingredient = Entities.Ingredients.Ingredient;

/**
 * Extract source ID from composite ingredient ID
 */
function getIngredientSourceId(id: IngredientId): SourceId {
  return Helpers.getIngredientSourceId(id);
}

/**
 * Props for EditableDetailView
 */
export interface IEditableDetailViewProps {
  /** Ingredient ID to display/edit */
  ingredientId: IngredientId;
  /** Back button handler */
  onBack: () => void;
}

/**
 * Detail view with edit capability
 */
export function EditableDetailView({ ingredientId, onBack }: IEditableDetailViewProps): React.ReactElement {
  const { runtime, loadingState } = useChocolate();
  const { isCollectionMutable, commitCollection } = useEditing();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sourceId = getIngredientSourceId(ingredientId);

  // Get editor for the collection (only when editing)
  const { editor, error: editorError, markDirty } = useIngredientEditor(isEditing ? sourceId : null);

  // Check if collection is editable
  const canEdit = useMemo(() => {
    return isCollectionMutable(sourceId);
  }, [sourceId, isCollectionMutable]);

  // Handle save
  const handleSave = useCallback(
    (formData: IIngredientFormData) => {
      if (!editor) {
        return fail<void>('Editor not available');
      }

      setIsSaving(true);

      try {
        // Build updated ingredient object
        const updatedIngredient: Partial<Ingredient> = {
          name: formData.name,
          description: formData.description || undefined,
          manufacturer: formData.manufacturer || undefined,
          category: formData.category,
          density: formData.density,
          tags: formData.tags.length > 0 ? formData.tags : undefined
        };

        // Use editor's validating method to update the ingredient (takes full IngredientId)
        const result = editor.validating.update(ingredientId, updatedIngredient);

        if (result.isFailure()) {
          setIsSaving(false);
          return fail<void>(result.message);
        }

        markDirty();

        const commitResult = commitCollection(sourceId);
        if (commitResult.isFailure()) {
          setIsSaving(false);
          return fail<void>(commitResult.message);
        }

        setIsEditing(false);
        setIsSaving(false);
        return succeed<void>(undefined);
      } catch (e) {
        setIsSaving(false);
        return fail<void>(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    [editor, ingredientId, markDirty]
  );

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Loading state
  if (loadingState === 'loading' || !runtime) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  // Get ingredient
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

  // Runtime ingredient has all common properties plus runtime methods
  // Raw ingredient has the full data including optional properties like temperatureCurve, density, urls
  // Non-null assertion is safe here because we checked ingredientResult.isSuccess above
  const runtimeIngredient = ingredientResult.value!;
  const rawIngredient = runtimeIngredient.raw;

  // Edit mode
  if (isEditing) {
    if (editorError) {
      return (
        <div className="max-w-4xl">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to view
          </button>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-600 dark:text-red-400">Failed to load editor: {editorError}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to view
        </button>

        <IngredientEditForm
          ingredient={rawIngredient}
          onSave={handleSave}
          onCancel={handleCancelEdit}
          isSaving={isSaving}
        />
      </div>
    );
  }

  // View mode
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {runtimeIngredient.name}
            </h1>
            {runtimeIngredient.description && (
              <p className="text-gray-600 dark:text-gray-400">{runtimeIngredient.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <CategoryBadge category={runtimeIngredient.category} size="lg" />
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-chocolate-600 dark:text-chocolate-400 bg-chocolate-50 dark:bg-chocolate-900/20 border border-chocolate-200 dark:border-chocolate-800 rounded-md hover:bg-chocolate-100 dark:hover:bg-chocolate-900/30 focus:outline-none focus:ring-2 focus:ring-chocolate-500"
                title="Edit ingredient"
              >
                <PencilIcon className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CollectionBadge name={sourceId} size="md" />
          {runtimeIngredient.manufacturer && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              by {runtimeIngredient.manufacturer}
            </span>
          )}
          {!canEdit && (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">(read-only collection)</span>
          )}
        </div>

        {/* Tags */}
        {runtimeIngredient.tags && runtimeIngredient.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {runtimeIngredient.tags.map((tag: string) => (
              <TagBadge key={tag} tag={tag} size="md" />
            ))}
          </div>
        )}
      </div>

      {/* Ganache Characteristics */}
      {runtimeIngredient.ganacheCharacteristics && (
        <DetailSection title="Ganache Characteristics" defaultCollapsed={false} className="mb-6">
          <GanacheCharacteristicsDisplay
            characteristics={runtimeIngredient.ganacheCharacteristics}
            showLegend={true}
            mode="detailed"
          />
        </DetailSection>
      )}

      {/* Temperature Curve - only chocolate ingredients have this property */}
      {'temperatureCurve' in rawIngredient && rawIngredient.temperatureCurve && (
        <DetailSection title="Temperature Curve" defaultCollapsed={false} className="mb-6">
          <TemperatureCurveDisplay
            curve={rawIngredient.temperatureCurve}
            showFahrenheit={true}
            mode="vertical"
          />
        </DetailSection>
      )}

      {/* Physical Properties - access via rawIngredient as not all runtime ingredient types have density */}
      {rawIngredient.density !== undefined && (
        <DetailSection title="Physical Properties" defaultCollapsed={false} className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Density</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {rawIngredient.density} g/mL
              </dd>
            </div>
          </div>
        </DetailSection>
      )}

      {/* URLs - urls is an array of ICategorizedUrl with category and url properties */}
      {rawIngredient.urls && rawIngredient.urls.length > 0 && (
        <DetailSection title="Links" defaultCollapsed={true} className="mb-6">
          <ul className="space-y-2">
            {rawIngredient.urls.map((categorizedUrl, index) => (
              <li key={`${categorizedUrl.category}-${index}`}>
                <a
                  href={categorizedUrl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-chocolate-600 dark:text-chocolate-400 hover:underline"
                >
                  {categorizedUrl.category}
                </a>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      {/* Usage in Fillings */}
      <DetailSection title="Used in Fillings" defaultCollapsed={true} className="mb-6">
        <RecipeUsageList ingredientId={ingredientId} />
      </DetailSection>
    </div>
  );
}

/**
 * Component showing fillings that use this ingredient
 */
function RecipeUsageList({ ingredientId }: { ingredientId: IngredientId }): React.ReactElement {
  const { runtime } = useChocolate();

  if (!runtime) {
    return <p className="text-gray-400 dark:text-gray-500">Loading...</p>;
  }

  const usageResult = runtime.getIngredientUsage(ingredientId);
  if (usageResult.isFailure()) {
    return <p className="text-gray-400 dark:text-gray-500">No usage information available</p>;
  }

  const usage = usageResult.value;
  if (usage.length === 0) {
    return <p className="text-gray-400 dark:text-gray-500">Not used in any fillings</p>;
  }

  return (
    <ul className="space-y-2">
      {usage.map((info) => (
        <li key={info.fillingId} className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">{info.fillingId}</span>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {info.isPrimary ? 'Primary' : 'Alternate'}
          </span>
        </li>
      ))}
    </ul>
  );
}
