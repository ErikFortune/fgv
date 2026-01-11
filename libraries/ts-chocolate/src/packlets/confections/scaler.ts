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
 * Confection scaling utilities
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import { ConfectionVersionSpec, Measurement } from '../common';
import { Confection } from './confection';
import {
  AnyConfectionVersion,
  ConfectionData,
  IConfectionYield,
  IMoldedBonBon,
  IMoldedBonBonVersion,
  isMoldedBonBon
} from './model';

// ============================================================================
// Scaled Confection Types
// ============================================================================

/**
 * Scaled yield specification for a confection
 * @public
 */
export interface IScaledConfectionYield {
  /** Original yield count */
  readonly originalCount: number;
  /** Scaled yield count */
  readonly scaledCount: number;
  /** Scale factor applied */
  readonly scaleFactor: number;
  /** Unit description (preserved from original) */
  readonly unit?: string;
  /** Weight per piece in grams (preserved from original) */
  readonly weightPerPiece?: Measurement;
  /** Total estimated weight (if weightPerPiece is available) */
  readonly totalWeight?: Measurement;
}

/**
 * A scaled confection with computed yield values
 * @public
 */
export interface IScaledConfection<T extends ConfectionData = ConfectionData> {
  /** The original confection data */
  readonly confection: T;
  /** The version that was scaled */
  readonly versionSpec: ConfectionVersionSpec;
  /** The scaled yield specification */
  readonly scaledYield: IScaledConfectionYield;
  /** Date the scaling was created (ISO 8601 format) */
  readonly createdDate: string;
}

// ============================================================================
// Scaling Options
// ============================================================================

/**
 * Options for confection scaling
 * @public
 */
export interface IConfectionScaleOptions {
  /**
   * Rounding mode for scaled count (default: 'round')
   * - 'round': Round to nearest integer
   * - 'floor': Round down
   * - 'ceil': Round up
   */
  readonly roundingMode?: 'round' | 'floor' | 'ceil';
}

/**
 * Options for frame-based scaling of molded bonbons
 * @public
 */
export interface IFrameScaleOptions extends IConfectionScaleOptions {
  /**
   * Overage percentage to add for waste (default: 0)
   * E.g., 10 means 10% extra
   */
  readonly overagePercent?: number;
}

// ============================================================================
// Scaling Functions
// ============================================================================

/**
 * Rounds a number based on the specified rounding mode
 * @internal
 */
function applyRounding(value: number, mode: 'round' | 'floor' | 'ceil'): number {
  switch (mode) {
    case 'floor':
      return Math.floor(value);
    case 'ceil':
      return Math.ceil(value);
    case 'round':
    default:
      return Math.round(value);
  }
}

/**
 * Creates a scaled yield from original yield and scale factor
 * @internal
 */
function createScaledYield(
  originalYield: IConfectionYield,
  scaleFactor: number,
  options: IConfectionScaleOptions
): IScaledConfectionYield {
  const roundingMode = options.roundingMode ?? 'round';
  const scaledCount = applyRounding(originalYield.count * scaleFactor, roundingMode);

  const result: IScaledConfectionYield = {
    originalCount: originalYield.count,
    scaledCount,
    scaleFactor,
    unit: originalYield.unit,
    weightPerPiece: originalYield.weightPerPiece
  };

  // Calculate total weight if weightPerPiece is available
  if (originalYield.weightPerPiece !== undefined) {
    return {
      ...result,
      totalWeight: (scaledCount * originalYield.weightPerPiece) as Measurement
    };
  }

  return result;
}

/**
 * Gets the yield from a version.
 * @internal
 */
function getVersionYield(version: AnyConfectionVersion): IConfectionYield {
  return version.yield;
}

/**
 * Scales a confection version by a factor.
 *
 * This function applies a linear scale factor to the version's yield.
 *
 * @param confection - The confection data to scale
 * @param version - The specific version to scale (must exist in confection.versions)
 * @param factor - The scale factor to apply (e.g., 2.0 for double, 0.5 for half)
 * @param options - Optional scaling options
 * @returns Success with scaled confection, or Failure if invalid
 * @public
 */
export function scaleConfectionVersionByFactor<T extends ConfectionData>(
  confection: T,
  version: AnyConfectionVersion,
  factor: number,
  options: IConfectionScaleOptions = {}
): Result<IScaledConfection<T>> {
  if (factor <= 0) {
    return Failure.with('Scale factor must be greater than zero');
  }

  const versionYield = getVersionYield(version);
  const scaledYield = createScaledYield(versionYield, factor, options);

  return Success.with({
    confection,
    versionSpec: version.versionSpec,
    scaledYield,
    createdDate: new Date().toISOString().split('T')[0]
  });
}

/**
 * Scales a confection by a factor using the golden version.
 *
 * This function applies a linear scale factor to the golden version's yield.
 *
 * @param confection - The confection data to scale
 * @param factor - The scale factor to apply (e.g., 2.0 for double, 0.5 for half)
 * @param options - Optional scaling options
 * @returns Success with scaled confection, or Failure if invalid
 * @public
 */
export function scaleConfectionByFactor<T extends ConfectionData>(
  confection: T,
  factor: number,
  options: IConfectionScaleOptions = {}
): Result<IScaledConfection<T>> {
  return Confection.create(confection).onSuccess((conf) => {
    return scaleConfectionVersionByFactor(confection, conf.goldenVersion, factor, options);
  });
}

/**
 * Scales a confection version to a target count.
 *
 * @param confection - The confection data to scale
 * @param version - The specific version to scale
 * @param targetCount - The target number of pieces
 * @param options - Optional scaling options
 * @returns Success with scaled confection, or Failure if invalid
 * @public
 */
export function scaleConfectionVersionToCount<T extends ConfectionData>(
  confection: T,
  version: AnyConfectionVersion,
  targetCount: number,
  options: IConfectionScaleOptions = {}
): Result<IScaledConfection<T>> {
  if (targetCount <= 0) {
    return Failure.with('Target count must be greater than zero');
  }

  const versionYield = getVersionYield(version);
  if (versionYield.count <= 0) {
    return Failure.with('Version yield count must be greater than zero');
  }

  const factor = targetCount / versionYield.count;
  return scaleConfectionVersionByFactor(confection, version, factor, options);
}

/**
 * Scales a confection to a target count using the golden version.
 *
 * @param confection - The confection data to scale
 * @param targetCount - The target number of pieces
 * @param options - Optional scaling options
 * @returns Success with scaled confection, or Failure if invalid
 * @public
 */
export function scaleConfectionToCount<T extends ConfectionData>(
  confection: T,
  targetCount: number,
  options: IConfectionScaleOptions = {}
): Result<IScaledConfection<T>> {
  return Confection.create(confection).onSuccess((conf) => {
    return scaleConfectionVersionToCount(confection, conf.goldenVersion, targetCount, options);
  });
}

/**
 * Scales a molded bonbon version by number of frames/molds.
 *
 * For molded bonbons, this calculates the yield based on the number of frames
 * and the cavities per mold.
 *
 * @param confection - The molded bonbon confection to scale
 * @param version - The specific version to scale
 * @param frameCount - Number of frames/molds to use
 * @param cavitiesPerMold - Number of cavities per mold
 * @param options - Optional frame scaling options
 * @returns Success with scaled confection, or Failure if invalid
 * @public
 */
export function scaleMoldedBonBonVersionByFrames(
  confection: IMoldedBonBon,
  version: IMoldedBonBonVersion,
  frameCount: number,
  cavitiesPerMold: number,
  options: IFrameScaleOptions = {}
): Result<IScaledConfection<IMoldedBonBon>> {
  if (frameCount <= 0) {
    return Failure.with('Frame count must be greater than zero');
  }

  if (cavitiesPerMold <= 0) {
    return Failure.with('Cavities per mold must be greater than zero');
  }

  // Calculate target count from frames and cavities
  let targetCount = frameCount * cavitiesPerMold;

  // Apply overage if specified
  const overagePercent = options.overagePercent ?? 0;
  if (overagePercent > 0) {
    targetCount = Math.ceil(targetCount * (1 + overagePercent / 100));
  }

  return scaleConfectionVersionToCount(confection, version, targetCount, options);
}

/**
 * Scales a molded bonbon confection by number of frames/molds using the golden version.
 *
 * For molded bonbons, this calculates the yield based on the number of frames
 * and the cavities per mold. Requires the confection to have a recommended mold
 * with known cavity count.
 *
 * @param confection - The molded bonbon confection to scale
 * @param frameCount - Number of frames/molds to use
 * @param cavitiesPerMold - Number of cavities per mold
 * @param options - Optional frame scaling options
 * @returns Success with scaled confection, or Failure if invalid
 * @public
 */
export function scaleMoldedBonBonByFrames(
  confection: IMoldedBonBon,
  frameCount: number,
  cavitiesPerMold: number,
  options: IFrameScaleOptions = {}
): Result<IScaledConfection<IMoldedBonBon>> {
  return Confection.create(confection).onSuccess((conf) => {
    const version = conf.goldenVersion as IMoldedBonBonVersion;
    return scaleMoldedBonBonVersionByFrames(confection, version, frameCount, cavitiesPerMold, options);
  });
}

/**
 * Scales any confection, automatically choosing the appropriate method.
 *
 * For molded bonbons, if frameCount and cavitiesPerMold are provided,
 * uses frame-based scaling. Otherwise, uses linear scaling by factor.
 *
 * @param confection - The confection data to scale
 * @param factor - The scale factor to apply
 * @param options - Optional scaling options
 * @returns Success with scaled confection, or Failure if invalid
 * @public
 */
export function scaleConfection<T extends ConfectionData>(
  confection: T,
  factor: number,
  options: IConfectionScaleOptions = {}
): Result<IScaledConfection<T>> {
  return scaleConfectionByFactor(confection, factor, options);
}

/**
 * Type guard to check if a confection is a molded bonbon for frame-based scaling
 * @param confection - The confection to check
 * @returns True if the confection is a molded bonbon
 * @public
 */
export function canScaleByFrames(confection: ConfectionData): confection is IMoldedBonBon {
  return isMoldedBonBon(confection);
}
