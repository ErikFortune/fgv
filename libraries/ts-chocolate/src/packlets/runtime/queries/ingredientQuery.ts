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
 * Fluent query builder for ingredients
 * @packageDocumentation
 */

import {
  Allergen,
  Certification,
  ChocolateApplication,
  ChocolateType,
  IngredientCategory,
  Percentage,
  SourceId
} from '../../common';
import { AnyRuntimeIngredient, RuntimeChocolateIngredient } from '../ingredients';
import { RuntimeContext } from '../runtimeContext';
import {
  IngredientFilter,
  containsIgnoreCase,
  hasTag,
  hasAnyTag,
  hasAllTags,
  atLeast,
  atMost,
  inRange,
  collectionContains,
  equals,
  notFilter
} from './filters';

// ============================================================================
// IngredientQuery Class
// ============================================================================

/**
 * Fluent query builder for ingredients.
 * Allows chaining filters to build complex queries.
 * @public
 */
export class IngredientQuery {
  private readonly _context: RuntimeContext;
  private readonly _filters: IngredientFilter[];

  /**
   * Creates a new IngredientQuery.
   * @param context - The runtime context to query
   */
  public constructor(context: RuntimeContext) {
    this._context = context;
    this._filters = [];
  }

  // ============================================================================
  // Category Filters
  // ============================================================================

  /**
   * Filter to only chocolate ingredients.
   */
  public chocolate(): IngredientQuery {
    return this._addFilter((i) => i.isChocolate());
  }

  /**
   * Filter to only dairy ingredients.
   */
  public dairy(): IngredientQuery {
    return this._addFilter((i) => i.isDairy());
  }

  /**
   * Filter to only sugar ingredients.
   */
  public sugar(): IngredientQuery {
    return this._addFilter((i) => i.isSugar());
  }

  /**
   * Filter to only fat ingredients.
   */
  public fat(): IngredientQuery {
    return this._addFilter((i) => i.isFat());
  }

  /**
   * Filter to only alcohol ingredients.
   */
  public alcohol(): IngredientQuery {
    return this._addFilter((i) => i.isAlcohol());
  }

  /**
   * Filter by specific category.
   * @param category - The category to filter by
   */
  public category(category: IngredientCategory): IngredientQuery {
    return this._addFilter(equals(category, (i) => i.category));
  }

  // ============================================================================
  // Chocolate-Specific Filters
  // ============================================================================

  /**
   * Filter by chocolate type.
   * Note: Automatically filters to chocolate category.
   * @param type - The chocolate type to filter by
   */
  public chocolateType(type: ChocolateType): IngredientQuery {
    return this._addFilter(
      (i) => i.isChocolate() && (i as RuntimeChocolateIngredient).chocolateType === type
    );
  }

  /**
   * Filter by minimum cacao percentage.
   * Note: Only applies to chocolate ingredients.
   * @param percentage - Minimum cacao percentage
   */
  public minCacao(percentage: Percentage): IngredientQuery {
    return this._addFilter((i) => {
      if (!i.isChocolate()) return false;
      return (i as RuntimeChocolateIngredient).cacaoPercentage >= percentage;
    });
  }

  /**
   * Filter by maximum cacao percentage.
   * @param percentage - Maximum cacao percentage
   */
  public maxCacao(percentage: Percentage): IngredientQuery {
    return this._addFilter((i) => {
      if (!i.isChocolate()) return false;
      return (i as RuntimeChocolateIngredient).cacaoPercentage <= percentage;
    });
  }

  /**
   * Filter by cacao percentage range.
   * @param min - Minimum cacao percentage
   * @param max - Maximum cacao percentage
   */
  public cacaoRange(min: Percentage, max: Percentage): IngredientQuery {
    return this._addFilter((i) => {
      if (!i.isChocolate()) return false;
      const pct = (i as RuntimeChocolateIngredient).cacaoPercentage;
      return pct >= min && pct <= max;
    });
  }

  /**
   * Filter by chocolate application.
   * @param application - The application to filter by
   */
  public forApplication(application: ChocolateApplication): IngredientQuery {
    return this._addFilter((i) => {
      if (!i.isChocolate()) return false;
      const apps = (i as RuntimeChocolateIngredient).applications;
      return apps !== undefined && apps.includes(application);
    });
  }

  // ============================================================================
  // Ganache Characteristic Filters
  // ============================================================================

  /**
   * Filter by minimum fat content (cacaoFat + milkFat + otherFats).
   * @param min - Minimum total fat percentage
   */
  public minFat(min: Percentage): IngredientQuery {
    return this._addFilter(
      atLeast(min, (i) => {
        const gc = i.ganacheCharacteristics;
        return gc.cacaoFat + gc.milkFat + gc.otherFats;
      })
    );
  }

  /**
   * Filter by maximum fat content.
   * @param max - Maximum total fat percentage
   */
  public maxFat(max: Percentage): IngredientQuery {
    return this._addFilter(
      atMost(max, (i) => {
        const gc = i.ganacheCharacteristics;
        return gc.cacaoFat + gc.milkFat + gc.otherFats;
      })
    );
  }

  /**
   * Filter by fat content range.
   * @param min - Minimum percentage
   * @param max - Maximum percentage
   */
  public fatRange(min: Percentage, max: Percentage): IngredientQuery {
    return this._addFilter(
      inRange(min, max, (i) => {
        const gc = i.ganacheCharacteristics;
        return gc.cacaoFat + gc.milkFat + gc.otherFats;
      })
    );
  }

  /**
   * Filter by maximum water content.
   * @param max - Maximum water percentage
   */
  public maxWater(max: Percentage): IngredientQuery {
    return this._addFilter(atMost(max, (i) => i.ganacheCharacteristics.water));
  }

  /**
   * Filter by minimum water content.
   * @param min - Minimum water percentage
   */
  public minWater(min: Percentage): IngredientQuery {
    return this._addFilter(atLeast(min, (i) => i.ganacheCharacteristics.water));
  }

  // ============================================================================
  // Metadata Filters
  // ============================================================================

  /**
   * Filter by tag (ingredient has this tag).
   * @param tag - Tag to search for (case-insensitive)
   */
  public withTag(tag: string): IngredientQuery {
    return this._addFilter(hasTag(tag, (i) => i.tags));
  }

  /**
   * Filter by any of the given tags.
   * @param tags - Tags to search for
   */
  public withAnyTag(tags: string[]): IngredientQuery {
    return this._addFilter(hasAnyTag(tags, (i) => i.tags));
  }

  /**
   * Filter by all of the given tags.
   * @param tags - Tags that must all be present
   */
  public withAllTags(tags: string[]): IngredientQuery {
    return this._addFilter(hasAllTags(tags, (i) => i.tags));
  }

  /**
   * Filter by manufacturer.
   * @param manufacturer - Manufacturer name (case-insensitive partial match)
   */
  public byManufacturer(manufacturer: string): IngredientQuery {
    return this._addFilter(containsIgnoreCase(manufacturer, (i) => i.manufacturer));
  }

  /**
   * Filter by source.
   * @param sourceId - Source ID to filter by
   */
  public fromSource(sourceId: SourceId): IngredientQuery {
    return this._addFilter(equals(sourceId, (i) => i.sourceId));
  }

  // ============================================================================
  // Dietary Filters
  // ============================================================================

  /**
   * Filter to only vegan ingredients.
   */
  public vegan(): IngredientQuery {
    return this._addFilter((i) => i.vegan === true);
  }

  /**
   * Filter to ingredients without specific allergen.
   * @param allergen - Allergen that must not be present
   */
  public withoutAllergen(allergen: Allergen): IngredientQuery {
    return this._addFilter(notFilter(collectionContains(allergen, (i) => i.allergens)));
  }

  /**
   * Filter to ingredients without any of the specified allergens.
   * @param allergens - Allergens that must not be present
   */
  public withoutAllergens(allergens: Allergen[]): IngredientQuery {
    return this._addFilter((i) => {
      const present = i.allergens;
      return !allergens.some((a) => present.includes(a));
    });
  }

  /**
   * Filter by certification.
   * @param certification - Certification that must be present
   */
  public withCertification(certification: Certification): IngredientQuery {
    return this._addFilter(collectionContains(certification, (i) => i.certifications));
  }

  // ============================================================================
  // Usage Filters
  // ============================================================================

  /**
   * Filter to ingredients used in at least one recipe.
   */
  public usedInRecipes(): IngredientQuery {
    return this._addFilter((i) => i.usedByRecipes().length > 0);
  }

  /**
   * Filter to ingredients not used in any recipe.
   */
  public unused(): IngredientQuery {
    return this._addFilter((i) => i.usedByRecipes().length === 0);
  }

  /**
   * Filter to ingredients used in at least N recipes.
   * @param count - Minimum number of recipes
   */
  public usedInAtLeast(count: number): IngredientQuery {
    return this._addFilter((i) => i.usedByRecipes().length >= count);
  }

  // ============================================================================
  // Text Search
  // ============================================================================

  /**
   * Search by name (case-insensitive partial match).
   * @param text - Text to search for
   */
  public nameContains(text: string): IngredientQuery {
    return this._addFilter(containsIgnoreCase(text, (i) => i.name));
  }

  /**
   * Search by description (case-insensitive partial match).
   * @param text - Text to search for
   */
  public descriptionContains(text: string): IngredientQuery {
    return this._addFilter(containsIgnoreCase(text, (i) => i.description));
  }

  // ============================================================================
  // Custom Filter
  // ============================================================================

  /**
   * Apply a custom filter predicate.
   * @param predicate - Custom filter function
   */
  public where(predicate: IngredientFilter): IngredientQuery {
    return this._addFilter(predicate);
  }

  // ============================================================================
  // Execution
  // ============================================================================

  /**
   * Execute query and return matching ingredients.
   */
  public execute(): ReadonlyArray<AnyRuntimeIngredient> {
    const results: AnyRuntimeIngredient[] = [];
    for (const ingredient of this._context.ingredients()) {
      if (this._matchesAllFilters(ingredient)) {
        results.push(ingredient);
      }
    }
    return results;
  }

  /**
   * Execute and return first matching ingredient.
   */
  public first(): AnyRuntimeIngredient | undefined {
    for (const ingredient of this._context.ingredients()) {
      if (this._matchesAllFilters(ingredient)) {
        return ingredient;
      }
    }
    return undefined;
  }

  /**
   * Execute and return count of matching ingredients.
   */
  public count(): number {
    let count = 0;
    for (const ingredient of this._context.ingredients()) {
      if (this._matchesAllFilters(ingredient)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Check if any ingredients match the query.
   */
  public exists(): boolean {
    return this.first() !== undefined;
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private _addFilter(filter: IngredientFilter): IngredientQuery {
    this._filters.push(filter);
    return this;
  }

  private _matchesAllFilters(ingredient: AnyRuntimeIngredient): boolean {
    for (const filter of this._filters) {
      if (!filter(ingredient)) {
        return false;
      }
    }
    return true;
  }
}
