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

import {
  Measurement,
  IngredientId,
  Converters as CommonConverters,
  MeasurementUnit,
  ProcedureId
} from '../../common';
import { IIngredientModifiers } from '../../entities';
import { EditingSession } from './editingSession';

// ============================================================================
// Read-Only Interface
// ============================================================================

/**
 * Read-only interface for EditingSessionValidator.
 * Provides validated access to session using weakly-typed inputs.
 * @public
 */
export interface IReadOnlyEditingSessionValidator {
  /**
   * The underlying editing session
   */
  readonly session: EditingSession;
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
   * Sets or updates an ingredient using weakly-typed inputs
   * @param id - Ingredient ID (will be converted)
   * @param amount - Amount (will be converted)
   * @param unit - Optional measurement unit
   * @param modifiers - Optional ingredient modifiers
   * @returns Success or Failure
   */
  setIngredient(
    id: string,
    amount: number,
    unit?: MeasurementUnit,
    modifiers?: IIngredientModifiers
  ): Result<void>;

  /**
   * Removes an ingredient using a weakly-typed string
   * @param id - Ingredient ID (will be converted)
   * @returns Success or Failure
   */
  removeIngredient(id: string): Result<void>;

  /**
   * Scales the filling to achieve a target weight using a weakly-typed number.
   * Weight-contributing ingredients are scaled proportionally.
   * @param targetWeight - Desired total weight (will be converted)
   * @returns Success with actual achieved weight, or Failure
   */
  scaleToTargetWeight(targetWeight: number): Result<Measurement>;

  /**
   * Sets the procedure using a weakly-typed string
   * @param id - Procedure ID (will be converted) or undefined to clear
   * @returns Success or Failure
   */
  setProcedure(id: string | undefined): Result<void>;

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
 * IngredientId and Measurement branded types while still benefiting from
 * runtime validation.
 *
 * @example
 * ```typescript
 * const session = EditingSession.create(baseRecipe).orThrow();
 * const validator = new EditingSessionValidator(session);
 *
 * // Use plain strings and numbers instead of branded types
 * validator.setIngredient('felchlin.maracaibo-65', 100);
 * validator.removeIngredient('local.glucose-syrup');
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
   * Sets or updates an ingredient using weakly-typed inputs
   * @param id - Ingredient ID (will be converted)
   * @param amount - Amount (will be converted)
   * @param unit - Optional measurement unit
   * @param modifiers - Optional ingredient modifiers
   * @returns Success or Failure
   */
  public setIngredient(
    id: string,
    amount: number,
    unit?: MeasurementUnit,
    modifiers?: IIngredientModifiers
  ): Result<void> {
    return CommonConverters.ingredientId.convert(id).onSuccess((validId: IngredientId) => {
      return CommonConverters.measurement.convert(amount).onSuccess((validAmount: Measurement) => {
        return this._session.setIngredient(validId, validAmount, unit, modifiers);
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
   * Scales the filling to achieve a target weight using a weakly-typed number.
   * @param targetWeight - Desired total weight (will be converted)
   * @returns Success with actual achieved weight, or Failure
   */
  public scaleToTargetWeight(targetWeight: number): Result<Measurement> {
    return CommonConverters.measurement.convert(targetWeight).onSuccess((validWeight: Measurement) => {
      return this._session.scaleToTargetWeight(validWeight);
    });
  }

  /**
   * Sets the procedure using a weakly-typed string
   * @param id - Procedure ID (will be converted) or undefined to clear
   * @returns Success or Failure
   */
  public setProcedure(id: string | undefined): Result<void> {
    if (id === undefined) {
      return this._session.setProcedure(undefined);
    }
    return CommonConverters.procedureId.convert(id).onSuccess((validId: ProcedureId) => {
      return this._session.setProcedure(validId);
    });
  }

  /**
   * Gets a read-only version of this validator
   */
  public toReadOnly(): IReadOnlyEditingSessionValidator {
    return this;
  }
}
