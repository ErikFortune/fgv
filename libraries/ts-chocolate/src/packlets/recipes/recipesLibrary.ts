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
  DetailedResult,
  ensureArray,
  Failure,
  mapResults,
  recordFromEntries,
  Result,
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
  createFilterFromSpec,
  getRecipesDirectory,
  ICollectionSet,
  ISubLibraryParams,
  LibraryLoadSpec,
  normalizeFileSources,
  normalizeMergeSource,
  specToLoadParams,
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
 * Detailed result for recipe operations.
 * @public
 */
export type RecipesDetailedResult<T> = DetailedResult<T, RecipeId>;

// ============================================================================
// Parameters Interface
// ============================================================================

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
 * Parameters for creating a RecipesLibrary instance.
 * @public
 */
export type IRecipesLibraryParams = ISubLibraryParams<RecipesLibrary, RecipeCollectionEntryInit>;

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
export class RecipesLibrary extends SubLibraryBase<RecipeId, BaseRecipeId, Recipe> {
  private constructor(collections: ReadonlyArray<RecipeCollectionEntryInit>) {
    super({
      itemIdConverter: CommonConverters.baseRecipeId,
      itemConverter: recipeConverter,
      collections
    });
  }

  /**
   * Loads built-in recipe collections based on the LibraryLoadSpec.
   *
   * Delegates to `_loadFromFileTreeSource` with the built-in library root
   * and forced immutability. This ensures built-in collections are always immutable.
   *
   * @param spec - The LibraryLoadSpec controlling which built-ins to load.
   * @returns Success with collections or Failure with error.
   */
  private static _loadBuiltInCollections(
    spec: LibraryLoadSpec<SourceId>
  ): Result<ReadonlyArray<RecipeCollectionEntryInit>> {
    // Handle disabled built-ins
    if (spec === false) {
      return Success.with([]);
    }

    // Get the built-in library root and delegate to file tree source loading
    return BuiltInData.getLibraryTree().onSuccess((libraryRoot) => {
      const source: IRecipeFileTreeSource = {
        directory: libraryRoot,
        load: spec, // Pass through the filter spec
        mutable: false // Built-ins are always immutable
      };
      return RecipesLibrary._loadFromFileTreeSource(source);
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
   * Extracts collections from merge sources with optional filtering.
   * @param sources - The merge sources to extract from.
   * @returns Array of collection entries from the merged libraries.
   */
  private static _extractCollections(
    sources: RecipesMergeSource | ReadonlyArray<RecipesMergeSource> | undefined
  ): ReadonlyArray<RecipeCollectionEntryInit> {
    if (sources === undefined) {
      return [];
    }

    const sourceArray = ensureArray(sources);
    const result: RecipeCollectionEntryInit[] = [];

    for (const source of sourceArray) {
      const { library, filter: filterSpec } = normalizeMergeSource(source);

      // Create filter from spec using shared helper
      const filter = createFilterFromSpec(filterSpec, CommonConverters.sourceId);

      // Build array of collection IDs for filtering
      const collectionIds = Array.from(library.collections.keys());

      // Filter the IDs
      const filterResult = filter.filterItems(collectionIds, (id: SourceId) => Success.with(id));
      if (filterResult.isSuccess()) {
        for (const filtered of filterResult.value) {
          const id = filtered.name;
          library.collections.get(id).asResult.onSuccess((collection) =>
            Success.with(
              result.push({
                id,
                isMutable: collection.isMutable,
                items: recordFromEntries(collection.items.entries())
              })
            )
          );
        }
      }
    }
    return result;
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
    const mergedLibraryCollections = RecipesLibrary._extractCollections(params?.mergeLibraries);

    // Load built-in collections
    return RecipesLibrary._loadBuiltInCollections(builtin).onSuccess((builtInCollections) => {
      // Load file source collections
      const fileSourceResults = fileSources.map((source, i) =>
        RecipesLibrary._loadFromFileTreeSource(source).onSuccess((collections) =>
          Success.with<ICollectionSet<SourceId>>({
            source: `fileSource[${i}]`,
            collections
          })
        )
      );

      return mapResults(fileSourceResults).onSuccess((fileSourceData) => {
        // Check for collisions between all sources
        const allSets: ReadonlyArray<ICollectionSet<SourceId>> = [
          { source: 'builtin', collections: builtInCollections },
          ...fileSourceData,
          { source: 'mergeLibraries', collections: mergedLibraryCollections }
        ];

        return checkForCollisionIds(allSets).onSuccess(() => {
          // Merge all collections - fileSourceData.collections contains full RecipeCollectionEntryInit objects
          const fileCollections = fileSourceData.flatMap(
            (d) => d.collections as ReadonlyArray<RecipeCollectionEntryInit>
          );
          const allCollections: RecipeCollectionEntryInit[] = [
            ...builtInCollections,
            ...fileCollections,
            ...mergedLibraryCollections,
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
          return Failure.with(`Collection ID '${coll.id}' already exists in this library`);
        }
      }

      // Add each collection
      for (const coll of collections) {
        this.addCollectionEntry(coll);
      }

      return Success.with(collections.length);
    });
  }
}
