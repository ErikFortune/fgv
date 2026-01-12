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
 * Converters for ingredient types
 * @packageDocumentation
 */

import { Conversion, Converter, Converters } from '@fgv/ts-utils';

import { Converters as IngredientConverters } from '../../common';
import {
  IAlcoholIngredient,
  IChocolateIngredient,
  IDairyIngredient,
  IFatIngredient,
  IGanacheCharacteristics,
  IIngredient,
  ISugarIngredient,
  ITemperatureCurve,
  Ingredient
} from './model';

// ============================================================================
// Ganache Characteristics Converter
// ============================================================================

/**
 * Converter for IGanacheCharacteristics
 * @public
 */
export const ganacheCharacteristics: Converter<IGanacheCharacteristics> =
  Converters.object<IGanacheCharacteristics>({
    cacaoFat: IngredientConverters.percentage,
    sugar: IngredientConverters.percentage,
    milkFat: IngredientConverters.percentage,
    water: IngredientConverters.percentage,
    solids: IngredientConverters.percentage,
    otherFats: IngredientConverters.percentage
  });

// ============================================================================
// Temperature Curve Converter
// ============================================================================

/**
 * Converter for ITemperatureCurve
 * @public
 */
export const temperatureCurve: Converter<ITemperatureCurve> = Converters.object<ITemperatureCurve>({
  melt: IngredientConverters.celsius,
  cool: IngredientConverters.celsius,
  working: IngredientConverters.celsius
});

// ============================================================================
// Base Ingredient Converter
// ============================================================================

const commonIngredientFields: Conversion.FieldConverters<Omit<IIngredient, 'category'>> = {
  baseId: IngredientConverters.baseIngredientId,
  name: Converters.string,
  ganacheCharacteristics,
  description: Converters.string.optional(),
  manufacturer: Converters.string.optional(),
  allergens: Converters.arrayOf(IngredientConverters.allergen).optional(),
  traceAllergens: Converters.arrayOf(IngredientConverters.allergen).optional(),
  certifications: Converters.arrayOf(IngredientConverters.certification).optional(),
  vegan: Converters.boolean.optional(),
  tags: Converters.arrayOf(Converters.string).optional(),
  density: Converters.number.optional(),
  phase: IngredientConverters.ingredientPhase.optional(),
  measurementUnits: IngredientConverters.optionsWithPreferred(
    IngredientConverters.measurementUnitOption,
    IngredientConverters.measurementUnit,
    'measurementUnits'
  ).optional(),
  urls: Converters.arrayOf(IngredientConverters.categorizedUrl).optional()
};

/**
 * Converter for base IIngredient properties
 * @public
 */
export const baseIngredient: Converter<IIngredient> = Converters.object<IIngredient>({
  ...commonIngredientFields,
  category: IngredientConverters.ingredientCategory
});

// ============================================================================
// Discriminated Ingredient Converters
// ============================================================================

/**
 * Converter for IChocolateIngredient
 * @public
 */
export const chocolateIngredient: Converter<IChocolateIngredient> = Converters.object<IChocolateIngredient>({
  ...commonIngredientFields,
  category: Converters.literal('chocolate'),
  chocolateType: IngredientConverters.chocolateType,
  cacaoPercentage: IngredientConverters.percentage,
  fluidityStars: IngredientConverters.fluidityStars.optional(),
  viscosityMcM: IngredientConverters.degreesMacMichael.optional(),
  temperatureCurve: temperatureCurve.optional(),
  origins: Converters.arrayOf(Converters.string).optional(),
  beanVarieties: Converters.arrayOf(IngredientConverters.chocolateVariety).optional(),
  applications: Converters.arrayOf(IngredientConverters.chocolateApplication).optional()
});

/**
 * Converter for ISugarIngredient
 * @public
 */
export const sugarIngredient: Converter<ISugarIngredient> = Converters.object<ISugarIngredient>({
  ...commonIngredientFields,
  category: Converters.literal('sugar'),
  hydrationNumber: Converters.number.optional(),
  sweetnessPotency: Converters.number.optional()
});

/**
 * Converter for IDairyIngredient
 * @public
 */
export const dairyIngredient: Converter<IDairyIngredient> = Converters.object<IDairyIngredient>({
  ...commonIngredientFields,
  category: Converters.literal('dairy'),
  fatContent: IngredientConverters.percentage.optional(),
  waterContent: IngredientConverters.percentage.optional()
});

/**
 * Converter for IFatIngredient
 * @public
 */
export const fatIngredient: Converter<IFatIngredient> = Converters.object<IFatIngredient>({
  ...commonIngredientFields,
  category: Converters.literal('fat'),
  ganacheCharacteristics,
  meltingPoint: IngredientConverters.celsius.optional()
});

/**
 * Converter for IAlcoholIngredient
 * @public
 */
export const alcoholIngredient: Converter<IAlcoholIngredient> = Converters.object<IAlcoholIngredient>({
  ...commonIngredientFields,
  category: Converters.literal('alcohol'),
  alcoholByVolume: IngredientConverters.percentage.optional(),
  flavorProfile: Converters.string.optional()
});

// ============================================================================
// Discriminated Union Converter
// ============================================================================

/**
 * Converter for Ingredient (discriminated union)
 * Tries specialized converters based on category, falls back to base
 * @public
 */
export const ingredient: Converter<Ingredient> = Converters.oneOf<Ingredient>([
  chocolateIngredient,
  sugarIngredient,
  dairyIngredient,
  fatIngredient,
  alcoholIngredient,
  baseIngredient
]);
