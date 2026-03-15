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
 * Semantic validators for decoration entities.
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import { Decorations } from '../../entities';

const { allDecorationRatingCategories } = Decorations;

type IDecorationEntity = Decorations.IDecorationEntity;

/**
 * Validate that the decoration name is non-empty.
 * @param entity - Decoration entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateDecorationName(entity: IDecorationEntity): Result<true> {
  if (entity.name.trim().length === 0) {
    return Failure.with('decoration name must not be empty');
  }
  return Success.with(true);
}

/**
 * Validate that each ingredient has at least one ID and a positive amount.
 * @param entity - Decoration entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateDecorationIngredients(entity: IDecorationEntity): Result<true> {
  for (const ingredient of entity.ingredients) {
    if (ingredient.ingredient.ids.length === 0) {
      return Failure.with('ingredient must have at least one ID');
    }
    if (ingredient.amount <= 0) {
      return Failure.with('ingredient amount must be positive');
    }
  }
  return Success.with(true);
}

/**
 * Validate that ratings have valid scores (1-5), categories, and no duplicates.
 * @param entity - Decoration entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateDecorationRatings(entity: IDecorationEntity): Result<true> {
  if (!entity.ratings) {
    return Success.with(true);
  }

  const seenCategories = new Set<string>();

  for (const rating of entity.ratings) {
    if (rating.score < 1 || rating.score > 5) {
      return Failure.with(`rating score must be between 1 and 5 (got ${rating.score})`);
    }

    if (!allDecorationRatingCategories.includes(rating.category)) {
      return Failure.with(
        `rating category '${
          rating.category
        }' is not valid (must be one of: ${allDecorationRatingCategories.join(', ')})`
      );
    }

    if (seenCategories.has(rating.category)) {
      return Failure.with(`duplicate rating category: ${rating.category}`);
    }
    seenCategories.add(rating.category);
  }

  return Success.with(true);
}

/**
 * Validate entity-level constraints that span multiple fields.
 * @param entity - Complete decoration entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateDecorationEntity(entity: IDecorationEntity): Result<IDecorationEntity> {
  return validateDecorationName(entity)
    .onSuccess(() => validateDecorationIngredients(entity))
    .onSuccess(() => validateDecorationRatings(entity))
    .onSuccess(() => Success.with(entity));
}
