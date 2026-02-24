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
 * Decoration entity converters
 * @packageDocumentation
 */

import { Converter, Converters } from '@fgv/ts-utils';
import { Converters as CommonConverters } from '../../common';
import { Converters as FillingConverters } from '../fillings';
import {
  IDecorationEntity,
  IDecorationIngredientEntity,
  IDecorationRating,
  IDecorationRefEntity
} from './model';

// ============================================================================
// Ingredient Converter
// ============================================================================

/**
 * Converter for {@link Entities.Decorations.IDecorationIngredientEntity | IDecorationIngredientEntity}.
 * @public
 */
export const decorationIngredientEntity: Converter<IDecorationIngredientEntity> =
  Converters.strictObject<IDecorationIngredientEntity>({
    ingredient: CommonConverters.idsWithPreferred(CommonConverters.ingredientId, 'decorationIngredient'),
    amount: CommonConverters.measurement,
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

// ============================================================================
// Rating Converter
// ============================================================================

/**
 * Converter for {@link Entities.Decorations.IDecorationRating | IDecorationRating}.
 * @public
 */
export const decorationRating: Converter<IDecorationRating> = Converters.strictObject<IDecorationRating>({
  category: FillingConverters.ratingCategory,
  score: CommonConverters.ratingScore,
  notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
});

// ============================================================================
// Decoration Ref Converter
// ============================================================================

/**
 * Converter for {@link Entities.Decorations.IDecorationRefEntity | IDecorationRefEntity}.
 * @public
 */
export const decorationRefEntity: Converter<IDecorationRefEntity> = CommonConverters.refWithNotes(
  CommonConverters.decorationId
);

// ============================================================================
// Decoration Entity Converter
// ============================================================================

/**
 * Converter for {@link Entities.Decorations.IDecorationEntity | IDecorationEntity}.
 * @public
 */
export const decorationEntity: Converter<IDecorationEntity> = Converters.strictObject<IDecorationEntity>({
  baseId: CommonConverters.baseDecorationId,
  name: Converters.string,
  description: Converters.string.optional(),
  ingredients: Converters.arrayOf(decorationIngredientEntity),
  procedures: FillingConverters.procedureEntities.optional(),
  ratings: Converters.arrayOf(decorationRating).optional(),
  tags: Converters.arrayOf(Converters.string).optional(),
  notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
});
