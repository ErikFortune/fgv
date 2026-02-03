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

import { FillingVersionSpec, Measurement } from '../../common';
import { IFillingRecipeVersion } from '../../entities';

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
// Utility Functions
// ============================================================================

// NOTE: Scaling functions removed - use RuntimeProducedFilling.fromSource() instead
// The scaleVersion, scaleFillingRecipe, and scaleFillingRecipeByFactor functions
// have been removed as they returned IComputedScaledFillingRecipe which no longer exists.
// Scaling is now handled by the produced entity wrappers.

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
