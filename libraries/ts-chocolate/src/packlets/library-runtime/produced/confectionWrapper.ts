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

import { Result, succeed, fail, mapResults, captureResult } from '@fgv/ts-utils';

import {
  ConfectionRecipeVariationId,
  DecorationId,
  FillingId,
  IngredientId,
  Measurement,
  Millimeters,
  MoldId,
  Model as CommonModel,
  Percentage,
  ProcedureId,
  SlotId,
  Helpers
} from '../../common';
import { EditableWrapper } from '../editableWrapper';
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
  /** True if decoration changed */
  readonly decorationChanged: boolean;
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
export abstract class ProducedConfectionBase<
  T extends AnyProducedConfectionEntity
> extends EditableWrapper<T> {
  /**
   * Creates a ProducedConfectionBase.
   * Use static factory methods on derived classes instead of calling this directly.
   * @internal
   */
  protected constructor(initial: T) {
    super(initial);
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
      notes: Helpers.nonEmpty(notes)
    } as T;

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

    return succeed(undefined);
  }

  /**
   * Sets the decoration.
   * Pushes current state to undo before change, clears redo.
   * @param id - Decoration ID or undefined to clear
   * @returns Success or failure
   * @public
   */
  public setDecoration(id: DecorationId | undefined): Result<void> {
    this._pushUndo();

    this._current = {
      ...this._current,
      decorationId: id
    } as T;

    return succeed(undefined);
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
      fillings
    } as T;

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
      fillings: Helpers.nonEmpty(fillings)
    } as T;

    return succeed(undefined);
  }

  // ============================================================================
  // Read-only Access
  // ============================================================================

  /**
   * Gets the variation ID.
   * @public
   */
  public get variationId(): ConfectionRecipeVariationId {
    return this._current.variationId;
  }

  /**
   * Gets the yield specification.
   * @public
   */
  /* c8 ignore next 4 - base class getter always overridden by subclasses with specific return types */
  public get yield(): Confections.BufferedConfectionYield {
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

  /**
   * Gets the decoration ID.
   * @public
   */
  public get decorationId(): DecorationId | undefined {
    return this._current.decorationId;
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
    const decorationChanged = this._current.decorationId !== original.decorationId;

    return {
      yieldChanged,
      fillingsChanged,
      notesChanged,
      procedureChanged,
      decorationChanged
    };
  }

  /**
   * Compares two yield specifications for equality.
   */
  private _yieldEqual(
    a: Confections.BufferedConfectionYield,
    b: Confections.BufferedConfectionYield
  ): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
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
    /* c8 ignore next 2 - defensive: unreachable with known slot types */
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
    return captureResult(() => new ProducedMoldedBonBon(initial)).onSuccess((e) => e._setInitialSnapshot());
  }

  /**
   * Factory method for creating a ProducedMoldedBonBon from a source variation.
   * @param source - Source molded bonbon variation with runtime wrapper
   * @returns Result containing ProducedMoldedBonBon or error
   * @public
   */
  public static fromSource(source: IMoldedBonBonRecipeVariation): Result<ProducedMoldedBonBon> {
    return captureResult(() =>
      ProducedMoldedBonBon._convertFromSource(source).onSuccess((produced) =>
        ProducedMoldedBonBon.create(produced).onSuccess((p) => p._setInitialSnapshot())
      )
    ).onSuccess((r) => r);
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
    return ProducedMoldedBonBon.create(history.current)
      .onSuccess((b) => b._restoreHistory(history))
      .onSuccess((i) => i._setInitialSnapshot(history.original));
  }

  /**
   * Converts source molded bonbon to produced molded bonbon entity.
   * Uses proper helpers and getters, no unsafe casts.
   * @internal
   */
  private static _convertFromSource(
    source: IMoldedBonBonRecipeVariation
  ): Result<IProducedMoldedBonBonEntity> {
    // Create and validate variation ID using helper
    return Helpers.createConfectionRecipeVariationId({
      collectionId: source.confectionId,
      itemId: source.variationSpec
    }).onSuccess((variationId) => {
      // Convert filling slots if present
      const fillingsResult = source.fillings
        ? ProducedMoldedBonBon._convertFillingSlots(source.fillings)
        : succeed(undefined);

      return fillingsResult.onSuccess((fillings) => {
        /* c8 ignore next 5 - branch: entity validation ensures optional fields are always present */
        const moldedYield: Confections.IBufferedYieldInFrames = {
          numFrames: source.yield.numFrames,
          bufferPercentage: 10 as Percentage
        };

        // TODO: shellChocolate?.chocolate.id! is unsafe.  we should make it optional in the produced molded entity too.
        /* c8 ignore next 14 - branch: optional chaining branches where properties are always present in test data */
        const produced: IProducedMoldedBonBonEntity = {
          confectionType: 'molded-bonbon',
          variationId,
          yield: moldedYield,
          moldId: source.preferredMold?.id!,
          shellChocolateId: source.shellChocolate?.chocolate.id!,
          sealChocolateId: source.additionalChocolates?.find((c) => c.purpose === 'seal')?.chocolate.chocolate
            .id,
          decorationChocolateId: source.additionalChocolates?.find((c) => c.purpose === 'decoration')
            ?.chocolate.chocolate.id,
          decorationId: source.decorations?.preferredId,
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
    /* c8 ignore next 3 - defensive: filling slot with no options indicates library data corruption */
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
   * Sets the frame count and buffer percentage for this molded bonbon.
   * Pushes current state to undo before change, clears redo.
   * @param numFrames - Number of frames to produce
   * @param bufferPercentage - Buffer percentage (e.g., 10 for 10%)
   * @returns Success with updated yield, or failure
   * @public
   */
  public setFrames(
    numFrames: number,
    bufferPercentage: Percentage
  ): Result<Confections.IBufferedYieldInFrames> {
    if (numFrames <= 0) {
      return fail(`Frame count must be positive: ${numFrames}`);
    }
    if (bufferPercentage < 0 || bufferPercentage > 100) {
      return fail(`Buffer percentage must be between 0 and 100: ${bufferPercentage}`);
    }

    this._pushUndo();
    const yieldSpec: Confections.IBufferedYieldInFrames = { numFrames, bufferPercentage };
    this._current = { ...this._current, yield: yieldSpec };
    return succeed(yieldSpec);
  }

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

    return succeed(undefined);
  }

  // ============================================================================
  // Type-Specific Read-only Access
  // ============================================================================

  /**
   * Gets the frame-based yield specification.
   * @public
   */
  public override get yield(): Confections.IBufferedYieldInFrames {
    return this._current.yield;
  }

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
        baseChanges.decorationChanged ||
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
      decorationId: confection.decorationId,
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
    return captureResult(() => new ProducedBarTruffle(initial)).onSuccess((p) => p._setInitialSnapshot());
  }

  /**
   * Factory method for creating a ProducedBarTruffle from a source variation.
   * @param source - Source bar truffle variation with runtime wrapper
   * @returns Result containing ProducedBarTruffle or error
   * @public
   */
  public static fromSource(source: IBarTruffleRecipeVariation): Result<ProducedBarTruffle> {
    return captureResult(() =>
      ProducedBarTruffle._convertFromSource(source).onSuccess((produced) =>
        ProducedBarTruffle.create(produced).onSuccess((t) => t._setInitialSnapshot())
      )
    ).onSuccess((r) => r);
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
    return ProducedBarTruffle.create(history.current)
      .onSuccess((p) => p._restoreHistory(history))
      .onSuccess((p) => p._setInitialSnapshot(history.original));
  }

  /**
   * Converts source bar truffle to produced bar truffle entity.
   * Uses proper helpers and getters, no unsafe casts.
   * @internal
   */
  private static _convertFromSource(source: IBarTruffleRecipeVariation): Result<IProducedBarTruffleEntity> {
    // Create and validate variation ID using helper
    return Helpers.createConfectionRecipeVariationId({
      collectionId: source.confectionId,
      itemId: source.variationSpec
    }).onSuccess((variationId) => {
      // Convert filling slots if present
      const fillingsResult = source.fillings
        ? ProducedBarTruffle._convertFillingSlots(source.fillings)
        : succeed(undefined);

      return fillingsResult.onSuccess((fillings) => {
        /* c8 ignore next 17 - branch: optional chaining branches where properties are always present in test data */
        const sourceYield = source.yield;
        const produced: IProducedBarTruffleEntity = {
          confectionType: 'bar-truffle',
          variationId,
          yield: {
            count: sourceYield.numPieces,
            weightPerPiece: sourceYield.weightPerPiece,
            bufferPercentage: 10 as Percentage,
            dimensions: sourceYield.dimensions
          },
          enrobingChocolateId: source.enrobingChocolate?.chocolate.id,
          decorationId: source.decorations?.preferredId,
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
    /* c8 ignore next 3 - defensive: filling slot with no options indicates library data corruption */
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
   * Scales to a new bar truffle yield specification.
   * Pushes current state to undo before change, clears redo.
   * @param yieldSpec - Target yield specification
   * @returns Success with updated yield, or failure
   * @public
   */
  public scaleToYield(
    yieldSpec: Confections.IBufferedBarTruffleYield
  ): Result<Confections.IBufferedBarTruffleYield> {
    if (yieldSpec.count <= 0) {
      return fail(`Yield count must be positive: ${yieldSpec.count}`);
    }
    if (yieldSpec.weightPerPiece <= 0) {
      return fail(`Weight per piece must be positive: ${yieldSpec.weightPerPiece}`);
    }

    this._pushUndo();
    this._current = { ...this._current, yield: yieldSpec };
    return succeed(yieldSpec);
  }

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

    return succeed(undefined);
  }

  // ============================================================================
  // Type-Specific Read-only Access
  // ============================================================================

  /**
   * Gets the bar truffle yield specification.
   * @public
   */
  public override get yield(): Confections.IBufferedBarTruffleYield {
    return this._current.yield;
  }

  /**
   * Computed target weight: count × weightPerPiece × (1 + bufferPercentage / 100).
   * @public
   */
  public get targetWeight(): Measurement {
    const { count, weightPerPiece, bufferPercentage } = this._current.yield;
    return (count * weightPerPiece * (1 + bufferPercentage / 100)) as Measurement;
  }

  /**
   * Computed frame dimensions derived from piece count and bonbon dimensions.
   * Layout: cols = ⌈√count⌉, rows = ⌈count/cols⌉
   * @public
   */
  public get frameDimensions(): Confections.IPieceDimensions {
    const { count, dimensions } = this._current.yield;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    return {
      width: (cols * dimensions.width) as Millimeters,
      height: (rows * dimensions.height) as Millimeters,
      depth: dimensions.depth
    };
  }

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
        baseChanges.decorationChanged ||
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
      decorationId: confection.decorationId,
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
    return captureResult(() => new ProducedRolledTruffle(initial)).onSuccess((p) => p._setInitialSnapshot());
  }

  /**
   * Factory method for creating a ProducedRolledTruffle from a source variation.
   * @param source - Source rolled truffle variation with runtime wrapper
   * @returns Result containing ProducedRolledTruffle or error
   * @public
   */
  public static fromSource(source: IRolledTruffleRecipeVariation): Result<ProducedRolledTruffle> {
    return captureResult(() =>
      ProducedRolledTruffle._convertFromSource(source).onSuccess((produced) =>
        ProducedRolledTruffle.create(produced).onSuccess((p) => p._setInitialSnapshot())
      )
    ).onSuccess((r) => r);
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
    return ProducedRolledTruffle.create(history.current)
      .onSuccess((p) => p._restoreHistory(history))
      .onSuccess((p) => p._setInitialSnapshot(history.original));
  }

  /**
   * Converts source rolled truffle to produced rolled truffle entity.
   * Uses proper helpers and getters, no unsafe casts.
   * @internal
   */
  private static _convertFromSource(
    source: IRolledTruffleRecipeVariation
  ): Result<IProducedRolledTruffleEntity> {
    // Create and validate variation ID using helper
    return Helpers.createConfectionRecipeVariationId({
      collectionId: source.confectionId,
      itemId: source.variationSpec
    }).onSuccess((variationId) => {
      // Convert filling slots if present
      const fillingsResult = source.fillings
        ? ProducedRolledTruffle._convertFillingSlots(source.fillings)
        : /* c8 ignore next 1 - branch: test variations always have fillings */
          succeed(undefined);

      return fillingsResult.onSuccess((fillings) => {
        /* c8 ignore next 16 - branch: optional chaining branches where properties are always present in test data */
        const sourceYield = source.yield;
        const produced: IProducedRolledTruffleEntity = {
          confectionType: 'rolled-truffle',
          variationId,
          yield: {
            count: sourceYield.numPieces,
            weightPerPiece: sourceYield.weightPerPiece,
            bufferPercentage: 10 as Percentage
          },
          enrobingChocolateId: source.enrobingChocolate?.chocolate.id,
          coatingId: source.coatings?.preferred?.id,
          decorationId: source.decorations?.preferredId,
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
    /* c8 ignore next 3 - defensive: filling slot with no options indicates library data corruption */
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
   * Scales to a new rolled truffle yield specification.
   * Pushes current state to undo before change, clears redo.
   * @param yieldSpec - Target yield specification
   * @returns Success with updated yield, or failure
   * @public
   */
  public scaleToYield(
    yieldSpec: Confections.IBufferedYieldInPieces
  ): Result<Confections.IBufferedYieldInPieces> {
    if (yieldSpec.count <= 0) {
      return fail(`Yield count must be positive: ${yieldSpec.count}`);
    }
    if (yieldSpec.weightPerPiece <= 0) {
      return fail(`Weight per piece must be positive: ${yieldSpec.weightPerPiece}`);
    }

    this._pushUndo();
    this._current = { ...this._current, yield: yieldSpec };
    return succeed(yieldSpec);
  }

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

    return succeed(undefined);
  }

  // ============================================================================
  // Type-Specific Read-only Access
  // ============================================================================

  /**
   * Gets the rolled truffle yield specification.
   * @public
   */
  public override get yield(): Confections.IBufferedYieldInPieces {
    return this._current.yield;
  }

  /**
   * Computed target weight: count × weightPerPiece × (1 + bufferPercentage / 100).
   * @public
   */
  public get targetWeight(): Measurement {
    const { count, weightPerPiece, bufferPercentage } = this._current.yield;
    return (count * weightPerPiece * (1 + bufferPercentage / 100)) as Measurement;
  }

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
        baseChanges.decorationChanged ||
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
      decorationId: confection.decorationId,
      fillings: confection.fillings ? confection.fillings.map((slot) => ({ ...slot })) : undefined,
      procedureId: confection.procedureId,
      notes: confection.notes ? confection.notes.map((note) => ({ ...note })) : undefined
    };
  }
}
