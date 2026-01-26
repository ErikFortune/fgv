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
 * RuntimeRolledTruffleVersion - runtime version for rolled truffle confections
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { ConfectionId } from '../../../common';
import { IRolledTruffleVersion } from '../../../entities';
import {
  IConfectionContext,
  IResolvedChocolateSpec,
  IResolvedCoatings,
  IRuntimeRolledTruffle,
  IRuntimeRolledTruffleVersion
} from '../../model';
import { RuntimeConfectionVersionBase } from './runtimeConfectionVersionBase';

// ============================================================================
// RuntimeRolledTruffleVersion Class
// ============================================================================

/**
 * A resolved view of a rolled truffle version with all references resolved.
 * @public
 */
export class RuntimeRolledTruffleVersion
  extends RuntimeConfectionVersionBase
  implements IRuntimeRolledTruffleVersion
{
  private readonly _rolledTruffleVersion: IRolledTruffleVersion;

  // Lazy-resolved caches (undefined = not yet resolved, null = no data)
  private _resolvedEnrobingChocolate: IResolvedChocolateSpec | undefined | null;
  private _resolvedCoatings: IResolvedCoatings | undefined | null;

  /**
   * Creates a RuntimeRolledTruffleVersion.
   * Use RuntimeRolledTruffleVersion.create() instead.
   * @internal
   */
  protected constructor(
    context: IConfectionContext,
    confectionId: ConfectionId,
    version: IRolledTruffleVersion
  ) {
    super(context, confectionId, version);
    this._rolledTruffleVersion = version;
  }

  /**
   * Factory method for creating a RuntimeRolledTruffleVersion.
   * @param context - The runtime context
   * @param confectionId - The parent confection ID
   * @param version - The rolled truffle version data
   * @returns Success with RuntimeRolledTruffleVersion
   */
  public static create(
    context: IConfectionContext,
    confectionId: ConfectionId,
    version: IRolledTruffleVersion
  ): Result<RuntimeRolledTruffleVersion> {
    return Success.with(new RuntimeRolledTruffleVersion(context, confectionId, version));
  }

  // ============================================================================
  // Parent Navigation (narrowed type)
  // ============================================================================

  /**
   * Parent confection narrowed to rolled truffle type.
   */
  public override get confection(): IRuntimeRolledTruffle {
    return super.confection as IRuntimeRolledTruffle;
  }

  // ============================================================================
  // Rolled Truffle-Specific Properties (lazy)
  // ============================================================================

  /**
   * Resolved enrobing chocolate specification (lazy-loaded).
   */
  public get enrobingChocolate(): IResolvedChocolateSpec | undefined {
    if (this._resolvedEnrobingChocolate === undefined) {
      const raw = this._rolledTruffleVersion.enrobingChocolate;
      this._resolvedEnrobingChocolate = raw
        ? this._context.resolveChocolateSpec(raw, this._confectionId)
        : null;
    }
    return this._resolvedEnrobingChocolate ?? undefined;
  }

  /**
   * Resolved coatings specification (lazy-loaded).
   */
  public get coatings(): IResolvedCoatings | undefined {
    if (this._resolvedCoatings === undefined) {
      const raw = this._rolledTruffleVersion.coatings;
      this._resolvedCoatings = raw ? this._context.resolveCoatings(raw) : null;
    }
    return this._resolvedCoatings ?? undefined;
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw rolled truffle version data.
   */
  public override get raw(): IRolledTruffleVersion {
    return this._rolledTruffleVersion;
  }
}
