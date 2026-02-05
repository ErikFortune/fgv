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
 * Documentation lives here, with `@inheritDoc` used in implementing classes.
 *
 * @packageDocumentation
 */

import { Result } from '@fgv/ts-utils';

import { IIngredientQuerySpec, IFillingRecipeQuerySpec } from './indexers';
import type { MaterializedLibrary } from './materializedLibrary';
import type { IMold } from './molds/model';
import type { IProcedure } from './procedures/model';
import type { ITask } from './tasks/model';
import type { AnyIngredient } from './ingredients/ingredient';

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
  MoldId,
  Percentage,
  ProcedureId,
  SlotId,
  TaskId,
  CollectionId,
  Model as CommonModel
} from '../common';
import {
  Confections,
  Fillings,
  Ingredients,
  IAlcoholIngredientEntity,
  IChocolateIngredientEntity,
  IDairyIngredientEntity,
  IFatIngredientEntity,
  IFillingRating,
  IFillingRecipeEntity,
  IFillingRecipeVersionEntity,
  IngredientEntity,
  ISugarIngredientEntity,
  IMoldEntity,
  IProcedureEntity,
  IRawTaskEntity
} from '../entities';
import { ChocolateLibrary } from './chocolateLibrary';

// ============================================================================
// Runtime Ingredient Interfaces
// ============================================================================

/**
 * A resolved runtime view of an ingredient with navigation capabilities.
 *
 * This interface includes all properties from the data layer `IIngredientEntity`
 * plus runtime-specific additions:
 * - Composite identity (`id`, `sourceId`) for cross-source references
 * - Navigation to recipes that use this ingredient
 * - Type narrowing methods for discriminated access
 * - Access to underlying data entities
 *
 * Note: Does not extend `IIngredientEntity` directly because the class implementation
 * provides the same shape but with additional runtime behavior.
 *
 * @public
 */
export interface IIngredient {
  // ---- Composite Identity (runtime-specific) ----

  /**
   * The composite ingredient ID (e.g., "felchlin.maracaibo-65").
   * Combines source and base ID for unique identification across sources.
   */
  readonly id: IngredientId;

  /**
   * The collection ID part of the composite ID.
   */
  readonly collectionId: CollectionId;

  /**
   * The base ingredient ID within the source.
   */
  readonly baseId: BaseIngredientId;

  // ---- Core Properties (from IIngredientEntity) ----

  /** Display name */
  readonly name: string;

  /** Ingredient category (discriminator) */
  readonly category: IngredientCategory;

  /** Ganache-relevant characteristics */
  readonly ganacheCharacteristics: Ingredients.IGanacheCharacteristics;

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
  usedByFillings(): IFillingRecipe[];

  /**
   * Gets filling recipes where this ingredient is the primary choice.
   */
  primaryInFillings(): IFillingRecipe[];

  /**
   * Gets filling recipes where this ingredient is listed as an alternate.
   */
  alternateInFillings(): IFillingRecipe[];

  // ---- Type narrowing methods ----

  /**
   * Returns true if this is a chocolate ingredient.
   * When true, chocolate-specific properties are available.
   */
  isChocolate(): this is IChocolateIngredient;

  /**
   * Returns true if this is a dairy ingredient.
   * When true, dairy-specific properties are available.
   */
  isDairy(): this is IDairyIngredient;

  /**
   * Returns true if this is a sugar ingredient.
   * When true, sugar-specific properties are available.
   */
  isSugar(): this is ISugarIngredient;

  /**
   * Returns true if this is a fat ingredient.
   * When true, fat-specific properties are available.
   */
  isFat(): this is IFatIngredient;

  /**
   * Returns true if this is an alcohol ingredient.
   * When true, alcohol-specific properties are available.
   */
  isAlcohol(): this is IAlcoholIngredient;

  /**
   * Gets the underlying ingredient entity data.
   */
  readonly entity: IngredientEntity;
}

/**
 * Runtime ingredient narrowed to chocolate type.
 * @public
 */
export interface IChocolateIngredient extends IIngredient {
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
  readonly temperatureCurve?: Ingredients.ITemperatureCurve;

  /** Bean varieties used in the chocolate (optional) */
  readonly beanVarieties?: ReadonlyArray<CacaoVariety>;

  /** Recommended applications for this chocolate (optional) */
  readonly applications?: ReadonlyArray<ChocolateApplication>;

  /** Origin of the chocolate (optional) */
  readonly origins?: ReadonlyArray<string>;

  /**
   * {@inheritDoc LibraryRuntime.IIngredient.entity}
   */
  readonly entity: IChocolateIngredientEntity;
}

/**
 * Runtime ingredient narrowed to dairy type.
 * @public
 */
export interface IDairyIngredient extends IIngredient {
  /** Category is always dairy for this type */
  readonly category: 'dairy';

  /** Fat content percentage */
  readonly fatContent?: Percentage;

  /** Water content percentage */
  readonly waterContent?: Percentage;

  /**
   * {@inheritDoc LibraryRuntime.IIngredient.entity}
   */
  readonly entity: IDairyIngredientEntity;
}

/**
 * Runtime ingredient narrowed to sugar type.
 * @public
 */
export interface ISugarIngredient extends IIngredient {
  /** Category is always sugar for this type */
  readonly category: 'sugar';

  /** Hydration number (water molecules per sugar molecule) */
  readonly hydrationNumber?: number;

  /** Sweetness potency relative to sucrose (1.0 = sucrose) */
  readonly sweetnessPotency?: number;

  /**
   * {@inheritDoc LibraryRuntime.IIngredient.entity}
   */
  readonly entity: ISugarIngredientEntity;
}

/**
 * Runtime ingredient narrowed to fat type.
 * @public
 */
export interface IFatIngredient extends IIngredient {
  /** Category is always fat for this type */
  readonly category: 'fat';

  /** Melting point in Celsius */
  readonly meltingPoint?: Celsius;

  /**
   * {@inheritDoc LibraryRuntime.IIngredient.entity}
   */
  readonly entity: IFatIngredientEntity;
}

/**
 * Runtime ingredient narrowed to alcohol type.
 * @public
 */
export interface IAlcoholIngredient extends IIngredient {
  /** Category is always alcohol for this type */
  readonly category: 'alcohol';

  /** Alcohol by volume percentage */
  readonly alcoholByVolume?: Percentage;

  /** Flavor profile description (optional) */
  readonly flavorProfile?: string;

  /**
   * {@inheritDoc LibraryRuntime.IIngredient.entity}
   */
  readonly entity: IAlcoholIngredientEntity;
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
 * Note: Does not directly extend `IFillingRecipeVersionEntity` because `ingredients` has a different
 * type (resolved vs entity references).
 *
 * @public
 */
export interface IFillingRecipeVersion {
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
  readonly fillingRecipe: IFillingRecipe;

  /**
   * The underlying filling recipe version.
   * Use this to get the entity version data for persistence or journaling.
   */
  readonly version: IFillingRecipeVersionEntity;

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
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;

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
  ): Result<IterableIterator<IResolvedFillingIngredient<IIngredient>>>;

  // ---- Ingredient queries ----

  /**
   * Checks if this version uses a specific ingredient (as primary).
   * @param ingredientId - The ingredient ID to check
   * @returns True if the ingredient is used in this version
   */
  usesIngredient(ingredientId: IngredientId): boolean;

  // ---- Operations ----

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

  // ---- Entity access ----

  /**
   * Gets the underlying entity version data.
   */
  readonly entity: IFillingRecipeVersionEntity;
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
  readonly procedure: IProcedureEntity;

  /**
   * Optional notes specific to using this procedure with the recipe.
   */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;

  /**
   * The original procedure reference entity data.
   */
  readonly entity: Fillings.IProcedureRefEntity;
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
  readonly recommendedProcedure?: IProcedureEntity;
}

// ============================================================================
// Runtime Recipe Interface
// ============================================================================

/**
 * A resolved runtime view of a recipe with navigation and version access.
 *
 * This interface provides runtime-layer access to recipe data with:
 * - Composite identity (`id`, `collectionId`) for cross-source references
 * - Resolved version access (full objects, not just entity data)
 * - Scaling and calculation operations
 * - Usage and ingredient queries
 * - Resolved procedure access
 *
 * Note: Does not extend {@link Entities.Fillings.IFillingRecipeEntity | IFillingRecipeEntity}
 * directly because `versions` has a different type (resolved vs data layer entity versions).
 *
 * @public
 */
export interface IFillingRecipe {
  // ---- Composite Identity (runtime-specific) ----

  /**
   * The composite recipe ID (e.g., "user.dark-ganache").
   * Combines source and base ID for unique identification across sources.
   */
  readonly id: FillingId;

  /**
   * The collection ID part of the composite ID.
   */
  readonly collectionId: CollectionId;

  /**
   * The base recipe ID within the source.
   */
  readonly baseId: BaseFillingId;

  // ---- Core Properties (from IFillingRecipeEntity) ----

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
  readonly goldenVersion: IFillingRecipeVersion;

  /**
   * All versions - resolved.
   */
  readonly versions: ReadonlyArray<IFillingRecipeVersion>;

  /**
   * Gets a specific version by {@link FillingVersionSpec | version specifier}.
   * @param versionSpec - The version specifier to find
   * @returns Success with RuntimeFillingRecipeVersion, or Failure if not found
   */
  getVersion(versionSpec: FillingVersionSpec): Result<IFillingRecipeVersion>;

  /**
   * Gets the latest version (by created date).
   */
  readonly latestVersion: IFillingRecipeVersion;

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

  // ---- Entity access ----

  /**
   * Gets the underlying filling recipe entity data.
   */
  readonly entity: IFillingRecipeEntity;
}

// ============================================================================
// Resolved Ingredient References
// ============================================================================

/**
 * A resolved ingredient reference with full ingredient data and alternates.
 * This is the primary interface for accessing recipe ingredients in the runtime layer.
 * @public
 */
export interface IResolvedFillingIngredient<TIngredient extends IIngredient = IIngredient> {
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
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;

  /**
   * Resolved alternate ingredients that can substitute for the primary
   */
  readonly alternates: ReadonlyArray<TIngredient>;

  /**
   * The original ingredient entity reference data
   */
  readonly entity: Fillings.IFillingIngredientEntity;
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
export interface IIngredientResolutionResult<TIngredient extends IIngredient = IIngredient> {
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
 * Minimal context interface for RuntimeFillingRecipeVersion and RuntimeFillingRecipe.
 * Provides ingredient/recipe resolution.
 *
 * Generic type parameter allows internal implementations to use concrete types
 * (e.g., `AnyRuntimeIngredient`) while external consumers get abstract interfaces.
 *
 * @typeParam TIngredient - The ingredient type returned by ingredients map
 * @internal
 */
export interface IVersionContext<TIngredient extends IIngredient = IIngredient> {
  /** Map of all ingredients, keyed by composite ID. */
  readonly ingredients: MaterializedLibrary<
    IngredientId,
    IngredientEntity,
    TIngredient,
    IIngredientQuerySpec
  >;
  /** Map of all fillings, keyed by composite ID. */
  readonly fillings: MaterializedLibrary<
    FillingId,
    IFillingRecipeEntity,
    IFillingRecipe,
    IFillingRecipeQuerySpec
  >;
  /** Map of all procedures, keyed by composite ID. */
  readonly procedures: MaterializedLibrary<ProcedureId, IProcedureEntity, IProcedure, never>;
}

/**
 * Minimal context interface for RuntimeIngredient.
 * Provides only what an ingredient needs for navigation.
 * @internal
 */
export interface IIngredientContext {
  /** Gets all fillings using this ingredient (primary or alternate). */
  getFillingsUsingIngredient(id: IngredientId): IFillingRecipe[];
  /** Gets fillings where this ingredient is primary. */
  getFillingsWithPrimaryIngredient(id: IngredientId): IFillingRecipe[];
  /** Gets fillings where this ingredient is an alternate. */
  getFillingsWithAlternateIngredient(id: IngredientId): IFillingRecipe[];
}

// ============================================================================
// Library Runtime Context Interface
// ============================================================================

/**
 * Central context for the library-runtime object access layer.
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
 * Note: For session creation capabilities, use IRuntimeContext from the runtime packlet.
 *
 * @public
 */
export interface ILibraryRuntimeContext extends IVersionContext<AnyIngredient> {
  // ---- Library Access ----

  /**
   * The underlying ChocolateLibrary for direct access when needed.
   */
  readonly library: ChocolateLibrary;

  /**
   * A materialized library of all molds, keyed by composite ID.
   * Molds are resolved lazily on access and cached.
   * Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
   * `.values()` for iteration.
   */
  readonly molds: MaterializedLibrary<MoldId, IMoldEntity, IMold, never>;

  /**
   * A materialized library of all procedures, keyed by composite ID.
   * Procedures are resolved lazily on access and cached.
   * Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
   * `.values()` for iteration.
   */
  readonly procedures: MaterializedLibrary<ProcedureId, IProcedureEntity, IProcedure, never>;

  /**
   * A materialized library of all tasks, keyed by composite ID.
   * Tasks are resolved lazily on access and cached.
   * Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
   * `.values()` for iteration.
   */
  readonly tasks: MaterializedLibrary<TaskId, IRawTaskEntity, ITask, never>;

  /**
   * A materialized library of all confections, keyed by composite ID.
   * Confections are resolved lazily on access and cached.
   * Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
   * `.values()` for iteration.
   */
  readonly confections: MaterializedLibrary<
    ConfectionId,
    Confections.AnyConfectionEntity,
    IConfectionBase,
    never
  >;

  // ---- Journals ----

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
 * Base interface for all runtime confections.
 * Provides common properties and version navigation shared by all confection types.
 *
 * This interface includes all properties from the data layer `IConfectionEntity`
 * plus runtime-specific additions:
 * - Composite identity (`id`, `collectionId`) for cross-source references
 * - Version navigation with typed versions
 * - Effective tags/urls (merged from base + version)
 * - Type narrowing methods for discriminated access
 * - Access to underlying entity data
 *
 * @typeParam TVersion - The specific version type for this confection
 * @typeParam TEntity - The specific entity type for this confection
 * @public
 */
export interface IConfectionBase<
  TVersion extends AnyConfectionVersion = AnyConfectionVersion,
  TEntity extends Confections.AnyConfectionEntity = Confections.AnyConfectionEntity
> {
  // ---- Composite Identity (runtime-specific) ----

  /**
   * The composite confection ID (e.g., "common.dark-dome-bonbon").
   * Combines source and base ID for unique identification across sources.
   */
  readonly id: ConfectionId;

  /**
   * The collection ID part of the composite ID.
   */
  readonly collectionId: CollectionId;

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
  readonly urls?: ReadonlyArray<CommonModel.ICategorizedUrl>;

  /** The ID of the golden (approved default) version */
  readonly goldenVersionSpec: ConfectionVersionSpec;

  // ---- Version navigation ----

  /**
   * The golden (default) version - resolved.
   */
  readonly goldenVersion: TVersion;

  /**
   * All versions - resolved.
   */
  readonly versions: ReadonlyArray<TVersion>;

  /**
   * Gets a specific version by version specifier.
   * @param versionSpec - The version specifier to find
   * @returns Success with runtime version, or Failure if not found
   */
  getVersion(versionSpec: ConfectionVersionSpec): Result<TVersion>;

  // ---- Effective tags/urls (merged from base + version) ----

  /**
   * Gets effective tags for the golden version (base + version's additional tags).
   */
  readonly effectiveTags: ReadonlyArray<string>;

  /**
   * Gets effective URLs for the golden version (base + version's additional URLs).
   */
  readonly effectiveUrls: ReadonlyArray<CommonModel.ICategorizedUrl>;

  /**
   * Gets effective tags for a specific version.
   * @param version - The version to get tags for (defaults to golden version)
   */
  getEffectiveTags(version?: Confections.AnyConfectionVersionEntity): ReadonlyArray<string>;

  /**
   * Gets effective URLs for a specific version.
   * @param version - The version to get URLs for (defaults to golden version)
   */
  getEffectiveUrls(
    version?: Confections.AnyConfectionVersionEntity
  ): ReadonlyArray<CommonModel.ICategorizedUrl>;

  // ---- Convenience accessors for golden version properties ----

  /** Decorations from the golden version */
  readonly decorations?: ReadonlyArray<Confections.IConfectionDecoration>;

  /** Yield specification from the golden version */
  readonly yield: Confections.IConfectionYield;

  /** Resolved filling slots from the golden version */
  readonly fillings?: ReadonlyArray<IResolvedFillingSlot>;

  /** Resolved procedures from the golden version */
  readonly procedures?: CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>;

  // ---- Type narrowing methods ----

  /**
   * Returns true if this is a molded bonbon confection.
   * When true, molded bonbon-specific properties are available.
   */
  isMoldedBonBon(): this is IMoldedBonBon;

  /**
   * Returns true if this is a bar truffle confection.
   * When true, bar truffle-specific properties are available.
   */
  isBarTruffle(): this is IBarTruffle;

  /**
   * Returns true if this is a rolled truffle confection.
   * When true, rolled truffle-specific properties are available.
   */
  isRolledTruffle(): this is IRolledTruffle;

  /**
   * Gets the underlying confection entity data.
   */
  readonly entity: TEntity;
}

/**
 * Runtime confection narrowed to molded bonbon type.
 * @public
 */
export interface IMoldedBonBon
  extends IConfectionBase<IMoldedBonBonVersion, Confections.IMoldedBonBonEntity> {
  /** Type is always 'molded-bonbon' for this confection */
  readonly confectionType: 'molded-bonbon';

  /** Resolved molds with preferred selection (from golden version) */
  readonly molds: CommonModel.IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId>;

  /** Resolved shell chocolate specification (from golden version) */
  readonly shellChocolate: IResolvedChocolateSpec;

  /** Resolved additional chocolates (from golden version) */
  readonly additionalChocolates?: ReadonlyArray<IResolvedAdditionalChocolate>;
}

/**
 * Runtime confection narrowed to bar truffle type.
 * @public
 */
export interface IBarTruffle extends IConfectionBase<IBarTruffleVersion, Confections.IBarTruffleEntity> {
  /** Type is always 'bar-truffle' for this confection */
  readonly confectionType: 'bar-truffle';

  /** Frame dimensions from the golden version */
  readonly frameDimensions: Confections.IFrameDimensions;

  /** Single bonbon dimensions from the golden version */
  readonly singleBonBonDimensions: Confections.IBonBonDimensions;

  /** Resolved enrobing chocolate (from golden version, optional) */
  readonly enrobingChocolate?: IResolvedChocolateSpec;
}

/**
 * Runtime confection narrowed to rolled truffle type.
 * @public
 */
export interface IRolledTruffle
  extends IConfectionBase<IRolledTruffleVersion, Confections.IRolledTruffleEntity> {
  /** Type is always 'rolled-truffle' for this confection */
  readonly confectionType: 'rolled-truffle';

  /** Resolved enrobing chocolate (from golden version, optional) */
  readonly enrobingChocolate?: IResolvedChocolateSpec;

  /** Resolved coatings (from golden version, optional) */
  readonly coatings?: IResolvedCoatings;
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
  readonly filling: IFillingRecipe;
  /** Optional notes specific to this filling option */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
  /** The original recipe filling option entity data */
  readonly entity: Confections.IRecipeFillingOptionEntity;
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
  readonly ingredient: IIngredient;
  /** Optional notes specific to this filling option */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
  /** The original ingredient filling option entity data */
  readonly entity: Confections.IIngredientFillingOptionEntity;
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
  readonly filling: CommonModel.IOptionsWithPreferred<IResolvedFillingOption, Confections.FillingOptionId>;
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
  readonly chocolate: IChocolateIngredient;
  /** Alternate chocolate options (all chocolate category) */
  readonly alternates: ReadonlyArray<IChocolateIngredient>;
  /** The original chocolate spec entity */
  readonly entity: Confections.IChocolateSpec;
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
  /** The original additional chocolate entity data */
  readonly entity: Confections.IAdditionalChocolateEntity;
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
  readonly mold: IMold;
  /** Optional notes specific to using this mold */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
  /** The original mold entity reference data */
  readonly entity: Confections.IConfectionMoldRef;
}

// ============================================================================
// Resolved Procedure Reference (for confections)
// ============================================================================

/**
 * Resolved procedure reference for confections.
 * Similar to IResolvedFillingRecipeProcedure but for confections.
 * @public
 */
export interface IResolvedConfectionProcedure {
  /** The procedure ID (for IOptionsWithPreferred compatibility) */
  readonly id: ProcedureId;
  /** The resolved procedure object */
  readonly procedure: IProcedure;
  /** Optional notes specific to using this procedure */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
  /** The original procedure reference entity data */
  readonly entity: Fillings.IProcedureRefEntity;
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
  /** The original coatings spec */
  readonly entity: Confections.ICoatingsEntity;
}

/**
 * A resolved coating option with the full ingredient object.
 * @public
 */
export interface IResolvedCoatingOption {
  /** The coating ingredient ID */
  readonly id: IngredientId;
  /** The resolved ingredient object */
  readonly ingredient: IIngredient;
  /** Optional notes specific to this coating option */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
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
 * - Access to underlying recipe version entity data
 *
 * @typeParam TConfection - The specific confection type for this version
 * @typeParam TEntity - The specific entity type for this version
 * @public
 */
export interface IConfectionVersionBase<
  TConfection extends IConfectionBase = IConfectionBase,
  TEntity extends Confections.AnyConfectionVersionEntity = Confections.AnyConfectionVersionEntity
> {
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
  readonly confection: TConfection;

  // ---- Version Properties ----

  /**
   * Yield specification for this version.
   */
  readonly yield: Confections.IConfectionYield;

  /**
   * Optional decorations for this version.
   */
  readonly decorations?: ReadonlyArray<Confections.IConfectionDecoration>;

  /**
   * Optional notes about this version.
   */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;

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
  readonly procedures?: CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>;

  // ---- Effective Tags/URLs ----

  /**
   * Effective tags for this version (base confection tags + version's additional tags).
   */
  readonly effectiveTags: ReadonlyArray<string>;

  /**
   * Effective URLs for this version (base confection URLs + version's additional URLs).
   */
  readonly effectiveUrls: ReadonlyArray<CommonModel.ICategorizedUrl>;

  // ---- Type Guards ----

  /**
   * Returns true if this is a molded bonbon version.
   */
  isMoldedBonBonVersion(): this is IMoldedBonBonVersion;

  /**
   * Returns true if this is a bar truffle version.
   */
  isBarTruffleVersion(): this is IBarTruffleVersion;

  /**
   * Returns true if this is a rolled truffle version.
   */
  isRolledTruffleVersion(): this is IRolledTruffleVersion;

  /**
   * Gets the underlying recipe version entity data.
   */
  readonly entity: TEntity;
}

/**
 * Runtime confection version narrowed to molded bonbon type.
 * @public
 */
export interface IMoldedBonBonVersion
  extends IConfectionVersionBase<IMoldedBonBon, Confections.IMoldedBonBonVersionEntity> {
  /** Resolved molds with preferred selection */
  readonly molds: CommonModel.IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId>;

  /** Resolved shell chocolate specification */
  readonly shellChocolate: IResolvedChocolateSpec;

  /** Resolved additional chocolates (optional) */
  readonly additionalChocolates?: ReadonlyArray<IResolvedAdditionalChocolate>;

  /** Gets the preferred mold, falling back to first available */
  readonly preferredMold: IResolvedConfectionMoldRef | undefined;

  /** Gets the preferred procedure, falling back to first available */
  readonly preferredProcedure: IResolvedConfectionProcedure | undefined;
}

/**
 * Runtime confection version narrowed to bar truffle type.
 * @public
 */
export interface IBarTruffleVersion
  extends IConfectionVersionBase<IBarTruffle, Confections.IBarTruffleVersionEntity> {
  /** Frame dimensions for ganache slab */
  readonly frameDimensions: Confections.IFrameDimensions;

  /** Single bonbon dimensions for cutting */
  readonly singleBonBonDimensions: Confections.IBonBonDimensions;

  /** Resolved enrobing chocolate specification (optional) */
  readonly enrobingChocolate?: IResolvedChocolateSpec;

  /** Gets the preferred procedure, falling back to first available */
  readonly preferredProcedure: IResolvedConfectionProcedure | undefined;
}

/**
 * Runtime confection version narrowed to rolled truffle type.
 * @public
 */
export interface IRolledTruffleVersion
  extends IConfectionVersionBase<IRolledTruffle, Confections.IRolledTruffleVersionEntity> {
  /** Resolved enrobing chocolate specification (optional) */
  readonly enrobingChocolate?: IResolvedChocolateSpec;

  /** Resolved coatings (optional) */
  readonly coatings?: IResolvedCoatings;

  /** Gets the preferred procedure, falling back to first available */
  readonly preferredProcedure: IResolvedConfectionProcedure | undefined;
}

/**
 * Union type for all runtime confection version types.
 * @public
 */
export type AnyConfectionVersion = IMoldedBonBonVersion | IBarTruffleVersion | IRolledTruffleVersion;

// ============================================================================
// Confection Context Interface
// ============================================================================

/**
 * Minimal context interface for RuntimeConfection and RuntimeConfectionVersion.
 * Provides materialized libraries for resolution.
 * @internal
 */
export interface IConfectionContext extends IVersionContext<IIngredient> {
  /**
   * Materialized library of runtime molds.
   * Used for resolving mold references.
   */
  readonly molds: MaterializedLibrary<MoldId, IMoldEntity, IMold, never>;

  /**
   * Materialized library of runtime confections.
   * Used for parent navigation from versions.
   */
  readonly confections: MaterializedLibrary<
    ConfectionId,
    Confections.AnyConfectionEntity,
    IConfectionBase,
    never
  >;
}

/**
 * Blended characteristics for a ganache recipe
 * @public
 */
export interface IGanacheAnalysis {
  /**
   * Weighted average characteristics of all ingredients
   */
  readonly characteristics: Ingredients.IGanacheCharacteristics;

  /**
   * Total fat percentage (cacaoFat + milkFat + otherFats)
   */
  readonly totalFat: Percentage;

  /**
   * Fat to water ratio (important for emulsion stability)
   */
  readonly fatToWaterRatio: number;

  /**
   * Sugar to water ratio (important for texture and preservation)
   */
  readonly sugarToWaterRatio: number;

  /**
   * Total weight of the recipe
   */
  readonly totalWeight: Measurement;
}

/**
 * Validation result for ganache ratios
 * @public
 */
export interface IGanacheValidation {
  /**
   * Overall validity
   */
  readonly isValid: boolean;

  /**
   * Specific validation warnings
   */
  readonly warnings: ReadonlyArray<string>;

  /**
   * Specific validation errors
   */
  readonly errors: ReadonlyArray<string>;
}

/**
 * Complete ganache calculation result
 * @public
 */
export interface IGanacheCalculation {
  /**
   * Blended characteristic analysis
   */
  readonly analysis: IGanacheAnalysis;

  /**
   * Validation against standard guidelines
   */
  readonly validation: IGanacheValidation;
}

/**
 * Resolved ingredient with its amount
 * @public
 */
export interface IResolvedIngredient {
  readonly ingredient: IngredientEntity;
  readonly amount: Measurement;
}

/**
 * Function type for resolving an ingredient ID to its full ingredient data
 * @public
 */
export type IngredientResolver = (id: IngredientId) => Result<IngredientEntity>;
