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

import { Result, succeed, fail, captureResult } from '@fgv/ts-utils';
import { PuzzleType, CageId, CellId } from './common';
import { ICage } from './public';

/**
 * Interface for puzzle type-specific validation
 * @public
 */
export interface IPuzzleTypeValidator {
  /**
   * Validate the cells string for this puzzle type
   */
  validateCells(cells: string, dimensions: IPuzzleDimensions): Result<true>;
}

/**
 * Default validator for standard Sudoku puzzles
 */
class StandardSudokuValidator implements IPuzzleTypeValidator {
  public validateCells(cells: string, dimensions: IPuzzleDimensions): Result<true> {
    const expectedLength =
      dimensions.cageHeightInCells *
      dimensions.boardHeightInCages *
      dimensions.cageWidthInCells *
      dimensions.boardWidthInCages;

    if (cells.length !== expectedLength) {
      return fail(`Expected ${expectedLength} cells, got ${cells.length}`);
    }

    return succeed(true);
  }
}

/**
 * Validator for Killer Sudoku puzzles - understands extended format with cage definitions
 */
class KillerSudokuValidator implements IPuzzleTypeValidator {
  public validateCells(cells: string, dimensions: IPuzzleDimensions): Result<true> {
    const expectedBasicLength =
      dimensions.cageHeightInCells *
      dimensions.boardHeightInCages *
      dimensions.cageWidthInCells *
      dimensions.boardWidthInCages;

    // Killer sudoku cells format includes cage definitions, so it will be longer than basic format
    // The basic grid should be at the beginning of the string
    if (cells.length < expectedBasicLength) {
      return fail(
        `Killer sudoku cells must contain at least ${expectedBasicLength} grid cells, got ${cells.length}`
      );
    }

    // Find the separator between grid and cage definitions
    const separatorIndex = cells.indexOf('|');
    if (separatorIndex === -1) {
      return fail('Killer sudoku cells must contain cage definitions after "|" separator');
    }

    if (separatorIndex !== expectedBasicLength) {
      return fail(
        `Killer sudoku grid portion must be exactly ${expectedBasicLength} characters, got ${separatorIndex}`
      );
    }

    // Extract the basic grid portion (before the | separator)
    const gridPortion = cells.substring(0, separatorIndex);

    // For killer sudoku, the grid portion contains:
    // - Digits 1-9 for prefilled values
    // - '.' for empty cells
    // - Letters A-Z, a-z for cage identifiers
    const maxDigit = dimensions.cageWidthInCells * dimensions.cageHeightInCells;
    const validDigits = new Set(['.', ...Array.from({ length: maxDigit }, (__val, i) => String(i + 1))]);
    const validCageLetters = new Set([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ...'abcdefghijklmnopqrstuvwxyz']);

    for (let i = 0; i < gridPortion.length; i++) {
      const char = gridPortion[i];
      if (!validDigits.has(char) && !validCageLetters.has(char)) {
        return fail(`Invalid character '${char}' at position ${i} in killer sudoku grid portion`);
      }
    }

    return succeed(true);
  }
}

/**
 * Validator for Sudoku X puzzles - same as standard but with diagonal constraints
 */
class SudokuXValidator implements IPuzzleTypeValidator {
  public validateCells(cells: string, dimensions: IPuzzleDimensions): Result<true> {
    // Sudoku X uses the same cell format as standard sudoku
    return new StandardSudokuValidator().validateCells(cells, dimensions);
  }
}

/**
 * Registry of validators for different puzzle types
 */
const PUZZLE_TYPE_VALIDATORS: Record<PuzzleType, IPuzzleTypeValidator> = {
  sudoku: new StandardSudokuValidator(),
  'killer-sudoku': new KillerSudokuValidator(),
  'sudoku-x': new SudokuXValidator()
};

/**
 * Core dimensional configuration for a puzzle grid
 * @public
 */
export interface IPuzzleDimensions {
  /** Width of each section/cage (e.g., 3 for standard Sudoku) */
  readonly cageWidthInCells: number;

  /** Height of each section/cage (e.g., 3 for standard Sudoku) */
  readonly cageHeightInCells: number;

  /** Number of cages horizontally (e.g., 3 for standard Sudoku) */
  readonly boardWidthInCages: number;

  /** Number of cages vertically (e.g., 3 for standard Sudoku) */
  readonly boardHeightInCages: number;
}

/**
 * Complete puzzle definition with derived properties
 * @public
 */
export interface IPuzzleDefinition extends IPuzzleDimensions {
  // Basic puzzle info
  readonly id?: string;
  readonly description: string;
  readonly type: PuzzleType;
  readonly level: number;
  readonly cells: string;

  // Derived properties (calculated from dimensions)
  readonly totalRows: number; // cageHeightInCells * boardHeightInCages
  readonly totalColumns: number; // cageWidthInCells * boardWidthInCages
  readonly maxValue: number; // cageWidthInCells * cageHeightInCells
  readonly totalCages: number; // boardWidthInCages * boardHeightInCages
  readonly basicCageTotal: number; // Sum of 1..maxValue

  // Optional cage data (for Killer Sudoku)
  readonly cages?: ICage[];
}

/**
 * Standard puzzle configurations
 * @public
 */
export const STANDARD_CONFIGS = {
  puzzle4x4: { cageWidthInCells: 2, cageHeightInCells: 2, boardWidthInCages: 2, boardHeightInCages: 2 },
  puzzle6x6: { cageWidthInCells: 3, cageHeightInCells: 2, boardWidthInCages: 2, boardHeightInCages: 3 },
  puzzle9x9: { cageWidthInCells: 3, cageHeightInCells: 3, boardWidthInCages: 3, boardHeightInCages: 3 },
  puzzle12x12: { cageWidthInCells: 4, cageHeightInCells: 3, boardWidthInCages: 3, boardHeightInCages: 4 }
} as const;

/**
 * Type for standard configuration names
 * @public
 */
export type StandardConfigName = keyof typeof STANDARD_CONFIGS;

/**
 * Factory for creating and validating puzzle definitions
 * @public
 */
export class PuzzleDefinitionFactory {
  /**
   * Create a puzzle definition from dimensions and options
   */
  public static create(
    dimensions: IPuzzleDimensions,
    options: Partial<IPuzzleDefinition> = {}
  ): Result<IPuzzleDefinition> {
    const dimensionValidation = this.validate(dimensions);
    if (dimensionValidation.isFailure()) {
      return fail(dimensionValidation.message);
    }

    const totalRows = dimensions.cageHeightInCells * dimensions.boardHeightInCages;
    const totalColumns = dimensions.cageWidthInCells * dimensions.boardWidthInCages;
    const maxValue = dimensions.cageWidthInCells * dimensions.cageHeightInCells;
    const totalCages = dimensions.boardWidthInCages * dimensions.boardHeightInCages;
    const basicCageTotal = this._calculateBasicCageTotal(maxValue);

    // Validate cell data using type-specific validator
    if (options.cells) {
      const puzzleType = options.type ?? 'sudoku';
      const validator = PUZZLE_TYPE_VALIDATORS[puzzleType];
      if (!validator) {
        return fail(`Unknown puzzle type: ${puzzleType}`);
      }

      const cellValidation = validator.validateCells(options.cells, dimensions);
      if (cellValidation.isFailure()) {
        return fail(cellValidation.message);
      }
    }

    const puzzleDefinition: IPuzzleDefinition = {
      // Dimensions
      cageWidthInCells: dimensions.cageWidthInCells,
      cageHeightInCells: dimensions.cageHeightInCells,
      boardWidthInCages: dimensions.boardWidthInCages,
      boardHeightInCages: dimensions.boardHeightInCages,

      // Derived properties
      totalRows,
      totalColumns,
      maxValue,
      totalCages,
      basicCageTotal,

      // Default values
      id: options.id,
      description: options.description ?? `${totalRows}x${totalColumns} puzzle`,
      type: options.type ?? 'sudoku',
      level: options.level ?? 1,
      cells: options.cells ?? '.'.repeat(totalRows * totalColumns),
      cages: options.cages
    };

    return succeed(puzzleDefinition);
  }

  /**
   * Create killer sudoku puzzle definition with cage constraints
   */
  public static createKiller(
    dimensions: IPuzzleDimensions,
    description: Omit<
      IPuzzleDefinition,
      | 'cageWidthInCells'
      | 'cageHeightInCells'
      | 'boardWidthInCages'
      | 'boardHeightInCages'
      | 'totalRows'
      | 'totalColumns'
      | 'maxValue'
      | 'totalCages'
      | 'basicCageTotal'
      | 'cages'
    > & {
      killerCages: Array<{
        id: string;
        cellPositions: Array<{ row: number; col: number }>;
        sum: number;
      }>;
    }
  ): Result<IPuzzleDefinition> {
    return captureResult(() => {
      // Import needed here to avoid circular dependencies
      const { Ids } = require('./ids');

      // Convert killer cage format to standard cage format - creating minimal cage objects
      const cages = description.killerCages.map((killerCage): ICage => {
        const cellIds = killerCage.cellPositions.map((pos) => Ids.cellId(pos).orThrow());

        return {
          id: `K${killerCage.id}` as CageId,
          cellIds,
          cageType: 'killer',
          total: killerCage.sum,
          numCells: cellIds.length,
          /* c8 ignore next 1 - coverage fails when run as part of full suite */
          containsCell: (cellId: CellId) => cellIds.includes(cellId)
        };
      });

      // Return the result directly, not wrapped in another Result
      const result = this.create(dimensions, {
        ...description,
        cages,
        type: 'killer-sudoku'
      });

      if (result.isFailure()) {
        throw new Error(result.message);
      }
      return result.value;
    }).onFailure((error) => fail(`Failed to create killer sudoku: ${error}`));
  }

  /**
   * Validate puzzle dimensions
   */
  public static validate(dimensions: IPuzzleDimensions): Result<true> {
    // Structural validation
    if (dimensions.cageWidthInCells < 1 || dimensions.cageHeightInCells < 1) {
      return fail('Cage dimensions must be positive integers');
    }

    // Sudoku cages must be multi-cell (both dimensions > 1)
    if (dimensions.cageWidthInCells < 2 || dimensions.cageHeightInCells < 2) {
      return fail('Cage dimensions must be at least 2x2 for valid Sudoku puzzles');
    }

    if (dimensions.boardWidthInCages < 1 || dimensions.boardHeightInCages < 1) {
      return fail('Board dimensions must be positive integers');
    }

    // Size constraints (reasonable limits)
    const totalRows = dimensions.cageHeightInCells * dimensions.boardHeightInCages;
    const totalColumns = dimensions.cageWidthInCells * dimensions.boardWidthInCages;

    if (totalRows > 25 || totalColumns > 25) {
      return fail('Total grid size must not exceed 25x25');
    }

    // Mathematical validity - ensure cage size makes sense for Sudoku constraints
    const maxValue = dimensions.cageWidthInCells * dimensions.cageHeightInCells;
    if (maxValue < 2 || maxValue > 25) {
      return fail('Cage size must result in values between 2 and 25');
    }

    return succeed(true);
  }

  /**
   * Get a standard configuration by name
   */
  public static getStandardConfig(name: StandardConfigName): IPuzzleDimensions {
    return STANDARD_CONFIGS[name];
  }

  /**
   * Get all available standard configurations
   */
  public static getStandardConfigs(): Record<StandardConfigName, IPuzzleDimensions> {
    return STANDARD_CONFIGS;
  }

  /**
   * Get validator for a specific puzzle type
   */
  public static getValidator(puzzleType: PuzzleType): IPuzzleTypeValidator | undefined {
    return PUZZLE_TYPE_VALIDATORS[puzzleType];
  }

  /**
   * Register a custom validator for a puzzle type
   */
  public static registerValidator(puzzleType: PuzzleType, validator: IPuzzleTypeValidator): void {
    PUZZLE_TYPE_VALIDATORS[puzzleType] = validator;
  }

  /**
   * Calculate the basic cage total (sum of 1 to maxValue)
   */
  private static _calculateBasicCageTotal(maxValue: number): number {
    return (maxValue * (maxValue + 1)) / 2;
  }
}
