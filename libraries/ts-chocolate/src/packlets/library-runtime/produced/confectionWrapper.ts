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
 * ProducedConfection - mutable wrapper for produced confections with undo/redo
 * @packageDocumentation
 */

import { Result, succeed, fail, mapResults } from '@fgv/ts-utils';

import {
  ConfectionRecipeVariationId,
  FillingId,
  IngredientId,
  MoldId,
  Model as CommonModel,
  ProcedureId,
  SlotId,
  Helpers
} from '../../common';
import {
  Confections,
  Session,
  AnyProducedConfectionEntity,
  IProducedBarTruffleEntity,
  IProducedMoldedBonBonEntity,
  IProducedRolledTruffleEntity
} from '../../entities';
import type {
  IBarTruffleRecipeVariation,
  IMoldedBonBonRecipeVariation,
  IRolledTruffleRecipeVariation,
  IResolvedFillingSlot
} from '../model';

/**
 * Maximum number of undo snapshots to retain
 */
const MAX_HISTORY_SIZE: number = 50;

/**
 * Structure describing what changed between two produced confections
 * @public
 */
export interface IConfectionChanges {
  /** True if yield changed */
  readonly yieldChanged: boolean;
  /** True if fillings changed (added, removed, or modified) */
  readonly fillingsChanged: boolean;
  /** True if notes changed */
  readonly notesChanged: boolean;
  /** True if procedure changed */
  readonly procedureChanged: boolean;
  /** True if mold changed (molded bonbon only) */
  readonly moldChanged: boolean;
  /** True if shell chocolate changed (molded bonbon only) */
  readonly shellChocolateChanged: boolean;
  /** True if seal chocolate changed (molded bonbon only) */
  readonly sealChocolateChanged: boolean;
  /** True if decoration chocolate changed (molded bonbon only) */
  readonly decorationChocolateChanged: boolean;
  /** True if enrobing chocolate changed (bar truffle or rolled truffle) */
  readonly enrobingChocolateChanged: boolean;
  /** True if coating changed (rolled truffle only) */
  readonly coatingChanged: boolean;
  /** True if any changes were detected */
  readonly hasChanges: boolean;
}

/**
 * Mutable wrapper base class for IProducedConfection with undo/redo support.
 * Provides common editing methods and history management.
 * @public
 */
export abstract class ProducedConfectionBase<T extends AnyProducedConfectionEntity> {
  protected _current: T;
  protected _undoStack: T[];
  protected _redoStack: T[];

  /**
   * Creates a ProducedConfectionBase.
   * Use static factory methods on derived classes instead of calling this directly.
   * @internal
   */
  protected constructor(initial: T) {
    this._current = initial;
    this._undoStack = [];
    this._redoStack = [];
  }

  // ============================================================================
  // Snapshot Management
  // ============================================================================

  /**
   * Creates an immutable snapshot of the current state.
   * @returns Immutable copy of current produced confection
   * @public
   */
  public createSnapshot(): T {
    return this._deepCopy(this._current);
  }

  /**
   * Restores state from a snapshot.
   * Pushes current state to undo stack and clears redo stack.
   * @param snapshot - Snapshot to restore
   * @returns Success or failure
   * @public
   */
  public restoreSnapshot(snapshot: T): Result<void> {
    this._pushUndo();
    this._current = this._deepCopy(snapshot);
    this._redoStack = [];
    return succeed(undefined);
  }

  // ============================================================================
  // Undo/Redo
  // ============================================================================

  /**
   * Undoes the last change.
   * Pops from undo stack, pushes current to redo, and restores previous state.
   * @returns Success with true if undo succeeded, Success with false if no history
   * @public
   */
  public undo(): Result<boolean> {
    if (this._undoStack.length === 0) {
      return succeed(false);
    }

    const previous = this._undoStack.pop()!;
    this._redoStack.push(this._deepCopy(this._current));
    this._current = previous;
    return succeed(true);
  }

  /**
   * Redoes the last undone change.
   * Pops from redo stack, pushes current to undo, and restores future state.
   * @returns Success with true if redo succeeded, Success with false if no future
   * @public
   */
  public redo(): Result<boolean> {
    if (this._redoStack.length === 0) {
      return succeed(false);
    }

    const future = this._redoStack.pop()!;
    this._undoStack.push(this._deepCopy(this._current));
    this._current = future;
    return succeed(true);
  }

  /**
   * Checks if undo is available.
   * @returns True if undo stack is not empty
   * @public
   */
  public canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  /**
   * Checks if redo is available.
   * @returns True if redo stack is not empty
   * @public
   */
  public canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Gets the serialized editing history for persistence.
   * Captures current state, original state, and undo/redo stacks.
   * @param original - The original state when session started
   * @returns Serialized editing history
   * @public
   */
  public getSerializedHistory(original: T): Session.ISerializedEditingHistoryEntity<T> {
    return {
      current: this._deepCopy(this._current),
      original: this._deepCopy(original),
      undoStack: this._undoStack.map((state) => this._deepCopy(state)),
      redoStack: this._redoStack.map((state) => this._deepCopy(state))
    };
  }

  // ============================================================================
  // Common Editing Methods
  // ============================================================================

  /**
   * Sets the notes.
   * Pushes current state to undo before change, clears redo.
   * @param notes - Categorized notes array
   * @returns Success or failure
   * @public
   */
  public setNotes(notes: CommonModel.ICategorizedNote[]): Result<void> {
    this._pushUndo();

    this._current = {
      ...this._current,
      notes: notes.length > 0 ? notes : undefined
    } as T;
    this._redoStack = [];

    return succeed(undefined);
  }

  /**
   * Sets the procedure.
   * Pushes current state to undo before change, clears redo.
   * @param id - Procedure ID or undefined to clear
   * @returns Success or failure
   * @public
   */
  public setProcedure(id: ProcedureId | undefined): Result<void> {
    this._pushUndo();

    this._current = {
      ...this._current,
      procedureId: id
    } as T;
    this._redoStack = [];

    return succeed(undefined);
  }

  /**
   * Scales to a new yield specification.
   * Pushes current state to undo before change, clears redo.
   *
   * Note: This method updates the yield in the confection data. Actual filling scaling
   * must be handled at a higher level (e.g., in sessions) where the filling library is accessible.
   *
   * @param yieldSpec - Target yield specification
   * @returns Success with actual achieved yield, or failure
   * @public
   */
  public scaleToYield(yieldSpec: Confections.IConfectionYield): Result<Confections.IConfectionYield> {
    if (yieldSpec.count <= 0) {
      return fail(`Yield count must be positive: ${yieldSpec.count}`);
    }
    if (yieldSpec.weightPerPiece !== undefined && yieldSpec.weightPerPiece <= 0) {
      return fail(`Weight per piece must be positive: ${yieldSpec.weightPerPiece}`);
    }

    this._pushUndo();

    this._current = {
      ...this._current,
      yield: yieldSpec
    } as T;
    this._redoStack = [];

    return succeed(yieldSpec);
  }

  /**
   * Sets or updates a filling slot.
   * Pushes current state to undo before change, clears redo.
   * @param slotId - Slot ID
   * @param choice - Filling choice (recipe or ingredient)
   * @returns Success or failure
   * @public
   */
  public setFillingSlot(
    slotId: SlotId,
    choice: { type: 'recipe'; fillingId: FillingId } | { type: 'ingredient'; ingredientId: IngredientId }
  ): Result<void> {
    this._pushUndo();

    const fillings = [...(this._current.fillings ?? [])];
    const existingIndex = fillings.findIndex((slot) => slot.slotId === slotId);

    const newSlot: Confections.AnyResolvedFillingSlotEntity =
      choice.type === 'recipe'
        ? {
            slotType: 'recipe' as const,
            slotId,
            fillingId: choice.fillingId
          }
        : {
            slotType: 'ingredient' as const,
            slotId,
            ingredientId: choice.ingredientId
          };

    if (existingIndex >= 0) {
      fillings[existingIndex] = newSlot;
    } else {
      fillings.push(newSlot);
    }

    this._current = {
      ...this._current,
      fillings: fillings.length > 0 ? fillings : undefined
    } as T;
    this._redoStack = [];

    return succeed(undefined);
  }

  /**
   * Removes a filling slot.
   * Pushes current state to undo before change, clears redo.
   * @param slotId - Slot ID to remove
   * @returns Success or failure
   * @public
   */
  public removeFillingSlot(slotId: SlotId): Result<void> {
    if (!this._current.fillings) {
      return fail(`No fillings defined in confection`);
    }

    const existingIndex = this._current.fillings.findIndex((slot) => slot.slotId === slotId);

    if (existingIndex < 0) {
      return fail(`Filling slot ${slotId} not found in confection`);
    }

    this._pushUndo();

    const fillings = this._current.fillings.filter((slot) => slot.slotId !== slotId);

    this._current = {
      ...this._current,
      fillings: fillings.length > 0 ? fillings : undefined
    } as T;
    this._redoStack = [];

    return succeed(undefined);
  }

  // ============================================================================
  // Read-only Access
  // ============================================================================

  /**
   * Gets the current state as an immutable snapshot.
   * @public
   */
  public get snapshot(): T {
    return this.createSnapshot();
  }

  /**
   * Gets the version ID.
   * @public
   */
  public get versionId(): ConfectionRecipeVariationId {
    return this._current.variationId;
  }

  /**
   * Gets the yield specification.
   * @public
   */
  public get yield(): Confections.IConfectionYield {
    return this._current.yield;
  }

  /**
   * Gets the fillings as a readonly array.
   * @public
   */
  public get fillings(): ReadonlyArray<Confections.AnyResolvedFillingSlotEntity> | undefined {
    return this._current.fillings;
  }

  /**
   * Gets the notes as a readonly array.
   * @public
   */
  public get notes(): ReadonlyArray<CommonModel.ICategorizedNote> | undefined {
    return this._current.notes;
  }

  /**
   * Gets the current produced confection.
   * @public
   */
  public get current(): T {
    return this._current;
  }

  /**
   * Gets the procedure ID.
   * @public
   */
  public get procedureId(): ProcedureId | undefined {
    return this._current.procedureId;
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  /**
   * Checks if current state differs from original.
   * Uses deep equality check.
   * @param original - Original produced confection to compare against
   * @returns True if changes were detected
   * @public
   */
  public hasChanges(original: T): boolean {
    return this.getChanges(original).hasChanges;
  }

  /**
   * Gets detailed changes between current state and original.
   * @param original - Original produced confection to compare against
   * @returns Structure describing what changed
   * @public
   */
  public abstract getChanges(original: T): IConfectionChanges;

  // ============================================================================
  // Protected Helpers
  // ============================================================================

  /**
   * Pushes current state to undo stack, maintaining max size.
   */
  protected _pushUndo(): void {
    this._undoStack.push(this._deepCopy(this._current));

    if (this._undoStack.length > MAX_HISTORY_SIZE) {
      this._undoStack.shift();
    }
  }

  /**
   * Creates a deep copy of a produced confection.
   */
  protected abstract _deepCopy(confection: T): T;

  /**
   * Compares base confection properties for equality.
   */
  protected _baseChanges(original: T): Partial<IConfectionChanges> {
    const yieldChanged = !this._yieldEqual(this._current.yield, original.yield);
    const fillingsChanged = !this._fillingsEqual(this._current.fillings, original.fillings);
    const notesChanged = !this._notesEqual(this._current.notes, original.notes);
    const procedureChanged = this._current.procedureId !== original.procedureId;

    return {
      yieldChanged,
      fillingsChanged,
      notesChanged,
      procedureChanged
    };
  }

  /**
   * Compares two yield specifications for equality.
   */
  private _yieldEqual(a: Confections.IConfectionYield, b: Confections.IConfectionYield): boolean {
    return a.count === b.count && a.unit === b.unit && a.weightPerPiece === b.weightPerPiece;
  }

  /**
   * Compares two filling arrays for equality.
   */
  private _fillingsEqual(
    a: ReadonlyArray<Confections.AnyResolvedFillingSlotEntity> | undefined,
    b: ReadonlyArray<Confections.AnyResolvedFillingSlotEntity> | undefined
  ): boolean {
    if (a === undefined && b === undefined) {
      return true;
    }
    if (a === undefined || b === undefined) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }

    // Create sorted copies for comparison
    const sortedA = [...a].sort((x, y) => x.slotId.localeCompare(y.slotId));
    const sortedB = [...b].sort((x, y) => x.slotId.localeCompare(y.slotId));

    for (let i = 0; i < sortedA.length; i++) {
      if (!this._fillingSlotEqual(sortedA[i], sortedB[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Compares two filling slots for equality.
   */
  private _fillingSlotEqual(
    a: Confections.AnyResolvedFillingSlotEntity,
    b: Confections.AnyResolvedFillingSlotEntity
  ): boolean {
    if (a.slotId !== b.slotId || a.slotType !== b.slotType) {
      return false;
    }

    if (a.slotType === 'recipe' && b.slotType === 'recipe') {
      return a.fillingId === b.fillingId;
    }

    if (a.slotType === 'ingredient' && b.slotType === 'ingredient') {
      return a.ingredientId === b.ingredientId;
    }

    return false;
  }

  /**
   * Compares two notes arrays for equality.
   */
  private _notesEqual(
    a: ReadonlyArray<CommonModel.ICategorizedNote> | undefined,
    b: ReadonlyArray<CommonModel.ICategorizedNote> | undefined
  ): boolean {
    if (a === undefined && b === undefined) {
      return true;
    }
    if (a === undefined || b === undefined) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }

    // Create sorted copies for comparison
    const sortedA = [...a].sort((x, y) => x.category.localeCompare(y.category));
    const sortedB = [...b].sort((x, y) => x.category.localeCompare(y.category));

    for (let i = 0; i < sortedA.length; i++) {
      if (sortedA[i].category !== sortedB[i].category || sortedA[i].note !== sortedB[i].note) {
        return false;
      }
    }

    return true;
  }
}

// ============================================================================
// Molded BonBon Wrapper
// ============================================================================

/**
 * Mutable wrapper for IProducedMoldedBonBon with undo/redo support.
 * Provides molded bonbon-specific editing methods.
 * @public
 */
export class ProducedMoldedBonBon extends ProducedConfectionBase<IProducedMoldedBonBonEntity> {
  /**
   * Factory method for creating a ProducedMoldedBonBon from an existing produced molded bonbon.
   * @param initial - The initial produced molded bonbon state
   * @returns Success with ProducedMoldedBonBon
   * @public
   */
  public static create(initial: IProducedMoldedBonBonEntity): Result<ProducedMoldedBonBon> {
    return succeed(new ProducedMoldedBonBon(initial));
  }

  /**
   * Factory method for creating a ProducedMoldedBonBon from a source version.
   * @param source - Source molded bonbon version with runtime wrapper
   * @returns Result containing ProducedMoldedBonBon or error
   * @public
   */
  public static fromSource(source: IMoldedBonBonRecipeVariation): Result<ProducedMoldedBonBon> {
    return ProducedMoldedBonBon._convertFromSource(source).onSuccess((produced) =>
      ProducedMoldedBonBon.create(produced)
    );
  }

  /**
   * Restores a ProducedMoldedBonBon from serialized editing history.
   * @param history - Serialized editing history
   * @returns Result containing ProducedMoldedBonBon or error
   * @public
   */
  public static restoreFromHistory(
    history: Session.ISerializedEditingHistoryEntity<IProducedMoldedBonBonEntity>
  ): Result<ProducedMoldedBonBon> {
    const instance = new ProducedMoldedBonBon(history.current);
    instance._undoStack = [...history.undoStack];
    instance._redoStack = [...history.redoStack];
    return succeed(instance);
  }

  /**
   * Converts source molded bonbon to produced molded bonbon entity.
   * Uses proper helpers and getters, no unsafe casts.
   * @internal
   */
  private static _convertFromSource(
    source: IMoldedBonBonRecipeVariation
  ): Result<IProducedMoldedBonBonEntity> {
    // Create and validate version ID using helper
    return Helpers.createConfectionRecipeVariationId({
      collectionId: source.confectionId,
      itemId: source.variationSpec
    }).onSuccess((versionId) => {
      // Convert filling slots if present
      const fillingsResult = source.fillings
        ? ProducedMoldedBonBon._convertFillingSlots(source.fillings)
        : succeed(undefined);

      return fillingsResult.onSuccess((fillings) => {
        const produced: IProducedMoldedBonBonEntity = {
          confectionType: 'molded-bonbon',
          variationId: versionId,
          yield: source.yield,
          moldId: source.preferredMold?.id!,
          shellChocolateId: source.shellChocolate.chocolate.id,
          sealChocolateId: source.additionalChocolates?.find((c) => c.purpose === 'seal')?.chocolate.chocolate
            .id,
          decorationChocolateId: source.additionalChocolates?.find((c) => c.purpose === 'decoration')
            ?.chocolate.chocolate.id,
          fillings,
          procedureId: source.preferredProcedure?.id,
          notes: source.entity.notes
        };
        return succeed(produced);
      });
    });
  }

  /**
   * Converts runtime filling slots to produced format.
   * @internal
   */
  private static _convertFillingSlots(
    slots: ReadonlyArray<IResolvedFillingSlot>
  ): Result<
    ReadonlyArray<Confections.IResolvedFillingSlotEntity | Confections.IResolvedIngredientSlotEntity>
  > {
    const slotResults = slots.map((slot) => ProducedMoldedBonBon._convertFillingSlot(slot));
    return mapResults(slotResults);
  }

  /**
   * Converts a single filling slot to produced format.
   * @internal
   */
  private static _convertFillingSlot(
    slot: IResolvedFillingSlot
  ): Result<Confections.IResolvedFillingSlotEntity | Confections.IResolvedIngredientSlotEntity> {
    const option = Helpers.getPreferredOrFirst(slot.filling);
    if (option === undefined) {
      return fail(`Filling slot ${slot.slotId} has no options`);
    }

    if (option.type === 'recipe') {
      return succeed({
        slotType: 'recipe' as const,
        slotId: slot.slotId,
        fillingId: option.id
      });
    }

    return succeed({
      slotType: 'ingredient' as const,
      slotId: slot.slotId,
      ingredientId: option.id
    });
  }

  // ============================================================================
  // Type-Specific Editing Methods
  // ============================================================================

  /**
   * Sets the mold.
   * Pushes current state to undo before change, clears redo.
   * @param moldId - Mold ID
   * @returns Success or failure
   * @public
   */
  public setMold(moldId: MoldId): Result<void> {
    this._pushUndo();

    this._current = {
      ...this._current,
      moldId
    };
    this._redoStack = [];

    return succeed(undefined);
  }

  /**
   * Sets the shell chocolate.
   * Pushes current state to undo before change, clears redo.
   * @param chocolateId - Shell chocolate ingredient ID
   * @returns Success or failure
   * @public
   */
  public setShellChocolate(chocolateId: IngredientId): Result<void> {
    this._pushUndo();

    this._current = {
      ...this._current,
      shellChocolateId: chocolateId
    };
    this._redoStack = [];

    return succeed(undefined);
  }

  /**
   * Sets the seal chocolate.
   * Pushes current state to undo before change, clears redo.
   * @param chocolateId - Seal chocolate ingredient ID or undefined to clear
   * @returns Success or failure
   * @public
   */
  public setSealChocolate(chocolateId: IngredientId | undefined): Result<void> {
    this._pushUndo();

    this._current = {
      ...this._current,
      sealChocolateId: chocolateId
    };
    this._redoStack = [];

    return succeed(undefined);
  }

  /**
   * Sets the decoration chocolate.
   * Pushes current state to undo before change, clears redo.
   * @param chocolateId - Decoration chocolate ingredient ID or undefined to clear
   * @returns Success or failure
   * @public
   */
  public setDecorationChocolate(chocolateId: IngredientId | undefined): Result<void> {
    this._pushUndo();

    this._current = {
      ...this._current,
      decorationChocolateId: chocolateId
    };
    this._redoStack = [];

    return succeed(undefined);
  }

  // ============================================================================
  // Type-Specific Read-only Access
  // ============================================================================

  /**
   * Gets the mold ID.
   * @public
   */
  public get moldId(): MoldId {
    return this._current.moldId;
  }

  /**
   * Gets the shell chocolate ID.
   * @public
   */
  public get shellChocolateId(): IngredientId {
    return this._current.shellChocolateId;
  }

  /**
   * Gets the seal chocolate ID.
   * @public
   */
  public get sealChocolateId(): IngredientId | undefined {
    return this._current.sealChocolateId;
  }

  /**
   * Gets the decoration chocolate ID.
   * @public
   */
  public get decorationChocolateId(): IngredientId | undefined {
    return this._current.decorationChocolateId;
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  public getChanges(original: IProducedMoldedBonBonEntity): IConfectionChanges {
    const baseChanges = this._baseChanges(original);

    const moldChanged = this._current.moldId !== original.moldId;
    const shellChocolateChanged = this._current.shellChocolateId !== original.shellChocolateId;
    const sealChocolateChanged = this._current.sealChocolateId !== original.sealChocolateId;
    const decorationChocolateChanged = this._current.decorationChocolateId !== original.decorationChocolateId;

    return {
      ...baseChanges,
      moldChanged,
      shellChocolateChanged,
      sealChocolateChanged,
      decorationChocolateChanged,
      enrobingChocolateChanged: false,
      coatingChanged: false,
      hasChanges:
        baseChanges.yieldChanged ||
        baseChanges.fillingsChanged ||
        baseChanges.notesChanged ||
        baseChanges.procedureChanged ||
        moldChanged ||
        shellChocolateChanged ||
        sealChocolateChanged ||
        decorationChocolateChanged
    } as IConfectionChanges;
  }

  // ============================================================================
  // Protected Helpers
  // ============================================================================

  protected _deepCopy(confection: IProducedMoldedBonBonEntity): IProducedMoldedBonBonEntity {
    return {
      confectionType: confection.confectionType,
      variationId: confection.variationId,
      yield: { ...confection.yield },
      moldId: confection.moldId,
      shellChocolateId: confection.shellChocolateId,
      sealChocolateId: confection.sealChocolateId,
      decorationChocolateId: confection.decorationChocolateId,
      fillings: confection.fillings ? confection.fillings.map((slot) => ({ ...slot })) : undefined,
      procedureId: confection.procedureId,
      notes: confection.notes ? confection.notes.map((note) => ({ ...note })) : undefined
    };
  }
}

// ============================================================================
// Bar Truffle Wrapper
// ============================================================================

/**
 * Mutable wrapper for IProducedBarTruffle with undo/redo support.
 * Provides bar truffle-specific editing methods.
 * @public
 */
export class ProducedBarTruffle extends ProducedConfectionBase<IProducedBarTruffleEntity> {
  /**
   * Factory method for creating a ProducedBarTruffle from an existing produced bar truffle.
   * @param initial - The initial produced bar truffle state
   * @returns Success with ProducedBarTruffle
   * @public
   */
  public static create(initial: IProducedBarTruffleEntity): Result<ProducedBarTruffle> {
    return succeed(new ProducedBarTruffle(initial));
  }

  /**
   * Factory method for creating a ProducedBarTruffle from a source version.
   * @param source - Source bar truffle version with runtime wrapper
   * @returns Result containing ProducedBarTruffle or error
   * @public
   */
  public static fromSource(source: IBarTruffleRecipeVariation): Result<ProducedBarTruffle> {
    return ProducedBarTruffle._convertFromSource(source).onSuccess((produced) =>
      ProducedBarTruffle.create(produced)
    );
  }

  /**
   * Restores a ProducedBarTruffle from serialized editing history.
   * @param history - Serialized editing history
   * @returns Result containing ProducedBarTruffle or error
   * @public
   */
  public static restoreFromHistory(
    history: Session.ISerializedEditingHistoryEntity<IProducedBarTruffleEntity>
  ): Result<ProducedBarTruffle> {
    const instance = new ProducedBarTruffle(history.current);
    instance._undoStack = [...history.undoStack];
    instance._redoStack = [...history.redoStack];
    return succeed(instance);
  }

  /**
   * Converts source bar truffle to produced bar truffle entity.
   * Uses proper helpers and getters, no unsafe casts.
   * @internal
   */
  private static _convertFromSource(source: IBarTruffleRecipeVariation): Result<IProducedBarTruffleEntity> {
    // Create and validate version ID using helper
    return Helpers.createConfectionRecipeVariationId({
      collectionId: source.confectionId,
      itemId: source.variationSpec
    }).onSuccess((versionId) => {
      // Convert filling slots if present
      const fillingsResult = source.fillings
        ? ProducedBarTruffle._convertFillingSlots(source.fillings)
        : succeed(undefined);

      return fillingsResult.onSuccess((fillings) => {
        const produced: IProducedBarTruffleEntity = {
          confectionType: 'bar-truffle',
          variationId: versionId,
          yield: source.yield,
          enrobingChocolateId: source.enrobingChocolate?.chocolate.id,
          fillings,
          procedureId: source.preferredProcedure?.id,
          notes: source.entity.notes
        };
        return succeed(produced);
      });
    });
  }

  /**
   * Converts runtime filling slots to produced format.
   * @internal
   */
  private static _convertFillingSlots(
    slots: ReadonlyArray<IResolvedFillingSlot>
  ): Result<
    ReadonlyArray<Confections.IResolvedFillingSlotEntity | Confections.IResolvedIngredientSlotEntity>
  > {
    const slotResults = slots.map((slot) => ProducedBarTruffle._convertFillingSlot(slot));
    return mapResults(slotResults);
  }

  /**
   * Converts a single filling slot to produced format.
   * @internal
   */
  private static _convertFillingSlot(
    slot: IResolvedFillingSlot
  ): Result<Confections.IResolvedFillingSlotEntity | Confections.IResolvedIngredientSlotEntity> {
    const option = Helpers.getPreferredOrFirst(slot.filling);
    if (option === undefined) {
      return fail(`Filling slot ${slot.slotId} has no options`);
    }

    if (option.type === 'recipe') {
      return succeed({
        slotType: 'recipe' as const,
        slotId: slot.slotId,
        fillingId: option.id
      });
    }

    return succeed({
      slotType: 'ingredient' as const,
      slotId: slot.slotId,
      ingredientId: option.id
    });
  }

  // ============================================================================
  // Type-Specific Editing Methods
  // ============================================================================

  /**
   * Sets the enrobing chocolate.
   * Pushes current state to undo before change, clears redo.
   * @param chocolateId - Enrobing chocolate ingredient ID or undefined to clear
   * @returns Success or failure
   * @public
   */
  public setEnrobingChocolate(chocolateId: IngredientId | undefined): Result<void> {
    this._pushUndo();

    this._current = {
      ...this._current,
      enrobingChocolateId: chocolateId
    };
    this._redoStack = [];

    return succeed(undefined);
  }

  // ============================================================================
  // Type-Specific Read-only Access
  // ============================================================================

  /**
   * Gets the enrobing chocolate ID.
   * @public
   */
  public get enrobingChocolateId(): IngredientId | undefined {
    return this._current.enrobingChocolateId;
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  public getChanges(original: IProducedBarTruffleEntity): IConfectionChanges {
    const baseChanges = this._baseChanges(original);

    const enrobingChocolateChanged = this._current.enrobingChocolateId !== original.enrobingChocolateId;

    return {
      ...baseChanges,
      moldChanged: false,
      shellChocolateChanged: false,
      sealChocolateChanged: false,
      decorationChocolateChanged: false,
      enrobingChocolateChanged,
      coatingChanged: false,
      hasChanges:
        baseChanges.yieldChanged ||
        baseChanges.fillingsChanged ||
        baseChanges.notesChanged ||
        baseChanges.procedureChanged ||
        enrobingChocolateChanged
    } as IConfectionChanges;
  }

  // ============================================================================
  // Protected Helpers
  // ============================================================================

  protected _deepCopy(confection: IProducedBarTruffleEntity): IProducedBarTruffleEntity {
    return {
      confectionType: confection.confectionType,
      variationId: confection.variationId,
      yield: { ...confection.yield },
      enrobingChocolateId: confection.enrobingChocolateId,
      fillings: confection.fillings ? confection.fillings.map((slot) => ({ ...slot })) : undefined,
      procedureId: confection.procedureId,
      notes: confection.notes ? confection.notes.map((note) => ({ ...note })) : undefined
    };
  }
}

// ============================================================================
// Rolled Truffle Wrapper
// ============================================================================

/**
 * Mutable wrapper for IProducedRolledTruffle with undo/redo support.
 * Provides rolled truffle-specific editing methods.
 * @public
 */
export class ProducedRolledTruffle extends ProducedConfectionBase<IProducedRolledTruffleEntity> {
  /**
   * Factory method for creating a ProducedRolledTruffle from an existing produced rolled truffle.
   * @param initial - The initial produced rolled truffle state
   * @returns Success with ProducedRolledTruffle
   * @public
   */
  public static create(initial: IProducedRolledTruffleEntity): Result<ProducedRolledTruffle> {
    return succeed(new ProducedRolledTruffle(initial));
  }

  /**
   * Factory method for creating a ProducedRolledTruffle from a source version.
   * @param source - Source rolled truffle version with runtime wrapper
   * @returns Result containing ProducedRolledTruffle or error
   * @public
   */
  public static fromSource(source: IRolledTruffleRecipeVariation): Result<ProducedRolledTruffle> {
    return ProducedRolledTruffle._convertFromSource(source).onSuccess((produced) =>
      ProducedRolledTruffle.create(produced)
    );
  }

  /**
   * Restores a ProducedRolledTruffle from serialized editing history.
   * @param history - Serialized editing history
   * @returns Result containing ProducedRolledTruffle or error
   * @public
   */
  public static restoreFromHistory(
    history: Session.ISerializedEditingHistoryEntity<IProducedRolledTruffleEntity>
  ): Result<ProducedRolledTruffle> {
    const instance = new ProducedRolledTruffle(history.current);
    instance._undoStack = [...history.undoStack];
    instance._redoStack = [...history.redoStack];
    return succeed(instance);
  }

  /**
   * Converts source rolled truffle to produced rolled truffle entity.
   * Uses proper helpers and getters, no unsafe casts.
   * @internal
   */
  private static _convertFromSource(
    source: IRolledTruffleRecipeVariation
  ): Result<IProducedRolledTruffleEntity> {
    // Create and validate version ID using helper
    return Helpers.createConfectionRecipeVariationId({
      collectionId: source.confectionId,
      itemId: source.variationSpec
    }).onSuccess((versionId) => {
      // Convert filling slots if present
      const fillingsResult = source.fillings
        ? ProducedRolledTruffle._convertFillingSlots(source.fillings)
        : succeed(undefined);

      return fillingsResult.onSuccess((fillings) => {
        const produced: IProducedRolledTruffleEntity = {
          confectionType: 'rolled-truffle',
          variationId: versionId,
          yield: source.yield,
          enrobingChocolateId: source.enrobingChocolate?.chocolate.id,
          coatingId: source.coatings?.preferred?.id,
          fillings,
          procedureId: source.preferredProcedure?.id,
          notes: source.entity.notes
        };
        return succeed(produced);
      });
    });
  }

  /**
   * Converts runtime filling slots to produced format.
   * @internal
   */
  private static _convertFillingSlots(
    slots: ReadonlyArray<IResolvedFillingSlot>
  ): Result<
    ReadonlyArray<Confections.IResolvedFillingSlotEntity | Confections.IResolvedIngredientSlotEntity>
  > {
    const slotResults = slots.map((slot) => ProducedRolledTruffle._convertFillingSlot(slot));
    return mapResults(slotResults);
  }

  /**
   * Converts a single filling slot to produced format.
   * @internal
   */
  private static _convertFillingSlot(
    slot: IResolvedFillingSlot
  ): Result<Confections.IResolvedFillingSlotEntity | Confections.IResolvedIngredientSlotEntity> {
    const option = Helpers.getPreferredOrFirst(slot.filling);
    if (option === undefined) {
      return fail(`Filling slot ${slot.slotId} has no options`);
    }

    if (option.type === 'recipe') {
      return succeed({
        slotType: 'recipe' as const,
        slotId: slot.slotId,
        fillingId: option.id
      });
    }

    return succeed({
      slotType: 'ingredient' as const,
      slotId: slot.slotId,
      ingredientId: option.id
    });
  }

  // ============================================================================
  // Type-Specific Editing Methods
  // ============================================================================

  /**
   * Sets the enrobing chocolate.
   * Pushes current state to undo before change, clears redo.
   * @param chocolateId - Enrobing chocolate ingredient ID or undefined to clear
   * @returns Success or failure
   * @public
   */
  public setEnrobingChocolate(chocolateId: IngredientId | undefined): Result<void> {
    this._pushUndo();

    this._current = {
      ...this._current,
      enrobingChocolateId: chocolateId
    };
    this._redoStack = [];

    return succeed(undefined);
  }

  /**
   * Sets the coating.
   * Pushes current state to undo before change, clears redo.
   * @param coatingId - Coating ingredient ID or undefined to clear
   * @returns Success or failure
   * @public
   */
  public setCoating(coatingId: IngredientId | undefined): Result<void> {
    this._pushUndo();

    this._current = {
      ...this._current,
      coatingId
    };
    this._redoStack = [];

    return succeed(undefined);
  }

  // ============================================================================
  // Type-Specific Read-only Access
  // ============================================================================

  /**
   * Gets the enrobing chocolate ID.
   * @public
   */
  public get enrobingChocolateId(): IngredientId | undefined {
    return this._current.enrobingChocolateId;
  }

  /**
   * Gets the coating ID.
   * @public
   */
  public get coatingId(): IngredientId | undefined {
    return this._current.coatingId;
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  public getChanges(original: IProducedRolledTruffleEntity): IConfectionChanges {
    const baseChanges = this._baseChanges(original);

    const enrobingChocolateChanged = this._current.enrobingChocolateId !== original.enrobingChocolateId;
    const coatingChanged = this._current.coatingId !== original.coatingId;

    return {
      ...baseChanges,
      moldChanged: false,
      shellChocolateChanged: false,
      sealChocolateChanged: false,
      decorationChocolateChanged: false,
      enrobingChocolateChanged,
      coatingChanged,
      hasChanges:
        baseChanges.yieldChanged ||
        baseChanges.fillingsChanged ||
        baseChanges.notesChanged ||
        baseChanges.procedureChanged ||
        enrobingChocolateChanged ||
        coatingChanged
    } as IConfectionChanges;
  }

  // ============================================================================
  // Protected Helpers
  // ============================================================================

  protected _deepCopy(confection: IProducedRolledTruffleEntity): IProducedRolledTruffleEntity {
    return {
      confectionType: confection.confectionType,
      variationId: confection.variationId,
      yield: { ...confection.yield },
      enrobingChocolateId: confection.enrobingChocolateId,
      coatingId: confection.coatingId,
      fillings: confection.fillings ? confection.fillings.map((slot) => ({ ...slot })) : undefined,
      procedureId: confection.procedureId,
      notes: confection.notes ? confection.notes.map((note) => ({ ...note })) : undefined
    };
  }
}
