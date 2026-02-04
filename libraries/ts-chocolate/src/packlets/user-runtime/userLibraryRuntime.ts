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
 * UserLibraryRuntime - materializes persisted sessions into runtime editing sessions.
 * @packageDocumentation
 */

import { Result, fail, succeed } from '@fgv/ts-utils';

import { ConfectionType, FillingVersionId, Helpers, SessionId } from '../common';
import {
  AnySessionEntity,
  IConfectionSessionEntity,
  IFillingSessionEntity,
  IProducedBarTruffleEntity,
  IProducedMoldedBonBonEntity,
  IProducedRolledTruffleEntity,
  Session as SessionEntities,
  SessionLibrary
} from '../entities';
import {
  IRuntimeConfection,
  RuntimeBarTruffle,
  RuntimeMoldedBonBon,
  RuntimeRolledTruffle
} from '../library-runtime';
import { ISessionContext, Session } from '../runtime';
import { IUserLibrary } from '../user-library';
import { AnyMaterializedSession, ICreateFillingSessionOptions, IUserLibraryRuntime } from './model';

/**
 * Implementation of user library runtime materialization.
 *
 * Provides:
 * - On-demand materialization of persisted sessions
 * - Caching of materialized sessions
 * - Creation and persistence of new sessions
 *
 * @public
 */
export class UserLibraryRuntime implements IUserLibraryRuntime {
  private readonly _userLibrary: IUserLibrary;
  private readonly _sessionContext: ISessionContext;
  private readonly _materializedSessions: Map<SessionId, AnyMaterializedSession>;

  private constructor(userLibrary: IUserLibrary, sessionContext: ISessionContext) {
    this._userLibrary = userLibrary;
    this._sessionContext = sessionContext;
    this._materializedSessions = new Map();
  }

  /**
   * Creates a new UserLibraryRuntime.
   * @param userLibrary - The user library containing persisted sessions
   * @param sessionContext - The session context for materializing recipes and confections
   * @returns Result with the UserLibraryRuntime
   * @public
   */
  public static create(
    userLibrary: IUserLibrary,
    sessionContext: ISessionContext
  ): Result<UserLibraryRuntime> {
    return succeed(new UserLibraryRuntime(userLibrary, sessionContext));
  }

  /**
   * Gets the sessions library from the user library.
   */
  private get _sessions(): SessionLibrary {
    return this._userLibrary.sessions;
  }

  // ============================================================================
  // IUserLibraryRuntime Implementation
  // ============================================================================

  /**
   * {@inheritDoc UserRuntime.IUserLibraryRuntime.getMaterializedSession}
   */
  public getMaterializedSession(sessionId: SessionId): Result<AnyMaterializedSession> {
    // Check cache first
    const cached = this._materializedSessions.get(sessionId);
    if (cached !== undefined) {
      return succeed(cached);
    }

    // Get persisted session from library
    const persistedResult = this._sessions.get(sessionId);
    if (persistedResult.isFailure()) {
      return fail(`Session ${sessionId} not found: ${persistedResult.message}`);
    }

    const persisted = persistedResult.value;

    // Dispatch to type-specific materialization
    if (SessionEntities.isFillingSessionEntity(persisted)) {
      return this._materializeFillingSession(sessionId, persisted);
    }

    if (SessionEntities.isConfectionSessionEntity(persisted)) {
      return this._materializeConfectionSession(sessionId, persisted);
    }

    return fail(`Unknown session type for ${sessionId}`);
  }

  /**
   * {@inheritDoc UserRuntime.IUserLibraryRuntime.createFillingSession}
   */
  public createFillingSession(
    versionId: FillingVersionId,
    options: ICreateFillingSessionOptions
  ): Result<IFillingSessionEntity> {
    // Get the filling version from the session context
    const fillingId = Helpers.getFillingVersionFillingId(versionId);
    return this._sessionContext.getRuntimeFilling(fillingId).onSuccess((filling) => {
      // Find the specific version
      const versionSpec = Helpers.getFillingVersionSpec(versionId);
      return filling.getVersion(versionSpec).onSuccess((version) => {
        // Create editing session
        return Session.EditingSession.create(version).onSuccess((session) => {
          // Convert to persisted state
          return session.toPersistedState({
            collectionId: options.collectionId,
            status: options.status,
            label: options.label
          });
        });
      });
    });
  }

  /**
   * {@inheritDoc UserRuntime.IUserLibraryRuntime.saveSession}
   */
  public saveSession(sessionId: SessionId): Result<AnySessionEntity> {
    // Get the materialized session
    const session = this._materializedSessions.get(sessionId);
    if (session === undefined) {
      return fail(`Session ${sessionId} is not materialized`);
    }

    // Currently only filling sessions are supported
    if (!('toPersistedState' in session)) {
      return fail(
        `Session ${sessionId} does not support persistence (confection sessions not yet implemented)`
      );
    }

    // Get the existing persisted session to get the base ID
    const existingResult = this._sessions.get(sessionId);
    if (existingResult.isFailure()) {
      return fail(`Session ${sessionId} not found: ${existingResult.message}`);
    }

    const existing = existingResult.value;
    const collectionId = Helpers.getSessionCollectionId(sessionId);
    const baseId = Helpers.getSessionBaseId(sessionId);

    // Create updated persisted state (only EditingSession has toPersistedState for now)
    const fillingSession = session as Session.EditingSession;
    return fillingSession
      .toPersistedState({
        collectionId,
        baseId,
        status: existing.status,
        label: existing.label,
        notes: existing.notes ? [...existing.notes] : undefined
      })
      .onSuccess((persisted) => {
        // Persist to the library
        return this._sessions.upsertSession(collectionId, persisted).onSuccess(() => {
          return succeed(persisted as AnySessionEntity);
        });
      });
  }

  /**
   * {@inheritDoc UserRuntime.IUserLibraryRuntime.evictSession}
   */
  public evictSession(sessionId: SessionId): boolean {
    return this._materializedSessions.delete(sessionId);
  }

  /**
   * {@inheritDoc UserRuntime.IUserLibraryRuntime.materializedSessions}
   */
  public get materializedSessions(): ReadonlyMap<SessionId, AnyMaterializedSession> {
    return this._materializedSessions;
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Materializes a filling session from persisted state.
   */
  private _materializeFillingSession(
    sessionId: SessionId,
    persisted: IFillingSessionEntity
  ): Result<Session.EditingSession> {
    // Get the base recipe version from session context
    const fillingId = Helpers.getFillingVersionFillingId(persisted.sourceVersionId);
    return this._sessionContext.getRuntimeFilling(fillingId).onSuccess((filling) => {
      const versionSpec = Helpers.getFillingVersionSpec(persisted.sourceVersionId);
      return filling.getVersion(versionSpec).onSuccess((version) => {
        // Restore the editing session from persisted state
        return Session.EditingSession.fromPersistedState(persisted, version).onSuccess((session) => {
          // Cache the materialized session
          this._materializedSessions.set(sessionId, session);
          return succeed(session);
        });
      });
    });
  }

  /**
   * Materializes a confection session from persisted state.
   */
  private _materializeConfectionSession(
    sessionId: SessionId,
    persisted: IConfectionSessionEntity
  ): Result<Session.AnyConfectionEditingSession> {
    // Parse the confection version ID to get confection ID and version spec
    return Helpers.parseConfectionVersionId(persisted.sourceVersionId).onSuccess((parsed) => {
      // Get the confection from session context
      return this._sessionContext.getRuntimeConfection(parsed.collectionId).onSuccess((confection) => {
        // Dispatch to type-specific materialization based on confection type
        return this._materializeTypedConfectionSession(sessionId, persisted, confection, parsed.itemId);
      });
    });
  }

  /**
   * Dispatches to type-specific confection session materialization.
   */
  private _materializeTypedConfectionSession(
    sessionId: SessionId,
    persisted: IConfectionSessionEntity,
    confection: IRuntimeConfection,
    _versionSpec: string
  ): Result<Session.AnyConfectionEditingSession> {
    // Narrow the confection type and history type together
    if (confection.isMoldedBonBon() && persisted.confectionType === ('moldedBonBon' as ConfectionType)) {
      return this._materializeMoldedBonBonSession(
        sessionId,
        persisted.history as SessionEntities.ISerializedEditingHistoryEntity<IProducedMoldedBonBonEntity>,
        confection
      );
    }

    if (confection.isBarTruffle() && persisted.confectionType === ('barTruffle' as ConfectionType)) {
      return this._materializeBarTruffleSession(
        sessionId,
        persisted.history as SessionEntities.ISerializedEditingHistoryEntity<IProducedBarTruffleEntity>,
        confection
      );
    }

    if (confection.isRolledTruffle() && persisted.confectionType === ('rolledTruffle' as ConfectionType)) {
      return this._materializeRolledTruffleSession(
        sessionId,
        persisted.history as SessionEntities.ISerializedEditingHistoryEntity<IProducedRolledTruffleEntity>,
        confection
      );
    }

    return fail(`Confection type mismatch: expected ${persisted.confectionType}`);
  }

  /**
   * Materializes a molded bonbon editing session.
   * Note: Type assertion is safe because isMoldedBonBon() ensures the runtime type is RuntimeMoldedBonBon.
   */
  private _materializeMoldedBonBonSession(
    sessionId: SessionId,
    history: SessionEntities.ISerializedEditingHistoryEntity<IProducedMoldedBonBonEntity>,
    confection: IRuntimeConfection
  ): Result<Session.MoldedBonBonEditingSession> {
    return Session.MoldedBonBonEditingSession.fromPersistedState(
      confection as unknown as RuntimeMoldedBonBon,
      history,
      this._sessionContext
    ).onSuccess((session) => {
      this._materializedSessions.set(sessionId, session);
      return succeed(session);
    });
  }

  /**
   * Materializes a bar truffle editing session.
   * Note: Type assertion is safe because isBarTruffle() ensures the runtime type is RuntimeBarTruffle.
   */
  private _materializeBarTruffleSession(
    sessionId: SessionId,
    history: SessionEntities.ISerializedEditingHistoryEntity<IProducedBarTruffleEntity>,
    confection: IRuntimeConfection
  ): Result<Session.BarTruffleEditingSession> {
    return Session.BarTruffleEditingSession.fromPersistedState(
      confection as unknown as RuntimeBarTruffle,
      history,
      this._sessionContext
    ).onSuccess((session) => {
      this._materializedSessions.set(sessionId, session);
      return succeed(session);
    });
  }

  /**
   * Materializes a rolled truffle editing session.
   * Note: Type assertion is safe because isRolledTruffle() ensures the runtime type is RuntimeRolledTruffle.
   */
  private _materializeRolledTruffleSession(
    sessionId: SessionId,
    history: SessionEntities.ISerializedEditingHistoryEntity<IProducedRolledTruffleEntity>,
    confection: IRuntimeConfection
  ): Result<Session.RolledTruffleEditingSession> {
    return Session.RolledTruffleEditingSession.fromPersistedState(
      confection as unknown as RuntimeRolledTruffle,
      history,
      this._sessionContext
    ).onSuccess((session) => {
      this._materializedSessions.set(sessionId, session);
      return succeed(session);
    });
  }
}
