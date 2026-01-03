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
 * Branded types and enumerations for the chocolate library
 * @packageDocumentation
 */

import { Brand } from '@fgv/ts-utils';

// ============================================================================
// Branded String Types - Base IDs (no dots allowed)
// ============================================================================

/**
 * Unique identifier for a source (collection of ingredients/recipes)
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * @public
 */
export type SourceId = Brand<string, 'SourceId'>;

/**
 * Ingredient identifier within a single source
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * @public
 */
export type BaseIngredientId = Brand<string, 'BaseIngredientId'>;

/**
 * Recipe identifier within a single source
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * @public
 */
export type BaseRecipeId = Brand<string, 'BaseRecipeId'>;

// ============================================================================
// Branded String Types - Composite IDs (exactly one dot)
// ============================================================================

/**
 * Globally unique ingredient identifier (composite)
 * Format: "sourceId.baseIngredientId"
 * Must contain exactly one dot separator
 * Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
 * @public
 */
export type IngredientId = Brand<string, 'IngredientId'>;

/**
 * Globally unique recipe identifier (composite)
 * Format: "sourceId.baseRecipeId"
 * Must contain exactly one dot separator
 * Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
 * @public
 */
export type RecipeId = Brand<string, 'RecipeId'>;

/**
 * Non-unique recipe name used for display and grouping
 * @public
 */
export type RecipeName = Brand<string, 'RecipeName'>;

/**
 * Unique identifier for a recipe version
 * Format: YYYY-MM-DD-NN with optional label where NN is a 2-digit counter
 * Examples: "2026-01-03-01", "2026-01-03-02-less-sugar"
 * @public
 */
export type RecipeVersionId = Brand<string, 'RecipeVersionId'>;

// ============================================================================
// Branded Numeric Types
// ============================================================================

/**
 * Weight in grams (native internal unit)
 * @public
 */
export type Grams = Brand<number, 'Grams'>;

/**
 * Percentage value (0-100)
 * @public
 */
export type Percentage = Brand<number, 'Percentage'>;

/**
 * Temperature in Celsius
 * @public
 */
export type Celsius = Brand<number, 'Celsius'>;

/**
 * Viscosity in degrees MacMichael
 * @public
 */
export type DegreesMacMichael = Brand<number, 'DegreesMacMichael'>;

/**
 * Rating score (1-5 scale)
 * @public
 */
export type RatingScore = Brand<number, 'RatingScore'>;

// ============================================================================
// Enumerations
// ============================================================================

/**
 * Base categories of ingredients (discriminated union tag)
 * @public
 */
export type IngredientCategory =
  | 'chocolate'
  | 'sugar'
  | 'dairy'
  | 'fat'
  | 'liquid'
  | 'flavor'
  | 'alcohol'
  | 'other';

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
  'other'
];

/**
 * Types of chocolate
 * @public
 */
export type ChocolateType = 'dark' | 'milk' | 'white' | 'caramelized' | 'ruby' | 'flavored';

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
 * Varieties of cacao beans
 * @public
 */
export type CacaoVariety = 'Blend' | 'Criollo' | 'Forastero' | 'Nacional' | 'Trinitario';

/**
 * All possible chocolate varieties.
 * @public
 */
export const allCacaoVarieties: CacaoVariety[] = ['Blend', 'Criollo', 'Forastero', 'Nacional', 'Trinitario'];

/**
 * Fluidity in Callebaut star ratings (1-5)
 * Lower stars = more fluid, higher stars = more viscous
 * @public
 */
export type FluidityStars = 1 | 2 | 3 | 4 | 5;

/**
 * All possible fluidity star ratings
 * @public
 */
export const allFluidityStars: FluidityStars[] = [1, 2, 3, 4, 5];

/**
 * Recommended applications for chocolate
 * @public
 */
export type ChocolateApplication =
  | 'baking'
  | 'confectionary'
  | 'cremeux'
  | 'drinks'
  | 'enrobing'
  | 'ganache'
  | 'ice-cream'
  | 'molding'
  | 'mousse'
  | 'sorbet';

/**
 * All possible chocolate applications
 * @public
 */
export const allChocolateApplications: ChocolateApplication[] = [
  'baking',
  'confectionary',
  'cremeux',
  'drinks',
  'enrobing',
  'ganache',
  'ice-cream',
  'molding',
  'mousse',
  'sorbet'
];

/**
 * Supported weight units for output conversion
 * @public
 */
export type WeightUnit = 'g' | 'oz' | 'lb' | 'kg';

/**
 * All possible weight units
 * @public
 */
export const allWeightUnits: WeightUnit[] = ['g', 'oz', 'lb', 'kg'];

/**
 * Common allergens that may be present in ingredients
 * @public
 */
export type Allergen = 'milk' | 'soy' | 'nuts' | 'gluten' | 'eggs' | 'peanuts';

/**
 * All possible common allergens
 * @public
 */
export const allAllergens: Allergen[] = ['milk', 'soy', 'nuts', 'gluten', 'eggs', 'peanuts'];

/**
 * Certifications that an ingredient may have.
 * @public
 */
export type Certification =
  | 'all-natural'
  | 'fair-trade'
  | 'gluten-free'
  | 'halal'
  | 'kosher-dairy'
  | 'non-gmo'
  | 'organic'
  | 'peanut-free'
  | 'real-vanilla'
  | 'traceable-beans'
  | 'vegan'
  | 'vegetarian'
  | 'without-lecithin';

/**
 * All possible certifications
 * @public
 */
export const allCertifications: Certification[] = [
  'all-natural',
  'fair-trade',
  'gluten-free',
  'halal',
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
 * Well-known built-in source identifiers
 * @public
 */
export type BuiltInSource = 'built-in';

/**
 * All possible built-in source identifiers
 * @public
 */
export const allBuiltInSources: BuiltInSource[] = ['built-in'];

// ============================================================================
// Constants
// ============================================================================

/**
 * Separator character used in composite IDs
 * @public
 */
export const ID_SEPARATOR: string = '.';

/**
 * Pattern for valid base IDs (no dots allowed)
 * @public
 */
export const BASE_ID_PATTERN: RegExp = /^[a-zA-Z0-9_-]+$/;

/**
 * Pattern for valid composite IDs (exactly one dot)
 * @public
 */
export const COMPOSITE_ID_PATTERN: RegExp = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/;

/**
 * Pattern for valid recipe version IDs
 * Format: YYYY-MM-DD-NN with optional label (lowercase alphanumeric with dashes)
 * @public
 */
export const RECIPE_VERSION_ID_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2}-\d{2}(-[a-z0-9-]+)?$/;
