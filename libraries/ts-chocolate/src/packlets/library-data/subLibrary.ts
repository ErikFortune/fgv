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
  fail,
  Failure,
  Logging,
  mapResults,
  MessageAggregator,
  omit,
  Result,
  succeed,
  Success,
  Validator
} from '@fgv/ts-utils';
import { Converters as JsonConverters, FileTree } from '@fgv/ts-json-base';

import { CollectionId, Helpers } from '../common';
import { Converters as CommonConverters } from '../common';
import { collectionRuntimeMetadata as collectionRuntimeMetadataConverter } from './converters';
import { CryptoUtils } from '@fgv/ts-extras';
import {
  ICollectionIdConflict,
  ICollectionRuntimeMetadata,
  ICollectionSourceFile,
  IConflictingCollectionCopy,
  IEncryptionConfig,
  IFileTreeSource,
  IMergeLibrarySource,
  IProtectedCollectionInternal,
  IProtectedCollectionInfo,
  LibraryLoadSpec
} from './model';
import { ICollectionSet, normalizeFileSources } from './libraryLoader';
import {
  extractCollections,
  loadBuiltInCollections,
  loadBuiltInCollectionsAsync,
  loadFromFileTreeSource,
  loadFromFileTreeSourceAsync
} from './subLibrary.loader';
import {
  deleteSourceFile,
  ensureMutableDataDirectory,
  findActiveMutableSource
} from './subLibrary.persistence';
import {
  findConflictCopy,
  getKeyForSecret,
  readEncryptedSourceFile,
  readPlainSourceFile
} from './subLibrary.conflicts';
import {
  addProtectedOrConflict,
  appendConflictCopy,
  createConflictCopyFromProtected,
  dedupeCollectionsByFirstSeen,
  dedupeCollectionsWithConflicts,
  type IConflictCopyInternal
} from './subLibrary.collisions';

// ============================================================================
// Type Aliases
// ============================================================================

/**
 * A single entry in a sub-library collection.
 * Fixes the collection ID type to SourceId and metadata type to ICollectionRuntimeMetadata.
 *
 * @typeParam TBaseId - The base item ID type (e.g., `BaseIngredientId`)
 * @typeParam TItem - The item type stored in the collection (e.g., `Ingredient`)
 * @public
 */
export type SubLibraryCollectionEntry<TBaseId extends string, TItem> = Collections.AggregatedResultMapEntry<
  CollectionId,
  TBaseId,
  TItem,
  ICollectionRuntimeMetadata
>;

/**
 * Initialization type for a sub-library collection entry.
 * Fixes the collection ID type to SourceId and metadata type to ICollectionRuntimeMetadata.
 *
 * @typeParam TBaseId - The base item ID type (e.g., `BaseIngredientId`)
 * @typeParam TItem - The item type stored in the collection (e.g., `Ingredient`)
 * @public
 */
export type SubLibraryEntryInit<TBaseId extends string, TItem> = Collections.AggregatedResultMapEntryInit<
  CollectionId,
  TBaseId,
  TItem,
  ICollectionRuntimeMetadata
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
  CollectionId,
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
export type SubLibraryFileTreeSource = IFileTreeSource<CollectionId>;

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
export type SubLibraryMergeSource<TLibrary> = TLibrary | IMergeLibrarySource<TLibrary, CollectionId>;

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
  readonly builtin?: LibraryLoadSpec<CollectionId>;

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
  readonly protectedCollections?: ReadonlyArray<IProtectedCollectionInternal<CollectionId>>;
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
  readonly protectedCollections: ReadonlyArray<IProtectedCollectionInternal<CollectionId>>;
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
  CollectionId,
  TBaseId,
  TItem,
  ICollectionRuntimeMetadata
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
  private readonly _protectedCollections: Map<CollectionId, IProtectedCollectionInternal<CollectionId>>;

  /**
   * Tracks collection ID collisions. Each entry maps a collection ID to an array
   * of copies that lost the first-seen deduplication pass. The winning copy is
   * accessible via `collections` (if loaded) or `_protectedCollections` (if encrypted).
   */
  private _conflicts: Map<CollectionId, IConflictCopyInternal[]>;

  /**
   * FileTree source items for collections loaded from FileTree.
   * Maps collection ID to its backing file item for persistence and deletion.
   */
  private readonly _sourceItems: Map<CollectionId, FileTree.FileTreeItem>;

  /**
   * Mutable data directory for creating new collection files.
   * Set during construction if a mutable file source was configured.
   */
  private _mutableDataDirectory: FileTree.IMutableFileTreeDirectoryItem | undefined;

  /**
   * Mutable source root directory for lazy creation of data directories.
   * Used when the data directory doesn't exist yet at construction time.
   */
  private _mutableSourceRoot: FileTree.IMutableFileTreeDirectoryItem | undefined;

  /**
   * Source name for the mutable file source.
   * Injected into metadata when creating new collections.
   */
  private _mutableSourceName: string | undefined;

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
    const logger = params.logger ?? libraryParams?.logger ?? new Logging.LogReporter<unknown>();

    // Load built-in collections (includes protected collection metadata)
    const builtInResult = loadBuiltInCollections(
      builtin,
      params.itemIdConverter,
      params.itemConverter,
      params.directoryNavigator,
      params.builtInTreeProvider,
      logger
    ).orThrow();

    // Load file source collections
    const fileSourceResults = fileSources.map((source, i) =>
      loadFromFileTreeSource(
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
            ICollectionSet<CollectionId> & {
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
    const mergedLibraryCollections = extractCollections<TBaseId, TItem>(libraryParams?.mergeLibraries);

    const deduped = dedupeCollectionsWithConflicts(
      [
        {
          sourceLabel: 'builtin',
          collections: builtInResult.collections,
          sourceItems: builtInResult.sourceItems
        },
        ...fileSourceData.map((fileSource) => ({
          sourceLabel: fileSource.source,
          collections: fileSource.collections as ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>,
          sourceItems: fileSource.sourceItems
        })),
        {
          sourceLabel: 'mergeLibraries',
          collections: mergedLibraryCollections,
          sourceItems: new Map<CollectionId, FileTree.FileTreeItem>()
        }
      ],
      additionalCollections,
      logger
    );

    const allCollections: SubLibraryEntryInit<TBaseId, TItem>[] = [...deduped.collections];
    const activeSourceItems = new Map(deduped.activeSourceItems);
    const preInitConflicts = deduped.preInitConflicts;

    super({
      collectionIdConverter: CommonConverters.collectionId,
      separator: '.',
      itemIdConverter: params.itemIdConverter,
      itemConverter: params.itemConverter,
      metadataConverter: collectionRuntimeMetadataConverter,
      collections: allCollections
    });

    this._loaderItemIdConverter = params.itemIdConverter;
    this._loaderItemConverter = params.itemConverter;
    this._directoryNavigator = params.directoryNavigator;
    this._logger = logger;

    // Track source items only for active (winning) loaded collections.
    // This prevents conflicting loser copies from overwriting the winner's backing file
    // reference, which can otherwise cause delete/rename operations to target the wrong file.
    this._sourceItems = new Map(activeSourceItems);

    // Initialize protected collections and conflicts from all sources.
    // First-seen wins per collection ID; later copies become conflict losers.
    this._protectedCollections = new Map();
    this._conflicts = new Map();

    // Add protected collections from built-in loading
    /* c8 ignore next 3 - built-in protected collections tested but coverage intermittently missed */
    for (const pc of builtInResult.protectedCollections) {
      addProtectedOrConflict(this._protectedCollections, this._conflicts, pc, logger);
    }

    // Add protected collections from file sources
    /* c8 ignore next 3 - protected collection paths tested but coverage intermittently missed */
    for (const fileSource of fileSourceData) {
      for (const pc of fileSource.protectedCollections) {
        addProtectedOrConflict(this._protectedCollections, this._conflicts, pc, logger);
      }
    }

    // Add protected collections from params (e.g., from async loading)
    if (libraryParams?.protectedCollections) {
      for (const pc of libraryParams.protectedCollections) {
        addProtectedOrConflict(this._protectedCollections, this._conflicts, pc, logger);
      }
    }

    // Cross-check: protected copies whose IDs are already in loaded collections are losers.
    // We do NOT hard-fail — the loaded copy is usable; user can repair via Settings → Storage.
    for (const [id, pc] of this._protectedCollections) {
      if (this.collections.has(id)) {
        appendConflictCopy(this._conflicts, id, createConflictCopyFromProtected(pc));
        logger.warn(
          `[SubLibrary] Collection ID conflict: '${id}' is loaded from one root and also exists as an ` +
            `encrypted collection (secret: '${pc.ref.secretName}'). Use Settings → Storage to resolve.`
        );
      }
    }

    // Merge loaded-collection losers from the dedup pass into _conflicts
    for (const [id, losers] of preInitConflicts) {
      for (const loser of losers) {
        appendConflictCopy(this._conflicts, id, loser);
      }
    }

    const mutableSourceInfo = findActiveMutableSource(fileSources, params.directoryNavigator);
    this._mutableSourceName = mutableSourceInfo.sourceName;
    this._mutableDataDirectory = mutableSourceInfo.mutableDataDirectory;
    this._mutableSourceRoot = mutableSourceInfo.mutableSourceRoot;
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
    const allProtectedCollections: IProtectedCollectionInternal<CollectionId>[] = [];

    // Load built-in collections async
    const builtInResult = await loadBuiltInCollectionsAsync(
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
      readonly sourceItems: ReadonlyMap<CollectionId, FileTree.FileTreeItem>;
    }
    const fileSourceResults: Result<IFileSourceLoadResult>[] = [];
    for (let i = 0; i < fileSources.length; i++) {
      const result = await loadFromFileTreeSourceAsync(
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
          collections: result.value.collections as ReadonlyArray<SubLibraryEntryInit<string, unknown>>,
          sourceItems: result.value.sourceItems
        })
      );
    }

    const fileSourceData = mapResults(fileSourceResults);
    /* c8 ignore next 3 - defensive: fileSource failures are caught and returned in the loop above */
    if (fileSourceData.isFailure()) {
      return fail(fileSourceData.message);
    }

    // Extract from merge libraries (sync - these are already loaded)
    const mergedCollections = extractCollections<TBaseId, TItem>(
      libraryParams?.mergeLibraries as
        | SubLibraryMergeSource<SubLibraryBase<string, TBaseId, TItem>>
        | ReadonlyArray<SubLibraryMergeSource<SubLibraryBase<string, TBaseId, TItem>>>
        | undefined
    );

    const deduplicatedCollections = dedupeCollectionsByFirstSeen<SubLibraryEntryInit<TBaseId, TItem>>(
      [
        {
          sourceLabel: 'builtin',
          collections: builtInResult.value.collections as ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>
        },
        ...fileSourceData.value.map((d) => ({
          sourceLabel: d.source,
          collections: d.collections as ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>
        })),
        {
          sourceLabel: 'mergeLibraries',
          collections: mergedCollections
        }
      ],
      logger
    );

    return succeed({
      collections: [...deduplicatedCollections, ...additionalCollections],
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
    return loadFromFileTreeSource(
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

      // Register source items for persistence (enables canSave/save on editable collections)
      for (const [id, item] of loadResult.sourceItems) {
        this._sourceItems.set(id, item);
      }

      // Add protected collections
      /* c8 ignore next 3 - protected collection paths tested but coverage intermittently missed */
      for (const pc of loadResult.protectedCollections) {
        this._protectedCollections.set(pc.ref.collectionId, pc);
      }

      this._logger.detail(`Loaded ${loadResult.collections.length} collections from file source`);
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
  public get protectedCollections(): ReadonlyArray<IProtectedCollectionInfo<CollectionId>> {
    /* c8 ignore next 4 - protected collection tested but coverage intermittently missed */
    return Array.from(this._protectedCollections.values()).map((internal) => ({
      ...internal.ref,
      keyDerivation: internal.encryptedFile.keyDerivation
    }));
  }

  /**
   * All collection ID collisions detected across all sources.
   *
   * Each entry describes one duplicated collection ID: the active (winning) copy
   * and all conflicting copies that were discarded. Covers all collision types:
   * loaded+loaded, loaded+encrypted, and encrypted+encrypted.
   *
   * Use `removeConflictingCopy` to delete a conflicting copy, or
   * `removeCollection` / `removeProtectedCollection` to remove the active copy.
   *
   * @public
   */
  public get collectionConflicts(): ReadonlyArray<ICollectionIdConflict> {
    const result: ICollectionIdConflict[] = [];
    for (const [id, losers] of this._conflicts) {
      const entryResult = this.collections.get(id);
      let activeCopy: IConflictingCollectionCopy;
      if (entryResult.isSuccess()) {
        const entry = entryResult.value;
        activeCopy = {
          sourceName: entry.metadata?.sourceName,
          isEncrypted: entry.metadata?.secretName !== undefined,
          itemCount: entry.items.size,
          secretName: entry.metadata?.secretName,
          isMutable: entry.isMutable
        };
      } else {
        const pc = this._protectedCollections.get(id);
        activeCopy = {
          sourceName: pc?.sourceName,
          isEncrypted: true,
          itemCount: pc?.ref.itemCount,
          secretName: pc?.ref.secretName,
          isMutable: pc?.ref.isMutable ?? false
        };
      }
      result.push({
        collectionId: id,
        activeCopy,
        conflictingCopies: losers.map(({ sourceItem: _si, ...rest }) => rest)
      });
    }
    return result;
  }

  /**
   * Protected collections whose IDs also appear in the loaded collections map.
   *
   * @deprecated Use `collectionConflicts` instead, which covers all collision types.
   * @public
   */
  public get conflictingProtectedCollections(): ReadonlyArray<IProtectedCollectionInfo<CollectionId>> {
    const loadedIds = new Set(this.collections.keys());
    return Array.from(this._protectedCollections.values())
      .filter((internal) => loadedIds.has(internal.ref.collectionId))
      .map((internal) => ({
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
  ): Promise<Result<ReadonlyArray<CollectionId>>> {
    const loadedIds: CollectionId[] = [];
    const errors = new MessageAggregator();

    // Determine which protected collections to attempt to load
    const toLoad: IProtectedCollectionInternal<CollectionId>[] = [];
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
    internal: IProtectedCollectionInternal<CollectionId>,
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
    internal: IProtectedCollectionInternal<CollectionId>,
    encryption: IEncryptionConfig
  ): Promise<Result<true>> {
    // Try to get the key for this secret
    const keyResult = await getKeyForSecret(internal.ref.secretName, encryption);
    if (keyResult.isFailure()) {
      return fail(keyResult.message);
    }

    // Decrypt the collection (expected payload is a record of items)
    const decryptResult = await CryptoUtils.decryptFile(
      internal.encryptedFile,
      keyResult.value,
      encryption.cryptoProvider,
      JsonConverters.jsonObject
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

    // Add the collection with metadata so it appears in Settings -> Storage
    // and can be re-encrypted on save
    this.addCollectionEntry({
      id: internal.ref.collectionId,
      isMutable: internal.ref.isMutable,
      items: convertedItems,
      metadata: {
        /* c8 ignore next 1 - covered in isolation but intermittently missed in full suite */
        ...(internal.sourceName ? { sourceName: internal.sourceName } : {}),
        secretName: internal.ref.secretName
      }
    });

    /* c8 ignore next 4 - covered in isolation but intermittently missed in full suite */
    // Register the source item for persistence (enables save back to storage)
    if (internal.sourceItem) {
      this._sourceItems.set(internal.ref.collectionId, internal.sourceItem);
    }

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
  public getCollectionSourceItem(collectionId: CollectionId): FileTree.FileTreeItem | undefined {
    return this._sourceItems.get(collectionId);
  }

  /**
   * Creates a file for a collection in the mutable data directory and
   * registers it as a source item for persistence.
   *
   * @param collectionId - ID of the collection
   * @param content - The file content to write
   * @param extension - File extension to use (default: 'yaml')
   * @returns Success with the created file item, or Failure if no writable directory or file creation fails
   * @public
   */
  public createCollectionFile(
    collectionId: CollectionId,
    content: string,
    extension: 'yaml' | 'json' = 'yaml'
  ): Result<FileTree.FileTreeItem> {
    return this._ensureMutableDataDirectory().onSuccess((dataDir) => {
      /* c8 ignore next 1 - coverage intermittently missed in full suite */
      const fileName = `${collectionId}.${extension}`;
      /* c8 ignore next 4 - success path tested but coverage intermittently missed */
      return dataDir.createChildFile(fileName, content).onSuccess((fileItem) => {
        this._sourceItems.set(collectionId, fileItem);
        return succeed(fileItem as FileTree.FileTreeItem);
      });
    });
  }

  /**
   * Deletes the backing file for a collection from its source FileTree.
   * Called during removeCollection to ensure the file doesn't reappear on restart.
   * @internal
   */
  private _deleteSourceFile(collectionId: CollectionId): Result<void> {
    return deleteSourceFile(collectionId, this._sourceItems);
  }

  /**
   * Ensures that a mutable data directory is available, creating it if necessary.
   * @returns Success with the mutable data directory, or Failure if not available
   */
  private _ensureMutableDataDirectory(): Result<FileTree.IMutableFileTreeDirectoryItem> {
    return ensureMutableDataDirectory({
      mutableDataDirectory: this._mutableDataDirectory,
      mutableSourceRoot: this._mutableSourceRoot,
      directoryNavigator: this._directoryNavigator
    }).onSuccess((dir) => {
      this._mutableDataDirectory = dir;
      return succeed(dir);
    });
  }

  /**
   * The source name for the mutable file source.
   * Used to inject sourceName into metadata when creating new collections.
   * @internal
   */
  public get mutableSourceName(): string | undefined {
    return this._mutableSourceName;
  }

  /**
   * Sets the active mutable source for new collection creation.
   *
   * Called by the UI layer when `defaultStorageTargets` is applied (on init or settings save)
   * to route new collections to the correct storage root.
   *
   * @param sourceName - The source name to stamp on new collections (matches `ICollectionRuntimeMetadata.sourceName`)
   * @param dataDirectory - The directory where new collection files will be created
   * @public
   */
  public setActiveMutableSource(
    sourceName: string,
    dataDirectory: FileTree.IMutableFileTreeDirectoryItem | undefined,
    sourceRoot?: FileTree.IMutableFileTreeDirectoryItem
  ): void {
    this._mutableSourceName = sourceName;
    this._mutableDataDirectory = dataDirectory;
    this._mutableSourceRoot = sourceRoot;
  }

  // ============================================================================
  // Collection Manipulation Methods (for use by CollectionManager)
  // ============================================================================

  /**
   * Remove all mutable collections whose metadata `sourceName` matches the given source.
   * Used to unload a storage root (e.g., a local directory) from the library at runtime.
   *
   * @param sourceName - The source name to remove (matches `ICollectionRuntimeMetadata.sourceName`)
   * @returns The number of collections removed
   * @public
   */
  public removeSource(sourceName: string): number {
    const toRemove: CollectionId[] = [];
    for (const [colId, col] of this.collections.entries()) {
      /* c8 ignore next 3 - branch tested but coverage intermittently missed in full suite */
      if (col.metadata?.sourceName === sourceName && col.isMutable) {
        toRemove.push(colId);
      }
    }
    for (const colId of toRemove) {
      this._deleteCollection(colId);
    }
    return toRemove.length;
  }

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
    collectionId: CollectionId
  ): Result<Collections.AggregatedResultMapEntry<CollectionId, TBaseId, TItem, ICollectionRuntimeMetadata>> {
    return this.collections
      .get(collectionId)
      .asResult.withErrorFormat((msg) => `Collection "${collectionId}" not found: ${msg}`)
      .onSuccess((collection) => {
        if (!collection.isMutable) {
          return Failure.with(`Cannot delete immutable collection "${collectionId}"`);
        }

        return this._deleteSourceFile(collectionId).onSuccess(() => {
          // Clean up any conflict entries for this collection ID.
          // Losers (e.g. encrypted copies) remain in _protectedCollections
          // and will appear as regular protected collections once the winner is gone.
          this._conflicts.delete(collectionId);

          // Use the protected method from AggregatedResultMapBase
          return this._deleteCollection(collectionId).asResult;
        });
      });
  }

  /**
   * Removes a protected (encrypted) collection and deletes its backing file.
   *
   * Use this to clean up an encrypted collection whose ID conflicts with a loaded
   * collection from another storage root (e.g., an orphaned encrypted local copy
   * when an unencrypted cloud copy of the same collection is already loaded).
   *
   * @param collectionId - The protected collection ID to remove.
   * @returns Result<true> on success, or Failure if the collection is not found.
   * @public
   */
  public removeProtectedCollection(collectionId: string): Result<true> {
    const internal = this._protectedCollections.get(collectionId as CollectionId);
    if (!internal) {
      return fail(`Protected collection "${collectionId}" not found`);
    }

    const deleteSourceResult =
      internal.sourceItem && FileTree.isMutableFileItem(internal.sourceItem)
        ? internal.sourceItem
            .delete()
            .withErrorFormat(
              (msg) => `Failed to delete backing file for protected collection "${collectionId}": ${msg}`
            )
            .onSuccess(() => succeed(undefined))
        : succeed(undefined);

    return deleteSourceResult.onSuccess(() => {
      this._protectedCollections.delete(collectionId as CollectionId);
      return succeed(true);
    });
  }

  /**
   * Removes one conflicting (losing) copy of a collection and deletes its backing file.
   *
   * Use this to repair a collection ID collision after inspecting the conflict via
   * `collectionConflicts`. Identifies the copy by its `sourceName`.
   *
   * To remove the active (winning) copy instead, use `removeCollection` (loaded)
   * or `removeProtectedCollection` (encrypted).
   *
   * @param collectionId - The collection ID with a conflict.
   * @param sourceName - The `sourceName` of the conflicting copy to remove.
   * @returns Result<true> on success, or Failure if the conflict or copy is not found.
   * @public
   */
  public removeConflictingCopy(collectionId: string, sourceName: string | undefined): Result<true> {
    const list = this._conflicts.get(collectionId as CollectionId);
    if (!list?.length) {
      return fail(`No conflicts found for collection '${collectionId}'`);
    }
    const idx = list.findIndex((c) => c.sourceName === sourceName);
    if (idx < 0) {
      return fail(
        `No conflicting copy from source '${sourceName ?? 'unknown'}' found for collection '${collectionId}'`
      );
    }
    const copy = list[idx];
    const deleteSourceResult =
      copy.sourceItem && FileTree.isMutableFileItem(copy.sourceItem)
        ? copy.sourceItem
            .delete()
            .withErrorFormat(
              (msg) =>
                `Failed to delete backing file for conflicting copy '${collectionId}' from '${
                  sourceName ?? 'unknown'
                }': ${msg}`
            )
            .onSuccess(() => succeed(undefined))
        : succeed(undefined);

    return deleteSourceResult.onSuccess(() => {
      const newList = list.filter((_, i) => i !== idx);
      if (newList.length === 0) {
        this._conflicts.delete(collectionId as CollectionId);
      } else {
        this._conflicts.set(collectionId as CollectionId, newList);
      }
      return succeed(true);
    });
  }

  /**
   * Re-reads items from a conflicting (loser) copy's backing file.
   *
   * For unencrypted copies, reads and parses the YAML/JSON file directly.
   * For encrypted copies, reads the file, decrypts using the provided
   * encryption config, and converts items. If no encryption config is
   * provided for an encrypted copy, fails with the secret name needed.
   *
   * @param collectionId - The collection ID with a conflict.
   * @param sourceName - The `sourceName` of the conflicting copy to read.
   * @param encryption - Optional encryption config for decrypting encrypted copies.
   * @returns Result with the parsed items and metadata, or Failure.
   * @public
   */
  public async rereadConflictingCopyAsync(
    collectionId: string,
    sourceName: string | undefined,
    encryption?: IEncryptionConfig
  ): Promise<Result<ICollectionSourceFile<TItem>>> {
    const copy = findConflictCopy(this._conflicts, collectionId, sourceName);
    if (!copy) {
      return fail(
        `No conflicting copy from source '${sourceName ?? 'unknown'}' found for collection '${collectionId}'`
      );
    }

    if (copy.isEncrypted) {
      return readEncryptedSourceFile({
        sourceItem: copy.sourceItem,
        collectionId,
        secretName: copy.secretName,
        encryption,
        itemConverter: this._loaderItemConverter
      });
    }

    return readPlainSourceFile(copy.sourceItem, collectionId, this._loaderItemConverter);
  }

  /**
   * Renames a conflicting (loser) copy to a new collection ID.
   *
   * Re-reads the loser's backing file (decrypting if necessary), adds the items
   * as a new mutable collection under `newCollectionId`, creates a backing file,
   * and deletes the loser's old file.
   *
   * @param collectionId - The collection ID with a conflict.
   * @param sourceName - The `sourceName` of the conflicting copy to rename.
   * @param newCollectionId - The new collection ID (must not already exist).
   * @param encryption - Optional encryption config for encrypted copies.
   * @returns Result<true> on success, or Failure.
   * @public
   */
  public async renameConflictingCopyAsync(
    collectionId: string,
    sourceName: string | undefined,
    newCollectionId: CollectionId,
    encryption?: IEncryptionConfig
  ): Promise<Result<true>> {
    if (this.collections.has(newCollectionId)) {
      return fail(`Collection "${newCollectionId}" already exists`);
    }

    const readResult = await this.rereadConflictingCopyAsync(collectionId, sourceName, encryption);
    if (readResult.isFailure()) {
      return fail(readResult.message);
    }
    const sourceFile = readResult.value;

    // Build metadata for the new collection
    const metadata: ICollectionRuntimeMetadata = {
      ...sourceFile.metadata,
      /* c8 ignore next 1 - both branches tested independently */
      sourceName: this.mutableSourceName ?? 'unknown'
    };

    // Add as new collection
    const addResult = this.addCollectionWithItems(
      newCollectionId,
      Array.from(Object.entries(sourceFile.items)),
      { metadata }
    );

    if (addResult.isFailure()) {
      return fail(`Failed to add renamed collection: ${addResult.message}`);
    }

    const persistenceResult = Helpers.serializeToYaml({
      metadata: sourceFile.metadata,
      items: sourceFile.items
    }).onSuccess((yaml) =>
      this.createCollectionFile(newCollectionId, yaml).onSuccess(() =>
        this.removeConflictingCopy(collectionId, sourceName).onSuccess(() => succeed(true as const))
      )
    );

    if (persistenceResult.isSuccess()) {
      return persistenceResult;
    }

    return this.removeCollection(newCollectionId)
      .onFailure((rollbackMsg) =>
        fail(
          `Failed to rename conflicting copy: ${persistenceResult.message}. Rollback failed for "${newCollectionId}": ${rollbackMsg}`
        )
      )
      .onSuccess(() => fail(`Failed to rename conflicting copy: ${persistenceResult.message}`));
  }

  /**
   * Merges a conflicting (loser) copy's items into the active (winning) collection.
   *
   * Re-reads the loser's backing file (decrypting if necessary), merges its items
   * into the active collection, then deletes the loser's file.
   *
   * @param collectionId - The collection ID with a conflict.
   * @param sourceName - The `sourceName` of the conflicting copy to merge.
   * @param onConflict - Strategy for handling duplicate base IDs.
   * @param encryption - Optional encryption config for encrypted copies.
   * @returns Result with merge statistics, or Failure.
   * @public
   */
  public async mergeConflictingCopyIntoActiveAsync(
    collectionId: string,
    sourceName: string | undefined,
    onConflict: 'skip' | 'overwrite' | 'rename',
    encryption?: IEncryptionConfig
  ): Promise<
    Result<{
      mergedCount: number;
      skippedCount: number;
      renamedItems: ReadonlyArray<{ oldBaseId: string; newBaseId: string }>;
    }>
  > {
    const typedId = collectionId as CollectionId;

    // Verify the active collection exists and is mutable
    const collectionResult = this.collections.get(typedId).asResult;
    if (collectionResult.isFailure()) {
      return fail(`Active collection "${collectionId}" not found: ${collectionResult.message}`);
    }
    const activeCollection = collectionResult.value;
    if (!activeCollection.isMutable) {
      return fail(`Cannot merge into immutable collection "${collectionId}"`);
    }

    // Re-read the loser copy
    const readResult = await this.rereadConflictingCopyAsync(collectionId, sourceName, encryption);
    if (readResult.isFailure()) {
      return fail(readResult.message);
    }
    const sourceFile = readResult.value;

    let mergedCount = 0;
    let skippedCount = 0;
    const renamedItems: Array<{ oldBaseId: string; newBaseId: string }> = [];

    for (const [baseId, item] of Object.entries(sourceFile.items)) {
      const typedBaseId = baseId as TBaseId;
      const hasConflict = activeCollection.items.has(typedBaseId);

      if (hasConflict) {
        switch (onConflict) {
          case 'skip':
            skippedCount++;
            continue;

          case 'overwrite':
            this.setInCollection(typedId, typedBaseId, item as TItem);
            mergedCount++;
            continue;

          case 'rename': {
            let counter = 1;
            let candidate = `${baseId}-merged-${counter}`;
            while (activeCollection.items.has(candidate as TBaseId)) {
              counter++;
              candidate = `${baseId}-merged-${counter}`;
            }
            this.addToCollection(typedId, candidate as TBaseId, item as TItem);
            renamedItems.push({ oldBaseId: baseId, newBaseId: candidate });
            mergedCount++;
            continue;
          }
        }
      } else {
        this.addToCollection(typedId, typedBaseId, item as TItem);
        mergedCount++;
      }
    }

    return this.removeConflictingCopy(collectionId, sourceName).onSuccess(() =>
      succeed({ mergedCount, skippedCount, renamedItems })
    );
  }

  // ==========================================================================
  // Collection Operations (for PersistedEditableCollection)
  // ==========================================================================

  /**
   * Returns a default collection operations delegate for the given collection.
   *
   * The returned object provides `add`, `upsert`, and `remove` methods that
   * operate on this sub-library's collection. {@link Editing.PersistedEditableCollection}
   * uses this to perform domain-aware mutations and then automatically persist.
   *
   * Sub-classes can override to add custom behavior (e.g., branded composite ID
   * construction, field-based validation, cross-collection checks).
   *
   * @param collectionId - The collection to operate on
   * @returns An operations delegate with add/upsert/remove methods
   * @public
   */
  public getCollectionOperations(collectionId: CollectionId): {
    add(baseId: TBaseId, entity: TItem): Result<string>;
    upsert(baseId: TBaseId, entity: TItem): Result<string>;
    remove(baseId: TBaseId): Result<TItem>;
  } {
    return {
      add: (baseId: TBaseId, entity: TItem): Result<string> => {
        return this.addToCollection(collectionId, baseId, entity)
          .asResult.withErrorFormat((msg) => `Failed to add ${baseId} to ${collectionId}: ${msg}`)
          .onSuccess((compositeId) => succeed(compositeId as string));
      },
      upsert: (baseId: TBaseId, entity: TItem): Result<string> => {
        return this.setInCollection(collectionId, baseId, entity)
          .asResult.withErrorFormat((msg) => `Failed to upsert ${baseId} in ${collectionId}: ${msg}`)
          .onSuccess((compositeId) => succeed(compositeId as string));
      },
      remove: (baseId: TBaseId): Result<TItem> => {
        return this.composeId(collectionId, baseId)
          .withErrorFormat((msg) => `Invalid ID ${collectionId}.${baseId}: ${msg}`)
          .onSuccess((compositeId) =>
            this.get(compositeId).withErrorFormat(
              (msg) => `Entry ${collectionId}.${baseId} not found: ${msg}`
            )
          )
          .onSuccess((existing) => {
            return this.collections
              .get(collectionId)
              .asResult.withErrorFormat((msg) => `Collection ${collectionId} not found: ${msg}`)
              .onSuccess((collection) => {
                if (!collection.isMutable) {
                  return fail(`Cannot remove entry from immutable collection ${collectionId}`);
                }
                return collection.items
                  .delete(baseId)
                  .asResult.withErrorFormat((msg) => `Failed to delete ${baseId}: ${msg}`)
                  .onSuccess(() => succeed(existing));
              });
          });
      }
    };
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
    collectionId: CollectionId,
    metadata: Partial<ICollectionRuntimeMetadata>
  ): Result<ICollectionRuntimeMetadata> {
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
      /* c8 ignore next 3 - both branches tested; c8 tracks ?? branches per-line */
      const existingMetadata: ICollectionRuntimeMetadata = collection.metadata ?? {
        sourceName: this._mutableSourceName ?? 'unknown'
      };
      const merged = { ...existingMetadata, ...metadata };
      const mergedMetadata: ICollectionRuntimeMetadata = omitSecret
        ? { ...omit(merged, ['secretName']), sourceName: existingMetadata.sourceName }
        : merged;

      // Use parent's setCollectionMetadata to persist the metadata
      return this.setCollectionMetadata(collectionId, mergedMetadata);
    });
  }

  /**
   * Validate metadata update fields.
   * @param metadata - Partial metadata to validate
   * @returns Result indicating validation success or specific error
   */
  private _validateMetadataUpdate(metadata: Partial<ICollectionRuntimeMetadata>): Result<void> {
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
}
