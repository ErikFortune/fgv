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

import { ConfectionId } from '../../common';
import { IAdditionalChocolate, IChocolateSpec, IConfectionMolds, IMoldedBonBon } from '../../confections';
import { IConfectionContext, IRuntimeMoldedBonBon } from '../model';
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
  // Molded BonBon-Specific Properties
  // ============================================================================

  /**
   * Molds specification
   */
  public get molds(): IConfectionMolds {
    return this._moldedBonBon.molds;
  }

  /**
   * Shell chocolate specification
   */
  public get shellChocolate(): IChocolateSpec {
    return this._moldedBonBon.shellChocolate;
  }

  /**
   * Additional chocolates (seal, decoration)
   */
  public get additionalChocolates(): ReadonlyArray<IAdditionalChocolate> | undefined {
    return this._moldedBonBon.additionalChocolates;
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
