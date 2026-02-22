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
 * Session library for managing persisted editing sessions
 * @packageDocumentation
 */

import { captureResult, fail, Logging, Result, succeed } from '@fgv/ts-utils';

import {
  ConfectionId,
  ConfectionRecipeVariationId,
  FillingId,
  FillingRecipeVariationId,
  SessionId,
  BaseSessionId,
  CollectionId,
  Converters as CommonConverters
} from '../../common';
import {
  getSessionsDirectory,
  ICollectionRuntimeMetadata,
  ISubLibraryAsyncParams,
  ISubLibraryCreateParams,
  ISubLibraryParams,
  SubLibraryBase,
  SubLibraryFileTreeSource,
  SubLibraryMergeSource
} from '../../library-data';
import { BuiltInData } from '../../built-in';
import {
  AnySessionEntity,
  IConfectionSessionEntity,
  IFillingSessionEntity,
  isConfectionSessionEntity,
  isFillingSessionEntity,
  PersistedSessionStatus
} from './model';
import { anySessionEntity as anyPersistedSessionConverter } from './converters';
import { SessionCollectionEntryInit } from './collection';

// ============================================================================
// Re-export collection types for convenience
// ============================================================================

export {
  SessionCollectionEntry,
  SessionCollectionEntryInit,
  SessionCollectionValidator,
  SessionCollection
} from './collection';

// ============================================================================
// Parameters Interfaces
// ============================================================================

/**
 * File tree source for session data.
 * @public
 */
export type ISessionFileTreeSource = SubLibraryFileTreeSource;

/**
 * Specifies a sessions library to merge into a new library.
 * @public
 */
export type SessionsMergeSource = SubLibraryMergeSource<SessionLibrary>;

/**
 * Parameters for creating a SessionLibrary instance synchronously.
 * @public
 */
export type ISessionLibraryParams = ISubLibraryParams<SessionLibrary, SessionCollectionEntryInit>;

/**
 * Parameters for creating a SessionLibrary instance asynchronously with encryption support.
 * @public
 */
export type ISessionLibraryAsyncParams = ISubLibraryAsyncParams<SessionLibrary, SessionCollectionEntryInit>;

// ============================================================================
// SessionLibrary Class
// ============================================================================

/**
 * A library for managing persisted {@link Entities.Session.AnySessionEntity | editing sessions}.
 *
 * Sessions are organized into user-defined collections. The library provides
 * cross-collection indexing for efficient queries by filling/confection and status.
 *
 * Provides:
 * - Multi-collection storage with FileTree persistence
 * - Cross-collection lookup by filling ID (all sessions for a filling)
 * - Cross-collection lookup by filling variation ID (all sessions for a specific variation)
 * - Cross-collection lookup by confection ID (all sessions for a confection)
 * - Cross-collection lookup by confection variation ID (all sessions for a specific variation)
 * - Cross-collection lookup by status (active, planning, etc.)
 * - Lazy index rebuilding for efficient queries
 *
 * @public
 */
export class SessionLibrary extends SubLibraryBase<SessionId, BaseSessionId, AnySessionEntity> {
  /**
   * Index from {@link FillingId | filling ID} to {@link SessionId | session IDs}
   * Spans all collections - rebuilt lazily when invalidated
   */
  private readonly _byFillingId: Map<FillingId, Set<SessionId>>;

  /**
   * Index from {@link FillingRecipeVariationId | filling variation ID} to {@link SessionId | session IDs}
   * Spans all collections - rebuilt lazily when invalidated
   */
  private readonly _byFillingVariationId: Map<FillingRecipeVariationId, Set<SessionId>>;

  /**
   * Index from {@link ConfectionId | confection ID} to {@link SessionId | session IDs}
   * Spans all collections - rebuilt lazily when invalidated
   */
  private readonly _byConfectionId: Map<ConfectionId, Set<SessionId>>;

  /**
   * Index from {@link ConfectionRecipeVariationId | confection variation ID} to {@link SessionId | session IDs}
   * Spans all collections - rebuilt lazily when invalidated
   */
  private readonly _byConfectionVariationId: Map<ConfectionRecipeVariationId, Set<SessionId>>;

  /**
   * Index from {@link PersistedSessionStatus | status} to {@link SessionId | session IDs}
   * Spans all collections - rebuilt lazily when invalidated
   */
  private readonly _byStatus: Map<PersistedSessionStatus, Set<SessionId>>;

  /**
   * Flag indicating whether indices are valid
   * Set to false when collections change, rebuilt lazily on first query
   */
  private _indicesValid: boolean = false;

  private constructor(params?: ISessionLibraryParams) {
    super({
      itemIdConverter: CommonConverters.baseSessionId,
      itemConverter: anyPersistedSessionConverter,
      directoryNavigator: getSessionsDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params
    });
    this._byFillingId = new Map();
    this._byFillingVariationId = new Map();
    this._byConfectionId = new Map();
    this._byConfectionVariationId = new Map();
    this._byStatus = new Map();
  }

  /**
   * Creates a new {@link Entities.Session.SessionLibrary | SessionLibrary} instance.
   * @param params - Optional {@link Entities.Session.ISessionLibraryParams | creation parameters}
   * @returns `Success` with new instance, or `Failure` with error message
   * @public
   */
  public static create(params?: ISessionLibraryParams): Result<SessionLibrary> {
    return captureResult(() => {
      const lib = new SessionLibrary(params);
      lib._invalidateIndices();
      return lib;
    });
  }

  /**
   * Creates a SessionLibrary instance asynchronously with encrypted file support.
   * @param params - {@link Entities.Session.ISessionLibraryAsyncParams | Async creation parameters}
   * @returns Promise resolving to Success with new instance, or Failure
   * @public
   */
  public static async createAsync(params?: ISessionLibraryAsyncParams): Promise<Result<SessionLibrary>> {
    /* c8 ignore next 1 - default fallback to empty params */
    params = params ?? {};
    const logger = Logging.LogReporter.createDefault(params.logger).orThrow();

    const createParams: ISubLibraryCreateParams<SessionLibrary, BaseSessionId, AnySessionEntity> = {
      itemIdConverter: CommonConverters.baseSessionId,
      itemConverter: anyPersistedSessionConverter,
      directoryNavigator: getSessionsDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params,
      logger
    };

    const loadResult = (await SubLibraryBase.loadAllCollectionsAsync(createParams)).report(logger);

    return loadResult.onSuccess((loaded) =>
      SessionLibrary.create({
        ...params,
        builtin: false,
        fileSources: undefined,
        collections: loaded.collections,
        protectedCollections: loaded.protectedCollections
      })
    );
  }

  // ============================================================================
  // Index Management
  // ============================================================================

  /**
   * Invalidates indices - they will be rebuilt lazily on next query
   */
  private _invalidateIndices(): void {
    this._indicesValid = false;
  }

  /**
   * Ensures indices are valid, rebuilding if necessary
   */
  private _ensureIndicesValid(): void {
    if (this._indicesValid) return;

    this._byFillingId.clear();
    this._byFillingVariationId.clear();
    this._byConfectionId.clear();
    this._byConfectionVariationId.clear();
    this._byStatus.clear();

    // Rebuild from all items across all collections
    for (const [sessionId, session] of this.entries()) {
      this._addToIndices(sessionId, session);
    }

    this._indicesValid = true;
  }

  /**
   * Adds a session to the appropriate indices based on its type
   */
  private _addToIndices(sessionId: SessionId, session: AnySessionEntity): void {
    // Add to status index
    this._addToStatusIndex(sessionId, session);

    if (isFillingSessionEntity(session)) {
      this._addFillingSessionToIndices(sessionId, session);
    } else if (isConfectionSessionEntity(session)) {
      this._addConfectionSessionToIndices(sessionId, session);
    }
  }

  /**
   * Adds a session to the status index
   */
  private _addToStatusIndex(sessionId: SessionId, session: AnySessionEntity): void {
    let statusSessions = this._byStatus.get(session.status);
    if (!statusSessions) {
      statusSessions = new Set();
      this._byStatus.set(session.status, statusSessions);
    }
    statusSessions.add(sessionId);
  }

  /**
   * Adds a filling session to the filling-specific indices
   */
  private _addFillingSessionToIndices(sessionId: SessionId, session: IFillingSessionEntity): void {
    const fillingId = this._extractFillingId(session.sourceVariationId);

    let fillingSessions = this._byFillingId.get(fillingId);
    if (!fillingSessions) {
      fillingSessions = new Set();
      this._byFillingId.set(fillingId, fillingSessions);
    }
    fillingSessions.add(sessionId);

    let variationSessions = this._byFillingVariationId.get(session.sourceVariationId);
    if (!variationSessions) {
      variationSessions = new Set();
      this._byFillingVariationId.set(session.sourceVariationId, variationSessions);
    }
    variationSessions.add(sessionId);
  }

  /**
   * Adds a confection session to the confection-specific indices
   */
  private _addConfectionSessionToIndices(sessionId: SessionId, session: IConfectionSessionEntity): void {
    const confectionId = this._extractConfectionId(session.sourceVariationId);

    let confectionSessions = this._byConfectionId.get(confectionId);
    if (!confectionSessions) {
      confectionSessions = new Set();
      this._byConfectionId.set(confectionId, confectionSessions);
    }
    confectionSessions.add(sessionId);

    let variationSessions = this._byConfectionVariationId.get(session.sourceVariationId);
    if (!variationSessions) {
      variationSessions = new Set();
      this._byConfectionVariationId.set(session.sourceVariationId, variationSessions);
    }
    variationSessions.add(sessionId);
  }

  /**
   * Extracts the FillingId from a FillingRecipeVariationId
   */
  private _extractFillingId(variationId: FillingRecipeVariationId): FillingId {
    return CommonConverters.parsedFillingRecipeVariationId.convert(variationId).orThrow().collectionId;
  }

  /**
   * Extracts the ConfectionId from a ConfectionRecipeVariationId
   */
  private _extractConfectionId(variationId: ConfectionRecipeVariationId): ConfectionId {
    return CommonConverters.parsedConfectionRecipeVariationId.convert(variationId).orThrow().collectionId;
  }

  // ============================================================================
  // Query Methods (Cross-Collection)
  // ============================================================================

  /**
   * Gets all filling sessions for a filling (across all variations and collections)
   * @param fillingId - The {@link FillingId | filling ID} to search for
   * @returns Array of filling sessions (empty if none found)
   * @public
   */
  public getSessionsForFilling(fillingId: FillingId): ReadonlyArray<IFillingSessionEntity> {
    this._ensureIndicesValid();
    const sessionIds = this._byFillingId.get(fillingId);
    if (!sessionIds) {
      return [];
    }
    return Array.from(sessionIds)
      .map((id) => this.get(id).value)
      .filter((s): s is IFillingSessionEntity => s !== undefined && isFillingSessionEntity(s));
  }

  /**
   * Gets all filling sessions for a specific filling variation (across all collections)
   * @param variationId - The {@link FillingRecipeVariationId | filling variation ID} to search for
   * @returns Array of filling sessions (empty if none found)
   * @public
   */
  public getSessionsForFillingRecipeVariation(
    variationId: FillingRecipeVariationId
  ): ReadonlyArray<IFillingSessionEntity> {
    this._ensureIndicesValid();
    const sessionIds = this._byFillingVariationId.get(variationId);
    if (!sessionIds) {
      return [];
    }
    return Array.from(sessionIds)
      .map((id) => this.get(id).value)
      .filter((s): s is IFillingSessionEntity => s !== undefined && isFillingSessionEntity(s));
  }

  /**
   * Gets all confection sessions for a confection (across all variations and collections)
   * @param confectionId - The {@link ConfectionId | confection ID} to search for
   * @returns Array of confection sessions (empty if none found)
   * @public
   */
  public getSessionsForConfection(confectionId: ConfectionId): ReadonlyArray<IConfectionSessionEntity> {
    this._ensureIndicesValid();
    const sessionIds = this._byConfectionId.get(confectionId);
    if (!sessionIds) {
      return [];
    }
    return Array.from(sessionIds)
      .map((id) => this.get(id).value)
      .filter((s): s is IConfectionSessionEntity => s !== undefined && isConfectionSessionEntity(s));
  }

  /**
   * Gets all confection sessions for a specific confection variation (across all collections)
   * @param variationId - The {@link ConfectionRecipeVariationId | confection variation ID} to search for
   * @returns Array of confection sessions (empty if none found)
   * @public
   */
  public getSessionsForConfectionRecipeVariation(
    variationId: ConfectionRecipeVariationId
  ): ReadonlyArray<IConfectionSessionEntity> {
    this._ensureIndicesValid();
    const sessionIds = this._byConfectionVariationId.get(variationId);
    if (!sessionIds) {
      return [];
    }
    return Array.from(sessionIds)
      .map((id) => this.get(id).value)
      .filter((s): s is IConfectionSessionEntity => s !== undefined && isConfectionSessionEntity(s));
  }

  /**
   * Gets all sessions with a specific status (across all collections)
   * @param status - The {@link Entities.Session.PersistedSessionStatus | status} to filter by
   * @returns Array of sessions with that status (empty if none found)
   * @public
   */
  public getSessionsByStatus(status: PersistedSessionStatus): ReadonlyArray<AnySessionEntity> {
    this._ensureIndicesValid();
    const sessionIds = this._byStatus.get(status);
    if (!sessionIds) {
      return [];
    }
    return Array.from(sessionIds)
      .map((id) => this.get(id).value)
      .filter((s): s is AnySessionEntity => s !== undefined);
  }

  /**
   * Gets all active sessions (status === 'active') across all collections
   * @returns Array of active sessions
   * @public
   */
  public getActiveSessions(): ReadonlyArray<AnySessionEntity> {
    return this.getSessionsByStatus('active');
  }

  /**
   * Gets a session by ID (searches all collections)
   * @param sessionId - The session ID to look up
   * @returns Success with the session, or Failure if not found
   * @public
   */
  public getSession(sessionId: SessionId): Result<AnySessionEntity> {
    return this.get(sessionId);
  }

  /**
   * Gets all sessions across all collections
   * @returns Array of all sessions
   * @public
   */
  public getAllSessions(): ReadonlyArray<AnySessionEntity> {
    return Array.from(this.values());
  }

  /**
   * Checks if a session with the given ID exists (searches all collections)
   * @param sessionId - The session ID to check
   * @returns `true` if the session exists
   * @public
   */
  public hasSession(sessionId: SessionId): boolean {
    return this.has(sessionId);
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Adds a new session to a collection.
   * Fails if a session with the same baseId already exists in the collection.
   * @param collectionId - The collection to add to
   * @param session - The session to add
   * @returns Success with the composite session ID, or Failure if add fails
   * @public
   */
  public addSession(collectionId: CollectionId, session: AnySessionEntity): Result<SessionId> {
    return this.addToCollection(collectionId, session.baseId, session)
      .asResult.withErrorFormat((msg) => `Failed to add session ${session.baseId} to ${collectionId}: ${msg}`)
      .onSuccess(() => {
        this._invalidateIndices();
        return CommonConverters.sessionId.convert(`${collectionId}.${session.baseId}`);
      });
  }

  /**
   * Adds or updates a session in a collection.
   * If a session with the same baseId exists, it will be replaced.
   * @param collectionId - The collection to upsert into
   * @param session - The session to add or update
   * @returns Success with the composite session ID, or Failure if upsert fails
   * @public
   */
  public upsertSession(collectionId: CollectionId, session: AnySessionEntity): Result<SessionId> {
    return this.setInCollection(collectionId, session.baseId, session)
      .asResult.withErrorFormat(
        (msg) => `Failed to upsert session ${session.baseId} in ${collectionId}: ${msg}`
      )
      .onSuccess(() => {
        this._invalidateIndices();
        return CommonConverters.sessionId.convert(`${collectionId}.${session.baseId}`);
      });
  }

  /**
   * Removes a session from its collection.
   * @param sessionId - The composite session ID to remove
   * @returns Success with the removed session, or Failure if not found or remove fails
   * @public
   */
  public removeSession(sessionId: SessionId): Result<AnySessionEntity> {
    return this.get(sessionId)
      .asResult.withErrorFormat((msg) => `Session ${sessionId} not found: ${msg}`)
      .onSuccess((session) => {
        const collectionId = CommonConverters.parsedSessionId.convert(sessionId).orThrow().collectionId;
        return this.collections
          .get(collectionId)
          .asResult.withErrorFormat((msg) => `Collection ${collectionId} not found: ${msg}`)
          .onSuccess((collection) => {
            if (!collection.isMutable) {
              return fail(`Cannot remove session from immutable collection ${collectionId}`);
            }
            // Use delete from the underlying items map
            return collection.items
              .delete(session.baseId)
              .asResult.withErrorFormat((msg) => `Failed to delete session: ${msg}`)
              .onSuccess(() => {
                this._invalidateIndices();
                return succeed(session);
              });
          });
      });
  }

  /**
   * Creates a new mutable collection for sessions.
   * @param collectionId - The ID for the new collection
   * @param metadata - Optional metadata for the collection
   * @returns Success with the collection ID, or Failure if creation fails
   * @public
   */
  public createCollection(
    collectionId: CollectionId,
    metadata?: ICollectionRuntimeMetadata
  ): Result<CollectionId> {
    if (this.collections.has(collectionId)) {
      return fail(`Collection ${collectionId} already exists`);
    }

    this.addCollectionEntry({
      id: collectionId,
      isMutable: true,
      items: {},
      metadata
    });

    return succeed(collectionId);
  }
}
