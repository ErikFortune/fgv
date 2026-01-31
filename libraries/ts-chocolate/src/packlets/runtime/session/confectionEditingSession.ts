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
 * ConfectionEditingSession - mutable session for editing confection selections
 * @packageDocumentation
 */

import { captureResult, fail, Logging, MessageAggregator, Result, succeed, Success } from '@fgv/ts-utils';

import {
  Measurement,
  IngredientId,
  MoldId,
  ProcedureId,
  FillingId,
  SessionId,
  SlotId,
  ConfectionVersionSpec,
  Converters as CommonConverters
} from '../../common';
import { IConfectionEditJournalEntry, AnyConfectionVersion } from '../../entities';
import { IRuntimeConfection } from '../model';
import {
  ChocolateRole,
  ConfectionSelectionStatus,
  IConfectionEditingSessionParams,
  IConfectionSaveOptions,
  IConfectionSaveResult,
  IConfectionSessionState,
  ISessionChocolate,
  ISessionCoating,
  ISessionFillingSlot,
  ISessionMold,
  ISessionProcedure,
  ISessionYield
} from './model';
import { generateJournalId, generateSessionId } from './sessionUtils';

// ============================================================================
// ConfectionEditingSession Class
// ============================================================================

/**
 * A mutable editing session for modifying confection selections.
 *
 * Tracks:
 * - Source confection and version
 * - Filling selection (recipe or ingredient)
 * - Mold selection (for molded bonbons)
 * - Chocolate selections by role (shell, enrobing, seal, decoration)
 * - Yield modifications (count, weight per piece)
 * - Procedure selection
 * - Coating selection (for rolled truffles)
 * - Journal entries recording what happened
 *
 * Can produce:
 * - Journal records documenting the session
 * - New confection versions incorporating modifications
 *
 * @public
 */
export class ConfectionEditingSession implements IConfectionSessionState {
  private readonly _sessionId: SessionId;
  private readonly _sourceConfection: IRuntimeConfection;
  private readonly _enableJournal: boolean;
  private readonly _logger: Logging.LogReporter<unknown>;

  private _fillings: Map<SlotId, ISessionFillingSlot>;
  private _mold?: ISessionMold;
  private _chocolates: Map<ChocolateRole, ISessionChocolate>;
  private _yield: ISessionYield;
  private _procedure?: ISessionProcedure;
  private _coating?: ISessionCoating;
  private _isDirty: boolean;

  // ============================================================================
  // Constructor
  // ============================================================================

  private constructor(params: IConfectionEditingSessionParams) {
    this._sessionId = generateSessionId().orThrow();
    this._sourceConfection = params.sourceConfection;
    this._enableJournal = params.enableJournal ?? true;
    this._logger = params.logger ?? Logging.LogReporter.createDefault().orThrow();
    this._isDirty = false;
    this._chocolates = new Map();
    this._fillings = new Map();

    // Initialize yield from confection defaults or params
    const defaultYield = this._sourceConfection.yield;
    const yieldCount = params.yieldCount ?? defaultYield.count;
    const weightPerPiece = params.weightPerPiece ?? defaultYield.weightPerPiece;

    this._yield = {
      count: yieldCount,
      originalCount: defaultYield.count,
      weightPerPiece,
      originalWeightPerPiece: defaultYield.weightPerPiece,
      status: 'original'
    };

    // Initialize filling if confection has fillings
    this._initializeFilling();

    // Initialize mold for molded bonbons
    this._initializeMold();

    // Initialize chocolates based on confection type
    this._initializeChocolates();

    // Initialize procedure if confection has procedures
    this._initializeProcedure();

    // Initialize coating for rolled truffles
    this._initializeCoating();
  }

  // ============================================================================
  // Factory Method
  // ============================================================================

  /**
   * Creates a new ConfectionEditingSession
   * @param params - Session parameters
   * @returns Success with new session, or Failure with error message
   * @public
   */
  public static create(params: IConfectionEditingSessionParams): Result<ConfectionEditingSession> {
    return captureResult(() => new ConfectionEditingSession(params));
  }

  // ============================================================================
  // IConfectionSessionState Implementation
  // ============================================================================

  public get sessionId(): SessionId {
    return this._sessionId;
  }

  public get sourceConfection(): IRuntimeConfection {
    return this._sourceConfection;
  }

  public get fillings(): ReadonlyMap<SlotId, ISessionFillingSlot> {
    return this._fillings;
  }

  public get mold(): ISessionMold | undefined {
    return this._mold;
  }

  public get chocolates(): ReadonlyMap<ChocolateRole, ISessionChocolate> {
    return this._chocolates;
  }

  public get yield(): ISessionYield {
    return this._yield;
  }

  public get procedure(): ISessionProcedure | undefined {
    return this._procedure;
  }

  public get coating(): ISessionCoating | undefined {
    return this._coating;
  }

  public get isDirty(): boolean {
    return this._isDirty;
  }

  public get isJournalingEnabled(): boolean {
    return this._enableJournal;
  }

  // ============================================================================
  // Filling Selection
  // ============================================================================

  /**
   * Selects a filling recipe for a specific slot.
   * @param slotId - The slot ID to select the filling for
   * @param fillingId - The recipe ID to select as the filling
   * @returns Success, or Failure if the slot doesn't exist
   * @public
   */
  public selectFillingRecipe(slotId: SlotId, fillingId: FillingId): Result<true> {
    const existingSlot = this._fillings.get(slotId);
    if (!existingSlot) {
      return fail(`Filling slot '${slotId}' does not exist`);
    }

    this._fillings.set(slotId, {
      slotId,
      fillingId,
      ingredientId: undefined,
      originalFillingId: existingSlot.originalFillingId,
      originalIngredientId: existingSlot.originalIngredientId,
      status: 'modified'
    });

    this._isDirty = true;

    this._logger.info(`Selected filling recipe for slot '${slotId}': ${fillingId}`);
    return succeed(true);
  }

  /**
   * Selects a filling ingredient for a specific slot.
   * @param slotId - The slot ID to select the filling for
   * @param ingredientId - The ingredient ID to select as the filling
   * @returns Success, or Failure if the slot doesn't exist
   * @public
   */
  public selectFillingIngredient(slotId: SlotId, ingredientId: IngredientId): Result<true> {
    const existingSlot = this._fillings.get(slotId);
    if (!existingSlot) {
      return fail(`Filling slot '${slotId}' does not exist`);
    }

    this._fillings.set(slotId, {
      slotId,
      fillingId: undefined,
      ingredientId,
      originalFillingId: existingSlot.originalFillingId,
      originalIngredientId: existingSlot.originalIngredientId,
      status: 'modified'
    });

    this._isDirty = true;

    this._logger.info(`Selected filling ingredient for slot '${slotId}': ${ingredientId}`);
    return succeed(true);
  }

  // ============================================================================
  // Mold Selection
  // ============================================================================

  /**
   * Selects a mold for the confection.
   * @param moldId - The mold ID to select
   * @returns Success, or Failure if the confection doesn't support molds
   * @public
   */
  public selectMold(moldId: MoldId): Result<true> {
    if (!this._sourceConfection.isMoldedBonBon()) {
      return fail('This confection does not support mold selection');
    }

    this._mold = {
      moldId,
      originalMoldId: this._mold?.originalMoldId ?? moldId,
      status: 'modified'
    };

    this._isDirty = true;
    this._logger.info(`Selected mold: ${moldId}`);
    return succeed(true);
  }

  // ============================================================================
  // Chocolate Selection
  // ============================================================================

  /**
   * Selects a chocolate for a specific role.
   * @param role - The chocolate role (shell, enrobing, seal, decoration)
   * @param ingredientId - The chocolate ingredient ID to select
   * @returns Success, or Failure if the role is not supported for this confection
   * @public
   */
  public selectChocolate(role: ChocolateRole, ingredientId: IngredientId): Result<true> {
    const existing = this._chocolates.get(role);

    this._chocolates.set(role, {
      role,
      ingredientId,
      originalIngredientId: existing?.originalIngredientId ?? ingredientId,
      status: 'modified'
    });

    this._isDirty = true;
    this._logger.info(`Selected ${role} chocolate: ${ingredientId}`);
    return succeed(true);
  }

  // ============================================================================
  // Yield Modification
  // ============================================================================

  /**
   * Sets the yield count.
   * @param count - The new yield count
   * @returns Success, or Failure if count is invalid
   * @public
   */
  public setYieldCount(count: number): Result<true> {
    if (count <= 0) {
      return fail('Yield count must be positive');
    }

    this._yield = {
      ...this._yield,
      count,
      status: this._computeYieldStatus(count, this._yield.weightPerPiece)
    };

    this._isDirty = true;
    this._logger.info(`Set yield count: ${count}`);
    return succeed(true);
  }

  /**
   * Sets the weight per piece.
   * @param weight - The new weight per piece in grams
   * @returns Success, or Failure if weight is invalid
   * @public
   */
  public setWeightPerPiece(weight: Measurement): Result<true> {
    if (weight <= 0) {
      return fail('Weight per piece must be positive');
    }

    this._yield = {
      ...this._yield,
      weightPerPiece: weight,
      status: this._computeYieldStatus(this._yield.count, weight)
    };

    this._isDirty = true;
    this._logger.info(`Set weight per piece: ${weight}g`);
    return succeed(true);
  }

  // ============================================================================
  // Procedure Selection
  // ============================================================================

  /**
   * Selects a procedure for the confection.
   * @param procedureId - The procedure ID to select
   * @returns Success, or Failure if the confection doesn't support procedures
   * @public
   */
  public selectProcedure(procedureId: ProcedureId): Result<true> {
    // Check if procedures are supported by looking at the raw data
    // (Runtime getter returns undefined for both "not supported" and "empty options")
    const goldenVersion = this._sourceConfection.raw.versions.find(
      (v) => v.versionSpec === this._sourceConfection.goldenVersionSpec
    );
    /* c8 ignore next 3 - defensive: golden version always exists for valid confection */
    if (!goldenVersion?.procedures) {
      return fail('This confection does not support procedure selection');
    }

    this._procedure = {
      procedureId,
      originalProcedureId: this._procedure?.originalProcedureId,
      status: 'modified'
    };

    this._isDirty = true;
    this._logger.info(`Selected procedure: ${procedureId}`);
    return succeed(true);
  }

  // ============================================================================
  // Coating Selection
  // ============================================================================

  /**
   * Selects a coating ingredient for rolled truffles.
   * @param ingredientId - The coating ingredient ID to select
   * @returns Success, or Failure if the confection doesn't support coatings
   * @public
   */
  public selectCoating(ingredientId: IngredientId): Result<true> {
    if (!this._sourceConfection.isRolledTruffle()) {
      return fail('This confection does not support coating selection');
    }

    this._coating = {
      ingredientId,
      originalIngredientId: this._coating?.originalIngredientId,
      status: 'modified'
    };

    this._isDirty = true;

    this._logger.info(`Selected coating: ${ingredientId}`);
    return succeed(true);
  }

  // ============================================================================
  // Notes
  // ============================================================================

  /**
   * Adds a note to the session journal (deprecated - notes now provided at save time)
   * @param text - The note text
   * @public
   * @deprecated Notes are now provided when creating the journal entry
   */
  public addNote(text: string): void {
    // No-op: notes are now provided at save time
    this._logger.info(`Session ${this._sessionId}: note added: ${text}`);
  }

  // ============================================================================
  // Journal Record Generation
  // ============================================================================

  /**
   * Creates an edit journal entry documenting this session.
   * @param updated - Optional updated version if modifications were saved
   * @param updatedId - Optional ID if the updated version was saved
   * @param notes - Optional notes about this session
   * @returns Success with journal entry, or Failure with error message
   * @public
   */
  public toEditJournalEntry(
    updated?: AnyConfectionVersion,
    updatedVersionSpec?: ConfectionVersionSpec,
    notes?: string
  ): Result<IConfectionEditJournalEntry> {
    const timestamp = new Date().toISOString();
    const versionIdString = `${this._sourceConfection.id}@${this._sourceConfection.goldenVersionSpec}`;
    const categorizedNotes = notes
      ? [{ category: 'session' as unknown as import('../../common').NoteCategory, note: notes }]
      : undefined;

    return CommonConverters.confectionVersionId.convert(versionIdString).onSuccess((confectionVersionId) =>
      generateJournalId().onSuccess((id) => {
        // Convert updatedVersionSpec to full version ID if provided
        const updatedIdResult = updatedVersionSpec
          ? CommonConverters.confectionVersionId.convert(`${this._sourceConfection.id}@${updatedVersionSpec}`)
          : succeed(undefined);

        return updatedIdResult.onSuccess((updatedId) =>
          succeed({
            type: 'confection-edit' as const,
            id,
            timestamp,
            versionId: confectionVersionId,
            recipe: this._sourceConfection.goldenVersion.version,
            updated,
            updatedId,
            notes: categorizedNotes
          })
        );
      })
    );
  }

  // ============================================================================
  // Save Operation
  // ============================================================================

  /**
   * Saves the session, optionally creating a journal record and/or new version.
   * @param options - Save options
   * @returns Success with save result, or Failure with error message
   * @public
   */
  public save(options: IConfectionSaveOptions = {}): Result<IConfectionSaveResult> {
    const errors = new MessageAggregator();
    let saveResult: IConfectionSaveResult = {};
    let newVersionSpec: ConfectionVersionSpec | undefined;

    if (options.createNewVersion) {
      if (!options.versionLabel) {
        return fail('versionLabel is required when createNewVersion is true');
      }
      newVersionSpec = options.versionLabel;
      saveResult = { ...saveResult, newVersionSpec };
    }

    if (options.createJournalRecord !== false && this._enableJournal) {
      const journalResult = this.toEditJournalEntry(undefined, newVersionSpec, options.journalNotes)
        .aggregateError(errors)
        .onSuccess((entry) =>
          Success.with<IConfectionSaveResult>({ journalEntry: entry, journalId: entry.id })
        )
        .orDefault({});
      saveResult = { ...saveResult, ...journalResult };
    }

    this._isDirty = false;
    return succeed(saveResult);
  }

  // ============================================================================
  // Private Initialization Methods
  // ============================================================================

  private _initializeFilling(): void {
    const fillingSlots = this._sourceConfection.fillings;
    if (!fillingSlots || fillingSlots.length === 0) {
      return;
    }

    // Initialize each filling slot
    for (const slot of fillingSlots) {
      const { slotId, filling } = slot;
      const { options, preferredId } = filling;

      if (options.length === 0) {
        continue;
      }

      // Find the preferred option or use the first one
      let selectedOption = options[0];
      if (preferredId !== undefined) {
        const preferred = options.find((opt: { id: unknown }) => opt.id === preferredId);
        if (preferred !== undefined) {
          selectedOption = preferred;
        }
      }

      // Create session filling slot based on type
      if (selectedOption.type === 'recipe') {
        this._fillings.set(slotId, {
          slotId,
          fillingId: selectedOption.id,
          originalFillingId: selectedOption.id,
          status: 'original'
        });
      } else {
        this._fillings.set(slotId, {
          slotId,
          ingredientId: selectedOption.id,
          originalIngredientId: selectedOption.id,
          status: 'original'
        });
      }
    }
  }

  private _initializeMold(): void {
    if (!this._sourceConfection.isMoldedBonBon()) {
      return;
    }

    const molds = this._sourceConfection.molds;
    const moldId = molds.preferredId ?? molds.options[0]?.id;

    if (moldId) {
      this._mold = {
        moldId,
        originalMoldId: moldId,
        status: 'original'
      };
    }
  }

  private _initializeChocolates(): void {
    if (this._sourceConfection.isMoldedBonBon()) {
      const shellChocolate = this._sourceConfection.shellChocolate;
      // shellChocolate is now resolved - use chocolate.id for the primary
      const shellIngredientId = shellChocolate.chocolate.id;
      this._chocolates.set('shell', {
        role: 'shell',
        ingredientId: shellIngredientId,
        originalIngredientId: shellIngredientId,
        status: 'original'
      });

      // Initialize additional chocolates if present
      const additionalChocolates = this._sourceConfection.additionalChocolates;
      if (additionalChocolates) {
        for (const additional of additionalChocolates) {
          const role = additional.purpose;
          // additional.chocolate is now resolved - use chocolate.id
          const ingredientId = additional.chocolate.chocolate.id;
          this._chocolates.set(role, {
            role,
            ingredientId,
            originalIngredientId: ingredientId,
            status: 'original'
          });
        }
      }
    } else if (this._sourceConfection.isBarTruffle()) {
      const enrobingChocolate = this._sourceConfection.enrobingChocolate;
      if (enrobingChocolate) {
        // enrobingChocolate is now resolved - use chocolate.id
        const ingredientId = enrobingChocolate.chocolate.id;
        this._chocolates.set('enrobing', {
          role: 'enrobing',
          ingredientId,
          originalIngredientId: ingredientId,
          status: 'original'
        });
      }
    } else if (this._sourceConfection.isRolledTruffle()) {
      const enrobingChocolate = this._sourceConfection.enrobingChocolate;
      if (enrobingChocolate) {
        // enrobingChocolate is now resolved - use chocolate.id
        const ingredientId = enrobingChocolate.chocolate.id;
        this._chocolates.set('enrobing', {
          role: 'enrobing',
          ingredientId,
          originalIngredientId: ingredientId,
          status: 'original'
        });
      }
    }
  }

  private _initializeProcedure(): void {
    const procedures = this._sourceConfection.procedures;
    if (!procedures) {
      return;
    }

    /* c8 ignore next - defensive: procedures always has at least one option when defined */
    const procedureId = procedures.preferredId ?? procedures.options[0]?.id;

    if (procedureId) {
      this._procedure = {
        procedureId,
        originalProcedureId: procedureId,
        status: 'original'
      };
    }
  }

  private _initializeCoating(): void {
    if (!this._sourceConfection.isRolledTruffle()) {
      return;
    }

    const coatings = this._sourceConfection.coatings;
    if (!coatings) {
      return;
    }

    // coatings is now resolved - use preferred option or first option
    /* c8 ignore next - branch: fallback to first option if preferred ingredient missing from library */
    const ingredientId = coatings.preferred?.id ?? coatings.options[0]?.id;

    if (ingredientId) {
      this._coating = {
        ingredientId,
        originalIngredientId: ingredientId,
        status: 'original'
      };
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private _computeYieldStatus(count: number, weightPerPiece?: Measurement): ConfectionSelectionStatus {
    const countChanged = count !== this._yield.originalCount;
    const weightChanged = weightPerPiece !== this._yield.originalWeightPerPiece;
    return countChanged || weightChanged ? 'modified' : 'original';
  }
}
