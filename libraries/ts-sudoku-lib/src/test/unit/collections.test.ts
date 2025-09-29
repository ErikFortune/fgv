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
  PuzzleCollection,
  PuzzleCollections,
  Puzzles,
  PuzzleDefinitionFactory,
  STANDARD_CONFIGS
} from '../..';
import { FileTree } from '@fgv/ts-json-base';

describe('PuzzleCollection tests', () => {
  let file: FileTree.IFileTreeFileItem<string>;

  beforeEach(() => {
    file = FileTree.forFilesystem()
      .onSuccess((tree) => tree.getFile('src/packlets/collections/data/puzzles.json'))
      .orThrow();
  });
  describe('PuzzleCollection class', () => {
    test('load correctly loads a file', () => {
      expect(PuzzleCollection.load(file)).toSucceedAndSatisfy((puzzles) => {
        expect(puzzles.puzzles.find((p) => p.id === 'hidden-pair')).toBeDefined();
      });
    });

    describe('getPuzzle method', () => {
      let puzzles: PuzzleCollection;
      beforeEach(() => {
        puzzles = PuzzleCollection.load(file).orThrow();
      });

      test('succeeds for a puzzle that exists', () => {
        expect(puzzles.getPuzzle('almost-done')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.id).toBe('almost-done');
        });
      });

      test('fails for a puzzle that does not exist', () => {
        expect(puzzles.getPuzzle('does-not-exist')).toFailWith(/not found/i);
      });
    });
  });

  describe('PuzzleCollections class', () => {
    test('default puzzles load correctly', () => {
      expect(() => PuzzleCollections.default).not.toThrow();
      expect(PuzzleCollections.default).toBeDefined();
      expect(PuzzleCollections.default.puzzles.find((p) => p.id === 'hidden-pair')).toBeDefined();
    });
  });

  describe('Sample data', () => {
    test.each(
      PuzzleCollections.default.puzzles.map((puzzle) => {
        return { id: puzzle.id, puzzle: puzzle };
      })
    )('$id loads correctly', (tc) => {
      // Determine config based on cell count
      const gridCells = tc.puzzle.type === 'killer-sudoku' ? tc.puzzle.cells.split('|')[0] : tc.puzzle.cells;
      const totalCells = gridCells.length;
      let config: {
        cageWidthInCells: number;
        cageHeightInCells: number;
        boardWidthInCages: number;
        boardHeightInCages: number;
      };

      if (totalCells === 16) config = STANDARD_CONFIGS.puzzle4x4;
      else if (totalCells === 36) config = STANDARD_CONFIGS.puzzle6x6;
      else if (totalCells === 81) config = STANDARD_CONFIGS.puzzle9x9;
      else if (totalCells === 144) config = STANDARD_CONFIGS.puzzle12x12;
      else config = STANDARD_CONFIGS.puzzle9x9; // fallback

      const puzzleDefinition = PuzzleDefinitionFactory.create(config, {
        id: tc.puzzle.id,
        description: tc.puzzle.description,
        type: tc.puzzle.type,
        level: tc.puzzle.level,
        cells: tc.puzzle.cells
      });

      expect(puzzleDefinition).toSucceedAndSatisfy((def) => {
        expect(Puzzles.Any.create(def)).toSucceed();
      });
    });
  });
});
