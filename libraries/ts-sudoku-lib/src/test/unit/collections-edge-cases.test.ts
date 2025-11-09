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
import { PuzzleCollection } from '../../packlets/collections';
import * as Files from '../../packlets/files';

describe('PuzzleCollection - Edge Cases', () => {
  describe('Required dimensions field', () => {
    test('should fail when puzzle data is missing dimensions', () => {
      const puzzleData = {
        id: 'missing-dims',
        description: 'Puzzle without dimensions',
        type: 'sudoku',
        cells: '.'.repeat(81),
        level: 1
        // dimensions field is missing
      };

      // The converter should fail when dimensions field is missing
      expect(Files.Converters.puzzleFileData.convert(puzzleData)).toFailWith(/dimensions.*not found/i);
    });

    test('should succeed when puzzle data has valid dimensions', () => {
      const puzzleData: Files.Model.IPuzzleFileData = {
        id: 'with-dims',
        description: 'Puzzle with dimensions',
        type: 'sudoku',
        cells: '.'.repeat(81),
        level: 1,
        dimensions: {
          cageWidthInCells: 3,
          cageHeightInCells: 3,
          boardWidthInCages: 3,
          boardHeightInCages: 3
        }
      };

      expect(PuzzleCollection.create({ puzzles: [puzzleData] })).toSucceedAndSatisfy((collection) => {
        expect(collection.puzzles).toHaveLength(1);
        const puzzleSession = collection.getPuzzle('with-dims').orThrow();
        const puzzleDef = puzzleSession.puzzle.dimensions;
        expect(puzzleDef.cageWidthInCells).toBe(3);
        expect(puzzleDef.cageHeightInCells).toBe(3);
        expect(puzzleDef.boardWidthInCages).toBe(3);
        expect(puzzleDef.boardHeightInCages).toBe(3);
      });
    });
  });
});
