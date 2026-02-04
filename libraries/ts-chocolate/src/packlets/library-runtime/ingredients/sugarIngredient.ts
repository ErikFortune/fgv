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
 * RuntimeSugarIngredient - concrete sugar ingredient implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { IngredientId } from '../../common';
import { ISugarIngredientEntity } from '../../entities';
import { IIngredientContext, IRuntimeSugarIngredient } from '../model';
import { RuntimeIngredientBase } from './ingredientBase';

// ============================================================================
// RuntimeSugarIngredient Class
// ============================================================================

/**
 * A resolved view of a sugar ingredient with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class RuntimeSugarIngredient extends RuntimeIngredientBase implements IRuntimeSugarIngredient {
  private readonly _sugarIngredient: ISugarIngredientEntity;

  /**
   * Creates a RuntimeSugarIngredient.
   * Use RuntimeIngredient.create() or RuntimeSugarIngredient.create() instead.
   * @internal
   */
  protected constructor(context: IIngredientContext, id: IngredientId, ingredient: ISugarIngredientEntity) {
    super(context, id, ingredient);
    this._sugarIngredient = ingredient;
  }

  /**
   * Factory method for creating a RuntimeSugarIngredient.
   * @param context - The runtime context
   * @param id - The ingredient ID
   * @param ingredient - The raw sugar ingredient data
   * @returns Success with RuntimeSugarIngredient
   */
  public static create(
    context: IIngredientContext,
    id: IngredientId,
    ingredient: ISugarIngredientEntity
  ): Result<RuntimeSugarIngredient> {
    return Success.with(new RuntimeSugarIngredient(context, id, ingredient));
  }

  // ============================================================================
  // Category Override
  // ============================================================================

  /**
   * Category is always 'sugar' for this type
   */
  public get category(): 'sugar' {
    return 'sugar';
  }

  // ============================================================================
  // Sugar-Specific Properties
  // ============================================================================

  /**
   * Hydration number (water molecules per sugar molecule) (optional)
   */
  public get hydrationNumber(): number | undefined {
    return this._sugarIngredient.hydrationNumber;
  }

  /**
   * Sweetness potency relative to sucrose (1.0 = sucrose) (optional)
   */
  public get sweetnessPotency(): number | undefined {
    return this._sugarIngredient.sweetnessPotency;
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw sugar ingredient data
   */
  public get raw(): ISugarIngredientEntity {
    return this._sugarIngredient;
  }
}
