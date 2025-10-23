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

import { PuzzleType } from '@fgv/ts-sudoku-lib';
import {
  createPuzzleDefinition,
  createEmptyPuzzleDefinition,
  ISimplePuzzleDescription
} from '../../../utils/puzzleDefinitionHelper';

describe('puzzleDefinitionHelper', () => {
  describe('createPuzzleDefinition', () => {
    describe('standard grid sizes', () => {
      describe('4x4 puzzles', () => {
        test('should create valid 4x4 puzzle definition with correct cage dimensions', () => {
          const simple: ISimplePuzzleDescription = {
            id: 'test-4x4',
            description: 'Test 4x4 puzzle',
            type: 'sudoku',
            level: 1,
            totalRows: 4,
            totalColumns: 4,
            cells: '1..2.3...4.....1'
          };

          const result = createPuzzleDefinition(simple);

          expect(result.id).toBe('test-4x4');
          expect(result.description).toBe('Test 4x4 puzzle');
          expect(result.type).toBe('sudoku');
          expect(result.level).toBe(1);
          expect(result.totalRows).toBe(4);
          expect(result.totalColumns).toBe(4);
          expect(result.cells).toBe('1..2.3...4.....1');

          // Verify cage dimensions (2x2 for 4x4 grid)
          expect(result.cageWidthInCells).toBe(2);
          expect(result.cageHeightInCells).toBe(2);
          expect(result.boardWidthInCages).toBe(2);
          expect(result.boardHeightInCages).toBe(2);

          // Verify derived properties
          expect(result.maxValue).toBe(4);
          expect(result.totalCages).toBe(4);
          expect(result.basicCageTotal).toBe(10); // 1+2+3+4
        });

        test('should handle 4x4 Sudoku-X puzzle', () => {
          const simple: ISimplePuzzleDescription = {
            description: '4x4 Sudoku-X',
            type: 'sudoku-x',
            level: 2,
            totalRows: 4,
            totalColumns: 4,
            cells: '................'
          };

          const result = createPuzzleDefinition(simple);

          expect(result.type).toBe('sudoku-x');
          expect(result.cageWidthInCells).toBe(2);
          expect(result.cageHeightInCells).toBe(2);
        });
      });

      describe('6x6 puzzles', () => {
        test('should create valid 6x6 puzzle definition with correct cage dimensions', () => {
          const simple: ISimplePuzzleDescription = {
            description: 'Test 6x6 puzzle',
            type: 'sudoku',
            level: 2,
            totalRows: 6,
            totalColumns: 6,
            cells: '1....2.3....4.5....6.....1.2....3.4'
          };

          const result = createPuzzleDefinition(simple);

          expect(result.totalRows).toBe(6);
          expect(result.totalColumns).toBe(6);

          // Verify cage dimensions (3x2 for 6x6 grid)
          expect(result.cageWidthInCells).toBe(3);
          expect(result.cageHeightInCells).toBe(2);
          expect(result.boardWidthInCages).toBe(2);
          expect(result.boardHeightInCages).toBe(3);

          // Verify derived properties
          expect(result.maxValue).toBe(6);
          expect(result.totalCages).toBe(6);
          expect(result.basicCageTotal).toBe(21); // 1+2+3+4+5+6
        });
      });

      describe('9x9 puzzles (standard Sudoku)', () => {
        test('should create valid 9x9 puzzle definition with correct cage dimensions', () => {
          const simple: ISimplePuzzleDescription = {
            id: 'classic-sudoku',
            description: 'Classic 9x9 Sudoku',
            type: 'sudoku',
            level: 3,
            totalRows: 9,
            totalColumns: 9,
            cells: '5.....8.1..2.4.6..7.....3.....1...5.9..8..2.3...4.....6.....9..8.1.5..2.4.....7'
          };

          const result = createPuzzleDefinition(simple);

          expect(result.id).toBe('classic-sudoku');
          expect(result.totalRows).toBe(9);
          expect(result.totalColumns).toBe(9);

          // Verify cage dimensions (3x3 for 9x9 grid)
          expect(result.cageWidthInCells).toBe(3);
          expect(result.cageHeightInCells).toBe(3);
          expect(result.boardWidthInCages).toBe(3);
          expect(result.boardHeightInCages).toBe(3);

          // Verify derived properties
          expect(result.maxValue).toBe(9);
          expect(result.totalCages).toBe(9);
          expect(result.basicCageTotal).toBe(45); // 1+2+3+4+5+6+7+8+9
        });

        test('should handle 9x9 Sudoku-X puzzle with diagonal constraints', () => {
          const simple: ISimplePuzzleDescription = {
            description: '9x9 Sudoku-X with diagonals',
            type: 'sudoku-x',
            level: 4,
            totalRows: 9,
            totalColumns: 9,
            cells: '.'.repeat(81)
          };

          const result = createPuzzleDefinition(simple);

          expect(result.type).toBe('sudoku-x');
          expect(result.cageWidthInCells).toBe(3);
          expect(result.cageHeightInCells).toBe(3);
          expect(result.maxValue).toBe(9);
        });
      });

      describe('12x12 puzzles', () => {
        test('should create valid 12x12 puzzle definition with correct cage dimensions', () => {
          const simple: ISimplePuzzleDescription = {
            description: '12x12 puzzle',
            type: 'sudoku',
            level: 5,
            totalRows: 12,
            totalColumns: 12,
            cells: '.'.repeat(144)
          };

          const result = createPuzzleDefinition(simple);

          expect(result.totalRows).toBe(12);
          expect(result.totalColumns).toBe(12);

          // Verify cage dimensions (4x3 for 12x12 grid)
          expect(result.cageWidthInCells).toBe(4);
          expect(result.cageHeightInCells).toBe(3);
          expect(result.boardWidthInCages).toBe(3);
          expect(result.boardHeightInCages).toBe(4);

          // Verify derived properties
          expect(result.maxValue).toBe(12);
          expect(result.totalCages).toBe(12);
          expect(result.basicCageTotal).toBe(78); // 1+2+...+12
        });
      });

      describe('16x16 puzzles', () => {
        test('should create valid 16x16 puzzle definition with correct cage dimensions', () => {
          const simple: ISimplePuzzleDescription = {
            description: '16x16 puzzle',
            type: 'sudoku',
            level: 6,
            totalRows: 16,
            totalColumns: 16,
            cells: '.'.repeat(256)
          };

          const result = createPuzzleDefinition(simple);

          expect(result.totalRows).toBe(16);
          expect(result.totalColumns).toBe(16);

          // Verify cage dimensions (4x4 for 16x16 grid)
          expect(result.cageWidthInCells).toBe(4);
          expect(result.cageHeightInCells).toBe(4);
          expect(result.boardWidthInCages).toBe(4);
          expect(result.boardHeightInCages).toBe(4);

          // Verify derived properties
          expect(result.maxValue).toBe(16);
          expect(result.totalCages).toBe(16);
          expect(result.basicCageTotal).toBe(136); // 1+2+...+16
        });
      });

      describe('25x25 puzzles', () => {
        test('should create valid 25x25 puzzle definition with correct cage dimensions', () => {
          const simple: ISimplePuzzleDescription = {
            description: '25x25 puzzle',
            type: 'sudoku',
            level: 7,
            totalRows: 25,
            totalColumns: 25,
            cells: '.'.repeat(625)
          };

          const result = createPuzzleDefinition(simple);

          expect(result.totalRows).toBe(25);
          expect(result.totalColumns).toBe(25);

          // Verify cage dimensions (5x5 for 25x25 grid)
          expect(result.cageWidthInCells).toBe(5);
          expect(result.cageHeightInCells).toBe(5);
          expect(result.boardWidthInCages).toBe(5);
          expect(result.boardHeightInCages).toBe(5);

          // Verify derived properties
          expect(result.maxValue).toBe(25);
          expect(result.totalCages).toBe(25);
          expect(result.basicCageTotal).toBe(325); // 1+2+...+25
        });
      });
    });

    describe('non-standard grid sizes', () => {
      test('should use default square cage calculation for unrecognized sizes', () => {
        const simple: ISimplePuzzleDescription = {
          description: '7x7 puzzle (non-standard)',
          type: 'sudoku',
          level: 1,
          totalRows: 7,
          totalColumns: 7,
          cells: '.'.repeat(49)
        };

        const result = createPuzzleDefinition(simple);

        expect(result.totalRows).toBe(7);
        expect(result.totalColumns).toBe(7);

        // sqrt(7) ≈ 2.646, floor = 2
        expect(result.cageWidthInCells).toBe(2);
        expect(result.cageHeightInCells).toBe(2);
      });

      test('should handle 8x8 puzzle with square cage default', () => {
        const simple: ISimplePuzzleDescription = {
          description: '8x8 puzzle',
          type: 'sudoku',
          level: 1,
          totalRows: 8,
          totalColumns: 8,
          cells: '.'.repeat(64)
        };

        const result = createPuzzleDefinition(simple);

        // sqrt(8) ≈ 2.828, floor = 2
        expect(result.cageWidthInCells).toBe(2);
        expect(result.cageHeightInCells).toBe(2);
        expect(result.maxValue).toBe(4);
      });
    });

    describe('puzzle type handling', () => {
      test('should preserve standard sudoku type', () => {
        const simple: ISimplePuzzleDescription = {
          description: 'Standard puzzle',
          type: 'sudoku' as PuzzleType,
          level: 1,
          totalRows: 9,
          totalColumns: 9,
          cells: '.'.repeat(81)
        };

        const result = createPuzzleDefinition(simple);
        expect(result.type).toBe('sudoku');
      });

      test('should preserve Sudoku-X type', () => {
        const simple: ISimplePuzzleDescription = {
          description: 'Sudoku-X puzzle',
          type: 'sudoku-x' as PuzzleType,
          level: 1,
          totalRows: 9,
          totalColumns: 9,
          cells: '.'.repeat(81)
        };

        const result = createPuzzleDefinition(simple);
        expect(result.type).toBe('sudoku-x');
      });

      test('should preserve Killer Sudoku type', () => {
        const simple: ISimplePuzzleDescription = {
          description: 'Killer Sudoku puzzle',
          type: 'killer-sudoku' as PuzzleType,
          level: 1,
          totalRows: 9,
          totalColumns: 9,
          cells: '.'.repeat(81)
        };

        const result = createPuzzleDefinition(simple);
        expect(result.type).toBe('killer-sudoku');
      });
    });

    describe('optional fields', () => {
      test('should handle puzzle without ID', () => {
        const simple: ISimplePuzzleDescription = {
          description: 'Puzzle without ID',
          type: 'sudoku',
          level: 1,
          totalRows: 9,
          totalColumns: 9,
          cells: '.'.repeat(81)
        };

        const result = createPuzzleDefinition(simple);
        expect(result.id).toBeUndefined();
      });

      test('should include ID when provided', () => {
        const simple: ISimplePuzzleDescription = {
          id: 'puzzle-123',
          description: 'Puzzle with ID',
          type: 'sudoku',
          level: 1,
          totalRows: 9,
          totalColumns: 9,
          cells: '.'.repeat(81)
        };

        const result = createPuzzleDefinition(simple);
        expect(result.id).toBe('puzzle-123');
      });
    });

    describe('cell data handling', () => {
      test('should preserve cell data exactly as provided', () => {
        const cellData = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
        const simple: ISimplePuzzleDescription = {
          description: 'Puzzle with specific cell data',
          type: 'sudoku',
          level: 3,
          totalRows: 9,
          totalColumns: 9,
          cells: cellData
        };

        const result = createPuzzleDefinition(simple);
        expect(result.cells).toBe(cellData);
        expect(result.cells.length).toBe(81);
      });

      test('should handle puzzle with no pre-filled cells', () => {
        const simple: ISimplePuzzleDescription = {
          description: 'Empty puzzle',
          type: 'sudoku',
          level: 1,
          totalRows: 9,
          totalColumns: 9,
          cells: '.'.repeat(81)
        };

        const result = createPuzzleDefinition(simple);
        expect(result.cells).toBe('.'.repeat(81));
      });

      test('should handle puzzle with all cells filled', () => {
        const simple: ISimplePuzzleDescription = {
          description: 'Complete puzzle',
          type: 'sudoku',
          level: 1,
          totalRows: 4,
          totalColumns: 4,
          cells: '1234341221433421'
        };

        const result = createPuzzleDefinition(simple);
        expect(result.cells).toBe('1234341221433421');
      });
    });

    describe('difficulty levels', () => {
      test('should preserve difficulty level 1 (easy)', () => {
        const simple: ISimplePuzzleDescription = {
          description: 'Easy puzzle',
          type: 'sudoku',
          level: 1,
          totalRows: 9,
          totalColumns: 9,
          cells: '.'.repeat(81)
        };

        const result = createPuzzleDefinition(simple);
        expect(result.level).toBe(1);
      });

      test('should preserve difficulty level 5 (hard)', () => {
        const simple: ISimplePuzzleDescription = {
          description: 'Hard puzzle',
          type: 'sudoku',
          level: 5,
          totalRows: 9,
          totalColumns: 9,
          cells: '.'.repeat(81)
        };

        const result = createPuzzleDefinition(simple);
        expect(result.level).toBe(5);
      });

      test('should preserve difficulty level 10 (expert)', () => {
        const simple: ISimplePuzzleDescription = {
          description: 'Expert puzzle',
          type: 'sudoku',
          level: 10,
          totalRows: 9,
          totalColumns: 9,
          cells: '.'.repeat(81)
        };

        const result = createPuzzleDefinition(simple);
        expect(result.level).toBe(10);
      });
    });

    describe('derived property calculations', () => {
      test('should calculate maxValue correctly for 4x4 puzzle', () => {
        const simple: ISimplePuzzleDescription = {
          description: 'Test',
          type: 'sudoku',
          level: 1,
          totalRows: 4,
          totalColumns: 4,
          cells: '.'.repeat(16)
        };

        const result = createPuzzleDefinition(simple);
        expect(result.maxValue).toBe(4); // 2 * 2
      });

      test('should calculate maxValue correctly for 6x6 puzzle', () => {
        const simple: ISimplePuzzleDescription = {
          description: 'Test',
          type: 'sudoku',
          level: 1,
          totalRows: 6,
          totalColumns: 6,
          cells: '.'.repeat(36)
        };

        const result = createPuzzleDefinition(simple);
        expect(result.maxValue).toBe(6); // 3 * 2
      });

      test('should calculate totalCages correctly', () => {
        const simple: ISimplePuzzleDescription = {
          description: 'Test',
          type: 'sudoku',
          level: 1,
          totalRows: 9,
          totalColumns: 9,
          cells: '.'.repeat(81)
        };

        const result = createPuzzleDefinition(simple);
        expect(result.totalCages).toBe(9); // 3 * 3
      });

      test('should calculate basicCageTotal using triangular number formula', () => {
        const testCases = [
          { size: 4, expected: 10 }, // 1+2+3+4
          { size: 6, expected: 21 }, // 1+2+3+4+5+6
          { size: 9, expected: 45 }, // 1+2+...+9
          { size: 12, expected: 78 }, // 1+2+...+12
          { size: 16, expected: 136 } // 1+2+...+16
        ];

        testCases.forEach(({ size, expected }) => {
          const simple: ISimplePuzzleDescription = {
            description: `Test ${size}x${size}`,
            type: 'sudoku',
            level: 1,
            totalRows: size,
            totalColumns: size,
            cells: '.'.repeat(size * size)
          };

          const result = createPuzzleDefinition(simple);
          expect(result.basicCageTotal).toBe(expected);
        });
      });
    });
  });

  describe('createEmptyPuzzleDefinition', () => {
    describe('default parameters', () => {
      test('should create empty 9x9 standard sudoku by default', () => {
        const result = createEmptyPuzzleDefinition();

        expect(result.id).toBe('manual-entry');
        expect(result.description).toBe('Manual Entry Puzzle');
        expect(result.type).toBe('sudoku');
        expect(result.level).toBe(1);
        expect(result.totalRows).toBe(9);
        expect(result.totalColumns).toBe(9);
        expect(result.cells).toBe('.'.repeat(81));

        // Verify standard 9x9 dimensions
        expect(result.cageWidthInCells).toBe(3);
        expect(result.cageHeightInCells).toBe(3);
        expect(result.boardWidthInCages).toBe(3);
        expect(result.boardHeightInCages).toBe(3);
        expect(result.maxValue).toBe(9);
      });
    });

    describe('custom grid sizes', () => {
      test('should create empty 4x4 puzzle', () => {
        const result = createEmptyPuzzleDefinition(4, 4);

        expect(result.totalRows).toBe(4);
        expect(result.totalColumns).toBe(4);
        expect(result.cells).toBe('.'.repeat(16));
        expect(result.cageWidthInCells).toBe(2);
        expect(result.cageHeightInCells).toBe(2);
      });

      test('should create empty 6x6 puzzle', () => {
        const result = createEmptyPuzzleDefinition(6, 6);

        expect(result.totalRows).toBe(6);
        expect(result.totalColumns).toBe(6);
        expect(result.cells).toBe('.'.repeat(36));
        expect(result.cageWidthInCells).toBe(3);
        expect(result.cageHeightInCells).toBe(2);
      });

      test('should create empty 12x12 puzzle', () => {
        const result = createEmptyPuzzleDefinition(12, 12);

        expect(result.totalRows).toBe(12);
        expect(result.totalColumns).toBe(12);
        expect(result.cells).toBe('.'.repeat(144));
        expect(result.cageWidthInCells).toBe(4);
        expect(result.cageHeightInCells).toBe(3);
      });

      test('should create empty 16x16 puzzle', () => {
        const result = createEmptyPuzzleDefinition(16, 16);

        expect(result.totalRows).toBe(16);
        expect(result.totalColumns).toBe(16);
        expect(result.cells).toBe('.'.repeat(256));
        expect(result.cageWidthInCells).toBe(4);
        expect(result.cageHeightInCells).toBe(4);
      });

      test('should create empty 25x25 puzzle', () => {
        const result = createEmptyPuzzleDefinition(25, 25);

        expect(result.totalRows).toBe(25);
        expect(result.totalColumns).toBe(25);
        expect(result.cells).toBe('.'.repeat(625));
        expect(result.cageWidthInCells).toBe(5);
        expect(result.cageHeightInCells).toBe(5);
      });
    });

    describe('puzzle type parameter', () => {
      test('should create empty standard sudoku when type specified', () => {
        const result = createEmptyPuzzleDefinition(9, 9, 'sudoku');

        expect(result.type).toBe('sudoku');
        expect(result.totalRows).toBe(9);
        expect(result.totalColumns).toBe(9);
      });

      test('should create empty Sudoku-X puzzle when type specified', () => {
        const result = createEmptyPuzzleDefinition(9, 9, 'sudoku-x');

        expect(result.type).toBe('sudoku-x');
        expect(result.id).toBe('manual-entry');
        expect(result.description).toBe('Manual Entry Puzzle');
        expect(result.totalRows).toBe(9);
        expect(result.totalColumns).toBe(9);
      });

      test('should create empty Killer Sudoku puzzle when type specified', () => {
        const result = createEmptyPuzzleDefinition(9, 9, 'killer-sudoku');

        expect(result.type).toBe('killer-sudoku');
        expect(result.id).toBe('manual-entry');
        expect(result.description).toBe('Manual Entry Puzzle');
        expect(result.totalRows).toBe(9);
        expect(result.totalColumns).toBe(9);
      });
    });

    describe('consistent metadata', () => {
      test('should use consistent ID for all empty puzzles', () => {
        const sudoku = createEmptyPuzzleDefinition(9, 9, 'sudoku');
        const sudokuX = createEmptyPuzzleDefinition(9, 9, 'sudoku-x');
        const killer = createEmptyPuzzleDefinition(9, 9, 'killer-sudoku');

        expect(sudoku.id).toBe('manual-entry');
        expect(sudokuX.id).toBe('manual-entry');
        expect(killer.id).toBe('manual-entry');
      });

      test('should use consistent description for all empty puzzles', () => {
        const small = createEmptyPuzzleDefinition(4, 4);
        const medium = createEmptyPuzzleDefinition(9, 9);
        const large = createEmptyPuzzleDefinition(16, 16);

        expect(small.description).toBe('Manual Entry Puzzle');
        expect(medium.description).toBe('Manual Entry Puzzle');
        expect(large.description).toBe('Manual Entry Puzzle');
      });

      test('should always set level to 1 for empty puzzles', () => {
        const result = createEmptyPuzzleDefinition(9, 9);
        expect(result.level).toBe(1);
      });
    });

    describe('integration with createPuzzleDefinition', () => {
      test('should produce same result as manually creating simple description', () => {
        const viaHelper = createEmptyPuzzleDefinition(9, 9, 'sudoku');

        const manual: ISimplePuzzleDescription = {
          id: 'manual-entry',
          description: 'Manual Entry Puzzle',
          type: 'sudoku',
          level: 1,
          totalRows: 9,
          totalColumns: 9,
          cells: '.'.repeat(81)
        };
        const viaManual = createPuzzleDefinition(manual);

        expect(viaHelper).toEqual(viaManual);
      });

      test('should work correctly for all standard sizes', () => {
        const sizes = [
          { rows: 4, cols: 4 },
          { rows: 6, cols: 6 },
          { rows: 9, cols: 9 },
          { rows: 12, cols: 12 },
          { rows: 16, cols: 16 },
          { rows: 25, cols: 25 }
        ];

        sizes.forEach(({ rows, cols }) => {
          const result = createEmptyPuzzleDefinition(rows, cols);

          expect(result.totalRows).toBe(rows);
          expect(result.totalColumns).toBe(cols);
          expect(result.cells.length).toBe(rows * cols);
          expect(result.cells).toBe('.'.repeat(rows * cols));
        });
      });
    });

    describe('non-square grids', () => {
      test('should handle rectangular grid with default parameters', () => {
        // Using non-square grid (though unusual for Sudoku)
        const result = createEmptyPuzzleDefinition(8, 9);

        expect(result.totalRows).toBe(8);
        expect(result.totalColumns).toBe(9);
        expect(result.cells).toBe('.'.repeat(72));
      });
    });
  });

  describe('user experience scenarios', () => {
    describe('loading puzzles from different sources', () => {
      test('should handle puzzle loaded from file format', () => {
        const fileData: ISimplePuzzleDescription = {
          id: 'imported-puzzle-001',
          description: 'Daily Puzzle - Jan 1',
          type: 'sudoku',
          level: 3,
          totalRows: 9,
          totalColumns: 9,
          cells: '5.....8.1..2.4.6..7.....3.....1...5.9..8..2.3...4.....6.....9..8.1.5..2.4.....7'
        };

        const result = createPuzzleDefinition(fileData);

        expect(result.id).toBe('imported-puzzle-001');
        expect(result.description).toBe('Daily Puzzle - Jan 1');
        expect(result.type).toBe('sudoku');
        expect(result.level).toBe(3);
      });

      test('should handle puzzle from web API without ID', () => {
        const apiData: ISimplePuzzleDescription = {
          description: 'Random Hard Puzzle',
          type: 'sudoku',
          level: 5,
          totalRows: 9,
          totalColumns: 9,
          cells: '..9.....2.8.........1.5...6...8..4.....2.....9..3...5...7.6.........5.1.....8..'
        };

        const result = createPuzzleDefinition(apiData);

        expect(result.id).toBeUndefined();
        expect(result.description).toBe('Random Hard Puzzle');
      });
    });

    describe('creating new puzzles for user entry', () => {
      test('should provide clean slate for manual puzzle creation', () => {
        const result = createEmptyPuzzleDefinition();

        expect(result.cells).toBe('.'.repeat(81));
        expect(result.id).toBe('manual-entry');
        expect(result.level).toBe(1);
      });

      test('should allow user to create different sized puzzles', () => {
        const sizes = [4, 6, 9, 12, 16, 25];

        sizes.forEach((size) => {
          const result = createEmptyPuzzleDefinition(size, size);
          expect(result.totalRows).toBe(size);
          expect(result.totalColumns).toBe(size);
          expect(result.cells).toBe('.'.repeat(size * size));
        });
      });
    });

    describe('puzzle variant support', () => {
      test('should correctly set up Sudoku-X variant with diagonal constraints', () => {
        const simple: ISimplePuzzleDescription = {
          id: 'sudoku-x-001',
          description: 'Sudoku-X Challenge',
          type: 'sudoku-x',
          level: 4,
          totalRows: 9,
          totalColumns: 9,
          cells: '.'.repeat(81)
        };

        const result = createPuzzleDefinition(simple);

        expect(result.type).toBe('sudoku-x');
        // Should have same dimensions as standard sudoku
        expect(result.cageWidthInCells).toBe(3);
        expect(result.cageHeightInCells).toBe(3);
        expect(result.maxValue).toBe(9);
      });

      test('should correctly set up Killer Sudoku variant', () => {
        const simple: ISimplePuzzleDescription = {
          id: 'killer-001',
          description: 'Killer Sudoku Puzzle',
          type: 'killer-sudoku',
          level: 6,
          totalRows: 9,
          totalColumns: 9,
          cells: '.'.repeat(81)
        };

        const result = createPuzzleDefinition(simple);

        expect(result.type).toBe('killer-sudoku');
        expect(result.basicCageTotal).toBe(45); // Important for killer sudoku calculations
      });
    });

    describe('realistic puzzle data scenarios', () => {
      test('should handle partially filled puzzle', () => {
        // Create a realistic partially filled puzzle with some clues
        const prefilled = '..............................123456789..........................................';
        const simple: ISimplePuzzleDescription = {
          description: 'Easy Starter Puzzle',
          type: 'sudoku',
          level: 1,
          totalRows: 9,
          totalColumns: 9,
          cells: prefilled
        };

        const result = createPuzzleDefinition(simple);

        expect(result.cells).toBe(prefilled);
        expect(result.cells).toContain('1');
        expect(result.cells).toContain('.');
        expect(result.cells.length).toBe(81);
      });

      test('should handle compact 4x4 puzzle for beginners', () => {
        const simple: ISimplePuzzleDescription = {
          description: 'Beginner 4x4',
          type: 'sudoku',
          level: 1,
          totalRows: 4,
          totalColumns: 4,
          cells: '1..2.3...4......'
        };

        const result = createPuzzleDefinition(simple);

        expect(result.maxValue).toBe(4);
        expect(result.basicCageTotal).toBe(10);
        expect(result.cells.length).toBe(16);
      });

      test('should handle large 16x16 puzzle for advanced users', () => {
        const simple: ISimplePuzzleDescription = {
          description: 'Expert 16x16 Challenge',
          type: 'sudoku',
          level: 10,
          totalRows: 16,
          totalColumns: 16,
          cells: '.'.repeat(256)
        };

        const result = createPuzzleDefinition(simple);

        expect(result.maxValue).toBe(16);
        expect(result.totalCages).toBe(16);
        expect(result.cells.length).toBe(256);
      });
    });
  });
});
