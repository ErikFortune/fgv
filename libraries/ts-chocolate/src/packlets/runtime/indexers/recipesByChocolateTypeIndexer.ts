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
 * Indexer for finding recipes by chocolate type
 * @packageDocumentation
 */

import { Converter, Converters, Result, Success } from '@fgv/ts-utils';
import { ChocolateType, Converters as ChocolateConverters, Helpers, RecipeId } from '../../common';
import { isChocolateIngredient } from '../../ingredients';
import { ChocolateLibrary } from '../chocolateLibrary';
import { IRuntimeRecipe } from '../model';
import { BaseIndexer } from './baseIndexer';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for the RecipesByChocolateType indexer.
 * @public
 */
export interface IRecipesByChocolateTypeConfig {
  /**
   * The chocolate type to search for.
   */
  readonly chocolateType: ChocolateType;
}

/**
 * Creates a RecipesByChocolateType config.
 * @public
 */
export function recipesByChocolateTypeConfig(chocolateType: ChocolateType): IRecipesByChocolateTypeConfig {
  return { chocolateType };
}

/**
 * Converter for RecipesByChocolateType config from JSON.
 * @public
 */
export const recipesByChocolateTypeConfigConverter: Converter<IRecipesByChocolateTypeConfig> =
  Converters.strictObject<IRecipesByChocolateTypeConfig>({
    chocolateType: ChocolateConverters.chocolateType
  });

/**
 * Indexer that finds recipes containing a specific chocolate type.
 * Only checks the golden version of each recipe.
 *
 * @public
 */
export class RecipesByChocolateTypeIndexer extends BaseIndexer<
  IRuntimeRecipe,
  RecipeId,
  IRecipesByChocolateTypeConfig
> {
  // Index structure: chocolate type -> recipe IDs
  private _typeToRecipes: Map<ChocolateType, Set<RecipeId>> | undefined;

  /**
   * Creates a new RecipesByChocolateTypeIndexer.
   * @param library - The chocolate library to index
   */
  public constructor(library: ChocolateLibrary) {
    super(library);
  }

  /** {@inheritdoc Runtime.Indexers.BaseIndexer._buildIndex} */
  protected _buildIndex(): void {
    this._typeToRecipes = new Map<ChocolateType, Set<RecipeId>>();
    const recipes = this.library.recipes;
    const ingredients = this.library.ingredients;

    for (const [recipeId, recipe] of recipes.entries()) {
      // Check golden version for chocolate types
      const goldenVersion = recipe.versions.find((v) => v.versionSpec === recipe.goldenVersionSpec);
      /* c8 ignore next 4 - defensive: data validation ensures golden version exists */
      if (!goldenVersion) {
        this._logger.error(`Recipe ${recipeId} is missing golden version ${recipe.goldenVersionSpec}`);
        continue;
      }

      for (const ri of goldenVersion.ingredients) {
        const ingredientId = Helpers.getPreferredIdOrFirst(ri.ingredient);
        /* c8 ignore next - defensive: recipe ingredients always have at least one ID */
        if (ingredientId === undefined) continue;
        const ingredientResult = ingredients.get(ingredientId);
        if (ingredientResult.isSuccess()) {
          const ingredient = ingredientResult.value;
          if (isChocolateIngredient(ingredient)) {
            this._addToSetIndex(this._typeToRecipes, ingredient.chocolateType, recipeId as RecipeId);
          }
        }
      }
    }
  }

  /** {@inheritdoc Runtime.Indexers.BaseIndexer._clearIndex} */
  protected _clearIndex(): void {
    this._typeToRecipes = undefined;
  }

  /** {@inheritdoc Runtime.Indexers.BaseIndexer._findInternal} */
  protected _findInternal(
    config: IRecipesByChocolateTypeConfig
  ): Result<ReadonlyArray<IRuntimeRecipe | RecipeId>> {
    const recipeIds = this._getFromSetIndex(this._typeToRecipes!, config.chocolateType);
    return Success.with(recipeIds);
  }
}
