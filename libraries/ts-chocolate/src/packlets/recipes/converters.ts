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
 * Converters for recipe types
 * @packageDocumentation
 */

import { Converter, Converters, Failure, Result } from '@fgv/ts-utils';

import { Converters as CommonConverters } from '../common';
import {
  allRatingCategories,
  IRecipe,
  IRecipeIngredient,
  IRecipeUsage,
  IRecipeVersion,
  IScaledRecipeIngredient,
  IScaledRecipeVersion,
  IScalingSource,
  IVersionRating,
  RatingCategory
} from './model';
import { Recipe } from './recipe';

// ============================================================================
// Recipe Ingredient Converter
// ============================================================================

/**
 * Converter for IRecipeIngredient
 * @public
 */
export const recipeIngredient: Converter<IRecipeIngredient> = Converters.object<IRecipeIngredient>({
  ingredientId: CommonConverters.ingredientId,
  alternateIngredientIds: Converters.arrayOf(CommonConverters.ingredientId).optional(),
  amount: CommonConverters.grams,
  notes: Converters.string.optional()
});

// ============================================================================
// Version Rating Converter
// ============================================================================

/**
 * Converter for RatingCategory
 * @public
 */
export const ratingCategory: Converter<RatingCategory> = Converters.enumeratedValue(allRatingCategories);

/**
 * Converter for IVersionRating
 * @public
 */
export const versionRating: Converter<IVersionRating> = Converters.object<IVersionRating>({
  category: ratingCategory,
  score: CommonConverters.ratingScore,
  notes: Converters.string.optional()
});

// ============================================================================
// Recipe Usage Converter
// ============================================================================

/**
 * Converter for IRecipeUsage
 * @public
 */
export const recipeUsage: Converter<IRecipeUsage> = Converters.object<IRecipeUsage>({
  date: Converters.string, // ISO 8601 date string
  versionId: CommonConverters.recipeVersionId,
  scaledWeight: CommonConverters.grams,
  scaleFactor: Converters.number.optional(),
  notes: Converters.string.optional(),
  modifiedVersionId: CommonConverters.recipeVersionId.optional()
});

// ============================================================================
// Recipe Version Converter
// ============================================================================

/**
 * Converter for IRecipeVersion
 * @public
 */
export const recipeVersion: Converter<IRecipeVersion> = Converters.object<IRecipeVersion>({
  versionId: CommonConverters.recipeVersionId,
  createdDate: Converters.string, // ISO 8601 date string
  ingredients: Converters.arrayOf(recipeIngredient),
  baseWeight: CommonConverters.grams,
  yield: Converters.string.optional(),
  notes: Converters.string.optional(),
  ratings: Converters.arrayOf(versionRating).optional()
});

// ============================================================================
// Recipe Converter
// ============================================================================

/**
 * Converter for IRecipe data structure
 * @public
 */
export const recipeData: Converter<IRecipe> = Converters.object<IRecipe>({
  baseId: CommonConverters.baseRecipeId,
  name: CommonConverters.recipeName,
  description: Converters.string.optional(),
  tags: Converters.arrayOf(Converters.string).optional(),
  versions: Converters.arrayOf(recipeVersion),
  goldenVersionId: CommonConverters.recipeVersionId,
  usage: Converters.arrayOf(recipeUsage)
});

/**
 * Converter for Recipe
 * Validates that goldenVersionId exists in versions and creates Recipe instance
 * @public
 */
export const recipe: Converter<Recipe> = Converters.generic<Recipe>((from: unknown): Result<Recipe> => {
  return recipeData.convert(from).onSuccess((data) => {
    if (data.versions.length === 0) {
      return Failure.with('Recipe must have at least one version');
    }

    // Validate that goldenVersionId exists in versions
    const goldenExists = data.versions.some((v) => v.versionId === data.goldenVersionId);
    if (!goldenExists) {
      return Failure.with(
        `Golden version ${data.goldenVersionId} not found in versions for recipe ${data.baseId}`
      );
    }

    return Recipe.create(data);
  });
});

// ============================================================================
// Scaled Recipe Ingredient Converter
// ============================================================================

/**
 * Converter for IScaledRecipeIngredient
 * @public
 */
export const scaledRecipeIngredient: Converter<IScaledRecipeIngredient> =
  Converters.object<IScaledRecipeIngredient>({
    ingredientId: CommonConverters.ingredientId,
    alternateIngredientIds: Converters.arrayOf(CommonConverters.ingredientId).optional(),
    amount: CommonConverters.grams,
    notes: Converters.string.optional(),
    originalAmount: CommonConverters.grams,
    scaleFactor: Converters.number
  });

// ============================================================================
// Scaling Source Converter
// ============================================================================

/**
 * Converter for IScalingSource
 * @public
 */
export const scalingSource: Converter<IScalingSource> = Converters.object<IScalingSource>({
  recipeId: CommonConverters.baseRecipeId,
  versionId: CommonConverters.recipeVersionId,
  scaleFactor: Converters.number,
  targetWeight: CommonConverters.grams
});

// ============================================================================
// Scaled Recipe Version Converter
// ============================================================================

/**
 * Converter for IScaledRecipeVersion
 * @public
 */
export const scaledRecipeVersion: Converter<IScaledRecipeVersion> = Converters.object<IScaledRecipeVersion>({
  scaledFrom: scalingSource,
  createdDate: Converters.string,
  ingredients: Converters.arrayOf(scaledRecipeIngredient),
  baseWeight: CommonConverters.grams,
  yield: Converters.string.optional(),
  notes: Converters.string.optional(),
  ratings: Converters.arrayOf(versionRating).optional()
});

// ============================================================================
// Recipe Discriminated Union
// ============================================================================

/**
 * Converter for Recipe type (currently same as IRecipe, extensible)
 * @public
 */
export const recipeConverter: Converter<Recipe> = recipe;
