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
  Ids,
  NavigationDirection,
  NavigationWrap,
  PuzzleCollections,
  PuzzleSession,
  PuzzleType
} from '../../../src';
import { PuzzleDescription } from '../../../src/file/model';

describe('PuzzleSession class', () => {
  const testPuzzle: PuzzleDescription = {
    id: 'test',
    // cSpell: disable
    description: 'hidden pair sample from sudowiki.org',
    type: 'sudoku' as PuzzleType,
    // cSpell: enable
    level: 1,
    rows: 9,
    cols: 9,
    cells: [
      '.........',
      '9.46.7...',
      '.768.41..',
      '3.97.1.8.',
      '7.8...3.1',
      '.513.87.2',
      '..75.261.',
      '..54.32.8',
      '.........'
    ].join('')
  };

  let puzzle: PuzzleSession;
  beforeEach(() => {
    puzzle = PuzzleSession.create(testPuzzle).orThrow();
  });

  describe('basic getters', () => {
    test('propagate values from the supplied description', () => {
      expect(puzzle.id).toEqual(testPuzzle.id);
      expect(puzzle.description).toEqual(testPuzzle.description);
      expect(puzzle.numRows).toEqual(testPuzzle.rows);
      expect(puzzle.numColumns).toEqual(testPuzzle.cols);
      expect(puzzle.rows.map((r) => r.id)).toEqual(['RA', 'RB', 'RC', 'RD', 'RE', 'RF', 'RG', 'RH', 'RI']);
      expect(puzzle.cols.map((c) => c.id)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9']);
      expect(puzzle.sections.map((c) => c.id)).toEqual([
        'SA1',
        'SA4',
        'SA7',
        'SD1',
        'SD4',
        'SD7',
        'SG1',
        'SG4',
        'SG7'
      ]);
      expect(puzzle.cages.map((c) => c.id)).toEqual([
        'RA',
        'RB',
        'RC',
        'RD',
        'RE',
        'RF',
        'RG',
        'RH',
        'RI',
        'C1',
        'C2',
        'C3',
        'C4',
        'C5',
        'C6',
        'C7',
        'C8',
        'C9',
        'SA1',
        'SA4',
        'SA7',
        'SD1',
        'SD4',
        'SD7',
        'SG1',
        'SG4',
        'SG7'
      ]);
      expect(puzzle.cells.map((c) => c.id)).toEqual([
        'A1',
        'A2',
        'A3',
        'A4',
        'A5',
        'A6',
        'A7',
        'A8',
        'A9',
        'B1',
        'B2',
        'B3',
        'B4',
        'B5',
        'B6',
        'B7',
        'B8',
        'B9',
        'C1',
        'C2',
        'C3',
        'C4',
        'C5',
        'C6',
        'C7',
        'C8',
        'C9',
        'D1',
        'D2',
        'D3',
        'D4',
        'D5',
        'D6',
        'D7',
        'D8',
        'D9',
        'E1',
        'E2',
        'E3',
        'E4',
        'E5',
        'E6',
        'E7',
        'E8',
        'E9',
        'F1',
        'F2',
        'F3',
        'F4',
        'F5',
        'F6',
        'F7',
        'F8',
        'F9',
        'G1',
        'G2',
        'G3',
        'G4',
        'G5',
        'G6',
        'G7',
        'G8',
        'G9',
        'H1',
        'H2',
        'H3',
        'H4',
        'H5',
        'H6',
        'H7',
        'H8',
        'H9',
        'I1',
        'I2',
        'I3',
        'I4',
        'I5',
        'I6',
        'I7',
        'I8',
        'I9'
      ]);
    });
  });

  describe('checkIsSolved', () => {
    let almostDone: PuzzleSession;

    beforeEach(() => {
      almostDone = PuzzleCollections.default.getPuzzle('almost-done').orThrow();
    });

    test('returns true if all cells are filled and valid', () => {
      expect(almostDone.updateCellValue({ row: 0, col: 0 }, 1)).toSucceed();
      expect(almostDone.checkIsSolved()).toBe(true);
    });

    test('returns false if puzzle is incomplete', () => {
      expect(almostDone.checkIsSolved()).toBe(false);
    });

    test('returns false if puzzle if completely filled but some cells are invalid', () => {
      expect(almostDone.updateCellValue({ row: 0, col: 0 }, 9)).toSucceed();
      expect(almostDone.checkIsSolved()).toBe(false);
    });
  });

  describe('checkIsValid', () => {
    test('returns true filled cells are valid', () => {
      expect(puzzle.updateCellValue({ row: 0, col: 0 }, 1)).toSucceed();
      expect(puzzle.checkIsValid()).toBe(true);
    });

    test('returns false if puzzle if any cells are invalid', () => {
      expect(puzzle.updateCellValue({ row: 0, col: 0 }, 9)).toSucceed();
      expect(puzzle.checkIsValid()).toBe(false);
    });
  });

  describe('isValidForCell', () => {
    test('return true for a valid value', () => {
      expect(puzzle.isValidForCell({ row: 0, col: 0 }, 1)).toBe(true);
    });

    test('return false for an invalid value or cell', () => {
      expect(puzzle.isValidForCell({ row: 0, col: 0 }, 9)).toBe(false);
      expect(puzzle.isValidForCell('X9', 1)).toBe(false);
    });
  });

  describe('cellIsValid', () => {
    beforeEach(() => {
      puzzle.updateCellValue(puzzle.cells[0], 1);
      puzzle.updateCellValue(puzzle.cells[1], 9);
    });

    test.each([
      ['valid cell', 'A1'],
      ['empty cell', 'A3'],
      ['immutable cell', 'B1']
    ])('returns true for %p', (_desc, id) => {
      expect(puzzle.cellIsValid(id)).toBe(true);
    });

    test.each([
      ['cell with invalid contents', 'A2'],
      ['invalid cell', 'Z9']
    ])('returns false for %p', (_desc, id) => {
      expect(puzzle.cellIsValid(id)).toBe(false);
    });
  });

  describe('cellHasValue', () => {
    beforeEach(() => {
      puzzle.updateCellValue(puzzle.cells[0], 1);
      puzzle.updateCellValue(puzzle.cells[1], 9);
    });

    test.each([
      ['cell with valid contents', 'A1'],
      ['cell with invalid contents', 'A2'],
      ['immutable cell', 'B1']
    ])('returns true for %p', (_desc, id) => {
      expect(puzzle.cellHasValue(id)).toBe(true);
    });

    test.each([
      ['empty cell', 'A3'],
      ['invalid cell', 'Z9']
    ])('returns false for %p', (_desc, id) => {
      expect(puzzle.cellHasValue(id)).toBe(false);
    });
  });

  describe('getEmptyCells', () => {
    test('gets all empty cells in a puzzle', () => {
      const empty1 = puzzle.getEmptyCells();
      expect(empty1.filter((c) => puzzle.cellHasValue(c))).toHaveLength(0);

      expect(puzzle.updateCellValue({ row: 0, col: 0 }, 1)).toSucceed();
      const empty2 = puzzle.getEmptyCells();
      expect(empty2.filter((c) => puzzle.cellHasValue(c))).toHaveLength(0);
      expect(empty2.length).toEqual(empty1.length - 1);
    });
  });

  describe('getInvalidCells', () => {
    test('gets all invalid cells in a puzzle', () => {
      const invalid1 = puzzle.getInvalidCells();
      expect(invalid1).toHaveLength(0);

      expect(puzzle.updateCellValue({ row: 0, col: 0 }, 1)).toSucceed(); // valid
      expect(puzzle.updateCellValue({ row: 0, col: 1 }, 9)).toSucceed(); // invalid

      const invalid2 = puzzle.getInvalidCells();
      expect(invalid2).toHaveLength(1);
      expect(invalid2[0].id).toBe('A2');
      expect(puzzle.cellIsValid(invalid2[0])).toBe(false);
    });
  });

  describe('updateCellValue', () => {
    test('allows multiple moves', () => {
      expect(puzzle.nextStep).toBe(0);
      expect(puzzle.numSteps).toBe(0);

      expect(puzzle.updateCellValue('A1', 1)).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(1);
        expect(puzzle.numSteps).toBe(1);
        expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells.replace(/^./, '1'));
      });

      expect(puzzle.updateCellValue({ row: 0, col: 1 }, 2)).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(2);
        expect(puzzle.numSteps).toBe(2);
        expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells.replace(/^../, '12'));
      });
    });
  });

  describe('updateCellNotes', () => {
    test('allows multiple moves', () => {
      expect(puzzle.nextStep).toBe(0);
      expect(puzzle.numSteps).toBe(0);

      expect(puzzle.updateCellNotes('A1', [1, 2, 3])).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(1);
        expect(puzzle.numSteps).toBe(1);
        expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells);
        expect(puzzle.getCellContents(Ids.cellId('A1').orThrow())).toSucceedAndSatisfy(({ contents }) => {
          expect(contents.notes).toEqual([1, 2, 3]);
        });
      });

      expect(puzzle.updateCellNotes({ row: 0, col: 1 }, [4, 5, 6])).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(2);
        expect(puzzle.numSteps).toBe(2);
        expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells);
        expect(puzzle.getCellContents(Ids.cellId('A2').orThrow())).toSucceedAndSatisfy(({ contents }) => {
          expect(contents.notes).toEqual([4, 5, 6]);
        });
      });
    });
  });

  describe('updateCells', () => {
    test('makes multiple updates at once', () => {
      expect(puzzle.nextStep).toBe(0);
      expect(puzzle.numSteps).toBe(0);

      expect(
        puzzle.updateCells([
          {
            id: Ids.cellId('A1').orThrow(),
            value: 7,
            notes: []
          },
          {
            id: Ids.cellId('A2').orThrow(),
            value: undefined,
            notes: [1, 2, 3]
          }
        ])
      ).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(1);
        expect(puzzle.numSteps).toBe(1);
        expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells.replace(/^./, '7'));
        expect(puzzle.getCellContents({ row: 0, col: 1 })).toSucceedAndSatisfy(({ contents }) => {
          expect(contents.notes).toEqual([1, 2, 3]);
        });
      });
    });
  });

  describe('cageContainsValue', () => {
    test('returns true if a cage contains the requested value', () => {
      expect(puzzle.cageContainsValue(puzzle.rows[1], 9)).toBe(true);
      expect(puzzle.cageContainsValue(puzzle.cols[0], 9)).toBe(true);
      expect(puzzle.cageContainsValue(puzzle.sections[0], 9)).toBe(true);
    });

    test('returns false if a cage does not contain the requested value', () => {
      expect(puzzle.cageContainsValue('R1', 9)).toBe(false);
      expect(puzzle.cageContainsValue('R2', 1)).toBe(false);
    });

    test('returns false if a cage specification is invalid', () => {
      expect(puzzle.cageContainsValue('XX', 1)).toBe(false);
    });
  });

  describe('cageContainedValues', () => {
    test('returns the values in a cage', () => {
      expect(puzzle.cageContainedValues('R0')).toEqual(new Set<number>());
      expect(puzzle.cageContainedValues('SA1')).toEqual(new Set([4, 6, 7, 9]));
    });

    test('returns an empty set for an invalid cage', () => {
      expect(puzzle.cageContainedValues('RZ')).toEqual(new Set());
    });
  });

  describe('getCellNeighbor', () => {
    interface TestCase {
      description: string;
      cell: string;
      direction: NavigationDirection;
      wrap: NavigationWrap;
      expected: string | RegExp;
    }
    const tests: TestCase[] = [
      {
        description: 'interior cell',
        cell: 'B5',
        direction: 'left',
        wrap: 'none',
        expected: 'B4'
      },
      {
        description: 'interior cell',
        cell: 'B5',
        direction: 'right',
        wrap: 'none',
        expected: 'B6'
      },
      {
        description: 'interior cell',
        cell: 'B5',
        direction: 'up',
        wrap: 'none',
        expected: 'A5'
      },
      {
        description: 'interior cell',
        cell: 'B5',
        direction: 'down',
        wrap: 'none',
        expected: 'C5'
      },
      {
        description: 'edge cell',
        cell: 'B1',
        direction: 'left',
        wrap: 'none',
        expected: /cannot move left/i
      },
      {
        description: 'edge cell',
        cell: 'B9',
        direction: 'right',
        wrap: 'none',
        expected: /cannot move right/i
      },
      {
        description: 'edge cell',
        cell: 'A5',
        direction: 'up',
        wrap: 'none',
        expected: /cannot move up/i
      },
      {
        description: 'edge cell',
        cell: 'I5',
        direction: 'down',
        wrap: 'none',
        expected: /cannot move down/i
      },
      {
        description: 'edge cell',
        cell: 'B1',
        direction: 'left',
        wrap: 'wrap-around',
        expected: 'B9'
      },
      {
        description: 'edge cell',
        cell: 'B9',
        direction: 'right',
        wrap: 'wrap-around',
        expected: 'B1'
      },
      {
        description: 'edge cell',
        cell: 'A5',
        direction: 'up',
        wrap: 'wrap-around',
        expected: 'I5'
      },
      {
        description: 'edge cell',
        cell: 'I5',
        direction: 'down',
        wrap: 'wrap-around',
        expected: 'A5'
      },
      {
        description: 'edge cell',
        cell: 'B1',
        direction: 'left',
        wrap: 'wrap-next',
        expected: 'A9'
      },
      {
        description: 'edge cell',
        cell: 'B9',
        direction: 'right',
        wrap: 'wrap-next',
        expected: 'C1'
      },
      {
        description: 'edge cell',
        cell: 'A5',
        direction: 'up',
        wrap: 'wrap-next',
        expected: 'I4'
      },
      {
        description: 'edge cell',
        cell: 'I5',
        direction: 'down',
        wrap: 'wrap-next',
        expected: 'A6'
      },
      {
        description: 'corner cell',
        cell: 'A1',
        direction: 'left',
        wrap: 'wrap-next',
        expected: 'I9'
      },
      {
        description: 'corner cell',
        cell: 'A1',
        direction: 'up',
        wrap: 'wrap-next',
        expected: 'I9'
      },
      {
        description: 'corner cell',
        cell: 'I9',
        direction: 'right',
        wrap: 'wrap-next',
        expected: 'A1'
      },
      {
        description: 'corner cell',
        cell: 'I9',
        direction: 'down',
        wrap: 'wrap-next',
        expected: 'A1'
      }
    ];
    test.each(tests)('$direction from $description $cell with wrap $wrap returns $expected', (tc) => {
      if (typeof tc.expected === 'string') {
        expect(puzzle.getCellNeighbor(tc.cell, tc.direction, tc.wrap)).toSucceedAndSatisfy((next) => {
          expect(next.id).toEqual(tc.expected);
        });
      } else {
        expect(puzzle.getCellNeighbor(tc.cell, tc.direction, tc.wrap)).toFailWith(tc.expected);
      }
    });
  });

  describe('undo method', () => {
    test('steps back through multiple moves', () => {
      expect(puzzle.nextStep).toBe(0);
      expect(puzzle.numSteps).toBe(0);
      expect(puzzle.canUndo).toBe(false);

      expect(puzzle.updateCellValue({ row: 0, col: 0 }, 1)).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(1);
        expect(puzzle.numSteps).toBe(1);
        expect(puzzle.canUndo).toBe(true);
        expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells.replace(/^./, '1'));
      });

      expect(puzzle.updateCellValue({ row: 0, col: 1 }, 2)).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(2);
        expect(puzzle.numSteps).toBe(2);
        expect(puzzle.canUndo).toBe(true);
        expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells.replace(/^../, '12'));
      });
      expect(puzzle.updateCellValue({ row: 0, col: 2 }, 3)).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(3);
        expect(puzzle.numSteps).toBe(3);
        expect(puzzle.canUndo).toBe(true);
        expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells.replace(/^.../, '123'));
      });

      expect(puzzle.undo()).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(2);
        expect(puzzle.numSteps).toBe(3);
        expect(puzzle.canUndo).toBe(true);
        expect(puzzle.canRedo).toBe(true);
        expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells.replace(/^../, '12'));
      });

      expect(puzzle.undo()).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(1);
        expect(puzzle.numSteps).toBe(3);
        expect(puzzle.canUndo).toBe(true);
        expect(puzzle.canRedo).toBe(true);
        expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells.replace(/^./, '1'));
      });

      expect(puzzle.undo()).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(0);
        expect(puzzle.numSteps).toBe(3);
        expect(puzzle.canUndo).toBe(false);
        expect(puzzle.canRedo).toBe(true);
        expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells);
      });

      expect(puzzle.undo()).toFailWith(/nothing to undo/i);
    });
  });

  describe('redo method', () => {
    test('steps forward through multiple moves', () => {
      expect(puzzle.nextStep).toBe(0);
      expect(puzzle.numSteps).toBe(0);
      expect(puzzle.canUndo).toBe(false);

      expect(puzzle.updateCellValue({ row: 0, col: 0 }, 1)).toSucceed();
      expect(puzzle.updateCellValue({ row: 0, col: 1 }, 2)).toSucceed();
      expect(puzzle.updateCellValue({ row: 0, col: 2 }, 3)).toSucceed();
      expect(puzzle.updateCellNotes({ row: 0, col: 3 }, [4, 5, 6])).toSucceed();
      expect(puzzle.getCellContents(Ids.cellId('A4').orThrow())).toSucceedAndSatisfy(({ contents }) => {
        expect(contents.notes).toEqual([4, 5, 6]);
      });

      expect(puzzle.undo()).toSucceed();
      expect(puzzle.undo()).toSucceed();
      expect(puzzle.undo()).toSucceed();
      expect(puzzle.undo()).toSucceed();
      expect(puzzle.undo()).toFailWith(/nothing to undo/i);

      expect(puzzle.nextStep).toBe(0);
      expect(puzzle.numSteps).toBe(4);
      expect(puzzle.canRedo).toBe(true);
      expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells);
      expect(puzzle.getCellContents(Ids.cellId('A4').orThrow())).toSucceedAndSatisfy(({ contents }) => {
        expect(contents.notes).toEqual([]);
      });

      expect(puzzle.redo()).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(1);
        expect(puzzle.numSteps).toBe(4);
        expect(puzzle.canRedo).toBe(true);
        expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells.replace(/^./, '1'));
        expect(puzzle.getCellContents(Ids.cellId('A4').orThrow())).toSucceedAndSatisfy(({ contents }) => {
          expect(contents.notes).toEqual([]);
        });
      });

      expect(puzzle.redo()).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(2);
        expect(puzzle.numSteps).toBe(4);
        expect(puzzle.canRedo).toBe(true);
        expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells.replace(/^../, '12'));
        expect(puzzle.getCellContents(Ids.cellId('A4').orThrow())).toSucceedAndSatisfy(({ contents }) => {
          expect(contents.notes).toEqual([]);
        });
      });

      expect(puzzle.redo()).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(3);
        expect(puzzle.numSteps).toBe(4);
        expect(puzzle.canRedo).toBe(true);
        expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells.replace(/^.../, '123'));
        expect(puzzle.getCellContents(Ids.cellId('A4').orThrow())).toSucceedAndSatisfy(({ contents }) => {
          expect(contents.notes).toEqual([]);
        });
      });

      expect(puzzle.redo()).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(4);
        expect(puzzle.numSteps).toBe(4);
        expect(puzzle.canRedo).toBe(false);
        expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells.replace(/^.../, '123'));
        expect(puzzle.getCellContents(Ids.cellId('A4').orThrow())).toSucceedAndSatisfy(({ contents }) => {
          expect(contents.notes).toEqual([4, 5, 6]);
        });
      });

      expect(puzzle.redo()).toFailWith(/nothing to redo/i);
    });

    test('adding a new step cancels redo', () => {
      expect(puzzle.nextStep).toBe(0);
      expect(puzzle.numSteps).toBe(0);
      expect(puzzle.canUndo).toBe(false);

      expect(puzzle.updateCellValue({ row: 0, col: 0 }, 1)).toSucceed();
      expect(puzzle.updateCellValue({ row: 0, col: 1 }, 2)).toSucceed();
      expect(puzzle.updateCellValue({ row: 0, col: 2 }, 3)).toSucceed();
      expect(puzzle.updateCellNotes({ row: 0, col: 3 }, [4, 5, 6])).toSucceed();
      expect(puzzle.getCellContents(Ids.cellId('A4').orThrow())).toSucceedAndSatisfy(({ contents }) => {
        expect(contents.notes).toEqual([4, 5, 6]);
      });

      expect(puzzle.undo()).toSucceed();
      expect(puzzle.undo()).toSucceed();
      expect(puzzle.undo()).toSucceed();
      expect(puzzle.undo()).toSucceed();
      expect(puzzle.undo()).toFailWith(/nothing to undo/i);

      expect(puzzle.nextStep).toBe(0);
      expect(puzzle.numSteps).toBe(4);
      expect(puzzle.canRedo).toBe(true);
      expect(puzzle.toStrings().join('')).toEqual(testPuzzle.cells);
      expect(puzzle.getCellContents(Ids.cellId('A4').orThrow())).toSucceedAndSatisfy(({ contents }) => {
        expect(contents.notes).toEqual([]);
      });

      expect(puzzle.redo()).toSucceed();
      expect(puzzle.updateCellValue({ row: 1, col: 1 }, 8)).toSucceedAndSatisfy(() => {
        expect(puzzle.nextStep).toBe(2);
        expect(puzzle.numSteps).toBe(2);
        expect(puzzle.canRedo).toBe(false);
        expect(puzzle.toStrings().join('')).toEqual(
          testPuzzle.cells.replace(/^./, '1').replace('9.46', '9846')
        );
      });
    });
  });
});
