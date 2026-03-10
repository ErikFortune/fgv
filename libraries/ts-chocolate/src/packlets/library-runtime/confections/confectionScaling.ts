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
 * Stateless confection scaling utilities for read-only preview/print use.
 *
 * Mirrors the scaling math in the session layer (`MoldedBonBonEditingSession`,
 * `BarTruffleEditingSession`, `RolledTruffleEditingSession`) but operates purely
 * on resolved library-runtime objects without mutation or undo/redo.
 *
 * @packageDocumentation
 */

import { Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { MessageAggregator } from '@fgv/ts-utils';

import { Helpers, Measurement, MoldId, SlotId } from '../../common';
import { Confections } from '../../entities';
import {
  AnyConfectionRecipeVariation,
  IIngredient,
  IMoldedBonBonRecipeVariation,
  IResolvedConfectionMoldRef,
  IResolvedFillingIngredient,
  IResolvedFillingSlot
} from '../model';
import { ProducedFilling } from '../produced';

// ============================================================================
// Public Interfaces
// ============================================================================

/**
 * Scaling target for a confection preview.
 *
 * For molded bonbons, `targetFrames` is the primary input.
 * For bar/rolled truffles, `targetCount` is the primary input.
 * `fillingSelections` maps slotId → selected filling option ID (from viewSettings).
 * @public
 */
export interface IConfectionScalingTarget {
  /** Target frames for molded bonbon (primary input) */
  readonly targetFrames?: number;
  /** Buffer overfill percentage for molded bonbon (default 10 = 10%) */
  readonly bufferPercentage?: number;
  /** Override the mold to use (falls back to variation's preferred mold) */
  readonly selectedMoldId?: MoldId;
  /** Target piece count for bar/rolled truffle */
  readonly targetCount?: number;
  /** Per-slot filling selection: slotId → optionId (from viewSettings) */
  readonly fillingSelections?: Readonly<Record<string, string>>;
}

/**
 * A scaled recipe filling slot — the selected filling's golden variation
 * has been scaled to the computed target weight.
 * @public
 */
export interface IScaledRecipeSlot {
  readonly type: 'recipe';
  readonly slotId: SlotId;
  readonly name?: string;
  /** Target weight for this slot in grams */
  readonly targetWeight: Measurement;
  /** Scale factor applied to the filling's base weight */
  readonly scaleFactor: number;
  /** Scaled filling with per-ingredient amounts */
  readonly produced: ProducedFilling;
  /** Resolved ingredients from the source variation (for display names) */
  readonly resolvedIngredients: ReadonlyArray<IResolvedFillingIngredient>;
}

/**
 * A scaled ingredient filling slot — the required amount of the ingredient
 * is computed from the confection geometry.
 * @public
 */
export interface IScaledIngredientSlot {
  readonly type: 'ingredient';
  readonly slotId: SlotId;
  readonly name?: string;
  /** Required amount of this ingredient in grams */
  readonly targetWeight: Measurement;
  /** The resolved ingredient */
  readonly ingredient: IIngredient;
}

/** Discriminated union of scaled slot types. @public */
export type AnyScaledSlot = IScaledRecipeSlot | IScaledIngredientSlot;

/**
 * Result of scaling a confection variation to a target yield.
 * @public
 */
export interface IConfectionScalingResult {
  /** Actual piece count after scaling */
  readonly effectiveCount: number;
  /** Actual frame count (molded bonbon only) */
  readonly effectiveFrames?: number;
  /** Overall scale factor vs recipe yield count */
  readonly scaleFactor: number;
  /** Per-slot scaled filling data */
  readonly slots: ReadonlyArray<AnyScaledSlot>;
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Resolves the selected filling option for a slot, falling back to preferred.
 * Returns the resolved filling variation (always golden) for recipe options,
 * or the ingredient for ingredient options.
 */
function _resolveSlotOption(
  slot: IResolvedFillingSlot,
  fillingSelections?: Readonly<Record<string, string>>
): IResolvedFillingSlot['filling']['options'][number] {
  const selectedId = fillingSelections?.[slot.slotId];
  /* c8 ignore next 3 - defensive: options always non-empty (resolver validates), preferredId always matches one option */
  const option = selectedId
    ? slot.filling.options.find((o) => o.id === selectedId) ?? slot.filling.options[0]
    : slot.filling.options.find((o) => o.id === slot.filling.preferredId) ?? slot.filling.options[0];
  return option;
}

/**
 * Builds a single scaled slot from a resolved option and target weight.
 */
function _buildScaledSlot(
  slot: IResolvedFillingSlot,
  option: IResolvedFillingSlot['filling']['options'][number],
  targetWeight: Measurement
): Result<AnyScaledSlot> {
  if (option.type === 'ingredient') {
    const scaledSlot: IScaledIngredientSlot = {
      type: 'ingredient',
      slotId: slot.slotId,
      name: slot.name,
      targetWeight,
      ingredient: option.ingredient
    };
    return succeed(scaledSlot);
  }

  // Recipe slot — scale the golden variation
  const goldenVariation = option.filling.goldenVariation;
  const baseWeight = goldenVariation.baseWeight;
  if (baseWeight <= 0) {
    return fail(`slot '${slot.slotId}': filling '${option.filling.name}' has zero base weight`);
  }
  const scaleFactor = targetWeight / baseWeight;
  const ingredientsResult = goldenVariation.getIngredients();
  /* c8 ignore next 1 - defensive: goldenVariation is already validated, getIngredients cannot fail */
  const resolvedIngredients = ingredientsResult.isSuccess() ? Array.from(ingredientsResult.value) : [];

  return ProducedFilling.fromSource(goldenVariation, scaleFactor).onSuccess((produced) => {
    const scaledSlot: IScaledRecipeSlot = {
      type: 'recipe',
      slotId: slot.slotId,
      name: slot.name,
      targetWeight,
      scaleFactor,
      produced,
      resolvedIngredients
    };
    return succeed(scaledSlot);
  });
}

// ============================================================================
// Molded bonbon scaling
// ============================================================================

function _scaleMoldedBonBon(
  variation: IMoldedBonBonRecipeVariation,
  target: IConfectionScalingTarget
): Result<IConfectionScalingResult> {
  const frames = target.targetFrames;
  if (frames === undefined || frames <= 0) {
    return fail('targetFrames must be a positive number for molded bonbon scaling');
  }

  const bufferPercentage = target.bufferPercentage ?? 10;

  // Resolve mold: use selectedMoldId if provided, else preferred
  return variation
    .getMolds()
    .withErrorFormat((msg) => `Cannot scale: ${msg}`)
    .onSuccess((molds) => {
      const selectedMoldId = target.selectedMoldId;
      const preferredMold = Helpers.getPreferredOrFirst(molds);
      /* c8 ignore next 3 - defensive: getMolds succeeds only with non-empty options */
      if (!preferredMold) {
        return fail('No mold available for scaling');
      }
      const moldRef = selectedMoldId
        ? molds.options.find((m) => m.id === selectedMoldId) ?? preferredMold
        : preferredMold;
      return _scaleMoldedBonBonWithMold(variation, moldRef, frames, bufferPercentage, target);
    });
}

function _scaleMoldedBonBonWithMold(
  variation: IMoldedBonBonRecipeVariation,
  moldRef: IResolvedConfectionMoldRef,
  frames: number,
  bufferPercentage: number,
  target: IConfectionScalingTarget
): Result<IConfectionScalingResult> {
  const mold = moldRef.mold;
  const cavityWeight = mold.cavityWeight;
  if (cavityWeight === undefined || cavityWeight <= 0) {
    return fail(`Mold '${mold.displayName}' has no cavity weight — cannot compute filling amounts`);
  }

  const effectiveCount = frames * mold.cavityCount;
  const totalWeight = (frames *
    mold.cavityCount *
    cavityWeight *
    (1 + bufferPercentage / 100)) as Measurement;

  /* c8 ignore next 2 - defensive: fillings always defined for molded bonbon; slotCount guard prevents div/0 */
  const fillings = variation.fillings ?? [];
  const slotCount = fillings.length || 1;
  const perSlotWeight = (totalWeight / slotCount) as Measurement;

  const recipeScaleFactor = effectiveCount / (variation.yield.numFrames * mold.cavityCount);

  const errors = new MessageAggregator();
  const slotResults = fillings.map((slot) => {
    const option = _resolveSlotOption(slot, target.fillingSelections);
    return _buildScaledSlot(slot, option, perSlotWeight).withErrorFormat(
      (msg) => `slot '${slot.slotId}': ${msg}`
    );
  });

  return mapResults(slotResults)
    .aggregateError(errors)
    .onSuccess((slots) =>
      errors.returnOrReport(
        succeed<IConfectionScalingResult>({
          effectiveCount,
          effectiveFrames: frames,
          scaleFactor: recipeScaleFactor,
          slots
        })
      )
    );
}

// ============================================================================
// Bar / rolled truffle scaling (linear count-based)
// ============================================================================

function _scaleLinear(
  variation: AnyConfectionRecipeVariation,
  target: IConfectionScalingTarget
): Result<IConfectionScalingResult> {
  const targetCount = target.targetCount;
  if (targetCount === undefined || targetCount <= 0) {
    return fail('targetCount must be a positive number for bar/rolled truffle scaling');
  }

  const yld = variation.yield;
  /* c8 ignore next 3 - defensive: _scaleLinear is only called for bar/rolled truffle which always have numPieces */
  if (Confections.isYieldInFrames(yld)) {
    return fail('Recipe yield must have numPieces for bar/rolled truffle scaling');
  }
  const recipeCount = yld.numPieces;
  if (recipeCount <= 0) {
    return fail('Recipe yield count must be positive');
  }

  const scaleFactor = targetCount / recipeCount;
  const weightPerPiece = yld.weightPerPiece;

  /* c8 ignore next 2 - defensive: fillings always defined; slotCount guard prevents div/0 */
  const fillings = variation.fillings ?? [];
  const slotCount = fillings.length || 1;

  const errors = new MessageAggregator();
  const slotResults = fillings.map((slot) => {
    const option = _resolveSlotOption(slot, target.fillingSelections);

    let targetWeight: Measurement;
    if (option.type === 'recipe') {
      const baseWeight = option.filling.goldenVariation.baseWeight;
      targetWeight = (baseWeight * scaleFactor) as Measurement;
    } else {
      // Ingredient slot: use weightPerPiece if available, else proportional estimate
      /* c8 ignore next 1 - defensive: weightPerPiece is undefined only for recipes without weight */
      const perPieceWeight = weightPerPiece ?? 0;
      targetWeight = ((perPieceWeight * targetCount) / slotCount) as Measurement;
    }

    return _buildScaledSlot(slot, option, targetWeight).withErrorFormat(
      (msg) => `slot '${slot.slotId}': ${msg}`
    );
  });

  return mapResults(slotResults)
    .aggregateError(errors)
    .onSuccess((slots) =>
      errors.returnOrReport(
        succeed<IConfectionScalingResult>({
          effectiveCount: targetCount,
          scaleFactor,
          slots
        })
      )
    );
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Computes scaled filling amounts for a confection variation given a scaling target.
 *
 * - **Molded bonbon:** uses `targetFrames` + mold geometry to compute per-slot weight
 * - **Bar/rolled truffle:** uses `targetCount` with linear scaling
 *
 * Recipe slots produce a full `ProducedFilling` with scaled ingredient amounts.
 * Ingredient slots produce a computed target weight for the ingredient.
 *
 * Returns `fail` if required inputs are missing (e.g., no `targetFrames` for bonbons,
 * mold has no `cavityWeight`, or a filling has zero base weight).
 *
 * @param variation - The resolved confection variation to scale
 * @param target - The scaling target (frames, count, mold override, filling selections)
 * @returns Success with scaling result, or Failure with error message
 * @public
 */
export function computeScaledFillings(
  variation: AnyConfectionRecipeVariation,
  target: IConfectionScalingTarget
): Result<IConfectionScalingResult> {
  if (variation.isMoldedBonBonVariation()) {
    return _scaleMoldedBonBon(variation, target);
  }
  return _scaleLinear(variation, target);
}

/**
 * Returns true if the given view settings contain enough information to scale
 * the given variation (i.e., the required input field is set and positive).
 * @public
 */
export function canScale(variation: AnyConfectionRecipeVariation, target: IConfectionScalingTarget): boolean {
  if (variation.isMoldedBonBonVariation()) {
    return (target.targetFrames ?? 0) > 0;
  }
  return (target.targetCount ?? 0) > 0;
}
