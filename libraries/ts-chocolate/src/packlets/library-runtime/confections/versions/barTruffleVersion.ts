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
 * BarTruffleRecipeVariation - recipe variation for bar truffle confections
 * @packageDocumentation
 */

import { Result, Success, fail, succeed } from '@fgv/ts-utils';

import { ConfectionId, Helpers } from '../../../common';
import { Confections } from '../../../entities';
import {
  IConfectionContext,
  IResolvedChocolateSpec,
  IResolvedConfectionProcedure,
  IBarTruffleRecipe,
  IBarTruffleRecipeVariation
} from '../../model';
import { ConfectionRecipeVariationBase } from './confectionVersionBase';

/**
 * A resolved view of a bar truffle recipe variation with all references resolved.
 * @public
 */
export class BarTruffleRecipeVariation
  extends ConfectionRecipeVariationBase<IBarTruffleRecipe, Confections.IBarTruffleRecipeVariationEntity>
  implements IBarTruffleRecipeVariation
{
  // Lazy-resolved caches (undefined = not yet resolved, null = no data)
  private _resolvedEnrobingChocolate: IResolvedChocolateSpec | undefined | null;

  /**
   * Creates a {@link LibraryRuntime.BarTruffleRecipeVariation | BarTruffleRecipeVariation}.
   * For internal use. Use {@link LibraryRuntime.BarTruffleRecipeVariation.create | BarTruffleRecipeVariation.create()}
   * instead.
   * @internal
   */
  protected constructor(
    context: IConfectionContext,
    confectionId: ConfectionId,
    variation: Confections.IBarTruffleRecipeVariationEntity
  ) {
    super(context, confectionId, variation);
  }

  /**
   * Factory method for creating a {@link LibraryRuntime.BarTruffleRecipeVariation | BarTruffleRecipeVariation}.
   * @param context - The runtime context
   * @param confectionId - The parent confection ID
   * @param variation - The bar truffle variation data
   * @returns Success with {@link LibraryRuntime.BarTruffleRecipeVariation | BarTruffleRecipeVariation}
   */
  public static create(
    context: IConfectionContext,
    confectionId: ConfectionId,
    variation: Confections.IBarTruffleRecipeVariationEntity
  ): Result<BarTruffleRecipeVariation> {
    return Success.with(new BarTruffleRecipeVariation(context, confectionId, variation));
  }

  /**
   * Frame dimensions for ganache slab.
   */
  public get frameDimensions(): Confections.IFrameDimensions {
    return this._entity.frameDimensions;
  }

  /**
   * Single bonbon dimensions for cutting.
   */
  public get singleBonBonDimensions(): Confections.IBonBonDimensions {
    return this._entity.singleBonBonDimensions;
  }

  /**
   * Gets resolved enrobing chocolate specification (lazy-loaded).
   * @returns Result with resolved chocolate spec (or undefined if not specified), or Failure if resolution fails
   * @public
   */
  public getEnrobingChocolate(): Result<IResolvedChocolateSpec | undefined> {
    if (this._resolvedEnrobingChocolate === undefined) {
      const spec = this._entity.enrobingChocolate;
      if (!spec) {
        this._resolvedEnrobingChocolate = null;
        return succeed(undefined);
      }

      return this._context.ingredients
        .getWithAlternates(spec)
        .withErrorFormat(
          (msg) => `confection ${this._confectionId}: failed to resolve enrobing chocolate: ${msg}`
        )
        .onSuccess((resolved) => {
          if (!resolved.primary.isChocolate()) {
            return fail(
              `confection ${this._confectionId}: primary ingredient for enrobing chocolate is not a chocolate`
            );
          }
          this._resolvedEnrobingChocolate = {
            chocolate: resolved.primary,
            alternates: resolved.alternates.filter((i) => i.isChocolate()),
            entity: spec
          };
          return succeed(this._resolvedEnrobingChocolate);
        });
    }
    return succeed(this._resolvedEnrobingChocolate ?? undefined);
  }

  /**
   * Resolved enrobing chocolate specification (lazy-loaded).
   * @throws if resolution fails - prefer getEnrobingChocolate() for proper error handling
   */
  public get enrobingChocolate(): IResolvedChocolateSpec | undefined {
    return this.getEnrobingChocolate().orThrow();
  }

  // ============================================================================
  // Convenience Getters for Preferred Selections
  // ============================================================================

  /**
   * Gets the preferred procedure, falling back to first available.
   * @public
   */
  public get preferredProcedure(): IResolvedConfectionProcedure | undefined {
    return this.procedures ? Helpers.getPreferredOrFirst(this.procedures) : undefined;
  }

  /**
   * Gets the underlying bar truffle recipe variation data entity.
   */
  public override get entity(): Confections.IBarTruffleRecipeVariationEntity {
    return this._entity;
  }
}
