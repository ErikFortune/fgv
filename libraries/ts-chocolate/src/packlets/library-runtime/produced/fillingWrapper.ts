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
 * RuntimeProducedFilling - mutable wrapper for produced filling with undo/redo
 * @packageDocumentation
 */

import { Result, succeed, fail, mapResults } from '@fgv/ts-utils';

import {
  FillingVersionId,
  IngredientId,
  Measurement,
  MeasurementUnit,
  ProcedureId,
  ICategorizedNote,
  Helpers,
  DEFAULT_NOTE_CATEGORY,
  Converters as CommonConverters
} from '../../common';
import {
  IProducedFilling,
  IProducedFillingIngredient,
  IIngredientModifiers,
  IFillingIngredient
} from '../../entities';
import type { IRuntimeFillingRecipeVersion } from '../model';

/**
 * Maximum number of undo snapshots to retain
 */
const MAX_HISTORY_SIZE: number = 50;

/**
 * Structure describing what changed between two produced fillings
 * @public
 */
export interface IFillingChanges {
  /** True if target weight changed */
  readonly targetWeightChanged: boolean;
  /** True if ingredients changed (added, removed, or modified) */
  readonly ingredientsChanged: boolean;
  /** True if notes changed */
  readonly notesChanged: boolean;
  /** True if procedure changed */
  readonly procedureChanged: boolean;
  /** True if any changes were detected */
  readonly hasChanges: boolean;
}

/**
 * Mutable wrapper for IProducedFilling with undo/redo support.
 * Provides editing methods that maintain history for undo/redo operations.
 * @public
 */
export class RuntimeProducedFilling {
  private _current: IProducedFilling;
  private _undoStack: IProducedFilling[];
  private _redoStack: IProducedFilling[];

  /**
   * Creates a RuntimeProducedFilling.
   * Use static factory methods instead of calling this directly.
   * @internal
   */
  private constructor(initial: IProducedFilling) {
    this._current = initial;
    this._undoStack = [];
    this._redoStack = [];
  }

  /**
   * Factory method for creating a RuntimeProducedFilling from an existing produced filling.
   * @param initial - The initial produced filling state
   * @returns Success with RuntimeProducedFilling
   * @public
   */
  public static create(initial: IProducedFilling): Result<RuntimeProducedFilling> {
    return succeed(new RuntimeProducedFilling(initial));
  }

  /**
   * Factory method for creating a RuntimeProducedFilling from a source recipe version.
   * @param source - Source filling recipe version with runtime wrapper
   * @param scaleFactor - Optional scale factor (default: 1.0)
   * @returns Result containing RuntimeProducedFilling or error
   * @public
   */
  public static fromSource(
    source: IRuntimeFillingRecipeVersion,
    scaleFactor: number = 1.0
  ): Result<RuntimeProducedFilling> {
    return RuntimeProducedFilling._convertFromSource(source, scaleFactor).onSuccess((produced) =>
      RuntimeProducedFilling.create(produced)
    );
  }

  /**
   * Converts source recipe to produced filling entity.
   * Uses proper helpers and converters, no unsafe casts.
   * @internal
   */
  private static _convertFromSource(
    source: IRuntimeFillingRecipeVersion,
    scaleFactor: number
  ): Result<IProducedFilling> {
    // Convert ingredients using mapResults pattern
    const ingredientResults = source.raw.ingredients.map((ing) =>
      RuntimeProducedFilling._convertIngredient(ing, scaleFactor)
    );

    return mapResults(ingredientResults).onSuccess((ingredients) => {
      // Convert target weight properly
      return CommonConverters.measurement
        .convert(source.raw.baseWeight * scaleFactor)
        .onSuccess((targetWeight) => {
          const produced: IProducedFilling = {
            versionId: source.versionId,
            scaleFactor,
            targetWeight,
            ingredients,
            procedureId: source.preferredProcedure?.id,
            notes: source.raw.notes
              ? [{ category: DEFAULT_NOTE_CATEGORY, note: source.raw.notes }]
              : undefined
          };
          return succeed(produced);
        });
    });
  }

  /**
   * Converts a single ingredient with validation.
   * @internal
   */
  private static _convertIngredient(
    ing: IFillingIngredient,
    scaleFactor: number
  ): Result<IProducedFillingIngredient> {
    // Use helper to get preferred ID
    const ingredientId = Helpers.getPreferredIdOrFirst(ing.ingredient);
    if (ingredientId === undefined) {
      return fail('Ingredient has no IDs');
    }

    // Use converter for computed measurement
    return CommonConverters.measurement.convert(ing.amount * scaleFactor).onSuccess((amount) =>
      succeed({
        ingredientId,
        amount,
        unit: ing.unit,
        modifiers: ing.modifiers,
        notes: ing.notes
      })
    );
  }

  // ============================================================================
  // Snapshot Management
  // ============================================================================

  /**
   * Creates an immutable snapshot of the current state.
   * @returns Immutable copy of current produced filling
   * @public
   */
  public createSnapshot(): IProducedFilling {
    return this._deepCopy(this._current);
  }

  /**
   * Restores state from a snapshot.
   * Pushes current state to undo stack and clears redo stack.
   * @param snapshot - Snapshot to restore
   * @returns Success or failure
   * @public
   */
  public restoreSnapshot(snapshot: IProducedFilling): Result<void> {
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
  // Editing Methods
  // ============================================================================

  /**
   * Sets or updates an ingredient.
   * Pushes current state to undo before change, clears redo.
   * @param id - Ingredient ID
   * @param amount - Amount of ingredient
   * @param unit - Optional measurement unit (default: 'g')
   * @param modifiers - Optional ingredient modifiers
   * @returns Success or failure
   * @public
   */
  public setIngredient(
    id: IngredientId,
    amount: Measurement,
    unit?: MeasurementUnit,
    modifiers?: IIngredientModifiers
  ): Result<void> {
    if (amount <= 0) {
      return fail(`Ingredient amount must be positive: ${amount}`);
    }

    this._pushUndo();

    const ingredients = [...this._current.ingredients];
    const existingIndex = ingredients.findIndex((ing) => ing.ingredientId === id);

    const newIngredient: IProducedFillingIngredient = {
      ingredientId: id,
      amount,
      unit,
      modifiers
    };

    if (existingIndex >= 0) {
      ingredients[existingIndex] = newIngredient;
    } else {
      ingredients.push(newIngredient);
    }

    this._current = {
      ...this._current,
      ingredients
    };
    this._redoStack = [];

    return succeed(undefined);
  }

  /**
   * Removes an ingredient.
   * Pushes current state to undo before change, clears redo.
   * @param id - Ingredient ID to remove
   * @returns Success or failure
   * @public
   */
  public removeIngredient(id: IngredientId): Result<void> {
    const existingIndex = this._current.ingredients.findIndex((ing) => ing.ingredientId === id);

    if (existingIndex < 0) {
      return fail(`Ingredient ${id} not found in filling`);
    }

    this._pushUndo();

    this._current = {
      ...this._current,
      ingredients: this._current.ingredients.filter((ing) => ing.ingredientId !== id)
    };
    this._redoStack = [];

    return succeed(undefined);
  }

  /**
   * Scales all weight-contributing ingredients to achieve a target weight.
   * Non-weight-contributing ingredients (tsp, Tbsp, pinch, seeds, pods) remain unchanged.
   * Pushes current state to undo before change, clears redo.
   * @param targetWeight - Desired total weight
   * @returns Success with actual achieved weight, or failure
   * @public
   */
  public scaleToTargetWeight(targetWeight: Measurement): Result<Measurement> {
    if (targetWeight <= 0) {
      return fail(`Target weight must be positive: ${targetWeight}`);
    }

    // Calculate current total weight (only weight-contributing ingredients)
    const currentWeight = this._calculateTotalWeight();
    if (currentWeight <= 0) {
      return fail('Cannot scale: no weight-contributing ingredients');
    }

    // Calculate scale factor
    const scaleFactor = targetWeight / currentWeight;

    this._pushUndo();

    // Scale each ingredient
    const scaledIngredients = this._current.ingredients.map((ing) => {
      const unit = ing.unit ?? 'g';

      // Only scale weight-contributing units (g, mL)
      if (unit === 'g' || unit === 'mL') {
        const scaledAmount = (ing.amount * scaleFactor) as Measurement;
        return { ...ing, amount: scaledAmount };
      }

      // Keep non-weight ingredients unchanged
      return ing;
    });

    // Recalculate actual achieved weight
    const actualWeight = this._calculateWeightFromIngredients(scaledIngredients);

    this._current = {
      ...this._current,
      ingredients: scaledIngredients,
      targetWeight: actualWeight
    };
    this._redoStack = [];

    return succeed(actualWeight);
  }

  /**
   * Sets the notes.
   * Pushes current state to undo before change, clears redo.
   * @param notes - Categorized notes array
   * @returns Success or failure
   * @public
   */
  public setNotes(notes: ICategorizedNote[]): Result<void> {
    this._pushUndo();

    this._current = {
      ...this._current,
      notes: notes.length > 0 ? notes : undefined
    };
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
    };
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
  public get snapshot(): IProducedFilling {
    return this.createSnapshot();
  }

  /**
   * Gets the version ID.
   * @public
   */
  public get versionId(): FillingVersionId {
    return this._current.versionId;
  }

  /**
   * Gets the target weight.
   * @public
   */
  public get targetWeight(): Measurement {
    return this._current.targetWeight;
  }

  /**
   * Gets the ingredients as a readonly array.
   * @public
   */
  public get ingredients(): ReadonlyArray<IProducedFillingIngredient> {
    return this._current.ingredients;
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  /**
   * Checks if current state differs from original.
   * Uses deep equality check.
   * @param original - Original produced filling to compare against
   * @returns True if changes were detected
   * @public
   */
  public hasChanges(original: IProducedFilling): boolean {
    return this.getChanges(original).hasChanges;
  }

  /**
   * Gets detailed changes between current state and original.
   * @param original - Original produced filling to compare against
   * @returns Structure describing what changed
   * @public
   */
  public getChanges(original: IProducedFilling): IFillingChanges {
    const targetWeightChanged = this._current.targetWeight !== original.targetWeight;
    const ingredientsChanged = !this._ingredientsEqual(this._current.ingredients, original.ingredients);
    const notesChanged = !this._notesEqual(this._current.notes, original.notes);
    const procedureChanged = this._current.procedureId !== original.procedureId;

    return {
      targetWeightChanged,
      ingredientsChanged,
      notesChanged,
      procedureChanged,
      hasChanges: targetWeightChanged || ingredientsChanged || notesChanged || procedureChanged
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Pushes current state to undo stack, maintaining max size.
   */
  private _pushUndo(): void {
    this._undoStack.push(this._deepCopy(this._current));

    if (this._undoStack.length > MAX_HISTORY_SIZE) {
      this._undoStack.shift();
    }
  }

  /**
   * Calculates total weight from current weight-contributing ingredients.
   */
  private _calculateTotalWeight(): Measurement {
    return this._calculateWeightFromIngredients(this._current.ingredients);
  }

  /**
   * Calculates total weight from a list of ingredients.
   * Only includes weight-contributing units (g, mL).
   */
  private _calculateWeightFromIngredients(
    ingredients: ReadonlyArray<IProducedFillingIngredient>
  ): Measurement {
    const total = ingredients.reduce((sum, ing) => {
      const unit = ing.unit ?? 'g';
      // Only count weight-contributing units
      if (unit === 'g' || unit === 'mL') {
        return sum + ing.amount;
      }
      return sum;
    }, 0);
    return total as Measurement;
  }

  /**
   * Creates a deep copy of a produced filling.
   */
  private _deepCopy(filling: IProducedFilling): IProducedFilling {
    return {
      versionId: filling.versionId,
      scaleFactor: filling.scaleFactor,
      targetWeight: filling.targetWeight,
      ingredients: filling.ingredients.map((ing) => ({
        ingredientId: ing.ingredientId,
        amount: ing.amount,
        unit: ing.unit,
        modifiers: ing.modifiers ? { ...ing.modifiers } : undefined,
        notes: ing.notes
      })),
      procedureId: filling.procedureId,
      notes: filling.notes ? filling.notes.map((note) => ({ ...note })) : undefined
    };
  }

  /**
   * Compares two ingredient arrays for equality.
   */
  private _ingredientsEqual(
    a: ReadonlyArray<IProducedFillingIngredient>,
    b: ReadonlyArray<IProducedFillingIngredient>
  ): boolean {
    if (a.length !== b.length) {
      return false;
    }

    // Create sorted copies for comparison
    const sortedA = [...a].sort((x, y) => x.ingredientId.localeCompare(y.ingredientId));
    const sortedB = [...b].sort((x, y) => x.ingredientId.localeCompare(y.ingredientId));

    for (let i = 0; i < sortedA.length; i++) {
      if (!this._ingredientEqual(sortedA[i], sortedB[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Compares two ingredients for equality.
   */
  private _ingredientEqual(a: IProducedFillingIngredient, b: IProducedFillingIngredient): boolean {
    return (
      a.ingredientId === b.ingredientId &&
      a.amount === b.amount &&
      a.unit === b.unit &&
      this._modifiersEqual(a.modifiers, b.modifiers) &&
      a.notes === b.notes
    );
  }

  /**
   * Compares two modifiers for equality.
   */
  private _modifiersEqual(a: IIngredientModifiers | undefined, b: IIngredientModifiers | undefined): boolean {
    if (a === undefined && b === undefined) {
      return true;
    }
    if (a === undefined || b === undefined) {
      return false;
    }
    return a.spoonLevel === b.spoonLevel && a.toTaste === b.toTaste;
  }

  /**
   * Compares two notes arrays for equality.
   */
  private _notesEqual(
    a: ReadonlyArray<ICategorizedNote> | undefined,
    b: ReadonlyArray<ICategorizedNote> | undefined
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
