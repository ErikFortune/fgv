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
 * Model interfaces for user-specific library data.
 * @packageDocumentation
 */

import { Logging, Result } from '@fgv/ts-utils';
import { CryptoUtils } from '@fgv/ts-extras';

import { BaseJournalId, BaseLocationId, BaseSessionId, CollectionId } from '../common';
import { SubLibraryId } from '../library-data';
import {
  AnyJournalEntryEntity,
  AnySessionEntity,
  IIngredientInventoryEntryEntity,
  IngredientInventoryEntryBaseId,
  IngredientInventoryLibrary,
  ILocationEntity,
  IMoldInventoryEntryEntity,
  MoldInventoryEntryBaseId,
  JournalLibrary,
  LocationsLibrary,
  MoldInventoryLibrary,
  SessionLibrary
} from '../entities';
import { ISyncProvider, PersistedEditableCollection } from '../editing';
import { ILibraryFileTreeSource } from '../library-data';

// ============================================================================
// User Library Interface
// ============================================================================

/**
 * User-specific library data (journals, sessions, inventory).
 * Separate from shared library data (ingredients, recipes, etc.).
 * @public
 */
export interface IUserEntityLibrary {
  /**
   * Journal library for production records.
   */
  readonly journals: JournalLibrary;

  /**
   * Session library for persisted editing sessions.
   */
  readonly sessions: SessionLibrary;

  /**
   * Mold inventory library for tracking owned molds.
   */
  readonly moldInventory: MoldInventoryLibrary;

  /**
   * Ingredient inventory library for tracking ingredient stock.
   */
  readonly ingredientInventory: IngredientInventoryLibrary;

  /**
   * Locations library for tracking production locations.
   */
  readonly locations: LocationsLibrary;

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------

  /**
   * Configures persistence providers for all sub-libraries.
   * Must be called before using any `getPersisted*Collection` or `saveCollection` methods.
   * @param config - Persistence configuration with sync and encryption providers
   */
  configurePersistence(config: IUserEntityPersistenceConfig): void;

  /**
   * Get or create a singleton persisted sessions collection.
   * @param collectionId - ID of the collection
   * @returns `Success` with persisted wrapper, or `Failure` if collection not found
   */
  getPersistedSessionsCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<AnySessionEntity, BaseSessionId>>;

  /**
   * Get or create a singleton persisted journals collection.
   * @param collectionId - ID of the collection
   * @returns `Success` with persisted wrapper, or `Failure` if collection not found
   */
  getPersistedJournalsCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<AnyJournalEntryEntity, BaseJournalId>>;

  /**
   * Get or create a singleton persisted mold inventory collection.
   * @param collectionId - ID of the collection
   * @returns `Success` with persisted wrapper, or `Failure` if collection not found
   */
  getPersistedMoldInventoryCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<IMoldInventoryEntryEntity, MoldInventoryEntryBaseId>>;

  /**
   * Get or create a singleton persisted ingredient inventory collection.
   * @param collectionId - ID of the collection
   * @returns `Success` with persisted wrapper, or `Failure` if collection not found
   */
  getPersistedIngredientInventoryCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<IIngredientInventoryEntryEntity, IngredientInventoryEntryBaseId>>;

  /**
   * Get or create a singleton persisted locations collection.
   * @param collectionId - ID of the collection
   * @returns `Success` with persisted wrapper, or `Failure` if collection not found
   */
  getPersistedLocationsCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<ILocationEntity, BaseLocationId>>;

  /**
   * Save a collection's current in-memory state to its backing file tree.
   * Uses the persisted collection singleton for the full save pipeline.
   *
   * @param collectionId - Collection to persist
   * @param encryptionProvider - Optional encryption provider for encrypted collections
   * @param subLibrary - Optional sub-library hint to disambiguate shared collection IDs
   * @returns Result with `true` on success, or Failure with context
   */
  saveCollection(
    collectionId: CollectionId,
    encryptionProvider?: CryptoUtils.IEncryptionProvider,
    subLibrary?: { collections: { has(id: CollectionId): boolean } }
  ): Promise<Result<true>>;
}

// ============================================================================
// Persistence Configuration
// ============================================================================

/**
 * Configuration for user entity library persistence.
 * @public
 */
export interface IUserEntityPersistenceConfig {
  /**
   * Provider for flushing FileTree changes to the filesystem.
   */
  readonly syncProvider?: ISyncProvider;

  /**
   * Encryption provider (or lazy getter) for encrypted collections.
   */
  readonly encryptionProvider?:
    | CryptoUtils.IEncryptionProvider
    | (() => CryptoUtils.IEncryptionProvider | undefined);

  /**
   * Optional callback invoked after any entity mutation via persisted collections.
   * Use this to invalidate materialized caches that wrap the same SubLibrary.
   *
   * @param subLibraryId - Identifies which sub-library was mutated
   * @param compositeId - The composite entity ID (`collectionId.baseId`) of the mutated entry
   */
  readonly onMutation?: (subLibraryId: SubLibraryId, compositeId: string) => void;
}

// ============================================================================
// Pre-instantiated User Library Sources
// ============================================================================

/**
 * Pre-built user library instances to include in a {@link UserEntities.UserEntityLibrary | UserEntityLibrary}.
 * @public
 */
export interface IInstantiatedUserEntityLibrarySource {
  /**
   * Pre-built journals library
   */
  readonly journals?: JournalLibrary;

  /**
   * Pre-built sessions library
   */
  readonly sessions?: SessionLibrary;

  /**
   * Pre-built mold inventory library
   */
  readonly moldInventory?: MoldInventoryLibrary;

  /**
   * Pre-built ingredient inventory library
   */
  readonly ingredientInventory?: IngredientInventoryLibrary;

  /**
   * Pre-built locations library
   */
  readonly locations?: LocationsLibrary;
}

// ============================================================================
// User Library Creation Parameters
// ============================================================================

/**
 * Parameters for creating a {@link UserEntities.UserEntityLibrary | UserEntityLibrary}.
 *
 * User libraries have no built-in data - all data is user-provided.
 *
 * Sources are processed in order:
 * 1. File tree sources (in array order)
 * 2. Pre-instantiated libraries (merged in)
 *
 * @public
 */
export interface IUserEntityLibraryCreateParams {
  /**
   * File tree sources to load data from.
   */
  readonly fileSources?: ILibraryFileTreeSource | ReadonlyArray<ILibraryFileTreeSource>;

  /**
   * Pre-instantiated library sources.
   */
  readonly libraries?: IInstantiatedUserEntityLibrarySource;

  /**
   * Logger for library operations.
   */
  readonly logger?: Logging.ILogger;
}
