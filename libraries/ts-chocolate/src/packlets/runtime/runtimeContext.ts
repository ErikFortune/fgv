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

import { Failure, Result, ResultMap, Success } from '@fgv/ts-utils';

import { ChocolateType, Grams, IngredientId, RecipeId, RecipeVersionSpec, Validation } from '../common';
import { IRecipeScaleOptions } from '../recipes';
import { IGanacheCalculation } from '../calculations';
import { ChocolateLibrary, IChocolateLibraryParams } from './chocolateLibrary';
import { IIngredientUsageInfo } from './model';
import { RuntimeReverseIndex } from './runtimeReverseIndex';
import { RuntimeIngredient, AnyRuntimeIngredient } from './ingredients';
import { RuntimeRecipe } from './runtimeRecipe';
import { RuntimeScaledVersion } from './runtimeScaledVersion';

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
  readonly libraryParams?: IChocolateLibraryParams;

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

  /** @internal */
  public constructor(context: RuntimeContext) {
    this._context = context;
  }

  /** Gets a resolved runtime ingredient by validating a string ID. */
  public getIngredient(id: string): Result<AnyRuntimeIngredient> {
    return Validation.toIngredientId(id).onSuccess((iid) => this._context.getIngredient(iid));
  }

  /** Gets a resolved runtime recipe by validating a string ID. */
  public getRecipe(id: string): Result<RuntimeRecipe> {
    return Validation.toRecipeId(id).onSuccess((rid) => this._context.getRecipe(rid));
  }

  /** Checks if an ingredient exists by validating a string ID. */
  public hasIngredient(id: string): Result<boolean> {
    return Validation.toIngredientId(id).onSuccess((iid) => Success.with(this._context.hasIngredient(iid)));
  }

  /** Checks if a recipe exists by validating a string ID. */
  public hasRecipe(id: string): Result<boolean> {
    return Validation.toRecipeId(id).onSuccess((rid) => Success.with(this._context.hasRecipe(rid)));
  }

  /** Scales a recipe by validating string IDs. */
  public scaleRecipe(
    recipeId: string,
    targetWeight: Grams,
    options?: IRecipeScaleOptions
  ): Result<RuntimeScaledVersion> {
    return Validation.toRecipeId(recipeId).onSuccess((rid) =>
      this._context.scaleRecipe(rid, targetWeight, options)
    );
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

  /** Gets recipe IDs using a specific ingredient by validating string ID. */
  public getRecipeIdsUsingIngredient(ingredientId: string): Result<ReadonlySet<RecipeId>> {
    return Validation.toIngredientId(ingredientId).onSuccess((iid) =>
      this._context.getRecipeIdsUsingIngredient(iid)
    );
  }

  /** Finds all recipes using a specific ingredient by validating string ID. */
  public findRecipesUsingIngredient(ingredientId: string): Result<RuntimeRecipe[]> {
    return Validation.toIngredientId(ingredientId).onSuccess((iid) =>
      this._context.findRecipesUsingIngredient(iid)
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
export class RuntimeContext {
  private readonly _library: ChocolateLibrary;
  private readonly _ingredientCache: ResultMap<IngredientId, AnyRuntimeIngredient>;
  private readonly _recipeCache: ResultMap<RecipeId, RuntimeRecipe>;
  private readonly _reverseIndex: RuntimeReverseIndex;

  private constructor(library: ChocolateLibrary, preWarm: boolean) {
    this._library = library;
    this._ingredientCache = new ResultMap<IngredientId, AnyRuntimeIngredient>();
    this._recipeCache = new ResultMap<RecipeId, RuntimeRecipe>();
    this._reverseIndex = new RuntimeReverseIndex(library);

    if (preWarm) {
      this._reverseIndex.warmUp();
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
  // Primary Resolution Methods
  // ============================================================================

  /**
   * {@inheritdoc Runtime.RuntimeContext.getIngredient}
   */
  public getIngredient(id: IngredientId): Result<AnyRuntimeIngredient> {
    return this._ingredientCache.get(id).asResult.onFailure(() => {
      return this._library
        .getIngredient(id)
        .onSuccess((ingredient) =>
          RuntimeIngredient.create(this, id, ingredient).onSuccess((ri) => this._ingredientCache.set(id, ri))
        );
    });
  }

  /**
   * Gets a resolved runtime recipe by ID.
   * Results are cached for efficient repeated access.
   * @param id - Composite recipe ID
   * @returns Success with RuntimeRecipe, or Failure if not found
   */
  public getRecipe(id: RecipeId): Result<RuntimeRecipe> {
    return this._recipeCache.get(id).asResult.onFailure(() => {
      return this._library
        .getRecipe(id)
        .onSuccess((recipe) => this._recipeCache.set(id, new RuntimeRecipe(this, id, recipe)));
    });
  }

  /**
   * Checks if an ingredient exists.
   * @param id - Composite ingredient ID
   * @returns True if ingredient exists
   */
  public hasIngredient(id: IngredientId): boolean {
    return this._library.hasIngredient(id);
  }

  /**
   * Checks if a recipe exists.
   * @param id - Composite recipe ID
   * @returns True if recipe exists
   */
  public hasRecipe(id: RecipeId): boolean {
    return this._library.hasRecipe(id);
  }

  // ============================================================================
  // Iteration
  // ============================================================================

  /**
   * Iterates over all ingredients as RuntimeIngredient objects.
   * Note: This resolves ingredients lazily as you iterate.
   */
  public *ingredients(): IterableIterator<AnyRuntimeIngredient> {
    for (const [id] of this._library.ingredients.entries()) {
      const result = this.getIngredient(id);
      if (result.isSuccess()) {
        yield result.value;
      }
    }
  }

  /**
   * Iterates over all recipes as RuntimeRecipe objects.
   * Note: This resolves recipes lazily as you iterate.
   */
  public *recipes(): IterableIterator<RuntimeRecipe> {
    for (const [id] of this._library.recipes.entries()) {
      const result = this.getRecipe(id);
      if (result.isSuccess()) {
        yield result.value;
      }
    }
  }

  /**
   * Gets all ingredients as an array.
   */
  public getAllIngredients(): AnyRuntimeIngredient[] {
    return Array.from(this.ingredients());
  }

  /**
   * Gets all recipes as an array.
   */
  public getAllRecipes(): RuntimeRecipe[] {
    return Array.from(this.recipes());
  }

  // ============================================================================
  // Reverse Lookups (for RuntimeIngredient navigation)
  // ============================================================================

  /**
   * Gets recipe IDs that use a specific ingredient.
   * @param ingredientId - The ingredient ID to look up
   * @returns Success with set of recipe IDs, or Failure if ingredient doesn't exist
   */
  public getRecipeIdsUsingIngredient(ingredientId: IngredientId): Result<ReadonlySet<RecipeId>> {
    if (!this.hasIngredient(ingredientId)) {
      return Failure.with(`${ingredientId}: ingredient not found`);
    }
    return Success.with(this._reverseIndex.getRecipesUsingIngredient(ingredientId));
  }

  /**
   * Gets recipe IDs where ingredient is primary.
   * @param ingredientId - The ingredient ID to look up
   * @returns Success with set of recipe IDs, or Failure if ingredient doesn't exist
   */
  public getRecipeIdsWithPrimaryIngredient(ingredientId: IngredientId): Result<ReadonlySet<RecipeId>> {
    if (!this.hasIngredient(ingredientId)) {
      return Failure.with(`${ingredientId}: ingredient not found`);
    }
    return Success.with(this._reverseIndex.getRecipesWithPrimaryIngredient(ingredientId));
  }

  /**
   * Gets recipe IDs where ingredient is an alternate.
   * @param ingredientId - The ingredient ID to look up
   * @returns Success with set of recipe IDs, or Failure if ingredient doesn't exist
   */
  public getRecipeIdsWithAlternateIngredient(ingredientId: IngredientId): Result<ReadonlySet<RecipeId>> {
    if (!this.hasIngredient(ingredientId)) {
      return Failure.with(`${ingredientId}: ingredient not found`);
    }
    return Success.with(this._reverseIndex.getRecipesWithAlternateIngredient(ingredientId));
  }

  /**
   * Finds all recipes that use a specific ingredient.
   * @param ingredientId - The ingredient ID to look up
   * @returns Success with array of RuntimeRecipe objects, or Failure if ingredient doesn't exist
   */
  public findRecipesUsingIngredient(ingredientId: IngredientId): Result<RuntimeRecipe[]> {
    if (!this.hasIngredient(ingredientId)) {
      return Failure.with(`${ingredientId}: ingredient not found`);
    }
    const recipeIds = this._reverseIndex.getRecipesUsingIngredient(ingredientId);
    const result: RuntimeRecipe[] = [];
    for (const id of recipeIds) {
      this.getRecipe(id).onSuccess((r) => Success.with(result.push(r)));
    }
    return Success.with(result);
  }

  /**
   * Gets detailed usage information for an ingredient.
   * @param ingredientId - The ingredient ID to look up
   * @returns Success with array of usage info, or Failure if ingredient doesn't exist
   */
  public getIngredientUsage(ingredientId: IngredientId): Result<ReadonlyArray<IIngredientUsageInfo>> {
    if (!this.hasIngredient(ingredientId)) {
      return Failure.with(`${ingredientId}: ingredient not found`);
    }
    return Success.with(this._reverseIndex.getIngredientUsage(ingredientId));
  }

  // ============================================================================
  // Tag Lookups
  // ============================================================================

  /**
   * Finds all recipes with a specific tag.
   * @param tag - The tag to search for
   * @returns Success with array of RuntimeRecipe objects, or Failure if tag is unknown
   */
  public findRecipesByTag(tag: string): Result<RuntimeRecipe[]> {
    if (!this._reverseIndex.getAllRecipeTags().includes(tag)) {
      return Failure.with(`"${tag}": unknown recipe tag`);
    }
    const recipeIds = this._reverseIndex.getRecipesByTag(tag);
    const result: RuntimeRecipe[] = [];
    for (const id of recipeIds) {
      this.getRecipe(id).onSuccess((r) => Success.with(result.push(r)));
    }
    return Success.with(result);
  }

  /**
   * Finds all ingredients with a specific tag.
   * @param tag - The tag to search for
   * @returns Success with array of RuntimeIngredient objects, or Failure if tag is unknown
   */
  public findIngredientsByTag(tag: string): Result<AnyRuntimeIngredient[]> {
    if (!this._reverseIndex.getAllIngredientTags().includes(tag)) {
      return Failure.with(`"${tag}": unknown ingredient tag`);
    }
    const ingredientIds = this._reverseIndex.getIngredientsByTag(tag);
    const result: AnyRuntimeIngredient[] = [];
    for (const id of ingredientIds) {
      this.getIngredient(id).onSuccess((i) => Success.with(result.push(i)));
    }
    return Success.with(result);
  }

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
  // Chocolate Type Lookups
  // ============================================================================

  /**
   * Finds all recipes containing a specific chocolate type.
   * @param type - The chocolate type to search for
   * @returns Array of RuntimeRecipe objects
   */
  public findRecipesByChocolateType(type: ChocolateType): RuntimeRecipe[] {
    const recipeIds = this._reverseIndex.getRecipesByChocolateType(type);
    const result: RuntimeRecipe[] = [];
    for (const id of recipeIds) {
      this.getRecipe(id).onSuccess((r) => Success.with(result.push(r)));
    }
    return result;
  }

  // ============================================================================
  // Operations (delegate to library)
  // ============================================================================

  /**
   * Scales a recipe to a target weight.
   * @param recipeId - Recipe ID to scale
   * @param targetWeight - Target total weight in grams
   * @param options - Optional scaling options
   * @returns Success with RuntimeScaledVersion, or Failure
   */
  public scaleRecipe(
    recipeId: RecipeId,
    targetWeight: Grams,
    options?: IRecipeScaleOptions
  ): Result<RuntimeScaledVersion> {
    return this._library.scaleRecipe(recipeId, targetWeight, options).onSuccess((scaled) => {
      return RuntimeScaledVersion.create(this, scaled);
    });
  }

  /**
   * Calculates ganache characteristics for a recipe.
   * @param recipeId - Recipe ID to analyze
   * @param versionSpec - Optional version specifier (default: golden version)
   * @returns Success with ganache calculation, or Failure
   */
  public calculateGanache(recipeId: RecipeId, versionSpec?: RecipeVersionSpec): Result<IGanacheCalculation> {
    return this._library.calculateGanache(recipeId, versionSpec);
  }

  /**
   * Calculates ganache for a specific version.
   * @param recipeId - Recipe ID
   * @param versionSpec - Version to analyze
   * @returns Success with ganache calculation, or Failure
   */
  public calculateGanacheForVersion(
    recipeId: RecipeId,
    versionSpec: RecipeVersionSpec
  ): Result<IGanacheCalculation> {
    return this._library.calculateGanache(recipeId, versionSpec);
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * Gets the number of cached ingredients.
   */
  public get cachedIngredientCount(): number {
    return this._ingredientCache.size;
  }

  /**
   * Gets the number of cached recipes.
   */
  public get cachedRecipeCount(): number {
    return this._recipeCache.size;
  }

  /**
   * Clears all cached runtime objects.
   * Use if underlying library data has changed.
   */
  public clearCache(): void {
    this._ingredientCache.clear();
    this._recipeCache.clear();
    this._reverseIndex.invalidate();
  }

  /**
   * Pre-warms the reverse indexes for efficient queries.
   */
  public warmUp(): void {
    this._reverseIndex.warmUp();
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
    return new RuntimeContextValidator(this);
  }
}
