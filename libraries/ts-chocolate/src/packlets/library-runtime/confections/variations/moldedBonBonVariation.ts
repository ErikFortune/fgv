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
 * MoldedBonBonRecipeVariation - variation of some molded bon-bon recipe.
 * @packageDocumentation
 */

import { Result, Success, fail, mapResults, succeed } from '@fgv/ts-utils';

import { ConfectionId, Helpers, Model as CommonModel, MoldId } from '../../../common';
import { Confections } from '../../../entities';
import {
  IConfectionContext,
  IResolvedAdditionalChocolate,
  IResolvedChocolateSpec,
  IResolvedConfectionMoldRef,
  IResolvedConfectionProcedure,
  IMoldedBonBonRecipe,
  IMoldedBonBonRecipeVariation
} from '../../model';
import { ConfectionRecipeVariationBase } from './confectionVariationBase';

/**
 * A resolved view of a molded bonbon variation with all references resolved.
 * @public
 */
export class MoldedBonBonRecipeVariation
  extends ConfectionRecipeVariationBase<IMoldedBonBonRecipe, Confections.IMoldedBonBonRecipeVariationEntity>
  implements IMoldedBonBonRecipeVariation
{
  // Lazy-resolved caches (undefined = not yet resolved)
  private _resolvedShellChocolate: IResolvedChocolateSpec | null | undefined;
  private _resolvedAdditionalChocolates: ReadonlyArray<IResolvedAdditionalChocolate> | undefined;
  private _resolvedMolds: CommonModel.IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> | undefined;

  /**
   * Creates a MoldedBonBonRecipeVariation.
   * Use MoldedBonBonRecipeVariation.create() instead.
   * @internal
   */
  protected constructor(
    context: IConfectionContext,
    confectionId: ConfectionId,
    variation: Confections.IMoldedBonBonRecipeVariationEntity
  ) {
    super(context, confectionId, variation);
  }

  /**
   * Factory method for creating a MoldedBonBonRecipeVariation.
   * @param context - The runtime context
   * @param confectionId - The parent confection ID
   * @param variation - The molded bonbon variation data
   * @returns Success with MoldedBonBonRecipeVariation
   */
  public static create(
    context: IConfectionContext,
    confectionId: ConfectionId,
    variation: Confections.IMoldedBonBonRecipeVariationEntity
  ): Result<MoldedBonBonRecipeVariation> {
    return Success.with(new MoldedBonBonRecipeVariation(context, confectionId, variation));
  }

  /**
   * Gets resolved molds with preferred selection (lazy-loaded).
   * @returns Result with resolved molds, or Failure if resolution fails
   * @public
   */
  public getMolds(): Result<CommonModel.IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId>> {
    if (this._resolvedMolds === undefined) {
      const moldRefs = this._entity.molds;
      if (moldRefs.options.length === 0) {
        this._resolvedMolds = { options: [], preferredId: moldRefs.preferredId };
        return succeed(this._resolvedMolds);
      }
      return this._context.molds
        .getRefsWithAlternates(moldRefs)
        .withErrorFormat((msg) => `confection ${this._confectionId}: failed to resolve molds: ${msg}`)
        .onSuccess((resolved) => {
          const options: IResolvedConfectionMoldRef[] = [
            {
              id: resolved.primaryId,
              mold: resolved.primary,
              notes: resolved.primaryNotes,
              // safe: getRefsWithAlternates derives IDs from the same options array
              entity: Helpers.findById(resolved.primaryId, moldRefs.options)!
            },
            ...resolved.alternates.map((alt) => ({
              id: alt.id,
              mold: alt.item,
              notes: alt.notes,
              // safe: getRefsWithAlternates derives IDs from the same options array
              entity: Helpers.findById(alt.id, moldRefs.options)!
            }))
          ];
          this._resolvedMolds = { options, preferredId: moldRefs.preferredId };
          return succeed(this._resolvedMolds);
        });
    }
    return succeed(this._resolvedMolds);
  }

  /**
   * Resolved molds with preferred selection (lazy-loaded).
   * Returns empty options if no molds are configured.
   */
  public get molds(): CommonModel.IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> {
    return this.getMolds().orThrow();
  }

  /**
   * Gets resolved shell chocolate specification (lazy-loaded).
   * @returns Result with resolved chocolate spec, or Failure if resolution fails
   * @public
   */
  public getShellChocolate(): Result<IResolvedChocolateSpec | undefined> {
    if (this._resolvedShellChocolate === undefined) {
      const spec = this._entity.shellChocolate;
      if (spec.ids.length === 0) {
        this._resolvedShellChocolate = null;
        return succeed(undefined);
      }
      return this._context.ingredients
        .getWithAlternates(spec)
        .withErrorFormat(
          (msg) => `confection ${this._confectionId}: failed to resolve shell chocolate: ${msg}`
        )
        .onSuccess((resolved) => {
          if (!resolved.primary.isChocolate()) {
            return fail(
              `confection ${this._confectionId}: primary ingredient for shell chocolate is not a chocolate`
            );
          }
          this._resolvedShellChocolate = {
            chocolate: resolved.primary,
            alternates: resolved.alternates.filter((i) => i.isChocolate()),
            entity: spec
          };
          return succeed(this._resolvedShellChocolate);
        });
    }
    return succeed(this._resolvedShellChocolate ?? undefined);
  }

  /**
   * Resolved shell chocolate specification (lazy-loaded).
   * Returns undefined if no shell chocolate is configured.
   */
  public get shellChocolate(): IResolvedChocolateSpec | undefined {
    return this.getShellChocolate().orDefault();
  }

  /**
   * Gets resolved additional chocolates (lazy-loaded).
   * @returns Result with resolved additional chocolates (may be empty array), or Failure if resolution fails
   * @public
   */
  public getAdditionalChocolates(): Result<ReadonlyArray<IResolvedAdditionalChocolate>> {
    if (this._resolvedAdditionalChocolates === undefined) {
      const additional = this._entity.additionalChocolates ?? [];
      return mapResults(additional.map((item) => this._resolveAdditionalChocolate(item))).onSuccess(
        (chocolates) => {
          this._resolvedAdditionalChocolates = chocolates;
          return succeed(chocolates);
        }
      );
    }
    return succeed(this._resolvedAdditionalChocolates);
  }

  /**
   * Resolves a single additional chocolate item.
   * @internal
   */
  private _resolveAdditionalChocolate(
    item: Confections.IAdditionalChocolateEntity
  ): Result<IResolvedAdditionalChocolate> {
    return this._context.ingredients
      .getWithAlternates(item.chocolate)
      .withErrorFormat(
        (msg) => `confection ${this._confectionId}: failed to resolve additional chocolate: ${msg}`
      )
      .onSuccess((resolved) => {
        /* c8 ignore next 5 - defensive: library data guarantees additional chocolate IS chocolate */
        if (!resolved.primary.isChocolate()) {
          return fail(
            `confection ${this._confectionId}: primary ingredient for additional chocolate is not a chocolate`
          );
        }
        return succeed({
          chocolate: {
            chocolate: resolved.primary,
            alternates: resolved.alternates.filter((i) => i.isChocolate()),
            entity: item.chocolate
          },
          purpose: item.purpose,
          entity: item
        });
      });
  }

  /**
   * Resolved additional chocolates (lazy-loaded).
   * @throws if resolution fails - prefer getAdditionalChocolates() for proper error handling
   */
  public get additionalChocolates(): ReadonlyArray<IResolvedAdditionalChocolate> | undefined {
    const result = this.getAdditionalChocolates().orThrow();
    return Helpers.nonEmpty(result);
  }

  // ============================================================================
  // Convenience Getters for Preferred Selections
  // ============================================================================

  /**
   * Gets the preferred mold, falling back to first available.
   * @public
   */
  public get preferredMold(): IResolvedConfectionMoldRef | undefined {
    return Helpers.getPreferredOrFirst(this.molds);
  }

  /**
   * Gets the preferred procedure, falling back to first available.
   * @public
   */
  public get preferredProcedure(): IResolvedConfectionProcedure | undefined {
    return Helpers.getPreferredOrFirst(this.procedures);
  }

  /**
   * Gets the underlying molded bonbon variation entity data.
   */
  /**
   * Narrowed yield getter returning molded bonbon specific yield data.
   */
  public override get yield(): Confections.IYieldInFrames {
    return this._entity.yield;
  }

  public override get entity(): Confections.IMoldedBonBonRecipeVariationEntity {
    return this._entity;
  }
}
