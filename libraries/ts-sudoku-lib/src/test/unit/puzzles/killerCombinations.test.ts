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
import {
  CageId,
  CellId,
  ICage,
  Puzzle,
  PuzzleState,
  PuzzleSession,
  totalsByCageSize,
  PuzzleDefinitionFactory,
  STANDARD_CONFIGS
} from '../../../packlets/common';
import { KillerCombinations, IKillerConstraints } from '../../../packlets/puzzles';
import * as Puzzles from '../../../packlets/puzzles';

describe('KillerCombinations', () => {
  // Test builder functions for creating real puzzle instances
  interface ITestKillerPuzzleConfig {
    cageSize: number;
    cageTotal: number;
    prefilledValues?: Map<CellId, number>;
    cageId?: string;
  }

  function createTestKillerPuzzle(config: ITestKillerPuzzleConfig): {
    puzzle: Puzzle;
    session: PuzzleSession;
    cage: ICage;
  } {
    const { cageTotal, prefilledValues = new Map(), cageId = 'A' } = config;

    const cells = [
      'ABCCCDDDE',
      'ABFFGGGDE',
      'HIJKGGLLL',
      'HIJKMGLNN',
      'HOPPMQQNR',
      'OOSTMUVWR',
      'SSSTTUVWR',
      'XYTTTZZab',
      'XYYYcccab',
      `|${cageId}${cageTotal
        .toString()
        .padStart(
          2,
          '0'
        )},B09,C09,D20,E16,F17,G30,H17,I13,J09,K11,L16,M16,N11,O16,P07,Q11,R10,S14,T39,U08,V17,W16,X06,Y26,Z06,a09,b09,c11`
    ].join('');

    const puzzleDefinition = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
      id: 'test-killer',
      description: 'Test killer sudoku puzzle',
      type: 'killer-sudoku',
      level: 1,
      cells
    }).orThrow();
    const puzzle = Puzzles.Killer.create(puzzleDefinition).orThrow();
    const session = PuzzleSession.create(puzzle).orThrow();

    // Apply prefilled values if provided
    for (const [cellId, value] of prefilledValues) {
      session.updateCellValue(cellId, value).orThrow();
    }

    // Get the test cage (prefix with K for killer cages)
    const cage = puzzle.getCage(`K${cageId}` as CageId).orThrow();

    return { puzzle, session, cage };
  }

  function createSimpleKillerCage(
    cageSize: number,
    total: number,
    containedValues: number[] = []
  ): {
    puzzle: Puzzle;
    state: PuzzleState;
    cage: ICage;
  } {
    const cells = [
      'ABCCCDDDE',
      'ABFGGGGDE',
      'HIJKGGLLL',
      'HIJKMGLNN',
      'HOPPMQQNR',
      'OOSTMUVWR',
      'SSSTTUVWR',
      'XYTTTZZab',
      'XYYYcccab',
      `|A${total
        .toString()
        .padStart(
          2,
          '0'
        )},B09,C09,D20,E16,F09,G30,H17,I13,J09,K11,L16,M16,N11,O16,P07,Q11,R10,S14,T39,U08,V17,W16,X06,Y26,Z06,a09,b09,c11`
    ].join('');

    const puzzleDefinition = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
      id: 'test-killer',
      description: 'Test killer sudoku puzzle',
      type: 'killer-sudoku',
      level: 1,
      cells
    }).orThrow();

    const puzzle = Puzzles.Killer.create(puzzleDefinition).orThrow();
    const session = PuzzleSession.create(puzzle).orThrow();

    // Apply contained values if provided
    if (containedValues.length > 0) {
      const cageA = puzzle.getCage('KA' as CageId).orThrow();
      const cellIds = Array.from(cageA.cellIds);
      containedValues.forEach((value, index) => {
        if (index < cellIds.length) {
          session.updateCellValue(cellIds[index], value).orThrow();
        }
      });
    }

    // For this simple test, we'll use cage KA which has 2 cells in the existing puzzle
    const cage = puzzle.getCage('KA' as CageId).orThrow();

    return { puzzle, state: session.state, cage };
  }

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
      // Create a real puzzle with a standard sudoku puzzle (has row cages)
      const regularCells = [
        '.........',
        '9.46.7...',
        '.768.41..',
        '3.97.1.8.',
        '7.8...3.1',
        '.513.87.2',
        '..75.261.',
        '..54.32.8',
        '.........'
      ].join('');

      const puzzleDefinition = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
        id: 'test-regular',
        description: 'Test regular sudoku puzzle',
        type: 'sudoku',
        level: 1,
        cells: regularCells
      }).orThrow();
      const puzzle = Puzzles.Any.create(puzzleDefinition).orThrow();
      const session = PuzzleSession.create(puzzle).orThrow();

      // Get a row cage (non-killer cage)
      const rowCage = puzzle.rows[0]; // First row is a cage with cageType 'row'

      const result = KillerCombinations.getCellPossibilities(puzzle, session.state, rowCage);
      expect(result).toFailWith(/expected killer cage, got row/i);
    });

    test('should handle basic killer cage scenario with empty cage', () => {
      // Use the existing killer puzzle which has cage A with 2 cells and total 11
      const { puzzle, state, cage } = createSimpleKillerCage(2, 11);

      const result = KillerCombinations.getCellPossibilities(puzzle, state, cage);

      // This should succeed and return a map with possibilities for all cells
      expect(result).toSucceedAndSatisfy((possibilities) => {
        expect(possibilities).toBeInstanceOf(Map);
        expect(possibilities.size).toBe(2); // Two cells in cage A

        // Verify each cell has valid possibilities
        for (const [, values] of possibilities) {
          expect(Array.isArray(values)).toBe(true);
          expect(values.length).toBeGreaterThan(0);

          // All values should be between 1 and 9
          values.forEach((value) => {
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThanOrEqual(9);
          });
        }
      });
    });

    test('should handle killer cage with some prefilled values', () => {
      // Create a cage with one cell already filled with value 5
      const { puzzle, state, cage } = createSimpleKillerCage(2, 11, [5]);

      const result = KillerCombinations.getCellPossibilities(puzzle, state, cage);

      expect(result).toSucceedAndSatisfy((possibilities) => {
        expect(possibilities).toBeInstanceOf(Map);
        expect(possibilities.size).toBe(2);

        // Check that 5 is excluded from possibilities (already used)
        possibilities.forEach((values) => {
          expect(values).not.toContain(5);
        });
      });
    });

    test('should handle 2-cell killer cage with sum 9', () => {
      // Use cage KB which has 2 cells (A2,B2) and total 9 in the existing puzzle
      const { puzzle, state } = createSimpleKillerCage(2, 11); // Get the puzzle
      const cageB = puzzle.getCage('KB' as CageId).orThrow(); // Get cage KB

      const result = KillerCombinations.getCellPossibilities(puzzle, state, cageB);

      expect(result).toSucceedAndSatisfy((possibilities) => {
        expect(possibilities).toBeInstanceOf(Map);
        expect(possibilities.size).toBe(2); // KB has 2 cells

        // For 2 cells with total 9, valid combinations are [1,8], [2,7], [3,6], [4,5]
        possibilities.forEach((values) => {
          expect(values.length).toBeGreaterThan(0);
          values.forEach((value) => {
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThanOrEqual(8);
          });
        });
      });
    });

    test('should handle impossible cage scenario', () => {
      // Create a 2-cell cage with total 11, but both cells already filled with values that don't sum to 11
      const { puzzle, state, cage } = createSimpleKillerCage(2, 11, [1, 2]); // 1 + 2 = 3, not 11

      const result = KillerCombinations.getCellPossibilities(puzzle, state, cage);

      expect(result).toSucceedAndSatisfy((possibilities) => {
        expect(possibilities).toBeInstanceOf(Map);
        // Should return empty possibilities for impossible scenarios
        possibilities.forEach((values) => {
          expect(values).toHaveLength(0);
        });
      });
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with combination generation correctly', () => {
      // Test the integration between getCombinations and getCellPossibilities
      // using a real killer puzzle instance
      const { puzzle, state, cage } = createSimpleKillerCage(2, 11, [5]); // One cell filled with 5

      const result = KillerCombinations.getCellPossibilities(puzzle, state, cage);

      // Should succeed and account for the fact that 5 is already used
      expect(result).toSucceedAndSatisfy((possibilities) => {
        expect(possibilities).toBeInstanceOf(Map);
        expect(possibilities.size).toBe(2);

        // Check that the combinations logic was used (5 should be excluded)
        possibilities.forEach((values) => {
          expect(values).not.toContain(5);
        });

        // The remaining cell should only have value 6 (since 11 - 5 = 6)
        const unfilledCellValues = Array.from(possibilities.values()).find((values) => values.length > 0);
        if (unfilledCellValues) {
          // If there are possibilities, none should be 5, and should include 6
          expect(unfilledCellValues).not.toContain(5);
          expect(unfilledCellValues).toContain(6);
        }
      });
    });

    test('should handle complex cage scenarios with multiple constraints', () => {
      // Use cage KT which has 5 cells and total 39 in the existing puzzle
      const { puzzle } = createSimpleKillerCage(2, 11); // Get the puzzle
      const cageT = puzzle.getCage('KT' as CageId).orThrow(); // Get cage KT
      const session = PuzzleSession.create(puzzle).orThrow();

      // Fill some cells in cage T with known values
      const cellIds = Array.from(cageT.cellIds);
      session.updateCellValue(cellIds[0], 1).orThrow();
      session.updateCellValue(cellIds[1], 9).orThrow();

      const result = KillerCombinations.getCellPossibilities(puzzle, session.state, cageT);

      expect(result).toSucceedAndSatisfy((possibilities) => {
        expect(possibilities).toBeInstanceOf(Map);
        expect(possibilities.size).toBe(cageT.numCells);

        // All remaining cells should exclude 1 and 9
        possibilities.forEach((values) => {
          expect(values).not.toContain(1);
          expect(values).not.toContain(9);
        });
      });
    });

    test('should correctly compute possibilities for standard killer cage combinations', () => {
      // Use cage KC which has 3 cells and total 9 in the existing puzzle
      const { puzzle, state } = createSimpleKillerCage(2, 11); // Get the puzzle
      const cageC = puzzle.getCage('KC' as CageId).orThrow(); // Get cage KC

      const result = KillerCombinations.getCellPossibilities(puzzle, state, cageC);

      expect(result).toSucceedAndSatisfy((possibilities) => {
        expect(possibilities).toBeInstanceOf(Map);
        expect(possibilities.size).toBe(cageC.numCells);

        // For a total of 9 with 3 cells, valid combinations include [1,2,6], [1,3,5], [2,3,4]
        possibilities.forEach((values) => {
          // Each cell should have valid possibilities for total 9
          values.forEach((value) => {
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThanOrEqual(6); // Max value in any combination for total 9 with 3 cells
          });
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

    test('should maintain performance with real puzzle instances', () => {
      // Test performance with real puzzle creation and state management
      const start = Date.now();

      // Use a real cage from the puzzle
      const { puzzle, state } = createSimpleKillerCage(2, 11);
      const cage = puzzle.getCage('KT' as CageId).orThrow(); // KT has 5 cells, total 39
      const result = KillerCombinations.getCellPossibilities(puzzle, state, cage);

      const duration = Date.now() - start;

      expect(result).toSucceed();
      expect(duration).toBeLessThan(200); // Allow more time for real object creation
    });

    test('should handle edge cases gracefully', () => {
      // Test boundary conditions
      expect(KillerCombinations.getCombinations(1, 1)).toSucceedWith([[1]]);
      expect(KillerCombinations.getCombinations(1, 9)).toSucceedWith([[9]]);
      expect(KillerCombinations.getCombinations(9, 45)).toSucceedWith([[1, 2, 3, 4, 5, 6, 7, 8, 9]]);
    });

    test('should handle real puzzle edge cases', () => {
      // Test cage KB (2 cells, total 9) - based on actual puzzle structure
      const { puzzle: puzzle1, state: state1 } = createSimpleKillerCage(2, 11);
      const cage1 = puzzle1.getCage('KB' as CageId).orThrow();
      expect(KillerCombinations.getCellPossibilities(puzzle1, state1, cage1)).toSucceedAndSatisfy(
        (possibilities) => {
          expect(possibilities.size).toBe(2); // KB has 2 cells
          // For a 2-cell cage with total 9, valid combinations are [1,8], [2,7], [3,6], [4,5]
          // Each cell should have valid possibilities
          possibilities.forEach((values) => {
            expect(values.length).toBeGreaterThan(0);
            values.forEach((value) => {
              expect(value).toBeGreaterThanOrEqual(1);
              expect(value).toBeLessThanOrEqual(8);
            });
          });
        }
      );

      // Test 2-cell cage KA (2 cells, total 11)
      const { puzzle: puzzle2, state: state2 } = createSimpleKillerCage(2, 11);
      const cage2 = puzzle2.getCage('KA' as CageId).orThrow();
      expect(KillerCombinations.getCellPossibilities(puzzle2, state2, cage2)).toSucceedAndSatisfy(
        (possibilities) => {
          expect(possibilities.size).toBe(2);
          // Each cell should have valid possibilities for sum of 11
          possibilities.forEach((values) => {
            expect(values.length).toBeGreaterThan(0);
          });
        }
      );
    });
  });

  describe('Real Puzzle Integration', () => {
    test('should work with actual killer sudoku puzzle structure', () => {
      // Test with a more realistic killer sudoku puzzle structure
      const killerCells =
        'AABBCCDDEAABBCCDDE' +
        'FFGGHHIIEFFJJKKLLE' +
        'MMJJKKLNNMMOOPPQNN' +
        'RROOPPQSSRRTTUUVSS' +
        'WWTTUUVXX' +
        '|A15,B10,C12,D20,E17,F11,G09,H14,I13,J16,K12,L15,M20,N20,O13,P14,Q07,R11,S18,T21,U19,V10,W06,X09';

      const puzzleDefinition = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
        id: 'real-killer-test',
        description: 'Realistic killer sudoku test puzzle',
        type: 'killer-sudoku',
        level: 2,
        cells: killerCells
      }).orThrow();
      const puzzle = Puzzles.Killer.create(puzzleDefinition).orThrow();
      const session = PuzzleSession.create(puzzle).orThrow();

      // Test with cage 'KA' (15 total, should be 2 cells based on pattern)
      const cageA = puzzle.getCage('KA' as CageId).orThrow();

      const result = KillerCombinations.getCellPossibilities(puzzle, session.state, cageA);

      expect(result).toSucceedAndSatisfy((possibilities) => {
        expect(possibilities).toBeInstanceOf(Map);
        expect(possibilities.size).toBe(cageA.numCells);

        // Verify all possibilities are valid numbers
        possibilities.forEach((values, cellId) => {
          expect(Array.isArray(values)).toBe(true);
          values.forEach((value) => {
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThanOrEqual(9);
          });
        });
      });
    });

    test('should handle cage interactions correctly', () => {
      // Create a puzzle and fill some cells to test constraint propagation
      const { puzzle, session, cage } = createTestKillerPuzzle({
        cageSize: 3,
        cageTotal: 15,
        prefilledValues: new Map([['A1' as CellId, 5]]) // Fill first cell
      });

      const result = KillerCombinations.getCellPossibilities(puzzle, session.state, cage);

      expect(result).toSucceedAndSatisfy((possibilities) => {
        // Should exclude 5 from all remaining cells
        possibilities.forEach((values, cellId) => {
          if (session.state.getCellContents(cellId).orDefault({ value: undefined, notes: [] }).value !== 5) {
            expect(values).not.toContain(5);
          }
        });
      });
    });
  });

  describe('Error Handling', () => {
    test('should provide descriptive error messages', () => {
      expect(KillerCombinations.getPossibleTotals(-1)).toFailWith(
        /Cage size must be an integer between 1 and 9, got -1/
      );

      expect(KillerCombinations.getCombinations(3, 100)).toFailWith(
        /Total 100 is invalid for cage size 3.*valid range.*6-24/
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
