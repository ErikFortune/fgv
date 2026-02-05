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

import { Failure, MessageAggregator, Result, Success } from '@fgv/ts-utils';

import {
  Measurement,
  Helpers,
  IngredientId,
  FillingId,
  FillingRecipeVariationId,
  FillingRecipeVariationSpec,
  Model as CommonModel
} from '../../common';
import { IFillingRecipeVersionEntity, IFillingRating } from '../../entities';
import { calculateFromIngredients, validateGanache } from '../internal';
import {
  ICategoryFilter,
  IGanacheCalculation,
  IResolvedFillingIngredient,
  IResolvedFillingRecipeProcedure,
  IResolvedIngredient,
  IResolvedProcedures,
  IFillingRecipe,
  IFillingRecipeVersion,
  IVersionContext,
  FillingRecipeIngredientsFilter
} from '../model';
import { AnyIngredient } from '../ingredients';

// Specialize the context interface with concrete ingredient type
type VersionContext = IVersionContext<AnyIngredient>;

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
  resolved: IResolvedFillingIngredient<AnyIngredient>,
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
export class FillingRecipeVersion implements IFillingRecipeVersion {
  private readonly _context: VersionContext;
  private readonly _fillingId: FillingId;
  private readonly _version: IFillingRecipeVersionEntity;

  // Lazy-loaded resolved data
  private _resolvedIngredients: ReadonlyArray<IResolvedFillingIngredient<AnyIngredient>> | undefined;
  private _recipe: IFillingRecipe | undefined;
  private _procedures: IResolvedProcedures | undefined | null; // null = no procedures

  /**
   * Creates a RuntimeFillingRecipeVersion.
   * Use RuntimeFillingRecipe.getVersion() or goldenVersion instead of calling this directly.
   * @internal
   */
  public constructor(context: VersionContext, fillingId: FillingId, version: IFillingRecipeVersionEntity) {
    this._context = context;
    this._fillingId = fillingId;
    this._version = version;
  }

  /**
   * Factory method for creating a RuntimeFillingRecipeVersion.
   * @param context - The runtime context
   * @param fillingId - The parent recipe ID
   * @param version - The data layer version entity
   * @returns Success with RuntimeFillingRecipeVersion
   */
  public static create(
    context: VersionContext,
    fillingId: FillingId,
    version: IFillingRecipeVersionEntity
  ): Result<FillingRecipeVersion> {
    return Success.with(new FillingRecipeVersion(context, fillingId, version));
  }

  // ============================================================================
  // Identity
  // ============================================================================

  /**
   * Qualified identifier for this version (fillingId\@versionSpec).
   */
  public get versionId(): FillingRecipeVariationId {
    return Helpers.createFillingRecipeVariationId(this._fillingId, this._version.versionSpec);
  }

  /**
   * The version specifier
   */
  public get versionSpec(): FillingRecipeVariationSpec {
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
  public get fillingRecipe(): IFillingRecipe {
    if (this._recipe === undefined) {
      // orThrow is safe - version was created from a valid recipe
      this._recipe = this._context.fillings.get(this._fillingId).value;
    }
    return this._recipe!;
  }

  /**
   * The underlying filling recipe version.
   * Use this to get the data layer version entity for persistence or journaling.
   */
  public get version(): IFillingRecipeVersionEntity {
    return this._version;
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
   * Optional categorized notes about this version
   */
  public get notes(): ReadonlyArray<CommonModel.ICategorizedNote> | undefined {
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
  ): Result<IterableIterator<IResolvedFillingIngredient<AnyIngredient>>> {
    // Ensure ingredients are resolved
    if (this._resolvedIngredients === undefined) {
      const resolveResult = this._resolveIngredients();
      if (resolveResult.isFailure()) {
        return Failure.with(resolveResult.message);
      }
    }

    const resolved = this._resolvedIngredients!;

    // Create generator based on filter
    function* ingredientIterator(): IterableIterator<IResolvedFillingIngredient<AnyIngredient>> {
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
   * Calculates ganache characteristics for this version.
   * @returns Success with ganache calculation, or Failure if calculation fails
   */
  public calculateGanache(): Result<IGanacheCalculation> {
    return this.getIngredients().onSuccess((ingredientIterator) => {
      // Convert to IResolvedIngredient format for calculation
      const resolvedForCalc: IResolvedIngredient[] = [...ingredientIterator].map((ri) => ({
        ingredient: ri.ingredient.entity,
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
   * Gets resolved procedures associated with this version.
   * Returns Result with procedures, or Success with undefined if version has no procedures.
   * Resolved lazily on first access.
   * @returns Result with resolved procedures or undefined, or Failure if resolution fails
   * @public
   */
  public getProcedures(): Result<IResolvedProcedures | undefined> {
    // Use null to distinguish "not yet resolved" from "no procedures"
    if (this._procedures === undefined) {
      return this._resolveProcedures().onSuccess((resolved) => {
        this._procedures = resolved;
        return Success.with(resolved ?? undefined);
      });
    }
    return Success.with(this._procedures ?? undefined);
  }

  /**
   * Resolved procedures associated with this version.
   * Undefined if the version has no associated procedures.
   * Resolved lazily on first access.
   * @throws if procedure resolution fails - prefer getProcedures() for proper error handling
   */
  public get procedures(): IResolvedProcedures | undefined {
    return this.getProcedures().orThrow();
  }

  // ============================================================================
  // Convenience Getters for Preferred Selections
  // ============================================================================

  /**
   * Gets the preferred procedure, falling back to first available.
   * @public
   */
  public get preferredProcedure(): IResolvedFillingRecipeProcedure | undefined {
    if (!this.procedures) {
      return undefined;
    }
    // Return recommended procedure if set, otherwise first procedure
    if (this.procedures.recommendedProcedure) {
      return this.procedures.procedures.find(
        (p) => p.procedure.baseId === this.procedures!.recommendedProcedure!.baseId
      );
    }
    return this.procedures.procedures[0];
  }

  // ============================================================================
  // Private Resolution
  // ============================================================================

  /**
   * Resolves procedure references to full procedure objects.
   * @returns Result with resolved procedures, or Success with null if version has no procedures
   */
  private _resolveProcedures(): Result<IResolvedProcedures | null> {
    const procedureEntities = this._version.procedures;
    if (!procedureEntities || procedureEntities.options.length === 0) {
      return Success.with(null);
    }

    const errors = new MessageAggregator();
    const resolvedProcedures: IResolvedFillingRecipeProcedure[] = [];

    for (const ref of procedureEntities.options) {
      this._context.procedures
        .get(ref.id)
        .asResult.onSuccess((procedure) => {
          resolvedProcedures.push({
            id: ref.id,
            procedure: procedure.entity,
            notes: ref.notes,
            entity: ref
          });
          return Success.with(undefined);
        })
        .aggregateError(errors, (msg) => `procedure ${ref.id}: ${msg}`);
    }

    // Resolve preferred procedure if specified
    let recommendedProcedure = undefined;
    if (procedureEntities.preferredId) {
      this._context.procedures
        .get(procedureEntities.preferredId)
        .asResult.onSuccess((procedure) => {
          recommendedProcedure = procedure.entity;
          return Success.with(undefined);
        })
        .aggregateError(errors, (msg) => `recommended procedure ${procedureEntities.preferredId}: ${msg}`);
    }

    // Return null if all procedures failed to resolve
    if (resolvedProcedures.length === 0 && !recommendedProcedure) {
      return errors.returnOrReport(Success.with(null));
    }

    return errors.returnOrReport(
      Success.with({
        procedures: resolvedProcedures,
        recommendedProcedure
      })
    );
  }

  /**
   * Gets the underlying version entity data
   */
  public get entity(): IFillingRecipeVersionEntity {
    return this._version;
  }

  // ============================================================================
  // Private Resolution
  // ============================================================================

  private _resolveIngredients(): Result<void> {
    const resolved: IResolvedFillingIngredient<AnyIngredient>[] = [];
    const errors = new MessageAggregator();

    for (const ri of this._version.ingredients) {
      // Get primary ingredient ID (preferred or first)
      const primaryId = Helpers.getPreferredIdOrFirst(ri.ingredient);
      /* c8 ignore next 4 - defensive coding: empty ids array would indicate data corruption */
      if (primaryId === undefined) {
        errors.addMessage(`Recipe ingredient has no ingredient ids`);
        continue;
      }

      // Resolve primary ingredient
      this._context.ingredients
        .get(primaryId)
        .aggregateError(errors, (msg) => `ingredient ${primaryId}: ${msg}`);
      if (errors.hasMessages) {
        continue;
      }
      const ingredient = this._context.ingredients.get(primaryId).orThrow();

      // Resolve alternates (all ids except primary, skip missing ones)
      const alternates: AnyIngredient[] = [];
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
        ingredient,
        amount: ri.amount,
        notes: ri.notes,
        alternates,
        entity: ri
      });
    }

    return errors.returnOrReport(Success.with(undefined)).onSuccess(() => {
      this._resolvedIngredients = resolved;
      return Success.with(undefined);
    });
  }
}
