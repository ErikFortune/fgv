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
 * Indexer for finding recipes by ingredient usage
 * @packageDocumentation
 */

import { Converter, Converters, Result, Success } from '@fgv/ts-utils';
import { Converters as ChocolateConverters, IngredientId, RecipeId } from '../../common';
import { ChocolateLibrary } from '../chocolateLibrary';
import { IRuntimeRecipe } from '../model';
import { BaseIndexer } from './baseIndexer';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Usage type filter for ingredient lookups.
 * @public
 */
export type IngredientUsageType = 'primary' | 'alternate' | 'any';

/**
 * Configuration for the RecipesByIngredient indexer.
 * @public
 */
export interface IRecipesByIngredientConfig {
  /**
   * The ingredient ID to search for.
   */
  readonly ingredientId: IngredientId;

  /**
   * Filter by usage type.
   * - 'primary': Only recipes where ingredient is primary
   * - 'alternate': Only recipes where ingredient is alternate
   * - 'any': Any usage
   * Defaults to 'any'.
   */
  readonly usageType?: IngredientUsageType;
}

/**
 * Creates a RecipesByIngredient config.
 * @public
 */
export function recipesByIngredientConfig(
  ingredientId: IngredientId,
  usageType?: IngredientUsageType
): IRecipesByIngredientConfig {
  return { ingredientId, usageType };
}

/**
 * All valid usage type values.
 */
const allUsageTypes: IngredientUsageType[] = ['primary', 'alternate', 'any'];

/**
 * Converter for IngredientUsageType.
 */
const usageTypeConverter: Converter<IngredientUsageType> = Converters.enumeratedValue(allUsageTypes);

/**
 * Converter for RecipesByIngredient config from JSON.
 * @public
 */
export const recipesByIngredientConfigConverter: Converter<IRecipesByIngredientConfig> =
  Converters.strictObject<IRecipesByIngredientConfig>({
    ingredientId: ChocolateConverters.ingredientId,
    usageType: usageTypeConverter.optional()
  });

// ============================================================================
// Usage Info Type
// ============================================================================

/**
 * Internal structure for tracking ingredient usage.
 */
interface IIngredientUsageEntry {
  readonly recipeId: RecipeId;
  readonly isPrimary: boolean;
}

// ============================================================================
// RecipesByIngredientIndexer Class
// ============================================================================

/**
 * Indexer that finds recipes using a specific ingredient.
 *
 * Supports filtering by:
 * - Primary usage only
 * - Alternate usage only
 * - Any usage
 *
 * @public
 */
export class RecipesByIngredientIndexer extends BaseIndexer<
  IRuntimeRecipe,
  RecipeId,
  IRecipesByIngredientConfig
> {
  // Index structure: ingredient -> usage info
  private _ingredientUsage: Map<IngredientId, IIngredientUsageEntry[]> | undefined;

  /**
   * Creates a new RecipesByIngredientIndexer.
   * @param library - The chocolate library to index
   */
  public constructor(library: ChocolateLibrary) {
    super(library);
  }

  /** {@inheritdoc Runtime.Indexers.BaseIndexer._buildIndex} */
  protected _buildIndex(): void {
    this._ingredientUsage = new Map<IngredientId, IIngredientUsageEntry[]>();
    const recipes = this.library.recipes;

    for (const [recipeId, recipe] of recipes.entries()) {
      // Index ingredients from all versions
      for (const version of recipe.versions) {
        for (const ri of version.ingredients) {
          // Primary ingredient
          this._addUsageInfo(ri.ingredientId, {
            recipeId: recipeId as RecipeId,
            isPrimary: true
          });

          // Alternate ingredients
          if (ri.alternateIngredientIds) {
            for (const altId of ri.alternateIngredientIds) {
              this._addUsageInfo(altId, {
                recipeId: recipeId as RecipeId,
                isPrimary: false
              });
            }
          }
        }
      }
    }
  }

  /** {@inheritdoc Runtime.Indexers.BaseIndexer._clearIndex} */
  protected _clearIndex(): void {
    this._ingredientUsage = undefined;
  }

  /** {@inheritdoc Runtime.Indexers.BaseIndexer._findInternal} */
  protected _findInternal(
    config: IRecipesByIngredientConfig
  ): Result<ReadonlyArray<IRuntimeRecipe | RecipeId>> {
    const usage = this._ingredientUsage!.get(config.ingredientId);
    if (!usage) {
      return this._emptyResult();
    }

    const usageType = config.usageType ?? 'any';
    const matchingRecipeIds = new Set<RecipeId>();

    for (const entry of usage) {
      const matches =
        usageType === 'any' ||
        (usageType === 'primary' && entry.isPrimary) ||
        (usageType === 'alternate' && !entry.isPrimary);

      if (matches) {
        matchingRecipeIds.add(entry.recipeId);
      }
    }

    // Return IDs - orchestrator will resolve to entities
    return Success.with([...matchingRecipeIds]);
  }

  /**
   * Adds usage info for an ingredient, avoiding duplicates.
   */
  private _addUsageInfo(ingredientId: IngredientId, entry: IIngredientUsageEntry): void {
    let usage = this._ingredientUsage!.get(ingredientId);
    if (!usage) {
      usage = [];
      this._ingredientUsage!.set(ingredientId, usage);
    }
    // Avoid duplicates for same recipe + same isPrimary
    /* c8 ignore next 3 - defensive: duplicate prevention for multi-version recipes */
    if (!usage.some((u) => u.recipeId === entry.recipeId && u.isPrimary === entry.isPrimary)) {
      usage.push(entry);
    }
  }
}
