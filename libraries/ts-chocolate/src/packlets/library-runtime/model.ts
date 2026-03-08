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
import type { IDecoration } from './decorations/model';
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
  ConfectionRecipeVariationSpec,
  DegreesMacMichael,
  FillingId,
  FillingName,
  FillingRecipeVariationId,
  FillingRecipeVariationSpec,
  FluidityStars,
  IngredientCategory,
  IngredientId,
  Measurement,
  DecorationId,
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
  Decorations,
  Fillings,
  Ingredients,
  IAlcoholIngredientEntity,
  IChocolateIngredientEntity,
  IDairyIngredientEntity,
  IFatIngredientEntity,
  IFillingRating,
  IFillingRecipeEntity,
  IFillingRecipeVariationEntity,
  IngredientEntity,
  ISugarIngredientEntity,
  IDecorationEntity,
  IMoldEntity,
  IProcedureEntity,
  IRawTaskEntity
} from '../entities';
import { ChocolateEntityLibrary } from './chocolateEntityLibrary';

// ============================================================================
// Runtime Ingredient Interfaces
// ============================================================================

/**
 * Base interface for all runtime ingredients.
 * Provides common properties and navigation shared by all ingredient types.
 *
 * Note: Does not extend `IIngredientEntity` directly because the class implementation
 * provides the same shape but with additional runtime behavior.
 *
 * @typeParam TEntity - The specific entity type for this ingredient
 * @public
 */
export interface IIngredient<TEntity extends IngredientEntity = IngredientEntity> {
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

  /** Optional categorized notes (e.g., AI assumptions, user annotations, sourcing) */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;

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
  readonly entity: TEntity;
}

/**
 * Runtime ingredient narrowed to chocolate type.
 * @public
 */
export interface IChocolateIngredient extends IIngredient<Ingredients.IChocolateIngredientEntity> {
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
export interface IDairyIngredient extends IIngredient<Ingredients.IDairyIngredientEntity> {
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
export interface ISugarIngredient extends IIngredient<Ingredients.ISugarIngredientEntity> {
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
export interface IFatIngredient extends IIngredient<Ingredients.IFatIngredientEntity> {
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
export interface IAlcoholIngredient extends IIngredient<Ingredients.IAlcoholIngredientEntity> {
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
// Runtime Variation Interfaces
// ============================================================================

/**
 * A resolved runtime view of a recipe variation with resolved ingredients.
 *
 * This interface provides runtime-layer access to variation data with:
 * - Parent recipe reference (both ID and resolved object)
 * - Resolved ingredient access via flexible filtering
 * - Ganache calculation
 *
 * Note: Does not directly extend `IFillingRecipeVariationEntity` because `ingredients` has a different
 * type (resolved vs entity references).
 *
 * @public
 */
export interface IFillingRecipeVariation {
  // ---- Identity ----

  /**
   * Qualified identifier for this variation (recipeId\@variationSpec).
   */
  readonly variationId: FillingRecipeVariationId;

  /**
   * Variation spec portion of the identifier.
   */
  readonly variationSpec: FillingRecipeVariationSpec;

  /**
   * Optional human-readable name for this variation.
   */
  readonly name?: string;

  /**
   * Date this variation was created (ISO 8601 format).
   */
  readonly createdDate: string;

  /**
   * The parent filling ID.
   */
  readonly fillingId: FillingId;

  /**
   * The parent filling recipe - resolved.
   * Enables navigation: `variation.fillingRecipe.name`
   */
  readonly fillingRecipe: IFillingRecipe;

  /**
   * Whether this variation's parent collection is mutable.
   */
  readonly isMutable: boolean;

  // ---- Variation Properties (from IFillingRecipeVariationEntity) ----

  /**
   * Base weight of the recipe (sum of all ingredient amounts).
   */
  readonly baseWeight: Measurement;

  /**
   * Optional yield description (e.g., "50 bonbons").
   */
  readonly yield?: string;

  /**
   * Optional notes about this variation.
   */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;

  /**
   * Optional ratings for this variation.
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
   * for (const ri of variation.getIngredients().orThrow()) { ... }
   *
   * // Chocolate ingredients only
   * variation.getIngredients([{ category: 'chocolate' }])
   *
   * // Multiple specific ingredients
   * variation.getIngredients(['felchlin.maracaibo-65', 'valrhona.guanaja-70'])
   *
   * // Pattern matching
   * variation.getIngredients([/^felchlin\./])
   *
   * // Mix of filters (OR semantics)
   * variation.getIngredients(['specific-id', { category: 'dairy' }, /^valrhona\./])
   * ```
   */
  getIngredients(
    filter?: FillingRecipeIngredientsFilter[]
  ): Result<IterableIterator<IResolvedFillingIngredient<IIngredient>>>;

  // ---- Ingredient queries ----

  /**
   * Checks if this variation uses a specific ingredient (as primary).
   * @param ingredientId - The ingredient ID to check
   * @returns True if the ingredient is used in this variation
   */
  usesIngredient(ingredientId: IngredientId): boolean;

  // ---- Operations ----

  /**
   * Calculates ganache characteristics for this variation.
   * @returns Success with ganache calculation, or Failure if calculation fails
   */
  calculateGanache(): Result<IGanacheCalculation>;

  // ---- Procedures (resolved) ----

  /**
   * Resolved procedures associated with this variation.
   * Undefined if the variation has no associated procedures.
   */
  readonly procedures?: IResolvedProcedures;

  /**
   * Gets the preferred procedure, falling back to first available.
   */
  readonly preferredProcedure: IResolvedFillingRecipeProcedure | undefined;

  // ---- Entity access ----

  /**
   * Gets the underlying entity variation data.
   */
  readonly entity: IFillingRecipeVariationEntity;
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
  readonly recommendedProcedure?: IProcedure;
}

// ============================================================================
// Runtime Recipe Interface
// ============================================================================

/**
 * A resolved runtime view of a recipe with navigation and variation access.
 *
 * This interface provides runtime-layer access to recipe data with:
 * - Composite identity (`id`, `collectionId`) for cross-source references
 * - Resolved variation access (full objects, not just entity data)
 * - Scaling and calculation operations
 * - Usage and ingredient queries
 * - Resolved procedure access
 *
 * Note: Does not extend {@link Entities.Fillings.IFillingRecipeEntity | IFillingRecipeEntity}
 * directly because `variations` has a different type (resolved vs data layer entity variations).
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
   * Whether this recipe's collection is mutable.
   */
  readonly isMutable: boolean;

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
   * The ID of the golden (approved default) variation.
   */
  readonly goldenVariationSpec: FillingRecipeVariationSpec;

  // ---- Variation navigation (resolved) ----

  /**
   * The golden (default approved) variation - resolved.
   */
  readonly goldenVariation: IFillingRecipeVariation;

  /**
   * All variations - resolved.
   */
  readonly variations: ReadonlyArray<IFillingRecipeVariation>;

  /**
   * Gets a specific variation by {@link FillingRecipeVariationSpec | variation specifier}.
   * @param variationSpec - The variation specifier to find
   * @returns Success with RuntimeFillingRecipeVariation, or Failure if not found
   */
  getVariation(variationSpec: FillingRecipeVariationSpec): Result<IFillingRecipeVariation>;

  /**
   * Gets the latest variation (by created date).
   */
  readonly latestVariation: IFillingRecipeVariation;

  /**
   * Number of variations.
   */
  readonly variationCount: number;

  // ---- Ingredient queries ----

  /**
   * Gets unique ingredient IDs used across all variations.
   * By default, returns only preferred ingredients (primary choice for each ingredient slot).
   * Pass `{ includeAlternates: true }` to include all ingredient options.
   * @param options - Query options
   * @returns Set of ingredient IDs
   */
  getIngredientIds(options?: IIngredientQueryOptions): ReadonlySet<IngredientId>;

  /**
   * Checks if any variation uses a specific ingredient.
   * By default, only checks preferred ingredients.
   * Pass `{ includeAlternates: true }` to also check alternate ingredients.
   * @param ingredientId - The ingredient ID to check
   * @param options - Query options
   * @returns True if the ingredient is used in any variation
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
 * Minimal context interface for RuntimeFillingRecipeVariation and RuntimeFillingRecipe.
 * Provides ingredient/recipe resolution.
 *
 * Generic type parameter allows internal implementations to use concrete types
 * (e.g., `AnyRuntimeIngredient`) while external consumers get abstract interfaces.
 *
 * @typeParam TIngredient - The ingredient type returned by ingredients map
 * @internal
 */
export interface IVariationContext<TIngredient extends IIngredient = IIngredient> {
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

  /** Check if a collection is mutable. */
  isCollectionMutable(collectionId: CollectionId): Result<boolean>;
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
// Chocolate library Interface
// ============================================================================

/**
 * Central context for the library materialized object access layer.
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
 * Note: For session creation capabilities, use UserLibrary (which implements ISessionContext) from the user-library packlet.
 *
 * @public
 */
export interface IChocolateLibrary extends IVariationContext<AnyIngredient> {
  // ---- Library Access ----

  /**
   * The underlying ChocolateEntityLibrary for direct access when needed.
   */
  readonly entities: ChocolateEntityLibrary;

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
    Confections.AnyConfectionRecipeEntity,
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
 * Provides common properties and variation navigation shared by all confection types.
 *
 * This interface includes all properties from the data layer `IConfectionEntity`
 * plus runtime-specific additions:
 * - Composite identity (`id`, `collectionId`) for cross-source references
 * - Variation navigation with typed variations
 * - Effective tags/urls (merged from base + variation)
 * - Type narrowing methods for discriminated access
 * - Access to underlying entity data
 *
 * @typeParam TVariation - The specific variation type for this confection
 * @typeParam TEntity - The specific entity type for this confection
 * @public
 */
export interface IConfectionBase<
  TVariation extends AnyConfectionRecipeVariation = AnyConfectionRecipeVariation,
  TEntity extends Confections.AnyConfectionRecipeEntity = Confections.AnyConfectionRecipeEntity
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

  /** Base tags for searching/filtering (variation may add more) */
  readonly tags?: ReadonlyArray<string>;

  /** Base URLs (variation may add more) */
  readonly urls?: ReadonlyArray<CommonModel.ICategorizedUrl>;

  /** The ID of the golden (approved default) variation */
  readonly goldenVariationSpec: ConfectionRecipeVariationSpec;

  // ---- Variation navigation ----

  /**
   * The golden (default) variation - resolved.
   */
  readonly goldenVariation: TVariation;

  /**
   * All variations - resolved.
   */
  readonly variations: ReadonlyArray<TVariation>;

  /**
   * Gets a specific variation by variation specifier.
   * @param variationSpec - The variation specifier to find
   * @returns Success with runtime variation, or Failure if not found
   */
  getVariation(variationSpec: ConfectionRecipeVariationSpec): Result<TVariation>;

  // ---- Effective tags/urls (merged from base + variation) ----

  /**
   * Gets effective tags for the golden variation (base + variation's additional tags).
   */
  readonly effectiveTags: ReadonlyArray<string>;

  /**
   * Gets effective URLs for the golden variation (base + variation's additional URLs).
   */
  readonly effectiveUrls: ReadonlyArray<CommonModel.ICategorizedUrl>;

  /**
   * Gets effective tags for a specific variation.
   * @param variation - The variation to get tags for (defaults to golden variation)
   */
  getEffectiveTags(variation?: Confections.AnyConfectionRecipeVariationEntity): ReadonlyArray<string>;

  /**
   * Gets effective URLs for a specific variation.
   * @param variation - The variation to get URLs for (defaults to golden variation)
   */
  getEffectiveUrls(
    variation?: Confections.AnyConfectionRecipeVariationEntity
  ): ReadonlyArray<CommonModel.ICategorizedUrl>;

  // ---- Convenience accessors for golden variation properties ----

  /** Resolved decorations from the golden variation */
  readonly decorations?: CommonModel.IOptionsWithPreferred<IResolvedConfectionDecorationRef, DecorationId>;

  /** Yield specification from the golden variation */
  readonly yield: Confections.ConfectionYield;

  /** Resolved filling slots from the golden variation */
  readonly fillings?: ReadonlyArray<IResolvedFillingSlot>;

  /** Resolved procedures from the golden variation */
  readonly procedures?: CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>;

  // ---- Type narrowing methods ----

  /**
   * Returns true if this is a molded bonbon confection.
   * When true, molded bonbon-specific properties are available.
   */
  isMoldedBonBon(): this is IMoldedBonBonRecipe;

  /**
   * Returns true if this is a bar truffle confection.
   * When true, bar truffle-specific properties are available.
   */
  isBarTruffle(): this is IBarTruffleRecipe;

  /**
   * Returns true if this is a rolled truffle confection.
   * When true, rolled truffle-specific properties are available.
   */
  isRolledTruffle(): this is IRolledTruffleRecipe;

  /**
   * Gets the underlying confection entity data.
   */
  readonly entity: TEntity;
}

/**
 * Runtime confection narrowed to molded bonbon type.
 * @public
 */
export interface IMoldedBonBonRecipe
  extends IConfectionBase<IMoldedBonBonRecipeVariation, Confections.MoldedBonBonRecipeEntity> {
  /** Type is always 'molded-bonbon' for this confection */
  readonly confectionType: 'molded-bonbon';

  /** Narrowed yield: only numFrames stored; weight/count derived from mold at runtime */
  readonly yield: Confections.IYieldInFrames;

  /** Resolved molds with preferred selection (from golden variation) */
  readonly molds: CommonModel.IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId>;

  /** Resolved shell chocolate specification (from golden variation) */
  readonly shellChocolate: IResolvedChocolateSpec;

  /** Resolved additional chocolates (from golden variation) */
  readonly additionalChocolates?: ReadonlyArray<IResolvedAdditionalChocolate>;
}

/**
 * Runtime confection narrowed to bar truffle type.
 * @public
 */
export interface IBarTruffleRecipe
  extends IConfectionBase<IBarTruffleRecipeVariation, Confections.BarTruffleRecipeEntity> {
  /** Type is always 'bar-truffle' for this confection */
  readonly confectionType: 'bar-truffle';

  /** Resolved enrobing chocolate (from golden variation, optional) */
  readonly enrobingChocolate?: IResolvedChocolateSpec;

  /** Derived frame dimensions for ganache slab (delegated from golden variation) */
  readonly frameDimensions: Confections.IPieceDimensions;
}

/**
 * Runtime confection narrowed to rolled truffle type.
 * @public
 */
export interface IRolledTruffleRecipe
  extends IConfectionBase<IRolledTruffleRecipeVariation, Confections.RolledTruffleRecipeEntity> {
  /** Type is always 'rolled-truffle' for this confection */
  readonly confectionType: 'rolled-truffle';

  /** Resolved enrobing chocolate (from golden variation, optional) */
  readonly enrobingChocolate?: IResolvedChocolateSpec;

  /** Resolved coatings (from golden variation, optional) */
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
// Resolved Decoration Reference (for confections)
// ============================================================================

/**
 * A resolved decoration reference with the full decoration object.
 * @public
 */
export interface IResolvedConfectionDecorationRef {
  /** The decoration ID (for IOptionsWithPreferred compatibility) */
  readonly id: DecorationId;
  /** The resolved decoration object */
  readonly decoration: IDecoration;
  /** Optional notes specific to using this decoration */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
  /** The original decoration entity reference data */
  readonly entity: Decorations.IDecorationRefEntity;
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
// Runtime Confection Variation Interfaces
// ============================================================================

/**
 * A resolved runtime view of a confection variation with resolved references.
 *
 * This interface provides runtime-layer access to variation data with:
 * - Parent confection reference (ID and resolved object)
 * - Resolved filling slots and procedures
 * - Effective tags/urls (merged from base confection + variation)
 * - Access to underlying recipe variation entity data
 *
 * @typeParam TConfection - The specific confection type for this variation
 * @typeParam TEntity - The specific entity type for this variation
 * @public
 */
export interface IConfectionRecipeVariationBase<
  TConfection extends IConfectionBase = IConfectionBase,
  TEntity extends Confections.AnyConfectionRecipeVariationEntity = Confections.AnyConfectionRecipeVariationEntity
> {
  // ---- Identity ----

  /**
   * Variation specifier for this variation.
   */
  readonly variationSpec: ConfectionRecipeVariationSpec;

  /**
   * Optional human-readable name for this variation.
   */
  readonly name?: string;

  /**
   * Date this variation was created (ISO 8601 format).
   */
  readonly createdDate: string;

  /**
   * The parent confection ID.
   */
  readonly confectionId: ConfectionId;

  /**
   * The parent confection - resolved.
   * Enables navigation: `variation.confection.name`
   */
  readonly confection: TConfection;

  // ---- Variation Properties ----

  /**
   * Yield specification for this variation.
   */
  readonly yield: Confections.ConfectionYield;

  /**
   * Resolved decorations for this variation.
   * Undefined if the variation has no decorations.
   */
  readonly decorations?: CommonModel.IOptionsWithPreferred<IResolvedConfectionDecorationRef, DecorationId>;

  /**
   * Optional notes about this variation.
   */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;

  // ---- Resolved References ----

  /**
   * Resolved filling slots for this variation.
   * Undefined if the variation has no fillings.
   */
  readonly fillings?: ReadonlyArray<IResolvedFillingSlot>;

  /**
   * Resolved procedures for this variation.
   * Undefined if the variation has no procedures.
   */
  readonly procedures?: CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>;

  // ---- Effective Tags/URLs ----

  /**
   * Effective tags for this variation (base confection tags + variation's additional tags).
   */
  readonly effectiveTags: ReadonlyArray<string>;

  /**
   * Effective URLs for this variation (base confection URLs + variation's additional URLs).
   */
  readonly effectiveUrls: ReadonlyArray<CommonModel.ICategorizedUrl>;

  // ---- Type Guards ----

  /**
   * Returns true if this is a molded bonbon variation.
   */
  isMoldedBonBonVariation(): this is IMoldedBonBonRecipeVariation;

  /**
   * Returns true if this is a bar truffle variation.
   */
  isBarTruffleVariation(): this is IBarTruffleRecipeVariation;

  /**
   * Returns true if this is a rolled truffle variation.
   */
  isRolledTruffleVariation(): this is IRolledTruffleRecipeVariation;

  /**
   * Gets the underlying recipe variation entity data.
   */
  readonly entity: TEntity;
}

/**
 * Runtime confection variation narrowed to molded bonbon type.
 * @public
 */
export interface IMoldedBonBonRecipeVariation
  extends IConfectionRecipeVariationBase<
    IMoldedBonBonRecipe,
    Confections.IMoldedBonBonRecipeVariationEntity
  > {
  /** Narrowed yield: only numFrames stored; weight/count derived from mold at runtime */
  readonly yield: Confections.IYieldInFrames;

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
 * Runtime confection variation narrowed to bar truffle type.
 * @public
 */
export interface IBarTruffleRecipeVariation
  extends IConfectionRecipeVariationBase<IBarTruffleRecipe, Confections.IBarTruffleRecipeVariationEntity> {
  /** Narrowed yield: numPieces, weightPerPiece, and piece dimensions stored as template defaults */
  readonly yield: Confections.IBarTruffleYield;

  /** Derived frame dimensions for ganache slab (computed from yield.numPieces + yield.dimensions) */
  readonly frameDimensions: Confections.IPieceDimensions;

  /** Resolved enrobing chocolate specification (optional) */
  readonly enrobingChocolate?: IResolvedChocolateSpec;

  /** Gets the preferred procedure, falling back to first available */
  readonly preferredProcedure: IResolvedConfectionProcedure | undefined;
}

/**
 * Runtime confection variation narrowed to rolled truffle type.
 * @public
 */
export interface IRolledTruffleRecipeVariation
  extends IConfectionRecipeVariationBase<
    IRolledTruffleRecipe,
    Confections.IRolledTruffleRecipeVariationEntity
  > {
  /** Narrowed yield: numPieces and weightPerPiece stored as template defaults */
  readonly yield: Confections.IYieldInPieces;

  /** Resolved enrobing chocolate specification (optional) */
  readonly enrobingChocolate?: IResolvedChocolateSpec;

  /** Resolved coatings (optional) */
  readonly coatings?: IResolvedCoatings;

  /** Gets the preferred procedure, falling back to first available */
  readonly preferredProcedure: IResolvedConfectionProcedure | undefined;
}

/**
 * Union type for all runtime confection variation types.
 * @public
 */
export type AnyConfectionRecipeVariation =
  | IMoldedBonBonRecipeVariation
  | IBarTruffleRecipeVariation
  | IRolledTruffleRecipeVariation;

// ============================================================================
// Confection Context Interface
// ============================================================================

/**
 * Minimal context interface for RuntimeConfection and RuntimeConfectionVariation.
 * Provides materialized libraries for resolution.
 * @internal
 */
export interface IConfectionContext extends IVariationContext<IIngredient> {
  /**
   * Materialized library of runtime molds.
   * Used for resolving mold references.
   */
  readonly molds: MaterializedLibrary<MoldId, IMoldEntity, IMold, never>;

  /**
   * Materialized library of runtime decorations.
   * Used for resolving decoration references.
   */
  readonly decorations: MaterializedLibrary<DecorationId, IDecorationEntity, IDecoration, never>;

  /**
   * Materialized library of runtime confections.
   * Used for parent navigation from variations.
   */
  readonly confections: MaterializedLibrary<
    ConfectionId,
    Confections.AnyConfectionRecipeEntity,
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
