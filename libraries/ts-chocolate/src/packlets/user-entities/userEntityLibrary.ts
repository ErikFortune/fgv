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
 * UserEntityLibrary - aggregates user-specific data entity libraries (journals, future inventory).
 * @packageDocumentation
 */

import * as fs from 'fs';
import * as path from 'path';

import { captureResult, Converter, fail, Logging, Result, succeed } from '@fgv/ts-utils';
import { CryptoUtils } from '@fgv/ts-extras';

import {
  BaseJournalId,
  BaseLocationId,
  BaseSessionId,
  CollectionId,
  Converters as CommonConverters
} from '../common';
import {
  AnyJournalEntryEntity,
  AnySessionEntity,
  IIngredientInventoryEntryEntity,
  IngredientInventoryEntryBaseId,
  IngredientInventoryLibrary,
  ILocationEntity,
  IMoldInventoryEntryEntity,
  MoldInventoryEntryBaseId,
  Inventory as InventoryEntities,
  Journal as JournalEntities,
  JournalLibrary,
  Locations as LocationEntities,
  LocationsLibrary,
  MoldInventoryLibrary,
  Session as SessionEntities,
  SessionLibrary
} from '../entities';
import { ISyncProvider, PersistedEditableCollection } from '../editing';
import {
  IFileTreeSource,
  ILibraryFileTreeSource,
  type LibraryLoadSpec,
  LibraryPaths,
  normalizeFileSources,
  resolveSubLibraryLoadSpec,
  SubLibraryBase,
  SubLibraryId
} from '../library-data';
import { IUserEntityLibrary, IUserEntityLibraryCreateParams, IUserEntityPersistenceConfig } from './model';

/**
 * Aggregates user-specific data entity libraries.
 *
 * Unlike ChocolateEntityLibrary (shared data), UserEntityLibrary contains only
 * user/installation-specific data with no built-in collections.
 *
 * @public
 */
export class UserEntityLibrary implements IUserEntityLibrary {
  private readonly _journals: JournalLibrary;
  private readonly _sessions: SessionLibrary;
  private readonly _moldInventory: MoldInventoryLibrary;
  private readonly _ingredientInventory: IngredientInventoryLibrary;
  private readonly _locations: LocationsLibrary;

  // Persistence configuration (set via configurePersistence)
  private _syncProvider: ISyncProvider | undefined;
  private _encryptionProvider:
    | CryptoUtils.IEncryptionProvider
    | (() => CryptoUtils.IEncryptionProvider | undefined)
    | undefined;
  private _onMutation: ((subLibraryId: SubLibraryId, compositeId: string) => void) | undefined;

  // Singleton caches for persisted collections (one map per sub-library)
  private readonly _persistedSessions: Map<
    CollectionId,
    PersistedEditableCollection<AnySessionEntity, BaseSessionId>
  > = new Map();
  private readonly _persistedJournals: Map<
    CollectionId,
    PersistedEditableCollection<AnyJournalEntryEntity, BaseJournalId>
  > = new Map();
  private readonly _persistedMoldInventory: Map<
    CollectionId,
    PersistedEditableCollection<IMoldInventoryEntryEntity, MoldInventoryEntryBaseId>
  > = new Map();
  private readonly _persistedIngredientInventory: Map<
    CollectionId,
    PersistedEditableCollection<IIngredientInventoryEntryEntity, IngredientInventoryEntryBaseId>
  > = new Map();
  private readonly _persistedLocations: Map<
    CollectionId,
    PersistedEditableCollection<ILocationEntity, BaseLocationId>
  > = new Map();

  /**
   * Logger used by this library and its sub-libraries.
   */
  public readonly logger: Logging.LogReporter<unknown>;

  private constructor(
    journals: JournalLibrary,
    sessions: SessionLibrary,
    moldInventory: MoldInventoryLibrary,
    ingredientInventory: IngredientInventoryLibrary,
    locations: LocationsLibrary,
    logger: Logging.LogReporter<unknown>
  ) {
    this._journals = journals;
    this._sessions = sessions;
    this._moldInventory = moldInventory;
    this._ingredientInventory = ingredientInventory;
    this._locations = locations;
    this.logger = logger;
  }

  /**
   * Creates a new {@link UserEntities.UserEntityLibrary | UserEntityLibrary} instance.
   * @param params - Optional {@link UserEntities.IUserEntityLibraryCreateParams | creation parameters}
   * @returns `Success` with new instance, or `Failure` with error message
   * @public
   */
  public static create(params?: IUserEntityLibraryCreateParams): Result<UserEntityLibrary> {
    params = params ?? {};
    const fileSources = normalizeFileSources(params.fileSources);
    /* c8 ignore next - default logger branch tested implicitly */
    const logger = params.logger ?? new Logging.NoOpLogger();
    const logReporter = new Logging.LogReporter({ logger });

    // Create journals library (no built-in data for user libraries)
    // User data typically starts empty, so we handle missing/empty sources gracefully
    const journalSources = UserEntityLibrary._toFileSources(fileSources, 'journals');
    const journalsResult = JournalLibrary.create({
      builtin: false,
      fileSources: journalSources.length > 0 ? journalSources : undefined,
      mergeLibraries: params.libraries?.journals,
      logger: logReporter
    });

    // Create sessions library
    const sessionSources = UserEntityLibrary._toFileSources(fileSources, 'sessions');
    const sessionsResult = SessionLibrary.create({
      builtin: false,
      fileSources: sessionSources.length > 0 ? sessionSources : undefined,
      mergeLibraries: params.libraries?.sessions,
      logger: logReporter
    });

    // Create mold inventory library
    const moldInventorySources = UserEntityLibrary._toFileSources(fileSources, 'moldInventory');
    const moldInventoryResult = MoldInventoryLibrary.create({
      builtin: false,
      fileSources: moldInventorySources.length > 0 ? moldInventorySources : undefined,
      mergeLibraries: params.libraries?.moldInventory,
      logger: logReporter
    });

    // Create ingredient inventory library
    const ingredientInventorySources = UserEntityLibrary._toFileSources(fileSources, 'ingredientInventory');
    const ingredientInventoryResult = IngredientInventoryLibrary.create({
      builtin: false,
      fileSources: ingredientInventorySources.length > 0 ? ingredientInventorySources : undefined,
      mergeLibraries: params.libraries?.ingredientInventory,
      logger: logReporter
    });

    // Create locations library
    const locationsSources = UserEntityLibrary._toFileSources(fileSources, 'locations');
    const locationsResult = LocationsLibrary.create({
      builtin: false,
      fileSources: locationsSources.length > 0 ? locationsSources : undefined,
      mergeLibraries: params.libraries?.locations,
      logger: logReporter
    });

    return journalsResult.onSuccess((journals) => {
      return sessionsResult.onSuccess((sessions) => {
        return moldInventoryResult.onSuccess((moldInventory) => {
          return ingredientInventoryResult.onSuccess((ingredientInventory) => {
            return locationsResult.onSuccess((locations) => {
              return succeed(
                new UserEntityLibrary(
                  journals,
                  sessions,
                  moldInventory,
                  ingredientInventory,
                  locations,
                  logReporter
                )
              );
            });
          });
        });
      });
    });
  }

  /**
   * Converts generic file sources to sub-library specific sources.
   * Resolves the per-sub-library load spec from the source's FullLibraryLoadSpec.
   * @param sources - Generic file tree sources
   * @param subLibraryId - The sub-library to extract load spec for
   * @returns Array of sub-library specific sources
   * @internal
   */
  private static _toFileSources(
    sources: ReadonlyArray<ILibraryFileTreeSource>,
    subLibraryId: SubLibraryId
  ): ReadonlyArray<IFileTreeSource<CollectionId>> {
    return sources.map((source) => ({
      directory: source.directory,
      load:
        source.load !== undefined
          ? (resolveSubLibraryLoadSpec(source.load, subLibraryId) as LibraryLoadSpec<CollectionId>)
          : false,
      mutable: source.mutable,
      skipMissingDirectories: source.skipMissingDirectories
    }));
  }

  /**
   * {@inheritDoc UserEntities.IUserEntityLibrary.journals}
   */
  public get journals(): JournalLibrary {
    return this._journals;
  }

  /**
   * {@inheritDoc UserEntities.IUserEntityLibrary.sessions}
   */
  public get sessions(): SessionLibrary {
    return this._sessions;
  }

  /**
   * {@inheritDoc UserEntities.IUserEntityLibrary.moldInventory}
   */
  public get moldInventory(): MoldInventoryLibrary {
    return this._moldInventory;
  }

  /**
   * {@inheritDoc UserEntities.IUserEntityLibrary.ingredientInventory}
   */
  public get ingredientInventory(): IngredientInventoryLibrary {
    return this._ingredientInventory;
  }

  /**
   * {@inheritDoc UserEntities.IUserEntityLibrary.locations}
   */
  public get locations(): LocationsLibrary {
    return this._locations;
  }

  // ==========================================================================
  // Persistence Configuration
  // ==========================================================================

  /**
   * {@inheritDoc UserEntities.IUserEntityLibrary.configurePersistence}
   */
  public configurePersistence(config: IUserEntityPersistenceConfig): void {
    this._syncProvider = config.syncProvider;
    this._encryptionProvider = config.encryptionProvider;
    this._onMutation = config.onMutation;
  }

  // ==========================================================================
  // Persisted Collection Singletons
  // ==========================================================================

  /**
   * {@inheritDoc UserEntities.IUserEntityLibrary.getPersistedSessionsCollection}
   */
  public getPersistedSessionsCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<AnySessionEntity, BaseSessionId>> {
    return this._getOrCreatePersisted(
      this._persistedSessions,
      this._sessions,
      collectionId,
      CommonConverters.baseSessionId,
      SessionEntities.Converters.anySessionEntity,
      'sessions'
    );
  }

  /**
   * {@inheritDoc UserEntities.IUserEntityLibrary.getPersistedJournalsCollection}
   */
  public getPersistedJournalsCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<AnyJournalEntryEntity, BaseJournalId>> {
    return this._getOrCreatePersisted(
      this._persistedJournals,
      this._journals,
      collectionId,
      CommonConverters.baseJournalId,
      JournalEntities.Converters.anyJournalEntryEntity,
      'journals'
    );
  }

  /**
   * {@inheritDoc UserEntities.IUserEntityLibrary.getPersistedMoldInventoryCollection}
   */
  public getPersistedMoldInventoryCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<IMoldInventoryEntryEntity, MoldInventoryEntryBaseId>> {
    return this._getOrCreatePersisted(
      this._persistedMoldInventory,
      this._moldInventory,
      collectionId,
      InventoryEntities.Converters.moldInventoryEntryBaseId,
      InventoryEntities.Converters.moldInventoryEntryEntity,
      'moldInventory'
    );
  }

  /**
   * {@inheritDoc UserEntities.IUserEntityLibrary.getPersistedIngredientInventoryCollection}
   */
  public getPersistedIngredientInventoryCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<IIngredientInventoryEntryEntity, IngredientInventoryEntryBaseId>> {
    return this._getOrCreatePersisted(
      this._persistedIngredientInventory,
      this._ingredientInventory,
      collectionId,
      InventoryEntities.Converters.ingredientInventoryEntryBaseId,
      InventoryEntities.Converters.ingredientInventoryEntryEntity,
      'ingredientInventory'
    );
  }

  /**
   * {@inheritDoc UserEntities.IUserEntityLibrary.getPersistedLocationsCollection}
   */
  public getPersistedLocationsCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<ILocationEntity, BaseLocationId>> {
    return this._getOrCreatePersisted(
      this._persistedLocations,
      this._locations,
      collectionId,
      CommonConverters.baseLocationId,
      LocationEntities.Converters.locationEntity,
      'locations'
    );
  }

  // ==========================================================================
  // Generic Collection Persistence
  // ==========================================================================

  /**
   * {@inheritDoc UserEntities.IUserEntityLibrary.saveCollection}
   */
  public async saveCollection(
    collectionId: CollectionId,
    encryptionProvider?: CryptoUtils.IEncryptionProvider,
    subLibrary?: { collections: { has(id: CollectionId): boolean } }
  ): Promise<Result<true>> {
    // When subLibrary is provided, use identity to find the correct match
    const match = subLibrary
      ? (lib: { collections: { has(id: CollectionId): boolean } }): boolean =>
          lib === subLibrary && lib.collections.has(collectionId)
      : (lib: { collections: { has(id: CollectionId): boolean } }): boolean =>
          lib.collections.has(collectionId);

    if (match(this._sessions)) {
      return this._savePersisted(this.getPersistedSessionsCollection(collectionId));
    }
    if (match(this._journals)) {
      return this._savePersisted(this.getPersistedJournalsCollection(collectionId));
    }
    if (match(this._moldInventory)) {
      return this._savePersisted(this.getPersistedMoldInventoryCollection(collectionId));
    }
    if (match(this._ingredientInventory)) {
      return this._savePersisted(this.getPersistedIngredientInventoryCollection(collectionId));
    }
    if (match(this._locations)) {
      return this._savePersisted(this.getPersistedLocationsCollection(collectionId));
    }
    return fail(`Collection '${collectionId}' not found in any user entity sub-library`);
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Get or create a singleton persisted collection wrapper.
   * @internal
   */
  private _getOrCreatePersisted<T, TBaseId extends string>(
    cache: Map<CollectionId, PersistedEditableCollection<T, TBaseId>>,
    subLibrary: SubLibraryBase<string, TBaseId, T>,
    collectionId: CollectionId,
    keyConverter: Converter<TBaseId, unknown>,
    valueConverter: Converter<T, unknown>,
    subLibraryId: SubLibraryId
  ): Result<PersistedEditableCollection<T, TBaseId>> {
    // Verify the collection exists before creating a wrapper
    if (!subLibrary.collections.has(collectionId)) {
      return fail(`Collection "${collectionId}" not found`);
    }

    let cached = cache.get(collectionId);
    if (!cached) {
      cached = new PersistedEditableCollection({
        subLibrary,
        collectionId,
        keyConverter,
        valueConverter,
        syncProvider: this._syncProvider,
        encryptionProvider: this._encryptionProvider,
        onMutation: this._onMutation
          ? (compositeId: string): void => this._onMutation!(subLibraryId, compositeId)
          : undefined
      });
      cache.set(collectionId, cached);
    }
    return succeed(cached);
  }

  /**
   * Save a persisted collection wrapper, handling the Result unwrap.
   * @internal
   */
  private async _savePersisted<T, TBaseId extends string>(
    persistedResult: Result<PersistedEditableCollection<T, TBaseId>>
  ): Promise<Result<true>> {
    /* c8 ignore next 3 - defensive: saveCollection checks collections.has() before calling getPersistedXxx */
    if (persistedResult.isFailure()) {
      return fail(persistedResult.message);
    }
    return persistedResult.value.save();
  }
}

/**
 * Creates the standard user entity data directories at the given root path.
 * Creates directories for sessions, journals, mold inventory, and ingredient inventory.
 *
 * @param rootPath - Absolute path to the root directory
 * @returns Success or failure
 * @public
 */
export function createDefaultUserEntityDirectories(rootPath: string): Result<void> {
  const directories = [
    LibraryPaths.sessions,
    LibraryPaths.journals,
    LibraryPaths.moldInventory,
    LibraryPaths.ingredientInventory,
    LibraryPaths.locations
  ];

  return captureResult(() => {
    for (const dir of directories) {
      const fullPath = path.join(rootPath, dir);
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }).onFailure((msg) => fail(`Failed to create user entity directories: ${msg}`));
}
