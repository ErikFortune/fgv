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
 * Validator wrapper for EditingSession that accepts weakly-typed inputs
 * @packageDocumentation
 */

import { Result } from '@fgv/ts-utils';

import { Grams, IngredientId, Converters as CommonConverters } from '../../common';
import { EditingSession } from './editingSession';
import { ISessionIngredient } from './model';

// ============================================================================
// Read-Only Interface
// ============================================================================

/**
 * Read-only interface for EditingSessionValidator.
 * Provides validated access to session ingredients using weakly-typed inputs.
 * @public
 */
export interface IReadOnlyEditingSessionValidator {
  /**
   * The underlying editing session
   */
  readonly session: EditingSession;

  /**
   * Gets an ingredient by ID using a weakly-typed string
   * @param id - Ingredient ID (will be converted)
   * @returns Success with ingredient, or Failure if invalid ID or not found
   */
  getIngredient(id: string): Result<ISessionIngredient>;

  /**
   * Checks if an ingredient exists using a weakly-typed string
   * @param id - Ingredient ID (will be converted)
   * @returns true if ingredient exists, false otherwise
   */
  hasIngredient(id: string): boolean;
}

// ============================================================================
// Validator Interface
// ============================================================================

/**
 * Full interface for EditingSessionValidator.
 * Provides validated mutating operations using weakly-typed inputs.
 * @public
 */
export interface IEditingSessionValidator extends IReadOnlyEditingSessionValidator {
  /**
   * Sets the amount of an ingredient using weakly-typed inputs
   * @param id - Ingredient ID (will be converted)
   * @param amount - Amount in grams (will be converted)
   * @returns Success or Failure
   */
  setIngredientAmount(id: string, amount: number): Result<void>;

  /**
   * Adds additional amount to an ingredient using weakly-typed inputs
   * @param id - Ingredient ID (will be converted)
   * @param additional - Additional amount to add (will be converted)
   * @returns Success or Failure
   */
  addIngredientAmount(id: string, additional: number): Result<void>;

  /**
   * Adds a new ingredient using weakly-typed inputs
   * @param id - Ingredient ID (will be converted)
   * @param amount - Amount in grams (will be converted)
   * @returns Success or Failure
   */
  addIngredient(id: string, amount: number): Result<void>;

  /**
   * Removes an ingredient using a weakly-typed string
   * @param id - Ingredient ID (will be converted)
   * @returns Success or Failure
   */
  removeIngredient(id: string): Result<void>;

  /**
   * Substitutes one ingredient for another using weakly-typed inputs
   * @param originalId - Original ingredient ID (will be converted)
   * @param substituteId - Substitute ingredient ID (will be converted)
   * @param amount - Optional amount (will be converted if provided)
   * @returns Success or Failure
   */
  substituteIngredient(originalId: string, substituteId: string, amount?: number): Result<void>;

  /**
   * Sets the target weight using a weakly-typed number
   * @param weight - Target weight in grams (will be converted)
   * @returns Success or Failure
   */
  setTargetWeight(weight: number): Result<void>;

  /**
   * Gets a read-only version of this validator
   */
  toReadOnly(): IReadOnlyEditingSessionValidator;
}

// ============================================================================
// Validator Implementation
// ============================================================================

/**
 * A wrapper for EditingSession that validates and converts weakly-typed inputs
 * to strongly-typed branded types before delegating to the underlying session.
 *
 * This allows consumers to use plain strings and numbers instead of
 * IngredientId and Grams branded types while still benefiting from
 * runtime validation.
 *
 * @example
 * ```typescript
 * const session = EditingSession.create(params).orThrow();
 * const validator = session.validating;
 *
 * // Use plain strings and numbers instead of branded types
 * validator.setIngredientAmount('felchlin.maracaibo-65', 100);
 * validator.addIngredient('local.glucose-syrup', 50);
 * ```
 *
 * @public
 */
export class EditingSessionValidator implements IEditingSessionValidator {
  private readonly _session: EditingSession;

  /**
   * Creates a new EditingSessionValidator
   * @param session - The EditingSession to wrap
   */
  public constructor(session: EditingSession) {
    this._session = session;
  }

  /**
   * The underlying editing session
   */
  public get session(): EditingSession {
    return this._session;
  }

  /**
   * Gets an ingredient by ID using a weakly-typed string
   * @param id - Ingredient ID (will be converted)
   * @returns Success with ingredient, or Failure if invalid ID or not found
   */
  public getIngredient(id: string): Result<ISessionIngredient> {
    return CommonConverters.ingredientId.convert(id).onSuccess((validId: IngredientId) => {
      return this._session.getIngredient(validId);
    });
  }

  /**
   * Checks if an ingredient exists using a weakly-typed string
   * @param id - Ingredient ID (will be converted)
   * @returns true if ingredient exists, false otherwise
   */
  public hasIngredient(id: string): boolean {
    const result = CommonConverters.ingredientId.convert(id);
    if (result.isFailure()) {
      return false;
    }
    return this._session.ingredients.has(result.value);
  }

  /**
   * Sets the amount of an ingredient using weakly-typed inputs
   * @param id - Ingredient ID (will be converted)
   * @param amount - Amount in grams (will be converted)
   * @returns Success or Failure
   */
  public setIngredientAmount(id: string, amount: number): Result<void> {
    return CommonConverters.ingredientId.convert(id).onSuccess((validId: IngredientId) => {
      return CommonConverters.grams.convert(amount).onSuccess((validAmount: Grams) => {
        return this._session.setIngredientAmount(validId, validAmount);
      });
    });
  }

  /**
   * Adds additional amount to an ingredient using weakly-typed inputs
   * @param id - Ingredient ID (will be converted)
   * @param additional - Additional amount to add (will be converted)
   * @returns Success or Failure
   */
  public addIngredientAmount(id: string, additional: number): Result<void> {
    return CommonConverters.ingredientId.convert(id).onSuccess((validId: IngredientId) => {
      return CommonConverters.grams.convert(additional).onSuccess((validAmount: Grams) => {
        return this._session.addIngredientAmount(validId, validAmount);
      });
    });
  }

  /**
   * Adds a new ingredient using weakly-typed inputs
   * @param id - Ingredient ID (will be converted)
   * @param amount - Amount in grams (will be converted)
   * @returns Success or Failure
   */
  public addIngredient(id: string, amount: number): Result<void> {
    return CommonConverters.ingredientId.convert(id).onSuccess((validId: IngredientId) => {
      return CommonConverters.grams.convert(amount).onSuccess((validAmount: Grams) => {
        return this._session.addIngredient(validId, validAmount);
      });
    });
  }

  /**
   * Removes an ingredient using a weakly-typed string
   * @param id - Ingredient ID (will be converted)
   * @returns Success or Failure
   */
  public removeIngredient(id: string): Result<void> {
    return CommonConverters.ingredientId.convert(id).onSuccess((validId: IngredientId) => {
      return this._session.removeIngredient(validId);
    });
  }

  /**
   * Substitutes one ingredient for another using weakly-typed inputs
   * @param originalId - Original ingredient ID (will be converted)
   * @param substituteId - Substitute ingredient ID (will be converted)
   * @param amount - Optional amount (will be converted if provided)
   * @returns Success or Failure
   */
  public substituteIngredient(originalId: string, substituteId: string, amount?: number): Result<void> {
    return CommonConverters.ingredientId.convert(originalId).onSuccess((validOriginalId: IngredientId) => {
      return CommonConverters.ingredientId
        .convert(substituteId)
        .onSuccess((validSubstituteId: IngredientId) => {
          if (amount === undefined) {
            return this._session.substituteIngredient(validOriginalId, validSubstituteId);
          }
          return CommonConverters.grams.convert(amount).onSuccess((validAmount: Grams) => {
            return this._session.substituteIngredient(validOriginalId, validSubstituteId, validAmount);
          });
        });
    });
  }

  /**
   * Sets the target weight using a weakly-typed number
   * @param weight - Target weight in grams (will be converted)
   * @returns Success or Failure
   */
  public setTargetWeight(weight: number): Result<void> {
    return CommonConverters.grams.convert(weight).onSuccess((validWeight: Grams) => {
      return this._session.setTargetWeight(validWeight);
    });
  }

  /**
   * Gets a read-only version of this validator
   */
  public toReadOnly(): IReadOnlyEditingSessionValidator {
    return this;
  }
}
