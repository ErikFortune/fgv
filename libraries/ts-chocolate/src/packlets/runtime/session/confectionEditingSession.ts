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
 * ConfectionEditingSession - simplified session for editing confections
 * @packageDocumentation
 */

import { captureResult, fail, Result, succeed } from '@fgv/ts-utils';

import {
  ConfectionVersionSpec,
  FillingId,
  ICategorizedNote,
  IngredientId,
  MoldId,
  ProcedureId,
  SessionId,
  SlotId,
  Helpers
} from '../../common';
import {
  IConfectionEditJournalEntry,
  IConfectionProductionJournalEntry,
  IConfectionYield,
  AnyProducedConfection
} from '../../entities';
import {
  IRuntimeConfection,
  IRuntimeBarTruffleVersion,
  IRuntimeMoldedBonBonVersion,
  IRuntimeRolledTruffleVersion
} from '../model';
import {
  RuntimeProducedBarTruffle,
  RuntimeProducedMoldedBonBon,
  RuntimeProducedRolledTruffle
} from '../produced';
import {
  ISaveAnalysis,
  ISaveConfectionVersionOptions,
  ISaveNewConfectionOptions,
  ISaveResult
} from './model';
import { generateJournalId, generateSessionId, getCurrentTimestamp } from './sessionUtils';

/**
 * A mutable editing session for modifying confection versions.
 *
 * Core architecture:
 * - Wraps an IRuntimeConfection (immutable source)
 * - Uses RuntimeProducedConfection variants for mutable editing with undo/redo
 * - Tracks original snapshot for change detection
 * - Provides save operations that integrate with library
 * - Supports type-specific methods based on confection type
 *
 * @public
 */
export class ConfectionEditingSession {
  private readonly _baseConfection: IRuntimeConfection;
  private readonly _produced:
    | RuntimeProducedMoldedBonBon
    | RuntimeProducedBarTruffle
    | RuntimeProducedRolledTruffle;
  private readonly _originalSnapshot: AnyProducedConfection;
  private readonly _sessionId: SessionId;

  /**
   * Creates a ConfectionEditingSession.
   * Use static factory method instead of calling this directly.
   * @internal
   */
  private constructor(
    baseConfection: IRuntimeConfection,
    produced: RuntimeProducedMoldedBonBon | RuntimeProducedBarTruffle | RuntimeProducedRolledTruffle,
    sessionId?: SessionId
  ) {
    this._baseConfection = baseConfection;
    this._produced = produced;
    this._originalSnapshot = produced.createSnapshot();
    this._sessionId = sessionId ?? generateSessionId().orThrow();
  }

  /**
   * Creates a new ConfectionEditingSession from a base confection.
   * Uses the golden version of the confection for editing.
   * @param baseConfection - Source confection to edit
   * @returns Result with new ConfectionEditingSession or error
   * @public
   */
  public static create(baseConfection: IRuntimeConfection): Result<ConfectionEditingSession> {
    switch (baseConfection.confectionType) {
      case 'molded-bonbon':
        return RuntimeProducedMoldedBonBon.fromSource(
          baseConfection.goldenVersion as IRuntimeMoldedBonBonVersion
        ).onSuccess((wrapper) => captureResult(() => new ConfectionEditingSession(baseConfection, wrapper)));
      case 'bar-truffle':
        return RuntimeProducedBarTruffle.fromSource(
          baseConfection.goldenVersion as IRuntimeBarTruffleVersion
        ).onSuccess((wrapper) => captureResult(() => new ConfectionEditingSession(baseConfection, wrapper)));
      case 'rolled-truffle':
        return RuntimeProducedRolledTruffle.fromSource(
          baseConfection.goldenVersion as IRuntimeRolledTruffleVersion
        ).onSuccess((wrapper) => captureResult(() => new ConfectionEditingSession(baseConfection, wrapper)));
    }
  }

  // ============================================================================
  // Common Editing Methods (delegate to _produced)
  // ============================================================================

  /**
   * Sets the yield specification.
   * @param spec - Yield specification
   * @returns Success or failure
   * @public
   */
  public setYield(spec: IConfectionYield): Result<void> {
    return this._produced.setYield(spec);
  }

  /**
   * Sets or updates a filling slot.
   * @param slotId - Slot ID
   * @param choice - Filling choice (recipe or ingredient)
   * @returns Success or failure
   * @public
   */
  public setFillingSlot(
    slotId: SlotId,
    choice: { type: 'recipe'; fillingId: FillingId } | { type: 'ingredient'; ingredientId: IngredientId }
  ): Result<void> {
    return this._produced.setFillingSlot(slotId, choice);
  }

  /**
   * Removes a filling slot.
   * @param slotId - Slot ID to remove
   * @returns Success or failure
   * @public
   */
  public removeFillingSlot(slotId: SlotId): Result<void> {
    return this._produced.removeFillingSlot(slotId);
  }

  /**
   * Sets the notes.
   * @param notes - Categorized notes array
   * @returns Success or failure
   * @public
   */
  public setNotes(notes: ICategorizedNote[]): Result<void> {
    return this._produced.setNotes(notes);
  }

  /**
   * Sets the procedure.
   * @param id - Procedure ID or undefined to clear
   * @returns Success or failure
   * @public
   */
  public setProcedure(id: ProcedureId | undefined): Result<void> {
    return this._produced.setProcedure(id);
  }

  // ============================================================================
  // Type-Specific Methods (molded bonbon)
  // ============================================================================

  /**
   * Sets the mold (molded bonbon only).
   * @param moldId - Mold ID
   * @returns Success or failure
   * @public
   */
  public setMold(moldId: MoldId): Result<void> {
    if (this._produced instanceof RuntimeProducedMoldedBonBon) {
      return this._produced.setMold(moldId);
    }
    return fail('setMold() is only available for molded bonbon confections');
  }

  /**
   * Sets the shell chocolate (molded bonbon only).
   * @param id - Shell chocolate ingredient ID
   * @returns Success or failure
   * @public
   */
  public setShellChocolate(id: IngredientId): Result<void> {
    if (this._produced instanceof RuntimeProducedMoldedBonBon) {
      return this._produced.setShellChocolate(id);
    }
    return fail('setShellChocolate() is only available for molded bonbon confections');
  }

  /**
   * Sets the seal chocolate (molded bonbon only).
   * @param id - Seal chocolate ingredient ID or undefined to clear
   * @returns Success or failure
   * @public
   */
  public setSealChocolate(id: IngredientId | undefined): Result<void> {
    if (this._produced instanceof RuntimeProducedMoldedBonBon) {
      return this._produced.setSealChocolate(id);
    }
    return fail('setSealChocolate() is only available for molded bonbon confections');
  }

  /**
   * Sets the decoration chocolate (molded bonbon only).
   * @param id - Decoration chocolate ingredient ID or undefined to clear
   * @returns Success or failure
   * @public
   */
  public setDecorationChocolate(id: IngredientId | undefined): Result<void> {
    if (this._produced instanceof RuntimeProducedMoldedBonBon) {
      return this._produced.setDecorationChocolate(id);
    }
    return fail('setDecorationChocolate() is only available for molded bonbon confections');
  }

  // ============================================================================
  // Type-Specific Methods (bar truffle and rolled truffle)
  // ============================================================================

  /**
   * Sets the enrobing chocolate (bar truffle or rolled truffle only).
   * @param id - Enrobing chocolate ingredient ID or undefined to clear
   * @returns Success or failure
   * @public
   */
  public setEnrobingChocolate(id: IngredientId | undefined): Result<void> {
    if (
      this._produced instanceof RuntimeProducedBarTruffle ||
      this._produced instanceof RuntimeProducedRolledTruffle
    ) {
      return this._produced.setEnrobingChocolate(id);
    }
    return fail('setEnrobingChocolate() is only available for bar truffle and rolled truffle confections');
  }

  // ============================================================================
  // Type-Specific Methods (rolled truffle)
  // ============================================================================

  /**
   * Sets the coating (rolled truffle only).
   * @param id - Coating ingredient ID or undefined to clear
   * @returns Success or failure
   * @public
   */
  public setCoating(id: IngredientId | undefined): Result<void> {
    if (this._produced instanceof RuntimeProducedRolledTruffle) {
      return this._produced.setCoating(id);
    }
    return fail('setCoating() is only available for rolled truffle confections');
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
    // Type-safe way to get changes based on produced type
    let changes: import('../produced/confectionWrapper').IConfectionChanges;
    if (this._produced instanceof RuntimeProducedMoldedBonBon) {
      changes = this._produced.getChanges(
        this._originalSnapshot as import('../../entities').IProducedMoldedBonBon
      );
    } else if (this._produced instanceof RuntimeProducedBarTruffle) {
      changes = this._produced.getChanges(
        this._originalSnapshot as import('../../entities').IProducedBarTruffle
      );
    } else {
      changes = this._produced.getChanges(
        this._originalSnapshot as import('../../entities').IProducedRolledTruffle
      );
    }

    // TODO: Check collection mutability when that property is added to confection
    // For now, assume all collections are mutable
    const isMutable = true;

    // Determine what changed
    const ingredientsChanged = changes.fillingsChanged;
    const weightChanged = changes.yieldChanged;
    const notesChanged = changes.notesChanged;

    return {
      canCreateVersion: isMutable,
      canAddAlternatives: false, // Confections don't support adding alternatives
      mustCreateNew: !isMutable,
      recommendedOption: !isMutable ? 'new' : 'version',
      changes: {
        ingredientsAdded: ingredientsChanged,
        ingredientsRemoved: ingredientsChanged,
        ingredientsChanged,
        weightChanged,
        notesChanged
      }
    };
  }

  // ============================================================================
  // Save Operations
  // ============================================================================

  /**
   * Saves as a new version of the original confection.
   * Requires that the collection is mutable.
   * @param options - Save options including version spec
   * @returns Result with save result containing journal entry and version spec
   * @public
   */
  public saveAsNewVersion(options: ISaveConfectionVersionOptions): Result<ISaveResult> {
    const analysis = this.analyzeSaveOptions();
    if (!analysis.canCreateVersion) {
      return fail('Cannot create new version: collection is immutable');
    }

    const sessionNotes = this._produced.snapshot.notes ? [...this._produced.snapshot.notes] : undefined;

    // TODO: Implement producedToSource conversion when needed
    // For now, just create the journal entry
    return this._createEditJournalEntry(options.versionSpec, sessionNotes).onSuccess((journalEntry) =>
      succeed({
        journalId: journalEntry.id,
        journalEntry,
        newVersionSpec: options.versionSpec
      })
    );
  }

  /**
   * Saves as an entirely new confection with new ID.
   * Use when collection is immutable or creating a derivative confection.
   * @param options - Save options including new ID and version spec
   * @returns Result with save result containing journal entry
   * @public
   */
  public saveAsNewConfection(options: ISaveNewConfectionOptions): Result<ISaveResult> {
    const sessionNotes = this._produced.snapshot.notes ? [...this._produced.snapshot.notes] : undefined;

    // TODO: Implement producedToSource conversion when needed
    // For now, just create the journal entry
    return this._createEditJournalEntry(options.versionSpec, sessionNotes).onSuccess((journalEntry) =>
      succeed({
        journalId: journalEntry.id,
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
  public toEditJournalEntry(notes?: ICategorizedNote[]): Result<IConfectionEditJournalEntry> {
    return this._createEditJournalEntry(undefined, notes);
  }

  /**
   * Creates a production journal entry from this session.
   * Records the produced confection with resolved concrete choices.
   * @param notes - Optional notes to include in the journal entry
   * @returns Result with production journal entry
   * @public
   */
  public toProductionJournalEntry(notes?: ICategorizedNote[]): Result<IConfectionProductionJournalEntry> {
    return generateJournalId().onSuccess((id) =>
      succeed({
        type: 'confection-production' as const,
        id,
        timestamp: getCurrentTimestamp(),
        versionId: this._produced.versionId,
        recipe: this._baseConfection.goldenVersion.version,
        yield: this._produced.yield,
        produced: this._produced.snapshot,
        notes
      })
    );
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
   * The base confection being edited.
   * @public
   */
  public get baseConfection(): IRuntimeConfection {
    return this._baseConfection;
  }

  /**
   * The produced confection wrapper with undo/redo support.
   * @public
   */
  public get produced():
    | RuntimeProducedMoldedBonBon
    | RuntimeProducedBarTruffle
    | RuntimeProducedRolledTruffle {
    return this._produced;
  }

  /**
   * The confection type.
   * @public
   */
  public get confectionType(): 'molded-bonbon' | 'bar-truffle' | 'rolled-truffle' {
    return this._baseConfection.confectionType;
  }

  /**
   * Whether the session has unsaved changes.
   * @public
   */
  public get hasChanges(): boolean {
    // Type-safe way to check changes based on produced type
    if (this._produced instanceof RuntimeProducedMoldedBonBon) {
      return this._produced.hasChanges(
        this._originalSnapshot as import('../../entities').IProducedMoldedBonBon
      );
    } else if (this._produced instanceof RuntimeProducedBarTruffle) {
      return this._produced.hasChanges(
        this._originalSnapshot as import('../../entities').IProducedBarTruffle
      );
    } else {
      return this._produced.hasChanges(
        this._originalSnapshot as import('../../entities').IProducedRolledTruffle
      );
    }
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Creates an edit journal entry.
   */
  private _createEditJournalEntry(
    updatedVersionSpec: ConfectionVersionSpec | undefined,
    notes: ICategorizedNote[] | undefined
  ): Result<IConfectionEditJournalEntry> {
    return generateJournalId().onSuccess((id) => {
      // Create updated version ID if needed
      const updatedIdResult = updatedVersionSpec
        ? Helpers.createConfectionVersionId({
            collectionId: this._baseConfection.id,
            itemId: updatedVersionSpec
          })
        : succeed(undefined);

      return updatedIdResult.onSuccess((updatedId) =>
        succeed({
          type: 'confection-edit' as const,
          id,
          timestamp: getCurrentTimestamp(),
          versionId: this._produced.versionId,
          recipe: this._baseConfection.goldenVersion.version,
          updated: updatedVersionSpec ? this._baseConfection.goldenVersion.version : undefined,
          updatedId,
          notes
        })
      );
    });
  }
}
