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
  IAlcoholIngredientEntity,
  IChocolateIngredientEntity,
  IDairyIngredientEntity,
  IFatIngredientEntity,
  IGanacheCharacteristics,
  IIngredientEntity,
  ISugarIngredientEntity,
  ITemperatureCurve,
  IngredientEntity
} from './model';

// ============================================================================
// Ganache Characteristics Converter
// ============================================================================

/**
 * Converter for IGanacheCharacteristics
 * @public
 */
export const ganacheCharacteristics: Converter<IGanacheCharacteristics> =
  Converters.strictObject<IGanacheCharacteristics>({
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
export const temperatureCurve: Converter<ITemperatureCurve> = Converters.strictObject<ITemperatureCurve>({
  melt: IngredientConverters.celsius,
  cool: IngredientConverters.celsius.optional(),
  working: IngredientConverters.celsius.optional()
});

// ============================================================================
// Base Ingredient Converter
// ============================================================================

const commonIngredientEntityFields: Conversion.FieldConverters<Omit<IIngredientEntity, 'category'>> = {
  baseId: IngredientConverters.baseIngredientId,
  name: Converters.string.withConstraint((s) => s.length >= 1 && s.length <= 200, {
    description: 'must be 1-200 characters'
  }),
  ganacheCharacteristics,
  description: Converters.string
    .withConstraint((s) => s.length <= 2000, { description: 'must be at most 2000 characters' })
    .optional(),
  manufacturer: Converters.string
    .withConstraint((s) => s.length <= 200, { description: 'must be at most 200 characters' })
    .optional(),
  allergens: Converters.arrayOf(IngredientConverters.allergen).optional(),
  traceAllergens: Converters.arrayOf(IngredientConverters.allergen).optional(),
  certifications: Converters.arrayOf(IngredientConverters.certification).optional(),
  vegan: Converters.boolean.optional(),
  tags: Converters.arrayOf(Converters.string).optional(),
  density: Converters.number
    .withConstraint((n) => n >= 0.1 && n <= 5.0, { description: 'must be between 0.1 and 5.0' })
    .optional(),
  phase: IngredientConverters.ingredientPhase.optional(),
  measurementUnits: IngredientConverters.optionsWithPreferred(
    IngredientConverters.measurementUnitOption,
    IngredientConverters.measurementUnit,
    'measurementUnits'
  ).optional(),
  urls: Converters.arrayOf(IngredientConverters.categorizedUrl).optional(),
  notes: Converters.arrayOf(IngredientConverters.categorizedNote).optional()
};

/**
 * Converter for base {@link Entities.Ingredients.IIngredientEntity | IIngredientEntity} properties.
 * @public
 */
export const baseIngredientEntity: Converter<IIngredientEntity> = Converters.strictObject<IIngredientEntity>({
  ...commonIngredientEntityFields,
  category: IngredientConverters.ingredientCategory
});

// ============================================================================
// Discriminated Ingredient Converters
// ============================================================================

/**
 * Converter for {@link Entities.Ingredients.IChocolateIngredientEntity | IChocolateIngredientEntity}.
 * @public
 */
export const chocolateIngredientEntity: Converter<IChocolateIngredientEntity> =
  Converters.strictObject<IChocolateIngredientEntity>({
    ...commonIngredientEntityFields,
    category: Converters.literal('chocolate'),
    chocolateType: IngredientConverters.chocolateType,
    cacaoPercentage: IngredientConverters.percentage,
    fluidityStars: IngredientConverters.fluidityStars.optional(),
    viscosityMcM: IngredientConverters.degreesMacMichael.optional(),
    temperatureCurve: temperatureCurve.optional(),
    origins: Converters.arrayOf(Converters.string).optional(),
    beanVarieties: Converters.arrayOf(IngredientConverters.cacaoVariety).optional(),
    applications: Converters.arrayOf(IngredientConverters.chocolateApplication).optional()
  });

/**
 * Converter for {@link Entities.Ingredients.ISugarIngredientEntity | ISugarIngredientEntity}.
 * @public
 */
export const sugarIngredientEntity: Converter<ISugarIngredientEntity> =
  Converters.strictObject<ISugarIngredientEntity>({
    ...commonIngredientEntityFields,
    category: Converters.literal('sugar'),
    hydrationNumber: Converters.number.optional(),
    sweetnessPotency: Converters.number.optional()
  });

/**
 * Converter for {@link Entities.Ingredients.IDairyIngredientEntity | IDairyIngredientEntity}.
 * @public
 */
export const dairyIngredientEntity: Converter<IDairyIngredientEntity> =
  Converters.strictObject<IDairyIngredientEntity>({
    ...commonIngredientEntityFields,
    category: Converters.literal('dairy'),
    fatContent: IngredientConverters.percentage.optional(),
    waterContent: IngredientConverters.percentage.optional()
  });

/**
 * Converter for {@link Entities.Ingredients.IFatIngredientEntity | IFatIngredientEntity}.
 * @public
 */
export const fatIngredientEntity: Converter<IFatIngredientEntity> =
  Converters.strictObject<IFatIngredientEntity>({
    ...commonIngredientEntityFields,
    category: Converters.literal('fat'),
    ganacheCharacteristics,
    meltingPoint: IngredientConverters.celsius.optional()
  });

/**
 * Converter for {@link Entities.Ingredients.IAlcoholIngredientEntity | IAlcoholIngredientEntity}.
 * @public
 */
export const alcoholIngredientEntity: Converter<IAlcoholIngredientEntity> =
  Converters.strictObject<IAlcoholIngredientEntity>({
    ...commonIngredientEntityFields,
    category: Converters.literal('alcohol'),
    alcoholByVolume: IngredientConverters.percentage.optional(),
    flavorProfile: Converters.string.optional()
  });

/**
 * Converter for {@link Entities.Ingredients.IngredientEntity | IngredientEntity} (discriminated union).
 * Dispatches to the appropriate specialized converter based on the `category` field.
 * Unknown categories fall back to {@link baseIngredientEntity}.
 * @public
 */
export const ingredientEntity: Converter<IngredientEntity> = Converters.discriminatedObject<IngredientEntity>(
  'category',
  {
    chocolate: chocolateIngredientEntity,
    sugar: sugarIngredientEntity,
    dairy: dairyIngredientEntity,
    fat: fatIngredientEntity,
    alcohol: alcoholIngredientEntity,
    liquid: baseIngredientEntity,
    flavor: baseIngredientEntity,
    decoration: baseIngredientEntity,
    other: baseIngredientEntity
  }
);
