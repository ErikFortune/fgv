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
 * EditedDecoration - mutable wrapper for editing decoration entities with undo/redo
 * @packageDocumentation
 */

import { Result, fail, succeed } from '@fgv/ts-utils';

import { Helpers, Model as CommonModel, ProcedureId, RatingScore } from '../../common';
import { Decorations, Fillings, Session } from '../../entities';
import { EditableWrapper } from '../editableWrapper';

type IProcedureRefEntity = Fillings.IProcedureRefEntity;
type RatingCategory = Fillings.RatingCategory;

/**
 * Structure describing what changed between two decoration entities
 * @public
 */
export interface IDecorationChanges {
  /** True if name changed */
  readonly nameChanged: boolean;
  /** True if description changed */
  readonly descriptionChanged: boolean;
  /** True if ingredients changed */
  readonly ingredientsChanged: boolean;
  /** True if procedures changed */
  readonly proceduresChanged: boolean;
  /** True if ratings changed */
  readonly ratingsChanged: boolean;
  /** True if tags changed */
  readonly tagsChanged: boolean;
  /** True if notes changed */
  readonly notesChanged: boolean;
  /** True if any changes were detected */
  readonly hasChanges: boolean;
}

/**
 * Mutable wrapper for DecorationEntity with undo/redo support.
 * Provides editing methods that maintain history for undo/redo operations.
 * @public
 */
export class EditedDecoration extends EditableWrapper<Decorations.IDecorationEntity> {
  /**
   * Creates an EditedDecoration.
   * Use static factory methods instead of calling this directly.
   * @internal
   */
  private constructor(initial: Decorations.IDecorationEntity) {
    super(initial);
  }

  /**
   * Factory method for creating an EditedDecoration from an existing entity.
   * @param initial - The initial decoration entity state
   * @returns Success with EditedDecoration
   * @public
   */
  public static create(initial: Decorations.IDecorationEntity): Result<EditedDecoration> {
    return succeed(new EditedDecoration(EditedDecoration._copyEntity(initial)));
  }

  /**
   * Factory method for restoring an EditedDecoration from serialized history.
   * Restores the complete editing state including undo/redo stacks.
   * @param history - Serialized editing history
   * @returns Result containing EditedDecoration or error
   * @public
   */
  public static restoreFromHistory(
    history: Session.ISerializedEditingHistoryEntity<Decorations.IDecorationEntity>
  ): Result<EditedDecoration> {
    const instance = new EditedDecoration(history.current);
    instance._restoreHistory(history);
    return succeed(instance);
  }

  // ============================================================================
  // Editing Methods — Common Fields
  // ============================================================================

  /**
   * Sets the decoration name.
   * @param name - New display name
   * @returns Success
   * @public
   */
  public setName(name: string): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, name };
    return succeed(undefined);
  }

  /**
   * Sets the decoration description.
   * @param description - New description, or undefined to clear
   * @returns Success
   * @public
   */
  public setDescription(description: string | undefined): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, description };
    return succeed(undefined);
  }

  /**
   * Sets the ingredients list.
   * @param ingredients - New ingredients array
   * @returns Success
   * @public
   */
  public setIngredients(ingredients: ReadonlyArray<Decorations.IDecorationIngredientEntity>): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      ingredients: ingredients.map((ing) => ({
        ...ing,
        ingredient: {
          ...ing.ingredient,
          ids: [...ing.ingredient.ids]
        },
        notes: ing.notes ? ing.notes.map((n) => ({ ...n })) : undefined
      }))
    };
    return succeed(undefined);
  }

  /**
   * Adds an ingredient to the decoration.
   * @param ingredient - Ingredient to add
   * @returns Success
   * @public
   */
  public addIngredient(ingredient: Decorations.IDecorationIngredientEntity): Result<void> {
    this._pushUndo();
    const ingredients = [
      ...this._current.ingredients,
      {
        ...ingredient,
        ingredient: {
          ...ingredient.ingredient,
          ids: [...ingredient.ingredient.ids]
        },
        notes: ingredient.notes ? ingredient.notes.map((n) => ({ ...n })) : undefined
      }
    ];
    this._current = { ...this._current, ingredients };
    return succeed(undefined);
  }

  /**
   * Removes an ingredient from the decoration.
   * @param index - Index of ingredient to remove
   * @returns Success or failure if index is out of bounds
   * @public
   */
  public removeIngredient(index: number): Result<void> {
    if (index < 0 || index >= this._current.ingredients.length) {
      return fail(`ingredient index ${index} out of bounds (0..${this._current.ingredients.length - 1})`);
    }
    this._pushUndo();
    const ingredients = [...this._current.ingredients];
    ingredients.splice(index, 1);
    this._current = { ...this._current, ingredients };
    return succeed(undefined);
  }

  /**
   * Updates an ingredient at the specified index.
   * @param index - Index of ingredient to update
   * @param update - Partial ingredient fields to merge
   * @returns Success or failure if index is out of bounds
   * @public
   */
  public updateIngredient(
    index: number,
    update: Partial<Decorations.IDecorationIngredientEntity>
  ): Result<void> {
    if (index < 0 || index >= this._current.ingredients.length) {
      return fail(`ingredient index ${index} out of bounds (0..${this._current.ingredients.length - 1})`);
    }
    this._pushUndo();
    const ingredients = [...this._current.ingredients];
    ingredients[index] = {
      ...ingredients[index],
      ...update,
      ingredient: update.ingredient
        ? {
            ...update.ingredient,
            ids: [...update.ingredient.ids]
          }
        : ingredients[index].ingredient,
      notes: update.notes ? update.notes.map((n) => ({ ...n })) : ingredients[index].notes
    };
    this._current = { ...this._current, ingredients };
    return succeed(undefined);
  }

  /**
   * Sets the procedures list.
   * @param procedures - New procedures with preferred selection, or undefined to clear
   * @returns Success
   * @public
   */
  public setProcedures(
    procedures: CommonModel.IOptionsWithPreferred<IProcedureRefEntity, ProcedureId> | undefined
  ): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      procedures: procedures
        ? {
            options: procedures.options.map((p) => ({
              ...p,
              notes: p.notes ? p.notes.map((n) => ({ ...n })) : undefined
            })),
            preferredId: procedures.preferredId
          }
        : undefined
    };
    return succeed(undefined);
  }

  /**
   * Adds a procedure reference to the decoration.
   * Creates procedures field if it doesn't exist.
   * @param ref - Procedure reference to add
   * @returns Success
   * @public
   */
  public addProcedureRef(ref: IProcedureRefEntity): Result<void> {
    this._pushUndo();
    const current = this._current.procedures;
    const newRef = {
      ...ref,
      notes: ref.notes ? ref.notes.map((n) => ({ ...n })) : undefined
    };

    if (!current) {
      this._current = {
        ...this._current,
        procedures: {
          options: [newRef],
          preferredId: undefined
        }
      };
    } else {
      this._current = {
        ...this._current,
        procedures: {
          options: [...current.options, newRef],
          preferredId: current.preferredId
        }
      };
    }
    return succeed(undefined);
  }

  /**
   * Removes a procedure reference from the decoration.
   * @param id - Procedure ID to remove
   * @returns Success
   * @public
   */
  public removeProcedureRef(id: ProcedureId): Result<void> {
    if (!this._current.procedures) {
      return succeed(undefined);
    }

    this._pushUndo();
    const options = this._current.procedures.options.filter((p) => p.id !== id);
    const preferredId =
      this._current.procedures.preferredId === id ? undefined : this._current.procedures.preferredId;

    this._current = {
      ...this._current,
      procedures: options.length > 0 ? { options, preferredId } : undefined
    };
    return succeed(undefined);
  }

  /**
   * Sets the preferred procedure.
   * @param id - Procedure ID to set as preferred, or undefined to clear
   * @returns Success
   * @public
   */
  public setPreferredProcedure(id: ProcedureId | undefined): Result<void> {
    if (!this._current.procedures) {
      return succeed(undefined);
    }

    this._pushUndo();
    this._current = {
      ...this._current,
      procedures: {
        options: this._current.procedures.options,
        preferredId: id
      }
    };
    return succeed(undefined);
  }

  /**
   * Sets the ratings list.
   * @param ratings - New ratings array, or undefined to clear
   * @returns Success
   * @public
   */
  public setRatings(ratings: ReadonlyArray<Decorations.IDecorationRating> | undefined): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      ratings: ratings
        ? ratings.map((r) => ({
            ...r,
            notes: r.notes ? r.notes.map((n) => ({ ...n })) : undefined
          }))
        : undefined
    };
    return succeed(undefined);
  }

  /**
   * Sets or updates a rating for a specific category.
   * @param category - Rating category
   * @param score - Rating score (1-5)
   * @param notes - Optional categorized notes
   * @returns Success
   * @public
   */
  public setRating(
    category: RatingCategory,
    score: RatingScore,
    notes?: ReadonlyArray<CommonModel.ICategorizedNote>
  ): Result<void> {
    this._pushUndo();
    const ratings = this._current.ratings ?? [];
    const existingIndex = ratings.findIndex((r) => r.category === category);
    const newRating: Decorations.IDecorationRating = {
      category,
      score,
      notes: notes ? notes.map((n) => ({ ...n })) : undefined
    };

    if (existingIndex >= 0) {
      const updated = [...ratings];
      updated[existingIndex] = newRating;
      this._current = { ...this._current, ratings: updated };
    } else {
      this._current = { ...this._current, ratings: [...ratings, newRating] };
    }
    return succeed(undefined);
  }

  /**
   * Removes a rating for a specific category.
   * @param category - Rating category to remove
   * @returns Success
   * @public
   */
  public removeRating(category: RatingCategory): Result<void> {
    if (!this._current.ratings) {
      return succeed(undefined);
    }

    this._pushUndo();
    const ratings = this._current.ratings.filter((r) => r.category !== category);
    this._current = {
      ...this._current,
      ratings: Helpers.nonEmpty(ratings)
    };
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
    return succeed(undefined);
  }

  /**
   * Applies a partial update to the current entity.
   * This is useful for bulk field updates.
   * Pushes current state to undo before change, clears redo.
   * @param update - Partial entity fields to merge
   * @returns Success
   * @public
   */
  public applyUpdate(update: Partial<Decorations.IDecorationEntity>): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, ...update };
    return succeed(undefined);
  }

  // ============================================================================
  // Read-only Access
  // ============================================================================

  /**
   * Gets the decoration name.
   * @public
   */
  public get name(): string {
    return this._current.name;
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  /**
   * Checks if current state differs from original.
   * @param original - Original decoration entity to compare against
   * @returns True if changes were detected
   * @public
   */
  public hasChanges(original: Decorations.IDecorationEntity): boolean {
    return this.getChanges(original).hasChanges;
  }

  /**
   * Gets detailed changes between current state and original.
   * @param original - Original decoration entity to compare against
   * @returns Structure describing what changed
   * @public
   */
  public getChanges(original: Decorations.IDecorationEntity): IDecorationChanges {
    const nameChanged = this._current.name !== original.name;
    const descriptionChanged = this._current.description !== original.description;
    const ingredientsChanged =
      JSON.stringify(this._current.ingredients) !== JSON.stringify(original.ingredients);
    const proceduresChanged =
      JSON.stringify(this._current.procedures) !== JSON.stringify(original.procedures);
    const ratingsChanged = JSON.stringify(this._current.ratings) !== JSON.stringify(original.ratings);
    const tagsChanged = !EditedDecoration._stringArrayEqual(this._current.tags, original.tags);
    const notesChanged = !EditedDecoration._notesEqual(this._current.notes, original.notes);

    return {
      nameChanged,
      descriptionChanged,
      ingredientsChanged,
      proceduresChanged,
      ratingsChanged,
      tagsChanged,
      notesChanged,
      hasChanges:
        nameChanged ||
        descriptionChanged ||
        ingredientsChanged ||
        proceduresChanged ||
        ratingsChanged ||
        tagsChanged ||
        notesChanged
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  protected _deepCopy(entity: Decorations.IDecorationEntity): Decorations.IDecorationEntity {
    return EditedDecoration._copyEntity(entity);
  }

  private static _copyEntity(entity: Decorations.IDecorationEntity): Decorations.IDecorationEntity {
    return {
      ...entity,
      ingredients: entity.ingredients.map((ing) => ({
        ...ing,
        ingredient: {
          ...ing.ingredient,
          ids: [...ing.ingredient.ids]
        },
        notes: ing.notes ? ing.notes.map((n) => ({ ...n })) : undefined
      })),
      procedures: entity.procedures
        ? {
            options: entity.procedures.options.map((p) => ({
              ...p,
              notes: p.notes ? p.notes.map((n) => ({ ...n })) : undefined
            })),
            preferredId: entity.procedures.preferredId
          }
        : undefined,
      ratings: entity.ratings
        ? entity.ratings.map((r) => ({
            ...r,
            notes: r.notes ? r.notes.map((n) => ({ ...n })) : undefined
          }))
        : undefined,
      tags: entity.tags ? [...entity.tags] : undefined,
      notes: entity.notes ? entity.notes.map((n) => ({ ...n })) : undefined
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
