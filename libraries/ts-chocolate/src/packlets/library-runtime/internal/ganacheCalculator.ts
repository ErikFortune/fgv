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
 * Ganache characteristic calculations
 * @packageDocumentation
 */

import { Failure, Result, mapResults, Success } from '@fgv/ts-utils';

import { Measurement, Helpers, Percentage, FillingVersionSpec } from '../../common';
import { IGanacheCharacteristics, Ingredient } from '../../entities';
import { IFillingRecipe, Fillings } from '../../entities';
import {
  IGanacheAnalysis,
  IGanacheCalculation,
  IGanacheValidation,
  IngredientResolver,
  IResolvedIngredient
} from '../model';

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Creates an empty (zeroed) ganache characteristics object
 * @returns Zeroed ganache characteristics
 * @internal
 */
function createEmptyCharacteristics(): IGanacheCharacteristics {
  return {
    cacaoFat: 0 as Percentage,
    sugar: 0 as Percentage,
    milkFat: 0 as Percentage,
    water: 0 as Percentage,
    solids: 0 as Percentage,
    otherFats: 0 as Percentage
  };
}

/**
 * Mutable accumulator type for weighted characteristics
 * @internal
 */
interface IMutableCharacteristicsAccumulator {
  cacaoFat: number;
  sugar: number;
  milkFat: number;
  water: number;
  solids: number;
  otherFats: number;
}

/**
 * Adds weighted ingredient characteristics to accumulator
 * @param accumulator - Running total of weighted characteristics (mutated)
 * @param ingredient - Ingredient to add
 * @param weight - Weight of this ingredient contribution
 * @internal
 */
function addWeightedCharacteristics(
  accumulator: IMutableCharacteristicsAccumulator,
  ingredient: Ingredient,
  weight: Measurement
): void {
  const chars = ingredient.ganacheCharacteristics;
  accumulator.cacaoFat += chars.cacaoFat * weight;
  accumulator.sugar += chars.sugar * weight;
  accumulator.milkFat += chars.milkFat * weight;
  accumulator.water += chars.water * weight;
  accumulator.solids += chars.solids * weight;
  accumulator.otherFats += chars.otherFats * weight;
}

/**
 * Normalizes accumulated characteristics to percentages
 * @param accumulator - Accumulated weighted values
 * @param totalWeight - Total weight for normalization
 * @returns Normalized characteristics as percentages
 * @internal
 */
function normalizeCharacteristics(
  accumulator: IMutableCharacteristicsAccumulator,
  totalWeight: Measurement
): IGanacheCharacteristics {
  if (totalWeight <= 0) {
    return createEmptyCharacteristics();
  }

  return {
    cacaoFat: (accumulator.cacaoFat / totalWeight) as Percentage,
    sugar: (accumulator.sugar / totalWeight) as Percentage,
    milkFat: (accumulator.milkFat / totalWeight) as Percentage,
    water: (accumulator.water / totalWeight) as Percentage,
    solids: (accumulator.solids / totalWeight) as Percentage,
    otherFats: (accumulator.otherFats / totalWeight) as Percentage
  };
}

/**
 * Calculates blended characteristics from resolved ingredients
 *
 * @param resolvedIngredients - Array of ingredients with their amounts
 * @returns Ganache analysis with blended characteristics
 * @public
 */
export function calculateFromIngredients(
  resolvedIngredients: ReadonlyArray<IResolvedIngredient>
): IGanacheAnalysis {
  // Initialize accumulator
  const accumulator: IMutableCharacteristicsAccumulator = {
    cacaoFat: 0,
    sugar: 0,
    milkFat: 0,
    water: 0,
    solids: 0,
    otherFats: 0
  };

  // Calculate total weight
  const totalWeight = resolvedIngredients.reduce((sum, ri) => sum + ri.amount, 0) as Measurement;

  // Accumulate weighted characteristics
  for (const resolved of resolvedIngredients) {
    addWeightedCharacteristics(accumulator, resolved.ingredient, resolved.amount);
  }

  // Normalize to percentages
  const characteristics = normalizeCharacteristics(accumulator, totalWeight);

  // Calculate derived values
  const totalFat = (characteristics.cacaoFat +
    characteristics.milkFat +
    characteristics.otherFats) as Percentage;
  const fatToWaterRatio = characteristics.water > 0 ? totalFat / characteristics.water : Infinity;
  const sugarToWaterRatio =
    characteristics.water > 0 ? characteristics.sugar / characteristics.water : Infinity;

  return {
    characteristics,
    totalFat,
    fatToWaterRatio,
    sugarToWaterRatio,
    totalWeight
  };
}

/**
 * Resolves recipe ingredients and calculates blended characteristics
 *
 * @param recipeIngredients - Recipe ingredient references
 * @param resolver - Function to resolve ingredient IDs to full data
 * @returns Success with ganache analysis, or Failure if resolution fails
 * @public
 */
export function calculateFromFillingRecipeIngredients(
  recipeIngredients: ReadonlyArray<Fillings.IFillingIngredient>,
  resolver: IngredientResolver
): Result<IGanacheAnalysis> {
  // Resolve all ingredients using the preferred ingredient ID
  const resolutionResults = recipeIngredients.map((ri) => {
    const ingredientId = Helpers.getPreferredIdOrFirst(ri.ingredient);
    /* c8 ignore next 3 - defensive: converter validates ids array is non-empty */
    if (ingredientId === undefined) {
      return Failure.with<IResolvedIngredient>('Recipe ingredient has no ingredient ids');
    }
    return resolver(ingredientId).onSuccess((ingredient) =>
      Success.with<IResolvedIngredient>({
        ingredient,
        amount: ri.amount
      })
    );
  });

  return mapResults(resolutionResults).onSuccess((resolvedIngredients) =>
    Success.with(calculateFromIngredients(resolvedIngredients))
  );
}

/**
 * Resolves and calculates characteristics for a complete recipe
 *
 * @param recipe - The recipe to analyze
 * @param resolver - Function to resolve ingredient IDs to full data
 * @param versionSpec - Optional version ID (default: golden version)
 * @returns Success with ganache analysis, or Failure if resolution fails
 * @public
 */
export function calculateForFillingRecipe(
  recipe: IFillingRecipe,
  resolver: IngredientResolver,
  versionSpec?: FillingVersionSpec
): Result<IGanacheAnalysis> {
  const targetVersionSpec = versionSpec ?? recipe.goldenVersionSpec;
  const version = recipe.versions.find((v) => v.versionSpec === targetVersionSpec);

  if (!version) {
    return Failure.with(`Version ${targetVersionSpec} not found in recipe ${recipe.baseId}`);
  }

  return calculateFromFillingRecipeIngredients(version.ingredients, resolver);
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Ganache guideline thresholds interface
 * @internal
 */
interface IGanacheGuidelines {
  readonly MIN_FAT_PERCENT: number;
  readonly MAX_FAT_PERCENT: number;
  readonly MIN_WATER_PERCENT: number;
  readonly MAX_WATER_PERCENT: number;
  readonly MIN_FAT_WATER_RATIO: number;
  readonly MAX_FAT_WATER_RATIO: number;
  readonly MIN_SUGAR_WATER_RATIO: number;
}

/**
 * Standard ganache guideline thresholds
 * Based on professional confectionery standards
 */
const GUIDELINES: IGanacheGuidelines = {
  /** Minimum fat percentage for proper emulsion */
  MIN_FAT_PERCENT: 25,
  /** Maximum fat percentage before becoming too greasy */
  MAX_FAT_PERCENT: 45,
  /** Minimum water percentage for texture */
  MIN_WATER_PERCENT: 10,
  /** Maximum water percentage for shelf stability */
  MAX_WATER_PERCENT: 35,
  /** Minimum fat to water ratio for emulsion stability */
  MIN_FAT_WATER_RATIO: 0.8,
  /** Maximum fat to water ratio before becoming too heavy */
  MAX_FAT_WATER_RATIO: 3.0,
  /** Minimum sugar to water ratio for preservation */
  MIN_SUGAR_WATER_RATIO: 0.5
};

/**
 * Validates ganache analysis against standard guidelines
 *
 * @param analysis - Ganache analysis to validate
 * @returns Validation result with warnings and errors
 * @public
 */
export function validateGanache(analysis: IGanacheAnalysis): IGanacheValidation {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Validate fat percentage
  if (analysis.totalFat < GUIDELINES.MIN_FAT_PERCENT) {
    warnings.push(
      `Low fat content (${analysis.totalFat.toFixed(1)}%). ` +
        `Ganache may not emulsify properly. Minimum recommended: ${GUIDELINES.MIN_FAT_PERCENT}%`
    );
  }
  if (analysis.totalFat > GUIDELINES.MAX_FAT_PERCENT) {
    warnings.push(
      `High fat content (${analysis.totalFat.toFixed(1)}%). ` +
        `Ganache may feel greasy. Maximum recommended: ${GUIDELINES.MAX_FAT_PERCENT}%`
    );
  }

  // Validate water percentage
  if (analysis.characteristics.water < GUIDELINES.MIN_WATER_PERCENT) {
    warnings.push(
      `Low water content (${analysis.characteristics.water.toFixed(1)}%). ` +
        `Ganache may be too thick. Minimum recommended: ${GUIDELINES.MIN_WATER_PERCENT}%`
    );
  }
  if (analysis.characteristics.water > GUIDELINES.MAX_WATER_PERCENT) {
    errors.push(
      `High water content (${analysis.characteristics.water.toFixed(1)}%). ` +
        `May reduce shelf life. Maximum recommended: ${GUIDELINES.MAX_WATER_PERCENT}%`
    );
  }

  // Validate fat to water ratio (emulsion stability)
  if (analysis.fatToWaterRatio < GUIDELINES.MIN_FAT_WATER_RATIO) {
    warnings.push(
      `Low fat-to-water ratio (${analysis.fatToWaterRatio.toFixed(2)}). ` +
        `Emulsion may be unstable. Minimum recommended: ${GUIDELINES.MIN_FAT_WATER_RATIO}`
    );
  }
  if (analysis.fatToWaterRatio > GUIDELINES.MAX_FAT_WATER_RATIO) {
    warnings.push(
      `High fat-to-water ratio (${analysis.fatToWaterRatio.toFixed(2)}). ` +
        `Ganache may be too heavy. Maximum recommended: ${GUIDELINES.MAX_FAT_WATER_RATIO}`
    );
  }

  // Validate sugar to water ratio (preservation)
  if (analysis.sugarToWaterRatio < GUIDELINES.MIN_SUGAR_WATER_RATIO) {
    warnings.push(
      `Low sugar-to-water ratio (${analysis.sugarToWaterRatio.toFixed(2)}). ` +
        `May reduce shelf stability. Minimum recommended: ${GUIDELINES.MIN_SUGAR_WATER_RATIO}`
    );
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}

/**
 * Performs complete ganache calculation with validation
 *
 * @param recipe - The recipe to analyze
 * @param resolver - Function to resolve ingredient IDs to full data
 * @param versionSpec - Optional version ID (default: golden version)
 * @returns Success with complete calculation, or Failure if resolution fails
 * @public
 */
export function calculateGanache(
  recipe: IFillingRecipe,
  resolver: IngredientResolver,
  versionSpec?: FillingVersionSpec
): Result<IGanacheCalculation> {
  return calculateForFillingRecipe(recipe, resolver, versionSpec).onSuccess((analysis) =>
    Success.with({
      analysis,
      validation: validateGanache(analysis)
    })
  );
}
