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
 * FillingRecipe - resolved recipe view with navigation
 * @packageDocumentation
 */

import { Failure, Result, Success, mapResults } from '@fgv/ts-utils';

import {
  BaseFillingId,
  Converters,
  Helpers,
  IngredientId,
  FillingId,
  FillingName,
  FillingRecipeVariationSpec,
  CollectionId
} from '../../common';
import { IFillingRecipeEntity } from '../../entities';
import { IIngredientQueryOptions, IFillingRecipe, IVariationContext } from '../model';
import { FillingRecipeVariation } from './fillingRecipeVersion';
import { AnyIngredient } from '../ingredients';

// Specialize the context interface with concrete ingredient type
type RecipeContext = IVariationContext<AnyIngredient>;

// ============================================================================
// FillingRecipe Class
// ============================================================================

/**
 * A resolved view of a recipe with navigation and variation access.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class FillingRecipe implements IFillingRecipe {
  private readonly _context: RecipeContext;
  private readonly _id: FillingId;
  private readonly _recipe: IFillingRecipeEntity;
  private readonly _sourceId: CollectionId;
  private readonly _baseId: BaseFillingId;

  // Lazy-loaded variations
  private _goldenVariation: FillingRecipeVariation | undefined;
  private _variations: ReadonlyArray<FillingRecipeVariation> | undefined;
  private _latestVariation: FillingRecipeVariation | undefined;
  private _preferredIngredientIds: Set<IngredientId> | undefined;
  private _allIngredientIds: Set<IngredientId> | undefined;

  /**
   * Creates a FillingRecipe.
   * Use {@link FillingRecipe.create} or Context.getRecipe() instead of calling this directly.
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
   * Factory method for creating a FillingRecipe.
   * @param context - The runtime context
   * @param id - The recipe ID
   * @param recipe - The data layer recipe entity
   * @returns Success with FillingRecipe
   */
  public static create(
    context: RecipeContext,
    id: FillingId,
    recipe: IFillingRecipeEntity
  ): Result<FillingRecipe> {
    return Success.with(new FillingRecipe(context, id, recipe));
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
   * The golden variation ID
   */
  public get goldenVariationSpec(): FillingRecipeVariationSpec {
    return this._recipe.goldenVariationSpec;
  }

  // ============================================================================
  // Variation Navigation (lazy)
  // ============================================================================

  /**
   * Gets the golden (default approved) variation - resolved.
   * Resolved lazily on first access.
   * @returns Result with golden variation, or Failure if creation fails
   * @public
   */
  public getGoldenVariation(): Result<FillingRecipeVariation> {
    if (this._goldenVariation === undefined) {
      const entity = this._recipe.variations.find(
        (v) => v.variationSpec === this._recipe.goldenVariationSpec
      );
      /* c8 ignore next 3 - defensive coding: data validation ensures golden variation exists */
      if (!entity) {
        return Failure.with(
          `Golden variation ${this._recipe.goldenVariationSpec} not found in recipe ${this._id}`
        );
      }
      return FillingRecipeVariation.create(this._context, this._id, entity).onSuccess((variation) => {
        this._goldenVariation = variation;
        return Success.with(variation);
      });
    }
    return Success.with(this._goldenVariation);
  }

  /**
   * The golden (default approved) variation - resolved.
   * Resolved lazily on first access.
   * @throws if variation creation fails - prefer getGoldenVariation() for proper error handling
   */
  public get goldenVariation(): FillingRecipeVariation {
    return this.getGoldenVariation().orThrow();
  }

  /**
   * Gets all variations - resolved.
   * Resolved lazily on first access.
   * @returns Result with all variations, or Failure if any variation creation fails
   * @public
   */
  public getVariations(): Result<ReadonlyArray<FillingRecipeVariation>> {
    if (this._variations === undefined) {
      return mapResults(
        this._recipe.variations.map((v) => FillingRecipeVariation.create(this._context, this._id, v))
      ).onSuccess((variations) => {
        this._variations = variations;
        return Success.with(variations);
      });
    }
    return Success.with(this._variations);
  }

  /**
   * All variations - resolved.
   * Resolved lazily on first access.
   * @throws if variation creation fails - prefer getVariations() for proper error handling
   */
  public get variations(): ReadonlyArray<FillingRecipeVariation> {
    return this.getVariations().orThrow();
  }

  /**
   * Gets a specific variation by ID.
   * @param variationSpec - The variation ID to find
   * @returns Success with FillingRecipeVariation, or Failure if not found
   */
  public getVariation(variationSpec: FillingRecipeVariationSpec): Result<FillingRecipeVariation> {
    const variation = this.variations.find((v) => v.variationSpec === variationSpec);
    if (!variation) {
      return Failure.with(`Variation ${variationSpec} not found in recipe ${this._id}`);
    }
    return Success.with(variation);
  }

  /**
   * Gets the latest variation (by created date).
   * Resolved lazily on first access.
   * @returns Result with latest variation, or Failure if creation fails
   * @public
   */
  public getLatestVariation(): Result<FillingRecipeVariation> {
    if (this._latestVariation === undefined) {
      // Find variation with latest created date
      let latestEntity = this._recipe.variations[0];
      for (const v of this._recipe.variations) {
        if (v.createdDate > latestEntity.createdDate) {
          latestEntity = v;
        }
      }
      // Check if it's the same as golden variation to reuse
      if (latestEntity.variationSpec === this._recipe.goldenVariationSpec) {
        return this.getGoldenVariation().onSuccess((variation) => {
          this._latestVariation = variation;
          return Success.with(variation);
        });
      } else {
        return FillingRecipeVariation.create(this._context, this._id, latestEntity).onSuccess((variation) => {
          this._latestVariation = variation;
          return Success.with(variation);
        });
      }
    }
    return Success.with(this._latestVariation);
  }

  /**
   * Gets the latest variation (by created date).
   * Resolved lazily on first access.
   * @throws if variation creation fails - prefer getLatestVariation() for proper error handling
   */
  public get latestVariation(): FillingRecipeVariation {
    return this.getLatestVariation().orThrow();
  }

  /**
   * Number of variations
   */
  public get variationCount(): number {
    return this._recipe.variations.length;
  }

  // ============================================================================
  // Ingredient Queries
  // ============================================================================

  /**
   * Gets unique ingredient IDs used across all variations.
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
      for (const variation of this._recipe.variations) {
        for (const ri of variation.ingredients) {
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
      for (const variation of this._recipe.variations) {
        for (const ri of variation.ingredients) {
          for (const id of ri.ingredient.ids) {
            this._allIngredientIds.add(id);
          }
        }
      }
    }
    return this._allIngredientIds;
  }

  /**
   * Checks if any variation uses a specific ingredient.
   * By default, only checks preferred ingredients.
   * Pass `{ includeAlternates: true }` to also check alternate ingredients.
   * @param ingredientId - The ingredient ID to check
   * @param options - Query options
   * @returns True if the ingredient is used in any variation
   */
  public usesIngredient(ingredientId: IngredientId, options?: IIngredientQueryOptions): boolean {
    return this.getIngredientIds(options).has(ingredientId);
  }

  /**
   * Gets the underlying recipe data entity
   */
  public get entity(): IFillingRecipeEntity {
    return this._recipe;
  }
}
