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
 * Cascade panel for creating a new session with recipe typeahead.
 *
 * Provides a recipe selector (combined confection + filling datalist),
 * a type filter, label, and slug fields. Used both from the "+ New Session"
 * button and from "Start Session" in confection/filling detail views.
 *
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useTypeaheadMatch } from '@fgv/ts-app-shell';
import type { LibraryRuntime } from '@fgv/ts-chocolate';

import type { ICreateSessionInfo } from '../navigation';

// ============================================================================
// Types
// ============================================================================

/**
 * Recipe type filter for the session create panel.
 * @public
 */
export type SessionRecipeTypeFilter = 'any' | 'confection' | 'filling';

/**
 * Discriminated union for the selected recipe.
 * @public
 */
export type ISessionRecipeSelection =
  | { readonly type: 'confection'; readonly confectionId: string }
  | { readonly type: 'filling'; readonly fillingId: string; readonly variationSpec: string };

/**
 * Props for the CreateSessionPanel component.
 * @public
 */
export interface ICreateSessionPanelProps {
  /** Pre-fill data from cross-tab navigation (e.g. from confection/filling detail) */
  readonly createInfo?: ICreateSessionInfo;
  /** Available confection recipes for the datalist */
  readonly availableConfections: ReadonlyArray<LibraryRuntime.AnyConfection>;
  /** Available filling recipes for the datalist */
  readonly availableFillings: ReadonlyArray<LibraryRuntime.FillingRecipe>;
  /** Called when the user confirms creation */
  readonly onConfirm: (selection: ISessionRecipeSelection, label: string, slug: string) => void;
  /** Called when the user cancels */
  readonly onCancel: () => void;
  /** Callback to create a new confection from an unresolved name */
  readonly onAddConfection?: (seed: string) => void;
  /** Callback to create a new filling from an unresolved name */
  readonly onAddFilling?: (seed: string) => void;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Converts a display name to a kebab-case slug.
 * @internal
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================================================
// Datalist Suggestion Types
// ============================================================================

interface IConfectionSuggestion {
  readonly id: string;
  readonly name: string;
  readonly recipeType: 'confection';
}

interface IFillingSuggestion {
  readonly id: string;
  readonly name: string;
  readonly recipeType: 'filling';
  readonly filling: LibraryRuntime.FillingRecipe;
}

type IRecipeSuggestion = IConfectionSuggestion | IFillingSuggestion;

// ============================================================================
// Component
// ============================================================================

/**
 * Cascade panel for creating a new session.
 *
 * Renders a recipe typeahead (combined confection + filling datalist),
 * type filter, label/slug fields, and Create/Cancel actions.
 *
 * @public
 */
export function CreateSessionPanel(props: ICreateSessionPanelProps): React.ReactElement {
  const {
    createInfo,
    availableConfections,
    availableFillings,
    onConfirm,
    onCancel,
    onAddConfection,
    onAddFilling
  } = props;

  // --------------------------------------------------------------------------
  // Determine initial state from createInfo
  // --------------------------------------------------------------------------

  const initialTypeFilter: SessionRecipeTypeFilter = createInfo?.confectionId
    ? 'confection'
    : createInfo?.fillingId
    ? 'filling'
    : 'any';

  const initialRecipeName = createInfo?.entityName ?? '';

  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  const [typeFilter, setTypeFilter] = useState<SessionRecipeTypeFilter>(initialTypeFilter);
  const [recipeInput, setRecipeInput] = useState(initialRecipeName);
  const [selectedRecipe, setSelectedRecipe] = useState<IRecipeSuggestion | undefined>(undefined);
  const [selectedVariationSpec, setSelectedVariationSpec] = useState<string | undefined>(
    createInfo?.variationSpec
  );
  const [pendingUnresolved, setPendingUnresolved] = useState<string | undefined>(undefined);

  const [label, setLabel] = useState(initialRecipeName);
  const [slug, setSlug] = useState(toSlug(initialRecipeName));
  const [slugEdited, setSlugEdited] = useState(false);

  // --------------------------------------------------------------------------
  // Build datalist suggestions
  // --------------------------------------------------------------------------

  const allSuggestions = useMemo((): ReadonlyArray<IRecipeSuggestion> => {
    const confections: IRecipeSuggestion[] = availableConfections.map(
      (c): IConfectionSuggestion => ({
        id: c.id,
        name: c.name,
        recipeType: 'confection'
      })
    );
    const fillings: IRecipeSuggestion[] = availableFillings.map(
      (f): IFillingSuggestion => ({
        id: f.id,
        name: f.name,
        recipeType: 'filling',
        filling: f
      })
    );
    return [...confections, ...fillings];
  }, [availableConfections, availableFillings]);

  const filteredSuggestions = useMemo((): ReadonlyArray<IRecipeSuggestion> => {
    if (typeFilter === 'any') return allSuggestions;
    return allSuggestions.filter((s) => s.recipeType === typeFilter);
  }, [allSuggestions, typeFilter]);

  const suggestionById = useMemo(
    (): ReadonlyMap<string, IRecipeSuggestion> => new Map(allSuggestions.map((s) => [s.id, s])),
    [allSuggestions]
  );

  const matcher = useTypeaheadMatch(filteredSuggestions as ReadonlyArray<{ id: string; name: string }>);

  // --------------------------------------------------------------------------
  // Auto-resolve pre-filled recipe on mount
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!createInfo) return;

    if (createInfo.confectionId) {
      const suggestion = suggestionById.get(createInfo.confectionId);
      if (suggestion) {
        setSelectedRecipe(suggestion);
        setRecipeInput(suggestion.name);
        return;
      }
    }

    if (createInfo.fillingId) {
      const suggestion = suggestionById.get(createInfo.fillingId);
      if (suggestion) {
        setSelectedRecipe(suggestion);
        setRecipeInput(suggestion.name);
        return;
      }
    }
    // Run only on mount to apply pre-fill — deps intentionally empty
  }, []);

  // --------------------------------------------------------------------------
  // Recipe input handlers
  // --------------------------------------------------------------------------

  const handleRecipeInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value;
      setRecipeInput(value);
      setPendingUnresolved(undefined);

      // Try exact match as user types (for datalist selection)
      const match = matcher.findExactMatch(value);
      if (match) {
        const full = suggestionById.get(match.id);
        if (full) {
          setSelectedRecipe(full);
          setTypeFilter(full.recipeType);
          if (full.recipeType === 'filling') {
            setSelectedVariationSpec(full.filling.goldenVariationSpec);
          }
          // Update label/slug from recipe name
          if (!label || label === initialRecipeName) {
            setLabel(full.name);
            if (!slugEdited) {
              setSlug(toSlug(full.name));
            }
          }
        }
      } else {
        setSelectedRecipe(undefined);
      }
    },
    [matcher, suggestionById, label, initialRecipeName, slugEdited]
  );

  const handleRecipeBlur = useCallback((): void => {
    const match = matcher.resolveOnBlur(recipeInput);
    if (match) {
      const full = suggestionById.get(match.id);
      if (full) {
        setSelectedRecipe(full);
        setRecipeInput(full.name);
        setTypeFilter(full.recipeType);
        if (full.recipeType === 'filling') {
          setSelectedVariationSpec(full.filling.goldenVariationSpec);
        }
        if (!label || label === initialRecipeName) {
          setLabel(full.name);
          if (!slugEdited) {
            setSlug(toSlug(full.name));
          }
        }
        setPendingUnresolved(undefined);
        return;
      }
    }

    // No match — handle unresolved
    if (recipeInput.trim()) {
      setSelectedRecipe(undefined);

      if (typeFilter === 'confection') {
        onAddConfection?.(recipeInput.trim());
      } else if (typeFilter === 'filling') {
        onAddFilling?.(recipeInput.trim());
      } else {
        // type is "any" — show disambiguation
        setPendingUnresolved(recipeInput.trim());
      }
    }
  }, [
    matcher,
    recipeInput,
    suggestionById,
    typeFilter,
    label,
    initialRecipeName,
    slugEdited,
    onAddConfection,
    onAddFilling
  ]);

  // --------------------------------------------------------------------------
  // Label / slug handlers
  // --------------------------------------------------------------------------

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const newLabel = e.target.value;
      setLabel(newLabel);
      if (!slugEdited) {
        setSlug(toSlug(newLabel));
      }
    },
    [slugEdited]
  );

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setSlugEdited(true);
    setSlug(toSlug(e.target.value));
  }, []);

  // --------------------------------------------------------------------------
  // Submit
  // --------------------------------------------------------------------------

  const canSubmit = useMemo((): boolean => {
    if (!selectedRecipe) return false;
    if (!label.trim()) return false;
    if (!slug.trim()) return false;
    if (selectedRecipe.recipeType === 'filling' && !selectedVariationSpec) return false;
    return true;
  }, [selectedRecipe, label, slug, selectedVariationSpec]);

  const handleSubmit = useCallback((): void => {
    if (!selectedRecipe || !label.trim() || !slug.trim()) return;

    let selection: ISessionRecipeSelection;
    if (selectedRecipe.recipeType === 'confection') {
      selection = { type: 'confection', confectionId: selectedRecipe.id };
    } else {
      if (!selectedVariationSpec) return;
      selection = { type: 'filling', fillingId: selectedRecipe.id, variationSpec: selectedVariationSpec };
    }

    onConfirm(selection, label.trim(), slug.trim());
  }, [selectedRecipe, selectedVariationSpec, label, slug, onConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && canSubmit) {
        handleSubmit();
      }
    },
    [onCancel, canSubmit, handleSubmit]
  );

  // --------------------------------------------------------------------------
  // Variation options (filling only)
  // --------------------------------------------------------------------------

  const variationOptions = useMemo((): ReadonlyArray<{ spec: string; label: string }> => {
    if (!selectedRecipe || selectedRecipe.recipeType !== 'filling') return [];
    return selectedRecipe.filling.variations.map((v) => ({
      spec: v.variationSpec,
      label:
        v.variationSpec === selectedRecipe.filling.goldenVariationSpec
          ? `${v.variationSpec} (default)`
          : v.variationSpec
    }));
  }, [selectedRecipe]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="p-4 space-y-4" onKeyDown={handleKeyDown}>
      <h2 className="text-lg font-semibold text-gray-900">New Session</h2>

      {/* Type filter */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Recipe Type</label>
        <div className="flex gap-1">
          {(['any', 'confection', 'filling'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={(): void => {
                setTypeFilter(t);
                // If changing filter invalidates current selection, clear it
                if (selectedRecipe && t !== 'any' && selectedRecipe.recipeType !== t) {
                  setSelectedRecipe(undefined);
                  setRecipeInput('');
                }
              }}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                typeFilter === t
                  ? 'bg-choco-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'any' ? 'Any' : t === 'confection' ? 'Confection' : 'Filling'}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe typeahead */}
      <div>
        <label htmlFor="session-recipe" className="block text-xs font-medium text-gray-700 mb-1">
          Recipe
        </label>
        <input
          id="session-recipe"
          data-testid="sessions-create-recipe-input"
          type="text"
          list="session-recipe-suggestions"
          value={recipeInput}
          onChange={handleRecipeInputChange}
          onBlur={handleRecipeBlur}
          placeholder="Search confections and fillings..."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
          autoFocus
        />
        <datalist id="session-recipe-suggestions">
          {filteredSuggestions.map((s) => (
            <option key={s.id} value={s.name}>
              {s.recipeType === 'confection' ? '(confection)' : '(filling)'} {s.id}
            </option>
          ))}
        </datalist>
        {selectedRecipe && (
          <p className="mt-1 text-xs text-green-700">
            Selected: <span className="font-medium">{selectedRecipe.name}</span>{' '}
            <span className="text-gray-500">({selectedRecipe.recipeType})</span>
          </p>
        )}
      </div>

      {/* Unresolved disambiguation (type="any") */}
      {pendingUnresolved && (
        <div
          data-testid="sessions-create-unresolved-panel"
          className="rounded border border-amber-200 bg-amber-50 p-2 space-y-1.5"
        >
          <div className="text-xs text-amber-800">
            <span className="font-medium">&quot;{pendingUnresolved}&quot;</span> not found. Create as:
          </div>
          <div className="flex gap-1.5">
            {onAddConfection && (
              <button
                type="button"
                data-testid="sessions-create-unresolved-confection"
                onClick={(): void => {
                  onAddConfection(pendingUnresolved);
                  setPendingUnresolved(undefined);
                }}
                className="px-2 py-0.5 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90"
              >
                Confection
              </button>
            )}
            {onAddFilling && (
              <button
                type="button"
                data-testid="sessions-create-unresolved-filling"
                onClick={(): void => {
                  onAddFilling(pendingUnresolved);
                  setPendingUnresolved(undefined);
                }}
                className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Filling
              </button>
            )}
            <button
              type="button"
              data-testid="sessions-create-unresolved-cancel"
              onClick={(): void => setPendingUnresolved(undefined)}
              className="px-2 py-0.5 text-xs rounded text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Variation selector (filling only) */}
      {selectedRecipe?.recipeType === 'filling' && variationOptions.length > 0 && (
        <div>
          <label htmlFor="session-variation" className="block text-xs font-medium text-gray-700 mb-1">
            Variation
          </label>
          <select
            id="session-variation"
            value={selectedVariationSpec ?? ''}
            onChange={(e): void => setSelectedVariationSpec(e.target.value || undefined)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
          >
            {variationOptions.map((v) => (
              <option key={v.spec} value={v.spec}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Label field */}
      <div>
        <label htmlFor="session-label" className="block text-xs font-medium text-gray-700 mb-1">
          Session Name
        </label>
        <input
          id="session-label"
          type="text"
          value={label}
          onChange={handleLabelChange}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
        />
      </div>

      {/* Slug field */}
      <div>
        <label htmlFor="session-slug" className="block text-xs font-medium text-gray-700 mb-1">
          ID Slug
        </label>
        <input
          id="session-slug"
          type="text"
          value={slug}
          onChange={handleSlugChange}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono text-gray-600 focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
        />
        <p className="mt-1 text-[11px] text-gray-400">Appended to the session ID for easy identification.</p>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Create
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
