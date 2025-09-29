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
import { PuzzleCollections } from '../../../packlets/collections';
import {
  CageId,
  CellId,
  ICellState,
  Ids,
  Puzzle,
  PuzzleState,
  PuzzleType,
  PuzzleDefinitionFactory,
  STANDARD_CONFIGS
} from '../../../packlets/common';
import * as Puzzles from '../../../packlets/puzzles';

describe('Puzzle class', () => {
  const tests = [
    {
      // cSpell: disable
      description: 'hidden pair sample from sudowiki.org',
      type: 'sudoku' as PuzzleType,
      // cSpell: enable
      level: 1,
      rows: 9,
      cols: 9,
      cells: '.........9.46.7....768.41..3.97.1.8.7.8...3.1.513.87.2..75.261...54.32.8.........',
      expected: [
        '.........',
        '9.46.7...',
        '.768.41..',
        '3.97.1.8.',
        '7.8...3.1',
        '.513.87.2',
        '..75.261.',
        '..54.32.8',
        '.........'
      ]
    }
  ];

  describe('constructor', () => {
    test.each(tests)('succeeds for "$description"', (tc) => {
      const puzzleDefinition = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
        description: tc.description,
        type: tc.type,
        level: tc.level,
        cells: tc.cells
      });
      expect(puzzleDefinition.onSuccess((def) => Puzzles.Sudoku.create(def))).toSucceedAndSatisfy((board) => {
        expect(board.toStrings(board.initialState)).toEqual(tc.expected);
        expect(board.toString(board.initialState)).toEqual(tc.expected.join('\n'));
        expect(board.numRows).toBe(9);
        expect(board.numColumns).toBe(9);
        const row = board.getRow(1).orThrow();
        expect(row.numCells).toBe(9);
        expect(row.cellIds).toEqual(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9'] as CellId[]);
        expect(row.containedValues(board.initialState)).toEqual(new Set([4, 6, 7, 9]));
        expect(row.containsValue(1, board.initialState)).toBe(false);
        expect(row.containsValue(4, board.initialState)).toBe(true);
        expect(board.getCellContents('A1' as CellId, board.initialState)).toSucceedAndSatisfy(
          ({ cell, contents }) => {
            expect(contents.value).toBeUndefined();
            expect(cell.isValid(board.initialState)).toBe(true);
          }
        );
      });
    });

    test('fails for invalid puzzle type', () => {
      const t = { ...tests[0], type: 'killer-sudoku' as PuzzleType };
      const puzzleDefinition = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
        description: t.description,
        type: t.type,
        level: t.level,
        cells: Array.isArray(t.cells) ? t.cells.join('') : t.cells
      });
      // killer-sudoku is a valid type but requires cage format with "|" separator
      expect(puzzleDefinition.onSuccess((def) => Puzzles.Sudoku.create(def))).toFailWith(
        /cage definitions after.*separator/i
      );
    });

    test('fails for invalid grid size with cell count mismatch', () => {
      // Test: Grid with wrong cell count should fail
      const invalidDimensions = {
        cageWidthInCells: 3,
        cageHeightInCells: 3,
        boardWidthInCages: 3,
        boardHeightInCages: 4 // This creates 9x12 = 108 cells
      };
      expect(
        PuzzleDefinitionFactory.create(invalidDimensions, {
          description: 'Invalid cell count test',
          type: 'sudoku',
          level: 1,
          cells: tests[0].cells // Only 81 cells
        })
      ).toFailWith(/expected 108 cells, got 81/i);
    });

    test('fails for unsupported grid dimensions', () => {
      // Test: Invalid cage dimensions should fail validation (7x1 cage is not valid for Sudoku)
      const invalidDimensions = {
        cageWidthInCells: 7,
        cageHeightInCells: 1,
        boardWidthInCages: 1,
        boardHeightInCages: 7
      };
      expect(
        PuzzleDefinitionFactory.create(invalidDimensions, {
          description: 'Invalid 7x7 grid',
          type: 'sudoku',
          level: 1,
          cells: '.'.repeat(49)
        })
      ).toFailWith(/Cage dimensions must be at least 2x2/i);
    });

    test('fails for invalid cell definitions', () => {
      expect(
        PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
          description: tests[0].description,
          type: tests[0].type,
          level: tests[0].level,
          cells: tests[0].cells.slice(1) // Remove one character
        })
      ).toFailWith(/expected 81 cells, got 80/i);
    });

    test('fails for invalid value in cell definitions', () => {
      const cellsWithA = tests[0].cells.replace('9', 'A');
      expect(
        PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
          description: tests[0].description,
          type: tests[0].type,
          level: tests[0].level,
          cells: cellsWithA
        }).onSuccess((def) => Puzzles.Sudoku.create(def))
      ).toFailWith(/illegal value/i);

      const cellsWithZero = tests[0].cells.replace('9', '0');
      expect(
        PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
          description: tests[0].description,
          type: tests[0].type,
          level: tests[0].level,
          cells: cellsWithZero
        }).onSuccess((def) => Puzzles.Sudoku.create(def))
      ).toFailWith(/illegal value/i);
    });
  });

  describe('Standard Grid Configurations', () => {
    test('supports 4x4 grid with 2x2 cages', () => {
      const puzzle4x4 = {
        description: '4x4 Test Puzzle',
        type: 'sudoku' as PuzzleType,
        level: 1,
        rows: 4,
        cols: 4,
        cells: '1..2.3..4..12..3'
      };

      const puzzleDefinition = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle4x4, {
        description: puzzle4x4.description,
        type: puzzle4x4.type,
        level: puzzle4x4.level,
        cells: puzzle4x4.cells
      });
      expect(puzzleDefinition).toSucceedAndSatisfy((def) => {
        expect(def.totalRows).toBe(4);
        expect(def.totalColumns).toBe(4);
        expect(def.maxValue).toBe(4);
        expect(def.basicCageTotal).toBe(10); // 1+2+3+4
        expect(def.cageWidthInCells).toBe(2);
        expect(def.cageHeightInCells).toBe(2);
        expect(def.boardWidthInCages).toBe(2);
        expect(def.boardHeightInCages).toBe(2);

        // Verify puzzle creation works
        expect(Puzzles.Sudoku.create(def)).toSucceed();
      });
    });

    test('supports 6x6 grid with 3x2 cages', () => {
      const puzzle6x6 = {
        description: '6x6 Test Puzzle',
        type: 'sudoku' as PuzzleType,
        level: 1,
        rows: 6,
        cols: 6,
        cells: '12..5634....5....3..6..2....3463.6..'
      };

      const puzzleDefinition = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle6x6, {
        description: puzzle6x6.description,
        type: puzzle6x6.type,
        level: puzzle6x6.level,
        cells: puzzle6x6.cells
      });
      expect(puzzleDefinition).toSucceedAndSatisfy((def) => {
        expect(def.totalRows).toBe(6);
        expect(def.totalColumns).toBe(6);
        expect(def.maxValue).toBe(6);
        expect(def.basicCageTotal).toBe(21); // 1+2+3+4+5+6
        expect(def.cageWidthInCells).toBe(3);
        expect(def.cageHeightInCells).toBe(2);
        expect(def.boardWidthInCages).toBe(2);
        expect(def.boardHeightInCages).toBe(3);

        // Verify puzzle creation works
        expect(Puzzles.Sudoku.create(def)).toSucceed();
      });
    });

    test('supports 9x9 grid with 3x3 cages (traditional)', () => {
      const puzzleDefinition = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
        description: tests[0].description,
        type: tests[0].type,
        level: tests[0].level,
        cells: Array.isArray(tests[0].cells) ? tests[0].cells.join('') : tests[0].cells
      });
      expect(puzzleDefinition).toSucceedAndSatisfy((def) => {
        expect(def.totalRows).toBe(9);
        expect(def.totalColumns).toBe(9);
        expect(def.maxValue).toBe(9);
        expect(def.basicCageTotal).toBe(45); // 1+2+...+9
        expect(def.cageWidthInCells).toBe(3);
        expect(def.cageHeightInCells).toBe(3);
        expect(def.boardWidthInCages).toBe(3);
        expect(def.boardHeightInCages).toBe(3);

        // Verify puzzle creation works
        expect(Puzzles.Sudoku.create(def)).toSucceed();
      });
    });

    test('supports 12x12 grid with 4x3 cages', () => {
      const puzzle12x12 = {
        description: '12x12 Test Puzzle',
        type: 'sudoku' as PuzzleType,
        level: 1,
        rows: 12,
        cols: 12,
        cells: [
          '..1.6.2.A7..',
          '62.5B....1..',
          '.8....C3B.62',
          'A97.2.6..B5.',
          '.5......37C.',
          '3B....7...9.',
          '57B.4.....1.',
          '8.....A.9...',
          '.4..97...6..',
          '.1C.......B.',
          '4....2.C....',
          '....5C..7126'
        ].join('')
      };

      const puzzleDefinition = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle12x12, {
        description: puzzle12x12.description,
        type: puzzle12x12.type,
        level: puzzle12x12.level,
        cells: puzzle12x12.cells
      });
      expect(puzzleDefinition).toSucceedAndSatisfy((def) => {
        expect(def.totalRows).toBe(12);
        expect(def.totalColumns).toBe(12);
        expect(def.maxValue).toBe(12);
        expect(def.basicCageTotal).toBe(78); // 1+2+...+12
        expect(def.cageWidthInCells).toBe(4);
        expect(def.cageHeightInCells).toBe(3);
        expect(def.boardWidthInCages).toBe(3);
        expect(def.boardHeightInCages).toBe(4);

        // Verify puzzle creation works
        expect(Puzzles.Sudoku.create(def)).toSucceed();
      });
    });

    test('validates mathematical relationships for all configurations', () => {
      const configurations = [
        { name: '4x4', rows: 4, cols: 4, cells: '.'.repeat(16), config: STANDARD_CONFIGS.puzzle4x4 },
        { name: '6x6', rows: 6, cols: 6, cells: '.'.repeat(36), config: STANDARD_CONFIGS.puzzle6x6 },
        { name: '9x9', rows: 9, cols: 9, cells: '.'.repeat(81), config: STANDARD_CONFIGS.puzzle9x9 },
        { name: '12x12', rows: 12, cols: 12, cells: '.'.repeat(144), config: STANDARD_CONFIGS.puzzle12x12 }
      ];

      configurations.forEach(({ name, rows, cols, cells, config }) => {
        const testPuzzle = {
          description: `${name} Mathematical Test`,
          type: 'sudoku' as PuzzleType,
          level: 1,
          rows,
          cols,
          cells
        };

        const puzzleDefinition = PuzzleDefinitionFactory.create(config, {
          description: testPuzzle.description,
          type: testPuzzle.type,
          level: testPuzzle.level,
          cells: Array.isArray(testPuzzle.cells) ? testPuzzle.cells.join('') : testPuzzle.cells
        });
        expect(puzzleDefinition).toSucceedAndSatisfy((def) => {
          // Verify mathematical relationships
          expect(def.totalRows).toBe(def.cageHeightInCells * def.boardHeightInCages);
          expect(def.totalColumns).toBe(def.cageWidthInCells * def.boardWidthInCages);
          expect(def.maxValue).toBe(def.cageWidthInCells * def.cageHeightInCells);
          expect(def.basicCageTotal).toBe((def.maxValue * (def.maxValue + 1)) / 2);

          // Verify cell count matches
          expect(def.cells.length).toBe(def.totalRows * def.totalColumns);
        });
      });
    });
  });

  describe('getters', () => {
    let puzzle: Puzzle;
    let state: PuzzleState;
    beforeEach(() => {
      const puzzleDefinition = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
        description: tests[0].description,
        type: tests[0].type,
        level: tests[0].level,
        cells: Array.isArray(tests[0].cells) ? tests[0].cells.join('') : tests[0].cells
      }).orThrow();
      puzzle = Puzzles.Sudoku.create(puzzleDefinition).orThrow();
      state = puzzle.initialState;
    });

    test('getCellContents succeeds for valid cell', () => {
      expect(puzzle.getCellContents('B1' as CellId, state)).toSucceedAndSatisfy(({ cell, contents }) => {
        expect(cell.id).toBe('B1');
        expect(contents.value).toBe(9);
      });
    });

    test('getCellContents fails for invalid cell', () => {
      expect(puzzle.getCellContents('ABCD' as CellId, state)).toFailWith(/malformed/i);
      expect(puzzle.getCellContents('X1' as CellId, state)).toFailWith(/not found/i);
    });

    test('getRow succeeds for valid row number', () => {
      expect(puzzle.getRow(1)).toSucceedAndSatisfy((cage) => {
        expect(cage.id).toBe('RB');
        expect(cage.toString(state)).toBe('9.46.7...');
      });
    });

    test('getRow succeeds for valid row id', () => {
      expect(puzzle.getRow(Ids.cageId('RC').orThrow())).toSucceedAndSatisfy((cage) => {
        expect(cage.id).toBe('RC' as CageId);
        expect(cage.toString(state)).toBe('.768.41..');
      });
    });

    test('getRow fails for invalid row', () => {
      expect(puzzle.getRow(10)).toFailWith(/not found/i);
    });

    test('getColumn succeeds for valid column number', () => {
      expect(puzzle.getColumn(0)).toSucceedAndSatisfy((cage) => {
        expect(cage.id).toBe('C1');
        expect(cage.toString(state)).toBe('.9.37....');
      });
    });

    test('getColumn succeeds for valid column id', () => {
      expect(puzzle.getColumn('C2' as CageId)).toSucceedAndSatisfy((cage) => {
        expect(cage.id).toBe('C2');
        expect(cage.toString(state)).toBe('..7..5...');
      });
    });

    test('getColumn fails for invalid column', () => {
      expect(puzzle.getColumn(10)).toFailWith(/not found/i);
    });

    test('getSection succeeds for valid section row/column', () => {
      expect(puzzle.getSection({ row: 0, col: 0 })).toSucceedAndSatisfy((cage) => {
        expect(cage.id).toBe('SA1');
        expect(cage.toString(state)).toBe('...9.4.76');
      });
    });

    test('getSection succeeds for valid section id', () => {
      expect(puzzle.getSection('SG7' as CageId)).toSucceedAndSatisfy((cage) => {
        expect(cage.id).toBe('SG7');
        expect(cage.toString(state)).toBe('61.2.8...');
      });
    });

    test('getSection fails for invalid column', () => {
      expect(puzzle.getSection({ row: 1, col: 10 })).toFailWith(/not found/i);
    });

    test.each(['RA', 'C1', 'SA1'])('getCage succeeds for %p', (cageId) => {
      expect(puzzle.getCage(cageId as CageId)).toSucceedAndSatisfy((cage) => {
        expect(cage.id).toBe(cageId);
      });
    });

    test('getCage fails for an invalid cage', () => {
      expect(puzzle.getCage('R99' as CageId)).toFailWith(/not found/);
    });
  });

  describe('multi-get', () => {
    let puzzle: Puzzle;
    let state: PuzzleState;
    beforeEach(() => {
      const session = PuzzleCollections.default.getPuzzle('almost-done').orThrow();
      puzzle = session.puzzle;
      state = puzzle.initialState;
    });

    describe('getEmptyCells', () => {
      test('returns all empty cells', () => {
        expect(puzzle.getEmptyCells(state).map((c) => c.id)).toEqual(['A1']);
      });
    });

    describe('getInvalidCells', () => {
      test('returns all invalid cells', () => {
        expect(puzzle.updateCellValue('A1' as CellId, 9, state)).toSucceedAndSatisfy((updatedPuzzle) => {
          expect(puzzle.getInvalidCells(updatedPuzzle.to).map((c) => c.id)).toEqual(['A1']);
        });
      });
    });
  });

  describe('test methods', () => {
    let puzzle: Puzzle;
    let state: PuzzleState;
    beforeEach(() => {
      const session = PuzzleCollections.default.getPuzzle('almost-done').orThrow();
      puzzle = session.puzzle;
      state = puzzle.initialState;
    });

    describe('checkIsSolved', () => {
      test('returns true for a board in which all cells are valid and non-empty', () => {
        expect(puzzle.updateCellValue('A1' as CellId, 1, state)).toSucceedAndSatisfy((updatedPuzzle) => {
          expect(puzzle.checkIsSolved(updatedPuzzle.to)).toBe(true);
        });
      });

      test('returns false for a board with empty cells', () => {
        expect(puzzle.checkIsSolved(state)).toBe(false);
      });

      test('returns false for a board with invalid cells', () => {
        expect(puzzle.updateCellValue('A1' as CellId, 9, state)).toSucceedAndSatisfy((updatedPuzzle) => {
          expect(puzzle.checkIsSolved(updatedPuzzle.to)).toBe(false);
        });
      });
    });

    describe('checkIsValid', () => {
      test('returns true for a board in which all non-empty cells are valid', () => {
        expect(puzzle.checkIsValid(state)).toBe(true);
      });

      test('returns false for a board with invalid cells', () => {
        expect(puzzle.updateCellValue('A1' as CellId, 9, state)).toSucceedAndSatisfy((updatedPuzzle) => {
          expect(puzzle.checkIsValid(updatedPuzzle.to)).toBe(false);
        });
      });
    });
  });

  describe('update methods', () => {
    let puzzle: Puzzle;
    let state: PuzzleState;
    beforeEach(() => {
      const session = PuzzleCollections.default.getPuzzle('hidden-pair').orThrow();
      puzzle = session.puzzle;
      state = puzzle.initialState;
    });

    test('updateContents succeeds for a valid update', () => {
      const cell: ICellState = {
        id: Ids.cellId('A1').orThrow(),
        value: 1,
        notes: [1, 2, 3]
      };
      expect(puzzle.updateContents([cell], state)).toSucceedAndSatisfy((updatedPuzzle) => {
        expect(updatedPuzzle.cells).toHaveLength(1);
        expect(updatedPuzzle.cells[0].to.value).toEqual(1);
        expect(updatedPuzzle.cells[0].to.notes).toEqual([1, 2, 3]);
      });
    });

    test('updateContents fails for an invalid cell', () => {
      const cell: ICellState = {
        id: Ids.cellId('J1').orThrow(),
        value: undefined,
        notes: []
      };
      expect(puzzle.updateContents([cell], state)).toFailWith(/j1 not found/i);
    });

    test('updateContents fails for an immutable cell', () => {
      const cell = {
        id: Ids.cellId('B1').orThrow(),
        value: undefined,
        notes: [],
        immutable: false
      };
      expect(puzzle.updateContents(cell, state)).toFailWith(/cannot set value/i);
    });

    describe('updateCellValue', () => {
      test('succeeds for a valid add', () => {
        expect(puzzle.updateCellValue({ row: 0, col: 8 }, 3, state)).toSucceedAndSatisfy((puzzleUpdate) => {
          expect(puzzle.toStrings(puzzleUpdate.to)).toEqual([
            '........3',
            '9.46.7...',
            '.768.41..',
            '3.97.1.8.',
            '7.8...3.1',
            '.513.87.2',
            '..75.261.',
            '..54.32.8',
            '.........'
          ]);
        });
      });

      test('does not affect the original state', () => {
        expect(puzzle.updateCellValue('A9' as CellId, 3, state)).toSucceedAndSatisfy((puzzleUpdate) => {
          expect(puzzle.toStrings(puzzleUpdate.to)).toEqual([
            '........3',
            '9.46.7...',
            '.768.41..',
            '3.97.1.8.',
            '7.8...3.1',
            '.513.87.2',
            '..75.261.',
            '..54.32.8',
            '.........'
          ]);
          expect(puzzle.toStrings(state)).not.toEqual(puzzle.toStrings(puzzleUpdate.to));
        });
      });

      test('allows setting a mutable value to undefined', () => {
        expect(puzzle.updateCellValue('A9' as CellId, 3, state)).toSucceedAndSatisfy((puzzleUpdate) => {
          expect(puzzle.toStrings(puzzleUpdate.to)).toEqual([
            '........3',
            '9.46.7...',
            '.768.41..',
            '3.97.1.8.',
            '7.8...3.1',
            '.513.87.2',
            '..75.261.',
            '..54.32.8',
            '.........'
          ]);
          expect(puzzle.getCellContents('A9' as CellId, puzzleUpdate.to)).toSucceedAndSatisfy(
            ({ cell, contents }) => {
              expect(contents.value).toBe(3);
              expect(cell.isValid(state)).toBe(true);
            }
          );

          expect(puzzle.updateCellValue('A9' as CellId, undefined, puzzleUpdate.to)).toSucceedAndSatisfy(
            (secondUpdate) => {
              expect(puzzle.toStrings(secondUpdate.to)).toEqual([
                '.........',
                '9.46.7...',
                '.768.41..',
                '3.97.1.8.',
                '7.8...3.1',
                '.513.87.2',
                '..75.261.',
                '..54.32.8',
                '.........'
              ]);
            }
          );
        });
      });

      test('fails even for an invalid (conflicting value)', () => {
        expect(puzzle.updateCellValue('A1' as CellId, 9, state)).toSucceedAndSatisfy((puzzleUpdate) => {
          expect(puzzle.toStrings(puzzleUpdate.to)).toEqual([
            '9........',
            '9.46.7...',
            '.768.41..',
            '3.97.1.8.',
            '7.8...3.1',
            '.513.87.2',
            '..75.261.',
            '..54.32.8',
            '.........'
          ]);
          expect(puzzle.getCell('A1' as CellId)).toSucceedAndSatisfy((cell) => {
            expect(cell.isValid(puzzleUpdate.to)).toBe(false);
          });
          expect(puzzle.getCell('B1' as CellId)).toSucceedAndSatisfy((cell) => {
            expect(cell.isValid(puzzleUpdate.to)).toBe(true);
          });
        });
      });

      test('fails for an immutable cell', () => {
        expect(puzzle.updateCellValue('B1' as CellId, 3, state)).toFailWith(/cannot set value/i);
      });
    });

    describe('updateNotes', () => {
      describe('updates notes', () => {
        test('updates notes', () => {
          expect(puzzle.updateCellNotes({ row: 0, col: 8 }, [3, 4, 5, 6, 9], state)).toSucceedAndSatisfy(
            (puzzleUpdate) => {
              expect(puzzle.getCellContents('A9' as CellId, puzzleUpdate.to)).toSucceedAndSatisfy(
                ({ contents }) => {
                  expect(contents.notes).toEqual([3, 4, 5, 6, 9]);
                }
              );
            }
          );
        });
      });
    });
  });
});
