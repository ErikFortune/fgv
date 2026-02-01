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
import type { IRuntimeMold } from './molds/model';
import type { IRuntimeProcedure } from './procedures/model';

import {
  AdditionalChocolatePurpose,
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
  SlotId,
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
} from '../entities';
import {
  IComputedScaledFillingRecipe,
  IFillingIngredient,
  IFillingRating,
  IFillingRecipe,
  IFillingRecipeVersion,
  IProcedureRef,
  IScaledFillingIngredient
} from '../entities';
import { IVersionScaleOptions } from '../calculations';
import {
  AnyConfectionVersion,
  ConfectionData,
  FillingOptionId,
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
  IIngredientFillingOption,
  IMoldedBonBon,
  IMoldedBonBonVersion,
  IRecipeFillingOption,
  IRolledTruffle,
  IRolledTruffleVersion
} from '../entities';
import { ICategorizedUrl, IOptionsWithPreferred, MoldId, ProcedureId } from '../common';
import { AnyFillingJournalEntry, JournalLibrary } from '../entities';
import { IGanacheCalculation } from '../calculations';
import { IProcedure } from '../entities';
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
export type FillingRecipeIngredientsFilter = string | RegExp | ICategoryFilter;

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

  /**
   * The underlying filling recipe version.
   * Use this to get the raw version data for persistence or journaling.
   */
  readonly version: IFillingRecipeVersion;

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
    filter?: FillingRecipeIngredientsFilter[]
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
   * @returns Success with RuntimeScaledFillingRecipeVersion, or Failure if scaling fails
   */
  scale(
    targetWeight: Measurement,
    options?: IVersionScaleOptions
  ): Result<IRuntimeScaledFillingRecipeVersion>;

  /**
   * Scales this version by a multiplicative factor.
   * @param factor - Multiplicative factor (e.g., 2.0 for double)
   * @param options - Optional scaling options
   * @returns Success with RuntimeScaledFillingRecipeVersion, or Failure if scaling fails
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

  /**
   * Gets the preferred procedure, falling back to first available.
   */
  readonly preferredProcedure: IResolvedFillingRecipeProcedure | undefined;

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
    filter?: FillingRecipeIngredientsFilter[]
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
   * The procedure ID (for consistency with IResolvedConfectionProcedure).
   */
  readonly id: ProcedureId;

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
   * @returns Success with RuntimeFillingRecipeVersion, or Failure if not found
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
 * Minimal context interface for RuntimeScaledFillingRecipeVersion.
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
 * Minimal context interface for RuntimeFillingRecipeVersion and RuntimeFillingRecipe.
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
  getJournalsForFilling(fillingId: FillingId): ReadonlyArray<AnyFillingJournalEntry>;

  /**
   * Gets all journal records for a specific filling version.
   * @param versionId - The filling version ID to search for
   * @returns Array of journal records (empty if none found)
   */
  getJournalsForFillingVersion(versionId: FillingVersionId): ReadonlyArray<AnyFillingJournalEntry>;

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
   * The golden (default) version - resolved.
   */
  readonly goldenVersion: AnyRuntimeConfectionVersion;

  /**
   * All versions - resolved.
   */
  readonly versions: ReadonlyArray<AnyRuntimeConfectionVersion>;

  /**
   * Gets a specific version by version specifier.
   * @param versionSpec - The version specifier to find
   * @returns Success with runtime version, or Failure if not found
   */
  getVersion(versionSpec: ConfectionVersionSpec): Result<AnyRuntimeConfectionVersion>;

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

  /** Resolved filling slots from the golden version */
  readonly fillings?: ReadonlyArray<IResolvedFillingSlot>;

  /** Resolved procedures from the golden version */
  readonly procedures?: IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>;

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

  /** Golden version typed as IRuntimeMoldedBonBonVersion */
  readonly goldenVersion: IRuntimeMoldedBonBonVersion;

  /** All versions typed as IRuntimeMoldedBonBonVersion */
  readonly versions: ReadonlyArray<IRuntimeMoldedBonBonVersion>;

  /** Gets a specific version - returns typed version */
  getVersion(versionSpec: ConfectionVersionSpec): Result<IRuntimeMoldedBonBonVersion>;

  /** Resolved molds with preferred selection (from golden version) */
  readonly molds: IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId>;

  /** Resolved shell chocolate specification (from golden version) */
  readonly shellChocolate: IResolvedChocolateSpec;

  /** Resolved additional chocolates (from golden version) */
  readonly additionalChocolates?: ReadonlyArray<IResolvedAdditionalChocolate>;

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

  /** Golden version typed as IRuntimeBarTruffleVersion */
  readonly goldenVersion: IRuntimeBarTruffleVersion;

  /** All versions typed as IRuntimeBarTruffleVersion */
  readonly versions: ReadonlyArray<IRuntimeBarTruffleVersion>;

  /** Gets a specific version - returns typed version */
  getVersion(versionSpec: ConfectionVersionSpec): Result<IRuntimeBarTruffleVersion>;

  /** Frame dimensions from the golden version */
  readonly frameDimensions: IFrameDimensions;

  /** Single bonbon dimensions from the golden version */
  readonly singleBonBonDimensions: IBonBonDimensions;

  /** Resolved enrobing chocolate (from golden version, optional) */
  readonly enrobingChocolate?: IResolvedChocolateSpec;

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

  /** Golden version typed as IRuntimeRolledTruffleVersion */
  readonly goldenVersion: IRuntimeRolledTruffleVersion;

  /** All versions typed as IRuntimeRolledTruffleVersion */
  readonly versions: ReadonlyArray<IRuntimeRolledTruffleVersion>;

  /** Gets a specific version - returns typed version */
  getVersion(versionSpec: ConfectionVersionSpec): Result<IRuntimeRolledTruffleVersion>;

  /** Resolved enrobing chocolate (from golden version, optional) */
  readonly enrobingChocolate?: IResolvedChocolateSpec;

  /** Resolved coatings (from golden version, optional) */
  readonly coatings?: IResolvedCoatings;

  /** Raw data typed to IRolledTruffle */
  readonly raw: IRolledTruffle;
}

/**
 * A resolved filling option with the full recipe or ingredient object.
 * Discriminated union for type-safe access.
 * @public
 */
export type IResolvedFillingOption = IResolvedRecipeFillingOption | IResolvedIngredientFillingOption;

/**
 * Resolved recipe filling option.
 * @public
 */
export interface IResolvedRecipeFillingOption {
  /** Discriminator for type-safe access */
  readonly type: 'recipe';
  /** The filling ID (satisfies IHasId for IOptionsWithPreferred) */
  readonly id: FillingId;
  /** The resolved filling recipe object */
  readonly filling: IRuntimeFillingRecipe;
  /** Optional notes specific to this filling option */
  readonly notes?: string;
  /** The original raw recipe filling option data */
  readonly raw: IRecipeFillingOption;
}

/**
 * Resolved ingredient filling option.
 * @public
 */
export interface IResolvedIngredientFillingOption {
  /** Discriminator for type-safe access */
  readonly type: 'ingredient';
  /** The ingredient ID (satisfies IHasId for IOptionsWithPreferred) */
  readonly id: IngredientId;
  /** The resolved ingredient object */
  readonly ingredient: IRuntimeIngredient;
  /** Optional notes specific to this filling option */
  readonly notes?: string;
  /** The original raw ingredient filling option data */
  readonly raw: IIngredientFillingOption;
}

/**
 * A resolved filling slot with resolved recipe/ingredient references.
 * @public
 */
export interface IResolvedFillingSlot {
  /** Unique identifier for this slot within the confection */
  readonly slotId: SlotId;
  /** Human-readable name for display */
  readonly name?: string;
  /** Resolved filling options with preferred selection */
  readonly filling: IOptionsWithPreferred<IResolvedFillingOption, FillingOptionId>;
}

// ============================================================================
// Resolved Chocolate Specification
// ============================================================================

/**
 * A resolved chocolate specification with ingredient objects.
 * Uses same pattern as IResolvedFillingIngredient - primary + alternates.
 * @public
 */
export interface IResolvedChocolateSpec {
  /** The preferred/primary chocolate ingredient (always chocolate category) */
  readonly chocolate: IRuntimeChocolateIngredient;
  /** Alternate chocolate options (all chocolate category) */
  readonly alternates: ReadonlyArray<IRuntimeChocolateIngredient>;
  /** The original raw chocolate spec */
  readonly raw: IChocolateSpec;
}

/**
 * Resolved additional chocolate with purpose.
 * @public
 */
export interface IResolvedAdditionalChocolate {
  /** Resolved chocolate specification */
  readonly chocolate: IResolvedChocolateSpec;
  /** Purpose of this additional chocolate */
  readonly purpose: AdditionalChocolatePurpose;
  /** The original raw additional chocolate data */
  readonly raw: IAdditionalChocolate;
}

// ============================================================================
// Resolved Mold Reference
// ============================================================================

/**
 * A resolved mold reference with the full mold object.
 * @public
 */
export interface IResolvedConfectionMoldRef {
  /** The mold ID (for IOptionsWithPreferred compatibility) */
  readonly id: MoldId;
  /** The resolved mold object */
  readonly mold: IRuntimeMold;
  /** Optional notes specific to using this mold */
  readonly notes?: string;
  /** The original raw mold reference data */
  readonly raw: IConfectionMoldRef;
}

// ============================================================================
// Resolved Procedure Reference (for confections)
// ============================================================================

/**
 * A resolved procedure reference for confections.
 * Similar to IResolvedFillingRecipeProcedure but for confections.
 * @public
 */
export interface IResolvedConfectionProcedure {
  /** The procedure ID (for IOptionsWithPreferred compatibility) */
  readonly id: ProcedureId;
  /** The resolved procedure object */
  readonly procedure: IRuntimeProcedure;
  /** Optional notes specific to using this procedure */
  readonly notes?: string;
  /** The original raw procedure reference data */
  readonly raw: IProcedureRef;
}

// ============================================================================
// Resolved Coatings (for rolled truffles)
// ============================================================================

/**
 * Resolved coatings specification for rolled truffles.
 * Coatings are ingredient-based (e.g., cocoa powder, chopped nuts).
 * @public
 */
export interface IResolvedCoatings {
  /** All available coating ingredient options */
  readonly options: ReadonlyArray<IResolvedCoatingOption>;
  /** The preferred/default coating (resolved ingredient) */
  readonly preferred?: IResolvedCoatingOption;
  /** The original raw coatings spec */
  readonly raw: ICoatings;
}

/**
 * A resolved coating option with the full ingredient object.
 * @public
 */
export interface IResolvedCoatingOption {
  /** The coating ingredient ID */
  readonly id: IngredientId;
  /** The resolved ingredient object */
  readonly ingredient: IRuntimeIngredient;
  /** Optional notes specific to this coating option */
  readonly notes?: string;
}

// ============================================================================
// Runtime Confection Version Interfaces
// ============================================================================

/**
 * A resolved runtime view of a confection version with resolved references.
 *
 * This interface provides runtime-layer access to version data with:
 * - Parent confection reference (ID and resolved object)
 * - Resolved filling slots and procedures
 * - Effective tags/urls (merged from base confection + version)
 * - Raw access to underlying version data
 *
 * @public
 */
export interface IRuntimeConfectionVersionBase {
  // ---- Identity ----

  /**
   * Version specifier for this version.
   */
  readonly versionSpec: ConfectionVersionSpec;

  /**
   * Date this version was created (ISO 8601 format).
   */
  readonly createdDate: string;

  /**
   * The parent confection ID.
   */
  readonly confectionId: ConfectionId;

  /**
   * The parent confection - resolved.
   * Enables navigation: `version.confection.name`
   */
  readonly confection: IRuntimeConfection;

  /**
   * The underlying confection version.
   * Use this to get the raw version data for persistence or journaling.
   */
  readonly version: AnyConfectionVersion;

  // ---- Version Properties ----

  /**
   * Yield specification for this version.
   */
  readonly yield: IConfectionYield;

  /**
   * Optional decorations for this version.
   */
  readonly decorations?: ReadonlyArray<IConfectionDecoration>;

  /**
   * Optional notes about this version.
   */
  readonly notes?: string;

  // ---- Resolved References ----

  /**
   * Resolved filling slots for this version.
   * Undefined if the version has no fillings.
   */
  readonly fillings?: ReadonlyArray<IResolvedFillingSlot>;

  /**
   * Resolved procedures for this version.
   * Undefined if the version has no procedures.
   */
  readonly procedures?: IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>;

  // ---- Effective Tags/URLs ----

  /**
   * Effective tags for this version (base confection tags + version's additional tags).
   */
  readonly effectiveTags: ReadonlyArray<string>;

  /**
   * Effective URLs for this version (base confection URLs + version's additional URLs).
   */
  readonly effectiveUrls: ReadonlyArray<ICategorizedUrl>;

  // ---- Type Guards ----

  /**
   * Returns true if this is a molded bonbon version.
   */
  isMoldedBonBonVersion(): this is IRuntimeMoldedBonBonVersion;

  /**
   * Returns true if this is a bar truffle version.
   */
  isBarTruffleVersion(): this is IRuntimeBarTruffleVersion;

  /**
   * Returns true if this is a rolled truffle version.
   */
  isRolledTruffleVersion(): this is IRuntimeRolledTruffleVersion;

  // ---- Raw access ----

  /**
   * Gets the underlying raw version data.
   */
  readonly raw: AnyConfectionVersion;
}

/**
 * Runtime confection version narrowed to molded bonbon type.
 * @public
 */
export interface IRuntimeMoldedBonBonVersion extends IRuntimeConfectionVersionBase {
  /** Parent confection narrowed to molded bonbon type */
  readonly confection: IRuntimeMoldedBonBon;

  /** Resolved molds with preferred selection */
  readonly molds: IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId>;

  /** Resolved shell chocolate specification */
  readonly shellChocolate: IResolvedChocolateSpec;

  /** Resolved additional chocolates (optional) */
  readonly additionalChocolates?: ReadonlyArray<IResolvedAdditionalChocolate>;

  /** Gets the preferred mold, falling back to first available */
  readonly preferredMold: IResolvedConfectionMoldRef | undefined;

  /** Gets the preferred procedure, falling back to first available */
  readonly preferredProcedure: IResolvedConfectionProcedure | undefined;

  /** Raw version typed to IMoldedBonBonVersion */
  readonly raw: IMoldedBonBonVersion;
}

/**
 * Runtime confection version narrowed to bar truffle type.
 * @public
 */
export interface IRuntimeBarTruffleVersion extends IRuntimeConfectionVersionBase {
  /** Parent confection narrowed to bar truffle type */
  readonly confection: IRuntimeBarTruffle;

  /** Frame dimensions for ganache slab */
  readonly frameDimensions: IFrameDimensions;

  /** Single bonbon dimensions for cutting */
  readonly singleBonBonDimensions: IBonBonDimensions;

  /** Resolved enrobing chocolate specification (optional) */
  readonly enrobingChocolate?: IResolvedChocolateSpec;

  /** Gets the preferred procedure, falling back to first available */
  readonly preferredProcedure: IResolvedConfectionProcedure | undefined;

  /** Raw version typed to IBarTruffleVersion */
  readonly raw: IBarTruffleVersion;
}

/**
 * Runtime confection version narrowed to rolled truffle type.
 * @public
 */
export interface IRuntimeRolledTruffleVersion extends IRuntimeConfectionVersionBase {
  /** Parent confection narrowed to rolled truffle type */
  readonly confection: IRuntimeRolledTruffle;

  /** Resolved enrobing chocolate specification (optional) */
  readonly enrobingChocolate?: IResolvedChocolateSpec;

  /** Resolved coatings (optional) */
  readonly coatings?: IResolvedCoatings;

  /** Gets the preferred procedure, falling back to first available */
  readonly preferredProcedure: IResolvedConfectionProcedure | undefined;

  /** Raw version typed to IRolledTruffleVersion */
  readonly raw: IRolledTruffleVersion;
}

/**
 * Union type for all runtime confection version types.
 * @public
 */
export type AnyRuntimeConfectionVersion =
  | IRuntimeMoldedBonBonVersion
  | IRuntimeBarTruffleVersion
  | IRuntimeRolledTruffleVersion;

// ============================================================================
// Confection Context Interface
// ============================================================================

/**
 * Minimal context interface for RuntimeConfection and RuntimeConfectionVersion.
 * Provides what a confection and its versions need for resolution.
 * @internal
 */
export interface IConfectionContext {
  /**
   * Gets a runtime ingredient by ID.
   * Used for resolving chocolate specifications and ingredient filling options.
   */
  getRuntimeIngredient(id: IngredientId): Result<IRuntimeIngredient>;

  /**
   * Gets a runtime filling recipe by ID.
   * Used for resolving recipe filling options.
   */
  getRuntimeFilling(id: FillingId): Result<IRuntimeFillingRecipe>;

  /**
   * Gets a runtime mold by ID.
   * Used for resolving mold references.
   */
  getRuntimeMold(id: MoldId): Result<IRuntimeMold>;

  /**
   * Gets a runtime procedure by ID.
   * Used for resolving procedure references.
   */
  getRuntimeProcedure(id: ProcedureId): Result<IRuntimeProcedure>;

  /**
   * Gets a runtime confection by ID.
   * Used for parent navigation from versions.
   */
  getRuntimeConfection(id: ConfectionId): Result<IRuntimeConfection>;

  // ============================================================================
  // Resolution Helpers
  // ============================================================================

  /**
   * Resolves a chocolate specification to runtime ingredient objects.
   * @param spec - The raw chocolate specification
   * @param confectionId - The confection ID (for error messages)
   * @returns Resolved chocolate specification with primary chocolate + alternates
   */
  resolveChocolateSpec(spec: IChocolateSpec, confectionId: ConfectionId): IResolvedChocolateSpec;

  /**
   * Resolves coating specifications to runtime ingredient objects.
   * @param coatings - The raw coatings specification
   * @returns Resolved coatings specification
   */
  resolveCoatings(coatings: ICoatings): IResolvedCoatings;

  /**
   * Resolves mold references to runtime mold objects.
   * @param molds - The raw mold references with preferred selection
   * @returns Resolved mold references
   */
  resolveMoldRefs(
    molds: IOptionsWithPreferred<IConfectionMoldRef, MoldId>
  ): IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId>;

  /**
   * Resolves additional chocolates to runtime objects.
   * @param additional - The raw additional chocolates
   * @param confectionId - The confection ID (for error messages)
   * @returns Resolved additional chocolates, or undefined if none
   */
  resolveAdditionalChocolates(
    additional: ReadonlyArray<IAdditionalChocolate> | undefined,
    confectionId: ConfectionId
  ): ReadonlyArray<IResolvedAdditionalChocolate> | undefined;

  /**
   * Resolves filling slots to runtime objects.
   * @param slots - The raw filling slots
   * @returns Resolved filling slots, or undefined if none
   */
  resolveFillingSlots(
    slots: ReadonlyArray<IFillingSlot> | undefined
  ): ReadonlyArray<IResolvedFillingSlot> | undefined;

  /**
   * Resolves procedure references to runtime objects.
   * @param procedures - The raw procedure references
   * @returns Resolved procedures, or undefined if none
   */
  resolveProcedures(
    procedures: IOptionsWithPreferred<IProcedureRef, ProcedureId> | undefined
  ): IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId> | undefined;
}
