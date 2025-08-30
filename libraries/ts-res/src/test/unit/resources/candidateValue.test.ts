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
import { Hash } from '@fgv/ts-utils';
import { CandidateValue, ICandidateValue } from '../../../packlets/resources';
import { CandidateValueIndex } from '../../../packlets/common';

describe('CandidateValue', () => {
  describe('create', () => {
    test('should create candidate value with JSON', () => {
      const json = { test: 'value', number: 42 };

      expect(CandidateValue.create({ json })).toSucceedAndSatisfy((candidateValue) => {
        expect(candidateValue.json).toEqual({ test: 'value', number: 42 });
        expect(candidateValue.key).toBeDefined();
        expect(typeof candidateValue.key).toBe('string');
        expect(candidateValue.index).toBeUndefined(); // No index set initially
      });
    });

    test('should create candidate value with normalizer', () => {
      const json = { test: 'value' };
      const normalizer = new Hash.Crc32Normalizer();

      expect(CandidateValue.create({ json, normalizer })).toSucceedAndSatisfy((candidateValue) => {
        expect(candidateValue.json).toEqual({ test: 'value' });
        expect(candidateValue.key).toBeDefined();
      });
    });

    test('should create candidate value with initial index', () => {
      const json = { test: 'value' };
      const index = 5;

      expect(CandidateValue.create({ json, index })).toSucceedAndSatisfy((candidateValue) => {
        expect(candidateValue.json).toEqual({ test: 'value' });
        expect(candidateValue.index).toBe(5);
      });
    });

    test('should normalize JSON and generate consistent keys', () => {
      const json1 = { b: 2, a: 1 }; // Different property order
      const json2 = { a: 1, b: 2 }; // Different property order

      const candidateValue1Result = CandidateValue.create({ json: json1 });
      const candidateValue2Result = CandidateValue.create({ json: json2 });

      expect(candidateValue1Result).toSucceedAndSatisfy((cv1) => {
        expect(candidateValue2Result).toSucceedAndSatisfy((cv2) => {
          // Should have the same key due to normalization
          expect(cv1.key).toBe(cv2.key);
          // Both should be normalized to the same JSON structure
          expect(cv1.json).toEqual(cv2.json);
        });
      });
    });

    test('should handle different JSON types', () => {
      const testCases = [null, true, 42, 'string', [1, 2, 3], { nested: { value: 'test' } }];

      for (const json of testCases) {
        expect(CandidateValue.create({ json })).toSucceedAndSatisfy((candidateValue) => {
          expect(candidateValue.json).toEqual(json);
          expect(candidateValue.key).toBeDefined();
          expect(candidateValue.key.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('setIndex', () => {
    test('should set index on candidate value', () => {
      const json = { test: 'value' };

      expect(CandidateValue.create({ json })).toSucceedAndSatisfy((candidateValue) => {
        expect(candidateValue.setIndex(10)).toSucceedWith(10 as unknown as CandidateValueIndex);
        expect(candidateValue.index).toBe(10);
      });
    });

    test('should not allow changing index once set (immutable)', () => {
      const json = { test: 'value' };

      expect(CandidateValue.create({ json })).toSucceedAndSatisfy((candidateValue) => {
        expect(candidateValue.setIndex(5)).toSucceedWith(5 as unknown as CandidateValueIndex);
        expect(candidateValue.index).toBe(5);

        // Should fail to change once set
        expect(candidateValue.setIndex(15)).toFailWith(/index 5 is immutable and cannot be changed to 15/);
        expect(candidateValue.index).toBe(5); // Should remain unchanged
      });
    });

    test('should validate index values', () => {
      const json1 = { test: 'value1' };
      const json2 = { test: 'value2' };

      // Test with first candidate value (can set valid index)
      expect(CandidateValue.create({ json: json1 })).toSucceedAndSatisfy((candidateValue1) => {
        expect(candidateValue1.setIndex(0)).toSucceed();
        expect(candidateValue1.index).toBe(0);

        // Invalid indices should fail
        expect(CandidateValue.create({ json: json2 })).toSucceedAndSatisfy((candidateValue2) => {
          expect(candidateValue2.setIndex(-1)).toFail();
          expect(candidateValue2.setIndex(-100)).toFail();
        });
      });
    });
  });

  describe('key generation', () => {
    test('should generate different keys for different JSON values', () => {
      const json1 = { test: 'value1' };
      const json2 = { test: 'value2' };

      const candidateValue1Result = CandidateValue.create({ json: json1 });
      const candidateValue2Result = CandidateValue.create({ json: json2 });

      expect(candidateValue1Result).toSucceedAndSatisfy((cv1) => {
        expect(candidateValue2Result).toSucceedAndSatisfy((cv2) => {
          expect(cv1.key).not.toBe(cv2.key);
        });
      });
    });

    test('should generate same key for identical JSON values', () => {
      const json = { test: 'value', number: 42 };

      const candidateValue1Result = CandidateValue.create({ json });
      const candidateValue2Result = CandidateValue.create({ json });

      expect(candidateValue1Result).toSucceedAndSatisfy((cv1) => {
        expect(candidateValue2Result).toSucceedAndSatisfy((cv2) => {
          expect(cv1.key).toBe(cv2.key);
        });
      });
    });

    test('should handle complex nested objects consistently', () => {
      const json = {
        level1: {
          level2: {
            array: [1, 2, { nested: true }],
            value: 'test'
          },
          other: null
        },
        primitive: 42
      };

      const candidateValue1Result = CandidateValue.create({ json });
      const candidateValue2Result = CandidateValue.create({ json: JSON.parse(JSON.stringify(json)) });

      expect(candidateValue1Result).toSucceedAndSatisfy((cv1) => {
        expect(candidateValue2Result).toSucceedAndSatisfy((cv2) => {
          expect(cv1.key).toBe(cv2.key);
        });
      });
    });
  });

  describe('error handling', () => {
    test('should handle normalization errors gracefully', () => {
      // This test assumes there could be normalization errors in edge cases
      // Currently Hash.Crc32Normalizer is very robust, so this mainly tests the pattern
      const json = { test: 'value' };

      expect(CandidateValue.create({ json })).toSucceed();
    });
  });

  describe('ICandidateValue interface compliance', () => {
    test('should implement ICandidateValue interface correctly', () => {
      const json = { test: 'interface test' };

      expect(CandidateValue.create({ json, index: 42 })).toSucceedAndSatisfy((candidateValue) => {
        const icv: ICandidateValue = candidateValue; // Should compile without issues

        expect(icv.key).toBeDefined();
        expect(icv.json).toEqual(json);
        expect(icv.index).toBe(42);
        expect(typeof icv.setIndex).toBe('function');

        // Cannot change index once set (immutable behavior)
        expect(icv.setIndex(99)).toFailWith(/index 42 is immutable and cannot be changed to 99/);
        expect(icv.index).toBe(42); // Should remain unchanged
      });
    });
  });
});
