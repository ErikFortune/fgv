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
 * Journal model types for tracking cooking sessions
 * @packageDocumentation
 */

import {
  ConfectionRecipeVariationId,
  FillingRecipeVariationId,
  BaseJournalId,
  GroupName,
  Measurement,
  Model as CommonModel
} from '../../common';
import {
  AnyProducedConfectionEntity,
  ConfectionVariationType,
  IBarTruffleRecipeVariationEntity,
  IConfectionYield,
  IMoldedBonBonRecipeVariationEntity,
  IRolledTruffleRecipeVariationEntity
} from '../confections';
import { IFillingRecipeVariationEntity, IProducedFillingEntity } from '../fillings';

// ============================================================================
// Journal Confection Variation Types (with variationType discriminator)
// ============================================================================

/**
 * Molded bonbon variation snapshot for journal entries.
 * Extends the entity interface with a `variationType` discriminator.
 * @public
 */
export interface IMoldedBonBonJournalVariation extends IMoldedBonBonRecipeVariationEntity {
  readonly variationType: 'molded-bonbon';
}

/**
 * Bar truffle variation snapshot for journal entries.
 * Extends the entity interface with a `variationType` discriminator.
 * @public
 */
export interface IBarTruffleJournalVariation extends IBarTruffleRecipeVariationEntity {
  readonly variationType: 'bar-truffle';
}

/**
 * Rolled truffle variation snapshot for journal entries.
 * Extends the entity interface with a `variationType` discriminator.
 * @public
 */
export interface IRolledTruffleJournalVariation extends IRolledTruffleRecipeVariationEntity {
  readonly variationType: 'rolled-truffle';
}

/**
 * Union of all journal confection variation snapshots.
 * All members carry a `variationType` discriminator for safe parsing.
 * @public
 */
export type AnyJournalConfectionVariation =
  | IMoldedBonBonJournalVariation
  | IBarTruffleJournalVariation
  | IRolledTruffleJournalVariation;

/**
 * All possible {@link ConfectionVariationType} values.
 * @public
 */
export const allConfectionVariationTypes: ConfectionVariationType[] = [
  'molded-bonbon',
  'bar-truffle',
  'rolled-truffle'
];

/**
 * Types of journal entries.
 * @public
 */
export type JournalEntryType =
  | 'confection-production'
  | 'filling-production'
  | 'confection-edit'
  | 'filling-edit'
  | 'group-notes';

/**
 * All possible {@link Entities.Journal.JournalEntryType | journal entry types}.
 * @public
 */
export const allJournalEntryTypes: JournalEntryType[] = [
  'confection-production',
  'filling-production',
  'confection-edit',
  'filling-edit',
  'group-notes'
];

/**
 * Base interface for journal entries.
 * @public
 */
export interface IJournalEntryEntityBase<TVariation, TVariationId> {
  /** Entry type discriminator */
  readonly type: JournalEntryType;
  /** Base identifier within collection (no collection prefix) */
  readonly baseId: BaseJournalId;
  /** Timestamp when this entry was created (ISO 8601 format) */
  readonly timestamp: string;
  /** Source variation ID for indexing and lookup */
  readonly variationId: TVariationId;
  /** Full source recipe/confection at the time of the entry */
  readonly recipe: TVariation;
  /** Full updated variation if modifications were made */
  readonly updated?: TVariation;
  /** ID of the updated variation if it was saved */
  readonly updatedId?: TVariationId;
  /** Optional categorized notes about this entry */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
}

/**
 * Journal entry for filling recipe edits.
 * @public
 */
export interface IFillingEditJournalEntryEntity
  extends IJournalEntryEntityBase<IFillingRecipeVariationEntity, FillingRecipeVariationId> {
  readonly type: 'filling-edit';
}

/**
 * Journal entry for confection edits.
 * @public
 */
export interface IConfectionEditJournalEntryEntity
  extends IJournalEntryEntityBase<AnyJournalConfectionVariation, ConfectionRecipeVariationId> {
  readonly type: 'confection-edit';
}

/**
 * Journal entry for filling production sessions.
 * @public
 */
export interface IFillingProductionJournalEntryEntity
  extends IJournalEntryEntityBase<IFillingRecipeVariationEntity, FillingRecipeVariationId> {
  readonly type: 'filling-production';
  /** Total yield weight of this production run */
  readonly yield: Measurement;
  /** Produced filling with resolved concrete choices */
  readonly produced: IProducedFillingEntity;
}

/**
 * Journal entry for confection production sessions.
 * @public
 */
export interface IConfectionProductionJournalEntryEntity
  extends IJournalEntryEntityBase<AnyJournalConfectionVariation, ConfectionRecipeVariationId> {
  readonly type: 'confection-production';
  /** Yield specification for this production run */
  readonly yield: IConfectionYield;
  /** Produced confection with resolved concrete choices */
  readonly produced: AnyProducedConfectionEntity;
}

/**
 * Journal entry for session group metadata and notes.
 * Used to record notes about a group of related sessions.
 * @public
 */
export interface IGroupNotesJournalEntryEntity {
  /** Entry type discriminator */
  readonly type: 'group-notes';
  /** Base identifier within collection (no collection prefix) */
  readonly baseId: BaseJournalId;
  /** Timestamp when this entry was created (ISO 8601 format) */
  readonly timestamp: string;
  /** Group identifier (matches session group field) */
  readonly group: GroupName;
  /** Optional label for the group */
  readonly label?: string;
  /** Optional categorized notes about this group */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
}

// ============================================================================
// Journal Entry Union Type
// ============================================================================

/**
 * Discriminated union of recipe-based journal entry types.
 * These entries all extend {@link IJournalEntryEntityBase} and have variationId/updatedId fields.
 * @public
 */
export type AnyRecipeJournalEntryEntity =
  | IFillingEditJournalEntryEntity
  | IConfectionEditJournalEntryEntity
  | IFillingProductionJournalEntryEntity
  | IConfectionProductionJournalEntryEntity;

/**
 * Discriminated union of all journal entry types.
 * Use type guards to narrow to specific types.
 * @public
 */
export type AnyJournalEntryEntity = AnyRecipeJournalEntryEntity | IGroupNotesJournalEntryEntity;

// ============================================================================
// Journal Entry Type Guards
// ============================================================================

/**
 * Type guard for {@link Entities.Journal.IFillingEditJournalEntryEntity | IFillingEditJournalEntryEntity}.
 * @param entry - Journal entry to check
 * @returns True if the entry is a filling edit journal entry
 * @public
 */
export function isFillingEditJournalEntryEntity(
  entry: AnyJournalEntryEntity
): entry is IFillingEditJournalEntryEntity {
  return entry.type === 'filling-edit';
}

/**
 * Type guard for {@link Entities.Journal.IConfectionEditJournalEntryEntity | IConfectionEditJournalEntryEntity}.
 * @param entry - Journal entry to check
 * @returns True if the entry is a confection edit journal entry
 * @public
 */
export function isConfectionEditJournalEntryEntity(
  entry: AnyJournalEntryEntity
): entry is IConfectionEditJournalEntryEntity {
  return entry.type === 'confection-edit';
}

/**
 * Type guard for {@link Entities.Journal.IFillingProductionJournalEntryEntity | IFillingProductionJournalEntryEntity}.
 * @param entry - Journal entry to check
 * @returns True if the entry is a filling production journal entry
 * @public
 */
export function isFillingProductionJournalEntryEntity(
  entry: AnyJournalEntryEntity
): entry is IFillingProductionJournalEntryEntity {
  return entry.type === 'filling-production';
}

/**
 * Type guard for {@link Entities.Journal.IConfectionProductionJournalEntryEntity | IConfectionProductionJournalEntryEntity}.
 * @param entry - Journal entry to check
 * @returns True if the entry is a confection production journal entry
 * @public
 */
export function isConfectionProductionJournalEntryEntity(
  entry: AnyJournalEntryEntity
): entry is IConfectionProductionJournalEntryEntity {
  return entry.type === 'confection-production';
}

/**
 * Type guard for {@link Entities.Journal.IGroupNotesJournalEntryEntity | IGroupNotesJournalEntryEntity}.
 * @param entry - Journal entry to check
 * @returns True if the entry is a group notes journal entry
 * @public
 */
export function isGroupNotesJournalEntryEntity(
  entry: AnyJournalEntryEntity
): entry is IGroupNotesJournalEntryEntity {
  return entry.type === 'group-notes';
}
