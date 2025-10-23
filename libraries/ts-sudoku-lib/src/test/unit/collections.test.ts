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

    describe('getDescription method', () => {
      let puzzles: PuzzleCollection;
      beforeEach(() => {
        puzzles = PuzzleCollection.load(file).orThrow();
      });

      test('succeeds and returns puzzle file data for a puzzle that exists', () => {
        expect(puzzles.getDescription('hidden-pair')).toSucceedAndSatisfy((fileData) => {
          expect(fileData.id).toBe('hidden-pair');
          expect(fileData.description).toBeDefined();
          expect(fileData.type).toBeDefined();
          expect(fileData.cells).toBeDefined();
        });
      });

      test('fails for a puzzle that does not exist', () => {
        expect(puzzles.getDescription('does-not-exist')).toFailWith(/not found/i);
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

  describe('explicit dimensions support', () => {
    test('should use explicit dimensions when provided', () => {
      const puzzleData = {
        id: 'test-explicit-6x6',
        description: '6x6 Sudoku with explicit dimensions',
        type: 'sudoku' as const,
        level: 1,
        cells: '.'.repeat(36),
        dimensions: {
          cageWidthInCells: 3,
          cageHeightInCells: 2,
          boardWidthInCages: 2,
          boardHeightInCages: 3
        }
      };

      expect(PuzzleCollection.create({ puzzles: [puzzleData] })).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('test-explicit-6x6')).toSucceedAndSatisfy((puzzleSession) => {
          expect(puzzleSession.puzzle.numRows).toBe(6);
          expect(puzzleSession.puzzle.numColumns).toBe(6);
          expect(puzzleSession.puzzle.dimensions.cageWidthInCells).toBe(3);
          expect(puzzleSession.puzzle.dimensions.cageHeightInCells).toBe(2);
          expect(puzzleSession.puzzle.dimensions.boardWidthInCages).toBe(2);
          expect(puzzleSession.puzzle.dimensions.boardHeightInCages).toBe(3);
          expect(puzzleSession.puzzle.dimensions.maxValue).toBe(6);
        });
      });
    });

    test('should validate dimensions match cell count', () => {
      const puzzleData = {
        id: 'test-invalid-dimensions',
        description: 'Puzzle with mismatched dimensions',
        type: 'sudoku' as const,
        level: 1,
        cells: '.'.repeat(36), // 36 cells
        dimensions: {
          cageWidthInCells: 3,
          cageHeightInCells: 3,
          boardWidthInCages: 3,
          boardHeightInCages: 3 // This specifies 81 cells, not 36
        }
      };

      expect(PuzzleCollection.create({ puzzles: [puzzleData] })).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('test-invalid-dimensions')).toFailWith(/dimensions mismatch/i);
      });
    });

    test('should support non-square cages with explicit dimensions', () => {
      const puzzleData = {
        id: 'test-rect-cages',
        description: 'Puzzle with rectangular cages',
        type: 'sudoku' as const,
        level: 1,
        cells: '.'.repeat(24), // 4x6 grid
        dimensions: {
          cageWidthInCells: 2,
          cageHeightInCells: 3,
          boardWidthInCages: 2,
          boardHeightInCages: 2
        }
      };

      expect(PuzzleCollection.create({ puzzles: [puzzleData] })).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('test-rect-cages')).toSucceedAndSatisfy((puzzleSession) => {
          expect(puzzleSession.puzzle.numRows).toBe(6);
          expect(puzzleSession.puzzle.numColumns).toBe(4);
          expect(puzzleSession.puzzle.dimensions.maxValue).toBe(6);
        });
      });
    });

    test('should work with killer sudoku and explicit dimensions', () => {
      const puzzleData = {
        id: 'test-killer-explicit',
        description: 'Killer Sudoku with explicit dimensions',
        type: 'killer-sudoku' as const,
        level: 1,
        cells: 'AABBCCDDAABBCCDD|A10,B10,C10,D10', // 4x4 grid: each cage has 4 cells, sum = 1+2+3+4 = 10
        dimensions: {
          cageWidthInCells: 2,
          cageHeightInCells: 2,
          boardWidthInCages: 2,
          boardHeightInCages: 2
        }
      };

      expect(PuzzleCollection.create({ puzzles: [puzzleData] })).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('test-killer-explicit')).toSucceedAndSatisfy((puzzleSession) => {
          expect(puzzleSession.puzzle.numRows).toBe(4);
          expect(puzzleSession.puzzle.numColumns).toBe(4);
          expect(puzzleSession.puzzle.dimensions.maxValue).toBe(4);
        });
      });
    });

    test('should validate killer sudoku dimensions match grid portion', () => {
      const puzzleData = {
        id: 'test-killer-mismatch',
        description: 'Killer Sudoku with mismatched dimensions',
        type: 'killer-sudoku' as const,
        level: 1,
        cells: 'AABBCCDDAABBCCDD|A10,B10,C10,D10', // 4x4 grid
        dimensions: {
          cageWidthInCells: 3,
          cageHeightInCells: 3,
          boardWidthInCages: 3,
          boardHeightInCages: 3 // Specifies 9x9, not 4x4
        }
      };

      expect(PuzzleCollection.create({ puzzles: [puzzleData] })).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('test-killer-mismatch')).toFailWith(/dimensions mismatch/i);
      });
    });

    test('should support all standard configurations with explicit dimensions', () => {
      const testCases = [
        {
          config: STANDARD_CONFIGS.puzzle4x4,
          cells: 16,
          expectedRows: 4,
          expectedCols: 4,
          expectedMax: 4
        },
        {
          config: STANDARD_CONFIGS.puzzle6x6,
          cells: 36,
          expectedRows: 6,
          expectedCols: 6,
          expectedMax: 6
        },
        {
          config: STANDARD_CONFIGS.puzzle9x9,
          cells: 81,
          expectedRows: 9,
          expectedCols: 9,
          expectedMax: 9
        },
        {
          config: STANDARD_CONFIGS.puzzle12x12,
          cells: 144,
          expectedRows: 12,
          expectedCols: 12,
          expectedMax: 12
        }
      ];

      testCases.forEach(({ config, cells, expectedRows, expectedCols, expectedMax }, index) => {
        const puzzleData = {
          id: `test-standard-${index}`,
          description: `Standard puzzle ${index}`,
          type: 'sudoku' as const,
          level: 1,
          cells: '.'.repeat(cells),
          dimensions: config
        };

        expect(PuzzleCollection.create({ puzzles: [puzzleData] })).toSucceedAndSatisfy((collection) => {
          expect(collection.getPuzzle(`test-standard-${index}`)).toSucceedAndSatisfy((puzzleSession) => {
            expect(puzzleSession.puzzle.numRows).toBe(expectedRows);
            expect(puzzleSession.puzzle.numColumns).toBe(expectedCols);
            expect(puzzleSession.puzzle.dimensions.maxValue).toBe(expectedMax);
          });
        });
      });
    });
  });
});
