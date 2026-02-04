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
  ConfectionVersionId,
  FillingVersionId,
  JournalBaseId,
  Measurement,
  Model as CommonModel
} from '../../common';
import { AnyConfectionVersionEntity, AnyProducedConfectionEntity, IConfectionYield } from '../confections';
import { IFillingRecipeVersionEntity, IProducedFillingEntity } from '../fillings';

/**
 * Types of journal entries.
 * @public
 */
export type JournalEntryType =
  | 'confection-production'
  | 'filling-production'
  | 'confection-edit'
  | 'filling-edit';

/**
 * All possible {@link Entities.Journal.JournalEntryType | journal entry types}.
 * @public
 */
export const allJournalEntryTypes: JournalEntryType[] = [
  'confection-production',
  'filling-production',
  'confection-edit',
  'filling-edit'
];

/**
 * Base interface for journal entries.
 * @public
 */
export interface IJournalEntryBase<TVersion, TVersionId> {
  /** Entry type discriminator */
  readonly type: JournalEntryType;
  /** Base identifier within collection (no collection prefix) */
  readonly baseId: JournalBaseId;
  /** Timestamp when this entry was created (ISO 8601 format) */
  readonly timestamp: string;
  /** Source version ID for indexing and lookup */
  readonly versionId: TVersionId;
  /** Full source recipe/confection at the time of the entry */
  readonly recipe: TVersion;
  /** Full updated version if modifications were made */
  readonly updated?: TVersion;
  /** ID of the updated version if it was saved */
  readonly updatedId?: TVersionId;
  /** Optional categorized notes about this entry */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
}

/**
 * Journal entry for filling recipe edits.
 * @public
 */
export interface IFillingEditJournalEntry
  extends IJournalEntryBase<IFillingRecipeVersionEntity, FillingVersionId> {
  readonly type: 'filling-edit';
}

/**
 * Journal entry for confection edits.
 * @public
 */
export interface IConfectionEditJournalEntry
  extends IJournalEntryBase<AnyConfectionVersionEntity, ConfectionVersionId> {
  readonly type: 'confection-edit';
}

/**
 * Journal entry for filling production sessions.
 * @public
 */
export interface IFillingProductionJournalEntry
  extends IJournalEntryBase<IFillingRecipeVersionEntity, FillingVersionId> {
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
export interface IConfectionProductionJournalEntry
  extends IJournalEntryBase<AnyConfectionVersionEntity, ConfectionVersionId> {
  readonly type: 'confection-production';
  /** Yield specification for this production run */
  readonly yield: IConfectionYield;
  /** Produced confection with resolved concrete choices */
  readonly produced: AnyProducedConfectionEntity;
}

// ============================================================================
// Journal Entry Union Type
// ============================================================================

/**
 * Discriminated union of all journal entry types.
 * Use type guards to narrow to specific types.
 * @public
 */
export type AnyJournalEntry =
  | IFillingEditJournalEntry
  | IConfectionEditJournalEntry
  | IFillingProductionJournalEntry
  | IConfectionProductionJournalEntry;

// ============================================================================
// Journal Entry Type Guards
// ============================================================================

/**
 * Type guard for IFillingEditJournalEntry
 * @param entry - Journal entry to check
 * @returns True if the entry is a filling edit journal entry
 * @public
 */
export function isFillingEditJournalEntry(entry: AnyJournalEntry): entry is IFillingEditJournalEntry {
  return entry.type === 'filling-edit';
}

/**
 * Type guard for IConfectionEditJournalEntry
 * @param entry - Journal entry to check
 * @returns True if the entry is a confection edit journal entry
 * @public
 */
export function isConfectionEditJournalEntry(entry: AnyJournalEntry): entry is IConfectionEditJournalEntry {
  return entry.type === 'confection-edit';
}

/**
 * Type guard for IFillingProductionJournalEntry
 * @param entry - Journal entry to check
 * @returns True if the entry is a filling production journal entry
 * @public
 */
export function isFillingProductionJournalEntry(
  entry: AnyJournalEntry
): entry is IFillingProductionJournalEntry {
  return entry.type === 'filling-production';
}

/**
 * Type guard for IConfectionProductionJournalEntry
 * @param entry - Journal entry to check
 * @returns True if the entry is a confection production journal entry
 * @public
 */
export function isConfectionProductionJournalEntry(
  entry: AnyJournalEntry
): entry is IConfectionProductionJournalEntry {
  return entry.type === 'confection-production';
}
