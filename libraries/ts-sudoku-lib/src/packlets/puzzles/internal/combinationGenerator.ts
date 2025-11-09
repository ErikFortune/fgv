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

import { IKillerConstraints } from '../killerCombinationsTypes';

/**
 * @internal
 */
export class CombinationGenerator {
  /**
   * Generates all possible combinations of unique numbers that sum to the target total.
   * @param cageSize - Number of cells in the cage
   * @param total - Target sum
   * @param constraints - Optional constraints on included/excluded numbers
   * @param maxValue - Maximum value allowed in cells (defaults to 9)
   * @returns Array of combinations, each sorted in ascending order
   */
  public static generate(
    cageSize: number,
    total: number,
    constraints?: IKillerConstraints,
    maxValue: number = 9
  ): number[][] {
    const results: number[][] = [];
    const excludedSet = new Set(constraints?.excludedNumbers ?? []);
    const requiredNumbers = constraints?.requiredNumbers ?? [];
    const requiredSet = new Set(requiredNumbers);

    // Validate that we can satisfy required numbers constraint
    if (requiredNumbers.length > cageSize) {
      return [];
    }

    // Check if required numbers sum is already too high
    const requiredSum = requiredNumbers.reduce((sum, num) => sum + num, 0);
    if (requiredSum > total) {
      return [];
    }

    // Calculate remaining constraints after accounting for required numbers
    const remainingSize = cageSize - requiredNumbers.length;
    const remainingTotal = total - requiredSum;

    if (remainingSize === 0) {
      // Only required numbers should be present
      /* c8 ignore next 3 - edge case: required numbers fill cage but sum doesn't match (tested via KillerCombinations) */
      if (remainingTotal === 0) {
        return [Array.from(requiredNumbers).sort()];
      }
      return [];
    }

    // Generate combinations for the remaining slots
    const availableNumbers: number[] = [];
    for (let i = 1; i <= maxValue; i++) {
      if (!excludedSet.has(i) && !requiredSet.has(i)) {
        availableNumbers.push(i);
      }
    }

    this._generateCombinations(availableNumbers, remainingSize, remainingTotal, 0, [], results);

    // Add required numbers to each result and sort
    return results.map((combination) => [...combination, ...requiredNumbers].sort((a, b) => a - b));
  }

  /**
   * Recursive helper to generate combinations.
   * @param availableNumbers - Numbers that can be used
   * @param targetSize - Number of numbers needed
   * @param targetSum - Target sum for the combination
   * @param startIndex - Starting index in available numbers
   * @param currentCombination - Current partial combination
   * @param results - Array to collect results
   */
  private static _generateCombinations(
    availableNumbers: number[],
    targetSize: number,
    targetSum: number,
    startIndex: number,
    currentCombination: number[],
    results: number[][]
  ): void {
    // Base case: we have the right number of elements
    if (currentCombination.length === targetSize) {
      const sum = currentCombination.reduce((total, num) => total + num, 0);
      if (sum === targetSum) {
        results.push([...currentCombination]);
      }
      return;
    }

    // Early termination: impossible to reach target
    const remainingSlots = targetSize - currentCombination.length;
    const currentSum = currentCombination.reduce((total, num) => total + num, 0);
    const remainingSum = targetSum - currentSum;

    // Check minimum possible sum with remaining slots
    const minPossible = this._calculateMinSum(availableNumbers, startIndex, remainingSlots);
    if (remainingSum < minPossible) {
      return;
    }

    // Check maximum possible sum with remaining slots
    const maxPossible = this._calculateMaxSum(availableNumbers, startIndex, remainingSlots);
    if (remainingSum > maxPossible) {
      return;
    }

    // Try each available number
    for (let i = startIndex; i < availableNumbers.length; i++) {
      const number = availableNumbers[i];

      // Skip if adding this number would exceed our target
      if (currentSum + number > targetSum) {
        continue;
      }

      currentCombination.push(number);
      this._generateCombinations(availableNumbers, targetSize, targetSum, i + 1, currentCombination, results);
      currentCombination.pop();
    }
  }

  /**
   * Calculate minimum possible sum for remaining slots.
   */
  private static _calculateMinSum(
    availableNumbers: number[],
    startIndex: number,
    remainingSlots: number
  ): number {
    let sum = 0;
    let count = 0;

    for (let i = startIndex; i < availableNumbers.length && count < remainingSlots; i++) {
      sum += availableNumbers[i];
      count++;
    }

    return sum;
  }

  /**
   * Calculate maximum possible sum for remaining slots.
   */
  private static _calculateMaxSum(
    availableNumbers: number[],
    startIndex: number,
    remainingSlots: number
  ): number {
    let sum = 0;
    let count = 0;

    for (let i = availableNumbers.length - 1; i >= startIndex && count < remainingSlots; i--) {
      sum += availableNumbers[i];
      count++;
    }

    return sum;
  }
}
