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

import { Failure, Result, Success } from '@fgv/ts-utils';

import { Helpers, Measurement, RecipeId, RecipeVersionId, RecipeVersionSpec } from '../common';
import {
  IComputedScaledRecipe,
  IRecipe,
  IRecipeVersion,
  IRecipeIngredient,
  IScaledRecipeIngredient,
  IScalingSource
} from './model';
// TODO: Integrate unit-aware scaling with scaleAmount from unitScaler
// import { IScaledAmount, scaleAmount } from './unitScaler';

// ============================================================================
// Scaling Options
// ============================================================================

/**
 * Options for version scaling (precision and minimum amount only)
 * @public
 */
export interface IVersionScaleOptions {
  /**
   * Number of decimal places for scaled amounts (default: 1)
   */
  readonly precision?: number;

  /**
   * Minimum amount to show in scaled recipe (default: 0.1)
   * Amounts below this threshold will be rounded up to it
   */
  readonly minimumAmount?: Measurement;
}

/**
 * Options for recipe scaling (extends version options with version selection)
 * @public
 */
export interface IRecipeScaleOptions extends IVersionScaleOptions {
  /**
   * Recipe version to scale (default: golden version)
   */
  readonly versionSpec?: RecipeVersionSpec;
}

// ============================================================================
// Scaling Functions
// ============================================================================

/**
 * Scales a single {@link Recipes.IRecipeIngredient | recipe ingredient}.
 * @param ingredient - The {@link Recipes.IRecipeIngredient | ingredient} to scale
 * @param scaleFactor - The scaling factor to apply
 * @param options - {@link Recipes.IVersionScaleOptions | Scaling options}
 * @returns Scaled ingredient with both original and scaled amounts
 * @internal
 */
function scaleIngredient(
  ingredient: IRecipeIngredient,
  scaleFactor: number,
  options: IVersionScaleOptions
): IScaledRecipeIngredient {
  const precision = options.precision ?? 1;
  const minimumAmount = (options.minimumAmount ?? 0.1) as Measurement;

  const rawScaledAmount = ingredient.amount * scaleFactor;
  const roundedAmount = Math.round(rawScaledAmount * Math.pow(10, precision)) / Math.pow(10, precision);
  const finalAmount = Math.max(roundedAmount, minimumAmount) as Measurement;

  return {
    ingredient: ingredient.ingredient,
    amount: finalAmount,
    notes: ingredient.notes,
    originalAmount: ingredient.amount,
    scaleFactor
  };
}

/**
 * Scales a recipe version to a target weight.
 *
 * This is the core scaling function that operates directly on a version.
 * Use this when you already have the version object and its ID.
 *
 * @param version - The {@link Recipes.IRecipeVersion | recipe version} to scale.
 * @param sourceVersionId - The full composite {@link RecipeVersionId | version ID}
 * @param targetWeight - Target total weight in grams
 * @param options - Optional {@link Recipes.IVersionScaleOptions | scaling options}
 * @returns `Success` with computed scaled recipe, or `Failure` if invalid.
 * @public
 */
export function scaleVersion(
  version: IRecipeVersion,
  sourceVersionId: RecipeVersionId,
  targetWeight: Measurement,
  options: IVersionScaleOptions = {}
): Result<IComputedScaledRecipe> {
  // Validate inputs
  if (targetWeight <= 0) {
    return Failure.with('Target weight must be greater than zero');
  }

  if (version.baseWeight <= 0) {
    return Failure.with('Version base weight must be greater than zero');
  }

  // Calculate scale factor
  const scaleFactor = targetWeight / version.baseWeight;

  // Scale all ingredients
  const scaledIngredients = version.ingredients.map((ingredient) =>
    scaleIngredient(ingredient, scaleFactor, options)
  );

  // Build scaling source metadata
  const scaledFrom: IScalingSource = {
    sourceVersionId,
    scaleFactor,
    targetWeight
  };

  return Success.with({
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
 * Scales a recipe to a target weight.
 *
 * This function looks up a version by spec and delegates to {@link Recipes.scaleVersion | scaleVersion}.
 * Use this when you have a recipe and want to scale a specific version by spec.
 *
 * @param recipe - The {@link Recipes.IRecipe | recipe} to scale.
 * @param recipeId - The full composite {@link RecipeId | recipe ID}
 * @param targetWeight - Target total weight in grams
 * @param options - Optional {@link Recipes.IRecipeScaleOptions | scaling options}
 * @returns `Success` with computed scaled recipe, or `Failure` if invalid.
 * @public
 */
export function scaleRecipe(
  recipe: IRecipe,
  recipeId: RecipeId,
  targetWeight: Measurement,
  options: IRecipeScaleOptions = {}
): Result<IComputedScaledRecipe> {
  // Get the version to scale (default to golden version)
  const versionSpec = options.versionSpec ?? recipe.goldenVersionSpec;
  const version = recipe.versions.find((v) => v.versionSpec === versionSpec);
  if (!version) {
    return Failure.with(`Version ${versionSpec} not found in recipe ${recipe.baseId}`);
  }

  const versionId = Helpers.createRecipeVersionId(recipeId, versionSpec);
  return scaleVersion(version, versionId, targetWeight, options);
}

/**
 * Scales a {@link Recipes.IRecipe | recipe} by a supplied multiplier.
 *
 * @param recipe - The {@link Recipes.IRecipe | recipe} to scale.
 * @param recipeId - The full composite {@link RecipeId | recipe ID}.
 * @param factor - Multiplicative factor (e.g., 2.0 for double, 0.5 for half).
 * @param options - Optional {@link Recipes.IRecipeScaleOptions | scaling options}.
 * @returns `Success` with computed scaled recipe, or `Failure` if invalid.
 * @public
 */
export function scaleRecipeByFactor(
  recipe: IRecipe,
  recipeId: RecipeId,
  factor: number,
  options: IRecipeScaleOptions = {}
): Result<IComputedScaledRecipe> {
  if (factor <= 0) {
    return Failure.with('Scale factor must be greater than zero');
  }

  // Get the version to scale (default to golden version)
  const versionSpec = options.versionSpec ?? recipe.goldenVersionSpec;
  const version = recipe.versions.find((v) => v.versionSpec === versionSpec);
  if (!version) {
    return Failure.with(`Version ${versionSpec} not found in recipe ${recipe.baseId}`);
  }

  const targetWeight = (version.baseWeight * factor) as Measurement;

  return scaleRecipe(recipe, recipeId, targetWeight, options);
}

/**
 * Calculates the base weight from recipe version (sum of ingredient amounts)
 *
 * @param version - Recipe version to calculate weight for
 * @returns Total weight in grams
 * @public
 */
export function calculateBaseWeight(version: IRecipeVersion): Measurement {
  const total = version.ingredients.reduce((sum: number, ingredient) => sum + ingredient.amount, 0);
  return total as Measurement;
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
