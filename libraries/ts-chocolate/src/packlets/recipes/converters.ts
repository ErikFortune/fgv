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
 * Converters for recipe types.
 * @packageDocumentation
 */

import { Converter, Converters, Failure, Result } from '@fgv/ts-utils';

import { Converters as CommonConverters, IOptionsWithPreferred, MoldId, ProcedureId } from '../common';
import {
  allRatingCategories,
  allRecipeCategories,
  IIngredientSnapshot,
  IRecipe,
  IRecipeDerivation,
  IRecipeIngredient,
  IRecipeMoldRef,
  IRecipeProcedureRef,
  IRecipeVersion,
  IScaledRecipeIngredient,
  IScaledRecipeVersion,
  IScalingRef,
  IScalingSource,
  IRecipeRating,
  RatingCategory,
  RecipeCategory
} from './model';
import { Recipe } from './recipe';

/**
 * Converter for {@link Recipes.IRecipeIngredient | IRecipeIngredient}.
 * Uses IIdsWithPreferred pattern for ingredient selection with validation.
 * @public
 */
export const recipeIngredient: Converter<IRecipeIngredient> = Converters.object<IRecipeIngredient>({
  ingredient: CommonConverters.idsWithPreferred(CommonConverters.ingredientId, 'recipeIngredient'),
  amount: CommonConverters.grams,
  notes: Converters.string.optional()
});

/**
 * Converter for {@link Recipes.RatingCategory | RatingCategory}.
 * @public
 */
export const ratingCategory: Converter<RatingCategory> = Converters.enumeratedValue(allRatingCategories);

/**
 * Converter for {@link Recipes.RecipeCategory | RecipeCategory}.
 * @public
 */
export const recipeCategory: Converter<RecipeCategory> = Converters.enumeratedValue(allRecipeCategories);

/**
 * Converter for {@link Recipes.IRecipeRating | IRecipeRating}
 * @public
 */
export const recipeRating: Converter<IRecipeRating> = Converters.object<IRecipeRating>({
  category: ratingCategory,
  score: CommonConverters.ratingScore,
  notes: Converters.string.optional()
});

/**
 * Converter for {@link Recipes.IRecipeDerivation | IRecipeDerivation}
 * @public
 */
export const recipeDerivation: Converter<IRecipeDerivation> = Converters.object<IRecipeDerivation>({
  sourceVersionId: CommonConverters.recipeVersionId,
  derivedDate: Converters.string, // ISO 8601 date string
  notes: Converters.string.optional()
});

/**
 * Converter for {@link Recipes.IRecipeProcedureRef | IRecipeProcedureRef}
 * @public
 */
export const recipeProcedureRef: Converter<IRecipeProcedureRef> = CommonConverters.refWithNotes(
  CommonConverters.procedureId
);

/**
 * Converter for recipe procedures with preferred selection.
 * Validates that preferredId (if specified) exists in options.
 * @public
 */
export const recipeProcedures: Converter<IOptionsWithPreferred<IRecipeProcedureRef, ProcedureId>> =
  CommonConverters.optionsWithPreferred(recipeProcedureRef, CommonConverters.procedureId, 'recipeProcedures');

/**
 * Converter for {@link Recipes.IRecipeMoldRef | IRecipeMoldRef}
 * @public
 */
export const recipeMoldRef: Converter<IRecipeMoldRef> = CommonConverters.refWithNotes(
  CommonConverters.moldId
);

/**
 * Converter for recipe molds with preferred selection.
 * Validates that preferredId (if specified) exists in options.
 * @public
 */
export const recipeMolds: Converter<IOptionsWithPreferred<IRecipeMoldRef, MoldId>> =
  CommonConverters.optionsWithPreferred(recipeMoldRef, CommonConverters.moldId, 'recipeMolds');

/**
 * Converter for {@link Recipes.IRecipeVersion | IRecipeVersion}.
 * @public
 */
export const recipeVersion: Converter<IRecipeVersion> = Converters.object<IRecipeVersion>({
  versionSpec: CommonConverters.recipeVersionSpec,
  createdDate: Converters.string, // ISO 8601 date string
  ingredients: Converters.arrayOf(recipeIngredient),
  baseWeight: CommonConverters.grams,
  yield: Converters.string.optional(),
  notes: Converters.string.optional(),
  ratings: Converters.arrayOf(recipeRating).optional()
});

/**
 * Converter for {@link Recipes.IRecipe | IRecipe} data structure
 * @public
 */
export const recipeData: Converter<IRecipe> = Converters.object<IRecipe>({
  baseId: CommonConverters.baseRecipeId,
  name: CommonConverters.recipeName,
  category: recipeCategory,
  description: Converters.string.optional(),
  tags: Converters.arrayOf(Converters.string).optional(),
  versions: Converters.arrayOf(recipeVersion),
  goldenVersionSpec: CommonConverters.recipeVersionSpec,
  derivedFrom: recipeDerivation.optional(),
  recipeProcedures: recipeProcedures.optional(),
  recipeMolds: recipeMolds.optional()
});

/**
 * Converter for {@link Recipes.Recipe | Recipe}
 * Validates that goldenVersionSpec exists in versions and creates Recipe instance
 * @public
 */
export const recipe: Converter<Recipe> = Converters.generic<Recipe>((from: unknown): Result<Recipe> => {
  return recipeData.convert(from).onSuccess((data) => {
    if (data.versions.length === 0) {
      return Failure.with('Recipe must have at least one version');
    }

    // Validate that goldenVersionSpec exists in versions
    const goldenExists = data.versions.some((v) => v.versionSpec === data.goldenVersionSpec);
    if (!goldenExists) {
      return Failure.with(
        `Golden version ${data.goldenVersionSpec} not found in versions for recipe ${data.baseId}`
      );
    }

    return Recipe.create(data);
  });
});

/**
 * Converter for {@link Recipes.IScaledRecipeIngredient | IScaledRecipeIngredient}.
 * Uses IIdsWithPreferred pattern for ingredient selection with validation.
 * @public
 */
export const scaledRecipeIngredient: Converter<IScaledRecipeIngredient> =
  Converters.object<IScaledRecipeIngredient>({
    ingredient: CommonConverters.idsWithPreferred(CommonConverters.ingredientId, 'scaledRecipeIngredient'),
    amount: CommonConverters.grams,
    notes: Converters.string.optional(),
    originalAmount: CommonConverters.grams,
    scaleFactor: Converters.number
  });

/**
 * Converter for {@link Recipes.IScalingRef | IScalingRef} (lightweight reference-based format)
 * @public
 */
export const scalingRef: Converter<IScalingRef> = Converters.object<IScalingRef>({
  sourceVersionId: CommonConverters.recipeVersionId,
  scaleFactor: Converters.number,
  targetWeight: CommonConverters.grams,
  createdDate: Converters.string
});

/**
 * Converter for {@link Recipes.IIngredientSnapshot | IIngredientSnapshot} (for archival)
 * @public
 */
export const ingredientSnapshot: Converter<IIngredientSnapshot> = Converters.object<IIngredientSnapshot>({
  ingredientId: CommonConverters.ingredientId,
  originalAmount: CommonConverters.grams,
  scaledAmount: CommonConverters.grams,
  notes: Converters.string.optional()
});

/**
 * Converter for {@link Recipes.IScaledRecipeVersion | IScaledRecipeVersion} (reference-based)
 * @public
 */
export const scaledRecipeVersion: Converter<IScaledRecipeVersion> = Converters.object<IScaledRecipeVersion>({
  scalingRef: scalingRef,
  snapshotIngredients: Converters.arrayOf(ingredientSnapshot).optional(),
  notes: Converters.string.optional()
});

/**
 * Converter for {@link Recipes.IScalingSource | IScalingSource} (runtime format with full ingredient data)
 * @public
 */
export const scalingSource: Converter<IScalingSource> = Converters.object<IScalingSource>({
  sourceVersionId: CommonConverters.recipeVersionId,
  scaleFactor: Converters.number,
  targetWeight: CommonConverters.grams
});

/**
 * Converter for {@link Recipes.Recipe | Recipe} type (currently same as IRecipe, extensible)
 * @public
 */
export const recipeConverter: Converter<Recipe> = recipe;
