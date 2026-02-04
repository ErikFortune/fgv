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
 * RuntimeChocolateIngredient - concrete chocolate ingredient implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import {
  CacaoVariety,
  ChocolateApplication,
  ChocolateType,
  DegreesMacMichael,
  FluidityStars,
  IngredientId,
  Percentage
} from '../../common';
import { Ingredients, IChocolateIngredientEntity } from '../../entities';
import { IIngredientContext, IRuntimeChocolateIngredient } from '../model';
import { RuntimeIngredientBase } from './runtimeIngredientBase';

// ============================================================================
// RuntimeChocolateIngredient Class
// ============================================================================

/**
 * A resolved view of a chocolate ingredient with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class RuntimeChocolateIngredient extends RuntimeIngredientBase implements IRuntimeChocolateIngredient {
  private readonly _chocolateIngredient: IChocolateIngredientEntity;

  /**
   * Creates a RuntimeChocolateIngredient.
   * Use RuntimeIngredient.create() or RuntimeChocolateIngredient.create() instead.
   * @internal
   */
  protected constructor(
    context: IIngredientContext,
    id: IngredientId,
    ingredient: IChocolateIngredientEntity
  ) {
    super(context, id, ingredient);
    this._chocolateIngredient = ingredient;
  }

  /**
   * Factory method for creating a RuntimeChocolateIngredient.
   * @param context - The runtime context
   * @param id - The ingredient ID
   * @param ingredient - The raw chocolate ingredient data
   * @returns Success with RuntimeChocolateIngredient
   */
  public static create(
    context: IIngredientContext,
    id: IngredientId,
    ingredient: IChocolateIngredientEntity
  ): Result<RuntimeChocolateIngredient> {
    return Success.with(new RuntimeChocolateIngredient(context, id, ingredient));
  }

  // ============================================================================
  // Category Override
  // ============================================================================

  /**
   * Category is always 'chocolate' for this type
   */
  public get category(): 'chocolate' {
    return 'chocolate';
  }

  // ============================================================================
  // Chocolate-Specific Properties
  // ============================================================================

  /**
   * Type of chocolate (dark, milk, white, etc.)
   */
  public get chocolateType(): ChocolateType {
    return this._chocolateIngredient.chocolateType;
  }

  /**
   * Cacao percentage (e.g., 70 for 70% dark)
   */
  public get cacaoPercentage(): Percentage {
    return this._chocolateIngredient.cacaoPercentage;
  }

  /**
   * Fluidity in Callebaut star ratings (optional)
   */
  public get fluidityStars(): FluidityStars | undefined {
    return this._chocolateIngredient.fluidityStars;
  }

  /**
   * Viscosity in MacMichael degrees (optional)
   */
  public get viscosityMcM(): DegreesMacMichael | undefined {
    return this._chocolateIngredient.viscosityMcM;
  }

  /**
   * Tempering temperature curve (optional)
   */
  public get temperatureCurve(): Ingredients.ITemperatureCurve | undefined {
    return this._chocolateIngredient.temperatureCurve;
  }

  /**
   * Bean varieties used in the chocolate (optional)
   */
  public get beanVarieties(): ReadonlyArray<CacaoVariety> | undefined {
    return this._chocolateIngredient.beanVarieties;
  }

  /**
   * Recommended applications for this chocolate (optional)
   */
  public get applications(): ReadonlyArray<ChocolateApplication> | undefined {
    return this._chocolateIngredient.applications;
  }

  /**
   * Origin descriptions (optional)
   */
  public get origins(): ReadonlyArray<string> | undefined {
    return this._chocolateIngredient.origins;
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw chocolate ingredient data
   */
  public get raw(): IChocolateIngredientEntity {
    return this._chocolateIngredient;
  }
}
