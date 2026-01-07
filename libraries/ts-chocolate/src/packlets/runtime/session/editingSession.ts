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
 * EditingSession - mutable session for editing recipe versions
 * @packageDocumentation
 */

import { captureResult, Failure, Result, Success } from '@fgv/ts-utils';

import { Grams, IngredientId, JournalId, SessionId, Converters as CommonConverters } from '../../common';
import { IJournalEntry, IJournalRecord, JournalEventType } from '../../journal';
import { IRecipeIngredient, IRecipeVersion } from '../../recipes';
import { IRuntimeRecipeVersion } from '../model';
import {
  IEditingSessionParams,
  ISaveOptions,
  ISaveResult,
  ISessionIngredient,
  ISessionState,
  SessionIngredientStatus
} from './model';
import { EditingSessionValidator, IEditingSessionValidator } from './editingSessionValidator';

// ============================================================================
// ID Generators
// ============================================================================

/**
 * Generates a SessionId in the format YYYY-MM-DD-HHMMSS-xxxxxxxx
 * @returns Result with a valid SessionId
 */
function generateSessionId(): Result<SessionId> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = Math.random().toString(16).substring(2, 10).padStart(8, '0');
  return CommonConverters.sessionId.convert(`${year}-${month}-${day}-${hours}${minutes}${seconds}-${random}`);
}

/**
 * Generates a JournalId in the format YYYY-MM-DD-HHMMSS-xxxxxxxx
 * @returns Result with a valid JournalId
 */
function generateJournalId(): Result<JournalId> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = Math.random().toString(16).substring(2, 10).padStart(8, '0');
  return CommonConverters.journalId.convert(`${year}-${month}-${day}-${hours}${minutes}${seconds}-${random}`);
}

// ============================================================================
// EditingSession Class
// ============================================================================

/**
 * A mutable editing session for modifying recipe versions.
 *
 * Tracks:
 * - Source version and scale factor
 * - Mutable working ingredient state
 * - Journal entries recording what happened
 *
 * Can produce:
 * - Journal records documenting the session
 * - New recipe versions incorporating modifications
 *
 * @public
 */
export class EditingSession implements ISessionState {
  private readonly _sessionId: SessionId;
  private readonly _sourceVersion: IRuntimeRecipeVersion;
  private readonly _enableJournal: boolean;
  private readonly _validator: EditingSessionValidator;

  private _scaleFactor: number;
  private _targetWeight: Grams;
  private readonly _ingredients: Map<IngredientId, ISessionIngredient>;
  private readonly _journalEntries: IJournalEntry[];
  private _isDirty: boolean;

  private constructor(params: IEditingSessionParams) {
    this._sessionId = generateSessionId().orThrow();
    this._sourceVersion = params.sourceVersion;
    this._enableJournal = params.enableJournal ?? true;

    // Calculate initial scale factor and target weight
    if (params.targetWeight !== undefined) {
      this._targetWeight = params.targetWeight;
      this._scaleFactor = params.targetWeight / params.sourceVersion.baseWeight;
    } else {
      this._scaleFactor = params.scaleFactor ?? 1.0;
      this._targetWeight = (params.sourceVersion.baseWeight * this._scaleFactor) as Grams;
    }

    // Initialize ingredients from source version
    this._ingredients = new Map();
    this._initializeIngredients();

    this._journalEntries = [];
    this._isDirty = false;
    this._validator = new EditingSessionValidator(this);
  }

  // ============================================================================
  // Factory Method
  // ============================================================================

  /**
   * Creates a new EditingSession
   * @param params - Session parameters
   * @returns Success with new session, or Failure with error message
   * @public
   */
  public static create(params: IEditingSessionParams): Result<EditingSession> {
    return captureResult(() => new EditingSession(params));
  }

  // ============================================================================
  // ISessionState Implementation
  // ============================================================================

  public get sessionId(): SessionId {
    return this._sessionId;
  }

  public get sourceVersion(): IRuntimeRecipeVersion {
    return this._sourceVersion;
  }

  public get scaleFactor(): number {
    return this._scaleFactor;
  }

  public get targetWeight(): Grams {
    return this._targetWeight;
  }

  public get ingredients(): ReadonlyMap<IngredientId, ISessionIngredient> {
    return this._ingredients;
  }

  public get journalEntries(): ReadonlyArray<IJournalEntry> {
    return this._journalEntries;
  }

  public get isDirty(): boolean {
    return this._isDirty;
  }

  public get isJournalingEnabled(): boolean {
    return this._enableJournal;
  }

  /**
   * A validator that accepts weakly-typed inputs (strings, numbers) and converts
   * them to strongly-typed branded types before calling the underlying session methods.
   * @public
   */
  public get validating(): IEditingSessionValidator {
    return this._validator;
  }

  // ============================================================================
  // Scale Operations
  // ============================================================================

  /**
   * Sets the scale factor and recalculates all ingredient amounts
   * @param factor - New scale factor
   * @returns Success or Failure
   * @public
   */
  public setScaleFactor(factor: number): Result<void> {
    if (factor <= 0) {
      return Failure.with('Scale factor must be positive');
    }

    const oldFactor = this._scaleFactor;
    this._scaleFactor = factor;
    this._targetWeight = (this._sourceVersion.baseWeight * factor) as Grams;

    // Recalculate all scaled amounts
    for (const [id, ingredient] of this._ingredients) {
      if (ingredient.status === 'original' || ingredient.status === 'modified') {
        const newAmount = (ingredient.originalAmount * factor) as Grams;
        this._ingredients.set(id, { ...ingredient, amount: newAmount });
      }
    }

    this._addJournalEntry('scale-adjust', {
      text: `Scale factor changed from ${oldFactor.toFixed(2)} to ${factor.toFixed(2)}`
    });
    this._isDirty = true;

    return Success.with(undefined);
  }

  /**
   * Sets the target weight and calculates the scale factor
   * @param weight - Target weight in grams
   * @returns Success or Failure
   * @public
   */
  public setTargetWeight(weight: Grams): Result<void> {
    if (weight <= 0) {
      return Failure.with('Target weight must be positive');
    }

    const factor = weight / this._sourceVersion.baseWeight;
    return this.setScaleFactor(factor);
  }

  // ============================================================================
  // Ingredient Operations
  // ============================================================================

  /**
   * Gets an ingredient by ID
   * @param id - Ingredient ID
   * @returns Success with ingredient, or Failure if not found
   * @public
   */
  public getIngredient(id: IngredientId): Result<ISessionIngredient> {
    const ingredient = this._ingredients.get(id);
    if (!ingredient) {
      return Failure.with(`Ingredient not found: ${id}`);
    }
    return Success.with(ingredient);
  }

  /**
   * Sets the amount of an ingredient
   * @param id - Ingredient ID
   * @param amount - New amount in grams
   * @returns Success or Failure
   * @public
   */
  public setIngredientAmount(id: IngredientId, amount: Grams): Result<void> {
    const ingredient = this._ingredients.get(id);
    if (!ingredient) {
      return Failure.with(`Ingredient not found: ${id}`);
    }

    if (amount < 0) {
      return Failure.with('Amount cannot be negative');
    }

    const originalAmount = ingredient.amount;
    const newStatus: SessionIngredientStatus =
      ingredient.status === 'added'
        ? 'added'
        : amount === ingredient.originalAmount
        ? 'original'
        : 'modified';

    this._ingredients.set(id, {
      ...ingredient,
      amount,
      status: newStatus
    });

    this._addJournalEntry('ingredient-modify', {
      ingredientId: id,
      originalAmount,
      newAmount: amount
    });
    this._isDirty = true;

    return Success.with(undefined);
  }

  /**
   * Adds additional amount to an ingredient
   * @param id - Ingredient ID
   * @param additional - Additional amount to add
   * @returns Success or Failure
   * @public
   */
  public addIngredientAmount(id: IngredientId, additional: Grams): Result<void> {
    const ingredient = this._ingredients.get(id);
    if (!ingredient) {
      return Failure.with(`Ingredient not found: ${id}`);
    }

    const newAmount = (ingredient.amount + additional) as Grams;
    return this.setIngredientAmount(id, newAmount);
  }

  /**
   * Adds a new ingredient to the session
   * @param id - Ingredient ID
   * @param amount - Amount in grams
   * @returns Success or Failure
   * @public
   */
  public addIngredient(id: IngredientId, amount: Grams): Result<void> {
    if (this._ingredients.has(id)) {
      return Failure.with(`Ingredient already exists: ${id}`);
    }

    if (amount < 0) {
      return Failure.with('Amount cannot be negative');
    }

    this._ingredients.set(id, {
      ingredientId: id,
      amount,
      originalAmount: 0 as Grams,
      status: 'added'
    });

    this._addJournalEntry('ingredient-add', {
      ingredientId: id,
      newAmount: amount
    });
    this._isDirty = true;

    return Success.with(undefined);
  }

  /**
   * Removes an ingredient from the session
   * @param id - Ingredient ID
   * @returns Success or Failure
   * @public
   */
  public removeIngredient(id: IngredientId): Result<void> {
    const ingredient = this._ingredients.get(id);
    if (!ingredient) {
      return Failure.with(`Ingredient not found: ${id}`);
    }

    // If it was added during this session, just delete it
    if (ingredient.status === 'added') {
      this._ingredients.delete(id);
    } else {
      // Mark as removed but keep for tracking
      this._ingredients.set(id, {
        ...ingredient,
        amount: 0 as Grams,
        status: 'removed'
      });
    }

    this._addJournalEntry('ingredient-remove', {
      ingredientId: id,
      originalAmount: ingredient.amount
    });
    this._isDirty = true;

    return Success.with(undefined);
  }

  /**
   * Substitutes one ingredient for another
   * @param originalId - Original ingredient ID
   * @param substituteId - Substitute ingredient ID
   * @param amount - Optional amount (defaults to original amount)
   * @returns Success or Failure
   * @public
   */
  public substituteIngredient(
    originalId: IngredientId,
    substituteId: IngredientId,
    amount?: Grams
  ): Result<void> {
    const original = this._ingredients.get(originalId);
    if (!original) {
      return Failure.with(`Original ingredient not found: ${originalId}`);
    }

    if (this._ingredients.has(substituteId)) {
      return Failure.with(`Substitute ingredient already exists: ${substituteId}`);
    }

    const newAmount = amount ?? original.amount;

    // Mark original as removed
    this._ingredients.set(originalId, {
      ...original,
      amount: 0 as Grams,
      status: 'removed'
    });

    // Add substitute with reference to original
    this._ingredients.set(substituteId, {
      ingredientId: substituteId,
      amount: newAmount,
      originalAmount: 0 as Grams,
      status: 'substituted',
      substitutedFor: originalId
    });

    this._addJournalEntry('ingredient-substitute', {
      ingredientId: originalId,
      substituteIngredientId: substituteId,
      originalAmount: original.amount,
      newAmount
    });
    this._isDirty = true;

    return Success.with(undefined);
  }

  /**
   * Adds a note to the journal
   * @param text - Note text
   * @public
   */
  public addNote(text: string): void {
    this._addJournalEntry('note', { text });
  }

  // ============================================================================
  // Output Methods
  // ============================================================================

  /**
   * Creates a journal record from this session
   * @param notes - Optional notes for the record
   * @returns Success with journal record, or Failure
   * @public
   */
  public toJournalRecord(notes?: string): Result<IJournalRecord> {
    const date = new Date().toISOString().split('T')[0];

    return generateJournalId().onSuccess((journalId) =>
      Success.with({
        journalId,
        recipeVersionId: this._sourceVersion.versionId,
        date,
        targetWeight: this._targetWeight,
        scaleFactor: this._scaleFactor,
        notes,
        entries: this._enableJournal ? [...this._journalEntries] : undefined
      })
    );
  }

  /**
   * Creates recipe ingredients from the current session state
   * @returns Array of recipe ingredients (collapsed, non-removed)
   * @public
   */
  public toRecipeIngredients(): IRecipeIngredient[] {
    const ingredients: IRecipeIngredient[] = [];

    for (const [, session] of this._ingredients) {
      // Skip removed ingredients
      if (session.status === 'removed') {
        continue;
      }

      // Skip zero-amount ingredients
      if (session.amount <= 0) {
        continue;
      }

      ingredients.push({
        ingredientId: session.ingredientId,
        amount: session.amount,
        notes: session.notes
      });
    }

    return ingredients;
  }

  /**
   * Creates a new recipe version from the current session state
   * @param versionSpec - Version specifier for the new version
   * @returns Success with recipe version data, or Failure
   * @public
   */
  public toRecipeVersion(versionSpec: string): Result<IRecipeVersion> {
    const ingredients = this.toRecipeIngredients();

    if (ingredients.length === 0) {
      return Failure.with('Cannot create version with no ingredients');
    }

    // Calculate base weight from ingredients
    const baseWeight = ingredients.reduce((sum, i) => sum + i.amount, 0) as Grams;

    return Success.with({
      versionSpec: versionSpec as import('../../common').RecipeVersionSpec,
      createdDate: new Date().toISOString().split('T')[0],
      ingredients,
      baseWeight
    });
  }

  /**
   * Saves the session, optionally creating journal record and/or new version
   * @param options - Save options
   * @returns Success with save result, or Failure
   * @public
   */
  public save(options: ISaveOptions): Result<ISaveResult> {
    const result: ISaveResult = {};

    if (options.createJournalRecord) {
      const journalResult = this.toJournalRecord(options.journalNotes);
      /* c8 ignore next 3 - toJournalRecord only constructs an object, cannot fail in practice */
      if (journalResult.isFailure()) {
        return journalResult as unknown as Result<ISaveResult>;
      }
      (result as { journalId: string }).journalId = journalResult.value.journalId;
      (result as { journalRecord: IJournalRecord }).journalRecord = journalResult.value;
    }

    if (options.createNewVersion) {
      if (!options.versionLabel) {
        return Failure.with('versionLabel is required when createNewVersion is true');
      }
      const versionResult = this.toRecipeVersion(options.versionLabel);
      /* c8 ignore next 3 - toRecipeVersion fails only with no ingredients, tested via toRecipeVersion */
      if (versionResult.isFailure()) {
        return versionResult as unknown as Result<ISaveResult>;
      }
      (result as { newVersionSpec: string }).newVersionSpec = versionResult.value.versionSpec;
    }

    this._isDirty = false;
    return Success.with(result);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private _initializeIngredients(): void {
    const ingredientsResult = this._sourceVersion.getIngredients();
    /* c8 ignore next 3 - defensive: getIngredients only fails on data corruption */
    if (ingredientsResult.isFailure()) {
      return;
    }

    for (const resolved of ingredientsResult.value) {
      const scaledAmount = (resolved.amount * this._scaleFactor) as Grams;
      this._ingredients.set(resolved.ingredient.id, {
        ingredientId: resolved.ingredient.id,
        amount: scaledAmount,
        originalAmount: scaledAmount,
        status: 'original',
        notes: resolved.notes
      });
    }
  }

  private _addJournalEntry(
    eventType: JournalEventType,
    details: Partial<Omit<IJournalEntry, 'timestamp' | 'eventType'>>
  ): void {
    if (!this._enableJournal) {
      return;
    }

    this._journalEntries.push({
      timestamp: new Date().toISOString(),
      eventType,
      ...details
    });
  }
}
