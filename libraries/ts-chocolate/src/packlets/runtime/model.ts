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

import { Collections, Result } from '@fgv/ts-utils';

import { IIngredientQuerySpec, IFillingRecipeQuerySpec } from './indexers';
import { IReadOnlyValidatingLibrary } from './validatingLibrary';

import {
  Allergen,
  BaseConfectionId,
  BaseFillingId,
  BaseIngredientId,
  CacaoVariety,
  Celsius,
  Certification,
  ChocolateApplication,
  ChocolateType,
  ConfectionId,
  ConfectionName,
  ConfectionType,
  ConfectionVersionSpec,
  DegreesMacMichael,
  FillingId,
  FillingName,
  FillingVersionId,
  FillingVersionSpec,
  FluidityStars,
  IngredientCategory,
  IngredientId,
  Measurement,
  Percentage,
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
  IComputedScaledFillingRecipe,
  IFillingIngredient,
  IFillingRating,
  IFillingRecipe,
  IFillingRecipeVersion,
  IProcedureRef,
  IScaledFillingIngredient,
  IVersionScaleOptions
} from '../fillings';
import {
  AnyConfectionVersion,
  ConfectionData,
  IAdditionalChocolate,
  IBarTruffle,
  IBarTruffleVersion,
  IBonBonDimensions,
  IChocolateSpec,
  ICoatings,
  IConfectionDecoration,
  IConfectionMoldRef,
  IConfectionYield,
  IFillingSlot,
  IFrameDimensions,
  IMoldedBonBon,
  IMoldedBonBonVersion,
  IRolledTruffle,
  IRolledTruffleVersion
} from '../confections';
import { ICategorizedUrl, IOptionsWithPreferred, MoldId, ProcedureId } from '../common';
import { IFillingRecipeJournalRecord, JournalLibrary } from '../journal';
import { IGanacheCalculation } from '../calculations';
import { IProcedure } from '../procedures';
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

  /**
   * Gets all filling recipes that use this ingredient (primary or alternate).
   */
  usedByFillings(): IRuntimeFillingRecipe[];

  /**
   * Gets filling recipes where this ingredient is the primary choice.
   */
  primaryInFillings(): IRuntimeFillingRecipe[];

  /**
   * Gets filling recipes where this ingredient is listed as an alternate.
   */
  alternateInFillings(): IRuntimeFillingRecipe[];

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
 * Note: Does not extend `IFillingRecipeVersion` because `ingredients` has a different
 * type (resolved vs raw references).
 *
 * @public
 */
export interface IRuntimeFillingRecipeVersion {
  // ---- Identity ----

  /**
   * Qualified identifier for this version (recipeId\@versionSpec).
   */
  readonly versionId: FillingVersionId;

  /**
   * Version spec portion of the identifier.
   */
  readonly versionSpec: FillingVersionSpec;

  /**
   * Date this version was created (ISO 8601 format).
   */
  readonly createdDate: string;

  /**
   * The parent filling ID.
   */
  readonly fillingId: FillingId;

  /**
   * The parent filling recipe - resolved.
   * Enables navigation: `version.fillingRecipe.name`
   */
  readonly fillingRecipe: IRuntimeFillingRecipe;

  // ---- Version Properties (from IFillingRecipeVersion) ----

  /**
   * Base weight of the recipe (sum of all ingredient amounts).
   */
  readonly baseWeight: Measurement;

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
  readonly ratings: ReadonlyArray<IFillingRating>;

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
  ): Result<IterableIterator<IResolvedFillingIngredient<IRuntimeIngredient>>>;

  // ---- Ingredient queries ----

  /**
   * Checks if this version uses a specific ingredient (as primary).
   * @param ingredientId - The ingredient ID to check
   * @returns True if the ingredient is used in this version
   */
  usesIngredient(ingredientId: IngredientId): boolean;

  // ---- Operations ----

  /**
   * Scales this version to a target weight.
   * @param targetWeight - Target total weight in grams
   * @param options - Optional scaling options (precision, minimum amount)
   * @returns Success with RuntimeScaledVersion, or Failure if scaling fails
   */
  scale(
    targetWeight: Measurement,
    options?: IVersionScaleOptions
  ): Result<IRuntimeScaledFillingRecipeVersion>;

  /**
   * Scales this version by a multiplicative factor.
   * @param factor - Multiplicative factor (e.g., 2.0 for double)
   * @param options - Optional scaling options
   * @returns Success with RuntimeScaledVersion, or Failure if scaling fails
   */
  scaleByFactor(factor: number, options?: IVersionScaleOptions): Result<IRuntimeScaledFillingRecipeVersion>;

  /**
   * Calculates ganache characteristics for this version.
   * @returns Success with ganache calculation, or Failure if calculation fails
   */
  calculateGanache(): Result<IGanacheCalculation>;

  // ---- Procedures (resolved) ----

  /**
   * Resolved procedures associated with this version.
   * Undefined if the version has no associated procedures.
   */
  readonly procedures?: IResolvedProcedures;

  // ---- Raw access ----

  /**
   * Gets the underlying raw version data.
   */
  readonly raw: IFillingRecipeVersion;
}

// ============================================================================
// Scaled Recipe Version Types
// ============================================================================

/**
 * Runtime-specific scaling source with resolved version reference.
 * Extends the basic scaling info with a reference to the actual runtime version.
 * @public
 */
export interface IRuntimeScalingSource {
  /**
   * The source version that was scaled - fully resolved.
   */
  readonly sourceVersion: IRuntimeFillingRecipeVersion;

  /**
   * The scaling factor applied.
   */
  readonly scaleFactor: number;

  /**
   * The target weight requested.
   */
  readonly targetWeight: Measurement;
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
export interface IRuntimeScaledFillingRecipeVersion {
  // ---- Scaling Info ----

  /**
   * Information about the source version and scaling parameters.
   * Provides direct access to the resolved source version and scaling metadata.
   */
  readonly scaledFrom: IRuntimeScalingSource;
  /**
   * The target weight that was requested.
   * Convenience accessor for scaledFrom.targetWeight.
   */
  readonly targetWeight: Measurement;

  // ---- Version Properties (from IScaledRecipeVersion) ----

  /**
   * Date this scaled version was created (ISO 8601 format).
   */
  readonly createdDate: string;

  /**
   * Base weight of the scaled recipe (same as targetWeight).
   */
  readonly baseWeight: Measurement;

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
  readonly ratings: ReadonlyArray<IFillingRating>;

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
  readonly weightDifference: Measurement;

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
  readonly raw: IComputedScaledFillingRecipe;
}

// ============================================================================
// Runtime Procedure Reference
// ============================================================================

/**
 * A resolved procedure reference with the full procedure object.
 * Used in runtime recipes to provide direct access to procedure details.
 * @public
 */
export interface IResolvedFillingRecipeProcedure {
  /**
   * The fully resolved procedure object.
   */
  readonly procedure: IProcedure;

  /**
   * Optional notes specific to using this procedure with the recipe.
   */
  readonly notes?: string;

  /**
   * The original raw procedure reference data.
   */
  readonly raw: IProcedureRef;
}

/**
 * Collection of resolved procedures associated with a recipe.
 * @public
 */
export interface IResolvedProcedures {
  /**
   * Available procedures for this recipe - fully resolved.
   */
  readonly procedures: ReadonlyArray<IResolvedFillingRecipeProcedure>;

  /**
   * The recommended/default procedure - fully resolved.
   * Undefined if no recommended procedure is specified.
   */
  readonly recommendedProcedure?: IProcedure;
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
 * - Resolved procedure access
 *
 * Note: Does not extend `IFillingRecipe` because `versions` has a different
 * type (resolved vs raw versions).
 *
 * @public
 */
export interface IRuntimeFillingRecipe {
  // ---- Composite Identity (runtime-specific) ----

  /**
   * The composite recipe ID (e.g., "user.dark-ganache").
   * Combines source and base ID for unique identification across sources.
   */
  readonly id: FillingId;

  /**
   * The source ID part of the composite ID.
   */
  readonly sourceId: SourceId;

  /**
   * The base recipe ID within the source.
   */
  readonly baseId: BaseFillingId;

  // ---- Core Properties (from IFillingRecipe) ----

  /**
   * Human-readable recipe name.
   */
  readonly name: FillingName;

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
  readonly goldenVersionSpec: FillingVersionSpec;

  // ---- Version navigation (resolved) ----

  /**
   * The golden (default approved) version - resolved.
   */
  readonly goldenVersion: IRuntimeFillingRecipeVersion;

  /**
   * All versions - resolved.
   */
  readonly versions: ReadonlyArray<IRuntimeFillingRecipeVersion>;

  /**
   * Gets a specific version by {@link FillingVersionSpec | version specifier}.
   * @param versionSpec - The version specifier to find
   * @returns Success with RuntimeVersion, or Failure if not found
   */
  getVersion(versionSpec: FillingVersionSpec): Result<IRuntimeFillingRecipeVersion>;

  /**
   * Gets the latest version (by created date).
   */
  readonly latestVersion: IRuntimeFillingRecipeVersion;

  /**
   * Number of versions.
   */
  readonly versionCount: number;

  // ---- Ingredient queries ----

  /**
   * Gets unique ingredient IDs used across all versions.
   * By default, returns only preferred ingredients (primary choice for each ingredient slot).
   * Pass `{ includeAlternates: true }` to include all ingredient options.
   * @param options - Query options
   * @returns Set of ingredient IDs
   */
  getIngredientIds(options?: IIngredientQueryOptions): ReadonlySet<IngredientId>;

  /**
   * Checks if any version uses a specific ingredient.
   * By default, only checks preferred ingredients.
   * Pass `{ includeAlternates: true }` to also check alternate ingredients.
   * @param ingredientId - The ingredient ID to check
   * @param options - Query options
   * @returns True if the ingredient is used in any version
   */
  usesIngredient(ingredientId: IngredientId, options?: IIngredientQueryOptions): boolean;

  // ---- Raw access ----

  /**
   * Gets the underlying raw recipe data.
   */
  readonly raw: IFillingRecipe;
}

// ============================================================================
// Resolved Ingredient References
// ============================================================================

/**
 * A resolved ingredient reference with full ingredient data and alternates.
 * This is the primary interface for accessing recipe ingredients in the runtime layer.
 * @public
 */
export interface IResolvedFillingIngredient<TIngredient extends IRuntimeIngredient = IRuntimeIngredient> {
  /**
   * The fully resolved ingredient object
   */
  readonly ingredient: TIngredient;

  /**
   * Amount in grams
   */
  readonly amount: Measurement;

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
  readonly raw: IFillingIngredient;
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
  readonly amount: Measurement;

  /**
   * Original amount before scaling
   */
  readonly originalAmount: Measurement;

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
  readonly raw: IScaledFillingIngredient;
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
// Ingredient Query Options
// ============================================================================

/**
 * Options for ingredient queries on recipes.
 * @public
 */
export interface IIngredientQueryOptions {
  /**
   * If true, include alternate ingredients in addition to preferred.
   * Default is false (only preferred ingredients).
   */
  readonly includeAlternates?: boolean;
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
   * The filling ID where the ingredient is used.
   */
  readonly fillingId: FillingId;

  /**
   * Whether this is a primary ingredient (vs alternate).
   */
  readonly isPrimary: boolean;
}

// ============================================================================
// Internal Context Interfaces
// ============================================================================

/**
 * Minimal context interface for RuntimeScaledVersion.
 * Provides only what a scaled version needs to resolve its dependencies.
 *
 * @typeParam TIngredient - The ingredient type returned by ingredients map
 * @internal
 */
export interface IScaledVersionContext<TIngredient extends IRuntimeIngredient = IRuntimeIngredient> {
  /** Map of all ingredients, keyed by composite ID. */
  readonly ingredients: Collections.IReadOnlyValidatingResultMap<IngredientId, TIngredient>;
  /** Gets the source version for a computed scaled recipe. */
  getSourceVersion(scaled: IComputedScaledFillingRecipe): Result<IRuntimeFillingRecipeVersion>;
}

/**
 * Minimal context interface for RuntimeVersion and RuntimeRecipe.
 * Provides ingredient/recipe resolution and scaled version creation.
 *
 * Generic type parameter allows internal implementations to use concrete types
 * (e.g., `AnyRuntimeIngredient`) while external consumers get abstract interfaces.
 *
 * @typeParam TIngredient - The ingredient type returned by ingredients map
 * @internal
 */
export interface IVersionContext<TIngredient extends IRuntimeIngredient = IRuntimeIngredient>
  extends IScaledVersionContext<TIngredient> {
  /** Map of all fillings, keyed by composite ID. */
  readonly fillings: Collections.IReadOnlyValidatingResultMap<FillingId, IRuntimeFillingRecipe>;
  /** Gets a procedure by its composite ID. */
  getProcedure(id: string): Result<IProcedure>;
}

/**
 * Minimal context interface for RuntimeIngredient.
 * Provides only what an ingredient needs for navigation.
 * @internal
 */
export interface IIngredientContext {
  /** Gets all fillings using this ingredient (primary or alternate). */
  getFillingsUsingIngredient(id: IngredientId): IRuntimeFillingRecipe[];
  /** Gets fillings where this ingredient is primary. */
  getFillingsWithPrimaryIngredient(id: IngredientId): IRuntimeFillingRecipe[];
  /** Gets fillings where this ingredient is an alternate. */
  getFillingsWithAlternateIngredient(id: IngredientId): IRuntimeFillingRecipe[];
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

  // ---- Ingredients and Recipes ----

  /**
   * A searchable library of all ingredients, keyed by composite ID.
   * Ingredients are resolved eagerly on first access and cached.
   * Use `.get(id)` for ID-based lookup, `.find(spec)` for query-based search,
   * `.has(id)` for existence checks, `.values()` for iteration.
   */
  readonly ingredients: IReadOnlyValidatingLibrary<IngredientId, IRuntimeIngredient, IIngredientQuerySpec>;

  /**
   * A searchable library of all fillings, keyed by composite ID.
   * Fillings are resolved eagerly on first access and cached.
   * Use `.get(id)` for ID-based lookup, `.find(spec)` for query-based search,
   * `.has(id)` for existence checks, `.values()` for iteration.
   */
  readonly fillings: IReadOnlyValidatingLibrary<FillingId, IRuntimeFillingRecipe, IFillingRecipeQuerySpec>;

  // ---- Journals ----

  /**
   * The journals library for managing cooking session records.
   * Provides storage and lookup for journal records indexed by journal ID,
   * recipe ID, or version ID.
   */
  readonly journals: JournalLibrary;

  /**
   * Gets all journal records for a filling (across all versions).
   * @param fillingId - The filling ID to search for
   * @returns Array of journal records (empty if none found)
   */
  getJournalsForFilling(fillingId: FillingId): ReadonlyArray<IFillingRecipeJournalRecord>;

  /**
   * Gets all journal records for a specific filling version.
   * @param versionId - The filling version ID to search for
   * @returns Array of journal records (empty if none found)
   */
  getJournalsForFillingVersion(versionId: FillingVersionId): ReadonlyArray<IFillingRecipeJournalRecord>;

  // ---- Reverse Lookups ----

  /**
   * Gets detailed usage information for an ingredient.
   * @param ingredientId - The ingredient ID to look up
   * @returns Success with array of usage info, or Failure if ingredient doesn't exist
   */
  getIngredientUsage(ingredientId: IngredientId): Result<ReadonlyArray<IIngredientUsageInfo>>;

  // ---- Tag Discovery ----

  /**
   * Gets all unique tags used across fillings.
   */
  getAllFillingTags(): ReadonlyArray<string>;

  /**
   * Gets all unique tags used across ingredients.
   */
  getAllIngredientTags(): ReadonlyArray<string>;

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

// ============================================================================
// Runtime Confection Interfaces
// ============================================================================

/**
 * A resolved runtime view of a confection with navigation capabilities.
 *
 * This interface includes all properties from the data layer `IConfectionBase`
 * plus runtime-specific additions:
 * - Composite identity (`id`, `sourceId`) for cross-source references
 * - Version navigation with typed versions
 * - Effective tags/urls (merged from base + version)
 * - Type narrowing methods for discriminated access
 * - Raw access to underlying data
 *
 * @public
 */
export interface IRuntimeConfection {
  // ---- Composite Identity (runtime-specific) ----

  /**
   * The composite confection ID (e.g., "common.dark-dome-bonbon").
   * Combines source and base ID for unique identification across sources.
   */
  readonly id: ConfectionId;

  /**
   * The source ID part of the composite ID.
   */
  readonly sourceId: SourceId;

  /**
   * The base confection ID within the source.
   */
  readonly baseId: BaseConfectionId;

  // ---- Core Properties (from IConfectionBase - identity/metadata only) ----

  /** Confection type (discriminator) */
  readonly confectionType: ConfectionType;

  /** Human-readable name */
  readonly name: ConfectionName;

  /** Optional description */
  readonly description?: string;

  /** Base tags for searching/filtering (version may add more) */
  readonly tags?: ReadonlyArray<string>;

  /** Base URLs (version may add more) */
  readonly urls?: ReadonlyArray<ICategorizedUrl>;

  /** The ID of the golden (approved default) version */
  readonly goldenVersionSpec: ConfectionVersionSpec;

  // ---- Version navigation ----

  /**
   * The golden (default) version.
   */
  readonly goldenVersion: AnyConfectionVersion;

  /**
   * All versions.
   */
  readonly versions: ReadonlyArray<AnyConfectionVersion>;

  /**
   * Gets a specific version by version specifier.
   * @param versionSpec - The version specifier to find
   * @returns Success with version, or Failure if not found
   */
  getVersion(versionSpec: ConfectionVersionSpec): Result<AnyConfectionVersion>;

  // ---- Effective tags/urls (merged from base + version) ----

  /**
   * Gets effective tags for the golden version (base + version's additional tags).
   */
  readonly effectiveTags: ReadonlyArray<string>;

  /**
   * Gets effective URLs for the golden version (base + version's additional URLs).
   */
  readonly effectiveUrls: ReadonlyArray<ICategorizedUrl>;

  /**
   * Gets effective tags for a specific version.
   * @param version - The version to get tags for (defaults to golden version)
   */
  getEffectiveTags(version?: AnyConfectionVersion): ReadonlyArray<string>;

  /**
   * Gets effective URLs for a specific version.
   * @param version - The version to get URLs for (defaults to golden version)
   */
  getEffectiveUrls(version?: AnyConfectionVersion): ReadonlyArray<ICategorizedUrl>;

  // ---- Convenience accessors for golden version properties ----

  /** Decorations from the golden version */
  readonly decorations?: ReadonlyArray<IConfectionDecoration>;

  /** Yield specification from the golden version */
  readonly yield: IConfectionYield;

  /** Filling slots from the golden version */
  readonly fillings?: ReadonlyArray<IFillingSlot>;

  /** Procedures from the golden version */
  readonly procedures?: IOptionsWithPreferred<IProcedureRef, ProcedureId>;

  // ---- Type narrowing methods ----

  /**
   * Returns true if this is a molded bonbon confection.
   * When true, molded bonbon-specific properties are available.
   */
  isMoldedBonBon(): this is IRuntimeMoldedBonBon;

  /**
   * Returns true if this is a bar truffle confection.
   * When true, bar truffle-specific properties are available.
   */
  isBarTruffle(): this is IRuntimeBarTruffle;

  /**
   * Returns true if this is a rolled truffle confection.
   * When true, rolled truffle-specific properties are available.
   */
  isRolledTruffle(): this is IRuntimeRolledTruffle;

  // ---- Raw access ----

  /**
   * Gets the underlying raw confection data.
   */
  readonly raw: ConfectionData;
}

/**
 * Runtime confection narrowed to molded bonbon type.
 * @public
 */
export interface IRuntimeMoldedBonBon extends IRuntimeConfection {
  /** Type is always 'molded-bonbon' for this confection */
  readonly confectionType: 'molded-bonbon';

  /** Golden version typed as IMoldedBonBonVersion */
  readonly goldenVersion: IMoldedBonBonVersion;

  /** All versions typed as IMoldedBonBonVersion */
  readonly versions: ReadonlyArray<IMoldedBonBonVersion>;

  /** Molds from the golden version */
  readonly molds: IOptionsWithPreferred<IConfectionMoldRef, MoldId>;

  /** Shell chocolate from the golden version */
  readonly shellChocolate: IChocolateSpec;

  /** Additional chocolates from the golden version */
  readonly additionalChocolates?: ReadonlyArray<IAdditionalChocolate>;

  /** Raw data typed to IMoldedBonBon */
  readonly raw: IMoldedBonBon;
}

/**
 * Runtime confection narrowed to bar truffle type.
 * @public
 */
export interface IRuntimeBarTruffle extends IRuntimeConfection {
  /** Type is always 'bar-truffle' for this confection */
  readonly confectionType: 'bar-truffle';

  /** Golden version typed as IBarTruffleVersion */
  readonly goldenVersion: IBarTruffleVersion;

  /** All versions typed as IBarTruffleVersion */
  readonly versions: ReadonlyArray<IBarTruffleVersion>;

  /** Frame dimensions from the golden version */
  readonly frameDimensions: IFrameDimensions;

  /** Single bonbon dimensions from the golden version */
  readonly singleBonBonDimensions: IBonBonDimensions;

  /** Enrobing chocolate from the golden version */
  readonly enrobingChocolate?: IChocolateSpec;

  /** Raw data typed to IBarTruffle */
  readonly raw: IBarTruffle;
}

/**
 * Runtime confection narrowed to rolled truffle type.
 * @public
 */
export interface IRuntimeRolledTruffle extends IRuntimeConfection {
  /** Type is always 'rolled-truffle' for this confection */
  readonly confectionType: 'rolled-truffle';

  /** Golden version typed as IRolledTruffleVersion */
  readonly goldenVersion: IRolledTruffleVersion;

  /** All versions typed as IRolledTruffleVersion */
  readonly versions: ReadonlyArray<IRolledTruffleVersion>;

  /** Enrobing chocolate from the golden version */
  readonly enrobingChocolate?: IChocolateSpec;

  /** Coatings from the golden version */
  readonly coatings?: ICoatings;

  /** Raw data typed to IRolledTruffle */
  readonly raw: IRolledTruffle;
}

// ============================================================================
// Confection Context Interface
// ============================================================================

/**
 * Minimal context interface for RuntimeConfection.
 * Provides only what a confection needs for navigation.
 * @internal
 */
export interface IConfectionContext {
  // Currently empty - confections don't have navigation to other entities yet
  // This can be extended when confection → recipe/ingredient navigation is needed
}
