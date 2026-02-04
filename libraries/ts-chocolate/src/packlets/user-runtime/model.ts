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
 * Model interfaces for user library runtime materialization.
 * @packageDocumentation
 */

import { Result } from '@fgv/ts-utils';

import { FillingVersionId, SessionId, SourceId } from '../common';
import { AnySessionEntity, IFillingSessionEntity, PersistedSessionStatus } from '../entities';
import { Session } from '../runtime';

/**
 * Union type for any materialized editing session.
 * @public
 */
export type AnyMaterializedSession = Session.EditingSession | Session.AnyConfectionEditingSession;

/**
 * Options for creating a new persisted filling session.
 * @public
 */
export interface ICreateFillingSessionOptions {
  /** Target collection for the persisted session */
  readonly collectionId: SourceId;
  /** Initial session status (default: 'active') */
  readonly status?: PersistedSessionStatus;
  /** Optional user-provided label */
  readonly label?: string;
}

/**
 * Runtime materialization layer for user library data.
 *
 * This interface provides:
 * - Materialization of persisted sessions into runtime editing sessions
 * - Caching of materialized sessions for efficient access
 * - Creation and persistence of new sessions
 *
 * @public
 */
export interface IUserLibraryRuntime {
  /**
   * Gets a materialized editing session from a persisted session.
   * Returns cached session if already materialized, or materializes on demand.
   * @param sessionId - Full persisted session ID (collectionId.baseId)
   * @returns Result with the materialized editing session (filling or confection)
   */
  getMaterializedSession(sessionId: SessionId): Result<AnyMaterializedSession>;

  /**
   * Creates a new persisted filling session from a filling version.
   * The session is created and persisted immediately.
   * @param versionId - Source filling version to create session for
   * @param options - Creation options including target collection
   * @returns Result with the created persisted session
   */
  createFillingSession(
    versionId: FillingVersionId,
    options: ICreateFillingSessionOptions
  ): Result<IFillingSessionEntity>;

  /**
   * Saves an active session back to the library.
   * @param sessionId - Session to save
   * @returns Result with the updated persisted session
   */
  saveSession(sessionId: SessionId): Result<AnySessionEntity>;

  /**
   * Evicts a materialized session from the cache.
   * The persisted session remains in the library.
   * @param sessionId - Session to evict
   * @returns True if session was cached and evicted
   */
  evictSession(sessionId: SessionId): boolean;

  /**
   * All currently materialized sessions.
   */
  readonly materializedSessions: ReadonlyMap<SessionId, AnyMaterializedSession>;
}
