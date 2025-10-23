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

import { Result, succeed } from '@fgv/ts-utils';
import { CellId, Cage, ICage, ICell, Puzzle, PuzzleState } from '../../common';

/**
 * @internal
 */
export class PossibilityAnalyzer {
  /**
   * Analyze possible values for each cell in a killer cage based on current puzzle state.
   * @param puzzle - The puzzle instance
   * @param state - Current puzzle state
   * @param cage - The killer cage to analyze
   * @param validCombinations - Pre-computed valid combinations for the cage
   * @returns Map of CellId to possible number arrays
   */
  public static analyze(
    puzzle: Puzzle,
    state: PuzzleState,
    cage: ICage,
    validCombinations: number[][]
  ): Result<Map<CellId, number[]>> {
    const possibilities = new Map<CellId, number[]>();

    // Get current values in the cage
    // We need the concrete Cage class for containedValues method
    const concreteCage = cage as Cage;
    const currentValues = concreteCage.containedValues(state);
    const emptyCells: CellId[] = [];

    // Identify empty cells and initialize possibilities
    for (const cellId of cage.cellIds) {
      const cellContents = state.getCellContents(cellId).orDefault();
      /* c8 ignore next 1 - ? is defense in depth */
      if (cellContents?.value !== undefined) {
        // Cell already has a value - set empty possibilities array
        possibilities.set(cellId, []);
      } else {
        // Empty cell
        emptyCells.push(cellId);
        possibilities.set(cellId, []);
      }
    }

    // Filter combinations that are compatible with current state
    const compatibleCombinations = validCombinations.filter((combination) => {
      // Check if combination contains all current values
      for (const currentValue of currentValues) {
        if (!combination.includes(currentValue)) {
          return false;
        }
      }

      // Check if combination has the right number of remaining values
      const remainingValues = combination.filter((value) => !currentValues.has(value));
      return remainingValues.length === emptyCells.length;
    });

    // If no compatible combinations exist, return empty possibilities for all cells
    if (compatibleCombinations.length === 0) {
      return succeed(possibilities);
    }

    // For each empty cell, find which values are possible
    for (const cellId of emptyCells) {
      const cellPossibilities = new Set<number>();

      // Get the cell to check sudoku constraints
      const cellResult = puzzle.getCell(cellId);
      /* c8 ignore next 3 - defensive coding: protects against internal cage/puzzle state corruption */
      if (cellResult.isFailure()) {
        continue;
      }
      const cell = cellResult.value;

      // Check each compatible combination
      for (const combination of compatibleCombinations) {
        const remainingValues = combination.filter((value) => !currentValues.has(value));

        // Check if each remaining value could go in this cell
        for (const value of remainingValues) {
          if (this._canPlaceValueInCell(cell, value, state)) {
            cellPossibilities.add(value);
          }
        }
      }

      possibilities.set(cellId, Array.from(cellPossibilities).sort());
    }

    return succeed(possibilities);
  }

  /**
   * Check if a value can be placed in a cell considering sudoku constraints.
   * @param cell - The cell to check
   * @param value - The value to place
   * @param state - Current puzzle state
   * @returns True if the value can be placed
   */
  private static _canPlaceValueInCell(cell: ICell, value: number, state: PuzzleState): boolean {
    // Check all cages this cell belongs to for sudoku constraints
    for (const cage of cell.cages) {
      if (cage.cageType === 'killer') {
        // Skip killer cage check - we're already analyzing within killer constraints
        continue;
      }

      // Check if value already exists in this constraint cage (row, column, section, etc.)
      const concreteCage = cage as Cage;
      if (concreteCage.containsValue(value, state, [cell.id])) {
        return false;
      }
    }

    return true;
  }
}
