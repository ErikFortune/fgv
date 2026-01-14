/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
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
import { Entities, Helpers, type IngredientId, type SourceId } from '@fgv/ts-chocolate';
import { succeed, fail } from '@fgv/ts-utils';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sourceId = getIngredientSourceId(ingredientId);

  // Get editor for the collection (only when editing or deleting)
  const {
    editor,
    error: editorError,
    markDirty
  } = useIngredientEditor(isEditing || showDeleteConfirm ? sourceId : null);

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

      if (!runtime) {
        return fail<void>('Runtime not available');
      }

      setIsSaving(true);

      try {
        const ingredientResult = runtime.ingredients.get(ingredientId);
        if (!ingredientResult.isSuccess) {
          setIsSaving(false);
          return fail<void>('Ingredient not found');
        }

        const runtimeIngredient = ingredientResult.value;
        if (!runtimeIngredient) {
          setIsSaving(false);
          return fail<void>('Ingredient not found');
        }

        const currentRaw = runtimeIngredient.raw as unknown as Record<string, unknown>;

        const tags = formData.tagsText
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);

        const origins = formData.originsText
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);

        const urls = formData.urls
          .map((u) => ({ category: u.category.trim(), url: u.url.trim() }))
          .filter((u) => u.category.length > 0 && u.url.length > 0);

        const baseIngredient: Record<string, unknown> = {
          ...currentRaw,
          name: formData.name.trim(),
          category: formData.category,
          ganacheCharacteristics: formData.ganacheCharacteristics,
          description: formData.description.trim() || undefined,
          manufacturer: formData.manufacturer.trim() || undefined,
          density: formData.density,
          phase: formData.phase === '' ? undefined : formData.phase,
          vegan: formData.vegan ? true : undefined,
          certifications: formData.certifications.length > 0 ? formData.certifications : undefined,
          allergens: formData.allergens.length > 0 ? formData.allergens : undefined,
          traceAllergens: formData.traceAllergens.length > 0 ? formData.traceAllergens : undefined,
          tags: tags.length > 0 ? tags : undefined,
          urls: urls.length > 0 ? urls : undefined
        };

        let updatedIngredient: unknown = baseIngredient;

        if (formData.category === 'chocolate') {
          updatedIngredient = {
            ...baseIngredient,
            category: 'chocolate',
            chocolateType: formData.chocolateType,
            cacaoPercentage: formData.cacaoPercentage,
            fluidityStars: formData.fluidityStars === '' ? undefined : formData.fluidityStars,
            viscosityMcM: formData.viscosityMcM,
            temperatureCurve:
              formData.temperatureCurveMelt !== undefined &&
              formData.temperatureCurveCool !== undefined &&
              formData.temperatureCurveWorking !== undefined
                ? {
                    melt: formData.temperatureCurveMelt,
                    cool: formData.temperatureCurveCool,
                    working: formData.temperatureCurveWorking
                  }
                : undefined,
            beanVarieties: formData.beanVarieties.length > 0 ? formData.beanVarieties : undefined,
            applications: formData.applications.length > 0 ? formData.applications : undefined,
            origins: origins.length > 0 ? origins : undefined
          };
        } else if (formData.category === 'sugar') {
          updatedIngredient = {
            ...baseIngredient,
            category: 'sugar',
            hydrationNumber: formData.hydrationNumber,
            sweetnessPotency: formData.sweetnessPotency
          };
        } else if (formData.category === 'dairy') {
          updatedIngredient = {
            ...baseIngredient,
            category: 'dairy',
            fatContent: formData.fatContent,
            waterContent: formData.waterContent
          };
        } else if (formData.category === 'fat') {
          updatedIngredient = {
            ...baseIngredient,
            category: 'fat',
            meltingPoint: formData.meltingPoint
          };
        } else if (formData.category === 'alcohol') {
          updatedIngredient = {
            ...baseIngredient,
            category: 'alcohol',
            alcoholByVolume: formData.alcoholByVolume,
            flavorProfile: formData.flavorProfile.trim() || undefined
          };
        }

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
    [editor, ingredientId, runtime, markDirty, commitCollection, sourceId]
  );

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleDelete = useCallback(() => {
    if (!editor) {
      setDeleteError('Editor not available');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const deleteResult = editor.delete(ingredientId);
      if (deleteResult.isFailure()) {
        setIsDeleting(false);
        setDeleteError(deleteResult.message);
        return;
      }

      markDirty();

      const commitResult = commitCollection(sourceId);
      if (commitResult.isFailure()) {
        setIsDeleting(false);
        setDeleteError(commitResult.message);
        return;
      }

      setIsDeleting(false);
      setShowDeleteConfirm(false);
      onBack();
    } catch (e) {
      setIsDeleting(false);
      setDeleteError(`Delete failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [commitCollection, editor, ingredientId, markDirty, onBack, sourceId]);

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
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setShowDeleteConfirm(true);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500"
                title="Delete ingredient"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Delete ingredient</h3>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Delete <span className="font-semibold">{runtimeIngredient.name}</span> from collection{' '}
              <span className="font-semibold">{sourceId}</span>?
            </p>

            {editorError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">Failed to load editor: {editorError}</p>
              </div>
            )}

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{deleteError}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || !!editorError}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DetailSection title="Diet & Safety" defaultCollapsed={true} className="mb-6">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">Vegan</dt>
            <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {rawIngredient.vegan ? 'Yes' : 'No'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">Certifications</dt>
            <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {rawIngredient.certifications && rawIngredient.certifications.length > 0
                ? rawIngredient.certifications.join(', ')
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">Allergens</dt>
            <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {rawIngredient.allergens && rawIngredient.allergens.length > 0
                ? rawIngredient.allergens.join(', ')
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">Trace allergens</dt>
            <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {rawIngredient.traceAllergens && rawIngredient.traceAllergens.length > 0
                ? rawIngredient.traceAllergens.join(', ')
                : '—'}
            </dd>
          </div>
        </dl>
      </DetailSection>

      {(rawIngredient.phase !== undefined || rawIngredient.measurementUnits !== undefined) && (
        <DetailSection title="Usage Defaults" defaultCollapsed={true} className="mb-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rawIngredient.phase !== undefined && (
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Phase</dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {rawIngredient.phase}
                </dd>
              </div>
            )}
            {rawIngredient.measurementUnits !== undefined && (
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Preferred unit</dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {rawIngredient.measurementUnits.preferredId ?? '—'}
                </dd>
              </div>
            )}
            {rawIngredient.measurementUnits !== undefined && (
              <div className="md:col-span-2">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Allowed units</dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {rawIngredient.measurementUnits.options && rawIngredient.measurementUnits.options.length > 0
                    ? rawIngredient.measurementUnits.options.map((o) => o.id).join(', ')
                    : '—'}
                </dd>
              </div>
            )}
          </dl>
        </DetailSection>
      )}

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

      {Entities.Ingredients.isChocolateIngredient(rawIngredient) && (
        <DetailSection title="Chocolate Details" defaultCollapsed={true} className="mb-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Chocolate type</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {rawIngredient.chocolateType}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Cacao percentage</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {rawIngredient.cacaoPercentage}%
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Fluidity stars</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {rawIngredient.fluidityStars ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Viscosity (McM)</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {rawIngredient.viscosityMcM ?? '—'}
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Origins</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {rawIngredient.origins && rawIngredient.origins.length > 0
                  ? rawIngredient.origins.join(', ')
                  : '—'}
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Bean varieties</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {rawIngredient.beanVarieties && rawIngredient.beanVarieties.length > 0
                  ? rawIngredient.beanVarieties.join(', ')
                  : '—'}
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Applications</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {rawIngredient.applications && rawIngredient.applications.length > 0
                  ? rawIngredient.applications.join(', ')
                  : '—'}
              </dd>
            </div>
          </dl>
        </DetailSection>
      )}

      {Entities.Ingredients.isSugarIngredient(rawIngredient) && (
        <DetailSection title="Sugar Details" defaultCollapsed={true} className="mb-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Hydration number</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {rawIngredient.hydrationNumber ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Sweetness potency</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {rawIngredient.sweetnessPotency ?? '—'}
              </dd>
            </div>
          </dl>
        </DetailSection>
      )}

      {Entities.Ingredients.isDairyIngredient(rawIngredient) && (
        <DetailSection title="Dairy Details" defaultCollapsed={true} className="mb-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Fat content</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {rawIngredient.fatContent !== undefined ? `${rawIngredient.fatContent}%` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Water content</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {rawIngredient.waterContent !== undefined ? `${rawIngredient.waterContent}%` : '—'}
              </dd>
            </div>
          </dl>
        </DetailSection>
      )}

      {Entities.Ingredients.isFatIngredient(rawIngredient) && (
        <DetailSection title="Fat Details" defaultCollapsed={true} className="mb-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Melting point</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {rawIngredient.meltingPoint !== undefined ? `${rawIngredient.meltingPoint} °C` : '—'}
              </dd>
            </div>
          </dl>
        </DetailSection>
      )}

      {Entities.Ingredients.isAlcoholIngredient(rawIngredient) && (
        <DetailSection title="Alcohol Details" defaultCollapsed={true} className="mb-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Alcohol by volume</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {rawIngredient.alcoholByVolume !== undefined ? `${rawIngredient.alcoholByVolume}%` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Flavor profile</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {rawIngredient.flavorProfile ?? '—'}
              </dd>
            </div>
          </dl>
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
