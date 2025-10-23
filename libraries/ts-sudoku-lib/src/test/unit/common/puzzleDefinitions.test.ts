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
import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  IPuzzleDimensions,
  IPuzzleTypeValidator,
  PuzzleDefinitionFactory,
  STANDARD_CONFIGS
} from '../../../packlets/common';
import { PuzzleType } from '../../../packlets/common';

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

  describe('KillerSudokuValidator', () => {
    const dimensions = STANDARD_CONFIGS.puzzle9x9;
    const validator = PuzzleDefinitionFactory.getValidator('killer-sudoku')!;

    test('should reject cells with insufficient length', () => {
      const result = validator.validateCells('...', dimensions);
      expect(result).toFailWith(/must contain at least/i);
    });

    test('should reject cells without separator', () => {
      const cells = '.'.repeat(81);
      expect(validator.validateCells(cells, dimensions)).toFailWith(/must contain cage definitions/i);
    });

    test('should reject cells with separator in wrong position', () => {
      const cells = '.'.repeat(40) + '|' + '.'.repeat(40);
      expect(validator.validateCells(cells, dimensions)).toFailWith(/must be exactly 81 characters/i);
    });

    test('should reject cells with invalid characters', () => {
      const cells = '.'.repeat(40) + '!' + '.'.repeat(40) + '|cages';
      expect(validator.validateCells(cells, dimensions)).toFailWith(/invalid character/i);
    });

    test('should fail for killer sudoku with invalid character in grid portion at position 0', () => {
      const invalidCells = '!' + '.'.repeat(80) + '|A11,B09'; // Invalid '!' character in grid
      expect(validator.validateCells(invalidCells, dimensions)).toFailWith(
        /invalid character.*'!'.*at position 0/i
      );
    });

    test('should fail for killer sudoku with invalid character $ in grid portion', () => {
      const invalidCells = '.'.repeat(40) + '$' + '.'.repeat(40) + '|A11';
      expect(validator.validateCells(invalidCells, dimensions)).toFailWith(/invalid character.*'\$'/i);
    });

    test('should fail for killer sudoku with invalid character # in grid portion', () => {
      const invalidCells = '.'.repeat(20) + '#' + '.'.repeat(60) + '|B20';
      expect(validator.validateCells(invalidCells, dimensions)).toFailWith(/invalid character.*'#'/i);
    });

    test('should accept valid killer sudoku format', () => {
      const cells = 'A'.repeat(81) + '|A:3:A1,A2,A3';
      expect(validator.validateCells(cells, dimensions)).toSucceed();
    });
  });

  describe('PuzzleDefinitionFactory.create with killer sudoku type', () => {
    test('should fail when killer sudoku cells string has too few grid cells', () => {
      // Killer format: grid cells + "|" + cage definitions
      // For 9x9, we need 81 grid cells before the "|", but only provide 16
      // The total string length is 16 + 1 (pipe) + 12 (cage def) = 29
      const cells = '.'.repeat(16) + '|A:3:A1,A2,A3';

      const result = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
        id: 'killer-too-short',
        description: 'Killer with too few grid cells',
        type: 'killer-sudoku',
        level: 1,
        cells
      });

      expect(result).toFailWith(/must contain at least 81 grid cells, got 29/i);
    });
  });

  describe('unknown puzzle types', () => {
    test('should reject unknown puzzle type in PuzzleDefinitionFactory', () => {
      const result = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
        type: 'bogus-type' as unknown as 'sudoku',
        cells: '.'.repeat(81)
      });
      expect(result).toFailWith(/unknown puzzle type/i);
    });
  });

  describe('dimension validation edge cases', () => {
    test('should reject cages smaller than 2x2', () => {
      expect(
        PuzzleDefinitionFactory.create({
          cageWidthInCells: 1,
          cageHeightInCells: 2,
          boardWidthInCages: 3,
          boardHeightInCages: 3
        })
      ).toFailWith(/cage dimensions must be at least 2x2/i);
    });

    test('should reject board dimensions less than 1', () => {
      expect(
        PuzzleDefinitionFactory.create({
          cageWidthInCells: 3,
          cageHeightInCells: 3,
          boardWidthInCages: 0,
          boardHeightInCages: 3
        })
      ).toFailWith(/board dimensions must be positive/i);
    });

    test('should fail validation for zero board width', () => {
      expect(
        PuzzleDefinitionFactory.validate({
          cageWidthInCells: 3,
          cageHeightInCells: 3,
          boardWidthInCages: 0,
          boardHeightInCages: 3
        })
      ).toFailWith(/board dimensions must be positive/i);
    });

    test('should fail validation for negative board height', () => {
      expect(
        PuzzleDefinitionFactory.validate({
          cageWidthInCells: 3,
          cageHeightInCells: 3,
          boardWidthInCages: 3,
          boardHeightInCages: -1
        })
      ).toFailWith(/board dimensions must be positive/i);
    });

    test('should fail validation for both zero board dimensions', () => {
      expect(
        PuzzleDefinitionFactory.validate({
          cageWidthInCells: 2,
          cageHeightInCells: 2,
          boardWidthInCages: 0,
          boardHeightInCages: 0
        })
      ).toFailWith(/board dimensions must be positive/i);
    });

    test('should reject cage size resulting in invalid max values (too small)', () => {
      // 1x1 cages fail the 2x2 minimum check first
      expect(
        PuzzleDefinitionFactory.create({
          cageWidthInCells: 1,
          cageHeightInCells: 1,
          boardWidthInCages: 3,
          boardHeightInCages: 3
        })
      ).toFailWith(/cage dimensions must be at least 2x2/i);
    });

    test('should reject cage size resulting in invalid max values (too large)', () => {
      // 26x2 cages result in maxValue of 52, which exceeds the 25 limit
      // But the grid is also 26x2, which exceeds 25x25 limit, so that check fails first
      expect(
        PuzzleDefinitionFactory.create({
          cageWidthInCells: 26,
          cageHeightInCells: 2,
          boardWidthInCages: 1,
          boardHeightInCages: 1
        })
      ).toFailWith(/must not exceed 25x25/i);
    });

    test('should fail validation for cage dimensions resulting in maxValue < 2', () => {
      // 1x1 cages would result in maxValue of 1, which is < 2
      // But this fails the 2x2 minimum check first
      expect(
        PuzzleDefinitionFactory.validate({
          cageWidthInCells: 1,
          cageHeightInCells: 1,
          boardWidthInCages: 3,
          boardHeightInCages: 3
        })
      ).toFailWith(/cage dimensions must be at least 2x2/i);
    });

    test('should fail validation for cage dimensions resulting in maxValue > 25', () => {
      // 6x5 cages result in maxValue of 30, which exceeds 25
      // Grid is 12x10 which is within 25x25 limit
      expect(
        PuzzleDefinitionFactory.validate({
          cageWidthInCells: 6,
          cageHeightInCells: 5,
          boardWidthInCages: 2,
          boardHeightInCages: 2
        })
      ).toFailWith(/cage size must result in values between 2 and 25/i);
    });

    test('should fail validation for 26x1 cage dimensions', () => {
      // 26x1 cages would result in maxValue of 26, which exceeds 25
      // But first fails 2x2 check since height is 1
      expect(
        PuzzleDefinitionFactory.validate({
          cageWidthInCells: 26,
          cageHeightInCells: 1,
          boardWidthInCages: 1,
          boardHeightInCages: 1
        })
      ).toFailWith(/cage dimensions must be at least 2x2/i);
    });

    test('should fail validation for 13x2 cage dimensions with small board', () => {
      // 13x2 cages result in maxValue of 26, which exceeds 25
      // Grid is 13x2 which is within 25x25 limit
      expect(
        PuzzleDefinitionFactory.validate({
          cageWidthInCells: 13,
          cageHeightInCells: 2,
          boardWidthInCages: 1,
          boardHeightInCages: 1
        })
      ).toFailWith(/cage size must result in values between 2 and 25/i);
    });

    test('should reject grids exceeding 25x25 maximum', () => {
      expect(
        PuzzleDefinitionFactory.create({
          cageWidthInCells: 26,
          cageHeightInCells: 26,
          boardWidthInCages: 1,
          boardHeightInCages: 1
        })
      ).toFailWith(/must not exceed 25x25/i);
    });
  });

  describe('validator registry', () => {
    test('should get validator for each type', () => {
      expect(PuzzleDefinitionFactory.getValidator('sudoku')).toBeDefined();
      expect(PuzzleDefinitionFactory.getValidator('killer-sudoku')).toBeDefined();
      expect(PuzzleDefinitionFactory.getValidator('sudoku-x')).toBeDefined();
    });

    test('should allow registering custom validators', () => {
      const validator = PuzzleDefinitionFactory.getValidator('sudoku')!;
      PuzzleDefinitionFactory.registerValidator('custom' as unknown as PuzzleType, validator);
      expect(PuzzleDefinitionFactory.getValidator('custom' as unknown as PuzzleType)).toBe(validator);
    });

    test('should get all standard configs', () => {
      const configs = PuzzleDefinitionFactory.getStandardConfigs();
      expect(configs.puzzle4x4).toBeDefined();
      expect(configs.puzzle6x6).toBeDefined();
      expect(configs.puzzle9x9).toBeDefined();
      expect(configs.puzzle12x12).toBeDefined();
    });
  });

  describe('createKiller', () => {
    test('should create a killer sudoku puzzle with valid killer cages', () => {
      const dimensions = STANDARD_CONFIGS.puzzle9x9;
      // For killer-sudoku, cells must have format: gridCells|cageDefinitions
      const cells = '.'.repeat(81) + '|a10,b15';

      const result = PuzzleDefinitionFactory.createKiller(dimensions, {
        id: 'killer-test',
        description: 'Test killer puzzle',
        type: 'killer-sudoku',
        level: 3,
        cells,
        killerCages: [
          {
            id: 'a',
            cellPositions: [
              { row: 0, col: 0 },
              { row: 0, col: 1 }
            ],
            sum: 10
          },
          {
            id: 'b',
            cellPositions: [
              { row: 1, col: 0 },
              { row: 1, col: 1 },
              { row: 2, col: 0 }
            ],
            sum: 15
          }
        ]
      });

      expect(result).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.type).toBe('killer-sudoku');
        expect(puzzle.cages).toHaveLength(2);

        // Check first cage
        const cage1 = puzzle.cages![0];
        expect(cage1.id).toBe('Ka');
        expect(cage1.cageType).toBe('killer');
        expect(cage1.total).toBe(10);
        expect(cage1.numCells).toBe(2);
        expect(cage1.cellIds).toEqual(['A1', 'A2']);

        // Check second cage
        const cage2 = puzzle.cages![1];
        expect(cage2.id).toBe('Kb');
        expect(cage2.cageType).toBe('killer');
        expect(cage2.total).toBe(15);
        expect(cage2.numCells).toBe(3);
        expect(cage2.cellIds).toEqual(['B1', 'B2', 'C1']);
      });
    });

    test('should handle empty killer cages array', () => {
      const dimensions = STANDARD_CONFIGS.puzzle9x9;
      const cells = '.'.repeat(81) + '|'; // Empty cage definitions

      const result = PuzzleDefinitionFactory.createKiller(dimensions, {
        id: 'killer-empty',
        description: 'Empty killer puzzle',
        type: 'killer-sudoku',
        level: 1,
        cells,
        killerCages: []
      });

      expect(result).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.type).toBe('killer-sudoku');
        expect(puzzle.cages).toEqual([]);
      });
    });

    test('should create killer sudoku even with out-of-bounds positions', () => {
      const dimensions = STANDARD_CONFIGS.puzzle9x9;
      const cells = '.'.repeat(81) + '|invalid10';

      const result = PuzzleDefinitionFactory.createKiller(dimensions, {
        id: 'killer-invalid',
        description: 'Killer puzzle with out-of-bounds position',
        type: 'killer-sudoku',
        level: 1,
        cells,
        killerCages: [
          {
            id: 'invalid',
            cellPositions: [{ row: 99, col: 99 }], // Creates CV100 cell ID
            sum: 10
          }
        ]
      });

      // The method doesn't validate positions, it just creates cell IDs
      expect(result).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.cages).toHaveLength(1);
        expect(puzzle.cages![0].cellIds).toEqual(['CV100']);
      });
    });

    test('should fail when cells string length does not match expected', () => {
      const dimensions = STANDARD_CONFIGS.puzzle9x9;
      const cells = '.'.repeat(16) + '|'; // Wrong number of cells

      const result = PuzzleDefinitionFactory.createKiller(dimensions, {
        id: 'killer-wrong-size',
        description: 'Wrong size killer puzzle',
        type: 'killer-sudoku',
        level: 1,
        cells,
        killerCages: []
      });

      expect(result).toFailWith(/must contain at least 81 grid cells, got 17/);
    });

    test('should create killer sudoku with large cages', () => {
      const dimensions = STANDARD_CONFIGS.puzzle4x4;
      const cells = '.'.repeat(16) + '|large25';

      const result = PuzzleDefinitionFactory.createKiller(dimensions, {
        id: 'killer-large',
        description: 'Large cage killer puzzle',
        type: 'killer-sudoku',
        level: 2,
        cells,
        killerCages: [
          {
            id: 'large',
            cellPositions: [
              { row: 0, col: 0 },
              { row: 0, col: 1 },
              { row: 1, col: 0 },
              { row: 1, col: 1 },
              { row: 2, col: 0 }
            ],
            sum: 25
          }
        ]
      });

      expect(result).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.cages).toHaveLength(1);
        const cage = puzzle.cages![0];
        expect(cage.numCells).toBe(5);
        expect(cage.total).toBe(25);
      });
    });
  });

  describe('getValidator and registerValidator', () => {
    test('should get validator for registered puzzle type', () => {
      // Built-in validators
      expect(PuzzleDefinitionFactory.getValidator('sudoku')).toBeDefined();
      expect(PuzzleDefinitionFactory.getValidator('sudoku-x')).toBeDefined();
      expect(PuzzleDefinitionFactory.getValidator('killer-sudoku')).toBeDefined();
    });

    test('should return undefined for unregistered puzzle type', () => {
      // Type that doesn't exist
      expect(PuzzleDefinitionFactory.getValidator('unknown-type' as unknown as PuzzleType)).toBeUndefined();
    });

    test('should register and retrieve custom validator', () => {
      const customValidator: IPuzzleTypeValidator = {
        validateCells: (cells: string, __dimensions: IPuzzleDimensions): Result<true> => {
          if (cells.length < 10) {
            return fail('Custom validation: cells too short');
          }
          return succeed(true);
        }
      };

      // Register custom validator
      PuzzleDefinitionFactory.registerValidator('custom-puzzle' as unknown as PuzzleType, customValidator);

      // Should be able to retrieve it
      const retrieved = PuzzleDefinitionFactory.getValidator('custom-puzzle' as unknown as PuzzleType);
      expect(retrieved).toBe(customValidator);
      expect(retrieved?.validateCells('.'.repeat(5), {} as IPuzzleDimensions)).toFailWith(/cells too short/);
      expect(retrieved?.validateCells('.'.repeat(10), {} as IPuzzleDimensions)).toSucceed();
    });

    test('should override existing validator when registering', () => {
      const originalValidator = PuzzleDefinitionFactory.getValidator('sudoku');
      expect(originalValidator).toBeDefined();

      const newValidator = {
        validateCells: (cells: string, __dimensions: IPuzzleDimensions) => {
          return fail<true>('Overridden validator');
        }
      };

      // Override sudoku validator
      PuzzleDefinitionFactory.registerValidator('sudoku', newValidator);

      const retrieved = PuzzleDefinitionFactory.getValidator('sudoku');
      expect(retrieved).toBe(newValidator);
      expect(retrieved?.validateCells('.'.repeat(81), {} as IPuzzleDimensions)).toFailWith(
        /Overridden validator/
      );

      // Restore original validator
      if (originalValidator) {
        PuzzleDefinitionFactory.registerValidator('sudoku', originalValidator);
      }
    });
  });

  describe('SudokuXValidator', () => {
    test('should create a valid Sudoku X puzzle using SudokuXValidator', () => {
      const dimensions = STANDARD_CONFIGS.puzzle9x9;
      const cells = '.'.repeat(81);

      const result = PuzzleDefinitionFactory.create(dimensions, {
        description: 'Test Sudoku X puzzle',
        type: 'sudoku-x',
        level: 3,
        cells
      });

      expect(result).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.type).toBe('sudoku-x');
        expect(puzzle.totalRows).toBe(9);
        expect(puzzle.totalColumns).toBe(9);
        expect(puzzle.maxValue).toBe(9);
        expect(puzzle.cells).toBe(cells);
        expect(puzzle.description).toBe('Test Sudoku X puzzle');
      });
    });

    test('should reject Sudoku X puzzle with invalid cell count', () => {
      const dimensions = STANDARD_CONFIGS.puzzle9x9;
      const cells = '.'.repeat(40); // Too few cells

      const result = PuzzleDefinitionFactory.create(dimensions, {
        description: 'Invalid Sudoku X',
        type: 'sudoku-x',
        level: 1,
        cells
      });

      expect(result).toFailWith(/expected 81 cells, got 40/i);
    });

    test('should create 4x4 Sudoku X puzzle', () => {
      const dimensions = STANDARD_CONFIGS.puzzle4x4;
      const cells = '.'.repeat(16);

      const result = PuzzleDefinitionFactory.create(dimensions, {
        description: 'Test 4x4 Sudoku X',
        type: 'sudoku-x',
        level: 1,
        cells
      });

      expect(result).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.type).toBe('sudoku-x');
        expect(puzzle.totalRows).toBe(4);
        expect(puzzle.totalColumns).toBe(4);
        expect(puzzle.maxValue).toBe(4);
      });
    });
  });
});
