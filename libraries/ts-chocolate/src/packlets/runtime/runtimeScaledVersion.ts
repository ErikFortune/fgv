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

import { Grams, Helpers } from '../common';
import { IComputedScaledRecipe, IRecipeRating } from '../recipes';
import {
  IGanacheCalculation,
  calculateFromIngredients,
  IResolvedIngredient,
  validateGanache
} from '../calculations';
import {
  ICategoryFilter,
  IResolvedScaledIngredient,
  IRuntimeScaledRecipeVersion,
  IRuntimeScalingSource,
  IScaledVersionContext,
  RecipeIngredientsFilter
} from './model';
import { AnyRuntimeIngredient } from './ingredients';

// Specialize the context interface with concrete ingredient type
type ScaledVersionContext = IScaledVersionContext<AnyRuntimeIngredient>;

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
export class RuntimeScaledVersion implements IRuntimeScaledRecipeVersion {
  private readonly _context: ScaledVersionContext;
  private readonly _scaled: IComputedScaledRecipe;

  // Lazy-loaded resolved data
  private _resolvedIngredients: ReadonlyArray<IResolvedScaledIngredient<AnyRuntimeIngredient>> | undefined;
  private _resolutionError: string | undefined;
  private _scaledFrom: IRuntimeScalingSource | undefined;
  private _scaledFromError: string | undefined;

  /**
   * Creates a RuntimeScaledVersion.
   * @internal
   */
  public constructor(context: ScaledVersionContext, scaled: IComputedScaledRecipe) {
    this._context = context;
    this._scaled = scaled;
  }

  /**
   * Factory method for creating a RuntimeScaledVersion.
   * @param context - The runtime context
   * @param scaled - The computed scaled recipe data
   * @returns Success with RuntimeScaledVersion
   */
  public static create(
    context: ScaledVersionContext,
    scaled: IComputedScaledRecipe
  ): Result<RuntimeScaledVersion> {
    return Success.with(new RuntimeScaledVersion(context, scaled));
  }

  // ============================================================================
  // Scaling Info
  // ============================================================================

  /**
   * Information about the source recipe and version that was scaled.
   * Provides direct access to the resolved source version.
   * @throws Error if source version cannot be resolved (indicates data corruption)
   */
  public get scaledFrom(): IRuntimeScalingSource {
    if (this._scaledFrom === undefined && this._scaledFromError === undefined) {
      this._resolveScaledFrom();
    }
    /* c8 ignore next 3 - defensive coding: resolution errors would indicate data corruption */
    if (this._scaledFromError) {
      throw new Error(this._scaledFromError);
    }
    return this._scaledFrom!;
  }

  /**
   * The target weight that was requested
   */
  public get targetWeight(): Grams {
    return this._scaled.scaledFrom.targetWeight;
  }

  /**
   * Resolves the source version reference lazily.
   */
  private _resolveScaledFrom(): void {
    const sourceResult = this._context.getSourceVersion(this._scaled);
    /* c8 ignore next 4 - defensive coding: missing source version would indicate data corruption */
    if (sourceResult.isFailure()) {
      this._scaledFromError = `Failed to resolve source version: ${sourceResult.message}`;
      return;
    }

    this._scaledFrom = {
      sourceVersion: sourceResult.value,
      scaleFactor: this._scaled.scaledFrom.scaleFactor,
      targetWeight: this._scaled.scaledFrom.targetWeight
    };
  }

  /**
   * Date this scaled version was created (ISO 8601 format)
   */
  public get createdDate(): string {
    return this._scaled.createdDate;
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
  public get raw(): IComputedScaledRecipe {
    return this._scaled;
  }

  // ============================================================================
  // Private Resolution
  // ============================================================================

  private _resolveIngredients(): void {
    const resolved: IResolvedScaledIngredient<AnyRuntimeIngredient>[] = [];
    const errors: string[] = [];

    for (const ri of this._scaled.ingredients) {
      // Get primary ingredient ID (preferred or first)
      const primaryId = Helpers.getPreferredIdOrFirst(ri.ingredient);
      /* c8 ignore next 4 - defensive coding: empty ids array would indicate data corruption */
      if (primaryId === undefined) {
        errors.push(`Scaled ingredient has no ingredient ids`);
        continue;
      }

      // Resolve primary ingredient
      const ingredientResult = this._context.ingredients.get(primaryId);
      /* c8 ignore next 4 - defensive coding: missing ingredients would indicate data corruption */
      if (ingredientResult.isFailure()) {
        errors.push(`Failed to resolve ingredient ${primaryId}: ${ingredientResult.message}`);
        continue;
      }

      // Resolve alternates (all ids except primary, skip missing ones)
      const alternates: AnyRuntimeIngredient[] = [];
      for (const altId of ri.ingredient.ids) {
        if (altId !== primaryId) {
          const altResult = this._context.ingredients.get(altId);
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
