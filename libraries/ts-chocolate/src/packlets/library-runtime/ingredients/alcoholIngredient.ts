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
 * RuntimeAlcoholIngredient - concrete alcohol ingredient implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { IngredientId, Percentage } from '../../common';
import { IAlcoholIngredientEntity } from '../../entities';
import { IIngredientContext, IAlcoholIngredient } from '../model';
import { RuntimeIngredientBase } from './ingredientBase';

// ============================================================================
// RuntimeAlcoholIngredient Class
// ============================================================================

/**
 * A resolved view of an alcohol ingredient with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class RuntimeAlcoholIngredient extends RuntimeIngredientBase implements IAlcoholIngredient {
  private readonly _alcoholIngredient: IAlcoholIngredientEntity;

  /**
   * Creates a RuntimeAlcoholIngredient.
   * Use RuntimeIngredient.create() or RuntimeAlcoholIngredient.create() instead.
   * @internal
   */
  protected constructor(context: IIngredientContext, id: IngredientId, ingredient: IAlcoholIngredientEntity) {
    super(context, id, ingredient);
    this._alcoholIngredient = ingredient;
  }

  /**
   * Factory method for creating a RuntimeAlcoholIngredient.
   * @param context - The runtime context
   * @param id - The ingredient ID
   * @param ingredient - The raw alcohol ingredient data
   * @returns Success with RuntimeAlcoholIngredient
   */
  public static create(
    context: IIngredientContext,
    id: IngredientId,
    ingredient: IAlcoholIngredientEntity
  ): Result<RuntimeAlcoholIngredient> {
    return Success.with(new RuntimeAlcoholIngredient(context, id, ingredient));
  }

  // ============================================================================
  // Category Override
  // ============================================================================

  /**
   * Category is always 'alcohol' for this type
   */
  public get category(): 'alcohol' {
    return 'alcohol';
  }

  // ============================================================================
  // Alcohol-Specific Properties
  // ============================================================================

  /**
   * Alcohol by volume percentage (optional)
   */
  public get alcoholByVolume(): Percentage | undefined {
    return this._alcoholIngredient.alcoholByVolume;
  }

  /**
   * Flavor profile description (optional)
   */
  public get flavorProfile(): string | undefined {
    return this._alcoholIngredient.flavorProfile;
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw alcohol ingredient data
   */
  public get raw(): IAlcoholIngredientEntity {
    return this._alcoholIngredient;
  }
}
