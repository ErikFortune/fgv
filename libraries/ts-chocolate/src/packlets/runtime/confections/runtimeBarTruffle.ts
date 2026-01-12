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
 * RuntimeBarTruffle - concrete bar truffle confection implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { ConfectionId, ProcedureId, IOptionsWithPreferred } from '../../common';
import {
  IBarTruffle,
  IBarTruffleVersion,
  IBonBonDimensions,
  IChocolateSpec,
  IFrameDimensions
} from '../../entities';
import {
  IConfectionContext,
  IResolvedChocolateSpec,
  IResolvedFillingSlot,
  IRuntimeBarTruffle,
  IResolvedConfectionProcedure,
  IRuntimeChocolateIngredient
} from '../model';
import { RuntimeConfectionBase } from './runtimeConfectionBase';

// ============================================================================
// RuntimeBarTruffle Class
// ============================================================================

/**
 * A resolved view of a bar truffle confection with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class RuntimeBarTruffle extends RuntimeConfectionBase implements IRuntimeBarTruffle {
  private readonly _barTruffle: IBarTruffle;

  // Lazy-resolved caches (undefined = not yet resolved, null = no data)
  private _resolvedEnrobingChocolate: IResolvedChocolateSpec | undefined | null;
  private _resolvedFillings: ReadonlyArray<IResolvedFillingSlot> | undefined | null;
  private _resolvedProcedures:
    | IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>
    | undefined
    | null;

  /**
   * Creates a RuntimeBarTruffle.
   * Use RuntimeConfection.create() or RuntimeBarTruffle.create() instead.
   * @internal
   */
  protected constructor(context: IConfectionContext, id: ConfectionId, confection: IBarTruffle) {
    super(context, id, confection);
    this._barTruffle = confection;
  }

  /**
   * Factory method for creating a RuntimeBarTruffle.
   * @param context - The runtime context
   * @param id - The confection ID
   * @param confection - The bar truffle data
   * @returns Success with RuntimeBarTruffle
   */
  public static create(
    context: IConfectionContext,
    id: ConfectionId,
    confection: IBarTruffle
  ): Result<RuntimeBarTruffle> {
    return Success.with(new RuntimeBarTruffle(context, id, confection));
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
  // Version Access (typed)
  // ============================================================================

  /**
   * Golden version typed as IBarTruffleVersion
   */
  public override get goldenVersion(): IBarTruffleVersion {
    return this._goldenVersion as IBarTruffleVersion;
  }

  /**
   * All versions typed as IBarTruffleVersion
   */
  public override get versions(): ReadonlyArray<IBarTruffleVersion> {
    return this._barTruffle.versions;
  }

  // ============================================================================
  // Bar Truffle-Specific Properties (from golden version)
  // ============================================================================

  /**
   * Frame dimensions for ganache slab (from golden version)
   */
  public get frameDimensions(): IFrameDimensions {
    return this.goldenVersion.frameDimensions;
  }

  /**
   * Single bonbon dimensions for cutting (from golden version)
   */
  public get singleBonBonDimensions(): IBonBonDimensions {
    return this.goldenVersion.singleBonBonDimensions;
  }

  /**
   * Resolved filling slots from the golden version (lazy-loaded)
   */
  public get fillings(): ReadonlyArray<IResolvedFillingSlot> | undefined {
    if (this._resolvedFillings === undefined) {
      this._resolvedFillings = this._resolveFillingSlots(this.goldenVersion.fillings);
    }
    /* c8 ignore next - defensive: null indicates no fillings, converted to undefined for interface */
    return this._resolvedFillings ?? undefined;
  }

  /**
   * Resolved procedures from the golden version (lazy-loaded)
   */
  public get procedures(): IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId> | undefined {
    if (this._resolvedProcedures === undefined) {
      this._resolvedProcedures = this._resolveProcedures(this.goldenVersion.procedures);
    }
    /* c8 ignore next - defensive: null indicates no procedures, converted to undefined for interface */
    return this._resolvedProcedures ?? undefined;
  }

  /**
   * Resolved enrobing chocolate specification (from golden version, optional, lazy-loaded)
   */
  public get enrobingChocolate(): IResolvedChocolateSpec | undefined {
    if (this._resolvedEnrobingChocolate === undefined) {
      const raw = this.goldenVersion.enrobingChocolate;
      this._resolvedEnrobingChocolate = raw ? this._resolveChocolateSpec(raw) : null;
    }
    return this._resolvedEnrobingChocolate ?? undefined;
  }

  // ============================================================================
  // Resolution Methods (private, lazy-loaded)
  // ============================================================================

  /**
   * Resolves a chocolate specification to ingredient objects.
   * @param spec - The raw chocolate specification
   * @returns Resolved chocolate specification with primary + alternates
   * @internal
   */
  private _resolveChocolateSpec(spec: IChocolateSpec): IResolvedChocolateSpec {
    // Determine primary chocolate ID (preferredId if set, otherwise first in list)
    /* c8 ignore next - branch: preferredId set vs not set */
    const primaryId = spec.preferredId ?? spec.ids[0];
    const primaryResult = this._context.getRuntimeIngredient(primaryId);

    // Primary chocolate must resolve successfully - throw if not
    /* c8 ignore next 3 - defensive: library validation ensures chocolate ingredients exist */
    if (primaryResult.isFailure() || !primaryResult.value.isChocolate()) {
      throw new Error(`Failed to resolve primary chocolate ${primaryId} for confection ${this._id}`);
    }

    const chocolate = primaryResult.value;

    // Resolve alternates (excluding primary)
    const alternates: IRuntimeChocolateIngredient[] = [];
    for (const id of spec.ids) {
      /* c8 ignore next 6 - defensive: skip alternates that fail to resolve or aren't chocolate */
      if (id !== primaryId) {
        const altResult = this._context.getRuntimeIngredient(id);
        if (altResult.isSuccess() && altResult.value.isChocolate()) {
          alternates.push(altResult.value);
        }
      }
    }

    return {
      chocolate,
      alternates,
      raw: spec
    };
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw bar truffle data
   */
  public get raw(): IBarTruffle {
    return this._barTruffle;
  }
}
