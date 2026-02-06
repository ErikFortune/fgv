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
 * RuntimeMoldedBonBon - concrete molded bonbon confection implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { ConfectionId, Model as CommonModel, MoldId, ProcedureId } from '../../common';
import { Confections } from '../../entities';
import {
  IConfectionContext,
  IResolvedAdditionalChocolate,
  IResolvedChocolateSpec,
  IResolvedConfectionMoldRef,
  IResolvedConfectionProcedure,
  IResolvedFillingSlot,
  IMoldedBonBonRecipe,
  IMoldedBonBonRecipeVariation
} from '../model';
import { ConfectionBase } from './confectionBase';
import { MoldedBonBonRecipeVariation } from './versions';

// ============================================================================
// RuntimeMoldedBonBon Class
// ============================================================================

/**
 * A resolved view of a molded bonbon confection with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class MoldedBonBonRecipe
  extends ConfectionBase<IMoldedBonBonRecipeVariation, Confections.MoldedBonBonRecipeEntity>
  implements IMoldedBonBonRecipe
{
  private readonly _moldedBonBon: Confections.MoldedBonBonRecipeEntity;

  /**
   * Creates a MoldedBonBon.
   * Use Confection.create() or MoldedBonBon.create() instead.
   * @internal
   */
  protected constructor(
    context: IConfectionContext,
    id: ConfectionId,
    confection: Confections.MoldedBonBonRecipeEntity
  ) {
    super(context, id, confection);
    this._moldedBonBon = confection;
  }

  /**
   * Factory method for creating a MoldedBonBon.
   * @param context - The runtime context
   * @param id - The confection ID
   * @param confection - The molded bonbon data
   * @returns Success with MoldedBonBon
   */
  public static create(
    context: IConfectionContext,
    id: ConfectionId,
    confection: Confections.MoldedBonBonRecipeEntity
  ): Result<MoldedBonBonRecipe> {
    return Success.with(new MoldedBonBonRecipe(context, id, confection));
  }

  // ============================================================================
  // Confection Type Override
  // ============================================================================

  /**
   * Confection type is always 'molded-bonbon' for this type
   */
  public get confectionType(): 'molded-bonbon' {
    return 'molded-bonbon';
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
  ): Result<IMoldedBonBonRecipeVariation> {
    return MoldedBonBonRecipeVariation.create(
      this._context,
      this._id,
      entity as Confections.IMoldedBonBonRecipeVariationEntity
    );
  }

  // ============================================================================
  // Molded BonBon-Specific Properties (delegate to golden variation)
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
   * Resolved molds with preferred selection (from golden variation).
   */
  public get molds(): CommonModel.IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> {
    return this.goldenVariation.molds;
  }

  /**
   * Resolved shell chocolate specification (from golden variation).
   */
  public get shellChocolate(): IResolvedChocolateSpec {
    return this.goldenVariation.shellChocolate;
  }

  /**
   * Resolved additional chocolates (from golden variation).
   */
  public get additionalChocolates(): ReadonlyArray<IResolvedAdditionalChocolate> | undefined {
    return this.goldenVariation.additionalChocolates;
  }

  /**
   * Gets the underlying molded bonbon data entity
   */
  public get entity(): Confections.MoldedBonBonRecipeEntity {
    return this._moldedBonBon;
  }
}
