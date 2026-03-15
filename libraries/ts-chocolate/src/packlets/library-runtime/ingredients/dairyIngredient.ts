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
 * DairyIngredient - concrete dairy ingredient implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { IngredientId, Percentage } from '../../common';
import { IDairyIngredientEntity } from '../../entities';
import { IIngredientContext, IDairyIngredient } from '../model';
import { IngredientBase } from './ingredientBase';

// ============================================================================
// DairyIngredient Class
// ============================================================================

/**
 * A resolved view of a dairy ingredient with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class DairyIngredient extends IngredientBase implements IDairyIngredient {
  private readonly _dairyIngredient: IDairyIngredientEntity;

  /**
   * Creates a DairyIngredient.
   * Use Ingredient.create() or DairyIngredient.create() instead.
   * @internal
   */
  protected constructor(context: IIngredientContext, id: IngredientId, ingredient: IDairyIngredientEntity) {
    super(context, id, ingredient);
    this._dairyIngredient = ingredient;
  }

  /**
   * Factory method for creating a DairyIngredient.
   * @param context - The runtime context
   * @param id - The ingredient ID
   * @param ingredient - The dairy ingredient data entity
   * @returns Success with DairyIngredient
   */
  public static create(
    context: IIngredientContext,
    id: IngredientId,
    ingredient: IDairyIngredientEntity
  ): Result<DairyIngredient> {
    return Success.with(new DairyIngredient(context, id, ingredient));
  }

  // ============================================================================
  // Category Override
  // ============================================================================

  /**
   * Category is always 'dairy' for this type
   */
  public get category(): 'dairy' {
    return 'dairy';
  }

  // ============================================================================
  // Dairy-Specific Properties
  // ============================================================================

  /**
   * Fat content percentage (optional)
   */
  public get fatContent(): Percentage | undefined {
    return this._dairyIngredient.fatContent;
  }

  /**
   * Water content percentage (optional)
   */
  public get waterContent(): Percentage | undefined {
    return this._dairyIngredient.waterContent;
  }

  /**
   * Gets the underlying dairy ingredient data entity
   */
  public get entity(): IDairyIngredientEntity {
    return this._dairyIngredient;
  }
}
