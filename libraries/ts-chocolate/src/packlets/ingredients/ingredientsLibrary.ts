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

import {
  captureResult,
  ensureArray,
  Failure,
  mapResults,
  recordFromEntries,
  Result,
  Success
} from '@fgv/ts-utils';

import { BaseIngredientId, IngredientId, SourceId } from '../common';
import { Converters as CommonConverters } from '../common';
import { Ingredient } from './model';
import { ingredient as ingredientConverter } from './converters';
import { IngredientCollectionEntryInit } from './ingredientsCollection';
import {
  checkForCollisionIds,
  CollectionLoader,
  createFilterFromSpec,
  getIngredientsDirectory,
  ICollectionSet,
  IFileTreeSource,
  IMergeLibrarySource,
  LibraryLoadSpec,
  normalizeFileSources,
  normalizeMergeSource,
  specToLoadParams,
  SubLibraryBase
} from '../library-data';
import { BuiltInData } from '../built-in';

// ============================================================================
// Parameters Interface
// ============================================================================

/**
 * File tree source for ingredient data.
 *
 * Navigates to the standard path (data/ingredients) within the tree
 * and loads collections according to the load spec.
 *
 * @public
 */
export type IIngredientFileTreeSource = IFileTreeSource<SourceId>;

/**
 * Specifies an ingredients library to merge into a new library.
 *
 * Can be either:
 * - An `IngredientsLibrary` instance (merges all collections)
 * - An `IMergeLibrarySource` object with optional filtering
 *
 * @public
 */
export type IngredientsMergeSource = IngredientsLibrary | IMergeLibrarySource<IngredientsLibrary, SourceId>;

/**
 * Parameters for creating an IngredientsLibrary instance
 * @public
 */
export interface IIngredientsLibraryParams {
  /**
   * Controls which built-in ingredient collections are loaded.
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
  readonly fileSources?: IIngredientFileTreeSource | ReadonlyArray<IIngredientFileTreeSource>;

  /**
   * Optional additional collections of ingredients
   * Each collection can be provided as a JSON entry or pre-built entry
   */
  readonly collections?: ReadonlyArray<IngredientCollectionEntryInit>;

  /**
   * Existing libraries to merge collections from.
   *
   * Collections are extracted from these libraries and merged with
   * builtin, file source, and explicit collections. Collection ID
   * collisions across any sources cause an error.
   *
   * Can be:
   * - A single `IngredientsLibrary` (merges all collections)
   * - An `IMergeLibrarySource` object with optional filtering
   * - An array of the above
   */
  readonly mergeLibraries?: IngredientsMergeSource | ReadonlyArray<IngredientsMergeSource>;
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
export class IngredientsLibrary extends SubLibraryBase<IngredientId, BaseIngredientId, Ingredient> {
  private constructor(collections: ReadonlyArray<IngredientCollectionEntryInit>) {
    super({
      itemIdConverter: CommonConverters.baseIngredientId,
      itemConverter: ingredientConverter,
      collections
    });
  }

  /**
   * Loads built-in ingredient collections based on the LibraryLoadSpec.
   *
   * Delegates to `_loadFromFileTreeSource` with the built-in library root
   * and forced immutability. This ensures built-in collections are always immutable.
   *
   * @param spec - The LibraryLoadSpec controlling which built-ins to load.
   * @returns Success with collections or Failure with error.
   */
  private static _loadBuiltInCollections(
    spec: LibraryLoadSpec<SourceId>
  ): Result<ReadonlyArray<IngredientCollectionEntryInit>> {
    // Handle disabled built-ins
    if (spec === false) {
      return Success.with([]);
    }

    // Get the built-in library root and delegate to file tree source loading
    return BuiltInData.getLibraryTree().onSuccess((libraryRoot) => {
      const source: IIngredientFileTreeSource = {
        directory: libraryRoot,
        load: spec, // Pass through the filter spec
        mutable: false // Built-ins are always immutable
      };
      return IngredientsLibrary._loadFromFileTreeSource(source);
    });
  }

  /**
   * Loads collections from a single file tree source.
   * @param source - The file tree source to load from.
   * @returns Success with collections or Failure with error.
   */
  private static _loadFromFileTreeSource(
    source: IIngredientFileTreeSource
  ): Result<ReadonlyArray<IngredientCollectionEntryInit>> {
    const loadParams = specToLoadParams(source.load ?? true, source.mutable ?? false);
    if (loadParams === undefined) {
      return Success.with([]);
    }

    const loader = new CollectionLoader<Ingredient, SourceId, BaseIngredientId>({
      itemConverter: ingredientConverter,
      collectionIdConverter: CommonConverters.sourceId,
      itemIdConverter: CommonConverters.baseIngredientId,
      mutable: loadParams.mutable
    });

    return getIngredientsDirectory(source.directory).onSuccess((ingredientsDir) => {
      return loader.loadFromFileTree(ingredientsDir, loadParams);
    });
  }

  /**
   * Extracts collections from merge sources with optional filtering.
   * @param sources - The merge sources to extract from.
   * @returns Array of collection entries from the merged libraries.
   */
  private static _extractCollections(
    sources: IngredientsMergeSource | ReadonlyArray<IngredientsMergeSource> | undefined
  ): ReadonlyArray<IngredientCollectionEntryInit> {
    if (sources === undefined) {
      return [];
    }

    const sourceArray = ensureArray(sources);
    const result: IngredientCollectionEntryInit[] = [];

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
   * Creates a new IngredientsLibrary instance
   * @param params - Optional creation parameters with initial collections
   * @returns Success with new instance, or Failure with error message
   * @public
   */
  public static create(params?: IIngredientsLibraryParams): Result<IngredientsLibrary> {
    const builtin = params?.builtin ?? true;
    const fileSources = normalizeFileSources(params?.fileSources);
    const additionalCollections = params?.collections ?? [];
    const mergedLibraryCollections = IngredientsLibrary._extractCollections(params?.mergeLibraries);

    // Load built-in collections
    return IngredientsLibrary._loadBuiltInCollections(builtin).onSuccess((builtInCollections) => {
      // Load file source collections
      const fileSourceResults = fileSources.map((source, i) =>
        IngredientsLibrary._loadFromFileTreeSource(source).onSuccess((collections) =>
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
          // Merge all collections - fileSourceData.collections contains full IngredientCollectionEntryInit objects
          const fileCollections = fileSourceData.flatMap(
            (d) => d.collections as ReadonlyArray<IngredientCollectionEntryInit>
          );
          const allCollections: IngredientCollectionEntryInit[] = [
            ...builtInCollections,
            ...fileCollections,
            ...mergedLibraryCollections,
            ...additionalCollections
          ];
          return captureResult(() => new IngredientsLibrary(allCollections));
        });
      });
    });
  }

  // ============================================================================
  // Instance Methods
  // ============================================================================

  /**
   * Loads ingredients from a file tree source and adds them to this library.
   *
   * @param source - The file tree source to load from
   * @returns Success with the number of collections added, or Failure with error message
   * @public
   */
  public loadFromFileTreeSource(source: IIngredientFileTreeSource): Result<number> {
    return IngredientsLibrary._loadFromFileTreeSource(source).onSuccess((collections) => {
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
