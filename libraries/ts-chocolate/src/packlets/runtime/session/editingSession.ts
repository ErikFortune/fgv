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
 * EditingSession - simplified session for editing filling recipes
 * @packageDocumentation
 */

import { captureResult, fail, Result, succeed } from '@fgv/ts-utils';

import {
  IngredientId,
  Measurement,
  MeasurementUnit,
  ProcedureId,
  SessionBaseId,
  SessionId,
  SourceId,
  Helpers as CommonHelpers,
  Converters as CommonConverters,
  Model as CommonModel
} from '../../common';
import {
  Fillings,
  IFillingEditJournalEntryEntity,
  IFillingProductionJournalEntryEntity,
  IPersistedFillingSession,
  IProducedFillingEntity,
  PersistedSessionStatus
} from '../../entities';
import { IRuntimeFillingRecipeVersion, RuntimeProducedFilling } from '../../library-runtime';
import {
  ISaveAnalysis,
  ISaveVersionOptions,
  ISaveAlternativesOptions,
  ISaveNewRecipeOptions,
  ISaveResult
} from './model';
import {
  generateJournalId,
  generateSessionBaseId,
  generateSessionId,
  getCurrentTimestamp
} from './sessionUtils';

/**
 * A mutable editing session for modifying filling recipe versions.
 *
 * Core architecture:
 * - Wraps an IRuntimeFillingRecipeVersion (immutable source)
 * - Uses RuntimeProducedFilling for mutable editing with undo/redo
 * - Tracks original snapshot for change detection
 * - Provides save operations that integrate with library
 *
 * @public
 */
export class EditingSession {
  private readonly _baseRecipe: IRuntimeFillingRecipeVersion;
  private readonly _produced: RuntimeProducedFilling;
  private readonly _originalSnapshot: IProducedFillingEntity;
  private readonly _sessionId: SessionId;

  /**
   * Creates an EditingSession.
   * Use static factory method instead of calling this directly.
   * @param baseRecipe - The base recipe version being edited
   * @param produced - The RuntimeProducedFilling wrapper
   * @param sessionId - Optional session ID (generates new if not provided)
   * @param originalSnapshot - Optional original snapshot for restoration (uses current if not provided)
   * @internal
   */
  private constructor(
    baseRecipe: IRuntimeFillingRecipeVersion,
    produced: RuntimeProducedFilling,
    sessionId?: SessionId,
    originalSnapshot?: IProducedFillingEntity
  ) {
    this._baseRecipe = baseRecipe;
    this._produced = produced;
    this._originalSnapshot = originalSnapshot ?? produced.createSnapshot();
    this._sessionId = sessionId ?? generateSessionId().orThrow();
  }

  /**
   * Creates a new EditingSession from a base recipe version.
   * @param baseRecipe - Source recipe version to edit
   * @param initialScale - Optional initial scale factor (default: 1.0)
   * @returns Result with new EditingSession or error
   * @public
   */
  public static create(
    baseRecipe: IRuntimeFillingRecipeVersion,
    initialScale?: number
  ): Result<EditingSession> {
    const scaleFactor = initialScale ?? 1.0;
    if (scaleFactor <= 0) {
      return fail('Scale factor must be positive');
    }

    return RuntimeProducedFilling.fromSource(baseRecipe, scaleFactor).onSuccess((produced) =>
      captureResult(() => new EditingSession(baseRecipe, produced))
    );
  }

  // ============================================================================
  // Editing Methods (delegate to _produced)
  // ============================================================================

  /**
   * Sets or updates an ingredient in the filling.
   * @param id - Ingredient ID
   * @param amount - Amount of ingredient
   * @param unit - Optional measurement unit (default: 'g')
   * @param modifiers - Optional ingredient modifiers (spoonLevel, toTaste)
   * @returns Success or failure
   * @public
   */
  public setIngredient(
    id: IngredientId,
    amount: Measurement,
    unit?: MeasurementUnit,
    modifiers?: Fillings.IIngredientModifiers
  ): Result<void> {
    return this._produced.setIngredient(id, amount, unit, modifiers);
  }

  /**
   * Removes an ingredient from the filling.
   * @param id - Ingredient ID to remove
   * @returns Success or failure
   * @public
   */
  public removeIngredient(id: IngredientId): Result<void> {
    return this._produced.removeIngredient(id);
  }

  /**
   * Scales the filling to achieve a target weight.
   * Weight-contributing ingredients (g, mL) are scaled proportionally.
   * Non-weight ingredients (tsp, Tbsp, pinch, etc.) remain unchanged.
   * @param targetWeight - Desired total weight
   * @returns Success with actual achieved weight, or failure
   * @public
   */
  public scaleToTargetWeight(targetWeight: Measurement): Result<Measurement> {
    return this._produced.scaleToTargetWeight(targetWeight);
  }

  /**
   * Sets the notes for the filling.
   * @param notes - Categorized notes array
   * @returns Success or failure
   * @public
   */
  public setNotes(notes: CommonModel.ICategorizedNote[]): Result<void> {
    return this._produced.setNotes(notes);
  }

  /**
   * Sets the procedure for the filling.
   * @param id - Procedure ID or undefined to clear
   * @returns Success or failure
   * @public
   */
  public setProcedure(id: ProcedureId | undefined): Result<void> {
    return this._produced.setProcedure(id);
  }

  // ============================================================================
  // History (delegate to _produced)
  // ============================================================================

  /**
   * Undoes the last change.
   * @returns Success with true if undo succeeded, Success with false if no history
   * @public
   */
  public undo(): Result<boolean> {
    return this._produced.undo();
  }

  /**
   * Redoes the last undone change.
   * @returns Success with true if redo succeeded, Success with false if no future
   * @public
   */
  public redo(): Result<boolean> {
    return this._produced.redo();
  }

  /**
   * Checks if undo is available.
   * @returns True if undo stack is not empty
   * @public
   */
  public canUndo(): boolean {
    return this._produced.canUndo();
  }

  /**
   * Checks if redo is available.
   * @returns True if redo stack is not empty
   * @public
   */
  public canRedo(): boolean {
    return this._produced.canRedo();
  }

  // ============================================================================
  // Save Analysis
  // ============================================================================

  /**
   * Analyzes current changes and recommends save options.
   * @returns Analysis of changes and available save options
   * @public
   */
  public analyzeSaveOptions(): ISaveAnalysis {
    const changes = this._produced.getChanges(this._originalSnapshot);
    // TODO: Check collection mutability when that property is added to IFillingRecipe
    // For now, assume all collections are mutable
    const isMutable = true;

    return {
      canCreateVersion: isMutable,
      canAddAlternatives: isMutable && changes.ingredientsChanged,
      mustCreateNew: !isMutable,
      recommendedOption: !isMutable ? 'new' : changes.ingredientsChanged ? 'alternatives' : 'version',
      changes: {
        ingredientsAdded: changes.ingredientsChanged,
        ingredientsRemoved: changes.ingredientsChanged,
        ingredientsChanged: changes.ingredientsChanged,
        weightChanged: changes.targetWeightChanged,
        notesChanged: changes.notesChanged
      }
    };
  }

  // ============================================================================
  // Save Operations
  // ============================================================================

  /**
   * Saves as a new version of the original recipe.
   * Requires that the collection is mutable.
   * @param options - Save options including version spec and base weight
   * @returns Result with save result containing journal entry and version spec
   * @public
   */
  public saveAsNewVersion(options: ISaveVersionOptions): Result<ISaveResult> {
    const analysis = this.analyzeSaveOptions();
    if (!analysis.canCreateVersion) {
      return fail('Cannot create new version: collection is immutable');
    }

    const sessionNotes = this._produced.snapshot.notes ? [...this._produced.snapshot.notes] : undefined;

    // TODO: Implement producedToSource conversion when needed
    // For now, just create the journal entry
    return this._createJournalEntry(options.versionSpec, sessionNotes).onSuccess((journalEntry) =>
      succeed({
        journalId: journalEntry.baseId,
        journalEntry,
        newVersionSpec: options.versionSpec
      })
    );
  }

  /**
   * Saves by adding ingredients as alternatives to existing version.
   * Requires that the collection is mutable and ingredients changed.
   * @param options - Save options including version spec
   * @returns Result with save result containing journal entry
   * @public
   */
  public saveAsAlternatives(options: ISaveAlternativesOptions): Result<ISaveResult> {
    const analysis = this.analyzeSaveOptions();
    if (!analysis.canAddAlternatives) {
      return fail('Cannot add alternatives: collection is immutable or no ingredient changes');
    }

    const sessionNotes = this._produced.snapshot.notes ? [...this._produced.snapshot.notes] : undefined;

    // TODO: Implement alternatives logic - merge new ingredients as options
    // For now, return placeholder result
    return this._createJournalEntry(options.versionSpec, sessionNotes).onSuccess((journalEntry) =>
      succeed({
        journalId: journalEntry.baseId,
        journalEntry,
        newVersionSpec: options.versionSpec
      })
    );
  }

  /**
   * Saves as an entirely new recipe with new ID.
   * Use when collection is immutable or creating a derivative recipe.
   * @param options - Save options including new ID, version spec, and base weight
   * @returns Result with save result containing journal entry
   * @public
   */
  public saveAsNewRecipe(options: ISaveNewRecipeOptions): Result<ISaveResult> {
    const sessionNotes = this._produced.snapshot.notes ? [...this._produced.snapshot.notes] : undefined;

    // TODO: Implement producedToSource conversion when needed
    // For now, just create the journal entry
    return this._createJournalEntry(options.versionSpec, sessionNotes).onSuccess((journalEntry) =>
      succeed({
        journalId: journalEntry.baseId,
        journalEntry,
        newVersionSpec: options.versionSpec
      })
    );
  }

  // ============================================================================
  // Journal Creation
  // ============================================================================

  /**
   * Creates an edit journal entry from this session.
   * Records the original version and any modifications made.
   * @param notes - Optional notes to include in the journal entry
   * @returns Result with journal entry
   * @public
   */
  public toEditJournalEntry(notes?: CommonModel.ICategorizedNote[]): Result<IFillingEditJournalEntryEntity> {
    return this._createJournalEntry(undefined, notes);
  }

  /**
   * Creates a production journal entry from this session.
   * Records the produced filling with resolved concrete choices.
   * @param notes - Optional notes to include in the journal entry
   * @returns Result with production journal entry
   * @public
   */
  public toProductionJournalEntry(
    notes?: CommonModel.ICategorizedNote[]
  ): Result<IFillingProductionJournalEntryEntity> {
    return generateJournalId().onSuccess((baseId) =>
      succeed({
        type: 'filling-production' as const,
        baseId,
        timestamp: getCurrentTimestamp(),
        versionId: this._baseRecipe.versionId,
        recipe: this._baseRecipe.version,
        yield: this._produced.targetWeight,
        produced: this._produced.snapshot,
        notes
      })
    );
  }

  // ============================================================================
  // Persistence
  // ============================================================================

  /**
   * Creates a persisted session state from this editing session.
   * Captures the complete editing state including undo/redo history.
   * @param options - Persistence options including collection ID
   * @returns Result with persisted filling session
   * @public
   */
  public toPersistedState(options: {
    readonly collectionId: SourceId;
    readonly baseId?: SessionBaseId;
    readonly status?: PersistedSessionStatus;
    readonly label?: string;
    readonly notes?: CommonModel.ICategorizedNote[];
  }): Result<IPersistedFillingSession> {
    const baseIdResult = options.baseId ? succeed(options.baseId) : generateSessionBaseId();

    return baseIdResult.onSuccess((baseId) => {
      const now = getCurrentTimestamp();
      const session: IPersistedFillingSession = {
        baseId,
        sessionType: 'filling',
        status: options.status ?? 'active',
        createdAt: now,
        updatedAt: now,
        label: options.label,
        notes: options.notes,
        destination: {
          defaultCollectionId: options.collectionId
        },
        sourceVersionId: this._baseRecipe.versionId,
        history: this._produced.getSerializedHistory(this._originalSnapshot)
      };
      return succeed(session);
    });
  }

  /**
   * Restores an editing session from a persisted state.
   * Restores the complete editing state including undo/redo history.
   * @param data - Persisted session data
   * @param baseRecipe - Runtime recipe version to associate with the session
   * @returns Result with restored EditingSession
   * @public
   */
  public static fromPersistedState(
    data: IPersistedFillingSession,
    baseRecipe: IRuntimeFillingRecipeVersion
  ): Result<EditingSession> {
    // Validate that the persisted state matches the base recipe
    if (data.sourceVersionId !== baseRecipe.versionId) {
      return fail(
        `Version mismatch: persisted session is for ${data.sourceVersionId} but base recipe is ${baseRecipe.versionId}`
      );
    }

    // Restore the RuntimeProducedFilling from history
    return RuntimeProducedFilling.restoreFromHistory(data.history).onSuccess((produced) => {
      // Create the session with restored state, passing the original snapshot
      const session = new EditingSession(baseRecipe, produced, undefined, data.history.original);
      return succeed(session);
    });
  }

  // ============================================================================
  // Accessors
  // ============================================================================

  /**
   * Unique session identifier.
   * @public
   */
  public get sessionId(): SessionId {
    return this._sessionId;
  }

  /**
   * The base recipe version being edited.
   * @public
   */
  public get baseRecipe(): IRuntimeFillingRecipeVersion {
    return this._baseRecipe;
  }

  /**
   * The produced filling wrapper with undo/redo support.
   * @public
   */
  public get produced(): RuntimeProducedFilling {
    return this._produced;
  }

  /**
   * Current target weight for this filling.
   * @public
   */
  public get targetWeight(): Measurement {
    return this._produced.targetWeight;
  }

  /**
   * Whether the session has unsaved changes.
   * @public
   */
  public get hasChanges(): boolean {
    return this._produced.hasChanges(this._originalSnapshot);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Creates an edit journal entry.
   */
  private _createJournalEntry(
    updatedVersionSpec: string | undefined,
    notes: CommonModel.ICategorizedNote[] | undefined
  ): Result<IFillingEditJournalEntryEntity> {
    return generateJournalId().onSuccess((baseId) => {
      // Create updated version ID if needed
      const updatedIdResult = updatedVersionSpec
        ? CommonConverters.fillingVersionSpec.convert(updatedVersionSpec).onSuccess((versionSpec) =>
            CommonHelpers.createFillingVersionIdValidated({
              collectionId: CommonHelpers.getFillingVersionFillingId(this._baseRecipe.versionId),
              itemId: versionSpec
            })
          )
        : succeed(undefined);

      return updatedIdResult.onSuccess((updatedId) =>
        succeed({
          type: 'filling-edit' as const,
          baseId,
          timestamp: getCurrentTimestamp(),
          versionId: this._baseRecipe.versionId,
          recipe: this._baseRecipe.version,
          updated: updatedVersionSpec ? this._baseRecipe.version : undefined,
          updatedId,
          notes
        })
      );
    });
  }
}
