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
 * Recipe scaling utilities
 * @packageDocumentation
 */

import { Result, fail, succeed } from '@fgv/ts-utils';

import { Grams, RecipeVersionId } from '../common';
import {
  IRecipe,
  IRecipeVersion,
  IRecipeIngredient,
  IScaledRecipeVersion,
  IScaledRecipeIngredient,
  IScalingSource
} from './model';

// ============================================================================
// Scaling Options
// ============================================================================

/**
 * Options for recipe scaling
 * @public
 */
export interface IRecipeScaleOptions {
  /**
   * Number of decimal places for scaled amounts (default: 1)
   */
  readonly precision?: number;

  /**
   * Minimum amount to show in scaled recipe (default: 0.1)
   * Amounts below this threshold will be rounded up to it
   */
  readonly minimumAmount?: Grams;

  /**
   * Recipe version to scale (default: golden version)
   */
  readonly versionId?: RecipeVersionId;
}

// ============================================================================
// Scaling Functions
// ============================================================================

/**
 * Scales a single recipe ingredient
 * @param ingredient - The ingredient to scale
 * @param scaleFactor - The scaling factor to apply
 * @param options - Scaling options
 * @returns Scaled ingredient with both original and scaled amounts
 * @internal
 */
function scaleIngredient(
  ingredient: IRecipeIngredient,
  scaleFactor: number,
  options: IRecipeScaleOptions
): IScaledRecipeIngredient {
  const precision = options.precision ?? 1;
  const minimumAmount = (options.minimumAmount ?? 0.1) as Grams;

  const rawScaledAmount = ingredient.amount * scaleFactor;
  const roundedAmount = Math.round(rawScaledAmount * Math.pow(10, precision)) / Math.pow(10, precision);
  const finalAmount = Math.max(roundedAmount, minimumAmount) as Grams;

  return {
    ingredientId: ingredient.ingredientId,
    amount: finalAmount,
    notes: ingredient.notes,
    originalAmount: ingredient.amount,
    scaleFactor
  };
}

/**
 * Scales a recipe to a target weight
 *
 * @param recipe - The recipe to scale
 * @param targetWeight - Target total weight in grams
 * @param options - Optional scaling options
 * @returns Success with scaled recipe version, or Failure if invalid
 * @public
 */
export function scaleRecipe(
  recipe: IRecipe,
  targetWeight: Grams,
  options: IRecipeScaleOptions = {}
): Result<IScaledRecipeVersion> {
  // Validate inputs
  if (targetWeight <= 0) {
    return fail('Target weight must be greater than zero');
  }

  // Get the version to scale (default to golden version)
  const versionId = options.versionId ?? recipe.goldenVersionId;
  const version = recipe.versions.find((v) => v.versionId === versionId);
  if (!version) {
    return fail(`Version ${versionId} not found in recipe ${recipe.baseId}`);
  }

  // Validate base weight
  if (version.baseWeight <= 0) {
    return fail('Recipe base weight must be greater than zero');
  }

  // Calculate scale factor
  const scaleFactor = targetWeight / version.baseWeight;

  // Scale all ingredients
  const scaledIngredients = version.ingredients.map((ingredient) =>
    scaleIngredient(ingredient, scaleFactor, options)
  );

  // Build scaling source metadata
  const scaledFrom: IScalingSource = {
    recipeId: recipe.baseId,
    versionId,
    scaleFactor,
    targetWeight
  };

  return succeed({
    scaledFrom,
    createdDate: new Date().toISOString().split('T')[0],
    ingredients: scaledIngredients,
    baseWeight: targetWeight,
    yield: version.yield,
    notes: version.notes,
    ratings: version.ratings
  });
}

/**
 * Scales a recipe by a multiplicative factor
 *
 * @param recipe - The recipe to scale
 * @param factor - Multiplicative factor (e.g., 2.0 for double, 0.5 for half)
 * @param options - Optional scaling options
 * @returns Success with scaled recipe version, or Failure if invalid
 * @public
 */
export function scaleRecipeByFactor(
  recipe: IRecipe,
  factor: number,
  options: IRecipeScaleOptions = {}
): Result<IScaledRecipeVersion> {
  if (factor <= 0) {
    return fail('Scale factor must be greater than zero');
  }

  // Get the version to scale (default to golden version)
  const versionId = options.versionId ?? recipe.goldenVersionId;
  const version = recipe.versions.find((v) => v.versionId === versionId);
  if (!version) {
    return fail(`Version ${versionId} not found in recipe ${recipe.baseId}`);
  }

  const targetWeight = (version.baseWeight * factor) as Grams;

  return scaleRecipe(recipe, targetWeight, options);
}

/**
 * Calculates the base weight from recipe version (sum of ingredient amounts)
 *
 * @param version - Recipe version to calculate weight for
 * @returns Total weight in grams
 * @public
 */
export function calculateBaseWeight(version: IRecipeVersion): Grams {
  const total = version.ingredients.reduce((sum: number, ingredient) => sum + ingredient.amount, 0);
  return total as Grams;
}

/**
 * Recalculates base weight for recipe version and returns updated version
 *
 * @param version - Recipe version to update
 * @returns New recipe version with recalculated base weight
 * @public
 */
export function recalculateRecipeVersion(version: IRecipeVersion): IRecipeVersion {
  return {
    ...version,
    baseWeight: calculateBaseWeight(version)
  };
}
