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
  FillingRecipeVariationId,
  GroupName,
  IngredientId,
  Measurement,
  MeasurementUnit,
  ProcedureId,
  BaseSessionId,
  SessionSpec,
  CollectionId,
  Helpers as CommonHelpers,
  Converters as CommonConverters,
  Model as CommonModel
} from '../../common';
import {
  Fillings,
  IFillingEditJournalEntryEntity,
  IFillingProductionJournalEntryEntity,
  IFillingSessionEntity,
  IProducedFillingEntity,
  PersistedSessionStatus
} from '../../entities';
import { IMaterializedSessionBase } from '../model';
import { IFillingRecipeVariation, ProducedFilling } from '../../library-runtime';
import {
  ISaveAnalysis,
  ISaveVariationOptions,
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
 * A mutable editing session for modifying filling recipe variations.
 *
 * Core architecture:
 * - Wraps an IRuntimeFillingRecipeVariation (immutable source)
 * - Uses RuntimeProducedFilling for mutable editing with undo/redo
 * - Tracks original snapshot for change detection
 * - Provides save operations that integrate with library
 *
 * @public
 */
export class EditingSession implements IMaterializedSessionBase {
  private readonly _baseRecipe: IFillingRecipeVariation;
  private readonly _produced: ProducedFilling;
  private _originalSnapshot: IProducedFillingEntity;
  private readonly _sessionId: SessionSpec;
  private readonly _persistedEntity: IFillingSessionEntity | undefined;

  /**
   * Creates an EditingSession.
   * Use static factory method instead of calling this directly.
   * @param baseRecipe - The base recipe variation being edited
   * @param produced - The RuntimeProducedFilling wrapper
   * @param sessionId - Optional session ID (generates new if not provided)
   * @param originalSnapshot - Optional original snapshot for restoration (uses current if not provided)
   * @param persistedEntity - Optional persisted entity (set when restoring from persisted state)
   * @internal
   */
  private constructor(
    baseRecipe: IFillingRecipeVariation,
    produced: ProducedFilling,
    sessionId?: SessionSpec,
    originalSnapshot?: IProducedFillingEntity,
    persistedEntity?: IFillingSessionEntity
  ) {
    this._baseRecipe = baseRecipe;
    this._produced = produced;
    this._originalSnapshot = originalSnapshot ?? produced.createSnapshot();
    // TODO: this is an observable external contract (id generated if not supplied) that should be tested.
    /* c8 ignore next 1 - branch: sessionId param exists for future restore-with-id but is not yet wired */
    this._sessionId = sessionId ?? generateSessionId().orThrow();
    this._persistedEntity = persistedEntity;
  }

  /**
   * Creates a new EditingSession from a base recipe variation.
   * @param baseRecipe - Source recipe variation to edit
   * @param initialScale - Optional initial scale factor (default: 1.0)
   * @returns Result with new EditingSession or error
   * @public
   */
  public static create(baseRecipe: IFillingRecipeVariation, initialScale?: number): Result<EditingSession> {
    const scaleFactor = initialScale ?? 1.0;
    if (scaleFactor <= 0) {
      return fail('Scale factor must be positive');
    }

    return ProducedFilling.fromSource(baseRecipe, scaleFactor).onSuccess((produced) =>
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
   * Replaces an existing ingredient with a new one at the same position.
   * @param oldId - Ingredient ID to replace
   * @param newId - New ingredient ID
   * @param amount - Amount of ingredient
   * @param unit - Optional measurement unit
   * @param modifiers - Optional ingredient modifiers
   * @returns Success or failure
   * @public
   */
  public replaceIngredient(
    oldId: IngredientId,
    newId: IngredientId,
    amount: Measurement,
    unit?: MeasurementUnit,
    modifiers?: Fillings.IIngredientModifiers
  ): Result<void> {
    return this._produced.replaceIngredient(oldId, newId, amount, unit, modifiers);
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
    const isMutable = this._baseRecipe.isMutable;

    return {
      canCreateVariation: isMutable,
      canAddAlternatives: isMutable && (changes.ingredientsChanged || changes.procedureChanged),
      mustCreateNew: !isMutable,
      recommendedOption: !isMutable
        ? 'new'
        : changes.ingredientsChanged || changes.procedureChanged
        ? 'alternatives'
        : 'variation',
      changes: {
        ingredientsAdded: changes.ingredientsChanged,
        ingredientsRemoved: changes.ingredientsChanged,
        ingredientsChanged: changes.ingredientsChanged,
        procedureChanged: changes.procedureChanged,
        weightChanged: changes.targetWeightChanged,
        notesChanged: changes.notesChanged
      }
    };
  }

  // ============================================================================
  // Save Operations
  // ============================================================================

  /**
   * Saves as a new variation of the original recipe.
   * Requires that the collection is mutable.
   * @param options - Save options including variation spec and base weight
   * @returns Result with save result containing journal entry and variation spec
   * @public
   */
  public saveAsNewVariation(options: ISaveVariationOptions): Result<ISaveResult> {
    const analysis = this.analyzeSaveOptions();
    if (!analysis.canCreateVariation) {
      return fail('Cannot create new variation: collection is immutable');
    }

    const sessionNotes = this._produced.snapshot.notes ? [...this._produced.snapshot.notes] : undefined;

    // Convert produced state to source variation entity
    return ProducedFilling.toSourceVariation(this._produced.snapshot, options.variationSpec).onSuccess(
      (variationEntity) =>
        this._createJournalEntry(options.variationSpec, sessionNotes).onSuccess((journalEntry) =>
          succeed({
            journalId: journalEntry.baseId,
            journalEntry,
            newVariationSpec: options.variationSpec,
            variationEntity
          })
        )
    );
  }

  /**
   * Saves by adding ingredients as alternatives to existing variation.
   * Requires that the collection is mutable and ingredients changed.
   * @param options - Save options including variation spec
   * @returns Result with save result containing journal entry
   * @public
   */
  public saveAsAlternatives(options: ISaveAlternativesOptions): Result<ISaveResult> {
    const analysis = this.analyzeSaveOptions();
    if (!analysis.canAddAlternatives) {
      return fail('Cannot add alternatives: collection is immutable or no ingredient changes');
    }

    const sessionNotes = this._produced.snapshot.notes ? [...this._produced.snapshot.notes] : undefined;

    // Merge produced choices as alternatives into original variation
    return ProducedFilling.mergeAsAlternatives(this._produced.snapshot, this._baseRecipe.entity).onSuccess(
      (mergedVariation) =>
        this._createJournalEntry(options.variationSpec, sessionNotes).onSuccess((journalEntry) =>
          succeed({
            journalId: journalEntry.baseId,
            journalEntry,
            newVariationSpec: options.variationSpec,
            variationEntity: mergedVariation
          })
        )
    );
  }

  /**
   * Saves as an entirely new recipe with new ID.
   * Use when collection is immutable or creating a derivative recipe.
   * @param options - Save options including new ID, variation spec, and base weight
   * @returns Result with save result containing journal entry
   * @public
   */
  public saveAsNewRecipe(options: ISaveNewRecipeOptions): Result<ISaveResult> {
    const sessionNotes = this._produced.snapshot.notes ? [...this._produced.snapshot.notes] : undefined;

    // Convert produced state to source variation entity
    return ProducedFilling.toSourceVariation(this._produced.snapshot, options.variationSpec).onSuccess(
      (variationEntity) =>
        this._createJournalEntry(options.variationSpec, sessionNotes).onSuccess((journalEntry) =>
          succeed({
            journalId: journalEntry.baseId,
            journalEntry,
            newVariationSpec: options.variationSpec,
            variationEntity
          })
        )
    );
  }

  // ============================================================================
  // Journal Creation
  // ============================================================================

  /**
   * Creates an edit journal entry from this session.
   * Records the original variation and any modifications made.
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
        variationId: this._baseRecipe.variationId,
        recipe: this._baseRecipe.entity,
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
    readonly collectionId: CollectionId;
    readonly baseId?: BaseSessionId;
    readonly status?: PersistedSessionStatus;
    readonly label?: string;
    readonly notes?: CommonModel.ICategorizedNote[];
  }): Result<IFillingSessionEntity> {
    const baseIdResult = options.baseId ? succeed(options.baseId) : generateSessionBaseId();

    return baseIdResult.onSuccess((baseId) => {
      const now = getCurrentTimestamp();
      const session: IFillingSessionEntity = {
        baseId,
        sessionType: 'filling',
        status: options.status ?? 'planning',
        createdAt: now,
        updatedAt: now,
        label: options.label,
        notes: options.notes,
        destination: {
          defaultCollectionId: options.collectionId
        },
        sourceVariationId: this._baseRecipe.variationId,
        history: this._produced.getSerializedHistory(this._originalSnapshot)
      };
      return succeed(session);
    });
  }

  /**
   * Restores an editing session from a persisted state.
   * Restores the complete editing state including undo/redo history.
   * @param data - Persisted session data
   * @param baseRecipe - Runtime recipe variation to associate with the session
   * @returns Result with restored EditingSession
   * @public
   */
  public static fromPersistedState(
    data: IFillingSessionEntity,
    baseRecipe: IFillingRecipeVariation
  ): Result<EditingSession> {
    // Validate that the persisted state matches the base recipe
    if (data.sourceVariationId !== baseRecipe.variationId) {
      return fail(
        `Variation mismatch: persisted session is for ${data.sourceVariationId} but base recipe is ${baseRecipe.variationId}`
      );
    }

    // Restore the RuntimeProducedFilling from history
    return ProducedFilling.restoreFromHistory(data.history).onSuccess((produced) => {
      // Create the session with restored state, passing the original snapshot and persisted entity
      const session = new EditingSession(baseRecipe, produced, undefined, data.history.original, data);
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
  public get sessionId(): SessionSpec {
    return this._sessionId;
  }

  /**
   * The base recipe variation being edited.
   * @public
   */
  public get baseRecipe(): IFillingRecipeVariation {
    return this._baseRecipe;
  }

  /**
   * The produced filling wrapper with undo/redo support.
   * @public
   */
  public get produced(): ProducedFilling {
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

  /**
   * Resets the change-detection baseline to the current produced state.
   * Call after a successful save so that `hasChanges` returns false
   * until the next mutation.
   * @public
   */
  public markSaved(): void {
    this._originalSnapshot = this._produced.createSnapshot();
  }

  // ============================================================================
  // IMaterializedSessionBase Accessors
  // ============================================================================

  /**
   * Base identifier within the collection (no collection prefix).
   * @public
   */
  public get baseId(): BaseSessionId {
    return this._persistedEntity?.baseId ?? ('' as BaseSessionId);
  }

  /**
   * Session type discriminator - always 'filling' for EditingSession.
   * @public
   */
  public get sessionType(): 'filling' {
    return 'filling';
  }

  /**
   * Current lifecycle status.
   * @public
   */
  public get status(): PersistedSessionStatus {
    return this._persistedEntity?.status ?? 'planning';
  }

  /**
   * User-provided label for the session.
   * @public
   */
  public get label(): string | undefined {
    return this._persistedEntity?.label;
  }

  /**
   * Optional group identifier for organizing related sessions.
   * @public
   */
  public get group(): GroupName | undefined {
    return this._persistedEntity?.group;
  }

  /**
   * ISO 8601 timestamp when session was created.
   * @public
   */
  public get createdAt(): string {
    return this._persistedEntity?.createdAt ?? '';
  }

  /**
   * ISO 8601 timestamp when session was last updated.
   * @public
   */
  public get updatedAt(): string {
    return this._persistedEntity?.updatedAt ?? '';
  }

  /**
   * Optional categorized notes.
   * @public
   */
  public get notes(): ReadonlyArray<CommonModel.ICategorizedNote> | undefined {
    return this._persistedEntity?.notes;
  }

  /**
   * Source filling variation ID for this session.
   * @public
   */
  public get sourceVariationId(): FillingRecipeVariationId {
    return this._baseRecipe.variationId;
  }

  /**
   * The underlying persisted entity.
   * @public
   */
  public get entity(): IFillingSessionEntity {
    if (!this._persistedEntity) {
      throw new Error('EditingSession has no persisted entity (session was created, not restored)');
    }
    return this._persistedEntity;
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Creates an edit journal entry.
   */
  private _createJournalEntry(
    updatedVariationSpec: string | undefined,
    notes: CommonModel.ICategorizedNote[] | undefined
  ): Result<IFillingEditJournalEntryEntity> {
    return generateJournalId().onSuccess((baseId) => {
      // Create updated variation ID if needed
      const updatedIdResult = updatedVariationSpec
        ? CommonConverters.fillingRecipeVariationSpec
            .convert(updatedVariationSpec)
            .onSuccess((variationSpec) =>
              CommonHelpers.createFillingRecipeVariationIdValidated({
                collectionId: CommonHelpers.getFillingRecipeVariationFillingId(this._baseRecipe.variationId),
                itemId: variationSpec
              })
            )
        : succeed(undefined);

      return updatedIdResult.onSuccess((updatedId) =>
        succeed({
          type: 'filling-edit' as const,
          baseId,
          timestamp: getCurrentTimestamp(),
          variationId: this._baseRecipe.variationId,
          recipe: this._baseRecipe.entity,
          updated: updatedVariationSpec ? this._baseRecipe.entity : undefined,
          updatedId,
          notes
        })
      );
    });
  }
}
