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
 * Persisted session scratchpad model.
 *
 * This module defines the schema for sessions that are persisted (e.g. to localStorage)
 * while they are "live" in the UI. Persistence implementation is left to host apps.
 *
 * @packageDocumentation
 */

import {
  ConfectionId,
  ConfectionVersionSpec,
  FillingId,
  FillingVersionSpec,
  SessionId,
  SourceId
} from '../../common';

// ============================================================================
// Schema Version
// ============================================================================

/**
 * Current schema version for the persisted session scratchpad.
 * @public
 */
export const SESSION_SCRATCHPAD_SCHEMA_VERSION: 1 = 1;

/**
 * Schema version discriminator type.
 * @public
 */
export type SessionScratchpadSchemaVersion = typeof SESSION_SCRATCHPAD_SCHEMA_VERSION;

// ============================================================================
// Common Session Types
// ============================================================================

/**
 * Persisted session type.
 * @public
 */
export type PersistedSessionType = 'confection' | 'filling';

/**
 * All possible persisted session types.
 * @public
 */
export const allPersistedSessionTypes: ReadonlyArray<PersistedSessionType> = ['confection', 'filling'];

/**
 * Persisted session lifecycle state.
 * @public
 */
export type PersistedSessionStatus = 'active' | 'committing' | 'committed' | 'abandoned';

/**
 * All possible persisted session statuses.
 * @public
 */
export const allPersistedSessionStatuses: ReadonlyArray<PersistedSessionStatus> = [
  'active',
  'committing',
  'committed',
  'abandoned'
];

/**
 * Destination collection configuration for persisting any derived entities.
 *
 * The UI can prefill `defaultCollectionId` based on tool defaults, and store an
 * optional `overrideCollectionId` when the user picks something else.
 *
 * @public
 */
export interface IPersistedSessionDestination {
  readonly defaultCollectionId?: SourceId;
  readonly overrideCollectionId?: SourceId;
}

/**
 * Common properties shared by all persisted session types.
 * @public
 */
export interface IPersistedSessionBase {
  readonly sessionId: SessionId;
  readonly sessionType: PersistedSessionType;
  readonly status: PersistedSessionStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly label?: string;
  readonly destination?: IPersistedSessionDestination;
}

// ============================================================================
// Confection Session
// ============================================================================

/**
 * Base pointer for a confection production session.
 * @public
 */
export interface IPersistedConfectionSessionBasePointer {
  readonly confectionId: ConfectionId;
  readonly versionSpec: ConfectionVersionSpec;
}

/**
 * Persisted confection session.
 * @public
 */
export interface IPersistedConfectionSession extends IPersistedSessionBase {
  readonly sessionType: 'confection';
  readonly base: IPersistedConfectionSessionBasePointer;
}

// ============================================================================
// Filling Session
// ============================================================================

/**
 * Base pointer for a filling production session.
 * @public
 */
export interface IPersistedFillingSessionBasePointer {
  readonly fillingId: FillingId;
  readonly versionSpec: FillingVersionSpec;
}

/**
 * Persisted filling session.
 * @public
 */
export interface IPersistedFillingSession extends IPersistedSessionBase {
  readonly sessionType: 'filling';
  readonly base: IPersistedFillingSessionBasePointer;
}

// ============================================================================
// Discriminated Union
// ============================================================================

/**
 * Any persisted session type.
 * @public
 */
export type AnyPersistedSession = IPersistedConfectionSession | IPersistedFillingSession;

// ============================================================================
// Scratchpad Container
// ============================================================================

/**
 * Root persisted scratchpad container.
 *
 * Host apps typically persist this whole object under a single storage key.
 *
 * @public
 */
export interface ISessionScratchpad {
  readonly schemaVersion: SessionScratchpadSchemaVersion;
  readonly updatedAt: string;
  readonly sessions: Record<SessionId, AnyPersistedSession>;
  readonly activeSessionId?: SessionId;
}
