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
 * Unit scaling utilities for recipe ingredients
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import { Measurement, MeasurementUnit, SpoonUnit } from '../common';

// ============================================================================
// Fraction Support
// ============================================================================

/**
 * Represents a fraction for display purposes
 * @public
 */
export interface IFraction {
  readonly numerator: number;
  readonly denominator: number;
  readonly decimal: number;
}

/**
 * Standard fractions supported for tsp/Tbsp display.
 * Ordered by decimal value for efficient searching.
 * @public
 */
export const STANDARD_FRACTIONS: ReadonlyArray<IFraction> = [
  { numerator: 1, denominator: 8, decimal: 0.125 },
  { numerator: 1, denominator: 4, decimal: 0.25 },
  { numerator: 1, denominator: 3, decimal: 1 / 3 },
  { numerator: 3, denominator: 8, decimal: 0.375 },
  { numerator: 1, denominator: 2, decimal: 0.5 },
  { numerator: 5, denominator: 8, decimal: 0.625 },
  { numerator: 2, denominator: 3, decimal: 2 / 3 },
  { numerator: 3, denominator: 4, decimal: 0.75 },
  { numerator: 7, denominator: 8, decimal: 0.875 }
];

// ============================================================================
// Scaled Amount Interface
// ============================================================================

/**
 * Result of scaling an amount in a specific unit.
 * Contains both the raw scaled value and display-friendly representation.
 * @public
 */
export interface IScaledAmount {
  /** The raw scaled numeric value */
  readonly value: Measurement;
  /** The unit of measurement */
  readonly unit: MeasurementUnit;
  /** Display string (e.g., "1 1/2 tsp" or "2 Tbsp") */
  readonly displayValue: string;
  /** Whether this unit supports scaling (false for pinch) */
  readonly scalable: boolean;
}

// ============================================================================
// Unit Scaler Interface
// ============================================================================

/**
 * Interface for unit-specific scalers
 * @public
 */
export interface IUnitScaler {
  /** Whether this unit supports scaling */
  readonly supportsScaling: boolean;

  /**
   * Scale an amount by a factor
   * @param amount - The original amount
   * @param factor - The scaling factor
   * @returns Scaled amount with display information
   */
  scale(amount: Measurement, factor: number): Result<IScaledAmount>;
}

// ============================================================================
// Linear Scaler
// ============================================================================

/**
 * Options for linear scaling
 * @public
 */
export interface ILinearScalerOptions {
  /** The unit this scaler handles */
  readonly unit: MeasurementUnit;
  /** Number of decimal places to round to (default: 1) */
  readonly decimalPlaces?: number;
  /** Unit suffix for display (default: unit value) */
  readonly displaySuffix?: string;
}

/**
 * Generic linear scaler for units like grams and milliliters.
 * Used as the default fallback for unknown units.
 * @public
 */
export class LinearScaler implements IUnitScaler {
  public readonly supportsScaling: boolean = true;

  private readonly _unit: MeasurementUnit;
  private readonly _decimalPlaces: number;
  private readonly _displaySuffix: string;

  public constructor(options: ILinearScalerOptions) {
    this._unit = options.unit;
    this._decimalPlaces = options.decimalPlaces ?? 1;
    this._displaySuffix = options.displaySuffix ?? options.unit;
  }

  public scale(amount: Measurement, factor: number): Result<IScaledAmount> {
    if (factor <= 0) {
      return Failure.with('Scale factor must be greater than zero');
    }

    const multiplier = Math.pow(10, this._decimalPlaces);
    const scaledValue = Math.round(amount * factor * multiplier) / multiplier;

    return Success.with({
      value: scaledValue as Measurement,
      unit: this._unit,
      displayValue: `${scaledValue}${this._displaySuffix}`,
      scalable: true
    });
  }
}

// ============================================================================
// Pinch Scaler
// ============================================================================

/**
 * Scaler for pinch measurements - always returns the original amount.
 * Pinch is an imprecise measurement that doesn't scale linearly.
 * @public
 */
export class PinchScaler implements IUnitScaler {
  public readonly supportsScaling: boolean = false;

  public scale(amount: Measurement, _factor: number): Result<IScaledAmount> {
    // Pinch is imprecise - always return the original amount
    const displayValue = amount === 1 ? 'pinch' : `${amount} pinches`;

    return Success.with({
      value: amount,
      unit: 'pinch',
      displayValue,
      scalable: false
    });
  }
}

// ============================================================================
// Spoon Scaler
// ============================================================================

/**
 * Options for spoon scaling
 * @public
 */
export interface ISpoonScalerOptions {
  /** Prefer tablespoons when amount \>= 1 Tbsp (default: true) */
  readonly preferTablespoons?: boolean;
  /** Maximum teaspoons before converting to tablespoons (default: 3) */
  readonly maxTeaspoons?: number;
}

/**
 * Scaler for spoon measurements (tsp/Tbsp) with fractional support.
 * Handles conversion between tsp and Tbsp (1 Tbsp = 3 tsp).
 * @public
 */
export class SpoonScaler implements IUnitScaler {
  public readonly supportsScaling: boolean = true;

  private readonly _sourceUnit: SpoonUnit;
  private readonly _options: Required<ISpoonScalerOptions>;

  public constructor(sourceUnit: SpoonUnit, options: ISpoonScalerOptions = {}) {
    this._sourceUnit = sourceUnit;
    this._options = {
      preferTablespoons: options.preferTablespoons ?? true,
      maxTeaspoons: options.maxTeaspoons ?? 3
    };
  }

  public scale(amount: Measurement, factor: number): Result<IScaledAmount> {
    if (factor <= 0) {
      return Failure.with('Scale factor must be greater than zero');
    }

    // Scale in the original unit
    const rawScaled = amount * factor;

    // Convert to teaspoons for normalization
    const tspAmount = this._sourceUnit === 'Tbsp' ? rawScaled * 3 : rawScaled;

    // Determine best representation
    return this._findBestRepresentation(tspAmount);
  }

  private _findBestRepresentation(tspAmount: number): Result<IScaledAmount> {
    const tbspAmount = tspAmount / 3;

    // If we prefer tablespoons and have >= 1 Tbsp, use Tbsp
    if (this._options.preferTablespoons && tbspAmount >= 1) {
      return this._formatSpoonAmount(tbspAmount, 'Tbsp');
    }

    // If teaspoons exceed threshold, convert to tablespoons
    if (tspAmount > this._options.maxTeaspoons) {
      return this._formatSpoonAmount(tbspAmount, 'Tbsp');
    }

    // Otherwise use teaspoons
    return this._formatSpoonAmount(tspAmount, 'tsp');
  }

  private _formatSpoonAmount(amount: number, unit: SpoonUnit): Result<IScaledAmount> {
    let wholeNumber = Math.floor(amount);
    const fractionalPart = amount - wholeNumber;

    // Find closest standard fraction
    const fraction = this._findClosestFraction(fractionalPart);

    // Round up if fractional part > 0.9375 (greater than 15/16)
    if (fraction === undefined && fractionalPart > 0.9375) {
      wholeNumber++;
    }

    const displayValue = this._buildDisplayString(wholeNumber, fraction, unit);
    const actualValue = wholeNumber + (fraction?.decimal ?? 0);

    return Success.with({
      value: actualValue as Measurement,
      unit,
      displayValue,
      scalable: true
    });
  }

  private _findClosestFraction(decimal: number): IFraction | undefined {
    if (decimal < 0.0625) {
      // Less than 1/16, treat as 0
      return undefined;
    }

    if (decimal > 0.9375) {
      // Greater than 15/16, will be rounded up to next whole number
      return undefined;
    }

    // Find closest standard fraction
    let closest: IFraction | undefined;
    let minDiff = Infinity;

    for (const frac of STANDARD_FRACTIONS) {
      const diff = Math.abs(frac.decimal - decimal);
      if (diff < minDiff) {
        minDiff = diff;
        closest = frac;
      }
    }

    return closest;
  }

  private _buildDisplayString(whole: number, fraction: IFraction | undefined, unit: SpoonUnit): string {
    // Handle case where fraction rounds up to next whole number
    if (fraction === undefined && whole === 0) {
      // Very small amount, show as 1/8
      return `1/8 ${unit}`;
    }

    if (whole === 0 && fraction) {
      return `${fraction.numerator}/${fraction.denominator} ${unit}`;
    }

    if (!fraction) {
      return `${whole} ${unit}`;
    }

    return `${whole} ${fraction.numerator}/${fraction.denominator} ${unit}`;
  }
}

// ============================================================================
// Scaler Registry
// ============================================================================

/**
 * Registry of unit scalers.
 * Maps measurement units to their appropriate scalers.
 * Falls back to a default linear scaler for unknown units.
 * @public
 */
export class UnitScalerRegistry {
  private readonly _scalers: Map<MeasurementUnit, IUnitScaler>;
  private readonly _defaultScaler: LinearScaler;

  public constructor() {
    this._scalers = new Map();
    this._defaultScaler = new LinearScaler({ unit: 'g', decimalPlaces: 1 });

    // Register default scalers
    this._scalers.set('g', new LinearScaler({ unit: 'g', decimalPlaces: 1 }));
    this._scalers.set('mL', new LinearScaler({ unit: 'mL', decimalPlaces: 0, displaySuffix: ' mL' }));
    this._scalers.set('tsp', new SpoonScaler('tsp'));
    this._scalers.set('Tbsp', new SpoonScaler('Tbsp'));
    this._scalers.set('pinch', new PinchScaler());
    this._scalers.set(
      'seeds',
      new LinearScaler({ unit: 'seeds', decimalPlaces: 0, displaySuffix: ' seeds' })
    );
    this._scalers.set('pods', new LinearScaler({ unit: 'pods', decimalPlaces: 0, displaySuffix: ' pods' }));
  }

  /**
   * Get the scaler for a specific unit
   * @param unit - The measurement unit
   * @returns The appropriate scaler (falls back to linear scaler for unknown units)
   */
  public getScaler(unit: MeasurementUnit): IUnitScaler {
    return this._scalers.get(unit) ?? this._defaultScaler;
  }

  /**
   * Check if a unit supports scaling
   * @param unit - The measurement unit
   * @returns True if the unit supports scaling
   */
  public supportsScaling(unit: MeasurementUnit): boolean {
    return this.getScaler(unit).supportsScaling;
  }

  /**
   * Scale an amount in the specified unit
   * @param amount - The amount to scale
   * @param unit - The measurement unit
   * @param factor - The scaling factor
   * @returns The scaled amount with display information
   */
  public scale(amount: Measurement, unit: MeasurementUnit, factor: number): Result<IScaledAmount> {
    return this.getScaler(unit).scale(amount, factor);
  }
}

/**
 * Default scaler registry instance
 * @public
 */
export const defaultScalerRegistry: UnitScalerRegistry = new UnitScalerRegistry();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a unit supports scaling
 * @param unit - The measurement unit to check
 * @returns True if the unit supports scaling (false for 'pinch')
 * @public
 */
export function supportsScaling(unit: MeasurementUnit): boolean {
  return defaultScalerRegistry.supportsScaling(unit);
}

/**
 * Scale an ingredient amount using the appropriate scaler for the unit
 * @param amount - The amount to scale
 * @param unit - The measurement unit
 * @param factor - The scaling factor
 * @returns The scaled amount with display information
 * @public
 */
export function scaleAmount(
  amount: Measurement,
  unit: MeasurementUnit,
  factor: number
): Result<IScaledAmount> {
  return defaultScalerRegistry.scale(amount, unit, factor);
}
