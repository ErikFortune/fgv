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

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';

import { Converters as CommonConverters } from '../common';
import {
  IRecipe,
  IRecipeDetails,
  IRecipeIngredient,
  IRecipeUsage,
  IScaledRecipeIngredient,
  Recipe
} from './model';

// ============================================================================
// Recipe Ingredient Converter
// ============================================================================

/**
 * Converter for IRecipeIngredient
 * @public
 */
export const recipeIngredient: Converter<IRecipeIngredient> = Converters.object<IRecipeIngredient>({
  ingredientId: CommonConverters.ingredientId,
  amount: CommonConverters.grams,
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
  scaledWeight: CommonConverters.grams,
  notes: Converters.string.optional()
});

// ============================================================================
// Recipe Details Converter
// ============================================================================

/**
 * Converter for IRecipeDetails
 * @public
 */
export const recipeDetails: Converter<IRecipeDetails> = Converters.object<IRecipeDetails>({
  ingredients: Converters.arrayOf(recipeIngredient),
  baseWeight: CommonConverters.grams,
  yield: Converters.string.optional(),
  versionNotes: Converters.string.optional(),
  usage: Converters.arrayOf(recipeUsage)
});

// ============================================================================
// Recipe Converter
// ============================================================================

/**
 * Internal converter for recipe data without currentVersion accessor
 * @internal
 */
interface IRecipeData {
  readonly baseId: unknown;
  readonly name: unknown;
  readonly description?: string;
  readonly tags?: ReadonlyArray<string>;
  readonly versions: ReadonlyArray<IRecipeDetails>;
}

const recipeData: Converter<IRecipeData> = Converters.object<IRecipeData>({
  baseId: CommonConverters.baseRecipeId,
  name: CommonConverters.recipeName,
  description: Converters.string.optional(),
  tags: Converters.arrayOf(Converters.string).optional(),
  versions: Converters.arrayOf(recipeDetails)
});

/**
 * Converter for IRecipe
 * Adds currentVersion as computed accessor from versions array
 * @public
 */
export const recipe: Converter<IRecipe> = Converters.generic<IRecipe>((from: unknown): Result<IRecipe> => {
  return recipeData.convert(from).onSuccess((data) => {
    if (data.versions.length === 0) {
      return fail('Recipe must have at least one version');
    }

    // Create the full recipe with currentVersion accessor
    const fullRecipe: IRecipe = {
      baseId: data.baseId,
      name: data.name,
      description: data.description,
      tags: data.tags,
      versions: data.versions,
      // Current version is the first (most recent) version
      currentVersion: data.versions[0]
    } as IRecipe;

    return succeed(fullRecipe);
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
    amount: CommonConverters.grams,
    notes: Converters.string.optional(),
    originalAmount: CommonConverters.grams,
    scaleFactor: Converters.number
  });

// ============================================================================
// Recipe Discriminated Union
// ============================================================================

/**
 * Converter for Recipe type (currently same as IRecipe, extensible)
 * @public
 */
export const recipeConverter: Converter<Recipe> = recipe;
