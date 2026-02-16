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
 * Reusable datalist typeahead match hook.
 * @packageDocumentation
 */

import { useCallback } from 'react';

/**
 * A suggestion entry for datalist matching.
 * @public
 */
export interface IDatalistSuggestion<TId extends string> {
  readonly id: TId;
  readonly name: string;
}

/**
 * Result of the useDatalistMatch hook.
 * @public
 */
export interface IDatalistMatchResult<TId extends string> {
  /** Find an exact match by id or case-insensitive name. */
  findExactMatch: (input: string) => IDatalistSuggestion<TId> | undefined;
  /** Resolve on blur: exact match → use it; single partial → use it; else undefined. */
  resolveOnBlur: (input: string) => IDatalistSuggestion<TId> | undefined;
}

/**
 * Hook that provides datalist typeahead matching logic.
 *
 * `findExactMatch` matches by exact id or case-insensitive name.
 * `resolveOnBlur` tries exact match first, then falls back to partial matching.
 * If exactly one suggestion partially matches, it auto-selects. Otherwise returns undefined.
 *
 * @param suggestions - The available suggestions to match against
 * @returns Match functions for use in commit/blur handlers
 * @public
 */
export function useDatalistMatch<TId extends string>(
  suggestions: ReadonlyArray<IDatalistSuggestion<TId>>
): IDatalistMatchResult<TId> {
  const findExactMatch = useCallback(
    (input: string): IDatalistSuggestion<TId> | undefined => {
      const trimmed = input.trim();
      if (!trimmed) return undefined;
      return suggestions.find((s) => s.id === trimmed || s.name.toLowerCase() === trimmed.toLowerCase());
    },
    [suggestions]
  );

  const resolveOnBlur = useCallback(
    (input: string): IDatalistSuggestion<TId> | undefined => {
      const trimmed = input.trim();
      if (!trimmed) return undefined;

      // Try exact match first
      const exact = suggestions.find(
        (s) => s.id === trimmed || s.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (exact) return exact;

      // Try partial match — auto-select if exactly one
      const lower = trimmed.toLowerCase();
      const partials = suggestions.filter(
        (s) => s.name.toLowerCase().includes(lower) || s.id.toLowerCase().includes(lower)
      );
      if (partials.length === 1) return partials[0];

      return undefined;
    },
    [suggestions]
  );

  return { findExactMatch, resolveOnBlur };
}
