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
 * Ingredient - static factory for creating runtime ingredients
 * @packageDocumentation
 */

import { Failure, Result } from '@fgv/ts-utils';

import { IngredientId } from '../../common';
import {
  IAlcoholIngredientEntity,
  IChocolateIngredientEntity,
  IDairyIngredientEntity,
  IFatIngredientEntity,
  IngredientEntity,
  ISugarIngredientEntity
} from '../../entities';
import { IIngredientContext } from '../model';
import { ChocolateIngredient } from './chocolateIngredient';
import { DairyIngredient } from './dairyIngredient';
import { SugarIngredient } from './sugarIngredient';
import { FatIngredient } from './fatIngredient';
import { AlcoholIngredient } from './alcoholIngredient';
import { GenericIngredient } from './genericIngredient';

/**
 * Union type of all concrete runtime ingredient classes.
 * Use this type when you need to work with any runtime ingredient.
 * @public
 */
export type AnyIngredient =
  | ChocolateIngredient
  | DairyIngredient
  | SugarIngredient
  | FatIngredient
  | AlcoholIngredient
  | GenericIngredient;

/**
 * Static factory for creating runtime ingredients.
 * This class cannot be instantiated - use create() to get the appropriate concrete type.
 *
 * @example
 * ```typescript
 * const result = Ingredient.create(context, id, ingredient);
 * if (result.isSuccess()) {
 *   const ingredient = result.value;
 *   if (ingredient.isChocolate()) {
 *     console.log(ingredient.chocolateType);
 *   }
 * }
 * ```
 *
 * @public
 */
export abstract class Ingredient {
  // Cannot be instantiated
  /* c8 ignore next 2 - abstract class cannot be instantiated */
  private constructor() {}

  /**
   * Factory method that auto-detects ingredient type and returns appropriate concrete class.
   * @param context - The runtime context for navigation
   * @param id - The ingredient ID
   * @param ingredient - The ingredient data entity
   * @returns Success with the appropriate concrete Ingredient subclass, or Failure for unknown category
   */
  public static create(
    context: IIngredientContext,
    id: IngredientId,
    ingredient: IngredientEntity
  ): Result<AnyIngredient> {
    switch (ingredient.category) {
      case 'chocolate':
        return ChocolateIngredient.create(context, id, ingredient as IChocolateIngredientEntity);
      case 'dairy':
        return DairyIngredient.create(context, id, ingredient as IDairyIngredientEntity);
      case 'sugar':
        return SugarIngredient.create(context, id, ingredient as ISugarIngredientEntity);
      case 'fat':
        return FatIngredient.create(context, id, ingredient as IFatIngredientEntity);
      case 'alcohol':
        return AlcoholIngredient.create(context, id, ingredient as IAlcoholIngredientEntity);
      case 'liquid':
      case 'flavor':
      case 'decoration':
      case 'other':
        return GenericIngredient.create(context, id, ingredient);
      /* c8 ignore next 4 - defensive coding: Ingredient union type ensures all categories are handled */
      default:
        return Failure.with(
          `Unknown ingredient category: ${(ingredient as unknown as { category: string }).category}`
        );
    }
  }
}
