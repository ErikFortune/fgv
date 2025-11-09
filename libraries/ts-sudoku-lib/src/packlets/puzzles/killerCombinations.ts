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

import { Result, fail, succeed } from '@fgv/ts-utils';
import { CellId, getCageTotalBounds, Cage, ICage, Puzzle, PuzzleState } from '../common';
import { IKillerConstraints } from './killerCombinationsTypes';
import { CombinationCache } from './internal/combinationCache';
import { CombinationGenerator } from './internal/combinationGenerator';
import { PossibilityAnalyzer } from './internal/possibilityAnalyzer';

/**
 * Helper class providing UI assistance functions for killer sudoku puzzle solving.
 * Generates possible totals, number combinations with constraints, and cell-specific
 * possibilities based on current puzzle state.
 * @public
 */
export class KillerCombinations {
  /**
   * Gets all mathematically possible totals for a given cage size.
   *
   * Uses the existing totalsByCageSize constant to determine the valid range
   * of totals for the specified cage size and returns all integers in that range.
   *
   * @param cageSize - The number of cells in the cage (must be 1-9)
   * @returns Result containing array of possible totals in ascending order
   *
   * @example
   * ```typescript
   * // Get possible totals for a 3-cell cage
   * const result = KillerCombinations.getPossibleTotals(3);
   * if (result.isSuccess()) {
   *   console.log(result.value); // [6, 7, 8, 9, ..., 24]
   * }
   * ```
   */
  public static getPossibleTotals(cageSize: number, maxValue: number = 9): Result<number[]> {
    // Validate cage size
    if (!Number.isInteger(cageSize) || cageSize < 1 || cageSize > maxValue) {
      return fail(`Cage size must be an integer between 1 and ${maxValue}, got ${cageSize}`);
    }

    const bounds = getCageTotalBounds(cageSize, maxValue);

    // Generate all totals in the valid range
    const totals: number[] = [];
    for (let total = bounds.min; total <= bounds.max; total++) {
      totals.push(total);
    }

    return succeed(totals);
  }

  /**
   * Generates all possible number combinations that sum to the target total.
   *
   * Each combination contains unique numbers from 1-9 that sum exactly to the
   * specified total. Combinations respect both excluded and required number
   * constraints if provided.
   *
   * @param cageSize - The number of cells in the cage (must be 1-9)
   * @param total - The target sum (must be valid for the cage size)
   * @param constraints - Optional constraints on included/excluded numbers
   * @returns Result containing array of combinations, each sorted in ascending order
   *
   * @example
   * ```typescript
   * // Get all combinations for a 3-cell cage with total 15
   * const result = KillerCombinations.getCombinations(3, 15);
   * if (result.isSuccess()) {
   *   console.log(result.value); // [[1,5,9], [1,6,8], [2,4,9], ...]
   * }
   *
   * // With constraints - exclude 1 and 2, require 9
   * const constrained = KillerCombinations.getCombinations(3, 15, {
   *   excludedNumbers: [1, 2],
   *   requiredNumbers: [9]
   * });
   * ```
   */
  public static getCombinations(
    cageSize: number,
    total: number,
    constraints?: IKillerConstraints,
    maxValue: number = 9
  ): Result<number[][]> {
    // Validate cage size
    if (!Number.isInteger(cageSize) || cageSize < 1 || cageSize > maxValue) {
      return fail(`Cage size must be an integer between 1 and ${maxValue}, got ${cageSize}`);
    }

    // Validate total against cage size bounds
    const bounds = getCageTotalBounds(cageSize, maxValue);

    if (!Number.isInteger(total) || total < bounds.min || total > bounds.max) {
      return fail(
        `Total ${total} is invalid for cage size ${cageSize} - valid range: ${bounds.min}-${bounds.max}`
      );
    }

    // Validate constraints
    const constraintValidation = this._validateConstraints(constraints, maxValue);
    if (constraintValidation.isFailure()) {
      return fail(constraintValidation.message);
    }

    // Check cache first
    const cacheKey = CombinationCache.generateKey(cageSize, total, constraints);
    const cached = CombinationCache.get(cacheKey);
    if (cached) {
      return succeed(cached);
    }

    // Generate combinations
    const combinations = CombinationGenerator.generate(cageSize, total, constraints, maxValue);

    // Cache the result
    CombinationCache.set(cacheKey, combinations);

    return succeed(combinations);
  }

  /**
   * Determines possible values for each cell in a killer cage based on current puzzle state.
   *
   * Analyzes the current state of the puzzle and cage to determine which values
   * are possible for each empty cell, considering both killer cage constraints
   * and standard sudoku constraints (row, column, section uniqueness).
   *
   * @param puzzle - The puzzle instance
   * @param state - Current puzzle state
   * @param cage - The killer cage to analyze (must be of type 'killer')
   * @returns Result containing map of CellId to possible number arrays
   *
   * @example
   * ```typescript
   * const cage = puzzle.getCage(cageId).orThrow();
   * const possibilities = KillerCombinations.getCellPossibilities(puzzle, state, cage);
   * if (possibilities.isSuccess()) {
   *   for (const [cellId, values] of possibilities.value) {
   *     console.log(`Cell ${cellId} can have values: ${values.join(', ')}`);
   *   }
   * }
   * ```
   */
  public static getCellPossibilities(
    puzzle: Puzzle,
    state: PuzzleState,
    cage: ICage
  ): Result<Map<CellId, number[]>> {
    // Validate cage type
    if (cage.cageType !== 'killer') {
      return fail(`Expected killer cage, got ${cage.cageType}`);
    }

    // Get current values in the cage to build constraints
    // We need the concrete Cage class for containedValues method
    const concreteCage = cage as Cage;
    const currentValues = concreteCage.containedValues(state);
    const constraints: IKillerConstraints = {
      excludedNumbers: Array.from(currentValues)
    };

    // Get valid combinations for this cage
    const combinationsResult = this.getCombinations(cage.numCells, cage.total, constraints);
    /* c8 ignore next 3 - error propagation from getCombinations already tested, integration error hard to trigger */
    if (combinationsResult.isFailure()) {
      return fail(`Failed to get combinations for cage ${cage.id}: ${combinationsResult.message}`);
    }

    // Analyze possibilities for each cell
    return PossibilityAnalyzer.analyze(puzzle, state, cage, combinationsResult.value);
  }

  /**
   * Validate constraint parameters.
   * @param constraints - Constraints to validate
   * @param maxValue - Maximum value allowed in cells
   * @returns Result indicating success or failure with error message
   */
  private static _validateConstraints(constraints?: IKillerConstraints, maxValue: number = 9): Result<true> {
    if (!constraints) {
      return succeed(true);
    }

    // Validate excluded numbers
    if (constraints.excludedNumbers) {
      const excluded = constraints.excludedNumbers;

      if (!Array.isArray(excluded)) {
        return fail('excludedNumbers must be an array');
      }

      for (const num of excluded) {
        if (!Number.isInteger(num) || num < 1 || num > maxValue) {
          return fail(`excludedNumbers must contain integers between 1-${maxValue}, got ${num}`);
        }
      }

      // Check for duplicates
      const uniqueExcluded = new Set(excluded);
      if (uniqueExcluded.size !== excluded.length) {
        return fail('excludedNumbers must not contain duplicates');
      }
    }

    // Validate required numbers
    if (constraints.requiredNumbers) {
      const required = constraints.requiredNumbers;

      if (!Array.isArray(required)) {
        return fail('requiredNumbers must be an array');
      }

      for (const num of required) {
        if (!Number.isInteger(num) || num < 1 || num > maxValue) {
          return fail(`requiredNumbers must contain integers between 1-${maxValue}, got ${num}`);
        }
      }

      // Check for duplicates
      const uniqueRequired = new Set(required);
      if (uniqueRequired.size !== required.length) {
        return fail('requiredNumbers must not contain duplicates');
      }
    }

    // Check for overlap between excluded and required
    if (constraints.excludedNumbers && constraints.requiredNumbers) {
      const excludedSet = new Set(constraints.excludedNumbers);
      const requiredSet = new Set(constraints.requiredNumbers);

      for (const required of requiredSet) {
        if (excludedSet.has(required)) {
          return fail(`Number ${required} cannot be both required and excluded`);
        }
      }
    }

    return succeed(true);
  }
}
