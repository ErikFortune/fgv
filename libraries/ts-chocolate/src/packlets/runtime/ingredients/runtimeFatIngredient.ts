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
 * RuntimeFatIngredient - concrete fat ingredient implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { Celsius, IngredientId } from '../../common';
import { IFatIngredient } from '../../ingredients';
import { IIngredientContext, IRuntimeFatIngredient } from '../model';
import { RuntimeIngredientBase } from './runtimeIngredientBase';

// ============================================================================
// RuntimeFatIngredient Class
// ============================================================================

/**
 * A resolved view of a fat ingredient with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class RuntimeFatIngredient extends RuntimeIngredientBase implements IRuntimeFatIngredient {
  private readonly _fatIngredient: IFatIngredient;

  /**
   * Creates a RuntimeFatIngredient.
   * Use RuntimeIngredient.create() or RuntimeFatIngredient.create() instead.
   * @internal
   */
  protected constructor(context: IIngredientContext, id: IngredientId, ingredient: IFatIngredient) {
    super(context, id, ingredient);
    this._fatIngredient = ingredient;
  }

  /**
   * Factory method for creating a RuntimeFatIngredient.
   * @param context - The runtime context
   * @param id - The ingredient ID
   * @param ingredient - The raw fat ingredient data
   * @returns Success with RuntimeFatIngredient
   */
  public static create(
    context: IIngredientContext,
    id: IngredientId,
    ingredient: IFatIngredient
  ): Result<RuntimeFatIngredient> {
    return Success.with(new RuntimeFatIngredient(context, id, ingredient));
  }

  // ============================================================================
  // Category Override
  // ============================================================================

  /**
   * Category is always 'fat' for this type
   */
  public get category(): 'fat' {
    return 'fat';
  }

  // ============================================================================
  // Fat-Specific Properties
  // ============================================================================

  /**
   * Melting point in Celsius (optional)
   */
  public get meltingPoint(): Celsius | undefined {
    return this._fatIngredient.meltingPoint;
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw fat ingredient data
   */
  public get raw(): IFatIngredient {
    return this._fatIngredient;
  }
}
