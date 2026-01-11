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
 * Indexer for finding recipes by tag
 * @packageDocumentation
 */

import { Converter, Converters, Result, Success } from '@fgv/ts-utils';
import { FillingId } from '../../common';
import { ChocolateLibrary } from '../chocolateLibrary';
import { IRuntimeFillingRecipe } from '../model';
import { BaseIndexer } from './baseIndexer';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for the RecipesByTag indexer.
 * @public
 */
export interface IRecipesByTagConfig {
  /**
   * The tag to search for (case-insensitive).
   */
  readonly tag: string;
}

/**
 * Creates a RecipesByTag config.
 * @public
 */
export function recipesByTagConfig(tag: string): IRecipesByTagConfig {
  return { tag };
}

/**
 * Converter for RecipesByTag config from JSON.
 * @public
 */
export const recipesByTagConfigConverter: Converter<IRecipesByTagConfig> =
  Converters.strictObject<IRecipesByTagConfig>({
    tag: Converters.string
  });

// ============================================================================
// RecipesByTagIndexer Class
// ============================================================================

/**
 * Indexer that finds recipes with a specific tag.
 * Tag matching is case-insensitive.
 *
 * @public
 */
export class RecipesByTagIndexer extends BaseIndexer<IRuntimeFillingRecipe, FillingId, IRecipesByTagConfig> {
  // Index structure: lowercase tag -> recipe IDs
  private _tagToRecipes: Map<string, Set<FillingId>> | undefined;

  /**
   * Creates a new RecipesByTagIndexer.
   * @param library - The chocolate library to index
   */
  public constructor(library: ChocolateLibrary) {
    super(library);
  }

  /**
   * Gets all unique tags used across recipes.
   * Note: Forces index build if not already built.
   * @returns Array of lowercase tags
   */
  public getAllTags(): ReadonlyArray<string> {
    this._ensureBuilt();
    return Array.from(this._tagToRecipes!.keys());
  }

  /** {@inheritdoc Runtime.Indexers.BaseIndexer._buildIndex} */
  protected _buildIndex(): void {
    this._tagToRecipes = new Map<string, Set<FillingId>>();
    const recipes = this.library.fillings;

    for (const [recipeId, recipe] of recipes.entries()) {
      if (recipe.tags) {
        for (const tag of recipe.tags) {
          this._addToSetIndex(this._tagToRecipes, tag.toLowerCase(), recipeId as FillingId);
        }
      }
    }
  }

  /** {@inheritdoc Runtime.Indexers.BaseIndexer._clearIndex} */
  protected _clearIndex(): void {
    this._tagToRecipes = undefined;
  }

  /** {@inheritdoc Runtime.Indexers.BaseIndexer._findInternal} */
  protected _findInternal(
    config: IRecipesByTagConfig
  ): Result<ReadonlyArray<IRuntimeFillingRecipe | FillingId>> {
    const recipeIds = this._getFromSetIndex(this._tagToRecipes!, config.tag.toLowerCase());
    return Success.with(recipeIds);
  }
}
