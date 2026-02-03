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
 * RuntimeConfection - static factory for creating runtime confections
 * @packageDocumentation
 */

import { Failure, Result } from '@fgv/ts-utils';

import { ConfectionId } from '../../common';
import { Confections } from '../../entities';
import { IConfectionContext } from '../model';
import { RuntimeMoldedBonBon } from './runtimeMoldedBonBon';
import { RuntimeBarTruffle } from './runtimeBarTruffle';
import { RuntimeRolledTruffle } from './runtimeRolledTruffle';

// ============================================================================
// AnyRuntimeConfection Union Type
// ============================================================================

/**
 * Union type of all concrete runtime confection classes.
 * Use this type when you need to work with any runtime confection.
 * @public
 */
export type AnyRuntimeConfection = RuntimeMoldedBonBon | RuntimeBarTruffle | RuntimeRolledTruffle;

// ============================================================================
// RuntimeConfection Static Factory
// ============================================================================

/**
 * Static factory for creating runtime confections.
 * This class cannot be instantiated - use create() to get the appropriate concrete type.
 *
 * @example
 * ```typescript
 * const result = RuntimeConfection.create(context, id, confection);
 * if (result.isSuccess()) {
 *   const runtimeConfection = result.value;
 *   if (runtimeConfection.isMoldedBonBon()) {
 *     console.log(runtimeConfection.shellChocolate);
 *   }
 * }
 * ```
 *
 * @public
 */
export abstract class RuntimeConfection {
  // Cannot be instantiated
  /* c8 ignore next 2 - abstract class cannot be instantiated */
  private constructor() {}

  /**
   * Factory method that auto-detects confection type and returns appropriate concrete class.
   * @param context - The runtime context for navigation
   * @param id - The confection ID
   * @param confection - The confection data
   * @returns Success with the appropriate concrete RuntimeConfection subclass, or Failure for unknown type
   */
  public static create(
    context: IConfectionContext,
    id: ConfectionId,
    confection: Confections.ConfectionData
  ): Result<AnyRuntimeConfection> {
    switch (confection.confectionType) {
      case 'molded-bonbon':
        return RuntimeMoldedBonBon.create(context, id, confection);
      case 'bar-truffle':
        return RuntimeBarTruffle.create(context, id, confection);
      case 'rolled-truffle':
        return RuntimeRolledTruffle.create(context, id, confection);
      /* c8 ignore next 2 - defensive coding: ConfectionData union type ensures all types are handled */
      default:
        return Failure.with(
          `Unknown confection type: ${(confection as Confections.ConfectionData).confectionType}`
        );
    }
  }
}
