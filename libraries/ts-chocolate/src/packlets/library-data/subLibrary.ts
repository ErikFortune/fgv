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
  Logging,
  mapResults,
  MessageAggregator,
  omit,
  recordFromEntries,
  Result,
  succeed,
  Success,
  Validator
} from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

import { SourceId } from '../common';
import { Converters as CommonConverters } from '../common';
import { collectionSourceMetadata as collectionSourceMetadataConverter } from './converters';
import { decryptCollectionFile } from '../crypto-utils';
import { CollectionLoader, EncryptedFileHandling } from './collectionLoader';
import { createFilterFromSpec } from './collectionFilter';
import {
  ICollectionSourceMetadata,
  IEncryptionConfig,
  IFileTreeSource,
  IMergeLibrarySource,
  IProtectedCollectionInternal,
  IProtectedCollectionInfo,
  LibraryLoadSpec
} from './model';
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
 * Fixes the collection ID type to SourceId and metadata type to ICollectionSourceMetadata.
 *
 * @typeParam TBaseId - The base item ID type (e.g., `BaseIngredientId`)
 * @typeParam TItem - The item type stored in the collection (e.g., `Ingredient`)
 * @public
 */
export type SubLibraryCollectionEntry<TBaseId extends string, TItem> = Collections.AggregatedResultMapEntry<
  SourceId,
  TBaseId,
  TItem,
  ICollectionSourceMetadata
>;

/**
 * Initialization type for a sub-library collection entry.
 * Fixes the collection ID type to SourceId and metadata type to ICollectionSourceMetadata.
 *
 * @typeParam TBaseId - The base item ID type (e.g., `BaseIngredientId`)
 * @typeParam TItem - The item type stored in the collection (e.g., `Ingredient`)
 * @public
 */
export type SubLibraryEntryInit<TBaseId extends string, TItem> = Collections.AggregatedResultMapEntryInit<
  SourceId,
  TBaseId,
  TItem,
  ICollectionSourceMetadata
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

  /**
   * Optional logger for reporting loading progress and issues.
   */
  readonly logger?: Logging.LogReporter<unknown>;

  /**
   * Protected collections that were captured during loading.
   *
   * These are encrypted collections that could not be decrypted (e.g., due to missing keys).
   * They can be decrypted later using `loadProtectedCollectionAsync`.
   *
   * This field is typically populated by `loadAllCollectionsAsync` and passed to
   * the constructor by derived class `createAsync()` methods.
   */
  readonly protectedCollections?: ReadonlyArray<IProtectedCollectionInternal<SourceId>>;
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

/**
 * Result from async collection loading operations.
 *
 * Contains both successfully loaded collections and protected collections
 * that were captured but could not be decrypted (e.g., due to missing keys).
 *
 * @typeParam TBaseId - The base item ID type (e.g., `BaseIngredientId`)
 * @typeParam TItem - The item type stored in the collection (e.g., `Ingredient`)
 * @public
 */
export interface ISubLibraryAsyncLoadResult<TBaseId extends string, TItem> {
  /**
   * Successfully loaded collections ready to be added to the library.
   */
  readonly collections: ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>;

  /**
   * Protected collections that were captured but not decrypted.
   * These can be decrypted later using `loadProtectedCollectionAsync`.
   */
  readonly protectedCollections: ReadonlyArray<IProtectedCollectionInternal<SourceId>>;
}

/**
 * Internal result type for file tree source loading.
 * @internal
 */
interface IFileTreeSourceLoadResult<TBaseId extends string, TItem> {
  readonly collections: ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>;
  readonly protectedCollections: ReadonlyArray<IProtectedCollectionInternal<SourceId>>;
  readonly sourceItems: ReadonlyMap<SourceId, FileTree.FileTreeItem>;
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

  /** Optional logger for reporting loading progress and issues. */
  readonly logger?: Logging.LogReporter<unknown>;
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
> extends Collections.AggregatedResultMapBase<
  TCompositeId,
  SourceId,
  TBaseId,
  TItem,
  ICollectionSourceMetadata
> {
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

  private readonly _logger: Logging.LogReporter<unknown>;

  /**
   * Protected collections that were captured but not decrypted during loading.
   * These can be decrypted later using loadProtectedCollectionAsync.
   */
  private readonly _protectedCollections: Map<SourceId, IProtectedCollectionInternal<SourceId>>;

  /**
   * FileTree source items for collections loaded from FileTree.
   * Maps collection ID to its source FileTree item for persistence.
   */
  private readonly _sourceItems: Map<SourceId, FileTree.FileTreeItem>;

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
    /* c8 ignore next - default logger branch tested implicitly */
    const logger = params.logger ?? new Logging.LogReporter<unknown>();

    // Load built-in collections (includes protected collection metadata)
    const builtInResult = SubLibraryBase._loadBuiltInCollections(
      builtin,
      params.itemIdConverter,
      params.itemConverter,
      params.directoryNavigator,
      params.builtInTreeProvider,
      logger
    ).orThrow();

    // Load file source collections
    const fileSourceResults = fileSources.map((source, i) =>
      SubLibraryBase._loadFromFileTreeSource(
        source,
        params.itemIdConverter,
        params.itemConverter,
        params.directoryNavigator,
        'capture', // capture encrypted files for later decryption
        logger,
        false // not built-in
      )
        .onSuccess((loadResult) =>
          Success.with<
            ICollectionSet<SourceId> & {
              protectedCollections: typeof loadResult.protectedCollections;
              sourceItems: typeof loadResult.sourceItems;
            }
          >({
            source: `fileSource[${i}]`,
            collections: loadResult.collections,
            protectedCollections: loadResult.protectedCollections,
            sourceItems: loadResult.sourceItems
          })
        )
        .report(logger)
    );
    const fileSourceData = mapResults(fileSourceResults).orThrow();

    // Extract collections from merge libraries
    const mergedLibraryCollections = SubLibraryBase._extractCollections<TBaseId, TItem>(
      libraryParams?.mergeLibraries
    );

    // Check for collisions between all sources
    const allSets: ReadonlyArray<ICollectionSet<SourceId>> = [
      { source: 'builtin', collections: builtInResult.collections },
      ...fileSourceData.map((d) => ({ source: d.source, collections: d.collections })),
      { source: 'mergeLibraries', collections: mergedLibraryCollections }
    ];
    checkForCollisionIds(allSets).report(logger).orThrow();

    // Merge all collections
    const fileCollections = fileSourceData.flatMap(
      (d) => d.collections as ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>
    );
    const allCollections: SubLibraryEntryInit<TBaseId, TItem>[] = [
      ...builtInResult.collections,
      ...fileCollections,
      ...mergedLibraryCollections,
      ...additionalCollections
    ];

    super({
      collectionIdConverter: CommonConverters.sourceId,
      separator: '.',
      itemIdConverter: params.itemIdConverter,
      itemConverter: params.itemConverter,
      metadataConverter: collectionSourceMetadataConverter,
      collections: allCollections
    });

    this._loaderItemIdConverter = params.itemIdConverter;
    this._loaderItemConverter = params.itemConverter;
    this._directoryNavigator = params.directoryNavigator;
    this._logger = logger;

    // Initialize source items map for persistence
    this._sourceItems = new Map();

    // Populate source items from built-in collections
    for (const [id, item] of builtInResult.sourceItems) {
      this._sourceItems.set(id, item);
    }

    // Populate source items from file sources
    for (const fileSource of fileSourceData) {
      for (const [id, item] of fileSource.sourceItems) {
        this._sourceItems.set(id, item);
      }
    }

    // Initialize protected collections from all sources
    this._protectedCollections = new Map();

    // Add protected collections from built-in loading
    for (const pc of builtInResult.protectedCollections) {
      this._protectedCollections.set(pc.ref.collectionId, pc);
    }

    // Add protected collections from file sources
    /* c8 ignore next 4 - protected collection paths tested but coverage intermittently missed */
    for (const fileSource of fileSourceData) {
      for (const pc of fileSource.protectedCollections) {
        this._protectedCollections.set(pc.ref.collectionId, pc);
      }
    }

    // Add protected collections from params (e.g., from async loading)
    if (libraryParams?.protectedCollections) {
      for (const pc of libraryParams.protectedCollections) {
        this._protectedCollections.set(pc.ref.collectionId, pc);
      }
    }
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
   * @param logger - Optional logger for reporting loading progress and issues.
   * @returns Success with collections or Failure with error.
   */
  private static _loadBuiltInCollections<TBaseId extends string, TItem>(
    spec: LibraryLoadSpec<SourceId>,
    itemIdConverter: Converter<TBaseId> | Validator<TBaseId>,
    itemConverter: Converter<TItem> | Validator<TItem>,
    directoryNavigator: SubLibraryDirectoryNavigator,
    builtInTreeProvider: SubLibraryBuiltInTreeProvider,
    logger?: Logging.LogReporter<unknown>
  ): Result<IFileTreeSourceLoadResult<TBaseId, TItem>> {
    if (spec === false) {
      return Success.with({ collections: [], protectedCollections: [], sourceItems: new Map() });
    }

    return builtInTreeProvider().onSuccess((libraryRoot) => {
      const source: SubLibraryFileTreeSource = {
        directory: libraryRoot,
        load: spec,
        mutable: false // Built-ins are always immutable
      };
      // Capture encrypted files for later decryption
      return SubLibraryBase._loadFromFileTreeSource(
        source,
        itemIdConverter,
        itemConverter,
        directoryNavigator,
        'capture',
        logger,
        true // isBuiltIn
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
   * @param onEncryptedFile - How to handle encrypted files (defaults to 'capture').
   * @param logger - Optional logger for reporting loading progress and issues.
   * @param isBuiltIn - Whether this source is built-in library data (for protected collection refs).
   * @returns Success with collections and protected collections, or Failure with error.
   */
  private static _loadFromFileTreeSource<TBaseId extends string, TItem>(
    source: SubLibraryFileTreeSource,
    itemIdConverter: Converter<TBaseId> | Validator<TBaseId>,
    itemConverter: Converter<TItem> | Validator<TItem>,
    directoryNavigator: SubLibraryDirectoryNavigator,
    onEncryptedFile?: EncryptedFileHandling,
    logger?: Logging.LogReporter<unknown>,
    isBuiltIn?: boolean
  ): Result<IFileTreeSourceLoadResult<TBaseId, TItem>> {
    const mutable = source.mutable ?? false;
    const loadParams = specToLoadParams(source.load ?? true, mutable);
    if (loadParams === undefined) {
      return Success.with({ collections: [], protectedCollections: [], sourceItems: new Map() });
    }

    /* c8 ignore next 7 - defensive fallback: loadParams.mutable always set by specToLoadParams */
    const loader = new CollectionLoader({
      itemConverter,
      collectionIdConverter: CommonConverters.sourceId,
      itemIdConverter,
      mutable: loadParams.mutable ?? mutable,
      logger
    });

    return directoryNavigator(source.directory).onSuccess((dataDir) => {
      return loader.loadFromFileTree(dataDir, { ...loadParams, onEncryptedFile }).onSuccess((result) => {
        // Mark protected collections with isBuiltIn flag
        /* c8 ignore next 4 - protected collection paths tested but coverage intermittently missed */
        const protectedCollections = result.protectedCollections.map((pc) => ({
          ...pc,
          ref: { ...pc.ref, isBuiltIn: isBuiltIn ?? false }
        }));

        // Extract sourceItems from IRuntimeCollection
        const sourceItems = new Map<SourceId, FileTree.FileTreeItem>();
        for (const coll of result.collections) {
          sourceItems.set(coll.id, coll.sourceItem);
        }

        return succeed({
          collections: result.collections as ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>,
          protectedCollections,
          sourceItems
        });
      });
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
   * @param logger - Optional logger for reporting loading progress and issues.
   * @returns Promise resolving to Success with collections or Failure with error.
   */
  private static async _loadBuiltInCollectionsAsync<TBaseId extends string, TItem>(
    spec: LibraryLoadSpec<SourceId>,
    itemIdConverter: Converter<TBaseId> | Validator<TBaseId>,
    itemConverter: Converter<TItem> | Validator<TItem>,
    directoryNavigator: SubLibraryDirectoryNavigator,
    builtInTreeProvider: SubLibraryBuiltInTreeProvider,
    encryption?: IEncryptionConfig,
    logger?: Logging.LogReporter<unknown>
  ): Promise<Result<IFileTreeSourceLoadResult<TBaseId, TItem>>> {
    if (spec === false) {
      return Success.with({ collections: [], protectedCollections: [], sourceItems: new Map() });
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
      encryption,
      logger,
      true // isBuiltIn
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
   * @param logger - Optional logger for reporting loading progress and issues.
   * @param isBuiltIn - Whether this source is built-in library data (for protected collection refs).
   * @returns Promise resolving to Success with collections and protected collections, or Failure with error.
   */
  private static async _loadFromFileTreeSourceAsync<TBaseId extends string, TItem>(
    source: SubLibraryFileTreeSource,
    itemIdConverter: Converter<TBaseId> | Validator<TBaseId>,
    itemConverter: Converter<TItem> | Validator<TItem>,
    directoryNavigator: SubLibraryDirectoryNavigator,
    encryption?: IEncryptionConfig,
    logger?: Logging.LogReporter<unknown>,
    isBuiltIn?: boolean
  ): Promise<Result<IFileTreeSourceLoadResult<TBaseId, TItem>>> {
    /* c8 ignore next 1 - both branches tested but coverage intermittently missed */
    const mutable = source.mutable ?? false;
    const loadParams = specToLoadParams(source.load ?? true, mutable);
    /* c8 ignore next 3 - defensive: only undefined when spec is explicitly false, handled by caller */
    if (loadParams === undefined) {
      return Success.with({ collections: [], protectedCollections: [], sourceItems: new Map() });
    }

    /* c8 ignore next 7 - defensive fallback: loadParams.mutable always set by specToLoadParams */
    const loader = new CollectionLoader({
      itemConverter,
      collectionIdConverter: CommonConverters.sourceId,
      itemIdConverter,
      mutable: loadParams.mutable ?? mutable,
      logger
    });

    const dataDirResult = directoryNavigator(source.directory);
    /* c8 ignore next 3 - defensive: directory navigation only fails with malformed FileTree */
    if (dataDirResult.isFailure()) {
      return fail(dataDirResult.message);
    }

    return loader
      .loadFromFileTreeAsync(dataDirResult.value, {
        ...loadParams,
        encryption,
        isBuiltIn
      })
      .then((result) =>
        result.onSuccess((loadResult) => {
          // Convert IRuntimeCollection to SubLibraryEntryInit
          const collections: SubLibraryEntryInit<TBaseId, TItem>[] = loadResult.collections.map((coll) => ({
            id: coll.id,
            isMutable: coll.isMutable,
            items: coll.items,
            metadata: coll.metadata
          }));

          // Extract sourceItems from IRuntimeCollection
          const sourceItems = new Map<SourceId, FileTree.FileTreeItem>();
          for (const coll of loadResult.collections) {
            sourceItems.set(coll.id, coll.sourceItem);
          }

          return succeed({
            collections,
            protectedCollections: loadResult.protectedCollections,
            sourceItems
          });
        })
      );
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
   * @returns Promise resolving to Success with collections and protected collections, or Failure with error.
   */
  protected static async loadAllCollectionsAsync<
    TLibrary extends SubLibraryBase<string, TBaseId, TItem>,
    TBaseId extends string,
    TItem
  >(
    params: ISubLibraryCreateParams<TLibrary, TBaseId, TItem>
  ): Promise<Result<ISubLibraryAsyncLoadResult<TBaseId, TItem>>> {
    const libraryParams = params.libraryParams as
      | ISubLibraryAsyncParams<TLibrary, SubLibraryEntryInit<TBaseId, TItem>>
      | undefined;
    const builtin = libraryParams?.builtin ?? true;
    const fileSources = normalizeFileSources(libraryParams?.fileSources);
    /* c8 ignore next 1 - both branches tested but coverage intermittently missed */
    const additionalCollections = libraryParams?.collections ?? [];
    const encryption = libraryParams?.encryption;
    const logger = params.logger;

    // Aggregate protected collections from all sources
    const allProtectedCollections: IProtectedCollectionInternal<SourceId>[] = [];

    // Load built-in collections async
    const builtInResult = await SubLibraryBase._loadBuiltInCollectionsAsync(
      builtin,
      params.itemIdConverter,
      params.itemConverter,
      params.directoryNavigator,
      params.builtInTreeProvider,
      encryption,
      logger
    );
    /* c8 ignore next 3 - builtIn failures are tested through builtInData tests */
    if (builtInResult.isFailure()) {
      return fail(builtInResult.message);
    }
    allProtectedCollections.push(...builtInResult.value.protectedCollections);

    // Load file sources async
    interface IFileSourceLoadResult {
      readonly source: string;
      readonly collections: ReadonlyArray<SubLibraryEntryInit<string, unknown>>;
    }
    const fileSourceResults: Result<IFileSourceLoadResult>[] = [];
    for (let i = 0; i < fileSources.length; i++) {
      const result = await SubLibraryBase._loadFromFileTreeSourceAsync(
        fileSources[i],
        params.itemIdConverter,
        params.itemConverter,
        params.directoryNavigator,
        encryption,
        logger
      );
      /* c8 ignore next 3 - file source failures are tested through collectionLoader tests */
      if (result.isFailure()) {
        return fail(result.message);
      }
      allProtectedCollections.push(...result.value.protectedCollections);
      fileSourceResults.push(
        succeed({
          source: `fileSource[${i}]`,
          collections: result.value.collections as ReadonlyArray<SubLibraryEntryInit<string, unknown>>
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
        collections: builtInResult.value.collections as ReadonlyArray<SubLibraryEntryInit<string, unknown>>
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

    // Merge all collections
    const fileCollections = fileSourceData.value.flatMap(
      (d) => d.collections as ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>
    );
    return succeed({
      collections: [
        ...builtInResult.value.collections,
        ...fileCollections,
        ...mergedCollections,
        ...additionalCollections
      ],
      protectedCollections: allProtectedCollections
    });
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
      this._directoryNavigator,
      'capture',
      this._logger,
      false // not built-in
    ).onSuccess((loadResult) => {
      // Check for collisions with existing collections
      const existingIds = new Set(this.collections.keys());
      for (const coll of loadResult.collections) {
        if (existingIds.has(coll.id)) {
          return Failure.with<number>(`Collection ID '${coll.id}' already exists in this library`).report(
            this._logger
          );
        }
      }

      // Add each collection
      for (const coll of loadResult.collections) {
        this.addCollectionEntry(coll);
      }

      // Add protected collections
      /* c8 ignore next 3 - protected collection paths tested but coverage intermittently missed */
      for (const pc of loadResult.protectedCollections) {
        this._protectedCollections.set(pc.ref.collectionId, pc);
      }

      this._logger.info(`Loaded ${loadResult.collections.length} collections from file source`);
      return Success.with(loadResult.collections.length);
    });
  }

  // ============================================================================
  // Protected Collection Methods
  // ============================================================================

  /**
   * Gets the list of protected collections that were captured but not decrypted.
   *
   * These are encrypted collections that were encountered during loading but couldn't
   * be decrypted (e.g., due to missing encryption keys). They can be decrypted later
   * using {@link LibraryData.SubLibraryBase.loadProtectedCollectionAsync | loadProtectedCollectionAsync}.
   *
   * @returns Read-only array of protected collection references with metadata.
   * @public
   */
  public get protectedCollections(): ReadonlyArray<IProtectedCollectionInfo<SourceId>> {
    /* c8 ignore next 4 - protected collection tested but coverage intermittently missed */
    return Array.from(this._protectedCollections.values()).map((internal) => ({
      ...internal.ref,
      keyDerivation: internal.encryptedFile.keyDerivation
    }));
  }

  /**
   * Decrypts and loads one or more protected collections.
   *
   * @param encryption - The encryption configuration with keys and crypto provider.
   * @param filter - Optional filter to select which protected collections to load.
   *   - If omitted or `undefined`: Load all protected collections that can be decrypted with provided keys.
   *   - If an array of patterns: Only load collections whose collectionId or secretName matches any pattern.
   *     Patterns can be strings (exact match) or RegExp objects.
   * @returns Promise resolving to Success with array of loaded collection IDs, or Failure with error.
   * @public
   */
  public async loadProtectedCollectionAsync(
    encryption: IEncryptionConfig,
    filter?: ReadonlyArray<string | RegExp>
  ): Promise<Result<ReadonlyArray<SourceId>>> {
    const loadedIds: SourceId[] = [];
    const errors = new MessageAggregator();

    // Determine which protected collections to attempt to load
    const toLoad: IProtectedCollectionInternal<SourceId>[] = [];
    for (const internal of this._protectedCollections.values()) {
      if (this._matchesFilter(internal, filter)) {
        toLoad.push(internal);
      }
    }

    if (toLoad.length === 0) {
      if (filter !== undefined && filter.length > 0) {
        return fail('No protected collections match the specified filter');
      }
      return succeed([]);
    }

    // Try to load each matching protected collection
    for (const internal of toLoad) {
      const result = await this._decryptAndLoadProtectedCollection(internal, encryption);
      if (result.isSuccess()) {
        loadedIds.push(internal.ref.collectionId);
        this._protectedCollections.delete(internal.ref.collectionId);
      } else {
        errors.addMessage(`${internal.ref.collectionId}: ${result.message}`);
      }
    }

    if (errors.hasMessages) {
      if (loadedIds.length === 0) {
        return fail(`Failed to load any protected collections: ${errors}`);
      }
      this._logger.warn(`Some protected collections failed to load: ${errors}`);
    } else {
      this._logger.info(`Loaded ${loadedIds.length} protected collection(s): ${loadedIds.join(', ')}`);
    }
    return succeed(loadedIds);
  }

  /**
   * Checks if a protected collection matches the filter.
   */
  private _matchesFilter(
    internal: IProtectedCollectionInternal<SourceId>,
    filter: ReadonlyArray<string | RegExp> | undefined
  ): boolean {
    if (filter === undefined || filter.length === 0) {
      return true;
    }

    for (const pattern of filter) {
      if (typeof pattern === 'string') {
        if (internal.ref.collectionId === pattern || internal.ref.secretName === pattern) {
          return true;
        }
      } else {
        if (pattern.test(internal.ref.collectionId) || pattern.test(internal.ref.secretName)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Decrypts a protected collection and adds it to the library.
   */
  private async _decryptAndLoadProtectedCollection(
    internal: IProtectedCollectionInternal<SourceId>,
    encryption: IEncryptionConfig
  ): Promise<Result<true>> {
    // Try to get the key for this secret
    const keyResult = await this._getKeyForSecret(internal.ref.secretName, encryption);
    if (keyResult.isFailure()) {
      return fail(keyResult.message);
    }

    // Decrypt the collection
    const decryptResult = await decryptCollectionFile(
      internal.encryptedFile,
      keyResult.value,
      encryption.cryptoProvider
    );
    if (decryptResult.isFailure()) {
      return fail(`Decryption failed: ${decryptResult.message}`);
    }

    const errors = new MessageAggregator();
    const decryptedItems = decryptResult.value;

    // Log decrypted items
    const itemKeys = Object.keys(decryptedItems);
    this._logger.info(`Decrypted collection ${internal.ref.collectionId}: ${itemKeys.length} items`);

    // Convert items using the loader's item converter
    const convertedItems: Record<string, TItem> = {};
    for (const [itemId, itemData] of Object.entries(decryptedItems)) {
      try {
        const idResult = this._loaderItemIdConverter.convert(itemId);
        /* c8 ignore next 4 - defensive: item id conversion failure only with malformed data */
        if (idResult.isFailure()) {
          errors.addMessage(`${itemId}: invalid item id - ${idResult.message}`);
          continue;
        }

        const itemResult = this._loaderItemConverter.convert(itemData);
        /* c8 ignore next 4 - defensive: item conversion failure only with malformed data */
        if (itemResult.isFailure()) {
          errors.addMessage(`${itemId}: ${itemResult.message}`);
          continue;
        }

        convertedItems[idResult.value] = itemResult.value;
        /* c8 ignore next 4 - defensive: exceptions only with malformed data */
      } catch (e) {
        errors.addMessage(`${itemId}: exception - ${e}`);
      }
    }

    // Log and check conversion results
    const convertedCount = Object.keys(convertedItems).length;
    this._logger.info(
      `Converted ${convertedCount} of ${itemKeys.length} items from collection ${internal.ref.collectionId}`
    );

    // If there were errors, report them
    /* c8 ignore next 7 - defensive: error path only with malformed encrypted data */
    if (errors.hasMessages) {
      const errorMsg = `Failed to convert items in collection ${
        internal.ref.collectionId
      }: ${errors.toString()}`;
      this._logger.error(errorMsg);
      return fail(errorMsg);
    }

    // If no items were converted (but no explicit errors), that's also a problem
    /* c8 ignore next 5 - defensive: empty collection path only with malformed encrypted data */
    if (itemKeys.length > 0 && convertedCount === 0) {
      const errorMsg = `No items were converted from collection ${internal.ref.collectionId}`;
      this._logger.error(errorMsg);
      return fail(errorMsg);
    }

    // Check for collision with existing collection
    if (this.collections.has(internal.ref.collectionId)) {
      return fail(`Collection "${internal.ref.collectionId}" already exists in this library`);
    }

    // Add the collection
    this.addCollectionEntry({
      id: internal.ref.collectionId,
      isMutable: internal.ref.isMutable,
      items: convertedItems
    });

    this._logger.info(
      `Successfully added collection ${internal.ref.collectionId} with ${convertedCount} items`
    );
    return succeed(true);
  }

  // ============================================================================
  // Collection Data Access (for persistence-enabled editing)
  // ============================================================================

  /**
   * Get the FileTree source item for a collection, if available.
   *
   * Returns the FileTree item that was used to load this collection.
   * This can be passed to EditableCollection to enable direct save() functionality.
   * Only available for collections loaded from FileTree sources.
   *
   * @param collectionId - ID of the collection
   * @returns The FileTree source item, or undefined if not available
   * @public
   */
  public getCollectionSourceItem(collectionId: SourceId): FileTree.FileTreeItem | undefined {
    return this._sourceItems.get(collectionId);
  }

  // ============================================================================
  // Collection Manipulation Methods (for use by CollectionManager)
  // ============================================================================

  /**
   * Remove a collection from the library.
   *
   * @remarks
   * This method is public but intended for internal use by {@link Editing.CollectionManager}.
   * Direct use is discouraged - use {@link Editing.CollectionManager.delete} instead.
   *
   * @param collectionId - Collection to remove
   * @returns Result indicating success or failure
   * @throws Never throws - returns Failure instead
   * @internal
   */
  public removeCollection(
    collectionId: SourceId
  ): Result<Collections.AggregatedResultMapEntry<SourceId, TBaseId, TItem, ICollectionSourceMetadata>> {
    return this.collections
      .get(collectionId)
      .asResult.withErrorFormat((msg) => `Collection "${collectionId}" not found: ${msg}`)
      .onSuccess((collection) => {
        if (!collection.isMutable) {
          return Failure.with(`Cannot delete immutable collection "${collectionId}"`);
        }
        // Use the protected method from AggregatedResultMapBase
        return this._deleteCollection(collectionId).asResult;
      });
  }

  /**
   * Update collection metadata.
   *
   * @remarks
   * This method is public but intended for internal use by {@link Editing.CollectionManager}.
   * Direct use is discouraged - use {@link Editing.CollectionManager.updateMetadata} instead.
   *
   * @param collectionId - Collection to update
   * @param metadata - Partial metadata to update
   * @returns Result indicating success or failure
   * @throws Never throws - returns Failure instead
   * @internal
   */
  public updateCollectionMetadata(
    collectionId: SourceId,
    metadata: Partial<ICollectionSourceMetadata>
  ): Result<ICollectionSourceMetadata> {
    // Validation - collections.get returns a DetailedResult, use .asResult to convert
    const collectionResult = this.collections.get(collectionId).asResult;
    if (collectionResult.isFailure()) {
      return fail(`Collection "${collectionId}" not found`);
    }

    const collection = collectionResult.value;
    if (!collection.isMutable) {
      return fail(`Cannot update metadata of immutable collection "${collectionId}"`);
    }

    // Validate metadata
    return this._validateMetadataUpdate(metadata).onSuccess(() => {
      // If secretName is an empty string, treat it as a request to remove the secret
      const omitSecret = metadata.secretName?.trim() === '';

      // Merge new metadata with existing metadata
      const existingMetadata = collection.metadata ?? {};
      const mergedMetadata: ICollectionSourceMetadata = omitSecret
        ? omit(
            {
              ...existingMetadata,
              ...metadata
            },
            ['secretName']
          )
        : {
            ...existingMetadata,
            ...metadata
          };

      // Use parent's setCollectionMetadata to persist the metadata
      return this.setCollectionMetadata(collectionId, mergedMetadata);
    });
  }

  /**
   * Validate metadata update fields.
   * @param metadata - Partial metadata to validate
   * @returns Result indicating validation success or specific error
   */
  private _validateMetadataUpdate(metadata: Partial<ICollectionSourceMetadata>): Result<void> {
    const aggregator = new MessageAggregator();

    // Validate name if provided
    if (metadata.name !== undefined) {
      if (metadata.name.trim() === '') {
        aggregator.addMessage('Collection name cannot be empty');
      } else if (metadata.name.length > 200) {
        aggregator.addMessage('Collection name exceeds 200 characters');
      } else if (metadata.name !== metadata.name.trim()) {
        aggregator.addMessage('Collection name cannot have leading or trailing whitespace');
      }
    }

    // Validate description if provided
    if (metadata.description !== undefined && metadata.description.length > 2000) {
      aggregator.addMessage('Collection description exceeds 2000 characters');
    }

    // Validate secretName if provided
    if (metadata.secretName !== undefined) {
      const trimmed = metadata.secretName.trim();
      // An empty secretName is treated as "remove the secret".
      if (trimmed !== '') {
        if (metadata.secretName.length > 100) {
          aggregator.addMessage('Secret name exceeds 100 characters');
        } else if (metadata.secretName !== trimmed) {
          aggregator.addMessage('Secret name cannot have leading or trailing whitespace');
        }
      }
    }

    if (aggregator.hasMessages) {
      return fail(`Invalid metadata: ${aggregator.toString('; ')}`);
    }

    return succeed(undefined);
  }

  /**
   * Gets the encryption key for a given secret name.
   */
  private async _getKeyForSecret(
    secretName: string,
    encryption: IEncryptionConfig
  ): Promise<Result<Uint8Array>> {
    // Check static secrets first
    if (encryption.secrets) {
      const secret = encryption.secrets.find((s) => s.name === secretName);
      if (secret) {
        return succeed(secret.key);
      }
    }

    // Try the secret provider
    if (encryption.secretProvider) {
      return encryption.secretProvider(secretName);
    }

    return fail(`No key available for secret "${secretName}"`);
  }
}
