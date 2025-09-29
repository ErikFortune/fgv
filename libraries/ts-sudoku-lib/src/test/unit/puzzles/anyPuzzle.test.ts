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
import { CageId, PuzzleDefinitionFactory, STANDARD_CONFIGS, PuzzleType } from '../../../packlets/common';
import * as Puzzles from '../../../packlets/puzzles';
import { Result } from '@fgv/ts-utils';
import { Puzzle } from '../../../packlets/common';

// Helper function to create puzzle
function createPuzzle(
  id: string,
  description: string,
  type: PuzzleType,
  level: number,
  cells: string
): Result<Puzzle> {
  return PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
    id,
    description,
    type,
    level,
    cells
  }).onSuccess((puzzleDefinition) => Puzzles.Any.create(puzzleDefinition));
}

describe('AnyPuzzle factory integration', () => {
  describe('Sudoku X puzzle creation', () => {
    const sudokuXCells = '4.....13....6.1.....7..29...76.....2....3..9.9.1....577...1.6..3...5.7...4......1';

    test('should create Sudoku X puzzle with correct type', () => {
      expect(
        createPuzzle('any-puzzle-sudoku-x', 'Any Puzzle Sudoku X Test', 'sudoku-x', 1, sudokuXCells)
      ).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.type).toBe('sudoku-x');
        expect(puzzle.id).toBe('any-puzzle-sudoku-x');
        expect(puzzle.description).toBe('Any Puzzle Sudoku X Test');
      });
    });

    test('should create puzzle with diagonal constraints', () => {
      expect(
        createPuzzle('any-puzzle-sudoku-x', 'Any Puzzle Sudoku X Test', 'sudoku-x', 1, sudokuXCells)
      ).toSucceedAndSatisfy((puzzle) => {
        // Should have X1 diagonal cage
        expect(puzzle.getCage('X1' as CageId)).toSucceedAndSatisfy((x1Cage) => {
          expect(x1Cage.cageType).toBe('x');
          expect(x1Cage.numCells).toBe(9);
          expect(x1Cage.total).toBe(45);
        });

        // Should have X2 diagonal cage
        expect(puzzle.getCage('X2' as CageId)).toSucceedAndSatisfy((x2Cage) => {
          expect(x2Cage.cageType).toBe('x');
          expect(x2Cage.numCells).toBe(9);
          expect(x2Cage.total).toBe(45);
        });
      });
    });

    test('should maintain all standard Sudoku constraints', () => {
      expect(
        createPuzzle('any-puzzle-sudoku-x', 'Any Puzzle Sudoku X Test', 'sudoku-x', 1, sudokuXCells)
      ).toSucceedAndSatisfy((puzzle) => {
        // Should have all 9 rows
        for (let row = 0; row < 9; row++) {
          expect(puzzle.getRow(row)).toSucceedAndSatisfy((rowCage) => {
            expect(rowCage.numCells).toBe(9);
            expect(rowCage.cageType).toBe('row');
          });
        }

        // Should have all 9 columns
        for (let col = 0; col < 9; col++) {
          expect(puzzle.getColumn(col)).toSucceedAndSatisfy((colCage) => {
            expect(colCage.numCells).toBe(9);
            expect(colCage.cageType).toBe('column');
          });
        }

        // Should have all 9 sections
        for (let sectionRow = 0; sectionRow < 3; sectionRow++) {
          for (let sectionCol = 0; sectionCol < 3; sectionCol++) {
            expect(puzzle.getSection({ row: sectionRow, col: sectionCol })).toSucceedAndSatisfy(
              (sectionCage) => {
                expect(sectionCage.numCells).toBe(9);
                expect(sectionCage.cageType).toBe('section');
              }
            );
          }
        }
      });
    });
  });

  describe('puzzle type differentiation', () => {
    const emptyCells = '.'.repeat(81);

    test('should create standard Sudoku without diagonal constraints', () => {
      expect(createPuzzle('type-test', 'Type Test Puzzle', 'sudoku', 1, emptyCells)).toSucceedAndSatisfy(
        (puzzle) => {
          expect(puzzle.type).toBe('sudoku');

          // Should not have diagonal cages
          expect(puzzle.getCage('X1' as CageId)).toFailWith(/not found/i);
          expect(puzzle.getCage('X2' as CageId)).toFailWith(/not found/i);
        }
      );
    });

    test('should create Sudoku X with diagonal constraints', () => {
      expect(createPuzzle('type-test', 'Type Test Puzzle', 'sudoku-x', 1, emptyCells)).toSucceedAndSatisfy(
        (puzzle) => {
          expect(puzzle.type).toBe('sudoku-x');

          // Should have diagonal cages
          expect(puzzle.getCage('X1' as CageId)).toSucceed();
          expect(puzzle.getCage('X2' as CageId)).toSucceed();
        }
      );
    });

    test('should create Killer Sudoku with killer constraints', () => {
      const killerCells =
        'ABCCCDDDEABFFGGGDEHIJKGGLLLHIJKMGLNNHOPPMQQNROOSTMUVWRSSSTTUVWRXYTTTZZabXYYYcccab|A11,B09,C09,D20,E16,F17,G30,H17,I13,J09,K11,L16,M16,N11,O16,P07,Q11,R10,S14,T39,U08,V17,W16,X06,Y26,Z06,a09,b09,c11';

      expect(
        createPuzzle('type-test', 'Type Test Puzzle', 'killer-sudoku', 1, killerCells)
      ).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.type).toBe('killer-sudoku');

        // Should not have diagonal cages (specific to Sudoku X)
        expect(puzzle.getCage('X1' as CageId)).toFailWith(/not found/i);
        expect(puzzle.getCage('X2' as CageId)).toFailWith(/not found/i);
      });
    });

    test('should fail for unsupported puzzle types', () => {
      expect(
        createPuzzle('type-test', 'Type Test Puzzle', 'unknown-type' as PuzzleType, 1, emptyCells)
      ).toFailWith(/unknown puzzle type: unknown-type/i);
    });
  });

  describe('functional constraint validation across puzzle types', () => {
    test('should enforce different constraint sets for different puzzle types', () => {
      const emptyCells = '.'.repeat(81);

      // Create different puzzle types
      const standardPuzzle = createPuzzle(
        'constraint-test',
        'Constraint Test',
        'sudoku',
        1,
        emptyCells
      ).orThrow();
      const sudokuXPuzzle = createPuzzle(
        'constraint-test',
        'Constraint Test',
        'sudoku-x',
        1,
        emptyCells
      ).orThrow();

      // Place the same value in diagonal cells that are in different sections
      // A1 is in top-left section, E5 is in center section, I9 is in bottom-right section
      const diagonalUpdate1 = standardPuzzle.updateCellValue('A1', 5, standardPuzzle.initialState).orThrow();
      const diagonalUpdate2 = standardPuzzle.updateCellValue('E5', 5, diagonalUpdate1.to).orThrow();

      // Standard Sudoku should allow this (no diagonal constraint, different sections/rows/cols)
      expect(standardPuzzle.getCell('A1')).toSucceedAndSatisfy((cell) => {
        expect(cell.isValid(diagonalUpdate2.to)).toBe(true);
      });
      expect(standardPuzzle.getCell('E5')).toSucceedAndSatisfy((cell) => {
        expect(cell.isValid(diagonalUpdate2.to)).toBe(true);
      });

      // Sudoku X should reject this (diagonal constraint violated)
      const sudokuXUpdate1 = sudokuXPuzzle.updateCellValue('A1', 5, sudokuXPuzzle.initialState).orThrow();
      const sudokuXUpdate2 = sudokuXPuzzle.updateCellValue('E5', 5, sudokuXUpdate1.to).orThrow();

      expect(sudokuXPuzzle.getCell('A1')).toSucceedAndSatisfy((cell) => {
        expect(cell.isValid(sudokuXUpdate2.to)).toBe(false);
      });
      expect(sudokuXPuzzle.getCell('E5')).toSucceedAndSatisfy((cell) => {
        expect(cell.isValid(sudokuXUpdate2.to)).toBe(false);
      });
    });
  });

  describe('backward compatibility', () => {
    test('should maintain existing functionality for standard Sudoku', () => {
      const standardCells =
        '.........9.46.7....768.41..3.97.1.8.7.8...3.1.513.87.2..75.261...54.32.8.........';

      expect(
        createPuzzle('backward-compat-test', 'Backward Compatibility Test', 'sudoku', 1, standardCells)
      ).toSucceedAndSatisfy((puzzle) => {
        // Should behave exactly like the original Sudoku implementation
        expect(puzzle.type).toBe('sudoku');
        expect(puzzle.numRows).toBe(9);
        expect(puzzle.numColumns).toBe(9);

        // Should have standard constraints only
        expect(puzzle.getRow(0)).toSucceed();
        expect(puzzle.getColumn(0)).toSucceed();
        expect(puzzle.getSection({ row: 0, col: 0 })).toSucceed();

        // Should not have diagonal constraints
        expect(puzzle.getCage('X1' as CageId)).toFailWith(/not found/i);
        expect(puzzle.getCage('X2' as CageId)).toFailWith(/not found/i);

        // Standard validation should work
        expect(puzzle.checkIsValid(puzzle.initialState)).toBe(true);
        expect(puzzle.checkIsSolved(puzzle.initialState)).toBe(false);
      });
    });

    test('should maintain existing API for all supported operations', () => {
      const emptyCells = '.'.repeat(81);

      expect(
        createPuzzle('api-compat-test', 'API Compatibility Test', 'sudoku-x', 1, emptyCells)
      ).toSucceedAndSatisfy((puzzle) => {
        // All standard puzzle operations should be available
        expect(typeof puzzle.getCell).toBe('function');
        expect(typeof puzzle.getRow).toBe('function');
        expect(typeof puzzle.getColumn).toBe('function');
        expect(typeof puzzle.getSection).toBe('function');
        expect(typeof puzzle.getCage).toBe('function');
        expect(typeof puzzle.updateCellValue).toBe('function');
        expect(typeof puzzle.updateCellNotes).toBe('function');
        expect(typeof puzzle.updateContents).toBe('function');
        expect(typeof puzzle.checkIsValid).toBe('function');
        expect(typeof puzzle.checkIsSolved).toBe('function');
        expect(typeof puzzle.toString).toBe('function');
        expect(typeof puzzle.toStrings).toBe('function');
        expect(typeof puzzle.getEmptyCells).toBe('function');
        expect(typeof puzzle.getInvalidCells).toBe('function');

        // Properties should be accessible
        expect(typeof puzzle.id).toBe('string');
        expect(typeof puzzle.description).toBe('string');
        expect(typeof puzzle.type).toBe('string');
        expect(typeof puzzle.numRows).toBe('number');
        expect(typeof puzzle.numColumns).toBe('number');
        expect(puzzle.initialState).toBeDefined();
      });
    });
  });

  describe('error handling and edge cases', () => {
    test('should handle invalid puzzle descriptions gracefully', () => {
      // Invalid type
      expect(createPuzzle('test', 'test', 'invalid-type' as PuzzleType, 1, '.'.repeat(81))).toFail();

      // Invalid cell count (80 instead of 81)
      expect(createPuzzle('test', 'test', 'sudoku-x', 1, '.'.repeat(80))).toFail();
    });

    test('should handle edge case puzzle data', () => {
      // Empty description strings
      const emptyCells = '.'.repeat(81);

      expect(createPuzzle('', '', 'sudoku-x', 1, emptyCells)).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.id).toBe('');
        expect(puzzle.description).toBe('');
        expect(puzzle.type).toBe('sudoku-x');
      });
    });

    test('should handle special characters in puzzle data', () => {
      const emptyCells = '.'.repeat(81);

      expect(
        createPuzzle('test-special-éñ中', 'Test with special chars: éñ中文', 'sudoku-x', 1, emptyCells)
      ).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.id).toBe('test-special-éñ中');
        expect(puzzle.description).toBe('Test with special chars: éñ中文');
      });
    });
  });

  describe('performance characteristics', () => {
    test('should create puzzles efficiently across different types', () => {
      const emptyCells = '.'.repeat(81);
      const puzzleTypes: PuzzleType[] = ['sudoku', 'sudoku-x'];
      const startTime = Date.now();

      // Create multiple puzzles of different types
      for (let i = 0; i < 10; i++) {
        for (const type of puzzleTypes) {
          const puzzle = createPuzzle(`perf-test-${type}-${i}`, 'Performance Test', type, 1, emptyCells);
          expect(puzzle).toSucceed();
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000); // 1 second for 20 puzzle creations
    });

    test('should handle rapid puzzle type switching', () => {
      const emptyCells = '.'.repeat(81);
      const types: PuzzleType[] = ['sudoku', 'sudoku-x', 'sudoku', 'sudoku-x'];

      for (let i = 0; i < types.length; i++) {
        expect(createPuzzle(`switch-${i}`, 'Switch Test', types[i], 1, emptyCells)).toSucceedAndSatisfy(
          (puzzle) => {
            expect(puzzle.type).toBe(types[i]);

            // Verify type-specific characteristics
            if (types[i] === 'sudoku-x') {
              expect(puzzle.getCage('X1' as CageId)).toSucceed();
              expect(puzzle.getCage('X2' as CageId)).toSucceed();
            } else {
              expect(puzzle.getCage('X1' as CageId)).toFailWith(/not found/i);
              expect(puzzle.getCage('X2' as CageId)).toFailWith(/not found/i);
            }
          }
        );
      }
    });
  });
});
