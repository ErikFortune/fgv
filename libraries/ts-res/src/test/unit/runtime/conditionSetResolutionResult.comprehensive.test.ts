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

describe('ConditionSetResolutionResult Comprehensive Tests', () => {
  describe('Mixed match types in comparisons', () => {
    test('compares matchAsDefault results by priority', () => {
      const resultA = TsRes.Runtime.ConditionSetResolutionResult.create('matchAsDefault', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 50 as TsRes.QualifierMatchScore,
          matchType: 'matchAsDefault' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();
      const resultB = TsRes.Runtime.ConditionSetResolutionResult.create('matchAsDefault', [
        {
          priority: 200 as TsRes.ConditionPriority,
          score: 30 as TsRes.QualifierMatchScore,
          matchType: 'matchAsDefault' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();

      // B has higher priority, so A comes after B (positive result)
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultA, resultB)).toBe(100);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultB, resultA)).toBe(-100);
    });

    test('compares matchAsDefault results by score when priorities equal', () => {
      const resultA = TsRes.Runtime.ConditionSetResolutionResult.create('matchAsDefault', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 30 as TsRes.QualifierMatchScore,
          matchType: 'matchAsDefault' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();
      const resultB = TsRes.Runtime.ConditionSetResolutionResult.create('matchAsDefault', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 50 as TsRes.QualifierMatchScore,
          matchType: 'matchAsDefault' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();

      // B has higher score, so A comes after B (positive result)
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultA, resultB)).toBe(20);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultB, resultA)).toBe(-20);
    });

    test('compares mixed match types with multiple conditions', () => {
      const matchResult = TsRes.Runtime.ConditionSetResolutionResult.create('match', [
        {
          priority: 50 as TsRes.ConditionPriority,
          score: 30 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();
      const matchAsDefaultResult = TsRes.Runtime.ConditionSetResolutionResult.create('matchAsDefault', [
        {
          priority: 200 as TsRes.ConditionPriority,
          score: 80 as TsRes.QualifierMatchScore,
          matchType: 'matchAsDefault' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();

      // match always beats matchAsDefault regardless of priority/score
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(matchResult, matchAsDefaultResult)).toBe(-1);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(matchAsDefaultResult, matchResult)).toBe(1);
    });

    test('handles complex multi-condition comparison', () => {
      const resultA = TsRes.Runtime.ConditionSetResolutionResult.create('match', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 50 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        },
        {
          priority: 200 as TsRes.ConditionPriority,
          score: 30 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        },
        {
          priority: 150 as TsRes.ConditionPriority,
          score: 40 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();
      const resultB = TsRes.Runtime.ConditionSetResolutionResult.create('match', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 50 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        },
        {
          priority: 200 as TsRes.ConditionPriority,
          score: 30 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();

      // A has more conditions with equal first two, so A should win (A comes before B, negative result)
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultA, resultB)).toBe(-1);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultB, resultA)).toBe(1);
    });
  });

  describe('Edge cases and error conditions', () => {
    test('compares empty matches with different match types', () => {
      const match = TsRes.Runtime.ConditionSetResolutionResult.create('match', []).orThrow();
      const matchAsDefault = TsRes.Runtime.ConditionSetResolutionResult.create(
        'matchAsDefault',
        []
      ).orThrow();
      const noMatch = TsRes.Runtime.ConditionSetResolutionResult.create('noMatch', []).orThrow();

      // match > matchAsDefault > noMatch regardless of condition count
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(match, matchAsDefault)).toBe(-1);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(matchAsDefault, noMatch)).toBe(-1);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(match, noMatch)).toBe(-1);
    });

    test('handles maxPriority and totalScore for matchAsDefault', () => {
      const result = TsRes.Runtime.ConditionSetResolutionResult.create('matchAsDefault', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 30 as TsRes.QualifierMatchScore,
          matchType: 'matchAsDefault' as TsRes.Runtime.ConditionMatchType
        },
        {
          priority: 200 as TsRes.ConditionPriority,
          score: 40 as TsRes.QualifierMatchScore,
          matchType: 'matchAsDefault' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();

      expect(result.maxPriority).toBe(200);
      expect(result.totalScore).toBe(70); // 30 + 40
    });

    test('handles noMatch with non-empty matches array (defensive case)', () => {
      // This tests the edge case where noMatch has conditions (which shouldn't normally happen)
      const result = TsRes.Runtime.ConditionSetResolutionResult.create('noMatch', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 0 as TsRes.QualifierMatchScore,
          matchType: 'noMatch' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();

      expect(result.matchType).toBe('noMatch');
      expect(result.maxPriority).toBe(0); // Should return 0 for noMatch regardless of conditions
      expect(result.totalScore).toBe(0); // Should return 0 for noMatch regardless of conditions
    });
  });

  describe('Create method error handling', () => {
    test('succeeds with valid parameters', () => {
      expect(TsRes.Runtime.ConditionSetResolutionResult.create('match', [])).toSucceed();
      expect(TsRes.Runtime.ConditionSetResolutionResult.create('matchAsDefault', [])).toSucceed();
      expect(TsRes.Runtime.ConditionSetResolutionResult.create('noMatch', [])).toSucceed();
    });

    test('preserves condition match results exactly', () => {
      const matches = [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 30 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        },
        {
          priority: 200 as TsRes.ConditionPriority,
          score: 40 as TsRes.QualifierMatchScore,
          matchType: 'matchAsDefault' as TsRes.Runtime.ConditionMatchType
        }
      ];

      expect(TsRes.Runtime.ConditionSetResolutionResult.create('match', matches)).toSucceedAndSatisfy(
        (result) => {
          expect(result.matches).toHaveLength(2);
          expect(result.matches[0]).toEqual(matches[0]);
          expect(result.matches[1]).toEqual(matches[1]);
          expect(result.matches).not.toBe(matches); // Should be a copy, not the same reference
        }
      );
    });
  });

  describe('Comprehensive comparison matrix', () => {
    test('verifies complete ordering hierarchy', () => {
      // Create one result of each type with different priorities to test hierarchy
      const match = TsRes.Runtime.ConditionSetResolutionResult.create('match', [
        {
          priority: 50 as TsRes.ConditionPriority,
          score: 20 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();

      const matchAsDefault = TsRes.Runtime.ConditionSetResolutionResult.create('matchAsDefault', [
        {
          priority: 200 as TsRes.ConditionPriority,
          score: 80 as TsRes.QualifierMatchScore,
          matchType: 'matchAsDefault' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();

      const noMatch = TsRes.Runtime.ConditionSetResolutionResult.create('noMatch', []).orThrow();

      // Test all combinations
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(match, matchAsDefault)).toBe(-1);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(match, noMatch)).toBe(-1);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(matchAsDefault, noMatch)).toBe(-1);

      // Reverse comparisons
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(matchAsDefault, match)).toBe(1);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(noMatch, match)).toBe(1);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(noMatch, matchAsDefault)).toBe(1);

      // Self comparisons
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(match, match)).toBe(0);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(matchAsDefault, matchAsDefault)).toBe(0);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(noMatch, noMatch)).toBe(0);
    });
  });
});
