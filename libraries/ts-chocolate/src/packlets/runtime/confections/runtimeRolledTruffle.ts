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
 * RuntimeRolledTruffle - concrete rolled truffle confection implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { ConfectionId, IOptionsWithPreferred, ProcedureId } from '../../common';
import { IChocolateSpec, ICoatings, IRolledTruffle, IRolledTruffleVersion } from '../../entities';
import {
  IConfectionContext,
  IResolvedChocolateSpec,
  IResolvedCoatingOption,
  IResolvedCoatings,
  IResolvedConfectionProcedure,
  IResolvedFillingSlot,
  IRuntimeChocolateIngredient,
  IRuntimeRolledTruffle
} from '../model';
import { RuntimeConfectionBase } from './runtimeConfectionBase';

// ============================================================================
// RuntimeRolledTruffle Class
// ============================================================================

/**
 * A resolved view of a rolled truffle confection with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class RuntimeRolledTruffle extends RuntimeConfectionBase implements IRuntimeRolledTruffle {
  private readonly _rolledTruffle: IRolledTruffle;

  // Lazy-resolved caches (undefined = not yet resolved, null = no data)
  private _resolvedEnrobingChocolate: IResolvedChocolateSpec | undefined | null;
  private _resolvedCoatings: IResolvedCoatings | undefined | null;
  private _resolvedFillings: ReadonlyArray<IResolvedFillingSlot> | undefined | null;
  private _resolvedProcedures:
    | IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>
    | undefined
    | null;

  /**
   * Creates a RuntimeRolledTruffle.
   * Use RuntimeConfection.create() or RuntimeRolledTruffle.create() instead.
   * @internal
   */
  protected constructor(context: IConfectionContext, id: ConfectionId, confection: IRolledTruffle) {
    super(context, id, confection);
    this._rolledTruffle = confection;
  }

  /**
   * Factory method for creating a RuntimeRolledTruffle.
   * @param context - The runtime context
   * @param id - The confection ID
   * @param confection - The rolled truffle data
   * @returns Success with RuntimeRolledTruffle
   */
  public static create(
    context: IConfectionContext,
    id: ConfectionId,
    confection: IRolledTruffle
  ): Result<RuntimeRolledTruffle> {
    return Success.with(new RuntimeRolledTruffle(context, id, confection));
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
  // Version Access (typed)
  // ============================================================================

  /**
   * Golden version typed as IRolledTruffleVersion
   */
  public override get goldenVersion(): IRolledTruffleVersion {
    return this._goldenVersion as IRolledTruffleVersion;
  }

  /**
   * All versions typed as IRolledTruffleVersion
   */
  public override get versions(): ReadonlyArray<IRolledTruffleVersion> {
    return this._rolledTruffle.versions;
  }

  // ============================================================================
  // Rolled Truffle-Specific Properties (from golden version)
  // ============================================================================

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

  /**
   * Resolved coating specification (from golden version, optional, lazy-loaded)
   */
  public get coatings(): IResolvedCoatings | undefined {
    if (this._resolvedCoatings === undefined) {
      const raw = this.goldenVersion.coatings;
      this._resolvedCoatings = raw ? this._resolveCoatings(raw) : null;
    }
    return this._resolvedCoatings ?? undefined;
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

  /**
   * Resolves coating specifications to ingredient objects.
   * Note: ICoatings is IIdsWithPreferred<IngredientId>, so we resolve to ingredients.
   * @param coatings - The raw coatings specification
   * @returns Resolved coatings specification
   * @internal
   */
  private _resolveCoatings(coatings: ICoatings): IResolvedCoatings {
    // Resolve all coating ingredient options
    const resolvedOptions: IResolvedCoatingOption[] = [];
    for (const id of coatings.ids) {
      const ingredientResult = this._context.getRuntimeIngredient(id);
      if (ingredientResult.isSuccess()) {
        resolvedOptions.push({
          id,
          ingredient: ingredientResult.value
        });
      }
      // Skip ingredients that fail to resolve
    }

    return {
      options: resolvedOptions,
      preferredId: coatings.preferredId
    };
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw rolled truffle data
   */
  public get raw(): IRolledTruffle {
    return this._rolledTruffle;
  }
}
