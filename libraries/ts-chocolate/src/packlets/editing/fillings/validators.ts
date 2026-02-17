// Copyright (c) 2026 Erik Fortune
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
 * Semantic validators for filling recipe entities.
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import { Fillings } from '../../entities';

const { allRatingCategories, allFillingCategories } = Fillings;

type IFillingRecipeEntity = Fillings.IFillingRecipeEntity;

/**
 * Validate that the filling recipe name is non-empty.
 * @param entity - Filling recipe entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateFillingName(entity: IFillingRecipeEntity): Result<true> {
  if (entity.name.trim().length === 0) {
    return Failure.with('filling recipe name must not be empty');
  }
  return Success.with(true);
}

/**
 * Validate that the filling recipe category is a known value.
 * @param entity - Filling recipe entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateFillingCategory(entity: IFillingRecipeEntity): Result<true> {
  if (!allFillingCategories.includes(entity.category)) {
    return Failure.with(
      `filling category '${entity.category}' is not valid (must be one of: ${allFillingCategories.join(
        ', '
      )})`
    );
  }
  return Success.with(true);
}

/**
 * Validate that the filling recipe has at least one variation and the golden spec exists.
 * @param entity - Filling recipe entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateFillingVariations(entity: IFillingRecipeEntity): Result<true> {
  if (entity.variations.length === 0) {
    return Failure.with('filling recipe must have at least one variation');
  }
  if (!entity.variations.some((v) => v.variationSpec === entity.goldenVariationSpec)) {
    return Failure.with(`golden variation spec '${entity.goldenVariationSpec}' does not match any variation`);
  }
  return Success.with(true);
}

/**
 * Validate that each variation's ingredients have at least one ID and non-negative amounts.
 * @param entity - Filling recipe entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateFillingIngredients(entity: IFillingRecipeEntity): Result<true> {
  for (const variation of entity.variations) {
    for (const ingredient of variation.ingredients) {
      if (ingredient.ingredient.ids.length === 0) {
        return Failure.with(`variation '${variation.variationSpec}': ingredient must have at least one ID`);
      }
      if (ingredient.amount < 0) {
        return Failure.with(`variation '${variation.variationSpec}': ingredient amount must not be negative`);
      }
    }
  }
  return Success.with(true);
}

/**
 * Validate that each variation's ratings have valid scores (1-5), categories, and no duplicates.
 * @param entity - Filling recipe entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateFillingRatings(entity: IFillingRecipeEntity): Result<true> {
  for (const variation of entity.variations) {
    if (!variation.ratings) {
      continue;
    }

    const seenCategories = new Set<string>();

    for (const rating of variation.ratings) {
      if (rating.score < 1 || rating.score > 5) {
        return Failure.with(
          `variation '${variation.variationSpec}': rating score must be between 1 and 5 (got ${rating.score})`
        );
      }

      if (!allRatingCategories.includes(rating.category)) {
        return Failure.with(
          `variation '${variation.variationSpec}': rating category '${
            rating.category
          }' is not valid (must be one of: ${allRatingCategories.join(', ')})`
        );
      }

      if (seenCategories.has(rating.category)) {
        return Failure.with(
          `variation '${variation.variationSpec}': duplicate rating category: ${rating.category}`
        );
      }
      seenCategories.add(rating.category);
    }
  }

  return Success.with(true);
}

/**
 * Validate entity-level constraints that span multiple fields.
 * @param entity - Complete filling recipe entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateFillingRecipeEntity(entity: IFillingRecipeEntity): Result<IFillingRecipeEntity> {
  return validateFillingName(entity)
    .onSuccess(() => validateFillingCategory(entity))
    .onSuccess(() => validateFillingVariations(entity))
    .onSuccess(() => validateFillingIngredients(entity))
    .onSuccess(() => validateFillingRatings(entity))
    .onSuccess(() => Success.with(entity));
}
