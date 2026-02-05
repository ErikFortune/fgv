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
 * MoldedBonBonVersion - runtime version for molded bonbon confections
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
  IMoldedBonBon,
  IMoldedBonBonVersion
} from '../../model';
import { ConfectionVersionBase } from './confectionVersionBase';

// ============================================================================
// MoldedBonBonVersion Class
// ============================================================================

/**
 * A resolved view of a molded bonbon version with all references resolved.
 * @public
 */
export class MoldedBonBonVersion
  extends ConfectionVersionBase<IMoldedBonBon, Confections.IMoldedBonBonVersionEntity>
  implements IMoldedBonBonVersion
{
  private readonly _moldedBonBonVersion: Confections.IMoldedBonBonVersionEntity;

  // Lazy-resolved caches (undefined = not yet resolved)
  private _resolvedShellChocolate: IResolvedChocolateSpec | undefined;
  private _resolvedAdditionalChocolates: ReadonlyArray<IResolvedAdditionalChocolate> | undefined;
  private _resolvedMolds: CommonModel.IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> | undefined;

  /**
   * Creates a MoldedBonBonVersion.
   * Use MoldedBonBonVersion.create() instead.
   * @internal
   */
  protected constructor(
    context: IConfectionContext,
    confectionId: ConfectionId,
    version: Confections.IMoldedBonBonVersionEntity
  ) {
    super(context, confectionId, version);
    this._moldedBonBonVersion = version;
  }

  /**
   * Factory method for creating a MoldedBonBonVersion.
   * @param context - The runtime context
   * @param confectionId - The parent confection ID
   * @param version - The molded bonbon version data
   * @returns Success with MoldedBonBonVersion
   */
  public static create(
    context: IConfectionContext,
    confectionId: ConfectionId,
    version: Confections.IMoldedBonBonVersionEntity
  ): Result<MoldedBonBonVersion> {
    return Success.with(new MoldedBonBonVersion(context, confectionId, version));
  }

  // ============================================================================
  // Parent Navigation (narrowed type)
  // ============================================================================

  // ============================================================================
  // Molded BonBon-Specific Properties (lazy)
  // ============================================================================

  /**
   * Gets resolved molds with preferred selection (lazy-loaded).
   * @returns Result with resolved molds, or Failure if resolution fails
   * @public
   */
  public getMolds(): Result<CommonModel.IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId>> {
    if (this._resolvedMolds === undefined) {
      const moldRefs = this._moldedBonBonVersion.molds;
      return this._context.molds
        .getRefsWithAlternates(moldRefs)
        .withErrorFormat((msg) => `confection ${this._confectionId}: failed to resolve molds: ${msg}`)
        .onSuccess((resolved) => {
          const options: IResolvedConfectionMoldRef[] = [
            {
              id: resolved.primaryId,
              mold: resolved.primary,
              notes: resolved.primaryNotes,
              entity: moldRefs.options.find((r) => r.id === resolved.primaryId)!
            },
            ...resolved.alternates.map((alt) => ({
              id: alt.id,
              mold: alt.item,
              notes: alt.notes,
              entity: moldRefs.options.find((r) => r.id === alt.id)!
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
   * @throws if resolution fails - prefer getMolds() for proper error handling
   */
  public get molds(): CommonModel.IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> {
    return this.getMolds().orThrow();
  }

  /**
   * Gets resolved shell chocolate specification (lazy-loaded).
   * @returns Result with resolved chocolate spec, or Failure if resolution fails
   * @public
   */
  public getShellChocolate(): Result<IResolvedChocolateSpec> {
    if (this._resolvedShellChocolate === undefined) {
      const spec = this._moldedBonBonVersion.shellChocolate;
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
    return succeed(this._resolvedShellChocolate);
  }

  /**
   * Resolved shell chocolate specification (lazy-loaded).
   * @throws if resolution fails - prefer getShellChocolate() for proper error handling
   */
  public get shellChocolate(): IResolvedChocolateSpec {
    return this.getShellChocolate().orThrow();
  }

  /**
   * Gets resolved additional chocolates (lazy-loaded).
   * @returns Result with resolved additional chocolates (may be empty array), or Failure if resolution fails
   * @public
   */
  public getAdditionalChocolates(): Result<ReadonlyArray<IResolvedAdditionalChocolate>> {
    if (this._resolvedAdditionalChocolates === undefined) {
      const additional = this._moldedBonBonVersion.additionalChocolates ?? [];
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
    return result.length > 0 ? result : undefined;
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
    return this.procedures ? Helpers.getPreferredOrFirst(this.procedures) : undefined;
  }

  /**
   * Gets the underlying molded bonbon version entity data.
   */
  public override get entity(): Confections.IMoldedBonBonVersionEntity {
    return this._moldedBonBonVersion;
  }
}
