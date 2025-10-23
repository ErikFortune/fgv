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
import { PuzzleCollection } from '../../../packlets/collections';
import * as Files from '../../../packlets/files';
import { Result } from '@fgv/ts-utils';

type IPuzzleFileData = Files.Model.IPuzzleFileData;

describe('Puzzle Dimensions Feature', () => {
  /**
   * Helper function to create a puzzle collection from file data
   */
  function createCollectionFromPuzzles(puzzles: IPuzzleFileData[]): Result<PuzzleCollection> {
    return PuzzleCollection.create({ puzzles });
  }

  /**
   * Helper function to create puzzle file data with dimensions
   */
  function createPuzzleData(
    id: string,
    cells: string,
    dimensions: {
      cageWidthInCells: number;
      cageHeightInCells: number;
      boardWidthInCages: number;
      boardHeightInCages: number;
    }
  ): IPuzzleFileData {
    return {
      id,
      description: `Test puzzle ${id}`,
      type: 'sudoku',
      level: 1,
      cells,
      dimensions
    };
  }

  describe('Standard puzzle sizes with explicit dimensions', () => {
    test('should load 4x4 puzzle with explicit dimensions', () => {
      const cells = '.'.repeat(16); // 4x4 = 16 cells
      const puzzleData = createPuzzleData('puzzle-4x4', cells, {
        cageWidthInCells: 2,
        cageHeightInCells: 2,
        boardWidthInCages: 2,
        boardHeightInCages: 2
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('puzzle-4x4')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.puzzle.numRows).toBe(4);
          expect(puzzle.puzzle.numColumns).toBe(4);
          expect(puzzle.puzzle.dimensions.totalRows).toBe(4);
          expect(puzzle.puzzle.dimensions.totalColumns).toBe(4);
          expect(puzzle.puzzle.dimensions.maxValue).toBe(4);
        });
      });
    });

    test('should load 6x6 puzzle with explicit dimensions', () => {
      const cells = '.'.repeat(36); // 6x6 = 36 cells
      const puzzleData = createPuzzleData('puzzle-6x6', cells, {
        cageWidthInCells: 3,
        cageHeightInCells: 2,
        boardWidthInCages: 2,
        boardHeightInCages: 3
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('puzzle-6x6')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.puzzle.numRows).toBe(6);
          expect(puzzle.puzzle.numColumns).toBe(6);
          expect(puzzle.puzzle.dimensions.totalRows).toBe(6);
          expect(puzzle.puzzle.dimensions.totalColumns).toBe(6);
          expect(puzzle.puzzle.dimensions.maxValue).toBe(6);
        });
      });
    });

    test('should load 9x9 puzzle with explicit dimensions', () => {
      const cells = '.'.repeat(81); // 9x9 = 81 cells
      const puzzleData = createPuzzleData('puzzle-9x9', cells, {
        cageWidthInCells: 3,
        cageHeightInCells: 3,
        boardWidthInCages: 3,
        boardHeightInCages: 3
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('puzzle-9x9')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.puzzle.numRows).toBe(9);
          expect(puzzle.puzzle.numColumns).toBe(9);
          expect(puzzle.puzzle.dimensions.totalRows).toBe(9);
          expect(puzzle.puzzle.dimensions.totalColumns).toBe(9);
          expect(puzzle.puzzle.dimensions.maxValue).toBe(9);
        });
      });
    });

    test('should load 12x12 puzzle with explicit dimensions', () => {
      const cells = '.'.repeat(144); // 12x12 = 144 cells
      const puzzleData = createPuzzleData('puzzle-12x12', cells, {
        cageWidthInCells: 4,
        cageHeightInCells: 3,
        boardWidthInCages: 3,
        boardHeightInCages: 4
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('puzzle-12x12')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.puzzle.numRows).toBe(12);
          expect(puzzle.puzzle.numColumns).toBe(12);
          expect(puzzle.puzzle.dimensions.totalRows).toBe(12);
          expect(puzzle.puzzle.dimensions.totalColumns).toBe(12);
          expect(puzzle.puzzle.dimensions.maxValue).toBe(12);
        });
      });
    });

    test('should load 16x16 puzzle with explicit dimensions', () => {
      const cells = '.'.repeat(256); // 16x16 = 256 cells
      const puzzleData = createPuzzleData('puzzle-16x16', cells, {
        cageWidthInCells: 4,
        cageHeightInCells: 4,
        boardWidthInCages: 4,
        boardHeightInCages: 4
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('puzzle-16x16')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.puzzle.numRows).toBe(16);
          expect(puzzle.puzzle.numColumns).toBe(16);
          expect(puzzle.puzzle.dimensions.totalRows).toBe(16);
          expect(puzzle.puzzle.dimensions.totalColumns).toBe(16);
          expect(puzzle.puzzle.dimensions.maxValue).toBe(16);
        });
      });
    });

    test('should load 25x25 puzzle with explicit dimensions', () => {
      const cells = '.'.repeat(625); // 25x25 = 625 cells
      const puzzleData = createPuzzleData('puzzle-25x25', cells, {
        cageWidthInCells: 5,
        cageHeightInCells: 5,
        boardWidthInCages: 5,
        boardHeightInCages: 5
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('puzzle-25x25')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.puzzle.numRows).toBe(25);
          expect(puzzle.puzzle.numColumns).toBe(25);
          expect(puzzle.puzzle.dimensions.totalRows).toBe(25);
          expect(puzzle.puzzle.dimensions.totalColumns).toBe(25);
          expect(puzzle.puzzle.dimensions.maxValue).toBe(25);
        });
      });
    });
  });

  describe('Dimension validation', () => {
    test('should fail when dimensions specify more cells than cells string contains', () => {
      const cells = '.'.repeat(80); // 80 cells
      const puzzleData = createPuzzleData('mismatch-puzzle', cells, {
        cageWidthInCells: 3,
        cageHeightInCells: 3,
        boardWidthInCages: 3,
        boardHeightInCages: 3 // Expects 81 cells
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('mismatch-puzzle')).toFailWith(
          /dimensions mismatch.*dimensions specify 81 cells.*contains 80 cells/i
        );
      });
    });

    test('should fail when dimensions specify fewer cells than cells string contains', () => {
      const cells = '.'.repeat(82); // 82 cells
      const puzzleData = createPuzzleData('mismatch-puzzle', cells, {
        cageWidthInCells: 3,
        cageHeightInCells: 3,
        boardWidthInCages: 3,
        boardHeightInCages: 3 // Expects 81 cells
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('mismatch-puzzle')).toFailWith(
          /dimensions mismatch.*dimensions specify 81 cells.*contains 82 cells/i
        );
      });
    });

    test('should include dimension details in error message', () => {
      const cells = '.'.repeat(100); // 100 cells
      const puzzleData = createPuzzleData('detailed-error', cells, {
        cageWidthInCells: 4,
        cageHeightInCells: 3,
        boardWidthInCages: 2,
        boardHeightInCages: 2 // Expects 4*3*2*2 = 48 cells
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('detailed-error')).toFailWith(
          /dimensions specify 48 cells \(4x3 cages in 2x2 layout\) but cells string contains 100 cells/i
        );
      });
    });
  });

  describe('Non-square cages', () => {
    test('should support 2x3 cages in 3x2 layout (6x6 grid)', () => {
      const cells = '.'.repeat(36); // 6x6 = 36 cells
      const puzzleData = createPuzzleData('rect-2x3', cells, {
        cageWidthInCells: 2,
        cageHeightInCells: 3,
        boardWidthInCages: 3,
        boardHeightInCages: 2
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('rect-2x3')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.puzzle.numRows).toBe(6);
          expect(puzzle.puzzle.numColumns).toBe(6);
          expect(puzzle.puzzle.dimensions.maxValue).toBe(6);
        });
      });
    });

    test('should support 3x4 cages in 4x3 layout (12x12 grid)', () => {
      const cells = '.'.repeat(144); // 12x12 = 144 cells
      const puzzleData = createPuzzleData('rect-3x4', cells, {
        cageWidthInCells: 3,
        cageHeightInCells: 4,
        boardWidthInCages: 4,
        boardHeightInCages: 3
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('rect-3x4')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.puzzle.numRows).toBe(12);
          expect(puzzle.puzzle.numColumns).toBe(12);
          expect(puzzle.puzzle.dimensions.maxValue).toBe(12);
        });
      });
    });

    test('should support 2x5 cages in 5x2 layout (10x10 grid)', () => {
      const cells = '.'.repeat(100); // 10x10 = 100 cells
      const puzzleData = createPuzzleData('rect-2x5', cells, {
        cageWidthInCells: 2,
        cageHeightInCells: 5,
        boardWidthInCages: 5,
        boardHeightInCages: 2
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('rect-2x5')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.puzzle.numRows).toBe(10);
          expect(puzzle.puzzle.numColumns).toBe(10);
          expect(puzzle.puzzle.dimensions.maxValue).toBe(10);
        });
      });
    });
  });

  describe('Killer sudoku with dimensions', () => {
    test('should load killer sudoku with explicit dimensions', () => {
      // Killer sudoku format: grid cells | cage definitions
      // Use valid 9x9 killer sudoku format with proper cages
      const gridCells = [
        'ABCCCDDDE',
        'ABFFGGGDE',
        'HIJKGGLLL',
        'HIJKMGLNN',
        'HOPPMQQNR',
        'OOSTMUVWR',
        'SSSTTUVWR',
        'XYTTTZZab',
        'XYYYcccab'
      ].join('');
      const cageDefinitions =
        'A11,B09,C09,D20,E16,F17,G30,H17,I13,J09,K11,L16,M16,N11,O16,P07,Q11,R10,S14,T39,U08,V17,W16,X06,Y26,Z06,a09,b09,c11';
      const cells = `${gridCells}|${cageDefinitions}`;

      const puzzleData: IPuzzleFileData = {
        id: 'killer-with-dims',
        description: 'Killer with dimensions',
        type: 'killer-sudoku',
        level: 1,
        cells,
        dimensions: {
          cageWidthInCells: 3,
          cageHeightInCells: 3,
          boardWidthInCages: 3,
          boardHeightInCages: 3
        }
      };

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('killer-with-dims')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.puzzle.numRows).toBe(9);
          expect(puzzle.puzzle.numColumns).toBe(9);
          expect(puzzle.puzzle.dimensions.maxValue).toBe(9);
          expect(puzzle.puzzle.type).toBe('killer-sudoku');
        });
      });
    });

    test('should validate dimensions against grid portion of killer sudoku cells', () => {
      // Grid portion is 80 cells but dimensions expect 81
      const gridCells = 'A'.repeat(80);
      const cageDefinitions = 'A80';
      const cells = `${gridCells}|${cageDefinitions}`;

      const puzzleData: IPuzzleFileData = {
        id: 'killer-mismatch',
        description: 'Killer dimension mismatch',
        type: 'killer-sudoku',
        level: 1,
        cells,
        dimensions: {
          cageWidthInCells: 3,
          cageHeightInCells: 3,
          boardWidthInCages: 3,
          boardHeightInCages: 3
        }
      };

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('killer-mismatch')).toFailWith(
          /dimensions mismatch.*dimensions specify 81 cells.*contains 80 cells/i
        );
      });
    });
  });

  describe('Invalid dimension values', () => {
    test('should fail for negative cage width', () => {
      const cells = '.'.repeat(81);
      const puzzleData = createPuzzleData('negative-width', cells, {
        cageWidthInCells: -1,
        cageHeightInCells: 3,
        boardWidthInCages: 3,
        boardHeightInCages: 3
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('negative-width')).toFail();
      });
    });

    test('should fail for negative cage height', () => {
      const cells = '.'.repeat(81);
      const puzzleData = createPuzzleData('negative-height', cells, {
        cageWidthInCells: 3,
        cageHeightInCells: -1,
        boardWidthInCages: 3,
        boardHeightInCages: 3
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('negative-height')).toFail();
      });
    });

    test('should fail for zero cage width', () => {
      const cells = '.'.repeat(0);
      const puzzleData = createPuzzleData('zero-width', cells, {
        cageWidthInCells: 0,
        cageHeightInCells: 3,
        boardWidthInCages: 3,
        boardHeightInCages: 3
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('zero-width')).toFail();
      });
    });

    test('should fail for zero cage height', () => {
      const cells = '.'.repeat(0);
      const puzzleData = createPuzzleData('zero-height', cells, {
        cageWidthInCells: 3,
        cageHeightInCells: 0,
        boardWidthInCages: 3,
        boardHeightInCages: 3
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('zero-height')).toFail();
      });
    });

    test('should fail for grid size exceeding maximum (26x26)', () => {
      const cells = '.'.repeat(676); // 26x26 = 676 cells
      const puzzleData = createPuzzleData('too-large', cells, {
        cageWidthInCells: 13,
        cageHeightInCells: 13,
        boardWidthInCages: 2,
        boardHeightInCages: 2
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('too-large')).toFailWith(/grid size must not exceed 25x25/i);
      });
    });

    test('should fail for 1x1 cage dimensions (too small)', () => {
      const cells = '.'.repeat(9);
      const puzzleData = createPuzzleData('too-small-cage', cells, {
        cageWidthInCells: 1,
        cageHeightInCells: 1,
        boardWidthInCages: 3,
        boardHeightInCages: 3
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('too-small-cage')).toFailWith(/cage dimensions must be at least 2x2/i);
      });
    });
  });

  describe('Edge cases and boundary conditions', () => {
    test('should handle minimum valid puzzle size (2x2 cages, 2x2 layout = 4x4 grid)', () => {
      const cells = '.'.repeat(16); // 4x4 = 16 cells
      const puzzleData = createPuzzleData('minimum-valid', cells, {
        cageWidthInCells: 2,
        cageHeightInCells: 2,
        boardWidthInCages: 2,
        boardHeightInCages: 2
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('minimum-valid')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.puzzle.numRows).toBe(4);
          expect(puzzle.puzzle.numColumns).toBe(4);
          expect(puzzle.puzzle.dimensions.maxValue).toBe(4);
        });
      });
    });

    test('should handle maximum valid puzzle size (5x5 cages, 5x5 layout = 25x25 grid)', () => {
      const cells = '.'.repeat(625); // 25x25 = 625 cells
      const puzzleData = createPuzzleData('maximum-valid', cells, {
        cageWidthInCells: 5,
        cageHeightInCells: 5,
        boardWidthInCages: 5,
        boardHeightInCages: 5
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('maximum-valid')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.puzzle.numRows).toBe(25);
          expect(puzzle.puzzle.numColumns).toBe(25);
          expect(puzzle.puzzle.dimensions.maxValue).toBe(25);
        });
      });
    });

    test('should handle asymmetric board layouts (2x3 cages, 4x2 layout = 8x6 grid)', () => {
      const cells = '.'.repeat(48); // 8x6 = 48 cells
      const puzzleData = createPuzzleData('asymmetric', cells, {
        cageWidthInCells: 2,
        cageHeightInCells: 3,
        boardWidthInCages: 4,
        boardHeightInCages: 2
      });

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('asymmetric')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.puzzle.numRows).toBe(6);
          expect(puzzle.puzzle.numColumns).toBe(8);
          expect(puzzle.puzzle.dimensions.maxValue).toBe(6);
        });
      });
    });
  });

  describe('Integration with puzzle types', () => {
    test('should support dimensions with standard sudoku', () => {
      const cells = '.'.repeat(81);
      const puzzleData: IPuzzleFileData = {
        id: 'sudoku-dims',
        description: 'Standard with dimensions',
        type: 'sudoku',
        level: 1,
        cells,
        dimensions: {
          cageWidthInCells: 3,
          cageHeightInCells: 3,
          boardWidthInCages: 3,
          boardHeightInCages: 3
        }
      };

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('sudoku-dims')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.puzzle.type).toBe('sudoku');
          expect(puzzle.puzzle.numRows).toBe(9);
          expect(puzzle.puzzle.numColumns).toBe(9);
        });
      });
    });

    test('should support dimensions with sudoku-x', () => {
      const cells = '.'.repeat(81);
      const puzzleData: IPuzzleFileData = {
        id: 'sudoku-x-dims',
        description: 'Sudoku-X with dimensions',
        type: 'sudoku-x',
        level: 1,
        cells,
        dimensions: {
          cageWidthInCells: 3,
          cageHeightInCells: 3,
          boardWidthInCages: 3,
          boardHeightInCages: 3
        }
      };

      expect(createCollectionFromPuzzles([puzzleData])).toSucceedAndSatisfy((collection) => {
        expect(collection.getPuzzle('sudoku-x-dims')).toSucceedAndSatisfy((puzzle) => {
          expect(puzzle.puzzle.type).toBe('sudoku-x');
          expect(puzzle.puzzle.numRows).toBe(9);
          expect(puzzle.puzzle.numColumns).toBe(9);
        });
      });
    });
  });

  describe('Multiple puzzles with different dimensions', () => {
    test('should load collection with puzzles of different sizes', () => {
      const puzzle4x4 = createPuzzleData('multi-4x4', '.'.repeat(16), {
        cageWidthInCells: 2,
        cageHeightInCells: 2,
        boardWidthInCages: 2,
        boardHeightInCages: 2
      });

      const puzzle9x9 = createPuzzleData('multi-9x9', '.'.repeat(81), {
        cageWidthInCells: 3,
        cageHeightInCells: 3,
        boardWidthInCages: 3,
        boardHeightInCages: 3
      });

      const puzzle16x16 = createPuzzleData('multi-16x16', '.'.repeat(256), {
        cageWidthInCells: 4,
        cageHeightInCells: 4,
        boardWidthInCages: 4,
        boardHeightInCages: 4
      });

      expect(createCollectionFromPuzzles([puzzle4x4, puzzle9x9, puzzle16x16])).toSucceedAndSatisfy(
        (collection) => {
          expect(collection.getPuzzle('multi-4x4')).toSucceedAndSatisfy((puzzle) => {
            expect(puzzle.puzzle.numRows).toBe(4);
          });

          expect(collection.getPuzzle('multi-9x9')).toSucceedAndSatisfy((puzzle) => {
            expect(puzzle.puzzle.numRows).toBe(9);
          });

          expect(collection.getPuzzle('multi-16x16')).toSucceedAndSatisfy((puzzle) => {
            expect(puzzle.puzzle.numRows).toBe(16);
          });
        }
      );
    });
  });
});
