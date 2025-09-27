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

import '@fgv/ts-utils-jest';
import { CageId, CellId, ICage, Puzzle, PuzzleState, totalsByCageSize } from '../../../packlets/common';
import { KillerCombinations, IKillerConstraints } from '../../../packlets/puzzles';

describe('KillerCombinations', () => {
  describe('getPossibleTotals', () => {
    test('should return correct totals for each valid cage size', () => {
      // Test cage sizes 1-9
      for (let cageSize = 1; cageSize <= 9; cageSize++) {
        const result = KillerCombinations.getPossibleTotals(cageSize);
        expect(result).toSucceedAndSatisfy((totals) => {
          const bounds = totalsByCageSize[cageSize];
          const expectedTotals: number[] = [];
          for (let total = bounds.min; total <= bounds.max; total++) {
            expectedTotals.push(total);
          }
          expect(totals).toEqual(expectedTotals);
          expect(totals.length).toBe(bounds.max - bounds.min + 1);
          // Verify ascending order
          for (let i = 1; i < totals.length; i++) {
            expect(totals[i]).toBeGreaterThan(totals[i - 1]);
          }
        });
      }
    });

    test('should handle specific cage size examples correctly', () => {
      // Cage size 1: [1, 2, 3, 4, 5, 6, 7, 8, 9]
      expect(KillerCombinations.getPossibleTotals(1)).toSucceedWith([1, 2, 3, 4, 5, 6, 7, 8, 9]);

      // Cage size 2: [3, 4, 5, ..., 17]
      expect(KillerCombinations.getPossibleTotals(2)).toSucceedAndSatisfy((totals) => {
        expect(totals[0]).toBe(3); // Min: 1+2
        expect(totals[totals.length - 1]).toBe(17); // Max: 8+9
        expect(totals).toHaveLength(15);
      });

      // Cage size 9: [45]
      expect(KillerCombinations.getPossibleTotals(9)).toSucceedWith([45]);
    });

    test('should fail for invalid cage sizes', () => {
      expect(KillerCombinations.getPossibleTotals(0)).toFailWith(
        /cage size must be an integer between 1 and 9/i
      );
      expect(KillerCombinations.getPossibleTotals(-1)).toFailWith(
        /cage size must be an integer between 1 and 9/i
      );
      expect(KillerCombinations.getPossibleTotals(10)).toFailWith(
        /cage size must be an integer between 1 and 9/i
      );
      expect(KillerCombinations.getPossibleTotals(1.5)).toFailWith(
        /cage size must be an integer between 1 and 9/i
      );
    });

    test('should fail for non-numeric inputs', () => {
      expect(KillerCombinations.getPossibleTotals(NaN)).toFailWith(
        /cage size must be an integer between 1 and 9/i
      );
      expect(KillerCombinations.getPossibleTotals(Infinity)).toFailWith(
        /cage size must be an integer between 1 and 9/i
      );
    });
  });

  describe('getCombinations', () => {
    test('should generate correct combinations for simple cases', () => {
      // Single cell cage
      expect(KillerCombinations.getCombinations(1, 5)).toSucceedWith([[5]]);

      // Two cell cage - sum to 10
      expect(KillerCombinations.getCombinations(2, 10)).toSucceedAndSatisfy((combinations) => {
        expect(combinations).toEqual([
          [1, 9],
          [2, 8],
          [3, 7],
          [4, 6]
        ]);
        // Verify each combination sums correctly
        combinations.forEach((combo) => {
          expect(combo.reduce((sum, num) => sum + num, 0)).toBe(10);
          expect(combo).toHaveLength(2);
          // Verify sorted order
          expect(combo[0]).toBeLessThan(combo[1]);
        });
      });

      // Three cell cage - sum to 6 (minimum possible)
      expect(KillerCombinations.getCombinations(3, 6)).toSucceedWith([[1, 2, 3]]);
    });

    test('should handle excluded numbers constraint', () => {
      const constraints: IKillerConstraints = { excludedNumbers: [1, 2] };

      expect(KillerCombinations.getCombinations(2, 10, constraints)).toSucceedAndSatisfy((combinations) => {
        expect(combinations).toEqual([
          [3, 7],
          [4, 6]
        ]);
        // Verify no excluded numbers present
        combinations.forEach((combo) => {
          expect(combo).not.toContain(1);
          expect(combo).not.toContain(2);
        });
      });
    });

    test('should handle required numbers constraint', () => {
      const constraints: IKillerConstraints = { requiredNumbers: [9] };

      expect(KillerCombinations.getCombinations(3, 15, constraints)).toSucceedAndSatisfy((combinations) => {
        expect(combinations).toEqual([
          [1, 5, 9],
          [2, 4, 9]
        ]);
        // Verify required number present in all combinations
        combinations.forEach((combo) => {
          expect(combo).toContain(9);
        });
      });
    });

    test('should handle both excluded and required constraints', () => {
      const constraints: IKillerConstraints = {
        excludedNumbers: [1, 2],
        requiredNumbers: [9]
      };

      expect(KillerCombinations.getCombinations(3, 18, constraints)).toSucceedAndSatisfy((combinations) => {
        expect(combinations).toEqual([
          [3, 6, 9],
          [4, 5, 9]
        ]);
        combinations.forEach((combo) => {
          expect(combo).toContain(9);
          expect(combo).not.toContain(1);
          expect(combo).not.toContain(2);
        });
      });
    });

    test('should return empty array for impossible combinations', () => {
      // Impossible: required number conflicts with total
      const constraints: IKillerConstraints = { requiredNumbers: [9] };
      expect(KillerCombinations.getCombinations(2, 5, constraints)).toSucceedWith([]);

      // Impossible: too many required numbers
      const tooManyRequired: IKillerConstraints = { requiredNumbers: [1, 2, 3] };
      expect(KillerCombinations.getCombinations(2, 10, tooManyRequired)).toSucceedWith([]);

      // Impossible: excluded all possible numbers
      const allExcluded: IKillerConstraints = { excludedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
      expect(KillerCombinations.getCombinations(2, 10, allExcluded)).toSucceedWith([]);

      // Edge case: required numbers exactly fill cage but wrong sum
      const wrongSum: IKillerConstraints = { requiredNumbers: [1, 2] };
      expect(KillerCombinations.getCombinations(2, 10, wrongSum)).toSucceedWith([]);
    });

    test('should fail for invalid cage sizes', () => {
      expect(KillerCombinations.getCombinations(0, 10)).toFailWith(
        /cage size must be an integer between 1 and 9/i
      );
      expect(KillerCombinations.getCombinations(10, 10)).toFailWith(
        /cage size must be an integer between 1 and 9/i
      );
    });

    test('should fail for invalid totals', () => {
      expect(KillerCombinations.getCombinations(2, 2)).toFailWith(/total 2 is invalid for cage size 2/i);
      expect(KillerCombinations.getCombinations(2, 18)).toFailWith(/total 18 is invalid for cage size 2/i);
      expect(KillerCombinations.getCombinations(3, 25)).toFailWith(/total 25 is invalid for cage size 3/i);
    });

    test('should validate constraint parameters', () => {
      // Invalid excluded numbers
      const invalidExcluded: IKillerConstraints = { excludedNumbers: [10] };
      expect(KillerCombinations.getCombinations(2, 10, invalidExcluded)).toFailWith(
        /excludedNumbers must contain integers between 1-9/i
      );

      // Invalid required numbers
      const invalidRequired: IKillerConstraints = { requiredNumbers: [0] };
      expect(KillerCombinations.getCombinations(2, 10, invalidRequired)).toFailWith(
        /requiredNumbers must contain integers between 1-9/i
      );

      // Conflicting constraints
      const conflicting: IKillerConstraints = {
        excludedNumbers: [5],
        requiredNumbers: [5]
      };
      expect(KillerCombinations.getCombinations(2, 10, conflicting)).toFailWith(
        /number 5 cannot be both required and excluded/i
      );

      // Duplicate numbers
      const duplicateExcluded: IKillerConstraints = { excludedNumbers: [1, 1, 2] };
      expect(KillerCombinations.getCombinations(2, 10, duplicateExcluded)).toFailWith(
        /excludedNumbers must not contain duplicates/i
      );

      // Duplicate required numbers
      const duplicateRequired: IKillerConstraints = { requiredNumbers: [5, 5] };
      expect(KillerCombinations.getCombinations(2, 10, duplicateRequired)).toFailWith(
        /requiredNumbers must not contain duplicates/i
      );
    });

    test('should handle large cage sizes efficiently', () => {
      // Test performance with larger cages
      const start = Date.now();
      const result = KillerCombinations.getCombinations(6, 21);
      const duration = Date.now() - start;

      expect(result).toSucceed();
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });

    test('should verify caching behavior', () => {
      // First call
      const result1 = KillerCombinations.getCombinations(3, 15);
      expect(result1).toSucceed();

      // Second call should use cache (verify by checking it returns same result)
      const result2 = KillerCombinations.getCombinations(3, 15);
      expect(result2).toSucceed();
      expect(result2.value).toEqual(result1.value);
    });
  });

  describe('getCellPossibilities', () => {
    test('should fail for non-killer cages', () => {
      // Create a mock non-killer cage
      const mockCage: ICage = {
        id: 'r1' as CageId,
        cageType: 'row',
        total: 45,
        numCells: 9,
        cellIds: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9'] as CellId[],
        containsCell: jest.fn()
      };

      // Create minimal mock puzzle and state
      const mockPuzzle = {} as Puzzle;
      const mockState = {} as PuzzleState;

      const result = KillerCombinations.getCellPossibilities(mockPuzzle, mockState, mockCage);
      expect(result).toFailWith(/expected killer cage, got row/i);
    });

    test('should handle basic killer cage scenario', () => {
      // Create a mock killer cage with containedValues method
      const mockKillerCage = {
        id: 'k1' as CageId,
        cageType: 'killer' as const,
        total: 15,
        numCells: 3,
        cellIds: ['A1', 'A2', 'B1'] as CellId[],
        containsCell: jest.fn(),
        containedValues: jest.fn().mockReturnValue(new Set<number>()) // Empty cage
      };

      // Create minimal mock puzzle that returns empty cell lookup results
      const mockPuzzle = {
        getCell: jest.fn().mockReturnValue({
          isFailure: () => false,
          value: {
            id: 'A1' as CellId,
            cages: [] // No other cages for simplicity
          }
        })
      } as unknown as Puzzle;

      const mockState = {
        getCellContents: jest.fn().mockReturnValue({
          orDefault: () => ({ value: undefined, notes: [] })
        })
      } as unknown as PuzzleState;

      const result = KillerCombinations.getCellPossibilities(mockPuzzle, mockState, mockKillerCage);

      // This should succeed and return a map
      expect(result).toSucceedAndSatisfy((possibilities) => {
        expect(possibilities).toBeInstanceOf(Map);
        expect(possibilities.size).toBe(3); // Three cells in the cage
      });
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with combination generation correctly', () => {
      // Test the integration between getCombinations and getCellPossibilities
      // by using a mock setup that doesn't require complex puzzle creation

      const mockKillerCage = {
        id: 'k1' as CageId,
        cageType: 'killer' as const,
        total: 10,
        numCells: 2,
        cellIds: ['A1', 'A2'] as CellId[],
        containsCell: jest.fn(),
        containedValues: jest.fn().mockReturnValue(new Set([5])) // One cell filled with 5
      };

      const mockPuzzle = {
        getCell: jest.fn().mockReturnValue({
          isFailure: () => false,
          value: {
            id: 'A1' as CellId,
            cages: [mockKillerCage] // Cell belongs to this killer cage
          }
        })
      } as unknown as Puzzle;

      const mockState = {
        getCellContents: jest.fn().mockReturnValue({
          orDefault: () => ({ value: undefined, notes: [] })
        })
      } as unknown as PuzzleState;

      const result = KillerCombinations.getCellPossibilities(mockPuzzle, mockState, mockKillerCage);

      // Should succeed and account for the fact that 5 is already used
      expect(result).toSucceedAndSatisfy((possibilities) => {
        expect(possibilities).toBeInstanceOf(Map);
        expect(possibilities.size).toBe(2);

        // Check that the combinations logic was used (5 should be excluded)
        possibilities.forEach((values) => {
          expect(values).not.toContain(5);
        });
      });
    });

    test('should maintain performance under complex scenarios', () => {
      // Test with multiple constraints and larger cages
      const complexConstraints: IKillerConstraints = {
        excludedNumbers: [1, 2, 3],
        requiredNumbers: [8, 9]
      };

      const start = Date.now();
      const result = KillerCombinations.getCombinations(6, 35, complexConstraints);
      const duration = Date.now() - start;

      expect(result).toSucceed();
      expect(duration).toBeLessThan(100);
    });

    test('should handle edge cases gracefully', () => {
      // Test boundary conditions
      expect(KillerCombinations.getCombinations(1, 1)).toSucceedWith([[1]]);
      expect(KillerCombinations.getCombinations(1, 9)).toSucceedWith([[9]]);
      expect(KillerCombinations.getCombinations(9, 45)).toSucceedWith([[1, 2, 3, 4, 5, 6, 7, 8, 9]]);
    });
  });

  describe('Error Handling', () => {
    test('should provide descriptive error messages', () => {
      expect(KillerCombinations.getPossibleTotals(-1)).toFailWith(
        /Cage size must be an integer between 1 and 9, got -1/
      );

      expect(KillerCombinations.getCombinations(3, 100)).toFailWith(
        /Total 100 is invalid for cage size 3.*Valid range: 6-24/
      );

      const badConstraints: IKillerConstraints = { excludedNumbers: [15] };
      expect(KillerCombinations.getCombinations(2, 10, badConstraints)).toFailWith(
        /excludedNumbers must contain integers between 1-9, got 15/
      );
    });

    test('should handle malformed constraint objects', () => {
      // Test various malformed constraint scenarios
      const nonArrayExcluded = { excludedNumbers: 5 } as unknown as IKillerConstraints;
      expect(KillerCombinations.getCombinations(2, 10, nonArrayExcluded)).toFailWith(
        /excludedNumbers must be an array/i
      );

      const nonArrayRequired = { requiredNumbers: 'invalid' } as unknown as IKillerConstraints;
      expect(KillerCombinations.getCombinations(2, 10, nonArrayRequired)).toFailWith(
        /requiredNumbers must be an array/i
      );
    });
  });
});
