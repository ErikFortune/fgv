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
 * EditedFillingRecipe - mutable wrapper for editing filling recipe entities with undo/redo.
 * Supports both recipe-level fields (name, category, etc.) and variation-level editing
 * (ingredients, procedures, scaling).
 * @packageDocumentation
 */

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';

import { Helpers, Model as CommonModel } from '../../common';
import { Fillings, Session } from '../../entities';
import { EditableWrapper } from '../editableWrapper';
import { scaleAmount } from '../internal';

import type {
  FillingName,
  FillingRecipeVariationSpec,
  IngredientId,
  Measurement,
  MeasurementUnit,
  ProcedureId
} from '../../common';

type FillingCategory = Fillings.FillingCategory;

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
 * Manages both recipe-level fields (name, category, description, tags, urls, goldenVariationSpec)
 * and variation-level editing (ingredients, procedures, notes, scaling).
 * @public
 */
export class EditedFillingRecipe extends EditableWrapper<Fillings.IFillingRecipeEntity> {
  /**
   * Creates an EditedFillingRecipe.
   * Use static factory methods instead of calling this directly.
   * @internal
   */
  private constructor(initial: Fillings.IFillingRecipeEntity) {
    super(initial);
  }

  /**
   * Factory method for creating an EditedFillingRecipe from an existing entity.
   * @param initial - The initial filling recipe entity state
   * @returns Success with EditedFillingRecipe
   * @public
   */
  public static create(initial: Fillings.IFillingRecipeEntity): Result<EditedFillingRecipe> {
    return captureResult(() => new EditedFillingRecipe(EditedFillingRecipe._copyEntity(initial))).onSuccess(
      (e) => e._setInitialSnapshot()
    );
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
    return captureResult(() => new EditedFillingRecipe(history.current))
      .onSuccess((e) => e._restoreHistory(history))
      .onSuccess((i) => i._setInitialSnapshot(history.original));
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
    return succeed(undefined);
  }

  /**
   * Updates the alternate ingredient IDs and preferred selection for a specific ingredient
   * in a variation. Matched by finding the ingredient whose ids array contains currentPrimaryId.
   * @param spec - Variation spec to update
   * @param currentPrimaryId - The ingredient ID currently used to identify the slot
   * @param ids - New full list of ingredient IDs (primary + alternates)
   * @param preferredId - Which ID to mark as preferred
   * @returns Success or failure if spec or ingredient not found
   * @public
   */
  public setVariationIngredientAlternates(
    spec: FillingRecipeVariationSpec,
    currentPrimaryId: IngredientId,
    ids: ReadonlyArray<IngredientId>,
    preferredId: IngredientId
  ): Result<void> {
    const varIndex = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (varIndex < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    const variation = this._current.variations[varIndex];
    const ingIndex = variation.ingredients.findIndex((ing) => ing.ingredient.ids.includes(currentPrimaryId));
    if (ingIndex < 0) {
      return fail(`ingredient '${currentPrimaryId}' not found in variation '${spec}'`);
    }
    this._pushUndo();
    const ingredients = [...variation.ingredients];
    ingredients[ingIndex] = {
      ...ingredients[ingIndex],
      ingredient: {
        ...ingredients[ingIndex].ingredient,
        ids: [...ids],
        preferredId
      }
    };
    const variations = [...this._current.variations];
    variations[varIndex] = { ...variation, ingredients };
    this._current = { ...this._current, variations };
    return succeed(undefined);
  }

  /**
   * Updates the procedure options and preferred selection for a specific variation.
   * Pass an empty options array to clear all procedures.
   * @param spec - Variation spec to update
   * @param options - New full list of procedure ref entities
   * @param preferredId - Which procedure ID to mark as preferred (must be in options, or undefined)
   * @returns Success or failure if spec not found or preferredId not in options
   * @public
   */
  public setVariationProcedureAlternates(
    spec: FillingRecipeVariationSpec,
    options: ReadonlyArray<Fillings.IProcedureRefEntity>,
    preferredId: ProcedureId | undefined
  ): Result<void> {
    const varIndex = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (varIndex < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    if (preferredId !== undefined && !options.some((o) => o.id === preferredId)) {
      return fail(`preferredId '${preferredId}' not found in options`);
    }
    this._pushUndo();
    const variations = [...this._current.variations];
    const procedures:
      | CommonModel.IOptionsWithPreferred<Fillings.IProcedureRefEntity, ProcedureId>
      | undefined = options.length > 0 ? { options: [...options], preferredId } : undefined;
    variations[varIndex] = { ...variations[varIndex], procedures };
    this._current = { ...this._current, variations };
    return succeed(undefined);
  }

  // ============================================================================
  // Variation-Level Ingredient/Procedure Editing
  // ============================================================================

  /**
   * Sets or updates an ingredient in a variation.
   * If an ingredient slot whose `ids` contains `ingredientId` already exists, updates it.
   * Otherwise appends a new ingredient with `ids: [ingredientId]`.
   * Recalculates baseWeight after the change.
   * @param spec - Variation spec to update
   * @param ingredientId - The ingredient ID to set
   * @param amount - Amount of the ingredient
   * @param unit - Optional measurement unit (default: 'g')
   * @param modifiers - Optional ingredient modifiers
   * @returns Success or failure if spec not found
   * @public
   */
  public setVariationIngredient(
    spec: FillingRecipeVariationSpec,
    ingredientId: IngredientId,
    amount: Measurement,
    unit?: MeasurementUnit,
    modifiers?: Fillings.IIngredientModifiers
  ): Result<true> {
    const varIndex = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (varIndex < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }

    this._pushUndo();
    const variation = this._current.variations[varIndex];
    const ingredients = [...variation.ingredients];
    const existingIndex = ingredients.findIndex((ing) => ing.ingredient.ids.includes(ingredientId));

    const newIngredient: Fillings.IFillingIngredientEntity = {
      ingredient:
        existingIndex >= 0
          ? { ...ingredients[existingIndex].ingredient, preferredId: ingredientId }
          : { ids: [ingredientId], preferredId: ingredientId },
      amount,
      unit,
      modifiers
    };

    if (existingIndex >= 0) {
      ingredients[existingIndex] = newIngredient;
    } else {
      ingredients.push(newIngredient);
    }

    const variations = [...this._current.variations];
    variations[varIndex] = {
      ...variation,
      ingredients,
      baseWeight: EditedFillingRecipe._calculateBaseWeight(ingredients)
    };
    this._current = { ...this._current, variations };
    return succeed(true);
  }

  /**
   * Replaces an ingredient in a variation, preserving the alternates list.
   * Finds the ingredient slot whose `ids` contains `oldId`.
   * If `newId` is already in `ids`, just updates `preferredId` and amount.
   * If not, adds `newId` to `ids` and sets it as preferred.
   * @param spec - Variation spec to update
   * @param oldId - Current ingredient ID to find the slot
   * @param newId - New ingredient ID to set as preferred
   * @param amount - Amount of the ingredient
   * @param unit - Optional measurement unit
   * @param modifiers - Optional ingredient modifiers
   * @returns Success or failure if spec or ingredient not found
   * @public
   */
  public replaceVariationIngredient(
    spec: FillingRecipeVariationSpec,
    oldId: IngredientId,
    newId: IngredientId,
    amount: Measurement,
    unit?: MeasurementUnit,
    modifiers?: Fillings.IIngredientModifiers
  ): Result<true> {
    const varIndex = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (varIndex < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    const variation = this._current.variations[varIndex];
    const ingIndex = variation.ingredients.findIndex((ing) => ing.ingredient.ids.includes(oldId));
    if (ingIndex < 0) {
      return fail(`ingredient '${oldId}' not found in variation '${spec}'`);
    }

    this._pushUndo();
    const ingredients = [...variation.ingredients];
    const existing = ingredients[ingIndex];
    const existingIds = existing.ingredient.ids;
    const ids = existingIds.includes(newId) ? [...existingIds] : [...existingIds, newId];

    ingredients[ingIndex] = {
      ...existing,
      ingredient: {
        ...existing.ingredient,
        ids,
        preferredId: newId
      },
      amount,
      unit,
      modifiers
    };

    const variations = [...this._current.variations];
    variations[varIndex] = {
      ...variation,
      ingredients,
      baseWeight: EditedFillingRecipe._calculateBaseWeight(ingredients)
    };
    this._current = { ...this._current, variations };
    return succeed(true);
  }

  /**
   * Removes an ingredient from a variation.
   * Removes the entire ingredient slot whose `ids` contains `ingredientId`.
   * Recalculates baseWeight after the change.
   * @param spec - Variation spec to update
   * @param ingredientId - The ingredient ID to find and remove
   * @returns Success or failure if spec or ingredient not found
   * @public
   */
  public removeVariationIngredient(
    spec: FillingRecipeVariationSpec,
    ingredientId: IngredientId
  ): Result<true> {
    const varIndex = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (varIndex < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    const variation = this._current.variations[varIndex];
    const ingIndex = variation.ingredients.findIndex((ing) => ing.ingredient.ids.includes(ingredientId));
    if (ingIndex < 0) {
      return fail(`ingredient '${ingredientId}' not found in variation '${spec}'`);
    }

    this._pushUndo();
    const ingredients = [...variation.ingredients];
    ingredients.splice(ingIndex, 1);

    const variations = [...this._current.variations];
    variations[varIndex] = {
      ...variation,
      ingredients,
      baseWeight: EditedFillingRecipe._calculateBaseWeight(ingredients)
    };
    this._current = { ...this._current, variations };
    return succeed(true);
  }

  /**
   * Sets or clears the procedure for a variation.
   * If `procedureId` is given, sets it as the sole preferred procedure option
   * (adding to existing options if present).
   * If `undefined`, clears procedures entirely.
   * @param spec - Variation spec to update
   * @param procedureId - Procedure ID to set, or undefined to clear
   * @returns Success or failure if spec not found
   * @public
   */
  public setVariationProcedure(
    spec: FillingRecipeVariationSpec,
    procedureId: ProcedureId | undefined
  ): Result<true> {
    const varIndex = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (varIndex < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }

    this._pushUndo();
    const variation = this._current.variations[varIndex];
    let procedures: CommonModel.IOptionsWithPreferred<Fillings.IProcedureRefEntity, ProcedureId> | undefined;

    if (procedureId !== undefined) {
      const existingOptions = variation.procedures?.options ?? [];
      const alreadyExists = existingOptions.some((o) => o.id === procedureId);
      const options = alreadyExists ? [...existingOptions] : [...existingOptions, { id: procedureId }];
      procedures = { options, preferredId: procedureId };
    }

    const variations = [...this._current.variations];
    variations[varIndex] = { ...variation, procedures };
    this._current = { ...this._current, variations };
    return succeed(true);
  }

  /**
   * Sets or clears the notes on a variation.
   * @param spec - Variation spec to update
   * @param notes - Notes array, or undefined to clear
   * @returns Success or failure if spec not found
   * @public
   */
  public setVariationNotes(
    spec: FillingRecipeVariationSpec,
    notes: ReadonlyArray<CommonModel.ICategorizedNote> | undefined
  ): Result<true> {
    const varIndex = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (varIndex < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }

    this._pushUndo();
    const variations = [...this._current.variations];
    variations[varIndex] = {
      ...variations[varIndex],
      notes: notes ? notes.map((n) => ({ ...n })) : undefined
    };
    this._current = { ...this._current, variations };
    return succeed(true);
  }

  /**
   * Scales all weight-contributing ingredients in a variation to achieve a target weight.
   * Non-weight-contributing ingredients (tsp, Tbsp, pinch, seeds, pods) remain unchanged.
   * Recalculates baseWeight after scaling.
   * @param spec - Variation spec to scale
   * @param targetWeight - Desired total weight
   * @returns Success with actual achieved weight, or failure
   * @public
   */
  public scaleVariationToTargetWeight(
    spec: FillingRecipeVariationSpec,
    targetWeight: Measurement
  ): Result<Measurement> {
    if (targetWeight <= 0) {
      return fail(`Target weight must be positive: ${targetWeight}`);
    }
    const varIndex = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (varIndex < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }

    const variation = this._current.variations[varIndex];
    const currentWeight = EditedFillingRecipe._calculateBaseWeight(variation.ingredients);
    if (currentWeight <= 0) {
      return fail('Cannot scale: no weight-contributing ingredients');
    }

    const scaleFactor = targetWeight / currentWeight;
    this._pushUndo();

    const scaledIngredients = variation.ingredients.map((ing) => {
      const unit = ing.unit ?? 'g';
      if (unit === 'g' || unit === 'mL') {
        const scaled = scaleAmount(ing.amount, unit, scaleFactor);
        const scaledAmount = scaled.isSuccess()
          ? scaled.value.value
          : ((ing.amount * scaleFactor) as Measurement);
        return { ...ing, amount: scaledAmount };
      }
      return ing;
    });

    const actualWeight = EditedFillingRecipe._calculateBaseWeight(scaledIngredients);
    const variations = [...this._current.variations];
    variations[varIndex] = {
      ...variation,
      ingredients: scaledIngredients,
      baseWeight: actualWeight
    };
    this._current = { ...this._current, variations };
    return succeed(actualWeight);
  }

  // ============================================================================
  // Variation Management
  // ============================================================================

  /**
   * Creates a new blank variation and adds it to the recipe.
   * Auto-generates a unique spec from the given date (default today) and optional name.
   * @param options - Optional date, index, and name for spec generation
   * @returns Result with the new variation's spec, or failure
   * @public
   */
  public createBlankVariation(
    options?: Helpers.IGenerateVariationSpecOptions
  ): Result<FillingRecipeVariationSpec> {
    const existingSpecs = this._current.variations.map((v) => v.variationSpec);
    return Helpers.generateFillingVariationSpec(existingSpecs, options).onSuccess((spec) => {
      const today = options?.date ?? new Date().toISOString().split('T')[0];
      const variation: Fillings.IFillingRecipeVariationEntity = {
        variationSpec: spec,
        name: options?.name?.trim() || undefined,
        createdDate: today,
        ingredients: [],
        baseWeight: 0 as Measurement
      };
      return this.addVariation(variation).onSuccess(() => succeed(spec));
    });
  }

  /**
   * Duplicates an existing variation, creating a new one with a unique spec.
   * Copies ingredients, procedures, ratings, and notes from the source.
   * @param sourceSpec - The variation spec to copy from
   * @param options - Optional date, index, and name for the new spec
   * @returns Result with the new variation's spec, or failure
   * @public
   */
  public duplicateVariation(
    sourceSpec: FillingRecipeVariationSpec,
    options?: Helpers.IGenerateVariationSpecOptions
  ): Result<FillingRecipeVariationSpec> {
    const source = this._current.variations.find((v) => v.variationSpec === sourceSpec);
    if (!source) {
      return fail(`variation '${sourceSpec}' does not exist in this recipe`);
    }
    const existingSpecs = this._current.variations.map((v) => v.variationSpec);
    return Helpers.generateFillingVariationSpec(existingSpecs, options).onSuccess((spec) => {
      const today = options?.date ?? new Date().toISOString().split('T')[0];
      const variation: Fillings.IFillingRecipeVariationEntity = {
        ...EditedFillingRecipe._deepCopyVariation(source),
        variationSpec: spec,
        name: options?.name?.trim() || undefined,
        createdDate: today
      };
      return this.addVariation(variation).onSuccess(() => succeed(spec));
    });
  }

  /**
   * Sets or clears the display name on a variation.
   * @param spec - Variation spec to update
   * @param name - New display name, or undefined to clear
   * @returns Success or failure if spec not found
   * @public
   */
  public setVariationName(spec: FillingRecipeVariationSpec, name: string | undefined): Result<void> {
    const varIndex = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (varIndex < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    this._pushUndo();
    const variations = [...this._current.variations];
    variations[varIndex] = { ...variations[varIndex], name: name?.trim() || undefined };
    this._current = { ...this._current, variations };
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
    return succeed(undefined);
  }

  // ============================================================================
  // Read-only Access
  // ============================================================================

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
   * Calculates base weight from a list of source ingredients.
   * Only includes weight-contributing units (g, mL).
   * Applies yieldFactor from modifiers (defaults to 1.0).
   */
  private static _calculateBaseWeight(
    ingredients: ReadonlyArray<Fillings.IFillingIngredientEntity>
  ): Measurement {
    const total = ingredients.reduce((sum, ing) => {
      const unit = ing.unit ?? 'g';
      const yieldFactor = ing.modifiers?.yieldFactor ?? 1.0;
      if (unit === 'g' || unit === 'mL') {
        return sum + ing.amount * yieldFactor;
      }
      return sum;
    }, 0);
    return total as Measurement;
  }

  protected _deepCopy(entity: Fillings.IFillingRecipeEntity): Fillings.IFillingRecipeEntity {
    return EditedFillingRecipe._copyEntity(entity);
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

  private static _copyEntity(entity: Fillings.IFillingRecipeEntity): Fillings.IFillingRecipeEntity {
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
