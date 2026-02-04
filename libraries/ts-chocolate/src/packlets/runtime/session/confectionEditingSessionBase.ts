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
 * Abstract base class for confection editing sessions
 * @packageDocumentation
 */

import { MessageAggregator, Result, succeed } from '@fgv/ts-utils';

import { FillingId, IngredientId, Measurement, SessionSpec, SlotId } from '../../common';
import { Confections, AnyProducedConfectionEntity } from '../../entities';
import { AnyConfection, ProducedConfectionBase } from '../../library-runtime';
import { ISessionContext } from '../model';

import { EditingSession } from './editingSession';
import { IConfectionEditingSessionParams, IFillingSessionMap } from './model';
import { generateSessionId } from './sessionUtils';

// ============================================================================
// Abstract Base Class
// ============================================================================

/**
 * Abstract base class for confection editing sessions.
 * Manages filling sessions and provides common editing operations.
 *
 * Subclasses implement type-specific scaling logic:
 * - MoldedBonBonEditingSession: Frame-based yield with mold change workflow
 * - BarTruffleEditingSession: Linear scaling by count
 * - RolledTruffleEditingSession: Linear scaling by count
 *
 * @public
 */
export abstract class ConfectionEditingSessionBase<
  T extends AnyProducedConfectionEntity,
  TRuntime extends AnyConfection
> {
  protected readonly _baseConfection: TRuntime;
  protected readonly _context: ISessionContext;
  protected readonly _produced: ProducedConfectionBase<T>;
  protected readonly _originalSnapshot: T;
  protected readonly _sessionId: SessionSpec;
  protected readonly _fillingSessions: Map<SlotId, EditingSession>;

  /**
   * Creates a ConfectionEditingSessionBase.
   * @param baseConfection - The source confection
   * @param produced - The produced confection wrapper
   * @param context - The runtime context
   * @param params - Optional session parameters
   * @internal
   */
  protected constructor(
    baseConfection: TRuntime,
    produced: ProducedConfectionBase<T>,
    context: ISessionContext,
    params?: IConfectionEditingSessionParams
  ) {
    this._baseConfection = baseConfection;
    this._context = context;
    this._produced = produced;
    this._originalSnapshot = produced.createSnapshot();
    this._sessionId = params?.sessionId ?? generateSessionId().orThrow();
    this._fillingSessions = new Map();

    // Note: Filling sessions are loaded by subclass after type-specific initialization
    // (e.g., MoldedBonBonEditingSession needs to load the mold first)
  }

  // ============================================================================
  // Filling Session Management (Protected)
  // ============================================================================

  /**
   * Loads filling sessions for all recipe filling slots.
   * Called during construction to eagerly initialize sessions.
   * @internal
   */
  protected _loadFillingSessions(): Result<Map<SlotId, EditingSession> | undefined> {
    const fillings = this._produced.fillings;
    if (!fillings) {
      return succeed(undefined);
    }

    const errors: MessageAggregator = new MessageAggregator();
    for (const slot of fillings) {
      if (slot.slotType === 'recipe') {
        this._createFillingSessionForSlot(slot.slotId, slot.fillingId).aggregateError(
          errors,
          (msg) => `${slot.slotId}: ${msg}`
        );
      }
      // Ingredient slots don't need sessions
    }

    return errors.returnOrReport(succeed(this._fillingSessions));
  }

  /**
   * Creates a filling session for a slot at the current target weight.
   * @param slotId - The slot identifier
   * @param fillingId - The filling recipe ID
   * @internal
   */
  protected _createFillingSessionForSlot(slotId: SlotId, fillingId: FillingId): Result<EditingSession> {
    // Get the filling recipe from context
    return this._context.getRuntimeFilling(fillingId).onSuccess((filling) => {
      // Compute target weight for this slot
      return this._computeSlotTargetWeight(slotId).onSuccess((targetWeight) => {
        // Create session at target weight
        return this._context.createFillingSession(filling, targetWeight).onSuccess((session) => {
          this._fillingSessions.set(slotId, session);
          return succeed(session);
        });
      });
    });
  }

  /**
   * Removes filling session for a slot.
   * @param slotId - The slot identifier
   * @internal
   */
  protected _removeFillingSession(slotId: SlotId): Result<EditingSession | undefined> {
    const session = this._fillingSessions.get(slotId);
    this._fillingSessions.delete(slotId);
    return succeed(session);
  }

  /**
   * Scales all filling sessions by a uniform scale factor.
   * Used by linear scaling confections (bar/rolled truffles).
   * @param scaleFactor - Multiplicative factor to apply
   * @internal
   */
  protected _scaleAllFillingsByFactor(scaleFactor: number): Result<IFillingSessionMap> {
    const errors: MessageAggregator = new MessageAggregator();

    for (const [slotId, session] of this._fillingSessions.entries()) {
      const currentWeight = session.targetWeight;
      const newWeight = (currentWeight * scaleFactor) as Measurement;

      session.scaleToTargetWeight(newWeight).aggregateError(errors, (msg) => `${slotId}: ${msg}`);
    }

    return errors.returnOrReport(succeed(this._fillingSessions));
  }

  /**
   * Scales a specific filling session to a target weight.
   * @param slotId - The slot identifier
   * @param targetWeight - Target weight in grams
   * @internal
   */
  protected _scaleFillingToWeight(
    slotId: SlotId,
    targetWeight: Measurement
  ): Result<Measurement | undefined> {
    const session = this._fillingSessions.get(slotId);
    if (!session) {
      return succeed(undefined); // No session (ingredient slot)
    }

    return session.scaleToTargetWeight(targetWeight);
  }

  // ============================================================================
  // Abstract Methods (Implemented by Subclasses)
  // ============================================================================

  /**
   * Computes target weight for a specific filling slot based on current yield.
   * Implementation is type-specific:
   * - Molded bonbons: Equal division of total cavity weight
   * - Bar/rolled truffles: Preserve current session weight (linear scaling)
   *
   * @param slotId - The slot identifier
   * @returns Success with target weight, or Failure
   * @public
   */
  protected abstract _computeSlotTargetWeight(slotId: SlotId): Result<Measurement>;

  /**
   * Scales to a new yield specification.
   * Implementation is type-specific:
   * - Molded bonbons: Frame-based with mold cavity calculation
   * - Bar/rolled truffles: Linear count-based scaling
   *
   * @param yieldSpec - The new yield specification
   * @returns Success with updated yield, or Failure
   * @public
   */
  public abstract scaleToYield(
    yieldSpec: Confections.AnyConfectionYield
  ): Result<Confections.IConfectionYield>;

  // ============================================================================
  // Common Editing Methods
  // ============================================================================

  /**
   * Sets or updates a filling slot.
   * Creates/updates filling session if recipe slot.
   *
   * @param slotId - The slot identifier
   * @param choice - Recipe or ingredient choice
   * @returns `Success` with the new or updated filling session, or `undefined` for ingredient slots; or `Failure`
   * @public
   */
  public setFillingSlot(
    slotId: SlotId,
    choice: { type: 'recipe'; fillingId: FillingId } | { type: 'ingredient'; ingredientId: IngredientId }
  ): Result<EditingSession | undefined> {
    // Remove existing session first
    this._removeFillingSession(slotId);

    return this._produced.setFillingSlot(slotId, choice).onSuccess(() => {
      // Create new filling session if recipe slot
      if (choice.type === 'recipe') {
        return this._createFillingSessionForSlot(slotId, choice.fillingId);
      }
      return succeed(undefined);
    });
  }

  /**
   * Removes a filling slot.
   *
   * @param slotId - The slot identifier
   * @returns `Success` with the removed filling session, or `undefined` if none existed; or `Failure`
   * @public
   */
  public removeFillingSlot(slotId: SlotId): Result<EditingSession | undefined> {
    // Convert Result<void> to Result<undefined>
    return this._produced.removeFillingSlot(slotId).onSuccess(() => {
      return this._removeFillingSession(slotId);
    });
  }

  // ============================================================================
  // Accessors
  // ============================================================================

  /**
   * Gets the filling session for a specific slot.
   * @param slotId - The slot identifier
   * @returns The editing session, or undefined if not found
   * @public
   */
  public getFillingSession(slotId: SlotId): EditingSession | undefined {
    return this._fillingSessions.get(slotId);
  }

  /**
   * Gets all filling sessions.
   * @public
   */
  public get fillingSessions(): IFillingSessionMap {
    return this._fillingSessions as IFillingSessionMap;
  }

  /**
   * Gets the runtime context.
   * @public
   */
  public get context(): ISessionContext {
    return this._context;
  }

  /**
   * Gets the session ID.
   * @public
   */
  public get sessionId(): SessionSpec {
    return this._sessionId;
  }

  /**
   * Gets the produced confection wrapper.
   * @public
   */
  public get produced(): ProducedConfectionBase<T> {
    return this._produced;
  }

  /**
   * Gets the base confection.
   * @public
   */
  public get baseConfection(): TRuntime {
    return this._baseConfection;
  }
}
