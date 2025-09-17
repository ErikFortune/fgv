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
import { BrowserHashNormalizer } from '../../packlets/hash';

describe('BrowserHashNormalizer', () => {
  describe('constructor', () => {
    test('creates a BrowserHashNormalizer instance', () => {
      const normalizer = new BrowserHashNormalizer();
      expect(normalizer).toBeInstanceOf(BrowserHashNormalizer);
    });
  });

  describe('sha256Hash', () => {
    test('throws an error directing users to async version', () => {
      expect(() => BrowserHashNormalizer.sha256Hash(['test'])).toThrow(
        /Browser crypto requires async operations.*@fgv\/ts-web-extras/
      );
    });
  });

  describe('isBrowserEnvironment', () => {
    test('returns false in Node.js environment', () => {
      expect(BrowserHashNormalizer.isBrowserEnvironment).toBe(false);
    });
  });

  describe('getBrowserRecommendation', () => {
    test('returns recommendation message', () => {
      const recommendation = BrowserHashNormalizer.getBrowserRecommendation();
      expect(recommendation).toContain('BrowserHashingNormalizer');
      expect(recommendation).toContain('ts-web-extras');
      expect(recommendation).toContain('async Web Crypto API');
    });
  });

  describe('normalize operation', () => {
    test('throws when trying to normalize (since underlying hash throws)', () => {
      const normalizer = new BrowserHashNormalizer();
      const result = normalizer.computeHash('test');
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.message).toMatch(/Browser crypto requires async operations/);
      }
    });
  });
});
