// Copyright (c) 2024 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * JSON-to-entity glue for AI-generated ingredient data.
 * @packageDocumentation
 */

import { Result, fail, succeed } from '@fgv/ts-utils';

import { type NoteCategory, type Model as CommonModel } from '../common';
import { Converters as IngredientConverters, IngredientEntity } from '../entities';

/**
 * The note category used for AI-generated notes.
 * @public
 */
export const AI_NOTE_CATEGORY: NoteCategory = 'ai' as NoteCategory;

/**
 * Result of parsing AI-generated ingredient JSON.
 * Contains the validated entity (with notes embedded) and
 * a convenience accessor for any AI-specific notes.
 * @public
 */
export interface IIngredientParseResult {
  /** The validated ingredient entity (notes included on the entity) */
  readonly entity: IngredientEntity;
  /** AI notes extracted for convenience display, if present */
  readonly notes?: string;
}

/**
 * Normalizes an AI-supplied `notes` value into an array of
 * {@link CommonModel.ICategorizedNote | ICategorizedNote}.
 *
 * Handles three cases:
 * 1. A plain string → wrapped as `[{ category: 'ai', note: string }]`
 * 2. An array of `{ category, note }` objects → passed through
 * 3. Anything else → returns `undefined`
 *
 * @param raw - The raw `notes` value from the AI JSON
 * @returns Normalized notes array or undefined
 * @internal
 */
function normalizeNotes(raw: unknown): CommonModel.ICategorizedNote[] | undefined {
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return [{ category: AI_NOTE_CATEGORY, note: raw.trim() }];
  }

  if (Array.isArray(raw) && raw.length > 0) {
    // Return the array as-is — the converter will validate each entry
    return raw as CommonModel.ICategorizedNote[];
  }

  return undefined;
}

/**
 * Parses and validates an unknown value (typically from AI-generated JSON)
 * into a validated {@link IngredientEntity}.
 *
 * Handles both legacy plain-string `notes` (converted to categorized with
 * category "ai") and the new `ICategorizedNote[]` format. Notes are embedded
 * on the entity and also returned separately for convenience display.
 *
 * @param from - The unknown value to parse (should be a parsed JSON object)
 * @returns A {@link Result} containing the validated entity and any AI notes
 * @public
 */
export function parseIngredientJson(from: unknown): Result<IIngredientParseResult> {
  if (typeof from !== 'object' || from === null || Array.isArray(from)) {
    return fail('expected a JSON object');
  }

  const raw = from as Record<string, unknown>;

  // Normalize notes: plain string → categorized array, array → pass through
  const normalizedNotes = normalizeNotes(raw.notes);

  // Replace raw notes with normalized version for validation
  const entityData = { ...raw, notes: normalizedNotes };

  return IngredientConverters.Ingredients.ingredientEntity.convert(entityData).onSuccess((entity) => {
    // Extract AI notes for convenience display
    const aiNote = entity.notes?.find((n) => n.category === AI_NOTE_CATEGORY);
    return succeed({ entity, notes: aiNote?.note });
  });
}
