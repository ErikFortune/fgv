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
  Grams,
  IngredientId,
  JournalId,
  MoldId,
  ProcedureId,
  RecipeId,
  RecipeVersionId
} from '../common';

// ============================================================================
// Journal Entry Types
// ============================================================================

/**
 * Types of events that can be recorded in a cooking journal
 * @public
 */
export type JournalEventType =
  | 'ingredient-add'
  | 'ingredient-remove'
  | 'ingredient-modify'
  | 'ingredient-substitute'
  | 'scale-adjust'
  | 'note';

/**
 * All possible recipe journal event types
 * @public
 */
export const allJournalEventTypes: JournalEventType[] = [
  'ingredient-add',
  'ingredient-remove',
  'ingredient-modify',
  'ingredient-substitute',
  'scale-adjust',
  'note'
];

// ============================================================================
// Confection Journal Entry Types
// ============================================================================

/**
 * Types of events that can be recorded in a confection editing journal
 * @public
 */
export type ConfectionJournalEventType =
  | 'filling-select'
  | 'mold-select'
  | 'chocolate-select'
  | 'yield-modify'
  | 'procedure-select'
  | 'coating-select'
  | 'note';

/**
 * All possible confection journal event types
 * @public
 */
export const allConfectionJournalEventTypes: ConfectionJournalEventType[] = [
  'filling-select',
  'mold-select',
  'chocolate-select',
  'yield-modify',
  'procedure-select',
  'coating-select',
  'note'
];

/**
 * Role of a chocolate selection in a confection
 * @public
 */
export type ChocolateRole = 'shell' | 'enrobing' | 'seal' | 'decoration';

/**
 * All possible chocolate roles
 * @public
 */
export const allChocolateRoles: ChocolateRole[] = ['shell', 'enrobing', 'seal', 'decoration'];

/**
 * A single event entry within a cooking journal.
 * Records what actually happened during a cooking session.
 * @public
 */
export interface IJournalEntry {
  /**
   * Timestamp of the event (ISO 8601 format)
   */
  readonly timestamp: string;

  /**
   * Type of journal event
   */
  readonly eventType: JournalEventType;

  /**
   * The ingredient involved in this event (for ingredient-related events)
   */
  readonly ingredientId?: IngredientId;

  /**
   * Original amount before the change (for modify events)
   */
  readonly originalAmount?: Grams;

  /**
   * New amount after the change (for add/modify events)
   */
  readonly newAmount?: Grams;

  /**
   * Substitute ingredient ID (for substitute events)
   */
  readonly substituteIngredientId?: IngredientId;

  /**
   * Text content (for note events or additional context)
   */
  readonly text?: string;
}

/**
 * A single event entry within a confection editing journal.
 * Records what selections and modifications were made during a confection editing session.
 * @public
 */
export interface IConfectionJournalEntry {
  /**
   * Timestamp of the event (ISO 8601 format)
   */
  readonly timestamp: string;

  /**
   * Type of confection journal event
   */
  readonly eventType: ConfectionJournalEventType;

  // ---- filling-select event fields ----

  /**
   * The filling recipe ID selected (for filling-select events)
   */
  readonly fillingRecipeId?: RecipeId;

  /**
   * The previous filling recipe ID (for filling-select events)
   */
  readonly previousFillingRecipeId?: RecipeId;

  /**
   * The filling ingredient ID selected (for filling-select events with ingredient fillings)
   */
  readonly fillingIngredientId?: IngredientId;

  /**
   * The previous filling ingredient ID (for filling-select events)
   */
  readonly previousFillingIngredientId?: IngredientId;

  // ---- mold-select event fields ----

  /**
   * The mold ID selected (for mold-select events)
   */
  readonly moldId?: MoldId;

  /**
   * The previous mold ID (for mold-select events)
   */
  readonly previousMoldId?: MoldId;

  // ---- chocolate-select event fields ----

  /**
   * The role of the chocolate being selected (for chocolate-select events)
   */
  readonly chocolateRole?: ChocolateRole;

  /**
   * The ingredient ID of the selected chocolate (for chocolate-select events)
   */
  readonly ingredientId?: IngredientId;

  /**
   * The previous ingredient ID (for chocolate-select events)
   */
  readonly previousIngredientId?: IngredientId;

  // ---- yield-modify event fields ----

  /**
   * The new yield count (for yield-modify events)
   */
  readonly newYieldCount?: number;

  /**
   * The previous yield count (for yield-modify events)
   */
  readonly previousYieldCount?: number;

  /**
   * The new weight per piece in grams (for yield-modify events)
   */
  readonly newWeightPerPiece?: Grams;

  /**
   * The previous weight per piece in grams (for yield-modify events)
   */
  readonly previousWeightPerPiece?: Grams;

  // ---- procedure-select event fields ----

  /**
   * The procedure ID selected (for procedure-select events)
   */
  readonly procedureId?: ProcedureId;

  /**
   * The previous procedure ID (for procedure-select events)
   */
  readonly previousProcedureId?: ProcedureId;

  // ---- coating-select event fields ----

  /**
   * The coating ingredient ID selected (for coating-select events)
   */
  readonly coatingIngredientId?: IngredientId;

  /**
   * The previous coating ingredient ID (for coating-select events)
   */
  readonly previousCoatingIngredientId?: IngredientId;

  // ---- note event fields ----

  /**
   * Text content (for note events or additional context)
   */
  readonly text?: string;
}

// ============================================================================
// Journal Type Discriminator
// ============================================================================

/**
 * Discriminator for journal record types
 * @public
 */
export type JournalType = 'recipe' | 'confection';

/**
 * All possible journal types
 * @public
 */
export const allJournalTypes: JournalType[] = ['recipe', 'confection'];

// ============================================================================
// Journal Record
// ============================================================================

/**
 * A complete journal record for a recipe cooking session.
 * Tracks what recipe version was used, how it was scaled, and what
 * modifications were made during the session.
 * @public
 */
export interface IRecipeJournalRecord {
  /**
   * Journal type discriminator
   */
  readonly journalType: 'recipe';

  /**
   * Unique identifier for this journal record
   */
  readonly journalId: JournalId;

  /**
   * Recipe version ID that was used (format: "sourceId.recipeId\@versionSpec")
   */
  readonly recipeVersionId: RecipeVersionId;

  /**
   * Date of the cooking session (ISO 8601 format)
   */
  readonly date: string;

  /**
   * Target weight for this production run
   */
  readonly targetWeight: Grams;

  /**
   * Scale factor applied (computed from version baseWeight and targetWeight)
   */
  readonly scaleFactor: number;

  /**
   * Optional notes about this cooking session
   */
  readonly notes?: string;

  /**
   * If modifications during this session created a new version,
   * this references that new version
   */
  readonly modifiedVersionId?: RecipeVersionId;

  /**
   * Optional detailed journal entries recording what actually happened.
   * When present, provides a complete audit trail of the cooking session.
   */
  readonly entries?: ReadonlyArray<IJournalEntry>;
}

/**
 * A complete journal record for a confection production session.
 * Tracks what confection version was used, what selections were made,
 * and what modifications occurred during the session.
 * @public
 */
export interface IConfectionJournalRecord {
  /**
   * Journal type discriminator
   */
  readonly journalType: 'confection';

  /**
   * Unique identifier for this journal record
   */
  readonly journalId: JournalId;

  /**
   * Confection version ID that was used (format: "sourceId.confectionId\@versionSpec")
   */
  readonly confectionVersionId: ConfectionVersionId;

  /**
   * Date of the production session (ISO 8601 format)
   */
  readonly date: string;

  /**
   * Yield count for this production run
   */
  readonly yieldCount: number;

  /**
   * Weight per piece for this production run (optional)
   */
  readonly weightPerPiece?: Grams;

  /**
   * Optional notes about this production session
   */
  readonly notes?: string;

  /**
   * If modifications during this session created a new version,
   * this references that new version
   */
  readonly modifiedVersionId?: ConfectionVersionId;

  /**
   * If a filling recipe was edited during this session, this links
   * to the corresponding recipe journal record
   */
  readonly linkedRecipeJournalId?: JournalId;

  /**
   * Optional detailed journal entries recording what actually happened.
   * When present, provides a complete audit trail of the production session.
   */
  readonly entries?: ReadonlyArray<IConfectionJournalEntry>;
}

// ============================================================================
// Journal Record Union Type
// ============================================================================

/**
 * Discriminated union of all journal record types.
 * Use type guards to narrow to specific types.
 * @public
 */
export type AnyJournalRecord = IRecipeJournalRecord | IConfectionJournalRecord;

/**
 * Type guard for IRecipeJournalRecord
 * @param record - Journal record to check
 * @returns True if the record is a recipe journal record
 * @public
 */
export function isRecipeJournalRecord(record: AnyJournalRecord): record is IRecipeJournalRecord {
  return record.journalType === 'recipe';
}

/**
 * Type guard for IConfectionJournalRecord
 * @param record - Journal record to check
 * @returns True if the record is a confection journal record
 * @public
 */
export function isConfectionJournalRecord(record: AnyJournalRecord): record is IConfectionJournalRecord {
  return record.journalType === 'confection';
}
