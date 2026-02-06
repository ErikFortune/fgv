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

import { Converters as CommonConverters, SlotId, SessionId } from '../../common';
import {
  anyProducedConfectionEntity as anyProducedConfectionConverter,
  producedFillingEntity as producedFillingConverter
} from '../journal/converters';
import { AnyProducedConfectionEntity } from '../confections';
import { IProducedFillingEntity } from '../fillings';
import {
  allPersistedSessionStatuses,
  allPersistedSessionTypes,
  AnySessionEntity,
  IConfectionSessionEntity,
  IFillingSessionEntity,
  ISessionDestinationEntity,
  ISerializedEditingHistoryEntity,
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
 * Converter for {@link Entities.Session.ISessionDestinationEntity | ISessionDestinationEntity}.
 * @public
 */
export const persistedSessionDestinationEntity: Converter<ISessionDestinationEntity> =
  Converters.object<ISessionDestinationEntity>({
    defaultCollectionId: CommonConverters.collectionId.optional(),
    overrideCollectionId: CommonConverters.collectionId.optional()
  });

// ============================================================================
// Serialized History Converters
// ============================================================================

/**
 * Converter for serialized filling editing history.
 * @public
 */
export const serializedFillingHistoryEntity: Converter<
  ISerializedEditingHistoryEntity<IProducedFillingEntity>
> = Converters.object<ISerializedEditingHistoryEntity<IProducedFillingEntity>>({
  current: producedFillingConverter,
  original: producedFillingConverter,
  undoStack: Converters.arrayOf(producedFillingConverter),
  redoStack: Converters.arrayOf(producedFillingConverter)
});

/**
 * Converter for serialized confection editing history.
 * @public
 */
export const serializedConfectionHistoryEntity: Converter<
  ISerializedEditingHistoryEntity<AnyProducedConfectionEntity>
> = Converters.object<ISerializedEditingHistoryEntity<AnyProducedConfectionEntity>>({
  current: anyProducedConfectionConverter,
  original: anyProducedConfectionConverter,
  undoStack: Converters.arrayOf(anyProducedConfectionConverter),
  redoStack: Converters.arrayOf(anyProducedConfectionConverter)
});

/**
 * Converter for child session IDs mapping (SlotId to PersistedSessionId).
 * @public
 */
export const childSessionIds: Converter<Readonly<Record<SlotId, SessionId>>> = Converters.recordOf(
  CommonConverters.sessionId,
  { keyConverter: CommonConverters.slotId }
) as Converter<Readonly<Record<SlotId, SessionId>>>;

// ============================================================================
// Session Converters
// ============================================================================

/**
 * Converter for {@link Entities.Session.IFillingSessionEntity | IFillingSessionEntity}.
 * @public
 */
export const fillingSessionEntity: Converter<IFillingSessionEntity> =
  Converters.object<IFillingSessionEntity>({
    baseId: CommonConverters.baseSessionId,
    sessionType: Converters.literal('filling'),
    status: persistedSessionStatus,
    createdAt: Converters.string,
    updatedAt: Converters.string,
    label: Converters.string.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional(),
    destination: persistedSessionDestinationEntity.optional(),
    sourceVariationId: CommonConverters.fillingRecipeVariationId,
    history: serializedFillingHistoryEntity
  });

/**
 * Converter for {@link Entities.Session.IConfectionSessionEntity | IConfectionSessionEntity}.
 * @public
 */
export const confectionSessionEntity: Converter<IConfectionSessionEntity> =
  Converters.object<IConfectionSessionEntity>({
    baseId: CommonConverters.baseSessionId,
    sessionType: Converters.literal('confection'),
    status: persistedSessionStatus,
    createdAt: Converters.string,
    updatedAt: Converters.string,
    label: Converters.string.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional(),
    destination: persistedSessionDestinationEntity.optional(),
    confectionType: CommonConverters.confectionType,
    sourceVariationId: CommonConverters.confectionRecipeVariationId,
    history: serializedConfectionHistoryEntity,
    childSessionIds
  });

/**
 * Converter for {@link Entities.Session.AnySessionEntity | AnySessionEntity}.
 * Uses discriminated object pattern on `sessionType` field.
 * @public
 */
export const anySessionEntity: Converter<AnySessionEntity> = Converters.discriminatedObject<AnySessionEntity>(
  'sessionType',
  {
    filling: fillingSessionEntity,
    confection: confectionSessionEntity
  }
);
