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
 * RuntimeContext - central hub for the runtime object access layer
 * @packageDocumentation
 */

import { Collections, fail, Failure, Result, succeed, Success, ValidatingResultMap } from '@fgv/ts-utils';

import { Helpers, IngredientId, RecipeId, RecipeVersionSpec, Validation } from '../common';
import { IComputedScaledRecipe } from '../recipes';
import { IGanacheCalculation } from '../calculations';
import { ChocolateLibrary, IChocolateLibraryCreateParams } from './chocolateLibrary';
import {
  IIngredientContext,
  IIngredientUsageInfo,
  IRuntimeRecipeVersion,
  IScaledVersionContext,
  IVersionContext
} from './model';
import { RuntimeReverseIndex } from './runtimeReverseIndex';
import { RuntimeIngredient, AnyRuntimeIngredient } from './ingredients';
import { RuntimeRecipe } from './runtimeRecipe';
import {
  IFindOptions,
  IIngredientQuerySpec,
  IRecipeQuerySpec,
  IngredientIndexerOrchestrator,
  RecipeIndexerOrchestrator
} from './indexers';

// ============================================================================
// RuntimeContext Parameters
// ============================================================================

/**
 * Parameters for creating a RuntimeContext with a new library
 * @public
 */
export interface IRuntimeContextCreateParams {
  /**
   * Parameters for creating the underlying ChocolateLibrary
   */
  readonly libraryParams?: IChocolateLibraryCreateParams;

  /**
   * Whether to pre-warm the reverse index on context creation.
   * @defaultValue false
   */
  readonly preWarm?: boolean;
}

// ============================================================================
// RuntimeContextValidator Class (forward declaration needed by RuntimeContext)
// ============================================================================

/**
 * Provides validated access to RuntimeContext methods.
 * Accepts untyped strings, validates them, and delegates to RuntimeContext.
 * @public
 */
export class RuntimeContextValidator {
  private readonly _context: RuntimeContext;
  private readonly _recipeOrchestrator: RecipeIndexerOrchestrator;
  private readonly _ingredientOrchestrator: IngredientIndexerOrchestrator;

  /** @internal */
  public constructor(
    context: RuntimeContext,
    recipeOrchestrator: RecipeIndexerOrchestrator,
    ingredientOrchestrator: IngredientIndexerOrchestrator
  ) {
    this._context = context;
    this._recipeOrchestrator = recipeOrchestrator;
    this._ingredientOrchestrator = ingredientOrchestrator;
  }

  /** Gets a resolved runtime ingredient by validating a string ID. */
  public getIngredient(id: string): Result<AnyRuntimeIngredient> {
    return this._context.ingredients.validating.get(id);
  }

  /** Gets a resolved runtime recipe by validating a string ID. */
  public getRecipe(id: string): Result<RuntimeRecipe> {
    return this._context.recipes.validating.get(id);
  }

  /** Checks if an ingredient exists by validating a string ID. */
  public hasIngredient(id: string): Result<boolean> {
    return Validation.toIngredientId(id).onSuccess((iid) => Success.with(this._context.ingredients.has(iid)));
  }

  /** Checks if a recipe exists by validating a string ID. */
  public hasRecipe(id: string): Result<boolean> {
    return Validation.toRecipeId(id).onSuccess((rid) => Success.with(this._context.recipes.has(rid)));
  }

  /** Calculates ganache characteristics for a recipe by validating string IDs. */
  public calculateGanache(recipeId: string, versionSpec?: string): Result<IGanacheCalculation> {
    return Validation.toRecipeId(recipeId).onSuccess((rid) => {
      if (versionSpec === undefined) {
        return this._context.calculateGanache(rid);
      }
      return Validation.toRecipeVersionSpec(versionSpec).onSuccess((vid) =>
        this._context.calculateGanache(rid, vid)
      );
    });
  }

  /**
   * Finds recipes matching a JSON query specification.
   *
   * This unified method accepts plain JSON objects and converts them to typed
   * query specifications. Use this when working with user input or configuration.
   *
   * @param json - JSON object with indexer ID strings as keys and config objects as values
   * @param options - Optional find options (aggregation mode)
   * @returns Array of matching RuntimeRecipe objects
   *
   * @example
   * ```typescript
   * // Find recipes by tag
   * ctx.validating.findRecipes({
   *   'recipes-by-tag': { tag: 'classic' }
   * });
   *
   * // Find recipes by multiple criteria (intersection)
   * ctx.validating.findRecipes({
   *   'recipes-by-tag': { tag: 'ganache' },
   *   'recipes-by-chocolate-type': { chocolateType: 'dark' }
   * });
   *
   * // Find recipes by ingredient
   * ctx.validating.findRecipes({
   *   'recipes-by-ingredient': { ingredientId: 'felchlin.maracaibo-65', usageType: 'primary' }
   * });
   * ```
   */
  public findRecipes(json: unknown, options?: IFindOptions): Result<ReadonlyArray<RuntimeRecipe>> {
    return this._recipeOrchestrator
      .convertConfig(json)
      .onSuccess((spec) => this._context.findRecipes(spec, options) as Result<ReadonlyArray<RuntimeRecipe>>);
  }

  /**
   * Finds ingredients matching a JSON query specification.
   *
   * This unified method accepts plain JSON objects and converts them to typed
   * query specifications. Use this when working with user input or configuration.
   *
   * @param json - JSON object with indexer ID strings as keys and config objects as values
   * @param options - Optional find options (aggregation mode)
   * @returns Array of matching RuntimeIngredient objects
   *
   * @example
   * ```typescript
   * // Find ingredients by tag
   * ctx.validating.findIngredients({
   *   'ingredients-by-tag': { tag: 'chocolate' }
   * });
   * ```
   */
  public findIngredients(json: unknown, options?: IFindOptions): Result<ReadonlyArray<AnyRuntimeIngredient>> {
    return this._ingredientOrchestrator
      .convertConfig(json)
      .onSuccess(
        (spec) => this._context.findIngredients(spec, options) as Result<ReadonlyArray<AnyRuntimeIngredient>>
      );
  }
}

// ============================================================================
// RuntimeContext Class
// ============================================================================

/**
 * Central context for the runtime object access layer.
 * Provides factory methods for runtime objects, caching, and reverse lookups.
 *
 * This is the primary entry point for consumers who want resolved views
 * of recipes and ingredients with automatic reference resolution.
 *
 * @public
 */
export class RuntimeContext
  implements
    IVersionContext<AnyRuntimeIngredient>,
    IScaledVersionContext<AnyRuntimeIngredient>,
    IIngredientContext
{
  private readonly _library: ChocolateLibrary;
  private readonly _reverseIndex: RuntimeReverseIndex;

  // Lazily-populated caches exposed as IReadOnlyValidatingResultMap
  private _ingredients: ValidatingResultMap<IngredientId, AnyRuntimeIngredient> | undefined;
  private _recipes: ValidatingResultMap<RecipeId, RuntimeRecipe> | undefined;

  // Extensible indexer orchestrators
  private readonly _recipeOrchestrator: RecipeIndexerOrchestrator;
  private readonly _ingredientOrchestrator: IngredientIndexerOrchestrator;

  private constructor(library: ChocolateLibrary, preWarm: boolean) {
    this._library = library;
    this._reverseIndex = new RuntimeReverseIndex(library);

    // Initialize orchestrators with resolver functions bound to this context
    this._recipeOrchestrator = new RecipeIndexerOrchestrator(library, (id) => this._getRecipe(id));
    this._ingredientOrchestrator = new IngredientIndexerOrchestrator(library, (id) =>
      this._getIngredient(id)
    );

    if (preWarm) {
      this._reverseIndex.warmUp();
      this._recipeOrchestrator.warmUp();
      this._ingredientOrchestrator.warmUp();
    }
  }

  /**
   * Creates a RuntimeContext with a new or default ChocolateLibrary.
   * This is the primary factory method for most use cases.
   * @param params - Optional parameters for library and caching
   * @returns Success with RuntimeContext, or Failure if library creation fails
   */
  public static create(params?: IRuntimeContextCreateParams): Result<RuntimeContext> {
    return ChocolateLibrary.create(params?.libraryParams).onSuccess((library) => {
      return Success.with(new RuntimeContext(library, params?.preWarm ?? false));
    });
  }

  /**
   * Creates a RuntimeContext wrapping an existing ChocolateLibrary.
   * Use this when you already have a configured library instance.
   * @param library - The ChocolateLibrary to wrap
   * @param preWarm - Whether to pre-warm the reverse index
   * @returns Success with RuntimeContext
   */
  public static fromLibrary(library: ChocolateLibrary, preWarm?: boolean): Result<RuntimeContext> {
    return Success.with(new RuntimeContext(library, preWarm ?? false));
  }

  // ============================================================================
  // Library Access
  // ============================================================================

  /**
   * {@inheritdoc Runtime.RuntimeContext.library}
   */
  public get library(): ChocolateLibrary {
    return this._library;
  }

  // ============================================================================
  // Ingredients and Recipes (IReadOnlyValidatingResultMap)
  // ============================================================================

  /**
   * A read-only map of all ingredients, keyed by composite ID.
   * Ingredients are resolved eagerly on first access and cached.
   */
  public get ingredients(): Collections.IReadOnlyValidatingResultMap<IngredientId, AnyRuntimeIngredient> {
    return this._resolveIngredients();
  }

  /**
   * A read-only map of all recipes, keyed by composite ID.
   * Recipes are resolved eagerly on first access and cached.
   */
  public get recipes(): Collections.IReadOnlyValidatingResultMap<RecipeId, RuntimeRecipe> {
    return this._resolveRecipes();
  }

  /**
   * Resolves and caches all ingredients from the library.
   * @internal
   */
  private _resolveIngredients(): ValidatingResultMap<IngredientId, AnyRuntimeIngredient> {
    if (this._ingredients === undefined) {
      this._ingredients = new ValidatingResultMap({
        converters: new Collections.KeyValueConverters<IngredientId, AnyRuntimeIngredient>({
          key: Validation.toIngredientId,
          /* c8 ignore next 2 - defensive code: value converter only used for external validation, not internal population */
          value: (from: unknown) =>
            from instanceof RuntimeIngredient
              ? succeed(from as AnyRuntimeIngredient)
              : fail('not a runtime ingredient')
        })
      });
      // Populate from library
      for (const [id, ingredient] of this._library.ingredients.entries()) {
        RuntimeIngredient.create(this, id, ingredient).onSuccess((ri) => {
          this._ingredients!.set(id, ri);
          return succeed(ri);
        });
      }
    }
    return this._ingredients;
  }

  /**
   * Resolves and caches all recipes from the library.
   * @internal
   */
  private _resolveRecipes(): ValidatingResultMap<RecipeId, RuntimeRecipe> {
    if (this._recipes === undefined) {
      this._recipes = new ValidatingResultMap({
        converters: new Collections.KeyValueConverters<RecipeId, RuntimeRecipe>({
          key: Validation.toRecipeId,
          /* c8 ignore next - defensive code: value converter only used for external validation, not internal population */
          value: (from: unknown) =>
            from instanceof RuntimeRecipe ? succeed(from) : fail('not a runtime recipe')
        })
      });
      // Populate from library
      for (const [id, recipe] of this._library.recipes.entries()) {
        this._recipes.set(id, new RuntimeRecipe(this, id, recipe));
      }
    }
    return this._recipes;
  }

  /**
   * Gets a resolved runtime ingredient by ID.
   * @internal - for use by orchestrators and internal navigation
   */
  public _getIngredient(id: IngredientId): Result<AnyRuntimeIngredient> {
    return this._resolveIngredients().get(id).asResult;
  }

  /**
   * Gets a resolved runtime recipe by ID.
   * @internal - for use by orchestrators and internal navigation
   */
  public _getRecipe(id: RecipeId): Result<RuntimeRecipe> {
    return this._resolveRecipes().get(id).asResult;
  }

  /**
   * Gets the source version for a computed scaled recipe.
   * Used internally by RuntimeScaledVersion to resolve the source reference.
   * @param scaled - The computed scaled recipe containing source IDs
   * @returns Success with the resolved source version, or Failure if not found
   * @internal
   */
  public getSourceVersion(scaled: IComputedScaledRecipe): Result<IRuntimeRecipeVersion> {
    // Parse the composite RecipeVersionId to get recipeId and versionSpec
    return Helpers.parseRecipeVersionId(scaled.scaledFrom.sourceVersionId).onSuccess((parsed) => {
      const recipeId = parsed.collectionId;
      const versionSpec = parsed.itemId;
      return this._getRecipe(recipeId).onSuccess((recipe) => recipe.getVersion(versionSpec));
    });
  }

  // ============================================================================
  // Reverse Lookups (for RuntimeIngredient navigation)
  // ============================================================================

  // ---- Internal methods for ingredient navigation (IIngredientContext) ----

  /**
   * Gets all recipes that use a specific ingredient (primary or alternate).
   * Used internally by RuntimeIngredient for navigation.
   * @internal
   */
  public getRecipesUsingIngredient(ingredientId: IngredientId): RuntimeRecipe[] {
    const recipeIds = this._reverseIndex.getRecipesUsingIngredient(ingredientId);
    return this._resolveRecipeIds(recipeIds);
  }

  /**
   * Gets recipes where ingredient is primary.
   * Used internally by RuntimeIngredient for navigation.
   * @internal
   */
  public getRecipesWithPrimaryIngredient(ingredientId: IngredientId): RuntimeRecipe[] {
    const recipeIds = this._reverseIndex.getRecipesWithPrimaryIngredient(ingredientId);
    return this._resolveRecipeIds(recipeIds);
  }

  /**
   * Gets recipes where ingredient is an alternate.
   * Used internally by RuntimeIngredient for navigation.
   * @internal
   */
  public getRecipesWithAlternateIngredient(ingredientId: IngredientId): RuntimeRecipe[] {
    const recipeIds = this._reverseIndex.getRecipesWithAlternateIngredient(ingredientId);
    return this._resolveRecipeIds(recipeIds);
  }

  /**
   * Resolves a set of recipe IDs to RuntimeRecipe objects.
   * @internal
   */
  private _resolveRecipeIds(recipeIds: ReadonlySet<RecipeId>): RuntimeRecipe[] {
    const result: RuntimeRecipe[] = [];
    for (const id of recipeIds) {
      this._getRecipe(id).onSuccess((r: RuntimeRecipe) => Success.with(result.push(r)));
    }
    return result;
  }

  /**
   * Gets detailed usage information for an ingredient.
   * @param ingredientId - The ingredient ID to look up
   * @returns Success with array of usage info, or Failure if ingredient doesn't exist
   */
  public getIngredientUsage(ingredientId: IngredientId): Result<ReadonlyArray<IIngredientUsageInfo>> {
    if (!this.ingredients.has(ingredientId)) {
      return Failure.with(`${ingredientId}: ingredient not found`);
    }
    return Success.with(this._reverseIndex.getIngredientUsage(ingredientId));
  }

  // ============================================================================
  // Tag Discovery
  // ============================================================================

  /**
   * Gets all unique tags used across recipes.
   */
  public getAllRecipeTags(): ReadonlyArray<string> {
    return this._reverseIndex.getAllRecipeTags();
  }

  /**
   * Gets all unique tags used across ingredients.
   */
  public getAllIngredientTags(): ReadonlyArray<string> {
    return this._reverseIndex.getAllIngredientTags();
  }

  // ============================================================================
  // Operations
  // ============================================================================

  /**
   * Calculates ganache characteristics for a recipe version.
   * Convenience method for ID-based lookups.
   * @param recipeId - Recipe ID to analyze
   * @param versionSpec - Optional version spec (default: golden version)
   * @returns Success with ganache calculation, or Failure
   */
  public calculateGanache(recipeId: RecipeId, versionSpec?: RecipeVersionSpec): Result<IGanacheCalculation> {
    return this._getRecipe(recipeId).onSuccess((recipe: RuntimeRecipe) => {
      if (versionSpec !== undefined) {
        return recipe.getVersion(versionSpec).onSuccess((version) => version.calculateGanache());
      }
      return recipe.goldenVersion.calculateGanache();
    });
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * Gets the number of cached ingredients.
   */
  public get cachedIngredientCount(): number {
    return this._ingredients?.size ?? 0;
  }

  /**
   * Gets the number of cached recipes.
   */
  public get cachedRecipeCount(): number {
    return this._recipes?.size ?? 0;
  }

  /**
   * Clears all cached runtime objects.
   * Use if underlying library data has changed.
   */
  public clearCache(): void {
    this._ingredients = undefined;
    this._recipes = undefined;
    this._reverseIndex.invalidate();
    this._recipeOrchestrator.invalidate();
    this._ingredientOrchestrator.invalidate();
  }

  /**
   * Pre-warms the reverse indexes for efficient queries.
   */
  public warmUp(): void {
    this._reverseIndex.warmUp();
    this._recipeOrchestrator.warmUp();
    this._ingredientOrchestrator.warmUp();
  }

  // ============================================================================
  // Unified Find Interface (Extensible Indexer System)
  // ============================================================================

  /**
   * Finds recipes matching a query specification.
   *
   * This is the unified entry point for recipe queries. Query specifications
   * are keyed by indexer name, allowing multiple criteria to be combined.
   *
   * @param spec - Query specification with configs keyed by indexer name
   * @param options - Optional find options (aggregation mode)
   * @returns Array of matching RuntimeRecipe objects
   *
   * @example
   * ```typescript
   * // Find recipes by ingredient
   * ctx.findRecipes({
   *   'recipes-by-ingredient': { ingredientId: someIngredientId }
   * });
   *
   * // Find recipes by tag AND chocolate type (intersection)
   * ctx.findRecipes({
   *   'recipes-by-tag': { tag: 'ganache' },
   *   'recipes-by-chocolate-type': { chocolateType: 'dark' }
   * });
   * ```
   */
  public findRecipes(spec: IRecipeQuerySpec, options?: IFindOptions): Result<ReadonlyArray<RuntimeRecipe>> {
    return this._recipeOrchestrator.find(spec, options) as Result<ReadonlyArray<RuntimeRecipe>>;
  }

  /**
   * Finds ingredients matching a query specification.
   *
   * This is the unified entry point for ingredient queries. Query specifications
   * are keyed by indexer name, allowing multiple criteria to be combined.
   *
   * @param spec - Query specification with configs keyed by indexer name
   * @param options - Optional find options (aggregation mode)
   * @returns Array of matching RuntimeIngredient objects
   *
   * @example
   * ```typescript
   * // Find ingredients by tag
   * ctx.findIngredients({
   *   'ingredients-by-tag': { tag: 'chocolate' }
   * });
   * ```
   */
  public findIngredients(
    spec: IIngredientQuerySpec,
    options?: IFindOptions
  ): Result<ReadonlyArray<AnyRuntimeIngredient>> {
    return this._ingredientOrchestrator.find(spec, options) as Result<ReadonlyArray<AnyRuntimeIngredient>>;
  }

  /**
   * Invalidates all indexer caches.
   * Call this when underlying library data changes.
   */
  public invalidateIndexers(): void {
    this._recipeOrchestrator.invalidate();
    this._ingredientOrchestrator.invalidate();
  }

  // ============================================================================
  // Validating Accessor
  // ============================================================================

  /**
   * Provides access to methods that validate string inputs before lookup.
   * Use this when working with untyped string inputs that need validation.
   *
   * @example
   * ```typescript
   * // When you have an untyped string (e.g., from user input)
   * ctx.validating.getIngredient('felchlin.maracaibo-65')
   *
   * // When you already have a typed ID
   * ctx.getIngredient(knownIngredientId)
   * ```
   */
  public get validating(): RuntimeContextValidator {
    return new RuntimeContextValidator(this, this._recipeOrchestrator, this._ingredientOrchestrator);
  }
}
