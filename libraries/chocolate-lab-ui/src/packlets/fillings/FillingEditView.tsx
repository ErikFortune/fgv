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

import { EditField, EditSection, TextInput, TagsInput, MultiActionButton } from '@fgv/ts-app-shell';
import type {
  Entities,
  FillingName,
  IngredientId,
  LibraryRuntime,
  Measurement,
  Model,
  ProcedureId,
  RatingScore,
  FillingRecipeVariationSpec,
  UserLibrary
} from '@fgv/ts-chocolate';

import { EditingToolbar, NotesEditor, useEditingContext, useDatalistMatch } from '../editing';

type EditedFillingRecipe = LibraryRuntime.EditedFillingRecipe;
type EditingSession = UserLibrary.Session.EditingSession;
type ISaveAnalysis = UserLibrary.Session.ISaveAnalysis;

// ============================================================================
// Props
// ============================================================================

export type FillingSaveMode = 'update' | 'new-variation' | 'alternatives' | 'new-recipe';

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
    readOnly,
    onMutate,
    onPreview,
    onCreateIngredient,
    onCreateProcedure
  } = props;

  // Recipe-level editing context (undo/redo for wrapper)
  const ctx = useEditingContext<EditedFillingRecipe>({
    wrapper,
    onSave: (): void => onSave('update'),
    onCancel,
    readOnly
  });

  // Separate version counter for session mutations (triggers re-render)
  const [sessionVersion, setSessionVersion] = useState(0);

  // Draft state for datalist inputs
  const [ingredientInputDraft, setIngredientInputDraft] = useState<Record<number, string>>({});
  const [newIngredientText, setNewIngredientText] = useState('');
  const [newProcedureText, setNewProcedureText] = useState('');

  // Unresolved state
  const [unresolvedIngredients, setUnresolvedIngredients] = useState<Record<number, string>>({});
  const [unresolvedNewIngredient, setUnresolvedNewIngredient] = useState<string | undefined>(undefined);
  const [unresolvedNewProcedure, setUnresolvedNewProcedure] = useState<string | undefined>(undefined);

  const ingredientSuggestions = useMemo(() => {
    return availableIngredients.map((ing) => ({ id: ing.id, name: ing.name }));
  }, [availableIngredients]);

  const procedureSuggestions = useMemo(() => {
    return availableProcedures.map((proc) => ({ id: proc.id, name: proc.name }));
  }, [availableProcedures]);

  const ingredientMatcher = useDatalistMatch(ingredientSuggestions);
  const procedureMatcher = useDatalistMatch(procedureSuggestions);

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
          notifySession();
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
  }, [producedIngredients, availableIngredients, ingredientMatcher, unresolvedNewIngredient]);

  useEffect(() => {
    if (unresolvedNewProcedure && procedureMatcher.findExactMatch(unresolvedNewProcedure)) {
      setUnresolvedNewProcedure(undefined);
    }
  }, [availableProcedures, procedureMatcher, unresolvedNewProcedure]);

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

    if (saveAnalysis.canCreateVariation && !saveAnalysis.mustCreateNew) {
      actions.push({
        id: 'update',
        label: 'Save',
        icon: <CheckIcon className="h-3.5 w-3.5" />,
        onSelect: (): void => onSave('update')
      });
    }

    if (saveAnalysis.canCreateVariation) {
      actions.push({
        id: 'new-variation',
        label: 'Save as New Variation',
        icon: <PlusIcon className="h-3.5 w-3.5" />,
        onSelect: (): void => onSave('new-variation')
      });
    }

    if (saveAnalysis.canAddAlternatives) {
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
  }, [saveAnalysis, onSave]);

  const customSaveButton =
    saveActions.length > 1 ? (
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

      {/* Variation Selector */}
      {wrapper.variations.length > 1 && (
        <EditSection title="Variations">
          <div className="flex flex-wrap gap-1.5">
            {wrapper.variations.map((v) => {
              const isSelected = v.variationSpec === selectedVariationSpec;
              const isGolden = v.variationSpec === wrapper.goldenVariationSpec;
              return (
                <button
                  key={v.variationSpec}
                  type="button"
                  onClick={(): void => onVariationChange(v.variationSpec)}
                  className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                    isSelected
                      ? 'bg-choco-primary text-white border-choco-primary'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-choco-primary'
                  }`}
                >
                  {v.name ?? v.variationSpec}
                  {isGolden && ' \u2605'}
                </button>
              );
            })}
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
            return (
              <div key={ing.ingredientId} className="rounded border border-gray-200 p-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
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
                    className="w-20 text-sm border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-choco-primary"
                    value={ing.amount}
                    min={0}
                    step={0.1}
                    onChange={(e): void => {
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num)) {
                        handleIngredientAmountChange(index, num);
                      }
                    }}
                    aria-label="Amount (grams)"
                  />
                  <span className="text-xs text-gray-500">{ing.unit ?? 'g'}</span>
                  <button
                    type="button"
                    onClick={(): void => handleRemoveIngredient(index)}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    Remove
                  </button>
                </div>
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
