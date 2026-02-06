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
 * Indexer for finding filling recipes by chocolate type
 * @packageDocumentation
 */

import { Converter, Converters, Result, Success } from '@fgv/ts-utils';
import { ChocolateType, Converters as ChocolateConverters, FillingId, Helpers } from '../../common';
import { Ingredients } from '../../entities';
import { EntityLibrary } from '../chocolateLibrary';
import { BaseIndexer } from './baseIndexer';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for the RecipesByChocolateType indexer.
 * @public
 */
export interface IFillingRecipesByChocolateTypeConfig {
  /**
   * The chocolate type to search for.
   */
  readonly chocolateType: ChocolateType;
}

/**
 * Creates a RecipesByChocolateType config.
 * @public
 */
export function fillingRecipesByChocolateTypeConfig(
  chocolateType: ChocolateType
): IFillingRecipesByChocolateTypeConfig {
  return { chocolateType };
}

/**
 * Converter for RecipesByChocolateType config from JSON.
 * @public
 */
export const fillingRecipesByChocolateTypeConfigConverter: Converter<IFillingRecipesByChocolateTypeConfig> =
  Converters.strictObject<IFillingRecipesByChocolateTypeConfig>({
    chocolateType: ChocolateConverters.chocolateType
  });

/**
 * Indexer that finds recipes containing a specific chocolate type.
 * Only checks the golden variation of each recipe.
 *
 * @public
 */
export class FillingRecipesByChocolateTypeIndexer extends BaseIndexer<
  FillingId,
  IFillingRecipesByChocolateTypeConfig
> {
  // Index structure: chocolate type -> recipe IDs
  private _typeToRecipes: Map<ChocolateType, Set<FillingId>> | undefined;

  /**
   * Creates a new FillingRecipesByChocolateTypeIndexer.
   * @param library - The chocolate library to index
   */
  public constructor(library: EntityLibrary) {
    super(library);
  }

  /** {@inheritDoc LibraryRuntime.Indexers.BaseIndexer._buildIndex} */
  protected _buildIndex(): void {
    this._typeToRecipes = new Map<ChocolateType, Set<FillingId>>();
    const recipes = this.library.fillings;
    const ingredients = this.library.ingredients;

    for (const [recipeId, recipe] of recipes.entries()) {
      // Check golden variation for chocolate types
      const goldenVariation = recipe.variations.find((v) => v.variationSpec === recipe.goldenVariationSpec);
      /* c8 ignore next 4 - defensive: data validation ensures golden variation exists */
      if (!goldenVariation) {
        this._logger.error(`Recipe ${recipeId} is missing golden variation ${recipe.goldenVariationSpec}`);
        continue;
      }

      for (const ri of goldenVariation.ingredients) {
        const ingredientId = Helpers.getPreferredIdOrFirst(ri.ingredient);
        /* c8 ignore next - defensive: recipe ingredients always have at least one ID */
        if (ingredientId === undefined) continue;
        const ingredientResult = ingredients.get(ingredientId);
        if (ingredientResult.isSuccess()) {
          const ingredient = ingredientResult.value;
          if (Ingredients.isChocolateIngredientEntity(ingredient)) {
            this._addToSetIndex(this._typeToRecipes, ingredient.chocolateType, recipeId as FillingId);
          }
        }
      }
    }
  }

  /** {@inheritDoc LibraryRuntime.Indexers.BaseIndexer._clearIndex} */
  protected _clearIndex(): void {
    this._typeToRecipes = undefined;
  }

  /** {@inheritDoc LibraryRuntime.Indexers.BaseIndexer._findInternal} */
  protected _findInternal(config: IFillingRecipesByChocolateTypeConfig): Result<ReadonlyArray<FillingId>> {
    const recipeIds = this._getFromSetIndex(this._typeToRecipes!, config.chocolateType);
    return Success.with(recipeIds);
  }
}
