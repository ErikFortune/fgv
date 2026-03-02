/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Filling recipe edit view.
 * Coordinates recipe-level editing (EditedFillingRecipe) with variation-level editing (EditingSession).
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EyeIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, CheckIcon } from '@heroicons/react/24/solid';
import { DocumentDuplicateIcon, PlusIcon } from '@heroicons/react/24/outline';
import { TagIcon, DocumentTextIcon, HashtagIcon } from '@heroicons/react/20/solid';

import {
  EditField,
  EditSection,
  TextInput,
  TagsInput,
  MultiActionButton,
  useTypeaheadMatch
} from '@fgv/ts-app-shell';
import type {
  Entities,
  FillingName,
  IngredientId,
  LibraryRuntime,
  Measurement,
  MeasurementUnit,
  Model,
  ProcedureId,
  RatingScore,
  SpoonLevel,
  FillingRecipeVariationSpec,
  UserLibrary
} from '@fgv/ts-chocolate';

import { EditingToolbar, NotesEditor, useEditingContext, type IChangeIndicator } from '../editing';
import { DerivedFromIndicator } from '../common';
import { useWorkspace } from '../workspace';

const ALL_MEASUREMENT_UNITS: ReadonlyArray<MeasurementUnit> = [
  'g',
  'mL',
  'tsp',
  'Tbsp',
  'pinch',
  'seeds',
  'pods'
];
const ALL_SPOON_LEVELS: ReadonlyArray<SpoonLevel> = ['level', 'heaping'];

type EditedFillingRecipe = LibraryRuntime.EditedFillingRecipe;
type EditingSession = UserLibrary.Session.EditingSession;
type ISaveAnalysis = UserLibrary.Session.ISaveAnalysis;

// ============================================================================
// Props
// ============================================================================

export type FillingSaveMode = 'update' | 'new-variation' | 'alternatives' | 'new-recipe';

/**
 * Controls which editing affordances are available:
 * - 'library': direct alternate editing in collapsible; no 'Save as Alternatives'
 * - 'production': 'Save as Alternatives' available; alternates shown read-only
 */
export type FillingEditMode = 'library' | 'production';

export interface IFillingEditViewProps {
  /** Recipe-level wrapper with undo/redo */
  readonly wrapper: EditedFillingRecipe;
  /** Variation-level editing session */
  readonly session: EditingSession;
  /** Currently selected variation spec */
  readonly selectedVariationSpec: FillingRecipeVariationSpec;
  /** Callback when user selects a different variation */
  readonly onVariationChange: (spec: FillingRecipeVariationSpec) => void;
  /** Available ingredients for datalist suggestions */
  readonly availableIngredients: ReadonlyArray<LibraryRuntime.AnyIngredient>;
  /** Available procedures for datalist suggestions */
  readonly availableProcedures: ReadonlyArray<LibraryRuntime.IProcedure>;
  /** Callback when save is requested with a specific mode */
  readonly onSave: (mode: FillingSaveMode) => void;
  /** Callback when cancel is requested */
  readonly onCancel: () => void;
  /** Optional callback invoked after every mutation (undo, redo, or field edit). */
  readonly onMutation?: () => void;
  /** If true, the source entity is read-only */
  readonly readOnly?: boolean;
  /** Callback after any mutation for parent state tracking */
  readonly onMutate?: () => void;
  /** Optional callback to open the preview pane */
  readonly onPreview?: () => void;
  /** Callback to create a new ingredient from an unresolved name */
  readonly onCreateIngredient?: (seed: string) => void;
  /** Callback to create a new procedure from an unresolved name */
  readonly onCreateProcedure?: (seed: string) => void;
  /** Controls which editing affordances are shown; defaults to 'library' */
  readonly editMode?: FillingEditMode;
}

// ============================================================================
// Rating Categories
// ============================================================================

const RATING_CATEGORIES: ReadonlyArray<Entities.Fillings.RatingCategory> = [
  'overall',
  'taste',
  'texture',
  'shelf-life',
  'appearance',
  'workability',
  'difficulty',
  'durability'
];

const CATEGORY_OPTIONS: ReadonlyArray<Entities.Fillings.FillingCategory> = ['ganache', 'caramel', 'gianduja'];

function RatingStars({
  score,
  onChange
}: {
  readonly score: number | undefined;
  readonly onChange: (score: number) => void;
}): React.ReactElement {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = score !== undefined && n <= score;
        return (
          <button
            key={n}
            type="button"
            onClick={(): void => onChange(n)}
            className="p-0 text-amber-400 hover:text-amber-500 transition-colors"
            title={`${n} star${n > 1 ? 's' : ''}`}
          >
            {filled ? <StarIconSolid className="w-4 h-4" /> : <StarIcon className="w-4 h-4" />}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getIngredientDisplayName(
  ingredientId: IngredientId,
  suggestions: ReadonlyArray<{ id: IngredientId; name: string }>
): string {
  return suggestions.find((s) => s.id === ingredientId)?.name ?? String(ingredientId);
}

function getProcedureDisplayName(
  procedureId: ProcedureId,
  suggestions: ReadonlyArray<{ id: ProcedureId; name: string }>
): string {
  return suggestions.find((s) => s.id === procedureId)?.name ?? String(procedureId);
}

// ============================================================================
// AlternateAddInput Component
// ============================================================================

function AlternateAddInput({
  ingredientId,
  onAdd,
  datalistId
}: {
  readonly ingredientId: IngredientId;
  readonly onAdd: (producedId: IngredientId, input: string) => void;
  readonly datalistId: string;
}): React.ReactElement {
  const [value, setValue] = useState('');

  const commit = (v: string): void => {
    if (v.trim()) {
      onAdd(ingredientId, v);
      setValue('');
    }
  };

  return (
    <input
      type="text"
      className="text-xs border border-dashed border-gray-300 rounded px-1.5 py-0.5 w-32 text-gray-500 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
      value={value}
      list={datalistId}
      placeholder="+ add alternate"
      onChange={(e): void => setValue(e.target.value)}
      onBlur={(): void => commit(value)}
      onKeyDown={(e): void => {
        if (e.key === 'Enter' || e.key === 'Tab') {
          commit(value);
        }
      }}
    />
  );
}

// ============================================================================
// ProcedureAlternateAddInput Component
// ============================================================================

function ProcedureAlternateAddInput({
  onAdd,
  datalistId
}: {
  readonly onAdd: (input: string) => void;
  readonly datalistId: string;
}): React.ReactElement {
  const [value, setValue] = useState('');

  const commit = (v: string): void => {
    if (v.trim()) {
      onAdd(v);
      setValue('');
    }
  };

  return (
    <input
      type="text"
      className="text-xs border border-dashed border-gray-300 rounded px-1.5 py-0.5 w-32 text-gray-500 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
      value={value}
      list={datalistId}
      placeholder="+ add alternate"
      onChange={(e): void => setValue(e.target.value)}
      onBlur={(): void => commit(value)}
      onKeyDown={(e): void => {
        if (e.key === 'Enter' || e.key === 'Tab') {
          commit(value);
        }
      }}
    />
  );
}

// ============================================================================
// FillingEditView Component
// ============================================================================

export function FillingEditView(props: IFillingEditViewProps): React.ReactElement {
  const {
    wrapper,
    session,
    selectedVariationSpec,
    onVariationChange,
    availableIngredients,
    availableProcedures,
    onSave,
    onCancel,
    onMutation,
    readOnly,
    onMutate,
    onPreview,
    onCreateIngredient,
    onCreateProcedure,
    editMode = 'library'
  } = props;

  const isLibraryMode = editMode === 'library';
  const isProductionMode = editMode === 'production';

  // Recipe-level editing context (undo/redo for wrapper)
  const {
    data: { logger }
  } = useWorkspace();
  const ctx = useEditingContext<EditedFillingRecipe>({
    wrapper,
    onSave: (): void => onSave('update'),
    onCancel,
    onMutation,
    readOnly,
    logger,
    checkHasChanges: (w) => w.hasChanges(w.initial)
  });

  // Separate version counter for session mutations (triggers re-render)
  const [sessionVersion, setSessionVersion] = useState(0);

  // ---- Change indicators ----

  const changes = useMemo(() => wrapper.getChanges(wrapper.initial), [wrapper, ctx.version]);

  const changeIndicators: ReadonlyArray<IChangeIndicator> = useMemo(
    () => [
      { key: 'name', label: 'Name', icon: <TagIcon />, changed: changes.nameChanged },
      {
        key: 'description',
        label: 'Description',
        icon: <DocumentTextIcon />,
        changed: changes.descriptionChanged
      },
      { key: 'tags', label: 'Tags', icon: <HashtagIcon />, changed: changes.tagsChanged },
      {
        key: 'goldenVariation',
        label: 'Golden Variation',
        icon: <TagIcon />,
        changed: changes.goldenVariationSpecChanged
      },
      { key: 'variations', label: 'Variations', icon: <TagIcon />, changed: changes.variationsChanged }
    ],
    [changes]
  );

  // Draft state for datalist inputs
  const [ingredientInputDraft, setIngredientInputDraft] = useState<Record<number, string>>({});
  const [newIngredientText, setNewIngredientText] = useState('');
  const [newProcedureText, setNewProcedureText] = useState('');

  // Unresolved state
  const [unresolvedIngredients, setUnresolvedIngredients] = useState<Record<number, string>>({});
  const [unresolvedNewIngredient, setUnresolvedNewIngredient] = useState<string | undefined>(undefined);
  const [unresolvedNewProcedure, setUnresolvedNewProcedure] = useState<string | undefined>(undefined);
  const [unresolvedAlternates, setUnresolvedAlternates] = useState<Record<IngredientId, string>>({});
  const [unresolvedProcedureAlternate, setUnresolvedProcedureAlternate] = useState<string | undefined>(
    undefined
  );
  const [expandedIngredients, setExpandedIngredients] = useState<Set<number>>(new Set());
  const [showAddVariationForm, setShowAddVariationForm] = useState(false);
  const [newVariationDate, setNewVariationDate] = useState('');
  const [newVariationName, setNewVariationName] = useState('');
  const [editingVariationName, setEditingVariationName] = useState<FillingRecipeVariationSpec | null>(null);
  const [editingVariationNameValue, setEditingVariationNameValue] = useState('');

  const toggleIngredientExpanded = useCallback((index: number): void => {
    setExpandedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const ingredientSuggestions = useMemo(() => {
    return availableIngredients.map((ing) => ({ id: ing.id, name: ing.name }));
  }, [availableIngredients]);

  const procedureSuggestions = useMemo(() => {
    return availableProcedures.map((proc) => ({ id: proc.id, name: proc.name }));
  }, [availableProcedures]);

  const ingredientMatcher = useTypeaheadMatch(ingredientSuggestions);
  const procedureMatcher = useTypeaheadMatch(procedureSuggestions);

  // Current session state
  const producedIngredients = session.produced.ingredients;
  const currentProcedureId = session.produced.snapshot.procedureId;

  // Save analysis (sessionVersion triggers re-computation after mutations)
  const saveAnalysis = useMemo<ISaveAnalysis>(() => session.analyzeSaveOptions(), [session, sessionVersion]);

  const notifySession = useCallback((): void => {
    setSessionVersion((v) => v + 1);
    onMutate?.();
  }, [onMutate]);

  const notifyWrapper = useCallback((): void => {
    ctx.notifyMutation();
    onMutate?.();
  }, [ctx, onMutate]);

  // ---- Recipe-Level Field Handlers ----

  const handleNameChange = useCallback(
    (value: string) => {
      wrapper.setName(value as FillingName);
      notifyWrapper();
    },
    [wrapper, notifyWrapper]
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      wrapper.setCategory(e.target.value as Entities.Fillings.FillingCategory);
      notifyWrapper();
    },
    [wrapper, notifyWrapper]
  );

  const handleDescriptionChange = useCallback(
    (value: string | undefined) => {
      wrapper.setDescription(value?.trim() ? value : undefined);
      notifyWrapper();
    },
    [wrapper, notifyWrapper]
  );

  const handleTagsChange = useCallback(
    (value: ReadonlyArray<string> | undefined) => {
      wrapper.setTags(value);
      notifyWrapper();
    },
    [wrapper, notifyWrapper]
  );

  // ---- Session Ingredient Handlers ----

  const commitIngredientInput = useCallback(
    (index: number, input: string): void => {
      const match = ingredientMatcher.resolveOnBlur(input);
      if (match) {
        const existing = producedIngredients[index];
        if (match.id !== existing.ingredientId) {
          // Replace: remove old then add new (preserves amount/modifiers)
          session.removeIngredient(existing.ingredientId);
          session.setIngredient(match.id, existing.amount, existing.unit, existing.modifiers);
          // Also update preferredId in source variation if this ingredient exists there
          if (!readOnly) {
            const sourceVariation = wrapper.current.variations.find(
              (v) => v.variationSpec === selectedVariationSpec
            );
            const sourceIng = sourceVariation?.ingredients.find((ing) =>
              ing.ingredient.ids.includes(existing.ingredientId)
            );
            if (sourceIng) {
              const currentIds = sourceIng.ingredient.ids;
              const newId = match.id as IngredientId;
              const newIds = currentIds.includes(newId) ? currentIds : [...currentIds, newId];
              wrapper.setVariationIngredientAlternates(
                selectedVariationSpec,
                existing.ingredientId,
                newIds,
                newId
              );
            }
          }
          notifySession();
          notifyWrapper();
        }
        // Same ingredient — no-op (just clear draft state)
        setIngredientInputDraft((prev) => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
        setUnresolvedIngredients((prev) => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
      } else if (input.trim()) {
        setUnresolvedIngredients((prev) => ({ ...prev, [index]: input.trim() }));
      }
    },
    [ingredientMatcher, notifySession, session, producedIngredients]
  );

  const handleIngredientAmountChange = useCallback(
    (index: number, amount: number): void => {
      const existing = producedIngredients[index];
      session.setIngredient(existing.ingredientId, amount as Measurement, existing.unit, existing.modifiers);
      notifySession();
    },
    [notifySession, session, producedIngredients]
  );

  const handleIngredientUnitChange = useCallback(
    (index: number, unit: MeasurementUnit): void => {
      const existing = producedIngredients[index];
      const newAmount = unit === 'pinch' ? (1 as Measurement) : existing.amount;
      let newModifiers: Entities.Fillings.IIngredientModifiers | undefined;
      if (unit === 'tsp' || unit === 'Tbsp') {
        // Spoon units: keep spoon-specific modifiers, drop weight-specific ones
        newModifiers =
          existing.modifiers?.spoonLevel !== undefined || existing.modifiers?.toTaste !== undefined
            ? { spoonLevel: existing.modifiers?.spoonLevel, toTaste: existing.modifiers?.toTaste }
            : undefined;
      } else if (unit === 'g' || unit === 'mL') {
        // Weight units: keep weight-specific modifiers, drop spoon-specific ones
        newModifiers =
          existing.modifiers?.yieldFactor !== undefined || existing.modifiers?.processNote !== undefined
            ? { yieldFactor: existing.modifiers?.yieldFactor, processNote: existing.modifiers?.processNote }
            : undefined;
      } else {
        // pinch, seeds, pods: no modifiers
        newModifiers = undefined;
      }
      session.setIngredient(existing.ingredientId, newAmount, unit, newModifiers);
      notifySession();
    },
    [notifySession, session, producedIngredients]
  );

  const handleIngredientModifiersChange = useCallback(
    (index: number, modifiers: Entities.Fillings.IIngredientModifiers | undefined): void => {
      const existing = producedIngredients[index];
      session.setIngredient(existing.ingredientId, existing.amount, existing.unit, modifiers);
      notifySession();
    },
    [notifySession, session, producedIngredients]
  );

  const handleRemoveIngredient = useCallback(
    (index: number): void => {
      const existing = producedIngredients[index];
      session.removeIngredient(existing.ingredientId);
      setIngredientInputDraft((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      setUnresolvedIngredients((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      notifySession();
    },
    [notifySession, session, producedIngredients]
  );

  const commitNewIngredient = useCallback(
    (input: string): void => {
      const match = ingredientMatcher.resolveOnBlur(input);
      if (match) {
        session.setIngredient(match.id, 0 as Measurement);
        setNewIngredientText('');
        setUnresolvedNewIngredient(undefined);
        notifySession();
      } else if (input.trim()) {
        setUnresolvedNewIngredient(input.trim());
      }
    },
    [ingredientMatcher, notifySession, session]
  );

  // ---- Session Procedure Handler ----

  const commitNewProcedure = useCallback(
    (input: string): void => {
      const match = procedureMatcher.resolveOnBlur(input);
      if (match) {
        session.setProcedure(match.id);
        setNewProcedureText('');
        setUnresolvedNewProcedure(undefined);
        notifySession();
      } else if (input.trim()) {
        setUnresolvedNewProcedure(input.trim());
      }
    },
    [procedureMatcher, notifySession, session]
  );

  const handleClearProcedure = useCallback((): void => {
    session.setProcedure(undefined);
    notifySession();
  }, [session, notifySession]);

  // ---- Alternate Ingredient Handlers (wrapper-level, source model) ----

  const getSourceIngredient = useCallback(
    (producedId: IngredientId) => {
      const variation = wrapper.current.variations.find((v) => v.variationSpec === selectedVariationSpec);
      return variation?.ingredients.find((ing) => ing.ingredient.ids.includes(producedId));
    },
    [wrapper, selectedVariationSpec]
  );

  const handleAddAlternate = useCallback(
    (producedId: IngredientId, input: string): void => {
      const match = ingredientMatcher.resolveOnBlur(input);
      if (!match) {
        if (input.trim()) {
          setUnresolvedAlternates((prev) => ({ ...prev, [producedId]: input.trim() }));
        }
        return;
      }
      setUnresolvedAlternates((prev) => {
        const next = { ...prev };
        delete next[producedId];
        return next;
      });
      const sourceIng = getSourceIngredient(producedId);
      if (!sourceIng) return;
      const currentIds = sourceIng.ingredient.ids;
      if (currentIds.includes(match.id as IngredientId)) return;
      const newIds = [...currentIds, match.id as IngredientId];
      wrapper.setVariationIngredientAlternates(
        selectedVariationSpec,
        producedId,
        newIds,
        sourceIng.ingredient.preferredId ?? producedId
      );
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, ingredientMatcher, getSourceIngredient, notifyWrapper]
  );

  const handleRemoveAlternate = useCallback(
    (producedId: IngredientId, removeId: IngredientId): void => {
      const sourceIng = getSourceIngredient(producedId);
      if (!sourceIng) return;
      const newIds = sourceIng.ingredient.ids.filter((id) => id !== removeId);
      if (newIds.length === 0) return;
      const currentPreferred = sourceIng.ingredient.preferredId ?? producedId;
      const newPreferred = currentPreferred === removeId ? (newIds[0] as IngredientId) : currentPreferred;
      wrapper.setVariationIngredientAlternates(selectedVariationSpec, producedId, newIds, newPreferred);
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, getSourceIngredient, notifyWrapper]
  );

  const handleSetPreferredAlternate = useCallback(
    (producedId: IngredientId, preferredId: IngredientId): void => {
      const sourceIng = getSourceIngredient(producedId);
      if (!sourceIng) return;
      wrapper.setVariationIngredientAlternates(
        selectedVariationSpec,
        producedId,
        sourceIng.ingredient.ids,
        preferredId
      );
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, getSourceIngredient, notifyWrapper]
  );

  // ---- Alternate Procedure Handlers (wrapper-level, source model) ----

  const getSourceVariationProcedures = useCallback(() => {
    return wrapper.current.variations.find((v) => v.variationSpec === selectedVariationSpec)?.procedures;
  }, [wrapper, selectedVariationSpec]);

  const handleAddProcedureAlternate = useCallback(
    (input: string): void => {
      const match = procedureMatcher.resolveOnBlur(input);
      if (!match) {
        if (input.trim()) {
          setUnresolvedProcedureAlternate(input.trim());
        }
        return;
      }
      setUnresolvedProcedureAlternate(undefined);
      const current = getSourceVariationProcedures();
      const currentOptions = current?.options ?? [];
      if (currentOptions.some((o) => o.id === match.id)) return;
      const newOptions = [...currentOptions, { id: match.id as ProcedureId }];
      const preferredId = current?.preferredId ?? (match.id as ProcedureId);
      wrapper.setVariationProcedureAlternates(selectedVariationSpec, newOptions, preferredId);
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, procedureMatcher, getSourceVariationProcedures, notifyWrapper]
  );

  const handleRemoveProcedureAlternate = useCallback(
    (removeId: ProcedureId): void => {
      const current = getSourceVariationProcedures();
      if (!current) return;
      const newOptions = current.options.filter((o) => o.id !== removeId);
      const newPreferred = current.preferredId === removeId ? newOptions[0]?.id : current.preferredId;
      wrapper.setVariationProcedureAlternates(selectedVariationSpec, newOptions, newPreferred);
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, getSourceVariationProcedures, notifyWrapper]
  );

  const handleSetPreferredProcedure = useCallback(
    (preferredId: ProcedureId): void => {
      const current = getSourceVariationProcedures();
      if (!current) return;
      wrapper.setVariationProcedureAlternates(selectedVariationSpec, current.options, preferredId);
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, getSourceVariationProcedures, notifyWrapper]
  );

  // ---- Variation Management Handlers (library mode, wrapper-level) ----

  const handleSetGoldenVariation = useCallback(
    (spec: FillingRecipeVariationSpec): void => {
      wrapper.setGoldenVariationSpec(spec);
      notifyWrapper();
    },
    [wrapper, notifyWrapper]
  );

  const handleRemoveVariation = useCallback(
    (spec: FillingRecipeVariationSpec): void => {
      wrapper.removeVariation(spec);
      notifyWrapper();
    },
    [wrapper, notifyWrapper]
  );

  const handleCommitVariationName = useCallback(
    (spec: FillingRecipeVariationSpec, name: string): void => {
      wrapper.setVariationName(spec, name || undefined);
      notifyWrapper();
      setEditingVariationName(null);
      setEditingVariationNameValue('');
    },
    [wrapper, notifyWrapper]
  );

  const handleCreateBlankVariation = useCallback((): void => {
    const date = newVariationDate || undefined;
    const name = newVariationName.trim() || undefined;
    const result = wrapper.createBlankVariation({ date, name });
    if (result.isSuccess()) {
      notifyWrapper();
      onVariationChange(result.value);
      setShowAddVariationForm(false);
      setNewVariationDate('');
      setNewVariationName('');
    }
  }, [wrapper, newVariationDate, newVariationName, notifyWrapper, onVariationChange]);

  const handleDuplicateVariation = useCallback((): void => {
    const date = newVariationDate || undefined;
    const name = newVariationName.trim() || undefined;
    const result = wrapper.duplicateVariation(selectedVariationSpec, { date, name });
    if (result.isSuccess()) {
      notifyWrapper();
      onVariationChange(result.value);
      setShowAddVariationForm(false);
      setNewVariationDate('');
      setNewVariationName('');
    }
  }, [wrapper, selectedVariationSpec, newVariationDate, newVariationName, notifyWrapper, onVariationChange]);

  // ---- Rating Handlers (on variation entity via wrapper) ----

  const handleRatingChange = useCallback(
    (category: Entities.Fillings.RatingCategory, score: number): void => {
      // Get current variation from wrapper and update ratings
      const variation = wrapper.current.variations.find((v) => v.variationSpec === selectedVariationSpec);
      if (!variation) {
        return;
      }
      const currentRatings = variation.ratings ?? [];
      const existingIndex = currentRatings.findIndex((r) => r.category === category);
      const newRating: Entities.Fillings.IFillingRating = {
        category,
        score: score as RatingScore
      };

      let updatedRatings: Entities.Fillings.IFillingRating[];
      if (existingIndex >= 0) {
        updatedRatings = [...currentRatings];
        updatedRatings[existingIndex] = newRating;
      } else {
        updatedRatings = [...currentRatings, newRating];
      }

      wrapper.replaceVariation(selectedVariationSpec, { ...variation, ratings: updatedRatings });
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, notifyWrapper]
  );

  // ---- Session Notes Handler ----

  const handleNotesChange = useCallback(
    (value: ReadonlyArray<Model.ICategorizedNote> | undefined) => {
      session.setNotes(value ? [...value] : []);
      notifySession();
    },
    [session, notifySession]
  );

  // ---- Clear resolved entries ----

  useEffect(() => {
    setUnresolvedIngredients((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const indexStr of Object.keys(next)) {
        const match = ingredientMatcher.findExactMatch(next[Number(indexStr)]);
        if (match) {
          delete next[Number(indexStr)];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    if (unresolvedNewIngredient && ingredientMatcher.findExactMatch(unresolvedNewIngredient)) {
      setUnresolvedNewIngredient(undefined);
    }
    setUnresolvedAlternates((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const key of Object.keys(next) as IngredientId[]) {
        if (ingredientMatcher.findExactMatch(next[key])) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [producedIngredients, availableIngredients, ingredientMatcher, unresolvedNewIngredient]);

  useEffect(() => {
    if (unresolvedNewProcedure && procedureMatcher.findExactMatch(unresolvedNewProcedure)) {
      setUnresolvedNewProcedure(undefined);
    }
    if (unresolvedProcedureAlternate && procedureMatcher.findExactMatch(unresolvedProcedureAlternate)) {
      setUnresolvedProcedureAlternate(undefined);
    }
  }, [availableProcedures, procedureMatcher, unresolvedNewProcedure, unresolvedProcedureAlternate]);

  // ---- Variation selector ----

  const currentVariation = wrapper.current.variations.find((v) => v.variationSpec === selectedVariationSpec);

  // ---- Save button ----

  const saveActions = useMemo(() => {
    const actions: Array<{
      id: string;
      label: string;
      icon: React.ReactElement;
      onSelect: () => void;
    }> = [];

    // When source is read-only, skip actions that write to the same collection
    if (!readOnly && saveAnalysis.canCreateVariation && !saveAnalysis.mustCreateNew) {
      actions.push({
        id: 'update',
        label: 'Save',
        icon: <CheckIcon className="h-3.5 w-3.5" />,
        onSelect: (): void => onSave('update')
      });
    }

    if (!readOnly && saveAnalysis.canCreateVariation) {
      actions.push({
        id: 'new-variation',
        label: 'Save as New Variation',
        icon: <PlusIcon className="h-3.5 w-3.5" />,
        onSelect: (): void => onSave('new-variation')
      });
    }

    if (!readOnly && isProductionMode && saveAnalysis.canAddAlternatives) {
      actions.push({
        id: 'alternatives',
        label: 'Save as Alternatives',
        icon: <DocumentDuplicateIcon className="h-3.5 w-3.5" />,
        onSelect: (): void => onSave('alternatives')
      });
    }

    // Always available — creates an entirely new recipe derived from this one
    actions.push({
      id: 'new-recipe',
      label: 'Save as New Recipe',
      icon: <DocumentDuplicateIcon className="h-3.5 w-3.5" />,
      onSelect: (): void => onSave('new-recipe')
    });

    return actions;
  }, [saveAnalysis, onSave, readOnly]);

  const customSaveButton =
    saveActions.length > 0 ? (
      <MultiActionButton
        primaryAction={saveActions[0]}
        alternativeActions={saveActions.slice(1)}
        variant="primary"
      />
    ) : undefined;

  return (
    <div className="flex flex-col p-4 overflow-y-auto h-full">
      <EditingToolbar
        context={ctx}
        changeIndicators={changeIndicators}
        customSaveButton={customSaveButton}
        extraButtons={
          onPreview ? (
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors text-gray-600 hover:text-choco-primary hover:bg-gray-100"
              title="Open filling preview pane"
            >
              <EyeIcon className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          ) : undefined
        }
      />

      {/* Derived-from indicator */}
      {wrapper.current.derivedFrom && (
        <div className="px-1 py-1">
          <DerivedFromIndicator
            sourceVariationId={wrapper.current.derivedFrom.sourceVariationId}
            derivedDate={wrapper.current.derivedFrom.derivedDate}
          />
        </div>
      )}

      {/* Identity Section */}
      <EditSection title="Identity">
        <EditField label="Base ID">
          <span className="text-sm font-mono text-gray-500">{wrapper.current.baseId}</span>
        </EditField>
        <EditField label="Name">
          <TextInput
            value={wrapper.current.name}
            onChange={handleNameChange}
            placeholder="e.g. Dark Chocolate Ganache"
          />
        </EditField>
        <EditField label="Category">
          <select
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
            value={wrapper.current.category}
            onChange={handleCategoryChange}
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </EditField>
        <EditField label="Description">
          <TextInput
            value={wrapper.current.description ?? ''}
            onChange={handleDescriptionChange}
            placeholder="Optional description"
          />
        </EditField>
      </EditSection>

      {/* Variation Selector / Curation */}
      {(wrapper.variations.length > 1 || isLibraryMode) && (
        <EditSection title="Variations">
          <div className="flex flex-wrap gap-1.5 items-start">
            {wrapper.variations.map((v) => {
              const isSelected = v.variationSpec === selectedVariationSpec;
              const isGolden = v.variationSpec === wrapper.goldenVariationSpec;
              const canRemove = isLibraryMode && !readOnly && !isGolden && wrapper.variations.length > 1;
              const isEditingName = editingVariationName === v.variationSpec;

              return (
                <div
                  key={v.variationSpec}
                  className={`inline-flex items-center gap-0.5 rounded border text-xs transition-colors ${
                    isSelected
                      ? 'bg-choco-primary text-white border-choco-primary'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {/* Golden star toggle (library mode) */}
                  {isLibraryMode && !readOnly && (
                    <button
                      type="button"
                      title={isGolden ? 'Golden variation' : 'Set as golden'}
                      onClick={(): void => handleSetGoldenVariation(v.variationSpec)}
                      className={`pl-1.5 py-1 shrink-0 ${
                        isGolden
                          ? isSelected
                            ? 'text-amber-300'
                            : 'text-amber-500'
                          : isSelected
                          ? 'text-white/40 hover:text-amber-300'
                          : 'text-gray-300 hover:text-amber-400'
                      }`}
                    >
                      ★
                    </button>
                  )}
                  {/* Golden star display (production/read-only) */}
                  {(!isLibraryMode || readOnly) && isGolden && (
                    <span
                      className={`pl-1.5 py-1 shrink-0 ${isSelected ? 'text-amber-300' : 'text-amber-500'}`}
                    >
                      ★
                    </span>
                  )}

                  {/* Variation label — click to select, double-click to edit name (library mode) */}
                  {isEditingName ? (
                    <input
                      autoFocus
                      type="text"
                      className="text-xs px-1 py-0.5 w-28 bg-white text-gray-800 border-0 outline-none rounded"
                      value={editingVariationNameValue}
                      onChange={(e): void => setEditingVariationNameValue(e.target.value)}
                      onBlur={(): void =>
                        handleCommitVariationName(v.variationSpec, editingVariationNameValue)
                      }
                      onKeyDown={(e): void => {
                        if (e.key === 'Enter')
                          handleCommitVariationName(v.variationSpec, editingVariationNameValue);
                        if (e.key === 'Escape') {
                          setEditingVariationName(null);
                          setEditingVariationNameValue('');
                        }
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={(): void => onVariationChange(v.variationSpec)}
                      onDoubleClick={(): void => {
                        if (isLibraryMode && !readOnly) {
                          setEditingVariationName(v.variationSpec);
                          setEditingVariationNameValue(v.name ?? '');
                        }
                      }}
                      className={`px-1.5 py-1 ${isSelected ? '' : 'hover:border-choco-primary'}`}
                      title={
                        isLibraryMode && !readOnly ? 'Click to select, double-click to rename' : undefined
                      }
                    >
                      {v.name ?? v.variationSpec}
                    </button>
                  )}

                  {/* Remove button (library mode, non-golden) */}
                  {canRemove && (
                    <button
                      type="button"
                      title="Remove variation"
                      onClick={(): void => handleRemoveVariation(v.variationSpec)}
                      className={`pr-1 py-1 shrink-0 ${
                        isSelected ? 'text-white/60 hover:text-white' : 'text-gray-300 hover:text-red-400'
                      }`}
                    >
                      ✕
                    </button>
                  )}
                  {/* Spacer for non-removable chips to keep consistent height */}
                  {!canRemove && !isEditingName && <span className="pr-1" />}
                </div>
              );
            })}

            {/* Add Variation button / form (library mode) */}
            {isLibraryMode && !readOnly && (
              <>
                {!showAddVariationForm ? (
                  <button
                    type="button"
                    onClick={(): void => setShowAddVariationForm(true)}
                    className="px-2.5 py-1 text-xs rounded border border-dashed border-gray-300 text-gray-400 hover:border-choco-primary hover:text-choco-primary transition-colors"
                  >
                    + New
                  </button>
                ) : (
                  <div className="w-full mt-1 p-2 rounded border border-gray-200 bg-gray-50 space-y-2">
                    <div className="flex gap-2 items-center">
                      <label className="text-xs text-gray-500 shrink-0 w-10">Date</label>
                      <input
                        type="text"
                        placeholder={new Date().toISOString().split('T')[0]}
                        pattern="\d{4}-\d{2}-\d{2}"
                        className="text-xs border border-gray-300 rounded px-1.5 py-0.5 w-32 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                        value={newVariationDate}
                        onChange={(e): void => setNewVariationDate(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <label className="text-xs text-gray-500 shrink-0 w-10">Name</label>
                      <input
                        type="text"
                        placeholder="optional label"
                        className="text-xs border border-gray-300 rounded px-1.5 py-0.5 flex-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                        value={newVariationName}
                        onChange={(e): void => setNewVariationName(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={(): void => {
                          setShowAddVariationForm(false);
                          setNewVariationDate('');
                          setNewVariationName('');
                        }}
                        className="px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateBlankVariation}
                        className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        Create Blank
                      </button>
                      <button
                        type="button"
                        onClick={handleDuplicateVariation}
                        className="px-2 py-0.5 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90"
                      >
                        Duplicate Current
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </EditSection>
      )}

      {/* Ingredients Section (from EditingSession) */}
      <EditSection title={`Ingredients (${producedIngredients.length})`}>
        <div className="space-y-2">
          {producedIngredients.map((ing, index) => {
            const ingValue =
              ingredientInputDraft[index] ??
              getIngredientDisplayName(ing.ingredientId, ingredientSuggestions);
            const isSpoonUnit = ing.unit === 'tsp' || ing.unit === 'Tbsp';
            const isWeightUnit = ing.unit === 'g' || ing.unit === 'mL' || ing.unit === undefined;
            const sourceIng = getSourceIngredient(ing.ingredientId);
            const sourceIds = sourceIng?.ingredient.ids ?? [];
            const sourcePreferredId = sourceIng?.ingredient.preferredId ?? ing.ingredientId;
            const hasAlternates = sourceIds.length > 1;
            const hasNonDefaultModifiers =
              (ing.modifiers?.yieldFactor !== undefined && ing.modifiers.yieldFactor !== 1.0) ||
              !!ing.modifiers?.processNote ||
              !!ing.modifiers?.spoonLevel ||
              !!ing.modifiers?.toTaste;
            const isExpanded = expandedIngredients.has(index) || hasNonDefaultModifiers || hasAlternates;
            return (
              <div key={ing.ingredientId} className="rounded border border-gray-200 p-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    className="flex-1 min-w-0 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                    value={ingValue}
                    list="filling-ingredient-suggestions"
                    onChange={(e): void => {
                      setIngredientInputDraft((prev) => ({ ...prev, [index]: e.target.value }));
                    }}
                    onBlur={(): void => commitIngredientInput(index, ingValue)}
                    onKeyDown={(e): void => {
                      if (e.key === 'Enter' || e.key === 'Tab') {
                        commitIngredientInput(index, ingValue);
                      }
                    }}
                  />
                  <input
                    type="number"
                    className="w-20 text-sm border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-choco-primary disabled:bg-gray-50 disabled:text-gray-400"
                    value={ing.amount}
                    min={0}
                    step={isSpoonUnit ? 0.25 : 0.1}
                    disabled={ing.unit === 'pinch'}
                    onChange={(e): void => {
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num)) {
                        handleIngredientAmountChange(index, num);
                      }
                    }}
                    aria-label={`Amount (${ing.unit ?? 'g'})`}
                  />
                  <button
                    type="button"
                    onClick={(): void => toggleIngredientExpanded(index)}
                    className="text-xs text-gray-500 hover:text-choco-primary cursor-pointer px-0.5 select-none shrink-0"
                    title="Click to show/hide details"
                  >
                    {ing.unit ?? 'g'}
                    {isExpanded ? '▾' : '▸'}
                  </button>
                  <button
                    type="button"
                    onClick={(): void => handleRemoveIngredient(index)}
                    className="text-gray-400 hover:text-red-500 p-1 shrink-0"
                    aria-label="Remove ingredient"
                  >
                    ✕
                  </button>
                </div>
                {isExpanded && (
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 pl-1">
                    <select
                      className="text-xs bg-transparent border-none text-gray-600 cursor-pointer p-0 focus:outline-none focus:ring-0"
                      value={ing.unit ?? 'g'}
                      onChange={(e): void =>
                        handleIngredientUnitChange(index, e.target.value as MeasurementUnit)
                      }
                    >
                      {ALL_MEASUREMENT_UNITS.map((u: MeasurementUnit) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    {isSpoonUnit && (
                      <>
                        <select
                          className="text-xs border border-gray-200 rounded px-1 py-0.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                          value={ing.modifiers?.spoonLevel ?? ''}
                          onChange={(e): void => {
                            const val = e.target.value;
                            handleIngredientModifiersChange(index, {
                              ...ing.modifiers,
                              spoonLevel: val ? (val as SpoonLevel) : undefined
                            });
                          }}
                        >
                          <option value="">level (default)</option>
                          {ALL_SPOON_LEVELS.map((sl: SpoonLevel) => (
                            <option key={sl} value={sl}>
                              {sl}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ing.modifiers?.toTaste ?? false}
                            onChange={(e): void => {
                              handleIngredientModifiersChange(index, {
                                ...ing.modifiers,
                                toTaste: e.target.checked ? true : undefined
                              });
                            }}
                          />
                          to taste
                        </label>
                      </>
                    )}
                    {isWeightUnit && (
                      <>
                        <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                          yield
                        </label>
                        <input
                          type="number"
                          className="w-16 text-xs border border-gray-200 rounded px-1 py-0.5 text-right focus:outline-none focus:ring-1 focus:ring-choco-primary"
                          value={ing.modifiers?.yieldFactor ?? 1}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={(e): void => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0 && val <= 1) {
                              handleIngredientModifiersChange(index, {
                                ...ing.modifiers,
                                yieldFactor: val === 1 ? undefined : val
                              });
                            }
                          }}
                        />
                        <input
                          type="text"
                          className="flex-1 min-w-0 text-xs border border-gray-200 rounded px-1 py-0.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                          value={ing.modifiers?.processNote ?? ''}
                          placeholder="process note (e.g. steeped and strained)"
                          onChange={(e): void => {
                            handleIngredientModifiersChange(index, {
                              ...ing.modifiers,
                              processNote: e.target.value || undefined
                            });
                          }}
                          onBlur={(e): void => {
                            const val = e.target.value.trim();
                            if (val !== (ing.modifiers?.processNote ?? '')) {
                              handleIngredientModifiersChange(index, {
                                ...ing.modifiers,
                                processNote: val || undefined
                              });
                            }
                          }}
                        />
                      </>
                    )}
                    {/* Alternates row */}
                    {(hasAlternates || isLibraryMode) && (
                      <div className="w-full flex flex-wrap items-center gap-1 mt-1 pt-1 border-t border-gray-100">
                        <span className="text-xs text-gray-400 shrink-0">also:</span>
                        {sourceIds.map((altId) => {
                          const altName = getIngredientDisplayName(altId, ingredientSuggestions);
                          const isPreferred = altId === sourcePreferredId;
                          const canEdit = isLibraryMode && !readOnly;
                          return (
                            <span
                              key={altId}
                              className={`inline-flex items-center gap-0.5 text-xs rounded px-1.5 py-0.5 ${
                                isPreferred
                                  ? 'bg-choco-primary/10 text-choco-primary'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {canEdit && (
                                <button
                                  type="button"
                                  title={isPreferred ? 'Preferred' : 'Set as preferred'}
                                  onClick={(): void => handleSetPreferredAlternate(ing.ingredientId, altId)}
                                  className={`shrink-0 ${
                                    isPreferred ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'
                                  }`}
                                >
                                  ★
                                </button>
                              )}
                              {isPreferred && !canEdit && <span className="text-amber-500">★</span>}
                              <span>{altName}</span>
                              {canEdit && (
                                <button
                                  type="button"
                                  title="Remove alternate"
                                  onClick={(): void => handleRemoveAlternate(ing.ingredientId, altId)}
                                  className="text-gray-300 hover:text-red-400 shrink-0 ml-0.5"
                                >
                                  ✕
                                </button>
                              )}
                            </span>
                          );
                        })}
                        {isLibraryMode && !readOnly && (
                          <AlternateAddInput
                            ingredientId={ing.ingredientId}
                            onAdd={handleAddAlternate}
                            datalistId="filling-ingredient-suggestions"
                          />
                        )}
                        {!hasAlternates && (isProductionMode || readOnly) && (
                          <span className="text-xs text-gray-300 italic">none</span>
                        )}
                        {unresolvedAlternates[ing.ingredientId] && (
                          <>
                            <span className="text-xs text-amber-700">
                              No match for &quot;{unresolvedAlternates[ing.ingredientId]}&quot;.
                            </span>
                            {onCreateIngredient && (
                              <button
                                type="button"
                                onClick={(): void => {
                                  onCreateIngredient(unresolvedAlternates[ing.ingredientId]);
                                  setUnresolvedAlternates((prev) => {
                                    const next = { ...prev };
                                    delete next[ing.ingredientId];
                                    return next;
                                  });
                                }}
                                className="px-2 py-0.5 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90 shrink-0"
                              >
                                Create Ingredient
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {unresolvedIngredients[index] && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-amber-700">
                      No match for &quot;{unresolvedIngredients[index]}&quot;.
                    </span>
                    {onCreateIngredient && (
                      <button
                        type="button"
                        onClick={(): void => onCreateIngredient(unresolvedIngredients[index])}
                        className="px-2 py-1 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90"
                      >
                        Create Ingredient
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
              value={newIngredientText}
              list="filling-ingredient-suggestions"
              onChange={(e): void => setNewIngredientText(e.target.value)}
              onBlur={(): void => commitNewIngredient(newIngredientText)}
              onKeyDown={(e): void => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                  commitNewIngredient(newIngredientText);
                }
              }}
              placeholder="Type ingredient name to add"
            />
            <button
              type="button"
              onClick={(): void => commitNewIngredient(newIngredientText)}
              className="px-2.5 py-1 text-xs font-medium rounded bg-choco-primary text-white hover:bg-choco-primary/90"
            >
              Add
            </button>
          </div>

          {unresolvedNewIngredient && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-700">
                No match for &quot;{unresolvedNewIngredient}&quot;.
              </span>
              {onCreateIngredient && (
                <button
                  type="button"
                  onClick={(): void => {
                    onCreateIngredient(unresolvedNewIngredient);
                    setUnresolvedNewIngredient(undefined);
                  }}
                  className="px-2 py-1 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90"
                >
                  Create Ingredient
                </button>
              )}
            </div>
          )}

          <datalist id="filling-ingredient-suggestions">
            {ingredientSuggestions.map((s) => (
              <option key={s.id} value={s.name}>
                {s.id}
              </option>
            ))}
          </datalist>
        </div>
      </EditSection>

      {/* Procedure Section (from EditingSession) */}
      <EditSection title="Procedure">
        <div className="space-y-2">
          {currentProcedureId && (
            <div className="rounded border border-gray-200 p-2 flex items-center gap-2">
              <span className="flex-1 text-sm text-gray-800">
                {getProcedureDisplayName(currentProcedureId, procedureSuggestions)}
              </span>
              <button
                type="button"
                onClick={handleClearProcedure}
                className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
              >
                Remove
              </button>
            </div>
          )}

          {!currentProcedureId && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                value={newProcedureText}
                list="filling-procedure-suggestions"
                onChange={(e): void => setNewProcedureText(e.target.value)}
                onBlur={(): void => commitNewProcedure(newProcedureText)}
                onKeyDown={(e): void => {
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    commitNewProcedure(newProcedureText);
                  }
                }}
                placeholder="Type procedure name to set"
              />
            </div>
          )}

          {unresolvedNewProcedure && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-700">
                No match for &quot;{unresolvedNewProcedure}&quot;.
              </span>
              {onCreateProcedure && (
                <button
                  type="button"
                  onClick={(): void => {
                    onCreateProcedure(unresolvedNewProcedure);
                    setUnresolvedNewProcedure(undefined);
                  }}
                  className="px-2 py-1 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90"
                >
                  Create Procedure
                </button>
              )}
            </div>
          )}

          {/* Procedure alternates row (source model, library mode editing) */}
          {((): React.ReactElement | null => {
            const sourceProcedures = getSourceVariationProcedures();
            const procOptions = sourceProcedures?.options ?? [];
            const procPreferredId = sourceProcedures?.preferredId;
            const hasProcAlternates = procOptions.length > 1;
            if (!hasProcAlternates && !isLibraryMode) return null;
            return (
              <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-gray-100">
                <span className="text-xs text-gray-400 shrink-0">also:</span>
                {procOptions.map((opt) => {
                  const name = getProcedureDisplayName(opt.id, procedureSuggestions);
                  const isPreferred = opt.id === procPreferredId;
                  const canEdit = isLibraryMode && !readOnly;
                  return (
                    <span
                      key={opt.id}
                      className={`inline-flex items-center gap-0.5 text-xs rounded px-1.5 py-0.5 ${
                        isPreferred ? 'bg-choco-primary/10 text-choco-primary' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {canEdit && (
                        <button
                          type="button"
                          title={isPreferred ? 'Preferred' : 'Set as preferred'}
                          onClick={(): void => handleSetPreferredProcedure(opt.id)}
                          className={`shrink-0 ${
                            isPreferred ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'
                          }`}
                        >
                          ★
                        </button>
                      )}
                      {isPreferred && !canEdit && <span className="text-amber-500">★</span>}
                      <span>{name}</span>
                      {canEdit && (
                        <button
                          type="button"
                          title="Remove procedure alternate"
                          onClick={(): void => handleRemoveProcedureAlternate(opt.id)}
                          className="text-gray-300 hover:text-red-400 shrink-0 ml-0.5"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  );
                })}
                {isLibraryMode && !readOnly && (
                  <ProcedureAlternateAddInput
                    onAdd={handleAddProcedureAlternate}
                    datalistId="filling-procedure-suggestions"
                  />
                )}
                {!hasProcAlternates && (isProductionMode || readOnly) && (
                  <span className="text-xs text-gray-300 italic">none</span>
                )}
                {unresolvedProcedureAlternate && (
                  <>
                    <span className="text-xs text-amber-700">
                      No match for &quot;{unresolvedProcedureAlternate}&quot;.
                    </span>
                    {onCreateProcedure && (
                      <button
                        type="button"
                        onClick={(): void => {
                          onCreateProcedure(unresolvedProcedureAlternate);
                          setUnresolvedProcedureAlternate(undefined);
                        }}
                        className="px-2 py-0.5 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90 shrink-0"
                      >
                        Create Procedure
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })()}

          <datalist id="filling-procedure-suggestions">
            {procedureSuggestions.map((s) => (
              <option key={s.id} value={s.name}>
                {s.id}
              </option>
            ))}
          </datalist>
        </div>
      </EditSection>

      {/* Ratings Section (on variation entity, via wrapper) */}
      <EditSection title="Ratings">
        <div className="space-y-1.5">
          {RATING_CATEGORIES.map((category) => {
            const existing = currentVariation?.ratings?.find((r) => r.category === category);
            return (
              <div key={category} className="flex items-center justify-between py-0.5">
                <span className="text-sm text-gray-600 capitalize">{category}</span>
                <RatingStars
                  score={existing?.score}
                  onChange={(score): void => handleRatingChange(category, score)}
                />
              </div>
            );
          })}
        </div>
      </EditSection>

      {/* Tags Section */}
      <EditSection title="Tags">
        <EditField label="Tags">
          <TagsInput
            value={wrapper.current.tags}
            onChange={handleTagsChange}
            placeholder="e.g. dark, ganache, 70%"
          />
        </EditField>
      </EditSection>

      {/* Notes Section (from session) */}
      <NotesEditor value={session.produced.snapshot.notes} onChange={handleNotesChange} />
    </div>
  );
}
