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
 * BarTruffle - concrete bar truffle confection implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { ConfectionId, Model as CommonModel, ProcedureId } from '../../common';
import { Confections } from '../../entities';
import {
  IConfectionContext,
  IResolvedChocolateSpec,
  IResolvedFillingSlot,
  IBarTruffleRecipe,
  IBarTruffleRecipeVariation,
  IResolvedConfectionProcedure
} from '../model';
import { ConfectionBase } from './confectionBase';
import { BarTruffleRecipeVariation } from './variations';

/**
 * A resolved view of a bar truffle confection recipe with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class BarTruffleRecipe
  extends ConfectionBase<IBarTruffleRecipeVariation, Confections.BarTruffleRecipeEntity>
  implements IBarTruffleRecipe
{
  /**
   * Creates a BarTruffle.
   * Use Confection.create() or BarTruffle.create() instead.
   * @internal
   */
  protected constructor(
    context: IConfectionContext,
    id: ConfectionId,
    confection: Confections.BarTruffleRecipeEntity
  ) {
    super(context, id, confection);
  }

  /**
   * Factory method for creating a BarTruffle.
   * @param context - The runtime context
   * @param id - The confection ID
   * @param confection - The bar truffle data
   * @returns Success with BarTruffle
   */
  public static create(
    context: IConfectionContext,
    id: ConfectionId,
    confection: Confections.BarTruffleRecipeEntity
  ): Result<BarTruffleRecipe> {
    return Success.with(new BarTruffleRecipe(context, id, confection));
  }

  // ============================================================================
  // Confection Type Override
  // ============================================================================

  /**
   * Confection type is always 'bar-truffle' for this type
   */
  public get confectionType(): 'bar-truffle' {
    return 'bar-truffle';
  }

  // ============================================================================
  // Variation Access (typed)
  // ============================================================================

  /**
   * Creates a runtime variation from a data layer entity
   * @param entity - The data layer entity
   * @returns Result with runtime variation, or Failure if creation fails
   * @internal
   */
  protected override _createVariation(
    entity: Confections.AnyConfectionRecipeVariationEntity
  ): Result<IBarTruffleRecipeVariation> {
    return BarTruffleRecipeVariation.create(
      this._context,
      this._id,
      entity as Confections.IBarTruffleRecipeVariationEntity
    );
  }

  // ============================================================================
  // Bar Truffle-Specific Properties (delegate to golden variation)
  // ============================================================================

  /**
   * Computed frame dimensions derived from piece count and bonbon dimensions (from golden variation).
   */
  public get frameDimensions(): Confections.IPieceDimensions {
    return this.goldenVariation.frameDimensions;
  }

  /**
   * Resolved filling slots from the golden variation.
   */
  public get fillings(): ReadonlyArray<IResolvedFillingSlot> | undefined {
    return this.goldenVariation.fillings;
  }

  /**
   * Resolved procedures from the golden variation.
   */
  public get procedures():
    | CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>
    | undefined {
    return this.goldenVariation.procedures;
  }

  /**
   * Resolved enrobing chocolate specification (from golden variation, optional).
   */
  public get enrobingChocolate(): IResolvedChocolateSpec | undefined {
    return this.goldenVariation.enrobingChocolate;
  }

  /**
   * Gets the underlying raw bar truffle data
   */
  public get entity(): Confections.BarTruffleRecipeEntity {
    return this._confection;
  }
}
