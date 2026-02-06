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
 * Indexer for finding filling recipes by ingredient usage
 * @packageDocumentation
 */

import { Converter, Converters, Result, Success } from '@fgv/ts-utils';
import { Converters as ChocolateConverters, FillingId, Helpers, IngredientId } from '../../common';
import { ChocolateLibrary } from '../chocolateLibrary';
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
export interface IFillingRecipesByIngredientConfig {
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
export function fillingRecipesByIngredientConfig(
  ingredientId: IngredientId,
  usageType?: IngredientUsageType
): IFillingRecipesByIngredientConfig {
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
export const fillingRecipesByIngredientConfigConverter: Converter<IFillingRecipesByIngredientConfig> =
  Converters.strictObject<IFillingRecipesByIngredientConfig>({
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
  readonly fillingId: FillingId;
  readonly isPrimary: boolean;
}

// ============================================================================
// FillingRecipesByIngredientIndexer Class
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
export class FillingRecipesByIngredientIndexer extends BaseIndexer<
  FillingId,
  IFillingRecipesByIngredientConfig
> {
  // Index structure: ingredient -> usage info
  private _ingredientUsage: Map<IngredientId, IIngredientUsageEntry[]> | undefined;

  /**
   * Creates a new FillingRecipesByIngredientIndexer.
   * @param library - The chocolate library to index
   */
  public constructor(library: ChocolateLibrary) {
    super(library);
  }

  /** {@inheritDoc LibraryRuntime.Indexers.BaseIndexer._buildIndex} */
  protected _buildIndex(): void {
    this._ingredientUsage = new Map<IngredientId, IIngredientUsageEntry[]>();
    const recipes = this.library.fillings;

    for (const [recipeId, recipe] of recipes.entries()) {
      // Index ingredients from all versions
      for (const version of recipe.variations) {
        for (const ri of version.ingredients) {
          // Get primary ingredient ID (preferred or first)
          const primaryId = Helpers.getPreferredIdOrFirst(ri.ingredient);

          // Index all ingredient IDs
          for (const id of ri.ingredient.ids) {
            this._addUsageInfo(id, {
              fillingId: recipeId as FillingId,
              isPrimary: id === primaryId
            });
          }
        }
      }
    }
  }

  /** {@inheritDoc LibraryRuntime.Indexers.BaseIndexer._clearIndex} */
  protected _clearIndex(): void {
    this._ingredientUsage = undefined;
  }

  /** {@inheritDoc LibraryRuntime.Indexers.BaseIndexer._findInternal} */
  protected _findInternal(config: IFillingRecipesByIngredientConfig): Result<ReadonlyArray<FillingId>> {
    const usage = this._ingredientUsage!.get(config.ingredientId);
    if (!usage) {
      return this._emptyResult();
    }

    const usageType = config.usageType ?? 'any';
    const matchingFillingIds = new Set<FillingId>();

    for (const entry of usage) {
      const matches =
        usageType === 'any' ||
        (usageType === 'primary' && entry.isPrimary) ||
        (usageType === 'alternate' && !entry.isPrimary);

      if (matches) {
        matchingFillingIds.add(entry.fillingId);
      }
    }

    // Return IDs - orchestrator will resolve to entities
    return Success.with([...matchingFillingIds]);
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
    if (!usage.some((u) => u.fillingId === entry.fillingId && u.isPrimary === entry.isPrimary)) {
      usage.push(entry);
    }
  }
}
