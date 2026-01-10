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
 * Weight calculation utilities for recipe ingredients with mixed units
 * @packageDocumentation
 */

import { IngredientId, Measurement, MeasurementUnit } from '../common';
import { IRecipeIngredient } from './model';

// ============================================================================
// Weight Calculation Context
// ============================================================================

/**
 * Context for weight calculations that provides ingredient density lookup.
 * Implementations should resolve ingredient IDs to their density values.
 * @public
 */
export interface IWeightCalculationContext {
  /**
   * Get the density (g/mL) for an ingredient.
   * @param id - The ingredient ID to look up
   * @returns The density in g/mL, or 1.0 if not specified
   */
  getIngredientDensity(id: IngredientId): number;
}

// ============================================================================
// Weight Contribution
// ============================================================================

/**
 * Result of calculating weight contribution for a single ingredient.
 * @public
 */
export interface IWeightContribution {
  /** The preferred ingredient ID */
  readonly ingredientId: IngredientId;
  /** Original amount in recipe */
  readonly amount: Measurement;
  /** Original unit in recipe */
  readonly unit: MeasurementUnit;
  /** Weight contribution in grams (0 if excluded) */
  readonly weightGrams: Measurement;
  /** Whether this ingredient contributes to total weight */
  readonly contributesToWeight: boolean;
}

// ============================================================================
// Unit Weight Properties
// ============================================================================

/**
 * Units that contribute to weight calculations.
 * - 'g': Added directly
 * - 'mL': Converted via density
 */
type WeightContributingUnit = 'g' | 'mL';

/**
 * Units that are excluded from weight calculations.
 * These are imprecise or count-based measurements that don't scale with recipe weight.
 */
type WeightExcludedUnit = 'tsp' | 'Tbsp' | 'pinch' | 'seeds' | 'pods';

/**
 * Check if a unit contributes to weight calculations.
 * @param unit - The measurement unit to check
 * @returns True if the unit contributes to weight
 * @public
 */
export function contributesToWeight(unit: MeasurementUnit): unit is WeightContributingUnit {
  return unit === 'g' || unit === 'mL';
}

/**
 * Check if a unit is excluded from weight calculations.
 * @param unit - The measurement unit to check
 * @returns True if the unit is excluded from weight
 * @public
 */
export function isWeightExcluded(unit: MeasurementUnit): unit is WeightExcludedUnit {
  return unit === 'tsp' || unit === 'Tbsp' || unit === 'pinch' || unit === 'seeds' || unit === 'pods';
}

// ============================================================================
// Default Context
// ============================================================================

/**
 * Default weight calculation context that returns 1.0 density for all ingredients.
 * Use this when ingredient density data is not available.
 * @public
 */
export const defaultWeightContext: IWeightCalculationContext = {
  getIngredientDensity: (): number => 1.0
};

// ============================================================================
// Weight Calculation Functions
// ============================================================================

/**
 * Calculate the weight contribution for a single ingredient.
 *
 * Weight rules:
 * - 'g': Added directly (amount in grams)
 * - 'mL': Converted to grams via density (amount * density)
 * - 'tsp', 'Tbsp', 'pinch': Excluded (returns 0)
 *
 * @param ingredient - The recipe ingredient to calculate weight for
 * @param context - Context for looking up ingredient density
 * @returns The weight contribution including conversion details
 * @public
 */
export function calculateIngredientWeight(
  ingredient: IRecipeIngredient,
  context: IWeightCalculationContext = defaultWeightContext
): IWeightContribution {
  const unit = ingredient.unit ?? 'g';
  const ingredientId = ingredient.ingredient.preferredId ?? ingredient.ingredient.ids[0];

  if (unit === 'g') {
    return {
      ingredientId,
      amount: ingredient.amount,
      unit,
      weightGrams: ingredient.amount,
      contributesToWeight: true
    };
  }

  if (unit === 'mL') {
    const density = context.getIngredientDensity(ingredientId);
    const weightGrams = (ingredient.amount * density) as Measurement;
    return {
      ingredientId,
      amount: ingredient.amount,
      unit,
      weightGrams,
      contributesToWeight: true
    };
  }

  // tsp, Tbsp, pinch - excluded from weight
  return {
    ingredientId,
    amount: ingredient.amount,
    unit,
    weightGrams: 0 as Measurement,
    contributesToWeight: false
  };
}

/**
 * Calculate the total weight from all ingredients with unit conversion.
 *
 * This function handles mixed-unit recipes by:
 * - Adding grams directly
 * - Converting milliliters to grams via ingredient density
 * - Excluding tsp, Tbsp, and pinch measurements
 *
 * @param ingredients - Array of recipe ingredients
 * @param context - Context for looking up ingredient densities
 * @returns Total weight in grams
 * @public
 */
export function calculateTotalWeight(
  ingredients: ReadonlyArray<IRecipeIngredient>,
  context: IWeightCalculationContext = defaultWeightContext
): Measurement {
  let total = 0;

  for (const ingredient of ingredients) {
    const contribution = calculateIngredientWeight(ingredient, context);
    total += contribution.weightGrams;
  }

  return total as Measurement;
}

/**
 * Calculate weight contributions for all ingredients.
 * Returns detailed breakdown of how each ingredient contributes to total weight.
 *
 * @param ingredients - Array of recipe ingredients
 * @param context - Context for looking up ingredient densities
 * @returns Array of weight contributions for each ingredient
 * @public
 */
export function calculateWeightContributions(
  ingredients: ReadonlyArray<IRecipeIngredient>,
  context: IWeightCalculationContext = defaultWeightContext
): IWeightContribution[] {
  return ingredients.map((ingredient) => calculateIngredientWeight(ingredient, context));
}
