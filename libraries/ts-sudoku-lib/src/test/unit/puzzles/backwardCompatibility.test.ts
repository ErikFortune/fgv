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
  IPuzzleDescription,
  Puzzle,
  PuzzleState,
  PuzzleType
} from '../../../packlets/common';
import * as Puzzles from '../../../packlets/puzzles';

describe('Backward Compatibility with Standard Sudoku', () => {
  const standardSudokuDescription: IPuzzleDescription = {
    id: 'compat-test-standard',
    description: 'Backward Compatibility Test - Standard Sudoku',
    type: 'sudoku' as PuzzleType,
    level: 1,
    rows: 9,
    cols: 9,
    cells: '.........9.46.7....768.41..3.97.1.8.7.8...3.1.513.87.2..75.261...54.32.8.........'
  };

  const emptyStandardSudoku: IPuzzleDescription = {
    id: 'empty-standard',
    description: 'Empty Standard Sudoku',
    type: 'sudoku' as PuzzleType,
    level: 1,
    rows: 9,
    cols: 9,
    cells: '.'.repeat(81)
  };

  describe('standard Sudoku creation and functionality', () => {
    test('should create standard Sudoku puzzle exactly as before', () => {
      expect(Puzzles.Sudoku.create(standardSudokuDescription)).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.type).toBe('sudoku');
        expect(puzzle.id).toBe('compat-test-standard');
        expect(puzzle.description).toBe('Backward Compatibility Test - Standard Sudoku');
        expect(puzzle.numRows).toBe(9);
        expect(puzzle.numColumns).toBe(9);
      });
    });

    test('should create standard Sudoku through Any factory exactly as before', () => {
      expect(Puzzles.Any.create(standardSudokuDescription)).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.type).toBe('sudoku');
        expect(puzzle.id).toBe('compat-test-standard');
        expect(puzzle.numRows).toBe(9);
        expect(puzzle.numColumns).toBe(9);
      });
    });

    test('should maintain all standard constraints without diagonal constraints', () => {
      expect(Puzzles.Any.create(emptyStandardSudoku)).toSucceedAndSatisfy((puzzle) => {
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

        // Should NOT have diagonal constraints
        expect(puzzle.getCage('X1' as CageId)).toFailWith(/not found/i);
        expect(puzzle.getCage('X2' as CageId)).toFailWith(/not found/i);
      });
    });
  });

  describe('standard Sudoku validation behavior unchanged', () => {
    let puzzle: Puzzle;
    let state: PuzzleState;

    beforeEach(() => {
      puzzle = Puzzles.Any.create(emptyStandardSudoku).orThrow();
      state = puzzle.initialState;
    });

    test('should allow diagonal duplicates in standard Sudoku (no diagonal constraint)', () => {
      // Place the same value on diagonal cells that are in different sections, rows, and columns
      // A1 (0,0) - section SA1, row RA, column C1
      // E5 (4,4) - section SD4, row RE, column C5
      // I9 (8,8) - section SG7, row RI, column C9
      expect(puzzle.updateCellValue('A1' as CellId, 5, state)).toSucceedAndSatisfy((update1) => {
        expect(puzzle.updateCellValue('E5' as CellId, 5, update1.to)).toSucceedAndSatisfy((update2) => {
          expect(puzzle.updateCellValue('I9' as CellId, 5, update2.to)).toSucceedAndSatisfy((update3) => {
            // All cells should be valid (no diagonal constraint in standard Sudoku)
            expect(puzzle.getCell('A1' as CellId)).toSucceedAndSatisfy((cellA1) => {
              expect(cellA1.isValid(update3.to)).toBe(true);
            });
            expect(puzzle.getCell('E5' as CellId)).toSucceedAndSatisfy((cellE5) => {
              expect(cellE5.isValid(update3.to)).toBe(true);
            });
            expect(puzzle.getCell('I9' as CellId)).toSucceedAndSatisfy((cellI9) => {
              expect(cellI9.isValid(update3.to)).toBe(true);
            });
          });
        });
      });
    });

    test('should still enforce row constraints exactly as before', () => {
      // Place duplicate values in the same row
      expect(puzzle.updateCellValue('A1' as CellId, 7, state)).toSucceedAndSatisfy((update1) => {
        expect(puzzle.updateCellValue('A2' as CellId, 7, update1.to)).toSucceedAndSatisfy((update2) => {
          // Both cells should be invalid due to row constraint
          expect(puzzle.getCell('A1' as CellId)).toSucceedAndSatisfy((cellA1) => {
            expect(cellA1.isValid(update2.to)).toBe(false);
          });
          expect(puzzle.getCell('A2' as CellId)).toSucceedAndSatisfy((cellA2) => {
            expect(cellA2.isValid(update2.to)).toBe(false);
          });
        });
      });
    });

    test('should still enforce column constraints exactly as before', () => {
      // Place duplicate values in the same column
      expect(puzzle.updateCellValue('A1' as CellId, 8, state)).toSucceedAndSatisfy((update1) => {
        expect(puzzle.updateCellValue('B1' as CellId, 8, update1.to)).toSucceedAndSatisfy((update2) => {
          // Both cells should be invalid due to column constraint
          expect(puzzle.getCell('A1' as CellId)).toSucceedAndSatisfy((cellA1) => {
            expect(cellA1.isValid(update2.to)).toBe(false);
          });
          expect(puzzle.getCell('B1' as CellId)).toSucceedAndSatisfy((cellB1) => {
            expect(cellB1.isValid(update2.to)).toBe(false);
          });
        });
      });
    });

    test('should still enforce section constraints exactly as before', () => {
      // Place duplicate values in the same section
      expect(puzzle.updateCellValue('A1' as CellId, 9, state)).toSucceedAndSatisfy((update1) => {
        expect(puzzle.updateCellValue('B2' as CellId, 9, update1.to)).toSucceedAndSatisfy((update2) => {
          // Both cells should be invalid due to section constraint (A1 and B2 are in the same top-left section)
          expect(puzzle.getCell('A1' as CellId)).toSucceedAndSatisfy((cellA1) => {
            expect(cellA1.isValid(update2.to)).toBe(false);
          });
          expect(puzzle.getCell('B2' as CellId)).toSucceedAndSatisfy((cellB2) => {
            expect(cellB2.isValid(update2.to)).toBe(false);
          });
        });
      });
    });
  });

  describe('standard Sudoku API unchanged', () => {
    let puzzle: Puzzle;

    beforeEach(() => {
      puzzle = Puzzles.Any.create(standardSudokuDescription).orThrow();
    });

    test('should maintain exact same API surface', () => {
      // All methods should be available and working
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
      expect(typeof puzzle.getCellContents).toBe('function');

      // Properties should be accessible
      expect(typeof puzzle.id).toBe('string');
      expect(typeof puzzle.description).toBe('string');
      expect(typeof puzzle.type).toBe('string');
      expect(typeof puzzle.numRows).toBe('number');
      expect(typeof puzzle.numColumns).toBe('number');
      expect(puzzle.initialState).toBeDefined();
    });

    test('should return exact same results for getters as before', () => {
      // Test row access
      expect(puzzle.getRow(0)).toSucceedAndSatisfy((row) => {
        expect(row.id).toBe('RA');
        expect(row.numCells).toBe(9);
      });

      // Test column access
      expect(puzzle.getColumn(0)).toSucceedAndSatisfy((col) => {
        expect(col.id).toBe('C1');
        expect(col.numCells).toBe(9);
      });

      // Test section access
      expect(puzzle.getSection({ row: 0, col: 0 })).toSucceedAndSatisfy((section) => {
        expect(section.id).toBe('SA1');
        expect(section.numCells).toBe(9);
      });
    });

    test('should return exact same string representations as before', () => {
      const expectedStrings = [
        '.........',
        '9.46.7...',
        '.768.41..',
        '3.97.1.8.',
        '7.8...3.1',
        '.513.87.2',
        '..75.261.',
        '..54.32.8',
        '.........'
      ];

      expect(puzzle.toStrings(puzzle.initialState)).toEqual(expectedStrings);
      expect(puzzle.toString(puzzle.initialState)).toEqual(expectedStrings.join('\n'));
    });
  });

  describe('standard Sudoku performance unchanged', () => {
    test('should maintain same performance characteristics', () => {
      const startTime = Date.now();

      // Create multiple standard Sudoku puzzles
      for (let i = 0; i < 10; i++) {
        const puzzle = Puzzles.Any.create({
          ...emptyStandardSudoku,
          id: `perf-test-${i}`
        });
        expect(puzzle).toSucceed();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly (should be same as before)
      expect(duration).toBeLessThan(100);
    });

    test('should handle validation at same speed as before', () => {
      const puzzle = Puzzles.Any.create(emptyStandardSudoku).orThrow();
      let currentState = puzzle.initialState;

      const startTime = Date.now();

      // Perform validation-heavy operations
      for (let i = 0; i < 20; i++) {
        const cellId = `A${(i % 9) + 1}` as CellId;
        const result = puzzle.updateCellValue(cellId, (i % 9) + 1, currentState);
        if (result.isSuccess()) {
          currentState = result.value.to;
          puzzle.checkIsValid(currentState);
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(100);
    });
  });

  describe('integration with existing code patterns', () => {
    test('should work with existing puzzle session patterns', () => {
      const puzzle = Puzzles.Any.create(standardSudokuDescription).orThrow();
      let state = puzzle.initialState;

      // Simulate typical puzzle session operations
      expect(puzzle.updateCellValue('A9' as CellId, 3, state)).toSucceedAndSatisfy((update1) => {
        state = update1.to;

        expect(puzzle.getCellContents('A9' as CellId, state)).toSucceedAndSatisfy(({ contents }) => {
          expect(contents.value).toBe(3);
        });

        expect(puzzle.updateCellValue('A9' as CellId, undefined, state)).toSucceedAndSatisfy((update2) => {
          state = update2.to;

          expect(puzzle.getCellContents('A9' as CellId, state)).toSucceedAndSatisfy(({ contents }) => {
            expect(contents.value).toBeUndefined();
          });
        });
      });
    });

    test('should work with existing hint system patterns', () => {
      const puzzle = Puzzles.Any.create(standardSudokuDescription).orThrow();
      const state = puzzle.initialState;

      // Should work with hint generation (basic compatibility check)
      const emptyCells = puzzle.getEmptyCells(state);
      expect(emptyCells.length).toBeGreaterThan(0);

      const invalidCells = puzzle.getInvalidCells(state);
      expect(invalidCells.length).toBe(0); // Initially valid puzzle

      expect(puzzle.checkIsValid(state)).toBe(true);
      expect(puzzle.checkIsSolved(state)).toBe(false);
    });

    test('should work with existing validation patterns', () => {
      const puzzle = Puzzles.Any.create(emptyStandardSudoku).orThrow();
      let state = puzzle.initialState;

      // Create a conflict to test validation
      expect(puzzle.updateCellValue('A1' as CellId, 5, state)).toSucceedAndSatisfy((update1) => {
        expect(puzzle.updateCellValue('A2' as CellId, 5, update1.to)).toSucceedAndSatisfy((update2) => {
          state = update2.to;

          const invalidCells = puzzle.getInvalidCells(state);
          expect(invalidCells.length).toBe(2); // Both A1 and A2 should be invalid

          expect(puzzle.checkIsValid(state)).toBe(false);
          expect(puzzle.checkIsSolved(state)).toBe(false);
        });
      });
    });
  });

  describe('specific regression tests', () => {
    test('should not break existing cell ID patterns', () => {
      const puzzle = Puzzles.Any.create(emptyStandardSudoku).orThrow();

      // Test all expected cell IDs work as before
      const expectedCells = [
        'A1',
        'A9',
        'I1',
        'I9', // Corners
        'E5', // Center
        'B2',
        'C3',
        'D4',
        'F6',
        'G7',
        'H8' // Diagonal cells (should work in standard Sudoku too)
      ] as CellId[];

      expectedCells.forEach((cellId) => {
        expect(puzzle.getCell(cellId)).toSucceedAndSatisfy((cell) => {
          expect(cell.id).toBe(cellId);
        });
      });
    });

    test('should not break existing cage ID patterns', () => {
      const puzzle = Puzzles.Any.create(emptyStandardSudoku).orThrow();

      // Test all expected cage IDs work as before
      const expectedRowCages = ['RA', 'RB', 'RC', 'RD', 'RE', 'RF', 'RG', 'RH', 'RI'] as CageId[];
      const expectedColCages = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9'] as CageId[];
      const expectedSectionCages = [
        'SA1',
        'SA4',
        'SA7',
        'SD1',
        'SD4',
        'SD7',
        'SG1',
        'SG4',
        'SG7'
      ] as CageId[];

      [...expectedRowCages, ...expectedColCages, ...expectedSectionCages].forEach((cageId) => {
        expect(puzzle.getCage(cageId)).toSucceedAndSatisfy((cage) => {
          expect(cage.id).toBe(cageId);
        });
      });
    });

    test('should maintain exact same error messages as before', () => {
      // Test error message patterns haven't changed

      // Invalid puzzle type
      const invalidType = { ...standardSudokuDescription, type: 'invalid-type' as PuzzleType };
      expect(Puzzles.Sudoku.create(invalidType)).toFailWith(/unsupported type/i);

      // Invalid cell count
      const invalidCells = { ...standardSudokuDescription, cells: '123' };
      expect(Puzzles.Sudoku.create(invalidCells)).toFailWith(/expected 81 cells/i);

      // Invalid cell value
      const invalidValue = {
        ...standardSudokuDescription,
        cells: standardSudokuDescription.cells.replace('9', 'X')
      };
      expect(Puzzles.Sudoku.create(invalidValue)).toFailWith(/illegal value/i);
    });

    test('should not affect existing factory creation patterns', () => {
      // Direct creation should work exactly as before
      expect(Puzzles.Sudoku.create(standardSudokuDescription)).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.type).toBe('sudoku');
      });

      // Any factory should work exactly as before
      expect(Puzzles.Any.create(standardSudokuDescription)).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.type).toBe('sudoku');
      });

      // Should not accidentally create Sudoku X
      expect(Puzzles.Any.create(standardSudokuDescription)).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.type).not.toBe('sudoku-x');
        expect(puzzle.getCage('X1' as CageId)).toFailWith(/not found/i);
        expect(puzzle.getCage('X2' as CageId)).toFailWith(/not found/i);
      });
    });
  });
});
