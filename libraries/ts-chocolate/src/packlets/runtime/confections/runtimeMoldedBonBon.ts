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

import { ConfectionId, IOptionsWithPreferred, MoldId, ProcedureId } from '../../common';
import { IChocolateSpec, IMoldedBonBon, IMoldedBonBonVersion } from '../../entities';
import {
  IConfectionContext,
  IResolvedAdditionalChocolate,
  IResolvedChocolateSpec,
  IResolvedConfectionMoldRef,
  IResolvedConfectionProcedure,
  IResolvedFillingSlot,
  IRuntimeChocolateIngredient,
  IRuntimeMoldedBonBon
} from '../model';
import { RuntimeConfectionBase } from './runtimeConfectionBase';

// ============================================================================
// RuntimeMoldedBonBon Class
// ============================================================================

/**
 * A resolved view of a molded bonbon confection with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class RuntimeMoldedBonBon extends RuntimeConfectionBase implements IRuntimeMoldedBonBon {
  private readonly _moldedBonBon: IMoldedBonBon;

  // Lazy-resolved caches (undefined = not yet resolved, null = no data)
  private _resolvedShellChocolate: IResolvedChocolateSpec | undefined;
  private _resolvedAdditionalChocolates: ReadonlyArray<IResolvedAdditionalChocolate> | undefined | null;
  private _resolvedMolds: IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> | undefined;
  private _resolvedFillings: ReadonlyArray<IResolvedFillingSlot> | undefined | null;
  private _resolvedProcedures:
    | IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>
    | undefined
    | null;

  /**
   * Creates a RuntimeMoldedBonBon.
   * Use RuntimeConfection.create() or RuntimeMoldedBonBon.create() instead.
   * @internal
   */
  protected constructor(context: IConfectionContext, id: ConfectionId, confection: IMoldedBonBon) {
    super(context, id, confection);
    this._moldedBonBon = confection;
  }

  /**
   * Factory method for creating a RuntimeMoldedBonBon.
   * @param context - The runtime context
   * @param id - The confection ID
   * @param confection - The molded bonbon data
   * @returns Success with RuntimeMoldedBonBon
   */
  public static create(
    context: IConfectionContext,
    id: ConfectionId,
    confection: IMoldedBonBon
  ): Result<RuntimeMoldedBonBon> {
    return Success.with(new RuntimeMoldedBonBon(context, id, confection));
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
  // Version Access (typed)
  // ============================================================================

  /**
   * Golden version typed as IMoldedBonBonVersion
   */
  public override get goldenVersion(): IMoldedBonBonVersion {
    return this._goldenVersion as IMoldedBonBonVersion;
  }

  /**
   * All versions typed as IMoldedBonBonVersion
   */
  public override get versions(): ReadonlyArray<IMoldedBonBonVersion> {
    return this._moldedBonBon.versions;
  }

  // ============================================================================
  // Molded BonBon-Specific Properties (from golden version)
  // ============================================================================

  /**
   * Resolved filling slots from the golden version (lazy-loaded)
   */
  public get fillings(): ReadonlyArray<IResolvedFillingSlot> | undefined {
    if (this._resolvedFillings === undefined) {
      this._resolvedFillings = this._resolveFillingSlots(this.goldenVersion.fillings);
    }
    return this._resolvedFillings ?? undefined;
  }

  /**
   * Resolved procedures from the golden version (lazy-loaded)
   */
  public get procedures(): IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId> | undefined {
    if (this._resolvedProcedures === undefined) {
      this._resolvedProcedures = this._resolveProcedures(this.goldenVersion.procedures);
    }
    return this._resolvedProcedures ?? undefined;
  }

  /**
   * Resolved molds with preferred selection (from golden version, lazy-loaded)
   */
  public get molds(): IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> {
    if (this._resolvedMolds === undefined) {
      this._resolvedMolds = this._resolveMoldRefs();
    }
    return this._resolvedMolds;
  }

  /**
   * Resolved shell chocolate specification (from golden version, lazy-loaded)
   */
  public get shellChocolate(): IResolvedChocolateSpec {
    if (this._resolvedShellChocolate === undefined) {
      this._resolvedShellChocolate = this._resolveChocolateSpec(this.goldenVersion.shellChocolate);
    }
    return this._resolvedShellChocolate;
  }

  /**
   * Resolved additional chocolates (from golden version, lazy-loaded)
   */
  public get additionalChocolates(): ReadonlyArray<IResolvedAdditionalChocolate> | undefined {
    if (this._resolvedAdditionalChocolates === undefined) {
      this._resolvedAdditionalChocolates = this._resolveAdditionalChocolates();
    }
    return this._resolvedAdditionalChocolates ?? undefined;
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
      if (id !== primaryId) {
        const altResult = this._context.getRuntimeIngredient(id);
        if (altResult.isSuccess() && altResult.value.isChocolate()) {
          alternates.push(altResult.value);
        }
        // Skip alternates that fail to resolve or aren't chocolate
      }
    }

    return {
      chocolate,
      alternates,
      raw: spec
    };
  }

  /**
   * Resolves mold references from the golden version.
   * @returns Resolved mold references with preferred selection
   * @internal
   */
  private _resolveMoldRefs(): IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> {
    const rawMolds = this.goldenVersion.molds;

    const resolvedOptions: IResolvedConfectionMoldRef[] = [];
    for (const ref of rawMolds.options) {
      const moldResult = this._context.getRuntimeMold(ref.id);
      if (moldResult.isSuccess()) {
        resolvedOptions.push({
          id: ref.id,
          mold: moldResult.value,
          notes: ref.notes,
          raw: ref
        });
      }
      // Skip molds that fail to resolve
    }

    return {
      options: resolvedOptions,
      preferredId: rawMolds.preferredId
    };
  }

  /**
   * Resolves additional chocolates from the golden version.
   * @returns Resolved additional chocolates, or null if none
   * @internal
   */
  private _resolveAdditionalChocolates(): ReadonlyArray<IResolvedAdditionalChocolate> | null {
    const rawAdditional = this.goldenVersion.additionalChocolates;
    if (!rawAdditional || rawAdditional.length === 0) {
      return null;
    }

    return rawAdditional.map((additional) => ({
      chocolate: this._resolveChocolateSpec(additional.chocolate),
      purpose: additional.purpose,
      raw: additional
    }));
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw molded bonbon data
   */
  public get raw(): IMoldedBonBon {
    return this._moldedBonBon;
  }
}
