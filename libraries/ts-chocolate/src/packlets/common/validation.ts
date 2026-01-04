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
 * Validation helpers for branded types
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import {
  BASE_ID_PATTERN,
  BaseIngredientId,
  BaseRecipeId,
  Celsius,
  COMPOSITE_ID_PATTERN,
  DegreesMacMichael,
  Grams,
  ID_SEPARATOR,
  IngredientId,
  Percentage,
  RatingScore,
  RECIPE_VERSION_ID_PATTERN,
  RecipeId,
  RecipeName,
  RecipeVersionId,
  SourceId
} from './model';

// ============================================================================
// Base ID Validators (no dots allowed)
// ============================================================================

/**
 * Type guard for SourceId
 * @param from - Value to check
 * @returns True if the value is a valid SourceId
 * @public
 */
export function isValidSourceId(from: unknown): from is SourceId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to SourceId
 * @param from - Value to convert
 * @returns Result with SourceId or error
 * @public
 */
export function toSourceId(from: unknown): Result<SourceId> {
  if (isValidSourceId(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid SourceId: must be non-empty alphanumeric with dashes/underscores, no dots');
}

/**
 * Type guard for BaseIngredientId
 * @param from - Value to check
 * @returns True if the value is a valid BaseIngredientId
 * @public
 */
export function isValidBaseIngredientId(from: unknown): from is BaseIngredientId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to BaseIngredientId
 * @param from - Value to convert
 * @returns Result with BaseIngredientId or error
 * @public
 */
export function toBaseIngredientId(from: unknown): Result<BaseIngredientId> {
  if (isValidBaseIngredientId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid BaseIngredientId: must be non-empty alphanumeric with dashes/underscores, no dots'
  );
}

/**
 * Type guard for BaseRecipeId
 * @param from - Value to check
 * @returns True if the value is a valid BaseRecipeId
 * @public
 */
export function isValidBaseRecipeId(from: unknown): from is BaseRecipeId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to BaseRecipeId
 * @param from - Value to convert
 * @returns Result with BaseRecipeId or error
 * @public
 */
export function toBaseRecipeId(from: unknown): Result<BaseRecipeId> {
  if (isValidBaseRecipeId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid BaseRecipeId: must be non-empty alphanumeric with dashes/underscores, no dots'
  );
}

// ============================================================================
// Composite ID Validators (exactly one dot)
// ============================================================================

/**
 * Type guard for IngredientId
 * @param from - Value to check
 * @returns True if the value is a valid composite IngredientId
 * @public
 */
export function isValidIngredientId(from: unknown): from is IngredientId {
  return typeof from === 'string' && COMPOSITE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to IngredientId
 * @param from - Value to convert
 * @returns Result with IngredientId or error
 * @public
 */
export function toIngredientId(from: unknown): Result<IngredientId> {
  if (isValidIngredientId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid IngredientId: must be in format "sourceId.baseId" with alphanumeric characters, dashes, and underscores'
  );
}

/**
 * Type guard for RecipeId
 * @param from - Value to check
 * @returns True if the value is a valid composite RecipeId
 * @public
 */
export function isValidRecipeId(from: unknown): from is RecipeId {
  return typeof from === 'string' && COMPOSITE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to RecipeId
 * @param from - Value to convert
 * @returns Result with RecipeId or error
 * @public
 */
export function toRecipeId(from: unknown): Result<RecipeId> {
  if (isValidRecipeId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid RecipeId: must be in format "sourceId.baseId" with alphanumeric characters, dashes, and underscores'
  );
}

// ============================================================================
// Other String Validators
// ============================================================================

/**
 * Type guard for RecipeName
 * @param from - Value to check
 * @returns True if the value is a valid RecipeName
 * @public
 */
export function isValidRecipeName(from: unknown): from is RecipeName {
  return typeof from === 'string' && from.length > 0;
}

/**
 * Converts unknown value to RecipeName
 * @param from - Value to convert
 * @returns Result with RecipeName or error
 * @public
 */
export function toRecipeName(from: unknown): Result<RecipeName> {
  if (isValidRecipeName(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid RecipeName: must be a non-empty string');
}

/**
 * Type guard for RecipeVersionId
 * @param from - Value to check
 * @returns True if the value is a valid RecipeVersionId
 * @public
 */
export function isValidRecipeVersionId(from: unknown): from is RecipeVersionId {
  return typeof from === 'string' && RECIPE_VERSION_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to RecipeVersionId
 * @param from - Value to convert
 * @returns Result with RecipeVersionId or error
 * @public
 */
export function toRecipeVersionId(from: unknown): Result<RecipeVersionId> {
  if (isValidRecipeVersionId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid RecipeVersionId: must be in format YYYY-MM-DD-NN with optional lowercase label (e.g., "2026-01-03-01" or "2026-01-03-02-tweaked")'
  );
}

// ============================================================================
// Numeric Validators
// ============================================================================

/**
 * Type guard for Grams
 * @param from - Value to check
 * @returns True if the value is a valid Grams value
 * @public
 */
export function isValidGrams(from: unknown): from is Grams {
  return typeof from === 'number' && Number.isFinite(from) && from >= 0;
}

/**
 * Converts unknown value to Grams
 * @param from - Value to convert
 * @returns Result with Grams or error
 * @public
 */
export function toGrams(from: unknown): Result<Grams> {
  if (isValidGrams(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid Grams: must be a non-negative finite number');
}

/**
 * Type guard for Percentage
 * @param from - Value to check
 * @returns True if the value is a valid Percentage (0-100)
 * @public
 */
export function isValidPercentage(from: unknown): from is Percentage {
  return typeof from === 'number' && Number.isFinite(from) && from >= 0 && from <= 100;
}

/**
 * Converts unknown value to Percentage
 * @param from - Value to convert
 * @returns Result with Percentage or error
 * @public
 */
export function toPercentage(from: unknown): Result<Percentage> {
  if (isValidPercentage(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid Percentage: must be a number between 0 and 100');
}

/**
 * Type guard for Celsius
 * @param from - Value to check
 * @returns True if the value is a valid Celsius temperature
 * @public
 */
export function isValidCelsius(from: unknown): from is Celsius {
  return typeof from === 'number' && Number.isFinite(from);
}

/**
 * Converts unknown value to Celsius
 * @param from - Value to convert
 * @returns Result with Celsius or error
 * @public
 */
export function toCelsius(from: unknown): Result<Celsius> {
  if (isValidCelsius(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid Celsius: must be a finite number');
}

/**
 * Type guard for DegreesMacMichael
 * @param from - Value to check
 * @returns True if the value is a valid DegreesMacMichael
 * @public
 */
export function isValidDegreesMacMichael(from: unknown): from is DegreesMacMichael {
  return typeof from === 'number' && Number.isFinite(from) && from >= 0;
}

/**
 * Converts unknown value to DegreesMacMichael
 * @param from - Value to convert
 * @returns Result with DegreesMacMichael or error
 * @public
 */
export function toDegreesMacMichael(from: unknown): Result<DegreesMacMichael> {
  if (isValidDegreesMacMichael(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid DegreesMacMichael: must be a non-negative finite number');
}

/**
 * Type guard for RatingScore
 * @param from - Value to check
 * @returns True if the value is a valid RatingScore (1-5)
 * @public
 */
export function isValidRatingScore(from: unknown): from is RatingScore {
  return typeof from === 'number' && Number.isInteger(from) && from >= 1 && from <= 5;
}

/**
 * Converts unknown value to RatingScore
 * @param from - Value to convert
 * @returns Result with RatingScore or error
 * @public
 */
export function toRatingScore(from: unknown): Result<RatingScore> {
  if (isValidRatingScore(from)) {
    return Success.with(from);
  }
  return Failure.with(`${from}: Invalid RatingScore: must be an integer between 1 and 5`);
}

// ============================================================================
// Composite ID Helpers
// ============================================================================

/**
 * Creates a composite IngredientId from source ID and base ID
 * @param sourceId - The source identifier
 * @param baseId - The base ingredient identifier
 * @returns Composite ingredient ID in format "sourceId.baseId"
 * @public
 */
export function createIngredientId(sourceId: SourceId, baseId: BaseIngredientId): IngredientId {
  return `${sourceId}${ID_SEPARATOR}${baseId}` as IngredientId;
}

/**
 * Parses a composite IngredientId into source ID and base ID
 * @param id - The composite ingredient ID to parse
 * @returns Result with tuple [sourceId, baseId] or error
 * @public
 */
export function parseIngredientId(id: IngredientId): Result<[SourceId, BaseIngredientId]> {
  const parts = id.split(ID_SEPARATOR);
  if (parts.length !== 2) {
    return Failure.with(`Invalid IngredientId format: ${id}`);
  }
  return toSourceId(parts[0]).onSuccess((sourceId) =>
    toBaseIngredientId(parts[1]).onSuccess((baseId) =>
      Success.with([sourceId, baseId] as [SourceId, BaseIngredientId])
    )
  );
}

/**
 * Gets the source ID from a composite IngredientId
 * @param id - The composite ingredient ID
 * @returns The source ID portion
 * @public
 */
export function getIngredientSourceId(id: IngredientId): SourceId {
  return id.split(ID_SEPARATOR)[0] as SourceId;
}

/**
 * Gets the base ID from a composite IngredientId
 * @param id - The composite ingredient ID
 * @returns The base ingredient ID portion
 * @public
 */
export function getIngredientBaseId(id: IngredientId): BaseIngredientId {
  return id.split(ID_SEPARATOR)[1] as BaseIngredientId;
}

/**
 * Creates a composite RecipeId from source ID and base ID
 * @param sourceId - The source identifier
 * @param baseId - The base recipe identifier
 * @returns Composite recipe ID in format "sourceId.baseId"
 * @public
 */
export function createRecipeId(sourceId: SourceId, baseId: BaseRecipeId): RecipeId {
  return `${sourceId}${ID_SEPARATOR}${baseId}` as RecipeId;
}

/**
 * Parses a composite RecipeId into source ID and base ID
 * @param id - The composite recipe ID to parse
 * @returns Result with tuple [sourceId, baseId] or error
 * @public
 */
export function parseRecipeId(id: RecipeId): Result<[SourceId, BaseRecipeId]> {
  const parts = id.split(ID_SEPARATOR);
  if (parts.length !== 2) {
    return Failure.with(`Invalid RecipeId format: ${id}`);
  }
  return toSourceId(parts[0]).onSuccess((sourceId) =>
    toBaseRecipeId(parts[1]).onSuccess((baseId) =>
      Success.with([sourceId, baseId] as [SourceId, BaseRecipeId])
    )
  );
}

/**
 * Gets the source ID from a composite RecipeId
 * @param id - The composite recipe ID
 * @returns The source ID portion
 * @public
 */
export function getRecipeSourceId(id: RecipeId): SourceId {
  return id.split(ID_SEPARATOR)[0] as SourceId;
}

/**
 * Gets the base ID from a composite RecipeId
 * @param id - The composite recipe ID
 * @returns The base recipe ID portion
 * @public
 */
export function getRecipeBaseId(id: RecipeId): BaseRecipeId {
  return id.split(ID_SEPARATOR)[1] as BaseRecipeId;
}
