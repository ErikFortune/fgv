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
 * AlcoholIngredient - concrete alcohol ingredient implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { IngredientId, Percentage } from '../../common';
import { IAlcoholIngredientEntity } from '../../entities';
import { IIngredientContext, IAlcoholIngredient } from '../model';
import { IngredientBase } from './ingredientBase';

// ============================================================================
// AlcoholIngredient Class
// ============================================================================

/**
 * A resolved view of an alcohol ingredient with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class AlcoholIngredient extends IngredientBase implements IAlcoholIngredient {
  private readonly _alcoholIngredient: IAlcoholIngredientEntity;

  /**
   * Creates a AlcoholIngredient.
   * Use Ingredient.create() or AlcoholIngredient.create() instead.
   * @internal
   */
  protected constructor(context: IIngredientContext, id: IngredientId, ingredient: IAlcoholIngredientEntity) {
    super(context, id, ingredient);
    this._alcoholIngredient = ingredient;
  }

  /**
   * Factory method for creating a AlcoholIngredient.
   * @param context - The runtime context
   * @param id - The ingredient ID
   * @param ingredient - The raw alcohol ingredient data entity
   * @returns Success with AlcoholIngredient
   */
  public static create(
    context: IIngredientContext,
    id: IngredientId,
    ingredient: IAlcoholIngredientEntity
  ): Result<AlcoholIngredient> {
    return Success.with(new AlcoholIngredient(context, id, ingredient));
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

  /**
   * Gets the underlying alcohol ingredient data entity
   */
  public get entity(): IAlcoholIngredientEntity {
    return this._alcoholIngredient;
  }
}
