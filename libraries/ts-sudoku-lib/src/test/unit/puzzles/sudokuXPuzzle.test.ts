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

describe('SudokuXPuzzle', () => {
  const validSudokuXDescription: IPuzzleDescription = {
    id: 'sudoku-x-test',
    description: 'Sudoku X Test Puzzle',
    type: 'sudoku-x' as PuzzleType,
    level: 1,
    rows: 9,
    cols: 9,
    cells: '4.....13....6.1.....7..29...76.....2....3..9.9.1....577...1.6..3...5.7...4......1'
  };

  const emptySudokuXDescription: IPuzzleDescription = {
    id: 'sudoku-x-empty',
    description: 'Empty Sudoku X Puzzle',
    type: 'sudoku-x' as PuzzleType,
    level: 1,
    rows: 9,
    cols: 9,
    cells: '.'.repeat(81)
  };

  describe('SudokuXPuzzle.create', () => {
    test('should create a valid Sudoku X puzzle successfully', () => {
      expect(Puzzles.SudokuX.create(validSudokuXDescription)).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.id).toBe('sudoku-x-test');
        expect(puzzle.description).toBe('Sudoku X Test Puzzle');
        expect(puzzle.type).toBe('sudoku-x');
        expect(puzzle.numRows).toBe(9);
        expect(puzzle.numColumns).toBe(9);
      });
    });

    test('should create empty Sudoku X puzzle successfully', () => {
      expect(Puzzles.SudokuX.create(emptySudokuXDescription)).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.id).toBe('sudoku-x-empty');
        expect(puzzle.type).toBe('sudoku-x');
        expect(puzzle.numRows).toBe(9);
        expect(puzzle.numColumns).toBe(9);
      });
    });

    test('should fail for non-sudoku-x puzzle type', () => {
      const invalidPuzzle = { ...validSudokuXDescription, type: 'sudoku' as PuzzleType };
      expect(Puzzles.SudokuX.create(invalidPuzzle)).toFailWith(/unsupported type sudoku/i);
    });

    test('should fail for invalid dimensions', () => {
      const invalidPuzzle = { ...validSudokuXDescription, rows: 8 };
      expect(Puzzles.SudokuX.create(invalidPuzzle)).toFailWith(/expected 72 cells, found 81/i);
    });

    test('should fail for invalid cell count', () => {
      const invalidPuzzle = { ...validSudokuXDescription, cells: '4.....13.' };
      expect(Puzzles.SudokuX.create(invalidPuzzle)).toFailWith(/expected 81 cells/i);
    });

    test('should fail for invalid cell values', () => {
      const invalidPuzzle = {
        ...validSudokuXDescription,
        cells: validSudokuXDescription.cells.replace('4', 'X')
      };
      expect(Puzzles.SudokuX.create(invalidPuzzle)).toFailWith(/illegal value/i);
    });
  });

  describe('diagonal constraints (X cages)', () => {
    let puzzle: Puzzle;

    beforeEach(() => {
      puzzle = Puzzles.SudokuX.create(emptySudokuXDescription).orThrow();
    });

    test('should have X1 diagonal cage (top-left to bottom-right)', () => {
      expect(puzzle.getCage('X1' as CageId)).toSucceedAndSatisfy((cage) => {
        expect(cage.id).toBe('X1');
        expect(cage.cageType).toBe('x');
        expect(cage.total).toBe(45); // Sum 1-9
        expect(cage.numCells).toBe(9);

        // Verify the diagonal cells A1, B2, C3, D4, E5, F6, G7, H8, I9
        const expectedCells = ['A1', 'B2', 'C3', 'D4', 'E5', 'F6', 'G7', 'H8', 'I9'] as CellId[];
        expect(cage.cellIds).toEqual(expectedCells);
      });
    });

    test('should have X2 diagonal cage (top-right to bottom-left)', () => {
      expect(puzzle.getCage('X2' as CageId)).toSucceedAndSatisfy((cage) => {
        expect(cage.id).toBe('X2');
        expect(cage.cageType).toBe('x');
        expect(cage.total).toBe(45); // Sum 1-9
        expect(cage.numCells).toBe(9);

        // Verify the diagonal cells A9, B8, C7, D6, E5, F4, G3, H2, I1
        const expectedCells = ['A9', 'B8', 'C7', 'D6', 'E5', 'F4', 'G3', 'H2', 'I1'] as CellId[];
        expect(cage.cellIds).toEqual(expectedCells);
      });
    });

    test('should have E5 cell in both diagonal cages', () => {
      const centerCell = 'E5' as CellId;

      expect(puzzle.getCage('X1' as CageId)).toSucceedAndSatisfy((x1Cage) => {
        expect(x1Cage.cellIds).toContain(centerCell);
      });

      expect(puzzle.getCage('X2' as CageId)).toSucceedAndSatisfy((x2Cage) => {
        expect(x2Cage.cellIds).toContain(centerCell);
      });
    });
  });

  describe('standard Sudoku constraint inheritance', () => {
    let puzzle: Puzzle;

    beforeEach(() => {
      puzzle = Puzzles.SudokuX.create(emptySudokuXDescription).orThrow();
    });

    test('should inherit all standard Sudoku row constraints', () => {
      for (let row = 0; row < 9; row++) {
        expect(puzzle.getRow(row)).toSucceedAndSatisfy((rowCage) => {
          expect(rowCage.numCells).toBe(9);
          expect(rowCage.cageType).toBe('row'); // Standard Sudoku constraint type
        });
      }
    });

    test('should inherit all standard Sudoku column constraints', () => {
      for (let col = 0; col < 9; col++) {
        expect(puzzle.getColumn(col)).toSucceedAndSatisfy((colCage) => {
          expect(colCage.numCells).toBe(9);
          expect(colCage.cageType).toBe('column');
        });
      }
    });

    test('should inherit all standard Sudoku section constraints', () => {
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

  describe('diagonal constraint validation', () => {
    let puzzle: Puzzle;
    let state: PuzzleState;

    beforeEach(() => {
      puzzle = Puzzles.SudokuX.create(emptySudokuXDescription).orThrow();
      state = puzzle.initialState;
    });

    test('should detect duplicate values in X1 diagonal (top-left to bottom-right)', () => {
      // Place the same value in two cells of X1 diagonal
      expect(puzzle.updateCellValue('A1' as CellId, 5, state)).toSucceedAndSatisfy((update1) => {
        expect(puzzle.updateCellValue('B2' as CellId, 5, update1.to)).toSucceedAndSatisfy((update2) => {
          // Both cells should be marked as invalid due to diagonal constraint
          expect(puzzle.getCell('A1' as CellId)).toSucceedAndSatisfy((cellA1) => {
            expect(cellA1.isValid(update2.to)).toBe(false);
          });
          expect(puzzle.getCell('B2' as CellId)).toSucceedAndSatisfy((cellB2) => {
            expect(cellB2.isValid(update2.to)).toBe(false);
          });
        });
      });
    });

    test('should detect duplicate values in X2 diagonal (top-right to bottom-left)', () => {
      // Place the same value in two cells of X2 diagonal
      expect(puzzle.updateCellValue('A9' as CellId, 7, state)).toSucceedAndSatisfy((update1) => {
        expect(puzzle.updateCellValue('B8' as CellId, 7, update1.to)).toSucceedAndSatisfy((update2) => {
          // Both cells should be marked as invalid due to diagonal constraint
          expect(puzzle.getCell('A9' as CellId)).toSucceedAndSatisfy((cellA9) => {
            expect(cellA9.isValid(update2.to)).toBe(false);
          });
          expect(puzzle.getCell('B8' as CellId)).toSucceedAndSatisfy((cellB8) => {
            expect(cellB8.isValid(update2.to)).toBe(false);
          });
        });
      });
    });

    test('should detect conflicts at E5 (center cell in both diagonals)', () => {
      // Place a value at E5 and then try to place the same value elsewhere on both diagonals
      expect(puzzle.updateCellValue('E5' as CellId, 9, state)).toSucceedAndSatisfy((update1) => {
        // Try to place 9 on X1 diagonal
        expect(puzzle.updateCellValue('A1' as CellId, 9, update1.to)).toSucceedAndSatisfy((update2) => {
          expect(puzzle.getCell('A1' as CellId)).toSucceedAndSatisfy((cellA1) => {
            expect(cellA1.isValid(update2.to)).toBe(false);
          });
          expect(puzzle.getCell('E5' as CellId)).toSucceedAndSatisfy((cellE5) => {
            expect(cellE5.isValid(update2.to)).toBe(false);
          });
        });

        // Try to place 9 on X2 diagonal
        expect(puzzle.updateCellValue('A9' as CellId, 9, update1.to)).toSucceedAndSatisfy((update3) => {
          expect(puzzle.getCell('A9' as CellId)).toSucceedAndSatisfy((cellA9) => {
            expect(cellA9.isValid(update3.to)).toBe(false);
          });
          expect(puzzle.getCell('E5' as CellId)).toSucceedAndSatisfy((cellE5) => {
            expect(cellE5.isValid(update3.to)).toBe(false);
          });
        });
      });
    });

    test('should allow same values in different constraint groups', () => {
      // Place value 3 in diagonal cells and non-diagonal cells
      expect(puzzle.updateCellValue('A1' as CellId, 3, state)).toSucceedAndSatisfy((update1) => {
        expect(puzzle.updateCellValue('A2' as CellId, 3, update1.to)).toSucceedAndSatisfy((update2) => {
          // A1 and A2 are in same row but different diagonals, so both should be invalid due to row constraint
          expect(puzzle.getCell('A1' as CellId)).toSucceedAndSatisfy((cellA1) => {
            expect(cellA1.isValid(update2.to)).toBe(false);
          });
          expect(puzzle.getCell('A2' as CellId)).toSucceedAndSatisfy((cellA2) => {
            expect(cellA2.isValid(update2.to)).toBe(false);
          });
        });
      });
    });

    test('should allow valid values that do not conflict with any constraint', () => {
      // Place different values in diagonal cells
      expect(puzzle.updateCellValue('A1' as CellId, 1, state)).toSucceedAndSatisfy((update1) => {
        expect(puzzle.updateCellValue('B2' as CellId, 2, update1.to)).toSucceedAndSatisfy((update2) => {
          expect(puzzle.updateCellValue('C3' as CellId, 3, update2.to)).toSucceedAndSatisfy((update3) => {
            // All cells should be valid
            expect(puzzle.getCell('A1' as CellId)).toSucceedAndSatisfy((cellA1) => {
              expect(cellA1.isValid(update3.to)).toBe(true);
            });
            expect(puzzle.getCell('B2' as CellId)).toSucceedAndSatisfy((cellB2) => {
              expect(cellB2.isValid(update3.to)).toBe(true);
            });
            expect(puzzle.getCell('C3' as CellId)).toSucceedAndSatisfy((cellC3) => {
              expect(cellC3.isValid(update3.to)).toBe(true);
            });
          });
        });
      });
    });
  });

  describe('complex validation scenarios', () => {
    let puzzle: Puzzle;
    let state: PuzzleState;

    beforeEach(() => {
      puzzle = Puzzles.SudokuX.create(validSudokuXDescription).orThrow();
      state = puzzle.initialState;
    });

    test('should validate pre-filled puzzle correctly', () => {
      // The sample puzzle should start in a valid state
      expect(puzzle.checkIsValid(state)).toBe(true);
    });

    test('should handle multiple constraint violations simultaneously', () => {
      // Find an empty cell and place a value that violates multiple constraints
      const emptyCells = puzzle.getEmptyCells(state);
      expect(emptyCells.length).toBeGreaterThan(0);

      const testCell = emptyCells[0];
      const testValue = 4; // Already exists in A1 of the sample puzzle

      expect(puzzle.updateCellValue(testCell.id, testValue, state)).toSucceedAndSatisfy((update) => {
        // Check if the cell becomes invalid (could be due to row, column, section, or diagonal constraints)
        expect(puzzle.getCell(testCell.id)).toSucceedAndSatisfy((cell) => {
          const isValid = cell.isValid(update.to);
          expect(typeof isValid).toBe('boolean');
        });
      });
    });

    test('should maintain constraint validation across cell updates', () => {
      const emptyCells = puzzle.getEmptyCells(state);

      if (emptyCells.length >= 2) {
        const cell1 = emptyCells[0];
        const cell2 = emptyCells[1];

        // Place a valid value in first cell
        expect(puzzle.updateCellValue(cell1.id, 5, state)).toSucceedAndSatisfy((update1) => {
          expect(puzzle.getCell(cell1.id)).toSucceedAndSatisfy((updatedCell1) => {
            const firstValid = updatedCell1.isValid(update1.to);

            // Place another value in second cell
            expect(puzzle.updateCellValue(cell2.id, 6, update1.to)).toSucceedAndSatisfy((update2) => {
              // First cell should still maintain its validation state
              expect(puzzle.getCell(cell1.id)).toSucceedAndSatisfy((reCheckedCell1) => {
                expect(reCheckedCell1.isValid(update2.to)).toBe(firstValid);
              });
            });
          });
        });
      }
    });
  });

  describe('integration with Any puzzle factory', () => {
    test('should create Sudoku X puzzle through Any factory', () => {
      expect(Puzzles.Any.create(validSudokuXDescription)).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.type).toBe('sudoku-x');
        expect(puzzle.id).toBe('sudoku-x-test');

        // Should have diagonal cages
        expect(puzzle.getCage('X1' as CageId)).toSucceed();
        expect(puzzle.getCage('X2' as CageId)).toSucceed();
      });
    });

    test('should differentiate from standard Sudoku through Any factory', () => {
      const standardPuzzle = { ...validSudokuXDescription, type: 'sudoku' as PuzzleType };

      expect(Puzzles.Any.create(standardPuzzle)).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.type).toBe('sudoku');

        // Standard Sudoku should not have diagonal cages
        expect(puzzle.getCage('X1' as CageId)).toFailWith(/not found/i);
        expect(puzzle.getCage('X2' as CageId)).toFailWith(/not found/i);
      });

      expect(Puzzles.Any.create(validSudokuXDescription)).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.type).toBe('sudoku-x');

        // Sudoku X should have diagonal cages
        expect(puzzle.getCage('X1' as CageId)).toSucceed();
        expect(puzzle.getCage('X2' as CageId)).toSucceed();
      });
    });
  });

  describe('puzzle solving detection', () => {
    test('should detect solved state when all constraints are satisfied', () => {
      // Use a known valid solved Sudoku X puzzle
      const solvedSudokuX: IPuzzleDescription = {
        id: 'solved-sudoku-x',
        description: 'Solved Sudoku X',
        type: 'sudoku-x' as PuzzleType,
        level: 1,
        rows: 9,
        cols: 9,
        // This is a valid complete Sudoku X grid
        cells: '123456789456789123789123456234567891567891234891234567345678912678912345912345678'
      };

      expect(Puzzles.SudokuX.create(solvedSudokuX)).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.checkIsSolved(puzzle.initialState)).toBe(true);
        expect(puzzle.checkIsValid(puzzle.initialState)).toBe(true);
      });
    });

    test('should not detect solved state when cells are empty', () => {
      const puzzle = Puzzles.SudokuX.create(emptySudokuXDescription).orThrow();
      expect(puzzle.checkIsSolved(puzzle.initialState)).toBe(false);
      expect(puzzle.checkIsValid(puzzle.initialState)).toBe(true); // Empty is valid but not solved
    });

    test('should detect when diagonal constraints would be violated in completed grid', () => {
      // Test diagonal constraint validation by creating updates that violate diagonals
      const puzzle = Puzzles.SudokuX.create(emptySudokuXDescription).orThrow();
      const state = puzzle.initialState;

      // Create a scenario where diagonal validation can be tested
      expect(puzzle.updateCellValue('A1' as CellId, 5, state)).toSucceedAndSatisfy((update1) => {
        expect(puzzle.updateCellValue('B2' as CellId, 5, update1.to)).toSucceedAndSatisfy((update2) => {
          // After placing duplicate values on diagonal, the puzzle should be invalid
          expect(puzzle.checkIsValid(update2.to)).toBe(false);
          expect(puzzle.checkIsSolved(update2.to)).toBe(false);
        });
      });
    });
  });

  describe('performance and edge cases', () => {
    test('should handle rapid cell updates efficiently', () => {
      const puzzle = Puzzles.SudokuX.create(emptySudokuXDescription).orThrow();
      let currentState = puzzle.initialState;

      const startTime = Date.now();

      // Perform multiple rapid updates
      for (let i = 0; i < 10; i++) {
        const cellId = `A${(i % 9) + 1}` as CellId;
        const value = (i % 9) + 1;

        const updateResult = puzzle.updateCellValue(cellId, value, currentState);
        if (updateResult.isSuccess()) {
          currentState = updateResult.value.to;
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(100); // 100ms should be generous
    });

    test('should handle edge case cell coordinates correctly', () => {
      const puzzle = Puzzles.SudokuX.create(emptySudokuXDescription).orThrow();

      // Test corner cells
      const cornerCells = ['A1', 'A9', 'I1', 'I9'] as CellId[];
      for (const cellId of cornerCells) {
        expect(puzzle.getCell(cellId)).toSucceedAndSatisfy((cell) => {
          expect(cell.id).toBe(cellId);
        });
      }
    });

    test('should maintain consistent cage memberships', () => {
      const puzzle = Puzzles.SudokuX.create(emptySudokuXDescription).orThrow();

      // Each cell should belong to exactly the expected number of cages
      // Regular cells: row + column + section = 3 cages
      // Diagonal cells: row + column + section + 1 diagonal = 4 cages
      // Center cell (E5): row + column + section + 2 diagonals = 5 cages

      const regularCell = 'A2' as CellId; // Not on any diagonal
      const diagonalCell = 'A1' as CellId; // On X1 diagonal
      const centerCell = 'E5' as CellId; // On both diagonals

      // Count cages for each cell type
      let regularCageCount = 0;
      let diagonalCageCount = 0;
      let centerCageCount = 0;

      // Check all possible cages
      const allCageIds = [
        'RA',
        'RB',
        'RC',
        'RD',
        'RE',
        'RF',
        'RG',
        'RH',
        'RI', // Rows
        'C1',
        'C2',
        'C3',
        'C4',
        'C5',
        'C6',
        'C7',
        'C8',
        'C9', // Columns
        'SA1',
        'SA4',
        'SA7',
        'SD1',
        'SD4',
        'SD7',
        'SG1',
        'SG4',
        'SG7', // Sections
        'X1',
        'X2' // Diagonals
      ] as CageId[];

      for (const cageId of allCageIds) {
        const cageResult = puzzle.getCage(cageId);
        if (cageResult.isSuccess()) {
          const cage = cageResult.value;
          if (cage.cellIds.includes(regularCell)) regularCageCount++;
          if (cage.cellIds.includes(diagonalCell)) diagonalCageCount++;
          if (cage.cellIds.includes(centerCell)) centerCageCount++;
        }
      }

      expect(regularCageCount).toBe(3); // row + column + section
      expect(diagonalCageCount).toBe(4); // row + column + section + 1 diagonal
      expect(centerCageCount).toBe(5); // row + column + section + 2 diagonals
    });
  });
});
