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
import { CageId, CellId, Ids, PuzzleCollections } from '../../..';

describe('Ids class', () => {
  describe('cageId method', () => {
    test.each(['RA', 'C0', 'SA0'])('succeeds for %p', (id) => {
      expect(Ids.cageId(id)).toSucceedWith(id as CageId);
    });

    test.each(['R0', 'CX', 'S01', 'RAA', 'C01', 'SAA00'])('fails for for %p', (id) => {
      expect(Ids.cageId(id)).toFail();
    });

    test('retrieves id from ICage', () => {
      const puzzle = PuzzleCollections.default.getPuzzle('hidden-pair').orThrow();
      expect(Ids.cageId(puzzle.cages[0])).toSucceedWith(puzzle.cages[0].id);
    });
  });

  describe('cellId method', () => {
    describe('with strings', () => {
      test.each(['A0', 'B1', 'J9'])('succeeds for %p', (id) => {
        expect(Ids.cellId(id)).toSucceedWith(id as CellId);
      });

      test.each(['CC', 'CX', 'S01', 'RAA', 'C01', 'SAA00'])('fails for for %p', (id) => {
        expect(Ids.cellId(id)).toFail();
      });
    });

    describe('with RowColumn', () => {
      expect(Ids.cellId({ row: 0, col: 4 })).toSucceedWith('A5' as CellId);
    });

    test('retrieves id from ICell', () => {
      const puzzle = PuzzleCollections.default.getPuzzle('hidden-pair').orThrow();
      expect(Ids.cellId(puzzle.cells[0])).toSucceedWith(puzzle.cells[0].id);
    });
  });
});
