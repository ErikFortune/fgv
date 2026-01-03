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
 * Recipes library with multi-source collection support
 * @packageDocumentation
 */

import { Collections, DetailedResult, Result, captureResult } from '@fgv/ts-utils';

import { BaseRecipeId, RecipeId, SourceId } from '../common';
import { Converters as CommonConverters } from '../common';
import { Recipe } from './model';
import { recipe as recipeConverter } from './converters';

// ============================================================================
// Type aliases for Collections types
// ============================================================================

/**
 * A single entry in a RecipesLibrary collection.
 * @public
 */
export type RecipeCollectionEntry = Collections.AggregatedResultMapEntry<SourceId, BaseRecipeId, Recipe>;

/**
 * Detailed result for recipe operations.
 * @public
 */
export type RecipesDetailedResult<T> = DetailedResult<T, RecipeId>;

/**
 * Initialization type for a RecipesLibrary collection entry.
 * @public
 */
export type RecipeCollectionEntryInit = Collections.AggregatedResultMapEntryInit<
  SourceId,
  BaseRecipeId,
  Recipe
>;

/**
 * Validator type for RecipesLibrary collections.
 * @public
 */
export type RecipeCollectionValidator = Collections.IReadOnlyResultMapValidator<RecipeId, Recipe>;

/**
 * Type for the collections in a RecipesLibrary.
 * @public
 */
export type RecipeCollection = Collections.IReadOnlyValidatingResultMap<SourceId, RecipeCollectionEntry>;

// ============================================================================
// Parameters Interface
// ============================================================================

/**
 * Parameters for creating a RecipesLibrary instance
 * @public
 */
export interface IRecipesLibraryParams {
  /**
   * Optional initial collections of recipes
   * Each collection can be provided as a JSON entry or pre-built entry
   */
  readonly collections?: RecipeCollectionEntryInit[];
}

// ============================================================================
// RecipesLibrary Class
// ============================================================================

/**
 * Multi-source recipe library with type-safe access
 *
 * Wraps AggregatedResultMap to provide:
 * - Composite ID access (e.g., "user.classic-ganache")
 * - Multi-source management (built-in, user, app-local, etc.)
 * - Mutable vs immutable collection distinction
 * - Weakly-typed validating access for external data
 *
 * @public
 */
export class RecipesLibrary extends Collections.AggregatedResultMapBase<
  RecipeId,
  SourceId,
  BaseRecipeId,
  Recipe
> {
  private constructor(params?: IRecipesLibraryParams) {
    super({
      collectionIdConverter: CommonConverters.sourceId,
      itemIdConverter: CommonConverters.baseRecipeId,
      itemConverter: recipeConverter,
      separator: '.',
      collections: params?.collections
    });
  }

  /**
   * Creates a new RecipesLibrary instance
   * @param params - Optional creation parameters with initial collections
   * @returns Success with new instance, or Failure with error message
   * @public
   */
  public static create(params?: IRecipesLibraryParams): Result<RecipesLibrary> {
    return captureResult(() => new RecipesLibrary(params));
  }
}
