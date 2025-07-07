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

import '@fgv/ts-utils-jest';
import * as TsRes from '../../../index';

describe('ConditionSetResolutionResult class', () => {
  describe('createFailure static method', () => {
    test('creates a failed resolution result', () => {
      const result = TsRes.Runtime.ConditionSetResolutionResult.createFailure();

      expect(result.success).toBe(false);
      expect(result.matches).toHaveLength(0);
      expect(result.maxPriority).toBe(0);
      expect(result.totalScore).toBe(0);
    });
  });

  describe('createSuccess static method', () => {
    test('creates a successful resolution result with empty matches', () => {
      const result = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([]);

      expect(result.success).toBe(true);
      expect(result.matches).toHaveLength(0);
      expect(result.maxPriority).toBe(0);
      expect(result.totalScore).toBe(0);
    });

    test('creates a successful resolution result with single match', () => {
      const matches = [{ priority: 100 as TsRes.ConditionPriority, score: 50 as TsRes.QualifierMatchScore }];
      const result = TsRes.Runtime.ConditionSetResolutionResult.createSuccess(matches);

      expect(result.success).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]).toEqual({ priority: 100, score: 50 });
      expect(result.maxPriority).toBe(100);
      expect(result.totalScore).toBe(50);
    });

    test('creates a successful resolution result with multiple matches sorted by priority then score', () => {
      const matches = [
        { priority: 100 as TsRes.ConditionPriority, score: 30 as TsRes.QualifierMatchScore },
        { priority: 200 as TsRes.ConditionPriority, score: 40 as TsRes.QualifierMatchScore },
        { priority: 100 as TsRes.ConditionPriority, score: 50 as TsRes.QualifierMatchScore }
      ];
      const result = TsRes.Runtime.ConditionSetResolutionResult.createSuccess(matches);

      expect(result.success).toBe(true);
      expect(result.matches).toHaveLength(3);

      // Should be sorted by priority (descending), then score (descending)
      expect(result.matches[0]).toEqual({ priority: 200, score: 40 }); // Highest priority
      expect(result.matches[1]).toEqual({ priority: 100, score: 50 }); // Same priority, higher score
      expect(result.matches[2]).toEqual({ priority: 100, score: 30 }); // Same priority, lower score

      expect(result.maxPriority).toBe(200);
      expect(result.totalScore).toBe(120); // 40 + 50 + 30
    });
  });

  describe('compare static method', () => {
    test('failed results are considered equal', () => {
      const failureA = TsRes.Runtime.ConditionSetResolutionResult.createFailure();
      const failureB = TsRes.Runtime.ConditionSetResolutionResult.createFailure();

      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(failureA, failureB)).toBe(0);
    });

    test('failed result comes after successful result', () => {
      const failure = TsRes.Runtime.ConditionSetResolutionResult.createFailure();
      const success = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([
        { priority: 100 as TsRes.ConditionPriority, score: 50 as TsRes.QualifierMatchScore }
      ]);

      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(failure, success)).toBe(1);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(success, failure)).toBe(-1);
    });

    test('compares successful results by first condition priority', () => {
      const resultA = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([
        { priority: 100 as TsRes.ConditionPriority, score: 50 as TsRes.QualifierMatchScore }
      ]);
      const resultB = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([
        { priority: 200 as TsRes.ConditionPriority, score: 30 as TsRes.QualifierMatchScore }
      ]);

      // B has higher priority, so A comes after B (positive result)
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultA, resultB)).toBe(100);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultB, resultA)).toBe(-100);
    });

    test('compares successful results by first condition score when priorities are equal', () => {
      const resultA = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([
        { priority: 100 as TsRes.ConditionPriority, score: 30 as TsRes.QualifierMatchScore }
      ]);
      const resultB = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([
        { priority: 100 as TsRes.ConditionPriority, score: 50 as TsRes.QualifierMatchScore }
      ]);

      // B has higher score, so A comes after B (positive result)
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultA, resultB)).toBe(20);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultB, resultA)).toBe(-20);
    });

    test('proceeds to next condition when first conditions are equal', () => {
      const resultA = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([
        { priority: 100 as TsRes.ConditionPriority, score: 50 as TsRes.QualifierMatchScore },
        { priority: 200 as TsRes.ConditionPriority, score: 30 as TsRes.QualifierMatchScore }
      ]);
      const resultB = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([
        { priority: 100 as TsRes.ConditionPriority, score: 50 as TsRes.QualifierMatchScore },
        { priority: 150 as TsRes.ConditionPriority, score: 40 as TsRes.QualifierMatchScore }
      ]);

      // First conditions are equal, second condition in A has higher priority
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultA, resultB)).toBe(-50);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultB, resultA)).toBe(50);
    });

    test('prefers result with more conditions when all compared conditions are equal', () => {
      const resultA = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([
        { priority: 100 as TsRes.ConditionPriority, score: 50 as TsRes.QualifierMatchScore }
      ]);
      const resultB = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([
        { priority: 100 as TsRes.ConditionPriority, score: 50 as TsRes.QualifierMatchScore },
        { priority: 50 as TsRes.ConditionPriority, score: 30 as TsRes.QualifierMatchScore }
      ]);

      // B has more conditions, so A comes after B (positive result)
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultA, resultB)).toBe(1);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultB, resultA)).toBe(-1);
    });

    test('returns zero when results are completely equal', () => {
      const resultA = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([
        { priority: 100 as TsRes.ConditionPriority, score: 50 as TsRes.QualifierMatchScore },
        { priority: 200 as TsRes.ConditionPriority, score: 30 as TsRes.QualifierMatchScore }
      ]);
      const resultB = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([
        { priority: 100 as TsRes.ConditionPriority, score: 50 as TsRes.QualifierMatchScore },
        { priority: 200 as TsRes.ConditionPriority, score: 30 as TsRes.QualifierMatchScore }
      ]);

      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultA, resultB)).toBe(0);
    });
  });

  describe('maxPriority property', () => {
    test('returns 0 for failed result', () => {
      const result = TsRes.Runtime.ConditionSetResolutionResult.createFailure();
      expect(result.maxPriority).toBe(0);
    });

    test('returns 0 for successful result with no matches', () => {
      const result = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([]);
      expect(result.maxPriority).toBe(0);
    });

    test('returns the highest priority among matches', () => {
      const result = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([
        { priority: 100 as TsRes.ConditionPriority, score: 30 as TsRes.QualifierMatchScore },
        { priority: 200 as TsRes.ConditionPriority, score: 40 as TsRes.QualifierMatchScore },
        { priority: 150 as TsRes.ConditionPriority, score: 50 as TsRes.QualifierMatchScore }
      ]);
      expect(result.maxPriority).toBe(200);
    });
  });

  describe('totalScore property', () => {
    test('returns 0 for failed result', () => {
      const result = TsRes.Runtime.ConditionSetResolutionResult.createFailure();
      expect(result.totalScore).toBe(0);
    });

    test('returns 0 for successful result with no matches', () => {
      const result = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([]);
      expect(result.totalScore).toBe(0);
    });

    test('returns the sum of all match scores', () => {
      const result = TsRes.Runtime.ConditionSetResolutionResult.createSuccess([
        { priority: 100 as TsRes.ConditionPriority, score: 30 as TsRes.QualifierMatchScore },
        { priority: 200 as TsRes.ConditionPriority, score: 40 as TsRes.QualifierMatchScore },
        { priority: 150 as TsRes.ConditionPriority, score: 50 as TsRes.QualifierMatchScore }
      ]);
      expect(result.totalScore).toBe(120); // 30 + 40 + 50
    });
  });
});
