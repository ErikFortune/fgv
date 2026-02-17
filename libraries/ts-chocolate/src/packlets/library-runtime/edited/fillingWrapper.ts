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
 * EditedFillingRecipe - mutable wrapper for editing recipe-level filling entity fields with undo/redo.
 * Variation-level editing (ingredients, procedures, scaling) is handled by EditingSession.
 * @packageDocumentation
 */

import { Result, fail, succeed } from '@fgv/ts-utils';

import { Model as CommonModel } from '../../common';
import { Fillings, Session } from '../../entities';

import type { FillingName, FillingRecipeVariationSpec } from '../../common';

type FillingCategory = Fillings.FillingCategory;

/**
 * Maximum number of undo snapshots to retain
 */
const MAX_HISTORY_SIZE: number = 50;

/**
 * Structure describing what changed between two filling recipe entities at the recipe level
 * @public
 */
export interface IFillingRecipeChanges {
  /** True if name changed */
  readonly nameChanged: boolean;
  /** True if category changed */
  readonly categoryChanged: boolean;
  /** True if description changed */
  readonly descriptionChanged: boolean;
  /** True if tags changed */
  readonly tagsChanged: boolean;
  /** True if urls changed */
  readonly urlsChanged: boolean;
  /** True if golden variation spec changed */
  readonly goldenVariationSpecChanged: boolean;
  /** True if variations array changed (add/remove/replace) */
  readonly variationsChanged: boolean;
  /** True if any changes were detected */
  readonly hasChanges: boolean;
}

/**
 * Mutable wrapper for IFillingRecipeEntity with undo/redo support.
 * Manages recipe-level fields only (name, category, description, tags, urls, goldenVariationSpec).
 * Variation-level editing (ingredients, procedures, ratings, scaling) is handled by EditingSession.
 * After an EditingSession save produces a variationEntity, use replaceVariation() or addVariation()
 * to integrate it back into this wrapper.
 * @public
 */
export class EditedFillingRecipe {
  private _current: Fillings.IFillingRecipeEntity;
  private _undoStack: Fillings.IFillingRecipeEntity[];
  private _redoStack: Fillings.IFillingRecipeEntity[];

  /**
   * Creates an EditedFillingRecipe.
   * Use static factory methods instead of calling this directly.
   * @internal
   */
  private constructor(initial: Fillings.IFillingRecipeEntity) {
    this._current = initial;
    this._undoStack = [];
    this._redoStack = [];
  }

  /**
   * Factory method for creating an EditedFillingRecipe from an existing entity.
   * @param initial - The initial filling recipe entity state
   * @returns Success with EditedFillingRecipe
   * @public
   */
  public static create(initial: Fillings.IFillingRecipeEntity): Result<EditedFillingRecipe> {
    return succeed(new EditedFillingRecipe(EditedFillingRecipe._deepCopy(initial)));
  }

  /**
   * Factory method for restoring an EditedFillingRecipe from serialized history.
   * Restores the complete editing state including undo/redo stacks.
   * @param history - Serialized editing history
   * @returns Result containing EditedFillingRecipe or error
   * @public
   */
  public static restoreFromHistory(
    history: Session.ISerializedEditingHistoryEntity<Fillings.IFillingRecipeEntity>
  ): Result<EditedFillingRecipe> {
    const instance = new EditedFillingRecipe(history.current);
    instance._undoStack = [...history.undoStack];
    instance._redoStack = [...history.redoStack];
    return succeed(instance);
  }

  // ============================================================================
  // Snapshot Management
  // ============================================================================

  /**
   * Creates an immutable snapshot of the current state.
   * @returns Immutable copy of current filling recipe entity
   * @public
   */
  public createSnapshot(): Fillings.IFillingRecipeEntity {
    return EditedFillingRecipe._deepCopy(this._current);
  }

  /**
   * Restores state from a snapshot.
   * Pushes current state to undo stack and clears redo stack.
   * @param snapshot - Snapshot to restore
   * @returns Success or failure
   * @public
   */
  public restoreSnapshot(snapshot: Fillings.IFillingRecipeEntity): Result<void> {
    this._pushUndo();
    this._current = EditedFillingRecipe._deepCopy(snapshot);
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Serializes the complete editing history for persistence.
   * @param original - Original state when editing started (for change detection on restore)
   * @returns Serialized editing history
   * @public
   */
  public getSerializedHistory(
    original: Fillings.IFillingRecipeEntity
  ): Session.ISerializedEditingHistoryEntity<Fillings.IFillingRecipeEntity> {
    return {
      current: EditedFillingRecipe._deepCopy(this._current),
      original: EditedFillingRecipe._deepCopy(original),
      undoStack: this._undoStack.map((state) => EditedFillingRecipe._deepCopy(state)),
      redoStack: this._redoStack.map((state) => EditedFillingRecipe._deepCopy(state))
    };
  }

  // ============================================================================
  // Undo/Redo
  // ============================================================================

  /**
   * Undoes the last change.
   * @returns Success with true if undo succeeded, Success with false if no history
   * @public
   */
  public undo(): Result<boolean> {
    if (this._undoStack.length === 0) {
      return succeed(false);
    }

    const previous = this._undoStack.pop()!;
    this._redoStack.push(EditedFillingRecipe._deepCopy(this._current));
    this._current = previous;
    return succeed(true);
  }

  /**
   * Redoes the last undone change.
   * @returns Success with true if redo succeeded, Success with false if no future
   * @public
   */
  public redo(): Result<boolean> {
    if (this._redoStack.length === 0) {
      return succeed(false);
    }

    const future = this._redoStack.pop()!;
    this._undoStack.push(EditedFillingRecipe._deepCopy(this._current));
    this._current = future;
    return succeed(true);
  }

  /**
   * Checks if undo is available.
   * @public
   */
  public canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  /**
   * Checks if redo is available.
   * @public
   */
  public canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  // ============================================================================
  // Editing Methods — Recipe-Level Fields
  // ============================================================================

  /**
   * Sets the filling recipe name.
   * @param name - New display name
   * @returns Success
   * @public
   */
  public setName(name: FillingName): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, name };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the filling recipe category.
   * @param category - New category (ganache, caramel, gianduja)
   * @returns Success
   * @public
   */
  public setCategory(category: FillingCategory): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, category };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the filling recipe description.
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
   * Sets the golden variation spec.
   * @param spec - Variation spec to set as golden; must exist in variations
   * @returns Success or failure if spec not found
   * @public
   */
  public setGoldenVariationSpec(spec: FillingRecipeVariationSpec): Result<void> {
    if (!this._current.variations.some((v) => v.variationSpec === spec)) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    this._pushUndo();
    this._current = { ...this._current, goldenVariationSpec: spec };
    this._redoStack = [];
    return succeed(undefined);
  }

  // ============================================================================
  // Variation Management — Integration with EditingSession
  // ============================================================================

  /**
   * Replaces a variation's entity data (called after EditingSession save).
   * @param spec - Variation spec to replace
   * @param variation - New variation entity data
   * @returns Success or failure if spec not found
   * @public
   */
  public replaceVariation(
    spec: FillingRecipeVariationSpec,
    variation: Fillings.IFillingRecipeVariationEntity
  ): Result<void> {
    const index = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (index < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    this._pushUndo();
    const variations = [...this._current.variations];
    variations[index] = EditedFillingRecipe._deepCopyVariation(variation);
    this._current = { ...this._current, variations };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Adds a new variation entity (from EditingSession saveAsNewVariation).
   * @param variation - New variation entity data
   * @returns Success or failure if spec already exists
   * @public
   */
  public addVariation(variation: Fillings.IFillingRecipeVariationEntity): Result<void> {
    if (this._current.variations.some((v) => v.variationSpec === variation.variationSpec)) {
      return fail(`variation '${variation.variationSpec}' already exists in this recipe`);
    }
    this._pushUndo();
    const variations = [...this._current.variations, EditedFillingRecipe._deepCopyVariation(variation)];
    this._current = { ...this._current, variations };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Removes a variation from the recipe.
   * Cannot remove the last variation or the golden variation.
   * @param spec - Variation spec to remove
   * @returns Success or failure
   * @public
   */
  public removeVariation(spec: FillingRecipeVariationSpec): Result<void> {
    if (this._current.variations.length <= 1) {
      return fail('cannot remove the last variation');
    }
    if (this._current.goldenVariationSpec === spec) {
      return fail(`cannot remove the golden variation '${spec}'`);
    }
    const index = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (index < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    this._pushUndo();
    const variations = [...this._current.variations];
    variations.splice(index, 1);
    this._current = { ...this._current, variations };
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
  public get snapshot(): Fillings.IFillingRecipeEntity {
    return this.createSnapshot();
  }

  /**
   * Gets the current entity (direct reference - callers should not mutate).
   * @public
   */
  public get current(): Fillings.IFillingRecipeEntity {
    return this._current;
  }

  /**
   * Gets the filling recipe name.
   * @public
   */
  public get name(): FillingName {
    return this._current.name;
  }

  /**
   * Gets the golden variation spec.
   * @public
   */
  public get goldenVariationSpec(): FillingRecipeVariationSpec {
    return this._current.goldenVariationSpec;
  }

  /**
   * Gets the variations array.
   * @public
   */
  public get variations(): ReadonlyArray<Fillings.IFillingRecipeVariationEntity> {
    return this._current.variations;
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  /**
   * Checks if current state differs from original.
   * @param original - Original filling recipe entity to compare against
   * @returns True if changes were detected
   * @public
   */
  public hasChanges(original: Fillings.IFillingRecipeEntity): boolean {
    return this.getChanges(original).hasChanges;
  }

  /**
   * Gets detailed changes between current state and original.
   * @param original - Original filling recipe entity to compare against
   * @returns Structure describing what changed
   * @public
   */
  public getChanges(original: Fillings.IFillingRecipeEntity): IFillingRecipeChanges {
    const nameChanged = this._current.name !== original.name;
    const categoryChanged = this._current.category !== original.category;
    const descriptionChanged = this._current.description !== original.description;
    const tagsChanged = !EditedFillingRecipe._stringArrayEqual(this._current.tags, original.tags);
    const urlsChanged = JSON.stringify(this._current.urls) !== JSON.stringify(original.urls);
    const goldenVariationSpecChanged = this._current.goldenVariationSpec !== original.goldenVariationSpec;
    const variationsChanged =
      JSON.stringify(this._current.variations) !== JSON.stringify(original.variations);

    return {
      nameChanged,
      categoryChanged,
      descriptionChanged,
      tagsChanged,
      urlsChanged,
      goldenVariationSpecChanged,
      variationsChanged,
      hasChanges:
        nameChanged ||
        categoryChanged ||
        descriptionChanged ||
        tagsChanged ||
        urlsChanged ||
        goldenVariationSpecChanged ||
        variationsChanged
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Pushes current state to undo stack, maintaining max size.
   */
  private _pushUndo(): void {
    this._undoStack.push(EditedFillingRecipe._deepCopy(this._current));

    if (this._undoStack.length > MAX_HISTORY_SIZE) {
      this._undoStack.shift();
    }
  }

  /**
   * Creates a deep copy of a single variation entity.
   */
  private static _deepCopyVariation(
    variation: Fillings.IFillingRecipeVariationEntity
  ): Fillings.IFillingRecipeVariationEntity {
    return {
      ...variation,
      ingredients: variation.ingredients.map((ing) => ({
        ...ing,
        ingredient: {
          ...ing.ingredient,
          ids: [...ing.ingredient.ids]
        },
        modifiers: ing.modifiers ? { ...ing.modifiers } : undefined,
        notes: ing.notes ? ing.notes.map((n) => ({ ...n })) : undefined
      })),
      notes: variation.notes ? variation.notes.map((n) => ({ ...n })) : undefined,
      ratings: variation.ratings
        ? variation.ratings.map((r) => ({
            ...r,
            notes: r.notes ? r.notes.map((n) => ({ ...n })) : undefined
          }))
        : undefined,
      procedures: variation.procedures
        ? {
            options: variation.procedures.options.map((p) => ({
              ...p,
              notes: p.notes ? p.notes.map((n) => ({ ...n })) : undefined
            })),
            preferredId: variation.procedures.preferredId
          }
        : undefined
    };
  }

  /**
   * Creates a deep copy of a filling recipe entity.
   */
  private static _deepCopy(entity: Fillings.IFillingRecipeEntity): Fillings.IFillingRecipeEntity {
    return {
      ...entity,
      variations: entity.variations.map((v) => EditedFillingRecipe._deepCopyVariation(v)),
      tags: entity.tags ? [...entity.tags] : undefined,
      urls: entity.urls ? entity.urls.map((u) => ({ ...u })) : undefined,
      derivedFrom: entity.derivedFrom
        ? {
            ...entity.derivedFrom,
            notes: entity.derivedFrom.notes ? entity.derivedFrom.notes.map((n) => ({ ...n })) : undefined
          }
        : undefined
    };
  }

  /**
   * Compares two string arrays for equality (sorted).
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
}
