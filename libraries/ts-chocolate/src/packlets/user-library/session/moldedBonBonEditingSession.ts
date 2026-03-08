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

import { Measurement, MoldId, SlotId, ZeroMeasurement, Validation as CommonValidation } from '../../common';
import { Confections, IConfectionSessionEntity, IProducedMoldedBonBonEntity, Session } from '../../entities';
import { IMoldedBonBonRecipe, IMold, ProducedMoldedBonBon } from '../../library-runtime';

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
export class MoldedBonBonEditingSession<
  TRecipe extends IMoldedBonBonRecipe = IMoldedBonBonRecipe
> extends ConfectionEditingSessionBase<IProducedMoldedBonBonEntity, TRecipe> {
  private _currentMold: IMold;
  private _pendingMoldChange?: IMoldChangeAnalysis;

  /**
   * Creates a MoldedBonBonEditingSession.
   * Use MoldedBonBonEditingSession.create() instead.
   * @internal
   */
  private constructor(
    baseConfection: TRecipe,
    produced: ProducedMoldedBonBon,
    context: ISessionContext,
    params?: IConfectionEditingSessionParams,
    persistedEntity?: IConfectionSessionEntity
  ) {
    super(baseConfection, produced, context, params, persistedEntity);

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
  public static create<T extends IMoldedBonBonRecipe = IMoldedBonBonRecipe>(
    baseConfection: T,
    context: ISessionContext,
    params?: IConfectionEditingSessionParams
  ): Result<MoldedBonBonEditingSession<T>> {
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
  public static fromPersistedState<T extends IMoldedBonBonRecipe = IMoldedBonBonRecipe>(
    baseConfection: T,
    persistedEntity: IConfectionSessionEntity,
    context: ISessionContext,
    params?: IConfectionEditingSessionParams
  ): Result<MoldedBonBonEditingSession<T>> {
    const history =
      persistedEntity.history as Session.ISerializedEditingHistoryEntity<IProducedMoldedBonBonEntity>;
    return ProducedMoldedBonBon.restoreFromHistory(history).onSuccess((produced) =>
      captureResult(
        () => new MoldedBonBonEditingSession(baseConfection, produced, context, params, persistedEntity)
      )
    );
  }

  // ============================================================================
  // Frame-Based Yield
  // ============================================================================

  /**
   * Sets frames and buffer percentage for yield calculation.
   * Count is computed as: frames × cavitiesPerFrame
   *
   * @param numFrames - Number of frames to produce
   * @param bufferPercentage - Buffer overfill (e.g., 10 for 10%)
   * @returns Success with computed yield, or Failure if invalid
   * @public
   */
  public setFrames(
    numFrames: number,
    bufferPercentage: number = 10
  ): Result<Confections.IBufferedYieldInFrames> {
    if (numFrames <= 0) {
      return fail(`Frames must be positive: ${numFrames}`);
    }
    if (!CommonValidation.isValidPercentage(bufferPercentage)) {
      return fail(`Buffer percentage must be between 0 and 100: ${bufferPercentage}`);
    }

    const yieldSpec: Confections.IBufferedYieldInFrames = {
      numFrames,
      bufferPercentage
    };

    return this.scaleToYield(yieldSpec).onSuccess(() => succeed(yieldSpec));
  }

  /**
   * Narrows the produced getter to return the molded-bonbon-specific wrapper.
   * @public
   */
  public override get produced(): ProducedMoldedBonBon {
    return this._produced as ProducedMoldedBonBon;
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
    yieldSpec: Confections.BufferedConfectionYield
  ): Result<Confections.BufferedConfectionYield> {
    /* c8 ignore next 3 - defensive: callers should always pass IBufferedYieldInFrames for molded bonbon */
    if (!Confections.isBufferedYieldInFrames(yieldSpec)) {
      return fail('Molded bonbon scaling requires a frame-based yield specification');
    }

    // Update produced confection yield, then scale all fillings
    return this.produced
      .setFrames(yieldSpec.numFrames, yieldSpec.bufferPercentage)
      .onSuccess((updatedYield) => this._scaleAllFillingsToYield().onSuccess(() => succeed(updatedYield)));
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
    /* c8 ignore next 1 - branch: fillings always present in test confections */
    const slotCount = this._produced.fillings?.length ?? 1;

    // Equal division
    const targetWeight = (totalWeight / slotCount) as Measurement;
    return succeed(targetWeight);
  }

  /**
   * Computes total cavity weight including buffer.
   * Formula: frames × cavitiesPerFrame × cavityWeight × (1 + bufferPercentage / 100)
   *
   * @param mold - The mold to compute weight for
   * @returns Total weight in grams
   * @internal
   */
  private _computeTotalCavityWeight(mold: IMold): Measurement {
    const currentYield = this.produced.yield;
    const frames = currentYield.numFrames;
    const bufferPercentage = currentYield.bufferPercentage;

    // TODO: create test molds that don't have cavity weight
    /* c8 ignore next 1 - branch: test molds always have cavityWeight */
    const cavityWeight = mold.cavityWeight ?? ZeroMeasurement;
    const baseWeight = frames * mold.cavityCount * cavityWeight;
    const totalWeight = baseWeight * (1 + bufferPercentage / 100);

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
        // TODO: create test scenarios that don't define scaledWeight.
        /* c8 ignore next 1 - branch: scaledWeight always defined in test scenarios */
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
