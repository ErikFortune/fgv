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

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { Cage, CageId, CellId, IPuzzleDescription, Ids, Puzzle, totalsByCageSize } from '../common';

const cageDefFormat: RegExp = /^[A-Za-z][0-9][0-9]$/;

/**
 * @public
 */
export class KillerSudokuPuzzle extends Puzzle {
  private constructor(puzzle: IPuzzleDescription, cages: [CageId, Cage][]) {
    super(puzzle, cages);
  }

  public static create(desc: IPuzzleDescription): Result<Puzzle> {
    /* c8 ignore next 3 */
    if (desc.type !== 'killer-sudoku') {
      return fail(`Puzzle '${desc.description}' unsupported type ${desc.type}`);
    }

    return captureResult(() => {
      const { cages, givens } = KillerSudokuPuzzle._getKillerCages(desc);
      const cells = KillerSudokuPuzzle._getKillerCells(desc, givens);
      return new KillerSudokuPuzzle({ ...desc, cells }, cages);
    })
      .onSuccess((puzzle) => {
        return succeed(puzzle);
      })
      .onFailure((message) => {
        return fail(`Failed to load killer puzzle "${desc.description}" - ${message}`);
      });
  }

  private static _getKillerCages(puzzle: IPuzzleDescription): { cages: [CageId, Cage][]; givens: Cage[] } {
    const decl = puzzle.cells.split('|');
    if (decl.length !== 2) {
      throw new Error(`malformed cells|cages "${puzzle.cells}"`);
    }

    const cageCells = KillerSudokuPuzzle._getCageCells(puzzle, decl[0]);
    const allCages = KillerSudokuPuzzle._getCages(puzzle, cageCells, decl[1]);
    const cages = allCages.filter(([__id, cage]) => cage.numCells > 1);
    const givens = allCages.filter(([__id, cage]) => cage.numCells === 1).map(([__id, cage]) => cage);
    return { cages, givens };
  }

  private static _getCageCells(puzzle: IPuzzleDescription, mappingDecl: string): Map<string, CellId[]> {
    const cages: Map<string, CellId[]> = new Map();
    const cageMapping = Array.from(mappingDecl);

    if (cageMapping.length !== puzzle.rows * puzzle.cols) {
      const expected = puzzle.rows * puzzle.cols;
      const got = cageMapping.length;
      throw new Error(`expected ${expected} cell mappings, found ${got}`);
    }

    for (let row = 0; row < puzzle.rows; row++) {
      for (let col = 0; col < puzzle.cols; col++) {
        const cage = cageMapping.shift()!;
        const cell = Ids.cellId({ row, col }).orThrow();
        const cells = cages.get(cage) ?? [];
        cells.push(cell);
        cages.set(cage, cells);
      }
    }

    return cages;
  }

  private static _getCages(
    __puzzle: IPuzzleDescription,
    cageCells: Map<string, CellId[]>,
    cagePart: string
  ): [CageId, Cage][] {
    const cages = new Map<CageId, Cage>();

    const cageDefs = cagePart.split(',');
    if (cageDefs.length !== cageCells.size) {
      throw new Error(`expected ${cageCells.size} cage sizes, found ${cageDefs.length}`);
    }

    for (const def of cageDefs) {
      if (!cageDefFormat.test(def)) {
        throw new Error(`malformed cage spec ${def}`);
      }
      const cage = def.slice(0, 1);
      const cageId = Ids.cageId(`K${cage}`).orThrow();

      const total = Number.parseInt(def.slice(1));
      const cells = cageCells.get(cage);
      /* c8 ignore next 3 - should never happen */
      if (!cells) {
        throw new Error(`cage ${cageId} has no cells`);
      }
      if (cells.length < 1 || cells.length > 9) {
        throw new Error(`invalid cell count ${cells.length} for cage ${cageId}`);
      }
      const { min, max } = totalsByCageSize[cells.length];
      if (total < min || total > max) {
        throw new Error(`invalid total ${total} for cage ${cageId} (expected ${min}..${max})`);
      }

      cages.set(cageId, Cage.create(cageId, 'killer', total, cells).orThrow());
    }

    return Array.from(cages.entries());
  }

  private static _getKillerCells(puzzle: IPuzzleDescription, givens: Cage[]): string {
    const cells: string[] = [];
    for (let row = 0; row < puzzle.rows; row++) {
      for (let col = 0; col < puzzle.cols; col++) {
        const cellId = Ids.cellId({ row, col }).orThrow();
        const cage = givens.find((g) => g.cellIds[0] === cellId);
        if (cage) {
          /* c8 ignore next 3 - defense in depth should never happen */
          if (cage.total < 1 || cage.total > 9) {
            throw new Error(`invalid total ${cage.total} for cell ${cellId}`);
          }
          cells.push(String(cage.total));
        } else {
          cells.push('.');
        }
      }
    }
    return cells.join('');
  }
}
