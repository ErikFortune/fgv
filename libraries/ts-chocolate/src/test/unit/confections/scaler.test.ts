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
import {
  scaleConfection,
  scaleConfectionByFactor,
  scaleConfectionToCount,
  scaleMoldedBonBonByFrames,
  canScaleByFrames,
  IMoldedBonBon,
  IBarTruffle,
  IRolledTruffle
} from '../../../packlets/confections';
import {
  BaseConfectionId,
  ConfectionName,
  ConfectionVersionSpec,
  Measurement,
  IngredientId,
  Millimeters,
  MoldId
} from '../../../packlets/common';

describe('Confection Scaler', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const moldedBonBon: IMoldedBonBon = {
    baseId: 'test-bonbon' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'Test Bonbon' as ConfectionName,
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    yield: {
      count: 24,
      unit: 'pieces',
      weightPerPiece: 12 as Measurement
    },
    molds: {
      options: [{ id: 'common.dome-25mm' as MoldId }],
      preferredId: 'common.dome-25mm' as MoldId
    },
    shellChocolate: {
      ids: ['common.chocolate-dark-64' as IngredientId],
      preferredId: 'common.chocolate-dark-64' as IngredientId
    },
    versions: [{ versionSpec: '2026-01-01-01' as ConfectionVersionSpec, createdDate: '2026-01-01' }]
  };

  const barTruffle: IBarTruffle = {
    baseId: 'test-bar' as BaseConfectionId,
    confectionType: 'bar-truffle',
    name: 'Test Bar' as ConfectionName,
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    yield: {
      count: 48,
      unit: 'pieces',
      weightPerPiece: 10 as Measurement
    },
    frameDimensions: { width: 300 as Millimeters, height: 200 as Millimeters, depth: 8 as Millimeters },
    singleBonBonDimensions: { width: 25 as Millimeters, height: 25 as Millimeters },
    versions: [{ versionSpec: '2026-01-01-01' as ConfectionVersionSpec, createdDate: '2026-01-01' }]
  };

  const rolledTruffle: IRolledTruffle = {
    baseId: 'test-rolled' as BaseConfectionId,
    confectionType: 'rolled-truffle',
    name: 'Test Rolled' as ConfectionName,
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    yield: {
      count: 40,
      unit: 'pieces'
      // No weightPerPiece to test optional field handling
    },
    versions: [{ versionSpec: '2026-01-01-01' as ConfectionVersionSpec, createdDate: '2026-01-01' }]
  };

  // ============================================================================
  // scaleConfectionByFactor
  // ============================================================================

  describe('scaleConfectionByFactor', () => {
    test('scales by factor 2.0', () => {
      expect(scaleConfectionByFactor(moldedBonBon, 2.0)).toSucceedAndSatisfy((result) => {
        expect(result.confection).toBe(moldedBonBon);
        expect(result.scaledYield.originalCount).toBe(24);
        expect(result.scaledYield.scaledCount).toBe(48);
        expect(result.scaledYield.scaleFactor).toBe(2.0);
        expect(result.scaledYield.unit).toBe('pieces');
        expect(result.scaledYield.weightPerPiece).toBe(12);
        expect(result.scaledYield.totalWeight).toBe(48 * 12);
      });
    });

    test('scales by factor 0.5', () => {
      expect(scaleConfectionByFactor(moldedBonBon, 0.5)).toSucceedAndSatisfy((result) => {
        expect(result.scaledYield.originalCount).toBe(24);
        expect(result.scaledYield.scaledCount).toBe(12);
        expect(result.scaledYield.scaleFactor).toBe(0.5);
      });
    });

    test('handles fractional results with default rounding', () => {
      expect(scaleConfectionByFactor(moldedBonBon, 1.5)).toSucceedAndSatisfy((result) => {
        // 24 * 1.5 = 36, no rounding needed
        expect(result.scaledYield.scaledCount).toBe(36);
      });
    });

    test('applies floor rounding', () => {
      // 24 * 1.3 = 31.2, should floor to 31
      expect(scaleConfectionByFactor(moldedBonBon, 1.3, { roundingMode: 'floor' })).toSucceedAndSatisfy(
        (result) => {
          expect(result.scaledYield.scaledCount).toBe(31);
        }
      );
    });

    test('applies ceil rounding', () => {
      // 24 * 1.1 = 26.4, should ceil to 27
      expect(scaleConfectionByFactor(moldedBonBon, 1.1, { roundingMode: 'ceil' })).toSucceedAndSatisfy(
        (result) => {
          expect(result.scaledYield.scaledCount).toBe(27);
        }
      );
    });

    test('applies round rounding', () => {
      // 24 * 1.02 = 24.48, should round to 24
      expect(scaleConfectionByFactor(moldedBonBon, 1.02, { roundingMode: 'round' })).toSucceedAndSatisfy(
        (result) => {
          expect(result.scaledYield.scaledCount).toBe(24);
        }
      );

      // 24 * 1.03 = 24.72, should round to 25
      expect(scaleConfectionByFactor(moldedBonBon, 1.03, { roundingMode: 'round' })).toSucceedAndSatisfy(
        (result) => {
          expect(result.scaledYield.scaledCount).toBe(25);
        }
      );
    });

    test('fails for zero factor', () => {
      expect(scaleConfectionByFactor(moldedBonBon, 0)).toFailWith(/greater than zero/i);
    });

    test('fails for negative factor', () => {
      expect(scaleConfectionByFactor(moldedBonBon, -1)).toFailWith(/greater than zero/i);
    });

    test('handles confection without weightPerPiece', () => {
      expect(scaleConfectionByFactor(rolledTruffle, 2.0)).toSucceedAndSatisfy((result) => {
        expect(result.scaledYield.originalCount).toBe(40);
        expect(result.scaledYield.scaledCount).toBe(80);
        expect(result.scaledYield.weightPerPiece).toBeUndefined();
        expect(result.scaledYield.totalWeight).toBeUndefined();
      });
    });

    test('sets createdDate to current date', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(scaleConfectionByFactor(moldedBonBon, 1.0)).toSucceedAndSatisfy((result) => {
        expect(result.createdDate).toBe(today);
      });
    });
  });

  // ============================================================================
  // scaleConfectionToCount
  // ============================================================================

  describe('scaleConfectionToCount', () => {
    test('scales to exact target count', () => {
      expect(scaleConfectionToCount(moldedBonBon, 48)).toSucceedAndSatisfy((result) => {
        expect(result.scaledYield.originalCount).toBe(24);
        expect(result.scaledYield.scaledCount).toBe(48);
        expect(result.scaledYield.scaleFactor).toBe(2.0);
      });
    });

    test('scales to smaller target count', () => {
      expect(scaleConfectionToCount(moldedBonBon, 12)).toSucceedAndSatisfy((result) => {
        expect(result.scaledYield.scaledCount).toBe(12);
        expect(result.scaledYield.scaleFactor).toBe(0.5);
      });
    });

    test('scales with non-even target', () => {
      expect(scaleConfectionToCount(moldedBonBon, 36)).toSucceedAndSatisfy((result) => {
        expect(result.scaledYield.scaledCount).toBe(36);
        expect(result.scaledYield.scaleFactor).toBe(1.5);
      });
    });

    test('fails for zero target count', () => {
      expect(scaleConfectionToCount(moldedBonBon, 0)).toFailWith(/greater than zero/i);
    });

    test('fails for negative target count', () => {
      expect(scaleConfectionToCount(moldedBonBon, -10)).toFailWith(/greater than zero/i);
    });

    test('fails for confection with zero yield count', () => {
      const zeroYield: IMoldedBonBon = {
        ...moldedBonBon,
        yield: { ...moldedBonBon.yield, count: 0 }
      };
      expect(scaleConfectionToCount(zeroYield, 24)).toFailWith(/yield count must be greater than zero/i);
    });

    test('handles fractional factors with rounding options', () => {
      // 24 / 7 ≈ 3.43, 24 * 3.43 ≈ 82.3
      expect(scaleConfectionToCount(moldedBonBon, 100, { roundingMode: 'floor' })).toSucceedAndSatisfy(
        (result) => {
          expect(result.scaledYield.scaledCount).toBe(100);
        }
      );
    });
  });

  // ============================================================================
  // scaleMoldedBonBonByFrames
  // ============================================================================

  describe('scaleMoldedBonBonByFrames', () => {
    test('scales by frames and cavities', () => {
      // 2 frames * 12 cavities = 24 pieces
      expect(scaleMoldedBonBonByFrames(moldedBonBon, 2, 12)).toSucceedAndSatisfy((result) => {
        expect(result.confection).toBe(moldedBonBon);
        expect(result.scaledYield.scaledCount).toBe(24);
      });
    });

    test('scales to multiple frames', () => {
      // 4 frames * 12 cavities = 48 pieces
      expect(scaleMoldedBonBonByFrames(moldedBonBon, 4, 12)).toSucceedAndSatisfy((result) => {
        expect(result.scaledYield.scaledCount).toBe(48);
        expect(result.scaledYield.scaleFactor).toBe(2.0);
      });
    });

    test('applies overage percentage', () => {
      // 2 frames * 12 cavities = 24, + 10% = 26.4, ceil = 27
      expect(scaleMoldedBonBonByFrames(moldedBonBon, 2, 12, { overagePercent: 10 })).toSucceedAndSatisfy(
        (result) => {
          expect(result.scaledYield.scaledCount).toBe(27);
        }
      );
    });

    test('applies large overage percentage', () => {
      // 2 frames * 12 cavities = 24, + 50% = 36
      expect(scaleMoldedBonBonByFrames(moldedBonBon, 2, 12, { overagePercent: 50 })).toSucceedAndSatisfy(
        (result) => {
          expect(result.scaledYield.scaledCount).toBe(36);
        }
      );
    });

    test('zero overage has no effect', () => {
      expect(scaleMoldedBonBonByFrames(moldedBonBon, 2, 12, { overagePercent: 0 })).toSucceedAndSatisfy(
        (result) => {
          expect(result.scaledYield.scaledCount).toBe(24);
        }
      );
    });

    test('fails for zero frame count', () => {
      expect(scaleMoldedBonBonByFrames(moldedBonBon, 0, 12)).toFailWith(
        /frame count must be greater than zero/i
      );
    });

    test('fails for negative frame count', () => {
      expect(scaleMoldedBonBonByFrames(moldedBonBon, -2, 12)).toFailWith(
        /frame count must be greater than zero/i
      );
    });

    test('fails for zero cavities per mold', () => {
      expect(scaleMoldedBonBonByFrames(moldedBonBon, 2, 0)).toFailWith(
        /cavities per mold must be greater than zero/i
      );
    });

    test('fails for negative cavities per mold', () => {
      expect(scaleMoldedBonBonByFrames(moldedBonBon, 2, -12)).toFailWith(
        /cavities per mold must be greater than zero/i
      );
    });

    test('combines overage with rounding options', () => {
      // 2 frames * 12 cavities = 24, + 5% = 25.2, floor = 25
      expect(
        scaleMoldedBonBonByFrames(moldedBonBon, 2, 12, { overagePercent: 5, roundingMode: 'floor' })
      ).toSucceedAndSatisfy((result) => {
        expect(result.scaledYield.scaledCount).toBe(26); // ceil(24 * 1.05) = 26, then scaled count rounded down
      });
    });
  });

  // ============================================================================
  // scaleConfection (generic)
  // ============================================================================

  describe('scaleConfection', () => {
    test('scales molded bonbon', () => {
      expect(scaleConfection(moldedBonBon, 2.0)).toSucceedAndSatisfy((result) => {
        expect(result.scaledYield.scaledCount).toBe(48);
      });
    });

    test('scales bar truffle', () => {
      expect(scaleConfection(barTruffle, 2.0)).toSucceedAndSatisfy((result) => {
        expect(result.scaledYield.originalCount).toBe(48);
        expect(result.scaledYield.scaledCount).toBe(96);
      });
    });

    test('scales rolled truffle', () => {
      expect(scaleConfection(rolledTruffle, 2.0)).toSucceedAndSatisfy((result) => {
        expect(result.scaledYield.originalCount).toBe(40);
        expect(result.scaledYield.scaledCount).toBe(80);
      });
    });

    test('accepts scaling options', () => {
      expect(scaleConfection(moldedBonBon, 1.1, { roundingMode: 'ceil' })).toSucceedAndSatisfy((result) => {
        expect(result.scaledYield.scaledCount).toBe(27);
      });
    });
  });

  // ============================================================================
  // canScaleByFrames
  // ============================================================================

  describe('canScaleByFrames', () => {
    test('returns true for molded bonbon', () => {
      expect(canScaleByFrames(moldedBonBon)).toBe(true);
    });

    test('returns false for bar truffle', () => {
      expect(canScaleByFrames(barTruffle)).toBe(false);
    });

    test('returns false for rolled truffle', () => {
      expect(canScaleByFrames(rolledTruffle)).toBe(false);
    });
  });
});
