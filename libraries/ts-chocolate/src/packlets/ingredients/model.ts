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
 * Ingredient model interfaces and types
 * @packageDocumentation
 */

import {
  BaseIngredientId,
  Celsius,
  ChocolateType,
  DegreesMacMichael,
  IngredientCategory,
  Percentage,
  FluidityStars,
  Allergen,
  Certification,
  CacaoVariety,
  ChocolateApplication,
  SourceId
} from '../common';
import { FilterPattern } from '../library-data';

// ============================================================================
// Ganache Characteristics
// ============================================================================

/**
 * Characteristics relevant to ganache calculations
 * These percentages represent the composition of an ingredient
 * @public
 */
export interface IGanacheCharacteristics {
  /** Percentage of cacao fat (0-100) */
  readonly cacaoFat: Percentage;
  /** Percentage of sugar (0-100) */
  readonly sugar: Percentage;
  /** Percentage of milk fat (0-100) */
  readonly milkFat: Percentage;
  /** Percentage of water (0-100) */
  readonly water: Percentage;
  /** Percentage of solids (0-100) */
  readonly solids: Percentage;
  /** Percentage of other fats (0-100) */
  readonly otherFats: Percentage;
}

// ============================================================================
// Temperature Curve (for chocolate tempering)
// ============================================================================

/**
 * Temperature curve for chocolate tempering
 * @public
 */
export interface ITemperatureCurve {
  /** Temperature to fully melt chocolate */
  readonly melt: Celsius;
  /** Temperature to cool chocolate to (crystallization) */
  readonly cool: Celsius;
  /** Final working temperature */
  readonly working: Celsius;
}

// ============================================================================
// Base Ingredient Interface
// ============================================================================

/**
 * Base ingredient interface
 * All ingredients have these common properties
 * @public
 */
export interface IIngredient {
  /** Base identifier within source (no dots) */
  readonly baseId: BaseIngredientId;
  /** Display name */
  readonly name: string;
  /** Ingredient category (discriminator) */
  readonly category: IngredientCategory;
  /** Ganache-relevant characteristics */
  readonly ganacheCharacteristics: IGanacheCharacteristics;
  /** Optional description */
  readonly description?: string;
  /** Optional manufacturer */
  readonly manufacturer?: string;
  /** Optional list of common allergens present in the ingredient */
  readonly allergens?: ReadonlyArray<Allergen>;
  /** Optional list of trace allergens possibly present (e.g. due to contamination) */
  readonly traceAllergens?: ReadonlyArray<Allergen>;
  /** Optional list of certifications the ingredient has */
  readonly certifications?: ReadonlyArray<Certification>;
  /** Optional indicator if the ingredient is vegan */
  readonly vegan?: boolean;
  /** Optional tags for searching/filtering */
  readonly tags?: ReadonlyArray<string>;
}

// ============================================================================
// Discriminated Ingredient Types
// ============================================================================

/**
 * Chocolate-specific ingredient
 * @public
 */
export interface IChocolateIngredient extends IIngredient {
  /** Category is always Chocolate for this type */
  readonly category: 'chocolate';
  /** Type of chocolate */
  readonly chocolateType: ChocolateType;
  /** Cacao percentage (e.g., 70 for 70% dark) */
  readonly cacaoPercentage: Percentage;
  /** Fluidity in Callebaut star ratings (optional) */
  readonly fluidityStars?: FluidityStars;
  /** Viscosity in MacMichael degrees (optional) */
  readonly viscosityMcM?: DegreesMacMichael;
  /** Tempering curve (optional) */
  readonly temperatureCurve?: ITemperatureCurve;
  /** Bean varieties used in the chocolate (optional) */
  readonly beanVarieties?: ReadonlyArray<CacaoVariety>;
  /** Recommended applications for this chocolate (optional) */
  readonly applications?: ReadonlyArray<ChocolateApplication>;
  /** Origin of the chocolate (optional) */
  readonly origins?: string[];
}

/**
 * Sugar-specific ingredient
 * @public
 */
export interface ISugarIngredient extends IIngredient {
  /** Category is always Sugar for this type */
  readonly category: 'sugar';
  /** Hydration number (water molecules per sugar molecule) */
  readonly hydrationNumber?: number;
  /** Sweetness potency relative to sucrose (1.0 = sucrose) */
  readonly sweetnessPotency?: number;
}

/**
 * Dairy-specific ingredient
 * @public
 */
export interface IDairyIngredient extends IIngredient {
  /** Category is always Dairy for this type */
  readonly category: 'dairy';
  /** Fat content percentage */
  readonly fatContent?: Percentage;
  /** Water content percentage */
  readonly waterContent?: Percentage;
}

/**
 * Fat-specific ingredient
 * @public
 */
export interface IFatIngredient extends IIngredient {
  /** Category is always Fat for this type */
  readonly category: 'fat';
  /** Melting point in Celsius */
  readonly meltingPoint?: Celsius;
}

// ============================================================================
// Ingredient Union Type
// ============================================================================

/**
 * Discriminated union of all ingredient types
 * @public
 */
export type Ingredient =
  | IChocolateIngredient
  | ISugarIngredient
  | IDairyIngredient
  | IFatIngredient
  | IIngredient;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for IChocolateIngredient
 * @param ingredient - Ingredient to check
 * @returns True if the ingredient is a chocolate ingredient
 * @public
 */
export function isChocolateIngredient(ingredient: Ingredient): ingredient is IChocolateIngredient {
  return ingredient.category === 'chocolate';
}

/**
 * Type guard for ISugarIngredient
 * @param ingredient - Ingredient to check
 * @returns True if the ingredient is a sugar ingredient
 * @public
 */
export function isSugarIngredient(ingredient: Ingredient): ingredient is ISugarIngredient {
  return ingredient.category === 'sugar';
}

/**
 * Type guard for IDairyIngredient
 * @param ingredient - Ingredient to check
 * @returns True if the ingredient is a dairy ingredient
 * @public
 */
export function isDairyIngredient(ingredient: Ingredient): ingredient is IDairyIngredient {
  return ingredient.category === 'dairy';
}

/**
 * Type guard for IFatIngredient
 * @param ingredient - Ingredient to check
 * @returns True if the ingredient is a fat ingredient
 * @public
 */
export function isFatIngredient(ingredient: Ingredient): ingredient is IFatIngredient {
  return ingredient.category === 'fat';
}

// ============================================================================
// Built-In Spec
// ============================================================================

/**
 * Fine-grained parameters for loading built-in ingredient collections.
 * Omits 'mutable' since built-ins are always immutable.
 * @public
 */
export interface IBuiltInLoadParams {
  /**
   * Patterns to include. If specified, only collection names matching at least one pattern are included.
   * Strings are matched exactly, RegExp patterns use `.test()`.
   */
  readonly included?: ReadonlyArray<FilterPattern>;
  /**
   * Patterns to exclude. Collection names matching any pattern are excluded (takes precedence over included).
   * Strings are matched exactly, RegExp patterns use `.test()`.
   */
  readonly excluded?: ReadonlyArray<FilterPattern>;
  /**
   * Whether to recurse into subdirectories and use a delimiter to form composite collection names.
   */
  readonly recurseWithDelimiter?: string;
}

/**
 * Specifies which built-in ingredient collections should be loaded.
 * Built-in collections are always immutable regardless of this setting.
 *
 * - `true`: Load all built-in collections (default).
 * - `false`: Load no built-in collections.
 * - `ReadonlyArray<SourceId>`: Load only the specified built-in collections by name.
 * - `IBuiltInLoadParams`: Fine-grained control using include/exclude patterns.
 *
 * @public
 */
export type BuiltInSpec = boolean | ReadonlyArray<SourceId> | IBuiltInLoadParams;
