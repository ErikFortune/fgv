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

import { captureResult, fail, Logging, Result } from '@fgv/ts-utils';

import { BaseRecipeId, RecipeId } from '../common';
import { Converters as CommonConverters } from '../common';
import { Recipe } from './recipe';
import { recipe as recipeConverter } from './converters';
import { RecipeCollectionEntryInit } from './recipesCollection';
import {
  getRecipesDirectory,
  ISubLibraryAsyncParams,
  ISubLibraryCreateParams,
  ISubLibraryParams,
  SubLibraryBase,
  SubLibraryFileTreeSource,
  SubLibraryMergeSource
} from '../library-data';
import { BuiltInData } from '../built-in';

// ============================================================================
// Re-export collection types for convenience
// ============================================================================

export {
  RecipeCollectionEntry,
  RecipeCollectionEntryInit,
  RecipeCollectionValidator,
  RecipeCollection
} from './recipesCollection';

/**
 * File tree source for recipe data.
 * @public
 */
export type IRecipeFileTreeSource = SubLibraryFileTreeSource;

/**
 * Specifies a recipes library to merge into a new library.
 * @public
 */
export type RecipesMergeSource = SubLibraryMergeSource<RecipesLibrary>;

/**
 * Parameters for creating a RecipesLibrary instance synchronously.
 * @public
 */
export type IRecipesLibraryParams = ISubLibraryParams<RecipesLibrary, RecipeCollectionEntryInit>;

/**
 * Parameters for creating a RecipesLibrary instance asynchronously with encryption support.
 * @public
 */
export type IRecipesLibraryAsyncParams = ISubLibraryAsyncParams<RecipesLibrary, RecipeCollectionEntryInit>;

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
export class RecipesLibrary extends SubLibraryBase<RecipeId, BaseRecipeId, Recipe> {
  private constructor(params?: IRecipesLibraryParams) {
    super({
      itemIdConverter: CommonConverters.baseRecipeId,
      itemConverter: recipeConverter,
      directoryNavigator: getRecipesDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params
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

  /**
   * Creates a new RecipesLibrary instance asynchronously with encryption support.
   *
   * Use this factory method when you need to decrypt encrypted collections.
   * Pass encryption config via `params.encryption`.
   *
   * @param params - Optional creation parameters with initial collections and encryption config
   * @returns Promise resolving to Success with new instance, or Failure with error message
   * @public
   */
  public static async createAsync(params?: IRecipesLibraryAsyncParams): Promise<Result<RecipesLibrary>> {
    /* c8 ignore next - default logger branch tested implicitly */
    const logger = params?.logger ?? new Logging.LogReporter<unknown>();

    const createParams: ISubLibraryCreateParams<RecipesLibrary, BaseRecipeId, Recipe> = {
      itemIdConverter: CommonConverters.baseRecipeId,
      itemConverter: recipeConverter,
      directoryNavigator: getRecipesDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params,
      logger
    };

    // Load all collections asynchronously with encryption support
    const collectionsResult = (await SubLibraryBase.loadAllCollectionsAsync(createParams)).report(logger);
    if (collectionsResult.isFailure()) {
      return fail(collectionsResult.message);
    }

    // Create library with pre-loaded collections (no file sources, no built-in - already loaded)
    return captureResult(
      () =>
        new RecipesLibrary({
          ...params,
          builtin: false, // Already loaded
          fileSources: undefined, // Already loaded
          collections: collectionsResult.value
        })
    );
  }
}
