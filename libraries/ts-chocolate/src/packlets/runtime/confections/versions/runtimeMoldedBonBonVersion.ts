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
 * RuntimeMoldedBonBonVersion - runtime version for molded bonbon confections
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { ConfectionId, IOptionsWithPreferred, MoldId } from '../../../common';
import { IMoldedBonBonVersion } from '../../../entities';
import {
  IConfectionContext,
  IResolvedAdditionalChocolate,
  IResolvedChocolateSpec,
  IResolvedConfectionMoldRef,
  IRuntimeMoldedBonBon,
  IRuntimeMoldedBonBonVersion
} from '../../model';
import { RuntimeConfectionVersionBase } from './runtimeConfectionVersionBase';

// ============================================================================
// RuntimeMoldedBonBonVersion Class
// ============================================================================

/**
 * A resolved view of a molded bonbon version with all references resolved.
 * @public
 */
export class RuntimeMoldedBonBonVersion
  extends RuntimeConfectionVersionBase
  implements IRuntimeMoldedBonBonVersion
{
  private readonly _moldedBonBonVersion: IMoldedBonBonVersion;

  // Lazy-resolved caches (undefined = not yet resolved)
  private _resolvedShellChocolate: IResolvedChocolateSpec | undefined;
  private _resolvedAdditionalChocolates: ReadonlyArray<IResolvedAdditionalChocolate> | undefined | null;
  private _resolvedMolds: IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> | undefined;

  /**
   * Creates a RuntimeMoldedBonBonVersion.
   * Use RuntimeMoldedBonBonVersion.create() instead.
   * @internal
   */
  protected constructor(
    context: IConfectionContext,
    confectionId: ConfectionId,
    version: IMoldedBonBonVersion
  ) {
    super(context, confectionId, version);
    this._moldedBonBonVersion = version;
  }

  /**
   * Factory method for creating a RuntimeMoldedBonBonVersion.
   * @param context - The runtime context
   * @param confectionId - The parent confection ID
   * @param version - The molded bonbon version data
   * @returns Success with RuntimeMoldedBonBonVersion
   */
  public static create(
    context: IConfectionContext,
    confectionId: ConfectionId,
    version: IMoldedBonBonVersion
  ): Result<RuntimeMoldedBonBonVersion> {
    return Success.with(new RuntimeMoldedBonBonVersion(context, confectionId, version));
  }

  // ============================================================================
  // Parent Navigation (narrowed type)
  // ============================================================================

  /**
   * Parent confection narrowed to molded bonbon type.
   */
  public override get confection(): IRuntimeMoldedBonBon {
    return super.confection as IRuntimeMoldedBonBon;
  }

  // ============================================================================
  // Molded BonBon-Specific Properties (lazy)
  // ============================================================================

  /**
   * Resolved molds with preferred selection (lazy-loaded).
   */
  public get molds(): IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> {
    if (this._resolvedMolds === undefined) {
      this._resolvedMolds = this._context.resolveMoldRefs(this._moldedBonBonVersion.molds);
    }
    return this._resolvedMolds;
  }

  /**
   * Resolved shell chocolate specification (lazy-loaded).
   */
  public get shellChocolate(): IResolvedChocolateSpec {
    if (this._resolvedShellChocolate === undefined) {
      this._resolvedShellChocolate = this._context.resolveChocolateSpec(
        this._moldedBonBonVersion.shellChocolate,
        this._confectionId
      );
    }
    return this._resolvedShellChocolate;
  }

  /**
   * Resolved additional chocolates (lazy-loaded).
   */
  public get additionalChocolates(): ReadonlyArray<IResolvedAdditionalChocolate> | undefined {
    if (this._resolvedAdditionalChocolates === undefined) {
      this._resolvedAdditionalChocolates =
        this._context.resolveAdditionalChocolates(
          this._moldedBonBonVersion.additionalChocolates,
          this._confectionId
        ) ?? null;
    }
    return this._resolvedAdditionalChocolates ?? undefined;
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw molded bonbon version data.
   */
  public override get raw(): IMoldedBonBonVersion {
    return this._moldedBonBonVersion;
  }
}
