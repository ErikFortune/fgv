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
 * Converters for persisted session scratchpad model.
 * @packageDocumentation
 */

import { Converter, Converters } from '@fgv/ts-utils';

import { Converters as CommonConverters } from '../../common';
import {
  allPersistedSessionTypes,
  allPersistedSessionStatuses,
  AnyPersistedSession,
  IPersistedConfectionSession,
  IPersistedConfectionSessionProduction,
  IPersistedFillingSession,
  IPersistedSessionDestination,
  ISessionScratchpad,
  PersistedSessionStatus,
  PersistedSessionType,
  SESSION_SCRATCHPAD_SCHEMA_VERSION
} from './model';

// ============================================================================
// Basic Converters
// ============================================================================

/**
 * Converter for {@link PersistedSessionType}.
 * @public
 */
export const persistedSessionType: Converter<PersistedSessionType> =
  Converters.enumeratedValue(allPersistedSessionTypes);

/**
 * Converter for {@link PersistedSessionStatus}.
 * @public
 */
export const persistedSessionStatus: Converter<PersistedSessionStatus> =
  Converters.enumeratedValue(allPersistedSessionStatuses);

/**
 * Converter for {@link IPersistedSessionDestination}.
 * @public
 */
export const persistedSessionDestination: Converter<IPersistedSessionDestination> =
  Converters.object<IPersistedSessionDestination>({
    defaultCollectionId: CommonConverters.sourceId.optional(),
    overrideCollectionId: CommonConverters.sourceId.optional()
  });

export const persistedConfectionSessionProduction: Converter<IPersistedConfectionSessionProduction> =
  Converters.object<IPersistedConfectionSessionProduction>({
    moldId: CommonConverters.moldId.optional(),
    frames: Converters.number
      .withConstraint((n) => Number.isInteger(n) && n > 0, { description: 'must be a positive integer' })
      .optional()
  });

// ============================================================================
// Session Converters
// ============================================================================

/**
 * Converter for {@link IPersistedConfectionSession}.
 * @public
 */
export const persistedConfectionSession: Converter<IPersistedConfectionSession> =
  Converters.object<IPersistedConfectionSession>({
    sessionId: CommonConverters.sessionId,
    sessionType: Converters.literal('confection'),
    status: persistedSessionStatus,
    createdAt: Converters.string,
    updatedAt: Converters.string,
    label: Converters.string.optional(),
    destination: persistedSessionDestination.optional(),
    production: persistedConfectionSessionProduction.optional(),
    base: Converters.object({
      confectionId: CommonConverters.confectionId,
      versionSpec: CommonConverters.confectionVersionSpec
    })
  });

/**
 * Converter for {@link IPersistedFillingSession}.
 * @public
 */
export const persistedFillingSession: Converter<IPersistedFillingSession> =
  Converters.object<IPersistedFillingSession>({
    sessionId: CommonConverters.sessionId,
    sessionType: Converters.literal('filling'),
    status: persistedSessionStatus,
    createdAt: Converters.string,
    updatedAt: Converters.string,
    label: Converters.string.optional(),
    destination: persistedSessionDestination.optional(),
    base: Converters.object({
      fillingId: CommonConverters.fillingId,
      versionSpec: CommonConverters.fillingVersionSpec
    })
  });

/**
 * Converter for {@link AnyPersistedSession}.
 * @public
 */
export const anyPersistedSession: Converter<AnyPersistedSession> =
  Converters.discriminatedObject<AnyPersistedSession>('sessionType', {
    confection: persistedConfectionSession,
    filling: persistedFillingSession
  });

// ============================================================================
// Scratchpad Container Converter
// ============================================================================

/**
 * Converter for {@link ISessionScratchpad}.
 * @public
 */
export const sessionScratchpad: Converter<ISessionScratchpad> = Converters.object<ISessionScratchpad>({
  schemaVersion: Converters.literal(SESSION_SCRATCHPAD_SCHEMA_VERSION),
  updatedAt: Converters.string,
  sessions: Converters.recordOf(anyPersistedSession, {
    keyConverter: CommonConverters.sessionId
  }),
  activeSessionId: CommonConverters.sessionId.optional()
});
