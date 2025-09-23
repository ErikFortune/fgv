/*
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

import '@fgv/ts-utils-jest';
// eslint-disable-next-line @rushstack/packlets/mechanics
import * as BrowserHash from '../../packlets/hash/index.browser';

describe('SimpleHashNormalizer (Browser)', () => {
  describe('simpleHash', () => {
    test('should return consistent hash for same input', () => {
      const parts = ['test', 'data'];
      const hash1 = BrowserHash.SimpleHashNormalizer.simpleHash(parts);
      const hash2 = BrowserHash.SimpleHashNormalizer.simpleHash(parts);
      expect(hash1).toBe(hash2);
    });

    test('should return different hashes for different inputs', () => {
      const parts1 = ['test', 'data'];
      const parts2 = ['different', 'data'];
      const hash1 = BrowserHash.SimpleHashNormalizer.simpleHash(parts1);
      const hash2 = BrowserHash.SimpleHashNormalizer.simpleHash(parts2);
      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty array', () => {
      const hash = BrowserHash.SimpleHashNormalizer.simpleHash([]);
      expect(hash).toBe('0');
    });

    test('should handle single item', () => {
      const hash = BrowserHash.SimpleHashNormalizer.simpleHash(['single']);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(32); // 32 character length
    });

    test('should be deterministic across calls', () => {
      const parts = ['hello', 'world', '123'];
      const hashes = Array.from({ length: 10 }, () => BrowserHash.SimpleHashNormalizer.simpleHash(parts));

      expect(hashes.every((h) => h === hashes[0])).toBe(true);
    });
  });

  describe('SimpleHashNormalizer class', () => {
    test('should create normalizer instance', () => {
      const normalizer = new BrowserHash.SimpleHashNormalizer();
      expect(normalizer).toBeDefined();
    });

    test('should compute hash through normalizer', () => {
      const normalizer = new BrowserHash.SimpleHashNormalizer();
      const testObj = { test: 'data', number: 42 };

      expect(normalizer.computeHash(testObj)).toSucceed();
    });

    test('should produce consistent results with same object', () => {
      const normalizer = new BrowserHash.SimpleHashNormalizer();
      const testObj = { test: 'data', number: 42 };

      const hash1 = normalizer.computeHash(testObj);
      const hash2 = normalizer.computeHash(testObj);

      expect(hash1).toSucceedWith(hash2.orThrow());
    });
  });
});
