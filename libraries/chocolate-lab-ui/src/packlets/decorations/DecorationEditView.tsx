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
 * Decoration edit view.
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardDocumentIcon, EyeIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

import { EditField, EditSection, TextInput, TagsInput } from '@fgv/ts-app-shell';
import type {
  Entities,
  IngredientId,
  LibraryRuntime,
  Measurement,
  Model,
  ProcedureId,
  RatingScore
} from '@fgv/ts-chocolate';

import { EditingToolbar, NotesEditor, useEditingContext, useDatalistMatch } from '../editing';

type EditedDecoration = LibraryRuntime.EditedDecoration;

export interface IDecorationEditViewProps {
  readonly wrapper: EditedDecoration;
  readonly availableIngredients: ReadonlyArray<LibraryRuntime.AnyIngredient>;
  readonly availableProcedures: ReadonlyArray<LibraryRuntime.IProcedure>;
  readonly onSave: (wrapper: EditedDecoration) => void;
  readonly onSaveAs?: (wrapper: EditedDecoration) => void;
  readonly onCancel: () => void;
  readonly readOnly?: boolean;
  readonly onPreview?: () => void;
  readonly onMutate?: () => void;
  readonly onCreateIngredient?: (seed: string) => void;
  readonly onCreateProcedure?: (seed: string) => void;
  readonly onPasteIngredient?: () => void;
}

// ============================================================================
// Rating Categories
// ============================================================================

const RATING_CATEGORIES = ['difficulty', 'durability', 'appearance', 'workability'] as const;

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
  ingredient: Entities.Decorations.IDecorationIngredientEntity,
  suggestions: ReadonlyArray<{ id: IngredientId; name: string }>
): string {
  const preferredId = ingredient.ingredient.preferredId ?? ingredient.ingredient.ids[0];
  return suggestions.find((s) => s.id === preferredId)?.name ?? String(preferredId);
}

function getProcedureDisplayName(
  procedureId: ProcedureId,
  suggestions: ReadonlyArray<{ id: ProcedureId; name: string }>
): string {
  return suggestions.find((s) => s.id === procedureId)?.name ?? String(procedureId);
}

// ============================================================================
// DecorationEditView Component
// ============================================================================

export function DecorationEditView(props: IDecorationEditViewProps): React.ReactElement {
  const {
    wrapper,
    availableIngredients,
    availableProcedures,
    onSave,
    onSaveAs,
    onCancel,
    readOnly,
    onPreview,
    onMutate,
    onCreateIngredient,
    onCreateProcedure,
    onPasteIngredient
  } = props;

  const ctx = useEditingContext<EditedDecoration>({ wrapper, onSave, onSaveAs, onCancel, readOnly });
  const entity = wrapper.current;

  // Parent-level draft state for datalist inputs (follows ProcedureEditView pattern)
  const [ingredientInputDraft, setIngredientInputDraft] = useState<Record<number, string>>({});
  const [procedureInputDraft, setProcedureInputDraft] = useState<Record<number, string>>({});
  const [newIngredientText, setNewIngredientText] = useState('');
  const [newProcedureText, setNewProcedureText] = useState('');

  // Unresolved state for ingredients and procedures
  const [unresolvedIngredients, setUnresolvedIngredients] = useState<Record<number, string>>({});
  const [unresolvedProcedures, setUnresolvedProcedures] = useState<Record<number, string>>({});
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

  const notify = useCallback((): void => {
    ctx.notifyMutation();
    onMutate?.();
  }, [ctx, onMutate]);

  // ---- Field Handlers ----

  const handleNameChange = useCallback(
    (value: string) => {
      wrapper.setName(value);
      notify();
    },
    [wrapper, notify]
  );

  const handleDescriptionChange = useCallback(
    (value: string | undefined) => {
      wrapper.setDescription(value?.trim() ? value : undefined);
      notify();
    },
    [wrapper, notify]
  );

  const handleTagsChange = useCallback(
    (value: ReadonlyArray<string> | undefined) => {
      wrapper.setTags(value);
      notify();
    },
    [wrapper, notify]
  );

  const handleNotesChange = useCallback(
    (value: ReadonlyArray<Model.ICategorizedNote> | undefined) => {
      wrapper.setNotes(value);
      notify();
    },
    [wrapper, notify]
  );

  // ---- Ingredient Handlers ----

  const commitIngredientInput = useCallback(
    (index: number, input: string): void => {
      const match = ingredientMatcher.resolveOnBlur(input);
      if (match) {
        wrapper.updateIngredient(index, {
          ingredient: {
            ids: [match.id],
            preferredId: undefined
          }
        });
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
        notify();
      } else if (input.trim()) {
        setUnresolvedIngredients((prev) => ({ ...prev, [index]: input.trim() }));
      }
    },
    [ingredientMatcher, notify, wrapper]
  );

  const handleIngredientAmountChange = useCallback(
    (index: number, amount: number): void => {
      wrapper.updateIngredient(index, { amount: amount as Measurement });
      notify();
    },
    [notify, wrapper]
  );

  const handleRemoveIngredient = useCallback(
    (index: number): void => {
      wrapper.removeIngredient(index);
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
      notify();
    },
    [notify, wrapper]
  );

  const commitNewIngredient = useCallback(
    (input: string): void => {
      const match = ingredientMatcher.resolveOnBlur(input);
      if (match) {
        wrapper.addIngredient({
          ingredient: { ids: [match.id], preferredId: undefined },
          amount: 0 as Measurement
        });
        setNewIngredientText('');
        setUnresolvedNewIngredient(undefined);
        notify();
      } else if (input.trim()) {
        setUnresolvedNewIngredient(input.trim());
      }
    },
    [ingredientMatcher, notify, wrapper]
  );

  // ---- Procedure Handlers ----

  const commitProcedureInput = useCallback(
    (index: number, input: string): void => {
      const match = procedureMatcher.resolveOnBlur(input);
      if (match) {
        const currentProcs = entity.procedures;
        if (currentProcs) {
          const options = [...currentProcs.options];
          options[index] = { ...options[index], id: match.id };
          wrapper.setProcedures({ options, preferredId: currentProcs.preferredId });
          setProcedureInputDraft((prev) => {
            const next = { ...prev };
            delete next[index];
            return next;
          });
          setUnresolvedProcedures((prev) => {
            const next = { ...prev };
            delete next[index];
            return next;
          });
          notify();
        }
      } else if (input.trim()) {
        setUnresolvedProcedures((prev) => ({ ...prev, [index]: input.trim() }));
      }
    },
    [entity.procedures, procedureMatcher, notify, wrapper]
  );

  const handleTogglePreferred = useCallback(
    (procedureId: ProcedureId): void => {
      const currentPreferred = entity.procedures?.preferredId;
      wrapper.setPreferredProcedure(currentPreferred === procedureId ? undefined : procedureId);
      notify();
    },
    [entity.procedures?.preferredId, notify, wrapper]
  );

  const handleRemoveProcedure = useCallback(
    (procedureId: ProcedureId): void => {
      wrapper.removeProcedureRef(procedureId);
      notify();
    },
    [notify, wrapper]
  );

  const commitNewProcedure = useCallback(
    (input: string): void => {
      const match = procedureMatcher.resolveOnBlur(input);
      if (match) {
        wrapper.addProcedureRef({ id: match.id });
        setNewProcedureText('');
        setUnresolvedNewProcedure(undefined);
        notify();
      } else if (input.trim()) {
        setUnresolvedNewProcedure(input.trim());
      }
    },
    [procedureMatcher, notify, wrapper]
  );

  // ---- Rating Handlers ----

  const handleRatingChange = useCallback(
    (category: string, score: number): void => {
      wrapper.setRating(category as Entities.Fillings.RatingCategory, score as RatingScore);
      notify();
    },
    [notify, wrapper]
  );

  // ---- Clear resolved entries ----

  useEffect(() => {
    // Clear unresolved ingredients that now have matches
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
  }, [entity.ingredients, availableIngredients, ingredientMatcher, unresolvedNewIngredient]);

  useEffect(() => {
    // Clear unresolved procedures that now have matches
    setUnresolvedProcedures((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const indexStr of Object.keys(next)) {
        const match = procedureMatcher.findExactMatch(next[Number(indexStr)]);
        if (match) {
          delete next[Number(indexStr)];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    if (unresolvedNewProcedure && procedureMatcher.findExactMatch(unresolvedNewProcedure)) {
      setUnresolvedNewProcedure(undefined);
    }
  }, [entity.procedures, availableProcedures, procedureMatcher, unresolvedNewProcedure]);

  return (
    <div className="flex flex-col p-4 overflow-y-auto h-full">
      <EditingToolbar
        context={ctx}
        extraButtons={
          onPreview ? (
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors text-gray-600 hover:text-choco-primary hover:bg-gray-100"
              title="Open decoration preview pane"
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
          <span className="text-sm font-mono text-gray-500">{entity.baseId}</span>
        </EditField>
        <EditField label="Name">
          <TextInput value={entity.name} onChange={handleNameChange} placeholder="e.g. Gold Leaf Accent" />
        </EditField>
        <EditField label="Description">
          <TextInput
            value={entity.description ?? ''}
            onChange={handleDescriptionChange}
            placeholder="Optional decoration description"
          />
        </EditField>
      </EditSection>

      {/* Ingredients Section */}
      <EditSection title="Ingredients">
        <div className="space-y-2">
          {entity.ingredients.map((ing, index) => {
            const ingValue =
              ingredientInputDraft[index] ?? getIngredientDisplayName(ing, ingredientSuggestions);
            return (
              <div key={index} className="rounded border border-gray-200 p-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                    value={ingValue}
                    list="decoration-ingredient-suggestions"
                    onChange={(e): void => {
                      const nextValue = e.target.value;
                      setIngredientInputDraft((prev) => ({ ...prev, [index]: nextValue }));
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
                  <span className="text-xs text-gray-500">g</span>
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
                    <button
                      type="button"
                      onClick={(): void => onCreateIngredient?.(unresolvedIngredients[index])}
                      className="px-2 py-1 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90"
                    >
                      Create Ingredient
                    </button>
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
              list="decoration-ingredient-suggestions"
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
            {onPasteIngredient && (
              <button
                type="button"
                onClick={onPasteIngredient}
                className="p-1.5 text-gray-500 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors"
                title="Paste ingredient from clipboard (AI-generated JSON)"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {unresolvedNewIngredient && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-700">
                No match for &quot;{unresolvedNewIngredient}&quot;.
              </span>
              <button
                type="button"
                onClick={(): void => {
                  onCreateIngredient?.(unresolvedNewIngredient);
                  setUnresolvedNewIngredient(undefined);
                }}
                className="px-2 py-1 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90"
              >
                Create Ingredient
              </button>
            </div>
          )}

          <datalist id="decoration-ingredient-suggestions">
            {ingredientSuggestions.map((s) => (
              <option key={s.id} value={s.name}>
                {s.id}
              </option>
            ))}
          </datalist>
        </div>
      </EditSection>

      {/* Procedures Section */}
      <EditSection title="Procedures">
        <div className="space-y-2">
          {(entity.procedures?.options ?? []).map((ref, index) => {
            const procValue =
              procedureInputDraft[index] ?? getProcedureDisplayName(ref.id, procedureSuggestions);
            const isPreferred = entity.procedures?.preferredId === ref.id;
            return (
              <div key={ref.id} className="rounded border border-gray-200 p-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(): void => handleTogglePreferred(ref.id)}
                    className={`p-0.5 transition-colors ${
                      isPreferred ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'
                    }`}
                    title={isPreferred ? 'Preferred procedure' : 'Set as preferred'}
                  >
                    {isPreferred ? <StarIconSolid className="w-4 h-4" /> : <StarIcon className="w-4 h-4" />}
                  </button>
                  <input
                    type="text"
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                    value={procValue}
                    list="decoration-procedure-suggestions"
                    onChange={(e): void => {
                      const nextValue = e.target.value;
                      setProcedureInputDraft((prev) => ({ ...prev, [index]: nextValue }));
                    }}
                    onBlur={(): void => commitProcedureInput(index, procValue)}
                    onKeyDown={(e): void => {
                      if (e.key === 'Enter' || e.key === 'Tab') {
                        commitProcedureInput(index, procValue);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(): void => handleRemoveProcedure(ref.id)}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    Remove
                  </button>
                </div>
                {unresolvedProcedures[index] && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-amber-700">
                      No match for &quot;{unresolvedProcedures[index]}&quot;.
                    </span>
                    <button
                      type="button"
                      onClick={(): void => onCreateProcedure?.(unresolvedProcedures[index])}
                      className="px-2 py-1 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90"
                    >
                      Create Procedure
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
              value={newProcedureText}
              list="decoration-procedure-suggestions"
              onChange={(e): void => setNewProcedureText(e.target.value)}
              onBlur={(): void => commitNewProcedure(newProcedureText)}
              onKeyDown={(e): void => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                  commitNewProcedure(newProcedureText);
                }
              }}
              placeholder="Type procedure name to add"
            />
            <button
              type="button"
              onClick={(): void => commitNewProcedure(newProcedureText)}
              className="px-2.5 py-1 text-xs font-medium rounded bg-choco-primary text-white hover:bg-choco-primary/90"
            >
              Add
            </button>
          </div>

          {unresolvedNewProcedure && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-700">
                No match for &quot;{unresolvedNewProcedure}&quot;.
              </span>
              <button
                type="button"
                onClick={(): void => {
                  onCreateProcedure?.(unresolvedNewProcedure);
                  setUnresolvedNewProcedure(undefined);
                }}
                className="px-2 py-1 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90"
              >
                Create Procedure
              </button>
            </div>
          )}

          <datalist id="decoration-procedure-suggestions">
            {procedureSuggestions.map((s) => (
              <option key={s.id} value={s.name}>
                {s.id}
              </option>
            ))}
          </datalist>
        </div>
      </EditSection>

      {/* Ratings Section */}
      <EditSection title="Ratings">
        <div className="space-y-1.5">
          {RATING_CATEGORIES.map((category) => {
            const existing = entity.ratings?.find((r) => r.category === category);
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
          <TagsInput value={entity.tags} onChange={handleTagsChange} placeholder="e.g. gold, leaf, accent" />
        </EditField>
      </EditSection>

      {/* Notes Section */}
      <NotesEditor value={entity.notes} onChange={handleNotesChange} />
    </div>
  );
}
