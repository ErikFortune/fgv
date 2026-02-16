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

import {
  AdditionalChocolatePurpose,
  Allergen,
  BuiltInSource,
  CacaoVariety,
  Certification,
  ChocolateApplication,
  ChocolateRole,
  ChocolateType,
  ConfectionType,
  FillingCategory,
  FluidityStars,
  IngredientCategory,
  IngredientPhase,
  MeasurementUnit,
  MoldFormat,
  ProcedureType,
  SpoonLevel,
  SpoonUnit,
  WeightUnit
} from './ids';

// ============================================================================
// Enumerations
// ============================================================================

/**
 * All possible ingredient categories
 * @public
 */
export const allIngredientCategories: IngredientCategory[] = [
  'chocolate',
  'sugar',
  'dairy',
  'fat',
  'liquid',
  'flavor',
  'alcohol',
  'decoration',
  'other'
];

/**
 * All possible chocolate types
 * @public
 */
export const allChocolateTypes: ChocolateType[] = [
  'dark',
  'milk',
  'white',
  'caramelized',
  'ruby',
  'flavored'
];

/**
 * All possible chocolate varieties.
 * @public
 */
export const allCacaoVarieties: CacaoVariety[] = ['Blend', 'Criollo', 'Forastero', 'Nacional', 'Trinitario'];

/**
 * All possible fluidity star ratings
 * @public
 */
export const allFluidityStars: FluidityStars[] = [1, 2, 3, 4, 5];

/**
 * All possible chocolate applications
 * @public
 */
export const allChocolateApplications: ChocolateApplication[] = [
  'baking',
  'confectionary',
  'baking',
  'cookies',
  'cremeux',
  'drinks',
  'enrobing',
  'frozen-desserts',
  'ganache',
  'glazes',
  'ice-cream',
  'molding',
  'mousse',
  'pralines',
  'sauces',
  'sorbet'
];

/**
 * All possible weight units
 * @public
 */
export const allWeightUnits: WeightUnit[] = ['g', 'oz', 'lb', 'kg'];

/**
 * All possible measurement units
 * @public
 */
export const allMeasurementUnits: MeasurementUnit[] = ['g', 'mL', 'tsp', 'Tbsp', 'pinch', 'seeds', 'pods'];

/**
 * All spoon measurement units
 * @public
 */
export const allSpoonUnits: SpoonUnit[] = ['tsp', 'Tbsp'];

/**
 * All spoon level indicators
 * @public
 */
export const allSpoonLevels: SpoonLevel[] = ['level', 'heaping'];

/**
 * All ingredient phases
 * @public
 */
export const allIngredientPhases: IngredientPhase[] = ['solid', 'liquid'];

/**
 * All possible common allergens
 * @public
 */
export const allAllergens: Allergen[] = ['milk', 'soy', 'nuts', 'gluten', 'eggs', 'peanuts'];

/**
 * All possible certifications
 * @public
 */
export const allCertifications: Certification[] = [
  'all-natural',
  'cocoa-horizons',
  'fair-trade',
  'gluten-free',
  'halal',
  'kosher',
  'kosher-dairy',
  'non-gmo',
  'organic',
  'peanut-free',
  'real-vanilla',
  'traceable-beans',
  'vegan',
  'vegetarian',
  'without-lecithin'
];

/**
 * All possible built-in source identifiers
 * @public
 */
export const allBuiltInSources: BuiltInSource[] = ['built-in'];

/**
 * All possible mold formats
 * @public
 */
export const allMoldFormats: MoldFormat[] = ['series-1000', 'series-2000', 'other'];

/**
 * All possible confection types
 * @public
 */
export const allConfectionTypes: ConfectionType[] = ['molded-bonbon', 'bar-truffle', 'rolled-truffle'];

/**
 * All possible chocolate roles.
 * @public
 */
export const allChocolateRoles: ChocolateRole[] = ['shell', 'seal', 'decoration', 'enrobing', 'coating'];

/**
 * All possible additional chocolate purposes
 * @public
 */
export const allAdditionalChocolatePurposes: AdditionalChocolatePurpose[] = ['seal', 'decoration'];

/**
 * All possible filling recipe categories
 * @public
 */
export const allFillingCategories: FillingCategory[] = ['ganache', 'caramel', 'gianduja', 'other'];

/**
 * All possible procedure types
 * @public
 */
export const allProcedureTypes: ProcedureType[] = [
  ...allFillingCategories,
  ...allConfectionTypes,
  'decoration',
  'other'
];
