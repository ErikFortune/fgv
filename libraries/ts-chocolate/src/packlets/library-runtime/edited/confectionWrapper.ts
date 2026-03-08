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
 * EditedConfectionRecipe - mutable wrapper for editing recipe-level confection entity fields with undo/redo.
 * Variation-level editing (fillings, procedures, scaling) is handled by ConfectionEditingSession.
 * @packageDocumentation
 */

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';

import { Helpers, Measurement, Model as CommonModel } from '../../common';
import { Confections, Decorations, Fillings, Session } from '../../entities';
import { EditableWrapper } from '../editableWrapper';

import type {
  ConfectionName,
  ConfectionRecipeVariationSpec,
  ConfectionType,
  DecorationId,
  MoldId,
  ProcedureId
} from '../../common';

// ============================================================================
// Change Detection Interface
// ============================================================================

/**
 * Structure describing what changed between two confection recipe entities at the recipe level.
 * @public
 */
export interface IConfectionRecipeChanges {
  /** True if name changed */
  readonly nameChanged: boolean;
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

// ============================================================================
// EditedConfectionRecipe Class
// ============================================================================

/**
 * Mutable wrapper for AnyConfectionRecipeEntity with undo/redo support.
 * Manages recipe-level fields only (name, description, tags, urls, goldenVariationSpec).
 * Variation-level editing (fillings, procedures, scaling) is handled by ConfectionEditingSession.
 * After a ConfectionEditingSession save produces a variationEntity, use replaceVariation() or addVariation()
 * to integrate it back into this wrapper.
 * @public
 */
export class EditedConfectionRecipe extends EditableWrapper<Confections.AnyConfectionRecipeEntity> {
  /**
   * Creates an EditedConfectionRecipe.
   * Use static factory methods instead of calling this directly.
   * @internal
   */
  private constructor(initial: Confections.AnyConfectionRecipeEntity) {
    super(initial);
  }

  /**
   * Factory method for creating an EditedConfectionRecipe from an existing entity.
   * @param initial - The initial confection recipe entity state
   * @returns Success with EditedConfectionRecipe
   * @public
   */
  public static create(initial: Confections.AnyConfectionRecipeEntity): Result<EditedConfectionRecipe> {
    return captureResult(
      () => new EditedConfectionRecipe(EditedConfectionRecipe._copyEntity(initial))
    ).onSuccess((e) => e._setInitialSnapshot());
  }

  /**
   * Factory method for restoring an EditedConfectionRecipe from serialized history.
   * Restores the complete editing state including undo/redo stacks.
   * @param history - Serialized editing history
   * @returns Result containing EditedConfectionRecipe or error
   * @public
   */
  public static restoreFromHistory(
    history: Session.ISerializedEditingHistoryEntity<Confections.AnyConfectionRecipeEntity>
  ): Result<EditedConfectionRecipe> {
    return captureResult(() => new EditedConfectionRecipe(history.current))
      .onSuccess((e) => e._restoreHistory(history))
      .onSuccess((i) => i._setInitialSnapshot(history.original));
  }

  // ============================================================================
  // Editing Methods — Recipe-Level Fields
  // ============================================================================

  /**
   * Sets the confection recipe name.
   * @param name - New display name
   * @returns Success
   * @public
   */
  public setName(name: ConfectionName): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, name };
    return succeed(undefined);
  }

  /**
   * Sets the confection recipe description.
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
  public setGoldenVariationSpec(spec: ConfectionRecipeVariationSpec): Result<void> {
    if (!this._current.variations.some((v) => v.variationSpec === spec)) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    this._pushUndo();
    this._current = { ...this._current, goldenVariationSpec: spec };
    return succeed(undefined);
  }

  // ============================================================================
  // Variation Management
  // ============================================================================

  /**
   * Adds a new variation entity.
   * @param variation - New variation entity data
   * @returns Success or failure if spec already exists
   * @public
   */
  public addVariation(variation: Confections.AnyConfectionRecipeVariationEntity): Result<void> {
    if (this._current.variations.some((v) => v.variationSpec === variation.variationSpec)) {
      return fail(`variation '${variation.variationSpec}' already exists in this recipe`);
    }
    this._pushUndo();
    const variations = [
      ...this._current.variations,
      EditedConfectionRecipe._deepCopyVariation(variation)
    ] as Confections.AnyConfectionRecipeVariationEntity[];
    this._current = { ...this._current, variations } as Confections.AnyConfectionRecipeEntity;
    return succeed(undefined);
  }

  /**
   * Replaces a variation's entity data (called after ConfectionEditingSession save).
   * @param spec - Variation spec to replace
   * @param variation - New variation entity data
   * @returns Success or failure if spec not found
   * @public
   */
  public replaceVariation(
    spec: ConfectionRecipeVariationSpec,
    variation: Confections.AnyConfectionRecipeVariationEntity
  ): Result<void> {
    const index = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (index < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    this._pushUndo();
    const variations = [...this._current.variations] as Confections.AnyConfectionRecipeVariationEntity[];
    variations[index] = EditedConfectionRecipe._deepCopyVariation(variation);
    this._current = { ...this._current, variations } as Confections.AnyConfectionRecipeEntity;
    return succeed(undefined);
  }

  /**
   * Removes a variation from the recipe.
   * Cannot remove the last variation or the golden variation.
   * @param spec - Variation spec to remove
   * @returns Success or failure
   * @public
   */
  public removeVariation(spec: ConfectionRecipeVariationSpec): Result<void> {
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
    const variations = [...this._current.variations] as Confections.AnyConfectionRecipeVariationEntity[];
    variations.splice(index, 1);
    this._current = { ...this._current, variations } as Confections.AnyConfectionRecipeEntity;
    return succeed(undefined);
  }

  /**
   * Sets or clears the display name on a variation.
   * @param spec - Variation spec to update
   * @param name - New display name, or undefined to clear
   * @returns Success or failure if spec not found
   * @public
   */
  public setVariationName(spec: ConfectionRecipeVariationSpec, name: string | undefined): Result<void> {
    const varIndex = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (varIndex < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    this._pushUndo();
    const variations = [...this._current.variations] as Confections.AnyConfectionRecipeVariationEntity[];
    variations[varIndex] = { ...variations[varIndex], name: name?.trim() || undefined };
    this._current = { ...this._current, variations } as Confections.AnyConfectionRecipeEntity;
    return succeed(undefined);
  }

  /**
   * Creates a new blank variation and adds it to the recipe.
   * Type-specific required fields are copied from the golden variation.
   * Auto-generates a unique spec from the given date (default today) and optional name.
   * @param options - Optional date, index, and name for spec generation
   * @returns Result with the new variation's spec, or failure
   * @public
   */
  public createBlankVariation(
    options?: Helpers.IGenerateVariationSpecOptions
  ): Result<ConfectionRecipeVariationSpec> {
    const existingSpecs = this._current.variations.map((v) => v.variationSpec);
    return Helpers.generateConfectionVariationSpec(existingSpecs, options).onSuccess((spec) => {
      const today = options?.date ?? new Date().toISOString().split('T')[0];
      const golden = this._current.variations.find(
        (v) => v.variationSpec === this._current.goldenVariationSpec
      );
      const blankVariation = EditedConfectionRecipe._createBlankVariation(spec, today, options?.name, golden);
      return this.addVariation(blankVariation).onSuccess(() => succeed(spec));
    });
  }

  /**
   * Duplicates an existing variation, creating a new one with a unique spec.
   * Copies all fields from the source variation.
   * @param sourceSpec - The variation spec to copy from
   * @param options - Optional date, index, and name for the new spec
   * @returns Result with the new variation's spec, or failure
   * @public
   */
  public duplicateVariation(
    sourceSpec: ConfectionRecipeVariationSpec,
    options?: Helpers.IGenerateVariationSpecOptions
  ): Result<ConfectionRecipeVariationSpec> {
    const source = this._current.variations.find((v) => v.variationSpec === sourceSpec);
    if (!source) {
      return fail(`variation '${sourceSpec}' does not exist in this recipe`);
    }
    const existingSpecs = this._current.variations.map((v) => v.variationSpec);
    return Helpers.generateConfectionVariationSpec(existingSpecs, options).onSuccess((spec) => {
      const today = options?.date ?? new Date().toISOString().split('T')[0];
      const variation: Confections.AnyConfectionRecipeVariationEntity = {
        ...EditedConfectionRecipe._deepCopyVariation(source),
        variationSpec: spec,
        name: options?.name?.trim() || undefined,
        createdDate: today
      } as Confections.AnyConfectionRecipeVariationEntity;
      return this.addVariation(variation).onSuccess(() => succeed(spec));
    });
  }

  // ============================================================================
  // Editing Methods — Variation-Level Fields
  // ============================================================================

  /**
   * Sets the yield specification on a variation.
   * @param spec - Variation spec to update
   * @param yieldSpec - New yield specification
   * @returns Success or failure if spec not found
   * @public
   */
  public setVariationYield(
    spec: ConfectionRecipeVariationSpec,
    yieldSpec: Confections.ConfectionYield
  ): Result<void> {
    const index = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (index < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    this._pushUndo();
    const variations = [...this._current.variations] as Confections.AnyConfectionRecipeVariationEntity[];
    variations[index] = {
      ...variations[index],
      yield: yieldSpec
    } as Confections.AnyConfectionRecipeVariationEntity;
    this._current = { ...this._current, variations } as Confections.AnyConfectionRecipeEntity;
    return succeed(undefined);
  }

  /**
   * Sets the filling slots on a variation.
   * @param spec - Variation spec to update
   * @param fillings - New filling slots array, or undefined to clear
   * @returns Success or failure if spec not found
   * @public
   */
  public setVariationFillings(
    spec: ConfectionRecipeVariationSpec,
    fillings: ReadonlyArray<Confections.IFillingSlotEntity> | undefined
  ): Result<void> {
    const index = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (index < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    this._pushUndo();
    const variations = [...this._current.variations] as Confections.AnyConfectionRecipeVariationEntity[];
    variations[index] = { ...variations[index], fillings: fillings ? [...fillings] : undefined };
    this._current = { ...this._current, variations } as Confections.AnyConfectionRecipeEntity;
    return succeed(undefined);
  }

  /**
   * Sets the molds specification on a molded bon-bon variation.
   * @param spec - Variation spec to update
   * @param molds - New molds entity with options and preferred selection
   * @returns Success or failure if spec not found or not a molded bon-bon
   * @public
   */
  public setVariationMolds(
    spec: ConfectionRecipeVariationSpec,
    molds: CommonModel.IOptionsWithPreferred<Confections.IConfectionMoldRef, MoldId>
  ): Result<void> {
    const index = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (index < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    const variation = this._current.variations[index];
    if (!Confections.isMoldedBonBonRecipeVariationEntity(variation)) {
      return fail(`variation '${spec}' is not a molded bon-bon variation`);
    }
    this._pushUndo();
    const variations = [...this._current.variations] as Confections.AnyConfectionRecipeVariationEntity[];
    variations[index] = {
      ...variation,
      molds: { options: [...molds.options], preferredId: molds.preferredId }
    };
    this._current = { ...this._current, variations } as Confections.AnyConfectionRecipeEntity;
    return succeed(undefined);
  }

  /**
   * Sets the shell chocolate specification on a molded bon-bon variation.
   * @param spec - Variation spec to update
   * @param shellChocolate - New shell chocolate spec (ids + preferredId)
   * @returns Success or failure if spec not found or not a molded bon-bon
   * @public
   */
  public setVariationShellChocolate(
    spec: ConfectionRecipeVariationSpec,
    shellChocolate: Confections.IChocolateSpec
  ): Result<void> {
    const index = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (index < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    const variation = this._current.variations[index];
    if (!Confections.isMoldedBonBonRecipeVariationEntity(variation)) {
      return fail(`variation '${spec}' is not a molded bon-bon variation`);
    }
    this._pushUndo();
    const variations = [...this._current.variations] as Confections.AnyConfectionRecipeVariationEntity[];
    variations[index] = {
      ...variation,
      shellChocolate: { ids: [...shellChocolate.ids], preferredId: shellChocolate.preferredId }
    };
    this._current = { ...this._current, variations } as Confections.AnyConfectionRecipeEntity;
    return succeed(undefined);
  }

  /**
   * Sets the additional chocolates (seal, decoration) on a molded bon-bon variation.
   * @param spec - Variation spec to update
   * @param additionalChocolates - New additional chocolates array, or undefined to clear
   * @returns Success or failure if spec not found or not a molded bon-bon
   * @public
   */
  public setVariationAdditionalChocolates(
    spec: ConfectionRecipeVariationSpec,
    additionalChocolates: ReadonlyArray<Confections.IAdditionalChocolateEntity> | undefined
  ): Result<void> {
    const index = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (index < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    const variation = this._current.variations[index];
    if (!Confections.isMoldedBonBonRecipeVariationEntity(variation)) {
      return fail(`variation '${spec}' is not a molded bon-bon variation`);
    }
    this._pushUndo();
    const variations = [...this._current.variations] as Confections.AnyConfectionRecipeVariationEntity[];
    variations[index] = {
      ...variation,
      additionalChocolates: additionalChocolates
        ? additionalChocolates.map((ac) => ({
            ...ac,
            chocolate: { ...ac.chocolate, ids: [...ac.chocolate.ids] }
          }))
        : undefined
    };
    this._current = { ...this._current, variations } as Confections.AnyConfectionRecipeEntity;
    return succeed(undefined);
  }

  /**
   * Sets the decorations on a variation.
   * @param spec - Variation spec to update
   * @param decorations - New decorations spec, or undefined to clear
   * @returns Success or failure if spec not found
   * @public
   */
  public setVariationDecorations(
    spec: ConfectionRecipeVariationSpec,
    decorations: CommonModel.IOptionsWithPreferred<Decorations.IDecorationRefEntity, DecorationId> | undefined
  ): Result<void> {
    const index = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (index < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    this._pushUndo();
    const variations = [...this._current.variations] as Confections.AnyConfectionRecipeVariationEntity[];
    variations[index] = { ...variations[index], decorations };
    this._current = { ...this._current, variations } as Confections.AnyConfectionRecipeEntity;
    return succeed(undefined);
  }

  /**
   * Sets the coatings specification on a rolled truffle variation.
   * @param spec - Variation spec to update
   * @param coatings - New coatings entity, or undefined to clear
   * @returns Success or failure if spec not found or not a rolled truffle
   * @public
   */
  public setVariationCoatings(
    spec: ConfectionRecipeVariationSpec,
    coatings: Confections.ICoatingsEntity | undefined
  ): Result<void> {
    const index = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (index < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    const variation = this._current.variations[index];
    if (!Confections.isRolledTruffleRecipeVariationEntity(variation)) {
      return fail(`variation '${spec}' is not a rolled truffle variation`);
    }
    this._pushUndo();
    const variations = [...this._current.variations] as Confections.AnyConfectionRecipeVariationEntity[];
    variations[index] = {
      ...variation,
      coatings: coatings ? { ...coatings, ids: [...coatings.ids] } : undefined
    };
    this._current = { ...this._current, variations } as Confections.AnyConfectionRecipeEntity;
    return succeed(undefined);
  }

  /**
   * Sets the enrobing chocolate specification on a rolled truffle or bar truffle variation.
   * @param spec - Variation spec to update
   * @param enrobingChocolate - New enrobing chocolate spec, or undefined to clear
   * @returns Success or failure if spec not found or not an enrobable type
   * @public
   */
  public setVariationEnrobingChocolate(
    spec: ConfectionRecipeVariationSpec,
    enrobingChocolate: Confections.IChocolateSpec | undefined
  ): Result<void> {
    const index = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (index < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    const variation = this._current.variations[index];
    if (
      !Confections.isRolledTruffleRecipeVariationEntity(variation) &&
      !Confections.isBarTruffleRecipeVariationEntity(variation)
    ) {
      return fail(`variation '${spec}' does not support enrobing chocolate`);
    }
    this._pushUndo();
    const variations = [...this._current.variations] as Confections.AnyConfectionRecipeVariationEntity[];
    variations[index] = {
      ...variation,
      enrobingChocolate: enrobingChocolate
        ? { ...enrobingChocolate, ids: [...enrobingChocolate.ids] }
        : undefined
    };
    this._current = { ...this._current, variations } as Confections.AnyConfectionRecipeEntity;
    return succeed(undefined);
  }

  /**
   * Sets the procedures on a variation.
   * @param spec - Variation spec to update
   * @param procedures - New procedures spec, or undefined to clear
   * @returns Success or failure if spec not found
   * @public
   */
  public setVariationProcedures(
    spec: ConfectionRecipeVariationSpec,
    procedures: CommonModel.IOptionsWithPreferred<Fillings.IProcedureRefEntity, ProcedureId> | undefined
  ): Result<void> {
    const index = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (index < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    this._pushUndo();
    const variations = [...this._current.variations] as Confections.AnyConfectionRecipeVariationEntity[];
    variations[index] = { ...variations[index], procedures };
    this._current = { ...this._current, variations } as Confections.AnyConfectionRecipeEntity;
    return succeed(undefined);
  }

  /**
   * Sets the notes on a variation.
   * @param spec - Variation spec to update
   * @param notes - New notes array, or undefined to clear
   * @returns Success or failure if spec not found
   * @public
   */
  public setVariationNotes(
    spec: ConfectionRecipeVariationSpec,
    notes: ReadonlyArray<CommonModel.ICategorizedNote> | undefined
  ): Result<void> {
    const index = this._current.variations.findIndex((v) => v.variationSpec === spec);
    if (index < 0) {
      return fail(`variation '${spec}' does not exist in this recipe`);
    }
    this._pushUndo();
    const variations = [...this._current.variations] as Confections.AnyConfectionRecipeVariationEntity[];
    variations[index] = {
      ...variations[index],
      notes: notes ? notes.map((n) => ({ ...n })) : undefined
    };
    this._current = { ...this._current, variations } as Confections.AnyConfectionRecipeEntity;
    return succeed(undefined);
  }

  // ============================================================================
  // Read-only Access
  // ============================================================================

  /**
   * Gets the confection recipe name.
   * @public
   */
  public get name(): ConfectionName {
    return this._current.name;
  }

  /**
   * Gets the confection type.
   * @public
   */
  public get confectionType(): ConfectionType {
    return this._current.confectionType;
  }

  /**
   * Gets the golden variation spec.
   * @public
   */
  public get goldenVariationSpec(): ConfectionRecipeVariationSpec {
    return this._current.goldenVariationSpec;
  }

  /**
   * Gets the variations array.
   * @public
   */
  public get variations(): ReadonlyArray<Confections.AnyConfectionRecipeVariationEntity> {
    return this._current.variations;
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  /**
   * Checks if current state differs from original.
   * @param original - Original confection recipe entity to compare against
   * @returns True if changes were detected
   * @public
   */
  public hasChanges(original: Confections.AnyConfectionRecipeEntity): boolean {
    return this.getChanges(original).hasChanges;
  }

  /**
   * Gets detailed changes between current state and original.
   * @param original - Original confection recipe entity to compare against
   * @returns Structure describing what changed
   * @public
   */
  public getChanges(original: Confections.AnyConfectionRecipeEntity): IConfectionRecipeChanges {
    const nameChanged = this._current.name !== original.name;
    const descriptionChanged = this._current.description !== original.description;
    const tagsChanged = !EditedConfectionRecipe._stringArrayEqual(this._current.tags, original.tags);
    const urlsChanged = JSON.stringify(this._current.urls) !== JSON.stringify(original.urls);
    const goldenVariationSpecChanged = this._current.goldenVariationSpec !== original.goldenVariationSpec;
    const variationsChanged =
      JSON.stringify(this._current.variations) !== JSON.stringify(original.variations);

    return {
      nameChanged,
      descriptionChanged,
      tagsChanged,
      urlsChanged,
      goldenVariationSpecChanged,
      variationsChanged,
      hasChanges:
        nameChanged ||
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

  protected _deepCopy(entity: Confections.AnyConfectionRecipeEntity): Confections.AnyConfectionRecipeEntity {
    return EditedConfectionRecipe._copyEntity(entity);
  }

  /**
   * Creates a blank variation with type-specific required fields copied from the golden variation.
   */
  private static _createBlankVariation(
    spec: ConfectionRecipeVariationSpec,
    createdDate: string,
    name: string | undefined,
    golden: Confections.AnyConfectionRecipeVariationEntity | undefined
  ): Confections.AnyConfectionRecipeVariationEntity {
    const base: Confections.IConfectionRecipeVariationEntityBase = {
      variationSpec: spec,
      name: name?.trim() || undefined,
      createdDate,
      yield: { numFrames: 1 }
    };

    if (golden !== undefined && Confections.isMoldedBonBonRecipeVariationEntity(golden)) {
      const moldedBase: Confections.IMoldedBonBonRecipeVariationEntity = {
        ...base,
        yield: { ...golden.yield },
        molds: {
          options: golden.molds.options.map((m) => ({ ...m, notes: m.notes?.map((n) => ({ ...n })) })),
          preferredId: golden.molds.preferredId
        },
        shellChocolate: {
          ids: [...golden.shellChocolate.ids],
          preferredId: golden.shellChocolate.preferredId
        }
      };
      return moldedBase;
    }

    if (golden !== undefined && Confections.isBarTruffleRecipeVariationEntity(golden)) {
      const barBase: Confections.IBarTruffleRecipeVariationEntity = {
        ...base,
        yield: { ...golden.yield, dimensions: { ...golden.yield.dimensions } }
      };
      return barBase;
    }

    const rolledBase: Confections.IRolledTruffleRecipeVariationEntity = {
      ...base,
      yield:
        golden !== undefined && Confections.isRolledTruffleRecipeVariationEntity(golden)
          ? { ...golden.yield }
          : { numPieces: 0, weightPerPiece: 0 as Measurement }
    };
    return rolledBase;
  }

  /**
   * Creates a deep copy of the base variation fields shared by all subtypes.
   */
  private static _deepCopyVariationBase(
    variation: Confections.IConfectionRecipeVariationEntityBase
  ): Confections.IConfectionRecipeVariationEntityBase {
    return {
      variationSpec: variation.variationSpec,
      name: variation.name,
      createdDate: variation.createdDate,
      yield: { ...variation.yield },
      fillings: variation.fillings?.map((slot) => ({
        ...slot,
        filling: {
          options: slot.filling.options.map((opt) => ({
            ...opt,
            notes: opt.notes?.map((n) => ({ ...n }))
          })),
          preferredId: slot.filling.preferredId
        }
      })),
      decorations: variation.decorations
        ? {
            options: variation.decorations.options.map((d) => ({
              ...d,
              notes: d.notes?.map((n) => ({ ...n }))
            })),
            preferredId: variation.decorations.preferredId
          }
        : undefined,
      procedures: variation.procedures
        ? {
            options: variation.procedures.options.map((p) => ({
              ...p,
              notes: p.notes?.map((n) => ({ ...n }))
            })),
            preferredId: variation.procedures.preferredId
          }
        : undefined,
      notes: variation.notes?.map((n) => ({ ...n })),
      additionalTags: variation.additionalTags ? [...variation.additionalTags] : undefined,
      additionalUrls: variation.additionalUrls?.map((u) => ({ ...u }))
    };
  }

  /**
   * Creates a deep copy of a molded bonbon variation entity.
   */
  private static _deepCopyMoldedBonBonVariation(
    variation: Confections.IMoldedBonBonRecipeVariationEntity
  ): Confections.IMoldedBonBonRecipeVariationEntity {
    return {
      ...EditedConfectionRecipe._deepCopyVariationBase(variation),
      yield: { ...variation.yield },
      molds: {
        options: variation.molds.options.map((m) => ({
          ...m,
          notes: m.notes?.map((n) => ({ ...n }))
        })),
        preferredId: variation.molds.preferredId
      },
      shellChocolate: {
        ids: [...variation.shellChocolate.ids],
        preferredId: variation.shellChocolate.preferredId
      },
      additionalChocolates: variation.additionalChocolates?.map((ac) => ({
        ...ac,
        chocolate: { ids: [...ac.chocolate.ids], preferredId: ac.chocolate.preferredId }
      }))
    };
  }

  /**
   * Creates a deep copy of a bar truffle variation entity.
   */
  private static _deepCopyBarTruffleVariation(
    variation: Confections.IBarTruffleRecipeVariationEntity
  ): Confections.IBarTruffleRecipeVariationEntity {
    return {
      ...EditedConfectionRecipe._deepCopyVariationBase(variation),
      yield: { ...variation.yield, dimensions: { ...variation.yield.dimensions } },
      enrobingChocolate: variation.enrobingChocolate
        ? { ids: [...variation.enrobingChocolate.ids], preferredId: variation.enrobingChocolate.preferredId }
        : undefined
    };
  }

  /**
   * Creates a deep copy of a rolled truffle variation entity.
   */
  private static _deepCopyRolledTruffleVariation(
    variation: Confections.IRolledTruffleRecipeVariationEntity
  ): Confections.IRolledTruffleRecipeVariationEntity {
    return {
      ...EditedConfectionRecipe._deepCopyVariationBase(variation),
      yield: { ...variation.yield },
      enrobingChocolate: variation.enrobingChocolate
        ? { ids: [...variation.enrobingChocolate.ids], preferredId: variation.enrobingChocolate.preferredId }
        : undefined,
      coatings: variation.coatings
        ? { ids: [...variation.coatings.ids], preferredId: variation.coatings.preferredId }
        : undefined
    };
  }

  /**
   * Creates a deep copy of any confection variation entity, dispatching by type.
   */
  private static _deepCopyVariation(
    variation: Confections.AnyConfectionRecipeVariationEntity
  ): Confections.AnyConfectionRecipeVariationEntity {
    if (Confections.isMoldedBonBonRecipeVariationEntity(variation)) {
      return EditedConfectionRecipe._deepCopyMoldedBonBonVariation(variation);
    }
    if (Confections.isBarTruffleRecipeVariationEntity(variation)) {
      return EditedConfectionRecipe._deepCopyBarTruffleVariation(variation);
    }
    return EditedConfectionRecipe._deepCopyRolledTruffleVariation(variation);
  }

  private static _copyEntity(
    entity: Confections.AnyConfectionRecipeEntity
  ): Confections.AnyConfectionRecipeEntity {
    return {
      ...entity,
      variations: entity.variations.map((v) =>
        EditedConfectionRecipe._deepCopyVariation(v)
      ) as Confections.AnyConfectionRecipeEntity['variations'],
      tags: entity.tags ? [...entity.tags] : undefined,
      urls: entity.urls ? entity.urls.map((u) => ({ ...u })) : undefined,
      derivedFrom: entity.derivedFrom
        ? {
            ...entity.derivedFrom,
            notes: entity.derivedFrom.notes ? entity.derivedFrom.notes.map((n) => ({ ...n })) : undefined
          }
        : undefined
    } as Confections.AnyConfectionRecipeEntity;
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
