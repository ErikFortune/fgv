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
 * Reusable typeahead matching hook with tiered priority support.
 * @packageDocumentation
 */

import { useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * A suggestion entry for typeahead matching.
 * @public
 */
export interface ITypeaheadSuggestion<TId extends string = string> {
  readonly id: TId;
  readonly name: string;
}

/**
 * Filtered suggestions split by tier.
 * @public
 */
export interface IFilteredSuggestions<TId extends string> {
  readonly priority: ReadonlyArray<ITypeaheadSuggestion<TId>>;
  readonly catalog: ReadonlyArray<ITypeaheadSuggestion<TId>>;
}

/**
 * Result of the useTypeaheadMatch hook.
 * @public
 */
export interface ITypeaheadMatchResult<TId extends string> {
  /** Find an exact match by id or case-insensitive name. Checks priority first. */
  findExactMatch: (input: string) => ITypeaheadSuggestion<TId> | undefined;
  /** Resolve on blur: exact match → use it; single partial → use it; else undefined. */
  resolveOnBlur: (input: string) => ITypeaheadSuggestion<TId> | undefined;
  /** Filter suggestions by input text, returning priority and catalog tiers separately. */
  filterSuggestions: (input: string) => IFilteredSuggestions<TId>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook that provides typeahead matching and filtering with tiered priority support.
 *
 * `findExactMatch` matches by exact id or case-insensitive name (checks priority first).
 * `resolveOnBlur` tries exact match, then single partial match (priority first).
 * `filterSuggestions` returns suggestions split by tier, filtered by substring match.
 *
 * @param suggestions - The full catalog of suggestions
 * @param prioritySuggestions - Optional priority suggestions shown first (e.g. recipe alternates)
 * @returns Match and filter functions
 * @public
 */
export function useTypeaheadMatch<TId extends string>(
  suggestions: ReadonlyArray<ITypeaheadSuggestion<TId>>,
  prioritySuggestions?: ReadonlyArray<ITypeaheadSuggestion<TId>>
): ITypeaheadMatchResult<TId> {
  // Pre-compute priority IDs for efficient catalog deduplication
  const priorityIds = useMemo(
    () => new Set(prioritySuggestions?.map((s) => s.id) ?? []),
    [prioritySuggestions]
  );

  const findExactMatch = useCallback(
    (input: string): ITypeaheadSuggestion<TId> | undefined => {
      const trimmed = input.trim();
      if (!trimmed) return undefined;
      const lower = trimmed.toLowerCase();
      if (prioritySuggestions) {
        const match = prioritySuggestions.find((s) => s.id === trimmed || s.name.toLowerCase() === lower);
        if (match) return match;
      }
      return suggestions.find((s) => s.id === trimmed || s.name.toLowerCase() === lower);
    },
    [suggestions, prioritySuggestions]
  );

  const resolveOnBlur = useCallback(
    (input: string): ITypeaheadSuggestion<TId> | undefined => {
      const trimmed = input.trim();
      if (!trimmed) return undefined;
      const lower = trimmed.toLowerCase();

      // Try exact match (priority first, then all)
      if (prioritySuggestions) {
        const priorityExact = prioritySuggestions.find(
          (s) => s.id === trimmed || s.name.toLowerCase() === lower
        );
        if (priorityExact) return priorityExact;
      }

      const exact = suggestions.find((s) => s.id === trimmed || s.name.toLowerCase() === lower);
      if (exact) return exact;

      // Try partial match in priority suggestions first
      if (prioritySuggestions) {
        const priorityPartials = prioritySuggestions.filter(
          (s) => s.name.toLowerCase().includes(lower) || s.id.toLowerCase().includes(lower)
        );
        if (priorityPartials.length === 1) return priorityPartials[0];
      }

      // Fall back to partial match in all suggestions
      const partials = suggestions.filter(
        (s) => s.name.toLowerCase().includes(lower) || s.id.toLowerCase().includes(lower)
      );
      if (partials.length === 1) return partials[0];

      return undefined;
    },
    [suggestions, prioritySuggestions]
  );

  const filterSuggestions = useCallback(
    (input: string): IFilteredSuggestions<TId> => {
      const trimmed = input.trim();
      const lower = trimmed.toLowerCase();

      // No input — return all suggestions split by tier
      if (!trimmed) {
        return {
          priority: prioritySuggestions ?? [],
          catalog: suggestions.filter((s) => !priorityIds.has(s.id))
        };
      }

      // Filter by substring match
      const matchesSuggestion = (s: ITypeaheadSuggestion<TId>): boolean =>
        s.name.toLowerCase().includes(lower) || s.id.toLowerCase().includes(lower);

      const priority = prioritySuggestions?.filter(matchesSuggestion) ?? [];
      const catalog = suggestions.filter((s) => !priorityIds.has(s.id) && matchesSuggestion(s));

      return { priority, catalog };
    },
    [suggestions, prioritySuggestions, priorityIds]
  );

  return { findExactMatch, resolveOnBlur, filterSuggestions };
}
