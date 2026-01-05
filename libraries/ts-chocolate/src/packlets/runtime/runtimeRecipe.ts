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
  Grams,
  ID_SEPARATOR,
  IngredientId,
  RecipeId,
  RecipeName,
  RecipeVersionSpec,
  SourceId
} from '../common';
import { IRecipe, IRecipeScaleOptions, IRecipeUsage, Recipe } from '../recipes';
import { IGanacheCalculation } from '../calculations';
import { IResolvedRecipeIngredient, IRuntimeRecipe } from './model';
import { RuntimeVersion } from './runtimeVersion';
import { AnyRuntimeIngredient } from './ingredients';
import { RuntimeScaledVersion } from './runtimeScaledVersion';

// ============================================================================
// Internal Context Interface
// ============================================================================

/*
 * TODO: eliminate these sorts of forward declarations tucked away in various modules.  define a full context object in the model if needed.
 */

/**
 * Minimal context interface for RuntimeRecipe.
 * @internal
 */
interface IRecipeContext {
  getIngredient(id: IngredientId): Result<AnyRuntimeIngredient>;
  getRecipe(id: RecipeId): Result<IRuntimeRecipe>;
  calculateGanacheForVersion(recipeId: RecipeId, versionSpec: RecipeVersionSpec): Result<IGanacheCalculation>;
  calculateGanache(recipeId: RecipeId, versionSpec?: RecipeVersionSpec): Result<IGanacheCalculation>;
  scaleRecipe(
    recipeId: RecipeId,
    targetWeight: Grams,
    options?: IRecipeScaleOptions
  ): Result<RuntimeScaledVersion>;
}

// ============================================================================
// RuntimeRecipe Class
// ============================================================================

/**
 * A resolved view of a recipe with navigation and version access.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class RuntimeRecipe {
  private readonly _context: IRecipeContext;
  private readonly _id: RecipeId;
  private readonly _recipe: Recipe | IRecipe;
  private readonly _sourceId: SourceId;
  private readonly _baseId: BaseRecipeId;

  // Lazy-loaded versions
  private _goldenVersion: RuntimeVersion | undefined;
  private _versions: ReadonlyArray<RuntimeVersion> | undefined;
  private _latestVersion: RuntimeVersion | undefined;
  private _allIngredientIds: Set<IngredientId> | undefined;

  /**
   * Creates a RuntimeRecipe.
   * Use RuntimeContext.getRecipe() instead of calling this directly.
   * @internal
   */
  public constructor(context: IRecipeContext, id: RecipeId, recipe: Recipe | IRecipe) {
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
    context: IRecipeContext,
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
  // Usage History
  // ============================================================================

  /**
   * Raw usage records
   */
  public get usage(): ReadonlyArray<IRecipeUsage> {
    return this._recipe.usage;
  }

  /**
   * Whether this recipe has ever been used
   */
  public get hasBeenUsed(): boolean {
    return this._recipe.usage.length > 0;
  }

  /**
   * Number of times this recipe has been used
   */
  public get usageCount(): number {
    return this._recipe.usage.length;
  }

  /**
   * Gets the most recent usage record
   */
  public get latestUsage(): IRecipeUsage | undefined {
    if (this._recipe.usage.length === 0) {
      return undefined;
    }
    /* c8 ignore next - ternary branches depend on data ordering */
    return this._recipe.usage.reduce((latest, current) => (current.date > latest.date ? current : latest));
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

  /**
   * Gets resolved ingredients from the golden version.
   * Convenience method - same as goldenVersion.getIngredients()
   */
  public get ingredients(): ReadonlyArray<IResolvedRecipeIngredient<AnyRuntimeIngredient>> {
    // orThrow is safe here - ingredient resolution should not fail for valid recipes
    return [...this.goldenVersion.getIngredients().orThrow()];
  }

  // ============================================================================
  // Operations
  // ============================================================================

  /**
   * Scales the golden version to a target weight.
   * @param targetWeight - Target total weight in grams
   * @param options - Optional scaling options
   * @returns Success with RuntimeScaledVersion, or Failure if scaling fails
   */
  public scale(targetWeight: Grams, options?: IRecipeScaleOptions): Result<RuntimeScaledVersion> {
    return this._context.scaleRecipe(this._id, targetWeight, options);
  }

  /**
   * Scales a specific version to a target weight.
   * @param versionSpec - The version to scale
   * @param targetWeight - Target total weight in grams
   * @param options - Optional scaling options (versionSpec will be overridden)
   * @returns Success with RuntimeScaledVersion, or Failure if scaling fails
   */
  public scaleVersion(
    versionSpec: RecipeVersionSpec,
    targetWeight: Grams,
    options?: Omit<IRecipeScaleOptions, 'versionSpec'>
  ): Result<RuntimeScaledVersion> {
    return this._context.scaleRecipe(this._id, targetWeight, { ...options, versionSpec: versionSpec });
  }

  /**
   * Scales by a multiplicative factor.
   * @param factor - Multiplicative factor (e.g., 2.0 for double)
   * @param options - Optional scaling options
   * @returns Success with RuntimeScaledVersion, or Failure if scaling fails
   */
  public scaleByFactor(factor: number, options?: IRecipeScaleOptions): Result<RuntimeScaledVersion> {
    const targetWeight = (this.goldenVersion.baseWeight * factor) as Grams;
    return this.scale(targetWeight, options);
  }

  /**
   * Calculates ganache characteristics for the golden version.
   * @returns Success with ganache calculation, or Failure if calculation fails
   */
  public calculateGanache(): Result<IGanacheCalculation> {
    // TODO: putting logic in the context and calling it from the entity is inverted.  the recipe should know how to scale itself - the context adds no value here.
    return this._context.calculateGanache(this._id);
  }

  /**
   * Calculates ganache characteristics for a specific version.
   * @param versionSpec - The version to analyze
   * @returns Success with ganache calculation, or Failure if calculation fails
   */
  public calculateGanacheForVersion(versionSpec: RecipeVersionSpec): Result<IGanacheCalculation> {
    // TODO: putting logic in the context and calling it from the entity is inverted.  the recipe should know how to calculate ganache characteristics itself - the context adds no value here.
    return this._context.calculateGanache(this._id, versionSpec);
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

  // TODO: why do we need this method?  who uses it?  consider removal.
  /**
   * Gets the underlying Recipe class instance if available.
   * Returns undefined if the raw data is a plain IRecipe.
   */
  /* c8 ignore next 3 - rawAsRecipe returns undefined when constructed with plain IRecipe */
  public get rawAsRecipe(): Recipe | undefined {
    return this._recipe instanceof Recipe ? this._recipe : undefined;
  }
}
