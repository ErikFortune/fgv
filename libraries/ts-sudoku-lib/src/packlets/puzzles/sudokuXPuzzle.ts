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

import { Result, captureResult, succeed, fail } from '@fgv/ts-utils';
import { Cage, CageId, CellId, IPuzzleDefinition, Ids, Puzzle } from '../common';

/**
 * @public
 */
export class SudokuXPuzzle extends Puzzle {
  private constructor(puzzle: IPuzzleDefinition, extraCages: [CageId, Cage][]) {
    super(puzzle, extraCages);
  }

  public static create(puzzle: IPuzzleDefinition): Result<Puzzle> {
    /* c8 ignore next 3 */
    if (puzzle.type !== 'sudoku-x') {
      return fail(`Puzzle '${puzzle.description}' unsupported type ${puzzle.type}`);
    }
    // Sudoku X diagonals work for any square puzzle (totalRows === totalColumns)
    if (puzzle.totalRows !== puzzle.totalColumns) {
      return fail(`Sudoku X puzzle must be square, got ${puzzle.totalRows}x${puzzle.totalColumns}`);
    }
    return captureResult(() => {
      return new SudokuXPuzzle(puzzle, SudokuXPuzzle._getXCages(puzzle));
    }).onSuccess((puzzle) => {
      return succeed(puzzle);
    });
  }

  private static _getXCages(puzzle: IPuzzleDefinition): [CageId, Cage][] {
    const x1Cells: CellId[] = [];
    const x2Cells: CellId[] = [];

    for (
      let row = 0, col1 = 0, col2 = puzzle.totalColumns - 1;
      row < puzzle.totalRows;
      row++, col1++, col2--
    ) {
      x1Cells.push(Ids.cellId({ row, col: col1 }).orThrow());
      x2Cells.push(Ids.cellId({ row, col: col2 }).orThrow());
    }

    const x1Id = Ids.cageId('X1').orThrow();
    const x2Id = Ids.cageId('X2').orThrow();

    const x1 = Cage.create(x1Id, 'x', puzzle.basicCageTotal, x1Cells).orThrow();
    const x2 = Cage.create(x2Id, 'x', puzzle.basicCageTotal, x2Cells).orThrow();
    return [
      [x1Id, x1],
      [x2Id, x2]
    ];
  }
}
