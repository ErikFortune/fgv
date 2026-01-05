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
 * RuntimeScaledVersion - resolved scaled recipe view
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import { BaseRecipeId, Grams, IngredientId, RecipeVersionSpec } from '../common';
import { IScaledRecipeVersion, IScalingSource, IRecipeRating } from '../recipes';
import {
  IGanacheCalculation,
  calculateFromIngredients,
  IResolvedIngredient,
  validateGanache
} from '../calculations';
import { ICategoryFilter, IResolvedScaledIngredient, RecipeIngredientsFilter } from './model';
import { AnyRuntimeIngredient } from './ingredients';

// ============================================================================
// Internal Context Interface
// ============================================================================

/**
 * Minimal context interface for RuntimeScaledVersion.
 * @internal
 */
interface IScaledVersionContext {
  getIngredient(id: IngredientId): Result<AnyRuntimeIngredient>;
}

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
  resolved: IResolvedScaledIngredient<AnyRuntimeIngredient>,
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
// RuntimeScaledVersion Class
// ============================================================================

/**
 * A resolved view of a scaled recipe version with all ingredients resolved.
 * @public
 */
export class RuntimeScaledVersion {
  private readonly _context: IScaledVersionContext;
  private readonly _scaled: IScaledRecipeVersion;

  // Lazy-loaded resolved data
  private _resolvedIngredients: ReadonlyArray<IResolvedScaledIngredient<AnyRuntimeIngredient>> | undefined;
  private _resolutionError: string | undefined;

  /**
   * Creates a RuntimeScaledVersion.
   * @internal
   */
  public constructor(context: IScaledVersionContext, scaled: IScaledRecipeVersion) {
    this._context = context;
    this._scaled = scaled;
  }

  /**
   * Factory method for creating a RuntimeScaledVersion.
   * @param context - The runtime context
   * @param scaled - The raw scaled version data
   * @returns Success with RuntimeScaledVersion
   */
  public static create(
    context: IScaledVersionContext,
    scaled: IScaledRecipeVersion
  ): Result<RuntimeScaledVersion> {
    return Success.with(new RuntimeScaledVersion(context, scaled));
  }

  // ============================================================================
  // Scaling Info
  // ============================================================================

  /**
   * Information about the source recipe and version that was scaled.
   */
  public get scaledFrom(): IScalingSource {
    return this._scaled.scaledFrom;
  }

  /**
   * The scaling factor that was applied
   */
  public get scaleFactor(): number {
    return this._scaled.scaledFrom.scaleFactor;
  }

  /**
   * The target weight that was requested
   */
  public get targetWeight(): Grams {
    return this._scaled.scaledFrom.targetWeight;
  }

  /**
   * Date this scaled version was created (ISO 8601 format)
   */
  public get createdDate(): string {
    return this._scaled.createdDate;
  }

  // ============================================================================
  // Source Information
  // ============================================================================

  /**
   * The base recipe ID this was scaled from
   */
  public get sourceRecipeId(): BaseRecipeId {
    return this._scaled.scaledFrom.recipeId;
  }

  /**
   * The version that was scaled
   */
  public get sourceVersionSpec(): RecipeVersionSpec {
    return this._scaled.scaledFrom.versionSpec;
  }

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Base weight of the scaled recipe (same as targetWeight)
   */
  public get baseWeight(): Grams {
    return this._scaled.baseWeight;
  }

  // TODO: think about a structured representation for yield so we can scale automatically
  /**
   * Optional yield description (may be scaled from original)
   */
  /* c8 ignore next 3 - tested via property access pattern check */
  public get yield(): string | undefined {
    return this._scaled.yield;
  }

  /**
   * Optional notes from the source version
   */
  /* c8 ignore next 3 - tested via property access pattern check */
  public get notes(): string | undefined {
    return this._scaled.notes;
  }

  /**
   * Optional ratings from the source version
   */
  public get ratings(): ReadonlyArray<IRecipeRating> {
    /* c8 ignore next - empty array returned when ratings undefined */
    return this._scaled.ratings ?? [];
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
  ): Result<IterableIterator<IResolvedScaledIngredient<AnyRuntimeIngredient>>> {
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
    function* ingredientIterator(): IterableIterator<IResolvedScaledIngredient<AnyRuntimeIngredient>> {
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
  // Operations
  // ============================================================================

  /**
   * Calculates ganache characteristics for this scaled version.
   * Note: Uses the scaled amounts, not original amounts.
   * @returns Success with ganache calculation, or Failure if calculation fails
   */
  public calculateGanache(): Result<IGanacheCalculation> {
    return this.getIngredients().onSuccess((ingredientIterator) => {
      // Convert to IResolvedIngredient format for calculation
      const resolvedForCalc: IResolvedIngredient[] = [...ingredientIterator].map((ri) => ({
        ingredient: ri.ingredient.raw,
        amount: ri.amount // Use scaled amount
      }));

      const analysis = calculateFromIngredients(resolvedForCalc);
      const validation = validateGanache(analysis);

      return Success.with({
        analysis,
        validation
      });
    });
  }

  /**
   * Gets the total weight difference from the original.
   */
  public get weightDifference(): Grams {
    // Calculate original total weight
    let originalTotal = 0;
    for (const ri of this._scaled.ingredients) {
      originalTotal += ri.originalAmount;
    }
    return (this.baseWeight - originalTotal) as Grams;
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw scaled version data
   */
  public get raw(): IScaledRecipeVersion {
    return this._scaled;
  }

  // ============================================================================
  // Private Resolution
  // ============================================================================

  private _resolveIngredients(): void {
    const resolved: IResolvedScaledIngredient<AnyRuntimeIngredient>[] = [];
    const errors: string[] = [];

    for (const ri of this._scaled.ingredients) {
      // Resolve primary ingredient
      const ingredientResult = this._context.getIngredient(ri.ingredientId);
      /* c8 ignore next 4 - defensive coding: missing ingredients would indicate data corruption */
      if (ingredientResult.isFailure()) {
        errors.push(`Failed to resolve ingredient ${ri.ingredientId}: ${ingredientResult.message}`);
        continue;
      }

      // Resolve alternates (skip missing ones, don't fail)
      const alternates: AnyRuntimeIngredient[] = [];
      /* c8 ignore next 8 - alternateIngredientIds not preserved by scaler */
      if (ri.alternateIngredientIds) {
        for (const altId of ri.alternateIngredientIds) {
          const altResult = this._context.getIngredient(altId);
          if (altResult.isSuccess()) {
            alternates.push(altResult.value);
          }
        }
      }

      resolved.push({
        ingredient: ingredientResult.value,
        amount: ri.amount,
        originalAmount: ri.originalAmount,
        scaleFactor: ri.scaleFactor,
        notes: ri.notes,
        alternates,
        raw: ri
      });
    }

    /* c8 ignore next 4 - defensive coding: errors would indicate data corruption */
    if (errors.length > 0) {
      this._resolutionError = `Failed to resolve scaled ingredients: ${errors.join('; ')}`;
      this._resolvedIngredients = [];
    } else {
      this._resolvedIngredients = resolved;
    }
  }
}
