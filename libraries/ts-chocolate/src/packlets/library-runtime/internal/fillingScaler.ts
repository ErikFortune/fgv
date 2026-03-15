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

import { FillingRecipeVariationSpec, Measurement } from '../../common';
import { IFillingRecipeVariationEntity } from '../../entities';

// ============================================================================
// Scaling Options
// ============================================================================

/**
 * Options for variation scaling (precision and minimum amount only)
 * @public
 */
export interface IVariationScaleOptions {
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
 * Options for filling recipe scaling (extends variation options with variation selection)
 * @public
 */
export interface IFillingRecipeScaleOptions extends IVariationScaleOptions {
  /**
   * Filling recipe variation to scale (default: golden variation)
   */
  readonly variationSpec?: FillingRecipeVariationSpec;
}

// ============================================================================
// Utility Functions
// ============================================================================

// NOTE: Scaling functions removed - use RuntimeProducedFilling.fromSource() instead
// The scaleVariation, scaleFillingRecipe, and scaleFillingRecipeByFactor functions
// have been removed as they returned IComputedScaledFillingRecipe which no longer exists.
// Scaling is now handled by the produced entity wrappers.

/**
 * Calculates the base weight from filling recipe variation (sum of ingredient amounts)
 *
 * @param variation - Filling recipe variation to calculate weight for
 * @returns Total weight in grams
 * @public
 */
export function calculateBaseWeight(variation: IFillingRecipeVariationEntity): Measurement {
  const total = variation.ingredients.reduce((sum: number, ingredient) => sum + ingredient.amount, 0);
  return total as Measurement;
}

/**
 * Recalculates base weight for filling recipe variation and returns updated variation
 *
 * @param variation - Filling recipe variation to update
 * @returns New filling recipe variation with recalculated base weight
 * @public
 */
export function recalculateFillingRecipeVariation(
  variation: IFillingRecipeVariationEntity
): IFillingRecipeVariationEntity {
  return {
    ...variation,
    baseWeight: calculateBaseWeight(variation)
  };
}
