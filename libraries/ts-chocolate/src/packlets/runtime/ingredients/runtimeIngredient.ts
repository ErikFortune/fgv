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
 * RuntimeIngredient - static factory for creating runtime ingredients
 * @packageDocumentation
 */

import { Failure, Result } from '@fgv/ts-utils';

import { IngredientId } from '../../common';
import {
  IAlcoholIngredient,
  IChocolateIngredient,
  IDairyIngredient,
  IFatIngredient,
  Ingredient,
  ISugarIngredient
} from '../../entities';
import { IIngredientContext } from '../model';
import { RuntimeChocolateIngredient } from './runtimeChocolateIngredient';
import { RuntimeDairyIngredient } from './runtimeDairyIngredient';
import { RuntimeSugarIngredient } from './runtimeSugarIngredient';
import { RuntimeFatIngredient } from './runtimeFatIngredient';
import { RuntimeAlcoholIngredient } from './runtimeAlcoholIngredient';

// ============================================================================
// AnyRuntimeIngredient Union Type
// ============================================================================

/**
 * Union type of all concrete runtime ingredient classes.
 * Use this type when you need to work with any runtime ingredient.
 * @public
 */
export type AnyRuntimeIngredient =
  | RuntimeChocolateIngredient
  | RuntimeDairyIngredient
  | RuntimeSugarIngredient
  | RuntimeFatIngredient
  | RuntimeAlcoholIngredient;

// ============================================================================
// RuntimeIngredient Static Factory
// ============================================================================

/**
 * Static factory for creating runtime ingredients.
 * This class cannot be instantiated - use create() to get the appropriate concrete type.
 *
 * @example
 * ```typescript
 * const result = RuntimeIngredient.create(context, id, ingredient);
 * if (result.isSuccess()) {
 *   const runtimeIngredient = result.value;
 *   if (runtimeIngredient.isChocolate()) {
 *     console.log(runtimeIngredient.chocolateType);
 *   }
 * }
 * ```
 *
 * @public
 */
export abstract class RuntimeIngredient {
  // Cannot be instantiated
  /* c8 ignore next 2 - abstract class cannot be instantiated */
  private constructor() {}

  /**
   * Factory method that auto-detects ingredient type and returns appropriate concrete class.
   * @param context - The runtime context for navigation
   * @param id - The ingredient ID
   * @param ingredient - The raw ingredient data
   * @returns Success with the appropriate concrete RuntimeIngredient subclass, or Failure for unknown category
   */
  public static create(
    context: IIngredientContext,
    id: IngredientId,
    ingredient: Ingredient
  ): Result<AnyRuntimeIngredient> {
    switch (ingredient.category) {
      case 'chocolate':
        return RuntimeChocolateIngredient.create(context, id, ingredient as IChocolateIngredient);
      case 'dairy':
        return RuntimeDairyIngredient.create(context, id, ingredient as IDairyIngredient);
      case 'sugar':
        return RuntimeSugarIngredient.create(context, id, ingredient as ISugarIngredient);
      case 'fat':
        return RuntimeFatIngredient.create(context, id, ingredient as IFatIngredient);
      case 'alcohol':
        return RuntimeAlcoholIngredient.create(context, id, ingredient as IAlcoholIngredient);
      /* c8 ignore next 2 - defensive coding: Ingredient union type ensures all categories are handled */
      default:
        return Failure.with(`Unknown ingredient category: ${ingredient.category}`);
    }
  }
}
