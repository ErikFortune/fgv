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

import { Logging } from '@fgv/ts-utils';

import {
  ConfectionVersionSpec,
  FillingId,
  Measurement,
  IngredientId,
  MoldId,
  ProcedureId,
  SessionId,
  SlotId
} from '../../common';
import {
  ChocolateRole,
  IConfectionJournalEntry,
  IConfectionJournalRecord,
  IJournalEntry,
  IFillingRecipeJournalRecord
} from '../../entities';
import { IRuntimeConfection, IRuntimeFillingRecipeVersion } from '../model';

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
  amount: Measurement;

  /**
   * Original amount from the source version (0 for added ingredients)
   */
  readonly originalAmount: Measurement;

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
  readonly sourceVersion: IRuntimeFillingRecipeVersion;

  /**
   * Initial scale factor (default: 1.0)
   */
  readonly scaleFactor?: number;

  /**
   * Initial target weight (if specified, scaleFactor is calculated from baseWeight)
   */
  readonly targetWeight?: Measurement;

  /**
   * Whether to track detailed journal entries (default: true)
   */
  readonly enableJournal?: boolean;

  /**
   * Optional logger for reporting operations
   */
  readonly logger?: Logging.LogReporter<unknown>;
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
  readonly sourceVersion: IRuntimeFillingRecipeVersion;

  /**
   * Current scale factor
   */
  readonly scaleFactor: number;

  /**
   * Current target weight
   */
  readonly targetWeight: Measurement;

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
   * The journal ID if a journal record was created
   */
  readonly journalId?: string;

  /**
   * The full journal record if one was created.
   * Callers can use this to persist the journal via `context.journals.addJournal(record)`.
   */
  readonly journalRecord?: IFillingRecipeJournalRecord;

  /**
   * The new version spec if one was created
   */
  readonly newVersionSpec?: string;
}

// ============================================================================
// Confection Session State Types
// ============================================================================

/**
 * Status of a confection session selection
 * @public
 */
export type ConfectionSelectionStatus = 'original' | 'modified';

/**
 * Tracks the selected filling for a single slot in a confection session
 * @public
 */
export interface ISessionFillingSlot {
  /**
   * The slot ID this selection applies to
   */
  readonly slotId: SlotId;

  /**
   * The currently selected filling ID (mutually exclusive with ingredientId)
   */
  readonly fillingId?: FillingId;

  /**
   * The currently selected filling ingredient ID (mutually exclusive with fillingId)
   */
  readonly ingredientId?: IngredientId;

  /**
   * The original filling recipe ID when the session started
   */
  readonly originalFillingId?: FillingId;

  /**
   * The original filling ingredient ID when the session started
   */
  readonly originalIngredientId?: IngredientId;

  /**
   * Current status of the filling selection
   */
  readonly status: ConfectionSelectionStatus;
}

/**
 * Tracks the selected mold for a confection session
 * @public
 */
export interface ISessionMold {
  /**
   * The currently selected mold ID
   */
  readonly moldId: MoldId;

  /**
   * The original mold ID when the session started
   */
  readonly originalMoldId: MoldId;

  /**
   * Current status of the mold selection
   */
  readonly status: ConfectionSelectionStatus;
}

/**
 * Tracks a chocolate selection by role for a confection session
 * @public
 */
export interface ISessionChocolate {
  /**
   * The role of this chocolate in the confection
   */
  readonly role: ChocolateRole;

  /**
   * The currently selected chocolate ingredient ID
   */
  readonly ingredientId: IngredientId;

  /**
   * The original chocolate ingredient ID when the session started
   */
  readonly originalIngredientId: IngredientId;

  /**
   * Current status of this chocolate selection
   */
  readonly status: ConfectionSelectionStatus;
}

/**
 * Tracks yield modifications for a confection session
 * @public
 */
export interface ISessionYield {
  /**
   * Current yield count
   */
  readonly count: number;

  /**
   * Original yield count when the session started
   */
  readonly originalCount: number;

  /**
   * Current weight per piece (optional)
   */
  readonly weightPerPiece?: Measurement;

  /**
   * Original weight per piece when the session started
   */
  readonly originalWeightPerPiece?: Measurement;

  /**
   * Current status of yield modifications
   */
  readonly status: ConfectionSelectionStatus;
}

/**
 * Tracks the selected procedure for a confection session
 * @public
 */
export interface ISessionProcedure {
  /**
   * The currently selected procedure ID
   */
  readonly procedureId: ProcedureId;

  /**
   * The original procedure ID when the session started
   */
  readonly originalProcedureId?: ProcedureId;

  /**
   * Current status of the procedure selection
   */
  readonly status: ConfectionSelectionStatus;
}

/**
 * Tracks a coating selection for rolled truffles
 * @public
 */
export interface ISessionCoating {
  /**
   * The currently selected coating ingredient ID
   */
  readonly ingredientId: IngredientId;

  /**
   * The original coating ingredient ID when the session started
   */
  readonly originalIngredientId?: IngredientId;

  /**
   * Current status of the coating selection
   */
  readonly status: ConfectionSelectionStatus;
}

// ============================================================================
// Confection Session Parameters
// ============================================================================

/**
 * Parameters for creating a confection editing session
 * @public
 */
export interface IConfectionEditingSessionParams {
  /**
   * The source confection to edit from
   */
  readonly sourceConfection: IRuntimeConfection;

  /**
   * Initial yield count (defaults to confection's default yield)
   */
  readonly yieldCount?: number;

  /**
   * Initial weight per piece (defaults to confection's default)
   */
  readonly weightPerPiece?: Measurement;

  /**
   * Whether to track detailed journal entries (default: true)
   */
  readonly enableJournal?: boolean;

  /**
   * Optional logger for reporting operations
   */
  readonly logger?: Logging.LogReporter<unknown>;
}

// ============================================================================
// Confection Session State
// ============================================================================

/**
 * Read-only view of confection session state
 * @public
 */
export interface IConfectionSessionState {
  /**
   * Unique session identifier
   */
  readonly sessionId: SessionId;

  /**
   * Source confection being edited
   */
  readonly sourceConfection: IRuntimeConfection;

  /**
   * Current filling selections by slot ID (if applicable)
   */
  readonly fillings: ReadonlyMap<SlotId, ISessionFillingSlot>;

  /**
   * Current mold selection (for molded bonbons)
   */
  readonly mold?: ISessionMold;

  /**
   * Current chocolate selections by role
   */
  readonly chocolates: ReadonlyMap<ChocolateRole, ISessionChocolate>;

  /**
   * Current yield state
   */
  readonly yield: ISessionYield;

  /**
   * Current procedure selection (if applicable)
   */
  readonly procedure?: ISessionProcedure;

  /**
   * Current coating selection (for rolled truffles)
   */
  readonly coating?: ISessionCoating;

  /**
   * Journal entries recording what happened in this session
   */
  readonly journalEntries: ReadonlyArray<IConfectionJournalEntry>;

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
// Confection Save Options and Results
// ============================================================================

/**
 * Options for saving a confection editing session
 * @public
 */
export interface IConfectionSaveOptions {
  /**
   * Whether to create a journal record
   */
  readonly createJournalRecord?: boolean;

  /**
   * Whether to create a new confection version from modifications
   */
  readonly createNewVersion?: boolean;

  /**
   * Version label for the new version (required if createNewVersion is true)
   */
  readonly versionLabel?: ConfectionVersionSpec;

  /**
   * Optional notes for the journal record
   */
  readonly journalNotes?: string;

  /**
   * Whether to save linked recipe sessions (default: true)
   */
  readonly saveLinkedRecipeSessions?: boolean;
}

/**
 * Result of saving a confection editing session
 * @public
 */
export interface IConfectionSaveResult {
  /**
   * The journal ID if a journal record was created
   */
  readonly journalId?: string;

  /**
   * The full journal record if one was created
   */
  readonly journalRecord?: IConfectionJournalRecord;

  /**
   * The new version spec if one was created
   */
  readonly newVersionSpec?: ConfectionVersionSpec;

  /**
   * Journal IDs of linked recipe sessions that were saved
   */
  readonly linkedRecipeJournalIds?: ReadonlyArray<string>;
}
