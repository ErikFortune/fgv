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
 * Detail/editing panel for filling-type editing sessions.
 * Mirrors the FillingEditView layout but operates on a materialized session.
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';
import { DetailSection, DetailRow, EditSection } from '@fgv/ts-app-shell';
import {
  Entities,
  type IngredientId,
  type LibraryRuntime,
  type Measurement,
  type MeasurementUnit,
  type Model,
  type SessionId,
  type SpoonLevel,
  type UserLibrary
} from '@fgv/ts-chocolate';

import { NotesEditor, useDatalistMatch } from '../editing';
import { EntityDetailHeader } from '../common';
import { useWorkspace, useReactiveWorkspace } from '../workspace';
import { SessionStatusBar } from './SessionStatusBar';
import { useSessionActions } from './useSessionActions';

// ============================================================================
// Constants
// ============================================================================

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

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the FillingSessionPanel component.
 * @public
 */
export interface IFillingSessionPanelProps {
  /** The composite session ID */
  readonly sessionId: SessionId;
  /** The filling editing session */
  readonly session: UserLibrary.Session.EditingSession;
  /** Optional callback to close this panel */
  readonly onClose?: () => void;
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

function RatingStars({ score }: { readonly score: number | undefined }): React.ReactElement {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= (score ?? 0) ? 'text-amber-400' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </span>
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * Filling session detail panel with ingredient editing, status toggle,
 * and session notes. Mirrors FillingEditView layout but operates on
 * a materialized EditingSession.
 *
 * @public
 */
export function FillingSessionPanel({
  sessionId,
  session,
  onClose
}: IFillingSessionPanelProps): React.ReactElement {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const sessionActions = useSessionActions();

  // Version counter to trigger re-renders after session mutations
  const [sessionVersion, setSessionVersion] = useState(0);

  const notifySession = useCallback((): void => {
    setSessionVersion((v) => v + 1);
  }, []);

  // ---- Ingredient suggestions ----

  const ingredientSuggestions = useMemo(() => {
    return Array.from(workspace.data.ingredients.values()).map((ing: LibraryRuntime.AnyIngredient) => ({
      id: ing.id,
      name: ing.name
    }));
  }, [workspace, reactiveWorkspace.version]);

  const ingredientMatcher = useDatalistMatch(ingredientSuggestions);

  // ---- Current session state (re-read on sessionVersion change) ----

  const producedIngredients = useMemo(() => session.produced.ingredients, [session, sessionVersion]);

  const currentProcedureId = useMemo(() => session.produced.snapshot.procedureId, [session, sessionVersion]);

  const procedureName = useMemo(() => {
    if (!currentProcedureId) return undefined;
    const proc = workspace.data.procedures.get(currentProcedureId);
    return proc.isSuccess() ? proc.value.name : String(currentProcedureId);
  }, [workspace, currentProcedureId]);

  const baseRecipeRatings = useMemo(() => {
    const ratings = session.baseRecipe.entity.ratings;
    if (!ratings || ratings.length === 0) return undefined;
    const map = new Map<string, number>();
    for (const r of ratings) {
      map.set(r.category, r.score);
    }
    return map;
  }, [session]);

  const hasChanges = useMemo(() => session.hasChanges, [session, sessionVersion]);

  // ---- Draft state ----

  const [ingredientInputDraft, setIngredientInputDraft] = useState<Record<number, string>>({});
  const [newIngredientText, setNewIngredientText] = useState('');
  const [unresolvedIngredients, setUnresolvedIngredients] = useState<Record<number, string>>({});
  const [unresolvedNewIngredient, setUnresolvedNewIngredient] = useState<string | undefined>(undefined);
  const [expandedIngredients, setExpandedIngredients] = useState<Set<number>>(new Set());
  const [targetWeightInput, setTargetWeightInput] = useState<string>(String(session.produced.targetWeight));

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

  // ---- Status change ----

  const handleStatusChange = useCallback(
    (status: Entities.PersistedSessionStatus): void => {
      sessionActions.updateSessionStatus(sessionId, status);
    },
    [sessionActions, sessionId]
  );

  // ---- Undo / Redo ----

  const handleUndo = useCallback((): void => {
    session.undo();
    notifySession();
  }, [session, notifySession]);

  const handleRedo = useCallback((): void => {
    session.redo();
    notifySession();
  }, [session, notifySession]);

  // ---- Save ----

  const handleSave = useCallback((): void => {
    sessionActions.saveSession(sessionId);
  }, [sessionActions, sessionId]);

  // ---- Target weight ----

  const handleScaleToWeight = useCallback((): void => {
    const weight = parseFloat(targetWeightInput);
    if (!isNaN(weight) && weight > 0) {
      session.scaleToTargetWeight(weight as Measurement);
      notifySession();
    }
  }, [session, targetWeightInput, notifySession]);

  // ---- Ingredient handlers ----

  const commitIngredientInput = useCallback(
    (index: number, input: string): void => {
      const match = ingredientMatcher.resolveOnBlur(input);
      if (match) {
        const existing = producedIngredients[index];
        if (match.id !== existing.ingredientId) {
          session.removeIngredient(existing.ingredientId);
          session.setIngredient(match.id, existing.amount, existing.unit, existing.modifiers);
        }
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
        newModifiers =
          existing.modifiers?.spoonLevel !== undefined || existing.modifiers?.toTaste !== undefined
            ? { spoonLevel: existing.modifiers?.spoonLevel, toTaste: existing.modifiers?.toTaste }
            : undefined;
      } else if (unit === 'g' || unit === 'mL') {
        newModifiers =
          existing.modifiers?.yieldFactor !== undefined || existing.modifiers?.processNote !== undefined
            ? { yieldFactor: existing.modifiers?.yieldFactor, processNote: existing.modifiers?.processNote }
            : undefined;
      } else {
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

  // ---- Notes ----

  const handleNotesChange = useCallback(
    (value: ReadonlyArray<Model.ICategorizedNote> | undefined): void => {
      session.setNotes(value ? [...value] : []);
      notifySession();
    },
    [session, notifySession]
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Status bar */}
      <SessionStatusBar
        sessionId={sessionId}
        session={session}
        onStatusChange={handleStatusChange}
        canUndo={session.canUndo()}
        canRedo={session.canRedo()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        hasChanges={hasChanges}
      />

      <div className="flex flex-col p-4 gap-4">
        {/* Header */}
        <EntityDetailHeader
          title={session.label ?? session.baseId}
          subtitle={`Filling Session · ${session.sourceVariationId}`}
          onClose={onClose}
        />

        {/* Source Recipe Info */}
        <DetailSection title="Source Recipe">
          <DetailRow label="Variation" value={session.sourceVariationId} />
          <DetailRow label="Base Weight" value={`${session.baseRecipe.entity.baseWeight} g`} />
        </DetailSection>

        {/* Target Weight */}
        <EditSection title="Target Weight">
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="w-28 text-sm border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-choco-primary"
              value={targetWeightInput}
              min={0}
              step={1}
              onChange={(e): void => setTargetWeightInput(e.target.value)}
              onKeyDown={(e): void => {
                if (e.key === 'Enter') handleScaleToWeight();
              }}
            />
            <span className="text-sm text-gray-500">g</span>
            <button
              type="button"
              onClick={handleScaleToWeight}
              className="px-2.5 py-1 text-xs font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded transition-colors"
            >
              Scale
            </button>
            <span className="text-xs text-gray-400">Current: {session.produced.targetWeight} g</span>
          </div>
        </EditSection>

        {/* Ingredients */}
        <EditSection title={`Ingredients (${producedIngredients.length})`}>
          <div className="space-y-2">
            {producedIngredients.map((ing, index) => {
              const ingValue =
                ingredientInputDraft[index] ??
                getIngredientDisplayName(ing.ingredientId, ingredientSuggestions);
              const isSpoonUnit = ing.unit === 'tsp' || ing.unit === 'Tbsp';
              const isWeightUnit = ing.unit === 'g' || ing.unit === 'mL' || ing.unit === undefined;
              const hasNonDefaultModifiers =
                (ing.modifiers?.yieldFactor !== undefined && ing.modifiers.yieldFactor !== 1.0) ||
                !!ing.modifiers?.processNote ||
                !!ing.modifiers?.spoonLevel ||
                !!ing.modifiers?.toTaste;
              const isExpanded = expandedIngredients.has(index) || hasNonDefaultModifiers;

              return (
                <div key={ing.ingredientId} className="rounded border border-gray-200 p-2">
                  {/* Main row: name, amount, unit toggle, remove */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      className="flex-1 min-w-0 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                      value={ingValue}
                      list="session-ingredient-suggestions"
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

                  {/* Unresolved warning */}
                  {unresolvedIngredients[index] && (
                    <div className="text-xs text-red-500 mt-1">
                      Unresolved: &ldquo;{unresolvedIngredients[index]}&rdquo;
                    </div>
                  )}

                  {/* Expanded details */}
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
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add ingredient row */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                className="flex-1 min-w-0 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                placeholder="+ add ingredient"
                value={newIngredientText}
                list="session-ingredient-suggestions"
                onChange={(e): void => setNewIngredientText(e.target.value)}
                onBlur={(): void => {
                  if (newIngredientText.trim()) commitNewIngredient(newIngredientText);
                }}
                onKeyDown={(e): void => {
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    if (newIngredientText.trim()) commitNewIngredient(newIngredientText);
                  }
                }}
              />
            </div>
            {unresolvedNewIngredient && (
              <div className="text-xs text-red-500">
                Unresolved ingredient: &ldquo;{unresolvedNewIngredient}&rdquo;
              </div>
            )}
          </div>

          {/* Datalist */}
          <datalist id="session-ingredient-suggestions">
            {ingredientSuggestions.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
        </EditSection>

        {/* Procedure (read-only for Phase 1) */}
        <DetailSection title="Procedure">
          {procedureName ? (
            <DetailRow label="Current" value={procedureName} />
          ) : (
            <div className="text-sm text-gray-400 italic px-2 py-1">No procedure set</div>
          )}
        </DetailSection>

        {/* Ratings (read-only from base recipe) */}
        {baseRecipeRatings && (
          <DetailSection title="Ratings">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-2">
              {RATING_CATEGORIES.map((cat) => {
                const score = baseRecipeRatings.get(cat);
                if (score === undefined) return null;
                return (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize">{cat}</span>
                    <RatingStars score={score} />
                  </div>
                );
              })}
            </div>
          </DetailSection>
        )}

        {/* Session Notes (editable) */}
        <NotesEditor value={session.notes} onChange={handleNotesChange} title="Session Notes" />
      </div>
    </div>
  );
}
