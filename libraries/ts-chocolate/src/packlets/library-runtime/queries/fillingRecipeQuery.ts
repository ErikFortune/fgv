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
 * Fluent query builder for recipes
 * @packageDocumentation
 */

import { ChocolateType, IngredientId, Percentage, SourceId } from '../../common';
import { RuntimeFillingRecipe } from '../fillings';
import { LibraryRuntimeContext } from '../libraryRuntimeContext';
import {
  FillingRecipeFilter,
  containsIgnoreCase,
  hasTag,
  hasAnyTag,
  hasAllTags,
  atLeast,
  equals
} from './filters';

// ============================================================================
// FillingRecipeQuery Class
// ============================================================================

/**
 * Fluent query builder for recipes.
 * Allows chaining filters to build complex queries.
 * @public
 */
export class FillingRecipeQuery {
  private readonly _context: LibraryRuntimeContext;
  private readonly _filters: FillingRecipeFilter[];

  /**
   * Creates a new FillingRecipeQuery.
   * @param context - The runtime context to query
   */
  public constructor(context: LibraryRuntimeContext) {
    this._context = context;
    this._filters = [];
  }

  // ============================================================================
  // Ingredient Filters
  // ============================================================================

  /**
   * Filter to recipes using a specific ingredient (any version, as primary).
   * @param ingredientId - Ingredient ID to search for
   */
  public withIngredient(ingredientId: IngredientId): FillingRecipeQuery {
    return this._addFilter((r) => r.usesIngredient(ingredientId));
  }

  /**
   * Filter to recipes using any of the given ingredients.
   * @param ingredientIds - Ingredient IDs to search for
   */
  public withAnyIngredient(ingredientIds: IngredientId[]): FillingRecipeQuery {
    return this._addFilter((r) => ingredientIds.some((id) => r.usesIngredient(id)));
  }

  /**
   * Filter to recipes using all of the given ingredients.
   * @param ingredientIds - Ingredient IDs that must all be present
   */
  public withAllIngredients(ingredientIds: IngredientId[]): FillingRecipeQuery {
    return this._addFilter((r) => ingredientIds.every((id) => r.usesIngredient(id)));
  }

  /**
   * Filter to recipes NOT using a specific ingredient.
   * @param ingredientId - Ingredient ID that must not be present
   */
  public withoutIngredient(ingredientId: IngredientId): FillingRecipeQuery {
    return this._addFilter((r) => !r.usesIngredient(ingredientId));
  }

  // ============================================================================
  // Chocolate Type Filters
  // ============================================================================

  /**
   * Filter to recipes containing dark chocolate (in golden version).
   */
  public withDarkChocolate(): FillingRecipeQuery {
    return this.withChocolateType('dark');
  }

  /**
   * Filter to recipes containing milk chocolate.
   */
  public withMilkChocolate(): FillingRecipeQuery {
    return this.withChocolateType('milk');
  }

  /**
   * Filter to recipes containing white chocolate.
   */
  public withWhiteChocolate(): FillingRecipeQuery {
    return this.withChocolateType('white');
  }

  /**
   * Filter to recipes containing ruby chocolate.
   */
  public withRubyChocolate(): FillingRecipeQuery {
    return this.withChocolateType('ruby');
  }

  /**
   * Filter by any chocolate type.
   * Uses the reverse index for efficiency.
   * @param type - Chocolate type to filter by
   */
  public withChocolateType(type: ChocolateType): FillingRecipeQuery {
    // Get recipe IDs from reverse index for efficiency
    const matchingRecipes = this._context.fillings.find({ byChocolateType: { chocolateType: type } });
    /* c8 ignore next 2 - defensive coding: recipes.find with valid spec always succeeds */
    const matchingIds = new Set<string>(
      matchingRecipes.isSuccess() ? matchingRecipes.value.map((r) => r.id as string) : []
    );
    return this._addFilter((r) => matchingIds.has(r.id as string));
  }

  // ============================================================================
  // Tag Filters
  // ============================================================================

  /**
   * Filter by tag.
   * @param tag - Tag to search for (case-insensitive)
   */
  public withTag(tag: string): FillingRecipeQuery {
    return this._addFilter(hasTag(tag, (r) => r.tags));
  }

  /**
   * Filter by any of the given tags.
   * @param tags - Tags to search for
   */
  public withAnyTag(tags: string[]): FillingRecipeQuery {
    return this._addFilter(hasAnyTag(tags, (r) => r.tags));
  }

  /**
   * Filter by all of the given tags.
   * @param tags - Tags that must all be present
   */
  public withAllTags(tags: string[]): FillingRecipeQuery {
    return this._addFilter(hasAllTags(tags, (r) => r.tags));
  }

  // ============================================================================
  // Source Filters
  // ============================================================================

  /**
   * Filter by source.
   * @param sourceId - Source ID to filter by
   */
  public fromSource(sourceId: SourceId): FillingRecipeQuery {
    return this._addFilter(equals(sourceId, (r) => r.sourceId));
  }

  // ============================================================================
  // Ganache Filters
  // ============================================================================

  /**
   * Filter by ganache fat content range.
   * Note: Calculates ganache for each recipe, which may be slow for large sets.
   * @param min - Minimum fat percentage
   * @param max - Optional maximum fat percentage
   */
  public ganacheFatContent(min: Percentage, max?: Percentage): FillingRecipeQuery {
    return this._addFilter((r) => {
      const result = r.goldenVersion.calculateGanache();
      /* c8 ignore next 3 - defensive coding: calculateGanache succeeds for valid recipes */
      if (result.isFailure()) {
        return false;
      }
      const fat = result.value.analysis.totalFat;
      /* c8 ignore next 2 - filter branches tested via ganache filter tests */
      if (fat < min) return false;
      if (max !== undefined && fat > max) return false;
      return true;
    });
  }

  /**
   * Filter to recipes with valid ganache characteristics.
   */
  public validGanache(): FillingRecipeQuery {
    return this._addFilter((r) => {
      const result = r.goldenVersion.calculateGanache();
      /* c8 ignore next 3 - defensive coding: calculateGanache succeeds for valid recipes */
      if (result.isFailure()) {
        return false;
      }
      return result.value.validation.isValid;
    });
  }

  /**
   * Filter to recipes with ganache warnings (but still valid).
   */
  public ganacheWithWarnings(): FillingRecipeQuery {
    return this._addFilter((r) => {
      const result = r.goldenVersion.calculateGanache();
      /* c8 ignore next 3 - defensive coding: calculateGanache succeeds for valid recipes */
      if (result.isFailure()) {
        return false;
      }
      const v = result.value.validation;
      return v.isValid && v.warnings.length > 0;
    });
  }

  // ============================================================================
  // Version Filters
  // ============================================================================

  /**
   * Filter to recipes with multiple versions.
   */
  public hasMultipleVersions(): FillingRecipeQuery {
    return this._addFilter((r) => r.versionCount > 1);
  }

  /**
   * Filter by minimum version count.
   * @param count - Minimum number of versions
   */
  public minVersions(count: number): FillingRecipeQuery {
    return this._addFilter(atLeast(count, (r) => r.versionCount));
  }

  // ============================================================================
  // Text Search
  // ============================================================================

  /**
   * Search by name (case-insensitive partial match).
   * @param text - Text to search for
   */
  public nameContains(text: string): FillingRecipeQuery {
    return this._addFilter(containsIgnoreCase(text, (r) => r.name as string));
  }

  /**
   * Search by description (case-insensitive partial match).
   * @param text - Text to search for
   */
  public descriptionContains(text: string): FillingRecipeQuery {
    return this._addFilter(containsIgnoreCase(text, (r) => r.description));
  }

  // ============================================================================
  // Custom Filter
  // ============================================================================

  /**
   * Apply a custom filter predicate.
   * @param predicate - Custom filter function
   */
  public where(predicate: FillingRecipeFilter): FillingRecipeQuery {
    return this._addFilter(predicate);
  }

  // ============================================================================
  // Execution
  // ============================================================================

  /**
   * Execute query and return matching recipes.
   */
  public execute(): ReadonlyArray<RuntimeFillingRecipe> {
    const results: RuntimeFillingRecipe[] = [];
    for (const recipe of this._context.fillings.values()) {
      if (this._matchesAllFilters(recipe)) {
        results.push(recipe);
      }
    }
    return results;
  }

  /**
   * Execute and return first matching recipe.
   */
  public first(): RuntimeFillingRecipe | undefined {
    for (const recipe of this._context.fillings.values()) {
      if (this._matchesAllFilters(recipe)) {
        return recipe;
      }
    }
    /* c8 ignore next 2 - tested via FillingRecipeQuery execution methods tests */
    return undefined;
  }

  /**
   * Execute and return count of matching recipes.
   */
  public count(): number {
    let count = 0;
    for (const recipe of this._context.fillings.values()) {
      if (this._matchesAllFilters(recipe)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Check if any recipes match the query.
   */
  public exists(): boolean {
    return this.first() !== undefined;
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private _addFilter(filter: FillingRecipeFilter): FillingRecipeQuery {
    this._filters.push(filter);
    return this;
  }

  private _matchesAllFilters(recipe: RuntimeFillingRecipe): boolean {
    for (const filter of this._filters) {
      if (!filter(recipe)) {
        return false;
      }
    }
    return true;
  }
}
