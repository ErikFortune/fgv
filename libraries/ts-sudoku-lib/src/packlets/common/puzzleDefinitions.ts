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

import { Result, succeed, fail } from '@fgv/ts-utils';
import { PuzzleType } from './common';
import { ICage } from './public';

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
    return this.validate(dimensions).onSuccess(() => {
      const totalRows = dimensions.cageHeightInCells * dimensions.boardHeightInCages;
      const totalColumns = dimensions.cageWidthInCells * dimensions.boardWidthInCages;
      const maxValue = dimensions.cageWidthInCells * dimensions.cageHeightInCells;
      const totalCages = dimensions.boardWidthInCages * dimensions.boardHeightInCages;
      const basicCageTotal = this._calculateBasicCageTotal(maxValue);

      // Validate cell data if provided
      if (options.cells && options.cells.length !== totalRows * totalColumns) {
        return fail(`Expected ${totalRows * totalColumns} cells, got ${options.cells.length}`);
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
    });
  }

  /**
   * Create a puzzle definition from a legacy IPuzzleDescription
   */
  public static fromLegacy(legacy: {
    id?: string;
    description: string;
    type: PuzzleType;
    level: number;
    rows: number;
    cols: number;
    cells: string;
    cages?: ICage[];
  }): Result<IPuzzleDefinition> {
    // Determine dimensions based on grid size
    const dimensions = this._inferDimensionsFromSize(legacy.rows, legacy.cols);
    if (dimensions.isFailure()) {
      return fail(
        `Cannot infer cage dimensions for ${legacy.rows}x${legacy.cols} grid: ${dimensions.message}`
      );
    }

    return this.create(dimensions.value, {
      id: legacy.id,
      description: legacy.description,
      type: legacy.type,
      level: legacy.level,
      cells: legacy.cells,
      cages: legacy.cages
    });
  }

  /**
   * Validate puzzle dimensions
   */
  public static validate(dimensions: IPuzzleDimensions): Result<true> {
    // Structural validation
    if (dimensions.cageWidthInCells < 1 || dimensions.cageHeightInCells < 1) {
      return fail('Cage dimensions must be positive integers');
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
   * Calculate the basic cage total (sum of 1 to maxValue)
   */
  private static _calculateBasicCageTotal(maxValue: number): number {
    return (maxValue * (maxValue + 1)) / 2;
  }

  /**
   * Infer cage dimensions from legacy grid size
   */
  private static _inferDimensionsFromSize(rows: number, cols: number): Result<IPuzzleDimensions> {
    // Check if it matches a standard configuration
    for (const config of Object.values(STANDARD_CONFIGS)) {
      const totalRows = config.cageHeightInCells * config.boardHeightInCages;
      const totalColumns = config.cageWidthInCells * config.boardWidthInCages;

      if (rows === totalRows && cols === totalColumns) {
        return succeed(config);
      }
    }

    // For non-standard sizes, make reasonable assumptions
    // Try to find factors that create reasonable cage sizes
    const possibleCageWidths = this._getFactors(cols);
    const possibleCageHeights = this._getFactors(rows);

    // Prefer cage dimensions that create reasonable value ranges (2-12)
    for (const cageWidth of possibleCageWidths) {
      for (const cageHeight of possibleCageHeights) {
        const maxValue = cageWidth * cageHeight;
        if (maxValue >= 2 && maxValue <= 12) {
          const boardWidth = cols / cageWidth;
          const boardHeight = rows / cageHeight;

          if (Number.isInteger(boardWidth) && Number.isInteger(boardHeight)) {
            return succeed({
              cageWidthInCells: cageWidth,
              cageHeightInCells: cageHeight,
              boardWidthInCages: boardWidth,
              boardHeightInCages: boardHeight
            });
          }
        }
      }
    }

    return fail(`Cannot determine reasonable cage dimensions for ${rows}x${cols} grid`);
  }

  /**
   * Get all factors of a number
   */
  private static _getFactors(n: number): number[] {
    const factors: number[] = [];
    for (let i = 1; i <= Math.sqrt(n); i++) {
      if (n % i === 0) {
        factors.push(i);
        if (i !== n / i) {
          factors.push(n / i);
        }
      }
    }
    return factors.sort((a, b) => a - b);
  }
}
