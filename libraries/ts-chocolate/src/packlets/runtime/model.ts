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
 * Semantic model interfaces for the runtime object access layer.
 *
 * These interfaces define the **semantic contract** for runtime objects.
 * They are the source of truth - classes implement these interfaces.
 * Documentation lives here, with `@inheritdoc` used in implementing classes.
 *
 * @packageDocumentation
 */

import { Result } from '@fgv/ts-utils';

import {
  Allergen,
  BaseIngredientId,
  BaseRecipeId,
  CacaoVariety,
  Celsius,
  Certification,
  ChocolateApplication,
  ChocolateType,
  DegreesMacMichael,
  FluidityStars,
  Grams,
  IngredientCategory,
  IngredientId,
  Percentage,
  RecipeId,
  RecipeName,
  RecipeVersionSpec,
  SourceId
} from '../common';
import {
  IAlcoholIngredient,
  IChocolateIngredient,
  IDairyIngredient,
  IFatIngredient,
  IGanacheCharacteristics,
  Ingredient,
  ISugarIngredient,
  ITemperatureCurve
} from '../ingredients';
import {
  IRecipe,
  IRecipeIngredient,
  IRecipeScaleOptions,
  IRecipeUsage,
  IRecipeVersion,
  IScaledRecipeIngredient,
  IScaledRecipeVersion,
  IScalingSource,
  IRecipeRating as IRecipeRating
} from '../recipes';
import { IGanacheCalculation } from '../calculations';
import { ChocolateLibrary } from './chocolateLibrary';

// ============================================================================
// Runtime Ingredient Interfaces
// ============================================================================

/**
 * A resolved runtime view of an ingredient with navigation capabilities.
 *
 * This interface includes all properties from the data layer `IIngredient`
 * plus runtime-specific additions:
 * - Composite identity (`id`, `sourceId`) for cross-source references
 * - Navigation to recipes that use this ingredient
 * - Type narrowing methods for discriminated access
 * - Raw access to underlying data
 *
 * Note: Does not extend `IIngredient` directly because the class implementation
 * provides the same shape but with additional runtime behavior.
 *
 * @public
 */
export interface IRuntimeIngredient {
  // ---- Composite Identity (runtime-specific) ----

  /**
   * The composite ingredient ID (e.g., "felchlin.maracaibo-65").
   * Combines source and base ID for unique identification across sources.
   */
  readonly id: IngredientId;

  /**
   * The source ID part of the composite ID.
   */
  readonly sourceId: SourceId;

  /**
   * The base ingredient ID within the source.
   */
  readonly baseId: BaseIngredientId;

  // ---- Core Properties (from IIngredient) ----

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

  // ---- Navigation (runtime-specific) ----
  // TODO: should either not exist or should return IRecipe instead of just the ID
  /**
   * IDs of all recipes that use this ingredient (primary or alternate).
   */
  readonly usedByRecipeIds: ReadonlySet<RecipeId>;

  /**
   * IDs of recipes where this ingredient is the primary choice.
   */
  readonly primaryInRecipeIds: ReadonlySet<RecipeId>;

  /**
   * IDs of recipes where this ingredient is listed as an alternate.
   */
  readonly alternateInRecipeIds: ReadonlySet<RecipeId>;

  // ---- Type narrowing methods ----

  /**
   * Returns true if this is a chocolate ingredient.
   * When true, chocolate-specific properties are available.
   */
  isChocolate(): this is IRuntimeChocolateIngredient;

  /**
   * Returns true if this is a dairy ingredient.
   * When true, dairy-specific properties are available.
   */
  isDairy(): this is IRuntimeDairyIngredient;

  /**
   * Returns true if this is a sugar ingredient.
   * When true, sugar-specific properties are available.
   */
  isSugar(): this is IRuntimeSugarIngredient;

  /**
   * Returns true if this is a fat ingredient.
   * When true, fat-specific properties are available.
   */
  isFat(): this is IRuntimeFatIngredient;

  /**
   * Returns true if this is an alcohol ingredient.
   * When true, alcohol-specific properties are available.
   */
  isAlcohol(): this is IRuntimeAlcoholIngredient;

  // ---- Raw access ----

  /**
   * Gets the underlying raw ingredient data.
   */
  readonly raw: Ingredient;
}

/**
 * Runtime ingredient narrowed to chocolate type.
 * @public
 */
export interface IRuntimeChocolateIngredient extends IRuntimeIngredient {
  /** Category is always chocolate for this type */
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
  readonly origins?: ReadonlyArray<string>;

  /**
   * {@inheritdoc Runtime.IRuntimeIngredient.raw}
   */
  readonly raw: IChocolateIngredient;
}

/**
 * Runtime ingredient narrowed to dairy type.
 * @public
 */
export interface IRuntimeDairyIngredient extends IRuntimeIngredient {
  /** Category is always dairy for this type */
  readonly category: 'dairy';

  /** Fat content percentage */
  readonly fatContent?: Percentage;

  /** Water content percentage */
  readonly waterContent?: Percentage;

  /**
   * {@inheritdoc Runtime.IRuntimeIngredient.raw}
   */
  readonly raw: IDairyIngredient;
}

/**
 * Runtime ingredient narrowed to sugar type.
 * @public
 */
export interface IRuntimeSugarIngredient extends IRuntimeIngredient {
  /** Category is always sugar for this type */
  readonly category: 'sugar';

  /** Hydration number (water molecules per sugar molecule) */
  readonly hydrationNumber?: number;

  /** Sweetness potency relative to sucrose (1.0 = sucrose) */
  readonly sweetnessPotency?: number;

  /**
   * {@inheritdoc Runtime.IRuntimeIngredient.raw}
   */
  readonly raw: ISugarIngredient;
}

/**
 * Runtime ingredient narrowed to fat type.
 * @public
 */
export interface IRuntimeFatIngredient extends IRuntimeIngredient {
  /** Category is always fat for this type */
  readonly category: 'fat';

  /** Melting point in Celsius */
  readonly meltingPoint?: Celsius;

  /**
   * {@inheritdoc Runtime.IRuntimeIngredient.raw}
   */
  readonly raw: IFatIngredient;
}

/**
 * Runtime ingredient narrowed to alcohol type.
 * @public
 */
export interface IRuntimeAlcoholIngredient extends IRuntimeIngredient {
  /** Category is always alcohol for this type */
  readonly category: 'alcohol';

  /** Alcohol by volume percentage */
  readonly alcoholByVolume?: Percentage;

  /** Flavor profile description (optional) */
  readonly flavorProfile?: string;

  /**
   * {@inheritdoc Runtime.IRuntimeIngredient.raw}
   */
  readonly raw: IAlcoholIngredient;
}

// ============================================================================
// Recipe Ingredient Filters
// ============================================================================

/**
 * Filter by ingredient category.
 * @public
 */
export interface ICategoryFilter {
  /**
   * Category to match (literal or regex).
   * - Literal: exact category match (e.g., 'chocolate')
   * - RegExp: pattern match against category string
   */
  readonly category: IngredientCategory | RegExp;
}

/**
 * Filter for recipe ingredients.
 * - string: Match ingredient ID exactly
 * - RegExp: Match ingredient ID by pattern
 * - ICategoryFilter: Match by category
 * @public
 */
export type RecipeIngredientsFilter = string | RegExp | ICategoryFilter;

// ============================================================================
// Runtime Version Interfaces
// ============================================================================

/**
 * A resolved runtime view of a recipe version with resolved ingredients.
 *
 * This interface provides runtime-layer access to version data with:
 * - Parent recipe reference (both ID and resolved object)
 * - Resolved ingredient access via flexible filtering
 * - Ganache calculation
 *
 * Note: Does not extend `IRecipeVersion` because `ingredients` has a different
 * type (resolved vs raw references).
 *
 * @public
 */
export interface IRuntimeRecipeVersion {
  // ---- Identity ----

  // TODO: consider adding the qualified RecipeVersionId here as well

  /**
   * Unique identifier for this version.
   */
  readonly versionSpec: RecipeVersionSpec;

  /**
   * Date this version was created (ISO 8601 format).
   */
  readonly createdDate: string;

  /**
   * The parent recipe ID.
   */
  readonly recipeId: RecipeId;

  /**
   * The parent recipe - resolved.
   * Enables navigation: `version.recipe.name`
   */
  readonly recipe: IRuntimeRecipe;

  // ---- Version Properties (from IRecipeVersion) ----

  /**
   * Base weight of the recipe (sum of all ingredient amounts).
   */
  readonly baseWeight: Grams;

  /**
   * Optional yield description (e.g., "50 bonbons").
   */
  readonly yield?: string;

  /**
   * Optional notes about this version.
   */
  readonly notes?: string;

  /**
   * Optional ratings for this version.
   */
  readonly ratings: ReadonlyArray<IRecipeRating>;

  // ---- Resolved ingredients ----

  /**
   * Gets ingredients, optionally filtered.
   *
   * @param filter - Optional array of filters (OR semantics)
   *   - `undefined`/omitted: returns all ingredients
   *   - Empty array `[]`: returns nothing (empty iterator)
   *   - Non-empty array: returns ingredients matching at least one filter
   *
   * Filter types:
   *   - `string`: Match ingredient ID exactly
   *   - `RegExp`: Match ingredient ID by pattern
   *   - `ICategoryFilter`: Match by category (literal or regex)
   *
   * @returns Success with matching ingredients iterator, or Failure if resolution fails
   *
   * @example
   * ```typescript
   * // All ingredients
   * for (const ri of version.getIngredients().orThrow()) { ... }
   *
   * // Chocolate ingredients only
   * version.getIngredients([{ category: 'chocolate' }])
   *
   * // Multiple specific ingredients
   * version.getIngredients(['felchlin.maracaibo-65', 'valrhona.guanaja-70'])
   *
   * // Pattern matching
   * version.getIngredients([/^felchlin\./])
   *
   * // Mix of filters (OR semantics)
   * version.getIngredients(['specific-id', { category: 'dairy' }, /^valrhona\./])
   * ```
   */
  getIngredients(
    filter?: RecipeIngredientsFilter[]
  ): Result<IterableIterator<IResolvedRecipeIngredient<IRuntimeIngredient>>>;

  // ---- Operations ----

  /**
   * Calculates ganache characteristics for this version.
   * @returns Success with ganache calculation, or Failure if calculation fails
   */
  calculateGanache(): Result<IGanacheCalculation>;

  // ---- Raw access ----

  /**
   * Gets the underlying raw version data.
   */
  readonly raw: IRecipeVersion;
}

/**
 * A resolved runtime view of a scaled recipe version.
 *
 * This interface provides runtime-layer access to scaled version data with:
 * - Source recipe/version tracking
 * - Resolved scaled ingredient access via flexible filtering
 * - Scaling metadata
 * - Ganache calculation using scaled amounts
 *
 * Note: Does not extend `IScaledRecipeVersion` because `ingredients` has a different
 * type (resolved vs raw references).
 *
 * @public
 */
export interface IRuntimeScaledRecipeVersion {
  // ---- Scaling Info ----

  // TODO: this should be a runtime-specific scaling source with a link to the actual recipe version and not just ids
  /**
   * Information about the source recipe and version that was scaled.
   */
  readonly scaledFrom: IScalingSource;

  // TODO: redundant with scaledFrom - remove
  /**
   * The base recipe ID this was scaled from.
   */
  readonly sourceRecipeId: BaseRecipeId;

  // TODO: redundant with scaledFrom - remove
  /**
   * The version ID that was scaled.
   */
  readonly sourceVersionSpec: RecipeVersionSpec;

  // TODO: redundant with scaledFrom - remove
  /**
   * The scaling factor that was applied.
   */
  readonly scaleFactor: number;

  // TODO: redundant with scaledFrom - remove
  /**
   * The target weight that was requested.
   */
  readonly targetWeight: Grams;

  // ---- Version Properties (from IScaledRecipeVersion) ----

  /**
   * Date this scaled version was created (ISO 8601 format).
   */
  readonly createdDate: string;

  /**
   * Base weight of the scaled recipe (same as targetWeight).
   */
  readonly baseWeight: Grams;

  /**
   * Optional yield description (may be scaled from original).
   */
  readonly yield?: string;

  /**
   * Optional notes from the source version.
   */
  readonly notes?: string;

  /**
   * Optional ratings from the source version.
   */
  readonly ratings: ReadonlyArray<IRecipeRating>;

  // ---- Resolved ingredients ----

  /**
   * Gets ingredients, optionally filtered.
   *
   * @param filter - Optional array of filters (OR semantics)
   *   - `undefined`/omitted: returns all ingredients
   *   - Empty array `[]`: returns nothing (empty iterator)
   *   - Non-empty array: returns ingredients matching at least one filter
   *
   * Filter types:
   *   - `string`: Match ingredient ID exactly
   *   - `RegExp`: Match ingredient ID by pattern
   *   - `ICategoryFilter`: Match by category (literal or regex)
   *
   * @returns Success with matching ingredients iterator, or Failure if resolution fails
   *
   * @example
   * ```typescript
   * // All scaled ingredients
   * for (const ri of scaled.getIngredients().orThrow()) {
   *   console.log(`${ri.ingredient.name}: ${ri.originalAmount}g → ${ri.amount}g`);
   * }
   *
   * // Chocolate ingredients only
   * scaled.getIngredients([{ category: 'chocolate' }])
   * ```
   */
  getIngredients(
    filter?: RecipeIngredientsFilter[]
  ): Result<IterableIterator<IResolvedScaledIngredient<IRuntimeIngredient>>>;

  // ---- Scaling info ----

  /**
   * Gets the total weight difference from the original.
   */
  readonly weightDifference: Grams;

  // ---- Operations ----

  /**
   * Calculates ganache characteristics for this scaled version.
   * Uses the scaled amounts, not original amounts.
   * @returns Success with ganache calculation, or Failure if calculation fails
   */
  calculateGanache(): Result<IGanacheCalculation>;

  // ---- Raw access ----

  /**
   * Gets the underlying raw scaled version data.
   */
  readonly raw: IScaledRecipeVersion;
}

// ============================================================================
// Runtime Recipe Interface
// ============================================================================

/**
 * A resolved runtime view of a recipe with navigation and version access.
 *
 * This interface provides runtime-layer access to recipe data with:
 * - Composite identity (`id`, `sourceId`) for cross-source references
 * - Resolved version access (full objects, not just raw data)
 * - Scaling and calculation operations
 * - Usage and ingredient queries
 *
 * Note: Does not extend `IRecipe` because `versions` has a different
 * type (resolved vs raw versions).
 *
 * @public
 */
// TODO: we have a bunch of "for version" methods, which seems like a poor separation of concerns.  We should have "getVersion" and the version object should have those methods.
export interface IRuntimeRecipe {
  // ---- Composite Identity (runtime-specific) ----

  /**
   * The composite recipe ID (e.g., "user.dark-ganache").
   * Combines source and base ID for unique identification across sources.
   */
  readonly id: RecipeId;

  /**
   * The source ID part of the composite ID.
   */
  readonly sourceId: SourceId;

  /**
   * The base recipe ID within the source.
   */
  readonly baseId: BaseRecipeId;

  // ---- Core Properties (from IRecipe) ----

  /**
   * Human-readable recipe name.
   */
  readonly name: RecipeName;

  /**
   * Optional description of the recipe.
   */
  readonly description?: string;

  /**
   * Optional tags for categorization and search.
   */
  readonly tags?: ReadonlyArray<string>;

  /**
   * The ID of the golden (approved default) version.
   */
  readonly goldenVersionSpec: RecipeVersionSpec;

  /**
   * Raw usage history for all versions of this recipe.
   */
  readonly usage: ReadonlyArray<IRecipeUsage>;

  // ---- Version navigation (resolved) ----

  /**
   * The golden (default approved) version - resolved.
   */
  readonly goldenVersion: IRuntimeRecipeVersion;

  /**
   * All versions - resolved.
   */
  readonly versions: ReadonlyArray<IRuntimeRecipeVersion>;

  /**
   * Gets a specific version by {@link RecipeVersionSpec | version specifier}.
   * @param versionSpec - The version specifier to find
   * @returns Success with RuntimeVersion, or Failure if not found
   */
  getVersion(versionSpec: RecipeVersionSpec): Result<IRuntimeRecipeVersion>;

  /**
   * Gets the latest version (by created date).
   */
  readonly latestVersion: IRuntimeRecipeVersion;

  /**
   * Number of versions.
   */
  readonly versionCount: number;

  // ---- Usage helpers ----

  /**
   * Whether this recipe has ever been used.
   */
  readonly hasBeenUsed: boolean;

  /**
   * Number of times this recipe has been used.
   */
  readonly usageCount: number;

  /**
   * Gets the most recent usage record.
   */
  readonly latestUsage: IRecipeUsage | undefined;

  // ---- Ingredient queries ----

  /**
   * Gets all unique ingredient IDs used across all versions (primary only).
   */
  readonly allIngredientIds: ReadonlySet<IngredientId>;

  /**
   * Checks if any version uses a specific ingredient (as primary).
   * @param ingredientId - The ingredient ID to check
   * @returns True if the ingredient is used in any version
   */
  usesIngredient(ingredientId: IngredientId): boolean;

  /**
   * Gets resolved ingredients from the golden version.
   * Convenience method - same as goldenVersion.ingredients
   */
  readonly ingredients: ReadonlyArray<IResolvedRecipeIngredient<IRuntimeIngredient>>;

  // ---- Operations ----

  /**
   * Scales the golden version to a target weight.
   * @param targetWeight - Target total weight in grams
   * @param options - Optional scaling options
   * @returns Success with RuntimeScaledVersion, or Failure if scaling fails
   */
  scale(targetWeight: Grams, options?: IRecipeScaleOptions): Result<IRuntimeScaledRecipeVersion>;

  /**
   * Scales a specific version to a target weight.
   * @param versionSpec - The version to scale
   * @param targetWeight - Target total weight in grams
   * @param options - Optional scaling options (versionSpec will be overridden)
   * @returns Success with RuntimeScaledVersion, or Failure if scaling fails
   */
  scaleVersion(
    versionSpec: RecipeVersionSpec,
    targetWeight: Grams,
    options?: Omit<IRecipeScaleOptions, 'versionSpec'>
  ): Result<IRuntimeScaledRecipeVersion>;

  /**
   * Scales by a multiplicative factor.
   * @param factor - Multiplicative factor (e.g., 2.0 for double)
   * @param options - Optional scaling options
   * @returns Success with RuntimeScaledVersion, or Failure if scaling fails
   */
  scaleByFactor(factor: number, options?: IRecipeScaleOptions): Result<IRuntimeScaledRecipeVersion>;

  /**
   * Calculates ganache characteristics for the golden version.
   * @returns Success with ganache calculation, or Failure if calculation fails
   */
  calculateGanache(): Result<IGanacheCalculation>;

  /**
   * Calculates ganache characteristics for a specific version.
   * @param versionSpec - The version to analyze
   * @returns Success with ganache calculation, or Failure if calculation fails
   */
  calculateGanacheForVersion(versionSpec: RecipeVersionSpec): Result<IGanacheCalculation>;

  // ---- Raw access ----

  /**
   * Gets the underlying raw recipe data.
   */
  readonly raw: IRecipe;
}

// ============================================================================
// Resolved Ingredient References
// ============================================================================

/**
 * A resolved ingredient reference with full ingredient data and alternates.
 * This is the primary interface for accessing recipe ingredients in the runtime layer.
 * @public
 */
export interface IResolvedRecipeIngredient<TIngredient extends IRuntimeIngredient = IRuntimeIngredient> {
  /**
   * The fully resolved ingredient object
   */
  readonly ingredient: TIngredient;

  /**
   * Amount in grams
   */
  readonly amount: Grams;

  /**
   * Optional notes for this specific ingredient usage
   */
  readonly notes?: string;

  /**
   * Resolved alternate ingredients that can substitute for the primary
   */
  readonly alternates: ReadonlyArray<TIngredient>;

  /**
   * The original raw ingredient reference data
   */
  readonly raw: IRecipeIngredient;
}

/**
 * A resolved scaled ingredient with both original and scaled amounts.
 * @public
 */
export interface IResolvedScaledIngredient<TIngredient extends IRuntimeIngredient = IRuntimeIngredient> {
  /**
   * The fully resolved ingredient object
   */
  readonly ingredient: TIngredient;

  /**
   * Scaled amount in grams (after applying scale factor)
   */
  readonly amount: Grams;

  /**
   * Original amount before scaling
   */
  readonly originalAmount: Grams;

  /**
   * The scale factor that was applied
   */
  readonly scaleFactor: number;

  /**
   * Optional notes for this ingredient usage
   */
  readonly notes?: string;

  /**
   * Resolved alternate ingredients
   */
  readonly alternates: ReadonlyArray<TIngredient>;

  /**
   * The original raw scaled ingredient reference data
   */
  readonly raw: IScaledRecipeIngredient;
}

// ============================================================================
// Resolution Status
// ============================================================================

/**
 * Status of a resolution attempt for an ingredient
 * @public
 */
export type ResolutionStatus = 'resolved' | 'missing' | 'error';

/**
 * Result of attempting to resolve an ingredient reference.
 * Used when partial resolution is acceptable (e.g., for alternates).
 * @public
 */
export interface IIngredientResolutionResult<TIngredient extends IRuntimeIngredient = IRuntimeIngredient> {
  /**
   * The resolution status
   */
  readonly status: ResolutionStatus;

  /**
   * The resolved ingredient (if status is 'resolved')
   */
  readonly ingredient?: TIngredient;

  /**
   * Error message (if status is 'missing' or 'error')
   */
  readonly error?: string;
}

// ============================================================================
// Query Result Types
// ============================================================================

/**
 * Result of a query execution with metadata
 * @public
 */
export interface IQueryResult<T> {
  /**
   * The matched items
   */
  readonly items: ReadonlyArray<T>;

  /**
   * Total count of items before pagination (if applicable)
   */
  readonly totalCount: number;

  /**
   * Whether there are more items available (for pagination)
   */
  readonly hasMore: boolean;
}

// ============================================================================
// Filter Predicate Types
// ============================================================================

// Note: FilterPredicate is defined in queries/filters.ts to avoid duplication

/**
 * Comparison operators for numeric filters
 * @public
 */
export type ComparisonOperator = 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge';

/**
 * Range specification for numeric filtering
 * @public
 */
export interface INumericRange {
  /**
   * Minimum value (inclusive)
   */
  readonly min?: number;

  /**
   * Maximum value (inclusive)
   */
  readonly max?: number;
}

// ============================================================================
// Iteration Support
// ============================================================================

/**
 * Options for iterating over runtime entities
 * @public
 */
export interface IIterationOptions {
  /**
   * Maximum number of items to return
   */
  readonly limit?: number;

  /**
   * Number of items to skip
   */
  readonly offset?: number;
}

// ============================================================================
// Ingredient Usage Info (for reverse lookups)
// ============================================================================

/**
 * Information about how an ingredient is used in a recipe.
 * @public
 */
export interface IIngredientUsageInfo {
  /**
   * The recipe ID where the ingredient is used.
   */
  readonly recipeId: RecipeId;

  /**
   * Whether this is a primary ingredient (vs alternate).
   */
  readonly isPrimary: boolean;
}

// ============================================================================
// Runtime Context Interface
// ============================================================================

/**
 * Central context for the runtime object access layer.
 *
 * Provides:
 * - Primary resolution methods for ingredients and recipes
 * - Reverse lookups (ingredient → recipes, tag → entities)
 * - Recipe operations (scaling, ganache calculation)
 * - Cache management
 * - Iteration over all entities
 *
 * This is the main entry point for consumers who want resolved views
 * of recipes and ingredients with automatic reference resolution.
 *
 * @public
 */
export interface IRuntimeContext {
  // ---- Library Access ----

  /**
   * The underlying ChocolateLibrary for direct access when needed.
   */
  readonly library: ChocolateLibrary;

  // ---- Primary Resolution ----

  /**
   * Gets a resolved runtime ingredient by ID.
   * Results are cached for efficient repeated access.
   * @param id - Composite ingredient ID
   * @returns Success with RuntimeIngredient, or Failure if not found
   */
  getIngredient(id: IngredientId): Result<IRuntimeIngredient>;

  /**
   * Gets a resolved runtime recipe by ID.
   * Results are cached for efficient repeated access.
   * @param id - Composite recipe ID
   * @returns Success with RuntimeRecipe, or Failure if not found
   */
  getRecipe(id: RecipeId): Result<IRuntimeRecipe>;

  /**
   * Checks if an ingredient exists.
   * @param id - Composite ingredient ID
   * @returns True if ingredient exists
   */
  hasIngredient(id: IngredientId): boolean;

  /**
   * Checks if a recipe exists.
   * @param id - Composite recipe ID
   * @returns True if recipe exists
   */
  hasRecipe(id: RecipeId): boolean;

  // ---- Iteration ----

  /*
   * TODO: consider exposing ingredients and recipes as a ReadOnlyValidatingResultMap instead of just an iterator.
   * We could:
   * 1. add a type guard to distinguish runtime from data-layer entities (e.g. using instanceof)
   * 2. populate the recipe & ingredient maps with the data-layer entities at construction
   * 3. lazily resolve to runtime entities on get() calls
   * 4. expose as ReadOnlyValidatingResultMap<IngredientId, IRuntimeIngredient> and ReadOnlyValidatingResultMap<RecipeId, IRuntimeRecipe>
   * This would provide map-like access with caching, while still allowing iteration.
   *
   * We will probably want to create a LazyLoadingResultMap, possibly in ts-utils, to encapsulate the lazy loading logic.
   */
  /**
   * Iterates over all ingredients as RuntimeIngredient objects.
   * Note: This resolves ingredients lazily as you iterate.
   */
  ingredients(): IterableIterator<IRuntimeIngredient>;

  /**
   * Iterates over all recipes as RuntimeRecipe objects.
   * Note: This resolves recipes lazily as you iterate.
   */
  recipes(): IterableIterator<IRuntimeRecipe>;

  /**
   * Gets all ingredients as an array.
   */
  getAllIngredients(): IRuntimeIngredient[];

  /**
   * Gets all recipes as an array.
   */
  getAllRecipes(): IRuntimeRecipe[];

  // ---- Reverse Lookups ----

  // TODO: boil these down to a unified find method with parameters per entity type.  I think we only need to resolve the entity (so just drop the id versions)
  /**
   * Gets recipe IDs that use a specific ingredient (primary or alternate).
   * @param ingredientId - The ingredient ID to look up
   * @returns Success with set of recipe IDs, or Failure if ingredient doesn't exist
   */
  getRecipeIdsUsingIngredient(ingredientId: IngredientId): Result<ReadonlySet<RecipeId>>;

  /**
   * Gets recipe IDs where ingredient is primary.
   * @param ingredientId - The ingredient ID to look up
   * @returns Success with set of recipe IDs, or Failure if ingredient doesn't exist
   */
  getRecipeIdsWithPrimaryIngredient(ingredientId: IngredientId): Result<ReadonlySet<RecipeId>>;

  /**
   * Gets recipe IDs where ingredient is an alternate.
   * @param ingredientId - The ingredient ID to look up
   * @returns Success with set of recipe IDs, or Failure if ingredient doesn't exist
   */
  getRecipeIdsWithAlternateIngredient(ingredientId: IngredientId): Result<ReadonlySet<RecipeId>>;

  /**
   * Finds all recipes that use a specific ingredient.
   * @param ingredientId - The ingredient ID to look up
   * @returns Success with array of RuntimeRecipe objects, or Failure if ingredient doesn't exist
   */
  findRecipesUsingIngredient(ingredientId: IngredientId): Result<IRuntimeRecipe[]>;

  /**
   * Gets detailed usage information for an ingredient.
   * @param ingredientId - The ingredient ID to look up
   * @returns Success with array of usage info, or Failure if ingredient doesn't exist
   */
  getIngredientUsage(ingredientId: IngredientId): Result<ReadonlyArray<IIngredientUsageInfo>>;

  // ---- Tag Lookups ----

  /**
   * Finds all recipes with a specific tag.
   * @param tag - The tag to search for
   * @returns Success with array of RuntimeRecipe objects, or Failure if tag is unknown
   */
  findRecipesByTag(tag: string): Result<IRuntimeRecipe[]>;

  /**
   * Finds all ingredients with a specific tag.
   * @param tag - The tag to search for
   * @returns Success with array of RuntimeIngredient objects, or Failure if tag is unknown
   */
  findIngredientsByTag(tag: string): Result<IRuntimeIngredient[]>;

  /**
   * Gets all unique tags used across recipes.
   */
  getAllRecipeTags(): ReadonlyArray<string>;

  /**
   * Gets all unique tags used across ingredients.
   */
  getAllIngredientTags(): ReadonlyArray<string>;

  // ---- Chocolate Type Lookups ----

  /**
   * Finds all recipes containing a specific chocolate type.
   * @param type - The chocolate type to search for
   * @returns Array of RuntimeRecipe objects
   */
  findRecipesByChocolateType(type: ChocolateType): IRuntimeRecipe[];

  // ---- Operations ----

  // TODO: consider removing these - we can get the recipe and then chain any other operations.
  /**
   * Scales a recipe to a target weight.
   * @param recipeId - Recipe ID to scale
   * @param targetWeight - Target total weight in grams
   * @param options - Optional scaling options
   * @returns Success with RuntimeScaledVersion, or Failure
   */
  scaleRecipe(
    recipeId: RecipeId,
    targetWeight: Grams,
    options?: IRecipeScaleOptions
  ): Result<IRuntimeScaledRecipeVersion>;

  /**
   * Calculates ganache characteristics for a recipe.
   * @param recipeId - Recipe ID to analyze
   * @param versionSpec - Optional version ID (default: golden version)
   * @returns Success with ganache calculation, or Failure
   */
  calculateGanache(recipeId: RecipeId, versionSpec?: RecipeVersionSpec): Result<IGanacheCalculation>;

  /**
   * Calculates ganache for a specific version.
   * @param recipeId - Recipe ID
   * @param versionSpec - Version ID to analyze
   * @returns Success with ganache calculation, or Failure
   */
  calculateGanacheForVersion(recipeId: RecipeId, versionSpec: RecipeVersionSpec): Result<IGanacheCalculation>;

  // ---- Cache Management ----

  /**
   * Gets the number of cached ingredients.
   */
  readonly cachedIngredientCount: number;

  /**
   * Gets the number of cached recipes.
   */
  readonly cachedRecipeCount: number;

  /**
   * Clears all cached runtime objects.
   * Use if underlying library data has changed.
   */
  clearCache(): void;

  /**
   * Pre-warms the reverse indexes for efficient queries.
   */
  warmUp(): void;
}
