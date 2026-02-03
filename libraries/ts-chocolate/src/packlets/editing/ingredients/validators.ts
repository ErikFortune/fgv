// Copyright (c) 2024 Erik Fortune
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
 * Semantic validators for ingredient entities.
 * These validators handle cross-field and business rule validation.
 * Type/format/constraint validation is handled by converters.
 * @packageDocumentation
 */

import { Result, Success, Failure } from '@fgv/ts-utils';
import { Ingredients, Ingredient } from '../../entities';

/**
 * Validate ganache characteristics percentages.
 * Ensures all values are 0-100 and total doesn't exceed 100.
 * @param entity - Ingredient to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateGanacheCharacteristics(entity: Ingredient): Result<true> {
  const gc = entity.ganacheCharacteristics;
  if (!gc) {
    return Failure.with('ganacheCharacteristics is required');
  }

  // Validate each percentage is 0-100
  const fields: Array<keyof typeof gc> = ['cacaoFat', 'sugar', 'milkFat', 'water', 'solids', 'otherFats'];

  for (const field of fields) {
    const value = gc[field];
    if (value < 0 || value > 100) {
      return Failure.with(`ganacheCharacteristics.${field} must be between 0 and 100 (got ${value})`);
    }
  }

  // Check total doesn't exceed 100 (allowing for small floating point errors)
  const total = gc.cacaoFat + gc.sugar + gc.milkFat + gc.water + gc.solids + gc.otherFats;
  if (total > 100.01) {
    return Failure.with(`ganacheCharacteristics percentages total ${total.toFixed(2)}% which exceeds 100%`);
  }

  return Success.with(true);
}

/**
 * Validate temperature curve for chocolate ingredients.
 * @param entity - Ingredient to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateTemperatureCurve(entity: Ingredient): Result<true> {
  if (!Ingredients.isChocolateIngredient(entity)) {
    return Success.with(true); // Not applicable
  }

  const curve = entity.temperatureCurve;
  if (!curve) {
    return Success.with(true); // Optional field
  }

  // Validate temperature sequence: melt > cool > working
  if (curve.melt <= curve.cool) {
    return Failure.with(
      `temperatureCurve: melt temperature (${curve.melt}°C) must be greater than cool temperature (${curve.cool}°C)`
    );
  }

  if (curve.cool <= curve.working) {
    return Failure.with(
      `temperatureCurve: cool temperature (${curve.cool}°C) must be greater than working temperature (${curve.working}°C)`
    );
  }

  // Reasonable temperature ranges for chocolate
  if (curve.melt < 40 || curve.melt > 60) {
    return Failure.with(
      `temperatureCurve: melt temperature ${curve.melt}°C is outside reasonable range (40-60°C)`
    );
  }

  if (curve.working < 25 || curve.working > 35) {
    return Failure.with(
      `temperatureCurve: working temperature ${curve.working}°C is outside reasonable range (25-35°C)`
    );
  }

  return Success.with(true);
}

/**
 * Validate chocolate-specific fields.
 * @param entity - Ingredient to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateChocolateFields(entity: Ingredient): Result<true> {
  if (!Ingredients.isChocolateIngredient(entity)) {
    return Success.with(true); // Not applicable
  }

  // Validate cacao percentage
  if (entity.cacaoPercentage < 0 || entity.cacaoPercentage > 100) {
    return Failure.with(`cacaoPercentage must be between 0 and 100 (got ${entity.cacaoPercentage})`);
  }

  // Validate fluidity stars if present
  if (entity.fluidityStars !== undefined) {
    if (entity.fluidityStars < 1 || entity.fluidityStars > 5) {
      return Failure.with(`fluidityStars must be between 1 and 5 (got ${entity.fluidityStars})`);
    }
  }

  // Validate viscosity if present
  if (entity.viscosityMcM !== undefined) {
    if (entity.viscosityMcM < 0) {
      return Failure.with(`viscosityMcM must be positive (got ${entity.viscosityMcM})`);
    }
  }

  return validateTemperatureCurve(entity);
}

/**
 * Validate dairy-specific fields.
 * @param entity - Ingredient to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateDairyFields(entity: Ingredient): Result<true> {
  if (!Ingredients.isDairyIngredient(entity)) {
    return Success.with(true); // Not applicable
  }

  // Validate fat content if present
  if (entity.fatContent !== undefined) {
    if (entity.fatContent < 0 || entity.fatContent > 100) {
      return Failure.with(`fatContent must be between 0 and 100 (got ${entity.fatContent})`);
    }
  }

  // Validate water content if present
  if (entity.waterContent !== undefined) {
    if (entity.waterContent < 0 || entity.waterContent > 100) {
      return Failure.with(`waterContent must be between 0 and 100 (got ${entity.waterContent})`);
    }
  }

  // Check total doesn't exceed 100
  if (entity.fatContent !== undefined && entity.waterContent !== undefined) {
    const total = entity.fatContent + entity.waterContent;
    if (total > 100) {
      return Failure.with(`fatContent + waterContent exceeds 100% (${total.toFixed(2)}%)`);
    }
  }

  return Success.with(true);
}

/**
 * Validate alcohol-specific fields.
 * @param entity - Ingredient to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateAlcoholFields(entity: Ingredient): Result<true> {
  if (!Ingredients.isAlcoholIngredient(entity)) {
    return Success.with(true); // Not applicable
  }

  // Validate alcohol by volume if present
  if (entity.alcoholByVolume !== undefined) {
    if (entity.alcoholByVolume < 0 || entity.alcoholByVolume > 100) {
      return Failure.with(`alcoholByVolume must be between 0 and 100 (got ${entity.alcoholByVolume})`);
    }
  }

  return Success.with(true);
}

/**
 * Validate entity-level constraints that span multiple fields.
 * This should be called after individual field validation.
 * @param entity - Complete ingredient entity to validate
 * @returns Result indicating validation success or failure
 * @public
 */
export function validateIngredientEntity(entity: Ingredient): Result<Ingredient> {
  return validateGanacheCharacteristics(entity)
    .onSuccess(() => validateChocolateFields(entity))
    .onSuccess(() => validateDairyFields(entity))
    .onSuccess(() => validateAlcoholFields(entity))
    .onSuccess(() => Success.with(entity));
}
