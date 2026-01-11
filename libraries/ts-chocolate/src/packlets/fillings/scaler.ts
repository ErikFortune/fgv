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
 * Filling recipe scaling utilities
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import {
  FillingId,
  FillingVersionId,
  FillingVersionSpec,
  Helpers,
  Measurement,
  MeasurementUnit
} from '../common';
import {
  IComputedScaledFillingRecipe,
  IFillingIngredient,
  IFillingRecipe,
  IFillingRecipeVersion,
  IScaledFillingIngredient,
  IScalingSource
} from './model';
import { IScaledAmount, scaleAmount } from './unitScaler';

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
   * Minimum amount to show in scaled filling recipe (default: 0.1)
   * Amounts below this threshold will be rounded up to it
   */
  readonly minimumAmount?: Measurement;
}

/**
 * Options for filling recipe scaling (extends version options with version selection)
 * @public
 */
export interface IFillingRecipeScaleOptions extends IVersionScaleOptions {
  /**
   * Filling recipe version to scale (default: golden version)
   */
  readonly versionSpec?: FillingVersionSpec;
}

// ============================================================================
// Scaling Functions
// ============================================================================

/**
 * Result of scaling a single ingredient, including unit-aware display.
 * @internal
 */
interface IScaleIngredientResult {
  readonly scaled: IScaledFillingIngredient;
  readonly scaledAmount: IScaledAmount;
}

/**
 * Scales a single {@link Fillings.IFillingIngredient | filling recipe ingredient}.
 * Uses unit-aware scaling for proper display formatting.
 * @param ingredient - The {@link Fillings.IFillingIngredient | ingredient} to scale
 * @param scaleFactor - The scaling factor to apply
 * @param options - {@link Fillings.IVersionScaleOptions | Scaling options}
 * @returns Scaled ingredient with both original and scaled amounts, plus display info
 * @internal
 */
function scaleIngredient(
  ingredient: IFillingIngredient,
  scaleFactor: number,
  options: IVersionScaleOptions
): IScaleIngredientResult {
  const unit: MeasurementUnit = ingredient.unit ?? 'g';
  const minimumAmount = (options.minimumAmount ?? 0.1) as Measurement;

  // Use unit-aware scaling for proper display formatting
  const scaleResult = scaleAmount(ingredient.amount, unit, scaleFactor);

  // Get the scaled amount - use unit scaler result if successful, otherwise fall back
  let scaledAmount: IScaledAmount;
  /* c8 ignore next 15 - defensive else branch: scaleAmount only fails for invalid units which can't occur with typed MeasurementUnit */
  if (scaleResult.isSuccess()) {
    scaledAmount = scaleResult.value;
  } else {
    // Fallback for edge cases (e.g., negative scale factor - shouldn't happen)
    const rawScaledAmount = ingredient.amount * scaleFactor;
    const precision = options.precision ?? 1;
    const roundedAmount = Math.round(rawScaledAmount * Math.pow(10, precision)) / Math.pow(10, precision);
    const finalAmount = Math.max(roundedAmount, minimumAmount) as Measurement;
    scaledAmount = {
      value: finalAmount,
      unit,
      displayValue: `${finalAmount}${unit === 'g' ? 'g' : ' ' + unit}`,
      scalable: unit !== 'pinch'
    };
  }

  // Ensure minimum amount is respected
  const finalValue = Math.max(scaledAmount.value, minimumAmount) as Measurement;

  return {
    scaled: {
      ingredient: ingredient.ingredient,
      amount: finalValue,
      unit: ingredient.unit,
      modifiers: ingredient.modifiers,
      notes: ingredient.notes,
      originalAmount: ingredient.amount,
      scaleFactor
    },
    scaledAmount: {
      ...scaledAmount,
      value: finalValue
    }
  };
}

/**
 * Scales a filling recipe version to a target weight.
 *
 * This is the core scaling function that operates directly on a version.
 * Use this when you already have the version object and its ID.
 *
 * @param version - The {@link Fillings.IFillingRecipeVersion | filling recipe version} to scale.
 * @param sourceVersionId - The full composite {@link FillingVersionId | version ID}
 * @param targetWeight - Target total weight in grams
 * @param options - Optional {@link Fillings.IVersionScaleOptions | scaling options}
 * @returns `Success` with computed scaled filling recipe, or `Failure` if invalid.
 * @public
 */
export function scaleVersion(
  version: IFillingRecipeVersion,
  sourceVersionId: FillingVersionId,
  targetWeight: Measurement,
  options: IVersionScaleOptions = {}
): Result<IComputedScaledFillingRecipe> {
  // Validate inputs
  if (targetWeight <= 0) {
    return Failure.with('Target weight must be greater than zero');
  }

  if (version.baseWeight <= 0) {
    return Failure.with('Version base weight must be greater than zero');
  }

  // Calculate scale factor
  const scaleFactor = targetWeight / version.baseWeight;

  // Scale all ingredients (extract just the scaled ingredient, not the display info)
  const scaledIngredients = version.ingredients.map(
    (ingredient) => scaleIngredient(ingredient, scaleFactor, options).scaled
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
 * Scales a filling recipe to a target weight.
 *
 * This function looks up a version by spec and delegates to {@link Fillings.scaleVersion | scaleVersion}.
 * Use this when you have a filling recipe and want to scale a specific version by spec.
 *
 * @param fillingRecipe - The {@link Fillings.IFillingRecipe | filling recipe} to scale.
 * @param fillingId - The full composite {@link FillingId | filling ID}
 * @param targetWeight - Target total weight in grams
 * @param options - Optional {@link Fillings.IFillingRecipeScaleOptions | scaling options}
 * @returns `Success` with computed scaled filling recipe, or `Failure` if invalid.
 * @public
 */
export function scaleFillingRecipe(
  fillingRecipe: IFillingRecipe,
  fillingId: FillingId,
  targetWeight: Measurement,
  options: IFillingRecipeScaleOptions = {}
): Result<IComputedScaledFillingRecipe> {
  // Get the version to scale (default to golden version)
  const versionSpec = options.versionSpec ?? fillingRecipe.goldenVersionSpec;
  const version = fillingRecipe.versions.find((v) => v.versionSpec === versionSpec);
  if (!version) {
    return Failure.with(`Version ${versionSpec} not found in filling recipe ${fillingRecipe.baseId}`);
  }

  const versionId = Helpers.createFillingVersionId(fillingId, versionSpec);
  return scaleVersion(version, versionId, targetWeight, options);
}

/**
 * Scales a {@link Fillings.IFillingRecipe | filling recipe} by a supplied multiplier.
 *
 * @param fillingRecipe - The {@link Fillings.IFillingRecipe | filling recipe} to scale.
 * @param fillingId - The full composite {@link FillingId | filling ID}.
 * @param factor - Multiplicative factor (e.g., 2.0 for double, 0.5 for half).
 * @param options - Optional {@link Fillings.IFillingRecipeScaleOptions | scaling options}.
 * @returns `Success` with computed scaled filling recipe, or `Failure` if invalid.
 * @public
 */
export function scaleFillingRecipeByFactor(
  fillingRecipe: IFillingRecipe,
  fillingId: FillingId,
  factor: number,
  options: IFillingRecipeScaleOptions = {}
): Result<IComputedScaledFillingRecipe> {
  if (factor <= 0) {
    return Failure.with('Scale factor must be greater than zero');
  }

  // Get the version to scale (default to golden version)
  const versionSpec = options.versionSpec ?? fillingRecipe.goldenVersionSpec;
  const version = fillingRecipe.versions.find((v) => v.versionSpec === versionSpec);
  if (!version) {
    return Failure.with(`Version ${versionSpec} not found in filling recipe ${fillingRecipe.baseId}`);
  }

  const targetWeight = (version.baseWeight * factor) as Measurement;

  return scaleFillingRecipe(fillingRecipe, fillingId, targetWeight, options);
}

/**
 * Calculates the base weight from filling recipe version (sum of ingredient amounts)
 *
 * @param version - Filling recipe version to calculate weight for
 * @returns Total weight in grams
 * @public
 */
export function calculateBaseWeight(version: IFillingRecipeVersion): Measurement {
  const total = version.ingredients.reduce((sum: number, ingredient) => sum + ingredient.amount, 0);
  return total as Measurement;
}

/**
 * Recalculates base weight for filling recipe version and returns updated version
 *
 * @param version - Filling recipe version to update
 * @returns New filling recipe version with recalculated base weight
 * @public
 */
export function recalculateFillingRecipeVersion(version: IFillingRecipeVersion): IFillingRecipeVersion {
  return {
    ...version,
    baseWeight: calculateBaseWeight(version)
  };
}
