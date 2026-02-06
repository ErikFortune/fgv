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
 * RolledTruffle - concrete rolled truffle confection implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { ConfectionId, Model as CommonModel, ProcedureId } from '../../common';
import { Confections } from '../../entities';
import {
  IConfectionContext,
  IResolvedChocolateSpec,
  IResolvedCoatings,
  IResolvedConfectionProcedure,
  IResolvedFillingSlot,
  IRolledTruffleRecipe,
  IRolledTruffleRecipeVariation
} from '../model';
import { ConfectionBase } from './confectionBase';
import { RolledTruffleRecipeVariation } from './versions';

// ============================================================================
// RolledTruffle Class
// ============================================================================

/**
 * A resolved view of a rolled truffle confection with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class RolledTruffleRecipe
  extends ConfectionBase<IRolledTruffleRecipeVariation, Confections.RolledTruffleRecipeEntity>
  implements IRolledTruffleRecipe
{
  private readonly _rolledTruffle: Confections.RolledTruffleRecipeEntity;

  /**
   * Creates a RolledTruffle.
   * Use Confection.create() or RolledTruffle.create() instead.
   * @internal
   */
  protected constructor(
    context: IConfectionContext,
    id: ConfectionId,
    confection: Confections.RolledTruffleRecipeEntity
  ) {
    super(context, id, confection);
    this._rolledTruffle = confection;
  }

  /**
   * Factory method for creating a RolledTruffle.
   * @param context - The runtime context
   * @param id - The confection ID
   * @param confection - The rolled truffle data
   * @returns Success with RolledTruffle
   */
  public static create(
    context: IConfectionContext,
    id: ConfectionId,
    confection: Confections.RolledTruffleRecipeEntity
  ): Result<RolledTruffleRecipe> {
    return Success.with(new RolledTruffleRecipe(context, id, confection));
  }

  // ============================================================================
  // Confection Type Override
  // ============================================================================

  /**
   * Confection type is always 'rolled-truffle' for this type
   */
  public get confectionType(): 'rolled-truffle' {
    return 'rolled-truffle';
  }

  // ============================================================================
  // Variation Access (typed)
  // ============================================================================

  /**
   * Creates a runtime variation from a data layer entity.
   * @param entity - The data layer entity
   * @returns Result with runtime variation, or Failure if creation fails
   * @internal
   */
  protected override _createVariation(
    entity: Confections.AnyConfectionRecipeVariationEntity
  ): Result<IRolledTruffleRecipeVariation> {
    return RolledTruffleRecipeVariation.create(
      this._context,
      this._id,
      entity as Confections.IRolledTruffleRecipeVariationEntity
    );
  }

  // ============================================================================
  // Rolled Truffle-Specific Properties (delegate to golden variation)
  // ============================================================================

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
   * Resolved coating specification (from golden variation, optional).
   */
  public get coatings(): IResolvedCoatings | undefined {
    return this.goldenVariation.coatings;
  }

  /**
   * Gets the underlying rolled truffle data entity
   */
  public get entity(): Confections.RolledTruffleRecipeEntity {
    return this._rolledTruffle;
  }
}
