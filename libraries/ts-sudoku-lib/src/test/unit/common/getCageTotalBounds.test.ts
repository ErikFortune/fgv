/*
 * MIT License
 *
 * Copyright (c) 2023 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { getCageTotalBounds } from '../../../packlets/common';

describe('getCageTotalBounds', () => {
  describe('standard 9x9 Sudoku cases', () => {
    test('returns correct bounds for single cell cage', () => {
      const result = getCageTotalBounds(1, 9);
      expect(result).toEqual({ min: 1, max: 9 });
    });

    test('returns correct bounds for two cell cage', () => {
      const result = getCageTotalBounds(2, 9);
      expect(result).toEqual({ min: 3, max: 17 }); // min: 1+2, max: 9+8
    });

    test('returns correct bounds for three cell cage', () => {
      const result = getCageTotalBounds(3, 9);
      expect(result).toEqual({ min: 6, max: 24 }); // min: 1+2+3, max: 9+8+7
    });

    test('returns correct bounds for four cell cage', () => {
      const result = getCageTotalBounds(4, 9);
      expect(result).toEqual({ min: 10, max: 30 }); // min: 1+2+3+4, max: 9+8+7+6
    });

    test('returns correct bounds for five cell cage', () => {
      const result = getCageTotalBounds(5, 9);
      expect(result).toEqual({ min: 15, max: 35 }); // min: 1+2+3+4+5, max: 9+8+7+6+5
    });

    test('returns correct bounds for six cell cage', () => {
      const result = getCageTotalBounds(6, 9);
      expect(result).toEqual({ min: 21, max: 39 }); // min: 1+2+3+4+5+6, max: 9+8+7+6+5+4
    });

    test('returns correct bounds for seven cell cage', () => {
      const result = getCageTotalBounds(7, 9);
      expect(result).toEqual({ min: 28, max: 42 }); // min: 1+2+3+4+5+6+7, max: 9+8+7+6+5+4+3
    });

    test('returns correct bounds for eight cell cage', () => {
      const result = getCageTotalBounds(8, 9);
      expect(result).toEqual({ min: 36, max: 44 }); // min: 1+2+3+4+5+6+7+8, max: 9+8+7+6+5+4+3+2
    });

    test('returns correct bounds for nine cell cage', () => {
      const result = getCageTotalBounds(9, 9);
      expect(result).toEqual({ min: 45, max: 45 }); // min: 1+2+3+4+5+6+7+8+9, max: same
    });
  });

  describe('4x4 Sudoku cases', () => {
    test('returns correct bounds for single cell cage in 4x4', () => {
      const result = getCageTotalBounds(1, 4);
      expect(result).toEqual({ min: 1, max: 4 });
    });

    test('returns correct bounds for two cell cage in 4x4', () => {
      const result = getCageTotalBounds(2, 4);
      expect(result).toEqual({ min: 3, max: 7 }); // min: 1+2, max: 4+3
    });

    test('returns correct bounds for three cell cage in 4x4', () => {
      const result = getCageTotalBounds(3, 4);
      expect(result).toEqual({ min: 6, max: 9 }); // min: 1+2+3, max: 4+3+2
    });

    test('returns correct bounds for four cell cage in 4x4', () => {
      const result = getCageTotalBounds(4, 4);
      expect(result).toEqual({ min: 10, max: 10 }); // min: 1+2+3+4, max: same
    });
  });

  describe('6x6 Sudoku cases', () => {
    test('returns correct bounds for single cell cage in 6x6', () => {
      const result = getCageTotalBounds(1, 6);
      expect(result).toEqual({ min: 1, max: 6 });
    });

    test('returns correct bounds for three cell cage in 6x6', () => {
      const result = getCageTotalBounds(3, 6);
      expect(result).toEqual({ min: 6, max: 15 }); // min: 1+2+3, max: 6+5+4
    });

    test('returns correct bounds for six cell cage in 6x6', () => {
      const result = getCageTotalBounds(6, 6);
      expect(result).toEqual({ min: 21, max: 21 }); // min: 1+2+3+4+5+6, max: same
    });
  });

  describe('12x12 Sudoku cases', () => {
    test('returns correct bounds for single cell cage in 12x12', () => {
      const result = getCageTotalBounds(1, 12);
      expect(result).toEqual({ min: 1, max: 12 });
    });

    test('returns correct bounds for six cell cage in 12x12', () => {
      const result = getCageTotalBounds(6, 12);
      expect(result).toEqual({ min: 21, max: 57 }); // min: 1+2+3+4+5+6, max: 12+11+10+9+8+7
    });

    test('returns correct bounds for twelve cell cage in 12x12', () => {
      const result = getCageTotalBounds(12, 12);
      expect(result).toEqual({ min: 78, max: 78 }); // min: 1+2+...+12, max: same
    });
  });

  describe('16x16 Sudoku cases', () => {
    test('returns correct bounds for single cell cage in 16x16', () => {
      const result = getCageTotalBounds(1, 16);
      expect(result).toEqual({ min: 1, max: 16 });
    });

    test('returns correct bounds for eight cell cage in 16x16', () => {
      const result = getCageTotalBounds(8, 16);
      expect(result).toEqual({ min: 36, max: 100 }); // min: 1+2+...+8, max: 16+15+...+9
    });

    test('returns correct bounds for sixteen cell cage in 16x16', () => {
      const result = getCageTotalBounds(16, 16);
      expect(result).toEqual({ min: 136, max: 136 }); // min: 1+2+...+16, max: same
    });
  });

  describe('edge cases with cage size exceeding maxValue', () => {
    test('handles cage size larger than maxValue (should use effective cage size)', () => {
      // A 10-cell cage in a 9x9 puzzle - impossible in practice
      // Should cap at maxValue (9 cells)
      const result = getCageTotalBounds(10, 9);
      expect(result).toEqual({ min: 55, max: 45 }); // min: 1+2+...+10=55, max: 9+8+...+1=45
    });

    test('handles cage size much larger than maxValue', () => {
      const result = getCageTotalBounds(20, 9);
      expect(result).toEqual({ min: 210, max: 45 }); // min: 1+2+...+20=210, max: capped at 9
    });

    test('handles cage size larger than maxValue for smaller grids', () => {
      const result = getCageTotalBounds(8, 4);
      expect(result).toEqual({ min: 36, max: 10 }); // min: 1+2+...+8=36, max: capped at 4
    });
  });

  describe('edge cases with zero and negative values', () => {
    test('returns zero bounds for cage size of zero', () => {
      const result = getCageTotalBounds(0, 9);
      expect(result).toEqual({ min: 0, max: 0 });
    });

    test('returns zero bounds for negative cage size', () => {
      const result = getCageTotalBounds(-1, 9);
      expect(result).toEqual({ min: 0, max: 0 });
    });

    test('returns zero bounds for negative cage size with small maxValue', () => {
      const result = getCageTotalBounds(-5, 4);
      expect(result).toEqual({ min: 0, max: 0 });
    });

    test('returns zero bounds for non-positive cage size with 12x12', () => {
      expect(getCageTotalBounds(0, 12)).toEqual({ min: 0, max: 0 });
      expect(getCageTotalBounds(-1, 12)).toEqual({ min: 0, max: 0 });
      expect(getCageTotalBounds(-5, 12)).toEqual({ min: 0, max: 0 });
    });
  });

  describe('edge cases with zero and negative maxValue', () => {
    test('handles zero maxValue with valid cage size', () => {
      const result = getCageTotalBounds(3, 0);
      expect(result).toEqual({ min: 6, max: 0 }); // min: 1+2+3=6, max: 0 (no valid cells)
    });

    test('handles negative maxValue with valid cage size', () => {
      const result = getCageTotalBounds(3, -1);
      expect(result).toEqual({ min: 6, max: 0 }); // min: 1+2+3=6, max: 0 (no valid cells)
    });

    test('handles both zero cage size and zero maxValue', () => {
      const result = getCageTotalBounds(0, 0);
      expect(result).toEqual({ min: 0, max: 0 });
    });
  });

  describe('unusual but valid grid sizes', () => {
    test('handles 25x25 grid (single cell)', () => {
      const result = getCageTotalBounds(1, 25);
      expect(result).toEqual({ min: 1, max: 25 });
    });

    test('handles 25x25 grid (full row)', () => {
      const result = getCageTotalBounds(25, 25);
      expect(result).toEqual({ min: 325, max: 325 }); // sum from 1 to 25
    });

    test('handles 2x2 grid', () => {
      const result = getCageTotalBounds(2, 2);
      expect(result).toEqual({ min: 3, max: 3 }); // 1+2
    });

    test('handles 3x3 grid', () => {
      const result = getCageTotalBounds(3, 3);
      expect(result).toEqual({ min: 6, max: 6 }); // 1+2+3
    });
  });

  describe('mathematical formula verification', () => {
    test('minimum follows arithmetic progression formula n(n+1)/2', () => {
      const testCases = [
        { cageSize: 5, expected: 15 },
        { cageSize: 7, expected: 28 },
        { cageSize: 10, expected: 55 }
      ];

      testCases.forEach(({ cageSize, expected }) => {
        const result = getCageTotalBounds(cageSize, 20); // maxValue large enough
        expect(result.min).toBe(expected);
        expect(result.min).toBe((cageSize * (cageSize + 1)) / 2);
      });
    });

    test('maximum follows formula when cage size equals maxValue', () => {
      const testCases = [
        { maxValue: 4, expected: 10 },
        { maxValue: 6, expected: 21 },
        { maxValue: 9, expected: 45 }
      ];

      testCases.forEach(({ maxValue, expected }) => {
        const result = getCageTotalBounds(maxValue, maxValue);
        expect(result.max).toBe(expected);
        expect(result.min).toBe(expected); // When cage size equals maxValue, min equals max
      });
    });

    test('maximum uses effective cage size when cage exceeds maxValue', () => {
      // For cage size 5, maxValue 3: should use top 3 values (3+2+1=6)
      const result = getCageTotalBounds(5, 3);
      expect(result.max).toBe(6); // 3+2+1
      expect(result.min).toBe(15); // 1+2+3+4+5 (actual cage size)
    });
  });

  describe('consistency checks', () => {
    test('min is always greater than or equal to max when cage size exceeds maxValue', () => {
      const cases = [
        { cageSize: 10, maxValue: 9 },
        { cageSize: 15, maxValue: 9 },
        { cageSize: 20, maxValue: 12 }
      ];

      cases.forEach(({ cageSize, maxValue }) => {
        const result = getCageTotalBounds(cageSize, maxValue);
        // When cage size > maxValue, this is impossible so min > max
        expect(result.min).toBeGreaterThan(result.max);
      });
    });

    test('min equals max when cage size equals maxValue', () => {
      const testValues = [4, 6, 9, 12, 16, 25];

      testValues.forEach((value) => {
        const result = getCageTotalBounds(value, value);
        expect(result.min).toBe(result.max);
      });
    });

    test('min is less than max for valid cage sizes smaller than maxValue', () => {
      const cases = [
        { cageSize: 2, maxValue: 9 },
        { cageSize: 5, maxValue: 9 },
        { cageSize: 4, maxValue: 12 },
        { cageSize: 8, maxValue: 16 }
      ];

      cases.forEach(({ cageSize, maxValue }) => {
        const result = getCageTotalBounds(cageSize, maxValue);
        expect(result.min).toBeLessThan(result.max);
      });
    });
  });
});
