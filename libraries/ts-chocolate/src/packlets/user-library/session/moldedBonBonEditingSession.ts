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
 * Molded bonbon editing session with frame-based yield
 * @packageDocumentation
 */

import { captureResult, fail, MessageAggregator, Result, succeed } from '@fgv/ts-utils';

import { Measurement, MoldId, SlotId, ZeroMeasurement } from '../../common';
import { Confections, IProducedMoldedBonBonEntity, Session } from '../../entities';
import { MoldedBonBonRecipe, IMold, ProducedMoldedBonBon } from '../../library-runtime';

import { ConfectionEditingSessionBase } from './confectionEditingSessionBase';
import { IConfectionEditingSessionParams, IMoldChangeAnalysis } from './model';
import { ISessionContext } from '../model';

// ============================================================================
// Molded Bonbon Editing Session
// ============================================================================

/**
 * Editing session for molded bonbon confections.
 * Supports frame-based yield specification and mold change workflow.
 *
 * @public
 */
export class MoldedBonBonEditingSession extends ConfectionEditingSessionBase<
  IProducedMoldedBonBonEntity,
  MoldedBonBonRecipe
> {
  private _currentMold: IMold;
  private _pendingMoldChange?: IMoldChangeAnalysis;

  /**
   * Creates a MoldedBonBonEditingSession.
   * Use MoldedBonBonEditingSession.create() instead.
   * @internal
   */
  private constructor(
    baseConfection: MoldedBonBonRecipe,
    produced: ProducedMoldedBonBon,
    context: ISessionContext,
    params?: IConfectionEditingSessionParams
  ) {
    super(baseConfection, produced, context, params);

    // Load current mold
    this._currentMold = this._loadCurrentMold().orThrow();

    // Apply initial yield if provided
    if (params?.initialYield) {
      this.scaleToYield(params.initialYield).orThrow();
    }

    // Load filling sessions after mold is initialized
    this._loadFillingSessions().orThrow();
  }

  /**
   * Factory method for creating a MoldedBonBonEditingSession.
   * @param baseConfection - The source molded bonbon confection
   * @param context - The runtime context
   * @param params - Optional session parameters
   * @returns Success with MoldedBonBonEditingSession, or Failure
   * @public
   */
  public static create(
    baseConfection: MoldedBonBonRecipe,
    context: ISessionContext,
    params?: IConfectionEditingSessionParams
  ): Result<MoldedBonBonEditingSession> {
    return ProducedMoldedBonBon.fromSource(baseConfection.goldenVariation).onSuccess((produced) =>
      captureResult(() => new MoldedBonBonEditingSession(baseConfection, produced, context, params))
    );
  }

  /**
   * Restores a MoldedBonBonEditingSession from persisted state.
   * Note: Child filling sessions are persisted separately and should be accessed
   * via their persisted session IDs from IPersistedConfectionSession.childSessionIds.
   * @param baseConfection - The source molded bonbon confection
   * @param history - Serialized editing history
   * @param context - The runtime context
   * @param params - Optional session parameters
   * @returns Success with restored session, or Failure
   * @public
   */
  public static fromPersistedState(
    baseConfection: MoldedBonBonRecipe,
    history: Session.ISerializedEditingHistoryEntity<IProducedMoldedBonBonEntity>,
    context: ISessionContext,
    params?: IConfectionEditingSessionParams
  ): Result<MoldedBonBonEditingSession> {
    return ProducedMoldedBonBon.restoreFromHistory(history).onSuccess((produced) =>
      captureResult(() => new MoldedBonBonEditingSession(baseConfection, produced, context, params))
    );
  }

  // ============================================================================
  // Frame-Based Yield
  // ============================================================================

  /**
   * Sets frames and buffer percentage for yield calculation.
   * Count is computed as: frames × cavitiesPerFrame
   *
   * @param frames - Number of frames to produce
   * @param bufferPercentage - Buffer overfill (e.g., 0.1 for 10%)
   * @returns Success with computed yield, or Failure if invalid
   * @public
   */
  public setFrames(frames: number, bufferPercentage: number = 0.1): Result<Confections.IMoldedBonBonYield> {
    if (frames <= 0) {
      return fail(`Frames must be positive: ${frames}`);
    }
    if (bufferPercentage < 0 || bufferPercentage > 1) {
      return fail(`Buffer percentage must be between 0 and 1: ${bufferPercentage}`);
    }

    // Compute count from frames and mold
    const count = frames * this._currentMold.cavityCount;

    const yieldSpec: Confections.IMoldedBonBonYield = {
      yieldType: 'frames',
      frames,
      bufferPercentage,
      count,
      unit: 'pieces',
      weightPerPiece: this._currentMold.cavityWeight
    };

    return this.scaleToYield(yieldSpec).onSuccess(() => succeed(yieldSpec));
  }

  /**
   * Scales to new yield specification.
   * Handles both frame-based and legacy count-based yield.
   *
   * @param yieldSpec - The new yield specification
   * @returns Success with updated yield, or Failure
   * @public
   */
  public override scaleToYield(
    yieldSpec: Confections.AnyConfectionYield
  ): Result<Confections.IConfectionYield> {
    // Extract frame-based parameters
    let frames: number;
    let bufferPercentage: number;

    if (Confections.isMoldedBonBonYield(yieldSpec)) {
      frames = yieldSpec.frames;
      bufferPercentage = yieldSpec.bufferPercentage;
    } else {
      // Legacy yield - compute frames from count
      frames = Math.ceil(yieldSpec.count / this._currentMold.cavityCount);
      bufferPercentage = 0.1; // Default 10%
    }

    // Update produced confection yield
    const computedYield: Confections.IMoldedBonBonYield = {
      yieldType: 'frames',
      frames,
      bufferPercentage,
      count: frames * this._currentMold.cavityCount,
      unit: 'pieces',
      weightPerPiece: this._currentMold.cavityWeight
    };

    // Update produced confection yield, then scale all fillings
    return this._produced
      .scaleToYield(computedYield)
      .onSuccess(() => this._scaleAllFillingsToYield())
      .onSuccess(() => succeed(computedYield));
  }

  // ============================================================================
  // Mold Change Workflow
  // ============================================================================

  /**
   * Analyzes impact of changing to a new mold.
   * Returns analysis for user review before confirmation.
   *
   * @param moldId - The new mold ID
   * @returns Success with analysis, or Failure if mold not found
   * @public
   */
  public analyzeMoldChange(moldId: MoldId): Result<IMoldChangeAnalysis> {
    return this._context.molds.get(moldId).asResult.onSuccess((newMold) => {
      const oldTotal = this._computeTotalCavityWeight(this._currentMold);
      const newTotal = this._computeTotalCavityWeight(newMold);

      const analysis: IMoldChangeAnalysis = {
        oldMoldId: this._currentMold.id,
        newMoldId: moldId,
        oldTotalWeight: oldTotal,
        newTotalWeight: newTotal,
        weightDelta: (newTotal - oldTotal) as Measurement,
        fillingSessionsAffected: Array.from(this._fillingSessions.keys()),
        requiresRescaling: Math.abs(newTotal - oldTotal) > 0.01 // Tolerance
      };

      this._pendingMoldChange = analysis;
      return succeed(analysis);
    });
  }

  /**
   * Confirms pending mold change and rescales fillings.
   * Call analyzeMoldChange() first to set up the pending change.
   *
   * @returns Success with undefined, or Failure if no pending change or update fails
   * @public
   */
  public confirmMoldChange(): Result<undefined> {
    if (!this._pendingMoldChange) {
      return fail('No pending mold change');
    }

    // Update mold in produced confection (convert Result<void> to Result<undefined>)
    return (this._produced as ProducedMoldedBonBon)
      .setMold(this._pendingMoldChange.newMoldId)
      .onSuccess(() => {
        // Reload mold
        return this._loadMold(this._pendingMoldChange!.newMoldId).onSuccess((newMold) => {
          this._currentMold = newMold;

          // Rescale fillings if needed
          if (this._pendingMoldChange!.requiresRescaling) {
            return this._scaleAllFillingsToYield().onSuccess(() => {
              this._pendingMoldChange = undefined;
              return succeed(undefined);
            });
          }
          /* c8 ignore next 3 - defensive: requiresRescaling false branch requires test molds with identical cavity weights */
          this._pendingMoldChange = undefined;
          return succeed(undefined);
        });
      });
  }

  /**
   * Cancels pending mold change.
   * @public
   */
  public cancelMoldChange(): void {
    this._pendingMoldChange = undefined;
  }

  /**
   * Gets pending mold change analysis, if any.
   * @public
   */
  public get pendingMoldChange(): IMoldChangeAnalysis | undefined {
    return this._pendingMoldChange;
  }

  // ============================================================================
  // Weight Computation (Protected)
  // ============================================================================

  /**
   * Computes target weight for a specific filling slot.
   * Divides total cavity weight equally among all slots.
   *
   * @param slotId - The slot identifier
   * @returns Success with target weight
   * @internal
   */
  protected override _computeSlotTargetWeight(slotId: SlotId): Result<Measurement> {
    const totalWeight = this._computeTotalCavityWeight(this._currentMold);
    const slotCount = this._produced.fillings?.length ?? 1;

    // Equal division
    const targetWeight = (totalWeight / slotCount) as Measurement;
    return succeed(targetWeight);
  }

  /**
   * Computes total cavity weight including buffer.
   * Formula: frames × cavitiesPerFrame × cavityWeight × (1 + bufferPercentage)
   *
   * @param mold - The mold to compute weight for
   * @returns Total weight in grams
   * @internal
   */
  private _computeTotalCavityWeight(mold: IMold): Measurement {
    const currentYield = this._produced.yield;

    let frames: number;
    let bufferPercentage: number;

    if (Confections.isMoldedBonBonYield(currentYield)) {
      frames = currentYield.frames;
      bufferPercentage = currentYield.bufferPercentage;
    } else {
      frames = Math.ceil(currentYield.count / mold.cavityCount);
      bufferPercentage = 0.1;
    }

    const cavityWeight = mold.cavityWeight ?? ZeroMeasurement;
    const baseWeight = frames * mold.cavityCount * cavityWeight;
    const totalWeight = baseWeight * (1 + bufferPercentage);

    return totalWeight as Measurement;
  }

  /**
   * Scales all filling sessions to match current yield.
   * Computes new target weight for each slot and scales accordingly.
   *
   * @returns `Success` with total weight of all scaled fillings, or `Failure` with aggregated errors.
   * @internal
   */
  private _scaleAllFillingsToYield(): Result<number> {
    const errors: MessageAggregator = new MessageAggregator();
    let totalWeight = 0;

    for (const [slotId] of this._fillingSessions.entries()) {
      this._computeSlotTargetWeight(slotId)
        .onSuccess((targetWeight) => this._scaleFillingToWeight(slotId, targetWeight))
        .onSuccess((scaledWeight) => succeed((totalWeight += scaledWeight ?? 0)))
        .aggregateError(errors, (msg) => `${slotId}: ${msg}`);
    }

    return errors.returnOrReport(succeed(totalWeight));
  }

  /**
   * Loads the current mold from the produced confection.
   * @internal
   */
  private _loadCurrentMold(): Result<IMold> {
    const moldId = this._produced.current.moldId;
    return this._loadMold(moldId);
  }

  /**
   * Loads a mold by ID from the context.
   * @param moldId - The mold ID
   * @returns Success with mold, or Failure
   * @internal
   */
  private _loadMold(moldId: MoldId): Result<IMold> {
    return this._context.molds.get(moldId).asResult;
  }

  // ============================================================================
  // Accessors
  // ============================================================================

  /**
   * Gets the current mold.
   * @public
   */
  public get currentMold(): IMold {
    return this._currentMold;
  }
}
