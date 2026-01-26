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
 * RuntimeFillingRecipeVersion - resolved recipe version view
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import {
  Measurement,
  Helpers,
  IngredientId,
  FillingId,
  FillingVersionId,
  FillingVersionSpec
} from '../../common';
import { IFillingRecipeVersion, IFillingRating } from '../../entities';
import {
  IGanacheCalculation,
  calculateFromIngredients,
  IResolvedIngredient,
  validateGanache,
  scaleVersion,
  IVersionScaleOptions
} from '../../calculations';
import {
  ICategoryFilter,
  IResolvedFillingIngredient,
  IResolvedFillingRecipeProcedure,
  IResolvedProcedures,
  IRuntimeFillingRecipe,
  IRuntimeFillingRecipeVersion,
  IRuntimeScaledFillingRecipeVersion,
  IVersionContext,
  FillingRecipeIngredientsFilter
} from '../model';
import { AnyRuntimeIngredient } from '../ingredients';
import { RuntimeScaledFillingRecipeVersion } from './runtimeScaledFillingRecipeVersion';

// Specialize the context interface with concrete ingredient type
type VersionContext = IVersionContext<AnyRuntimeIngredient>;

// ============================================================================
// Filter Helpers
// ============================================================================

/**
 * Type guard for ICategoryFilter
 */
function isCategoryFilter(filter: FillingRecipeIngredientsFilter): filter is ICategoryFilter {
  return typeof filter === 'object' && filter !== null && 'category' in filter;
}

/**
 * Check if an ingredient matches a single filter
 */
function matchesFilter(
  resolved: IResolvedFillingIngredient<AnyRuntimeIngredient>,
  filter: FillingRecipeIngredientsFilter
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
// RuntimeFillingRecipeVersion Class
// ============================================================================

/**
 * A resolved view of a recipe version with all ingredients resolved.
 * @public
 */
export class RuntimeFillingRecipeVersion implements IRuntimeFillingRecipeVersion {
  private readonly _context: VersionContext;
  private readonly _fillingId: FillingId;
  private readonly _version: IFillingRecipeVersion;

  // Lazy-loaded resolved data
  private _resolvedIngredients: ReadonlyArray<IResolvedFillingIngredient<AnyRuntimeIngredient>> | undefined;
  private _resolutionError: string | undefined;
  private _recipe: IRuntimeFillingRecipe | undefined;
  private _procedures: IResolvedProcedures | undefined | null; // null = no procedures

  /**
   * Creates a RuntimeFillingRecipeVersion.
   * Use RuntimeFillingRecipe.getVersion() or goldenVersion instead of calling this directly.
   * @internal
   */
  public constructor(context: VersionContext, fillingId: FillingId, version: IFillingRecipeVersion) {
    this._context = context;
    this._fillingId = fillingId;
    this._version = version;
  }

  /**
   * Factory method for creating a RuntimeFillingRecipeVersion.
   * @param context - The runtime context
   * @param fillingId - The parent recipe ID
   * @param version - The raw version data
   * @returns Success with RuntimeFillingRecipeVersion
   */
  public static create(
    context: VersionContext,
    fillingId: FillingId,
    version: IFillingRecipeVersion
  ): Result<RuntimeFillingRecipeVersion> {
    return Success.with(new RuntimeFillingRecipeVersion(context, fillingId, version));
  }

  // ============================================================================
  // Identity
  // ============================================================================

  /**
   * Qualified identifier for this version (fillingId\@versionSpec).
   */
  public get versionId(): FillingVersionId {
    return Helpers.createFillingVersionId(this._fillingId, this._version.versionSpec);
  }

  /**
   * The version specifier
   */
  public get versionSpec(): FillingVersionSpec {
    return this._version.versionSpec;
  }

  /**
   * Date this version was created (ISO 8601 format)
   */
  public get createdDate(): string {
    return this._version.createdDate;
  }

  /**
   * The parent filling ID
   */
  public get fillingId(): FillingId {
    return this._fillingId;
  }

  /**
   * The parent filling recipe - resolved.
   * Enables navigation: `version.fillingRecipe.name`
   */
  public get fillingRecipe(): IRuntimeFillingRecipe {
    if (this._recipe === undefined) {
      // orThrow is safe - version was created from a valid recipe
      this._recipe = this._context.fillings.get(this._fillingId).value;
    }
    return this._recipe!;
  }

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Base weight of the recipe (sum of all ingredient amounts)
   */
  public get baseWeight(): Measurement {
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
  public get ratings(): ReadonlyArray<IFillingRating> {
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
    filter?: FillingRecipeIngredientsFilter[]
  ): Result<IterableIterator<IResolvedFillingIngredient<AnyRuntimeIngredient>>> {
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
    function* ingredientIterator(): IterableIterator<IResolvedFillingIngredient<AnyRuntimeIngredient>> {
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
    return this._version.ingredients.some((ri) => ri.ingredient.ids.includes(ingredientId));
  }

  // ============================================================================
  // Operations
  // ============================================================================

  /**
   * Scales this version to a target weight.
   * @param targetWeight - Target total weight in grams
   * @param options - Optional scaling options (precision, minimum amount)
   * @returns Success with RuntimeScaledFillingRecipeVersion, or Failure if scaling fails
   */
  public scale(
    targetWeight: Measurement,
    options?: IVersionScaleOptions
  ): Result<IRuntimeScaledFillingRecipeVersion> {
    return scaleVersion(this._version, this.versionId, targetWeight, options).onSuccess((scaled) =>
      RuntimeScaledFillingRecipeVersion.create(this._context, scaled)
    );
  }

  /**
   * Scales this version by a multiplicative factor.
   * @param factor - Multiplicative factor (e.g., 2.0 for double)
   * @param options - Optional scaling options
   * @returns Success with RuntimeScaledFillingRecipeVersion, or Failure if scaling fails
   */
  public scaleByFactor(
    factor: number,
    options?: IVersionScaleOptions
  ): Result<IRuntimeScaledFillingRecipeVersion> {
    if (factor <= 0) {
      return Failure.with('Scale factor must be greater than zero');
    }
    const targetWeight = (this.baseWeight * factor) as Measurement;
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
  // Procedures (lazy)
  // ============================================================================

  /**
   * Resolved procedures associated with this version.
   * Undefined if the version has no associated procedures.
   * Resolved lazily on first access.
   */
  public get procedures(): IResolvedProcedures | undefined {
    // Use null to distinguish "not yet resolved" from "no procedures"
    if (this._procedures === undefined) {
      this._procedures = this._resolveProcedures();
    }
    return this._procedures ?? undefined;
  }

  /**
   * Resolves procedure references to full procedure objects.
   * @returns Resolved procedures, or null if version has no procedures
   */
  private _resolveProcedures(): IResolvedProcedures | null {
    const rawProcedures = this._version.procedures;
    if (!rawProcedures || rawProcedures.options.length === 0) {
      return null;
    }

    const resolvedProcedures: IResolvedFillingRecipeProcedure[] = [];
    for (const ref of rawProcedures.options) {
      const procedureResult = this._context.getProcedure(ref.id);
      if (procedureResult.isSuccess()) {
        resolvedProcedures.push({
          procedure: procedureResult.value,
          notes: ref.notes,
          raw: ref
        });
      }
      // Skip procedures that fail to resolve (e.g., missing from library)
    }

    // Resolve preferred procedure if specified
    let recommendedProcedure = undefined;
    if (rawProcedures.preferredId) {
      const recommendedResult = this._context.getProcedure(rawProcedures.preferredId);
      if (recommendedResult.isSuccess()) {
        recommendedProcedure = recommendedResult.value;
      }
    }

    // Return null if all procedures failed to resolve
    if (resolvedProcedures.length === 0 && !recommendedProcedure) {
      return null;
    }

    return {
      procedures: resolvedProcedures,
      recommendedProcedure
    };
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw version data
   */
  public get raw(): IFillingRecipeVersion {
    return this._version;
  }

  // ============================================================================
  // Private Resolution
  // ============================================================================

  private _resolveIngredients(): void {
    const resolved: IResolvedFillingIngredient<AnyRuntimeIngredient>[] = [];
    const errors: string[] = [];

    for (const ri of this._version.ingredients) {
      // Get primary ingredient ID (preferred or first)
      const primaryId = Helpers.getPreferredIdOrFirst(ri.ingredient);
      /* c8 ignore next 4 - defensive coding: empty ids array would indicate data corruption */
      if (primaryId === undefined) {
        errors.push(`Recipe ingredient has no ingredient ids`);
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
