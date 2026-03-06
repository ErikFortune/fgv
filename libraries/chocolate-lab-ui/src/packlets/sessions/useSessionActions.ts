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
  Entities,
  type CollectionId,
  type ConfectionId,
  type FillingRecipeVariationId,
  type SessionId,
  type UserLibrary
} from '@fgv/ts-chocolate';

import { useReactiveWorkspace, useWorkspace } from '../workspace';
import { useMutableCollection } from '../navigation';

// ============================================================================
// Session Actions Interface
// ============================================================================

/**
 * Session action callbacks returned by useSessionActions.
 *
 * All mutating actions return `Promise<Result<SessionId>>` — the composite ID of the
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
  ) => Promise<Result<SessionId>>;

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
  ) => Promise<Result<SessionId>>;

  /**
   * Save an active session back to the entity library.
   * @param sessionId - The composite SessionId to save
   * @returns Result with the composite SessionId
   */
  readonly saveSession: (sessionId: SessionId) => Promise<Result<SessionId>>;

  /**
   * Update the status of an existing persisted session.
   * @param sessionId - The composite SessionId to update
   * @param status - New session status
   * @returns Result with the composite SessionId
   */
  readonly updateSessionStatus: (
    sessionId: SessionId,
    status: Entities.PersistedSessionStatus
  ) => Promise<Result<SessionId>>;

  /**
   * Delete a session from the entity library.
   * @param sessionId - The composite SessionId to delete
   * @returns Result with the composite SessionId
   */
  readonly deleteSession: (sessionId: SessionId) => Promise<Result<SessionId>>;

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
 * Persistence is awaited to prevent silent write cancellation.
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
    async (
      variationId: FillingRecipeVariationId,
      options: UserLibrary.ICreateFillingSessionOptions
    ): Promise<Result<SessionId>> => {
      const result = await workspace.userData.createPersistedFillingSessionAndSave(variationId, options);
      if (result.isSuccess()) {
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
    async (
      confectionId: ConfectionId,
      options: UserLibrary.ICreateConfectionSessionOptions
    ): Promise<Result<SessionId>> => {
      const result = await workspace.userData.createPersistedConfectionSessionAndSave(confectionId, options);
      if (result.isSuccess()) {
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
    async (sessionId: SessionId): Promise<Result<SessionId>> => {
      const result = await workspace.userData.saveSessionAndPersist(sessionId);
      if (result.isSuccess()) {
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
    async (sessionId: SessionId, status: Entities.PersistedSessionStatus): Promise<Result<SessionId>> => {
      const result = await workspace.userData.updateSessionStatusAndPersist(sessionId, status);
      if (result.isSuccess()) {
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
    async (sessionId: SessionId): Promise<Result<SessionId>> => {
      const result = await workspace.userData.removeSessionAndPersist(sessionId);
      if (result.isSuccess()) {
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
