/*
 * Copyright (c) 2025 Erik Fortune
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

import { QualifierMatchScore, ConditionPriority } from '../common';

/**
 * Represents a single condition match result with priority and score.
 * @public
 */
export interface IConditionMatchResult {
  readonly priority: ConditionPriority;
  readonly score: QualifierMatchScore;
}

/**
 * Represents the result of resolving a condition set.
 * Contains either a failure indicator or a list of condition priority/score tuples sorted by priority then score.
 * @public
 */
export class ConditionSetResolutionResult {
  public readonly success: boolean;
  public readonly matches: ReadonlyArray<IConditionMatchResult>;

  /**
   * Constructor for a {@link Runtime.ConditionSetResolutionResult | ConditionSetResolutionResult}.
   * @param success - Whether the condition set resolution was successful.
   * @param matches - Array of condition match results, if successful.
   */
  private constructor(success: boolean, matches: ReadonlyArray<IConditionMatchResult>) {
    this.success = success;
    this.matches = matches;
  }

  /**
   * Creates a new failed condition set resolution result.
   * @returns A new failed {@link Runtime.ConditionSetResolutionResult | ConditionSetResolutionResult}.
   * @public
   */
  public static createFailure(): ConditionSetResolutionResult {
    return new ConditionSetResolutionResult(false, []);
  }

  /**
   * Creates a new successful condition set resolution result.
   * @param matches - Array of condition match results.
   * @returns A new successful {@link Runtime.ConditionSetResolutionResult | ConditionSetResolutionResult}.
   * @public
   */
  public static createSuccess(matches: ReadonlyArray<IConditionMatchResult>): ConditionSetResolutionResult {
    // Sort by priority (descending), then by score (descending)
    const sortedMatches = [...matches].sort((a, b) => {
      const priorityDiff = b.priority - a.priority;
      return priorityDiff !== 0 ? priorityDiff : b.score - a.score;
    });

    return new ConditionSetResolutionResult(true, sortedMatches);
  }

  /**
   * Compares two condition set resolution results for sorting purposes.
   * The priority of a condition set result cannot be boiled down to a single number -
   * we have to examine each condition result in turn.
   *
   * Comparison logic:
   * - If priority differs, return the higher priority
   * - If priority matches but score is different, return the higher score
   * - If priority and score both match, proceed to the next condition
   * - Failed results are considered lower priority than successful results
   *
   * @param a - The first condition set resolution result to compare.
   * @param b - The second condition set resolution result to compare.
   * @returns A negative number if a should come before b, a positive number if a should
   * come after b, or zero if they are equivalent.
   * @public
   */
  public static compare(a: ConditionSetResolutionResult, b: ConditionSetResolutionResult): number {
    // Failed results are always lower priority than successful results
    if (!a.success && !b.success) return 0;
    if (!a.success) return 1; // a comes after b
    if (!b.success) return -1; // a comes before b

    // Both are successful - compare condition by condition
    const minLength = Math.min(a.matches.length, b.matches.length);

    for (let i = 0; i < minLength; i++) {
      const matchA = a.matches[i];
      const matchB = b.matches[i];

      // Compare priority first
      const priorityDiff = matchB.priority - matchA.priority;
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // If priority matches, compare score
      const scoreDiff = matchB.score - matchA.score;
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      // If both priority and score match, continue to next condition
    }

    // If all compared conditions are equal, the one with more conditions wins
    return b.matches.length - a.matches.length;
  }

  /**
   * Gets the highest priority among all condition matches.
   * @returns The highest priority, or 0 if no matches.
   * @public
   */
  public get maxPriority(): ConditionPriority {
    if (!this.success || this.matches.length === 0) {
      return 0 as ConditionPriority;
    }
    return Math.max(...this.matches.map((m) => m.priority)) as ConditionPriority;
  }

  /**
   * Gets the total score by summing all condition match scores.
   * @returns The total score, or 0 if no matches.
   * @public
   */
  public get totalScore(): QualifierMatchScore {
    if (!this.success || this.matches.length === 0) {
      return 0 as QualifierMatchScore;
    }
    return this.matches.reduce((sum, match) => sum + match.score, 0) as QualifierMatchScore;
  }
}
