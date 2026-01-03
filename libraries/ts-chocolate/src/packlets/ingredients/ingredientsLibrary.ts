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
 * Ingredients library with multi-source collection support
 * @packageDocumentation
 */

import { Collections, Result, captureResult } from '@fgv/ts-utils';

import { BaseIngredientId, IngredientId, SourceId } from '../common';
import { Converters as CommonConverters } from '../common';
import { Ingredient } from './model';
import { ingredient as ingredientConverter } from './converters';
import { IngredientCollectionEntryInit } from './ingredientsCollection';

// ============================================================================
// Parameters Interface
// ============================================================================

/**
 * Parameters for creating an IngredientsLibrary instance
 * @public
 */
export interface IIngredientsLibraryParams {
  /**
   * Optional initial collections of ingredients
   * Each collection can be provided as a JSON entry or pre-built entry
   */
  readonly collections?: ReadonlyArray<IngredientCollectionEntryInit>;
}

// ============================================================================
// IngredientsLibrary Class
// ============================================================================

/**
 * Multi-source ingredient library with type-safe access
 *
 * Wraps AggregatedResultMap to provide:
 * - Composite ID access (e.g., "felchlin.maracaibo-65")
 * - Multi-source management (built-in, user, app-local, etc.)
 * - Mutable vs immutable collection distinction
 * - Weakly-typed validating access for external data
 *
 * @public
 */
export class IngredientsLibrary extends Collections.AggregatedResultMapBase<
  IngredientId,
  SourceId,
  BaseIngredientId,
  Ingredient
> {
  private constructor(params?: IIngredientsLibraryParams) {
    super({
      collectionIdConverter: CommonConverters.sourceId,
      itemIdConverter: CommonConverters.baseIngredientId,
      itemConverter: ingredientConverter,
      separator: '.',
      collections: params?.collections
    });
  }

  /**
   * Creates a new IngredientsLibrary instance
   * @param params - Optional creation parameters with initial collections
   * @returns Success with new instance, or Failure with error message
   * @public
   */
  public static create(params?: IIngredientsLibraryParams): Result<IngredientsLibrary> {
    return captureResult(() => new IngredientsLibrary(params));
  }
}
