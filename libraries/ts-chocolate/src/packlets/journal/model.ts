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

import { Grams, IngredientId, JournalId, RecipeVersionId } from '../common';

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
 * All possible journal event types
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

// ============================================================================
// Journal Record
// ============================================================================

/**
 * A complete journal record for a cooking session.
 * Tracks what recipe version was used, how it was scaled, and what
 * modifications were made during the session.
 * @public
 */
export interface IJournalRecord {
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
