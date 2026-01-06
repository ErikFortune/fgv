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
 * RuntimeVersion - resolved recipe version view
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import { Grams, Helpers, IngredientId, RecipeId, RecipeVersionId, RecipeVersionSpec } from '../common';
import { IRecipeVersion, IRecipeRating, scaleVersion, IVersionScaleOptions } from '../recipes';
import {
  IGanacheCalculation,
  calculateFromIngredients,
  IResolvedIngredient,
  validateGanache
} from '../calculations';
import {
  ICategoryFilter,
  IResolvedRecipeIngredient,
  IRuntimeRecipe,
  IRuntimeRecipeVersion,
  IRuntimeScaledRecipeVersion,
  IVersionContext,
  RecipeIngredientsFilter
} from './model';
import { AnyRuntimeIngredient } from './ingredients';
import { RuntimeScaledVersion } from './runtimeScaledVersion';

// Specialize the context interface with concrete ingredient type
type VersionContext = IVersionContext<AnyRuntimeIngredient>;

// ============================================================================
// Filter Helpers
// ============================================================================

/**
 * Type guard for ICategoryFilter
 */
function isCategoryFilter(filter: RecipeIngredientsFilter): filter is ICategoryFilter {
  return typeof filter === 'object' && filter !== null && 'category' in filter;
}

/**
 * Check if an ingredient matches a single filter
 */
function matchesFilter(
  resolved: IResolvedRecipeIngredient<AnyRuntimeIngredient>,
  filter: RecipeIngredientsFilter
): boolean {
  const ingredient = resolved.ingredient;

  if (typeof filter === 'string') {
    // Exact ID match
    return ingredient.id === filter;
  }

  if (filter instanceof RegExp) {
    // Pattern match on ID
    return filter.test(ingredient.id);
  }

  // ICategoryFilter
  if (isCategoryFilter(filter)) {
    if (filter.category instanceof RegExp) {
      return filter.category.test(ingredient.category);
    }
    return ingredient.category === filter.category;
    /* c8 ignore start - defensive coding: type system ensures all filter types are handled */
  }
  return false;
}
/* c8 ignore end */

// ============================================================================
// RuntimeVersion Class
// ============================================================================

/**
 * A resolved view of a recipe version with all ingredients resolved.
 * @public
 */
export class RuntimeVersion implements IRuntimeRecipeVersion {
  private readonly _context: VersionContext;
  private readonly _recipeId: RecipeId;
  private readonly _version: IRecipeVersion;

  // Lazy-loaded resolved data
  private _resolvedIngredients: ReadonlyArray<IResolvedRecipeIngredient<AnyRuntimeIngredient>> | undefined;
  private _resolutionError: string | undefined;
  private _recipe: IRuntimeRecipe | undefined;

  /**
   * Creates a RuntimeVersion.
   * Use RuntimeRecipe.getVersion() or goldenVersion instead of calling this directly.
   * @internal
   */
  public constructor(context: VersionContext, recipeId: RecipeId, version: IRecipeVersion) {
    this._context = context;
    this._recipeId = recipeId;
    this._version = version;
  }

  /**
   * Factory method for creating a RuntimeVersion.
   * @param context - The runtime context
   * @param recipeId - The parent recipe ID
   * @param version - The raw version data
   * @returns Success with RuntimeVersion
   */
  public static create(
    context: VersionContext,
    recipeId: RecipeId,
    version: IRecipeVersion
  ): Result<RuntimeVersion> {
    return Success.with(new RuntimeVersion(context, recipeId, version));
  }

  // ============================================================================
  // Identity
  // ============================================================================

  /**
   * Qualified identifier for this version (recipeId\@versionSpec).
   */
  public get versionId(): RecipeVersionId {
    return Helpers.createRecipeVersionId(this._recipeId, this._version.versionSpec);
  }

  /**
   * The version specifier
   */
  public get versionSpec(): RecipeVersionSpec {
    return this._version.versionSpec;
  }

  /**
   * Date this version was created (ISO 8601 format)
   */
  public get createdDate(): string {
    return this._version.createdDate;
  }

  /**
   * The parent recipe ID
   */
  public get recipeId(): RecipeId {
    return this._recipeId;
  }

  /**
   * The parent recipe - resolved.
   * Enables navigation: `version.recipe.name`
   */
  public get recipe(): IRuntimeRecipe {
    if (this._recipe === undefined) {
      // orThrow is safe - version was created from a valid recipe
      this._recipe = this._context.getRecipe(this._recipeId).orThrow();
    }
    return this._recipe;
  }

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Base weight of the recipe (sum of all ingredient amounts)
   */
  public get baseWeight(): Grams {
    return this._version.baseWeight;
  }

  /**
   * Optional yield description (e.g., "50 bonbons")
   */
  public get yield(): string | undefined {
    return this._version.yield;
  }

  /**
   * Optional notes about this version
   */
  public get notes(): string | undefined {
    return this._version.notes;
  }

  /**
   * Optional ratings for this version
   */
  public get ratings(): ReadonlyArray<IRecipeRating> {
    return this._version.ratings ?? [];
  }

  // ============================================================================
  // Resolved Ingredients
  // ============================================================================

  /**
   * Gets ingredients, optionally filtered.
   *
   * @param filter - Optional array of filters (OR semantics)
   *   - `undefined`/omitted: returns all ingredients
   *   - Empty array `[]`: returns nothing (empty iterator)
   *   - Non-empty array: returns ingredients matching at least one filter
   *
   * @returns Success with matching ingredients iterator, or Failure if resolution fails
   */
  public getIngredients(
    filter?: RecipeIngredientsFilter[]
  ): Result<IterableIterator<IResolvedRecipeIngredient<AnyRuntimeIngredient>>> {
    // Ensure ingredients are resolved
    if (this._resolvedIngredients === undefined) {
      this._resolveIngredients();
    }

    /* c8 ignore next 3 - defensive coding: resolution errors would indicate data corruption */
    if (this._resolutionError) {
      return Failure.with(this._resolutionError);
    }

    const resolved = this._resolvedIngredients!;

    // Create generator based on filter
    function* ingredientIterator(): IterableIterator<IResolvedRecipeIngredient<AnyRuntimeIngredient>> {
      // undefined filter = all ingredients
      if (filter === undefined) {
        for (const ri of resolved) {
          yield ri;
        }
        return;
      }

      // Empty array = nothing
      if (filter.length === 0) {
        return;
      }

      // Non-empty array = OR semantics
      for (const ri of resolved) {
        if (filter.some((f) => matchesFilter(ri, f))) {
          yield ri;
        }
      }
    }

    return Success.with(ingredientIterator());
  }

  // ============================================================================
  // Ingredient Queries
  // ============================================================================

  /**
   * Checks if this version uses a specific ingredient (as primary).
   * @param ingredientId - The ingredient ID to check
   * @returns True if the ingredient is used in this version
   */
  public usesIngredient(ingredientId: IngredientId): boolean {
    return this._version.ingredients.some((ri) => ri.ingredientId === ingredientId);
  }

  // ============================================================================
  // Operations
  // ============================================================================

  /**
   * Scales this version to a target weight.
   * @param targetWeight - Target total weight in grams
   * @param options - Optional scaling options (precision, minimum amount)
   * @returns Success with RuntimeScaledVersion, or Failure if scaling fails
   */
  public scale(targetWeight: Grams, options?: IVersionScaleOptions): Result<IRuntimeScaledRecipeVersion> {
    return scaleVersion(this._version, this.versionId, targetWeight, options).onSuccess((scaled) =>
      RuntimeScaledVersion.create(this._context, scaled)
    );
  }

  /**
   * Scales this version by a multiplicative factor.
   * @param factor - Multiplicative factor (e.g., 2.0 for double)
   * @param options - Optional scaling options
   * @returns Success with RuntimeScaledVersion, or Failure if scaling fails
   */
  public scaleByFactor(factor: number, options?: IVersionScaleOptions): Result<IRuntimeScaledRecipeVersion> {
    if (factor <= 0) {
      return Failure.with('Scale factor must be greater than zero');
    }
    const targetWeight = (this.baseWeight * factor) as Grams;
    return this.scale(targetWeight, options);
  }

  /**
   * Calculates ganache characteristics for this version.
   * @returns Success with ganache calculation, or Failure if calculation fails
   */
  public calculateGanache(): Result<IGanacheCalculation> {
    return this.getIngredients().onSuccess((ingredientIterator) => {
      // Convert to IResolvedIngredient format for calculation
      const resolvedForCalc: IResolvedIngredient[] = [...ingredientIterator].map((ri) => ({
        ingredient: ri.ingredient.raw,
        amount: ri.amount
      }));

      const analysis = calculateFromIngredients(resolvedForCalc);
      const validation = validateGanache(analysis);

      return Success.with({
        analysis,
        validation
      });
    });
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw version data
   */
  public get raw(): IRecipeVersion {
    return this._version;
  }

  // ============================================================================
  // Private Resolution
  // ============================================================================

  private _resolveIngredients(): void {
    const resolved: IResolvedRecipeIngredient<AnyRuntimeIngredient>[] = [];
    const errors: string[] = [];

    for (const ri of this._version.ingredients) {
      // Resolve primary ingredient
      const ingredientResult = this._context.getIngredient(ri.ingredientId);
      /* c8 ignore next 4 - defensive coding: missing ingredients would indicate data corruption */
      if (ingredientResult.isFailure()) {
        errors.push(`Failed to resolve ingredient ${ri.ingredientId}: ${ingredientResult.message}`);
        continue;
      }

      // Resolve alternates (skip missing ones with warning, don't fail)
      const alternates: AnyRuntimeIngredient[] = [];
      if (ri.alternateIngredientIds) {
        for (const altId of ri.alternateIngredientIds) {
          const altResult = this._context.getIngredient(altId);
          if (altResult.isSuccess()) {
            alternates.push(altResult.value);
          }
          // Silently skip missing alternates - they're optional
        }
      }

      resolved.push({
        ingredient: ingredientResult.value,
        amount: ri.amount,
        notes: ri.notes,
        alternates,
        raw: ri
      });
    }

    /* c8 ignore next 4 - defensive coding: errors would indicate data corruption */
    if (errors.length > 0) {
      this._resolutionError = `Failed to resolve ingredients for version ${
        this._version.versionSpec
      }: ${errors.join('; ')}`;
      this._resolvedIngredients = [];
    } else {
      this._resolvedIngredients = resolved;
    }
  }
}
