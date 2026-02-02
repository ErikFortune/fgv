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
 * Converters for persisted session types
 * @packageDocumentation
 */

import { Converter, Converters } from '@fgv/ts-utils';

import { Converters as CommonConverters, SlotId, PersistedSessionId } from '../../common';
import {
  anyProducedConfection as anyProducedConfectionConverter,
  producedFilling as producedFillingConverter
} from '../journal/converters';
import { AnyProducedConfection } from '../confections';
import { IProducedFilling } from '../fillings';
import {
  allPersistedSessionStatuses,
  allPersistedSessionTypes,
  AnyPersistedSession,
  IPersistedConfectionSession,
  IPersistedFillingSession,
  IPersistedSessionDestination,
  ISerializedEditingHistory,
  PersistedSessionStatus,
  PersistedSessionType
} from './model';

// ============================================================================
// Enumeration Converters
// ============================================================================

/**
 * Converter for {@link Entities.Session.PersistedSessionType | PersistedSessionType}.
 * @public
 */
export const persistedSessionType: Converter<PersistedSessionType> =
  Converters.enumeratedValue(allPersistedSessionTypes);

/**
 * Converter for {@link Entities.Session.PersistedSessionStatus | PersistedSessionStatus}.
 * @public
 */
export const persistedSessionStatus: Converter<PersistedSessionStatus> =
  Converters.enumeratedValue(allPersistedSessionStatuses);

// ============================================================================
// Destination Converter
// ============================================================================

/**
 * Converter for {@link Entities.Session.IPersistedSessionDestination | IPersistedSessionDestination}.
 * @public
 */
export const persistedSessionDestination: Converter<IPersistedSessionDestination> =
  Converters.object<IPersistedSessionDestination>({
    defaultCollectionId: CommonConverters.sourceId.optional(),
    overrideCollectionId: CommonConverters.sourceId.optional()
  });

// ============================================================================
// Serialized History Converters
// ============================================================================

/**
 * Converter for serialized filling editing history.
 * @public
 */
export const serializedFillingHistory: Converter<ISerializedEditingHistory<IProducedFilling>> =
  Converters.object<ISerializedEditingHistory<IProducedFilling>>({
    current: producedFillingConverter,
    original: producedFillingConverter,
    undoStack: Converters.arrayOf(producedFillingConverter),
    redoStack: Converters.arrayOf(producedFillingConverter)
  });

/**
 * Converter for serialized confection editing history.
 * @public
 */
export const serializedConfectionHistory: Converter<ISerializedEditingHistory<AnyProducedConfection>> =
  Converters.object<ISerializedEditingHistory<AnyProducedConfection>>({
    current: anyProducedConfectionConverter,
    original: anyProducedConfectionConverter,
    undoStack: Converters.arrayOf(anyProducedConfectionConverter),
    redoStack: Converters.arrayOf(anyProducedConfectionConverter)
  });

// ============================================================================
// Confection Production Converter
// ============================================================================

// ============================================================================
// Child Session IDs Converter
// ============================================================================

/**
 * Converter for child session IDs mapping (SlotId to PersistedSessionId).
 * @public
 */
export const childSessionIds: Converter<Readonly<Record<SlotId, PersistedSessionId>>> = Converters.recordOf(
  CommonConverters.persistedSessionId,
  { keyConverter: CommonConverters.slotId }
) as Converter<Readonly<Record<SlotId, PersistedSessionId>>>;

// ============================================================================
// Session Converters
// ============================================================================

/**
 * Converter for {@link Entities.Session.IPersistedFillingSession | IPersistedFillingSession}.
 * @public
 */
export const persistedFillingSession: Converter<IPersistedFillingSession> =
  Converters.object<IPersistedFillingSession>({
    baseId: CommonConverters.sessionBaseId,
    sessionType: Converters.literal('filling'),
    status: persistedSessionStatus,
    createdAt: Converters.string,
    updatedAt: Converters.string,
    label: Converters.string.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional(),
    destination: persistedSessionDestination.optional(),
    sourceVersionId: CommonConverters.fillingVersionId,
    history: serializedFillingHistory
  });

/**
 * Converter for {@link Entities.Session.IPersistedConfectionSession | IPersistedConfectionSession}.
 * @public
 */
export const persistedConfectionSession: Converter<IPersistedConfectionSession> =
  Converters.object<IPersistedConfectionSession>({
    baseId: CommonConverters.sessionBaseId,
    sessionType: Converters.literal('confection'),
    status: persistedSessionStatus,
    createdAt: Converters.string,
    updatedAt: Converters.string,
    label: Converters.string.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional(),
    destination: persistedSessionDestination.optional(),
    confectionType: CommonConverters.confectionType,
    sourceVersionId: CommonConverters.confectionVersionId,
    history: serializedConfectionHistory,
    childSessionIds
  });

/**
 * Converter for {@link Entities.Session.AnyPersistedSession | AnyPersistedSession}.
 * Uses discriminated object pattern on `sessionType` field.
 * @public
 */
export const anyPersistedSession: Converter<AnyPersistedSession> =
  Converters.discriminatedObject<AnyPersistedSession>('sessionType', {
    filling: persistedFillingSession,
    confection: persistedConfectionSession
  });
