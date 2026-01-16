/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeftIcon,
  ScaleIcon,
  BeakerIcon,
  ArrowsRightLeftIcon,
  PencilIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { useChocolate } from '../../../contexts/ChocolateContext';
import { useEditing } from '../../../contexts/EditingContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { LoadingSpinner } from '../../../components/common';
import { CollectionBadge, TagBadge, DetailSection, FillingCategoryBadge } from '@fgv/ts-chocolate-ui';
import {
  Calculations,
  Entities,
  Helpers,
  allMeasurementUnits,
  type FillingVersionSpec,
  type Measurement,
  type ProcedureId,
  type FillingCategory,
  type FillingId,
  type IngredientId,
  type MeasurementUnit,
  type SourceId
} from '@fgv/ts-chocolate';

/**
 * Extract source ID from composite ID
 */
function getSourceId(id: FillingId | IngredientId): string {
  return id.split('.')[0] ?? '';
}

function generateNextVersionSpec(existing: ReadonlyArray<string>, date: Date): string {
  const day = date.toISOString().slice(0, 10);
  const prefix = `${day}-`;
  let max = 0;
  for (const spec of existing) {
    if (!spec.startsWith(prefix)) continue;
    const m = /^\d{4}-\d{2}-\d{2}-(\d{2})(?:-.+)?$/.exec(spec);
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  const next = String(max + 1).padStart(2, '0');
  return `${day}-${next}`;
}

type DraftIngredient = {
  preferredId: string;
  alternateIdsText: string;
  amountText: string;
  unit: string;
  notes: string;
  modifiers?: unknown;
};

function IngredientAutocompleteInput({
  value,
  onChange,
  disabled,
  className
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}): React.ReactElement {
  const { runtime, dataVersion } = useChocolate();
  const [hasFocus, setHasFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 360
  });

  const ingredients = React.useMemo(() => {
    void dataVersion;
    if (!runtime) return [];
    return Array.from(runtime.ingredients.entries()).map(([id, ingredient]) => {
      const idString = id as unknown as string;
      const baseId = idString.split('.')[1] ?? idString;
      return {
        id: idString,
        baseId,
        name: ingredient.name,
        description: ingredient.description
      };
    });
  }, [dataVersion, runtime]);

  const suggestions = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 2) return [];

    const score = (item: { id: string; baseId: string; name: string }): number => {
      const id = item.id.toLowerCase();
      const base = item.baseId.toLowerCase();
      const name = item.name.toLowerCase();

      if (base === q) return 0;
      if (id === q) return 1;
      if (name === q) return 2;
      if (base.startsWith(q)) return 3;
      if (name.startsWith(q)) return 4;
      if (base.includes(q)) return 5;
      if (name.includes(q)) return 6;
      if (id.includes(q)) return 7;
      return 100;
    };

    return ingredients
      .map((item) => ({ item, s: score(item) }))
      .filter((x) => x.s < 100)
      .sort((a, b) => a.s - b.s || a.item.name.localeCompare(b.item.name))
      .slice(0, 10)
      .map((x) => x.item);
  }, [ingredients, value]);

  const isOpen = hasFocus && !disabled && suggestions.length > 0;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const update = (): void => {
      const el = inputRef.current;
      if (!el) {
        return;
      }
      const rect = el.getBoundingClientRect();
      const left = Math.max(8, rect.left);
      const top = rect.bottom + 6;
      const maxWidth = Math.max(240, window.innerWidth - left - 8);
      const width = Math.min(520, maxWidth);
      setDropdownPos({ left, top, width });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onFocus={() => setHasFocus(true)}
        onBlur={() => {
          window.setTimeout(() => setHasFocus(false), 120);
        }}
        disabled={disabled}
        className={className}
      />
      {isOpen &&
        createPortal(
          <div
            className="z-[1000] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden"
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width
            }}
          >
            <ul className="max-h-64 overflow-y-auto">
              {suggestions.map((sugg) => (
                <li key={sugg.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(sugg.id);
                      setHasFocus(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="text-sm text-gray-900 dark:text-gray-100">{sugg.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {sugg.baseId}
                      {sugg.description ? ` — ${sugg.description}` : ''}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{sugg.id}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}

/**
 * Props for the DetailView component
 */
export interface IDetailViewProps {
  /** Filling ID to display */
  fillingId: FillingId;
  /** Back button handler */
  onBack: () => void;
}

/**
 * Detail view for a single filling
 */
export function DetailView({ fillingId, onBack }: IDetailViewProps): React.ReactElement {
  const { runtime, loadingState } = useChocolate();
  const { commitFillingCollection } = useEditing();
  const { settings } = useSettings();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftTagsText, setDraftTagsText] = useState('');
  const [draftCategory, setDraftCategory] = useState<FillingCategory>('ganache');

  const [draftVersionSpec, setDraftVersionSpec] = useState('');
  const [draftCreatedDate, setDraftCreatedDate] = useState('');
  const [draftYield, setDraftYield] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftIngredients, setDraftIngredients] = useState<DraftIngredient[]>([]);
  const [draftPreferredProcedureId, setDraftPreferredProcedureId] = useState('');
  const [draftDerivedSourceVersionId, setDraftDerivedSourceVersionId] = useState('');
  const [draftDerivedDate, setDraftDerivedDate] = useState('');
  const [draftDerivedNotes, setDraftDerivedNotes] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const [scaleMode, setScaleMode] = useState<'target' | 'factor'>('target');
  const [scaleTargetWeightText, setScaleTargetWeightText] = useState('');
  const [scaleFactorText, setScaleFactorText] = useState('');

  if (loadingState === 'loading' || !runtime) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  const fillingResult = runtime.fillings.get(fillingId);
  if (!fillingResult.isSuccess || !fillingResult.value) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 dark:text-red-400 mb-4">Filling not found</p>
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

  const filling = fillingResult.value;
  const sourceId = getSourceId(fillingId);
  const goldenVersion = filling.goldenVersion;

  const scaledPreview = React.useMemo(() => {
    if (scaleMode === 'target') {
      const text = scaleTargetWeightText.trim();
      if (text.length === 0) return { scaledVersion: null as any, error: null as string | null };
      const target = Number(text);
      if (!Number.isFinite(target) || target <= 0) {
        return { scaledVersion: null as any, error: 'Target weight must be a positive number' };
      }
      const scaledResult = goldenVersion.scale(target as Measurement, {
        precision: 1,
        minimumAmount: 0.1 as Measurement
      });
      if (scaledResult.isFailure()) {
        return { scaledVersion: null as any, error: scaledResult.message };
      }
      return { scaledVersion: scaledResult.value, error: null as string | null };
    }

    const factorText = scaleFactorText.trim();
    if (factorText.length === 0) return { scaledVersion: null as any, error: null as string | null };
    const factor = Number(factorText);
    if (!Number.isFinite(factor) || factor <= 0) {
      return { scaledVersion: null as any, error: 'Scale factor must be a positive number' };
    }
    const scaledResult = goldenVersion.scaleByFactor(factor, {
      precision: 1,
      minimumAmount: 0.1 as Measurement
    });
    if (scaledResult.isFailure()) {
      return { scaledVersion: null as any, error: scaledResult.message };
    }
    return { scaledVersion: scaledResult.value, error: null as string | null };
  }, [goldenVersion, scaleFactorText, scaleMode, scaleTargetWeightText]);

  const preferredProcedureId = React.useMemo(() => {
    return (
      (goldenVersion.raw.procedures?.preferredId as unknown as string | undefined) ??
      (goldenVersion.raw.procedures?.options?.[0]?.id as unknown as string | undefined) ??
      undefined
    );
  }, [goldenVersion]);

  const previewRecipeForRender = React.useMemo((): Entities.IComputedScaledFillingRecipe | null => {
    if (scaledPreview.scaledVersion) {
      return scaledPreview.scaledVersion.raw as unknown as Entities.IComputedScaledFillingRecipe;
    }

    const sourceVersionId = Helpers.createFillingVersionId(
      fillingId,
      goldenVersion.versionSpec as unknown as FillingVersionSpec
    );
    const scaledResult = Calculations.scaleVersion(
      goldenVersion.raw,
      sourceVersionId,
      goldenVersion.baseWeight as Measurement,
      {
        precision: 1,
        minimumAmount: 0.1 as Measurement
      }
    );
    if (scaledResult.isFailure()) {
      return null;
    }
    return scaledResult.value as unknown as Entities.IComputedScaledFillingRecipe;
  }, [fillingId, goldenVersion, scaledPreview.scaledVersion]);

  const renderedPreviewProcedure = React.useMemo(() => {
    if (!preferredProcedureId || !previewRecipeForRender) {
      return { rendered: null as any, error: null as string | null };
    }
    const procResult = runtime.getRuntimeProcedure(preferredProcedureId as unknown as ProcedureId);
    if (procResult.isFailure()) {
      return { rendered: null as any, error: procResult.message };
    }
    const renderResult = procResult.value.render({ context: runtime, recipe: previewRecipeForRender });
    if (renderResult.isFailure()) {
      return { rendered: null as any, error: renderResult.message };
    }
    return { rendered: renderResult.value, error: null as string | null };
  }, [preferredProcedureId, previewRecipeForRender, runtime]);

  const canEdit = (() => {
    if (!runtime) return false;
    const unlocked = settings.collections[sourceId]?.unlocked !== false;
    if (!unlocked) return false;

    const collectionResult = runtime.library.fillings.collections.get(sourceId as SourceId);
    if (!collectionResult.isSuccess() || !collectionResult.value) return false;
    return collectionResult.value.isMutable;
  })();

  const beginNewVersion = (): void => {
    if (!canEdit) return;
    setSaveError(null);

    const now = new Date();
    const existingSpecs = filling.versions.map((v) => v.versionSpec as string);
    const nextSpec = generateNextVersionSpec(existingSpecs, now);

    setDraftName(filling.name);
    setDraftDescription(filling.description ?? '');
    setDraftTagsText((filling.tags ?? []).join(', '));
    setDraftCategory(filling.raw.category);

    setDraftVersionSpec(nextSpec);
    setDraftCreatedDate(now.toISOString().slice(0, 10));
    setDraftYield(goldenVersion.yield ?? '');
    setDraftNotes(goldenVersion.notes ?? '');
    setDraftPreferredProcedureId((goldenVersion.raw.procedures?.preferredId as unknown as string) ?? '');
    setDraftDerivedSourceVersionId((filling.raw.derivedFrom?.sourceVersionId as unknown as string) ?? '');
    setDraftDerivedDate((filling.raw.derivedFrom?.derivedDate as unknown as string) ?? '');
    setDraftDerivedNotes((filling.raw.derivedFrom?.notes as unknown as string) ?? '');
    setDraftIngredients(
      goldenVersion.raw.ingredients.map((ing) => {
        const ids = ing.ingredient.ids as unknown as string[];
        const preferred = (ing.ingredient.preferredId as unknown as string) ?? ids[0] ?? '';
        const alternates = ids.filter((id) => id !== preferred);
        return {
          preferredId: preferred,
          alternateIdsText: alternates.join(', '),
          amountText: String(ing.amount),
          unit: (ing.unit as unknown as string) ?? '',
          notes: ing.notes ?? '',
          modifiers: (ing.modifiers as unknown) ?? undefined
        };
      })
    );

    setIsEditing(true);
  };

  const beginEditGolden = (): void => {
    if (!canEdit) return;
    setSaveError(null);

    setDraftName(filling.name);
    setDraftDescription(filling.description ?? '');
    setDraftTagsText((filling.tags ?? []).join(', '));
    setDraftCategory(filling.raw.category);

    setDraftVersionSpec(goldenVersion.versionSpec as unknown as string);
    setDraftCreatedDate((goldenVersion.createdDate ?? '').split('T')[0] ?? '');
    setDraftYield(goldenVersion.yield ?? '');
    setDraftNotes(goldenVersion.notes ?? '');
    setDraftPreferredProcedureId((goldenVersion.raw.procedures?.preferredId as unknown as string) ?? '');
    setDraftIngredients(
      goldenVersion.raw.ingredients.map((ing) => {
        const ids = ing.ingredient.ids as unknown as string[];
        const preferred = (ing.ingredient.preferredId as unknown as string) ?? ids[0] ?? '';
        const alternates = ids.filter((id) => id !== preferred);
        return {
          preferredId: preferred,
          alternateIdsText: alternates.join(', '),
          amountText: String(ing.amount),
          unit: (ing.unit as unknown as string) ?? '',
          notes: ing.notes ?? '',
          modifiers: (ing.modifiers as unknown) ?? undefined
        };
      })
    );

    setIsEditing(true);
  };

  const saveDraft = (setGolden: boolean): void => {
    if (!runtime) return;
    if (!canEdit) return;

    setIsSaving(true);
    setSaveError(null);

    const normalizedVersionSpec = draftVersionSpec.trim();
    if (normalizedVersionSpec.length === 0) {
      setSaveError('Version spec is required');
      setIsSaving(false);
      return;
    }

    const candidateIngredients: Entities.Fillings.IFillingIngredient[] = draftIngredients.flatMap((row) => {
      const preferredId = row.preferredId.trim();
      const amount = Number(row.amountText);
      if (preferredId.length === 0 || !Number.isFinite(amount) || amount <= 0) {
        return [];
      }
      const unit = (row.unit.trim().length > 0 ? row.unit.trim() : 'g') as MeasurementUnit;
      const preferred = preferredId as unknown as IngredientId;
      return [
        {
          ingredient: {
            ids: [preferred],
            preferredId: preferred
          },
          amount: amount as unknown as Measurement,
          unit
        } as Entities.Fillings.IFillingIngredient
      ];
    });

    const baseWeight = Calculations.calculateTotalWeight(candidateIngredients, {
      getIngredientDensity: (id) => {
        const ingredientResult = runtime.ingredients.get(id);
        if (ingredientResult.isSuccess() && ingredientResult.value) {
          return ingredientResult.value.raw.density ?? 1.0;
        }
        return 1.0;
      }
    });

    if (!Number.isFinite(baseWeight) || baseWeight <= 0) {
      setSaveError('Base weight is zero or invalid (check ingredient amounts/units)');
      setIsSaving(false);
      return;
    }

    const collectionResult = runtime.library.fillings.collections.get(sourceId as SourceId).asResult;
    if (collectionResult.isFailure()) {
      setSaveError(collectionResult.message);
      setIsSaving(false);
      return;
    }
    const collectionEntry = collectionResult.value;
    if (!collectionEntry.isMutable) {
      setSaveError(`Collection "${sourceId}" is not mutable`);
      setIsSaving(false);
      return;
    }

    const normalizedTags = draftTagsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const nextIngredients: Record<string, unknown>[] = [];
    for (let i = 0; i < draftIngredients.length; i += 1) {
      const row = draftIngredients[i];
      if (!row) continue;
      const preferredId = row.preferredId.trim();
      if (preferredId.length === 0) {
        continue;
      }
      const amount = Number(row.amountText);
      if (!Number.isFinite(amount) || amount <= 0) {
        setSaveError(`Ingredient row ${i + 1}: amount must be a positive number`);
        setIsSaving(false);
        return;
      }
      const alternateIds = row.alternateIdsText
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const ids = [preferredId, ...alternateIds].filter(
        (v, idx, arr) => v.length > 0 && arr.indexOf(v) === idx
      );

      const ingredient: Record<string, unknown> = {
        ingredient: {
          ids,
          preferredId
        },
        amount
      };
      if (row.unit.trim().length > 0) {
        ingredient.unit = row.unit.trim();
      }
      if (row.notes.trim().length > 0) {
        ingredient.notes = row.notes.trim();
      }
      if (row.modifiers !== undefined) {
        ingredient.modifiers = row.modifiers;
      }
      nextIngredients.push(ingredient);
    }

    if (nextIngredients.length === 0) {
      setSaveError('At least one ingredient is required');
      setIsSaving(false);
      return;
    }

    const nextVersion: Record<string, unknown> = {
      versionSpec: normalizedVersionSpec,
      createdDate: draftCreatedDate.trim(),
      ingredients: nextIngredients,
      baseWeight
    };
    if (draftYield.trim().length > 0) {
      nextVersion.yield = draftYield.trim();
    }
    if (draftNotes.trim().length > 0) {
      nextVersion.notes = draftNotes.trim();
    }

    const preferredProcedureId = draftPreferredProcedureId.trim();
    if (preferredProcedureId.length > 0) {
      nextVersion.procedures = {
        options: [{ id: preferredProcedureId }],
        preferredId: preferredProcedureId
      };
    }

    const rawRecipe = filling.raw as unknown as Record<string, unknown>;
    const existingVersions = Array.isArray(rawRecipe.versions) ? [...rawRecipe.versions] : [];
    const withoutConflicts = existingVersions.filter((v) => {
      if (typeof v !== 'object' || v === null) return true;
      const spec = (v as Record<string, unknown>).versionSpec;
      return spec !== nextVersion.versionSpec;
    });

    const updatedRecipe: Record<string, unknown> = {
      ...rawRecipe,
      baseId: rawRecipe.baseId,
      name: draftName.trim(),
      description: draftDescription.trim().length > 0 ? draftDescription.trim() : undefined,
      tags: normalizedTags.length > 0 ? normalizedTags : undefined,
      category: draftCategory,
      versions: [...withoutConflicts, nextVersion],
      goldenVersionSpec: setGolden
        ? (nextVersion.versionSpec as string)
        : (rawRecipe.goldenVersionSpec as string)
    };

    const derivedSource = draftDerivedSourceVersionId.trim();
    const derivedDate = draftDerivedDate.trim();
    const derivedNotes = draftDerivedNotes.trim();
    if (derivedSource.length > 0 && derivedDate.length > 0) {
      updatedRecipe.derivedFrom = {
        sourceVersionId: derivedSource,
        derivedDate,
        ...(derivedNotes.length > 0 ? { notes: derivedNotes } : {})
      };
    } else {
      updatedRecipe.derivedFrom = undefined;
    }

    const validateResult = Entities.Fillings.Converters.fillingRecipe.convert(updatedRecipe);
    if (validateResult.isFailure()) {
      setSaveError(validateResult.message);
      setIsSaving(false);
      return;
    }

    const baseId = filling.raw.baseId;
    const setResult = collectionEntry.items.validating.set(baseId, validateResult.value).asResult;
    if (setResult.isFailure()) {
      setSaveError(setResult.message);
      setIsSaving(false);
      return;
    }

    const commitResult = commitFillingCollection(sourceId as SourceId);
    if (commitResult.isFailure()) {
      setSaveError(commitResult.message);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <div className="w-full max-w-6xl">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to browse
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{filling.name}</h1>
                {filling.description && (
                  <p className="text-gray-600 dark:text-gray-400">{filling.description}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <FillingCategoryBadge category={filling.raw.category} size="lg" />
                {canEdit ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={beginNewVersion}
                      disabled={isEditing}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50"
                    >
                      <PlusIcon className="w-4 h-4" />
                      New Version
                    </button>
                    <button
                      type="button"
                      onClick={beginEditGolden}
                      disabled={isEditing}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
                      title="Advanced: editing the golden version is discouraged; prefer creating a new version"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit Golden
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 dark:text-gray-500">Read-only</div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CollectionBadge name={sourceId} size="md" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Version: {goldenVersion.versionSpec}
              </span>
              {filling.versionCount > 1 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({filling.versionCount} versions)
                </span>
              )}
            </div>

            {/* Tags */}
            {filling.tags && filling.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {filling.tags.map((tag: string) => (
                  <TagBadge key={tag} tag={tag} size="md" />
                ))}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="mb-6">
              {saveError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{saveError}</p>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <PencilIcon className="w-5 h-5" />
                    Draft Version
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setSaveError(null);
                      }}
                      disabled={isSaving}
                      className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveDraft(false)}
                      disabled={isSaving}
                      className="px-3 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-md disabled:opacity-50"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => saveDraft(true)}
                      disabled={isSaving}
                      className="px-3 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50"
                    >
                      Save + Set Golden
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={draftCategory}
                      onChange={(e) => setDraftCategory(e.target.value as FillingCategory)}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      <option value="ganache">Ganache</option>
                      <option value="caramel">Caramel</option>
                      <option value="gianduja">Gianduja</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={draftDescription}
                      onChange={(e) => setDraftDescription(e.target.value)}
                      rows={2}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={draftTagsText}
                      onChange={(e) => setDraftTagsText(e.target.value)}
                      placeholder="comma-separated"
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Version Spec
                    </label>
                    <input
                      type="text"
                      value={draftVersionSpec}
                      onChange={(e) => setDraftVersionSpec(e.target.value)}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Created
                    </label>
                    <input
                      type="text"
                      value={draftCreatedDate}
                      onChange={(e) => setDraftCreatedDate(e.target.value)}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Yield
                    </label>
                    <input
                      type="text"
                      value={draftYield}
                      onChange={(e) => setDraftYield(e.target.value)}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Base Weight
                    </label>
                    <input
                      type="text"
                      value={(() => {
                        const asCandidate = draftIngredients
                          .map((row) => {
                            const ids = row.preferredId.trim().length > 0 ? [row.preferredId.trim()] : [];
                            return {
                              ingredient: { ids, preferredId: ids[0] },
                              amount: Number(row.amountText),
                              unit: row.unit.trim().length > 0 ? row.unit.trim() : 'g'
                            } as unknown;
                          })
                          .filter((x) => {
                            if (typeof x !== 'object' || x === null) return false;
                            const r = x as Record<string, unknown>;
                            return (
                              Number.isFinite(r.amount) &&
                              (r.amount as number) > 0 &&
                              typeof r.unit === 'string'
                            );
                          }) as unknown as ReadonlyArray<Entities.Fillings.IFillingIngredient>;

                        const bw = Calculations.calculateTotalWeight(asCandidate, {
                          getIngredientDensity: (id) => {
                            const ingredientResult = runtime.ingredients.get(id);
                            if (ingredientResult.isSuccess() && ingredientResult.value) {
                              return ingredientResult.value.raw.density ?? 1.0;
                            }
                            return 1.0;
                          }
                        });
                        return Number.isFinite(bw) ? String(bw) : '';
                      })()}
                      readOnly={true}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    rows={3}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preferred Procedure
                  </label>
                  <select
                    value={draftPreferredProcedureId}
                    onChange={(e) => setDraftPreferredProcedureId(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">(none)</option>
                    {runtime
                      ? (
                          Array.from(runtime.library.procedures.entries()) as Array<
                            [ProcedureId, { name: string }]
                          >
                        )
                          .sort((a, b) => a[1].name.localeCompare(b[1].name))
                          .map(([id, proc]) => (
                            <option key={id as unknown as string} value={id as unknown as string}>
                              {proc.name} ({id as unknown as string})
                            </option>
                          ))
                      : null}
                  </select>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-md">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedOptions((v) => !v)}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                  >
                    Advanced options
                  </button>
                  {showAdvancedOptions && (
                    <div className="px-3 pb-3 pt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Derived From (sourceVersionId)
                        </label>
                        <input
                          type="text"
                          value={draftDerivedSourceVersionId}
                          onChange={(e) => setDraftDerivedSourceVersionId(e.target.value)}
                          disabled={isSaving}
                          placeholder="sourceId.fillingId@YYYY-MM-DD-NN"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Derived Date
                        </label>
                        <input
                          type="text"
                          value={draftDerivedDate}
                          onChange={(e) => setDraftDerivedDate(e.target.value)}
                          disabled={isSaving}
                          placeholder="YYYY-MM-DD"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Derivation Notes
                        </label>
                        <textarea
                          value={draftDerivedNotes}
                          onChange={(e) => setDraftDerivedNotes(e.target.value)}
                          rows={2}
                          disabled={isSaving}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Ingredients</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftIngredients((prev) => [
                          ...prev,
                          { preferredId: '', alternateIdsText: '', amountText: '', unit: '', notes: '' }
                        ])
                      }
                      disabled={isSaving}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
                    >
                      Add ingredient
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                          <th className="py-2 pr-2">Preferred</th>
                          <th className="py-2 pr-2">Alternates</th>
                          <th className="py-2 pr-2">Amount</th>
                          <th className="py-2 pr-2">Unit</th>
                          <th className="py-2 pr-2">Notes</th>
                          <th className="py-2 w-16"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {draftIngredients.map((row, idx) => (
                          <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                            <td className="py-2 pr-2">
                              <IngredientAutocompleteInput
                                value={row.preferredId}
                                onChange={(next) =>
                                  setDraftIngredients((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, preferredId: next } : r))
                                  )
                                }
                                disabled={isSaving}
                                className="w-56 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                value={row.alternateIdsText}
                                onChange={(e) =>
                                  setDraftIngredients((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, alternateIdsText: e.target.value } : r
                                    )
                                  )
                                }
                                disabled={isSaving}
                                placeholder="comma-separated"
                                className="w-64 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                value={row.amountText}
                                onChange={(e) =>
                                  setDraftIngredients((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, amountText: e.target.value } : r))
                                  )
                                }
                                disabled={isSaving}
                                className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <select
                                value={row.unit}
                                onChange={(e) =>
                                  setDraftIngredients((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, unit: e.target.value } : r))
                                  )
                                }
                                disabled={isSaving}
                                className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                              >
                                <option value="">g</option>
                                {allMeasurementUnits
                                  .filter((u) => u !== 'g')
                                  .map((u) => (
                                    <option key={u} value={u as unknown as MeasurementUnit}>
                                      {u}
                                    </option>
                                  ))}
                              </select>
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                value={row.notes}
                                onChange={(e) =>
                                  setDraftIngredients((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, notes: e.target.value } : r))
                                  )
                                }
                                disabled={isSaving}
                                className="w-64 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="py-2 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftIngredients((prev) => prev.filter((_, i) => i !== idx))
                                }
                                disabled={isSaving}
                                className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filling Stats */}
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

          {/* Procedures */}
          {!isEditing && (
            <DetailSection title="Procedures" defaultCollapsed={true} className="mb-6">
              {(() => {
                const preferredId =
                  (goldenVersion.raw.procedures?.preferredId as unknown as string | undefined) ??
                  (goldenVersion.raw.procedures?.options?.[0]?.id as unknown as string | undefined);

                if (goldenVersion.procedures?.recommendedProcedure && preferredId) {
                  return (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {goldenVersion.procedures.recommendedProcedure.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                          {preferredId}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = `#procedures/${preferredId}`;
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        Open
                      </button>
                    </div>
                  );
                }

                return (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No procedure linked for this version.
                  </p>
                );
              })()}
            </DetailSection>
          )}

          {/* Derived From */}
          {!isEditing && filling.raw.derivedFrom && (
            <DetailSection title="Derived From" defaultCollapsed={true} className="mb-6">
              <div className="space-y-2">
                <div className="text-sm text-gray-700 dark:text-gray-300 font-mono break-all">
                  {filling.raw.derivedFrom.sourceVersionId as unknown as string}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {filling.raw.derivedFrom.derivedDate as unknown as string}
                </div>
                {filling.raw.derivedFrom.notes && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {filling.raw.derivedFrom.notes}
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const sourceVersionId = filling.raw.derivedFrom?.sourceVersionId as unknown as string;
                      const atIdx = sourceVersionId.indexOf('@');
                      const fillingOnly = atIdx >= 0 ? sourceVersionId.slice(0, atIdx) : sourceVersionId;
                      if (fillingOnly.length > 0) {
                        window.location.hash = `#fillings/${fillingOnly}`;
                      } else {
                        window.location.hash = '#fillings';
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    Open source filling
                  </button>
                </div>
              </div>
            </DetailSection>
          )}

          {/* Scaling */}
          {!isEditing && (
            <DetailSection title="Scaling" defaultCollapsed={true} className="mb-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      name="scaleMode"
                      checked={scaleMode === 'target'}
                      onChange={() => setScaleMode('target')}
                    />
                    Target weight
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      name="scaleMode"
                      checked={scaleMode === 'factor'}
                      onChange={() => setScaleMode('factor')}
                    />
                    Factor
                  </label>
                </div>

                {scaleMode === 'target' ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={scaleTargetWeightText}
                      onChange={(e) => setScaleTargetWeightText(e.target.value)}
                      placeholder="grams"
                      className="w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">g</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      value={scaleFactorText}
                      onChange={(e) => setScaleFactorText(e.target.value)}
                      placeholder="e.g. 2"
                      className="w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">×</span>
                  </div>
                )}

                {scaledPreview.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">
                      {scaledPreview.error}
                    </p>
                  </div>
                )}

                {scaledPreview.scaledVersion ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Scale factor:</span>{' '}
                      {scaledPreview.scaledVersion.scaledFrom.scaleFactor} |{' '}
                      <span className="font-medium">Target:</span>{' '}
                      {scaledPreview.scaledVersion.scaledFrom.targetWeight}g
                    </div>

                    {(() => {
                      const ingredientsResult = scaledPreview.scaledVersion.getIngredients();
                      if (ingredientsResult.isFailure()) {
                        return (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {ingredientsResult.message}
                          </p>
                        );
                      }
                      const ingredients = [...ingredientsResult.value];
                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                <th className="py-2 pr-2">Ingredient</th>
                                <th className="py-2 pr-2">Original</th>
                                <th className="py-2 pr-2">Scaled</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ingredients.map((ing, idx) => {
                                const unit = (ing.raw.unit ?? 'g') as MeasurementUnit;
                                const scaledAmountResult = Calculations.scaleAmount(
                                  ing.raw.originalAmount,
                                  unit,
                                  ing.raw.scaleFactor
                                );
                                const scaledDisplay = scaledAmountResult.isSuccess()
                                  ? scaledAmountResult.value.displayValue
                                  : `${ing.raw.amount}${unit === 'g' ? 'g' : ' ' + unit}`;
                                const originalDisplay = `${ing.raw.originalAmount}${
                                  unit === 'g' ? 'g' : ' ' + unit
                                }`;

                                return (
                                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                                    <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">
                                      {ing.ingredient.name}
                                    </td>
                                    <td className="py-2 pr-2 text-gray-500 dark:text-gray-400 font-mono">
                                      {originalDisplay}
                                    </td>
                                    <td className="py-2 pr-2 text-gray-700 dark:text-gray-300 font-mono">
                                      {scaledDisplay}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Enter a target weight or factor to preview scaling.
                  </p>
                )}
              </div>
            </DetailSection>
          )}

          {/* Ingredients List */}
          {!isEditing && (
            <DetailSection title="Ingredients" defaultCollapsed={false} className="mb-6">
              <IngredientsList fillingId={fillingId} />
            </DetailSection>
          )}

          {/* Version Notes */}
          {!isEditing && goldenVersion.notes && (
            <DetailSection title="Notes" defaultCollapsed={false} className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">{goldenVersion.notes}</p>
            </DetailSection>
          )}

          {/* Version History */}
          {!isEditing && filling.versionCount > 1 && (
            <DetailSection title="Version History" defaultCollapsed={true} className="mb-6">
              <ul className="space-y-2">
                {filling.versions.map((version) => (
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
          {!isEditing && filling.raw.urls && filling.raw.urls.length > 0 && (
            <DetailSection title="Links" defaultCollapsed={true} className="mb-6">
              <ul className="space-y-2">
                {filling.raw.urls.map((url, idx) => (
                  <li key={idx}>
                    <a
                      href={url.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-chocolate-600 dark:text-chocolate-400 hover:underline"
                    >
                      {url.category}
                    </a>
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}
        </div>

        <div className="xl:sticky xl:top-4 self-start">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {filling.name}
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-mono break-all">
                  {fillingId as unknown as string}
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Print
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <span className="font-medium">Source:</span> {sourceId}
                </div>
                <div>
                  <span className="font-medium">Version:</span> {goldenVersion.versionSpec}
                </div>
                {goldenVersion.createdDate && (
                  <div>
                    <span className="font-medium">Created:</span> {goldenVersion.createdDate.split('T')[0]}
                  </div>
                )}
                {previewRecipeForRender && (
                  <div>
                    <span className="font-medium">Batch:</span> {previewRecipeForRender.baseWeight}g
                  </div>
                )}
                {scaledPreview.scaledVersion && (
                  <div>
                    <span className="font-medium">Scale:</span>{' '}
                    {scaledPreview.scaledVersion.scaledFrom.scaleFactor}
                  </div>
                )}
                {filling.raw.derivedFrom && (
                  <div className="mt-2">
                    <span className="font-medium">Provenance:</span>{' '}
                    <span className="font-mono break-all">
                      {filling.raw.derivedFrom.sourceVersionId as unknown as string}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Ingredients</h3>
                {(() => {
                  const versionForIngredients = scaledPreview.scaledVersion ?? null;
                  const ingredientsResult = versionForIngredients
                    ? versionForIngredients.getIngredients()
                    : goldenVersion.getIngredients();
                  if (ingredientsResult.isFailure()) {
                    return (
                      <div className="text-sm text-red-600 dark:text-red-400">
                        {ingredientsResult.message}
                      </div>
                    );
                  }
                  const ingredients = [...ingredientsResult.value];

                  return (
                    <ul className="space-y-1">
                      {ingredients.map((ing, idx) => {
                        const raw = ing.raw as any;
                        const unit = (raw.unit ?? 'g') as MeasurementUnit;
                        const amountText = (() => {
                          if (!versionForIngredients) {
                            return `${raw.amount}${unit === 'g' ? 'g' : ' ' + unit}`;
                          }
                          const scaledAmountResult = Calculations.scaleAmount(
                            raw.originalAmount,
                            unit,
                            raw.scaleFactor
                          );
                          return scaledAmountResult.isSuccess()
                            ? scaledAmountResult.value.displayValue
                            : `${raw.amount}${unit === 'g' ? 'g' : ' ' + unit}`;
                        })();
                        return (
                          <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-mono text-gray-700 dark:text-gray-200">{amountText}</span>{' '}
                            <span>{ing.ingredient.name}</span>
                            {raw.notes ? (
                              <span className="text-gray-500 dark:text-gray-400"> — {raw.notes}</span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  );
                })()}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Instructions</h3>
                {!preferredProcedureId ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No procedure linked.</div>
                ) : renderedPreviewProcedure.error ? (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {renderedPreviewProcedure.error}
                  </div>
                ) : renderedPreviewProcedure.rendered ? (
                  <ol className="list-decimal ml-5 space-y-2">
                    {renderedPreviewProcedure.rendered.steps.map((step: any, idx: number) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                        {step.renderedDescription}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
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
 * Component showing ingredients list for a filling
 */
function IngredientsList({ fillingId }: { fillingId: FillingId }): React.ReactElement {
  const { runtime } = useChocolate();

  if (!runtime) {
    return <p className="text-gray-400 dark:text-gray-500">Loading...</p>;
  }

  const fillingResult = runtime.fillings.get(fillingId);
  if (fillingResult.isFailure()) {
    return <p className="text-gray-400 dark:text-gray-500">Filling not found</p>;
  }

  const filling = fillingResult.value;
  const goldenVersion = filling.goldenVersion;
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
            {ing.raw.amount}
            {ing.raw.unit ?? 'g'}
          </span>
        </li>
      ))}
    </ul>
  );
}
