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
  PuzzleDefinitionFactory
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
      expect(
        PuzzleDefinitionFactory.fromLegacy(tc).onSuccess((puzzleDefinition) =>
          Puzzles.Sudoku.create(puzzleDefinition)
        )
      ).toSucceedAndSatisfy((board) => {
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
      expect(
        PuzzleDefinitionFactory.fromLegacy(t).onSuccess((puzzleDefinition) =>
          Puzzles.Sudoku.create(puzzleDefinition)
        )
      ).toFailWith(/unsupported type/i);
    });

    test('fails for invalid row count', () => {
      const t = { ...tests[0], rows: 10 };
      expect(PuzzleDefinitionFactory.fromLegacy(t)).toFailWith(
        /Cannot determine reasonable cage dimensions/i
      );
    });

    test('fails for invalid column count', () => {
      const t = { ...tests[0], cols: 10 };
      expect(PuzzleDefinitionFactory.fromLegacy(t)).toFailWith(
        /Cannot determine reasonable cage dimensions/i
      );
    });

    test('fails for invalid cell definitions', () => {
      const t = { ...tests[0], cells: tests[0].cells.slice(1) };
      expect(PuzzleDefinitionFactory.fromLegacy(t)).toFailWith(/Expected 81 cells, got 80/i);
    });

    test('fails for invalid value in cell definitions', () => {
      const cells = tests[0].cells.replace('9', 'A');
      const t = { ...tests[0], cells };
      expect(
        PuzzleDefinitionFactory.fromLegacy(t).onSuccess((puzzleDefinition) =>
          Puzzles.Sudoku.create(puzzleDefinition)
        )
      ).toFailWith(/illegal value/i);

      t.cells = t.cells.replace('A', '0');
      expect(
        PuzzleDefinitionFactory.fromLegacy(t).onSuccess((puzzleDefinition) =>
          Puzzles.Sudoku.create(puzzleDefinition)
        )
      ).toFailWith(/illegal value/i);
    });
  });

  describe('getters', () => {
    let puzzle: Puzzle;
    let state: PuzzleState;
    beforeEach(() => {
      const puzzleDefinition = PuzzleDefinitionFactory.fromLegacy(tests[0]).orThrow();
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
      const desc = PuzzleCollections.default.getDescription('almost-done').orThrow();
      puzzle = Puzzles.Any.create(desc).orThrow();
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
      const desc = PuzzleCollections.default.getDescription('almost-done').orThrow();
      puzzle = Puzzles.Any.create(desc).orThrow();
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
      const desc = PuzzleCollections.default.getDescription('hidden-pair').orThrow();
      puzzle = Puzzles.Any.create(desc).orThrow();
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
