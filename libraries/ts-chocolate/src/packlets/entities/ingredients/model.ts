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
  Allergen,
  BaseIngredientId,
  CacaoVariety,
  Celsius,
  Certification,
  ChocolateApplication,
  ChocolateType,
  DegreesMacMichael,
  FluidityStars,
  IngredientCategory,
  IngredientPhase,
  MeasurementUnit,
  Model as CommonModel,
  Percentage
} from '../../common';

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
  readonly cool?: Celsius;
  /** Final working temperature */
  readonly working?: Celsius;
}

// ============================================================================
// Base Ingredient Interface
// ============================================================================

/**
 * Base ingredient interface
 * All ingredients have these common properties
 * @public
 */
export interface IIngredientEntity {
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
  /** Density in g/mL for volume-to-weight conversion (default: 1.0) */
  readonly density?: number;
  /** Physical phase - display hint for UI (e.g., "pour" vs "add") */
  readonly phase?: IngredientPhase;
  /** Preferred and acceptable measurement units for this ingredient */
  readonly measurementUnits?: CommonModel.IOptionsWithPreferred<
    CommonModel.IMeasurementUnitOption,
    MeasurementUnit
  >;
  /** Optional categorized URLs for external resources (manufacturer, product page, etc.) */
  readonly urls?: ReadonlyArray<CommonModel.ICategorizedUrl>;
  /** Optional categorized notes (e.g., AI assumptions, user annotations, sourcing) */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
}

// ============================================================================
// Discriminated Ingredient Types
// ============================================================================

/**
 * Chocolate-specific ingredient
 * @public
 */
export interface IChocolateIngredientEntity extends IIngredientEntity {
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
export interface ISugarIngredientEntity extends IIngredientEntity {
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
export interface IDairyIngredientEntity extends IIngredientEntity {
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
export interface IFatIngredientEntity extends IIngredientEntity {
  /** Category is always Fat for this type */
  readonly category: 'fat';
  /** Melting point in Celsius */
  readonly meltingPoint?: Celsius;
}

/**
 * Alcohol-specific ingredient
 * @public
 */
export interface IAlcoholIngredientEntity extends IIngredientEntity {
  /** Category is always Alcohol for this type */
  readonly category: 'alcohol';
  /** Alcohol by volume percentage */
  readonly alcoholByVolume?: Percentage;
  /** Flavor profile description (optional) */
  readonly flavorProfile?: string;
}

// ============================================================================
// Ingredient Union Type
// ============================================================================

/**
 * Discriminated union of all ingredient types
 * @public
 */
export type IngredientEntity =
  | IChocolateIngredientEntity
  | ISugarIngredientEntity
  | IDairyIngredientEntity
  | IFatIngredientEntity
  | IAlcoholIngredientEntity
  | IIngredientEntity;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for {@link Entities.Ingredients.IChocolateIngredientEntity | IChocolateIngredientEntity}.
 * @param ingredient - Ingredient to check
 * @returns True if the ingredient is a chocolate ingredient
 * @public
 */
export function isChocolateIngredientEntity(
  ingredient: IngredientEntity
): ingredient is IChocolateIngredientEntity {
  return ingredient.category === 'chocolate';
}

/**
 * Type guard for {@link Entities.Ingredients.ISugarIngredientEntity | ISugarIngredientEntity}.
 * @param ingredient - Ingredient to check
 * @returns True if the ingredient is a sugar ingredient
 * @public
 */
export function isSugarIngredientEntity(ingredient: IngredientEntity): ingredient is ISugarIngredientEntity {
  return ingredient.category === 'sugar';
}

/**
 * Type guard for {@link Entities.Ingredients.IDairyIngredientEntity | IDairyIngredientEntity}.
 * @param ingredient - Ingredient to check
 * @returns True if the ingredient is a dairy ingredient
 * @public
 */
export function isDairyIngredientEntity(ingredient: IngredientEntity): ingredient is IDairyIngredientEntity {
  return ingredient.category === 'dairy';
}

/**
 * Type guard for {@link Entities.Ingredients.IFatIngredientEntity | IFatIngredientEntity}.
 * @param ingredient - Ingredient to check
 * @returns True if the ingredient is a fat ingredient
 * @public
 */
export function isFatIngredientEntity(ingredient: IngredientEntity): ingredient is IFatIngredientEntity {
  return ingredient.category === 'fat';
}

/**
 * Type guard for {@link Entities.Ingredients.IAlcoholIngredientEntity | IAlcoholIngredientEntity}.
 * @param ingredient - Ingredient to check
 * @returns True if the ingredient is an alcohol ingredient
 * @public
 */
export function isAlcoholIngredientEntity(
  ingredient: IngredientEntity
): ingredient is IAlcoholIngredientEntity {
  return ingredient.category === 'alcohol';
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a blank ingredient entity with sensible defaults.
 * @param baseId - Base identifier for the ingredient
 * @param name - Display name for the ingredient
 * @returns A minimal valid ingredient entity
 * @public
 */
export function createBlankIngredientEntity(baseId: BaseIngredientId, name: string): IIngredientEntity {
  return {
    baseId,
    name,
    category: 'other',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 0 as Percentage,
      milkFat: 0 as Percentage,
      water: 0 as Percentage,
      solids: 0 as Percentage,
      otherFats: 0 as Percentage
    }
  };
}
