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
 * Converters for filling recipe types.
 * @packageDocumentation
 */

import { Converter, Converters, Failure, Result, Success } from '@fgv/ts-utils';

import { Converters as CommonConverters, Model, ProcedureId } from '../../common';
import {
  allFillingCategories,
  allRatingCategories,
  FillingCategory,
  IFillingDerivationEntity,
  IFillingIngredientEntity,
  IFillingRating,
  IFillingRecipeEntity,
  IFillingRecipeVariationEntity,
  IIngredientModifiers,
  IIngredientSnapshotEntity,
  IProcedureRefEntity,
  IScalingRefEntity,
  RatingCategory
} from './model';

/**
 * Converter for {@link Entities.Fillings.IIngredientModifiers | IIngredientModifiers}.
 * @public
 */
export const ingredientModifiers: Converter<IIngredientModifiers> = Converters.object<IIngredientModifiers>({
  spoonLevel: CommonConverters.spoonLevel.optional(),
  toTaste: Converters.boolean.optional()
});

/**
 * Converter for {@link Entities.Fillings.IFillingIngredientEntity | IFillingIngredientEntity}.
 * Uses IIdsWithPreferred pattern for ingredient selection with validation.
 * @public
 */
export const fillingIngredientEntity: Converter<IFillingIngredientEntity> =
  Converters.object<IFillingIngredientEntity>({
    ingredient: CommonConverters.idsWithPreferred(CommonConverters.ingredientId, 'fillingIngredient'),
    amount: CommonConverters.measurement,
    unit: CommonConverters.measurementUnit.optional(),
    modifiers: ingredientModifiers.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

/**
 * Converter for {@link Entities.Fillings.RatingCategory | RatingCategory}.
 * @public
 */
export const ratingCategory: Converter<RatingCategory> = Converters.enumeratedValue(allRatingCategories);

/**
 * Converter for {@link Entities.Fillings.FillingCategory | FillingCategory}.
 * @public
 */
export const fillingCategory: Converter<FillingCategory> = Converters.enumeratedValue(allFillingCategories);

/**
 * Converter for {@link Entities.Fillings.IFillingRating | IFillingRating}
 * @public
 */
export const fillingRating: Converter<IFillingRating> = Converters.object<IFillingRating>({
  category: ratingCategory,
  score: CommonConverters.ratingScore,
  notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
});

/**
 * Converter for {@link Entities.Fillings.IFillingDerivationEntity | IFillingDerivationEntity}
 * @public
 */
export const fillingDerivationEntity: Converter<IFillingDerivationEntity> =
  Converters.object<IFillingDerivationEntity>({
    sourceVariationId: CommonConverters.fillingRecipeVariationId,
    derivedDate: Converters.string, // ISO 8601 date string
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

/**
 * Converter for {@link Entities.Fillings.IProcedureRefEntity | IProcedureRefEntity}
 * @public
 */
export const procedureRefEntity: Converter<IProcedureRefEntity> = CommonConverters.refWithNotes(
  CommonConverters.procedureId
);

/**
 * Converter for filling recipe procedures with preferred selection.
 * Validates that preferredId (if specified) exists in options.
 * @public
 */
export const procedureEntities: Converter<Model.IOptionsWithPreferred<IProcedureRefEntity, ProcedureId>> =
  CommonConverters.optionsWithPreferred(procedureRefEntity, CommonConverters.procedureId, 'procedures');

/**
 * Converter for {@link Entities.Fillings.IFillingRecipeVariationEntity | IFillingRecipeVariationEntity}.
 * @public
 */
export const fillingRecipeVariationEntity: Converter<IFillingRecipeVariationEntity> =
  Converters.object<IFillingRecipeVariationEntity>({
    variationSpec: CommonConverters.fillingRecipeVariationSpec,
    name: Converters.string.optional(),
    createdDate: Converters.string, // ISO 8601 date string
    ingredients: Converters.arrayOf(fillingIngredientEntity),
    baseWeight: CommonConverters.measurement,
    yield: Converters.string.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional(),
    ratings: Converters.arrayOf(fillingRating).optional(),
    procedures: procedureEntities.optional()
  });

/**
 * Converter for {@link Entities.Fillings.IFillingRecipeEntity | IFillingRecipeEntity} data structure
 * @public
 */
export const fillingRecipeRawEntity: Converter<IFillingRecipeEntity> =
  Converters.object<IFillingRecipeEntity>({
    baseId: CommonConverters.baseFillingId,
    name: CommonConverters.fillingName,
    category: fillingCategory,
    description: Converters.string.optional(),
    tags: Converters.arrayOf(Converters.string).optional(),
    variations: Converters.arrayOf(fillingRecipeVariationEntity),
    goldenVariationSpec: CommonConverters.fillingRecipeVariationSpec,
    derivedFrom: fillingDerivationEntity.optional(),
    urls: Converters.arrayOf(CommonConverters.categorizedUrl).optional()
  });

/**
 * Converter for {@link Entities.Fillings.IFillingRecipeEntity | IFillingRecipeEntity} with validation.
 * Validates that goldenVariationSpec exists in variations and returns the plain data object.
 * @public
 */
export const fillingRecipeEntity: Converter<IFillingRecipeEntity> = Converters.generic<IFillingRecipeEntity>(
  (from: unknown): Result<IFillingRecipeEntity> => {
    return fillingRecipeRawEntity.convert(from).onSuccess((data) => {
      if (data.variations.length === 0) {
        return Failure.with<IFillingRecipeEntity>('Filling recipe must have at least one variation');
      }

      // Validate that goldenVariationSpec exists in variations
      const goldenExists = data.variations.some((v) => v.variationSpec === data.goldenVariationSpec);
      if (!goldenExists) {
        return Failure.with(
          `Golden variation ${data.goldenVariationSpec} not found in variations for filling recipe ${data.baseId}`
        );
      }

      return Success.with(data);
    });
  }
);

/**
 * Converter for {@link Entities.Fillings.IScalingRefEntity | IScalingRefEntity} (lightweight reference-based format)
 * @public
 */
export const scalingRefEntity: Converter<IScalingRefEntity> = Converters.object<IScalingRefEntity>({
  sourceVariationId: CommonConverters.fillingRecipeVariationId,
  scaleFactor: Converters.number,
  targetWeight: CommonConverters.measurement,
  createdDate: Converters.string
});

/**
 * Converter for {@link Entities.Fillings.IIngredientSnapshotEntity | IIngredientSnapshotEntity} (for archival)
 * @public
 */
export const ingredientSnapshotEntity: Converter<IIngredientSnapshotEntity> =
  Converters.object<IIngredientSnapshotEntity>({
    ingredientId: CommonConverters.ingredientId,
    originalAmount: CommonConverters.measurement,
    scaledAmount: CommonConverters.measurement,
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });
