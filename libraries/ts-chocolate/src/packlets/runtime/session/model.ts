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
 * Editing session model types
 * @packageDocumentation
 */

import { Grams, IngredientId, SessionId } from '../../common';
import { IJournalEntry } from '../../journal';
import { IRuntimeRecipeVersion } from '../model';

// ============================================================================
// Session Ingredient State
// ============================================================================

/**
 * The status of an ingredient in an editing session
 * @public
 */
export type SessionIngredientStatus = 'original' | 'modified' | 'added' | 'removed' | 'substituted';

/**
 * Represents an ingredient in an editing session with tracking of changes
 * @public
 */
export interface ISessionIngredient {
  /**
   * The ingredient ID
   */
  readonly ingredientId: IngredientId;

  /**
   * Current amount (can be modified during session)
   */
  amount: Grams;

  /**
   * Original amount from the source version (0 for added ingredients)
   */
  readonly originalAmount: Grams;

  /**
   * Current status of this ingredient
   */
  readonly status: SessionIngredientStatus;

  /**
   * If this is a substitution, the original ingredient that was replaced
   */
  readonly substitutedFor?: IngredientId;

  /**
   * Optional notes for this ingredient
   */
  notes?: string;
}

// ============================================================================
// Session Parameters
// ============================================================================

/**
 * Parameters for creating an editing session
 * @public
 */
export interface IEditingSessionParams {
  /**
   * The source version to edit from
   */
  readonly sourceVersion: IRuntimeRecipeVersion;

  /**
   * Initial scale factor (default: 1.0)
   */
  readonly scaleFactor?: number;

  /**
   * Initial target weight (if specified, scaleFactor is calculated from baseWeight)
   */
  readonly targetWeight?: Grams;

  /**
   * Whether to track detailed journal entries (default: true)
   */
  readonly enableJournal?: boolean;
}

// ============================================================================
// Session State
// ============================================================================

/**
 * Read-only view of session state
 * @public
 */
export interface ISessionState {
  /**
   * Unique session identifier
   */
  readonly sessionId: SessionId;

  /**
   * Source version being edited
   */
  readonly sourceVersion: IRuntimeRecipeVersion;

  /**
   * Current scale factor
   */
  readonly scaleFactor: number;

  /**
   * Current target weight
   */
  readonly targetWeight: Grams;

  /**
   * Current ingredient states
   */
  readonly ingredients: ReadonlyMap<IngredientId, ISessionIngredient>;

  /**
   * Journal entries recording what happened in this session
   */
  readonly journalEntries: ReadonlyArray<IJournalEntry>;

  /**
   * Whether the session has unsaved modifications
   */
  readonly isDirty: boolean;

  /**
   * Whether journaling is enabled
   */
  readonly isJournalingEnabled: boolean;
}

// ============================================================================
// Save Options and Results
// ============================================================================

/**
 * Options for saving an editing session
 * @public
 */
export interface ISaveOptions {
  /**
   * Whether to create a journal record
   */
  readonly createJournalRecord?: boolean;

  /**
   * Whether to create a new recipe version from modifications
   */
  readonly createNewVersion?: boolean;

  /**
   * Version label for the new version (required if createNewVersion is true)
   */
  readonly versionLabel?: string;

  /**
   * Optional notes for the journal record
   */
  readonly journalNotes?: string;
}

/**
 * Result of saving an editing session
 * @public
 */
export interface ISaveResult {
  /**
   * The journal record if one was created
   */
  readonly journalId?: string;

  /**
   * The new version spec if one was created
   */
  readonly newVersionSpec?: string;
}
