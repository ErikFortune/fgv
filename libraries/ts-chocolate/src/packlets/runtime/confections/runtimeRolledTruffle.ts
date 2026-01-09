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

import { ConfectionId } from '../../common';
import { IChocolateSpec, ICoatings, IRolledTruffle } from '../../confections';
import { IConfectionContext, IRuntimeRolledTruffle } from '../model';
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
  // Rolled Truffle-Specific Properties
  // ============================================================================

  /**
   * Enrobing chocolate specification (optional)
   */
  public get enrobingChocolate(): IChocolateSpec | undefined {
    return this._rolledTruffle.enrobingChocolate;
  }

  /**
   * Coating specification (cocoa powder, nuts, etc.)
   */
  public get coatings(): ICoatings | undefined {
    return this._rolledTruffle.coatings;
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
