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

import { ConfectionId } from '../../common';
import {
  IBarTruffle,
  IBarTruffleVersion,
  IBonBonDimensions,
  IChocolateSpec,
  IFrameDimensions
} from '../../confections';
import { IConfectionContext, IRuntimeBarTruffle } from '../model';
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
   * Enrobing chocolate specification (from golden version, optional)
   */
  public get enrobingChocolate(): IChocolateSpec | undefined {
    return this.goldenVersion.enrobingChocolate;
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
