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
 * Rolled truffle editing session with linear count-based scaling
 * @packageDocumentation
 */

import { captureResult, Result, succeed } from '@fgv/ts-utils';

import { Measurement, SlotId, ZeroMeasurement } from '../../common';
import { Confections, IProducedRolledTruffleEntity, Session } from '../../entities';
import { RolledTruffle, RolledTruffleVersion, ProducedRolledTruffle } from '../../library-runtime';
import { ISessionContext } from '../model';

import { ConfectionEditingSessionBase } from './confectionEditingSessionBase';
import { IConfectionEditingSessionParams } from './model';

// ============================================================================
// Rolled Truffle Editing Session
// ============================================================================

/**
 * Editing session for rolled truffle confections.
 * Supports linear count-based scaling with proportional filling adjustment.
 *
 * @public
 */
export class RolledTruffleEditingSession extends ConfectionEditingSessionBase<
  IProducedRolledTruffleEntity,
  RolledTruffle
> {
  /**
   * Creates a RolledTruffleEditingSession.
   * Use RolledTruffleEditingSession.create() instead.
   * @internal
   */
  private constructor(
    baseConfection: RolledTruffle,
    produced: ProducedRolledTruffle,
    context: ISessionContext,
    params?: IConfectionEditingSessionParams
  ) {
    super(baseConfection, produced, context, params);

    // Apply initial yield if provided
    if (params?.initialYield) {
      this.scaleToYield(params.initialYield).orThrow();
    }

    // Load filling sessions after initialization
    this._loadFillingSessions().orThrow();
  }

  /**
   * Factory method for creating a RolledTruffleEditingSession.
   * @param baseConfection - The source rolled truffle confection
   * @param context - The runtime context
   * @param params - Optional session parameters
   * @returns Success with RolledTruffleEditingSession, or Failure
   * @public
   */
  public static create(
    baseConfection: RolledTruffle,
    context: ISessionContext,
    params?: IConfectionEditingSessionParams
  ): Result<RolledTruffleEditingSession> {
    return ProducedRolledTruffle.fromSource(baseConfection.goldenVersion as RolledTruffleVersion).onSuccess(
      (produced) =>
        captureResult(() => new RolledTruffleEditingSession(baseConfection, produced, context, params))
    );
  }

  /**
   * Restores a RolledTruffleEditingSession from persisted state.
   * Note: Child filling sessions are persisted separately and should be accessed
   * via their persisted session IDs from IPersistedConfectionSession.childSessionIds.
   * @param baseConfection - The source rolled truffle confection
   * @param history - Serialized editing history
   * @param context - The runtime context
   * @param params - Optional session parameters
   * @returns Success with restored session, or Failure
   * @public
   */
  public static fromPersistedState(
    baseConfection: RolledTruffle,
    history: Session.ISerializedEditingHistoryEntity<IProducedRolledTruffleEntity>,
    context: ISessionContext,
    params?: IConfectionEditingSessionParams
  ): Result<RolledTruffleEditingSession> {
    return ProducedRolledTruffle.restoreFromHistory(history).onSuccess((produced) =>
      captureResult(() => new RolledTruffleEditingSession(baseConfection, produced, context, params))
    );
  }

  // ============================================================================
  // Linear Scaling
  // ============================================================================

  /**
   * Scales to new yield specification using linear count-based scaling.
   * All filling sessions scale proportionally by the count ratio.
   *
   * @param yieldSpec - The new yield specification
   * @returns Success with updated yield, or Failure
   * @public
   */
  public override scaleToYield(
    yieldSpec: Confections.AnyConfectionYield
  ): Result<Confections.IConfectionYield> {
    const currentYield = this._produced.yield;
    const scaleFactor = yieldSpec.count / currentYield.count;

    // Update produced confection yield
    return this._produced
      .scaleToYield(yieldSpec)
      .onSuccess(() => this._scaleAllFillingsByFactor(scaleFactor))
      .onSuccess(() => succeed(yieldSpec));
  }

  // ============================================================================
  // Weight Computation (Protected)
  // ============================================================================

  /**
   * Computes target weight for a specific filling slot.
   * For linear scaling, preserves the current session weight
   * (scaling is handled by scaleToYield via factor-based scaling).
   * For initial creation, finds the filling from the produced confection and uses its base weight.
   *
   * @param slotId - The slot identifier
   * @returns Success with current target weight
   * @internal
   */
  protected override _computeSlotTargetWeight(slotId: SlotId): Result<Measurement> {
    const session = this._fillingSessions.get(slotId);
    if (session) {
      return succeed(session.targetWeight);
    }

    // For initial creation, find the filling in the produced confection and use its base weight
    const fillingSlot = this._produced.fillings?.find((f) => f.slotId === slotId);
    if (!fillingSlot || fillingSlot.slotType !== 'recipe') {
      return succeed(ZeroMeasurement);
    }

    return this._context.getRuntimeFilling(fillingSlot.fillingId).onSuccess((filling) => {
      return succeed(filling.goldenVersion.entity.baseWeight);
    });
  }
}
