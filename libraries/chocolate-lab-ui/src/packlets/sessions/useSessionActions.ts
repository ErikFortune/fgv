/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Session action hooks for creating, saving, and managing sessions.
 *
 * Returns composite SessionIds (never raw entity interfaces) per the
 * UI–Runtime boundary contract. Callers look up materialized objects
 * via `workspace.userData.sessions.get(id)` when needed.
 *
 * @packageDocumentation
 */

import { useCallback } from 'react';

import { type Result } from '@fgv/ts-utils';

import {
  Converters as CommonConverters,
  Editing,
  Entities,
  Helpers,
  type CollectionId,
  type ConfectionId,
  type FillingRecipeVariationId,
  type SessionId,
  type UserLibrary
} from '@fgv/ts-chocolate';

import { useReactiveWorkspace, useWorkspace } from '../workspace';
import { useMutableCollection } from '../navigation';

// ============================================================================
// Session Persistence Helper
// ============================================================================

/**
 * Persists a session collection to its backing file (async, fire-and-forget).
 * Creates an EditableCollection snapshot and saves it.
 * @internal
 */
function persistSessionCollection(
  sessionLibrary: Entities.SessionLibrary,
  collectionId: CollectionId,
  logger: { error(msg: string): void }
): void {
  const editableResult = Editing.EditableCollection.fromLibrary(
    sessionLibrary,
    collectionId,
    CommonConverters.baseSessionId,
    Entities.Session.Converters.anySessionEntity
  );
  if (editableResult.isFailure()) {
    logger.error(`Session persistence: failed to get editable collection: ${editableResult.message}`);
    return;
  }
  const editable = editableResult.value;
  if (editable.canSave()) {
    editable
      .save()
      .then((saveResult) => {
        if (saveResult.isFailure()) {
          logger.error(`Session persistence: failed to save collection: ${saveResult.message}`);
        }
      })
      .catch((err: unknown) => {
        logger.error(`Session persistence: unexpected error: ${err}`);
      });
  }
}

// ============================================================================
// Session Actions Interface
// ============================================================================

/**
 * Session action callbacks returned by useSessionActions.
 *
 * All mutating actions return `Result<SessionId>` — the composite ID of the
 * created or updated session. The caller can then look up the materialized
 * session via `workspace.userData.sessions.get(id)` if needed.
 *
 * @public
 */
export interface ISessionActions {
  /**
   * Create a new filling session from a filling recipe variation.
   * The session is persisted immediately and added to the entity library.
   * @param variationId - Source filling variation ID
   * @param options - Creation options (collectionId, status, label)
   * @returns Result with the composite SessionId
   */
  readonly createFillingSession: (
    variationId: FillingRecipeVariationId,
    options: UserLibrary.ICreateFillingSessionOptions
  ) => Result<SessionId>;

  /**
   * Create a new confection session from a confection recipe.
   * The session is persisted immediately and added to the entity library.
   * @param confectionId - Source confection ID
   * @param options - Creation options (collectionId, status, label, params)
   * @returns Result with the composite SessionId
   */
  readonly createConfectionSession: (
    confectionId: ConfectionId,
    options: UserLibrary.ICreateConfectionSessionOptions
  ) => Result<SessionId>;

  /**
   * Save an active session back to the entity library.
   * @param sessionId - The composite SessionId to save
   * @returns Result with the composite SessionId
   */
  readonly saveSession: (sessionId: SessionId) => Result<SessionId>;

  /**
   * Update the status of an existing persisted session.
   * @param sessionId - The composite SessionId to update
   * @param status - New session status
   * @returns Result with the composite SessionId
   */
  readonly updateSessionStatus: (
    sessionId: SessionId,
    status: Entities.PersistedSessionStatus
  ) => Result<SessionId>;

  /**
   * Delete a session from the entity library.
   * @param sessionId - The composite SessionId to delete
   * @returns Result with the composite SessionId
   */
  readonly deleteSession: (sessionId: SessionId) => Result<SessionId>;

  /**
   * The default mutable collection ID for new sessions.
   * Resolved from the sessions sub-library; undefined if no mutable collection exists.
   */
  readonly defaultCollectionId: CollectionId | undefined;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Provides session action callbacks wired to the workspace.
 *
 * Actions create/save sessions through the UserLibrary and trigger
 * workspace cache invalidation + reactive notification after mutations.
 *
 * @public
 */
export function useSessionActions(): ISessionActions {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();

  const defaultCollectionId = useMutableCollection(
    workspace.userData.entities.sessions.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.sessions
  );

  const createFillingSession = useCallback(
    (
      variationId: FillingRecipeVariationId,
      options: UserLibrary.ICreateFillingSessionOptions
    ): Result<SessionId> => {
      const result = workspace.userData.createPersistedFillingSession(variationId, options);
      if (result.isSuccess()) {
        persistSessionCollection(
          workspace.userData.entities.sessions,
          options.collectionId,
          workspace.data.logger
        );
        workspace.data.clearCache();
        reactiveWorkspace.notifyChange();
        workspace.data.logger.info(`Created filling session '${result.value}'`);
      } else {
        workspace.data.logger.error(`Failed to create filling session: ${result.message}`);
      }
      return result;
    },
    [workspace, reactiveWorkspace]
  );

  const createConfectionSession = useCallback(
    (confectionId: ConfectionId, options: UserLibrary.ICreateConfectionSessionOptions): Result<SessionId> => {
      const result = workspace.userData.createPersistedConfectionSession(confectionId, options);
      if (result.isSuccess()) {
        persistSessionCollection(
          workspace.userData.entities.sessions,
          options.collectionId,
          workspace.data.logger
        );
        workspace.data.clearCache();
        reactiveWorkspace.notifyChange();
        workspace.data.logger.info(`Created confection session '${result.value}'`);
      } else {
        workspace.data.logger.error(`Failed to create confection session: ${result.message}`);
      }
      return result;
    },
    [workspace, reactiveWorkspace]
  );

  const saveSession = useCallback(
    (sessionId: SessionId): Result<SessionId> => {
      const result = workspace.userData.saveSession(sessionId);
      if (result.isSuccess()) {
        const collectionId = Helpers.getSessionCollectionId(sessionId);
        persistSessionCollection(workspace.userData.entities.sessions, collectionId, workspace.data.logger);
        workspace.data.clearCache();
        reactiveWorkspace.notifyChange();
        workspace.data.logger.info(`Saved session '${result.value}'`);
      } else {
        workspace.data.logger.error(`Failed to save session '${sessionId}': ${result.message}`);
      }
      return result;
    },
    [workspace, reactiveWorkspace]
  );

  const updateSessionStatus = useCallback(
    (sessionId: SessionId, status: Entities.PersistedSessionStatus): Result<SessionId> => {
      const result = workspace.userData.updateSessionStatus(sessionId, status);
      if (result.isSuccess()) {
        const collectionId = Helpers.getSessionCollectionId(sessionId);
        persistSessionCollection(workspace.userData.entities.sessions, collectionId, workspace.data.logger);
        workspace.data.clearCache();
        reactiveWorkspace.notifyChange();
        workspace.data.logger.info(`Updated session '${sessionId}' status to '${status}'`);
      } else {
        workspace.data.logger.error(`Failed to update session status: ${result.message}`);
      }
      return result;
    },
    [workspace, reactiveWorkspace]
  );

  const deleteSession = useCallback(
    (sessionId: SessionId): Result<SessionId> => {
      const collectionId = Helpers.getSessionCollectionId(sessionId);
      const result = workspace.userData.removeSession(sessionId);
      if (result.isSuccess()) {
        persistSessionCollection(workspace.userData.entities.sessions, collectionId, workspace.data.logger);
        workspace.data.clearCache();
        reactiveWorkspace.notifyChange();
        workspace.data.logger.info(`Deleted session '${sessionId}'`);
      } else {
        workspace.data.logger.error(`Failed to delete session '${sessionId}': ${result.message}`);
      }
      return result;
    },
    [workspace, reactiveWorkspace]
  );

  return {
    createFillingSession,
    createConfectionSession,
    saveSession,
    updateSessionStatus,
    deleteSession,
    defaultCollectionId
  };
}
