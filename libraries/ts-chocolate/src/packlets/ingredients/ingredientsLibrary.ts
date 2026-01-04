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

import { captureResult, Result } from '@fgv/ts-utils';

import { BaseIngredientId, IngredientId } from '../common';
import { Converters as CommonConverters } from '../common';
import { Ingredient } from './model';
import { ingredient as ingredientConverter } from './converters';
import { IngredientCollectionEntryInit } from './ingredientsCollection';
import {
  CollectionLoader,
  getIngredientsDirectory,
  ISubLibraryParams,
  SubLibraryBase,
  SubLibraryFileTreeSource,
  SubLibraryMergeSource
} from '../library-data';
import { BuiltInData } from '../built-in';

// ============================================================================
// Parameters Interface
// ============================================================================

/**
 * File tree source for ingredient data.
 * @public
 */
export type IIngredientFileTreeSource = SubLibraryFileTreeSource;

/**
 * Specifies an ingredients library to merge into a new library.
 * @public
 */
export type IngredientsMergeSource = SubLibraryMergeSource<IngredientsLibrary>;

/**
 * Parameters for creating an IngredientsLibrary instance.
 * @public
 */
export type IIngredientsLibraryParams = ISubLibraryParams<IngredientsLibrary, IngredientCollectionEntryInit>;

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
export class IngredientsLibrary extends SubLibraryBase<IngredientId, BaseIngredientId, Ingredient> {
  private constructor(params?: IIngredientsLibraryParams) {
    super({
      itemIdConverter: CommonConverters.baseIngredientId,
      itemConverter: ingredientConverter,
      loaderFactory: (mutable) =>
        new CollectionLoader({
          itemConverter: ingredientConverter,
          collectionIdConverter: CommonConverters.sourceId,
          itemIdConverter: CommonConverters.baseIngredientId,
          mutable
        }),
      directoryNavigator: getIngredientsDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params
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
