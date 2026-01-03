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

import {
  captureResult,
  Collections,
  DetailedResult,
  fail,
  mapResults,
  Result,
  succeed,
  Success
} from '@fgv/ts-utils';

import { BaseRecipeId, RecipeId, SourceId } from '../common';
import { Converters as CommonConverters } from '../common';
import { Recipe } from './recipe';
import { recipe as recipeConverter } from './converters';
import { RecipeCollectionEntryInit } from './recipesCollection';
import {
  checkForCollisionIds,
  CollectionLoader,
  getRecipesDirectory,
  ICollectionSet,
  IFileTreeSource,
  LibraryLoadSpec,
  normalizeFileSources,
  specToLoadParams
} from '../library-data';
import { BuiltInData, builtInSpecToLoadParams } from '../built-in';

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
 * Detailed result for recipe operations.
 * @public
 */
export type RecipesDetailedResult<T> = DetailedResult<T, RecipeId>;

// ============================================================================
// Parameters Interface
// ============================================================================

/**
 * File tree source for recipe data.
 *
 * Navigates to the standard path (data/recipes) within the tree
 * and loads collections according to the load spec.
 *
 * @public
 */
export type IRecipeFileTreeSource = IFileTreeSource<SourceId>;

/**
 * Parameters for creating a RecipesLibrary instance
 * @public
 */
export interface IRecipesLibraryParams {
  /**
   * Controls which built-in recipe collections are loaded.
   * Built-in collections are always immutable.
   *
   * - `true` (default): Load all built-in collections.
   * - `false`: Load no built-in collections.
   * - `SourceId[]`: Load only the specified built-in collections by name.
   * - `ILibraryLoadParams`: Fine-grained control using include/exclude patterns.
   */
  readonly builtin?: LibraryLoadSpec<SourceId>;

  /**
   * File tree sources to load collections from.
   * Collections are loaded and merged with built-in collections.
   * Duplicate collection IDs across sources cause an error.
   */
  readonly fileSources?: IRecipeFileTreeSource | ReadonlyArray<IRecipeFileTreeSource>;

  /**
   * Optional additional collections of recipes
   * Each collection can be provided as a JSON entry or pre-built entry
   */
  readonly collections?: ReadonlyArray<RecipeCollectionEntryInit>;
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
  private constructor(collections: ReadonlyArray<RecipeCollectionEntryInit>) {
    super({
      collectionIdConverter: CommonConverters.sourceId,
      itemIdConverter: CommonConverters.baseRecipeId,
      itemConverter: recipeConverter,
      separator: '.',
      collections
    });
  }

  /**
   * Loads built-in recipe collections based on the LibraryLoadSpec.
   * @param spec - The LibraryLoadSpec controlling which built-ins to load.
   * @returns Success with collections or Failure with error.
   */
  private static _loadBuiltInCollections(
    spec: LibraryLoadSpec<SourceId>
  ): Result<ReadonlyArray<RecipeCollectionEntryInit>> {
    const loadParams = builtInSpecToLoadParams(spec);
    if (loadParams === undefined) {
      return Success.with([]);
    }

    const loader = new CollectionLoader<Recipe, SourceId, BaseRecipeId>({
      itemConverter: recipeConverter,
      collectionIdConverter: CommonConverters.sourceId,
      itemIdConverter: CommonConverters.baseRecipeId,
      mutable: false // Default for this loader
    });

    return BuiltInData.getRecipesDirectory().onSuccess((recipesDir) => {
      return loader.loadFromFileTree(recipesDir, loadParams);
    });
  }

  /**
   * Loads collections from a single file tree source.
   * @param source - The file tree source to load from.
   * @returns Success with collections or Failure with error.
   */
  private static _loadFromFileTreeSource(
    source: IRecipeFileTreeSource
  ): Result<ReadonlyArray<RecipeCollectionEntryInit>> {
    const loadParams = specToLoadParams(source.load ?? true, source.mutable ?? false);
    if (loadParams === undefined) {
      return Success.with([]);
    }

    const loader = new CollectionLoader<Recipe, SourceId, BaseRecipeId>({
      itemConverter: recipeConverter,
      collectionIdConverter: CommonConverters.sourceId,
      itemIdConverter: CommonConverters.baseRecipeId,
      mutable: loadParams.mutable
    });

    return getRecipesDirectory(source.directory).onSuccess((recipesDir) => {
      return loader.loadFromFileTree(recipesDir, loadParams);
    });
  }

  /**
   * Creates a new RecipesLibrary instance
   * @param params - Optional creation parameters with initial collections
   * @returns Success with new instance, or Failure with error message
   * @public
   */
  public static create(params?: IRecipesLibraryParams): Result<RecipesLibrary> {
    const builtin = params?.builtin ?? true;
    const fileSources = normalizeFileSources(params?.fileSources);
    const additionalCollections = params?.collections ?? [];

    // Load built-in collections
    return RecipesLibrary._loadBuiltInCollections(builtin).onSuccess((builtInCollections) => {
      // Load file source collections
      const fileSourceResults = fileSources.map((source, i) =>
        RecipesLibrary._loadFromFileTreeSource(source).onSuccess((collections) =>
          succeed<ICollectionSet<SourceId>>({
            source: `fileSource[${i}]`,
            collections
          })
        )
      );

      return mapResults(fileSourceResults).onSuccess((fileSourceData) => {
        // Check for collisions between all sources
        const builtinCollectionSet: ICollectionSet<SourceId> = {
          source: 'builtin',
          collections: builtInCollections
        };
        const allSets: ReadonlyArray<ICollectionSet<SourceId>> = [builtinCollectionSet, ...fileSourceData];

        return checkForCollisionIds(allSets).onSuccess(() => {
          // Merge all collections - fileSourceData.collections contains full RecipeCollectionEntryInit objects
          const fileCollections = fileSourceData.flatMap(
            (d) => d.collections as ReadonlyArray<RecipeCollectionEntryInit>
          );
          const allCollections: RecipeCollectionEntryInit[] = [
            ...builtInCollections,
            ...fileCollections,
            ...additionalCollections
          ];
          return captureResult(() => new RecipesLibrary(allCollections));
        });
      });
    });
  }

  // ============================================================================
  // Instance Methods
  // ============================================================================

  /**
   * Loads recipes from a file tree source and adds them to this library.
   *
   * @param source - The file tree source to load from
   * @returns Success with the number of collections added, or Failure with error message
   * @public
   */
  public loadFromFileTreeSource(source: IRecipeFileTreeSource): Result<number> {
    return RecipesLibrary._loadFromFileTreeSource(source).onSuccess((collections) => {
      // Check for collisions with existing collections
      const existingIds = new Set(this.collections.keys());
      for (const coll of collections) {
        if (existingIds.has(coll.id)) {
          return fail(`Collection ID '${coll.id}' already exists in this library`);
        }
      }

      // Add each collection
      for (const coll of collections) {
        this.addCollectionEntry(coll);
      }

      return succeed(collections.length);
    });
  }
}
