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
 * Reverse lookup indexes for efficient runtime queries
 * @packageDocumentation
 */

import { ChocolateType, Helpers, IngredientId, FillingId } from '../common';
import { isChocolateIngredient } from '../ingredients';
import { ChocolateLibrary } from './chocolateLibrary';
import { IIngredientUsageInfo } from './model';

// ============================================================================
// RuntimeReverseIndex Class
// ============================================================================

/*
 * TODO: consider generalizing this to:
 * - an extensible index class, so we end up with e.g. IngredientByRecipeIndexer, RecipeByTagIndexer, etc.
 * - the RuntimeReverseIndex becomes a manager of multiple indexers.
 * - integrate this notion with search/find parameters that end up with the user - so we have a single find which invokes the correct indexers based on user parameters
 *
 * For most of these indexes we can use the data layer (rather than the runtime layer) so we don't end up instantiating all the things when we warm any index.  I would
 * still lazily warm them, though.
 *
 * This is enough logic that it should move to a subdirectory (like ingredients)
 */

/**
 * Maintains reverse lookup indexes for efficient queries.
 * Indexes are built lazily on first access.
 * @internal
 */
export class RuntimeReverseIndex {
  private readonly _library: ChocolateLibrary;

  // Lazily built indexes
  private _ingredientToFillings: Map<IngredientId, Set<FillingId>> | undefined;
  private _ingredientUsage: Map<IngredientId, IIngredientUsageInfo[]> | undefined;
  private _tagToFillings: Map<string, Set<FillingId>> | undefined;
  private _tagToIngredients: Map<string, Set<IngredientId>> | undefined;
  private _chocolateTypeToFillings: Map<ChocolateType, Set<FillingId>> | undefined;

  /**
   * Creates a new reverse index for the given library
   */
  public constructor(library: ChocolateLibrary) {
    this._library = library;
  }

  // ============================================================================
  // Ingredient → Filling Lookups
  // ============================================================================

  /**
   * Gets filling IDs that use a specific ingredient (as primary or alternate).
   * @param ingredientId - The ingredient ID to look up
   * @returns Set of filling IDs using this ingredient
   */
  public getFillingsUsingIngredient(ingredientId: IngredientId): ReadonlySet<FillingId> {
    this._ensureIngredientToFillingsIndex();
    return this._ingredientToFillings!.get(ingredientId) ?? new Set();
  }

  /**
   * Gets detailed usage information for an ingredient across all fillings.
   * @param ingredientId - The ingredient ID to look up
   * @returns Array of usage info (filling ID and primary/alternate status)
   */
  public getIngredientUsage(ingredientId: IngredientId): ReadonlyArray<IIngredientUsageInfo> {
    this._ensureIngredientUsageIndex();
    return this._ingredientUsage!.get(ingredientId) ?? [];
  }

  /**
   * Gets filling IDs where this ingredient is used as the primary (not an alternate).
   * @param ingredientId - The ingredient ID to look up
   * @returns Set of filling IDs where this is the primary ingredient
   */
  public getFillingsWithPrimaryIngredient(ingredientId: IngredientId): ReadonlySet<FillingId> {
    const usage = this.getIngredientUsage(ingredientId);
    const result = new Set<FillingId>();
    for (const info of usage) {
      if (info.isPrimary) {
        result.add(info.fillingId);
      }
    }
    return result;
  }

  /**
   * Gets filling IDs where this ingredient is listed as an alternate.
   * @param ingredientId - The ingredient ID to look up
   * @returns Set of filling IDs where this is an alternate ingredient
   */
  public getFillingsWithAlternateIngredient(ingredientId: IngredientId): ReadonlySet<FillingId> {
    const usage = this.getIngredientUsage(ingredientId);
    const result = new Set<FillingId>();
    for (const info of usage) {
      if (!info.isPrimary) {
        result.add(info.fillingId);
      }
    }
    return result;
  }

  // ============================================================================
  // Tag Lookups
  // ============================================================================

  /**
   * Gets filling IDs with a specific tag.
   * @param tag - The tag to look up
   * @returns Set of filling IDs with this tag
   */
  public getFillingsByTag(tag: string): ReadonlySet<FillingId> {
    this._ensureTagToFillingsIndex();
    return this._tagToFillings!.get(tag.toLowerCase()) ?? new Set();
  }

  /**
   * Gets all unique tags used across fillings.
   * @returns Array of all filling tags
   */
  public getAllFillingTags(): ReadonlyArray<string> {
    this._ensureTagToFillingsIndex();
    return Array.from(this._tagToFillings!.keys());
  }

  /**
   * Gets ingredient IDs with a specific tag.
   * @param tag - The tag to look up
   * @returns Set of ingredient IDs with this tag
   */
  public getIngredientsByTag(tag: string): ReadonlySet<IngredientId> {
    this._ensureTagToIngredientsIndex();
    /* c8 ignore next - empty set returned for unknown tag */
    return this._tagToIngredients!.get(tag.toLowerCase()) ?? new Set();
  }

  /**
   * Gets all unique tags used across ingredients.
   * @returns Array of all ingredient tags
   */
  public getAllIngredientTags(): ReadonlyArray<string> {
    this._ensureTagToIngredientsIndex();
    return Array.from(this._tagToIngredients!.keys());
  }

  // ============================================================================
  // Chocolate Type Lookups
  // ============================================================================

  /**
   * Gets filling IDs containing a specific chocolate type.
   * @param type - The chocolate type to look up
   * @returns Set of filling IDs containing this chocolate type
   */
  public getFillingsByChocolateType(type: ChocolateType): ReadonlySet<FillingId> {
    this._ensureChocolateTypeToFillingsIndex();
    return this._chocolateTypeToFillings!.get(type) ?? new Set();
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * Invalidates all indexes.
   * Call this if the underlying library data changes.
   */
  public invalidate(): void {
    this._ingredientToFillings = undefined;
    this._ingredientUsage = undefined;
    this._tagToFillings = undefined;
    this._tagToIngredients = undefined;
    this._chocolateTypeToFillings = undefined;
  }

  /**
   * Pre-builds all indexes.
   * Useful for warming up the cache before heavy query usage.
   */
  public warmUp(): void {
    this._ensureIngredientToFillingsIndex();
    this._ensureIngredientUsageIndex();
    this._ensureTagToFillingsIndex();
    this._ensureTagToIngredientsIndex();
    this._ensureChocolateTypeToFillingsIndex();
  }

  // ============================================================================
  // Private Index Building
  // ============================================================================

  private _ensureIngredientToFillingsIndex(): void {
    if (this._ingredientToFillings !== undefined) {
      return;
    }

    this._ingredientToFillings = new Map<IngredientId, Set<FillingId>>();
    const recipes = this._library.fillings;

    for (const [fillingId, recipe] of recipes.entries()) {
      // Index ingredients from all versions
      for (const version of recipe.versions) {
        for (const ri of version.ingredients) {
          // Index all ingredient IDs (primary and alternates)
          for (const id of ri.ingredient.ids) {
            this._addToIndex(this._ingredientToFillings, id, fillingId as FillingId);
          }
        }
      }
    }
  }

  private _ensureIngredientUsageIndex(): void {
    /* c8 ignore next 3 - early return when index already built, tested via getIngredientUsage */
    if (this._ingredientUsage !== undefined) {
      return;
    }

    this._ingredientUsage = new Map<IngredientId, IIngredientUsageInfo[]>();
    const recipes = this._library.fillings;

    for (const [fillingId, recipe] of recipes.entries()) {
      // Index ingredients from all versions
      for (const version of recipe.versions) {
        for (const ri of version.ingredients) {
          // Get the primary ingredient ID (preferred or first)
          const primaryId = Helpers.getPreferredIdOrFirst(ri.ingredient);

          // Index all ingredient IDs with primary/alternate status
          for (const id of ri.ingredient.ids) {
            this._addUsageInfo(this._ingredientUsage, id, {
              fillingId: fillingId as FillingId,
              isPrimary: id === primaryId
            });
          }
        }
      }
    }
  }

  private _ensureTagToFillingsIndex(): void {
    if (this._tagToFillings !== undefined) {
      return;
    }

    this._tagToFillings = new Map<string, Set<FillingId>>();
    const recipes = this._library.fillings;

    for (const [fillingId, recipe] of recipes.entries()) {
      if (recipe.tags) {
        for (const tag of recipe.tags) {
          this._addToIndex(this._tagToFillings, tag.toLowerCase(), fillingId as FillingId);
        }
      }
    }
  }

  private _ensureTagToIngredientsIndex(): void {
    if (this._tagToIngredients !== undefined) {
      return;
    }

    this._tagToIngredients = new Map<string, Set<IngredientId>>();
    const ingredients = this._library.ingredients;

    for (const [ingredientId, ingredient] of ingredients.entries()) {
      if (ingredient.tags) {
        for (const tag of ingredient.tags) {
          this._addToIndex(this._tagToIngredients, tag.toLowerCase(), ingredientId as IngredientId);
        }
      }
    }
  }

  private _ensureChocolateTypeToFillingsIndex(): void {
    if (this._chocolateTypeToFillings !== undefined) {
      return;
    }

    this._chocolateTypeToFillings = new Map<ChocolateType, Set<FillingId>>();
    const recipes = this._library.fillings;
    const ingredients = this._library.ingredients;

    for (const [fillingId, recipe] of recipes.entries()) {
      // Check golden version for chocolate types
      const goldenVersion = recipe.versions.find((v) => v.versionSpec === recipe.goldenVersionSpec);
      /* c8 ignore next - defensive: data validation ensures golden version exists */
      if (!goldenVersion) continue;

      for (const ri of goldenVersion.ingredients) {
        const ingredientId = Helpers.getPreferredIdOrFirst(ri.ingredient);
        /* c8 ignore next - defensive: recipe ingredients always have at least one ID */
        if (ingredientId === undefined) continue;
        const ingredientResult = ingredients.get(ingredientId);
        if (ingredientResult.isSuccess()) {
          const ingredient = ingredientResult.value;
          if (isChocolateIngredient(ingredient)) {
            this._addToIndex(this._chocolateTypeToFillings, ingredient.chocolateType, fillingId as FillingId);
          }
        }
      }
    }
  }

  private _addToIndex<TKey, TValue>(index: Map<TKey, Set<TValue>>, key: TKey, value: TValue): void {
    let set = index.get(key);
    if (!set) {
      set = new Set<TValue>();
      index.set(key, set);
    }
    set.add(value);
  }

  private _addUsageInfo(
    index: Map<IngredientId, IIngredientUsageInfo[]>,
    ingredientId: IngredientId,
    info: IIngredientUsageInfo
  ): void {
    let usage = index.get(ingredientId);
    if (!usage) {
      usage = [];
      index.set(ingredientId, usage);
    }
    // Avoid duplicates for same recipe
    if (!usage.some((u) => u.fillingId === info.fillingId && u.isPrimary === info.isPrimary)) {
      usage.push(info);
    }
  }
}
