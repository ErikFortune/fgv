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
  describe('create static method with noMatch', () => {
    test('creates a no-match resolution result', () => {
      expect(TsRes.Runtime.ConditionSetResolutionResult.create('noMatch', [])).toSucceedAndSatisfy(
        (result) => {
          expect(result.matchType).toBe('noMatch');
          expect(result.matches).toHaveLength(0);
          expect(result.maxPriority).toBe(0);
          expect(result.totalScore).toBe(0);
        }
      );
    });
  });

  describe('create static method with match', () => {
    test('creates a match resolution result with empty matches', () => {
      expect(TsRes.Runtime.ConditionSetResolutionResult.create('match', [])).toSucceedAndSatisfy((result) => {
        expect(result.matchType).toBe('match');
        expect(result.matches).toHaveLength(0);
        expect(result.maxPriority).toBe(0);
        expect(result.totalScore).toBe(0);
      });
    });

    test('creates a match resolution result with single match', () => {
      const matches = [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 50 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ];
      expect(TsRes.Runtime.ConditionSetResolutionResult.create('match', matches)).toSucceedAndSatisfy(
        (result) => {
          expect(result.matchType).toBe('match');
          expect(result.matches).toHaveLength(1);
          expect(result.matches[0]).toEqual({ priority: 100, score: 50, matchType: 'match' });
          expect(result.maxPriority).toBe(100);
          expect(result.totalScore).toBe(50);
        }
      );
    });

    test('creates a match resolution result with multiple matches', () => {
      const matches = [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 30 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        },
        {
          priority: 200 as TsRes.ConditionPriority,
          score: 40 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        },
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 50 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ];
      expect(TsRes.Runtime.ConditionSetResolutionResult.create('match', matches)).toSucceedAndSatisfy(
        (result) => {
          expect(result.matchType).toBe('match');
          expect(result.matches).toHaveLength(3);

          // Order should match input since ConditionSetResolutionResult doesn't sort
          expect(result.matches[0]).toEqual({ priority: 100, score: 30, matchType: 'match' });
          expect(result.matches[1]).toEqual({ priority: 200, score: 40, matchType: 'match' });
          expect(result.matches[2]).toEqual({ priority: 100, score: 50, matchType: 'match' });

          expect(result.maxPriority).toBe(200);
          expect(result.totalScore).toBe(120); // 40 + 50 + 30
        }
      );
    });
  });

  describe('create static method with matchAsDefault', () => {
    test('creates a matchAsDefault resolution result', () => {
      const matches = [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 30 as TsRes.QualifierMatchScore,
          matchType: 'matchAsDefault' as TsRes.Runtime.ConditionMatchType
        }
      ];
      expect(
        TsRes.Runtime.ConditionSetResolutionResult.create('matchAsDefault', matches)
      ).toSucceedAndSatisfy((result) => {
        expect(result.matchType).toBe('matchAsDefault');
        expect(result.matches).toHaveLength(1);
        expect(result.matches[0]).toEqual({ priority: 100, score: 30, matchType: 'matchAsDefault' });
        expect(result.maxPriority).toBe(100);
        expect(result.totalScore).toBe(30);
      });
    });
  });

  describe('compare static method', () => {
    test('noMatch results are considered equal', () => {
      const noMatchA = TsRes.Runtime.ConditionSetResolutionResult.create('noMatch', []).orThrow();
      const noMatchB = TsRes.Runtime.ConditionSetResolutionResult.create('noMatch', []).orThrow();

      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(noMatchA, noMatchB)).toBe(0);
    });

    test('match beats matchAsDefault', () => {
      const match = TsRes.Runtime.ConditionSetResolutionResult.create('match', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 50 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();
      const matchAsDefault = TsRes.Runtime.ConditionSetResolutionResult.create('matchAsDefault', [
        {
          priority: 200 as TsRes.ConditionPriority,
          score: 60 as TsRes.QualifierMatchScore,
          matchType: 'matchAsDefault' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();

      // match should beat matchAsDefault regardless of priority/score
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(match, matchAsDefault)).toBe(-1);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(matchAsDefault, match)).toBe(1);
    });

    test('matchAsDefault beats noMatch', () => {
      const matchAsDefault = TsRes.Runtime.ConditionSetResolutionResult.create('matchAsDefault', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 50 as TsRes.QualifierMatchScore,
          matchType: 'matchAsDefault' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();
      const noMatch = TsRes.Runtime.ConditionSetResolutionResult.create('noMatch', []).orThrow();

      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(matchAsDefault, noMatch)).toBe(-1);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(noMatch, matchAsDefault)).toBe(1);
    });

    test('match beats noMatch', () => {
      const match = TsRes.Runtime.ConditionSetResolutionResult.create('match', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 50 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();
      const noMatch = TsRes.Runtime.ConditionSetResolutionResult.create('noMatch', []).orThrow();

      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(match, noMatch)).toBe(-1);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(noMatch, match)).toBe(1);
    });

    test('compares results of same type by first condition priority', () => {
      const resultA = TsRes.Runtime.ConditionSetResolutionResult.create('match', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 50 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();
      const resultB = TsRes.Runtime.ConditionSetResolutionResult.create('match', [
        {
          priority: 200 as TsRes.ConditionPriority,
          score: 30 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();

      // B has higher priority, so A comes after B (positive result)
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultA, resultB)).toBe(100);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultB, resultA)).toBe(-100);
    });

    test('compares results of same type by first condition score when priorities are equal', () => {
      const resultA = TsRes.Runtime.ConditionSetResolutionResult.create('match', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 30 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();
      const resultB = TsRes.Runtime.ConditionSetResolutionResult.create('match', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 50 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();

      // B has higher score, so A comes after B (positive result)
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultA, resultB)).toBe(20);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultB, resultA)).toBe(-20);
    });

    test('proceeds to next condition when first conditions are equal', () => {
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
        }
      ]).orThrow();
      const resultB = TsRes.Runtime.ConditionSetResolutionResult.create('match', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 50 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        },
        {
          priority: 150 as TsRes.ConditionPriority,
          score: 40 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();

      // First conditions are equal, second condition in A has higher priority
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultA, resultB)).toBe(-50);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultB, resultA)).toBe(50);
    });

    test('prefers result with more conditions when all compared conditions are equal', () => {
      const resultA = TsRes.Runtime.ConditionSetResolutionResult.create('match', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 50 as TsRes.QualifierMatchScore,
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
          priority: 50 as TsRes.ConditionPriority,
          score: 30 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();

      // B has more conditions, so A comes after B (positive result)
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultA, resultB)).toBe(1);
      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultB, resultA)).toBe(-1);
    });

    test('returns zero when results are completely equal', () => {
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

      expect(TsRes.Runtime.ConditionSetResolutionResult.compare(resultA, resultB)).toBe(0);
    });
  });

  describe('maxPriority property', () => {
    test('returns 0 for noMatch result', () => {
      const result = TsRes.Runtime.ConditionSetResolutionResult.create('noMatch', []).orThrow();
      expect(result.maxPriority).toBe(0);
    });

    test('returns 0 for result with no matches', () => {
      const result = TsRes.Runtime.ConditionSetResolutionResult.create('match', []).orThrow();
      expect(result.maxPriority).toBe(0);
    });

    test('returns the highest priority among matches', () => {
      const result = TsRes.Runtime.ConditionSetResolutionResult.create('match', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 30 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        },
        {
          priority: 200 as TsRes.ConditionPriority,
          score: 40 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        },
        {
          priority: 150 as TsRes.ConditionPriority,
          score: 50 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();
      expect(result.maxPriority).toBe(200);
    });
  });

  describe('totalScore property', () => {
    test('returns 0 for noMatch result', () => {
      const result = TsRes.Runtime.ConditionSetResolutionResult.create('noMatch', []).orThrow();
      expect(result.totalScore).toBe(0);
    });

    test('returns 0 for result with no matches', () => {
      const result = TsRes.Runtime.ConditionSetResolutionResult.create('match', []).orThrow();
      expect(result.totalScore).toBe(0);
    });

    test('returns the sum of all match scores', () => {
      const result = TsRes.Runtime.ConditionSetResolutionResult.create('match', [
        {
          priority: 100 as TsRes.ConditionPriority,
          score: 30 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        },
        {
          priority: 200 as TsRes.ConditionPriority,
          score: 40 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        },
        {
          priority: 150 as TsRes.ConditionPriority,
          score: 50 as TsRes.QualifierMatchScore,
          matchType: 'match' as TsRes.Runtime.ConditionMatchType
        }
      ]).orThrow();
      expect(result.totalScore).toBe(120); // 30 + 40 + 50
    });
  });
});
