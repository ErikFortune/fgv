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
 * RuntimeBarTruffleVersion - runtime version for bar truffle confections
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { ConfectionId, Helpers } from '../../../common';
import { Confections } from '../../../entities';
import {
  IConfectionContext,
  IResolvedChocolateSpec,
  IResolvedConfectionProcedure,
  IBarTruffle,
  IBarTruffleVersion
} from '../../model';
import { RuntimeConfectionVersionBase } from './confectionVersionBase';

// ============================================================================
// RuntimeBarTruffleVersion Class
// ============================================================================

/**
 * A resolved view of a bar truffle version with all references resolved.
 * @public
 */
export class RuntimeBarTruffleVersion extends RuntimeConfectionVersionBase implements IBarTruffleVersion {
  private readonly _barTruffleVersion: Confections.IBarTruffleVersionEntity;

  // Lazy-resolved caches (undefined = not yet resolved, null = no data)
  private _resolvedEnrobingChocolate: IResolvedChocolateSpec | undefined | null;

  /**
   * Creates a RuntimeBarTruffleVersion.
   * Use RuntimeBarTruffleVersion.create() instead.
   * @internal
   */
  protected constructor(
    context: IConfectionContext,
    confectionId: ConfectionId,
    version: Confections.IBarTruffleVersionEntity
  ) {
    super(context, confectionId, version);
    this._barTruffleVersion = version;
  }

  /**
   * Factory method for creating a RuntimeBarTruffleVersion.
   * @param context - The runtime context
   * @param confectionId - The parent confection ID
   * @param version - The bar truffle version data
   * @returns Success with RuntimeBarTruffleVersion
   */
  public static create(
    context: IConfectionContext,
    confectionId: ConfectionId,
    version: Confections.IBarTruffleVersionEntity
  ): Result<RuntimeBarTruffleVersion> {
    return Success.with(new RuntimeBarTruffleVersion(context, confectionId, version));
  }

  // ============================================================================
  // Parent Navigation (narrowed type)
  // ============================================================================

  /**
   * Parent confection narrowed to bar truffle type.
   */
  public override get confection(): IBarTruffle {
    return super.confection as IBarTruffle;
  }

  // ============================================================================
  // Bar Truffle-Specific Properties
  // ============================================================================

  /**
   * Frame dimensions for ganache slab.
   */
  public get frameDimensions(): Confections.IFrameDimensions {
    return this._barTruffleVersion.frameDimensions;
  }

  /**
   * Single bonbon dimensions for cutting.
   */
  public get singleBonBonDimensions(): Confections.IBonBonDimensions {
    return this._barTruffleVersion.singleBonBonDimensions;
  }

  /**
   * Resolved enrobing chocolate specification (lazy-loaded).
   */
  public get enrobingChocolate(): IResolvedChocolateSpec | undefined {
    if (this._resolvedEnrobingChocolate === undefined) {
      const raw = this._barTruffleVersion.enrobingChocolate;
      this._resolvedEnrobingChocolate = raw
        ? this._context.resolveChocolateSpec(raw, this._confectionId)
        : null;
    }
    return this._resolvedEnrobingChocolate ?? undefined;
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

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw bar truffle version data.
   */
  public override get raw(): Confections.IBarTruffleVersionEntity {
    return this._barTruffleVersion;
  }
}
