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
 * RuntimeRecipe - resolved recipe view with navigation
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import {
  BaseRecipeId,
  ID_SEPARATOR,
  IngredientId,
  RecipeId,
  RecipeName,
  RecipeVersionSpec,
  SourceId
} from '../common';
import { IRecipe, Recipe } from '../recipes';
import {
  IResolvedRecipeProcedure,
  IResolvedRecipeProcedures,
  IRuntimeRecipe,
  IRuntimeRecipeMold,
  IRuntimeRecipeMolds,
  IVersionContext
} from './model';
import { RuntimeVersion } from './runtimeVersion';
import { AnyRuntimeIngredient } from './ingredients';

// Specialize the context interface with concrete ingredient type
type RecipeContext = IVersionContext<AnyRuntimeIngredient>;

// ============================================================================
// RuntimeRecipe Class
// ============================================================================

/**
 * A resolved view of a recipe with navigation and version access.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class RuntimeRecipe implements IRuntimeRecipe {
  private readonly _context: RecipeContext;
  private readonly _id: RecipeId;
  private readonly _recipe: Recipe | IRecipe;
  private readonly _sourceId: SourceId;
  private readonly _baseId: BaseRecipeId;

  // Lazy-loaded versions
  private _goldenVersion: RuntimeVersion | undefined;
  private _versions: ReadonlyArray<RuntimeVersion> | undefined;
  private _latestVersion: RuntimeVersion | undefined;
  private _allIngredientIds: Set<IngredientId> | undefined;
  private _procedures: IResolvedRecipeProcedures | undefined | null; // null = no procedures
  private _molds: IRuntimeRecipeMolds | undefined | null; // null = no molds

  /**
   * Creates a RuntimeRecipe.
   * Use RuntimeContext.getRecipe() instead of calling this directly.
   * @internal
   */
  public constructor(context: RecipeContext, id: RecipeId, recipe: Recipe | IRecipe) {
    this._context = context;
    this._id = id;
    this._recipe = recipe;

    // Parse the composite ID
    const parts = (id as string).split(ID_SEPARATOR);
    this._sourceId = parts[0] as SourceId;
    this._baseId = parts[1] as BaseRecipeId;
  }

  /**
   * Factory method for creating a RuntimeRecipe.
   * @param context - The runtime context
   * @param id - The recipe ID
   * @param recipe - The raw recipe data
   * @returns Success with RuntimeRecipe
   */
  public static create(
    context: RecipeContext,
    id: RecipeId,
    recipe: Recipe | IRecipe
  ): Result<RuntimeRecipe> {
    return Success.with(new RuntimeRecipe(context, id, recipe));
  }

  // ============================================================================
  // Identity
  // ============================================================================

  /**
   * The composite recipe ID (e.g., "user.dark-ganache")
   */
  public get id(): RecipeId {
    return this._id;
  }

  /**
   * The source ID part of the composite ID
   */
  public get sourceId(): SourceId {
    return this._sourceId;
  }

  /**
   * The base recipe ID within the source
   */
  public get baseId(): BaseRecipeId {
    return this._baseId;
  }

  // ============================================================================
  // Core Properties
  // ============================================================================

  /**
   * Human-readable recipe name
   */
  public get name(): RecipeName {
    return this._recipe.name;
  }

  /**
   * Optional description of the recipe
   */
  public get description(): string | undefined {
    return this._recipe.description;
  }

  /**
   * Tags for categorization and search
   */
  public get tags(): ReadonlyArray<string> {
    return this._recipe.tags ?? [];
  }

  /**
   * The golden version ID
   */
  public get goldenVersionSpec(): RecipeVersionSpec {
    return this._recipe.goldenVersionSpec;
  }

  // ============================================================================
  // Version Navigation (lazy)
  // ============================================================================

  /**
   * The golden (default approved) version - resolved.
   * Resolved lazily on first access.
   */
  public get goldenVersion(): RuntimeVersion {
    if (this._goldenVersion === undefined) {
      const rawVersion = this._recipe.versions.find((v) => v.versionSpec === this._recipe.goldenVersionSpec);
      /* c8 ignore next 3 - defensive coding: data validation ensures golden version exists */
      if (!rawVersion) {
        throw new Error(`Golden version ${this._recipe.goldenVersionSpec} not found in recipe ${this._id}`);
      }
      this._goldenVersion = new RuntimeVersion(this._context, this._id, rawVersion);
    }
    return this._goldenVersion;
  }

  /**
   * All versions - resolved.
   * Resolved lazily on first access.
   */
  public get versions(): ReadonlyArray<RuntimeVersion> {
    if (this._versions === undefined) {
      this._versions = this._recipe.versions.map((v) => new RuntimeVersion(this._context, this._id, v));
    }
    return this._versions;
  }

  /**
   * Gets a specific version by ID.
   * @param versionSpec - The version ID to find
   * @returns Success with RuntimeVersion, or Failure if not found
   */
  public getVersion(versionSpec: RecipeVersionSpec): Result<RuntimeVersion> {
    const version = this.versions.find((v) => v.versionSpec === versionSpec);
    if (!version) {
      return Failure.with(`Version ${versionSpec} not found in recipe ${this._id}`);
    }
    return Success.with(version);
  }

  /**
   * Gets the latest version (by created date).
   * Resolved lazily on first access.
   */
  public get latestVersion(): RuntimeVersion {
    if (this._latestVersion === undefined) {
      // Find version with latest created date
      let latestRaw = this._recipe.versions[0];
      for (const v of this._recipe.versions) {
        if (v.createdDate > latestRaw.createdDate) {
          latestRaw = v;
        }
      }
      // Check if it's the same as golden version to reuse
      if (latestRaw.versionSpec === this._recipe.goldenVersionSpec) {
        this._latestVersion = this.goldenVersion;
      } else {
        this._latestVersion = new RuntimeVersion(this._context, this._id, latestRaw);
      }
    }
    return this._latestVersion;
  }

  /**
   * Number of versions
   */
  public get versionCount(): number {
    return this._recipe.versions.length;
  }

  // ============================================================================
  // Ingredient Queries
  // ============================================================================

  /**
   * Gets all unique ingredient IDs used across all versions (primary only).
   */
  public get allIngredientIds(): ReadonlySet<IngredientId> {
    if (this._allIngredientIds === undefined) {
      this._allIngredientIds = new Set<IngredientId>();
      for (const version of this._recipe.versions) {
        for (const ri of version.ingredients) {
          this._allIngredientIds.add(ri.ingredientId);
        }
      }
    }
    return this._allIngredientIds;
  }

  /**
   * Checks if any version uses a specific ingredient (as primary).
   * @param ingredientId - The ingredient ID to check
   * @returns True if the ingredient is used in any version
   */
  public usesIngredient(ingredientId: IngredientId): boolean {
    return this.allIngredientIds.has(ingredientId);
  }

  // ============================================================================
  // Procedures (lazy)
  // ============================================================================

  /**
   * Resolved procedures associated with this recipe.
   * Undefined if the recipe has no associated procedures.
   * Resolved lazily on first access.
   */
  public get procedures(): IResolvedRecipeProcedures | undefined {
    // Use null to distinguish "not yet resolved" from "no procedures"
    if (this._procedures === undefined) {
      this._procedures = this._resolveProcedures();
    }
    return this._procedures ?? undefined;
  }

  /**
   * Resolves procedure references to full procedure objects.
   * @returns Resolved procedures, or null if recipe has no procedures
   */
  private _resolveProcedures(): IResolvedRecipeProcedures | null {
    const rawProcedures = this._recipe.recipeProcedures;
    if (!rawProcedures || rawProcedures.procedures.length === 0) {
      return null;
    }

    const resolvedProcedures: IResolvedRecipeProcedure[] = [];
    for (const ref of rawProcedures.procedures) {
      const procedureResult = this._context.getProcedure(ref.procedureId);
      if (procedureResult.isSuccess()) {
        resolvedProcedures.push({
          procedure: procedureResult.value,
          notes: ref.notes,
          raw: ref
        });
      }
      // Skip procedures that fail to resolve (e.g., missing from library)
    }

    // Resolve recommended procedure if specified
    let recommendedProcedure = undefined;
    if (rawProcedures.recommendedProcedureId) {
      const recommendedResult = this._context.getProcedure(rawProcedures.recommendedProcedureId);
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
  // Molds (lazy)
  // ============================================================================

  /**
   * Molds associated with this recipe.
   * Undefined if the recipe has no associated molds.
   * Loaded lazily on first access.
   */
  public get molds(): IRuntimeRecipeMolds | undefined {
    // Use null to distinguish "not yet loaded" from "no molds"
    if (this._molds === undefined) {
      this._molds = this._loadMolds();
    }
    return this._molds ?? undefined;
  }

  /**
   * Loads mold references to full mold objects.
   * @returns Runtime molds, or null if recipe has no molds
   */
  private _loadMolds(): IRuntimeRecipeMolds | null {
    const rawMolds = this._recipe.recipeMolds;
    if (!rawMolds || rawMolds.molds.length === 0) {
      return null;
    }

    const runtimeMolds: IRuntimeRecipeMold[] = [];
    for (const ref of rawMolds.molds) {
      const moldResult = this._context.getMold(ref.moldId);
      if (moldResult.isSuccess()) {
        runtimeMolds.push({
          mold: moldResult.value,
          notes: ref.notes,
          raw: ref
        });
      }
      // Skip molds that fail to load (e.g., missing from library)
    }

    // Load recommended mold if specified
    let recommendedMold = undefined;
    if (rawMolds.recommendedMoldId) {
      const recommendedResult = this._context.getMold(rawMolds.recommendedMoldId);
      if (recommendedResult.isSuccess()) {
        recommendedMold = recommendedResult.value;
      }
    }

    // Return null if all molds failed to load
    if (runtimeMolds.length === 0 && !recommendedMold) {
      return null;
    }

    return {
      molds: runtimeMolds,
      recommendedMold
    };
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw recipe data
   */
  public get raw(): IRecipe {
    return this._recipe;
  }

  /**
   * Gets the underlying Recipe class instance if available.
   * Returns undefined if the raw data is a plain IRecipe.
   * Useful for accessing Recipe-specific methods not available on IRecipe.
   */
  /* c8 ignore next 3 - rawAsRecipe returns undefined when constructed with plain IRecipe */
  public get rawAsRecipe(): Recipe | undefined {
    return this._recipe instanceof Recipe ? this._recipe : undefined;
  }
}
