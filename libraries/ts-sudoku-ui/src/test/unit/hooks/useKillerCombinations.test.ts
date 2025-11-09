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

import { renderHook } from '@testing-library/react';
import '@fgv/ts-utils-jest';
import { useKillerCombinations } from '../../../hooks/useKillerCombinations';
import { ICage } from '@fgv/ts-sudoku-lib';

describe('useKillerCombinations', () => {
  const createMockKillerCage = (numCells: number, total: number): ICage => ({
    id: `killer-cage-${numCells}-${total}` as unknown as ICage['id'],
    cageType: 'killer',
    numCells,
    total,
    cellIds: Array.from({ length: numCells }, (__unused, i) => `cell-${i}` as unknown as ICage['cellIds'][0]),
    containsCell: jest.fn(() => false)
  });

  const createMockNonKillerCage = (): ICage => ({
    id: 'non-killer-cage' as unknown as ICage['id'],
    cageType: 'row',
    numCells: 2,
    total: 0,
    cellIds: ['cell-0', 'cell-1'] as unknown as ICage['cellIds'],
    containsCell: jest.fn(() => false)
  });

  describe('with null cage', () => {
    test('should fail when no cage is selected', () => {
      const { result } = renderHook(() => useKillerCombinations(null));

      expect(result.current).toFailWith(/no cage selected/i);
    });
  });

  describe('with non-killer cage', () => {
    test('should fail when cage is not a killer cage', () => {
      const nonKillerCage = createMockNonKillerCage();
      const { result } = renderHook(() => useKillerCombinations(nonKillerCage));

      expect(result.current).toFailWith(/not a killer cage/i);
    });
  });

  describe('with killer cage missing total', () => {
    test('should fail when killer cage does not have a total', () => {
      const cageWithoutTotal: ICage = {
        id: 'killer-cage-no-total' as unknown as ICage['id'],
        cageType: 'killer',
        numCells: 2,
        total: 0,
        cellIds: ['cell-0', 'cell-1'] as unknown as ICage['cellIds'],
        containsCell: jest.fn(() => false)
      };

      // Set total to undefined to test missing total handling
      (cageWithoutTotal as { total?: number }).total = undefined;

      const { result } = renderHook(() => useKillerCombinations(cageWithoutTotal));

      expect(result.current).toFailWith(/does not have a total/i);
    });
  });

  describe('with valid killer cage', () => {
    test('should return combinations for a 2-cell cage with sum 3', () => {
      const cage = createMockKillerCage(2, 3);
      const { result } = renderHook(() => useKillerCombinations(cage));

      expect(result.current).toSucceedAndSatisfy((combos) => {
        expect(combos).toHaveLength(1);
        expect(combos[0].combination).toEqual([1, 2]);
        expect(combos[0].signature).toBe('1,2');
        expect(combos[0].isEliminated).toBe(false);
      });
    });

    test('should return combinations for a 2-cell cage with sum 5', () => {
      const cage = createMockKillerCage(2, 5);
      const { result } = renderHook(() => useKillerCombinations(cage));

      expect(result.current).toSucceedAndSatisfy((combos) => {
        expect(combos.length).toBeGreaterThan(1);

        // Should include [1,4] and [2,3]
        const signatures = combos.map((c) => c.signature);
        expect(signatures).toContain('1,4');
        expect(signatures).toContain('2,3');

        // All should not be eliminated initially
        combos.forEach((combo) => {
          expect(combo.isEliminated).toBe(false);
        });
      });
    });

    test('should return combinations for a 3-cell cage with sum 6', () => {
      const cage = createMockKillerCage(3, 6);
      const { result } = renderHook(() => useKillerCombinations(cage));

      expect(result.current).toSucceedAndSatisfy((combos) => {
        expect(combos).toHaveLength(1);
        expect(combos[0].combination).toEqual([1, 2, 3]);
        expect(combos[0].signature).toBe('1,2,3');
      });
    });

    test('should return combinations for a 3-cell cage with sum 15', () => {
      const cage = createMockKillerCage(3, 15);
      const { result } = renderHook(() => useKillerCombinations(cage));

      expect(result.current).toSucceedAndSatisfy((combos) => {
        expect(combos.length).toBeGreaterThan(1);

        // Should include various combinations like [1,5,9], [1,6,8], [2,4,9], etc.
        const signatures = combos.map((c) => c.signature);
        expect(signatures).toContain('1,5,9');
        expect(signatures).toContain('2,4,9');
        expect(signatures).toContain('1,6,8');
      });
    });

    test('should generate correct signatures for all combinations', () => {
      const cage = createMockKillerCage(2, 10);
      const { result } = renderHook(() => useKillerCombinations(cage));

      expect(result.current).toSucceedAndSatisfy((combos) => {
        combos.forEach((combo) => {
          // Signature should be sorted comma-separated numbers
          const sorted = [...combo.combination].sort((a, b) => a - b);
          expect(combo.signature).toBe(sorted.join(','));

          // Verify signature matches combination sum
          const sum = combo.combination.reduce((a, b) => a + b, 0);
          expect(sum).toBe(10);
        });
      });
    });

    test('should return unique signatures for all combinations', () => {
      const cage = createMockKillerCage(3, 12);
      const { result } = renderHook(() => useKillerCombinations(cage));

      expect(result.current).toSucceedAndSatisfy((combos) => {
        const signatures = combos.map((c) => c.signature);
        const uniqueSignatures = new Set(signatures);
        expect(signatures.length).toBe(uniqueSignatures.size);
      });
    });

    test('should set all combinations as not eliminated initially', () => {
      const cage = createMockKillerCage(2, 7);
      const { result } = renderHook(() => useKillerCombinations(cage));

      expect(result.current).toSucceedAndSatisfy((combos) => {
        combos.forEach((combo) => {
          expect(combo.isEliminated).toBe(false);
        });
      });
    });
  });

  describe('memoization', () => {
    test('should memoize result when cage does not change', () => {
      const cage = createMockKillerCage(2, 5);
      const { result, rerender } = renderHook(({ cage }) => useKillerCombinations(cage), {
        initialProps: { cage }
      });

      const firstResult = result.current;
      expect(firstResult).toSucceed();

      rerender({ cage });

      expect(result.current).toBe(firstResult);
    });

    test('should recalculate when cage changes', () => {
      const cage1 = createMockKillerCage(2, 5);
      const cage2 = createMockKillerCage(2, 7);

      const { result, rerender } = renderHook(({ cage }) => useKillerCombinations(cage), {
        initialProps: { cage: cage1 }
      });

      const firstResult = result.current;
      expect(firstResult).toSucceed();

      rerender({ cage: cage2 });

      expect(result.current).not.toBe(firstResult);
      expect(result.current).toSucceedAndSatisfy((combos) => {
        // Sum 7 has different combinations than sum 5
        const has25 = combos.some((c) => c.signature === '2,5');
        expect(has25).toBe(true);
      });
    });

    test('should recalculate when cage becomes null', () => {
      const cage = createMockKillerCage(2, 5);

      const { result, rerender } = renderHook(
        ({ cage }: { cage: ICage | null }) => useKillerCombinations(cage),
        { initialProps: { cage: cage as ICage | null } }
      );

      expect(result.current).toSucceed();

      rerender({ cage: null });

      expect(result.current).toFailWith(/no cage selected/i);
    });
  });

  describe('edge cases', () => {
    test('should handle large cages', () => {
      const cage = createMockKillerCage(4, 20);
      const { result } = renderHook(() => useKillerCombinations(cage));

      expect(result.current).toSucceedAndSatisfy((combos) => {
        expect(combos.length).toBeGreaterThan(0);

        // Verify all combinations have 4 numbers
        combos.forEach((combo) => {
          expect(combo.combination).toHaveLength(4);
        });
      });
    });

    test('should handle minimum sum for cage size', () => {
      const cage = createMockKillerCage(3, 6); // Minimum sum for 3 cells is 1+2+3=6
      const { result } = renderHook(() => useKillerCombinations(cage));

      expect(result.current).toSucceedAndSatisfy((combos) => {
        expect(combos).toHaveLength(1);
        expect(combos[0].combination).toEqual([1, 2, 3]);
      });
    });

    test('should handle maximum sum for cage size', () => {
      const cage = createMockKillerCage(3, 24); // Maximum sum for 3 cells is 7+8+9=24
      const { result } = renderHook(() => useKillerCombinations(cage));

      expect(result.current).toSucceedAndSatisfy((combos) => {
        expect(combos).toHaveLength(1);
        expect(combos[0].combination).toEqual([7, 8, 9]);
      });
    });

    test('should handle impossible sums', () => {
      const cage = createMockKillerCage(2, 20); // Impossible: max for 2 cells is 8+9=17
      const { result } = renderHook(() => useKillerCombinations(cage));

      // Should either fail or return empty array
      if (result.current.isSuccess()) {
        expect(result.current.value).toHaveLength(0);
      }
    });
  });
});
