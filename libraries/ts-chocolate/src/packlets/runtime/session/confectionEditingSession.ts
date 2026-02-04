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
 * ConfectionEditingSession factory - dispatches to type-specific session classes
 * @packageDocumentation
 */

import { Failure, Result } from '@fgv/ts-utils';

import { AnyConfection } from '../../library-runtime';
import { ISessionContext } from '../model';

import { BarTruffleEditingSession } from './barTruffleEditingSession';
import { MoldedBonBonEditingSession } from './moldedBonBonEditingSession';
import { RolledTruffleEditingSession } from './rolledTruffleEditingSession';
import { IConfectionEditingSessionParams } from './model';

// ============================================================================
// Type-Specific Session Union
// ============================================================================

/**
 * Union type of all confection editing session types.
 * Use this for type-safe handling of different session types.
 * @public
 */
export type AnyConfectionEditingSession =
  | MoldedBonBonEditingSession
  | BarTruffleEditingSession
  | RolledTruffleEditingSession;

// ============================================================================
// Factory Class
// ============================================================================

/**
 * Factory for creating type-specific confection editing sessions.
 * Dispatches to specialized session classes based on confection type.
 *
 * @public
 */
export class ConfectionEditingSession {
  /**
   * Private constructor to prevent direct instantiation.
   * Use ConfectionEditingSession.create() instead.
   * @internal
   */
  private constructor() {
    // Factory class - do not instantiate
  }

  /**
   * Creates a confection editing session for the appropriate confection type.
   * Dispatches to type-specific session classes:
   * - MoldedBonBonEditingSession for molded bonbons (frame-based yield)
   * - BarTruffleEditingSession for bar truffles (linear scaling)
   * - RolledTruffleEditingSession for rolled truffles (linear scaling)
   *
   * @param baseConfection - The source confection to edit
   * @param context - The runtime context for resource access
   * @param params - Optional session parameters (sessionId, initialYield)
   * @returns Success with type-specific session, or Failure
   * @public
   */
  public static create(
    baseConfection: AnyConfection,
    context: ISessionContext,
    params?: IConfectionEditingSessionParams
  ): Result<AnyConfectionEditingSession> {
    if (baseConfection.isMoldedBonBon()) {
      return MoldedBonBonEditingSession.create(baseConfection, context, params);
    } else if (baseConfection.isBarTruffle()) {
      return BarTruffleEditingSession.create(baseConfection, context, params);
    } else if (baseConfection.isRolledTruffle()) {
      return RolledTruffleEditingSession.create(baseConfection, context, params);
    }
    // c8 ignore next 2 - defensive coding
    // @ts-expect-error - exhaustive check
    return Failure.with(`Unknown confection type: ${baseConfection.confectionType}`);
  }
}
