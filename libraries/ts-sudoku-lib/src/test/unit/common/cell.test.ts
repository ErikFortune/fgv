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
import { CellId, Puzzle, PuzzleState, PuzzleType, PuzzleDefinitionFactory } from '../../../packlets/common';
import * as Puzzles from '../../../packlets/puzzles';

describe('Cell class', () => {
  let puzzle: Puzzle;
  let state: PuzzleState;

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

  beforeEach(() => {
    const puzzleDefinition = PuzzleDefinitionFactory.fromLegacy(tests[0]).orThrow();
    puzzle = Puzzles.Sudoku.create(puzzleDefinition).orThrow();
    state = puzzle.initialState;
  });

  describe('isValid', () => {
    test('is true for an empty cell', () => {
      expect(puzzle.getCell('A9')).toSucceedAndSatisfy((cell) => {
        expect(cell.isValid(state)).toBe(true);
      });
    });

    test('is true for an updated cell with no conflicts', () => {
      expect(puzzle.updateCellValue('A1', 1, state)).toSucceedAndSatisfy((puzzleUpdate) => {
        expect(puzzle.getCellContents('A1', puzzleUpdate.to)).toSucceedAndSatisfy(({ cell, contents }) => {
          expect(contents.value).toBe(1);
          expect(cell.isValid(puzzleUpdate.to)).toBe(true);
        });
      });
    });

    test('is false for an updated cell with conflicts', () => {
      expect(puzzle.updateCellValue('A1', 9, state)).toSucceedAndSatisfy((puzzleUpdate) => {
        expect(puzzle.getCellContents('A1', puzzleUpdate.to)).toSucceedAndSatisfy(({ cell, contents }) => {
          expect(contents.value).toBe(9);
          expect(cell.isValid(puzzleUpdate.to)).toBe(false);
        });
      });
    });

    test('is true for an immutable cell with conflicts', () => {
      expect(puzzle.updateCellValue('A1', 9, state)).toSucceedAndSatisfy((puzzleUpdate) => {
        expect(puzzle.getCellContents('B1', puzzleUpdate.to)).toSucceedAndSatisfy(({ cell, contents }) => {
          expect(contents.value).toBe(9);
          expect(cell.isValid(puzzleUpdate.to)).toBe(true);
        });
      });
    });
  });

  describe('hasValue', () => {
    test('is true for an immutable cell', () => {
      expect(puzzle.getCell('B1')).toSucceedAndSatisfy((cell) => {
        expect(cell.immutable).toBe(true);
        expect(cell.hasValue(state)).toBe(true);
      });
    });

    test('is true for non-immutable cell with a value', () => {
      expect(puzzle.updateCellValue('A1', 9, state)).toSucceedAndSatisfy((puzzleUpdate) => {
        expect(puzzle.getCell('A1')).toSucceedAndSatisfy((cell) => {
          expect(cell.immutable).toBe(false);
          expect(cell.hasValue(puzzleUpdate.to)).toBe(true);
        });
      });
    });

    test('is false for an empty cell', () => {
      expect(puzzle.getCell('A1')).toSucceedAndSatisfy((cell) => {
        expect(cell.hasValue(state)).toBe(false);
      });
    });
  });

  describe('isValidValue', () => {
    test('returns true for a non-conflicting update to a mutable cell', () => {
      expect(puzzle.getCell('A1' as CellId)).toSucceedAndSatisfy((cell) => {
        expect(cell.isValidValue(1, state)).toBe(true);
      });
    });

    test('returns false for a conflicting update to a mutable cell', () => {
      expect(puzzle.getCell('A1' as CellId)).toSucceedAndSatisfy((cell) => {
        expect(cell.isValidValue(9, state)).toBe(false);
      });
    });

    test('returns true for a matching update to a mutable cell even if the value is already present', () => {
      expect(puzzle.updateCellValue('A1' as CellId, 1, state)).toSucceedAndSatisfy((puzzleUpdate) => {
        expect(puzzle.getCellContents('A1' as CellId, puzzleUpdate.to)).toSucceedAndSatisfy(
          ({ cell, contents }) => {
            expect(contents.value).toBe(1);
            expect(cell.isValid(puzzleUpdate.to)).toBe(true);
            expect(cell.isValidValue(1, puzzleUpdate.to)).toBe(true);
          }
        );
      });
    });

    test('returns false for a conflicting update to a mutable cell even if the value is already present', () => {
      expect(puzzle.updateCellValue('A1' as CellId, 9, state)).toSucceedAndSatisfy((puzzleUpdate) => {
        expect(puzzle.getCellContents('A1' as CellId, puzzleUpdate.to)).toSucceedAndSatisfy(
          ({ cell, contents }) => {
            expect(contents.value).toBe(9);
            expect(cell.isValidValue(9, puzzleUpdate.to)).toBe(false);
          }
        );
      });
    });

    test('returns true for "undefined" on any mutable cell', () => {
      expect(puzzle.updateCellValue('A1' as CellId, 9, state)).toSucceedAndSatisfy((puzzleUpdate) => {
        expect(puzzle.getCellContents('A1' as CellId, puzzleUpdate.to)).toSucceedAndSatisfy(
          ({ cell, contents }) => {
            expect(contents.value).toBe(9);
            expect(cell.isValidValue(undefined, puzzleUpdate.to)).toBe(true);
          }
        );
      });
    });

    test('returns false for any value in an immutable cell', () => {
      expect(puzzle.getCellContents('B1' as CellId, state)).toSucceedAndSatisfy(({ cell, contents }) => {
        expect(cell.isValidValue(undefined, state)).toBe(false);
        expect(cell.isValidValue(contents.value, state)).toBe(false);
        expect(cell.isValidValue(1, state)).toBe(false);
      });
    });
  });

  describe('update method', () => {
    test('succeeds with an update for a non-immutable cell', () => {
      const cell = puzzle.getCell('A1').orThrow();
      expect(cell.update(1, [1, 2, 3])).toSucceedWith({
        id: 'A1' as CellId,
        value: 1,
        notes: [1, 2, 3]
      });
    });

    test('fails to update an immutable cell', () => {
      const cell = puzzle.getCell('B1').orThrow();
      expect(cell.update(1, [1, 2, 3])).toFailWith(/cannot set.*immutable/i);
    });
  });

  describe('updateValue method', () => {
    test('succeeds with an update for a non-immutable cell', () => {
      const cell = puzzle.getCell('A1').orThrow();
      expect(cell.updateValue(1, state)).toSucceedWith({
        id: 'A1' as CellId,
        value: 1,
        notes: []
      });
    });

    test('uses existing notes when present', () => {
      expect(puzzle.updateCellNotes('A1', [4, 5, 6], state)).toSucceedAndSatisfy((puzzleUpdate) => {
        const cell = puzzle.getCell('A1').orThrow();
        expect(cell.updateValue(7, puzzleUpdate.to)).toSucceedWith({
          id: 'A1' as CellId,
          value: 7,
          notes: [4, 5, 6]
        });
      });
    });

    test('fails to update an immutable cell', () => {
      const cell = puzzle.getCell('B1').orThrow();
      expect(cell.updateValue(1, state)).toFailWith(/cannot set.*immutable/i);
    });
  });

  describe('updateNotes method', () => {
    test('succeeds with an update for a non-immutable cell', () => {
      const cell = puzzle.getCell('A1').orThrow();
      expect(cell.updateNotes([7, 8, 9], state)).toSucceedWith({
        id: 'A1' as CellId,
        value: undefined,
        notes: [7, 8, 9]
      });
    });

    test('uses existing notes when present', () => {
      expect(puzzle.updateCellValue('A1', 4, state)).toSucceedAndSatisfy((puzzleUpdate) => {
        const cell = puzzle.getCell('A1').orThrow();
        expect(cell.updateNotes([1, 2, 3], puzzleUpdate.to)).toSucceedWith({
          id: 'A1' as CellId,
          value: 4,
          notes: [1, 2, 3]
        });
      });
    });

    test('fails to update an immutable cell', () => {
      const cell = puzzle.getCell('B1').orThrow();
      expect(cell.updateNotes([1, 2, 3], state)).toFailWith(/cannot set.*immutable/i);
    });
  });

  describe('toString method', () => {
    test('returns the cell value if state is supplied', () => {
      expect(puzzle.updateCellValue('A1', 3, state)).toSucceedAndSatisfy((puzzleUpdate) => {
        const cell = puzzle.getCell('A1').orThrow();
        expect(cell.toString(state)).toBe('.');
        expect(cell.toString(puzzleUpdate.to)).toBe('3');
      });
    });

    test('returns the cell immutable value if state is not supplied', () => {
      expect(puzzle.getCell('A1').orThrow().toString()).toBe('.');
      expect(puzzle.getCell('B1').orThrow().toString()).toBe('9');
    });
  });
});
