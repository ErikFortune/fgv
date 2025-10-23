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

/* eslint-disable @rushstack/packlets/mechanics */
import '@fgv/ts-utils-jest';
import { CombinationCache } from '../../../../packlets/puzzles/internal/combinationCache';
import { IKillerConstraints } from '../../../../packlets/puzzles/killerCombinationsTypes';

describe('CombinationCache', () => {
  beforeEach(() => {
    // Clear cache before each test to ensure isolation
    CombinationCache.clear();
  });

  describe('generateKey', () => {
    test('should generate key for basic parameters', () => {
      const key = CombinationCache.generateKey(3, 15);
      expect(key).toBe('3:15::');
    });

    test('should generate key with excluded numbers', () => {
      const constraints: IKillerConstraints = { excludedNumbers: [3, 1, 5] };
      const key = CombinationCache.generateKey(3, 15, constraints);
      expect(key).toBe('3:15:1,3,5:'); // Should be sorted
    });

    test('should generate key with required numbers', () => {
      const constraints: IKillerConstraints = { requiredNumbers: [2, 7, 4] };
      const key = CombinationCache.generateKey(3, 15, constraints);
      expect(key).toBe('3:15::2,4,7'); // Should be sorted
    });

    test('should generate key with both excluded and required numbers', () => {
      const constraints: IKillerConstraints = {
        excludedNumbers: [1, 9],
        requiredNumbers: [3, 6]
      };
      const key = CombinationCache.generateKey(3, 15, constraints);
      expect(key).toBe('3:15:1,9:3,6');
    });
  });

  describe('get and set', () => {
    test('should return undefined for non-existent key', () => {
      const result = CombinationCache.get('nonexistent');
      expect(result).toBeUndefined();
    });

    test('should store and retrieve combinations', () => {
      const key = '2:10::';
      const combinations = [
        [1, 9],
        [2, 8],
        [3, 7],
        [4, 6]
      ];

      CombinationCache.set(key, combinations);
      const retrieved = CombinationCache.get(key);

      expect(retrieved).toEqual(combinations);
    });

    test('should return deep clone to prevent mutation', () => {
      const key = '2:10::';
      const combinations = [
        [1, 9],
        [2, 8]
      ];

      CombinationCache.set(key, combinations);
      const retrieved1 = CombinationCache.get(key);
      const retrieved2 = CombinationCache.get(key);

      expect(retrieved1).not.toBe(retrieved2); // Different references
      expect(retrieved1![0]).not.toBe(retrieved2![0]); // Deep clone

      // Mutating retrieved should not affect cache
      retrieved1![0][0] = 999;
      const retrieved3 = CombinationCache.get(key);
      expect(retrieved3![0][0]).toBe(1); // Original value unchanged
    });

    test('should store deep clone to prevent mutation', () => {
      const key = '2:10::';
      const combinations = [
        [1, 9],
        [2, 8]
      ];

      CombinationCache.set(key, combinations);

      // Mutating original should not affect cache
      combinations[0][0] = 999;

      const retrieved = CombinationCache.get(key);
      expect(retrieved![0][0]).toBe(1); // Original value in cache
    });
  });

  describe('clear', () => {
    test('should clear all cached entries', () => {
      // Add multiple entries
      CombinationCache.set('key1', [[1, 2]]);
      CombinationCache.set('key2', [[3, 4]]);
      CombinationCache.set('key3', [[5, 6]]);

      expect(CombinationCache.size()).toBe(3);

      // Clear cache
      CombinationCache.clear();

      expect(CombinationCache.size()).toBe(0);
      expect(CombinationCache.get('key1')).toBeUndefined();
      expect(CombinationCache.get('key2')).toBeUndefined();
      expect(CombinationCache.get('key3')).toBeUndefined();
    });
  });

  describe('size', () => {
    test('should return 0 for empty cache', () => {
      expect(CombinationCache.size()).toBe(0);
    });

    test('should return correct count of cached entries', () => {
      CombinationCache.set('key1', [[1, 2]]);
      expect(CombinationCache.size()).toBe(1);

      CombinationCache.set('key2', [[3, 4]]);
      expect(CombinationCache.size()).toBe(2);

      CombinationCache.set('key3', [[5, 6]]);
      expect(CombinationCache.size()).toBe(3);
    });

    test('should update size after clear', () => {
      CombinationCache.set('key1', [[1, 2]]);
      CombinationCache.set('key2', [[3, 4]]);
      expect(CombinationCache.size()).toBe(2);

      CombinationCache.clear();
      expect(CombinationCache.size()).toBe(0);
    });
  });

  describe('LRU cache behavior', () => {
    test('should clear cache when reaching max size', () => {
      // Fill cache to max size (1000 entries)
      for (let i = 0; i < 1000; i++) {
        CombinationCache.set(`key${i}`, [[i, i + 1]]);
      }

      expect(CombinationCache.size()).toBe(1000);

      // Adding one more should trigger clear
      CombinationCache.set('key1000', [[1000, 1001]]);

      // Cache should have been cleared and only contain the new entry
      expect(CombinationCache.size()).toBe(1);
      expect(CombinationCache.get('key1000')).toEqual([[1000, 1001]]);
      expect(CombinationCache.get('key0')).toBeUndefined();
      expect(CombinationCache.get('key999')).toBeUndefined();
    });
  });
});
