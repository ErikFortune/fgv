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

import '@fgv/ts-utils-jest';

import { Measurement } from '../../../packlets/common';
import {
  STANDARD_FRACTIONS,
  LinearScaler,
  PinchScaler,
  SpoonScaler,
  UnitScalerRegistry,
  defaultScalerRegistry,
  supportsScaling,
  scaleAmount
} from '../../../packlets/library-runtime';

describe('UnitScaler', () => {
  // ============================================================================
  // STANDARD_FRACTIONS Tests
  // ============================================================================

  describe('STANDARD_FRACTIONS', () => {
    test('contains expected fractions', () => {
      expect(STANDARD_FRACTIONS).toHaveLength(9);
      expect(STANDARD_FRACTIONS[0]).toEqual({ numerator: 1, denominator: 8, decimal: 0.125 });
      expect(STANDARD_FRACTIONS[4]).toEqual({ numerator: 1, denominator: 2, decimal: 0.5 });
    });

    test('fractions are sorted by decimal value', () => {
      for (let i = 1; i < STANDARD_FRACTIONS.length; i++) {
        expect(STANDARD_FRACTIONS[i].decimal).toBeGreaterThan(STANDARD_FRACTIONS[i - 1].decimal);
      }
    });
  });

  // ============================================================================
  // LinearScaler Tests
  // ============================================================================

  describe('LinearScaler', () => {
    describe('for grams', () => {
      const scaler = new LinearScaler({ unit: 'g', decimalPlaces: 1 });

      test('supportsScaling is true', () => {
        expect(scaler.supportsScaling).toBe(true);
      });

      test('scales by factor 1.0', () => {
        expect(scaler.scale(100 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(100);
          expect(result.unit).toBe('g');
          expect(result.displayValue).toBe('100g');
          expect(result.scalable).toBe(true);
        });
      });

      test('scales by factor 2.0', () => {
        expect(scaler.scale(50 as Measurement, 2.0)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(100);
          expect(result.displayValue).toBe('100g');
        });
      });

      test('scales by factor 0.5', () => {
        expect(scaler.scale(100 as Measurement, 0.5)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(50);
          expect(result.displayValue).toBe('50g');
        });
      });

      test('rounds to 1 decimal place', () => {
        expect(scaler.scale(33.333 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(33.3);
          expect(result.displayValue).toBe('33.3g');
        });
      });

      test('fails with zero factor', () => {
        expect(scaler.scale(100 as Measurement, 0)).toFailWith(/greater than zero/);
      });

      test('fails with negative factor', () => {
        expect(scaler.scale(100 as Measurement, -1)).toFailWith(/greater than zero/);
      });
    });

    describe('for milliliters', () => {
      const scaler = new LinearScaler({ unit: 'mL', decimalPlaces: 0, displaySuffix: ' mL' });

      test('rounds to whole numbers', () => {
        expect(scaler.scale(33.7 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(34);
          expect(result.unit).toBe('mL');
          expect(result.displayValue).toBe('34 mL');
        });
      });

      test('scales and rounds', () => {
        expect(scaler.scale(50 as Measurement, 1.5)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(75);
          expect(result.displayValue).toBe('75 mL');
        });
      });
    });

    describe('with custom options', () => {
      test('uses default decimal places of 1', () => {
        const scaler = new LinearScaler({ unit: 'g' });
        expect(scaler.scale(33.333 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(33.3);
        });
      });

      test('uses unit as default display suffix', () => {
        const scaler = new LinearScaler({ unit: 'g' });
        expect(scaler.scale(100 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
          expect(result.displayValue).toBe('100g');
        });
      });
    });
  });

  // ============================================================================
  // PinchScaler Tests
  // ============================================================================

  describe('PinchScaler', () => {
    const scaler = new PinchScaler();

    test('supportsScaling is false', () => {
      expect(scaler.supportsScaling).toBe(false);
    });

    test('returns original amount regardless of factor', () => {
      expect(scaler.scale(1 as Measurement, 2.0)).toSucceedAndSatisfy((result) => {
        expect(result.value).toBe(1);
        expect(result.unit).toBe('pinch');
        expect(result.scalable).toBe(false);
      });
    });

    test('displays "pinch" for amount of 1', () => {
      expect(scaler.scale(1 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
        expect(result.displayValue).toBe('pinch');
      });
    });

    test('displays "N pinches" for amounts other than 1', () => {
      expect(scaler.scale(2 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
        expect(result.displayValue).toBe('2 pinches');
      });
    });

    test('ignores factor completely', () => {
      expect(scaler.scale(1 as Measurement, 10.0)).toSucceedAndSatisfy((result) => {
        expect(result.value).toBe(1);
        expect(result.displayValue).toBe('pinch');
      });
    });
  });

  // ============================================================================
  // SpoonScaler Tests
  // ============================================================================

  describe('SpoonScaler', () => {
    describe('for teaspoons', () => {
      const scaler = new SpoonScaler('tsp');

      test('supportsScaling is true', () => {
        expect(scaler.supportsScaling).toBe(true);
      });

      test('scales simple teaspoon amount', () => {
        expect(scaler.scale(1 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(1);
          expect(result.unit).toBe('tsp');
          expect(result.displayValue).toBe('1 tsp');
          expect(result.scalable).toBe(true);
        });
      });

      test('scales teaspoons with factor 2.0', () => {
        expect(scaler.scale(1 as Measurement, 2.0)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(2);
          expect(result.unit).toBe('tsp');
          expect(result.displayValue).toBe('2 tsp');
        });
      });

      test('converts to tablespoons when >= 1 Tbsp', () => {
        expect(scaler.scale(1 as Measurement, 3.0)).toSucceedAndSatisfy((result) => {
          expect(result.unit).toBe('Tbsp');
          expect(result.displayValue).toBe('1 Tbsp');
        });
      });

      test('shows fractional teaspoons', () => {
        expect(scaler.scale(1 as Measurement, 0.5)).toSucceedAndSatisfy((result) => {
          expect(result.displayValue).toBe('1/2 tsp');
        });
      });

      test('shows mixed number for fractional amounts', () => {
        expect(scaler.scale(1 as Measurement, 1.5)).toSucceedAndSatisfy((result) => {
          expect(result.displayValue).toBe('1 1/2 tsp');
        });
      });

      test('fails with zero factor', () => {
        expect(scaler.scale(1 as Measurement, 0)).toFailWith(/greater than zero/);
      });

      test('fails with negative factor', () => {
        expect(scaler.scale(1 as Measurement, -1)).toFailWith(/greater than zero/);
      });
    });

    describe('for tablespoons', () => {
      const scaler = new SpoonScaler('Tbsp');

      test('scales simple tablespoon amount', () => {
        expect(scaler.scale(1 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(1);
          expect(result.unit).toBe('Tbsp');
          expect(result.displayValue).toBe('1 Tbsp');
        });
      });

      test('scales tablespoons with factor 2.0', () => {
        expect(scaler.scale(1 as Measurement, 2.0)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(2);
          expect(result.displayValue).toBe('2 Tbsp');
        });
      });

      test('shows fractional tablespoons', () => {
        expect(scaler.scale(1 as Measurement, 0.5)).toSucceedAndSatisfy((result) => {
          expect(result.displayValue).toBe('1 1/2 tsp');
        });
      });
    });

    describe('with custom options', () => {
      test('preferTablespoons: false keeps teaspoons when not exceeding maxTeaspoons', () => {
        const scaler = new SpoonScaler('tsp', { preferTablespoons: false });
        // 3 tsp = maxTeaspoons, so stays in tsp
        expect(scaler.scale(1 as Measurement, 3.0)).toSucceedAndSatisfy((result) => {
          expect(result.unit).toBe('tsp');
          expect(result.displayValue).toBe('3 tsp');
        });
      });

      test('preferTablespoons: false converts when exceeding maxTeaspoons', () => {
        const scaler = new SpoonScaler('tsp', { preferTablespoons: false });
        // 4 tsp > maxTeaspoons of 3, so converts to Tbsp
        expect(scaler.scale(1 as Measurement, 4.0)).toSucceedAndSatisfy((result) => {
          expect(result.unit).toBe('Tbsp');
        });
      });

      test('maxTeaspoons controls conversion threshold', () => {
        const scaler = new SpoonScaler('tsp', { preferTablespoons: false, maxTeaspoons: 6 });
        // 4 tsp < maxTeaspoons of 6 and preferTablespoons is false, stays in tsp
        expect(scaler.scale(1 as Measurement, 4.0)).toSucceedAndSatisfy((result) => {
          expect(result.unit).toBe('tsp');
          expect(result.displayValue).toBe('4 tsp');
        });
      });
    });

    describe('fractional display', () => {
      const scaler = new SpoonScaler('tsp');

      test('shows 1/4 tsp', () => {
        expect(scaler.scale(1 as Measurement, 0.25)).toSucceedAndSatisfy((result) => {
          expect(result.displayValue).toBe('1/4 tsp');
        });
      });

      test('shows 1/3 tsp', () => {
        expect(scaler.scale(1 as Measurement, 1 / 3)).toSucceedAndSatisfy((result) => {
          expect(result.displayValue).toBe('1/3 tsp');
        });
      });

      test('shows 3/4 tsp', () => {
        expect(scaler.scale(1 as Measurement, 0.75)).toSucceedAndSatisfy((result) => {
          expect(result.displayValue).toBe('3/4 tsp');
        });
      });

      test('shows 2/3 tsp', () => {
        expect(scaler.scale(1 as Measurement, 2 / 3)).toSucceedAndSatisfy((result) => {
          expect(result.displayValue).toBe('2/3 tsp');
        });
      });

      test('shows 1/8 tsp for very small amounts', () => {
        expect(scaler.scale(1 as Measurement, 0.01)).toSucceedAndSatisfy((result) => {
          expect(result.displayValue).toBe('1/8 tsp');
        });
      });

      test('shows closest fraction for amounts near whole numbers', () => {
        // 1.875 tsp -> fractional part 0.875 -> closest to 7/8, so displays as 1 7/8 tsp
        expect(scaler.scale(1 as Measurement, 1.875)).toSucceedAndSatisfy((result) => {
          expect(result.displayValue).toBe('1 7/8 tsp');
        });
      });

      test('rounds fractional part > 0.9375 to whole number', () => {
        // 1.94 -> fractional part 0.94 > 0.9375, rounds to 2 whole
        expect(scaler.scale(1 as Measurement, 1.94)).toSucceedAndSatisfy((result) => {
          expect(result.displayValue).toBe('2 tsp');
        });
      });
    });
  });

  // ============================================================================
  // UnitScalerRegistry Tests
  // ============================================================================

  describe('UnitScalerRegistry', () => {
    describe('getScaler', () => {
      const registry = new UnitScalerRegistry();

      test('returns LinearScaler for grams', () => {
        const scaler = registry.getScaler('g');
        expect(scaler.supportsScaling).toBe(true);
        expect(scaler.scale(100 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
          expect(result.unit).toBe('g');
        });
      });

      test('returns LinearScaler for milliliters', () => {
        const scaler = registry.getScaler('mL');
        expect(scaler.scale(100 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
          expect(result.unit).toBe('mL');
        });
      });

      test('returns SpoonScaler for teaspoons', () => {
        const scaler = registry.getScaler('tsp');
        expect(scaler.scale(1 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
          expect(result.unit).toBe('tsp');
        });
      });

      test('returns SpoonScaler for tablespoons', () => {
        const scaler = registry.getScaler('Tbsp');
        expect(scaler.scale(1 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
          expect(result.unit).toBe('Tbsp');
        });
      });

      test('returns PinchScaler for pinch', () => {
        const scaler = registry.getScaler('pinch');
        expect(scaler.supportsScaling).toBe(false);
      });

      test('returns LinearScaler for seeds', () => {
        const scaler = registry.getScaler('seeds');
        expect(scaler.supportsScaling).toBe(true);
        expect(scaler.scale(5 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
          expect(result.unit).toBe('seeds');
          expect(result.value).toBe(5);
          expect(result.displayValue).toBe('5 seeds');
        });
      });

      test('returns LinearScaler for pods', () => {
        const scaler = registry.getScaler('pods');
        expect(scaler.supportsScaling).toBe(true);
        expect(scaler.scale(2 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
          expect(result.unit).toBe('pods');
          expect(result.value).toBe(2);
          expect(result.displayValue).toBe('2 pods');
        });
      });

      test('returns default LinearScaler for unknown unit', () => {
        // Test defensive fallback for unknown units (requires type coercion)
        const scaler = registry.getScaler('oz' as unknown as 'g');
        expect(scaler.supportsScaling).toBe(true);
        // Default scaler uses 'g' unit
        expect(scaler.scale(100 as Measurement, 1.0)).toSucceedAndSatisfy((result) => {
          expect(result.unit).toBe('g');
        });
      });
    });

    describe('supportsScaling', () => {
      const registry = new UnitScalerRegistry();

      test('returns true for grams', () => {
        expect(registry.supportsScaling('g')).toBe(true);
      });

      test('returns true for milliliters', () => {
        expect(registry.supportsScaling('mL')).toBe(true);
      });

      test('returns true for teaspoons', () => {
        expect(registry.supportsScaling('tsp')).toBe(true);
      });

      test('returns true for tablespoons', () => {
        expect(registry.supportsScaling('Tbsp')).toBe(true);
      });

      test('returns false for pinch', () => {
        expect(registry.supportsScaling('pinch')).toBe(false);
      });

      test('returns true for seeds', () => {
        expect(registry.supportsScaling('seeds')).toBe(true);
      });

      test('returns true for pods', () => {
        expect(registry.supportsScaling('pods')).toBe(true);
      });
    });

    describe('scale', () => {
      const registry = new UnitScalerRegistry();

      test('scales grams correctly', () => {
        expect(registry.scale(100 as Measurement, 'g', 2.0)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(200);
          expect(result.unit).toBe('g');
        });
      });

      test('scales milliliters correctly', () => {
        expect(registry.scale(50 as Measurement, 'mL', 2.0)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(100);
          expect(result.unit).toBe('mL');
        });
      });

      test('scales teaspoons correctly', () => {
        expect(registry.scale(1 as Measurement, 'tsp', 2.0)).toSucceedAndSatisfy((result) => {
          expect(result.unit).toBe('tsp');
        });
      });

      test('does not scale pinch', () => {
        expect(registry.scale(1 as Measurement, 'pinch', 2.0)).toSucceedAndSatisfy((result) => {
          expect(result.value).toBe(1);
          expect(result.scalable).toBe(false);
        });
      });
    });
  });

  // ============================================================================
  // Default Registry and Helper Functions
  // ============================================================================

  describe('defaultScalerRegistry', () => {
    test('is a UnitScalerRegistry instance', () => {
      expect(defaultScalerRegistry).toBeInstanceOf(UnitScalerRegistry);
    });

    test('has all standard scalers registered', () => {
      expect(defaultScalerRegistry.supportsScaling('g')).toBe(true);
      expect(defaultScalerRegistry.supportsScaling('mL')).toBe(true);
      expect(defaultScalerRegistry.supportsScaling('tsp')).toBe(true);
      expect(defaultScalerRegistry.supportsScaling('Tbsp')).toBe(true);
      expect(defaultScalerRegistry.supportsScaling('pinch')).toBe(false);
    });
  });

  describe('supportsScaling helper', () => {
    test('returns true for scalable units', () => {
      expect(supportsScaling('g')).toBe(true);
      expect(supportsScaling('mL')).toBe(true);
      expect(supportsScaling('tsp')).toBe(true);
      expect(supportsScaling('Tbsp')).toBe(true);
    });

    test('returns false for pinch', () => {
      expect(supportsScaling('pinch')).toBe(false);
    });
  });

  describe('scaleAmount helper', () => {
    test('scales grams correctly', () => {
      expect(scaleAmount(100 as Measurement, 'g', 2.0)).toSucceedAndSatisfy((result) => {
        expect(result.value).toBe(200);
        expect(result.unit).toBe('g');
        expect(result.displayValue).toBe('200g');
      });
    });

    test('scales teaspoons correctly', () => {
      expect(scaleAmount(1 as Measurement, 'tsp', 1.5)).toSucceedAndSatisfy((result) => {
        expect(result.displayValue).toBe('1 1/2 tsp');
      });
    });

    test('handles pinch correctly', () => {
      expect(scaleAmount(1 as Measurement, 'pinch', 2.0)).toSucceedAndSatisfy((result) => {
        expect(result.value).toBe(1);
        expect(result.scalable).toBe(false);
      });
    });

    test('fails with invalid factor', () => {
      expect(scaleAmount(100 as Measurement, 'g', 0)).toFailWith(/greater than zero/);
    });
  });
});
