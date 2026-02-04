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
 * RuntimeFillingRecipe - resolved recipe view with navigation
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import {
  BaseFillingId,
  Converters,
  Helpers,
  IngredientId,
  FillingId,
  FillingName,
  FillingVersionSpec,
  CollectionId
} from '../../common';
import { IFillingRecipeEntity } from '../../entities';
import { IIngredientQueryOptions, IFillingRecipe, IVersionContext } from '../model';
import { RuntimeFillingRecipeVersion } from './fillingRecipeVersion';
import { AnyRuntimeIngredient } from '../ingredients';

// Specialize the context interface with concrete ingredient type
type RecipeContext = IVersionContext<AnyRuntimeIngredient>;

// ============================================================================
// RuntimeFillingRecipe Class
// ============================================================================

/**
 * A resolved view of a recipe with navigation and version access.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class RuntimeFillingRecipe implements IFillingRecipe {
  private readonly _context: RecipeContext;
  private readonly _id: FillingId;
  private readonly _recipe: IFillingRecipeEntity;
  private readonly _sourceId: CollectionId;
  private readonly _baseId: BaseFillingId;

  // Lazy-loaded versions
  private _goldenVersion: RuntimeFillingRecipeVersion | undefined;
  private _versions: ReadonlyArray<RuntimeFillingRecipeVersion> | undefined;
  private _latestVersion: RuntimeFillingRecipeVersion | undefined;
  private _preferredIngredientIds: Set<IngredientId> | undefined;
  private _allIngredientIds: Set<IngredientId> | undefined;

  /**
   * Creates a RuntimeFillingRecipe.
   * Use {@link RuntimeFillingRecipe.create} or RuntimeContext.getRecipe() instead of calling this directly.
   * @internal
   */
  protected constructor(context: RecipeContext, id: FillingId, recipe: IFillingRecipeEntity) {
    this._context = context;
    this._id = id;
    this._recipe = recipe;

    const parsed = Converters.parsedFillingId.convert(id).orThrow();
    this._sourceId = parsed.collectionId;
    this._baseId = parsed.itemId;
  }

  /**
   * Factory method for creating a RuntimeFillingRecipe.
   * @param context - The runtime context
   * @param id - The recipe ID
   * @param recipe - The raw recipe data
   * @returns Success with RuntimeFillingRecipe
   */
  public static create(
    context: RecipeContext,
    id: FillingId,
    recipe: IFillingRecipeEntity
  ): Result<RuntimeFillingRecipe> {
    return Success.with(new RuntimeFillingRecipe(context, id, recipe));
  }

  // ============================================================================
  // Identity
  // ============================================================================

  /**
   * The composite recipe ID (e.g., "user.dark-ganache")
   */
  public get id(): FillingId {
    return this._id;
  }

  /**
   * The source ID part of the composite ID
   */
  public get collectionId(): CollectionId {
    return this._sourceId;
  }

  /**
   * The base recipe ID within the source
   */
  public get baseId(): BaseFillingId {
    return this._baseId;
  }

  // ============================================================================
  // Core Properties
  // ============================================================================

  /**
   * Human-readable recipe name
   */
  public get name(): FillingName {
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
  public get goldenVersionSpec(): FillingVersionSpec {
    return this._recipe.goldenVersionSpec;
  }

  // ============================================================================
  // Version Navigation (lazy)
  // ============================================================================

  /**
   * The golden (default approved) version - resolved.
   * Resolved lazily on first access.
   */
  public get goldenVersion(): RuntimeFillingRecipeVersion {
    if (this._goldenVersion === undefined) {
      const rawVersion = this._recipe.versions.find((v) => v.versionSpec === this._recipe.goldenVersionSpec);
      /* c8 ignore next 3 - defensive coding: data validation ensures golden version exists */
      if (!rawVersion) {
        throw new Error(`Golden version ${this._recipe.goldenVersionSpec} not found in recipe ${this._id}`);
      }
      this._goldenVersion = new RuntimeFillingRecipeVersion(this._context, this._id, rawVersion);
    }
    return this._goldenVersion;
  }

  /**
   * All versions - resolved.
   * Resolved lazily on first access.
   */
  public get versions(): ReadonlyArray<RuntimeFillingRecipeVersion> {
    if (this._versions === undefined) {
      this._versions = this._recipe.versions.map(
        (v) => new RuntimeFillingRecipeVersion(this._context, this._id, v)
      );
    }
    return this._versions;
  }

  /**
   * Gets a specific version by ID.
   * @param versionSpec - The version ID to find
   * @returns Success with RuntimeFillingRecipeVersion, or Failure if not found
   */
  public getVersion(versionSpec: FillingVersionSpec): Result<RuntimeFillingRecipeVersion> {
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
  public get latestVersion(): RuntimeFillingRecipeVersion {
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
        this._latestVersion = new RuntimeFillingRecipeVersion(this._context, this._id, latestRaw);
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
   * Gets unique ingredient IDs used across all versions.
   * By default, returns only preferred ingredients (primary choice for each ingredient slot).
   * Pass `{ includeAlternates: true }` to include all ingredient options.
   * @param options - Query options
   * @returns Set of ingredient IDs
   */
  public getIngredientIds(options?: IIngredientQueryOptions): ReadonlySet<IngredientId> {
    if (options?.includeAlternates) {
      return this._getAllIngredientIds();
    }
    return this._getPreferredIngredientIds();
  }

  /**
   * Gets all unique ingredient IDs (preferred only) - cached.
   */
  private _getPreferredIngredientIds(): ReadonlySet<IngredientId> {
    if (this._preferredIngredientIds === undefined) {
      this._preferredIngredientIds = new Set<IngredientId>();
      for (const version of this._recipe.versions) {
        for (const ri of version.ingredients) {
          const preferredId = Helpers.getPreferredIdOrFirst(ri.ingredient);
          /* c8 ignore next 3 - defensive: converter validates ids array is non-empty */
          if (preferredId !== undefined) {
            this._preferredIngredientIds.add(preferredId);
          }
        }
      }
    }
    return this._preferredIngredientIds;
  }

  /**
   * Gets all unique ingredient IDs (including alternates) - cached.
   */
  private _getAllIngredientIds(): ReadonlySet<IngredientId> {
    if (this._allIngredientIds === undefined) {
      this._allIngredientIds = new Set<IngredientId>();
      for (const version of this._recipe.versions) {
        for (const ri of version.ingredients) {
          for (const id of ri.ingredient.ids) {
            this._allIngredientIds.add(id);
          }
        }
      }
    }
    return this._allIngredientIds;
  }

  /**
   * Checks if any version uses a specific ingredient.
   * By default, only checks preferred ingredients.
   * Pass `{ includeAlternates: true }` to also check alternate ingredients.
   * @param ingredientId - The ingredient ID to check
   * @param options - Query options
   * @returns True if the ingredient is used in any version
   */
  public usesIngredient(ingredientId: IngredientId, options?: IIngredientQueryOptions): boolean {
    return this.getIngredientIds(options).has(ingredientId);
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw recipe data
   */
  public get raw(): IFillingRecipeEntity {
    return this._recipe;
  }
}
