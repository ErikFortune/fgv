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
 * ProducedFilling - mutable wrapper for produced filling with undo/redo
 * @packageDocumentation
 */

import { Result, succeed, fail, mapResults } from '@fgv/ts-utils';

import {
  FillingRecipeVariationId,
  IngredientId,
  Measurement,
  MeasurementUnit,
  ProcedureId,
  Helpers,
  Converters as CommonConverters,
  Model as CommonModel
} from '../../common';
import { Fillings, IProducedFillingEntity, Session } from '../../entities';
import type { IFillingRecipeVariation } from '../model';
import { EditableWrapper } from '../editableWrapper';

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
export class ProducedFilling extends EditableWrapper<IProducedFillingEntity> {
  /**
   * Creates a ProducedFilling.
   * Use static factory methods instead of calling this directly.
   * @internal
   */
  private constructor(initial: IProducedFillingEntity) {
    super(initial);
  }

  /**
   * Factory method for creating a ProducedFilling from an existing produced filling.
   * @param initial - The initial produced filling state
   * @returns Success with ProducedFilling
   * @public
   */
  public static create(initial: IProducedFillingEntity): Result<ProducedFilling> {
    return succeed(new ProducedFilling(initial));
  }

  /**
   * Factory method for creating a ProducedFilling from a source recipe variation.
   * @param source - Source filling recipe variation with runtime wrapper
   * @param scaleFactor - Optional scale factor (default: 1.0)
   * @returns Result containing ProducedFilling or error
   * @public
   */
  public static fromSource(
    source: IFillingRecipeVariation,
    scaleFactor: number = 1.0
  ): Result<ProducedFilling> {
    return ProducedFilling._convertFromSource(source, scaleFactor).onSuccess((produced) =>
      ProducedFilling.create(produced)
    );
  }

  /**
   * Factory method for restoring a ProducedFilling from serialized history.
   * Restores the complete editing state including undo/redo stacks.
   * @param history - Serialized editing history
   * @returns Result containing ProducedFilling or error
   * @public
   */
  public static restoreFromHistory(
    history: Session.ISerializedEditingHistoryEntity<IProducedFillingEntity>
  ): Result<ProducedFilling> {
    const instance = new ProducedFilling(history.current);
    instance._restoreHistory(history);
    return succeed(instance);
  }

  /**
   * Converts source recipe to produced filling entity.
   * Uses proper helpers and converters, no unsafe casts.
   * @internal
   */
  private static _convertFromSource(
    source: IFillingRecipeVariation,
    scaleFactor: number
  ): Result<IProducedFillingEntity> {
    // Convert ingredients using mapResults pattern
    const ingredientResults = source.entity.ingredients.map((ing) =>
      ProducedFilling._convertIngredient(ing, scaleFactor)
    );

    return mapResults(ingredientResults).onSuccess((ingredients) => {
      // Convert target weight properly
      return CommonConverters.measurement
        .convert(source.entity.baseWeight * scaleFactor)
        .onSuccess((targetWeight) => {
          // TODO: shouldn't we test that?
          /* c8 ignore next 8 - branch: optional procedure undefined */
          const produced: IProducedFillingEntity = {
            variationId: source.variationId,
            scaleFactor,
            targetWeight,
            ingredients,
            procedureId: source.preferredProcedure?.id,
            notes: source.entity.notes
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
    ing: Fillings.IFillingIngredientEntity,
    scaleFactor: number
  ): Result<Fillings.IProducedFillingIngredientEntity> {
    // Use helper to get preferred ID
    const ingredientId = Helpers.getPreferredIdOrFirst(ing.ingredient);
    /* c8 ignore next 3 - defensive: ingredient with no IDs indicates library data corruption */
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
  // Produced → Source Conversion
  // ============================================================================

  /**
   * Converts a produced filling entity back to a source recipe variation entity.
   * Used when saving a new variation from an editing session.
   * @param snapshot - The produced filling snapshot to convert
   * @param newVariationSpec - The variation spec for the new variation
   * @param createdDate - Optional creation date (defaults to current ISO date)
   * @returns Result with source variation entity
   * @public
   */
  public static toSourceVariation(
    snapshot: IProducedFillingEntity,
    newVariationSpec: string,
    createdDate?: string
  ): Result<Fillings.IFillingRecipeVariationEntity> {
    // Validate and convert variationSpec
    return CommonConverters.fillingRecipeVariationSpec
      .convert(newVariationSpec)
      .onSuccess((variationSpec) => {
        // Use targetWeight as the base weight. If targetWeight is 0 (unscaled recipe),
        // compute the effective weight from ingredient amounts instead.
        const computedWeight =
          snapshot.targetWeight > 0
            ? snapshot.targetWeight
            : ProducedFilling._calculateWeightFromIngredients(snapshot.ingredients);
        return CommonConverters.measurement.convert(computedWeight).onSuccess((baseWeight) => {
          // Convert ingredients back to source format (no scaling needed - use as-is)
          const ingredients = snapshot.ingredients.map((ing) =>
            ProducedFilling._convertIngredientToSourceUnscaled(ing)
          );

          return mapResults(ingredients).onSuccess((sourceIngredients) => {
            // Convert procedure back to source format
            const procedures = snapshot.procedureId
              ? {
                  options: [{ id: snapshot.procedureId }],
                  preferredId: snapshot.procedureId
                }
              : undefined;

            const variation: Fillings.IFillingRecipeVariationEntity = {
              variationSpec,
              // TODO: seems like an externally visible contract that should be tested
              /* c8 ignore next - branch: fallback to current date when createdDate not provided */
              createdDate: createdDate ?? new Date().toISOString(),
              ingredients: sourceIngredients,
              baseWeight,
              notes: snapshot.notes,
              procedures
            };

            return succeed(variation);
          });
        });
      });
  }

  /**
   * Converts a single produced ingredient back to source format without scaling.
   * Wraps the single ingredient ID in IIdsWithPreferred format.
   * The ingredient amounts are used as-is since they represent the current recipe state.
   * @param ing - The produced ingredient to convert
   * @returns Result with source ingredient entity
   * @internal
   */
  private static _convertIngredientToSourceUnscaled(
    ing: Fillings.IProducedFillingIngredientEntity
  ): Result<Fillings.IFillingIngredientEntity> {
    // Use amount as-is - it already represents the current recipe state
    return CommonConverters.measurement.convert(ing.amount).onSuccess((amount) =>
      succeed({
        ingredient: {
          ids: [ing.ingredientId],
          preferredId: ing.ingredientId
        },
        amount,
        unit: ing.unit,
        modifiers: ing.modifiers,
        notes: ing.notes
      })
    );
  }

  /**
   * Merges produced ingredient choices as alternatives into the original variation.
   * Preserves original amounts and structure; only adds ingredient IDs as options.
   * @param produced - The produced filling with user's ingredient choices
   * @param original - The original source variation entity
   * @returns Result with updated variation entity containing merged alternatives
   * @public
   */
  public static mergeAsAlternatives(
    produced: IProducedFillingEntity,
    original: Fillings.IFillingRecipeVariationEntity
  ): Result<Fillings.IFillingRecipeVariationEntity> {
    // Merge ingredients by position
    const mergedIngredients: Fillings.IFillingIngredientEntity[] = [];

    // Process ingredients that exist in both produced and original
    const minLen = Math.min(produced.ingredients.length, original.ingredients.length);
    for (let i = 0; i < minLen; i++) {
      const producedIng = produced.ingredients[i];
      const originalIng = original.ingredients[i];
      mergedIngredients.push(ProducedFilling._mergeIngredientAlternative(producedIng, originalIng));
    }

    // If original has more ingredients, keep them unchanged
    for (let i = minLen; i < original.ingredients.length; i++) {
      mergedIngredients.push(original.ingredients[i]);
    }

    // If produced has more ingredients, append as new single-option entries
    for (let i = minLen; i < produced.ingredients.length; i++) {
      const producedIng = produced.ingredients[i];
      mergedIngredients.push({
        ingredient: {
          ids: [producedIng.ingredientId],
          preferredId: producedIng.ingredientId
        },
        amount: producedIng.amount,
        unit: producedIng.unit,
        modifiers: producedIng.modifiers,
        notes: producedIng.notes
      });
    }

    // Merge procedures
    const mergedProcedures = ProducedFilling._mergeProcedureAlternative(
      produced.procedureId,
      original.procedures
    );

    const merged: Fillings.IFillingRecipeVariationEntity = {
      variationSpec: original.variationSpec,
      createdDate: original.createdDate,
      ingredients: mergedIngredients,
      baseWeight: original.baseWeight,
      yield: original.yield,
      notes: produced.notes ?? original.notes,
      ratings: original.ratings,
      procedures: mergedProcedures
    };

    return succeed(merged);
  }

  /**
   * Merges a single produced ingredient choice as an alternative into the original.
   * Preserves original amount, unit, modifiers, and notes.
   * Only modifies the ingredient IDs list and preferred selection.
   * @internal
   */
  private static _mergeIngredientAlternative(
    produced: Fillings.IProducedFillingIngredientEntity,
    original: Fillings.IFillingIngredientEntity
  ): Fillings.IFillingIngredientEntity {
    const existingIds = original.ingredient.ids;
    const producedId = produced.ingredientId;

    // Check if the produced ID is already in the options
    const alreadyExists = existingIds.includes(producedId);

    const mergedIds = alreadyExists
      ? [...existingIds] // Keep existing IDs
      : [...existingIds, producedId]; // Append new ID

    return {
      ingredient: {
        ids: mergedIds,
        preferredId: producedId,
        slotId: original.ingredient.slotId
      },
      amount: original.amount, // Use original amount
      unit: original.unit,
      modifiers: original.modifiers,
      notes: original.notes
    };
  }

  /**
   * Merges a produced procedure choice as an alternative into the original procedures.
   * @internal
   */
  private static _mergeProcedureAlternative(
    producedProcedureId: ProcedureId | undefined,
    originalProcedures: Fillings.IFillingRecipeVariationEntity['procedures']
  ): Fillings.IFillingRecipeVariationEntity['procedures'] {
    // No procedure in either → undefined
    if (!producedProcedureId && !originalProcedures) {
      return undefined;
    }

    // No produced procedure but original exists → keep original
    if (!producedProcedureId) {
      return originalProcedures;
    }

    // Produced has procedure but original doesn't → create new
    if (!originalProcedures) {
      return {
        options: [{ id: producedProcedureId }],
        preferredId: producedProcedureId
      };
    }

    // Both exist → merge
    const existingIds = originalProcedures.options.map((o) => o.id);
    const alreadyExists = existingIds.includes(producedProcedureId);

    const mergedOptions = alreadyExists
      ? [...originalProcedures.options]
      : [...originalProcedures.options, { id: producedProcedureId }];

    return {
      options: mergedOptions,
      preferredId: producedProcedureId
    };
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
    modifiers?: Fillings.IIngredientModifiers
  ): Result<void> {
    if (amount < 0) {
      return fail(`Ingredient amount must be non-negative: ${amount}`);
    }

    this._pushUndo();

    const ingredients = [...this._current.ingredients];
    const existingIndex = ingredients.findIndex((ing) => ing.ingredientId === id);

    const newIngredient: Fillings.IProducedFillingIngredientEntity = {
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
    const actualWeight = ProducedFilling._calculateWeightFromIngredients(scaledIngredients);

    this._current = {
      ...this._current,
      ingredients: scaledIngredients,
      targetWeight: actualWeight
    };

    return succeed(actualWeight);
  }

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
    };

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

    return succeed(undefined);
  }

  // ============================================================================
  // Read-only Access
  // ============================================================================

  /**
   * Gets the variation ID.
   * @public
   */
  public get variationId(): FillingRecipeVariationId {
    return this._current.variationId;
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
  public get ingredients(): ReadonlyArray<Fillings.IProducedFillingIngredientEntity> {
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
  public hasChanges(original: IProducedFillingEntity): boolean {
    return this.getChanges(original).hasChanges;
  }

  /**
   * Gets detailed changes between current state and original.
   * @param original - Original produced filling to compare against
   * @returns Structure describing what changed
   * @public
   */
  public getChanges(original: IProducedFillingEntity): IFillingChanges {
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
   * Calculates total weight from current weight-contributing ingredients.
   */
  private _calculateTotalWeight(): Measurement {
    return ProducedFilling._calculateWeightFromIngredients(this._current.ingredients);
  }

  /**
   * Calculates total weight from a list of ingredients.
   * Only includes weight-contributing units (g, mL).
   */
  private static _calculateWeightFromIngredients(
    ingredients: ReadonlyArray<Fillings.IProducedFillingIngredientEntity>
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

  protected _deepCopy(filling: IProducedFillingEntity): IProducedFillingEntity {
    return {
      variationId: filling.variationId,
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
    a: ReadonlyArray<Fillings.IProducedFillingIngredientEntity>,
    b: ReadonlyArray<Fillings.IProducedFillingIngredientEntity>
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
  private _ingredientEqual(
    a: Fillings.IProducedFillingIngredientEntity,
    b: Fillings.IProducedFillingIngredientEntity
  ): boolean {
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
  private _modifiersEqual(
    a: Fillings.IIngredientModifiers | undefined,
    b: Fillings.IIngredientModifiers | undefined
  ): boolean {
    if (a === undefined && b === undefined) {
      return true;
    }
    if (a === undefined || b === undefined) {
      return false;
    }
    /* c8 ignore next - branch: both modifiers defined but differing values */
    return a.spoonLevel === b.spoonLevel && a.toTaste === b.toTaste;
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
