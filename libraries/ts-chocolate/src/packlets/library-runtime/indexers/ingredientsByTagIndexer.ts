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
 * Indexer for finding ingredients by tag
 * @packageDocumentation
 */

import { Converter, Converters, Result, Success } from '@fgv/ts-utils';
import { IngredientId } from '../../common';
import { ChocolateLibrary } from '../chocolateLibrary';
import { IRuntimeIngredient } from '../model';
import { BaseIndexer } from './baseIndexer';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for the IngredientsByTag indexer.
 * @public
 */
export interface IIngredientsByTagConfig {
  /**
   * The tag to search for (case-insensitive).
   */
  readonly tag: string;
}

/**
 * Creates an IngredientsByTag config.
 * @public
 */
export function ingredientsByTagConfig(tag: string): IIngredientsByTagConfig {
  return { tag };
}

/**
 * Converter for IngredientsByTag config from JSON.
 * @public
 */
export const ingredientsByTagConfigConverter: Converter<IIngredientsByTagConfig> =
  Converters.strictObject<IIngredientsByTagConfig>({
    tag: Converters.string
  });

// ============================================================================
// IngredientsByTagIndexer Class
// ============================================================================

/**
 * Indexer that finds ingredients with a specific tag.
 * Tag matching is case-insensitive.
 *
 * @public
 */
export class IngredientsByTagIndexer extends BaseIndexer<
  IRuntimeIngredient,
  IngredientId,
  IIngredientsByTagConfig
> {
  // Index structure: lowercase tag -> ingredient IDs
  private _tagToIngredients: Map<string, Set<IngredientId>> | undefined;

  /**
   * Creates a new IngredientsByTagIndexer.
   * @param library - The chocolate library to index
   */
  public constructor(library: ChocolateLibrary) {
    super(library);
  }

  /**
   * Gets all unique tags used across ingredients.
   * Note: Forces index build if not already built.
   * @returns Array of lowercase tags
   */
  public getAllTags(): ReadonlyArray<string> {
    this._ensureBuilt();
    return Array.from(this._tagToIngredients!.keys());
  }

  /** {@inheritdoc LibraryRuntime.Indexers.BaseIndexer._buildIndex} */
  protected _buildIndex(): void {
    this._tagToIngredients = new Map<string, Set<IngredientId>>();
    const ingredients = this.library.ingredients;

    for (const [ingredientId, ingredient] of ingredients.entries()) {
      if (ingredient.tags) {
        for (const tag of ingredient.tags) {
          this._addToSetIndex(this._tagToIngredients, tag.toLowerCase(), ingredientId);
        }
      }
    }
  }

  /** {@inheritdoc LibraryRuntime.Indexers.BaseIndexer._clearIndex} */
  protected _clearIndex(): void {
    this._tagToIngredients = undefined;
  }

  /** {@inheritdoc LibraryRuntime.Indexers.BaseIndexer._findInternal} */
  protected _findInternal(
    config: IIngredientsByTagConfig
  ): Result<ReadonlyArray<IRuntimeIngredient | IngredientId>> {
    const ingredientIds = this._getFromSetIndex(this._tagToIngredients!, config.tag.toLowerCase());
    return Success.with(ingredientIds);
  }
}
