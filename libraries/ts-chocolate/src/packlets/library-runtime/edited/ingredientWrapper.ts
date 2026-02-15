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
 * EditedIngredient - mutable wrapper for editing ingredient entities with undo/redo
 * @packageDocumentation
 */

import { Result, succeed } from '@fgv/ts-utils';

import {
  Allergen,
  Certification,
  IngredientCategory,
  IngredientPhase,
  MeasurementUnit,
  Model as CommonModel
} from '../../common';
import { Ingredients, Session } from '../../entities';

/**
 * Maximum number of undo snapshots to retain
 */
const MAX_HISTORY_SIZE: number = 50;

/**
 * Structure describing what changed between two ingredient entities
 * @public
 */
export interface IIngredientChanges {
  /** True if name changed */
  readonly nameChanged: boolean;
  /** True if category changed */
  readonly categoryChanged: boolean;
  /** True if ganache characteristics changed */
  readonly ganacheCharacteristicsChanged: boolean;
  /** True if description changed */
  readonly descriptionChanged: boolean;
  /** True if manufacturer changed */
  readonly manufacturerChanged: boolean;
  /** True if allergens changed */
  readonly allergensChanged: boolean;
  /** True if trace allergens changed */
  readonly traceAllergensChanged: boolean;
  /** True if certifications changed */
  readonly certificationsChanged: boolean;
  /** True if vegan status changed */
  readonly veganChanged: boolean;
  /** True if tags changed */
  readonly tagsChanged: boolean;
  /** True if density changed */
  readonly densityChanged: boolean;
  /** True if phase changed */
  readonly phaseChanged: boolean;
  /** True if measurement units changed */
  readonly measurementUnitsChanged: boolean;
  /** True if urls changed */
  readonly urlsChanged: boolean;
  /** True if notes changed */
  readonly notesChanged: boolean;
  /** True if any changes were detected */
  readonly hasChanges: boolean;
}

/**
 * Mutable wrapper for IngredientEntity with undo/redo support.
 * Provides editing methods that maintain history for undo/redo operations.
 * Named "Edited" rather than "Produced" since ingredients are not produced.
 * @public
 */
export class EditedIngredient {
  private _current: Ingredients.IngredientEntity;
  private _undoStack: Ingredients.IngredientEntity[];
  private _redoStack: Ingredients.IngredientEntity[];

  /**
   * Creates an EditedIngredient.
   * Use static factory methods instead of calling this directly.
   * @internal
   */
  private constructor(initial: Ingredients.IngredientEntity) {
    this._current = initial;
    this._undoStack = [];
    this._redoStack = [];
  }

  /**
   * Factory method for creating an EditedIngredient from an existing entity.
   * @param initial - The initial ingredient entity state
   * @returns Success with EditedIngredient
   * @public
   */
  public static create(initial: Ingredients.IngredientEntity): Result<EditedIngredient> {
    return succeed(new EditedIngredient(EditedIngredient._deepCopy(initial)));
  }

  /**
   * Factory method for restoring an EditedIngredient from serialized history.
   * Restores the complete editing state including undo/redo stacks.
   * @param history - Serialized editing history
   * @returns Result containing EditedIngredient or error
   * @public
   */
  public static restoreFromHistory(
    history: Session.ISerializedEditingHistoryEntity<Ingredients.IngredientEntity>
  ): Result<EditedIngredient> {
    const instance = new EditedIngredient(history.current);
    instance._undoStack = [...history.undoStack];
    instance._redoStack = [...history.redoStack];
    return succeed(instance);
  }

  // ============================================================================
  // Snapshot Management
  // ============================================================================

  /**
   * Creates an immutable snapshot of the current state.
   * @returns Immutable copy of current ingredient entity
   * @public
   */
  public createSnapshot(): Ingredients.IngredientEntity {
    return EditedIngredient._deepCopy(this._current);
  }

  /**
   * Restores state from a snapshot.
   * Pushes current state to undo stack and clears redo stack.
   * @param snapshot - Snapshot to restore
   * @returns Success or failure
   * @public
   */
  public restoreSnapshot(snapshot: Ingredients.IngredientEntity): Result<void> {
    this._pushUndo();
    this._current = EditedIngredient._deepCopy(snapshot);
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Serializes the complete editing history for persistence.
   * Includes current state, original state, and undo/redo stacks.
   * @param original - Original state when editing started (for change detection on restore)
   * @returns Serialized editing history
   * @public
   */
  public getSerializedHistory(
    original: Ingredients.IngredientEntity
  ): Session.ISerializedEditingHistoryEntity<Ingredients.IngredientEntity> {
    return {
      current: EditedIngredient._deepCopy(this._current),
      original: EditedIngredient._deepCopy(original),
      undoStack: this._undoStack.map((state) => EditedIngredient._deepCopy(state)),
      redoStack: this._redoStack.map((state) => EditedIngredient._deepCopy(state))
    };
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
    this._redoStack.push(EditedIngredient._deepCopy(this._current));
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
    this._undoStack.push(EditedIngredient._deepCopy(this._current));
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
  // Editing Methods — Common Fields
  // ============================================================================

  /**
   * Sets the ingredient name.
   * @param name - New display name
   * @returns Success
   * @public
   */
  public setName(name: string): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, name };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the ingredient description.
   * @param description - New description, or undefined to clear
   * @returns Success
   * @public
   */
  public setDescription(description: string | undefined): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, description };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the ingredient manufacturer.
   * @param manufacturer - New manufacturer, or undefined to clear
   * @returns Success
   * @public
   */
  public setManufacturer(manufacturer: string | undefined): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, manufacturer };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the ganache characteristics.
   * @param ganacheCharacteristics - New ganache characteristics
   * @returns Success
   * @public
   */
  public setGanacheCharacteristics(
    ganacheCharacteristics: Ingredients.IGanacheCharacteristics
  ): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, ganacheCharacteristics: { ...ganacheCharacteristics } };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the allergens list.
   * @param allergens - New allergens array, or undefined to clear
   * @returns Success
   * @public
   */
  public setAllergens(allergens: ReadonlyArray<Allergen> | undefined): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      allergens: allergens ? [...allergens] : undefined
    };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the trace allergens list.
   * @param traceAllergens - New trace allergens array, or undefined to clear
   * @returns Success
   * @public
   */
  public setTraceAllergens(traceAllergens: ReadonlyArray<Allergen> | undefined): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      traceAllergens: traceAllergens ? [...traceAllergens] : undefined
    };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the certifications list.
   * @param certifications - New certifications array, or undefined to clear
   * @returns Success
   * @public
   */
  public setCertifications(certifications: ReadonlyArray<Certification> | undefined): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      certifications: certifications ? [...certifications] : undefined
    };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the vegan status.
   * @param vegan - New vegan status, or undefined to clear
   * @returns Success
   * @public
   */
  public setVegan(vegan: boolean | undefined): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, vegan };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the tags list.
   * @param tags - New tags array, or undefined to clear
   * @returns Success
   * @public
   */
  public setTags(tags: ReadonlyArray<string> | undefined): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      tags: tags ? [...tags] : undefined
    };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the density.
   * @param density - New density in g/mL, or undefined to clear
   * @returns Success
   * @public
   */
  public setDensity(density: number | undefined): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, density };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the physical phase.
   * @param phase - New phase, or undefined to clear
   * @returns Success
   * @public
   */
  public setPhase(phase: IngredientPhase | undefined): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, phase };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the measurement units.
   * @param measurementUnits - New measurement units, or undefined to clear
   * @returns Success
   * @public
   */
  public setMeasurementUnits(
    measurementUnits:
      | CommonModel.IOptionsWithPreferred<CommonModel.IMeasurementUnitOption, MeasurementUnit>
      | undefined
  ): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, measurementUnits };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the URLs list.
   * @param urls - New URLs array, or undefined to clear
   * @returns Success
   * @public
   */
  public setUrls(urls: ReadonlyArray<CommonModel.ICategorizedUrl> | undefined): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      urls: urls ? urls.map((u) => ({ ...u })) : undefined
    };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the notes list.
   * @param notes - New notes array, or undefined to clear
   * @returns Success
   * @public
   */
  public setNotes(notes: ReadonlyArray<CommonModel.ICategorizedNote> | undefined): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      notes: notes ? notes.map((n) => ({ ...n })) : undefined
    };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Applies a partial update to the current entity.
   * This is useful for bulk field updates or category-specific field changes.
   * Pushes current state to undo before change, clears redo.
   * @param update - Partial entity fields to merge
   * @returns Success
   * @public
   */
  public applyUpdate(update: Partial<Ingredients.IngredientEntity>): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, ...update };
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
  public get snapshot(): Ingredients.IngredientEntity {
    return this.createSnapshot();
  }

  /**
   * Gets the current entity (direct reference — callers should not mutate).
   * @public
   */
  public get current(): Ingredients.IngredientEntity {
    return this._current;
  }

  /**
   * Gets the ingredient name.
   * @public
   */
  public get name(): string {
    return this._current.name;
  }

  /**
   * Gets the ingredient category.
   * @public
   */
  public get category(): IngredientCategory {
    return this._current.category;
  }

  /**
   * Gets the ganache characteristics.
   * @public
   */
  public get ganacheCharacteristics(): Ingredients.IGanacheCharacteristics {
    return this._current.ganacheCharacteristics;
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  /**
   * Checks if current state differs from original.
   * @param original - Original ingredient entity to compare against
   * @returns True if changes were detected
   * @public
   */
  public hasChanges(original: Ingredients.IngredientEntity): boolean {
    return this.getChanges(original).hasChanges;
  }

  /**
   * Gets detailed changes between current state and original.
   * @param original - Original ingredient entity to compare against
   * @returns Structure describing what changed
   * @public
   */
  public getChanges(original: Ingredients.IngredientEntity): IIngredientChanges {
    const nameChanged = this._current.name !== original.name;
    const categoryChanged = this._current.category !== original.category;
    const ganacheCharacteristicsChanged = !EditedIngredient._ganacheEqual(
      this._current.ganacheCharacteristics,
      original.ganacheCharacteristics
    );
    const descriptionChanged = this._current.description !== original.description;
    const manufacturerChanged = this._current.manufacturer !== original.manufacturer;
    const allergensChanged = !EditedIngredient._stringArrayEqual(this._current.allergens, original.allergens);
    const traceAllergensChanged = !EditedIngredient._stringArrayEqual(
      this._current.traceAllergens,
      original.traceAllergens
    );
    const certificationsChanged = !EditedIngredient._stringArrayEqual(
      this._current.certifications,
      original.certifications
    );
    const veganChanged = this._current.vegan !== original.vegan;
    const tagsChanged = !EditedIngredient._stringArrayEqual(this._current.tags, original.tags);
    const densityChanged = this._current.density !== original.density;
    const phaseChanged = this._current.phase !== original.phase;
    const measurementUnitsChanged = !EditedIngredient._measurementUnitsEqual(
      this._current.measurementUnits,
      original.measurementUnits
    );
    const urlsChanged = !EditedIngredient._urlsEqual(this._current.urls, original.urls);
    const notesChanged = !EditedIngredient._notesEqual(this._current.notes, original.notes);

    return {
      nameChanged,
      categoryChanged,
      ganacheCharacteristicsChanged,
      descriptionChanged,
      manufacturerChanged,
      allergensChanged,
      traceAllergensChanged,
      certificationsChanged,
      veganChanged,
      tagsChanged,
      densityChanged,
      phaseChanged,
      measurementUnitsChanged,
      urlsChanged,
      notesChanged,
      hasChanges:
        nameChanged ||
        categoryChanged ||
        ganacheCharacteristicsChanged ||
        descriptionChanged ||
        manufacturerChanged ||
        allergensChanged ||
        traceAllergensChanged ||
        certificationsChanged ||
        veganChanged ||
        tagsChanged ||
        densityChanged ||
        phaseChanged ||
        measurementUnitsChanged ||
        urlsChanged ||
        notesChanged
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Pushes current state to undo stack, maintaining max size.
   */
  private _pushUndo(): void {
    this._undoStack.push(EditedIngredient._deepCopy(this._current));

    if (this._undoStack.length > MAX_HISTORY_SIZE) {
      this._undoStack.shift();
    }
  }

  /**
   * Creates a deep copy of an ingredient entity.
   * Handles all category-specific fields via spread.
   */
  private static _deepCopy(entity: Ingredients.IngredientEntity): Ingredients.IngredientEntity {
    return {
      ...entity,
      ganacheCharacteristics: { ...entity.ganacheCharacteristics },
      allergens: entity.allergens ? [...entity.allergens] : undefined,
      traceAllergens: entity.traceAllergens ? [...entity.traceAllergens] : undefined,
      certifications: entity.certifications ? [...entity.certifications] : undefined,
      tags: entity.tags ? [...entity.tags] : undefined,
      measurementUnits: entity.measurementUnits
        ? {
            options: entity.measurementUnits.options.map((o) => ({ ...o })),
            preferredId: entity.measurementUnits.preferredId
          }
        : undefined,
      urls: entity.urls ? entity.urls.map((u) => ({ ...u })) : undefined,
      notes: entity.notes ? entity.notes.map((n) => ({ ...n })) : undefined,
      // Category-specific array fields
      ...EditedIngredient._deepCopyCategoryFields(entity)
    };
  }

  /**
   * Deep copies category-specific array fields.
   * @internal
   */
  private static _deepCopyCategoryFields(
    entity: Ingredients.IngredientEntity
  ): Partial<Ingredients.IngredientEntity> {
    if (Ingredients.isChocolateIngredientEntity(entity)) {
      return {
        temperatureCurve: entity.temperatureCurve ? { ...entity.temperatureCurve } : undefined,
        beanVarieties: entity.beanVarieties ? [...entity.beanVarieties] : undefined,
        applications: entity.applications ? [...entity.applications] : undefined,
        origins: entity.origins ? [...entity.origins] : undefined
      };
    }
    return {};
  }

  /**
   * Compares two ganache characteristics for equality.
   */
  private static _ganacheEqual(
    a: Ingredients.IGanacheCharacteristics,
    b: Ingredients.IGanacheCharacteristics
  ): boolean {
    return (
      a.cacaoFat === b.cacaoFat &&
      a.sugar === b.sugar &&
      a.milkFat === b.milkFat &&
      a.water === b.water &&
      a.solids === b.solids &&
      a.otherFats === b.otherFats
    );
  }

  /**
   * Compares two string/branded-string arrays for equality (sorted).
   */
  private static _stringArrayEqual(
    a: ReadonlyArray<string> | undefined,
    b: ReadonlyArray<string> | undefined
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
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, i) => val === sortedB[i]);
  }

  /**
   * Compares two measurement unit option sets for equality.
   */
  private static _measurementUnitsEqual(
    a: CommonModel.IOptionsWithPreferred<CommonModel.IMeasurementUnitOption, MeasurementUnit> | undefined,
    b: CommonModel.IOptionsWithPreferred<CommonModel.IMeasurementUnitOption, MeasurementUnit> | undefined
  ): boolean {
    if (a === undefined && b === undefined) {
      return true;
    }
    if (a === undefined || b === undefined) {
      return false;
    }
    if (a.preferredId !== b.preferredId) {
      return false;
    }
    if (a.options.length !== b.options.length) {
      return false;
    }
    const sortedA = [...a.options].sort((x, y) => x.id.localeCompare(y.id));
    const sortedB = [...b.options].sort((x, y) => x.id.localeCompare(y.id));
    return sortedA.every((opt, i) => opt.id === sortedB[i].id);
  }

  /**
   * Compares two URL arrays for equality.
   */
  private static _urlsEqual(
    a: ReadonlyArray<CommonModel.ICategorizedUrl> | undefined,
    b: ReadonlyArray<CommonModel.ICategorizedUrl> | undefined
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
    const sortedA = [...a].sort((x, y) => x.url.localeCompare(y.url));
    const sortedB = [...b].sort((x, y) => x.url.localeCompare(y.url));
    return sortedA.every((url, i) => url.url === sortedB[i].url && url.category === sortedB[i].category);
  }

  /**
   * Compares two categorized note arrays for equality.
   */
  private static _notesEqual(
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
    const sortedA = [...a].sort((x, y) => x.category.localeCompare(y.category));
    const sortedB = [...b].sort((x, y) => x.category.localeCompare(y.category));
    return sortedA.every((note, i) => note.category === sortedB[i].category && note.note === sortedB[i].note);
  }
}
