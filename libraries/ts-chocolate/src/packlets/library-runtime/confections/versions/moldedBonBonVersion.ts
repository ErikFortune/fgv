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

import { Result, Success } from '@fgv/ts-utils';

import { ConfectionId, Helpers, Model as CommonModel, MoldId } from '../../../common';
import { Confections } from '../../../entities';
import {
  IConfectionContext,
  IResolvedAdditionalChocolate,
  IResolvedChocolateSpec,
  IResolvedConfectionMoldRef,
  IResolvedConfectionProcedure,
  IMoldedBonBon,
  IMoldedBonBonVersion,
  IChocolateIngredient
} from '../../model';
import { ConfectionVersionBase } from './confectionVersionBase';

// ============================================================================
// MoldedBonBonVersion Class
// ============================================================================

/**
 * A resolved view of a molded bonbon version with all references resolved.
 * @public
 */
export class MoldedBonBonVersion extends ConfectionVersionBase implements IMoldedBonBonVersion {
  private readonly _moldedBonBonVersion: Confections.IMoldedBonBonVersionEntity;

  // Lazy-resolved caches (undefined = not yet resolved)
  private _resolvedShellChocolate: IResolvedChocolateSpec | undefined;
  private _resolvedAdditionalChocolates: ReadonlyArray<IResolvedAdditionalChocolate> | undefined | null;
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

  /**
   * Parent confection narrowed to molded bonbon type.
   */
  public override get confection(): IMoldedBonBon {
    return super.confection as IMoldedBonBon;
  }

  // ============================================================================
  // Molded BonBon-Specific Properties (lazy)
  // ============================================================================

  /**
   * Resolved molds with preferred selection (lazy-loaded).
   */
  public get molds(): CommonModel.IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> {
    if (this._resolvedMolds === undefined) {
      const resolvedOptions: IResolvedConfectionMoldRef[] = [];
      for (const ref of this._moldedBonBonVersion.molds.options) {
        const moldResult = this._context.molds.get(ref.id);
        if (moldResult.isSuccess()) {
          resolvedOptions.push({
            id: ref.id,
            mold: moldResult.value,
            notes: ref.notes,
            entity: ref
          });
        }
      }
      this._resolvedMolds = {
        options: resolvedOptions,
        preferredId: this._moldedBonBonVersion.molds.preferredId
      };
    }
    return this._resolvedMolds;
  }

  /**
   * Resolved shell chocolate specification (lazy-loaded).
   */
  public get shellChocolate(): IResolvedChocolateSpec {
    if (this._resolvedShellChocolate === undefined) {
      const spec = this._moldedBonBonVersion.shellChocolate;
      const primaryId = spec.preferredId ?? spec.ids[0];
      const primaryResult = this._context.ingredients.get(primaryId);

      /* c8 ignore next 3 - defensive: library validation ensures chocolate ingredients exist */
      if (primaryResult.isFailure() || !primaryResult.value.isChocolate()) {
        throw new Error(
          `Failed to resolve primary chocolate ${primaryId} for confection ${this._confectionId}`
        );
      }

      const chocolate = primaryResult.value;
      const alternates: IChocolateIngredient[] = [];
      for (const id of spec.ids) {
        /* c8 ignore next 6 - defensive: skip alternates that fail to resolve or aren't chocolate */
        if (id !== primaryId) {
          const altResult = this._context.ingredients.get(id);
          if (altResult.isSuccess() && altResult.value.isChocolate()) {
            alternates.push(altResult.value);
          }
        }
      }

      this._resolvedShellChocolate = {
        chocolate,
        alternates,
        entity: spec
      };
    }
    return this._resolvedShellChocolate;
  }

  /**
   * Resolved additional chocolates (lazy-loaded).
   */
  public get additionalChocolates(): ReadonlyArray<IResolvedAdditionalChocolate> | undefined {
    if (this._resolvedAdditionalChocolates === undefined) {
      const additional = this._moldedBonBonVersion.additionalChocolates;
      if (!additional || additional.length === 0) {
        this._resolvedAdditionalChocolates = null;
      } else {
        this._resolvedAdditionalChocolates = additional.map((item) => {
          const spec = item.chocolate;
          const primaryId = spec.preferredId ?? spec.ids[0];
          const primaryResult = this._context.ingredients.get(primaryId);

          /* c8 ignore next 3 - defensive */
          if (primaryResult.isFailure() || !primaryResult.value.isChocolate()) {
            throw new Error(`Failed to resolve chocolate ${primaryId} for confection ${this._confectionId}`);
          }

          const chocolate = primaryResult.value;
          const alternates: IChocolateIngredient[] = [];
          for (const id of spec.ids) {
            if (id !== primaryId) {
              const altResult = this._context.ingredients.get(id);
              if (altResult.isSuccess() && altResult.value.isChocolate()) {
                alternates.push(altResult.value);
              }
            }
          }

          return {
            chocolate: { chocolate, alternates, entity: spec },
            purpose: item.purpose,
            entity: item
          };
        });
      }
    }
    return this._resolvedAdditionalChocolates ?? undefined;
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
