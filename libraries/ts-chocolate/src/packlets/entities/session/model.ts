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
 * Persisted session model types for the user library.
 *
 * This module defines the schema for editing sessions that are persisted
 * to the user library. Sessions include full editing state with undo/redo
 * history for restoration.
 *
 * @packageDocumentation
 */

import {
  ConfectionType,
  ConfectionVersionId,
  FillingVersionId,
  Model as CommonModel,
  SessionId,
  BaseSessionId,
  SlotId,
  CollectionId
} from '../../common';
import { AnyProducedConfectionEntity } from '../confections';
import { IProducedFillingEntity } from '../fillings';

// ============================================================================
// Schema Version
// ============================================================================

/**
 * Current schema version for persisted sessions.
 * @public
 */
export const PERSISTED_SESSION_SCHEMA_VERSION: 1 = 1;

/**
 * Schema version discriminator type.
 * @public
 */
export type PersistedSessionSchemaVersion = typeof PERSISTED_SESSION_SCHEMA_VERSION;

// ============================================================================
// Common Session Types
// ============================================================================

/**
 * Persisted session type discriminator.
 * @public
 */
export type PersistedSessionType = 'filling' | 'confection';

/**
 * All possible persisted session types.
 * @public
 */
export const allPersistedSessionTypes: ReadonlyArray<PersistedSessionType> = ['filling', 'confection'];

/**
 * Persisted session lifecycle state.
 * - `planning`: Session is being planned but not actively editing
 * - `active`: Session is actively being edited
 * - `committing`: Session is in the process of being committed
 * - `committed`: Session has been committed to a journal entry
 * - `abandoned`: Session was explicitly abandoned
 * @public
 */
export type PersistedSessionStatus = 'planning' | 'active' | 'committing' | 'committed' | 'abandoned';

/**
 * All possible persisted session statuses.
 * @public
 */
export const allPersistedSessionStatuses: ReadonlyArray<PersistedSessionStatus> = [
  'planning',
  'active',
  'committing',
  'committed',
  'abandoned'
];

/**
 * Destination collection configuration for persisting derived entities.
 * @public
 */
export interface ISessionDestinationEntity {
  /** Default collection ID from tool configuration */
  readonly defaultCollectionId?: CollectionId;
  /** User-selected override collection ID */
  readonly overrideCollectionId?: CollectionId;
}

// ============================================================================
// Serialized Editing History
// ============================================================================

/**
 * Serialized undo/redo history for any editable entity.
 * Captures the full editing state for restoration.
 * @typeParam T - The type of the state being tracked
 * @public
 */
export interface ISerializedEditingHistoryEntity<T> {
  /** Current editing state */
  readonly current: T;
  /** Original state when session started (for change detection) */
  readonly original: T;
  /** Undo stack - states that can be restored */
  readonly undoStack: ReadonlyArray<T>;
  /** Redo stack - states that were undone and can be reapplied */
  readonly redoStack: ReadonlyArray<T>;
}

// ============================================================================
// Base Persisted Session
// ============================================================================

/**
 * Common properties shared by all persisted session types.
 * @public
 */
export interface ISessionEntityBase {
  /** Base identifier within the collection (no collection prefix) */
  readonly baseId: BaseSessionId;
  /** Session type discriminator */
  readonly sessionType: PersistedSessionType;
  /** Current lifecycle status */
  readonly status: PersistedSessionStatus;
  /** ISO 8601 timestamp when session was created */
  readonly createdAt: string;
  /** ISO 8601 timestamp when session was last updated */
  readonly updatedAt: string;
  /** User-provided label for the session */
  readonly label?: string;
  /** Optional categorized notes */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
  /** Destination configuration for saving derived entities */
  readonly destination?: ISessionDestinationEntity;
}

// ============================================================================
// Filling Session
// ============================================================================

/**
 * Persisted filling editing session with full editing state.
 *
 * Contains the complete undo/redo history so the session can be
 * restored to its exact editing state.
 * @public
 */
export interface IFillingSessionEntity extends ISessionEntityBase {
  readonly sessionType: 'filling';
  /** Source filling version being edited */
  readonly sourceVersionId: FillingVersionId;
  /** Full editing history including undo/redo stacks */
  readonly history: ISerializedEditingHistoryEntity<IProducedFillingEntity>;
}

// ============================================================================
// Confection Session
// ============================================================================

/**
 * Persisted confection editing session with full editing state.
 *
 * Contains the complete undo/redo history so the session can be
 * restored to its exact editing state. References child filling
 * sessions by their persisted session IDs.
 *
 * @public
 */
export interface IConfectionSessionEntity extends ISessionEntityBase {
  readonly sessionType: 'confection';
  /** Confection type discriminator (for type-specific restoration) */
  readonly confectionType: ConfectionType;
  /** Source confection version being edited */
  readonly sourceVersionId: ConfectionVersionId;
  /** Full editing history including undo/redo stacks */
  readonly history: ISerializedEditingHistoryEntity<AnyProducedConfectionEntity>;
  /** Map of slot ID to child filling session ID */
  readonly childSessionIds: Readonly<Record<SlotId, SessionId>>;
}

// ============================================================================
// Discriminated Union
// ============================================================================

/**
 * Discriminated union of all persisted session types.
 * Use type guards to narrow to specific types.
 * @public
 */
export type AnySessionEntity = IFillingSessionEntity | IConfectionSessionEntity;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for {@link Entities.Session.IFillingSessionEntity | IFillingSessionEntity}.
 * @param session - Session to check
 * @returns True if the session is a filling session
 * @public
 */
export function isFillingSessionEntity(session: AnySessionEntity): session is IFillingSessionEntity {
  return session.sessionType === 'filling';
}

/**
 * Type guard for {@link Entities.Session.IConfectionSessionEntity | IConfectionSessionEntity}.
 * @param session - Session to check
 * @returns True if the session is a confection session
 * @public
 */
export function isConfectionSessionEntity(session: AnySessionEntity): session is IConfectionSessionEntity {
  return session.sessionType === 'confection';
}
