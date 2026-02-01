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

import {
  ChocolateRole,
  ConfectionId,
  ConfectionVersionSpec,
  FillingId,
  FillingVersionSpec,
  Measurement,
  IngredientId,
  MoldId,
  ProcedureId,
  SessionId,
  SlotId
} from '../../common';
import { IFillingEditJournalEntry, IConfectionEditJournalEntry, AnyConfectionYield } from '../../entities';
import { IRuntimeConfection } from '../../library-runtime';

// ============================================================================
// Save Analysis
// ============================================================================

/**
 * Analysis of save options and recommendations based on session changes.
 * @public
 */
export interface ISaveAnalysis {
  /**
   * Whether the original collection is mutable (allows creating new version)
   */
  readonly canCreateVersion: boolean;

  /**
   * Whether we can add ingredients as alternatives to the original recipe
   */
  readonly canAddAlternatives: boolean;

  /**
   * Whether we must create a new recipe (collection is immutable)
   */
  readonly mustCreateNew: boolean;

  /**
   * Recommended save option based on changes
   */
  readonly recommendedOption: 'version' | 'alternatives' | 'new';

  /**
   * Detailed change information
   */
  readonly changes: {
    readonly ingredientsAdded: boolean;
    readonly ingredientsRemoved: boolean;
    readonly ingredientsChanged: boolean;
    readonly weightChanged: boolean;
    readonly notesChanged: boolean;
  };
}

// ============================================================================
// Save Options and Results
// ============================================================================

/**
 * Options for saving as a new version of the original recipe.
 * @public
 */
export interface ISaveVersionOptions {
  /**
   * Base weight for the new version
   */
  readonly baseWeight: Measurement;

  /**
   * Version spec for the new version
   */
  readonly versionSpec: FillingVersionSpec;

  /**
   * Whether to include session notes in the recipe
   */
  readonly includeSessionNotes?: boolean;
}

/**
 * Options for saving by adding ingredients as alternatives.
 * @public
 */
export interface ISaveAlternativesOptions {
  /**
   * Version spec for the updated version
   */
  readonly versionSpec: FillingVersionSpec;

  /**
   * Whether to include session notes in the recipe
   */
  readonly includeSessionNotes?: boolean;
}

/**
 * Options for saving as an entirely new recipe.
 * @public
 */
export interface ISaveNewRecipeOptions {
  /**
   * ID for the new recipe
   */
  readonly newId: FillingId;

  /**
   * Base weight for the new recipe
   */
  readonly baseWeight: Measurement;

  /**
   * Version spec for the new recipe's first version
   */
  readonly versionSpec: FillingVersionSpec;

  /**
   * Whether to include session notes in the recipe
   */
  readonly includeSessionNotes?: boolean;
}

/**
 * Options for saving confection as a new version.
 * @public
 */
export interface ISaveConfectionVersionOptions {
  /**
   * Version spec for the new version
   */
  readonly versionSpec: ConfectionVersionSpec;

  /**
   * Whether to include session notes in the confection
   */
  readonly includeSessionNotes?: boolean;
}

/**
 * Options for saving confection as entirely new.
 * @public
 */
export interface ISaveNewConfectionOptions {
  /**
   * ID for the new confection
   */
  readonly newId: ConfectionId;

  /**
   * Version spec for the new confection's first version
   */
  readonly versionSpec: ConfectionVersionSpec;

  /**
   * Whether to include session notes in the confection
   */
  readonly includeSessionNotes?: boolean;
}

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
  readonly versionLabel?: FillingVersionSpec;

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
   * The journal ID if a journal entry was created
   */
  readonly journalId?: string;

  /**
   * The full journal entry if one was created.
   * Callers can use this to persist the journal via `context.journals.addJournal(entry)`.
   */
  readonly journalEntry?: IFillingEditJournalEntry | IConfectionEditJournalEntry;

  /**
   * The new version spec if one was created
   */
  readonly newVersionSpec?: FillingVersionSpec | ConfectionVersionSpec;
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
   * Optional session ID (generated if not provided)
   */
  readonly sessionId?: SessionId;

  /**
   * Initial yield specification (defaults to golden version yield)
   */
  readonly initialYield?: AnyConfectionYield;
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
   * The journal ID if a journal entry was created
   */
  readonly journalId?: string;

  /**
   * The full journal entry if one was created
   */
  readonly journalEntry?: IConfectionEditJournalEntry;

  /**
   * The new version spec if one was created
   */
  readonly newVersionSpec?: ConfectionVersionSpec;

  /**
   * Journal IDs of linked recipe sessions that were saved
   */
  readonly linkedRecipeJournalIds?: ReadonlyArray<string>;
}

// ============================================================================
// Filling Session Management
// ============================================================================

/**
 * Map of filling editing sessions keyed by slot ID.
 * Used by confection editing sessions to manage filling scaling.
 * @public
 */
export type IFillingSessionMap = Map<SlotId, import('./editingSession').EditingSession>;

/**
 * Analysis of mold change impact on a molded bonbon confection.
 * Returned by setMold() to show weight changes before confirmation.
 * @public
 */
export interface IMoldChangeAnalysis {
  /**
   * ID of the current mold
   */
  readonly oldMoldId: MoldId;

  /**
   * ID of the proposed new mold
   */
  readonly newMoldId: MoldId;

  /**
   * Total cavity weight with current mold
   */
  readonly oldTotalWeight: Measurement;

  /**
   * Total cavity weight with new mold
   */
  readonly newTotalWeight: Measurement;

  /**
   * Weight difference (positive = more filling needed)
   */
  readonly weightDelta: Measurement;

  /**
   * Slot IDs of filling sessions that will be affected
   */
  readonly fillingSessionsAffected: ReadonlyArray<SlotId>;

  /**
   * Whether the weight change requires rescaling fillings
   */
  readonly requiresRescaling: boolean;
}
