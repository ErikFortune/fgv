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
 * Converters for branded types
 * @packageDocumentation
 */

import { Converter, Converters } from '@fgv/ts-utils';

import {
  BaseIngredientId,
  BaseRecipeId,
  Celsius,
  ChocolateType,
  DegreesMacMichael,
  Grams,
  IngredientCategory,
  IngredientId,
  Percentage,
  RecipeId,
  RecipeName,
  SourceId,
  FluidityStars,
  WeightUnit,
  allChocolateTypes,
  allIngredientCategories,
  allFluidityStars,
  allWeightUnits,
  allAllergens,
  Allergen
} from './model';
import {
  toBaseIngredientId,
  toBaseRecipeId,
  toCelsius,
  toDegreesMacMichael,
  toGrams,
  toIngredientId,
  toPercentage,
  toRecipeId,
  toRecipeName,
  toSourceId
} from './validation';

// ============================================================================
// ID Converters
// ============================================================================

/**
 * Converter for SourceId
 * @public
 */
export const sourceId: Converter<SourceId> = Converters.generic(toSourceId);

/**
 * Converter for BaseIngredientId
 * @public
 */
export const baseIngredientId: Converter<BaseIngredientId> = Converters.generic(toBaseIngredientId);

/**
 * Converter for BaseRecipeId
 * @public
 */
export const baseRecipeId: Converter<BaseRecipeId> = Converters.generic(toBaseRecipeId);

/**
 * Converter for IngredientId (composite)
 * @public
 */
export const ingredientId: Converter<IngredientId> = Converters.generic(toIngredientId);

/**
 * Converter for RecipeId (composite)
 * @public
 */
export const recipeId: Converter<RecipeId> = Converters.generic(toRecipeId);

/**
 * Converter for RecipeName
 * @public
 */
export const recipeName: Converter<RecipeName> = Converters.generic(toRecipeName);

// ============================================================================
// Numeric Converters
// ============================================================================

/**
 * Converter for Grams
 * @public
 */
export const grams: Converter<Grams> = Converters.generic(toGrams);

/**
 * Converter for Percentage
 * @public
 */
export const percentage: Converter<Percentage> = Converters.generic(toPercentage);

/**
 * Converter for Celsius
 * @public
 */
export const celsius: Converter<Celsius> = Converters.generic(toCelsius);

/**
 * Converter for DegreesMacMichael
 * @public
 */
export const degreesMacMichael: Converter<DegreesMacMichael> = Converters.generic(toDegreesMacMichael);

// ============================================================================
// Enum Converters
// ============================================================================

/**
 * Converter for IngredientCategory
 * @public
 */
export const ingredientCategory: Converter<IngredientCategory> =
  Converters.enumeratedValue(allIngredientCategories);

/**
 * Converter for ChocolateType
 * @public
 */
export const chocolateType: Converter<ChocolateType> = Converters.enumeratedValue(allChocolateTypes);

/**
 * Converter for FluidityStars
 * @public
 */
export const fluidityStars: Converter<FluidityStars> = Converters.enumeratedValue(allFluidityStars);

/**
 * Converter for WeightUnit
 * @public
 */
export const weightUnit: Converter<WeightUnit> = Converters.enumeratedValue(allWeightUnits);

/**
 * Converter for Allergen
 * @public
 */
export const allergen: Converter<Allergen> = Converters.enumeratedValue(allAllergens);
