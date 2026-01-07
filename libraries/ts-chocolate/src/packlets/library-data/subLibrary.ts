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
 * Sub-library base class for standardized collection management
 * @packageDocumentation
 */

import {
  Collections,
  Converter,
  ensureArray,
  fail,
  Failure,
  mapResults,
  recordFromEntries,
  Result,
  succeed,
  Success,
  Validator
} from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

import { SourceId } from '../common';
import { Converters as CommonConverters } from '../common';
import { CollectionLoader, EncryptedFileHandling } from './collectionLoader';
import { createFilterFromSpec } from './collectionFilter';
import { IEncryptionConfig, IFileTreeSource, IMergeLibrarySource, LibraryLoadSpec } from './model';
import {
  checkForCollisionIds,
  ICollectionSet,
  normalizeFileSources,
  normalizeMergeSource,
  specToLoadParams
} from './libraryLoader';

// ============================================================================
// Type Aliases
// ============================================================================

/**
 * A single entry in a sub-library collection.
 * Fixes the collection ID type to SourceId.
 *
 * @typeParam TBaseId - The base item ID type (e.g., `BaseIngredientId`)
 * @typeParam TItem - The item type stored in the collection (e.g., `Ingredient`)
 * @public
 */
export type SubLibraryCollectionEntry<TBaseId extends string, TItem> = Collections.AggregatedResultMapEntry<
  SourceId,
  TBaseId,
  TItem
>;

/**
 * Initialization type for a sub-library collection entry.
 * Fixes the collection ID type to SourceId.
 *
 * @typeParam TBaseId - The base item ID type (e.g., `BaseIngredientId`)
 * @typeParam TItem - The item type stored in the collection (e.g., `Ingredient`)
 * @public
 */
export type SubLibraryEntryInit<TBaseId extends string, TItem> = Collections.AggregatedResultMapEntryInit<
  SourceId,
  TBaseId,
  TItem
>;

/**
 * Validator type for sub-library collections.
 *
 * @typeParam TCompositeId - The composite ID type (e.g., `IngredientId`)
 * @typeParam TItem - The item type stored in the collection (e.g., `Ingredient`)
 * @public
 */
export type SubLibraryCollectionValidator<
  TCompositeId extends string,
  TItem
> = Collections.IReadOnlyResultMapValidator<TCompositeId, TItem>;

/**
 * Type for the collections map in a sub-library.
 * Maps SourceId to collection entries.
 *
 * @typeParam TBaseId - The base item ID type (e.g., `BaseIngredientId`)
 * @typeParam TItem - The item type stored in the collection (e.g., `Ingredient`)
 * @public
 */
export type SubLibraryCollection<TBaseId extends string, TItem> = Collections.IReadOnlyValidatingResultMap<
  SourceId,
  SubLibraryCollectionEntry<TBaseId, TItem>
>;

// ============================================================================
// File Tree and Merge Source Types
// ============================================================================

/**
 * File tree source for sub-library data.
 * Fixes the collection ID type to SourceId.
 * @public
 */
export type SubLibraryFileTreeSource = IFileTreeSource<SourceId>;

/**
 * Specifies a sub-library to merge into a new library.
 *
 * Can be either:
 * - A library instance directly (merges all collections)
 * - An `IMergeLibrarySource` object with optional filtering
 *
 * @typeParam TLibrary - The library type (e.g., `IngredientsLibrary`)
 * @public
 */
export type SubLibraryMergeSource<TLibrary> = TLibrary | IMergeLibrarySource<TLibrary, SourceId>;

// ============================================================================
// Directory Navigator and Built-in Tree Provider
// ============================================================================

/**
 * Function that navigates from library root to the appropriate data directory.
 *
 * @public
 */
export type SubLibraryDirectoryNavigator = (
  tree: FileTree.FileTreeItem
) => Result<FileTree.IFileTreeDirectoryItem>;

/**
 * Function that provides the built-in library tree.
 *
 * @public
 */
export type SubLibraryBuiltInTreeProvider = () => Result<FileTree.IFileTreeDirectoryItem>;

// ============================================================================
// Library Parameters
// ============================================================================

/**
 * Parameters for creating a sub-library instance.
 *
 * @typeParam TLibrary - The library type (e.g., `IngredientsLibrary`)
 * @typeParam TEntryInit - The collection entry initialization type (e.g., `IngredientCollectionEntryInit`)
 * @public
 */
export interface ISubLibraryParams<TLibrary, TEntryInit> {
  /**
   * Controls which built-in collections are loaded.
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
  readonly fileSources?: SubLibraryFileTreeSource | ReadonlyArray<SubLibraryFileTreeSource>;

  /**
   * Optional additional collections.
   * Each collection can be provided as a JSON entry or pre-built entry.
   */
  readonly collections?: ReadonlyArray<TEntryInit>;

  /**
   * Existing libraries to merge collections from.
   *
   * Collections are extracted from these libraries and merged with
   * builtin, file source, and explicit collections. Collection ID
   * collisions across any sources cause an error.
   *
   * Can be:
   * - A single library (merges all collections)
   * - An `IMergeLibrarySource` object with optional filtering
   * - An array of the above
   */
  readonly mergeLibraries?: SubLibraryMergeSource<TLibrary> | ReadonlyArray<SubLibraryMergeSource<TLibrary>>;
}

/**
 * Parameters for creating a sub-library instance asynchronously.
 *
 * Extends {@link LibraryData.ISubLibraryParams | ISubLibraryParams} with encryption support for decrypting
 * encrypted collections during async loading.
 *
 * @typeParam TLibrary - The library type (e.g., `IngredientsLibrary`)
 * @typeParam TEntryInit - The collection entry initialization type (e.g., `IngredientCollectionEntryInit`)
 * @public
 */
export interface ISubLibraryAsyncParams<TLibrary, TEntryInit>
  extends ISubLibraryParams<TLibrary, TEntryInit> {
  /**
   * Optional encryption configuration for decrypting encrypted collections.
   *
   * Only used by `createAsync()` - this field is ignored by synchronous `create()`.
   */
  readonly encryption?: IEncryptionConfig;
}

// ============================================================================
// Constructor Parameters
// ============================================================================

/**
 * Parameters for constructing a SubLibrary with full loading support.
 *
 * This interface extends the base collection parameters with factory functions
 * that allow the base class to handle all loading logic.
 *
 * @typeParam TLibrary - The library type (e.g., `IngredientsLibrary`)
 * @typeParam TBaseId - The base item ID type (e.g., `BaseIngredientId`)
 * @typeParam TItem - The item type stored in the collection (e.g., `Ingredient`)
 * @public
 */
export interface ISubLibraryCreateParams<TLibrary, TBaseId extends string, TItem> {
  /**
   * Converter or validator for item IDs within collections.
   */
  readonly itemIdConverter: Converter<TBaseId> | Validator<TBaseId>;

  /**
   * Converter or validator for items within collections.
   */
  readonly itemConverter: Converter<TItem> | Validator<TItem>;

  /**
   * Function that navigates from library root to the data directory.
   */
  readonly directoryNavigator: SubLibraryDirectoryNavigator;

  /**
   * Function that provides the built-in library tree.
   * Used to load built-in collections.
   */
  readonly builtInTreeProvider: SubLibraryBuiltInTreeProvider;

  /**
   * Library creation parameters (builtin, fileSources, collections, mergeLibraries).
   */
  readonly libraryParams?: ISubLibraryParams<TLibrary, SubLibraryEntryInit<TBaseId, TItem>>;
}

// ============================================================================
// SubLibraryBase Class
// ============================================================================

/**
 * Base class for sub-libraries that use SourceId as the collection ID.
 *
 * This abstract class standardizes:
 * - Collection ID type: Always `SourceId`
 * - Separator: Always `.` (dot)
 * - Collection ID converter: Always `CommonConverters.sourceId`
 * - Loading logic for built-in, file source, and merge library collections
 *
 * This reduces the type parameter count from 4 to 3 and eliminates
 * boilerplate in derived classes.
 *
 * @typeParam TCompositeId - The composite ID type (e.g., `IngredientId`)
 * @typeParam TBaseId - The base item ID type (e.g., `BaseIngredientId`)
 * @typeParam TItem - The item type stored in collections (e.g., `Ingredient`)
 * @public
 */
export abstract class SubLibraryBase<
  TCompositeId extends string,
  TBaseId extends string,
  TItem
> extends Collections.AggregatedResultMapBase<TCompositeId, SourceId, TBaseId, TItem> {
  /**
   * The item ID converter for creating loaders.
   * Used by loadFromFileTreeSource instance method.
   */
  private readonly _loaderItemIdConverter: Converter<TBaseId> | Validator<TBaseId>;

  /**
   * The item converter for creating loaders.
   * Used by loadFromFileTreeSource instance method.
   */
  private readonly _loaderItemConverter: Converter<TItem> | Validator<TItem>;

  /**
   * The directory navigator for this library type.
   * Used by loadFromFileTreeSource instance method.
   */
  private readonly _directoryNavigator: SubLibraryDirectoryNavigator;

  /**
   * Creates a new SubLibraryBase instance with full loading support.
   *
   * This constructor handles all collection loading:
   * - Built-in collections (from BuiltInData)
   * - File source collections
   * - Merge library collections
   * - Additional explicit collections
   *
   * @param params - Creation parameters including factory functions and library params
   * @throws Error if loading fails (use captureResult in derived create())
   */
  protected constructor(
    params: ISubLibraryCreateParams<SubLibraryBase<TCompositeId, TBaseId, TItem>, TBaseId, TItem>
  ) {
    const libraryParams = params.libraryParams;
    const builtin = libraryParams?.builtin ?? true;
    const fileSources = normalizeFileSources(libraryParams?.fileSources);
    const additionalCollections = libraryParams?.collections ?? [];

    // Load built-in collections
    const builtInCollections = SubLibraryBase._loadBuiltInCollections(
      builtin,
      params.itemIdConverter,
      params.itemConverter,
      params.directoryNavigator,
      params.builtInTreeProvider
    ).orThrow();

    // Load file source collections
    const fileSourceResults = fileSources.map((source, i) =>
      SubLibraryBase._loadFromFileTreeSource(
        source,
        params.itemIdConverter,
        params.itemConverter,
        params.directoryNavigator
      ).onSuccess((collections) =>
        Success.with<ICollectionSet<SourceId>>({
          source: `fileSource[${i}]`,
          collections
        })
      )
    );
    const fileSourceData = mapResults(fileSourceResults).orThrow();

    // Extract collections from merge libraries
    const mergedLibraryCollections = SubLibraryBase._extractCollections<TBaseId, TItem>(
      libraryParams?.mergeLibraries
    );

    // Check for collisions between all sources
    const allSets: ReadonlyArray<ICollectionSet<SourceId>> = [
      { source: 'builtin', collections: builtInCollections },
      ...fileSourceData,
      { source: 'mergeLibraries', collections: mergedLibraryCollections }
    ];
    checkForCollisionIds(allSets).orThrow();

    // Merge all collections
    const fileCollections = fileSourceData.flatMap(
      (d) => d.collections as ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>
    );
    const allCollections: SubLibraryEntryInit<TBaseId, TItem>[] = [
      ...builtInCollections,
      ...fileCollections,
      ...mergedLibraryCollections,
      ...additionalCollections
    ];

    super({
      collectionIdConverter: CommonConverters.sourceId,
      separator: '.',
      itemIdConverter: params.itemIdConverter,
      itemConverter: params.itemConverter,
      collections: allCollections
    });

    this._loaderItemIdConverter = params.itemIdConverter;
    this._loaderItemConverter = params.itemConverter;
    this._directoryNavigator = params.directoryNavigator;
  }

  // ============================================================================
  // Private Static Loading Methods
  // ============================================================================

  /**
   * Loads built-in collections based on the LibraryLoadSpec.
   *
   * @param spec - The LibraryLoadSpec controlling which built-ins to load.
   * @param itemIdConverter - Converter for item IDs.
   * @param itemConverter - Converter for items.
   * @param directoryNavigator - Function to navigate to the data directory.
   * @param builtInTreeProvider - Function to get the built-in library tree.
   * @returns Success with collections or Failure with error.
   */
  private static _loadBuiltInCollections<TBaseId extends string, TItem>(
    spec: LibraryLoadSpec<SourceId>,
    itemIdConverter: Converter<TBaseId> | Validator<TBaseId>,
    itemConverter: Converter<TItem> | Validator<TItem>,
    directoryNavigator: SubLibraryDirectoryNavigator,
    builtInTreeProvider: SubLibraryBuiltInTreeProvider
  ): Result<ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>> {
    if (spec === false) {
      return Success.with([]);
    }

    return builtInTreeProvider().onSuccess((libraryRoot) => {
      const source: SubLibraryFileTreeSource = {
        directory: libraryRoot,
        load: spec,
        mutable: false // Built-ins are always immutable
      };
      // Skip encrypted files silently for built-ins (use async loading to decrypt)
      return SubLibraryBase._loadFromFileTreeSource(
        source,
        itemIdConverter,
        itemConverter,
        directoryNavigator,
        'skip'
      );
    });
  }

  /**
   * Loads collections from a single file tree source.
   *
   * @param source - The file tree source to load from.
   * @param itemIdConverter - Converter for item IDs.
   * @param itemConverter - Converter for items.
   * @param directoryNavigator - Function to navigate to the data directory.
   * @param onEncryptedFile - How to handle encrypted files ('skip' for built-ins, 'warn' for external).
   * @returns Success with collections or Failure with error.
   */
  private static _loadFromFileTreeSource<TBaseId extends string, TItem>(
    source: SubLibraryFileTreeSource,
    itemIdConverter: Converter<TBaseId> | Validator<TBaseId>,
    itemConverter: Converter<TItem> | Validator<TItem>,
    directoryNavigator: SubLibraryDirectoryNavigator,
    onEncryptedFile?: EncryptedFileHandling
  ): Result<ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>> {
    const mutable = source.mutable ?? false;
    const loadParams = specToLoadParams(source.load ?? true, mutable);
    if (loadParams === undefined) {
      return Success.with([]);
    }

    /* c8 ignore next 6 - defensive fallback: loadParams.mutable always set by specToLoadParams */
    const loader = new CollectionLoader({
      itemConverter,
      collectionIdConverter: CommonConverters.sourceId,
      itemIdConverter,
      mutable: loadParams.mutable ?? mutable
    });

    return directoryNavigator(source.directory).onSuccess((dataDir) => {
      return loader.loadFromFileTree(dataDir, { ...loadParams, onEncryptedFile });
    });
  }

  /**
   * Extracts collections from merge sources with optional filtering.
   *
   * @param sources - The merge sources to extract from.
   * @returns Array of collection entries from the merged libraries.
   */
  private static _extractCollections<TBaseId extends string, TItem>(
    sources:
      | SubLibraryMergeSource<SubLibraryBase<string, TBaseId, TItem>>
      | ReadonlyArray<SubLibraryMergeSource<SubLibraryBase<string, TBaseId, TItem>>>
      | undefined
  ): ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>> {
    if (sources === undefined) {
      return [];
    }

    const sourceArray = ensureArray(sources);
    const result: SubLibraryEntryInit<TBaseId, TItem>[] = [];

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

  // ============================================================================
  // Async Loading Methods (for encryption support)
  // ============================================================================

  /**
   * Loads built-in collections asynchronously with encryption support.
   *
   * @param spec - The LibraryLoadSpec controlling which built-ins to load.
   * @param itemIdConverter - Converter for item IDs.
   * @param itemConverter - Converter for items.
   * @param directoryNavigator - Function to navigate to the data directory.
   * @param builtInTreeProvider - Function to get the built-in library tree.
   * @param encryption - Optional encryption configuration for decrypting files.
   * @returns Promise resolving to Success with collections or Failure with error.
   */
  private static async _loadBuiltInCollectionsAsync<TBaseId extends string, TItem>(
    spec: LibraryLoadSpec<SourceId>,
    itemIdConverter: Converter<TBaseId> | Validator<TBaseId>,
    itemConverter: Converter<TItem> | Validator<TItem>,
    directoryNavigator: SubLibraryDirectoryNavigator,
    builtInTreeProvider: SubLibraryBuiltInTreeProvider,
    encryption?: IEncryptionConfig
  ): Promise<Result<ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>>> {
    if (spec === false) {
      return Success.with([]);
    }

    const libraryRootResult = builtInTreeProvider();
    /* c8 ignore next 3 - defensive: builtInTreeProvider only fails if built-in data is malformed */
    if (libraryRootResult.isFailure()) {
      return fail(libraryRootResult.message);
    }

    const source: SubLibraryFileTreeSource = {
      directory: libraryRootResult.value,
      load: spec,
      mutable: false // Built-ins are always immutable
    };

    return SubLibraryBase._loadFromFileTreeSourceAsync(
      source,
      itemIdConverter,
      itemConverter,
      directoryNavigator,
      encryption
    );
  }

  /**
   * Loads collections from a single file tree source asynchronously with encryption support.
   *
   * @param source - The file tree source to load from.
   * @param itemIdConverter - Converter for item IDs.
   * @param itemConverter - Converter for items.
   * @param directoryNavigator - Function to navigate to the data directory.
   * @param encryption - Optional encryption configuration for decrypting files.
   * @returns Promise resolving to Success with collections or Failure with error.
   */
  private static async _loadFromFileTreeSourceAsync<TBaseId extends string, TItem>(
    source: SubLibraryFileTreeSource,
    itemIdConverter: Converter<TBaseId> | Validator<TBaseId>,
    itemConverter: Converter<TItem> | Validator<TItem>,
    directoryNavigator: SubLibraryDirectoryNavigator,
    encryption?: IEncryptionConfig
  ): Promise<Result<ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>>> {
    /* c8 ignore next 1 - both branches tested but coverage intermittently missed */
    const mutable = source.mutable ?? false;
    const loadParams = specToLoadParams(source.load ?? true, mutable);
    /* c8 ignore next 3 - defensive: only undefined when spec is explicitly false, handled by caller */
    if (loadParams === undefined) {
      return Success.with([]);
    }

    /* c8 ignore next 6 - defensive fallback: loadParams.mutable always set by specToLoadParams */
    const loader = new CollectionLoader({
      itemConverter,
      collectionIdConverter: CommonConverters.sourceId,
      itemIdConverter,
      mutable: loadParams.mutable ?? mutable
    });

    const dataDirResult = directoryNavigator(source.directory);
    /* c8 ignore next 3 - defensive: directory navigation only fails with malformed FileTree */
    if (dataDirResult.isFailure()) {
      return fail(dataDirResult.message);
    }

    return loader.loadFromFileTreeAsync(dataDirResult.value, {
      ...loadParams,
      encryption
    });
  }

  /**
   * Loads all collections asynchronously with encryption support.
   *
   * This is a protected helper for derived class `createAsync()` methods.
   * It handles built-in collections, file sources, and merge libraries.
   *
   * Encryption configuration is read from `params.libraryParams.encryption`.
   *
   * @param params - The creation parameters (encryption config comes from libraryParams.encryption).
   * @returns Promise resolving to Success with all collections or Failure with error.
   */
  protected static async loadAllCollectionsAsync<
    TLibrary extends SubLibraryBase<string, TBaseId, TItem>,
    TBaseId extends string,
    TItem
  >(
    params: ISubLibraryCreateParams<TLibrary, TBaseId, TItem>
  ): Promise<Result<SubLibraryEntryInit<TBaseId, TItem>[]>> {
    const libraryParams = params.libraryParams as
      | ISubLibraryAsyncParams<TLibrary, SubLibraryEntryInit<TBaseId, TItem>>
      | undefined;
    const builtin = libraryParams?.builtin ?? true;
    const fileSources = normalizeFileSources(libraryParams?.fileSources);
    /* c8 ignore next 1 - both branches tested but coverage intermittently missed */
    const additionalCollections = libraryParams?.collections ?? [];
    const encryption = libraryParams?.encryption;

    // Load built-in collections async
    const builtInResult = await SubLibraryBase._loadBuiltInCollectionsAsync(
      builtin,
      params.itemIdConverter,
      params.itemConverter,
      params.directoryNavigator,
      params.builtInTreeProvider,
      encryption
    );
    if (builtInResult.isFailure()) {
      return fail(builtInResult.message);
    }

    // Load file sources async
    const fileSourceResults: Result<ICollectionSet<SourceId>>[] = [];
    for (let i = 0; i < fileSources.length; i++) {
      const result = await SubLibraryBase._loadFromFileTreeSourceAsync(
        fileSources[i],
        params.itemIdConverter,
        params.itemConverter,
        params.directoryNavigator,
        encryption
      );
      if (result.isFailure()) {
        return fail(result.message);
      }
      fileSourceResults.push(
        succeed({
          source: `fileSource[${i}]`,
          collections: result.value as ReadonlyArray<SubLibraryEntryInit<string, unknown>>
        })
      );
    }

    const fileSourceData = mapResults(fileSourceResults);
    /* c8 ignore next 3 - defensive: fileSource failures are caught and returned in the loop above */
    if (fileSourceData.isFailure()) {
      return fail(fileSourceData.message);
    }

    // Extract from merge libraries (sync - these are already loaded)
    const mergedCollections = SubLibraryBase._extractCollections<TBaseId, TItem>(
      libraryParams?.mergeLibraries as
        | SubLibraryMergeSource<SubLibraryBase<string, TBaseId, TItem>>
        | ReadonlyArray<SubLibraryMergeSource<SubLibraryBase<string, TBaseId, TItem>>>
        | undefined
    );

    // Check for collisions
    const allSets: ReadonlyArray<ICollectionSet<SourceId>> = [
      {
        source: 'builtin',
        collections: builtInResult.value as ReadonlyArray<SubLibraryEntryInit<string, unknown>>
      },
      ...fileSourceData.value,
      {
        source: 'mergeLibraries',
        collections: mergedCollections as ReadonlyArray<SubLibraryEntryInit<string, unknown>>
      }
    ];
    const collisionCheck = checkForCollisionIds(allSets);
    /* c8 ignore next 3 - defensive: collision check tested in sync path and libraryLoader tests */
    if (collisionCheck.isFailure()) {
      return fail(collisionCheck.message);
    }

    // Merge all
    const fileCollections = fileSourceData.value.flatMap(
      (d) => d.collections as ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>
    );
    return succeed([
      ...builtInResult.value,
      ...fileCollections,
      ...mergedCollections,
      ...additionalCollections
    ]);
  }

  // ============================================================================
  // Instance Methods
  // ============================================================================

  /**
   * Loads collections from a file tree source and adds them to this library.
   *
   * @param source - The file tree source to load from
   * @returns Success with the number of collections added, or Failure with error message
   * @public
   */
  public loadFromFileTreeSource(source: SubLibraryFileTreeSource): Result<number> {
    return SubLibraryBase._loadFromFileTreeSource(
      source,
      this._loaderItemIdConverter,
      this._loaderItemConverter,
      this._directoryNavigator
    ).onSuccess((collections) => {
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
