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

import { ChocolateType, IngredientId, RecipeId } from '../common';
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
  private _ingredientToRecipes: Map<IngredientId, Set<RecipeId>> | undefined;
  private _ingredientUsage: Map<IngredientId, IIngredientUsageInfo[]> | undefined;
  private _tagToRecipes: Map<string, Set<RecipeId>> | undefined;
  private _tagToIngredients: Map<string, Set<IngredientId>> | undefined;
  private _chocolateTypeToRecipes: Map<ChocolateType, Set<RecipeId>> | undefined;

  /**
   * Creates a new reverse index for the given library
   */
  public constructor(library: ChocolateLibrary) {
    this._library = library;
  }

  // ============================================================================
  // Ingredient → Recipe Lookups
  // ============================================================================

  /**
   * Gets recipe IDs that use a specific ingredient (as primary or alternate).
   * @param ingredientId - The ingredient ID to look up
   * @returns Set of recipe IDs using this ingredient
   */
  public getRecipesUsingIngredient(ingredientId: IngredientId): ReadonlySet<RecipeId> {
    this._ensureIngredientToRecipesIndex();
    return this._ingredientToRecipes!.get(ingredientId) ?? new Set();
  }

  /**
   * Gets detailed usage information for an ingredient across all recipes.
   * @param ingredientId - The ingredient ID to look up
   * @returns Array of usage info (recipe ID and primary/alternate status)
   */
  public getIngredientUsage(ingredientId: IngredientId): ReadonlyArray<IIngredientUsageInfo> {
    this._ensureIngredientUsageIndex();
    return this._ingredientUsage!.get(ingredientId) ?? [];
  }

  /**
   * Gets recipe IDs where this ingredient is used as the primary (not an alternate).
   * @param ingredientId - The ingredient ID to look up
   * @returns Set of recipe IDs where this is the primary ingredient
   */
  public getRecipesWithPrimaryIngredient(ingredientId: IngredientId): ReadonlySet<RecipeId> {
    const usage = this.getIngredientUsage(ingredientId);
    const result = new Set<RecipeId>();
    for (const info of usage) {
      if (info.isPrimary) {
        result.add(info.recipeId);
      }
    }
    return result;
  }

  /**
   * Gets recipe IDs where this ingredient is listed as an alternate.
   * @param ingredientId - The ingredient ID to look up
   * @returns Set of recipe IDs where this is an alternate ingredient
   */
  public getRecipesWithAlternateIngredient(ingredientId: IngredientId): ReadonlySet<RecipeId> {
    const usage = this.getIngredientUsage(ingredientId);
    const result = new Set<RecipeId>();
    for (const info of usage) {
      if (!info.isPrimary) {
        result.add(info.recipeId);
      }
    }
    return result;
  }

  // ============================================================================
  // Tag Lookups
  // ============================================================================

  /**
   * Gets recipe IDs with a specific tag.
   * @param tag - The tag to look up
   * @returns Set of recipe IDs with this tag
   */
  public getRecipesByTag(tag: string): ReadonlySet<RecipeId> {
    this._ensureTagToRecipesIndex();
    return this._tagToRecipes!.get(tag.toLowerCase()) ?? new Set();
  }

  /**
   * Gets all unique tags used across recipes.
   * @returns Array of all recipe tags
   */
  public getAllRecipeTags(): ReadonlyArray<string> {
    this._ensureTagToRecipesIndex();
    return Array.from(this._tagToRecipes!.keys());
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
   * Gets recipe IDs containing a specific chocolate type.
   * @param type - The chocolate type to look up
   * @returns Set of recipe IDs containing this chocolate type
   */
  public getRecipesByChocolateType(type: ChocolateType): ReadonlySet<RecipeId> {
    this._ensureChocolateTypeIndex();
    return this._chocolateTypeToRecipes!.get(type) ?? new Set();
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * Invalidates all indexes.
   * Call this if the underlying library data changes.
   */
  public invalidate(): void {
    this._ingredientToRecipes = undefined;
    this._ingredientUsage = undefined;
    this._tagToRecipes = undefined;
    this._tagToIngredients = undefined;
    this._chocolateTypeToRecipes = undefined;
  }

  /**
   * Pre-builds all indexes.
   * Useful for warming up the cache before heavy query usage.
   */
  public warmUp(): void {
    this._ensureIngredientToRecipesIndex();
    this._ensureIngredientUsageIndex();
    this._ensureTagToRecipesIndex();
    this._ensureTagToIngredientsIndex();
    this._ensureChocolateTypeIndex();
  }

  // ============================================================================
  // Private Index Building
  // ============================================================================

  private _ensureIngredientToRecipesIndex(): void {
    if (this._ingredientToRecipes !== undefined) {
      return;
    }

    this._ingredientToRecipes = new Map<IngredientId, Set<RecipeId>>();
    const recipes = this._library.recipes;

    for (const [recipeId, recipe] of recipes.entries()) {
      // Index ingredients from all versions
      for (const version of recipe.versions) {
        for (const ri of version.ingredients) {
          // Primary ingredient
          this._addToIndex(this._ingredientToRecipes, ri.ingredientId, recipeId as RecipeId);

          // Alternate ingredients
          if (ri.alternateIngredientIds) {
            for (const altId of ri.alternateIngredientIds) {
              this._addToIndex(this._ingredientToRecipes, altId, recipeId as RecipeId);
            }
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
    const recipes = this._library.recipes;

    for (const [recipeId, recipe] of recipes.entries()) {
      // Index ingredients from all versions
      for (const version of recipe.versions) {
        for (const ri of version.ingredients) {
          // Primary ingredient
          this._addUsageInfo(this._ingredientUsage, ri.ingredientId, {
            recipeId: recipeId as RecipeId,
            isPrimary: true
          });

          // Alternate ingredients
          if (ri.alternateIngredientIds) {
            for (const altId of ri.alternateIngredientIds) {
              this._addUsageInfo(this._ingredientUsage, altId, {
                recipeId: recipeId as RecipeId,
                isPrimary: false
              });
            }
          }
        }
      }
    }
  }

  private _ensureTagToRecipesIndex(): void {
    if (this._tagToRecipes !== undefined) {
      return;
    }

    this._tagToRecipes = new Map<string, Set<RecipeId>>();
    const recipes = this._library.recipes;

    for (const [recipeId, recipe] of recipes.entries()) {
      if (recipe.tags) {
        for (const tag of recipe.tags) {
          this._addToIndex(this._tagToRecipes, tag.toLowerCase(), recipeId as RecipeId);
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

  private _ensureChocolateTypeIndex(): void {
    if (this._chocolateTypeToRecipes !== undefined) {
      return;
    }

    this._chocolateTypeToRecipes = new Map<ChocolateType, Set<RecipeId>>();
    const recipes = this._library.recipes;
    const ingredients = this._library.ingredients;

    for (const [recipeId, recipe] of recipes.entries()) {
      // Check golden version for chocolate types
      const goldenVersion = recipe.versions.find((v) => v.versionSpec === recipe.goldenVersionSpec);
      /* c8 ignore next - defensive: data validation ensures golden version exists */
      if (!goldenVersion) continue;

      for (const ri of goldenVersion.ingredients) {
        const ingredientResult = ingredients.get(ri.ingredientId);
        if (ingredientResult.isSuccess()) {
          const ingredient = ingredientResult.value;
          if (isChocolateIngredient(ingredient)) {
            this._addToIndex(this._chocolateTypeToRecipes, ingredient.chocolateType, recipeId as RecipeId);
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
    if (!usage.some((u) => u.recipeId === info.recipeId && u.isPrimary === info.isPrimary)) {
      usage.push(info);
    }
  }
}
