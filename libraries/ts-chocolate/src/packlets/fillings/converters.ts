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

import { Converter, Converters, Failure, Result } from '@fgv/ts-utils';

import { Converters as CommonConverters, IOptionsWithPreferred, ProcedureId } from '../common';
import {
  allFillingCategories,
  allRatingCategories,
  FillingCategory,
  IFillingDerivation,
  IFillingIngredient,
  IFillingRating,
  IFillingRecipe,
  IFillingRecipeVersion,
  IIngredientModifiers,
  IIngredientSnapshot,
  IProcedureRef,
  IScaledFillingIngredient,
  IScaledFillingRecipeVersion,
  IScalingRef,
  IScalingSource,
  RatingCategory
} from './model';
import { FillingRecipe } from './fillingRecipe';

/**
 * Converter for {@link Fillings.IIngredientModifiers | IIngredientModifiers}.
 * @public
 */
export const ingredientModifiers: Converter<IIngredientModifiers> = Converters.object<IIngredientModifiers>({
  spoonLevel: CommonConverters.spoonLevel.optional(),
  toTaste: Converters.boolean.optional()
});

/**
 * Converter for {@link Fillings.IFillingIngredient | IFillingIngredient}.
 * Uses IIdsWithPreferred pattern for ingredient selection with validation.
 * @public
 */
export const fillingIngredient: Converter<IFillingIngredient> = Converters.object<IFillingIngredient>({
  ingredient: CommonConverters.idsWithPreferred(CommonConverters.ingredientId, 'fillingIngredient'),
  amount: CommonConverters.measurement,
  unit: CommonConverters.measurementUnit.optional(),
  modifiers: ingredientModifiers.optional(),
  notes: Converters.string.optional()
});

/**
 * Converter for {@link Fillings.RatingCategory | RatingCategory}.
 * @public
 */
export const ratingCategory: Converter<RatingCategory> = Converters.enumeratedValue(allRatingCategories);

/**
 * Converter for {@link Fillings.FillingCategory | FillingCategory}.
 * @public
 */
export const fillingCategory: Converter<FillingCategory> = Converters.enumeratedValue(allFillingCategories);

/**
 * Converter for {@link Fillings.IFillingRating | IFillingRating}
 * @public
 */
export const fillingRating: Converter<IFillingRating> = Converters.object<IFillingRating>({
  category: ratingCategory,
  score: CommonConverters.ratingScore,
  notes: Converters.string.optional()
});

/**
 * Converter for {@link Fillings.IFillingDerivation | IFillingDerivation}
 * @public
 */
export const fillingDerivation: Converter<IFillingDerivation> = Converters.object<IFillingDerivation>({
  sourceVersionId: CommonConverters.fillingVersionId,
  derivedDate: Converters.string, // ISO 8601 date string
  notes: Converters.string.optional()
});

/**
 * Converter for {@link Fillings.IProcedureRef | IProcedureRef}
 * @public
 */
export const procedureRef: Converter<IProcedureRef> = CommonConverters.refWithNotes(
  CommonConverters.procedureId
);

/**
 * Converter for filling recipe procedures with preferred selection.
 * Validates that preferredId (if specified) exists in options.
 * @public
 */
export const procedures: Converter<IOptionsWithPreferred<IProcedureRef, ProcedureId>> =
  CommonConverters.optionsWithPreferred(procedureRef, CommonConverters.procedureId, 'procedures');

/**
 * Converter for {@link Fillings.IFillingRecipeVersion | IFillingRecipeVersion}.
 * @public
 */
export const fillingRecipeVersion: Converter<IFillingRecipeVersion> =
  Converters.object<IFillingRecipeVersion>({
    versionSpec: CommonConverters.fillingVersionSpec,
    createdDate: Converters.string, // ISO 8601 date string
    ingredients: Converters.arrayOf(fillingIngredient),
    baseWeight: CommonConverters.measurement,
    yield: Converters.string.optional(),
    notes: Converters.string.optional(),
    ratings: Converters.arrayOf(fillingRating).optional(),
    procedures: procedures.optional()
  });

/**
 * Converter for {@link Fillings.IFillingRecipe | IFillingRecipe} data structure
 * @public
 */
export const fillingRecipeData: Converter<IFillingRecipe> = Converters.object<IFillingRecipe>({
  baseId: CommonConverters.baseFillingId,
  name: CommonConverters.fillingName,
  category: fillingCategory,
  description: Converters.string.optional(),
  tags: Converters.arrayOf(Converters.string).optional(),
  versions: Converters.arrayOf(fillingRecipeVersion),
  goldenVersionSpec: CommonConverters.fillingVersionSpec,
  derivedFrom: fillingDerivation.optional(),
  urls: Converters.arrayOf(CommonConverters.categorizedUrl).optional()
});

/**
 * Converter for {@link Fillings.FillingRecipe | FillingRecipe}
 * Validates that goldenVersionSpec exists in versions and creates FillingRecipe instance
 * @public
 */
export const fillingRecipe: Converter<FillingRecipe> = Converters.generic<FillingRecipe>(
  (from: unknown): Result<FillingRecipe> => {
    return fillingRecipeData.convert(from).onSuccess((data) => {
      if (data.versions.length === 0) {
        return Failure.with('Filling recipe must have at least one version');
      }

      // Validate that goldenVersionSpec exists in versions
      const goldenExists = data.versions.some((v) => v.versionSpec === data.goldenVersionSpec);
      if (!goldenExists) {
        return Failure.with(
          `Golden version ${data.goldenVersionSpec} not found in versions for filling recipe ${data.baseId}`
        );
      }

      return FillingRecipe.create(data);
    });
  }
);

/**
 * Converter for {@link Fillings.IScaledFillingIngredient | IScaledFillingIngredient}.
 * Uses IIdsWithPreferred pattern for ingredient selection with validation.
 * @public
 */
export const scaledFillingIngredient: Converter<IScaledFillingIngredient> =
  Converters.object<IScaledFillingIngredient>({
    ingredient: CommonConverters.idsWithPreferred(CommonConverters.ingredientId, 'scaledFillingIngredient'),
    amount: CommonConverters.measurement,
    unit: CommonConverters.measurementUnit.optional(),
    modifiers: ingredientModifiers.optional(),
    notes: Converters.string.optional(),
    originalAmount: CommonConverters.measurement,
    scaleFactor: Converters.number
  });

/**
 * Converter for {@link Fillings.IScalingRef | IScalingRef} (lightweight reference-based format)
 * @public
 */
export const scalingRef: Converter<IScalingRef> = Converters.object<IScalingRef>({
  sourceVersionId: CommonConverters.fillingVersionId,
  scaleFactor: Converters.number,
  targetWeight: CommonConverters.measurement,
  createdDate: Converters.string
});

/**
 * Converter for {@link Fillings.IIngredientSnapshot | IIngredientSnapshot} (for archival)
 * @public
 */
export const ingredientSnapshot: Converter<IIngredientSnapshot> = Converters.object<IIngredientSnapshot>({
  ingredientId: CommonConverters.ingredientId,
  originalAmount: CommonConverters.measurement,
  scaledAmount: CommonConverters.measurement,
  notes: Converters.string.optional()
});

/**
 * Converter for {@link Fillings.IScaledFillingRecipeVersion | IScaledFillingRecipeVersion} (reference-based)
 * @public
 */
export const scaledFillingRecipeVersion: Converter<IScaledFillingRecipeVersion> =
  Converters.object<IScaledFillingRecipeVersion>({
    scalingRef: scalingRef,
    snapshotIngredients: Converters.arrayOf(ingredientSnapshot).optional(),
    notes: Converters.string.optional()
  });

/**
 * Converter for {@link Fillings.IScalingSource | IScalingSource} (runtime format with full ingredient data)
 * @public
 */
export const scalingSource: Converter<IScalingSource> = Converters.object<IScalingSource>({
  sourceVersionId: CommonConverters.fillingVersionId,
  scaleFactor: Converters.number,
  targetWeight: CommonConverters.measurement
});

/**
 * Converter for {@link Fillings.FillingRecipe | FillingRecipe} type (currently same as IFillingRecipe, extensible)
 * @public
 */
export const fillingRecipeConverter: Converter<FillingRecipe> = fillingRecipe;
