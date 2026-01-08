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
 * Indexer for finding recipes by category
 * @packageDocumentation
 */

import { Converter, Converters, Result, Success } from '@fgv/ts-utils';
import { RecipeId } from '../../common';
import { allRecipeCategories, RecipeCategory } from '../../recipes';
import { ChocolateLibrary } from '../chocolateLibrary';
import { IRuntimeRecipe } from '../model';
import { BaseIndexer } from './baseIndexer';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for the RecipesByCategory indexer.
 * @public
 */
export interface IRecipesByCategoryConfig {
  /**
   * The recipe category to search for.
   */
  readonly category: RecipeCategory;
}

/**
 * Creates a RecipesByCategory config.
 * @public
 */
export function recipesByCategoryConfig(category: RecipeCategory): IRecipesByCategoryConfig {
  return { category };
}

/**
 * Converter for RecipesByCategory config from JSON.
 * @public
 */
export const recipesByCategoryConfigConverter: Converter<IRecipesByCategoryConfig> =
  Converters.strictObject<IRecipesByCategoryConfig>({
    category: Converters.enumeratedValue(allRecipeCategories)
  });

// ============================================================================
// RecipesByCategoryIndexer Class
// ============================================================================

/**
 * Indexer that finds recipes with a specific category.
 *
 * @public
 */
export class RecipesByCategoryIndexer extends BaseIndexer<
  IRuntimeRecipe,
  RecipeId,
  IRecipesByCategoryConfig
> {
  // Index structure: category -> recipe IDs
  private _categoryToRecipes: Map<RecipeCategory, Set<RecipeId>> | undefined;

  /**
   * Creates a new RecipesByCategoryIndexer.
   * @param library - The chocolate library to index
   */
  public constructor(library: ChocolateLibrary) {
    super(library);
  }

  /**
   * Gets all categories that have at least one recipe.
   * Note: Forces index build if not already built.
   * @returns Array of categories
   */
  public getAllCategories(): ReadonlyArray<RecipeCategory> {
    this._ensureBuilt();
    return Array.from(this._categoryToRecipes!.keys());
  }

  /** {@inheritdoc Runtime.Indexers.BaseIndexer._buildIndex} */
  protected _buildIndex(): void {
    this._categoryToRecipes = new Map<RecipeCategory, Set<RecipeId>>();
    const recipes = this.library.recipes;

    for (const [recipeId, recipe] of recipes.entries()) {
      if (recipe.category) {
        this._addToSetIndex(this._categoryToRecipes, recipe.category, recipeId as RecipeId);
      }
    }
  }

  /** {@inheritdoc Runtime.Indexers.BaseIndexer._clearIndex} */
  protected _clearIndex(): void {
    this._categoryToRecipes = undefined;
  }

  /** {@inheritdoc Runtime.Indexers.BaseIndexer._findInternal} */
  protected _findInternal(
    config: IRecipesByCategoryConfig
  ): Result<ReadonlyArray<IRuntimeRecipe | RecipeId>> {
    const recipeIds = this._getFromSetIndex(this._categoryToRecipes!, config.category);
    return Success.with(recipeIds);
  }
}
