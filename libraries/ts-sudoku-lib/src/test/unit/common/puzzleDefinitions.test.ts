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
import { PuzzleDefinitionFactory, STANDARD_CONFIGS } from '../../../packlets/common';

describe('PuzzleDefinitionFactory', () => {
  describe('create', () => {
    test('should create a 4x4 puzzle definition', () => {
      const dimensions = STANDARD_CONFIGS.puzzle4x4;

      const result = PuzzleDefinitionFactory.create(dimensions, {
        description: 'Test 4x4 puzzle',
        type: 'sudoku',
        level: 1,
        cells: '................'
      });

      expect(result).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.cageWidthInCells).toBe(2);
        expect(puzzle.cageHeightInCells).toBe(2);
        expect(puzzle.boardWidthInCages).toBe(2);
        expect(puzzle.boardHeightInCages).toBe(2);
        expect(puzzle.totalRows).toBe(4);
        expect(puzzle.totalColumns).toBe(4);
        expect(puzzle.maxValue).toBe(4);
        expect(puzzle.totalCages).toBe(4);
        expect(puzzle.basicCageTotal).toBe(10); // 1+2+3+4 = 10
        expect(puzzle.description).toBe('Test 4x4 puzzle');
        expect(puzzle.cells).toBe('................');
      });
    });

    test('should create a 6x6 puzzle definition', () => {
      const dimensions = STANDARD_CONFIGS.puzzle6x6;

      const result = PuzzleDefinitionFactory.create(dimensions, {
        description: 'Test 6x6 puzzle',
        type: 'sudoku',
        level: 2
      });

      expect(result).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.cageWidthInCells).toBe(3);
        expect(puzzle.cageHeightInCells).toBe(2);
        expect(puzzle.boardWidthInCages).toBe(2);
        expect(puzzle.boardHeightInCages).toBe(3);
        expect(puzzle.totalRows).toBe(6);
        expect(puzzle.totalColumns).toBe(6);
        expect(puzzle.maxValue).toBe(6);
        expect(puzzle.totalCages).toBe(6);
        expect(puzzle.basicCageTotal).toBe(21); // 1+2+3+4+5+6 = 21
        expect(puzzle.cells).toBe('.'.repeat(36)); // Default empty cells
      });
    });

    test('should create a 9x9 puzzle definition', () => {
      const dimensions = STANDARD_CONFIGS.puzzle9x9;

      const result = PuzzleDefinitionFactory.create(dimensions);

      expect(result).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.cageWidthInCells).toBe(3);
        expect(puzzle.cageHeightInCells).toBe(3);
        expect(puzzle.boardWidthInCages).toBe(3);
        expect(puzzle.boardHeightInCages).toBe(3);
        expect(puzzle.totalRows).toBe(9);
        expect(puzzle.totalColumns).toBe(9);
        expect(puzzle.maxValue).toBe(9);
        expect(puzzle.totalCages).toBe(9);
        expect(puzzle.basicCageTotal).toBe(45); // 1+2+...+9 = 45
      });
    });

    test('should create a 12x12 puzzle definition', () => {
      const dimensions = STANDARD_CONFIGS.puzzle12x12;

      const result = PuzzleDefinitionFactory.create(dimensions);

      expect(result).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.cageWidthInCells).toBe(4);
        expect(puzzle.cageHeightInCells).toBe(3);
        expect(puzzle.boardWidthInCages).toBe(3);
        expect(puzzle.boardHeightInCages).toBe(4);
        expect(puzzle.totalRows).toBe(12);
        expect(puzzle.totalColumns).toBe(12);
        expect(puzzle.maxValue).toBe(12);
        expect(puzzle.totalCages).toBe(12);
        expect(puzzle.basicCageTotal).toBe(78); // 1+2+...+12 = 78
      });
    });
  });

  describe('validation', () => {
    test('should reject invalid dimensions', () => {
      const result = PuzzleDefinitionFactory.create({
        cageWidthInCells: 0,
        cageHeightInCells: 3,
        boardWidthInCages: 3,
        boardHeightInCages: 3
      });

      expect(result).toFailWith(/cage dimensions must be positive/i);
    });

    test('should reject too large grids', () => {
      const result = PuzzleDefinitionFactory.create({
        cageWidthInCells: 10,
        cageHeightInCells: 10,
        boardWidthInCages: 3,
        boardHeightInCages: 3
      });

      expect(result).toFailWith(/must not exceed 25x25/i);
    });

    test('should reject wrong cell count', () => {
      const dimensions = STANDARD_CONFIGS.puzzle4x4;

      const result = PuzzleDefinitionFactory.create(dimensions, {
        cells: '...' // Only 3 cells instead of 16
      });

      expect(result).toFailWith(/expected 16 cells, got 3/i);
    });
  });

  describe('fromLegacy', () => {
    test('should convert 9x9 legacy format', () => {
      const legacy = {
        description: 'Legacy 9x9',
        type: 'sudoku' as const,
        level: 1,
        rows: 9,
        cols: 9,
        cells: '.'.repeat(81)
      };

      const result = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
        description: legacy.description,
        type: legacy.type,
        level: legacy.level,
        cells: legacy.cells
      });

      expect(result).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.totalRows).toBe(9);
        expect(puzzle.totalColumns).toBe(9);
        expect(puzzle.maxValue).toBe(9);
        expect(puzzle.basicCageTotal).toBe(45);
        expect(puzzle.description).toBe('Legacy 9x9');
      });
    });

    test('should convert 4x4 legacy format', () => {
      const legacy = {
        description: 'Legacy 4x4',
        type: 'sudoku' as const,
        level: 1,
        rows: 4,
        cols: 4,
        cells: '.'.repeat(16)
      };

      const result = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle4x4, {
        description: legacy.description,
        type: legacy.type,
        level: legacy.level,
        cells: legacy.cells
      });

      expect(result).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.totalRows).toBe(4);
        expect(puzzle.totalColumns).toBe(4);
        expect(puzzle.maxValue).toBe(4);
        expect(puzzle.basicCageTotal).toBe(10);
      });
    });
  });

  describe('getStandardConfig', () => {
    test('should return correct configurations', () => {
      const config4x4 = PuzzleDefinitionFactory.getStandardConfig('puzzle4x4');
      expect(config4x4.cageWidthInCells).toBe(2);
      expect(config4x4.cageHeightInCells).toBe(2);

      const config9x9 = PuzzleDefinitionFactory.getStandardConfig('puzzle9x9');
      expect(config9x9.cageWidthInCells).toBe(3);
      expect(config9x9.cageHeightInCells).toBe(3);
    });
  });
});
