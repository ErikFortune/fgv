// Copyright (c) 2024 Erik Fortune
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
 * In-place validators for branded types
 *
 * These validators perform IN-PLACE validation only:
 * - String input results in validated string output (same identity)
 * - Object input results in validated object output (same identity)
 *
 * Use these when you need to validate that a value is ALREADY the correct type.
 * For conversion between representations (e.g., object to string), use the
 * Converters in converters.ts instead.
 *
 * @packageDocumentation
 */

import { Validators } from '@fgv/ts-utils';
import type { Validator } from '@fgv/ts-utils';

import {
  BaseConfectionId,
  BaseFillingId,
  BaseIngredientId,
  BaseMoldId,
  BaseProcedureId,
  BaseTaskId,
  ConfectionId,
  ConfectionVersionId,
  ConfectionVersionSpec,
  FillingId,
  FillingVersionId,
  FillingVersionSpec,
  IngredientId,
  BaseJournalId,
  JournalId,
  MoldId,
  SessionId,
  ProcedureId,
  BaseSessionId,
  CollectionId,
  TaskId
} from './ids';
import { ID_SEPARATOR, VERSION_ID_SEPARATOR } from './model';

import {
  isValidBaseConfectionId,
  isValidBaseFillingId,
  isValidBaseIngredientId,
  isValidBaseMoldId,
  isValidBaseProcedureId,
  isValidBaseTaskId,
  isValidConfectionVersionSpec,
  isValidFillingVersionSpec,
  isValidBaseJournalId,
  isValidBaseSessionId,
  isValidCollectionId
} from './validation';

// ============================================================================
// Base ID Validators
// ============================================================================

/**
 * In-place `Validator` for {@link CollectionId | CollectionId}.
 * @public
 */
export const collectionId: Validator<CollectionId> = Validators.isA<CollectionId>(
  'CollectionId',
  isValidCollectionId
);

/**
 * In-place `Validator` for {@link BaseIngredientId | BaseIngredientId}.
 * @public
 */
export const baseIngredientId: Validator<BaseIngredientId> = Validators.isA<BaseIngredientId>(
  'BaseIngredientId',
  isValidBaseIngredientId
);

/**
 * In-place `Validator` for {@link BaseFillingId | BaseFillingId}.
 * @public
 */
export const baseFillingId: Validator<BaseFillingId> = Validators.isA<BaseFillingId>(
  'BaseFillingId',
  isValidBaseFillingId
);

/**
 * In-place `Validator` for {@link BaseMoldId | BaseMoldId}.
 * @public
 */
export const baseMoldId: Validator<BaseMoldId> = Validators.isA<BaseMoldId>('BaseMoldId', isValidBaseMoldId);

/**
 * In-place `Validator` for {@link BaseProcedureId | BaseProcedureId}.
 * @public
 */
export const baseProcedureId: Validator<BaseProcedureId> = Validators.isA<BaseProcedureId>(
  'BaseProcedureId',
  isValidBaseProcedureId
);

/**
 * In-place `Validator` for {@link BaseTaskId | BaseTaskId}.
 * @public
 */
export const baseTaskId: Validator<BaseTaskId> = Validators.isA<BaseTaskId>('BaseTaskId', isValidBaseTaskId);

/**
 * In-place `Validator` for {@link BaseConfectionId | BaseConfectionId}.
 * @public
 */
export const baseConfectionId: Validator<BaseConfectionId> = Validators.isA<BaseConfectionId>(
  'BaseConfectionId',
  isValidBaseConfectionId
);

/**
 * In-place `Validator` for {@link BaseJournalId | BaseJournalId}.
 * @public
 */
export const baseJournalId: Validator<BaseJournalId> = Validators.isA<BaseJournalId>(
  'JournalBaseId',
  isValidBaseJournalId
);

/**
 * In-place `Validator` for {@link BaseSessionId | BaseSessionId}.
 * @public
 */
export const baseSessionId: Validator<BaseSessionId> = Validators.isA<BaseSessionId>(
  'BaseSessionId',
  isValidBaseSessionId
);

// ============================================================================
// Composite ID Validators
// ============================================================================

/**
 * In-place `Validator` for {@link IngredientId | IngredientId} (composite string).
 * @public
 */
export const ingredientId: Validator<IngredientId> = Validators.compositeId<
  IngredientId,
  CollectionId,
  BaseIngredientId
>({
  collectionId: collectionId,
  separator: ID_SEPARATOR,
  itemId: baseIngredientId
});

/**
 * In-place `Validator` for {@link FillingId | FillingId} (composite string).
 * @public
 */
export const fillingId: Validator<FillingId> = Validators.compositeId<FillingId, CollectionId, BaseFillingId>(
  {
    collectionId: collectionId,
    separator: ID_SEPARATOR,
    itemId: baseFillingId
  }
);

/**
 * In-place `Validator` for {@link MoldId | MoldId} (composite string).
 * @public
 */
export const moldId: Validator<MoldId> = Validators.compositeId<MoldId, CollectionId, BaseMoldId>({
  collectionId: collectionId,
  separator: ID_SEPARATOR,
  itemId: baseMoldId
});

/**
 * In-place `Validator` for {@link ProcedureId | ProcedureId} (composite string).
 * @public
 */
export const procedureId: Validator<ProcedureId> = Validators.compositeId<
  ProcedureId,
  CollectionId,
  BaseProcedureId
>({
  collectionId: collectionId,
  separator: ID_SEPARATOR,
  itemId: baseProcedureId
});

/**
 * In-place `Validator` for {@link TaskId | TaskId} (composite string).
 * @public
 */
export const taskId: Validator<TaskId> = Validators.compositeId<TaskId, CollectionId, BaseTaskId>({
  collectionId: collectionId,
  separator: ID_SEPARATOR,
  itemId: baseTaskId
});

/**
 * In-place `Validator` for {@link ConfectionId | ConfectionId} (composite string).
 * @public
 */
export const confectionId: Validator<ConfectionId> = Validators.compositeId<
  ConfectionId,
  CollectionId,
  BaseConfectionId
>({
  collectionId: collectionId,
  separator: ID_SEPARATOR,
  itemId: baseConfectionId
});

/**
 * In-place `Validator` for {@link JournalId | JournalId} (composite string).
 * @public
 */
export const journalId: Validator<JournalId> = Validators.compositeId<JournalId, CollectionId, BaseJournalId>(
  {
    collectionId: collectionId,
    separator: ID_SEPARATOR,
    itemId: baseJournalId
  }
);

/**
 * In-place `Validator` for {@link SessionId | PersistedSessionId} (composite string).
 * @public
 */
export const sessionId: Validator<SessionId> = Validators.compositeId<SessionId, CollectionId, BaseSessionId>(
  {
    collectionId: collectionId,
    separator: ID_SEPARATOR,
    itemId: baseSessionId
  }
);

// ============================================================================
// Version Spec Validators
// ============================================================================

/**
 * In-place `Validator` for {@link FillingVersionSpec | FillingVersionSpec}.
 * @public
 */
export const fillingVersionSpec: Validator<FillingVersionSpec> = Validators.isA<FillingVersionSpec>(
  'FillingVersionSpec',
  isValidFillingVersionSpec
);

/**
 * In-place `Validator` for {@link ConfectionVersionSpec | ConfectionVersionSpec}.
 * @public
 */
export const confectionVersionSpec: Validator<ConfectionVersionSpec> = Validators.isA<ConfectionVersionSpec>(
  'ConfectionVersionSpec',
  isValidConfectionVersionSpec
);

// ============================================================================
// Version ID Validators (Composite)
// ============================================================================

/**
 * In-place `Validator` for {@link FillingVersionId | FillingVersionId} (composite string).
 * @public
 */
export const fillingVersionId: Validator<FillingVersionId> = Validators.compositeId<
  FillingVersionId,
  FillingId,
  FillingVersionSpec
>({
  collectionId: fillingId,
  separator: VERSION_ID_SEPARATOR,
  itemId: fillingVersionSpec
});

/**
 * In-place `Validator` for {@link ConfectionVersionId | ConfectionVersionId} (composite string).
 * @public
 */
export const confectionVersionId: Validator<ConfectionVersionId> = Validators.compositeId<
  ConfectionVersionId,
  ConfectionId,
  ConfectionVersionSpec
>({
  collectionId: confectionId,
  separator: VERSION_ID_SEPARATOR,
  itemId: confectionVersionSpec
});
