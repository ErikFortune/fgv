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
import { ArrowPathIcon, BeakerIcon, DocumentTextIcon, ListBulletIcon } from '@heroicons/react/20/solid';
import { DetailSection, EditSection, TypeaheadInput } from '@fgv/ts-app-shell';
import {
  Entities,
  Helpers,
  type FillingId,
  type FillingRecipeVariationId,
  type FillingRecipeVariationSpec,
  type IngredientId,
  type LibraryRuntime,
  type Measurement,
  type MeasurementUnit,
  type Model,
  type ProcedureId,
  type SessionId,
  type SpoonLevel,
  type UserLibrary
} from '@fgv/ts-chocolate';
import type { CascadeEntityType } from '../navigation';

import { NotesEditor, ChangeSummaryIcons, type IChangeIndicator } from '../editing';
import { EntityDetailHeader } from '../common';
import { useWorkspace, useReactiveWorkspace } from '../workspace';
import { SessionStatusBar } from './SessionStatusBar';
import { useSessionActions } from './useSessionActions';

/**
 * Recipe swap request from the panel.
 * @public
 */
export interface IRecipeSwapRequest {
  /** The new variation ID to swap to */
  readonly variationId: FillingRecipeVariationId;
  /** Whether this is a same-recipe variation swap (in-place) or a different recipe (new session) */
  readonly mode: 'variation' | 'recipe';
  /** The current target weight to preserve */
  readonly targetWeight: Measurement;
}

/**
 * Callback type for recipe swap requests.
 * @public
 */
export type RecipeSwapHandler = (request: IRecipeSwapRequest) => void;

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
  /** Optional callback to request creating a new entity (ingredient, procedure) via cascade */
  readonly onRequestCreateEntity?: (entityType: CascadeEntityType, prefillName: string) => void;
  /** Optional callback when user requests a recipe or variation swap */
  readonly onRecipeSwap?: RecipeSwapHandler;
  /** Optional callback to open current recipe in a filling browser panel */
  readonly onOpenFillingRecipe?: (fillingId: FillingId, variationSpec: FillingRecipeVariationSpec) => void;
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
  onClose,
  onRequestCreateEntity,
  onRecipeSwap,
  onOpenFillingRecipe
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

  // Build priority suggestions from variation alternates
  const ingredientAlternates = useMemo(() => {
    const result = session.baseRecipe.getIngredients();
    if (result.isFailure()) return [];
    const alts: Array<{ id: IngredientId; name: string }> = [];
    const seen = new Set<IngredientId>();
    for (const ri of result.value) {
      for (const alt of ri.alternates) {
        if (!seen.has(alt.id)) {
          seen.add(alt.id);
          alts.push({ id: alt.id, name: alt.name });
        }
      }
    }
    return alts;
  }, [session]);

  // ---- Current session state (re-read on sessionVersion change) ----

  const producedIngredients = useMemo(() => session.produced.ingredients, [session, sessionVersion]);

  const currentProcedureId = useMemo(() => session.produced.snapshot.procedureId, [session, sessionVersion]);

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

  const sessionChanges = useMemo(() => {
    return session.analyzeSaveOptions().changes;
  }, [session, sessionVersion]);

  const hasNonScaleChanges =
    sessionChanges.ingredientsChanged || sessionChanges.procedureChanged || sessionChanges.notesChanged;

  const changeIndicators: ReadonlyArray<IChangeIndicator> = useMemo(
    () => [
      {
        key: 'ingredients',
        label: 'Ingredients',
        icon: <BeakerIcon />,
        changed: sessionChanges.ingredientsChanged
      },
      {
        key: 'procedure',
        label: 'Procedure',
        icon: <ListBulletIcon />,
        changed: sessionChanges.procedureChanged
      },
      { key: 'notes', label: 'Notes', icon: <DocumentTextIcon />, changed: sessionChanges.notesChanged }
    ],
    [sessionChanges]
  );

  // ---- Recipe section state ----

  const [recipeEditMode, setRecipeEditMode] = useState(false);
  const currentFillingId = session.baseRecipe.fillingRecipe.id;
  const currentVariationSpec = session.baseRecipe.variationSpec;

  const [selectedRecipeId, setSelectedRecipeId] = useState<FillingId>(currentFillingId);
  const [selectedVariationSpec, setSelectedVariationSpec] =
    useState<FillingRecipeVariationSpec>(currentVariationSpec);

  // All filling recipes for the recipe dropdown
  const allFillingRecipes = useMemo(
    () => Array.from(workspace.data.fillings.values()).sort((a, b) => a.name.localeCompare(b.name)),
    [workspace, reactiveWorkspace.version]
  );

  // Variations of the currently selected recipe
  const selectedRecipeVariations = useMemo(() => {
    const recipeResult = workspace.data.fillings.get(selectedRecipeId);
    if (recipeResult.isFailure()) return [];
    return recipeResult.value.variations;
  }, [workspace, selectedRecipeId, reactiveWorkspace.version]);

  // Whether the selection differs from the current session
  const isRecipeSwapChanged =
    selectedRecipeId !== currentFillingId || selectedVariationSpec !== currentVariationSpec;
  const isRecipeChanged = selectedRecipeId !== currentFillingId;

  // Reset selection state when entering/exiting edit mode
  const handleToggleRecipeEdit = useCallback((): void => {
    if (recipeEditMode) {
      // Exiting — reset selection to current
      setSelectedRecipeId(currentFillingId);
      setSelectedVariationSpec(currentVariationSpec);
    }
    setRecipeEditMode((prev) => !prev);
  }, [recipeEditMode, currentFillingId, currentVariationSpec]);

  const handleApplyRecipeSwap = useCallback((): void => {
    if (!onRecipeSwap || !isRecipeSwapChanged) return;
    const variationId = Helpers.createFillingRecipeVariationId(selectedRecipeId, selectedVariationSpec);
    onRecipeSwap({
      variationId,
      mode: isRecipeChanged ? 'recipe' : 'variation',
      targetWeight: session.produced.targetWeight
    });
    setRecipeEditMode(false);
  }, [onRecipeSwap, isRecipeSwapChanged, selectedRecipeId, selectedVariationSpec, isRecipeChanged, session]);

  const handleOpenFillingRecipe = useCallback((): void => {
    onOpenFillingRecipe?.(session.baseRecipe.fillingRecipe.id, session.baseRecipe.variationSpec);
  }, [onOpenFillingRecipe, session]);

  // ---- Draft state ----

  const [ingredientInputDraft, setIngredientInputDraft] = useState<Record<number, string>>({});
  const [newIngredientText, setNewIngredientText] = useState('');
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

  const scaleFactor = useMemo<number | undefined>(() => {
    const baseWeight = session.baseRecipe.baseWeight;
    if (baseWeight <= 0) return undefined;
    const factor = session.produced.targetWeight / baseWeight;
    return Math.abs(factor - 1.0) < 0.001 ? undefined : factor;
  }, [session, sessionVersion]);

  const handleScaleOnBlur = useCallback((): void => {
    const weight = parseFloat(targetWeightInput);
    if (!isNaN(weight) && weight > 0) {
      session.scaleToTargetWeight(weight as Measurement);
      notifySession();
    } else {
      // Reset to current target weight if invalid
      setTargetWeightInput(String(session.produced.targetWeight));
    }
  }, [session, targetWeightInput, notifySession]);

  // ---- Ingredient handlers ----

  const handleIngredientSelect = useCallback(
    (index: number, match: { id: IngredientId; name: string }): void => {
      const existing = producedIngredients[index];
      if (match.id !== existing.ingredientId) {
        session.removeIngredient(existing.ingredientId);
        session.setIngredient(match.id as IngredientId, existing.amount, existing.unit, existing.modifiers);
      }
      setIngredientInputDraft((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      notifySession();
    },
    [notifySession, session, producedIngredients]
  );

  const handleIngredientUnresolved = useCallback(
    (text: string): void => {
      onRequestCreateEntity?.('ingredient', text);
    },
    [onRequestCreateEntity]
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
      notifySession();
    },
    [notifySession, session, producedIngredients]
  );

  const handleNewIngredientSelect = useCallback(
    (match: { id: IngredientId; name: string }): void => {
      session.setIngredient(match.id as IngredientId, 0 as Measurement);
      setNewIngredientText('');
      notifySession();
    },
    [notifySession, session]
  );

  const handleNewIngredientUnresolved = useCallback(
    (text: string): void => {
      if (onRequestCreateEntity) {
        onRequestCreateEntity('ingredient', text);
        setNewIngredientText('');
      }
    },
    [onRequestCreateEntity]
  );

  // ---- Procedure ----

  const procedureSuggestions = useMemo(() => {
    return Array.from(workspace.data.procedures.values()).map((proc: LibraryRuntime.IProcedure) => ({
      id: proc.id,
      name: proc.name
    }));
  }, [workspace, reactiveWorkspace.version]);

  // Build priority suggestions from variation procedures
  const procedureAlternates = useMemo(() => {
    const resolved = session.baseRecipe.procedures;
    if (!resolved) return [];
    return resolved.procedures.map((rp) => ({
      id: rp.id,
      name: rp.procedure.name
    }));
  }, [session]);

  const [newProcedureText, setNewProcedureText] = useState('');

  const handleProcedureSelect = useCallback(
    (match: { id: ProcedureId; name: string }): void => {
      session.setProcedure(match.id as ProcedureId);
      setNewProcedureText('');
      notifySession();
    },
    [notifySession, session]
  );

  const handleProcedureUnresolved = useCallback(
    (text: string): void => {
      if (onRequestCreateEntity) {
        onRequestCreateEntity('procedure', text);
        setNewProcedureText('');
      }
    },
    [onRequestCreateEntity]
  );

  const handleClearProcedure = useCallback((): void => {
    session.setProcedure(undefined);
    notifySession();
  }, [session, notifySession]);

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
      {/* Header */}
      <EntityDetailHeader title={session.label ?? session.baseId} subtitle={sessionId} />

      {/* Status bar with close button */}
      <SessionStatusBar
        session={session}
        onStatusChange={handleStatusChange}
        canUndo={session.canUndo()}
        canRedo={session.canRedo()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        hasChanges={hasChanges}
        onClose={onClose}
      />

      <div className="flex flex-col p-4 gap-4">
        {/* Recipe info */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipe</h3>
            {onRecipeSwap && (
              <button
                type="button"
                onClick={handleToggleRecipeEdit}
                title={recipeEditMode ? 'Cancel recipe change' : 'Change recipe or variation'}
                className="inline-flex items-center p-0.5 text-gray-400 hover:text-choco-primary rounded transition-colors"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Collapsed view */}
          {!recipeEditMode && (
            <div className="space-y-0.5 px-2">
              {onOpenFillingRecipe ? (
                <button
                  type="button"
                  onClick={handleOpenFillingRecipe}
                  className="text-sm text-left text-choco-primary hover:text-choco-primary/80 hover:underline"
                  title={`Open recipe ${String(session.baseRecipe.fillingRecipe.id)}`}
                >
                  {`${session.baseRecipe.fillingRecipe.name} | ${
                    session.baseRecipe.name ?? String(session.baseRecipe.variationSpec)
                  }`}
                </button>
              ) : (
                <div className="text-sm text-gray-800" title={String(session.baseRecipe.fillingRecipe.id)}>
                  {`${session.baseRecipe.fillingRecipe.name} | ${
                    session.baseRecipe.name ?? String(session.baseRecipe.variationSpec)
                  }`}
                </div>
              )}
              <ChangeSummaryIcons indicators={changeIndicators} />
            </div>
          )}

          {/* Expanded editing mode */}
          {recipeEditMode && (
            <div className="space-y-2 px-2">
              {/* Recipe selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-16 shrink-0">Recipe</label>
                <select
                  className="flex-1 min-w-0 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                  value={String(selectedRecipeId)}
                  onChange={(e): void => {
                    const newId = e.target.value as FillingId;
                    setSelectedRecipeId(newId);
                    // Reset variation to golden of new recipe
                    const recipeResult = workspace.data.fillings.get(newId);
                    if (recipeResult.isSuccess()) {
                      setSelectedVariationSpec(recipeResult.value.goldenVariationSpec);
                    }
                  }}
                >
                  {allFillingRecipes.map((r) => (
                    <option key={String(r.id)} value={String(r.id)}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Variation selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-16 shrink-0">Variation</label>
                <select
                  className="flex-1 min-w-0 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                  value={String(selectedVariationSpec)}
                  onChange={(e): void =>
                    setSelectedVariationSpec(e.target.value as FillingRecipeVariationSpec)
                  }
                >
                  {selectedRecipeVariations.map((v) => (
                    <option key={String(v.variationSpec)} value={String(v.variationSpec)}>
                      {v.name ?? String(v.variationSpec)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warning for non-scale changes */}
              {hasNonScaleChanges && isRecipeSwapChanged && (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                  You have unsaved changes that will be lost.
                </div>
              )}

              {/* Info about what will happen */}
              {isRecipeSwapChanged && (
                <div className="text-xs text-gray-500">
                  {isRecipeChanged
                    ? 'A new session will be created for the selected recipe.'
                    : 'Session will be updated in place with the selected variation.'}
                </div>
              )}

              {/* Apply / Cancel */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApplyRecipeSwap}
                  disabled={!isRecipeSwapChanged}
                  className="px-2.5 py-1 text-xs font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={handleToggleRecipeEdit}
                  className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Target Weight */}
        <EditSection title="Target Weight">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">Scale to</span>
            <input
              type="number"
              className="w-24 text-sm border border-gray-300 rounded px-2 py-0.5 text-right focus:outline-none focus:ring-1 focus:ring-choco-primary"
              value={targetWeightInput}
              placeholder={String(Math.round(session.baseRecipe.baseWeight))}
              min={1}
              step={10}
              onChange={(e): void => setTargetWeightInput(e.target.value)}
              onBlur={handleScaleOnBlur}
              onKeyDown={(e): void => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === 'Escape') {
                  setTargetWeightInput(String(session.produced.targetWeight));
                }
              }}
            />
            <span className="text-xs text-gray-500">g</span>
            {scaleFactor !== undefined && (
              <span className="text-xs text-amber-600 font-medium">
                {'\u00d7'}
                {scaleFactor.toFixed(2)}
              </span>
            )}
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
                    <TypeaheadInput<IngredientId>
                      value={ingValue}
                      onChange={(v): void => setIngredientInputDraft((prev) => ({ ...prev, [index]: v }))}
                      suggestions={ingredientSuggestions}
                      prioritySuggestions={ingredientAlternates}
                      onSelect={(match): void => handleIngredientSelect(index, match)}
                      onUnresolved={onRequestCreateEntity ? handleIngredientUnresolved : undefined}
                      className="flex-1 min-w-0 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
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
            <TypeaheadInput<IngredientId>
              value={newIngredientText}
              onChange={setNewIngredientText}
              suggestions={ingredientSuggestions}
              prioritySuggestions={ingredientAlternates}
              onSelect={handleNewIngredientSelect}
              onUnresolved={onRequestCreateEntity ? handleNewIngredientUnresolved : undefined}
              placeholder="+ add ingredient"
              className="flex-1 min-w-0 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
            />
          </div>
        </EditSection>

        {/* Procedure (editable) */}
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
              <TypeaheadInput<ProcedureId>
                value={newProcedureText}
                onChange={setNewProcedureText}
                suggestions={procedureSuggestions}
                prioritySuggestions={procedureAlternates}
                onSelect={handleProcedureSelect}
                onUnresolved={onRequestCreateEntity ? handleProcedureUnresolved : undefined}
                placeholder="Type procedure name to set"
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
              />
            )}
          </div>
        </EditSection>

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
