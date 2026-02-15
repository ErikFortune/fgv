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

import { Converters as IngredientConverters, IngredientEntity } from '../entities';

/**
 * Result of parsing AI-generated ingredient JSON.
 * Contains the validated entity and any notes the AI included.
 * @public
 */
export interface IIngredientParseResult {
  /** The validated ingredient entity */
  readonly entity: IngredientEntity;
  /** Notes from the AI about assumptions and estimates, if present */
  readonly notes?: string;
}

/**
 * Parses and validates an unknown value (typically from AI-generated JSON)
 * into a validated {@link IngredientEntity}.
 *
 * Strips the informational "notes" field before validation since it is not
 * part of the entity schema, but preserves it in the result for display.
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
  const notes = typeof raw.notes === 'string' ? raw.notes : undefined;

  // Strip "notes" before validation since it is not part of the entity schema
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { notes: _stripped, ...entityData } = raw;

  return IngredientConverters.Ingredients.ingredientEntity
    .convert(entityData)
    .onSuccess((entity) => succeed({ entity, notes }));
}
