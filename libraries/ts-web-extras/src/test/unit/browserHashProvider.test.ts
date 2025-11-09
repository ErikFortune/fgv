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
import { BrowserHashProvider } from '../../packlets/crypto';

describe('BrowserHashProvider', () => {
  describe('hashString', () => {
    test('successfully hashes a string with SHA-256', async () => {
      const result = await BrowserHashProvider.hashString('test data', 'SHA-256');
      expect(result).toSucceedAndSatisfy((hash) => {
        expect(typeof hash).toBe('string');
        expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 produces 64 hex characters
      });
    });

    test('successfully hashes a string with SHA-1', async () => {
      const result = await BrowserHashProvider.hashString('test data', 'SHA-1');
      expect(result).toSucceedAndSatisfy((hash) => {
        expect(typeof hash).toBe('string');
        expect(hash).toMatch(/^[a-f0-9]{40}$/); // SHA-1 produces 40 hex characters
      });
    });

    test('successfully hashes a string with SHA-512', async () => {
      const result = await BrowserHashProvider.hashString('test data', 'SHA-512');
      expect(result).toSucceedAndSatisfy((hash) => {
        expect(typeof hash).toBe('string');
        expect(hash).toMatch(/^[a-f0-9]{128}$/); // SHA-512 produces 128 hex characters
      });
    });

    test('uses SHA-256 as default algorithm', async () => {
      const result = await BrowserHashProvider.hashString('test data');
      expect(result).toSucceedAndSatisfy((hash) => {
        expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 produces 64 hex characters
      });
    });

    test('produces consistent hash for same input', async () => {
      const input = 'consistent input';
      const result1 = await BrowserHashProvider.hashString(input);
      const result2 = await BrowserHashProvider.hashString(input);
      expect(result1).toSucceed();
      expect(result2).toSucceed();
      if (result1.isSuccess() && result2.isSuccess()) {
        expect(result1.value).toBe(result2.value);
      }
    });

    test('produces different hashes for different inputs', async () => {
      const result1 = await BrowserHashProvider.hashString('input1');
      const result2 = await BrowserHashProvider.hashString('input2');
      expect(result1).toSucceed();
      expect(result2).toSucceed();
      if (result1.isSuccess() && result2.isSuccess()) {
        expect(result1.value).not.toBe(result2.value);
      }
    });

    test('handles empty string input', async () => {
      const result = await BrowserHashProvider.hashString('');
      expect(result).toSucceed();
    });

    test('handles unicode input', async () => {
      const result = await BrowserHashProvider.hashString('🚀 Unicode test 测试');
      expect(result).toSucceedAndSatisfy((hash) => {
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
      });
    });

    test('fails when crypto.subtle is unavailable', async () => {
      const originalCrypto = global.crypto;
      // @ts-ignore - Intentionally removing crypto for test
      delete global.crypto;
      const result = await BrowserHashProvider.hashString('test');
      expect(result).toFailWith(/Hash computation failed/);
      global.crypto = originalCrypto;
    });

    test('handles invalid algorithm gracefully', async () => {
      const result = await BrowserHashProvider.hashString('test', 'INVALID-ALG');
      expect(result).toFailWith(/Hash computation failed/);
    });
  });

  describe('hashParts', () => {
    test('hashes multiple parts with default separator', async () => {
      const parts = ['part1', 'part2', 'part3'];
      const result = await BrowserHashProvider.hashParts(parts);
      expect(result).toSucceedAndSatisfy((hash) => {
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
      });
    });

    test('hashes multiple parts with custom separator', async () => {
      const parts = ['part1', 'part2', 'part3'];
      const result1 = await BrowserHashProvider.hashParts(parts, 'SHA-256', '|');
      const result2 = await BrowserHashProvider.hashParts(parts, 'SHA-256', ',');
      expect(result1).toSucceed();
      expect(result2).toSucceed();
      if (result1.isSuccess() && result2.isSuccess()) {
        expect(result1.value).not.toBe(result2.value);
      }
    });

    test('produces same hash as hashString for joined parts', async () => {
      const parts = ['a', 'b', 'c'];
      const separator = '-';
      const joined = parts.join(separator);
      const partsResult = await BrowserHashProvider.hashParts(parts, 'SHA-256', separator);
      const stringResult = await BrowserHashProvider.hashString(joined);
      expect(partsResult).toSucceed();
      expect(stringResult).toSucceed();
      if (partsResult.isSuccess() && stringResult.isSuccess()) {
        expect(partsResult.value).toBe(stringResult.value);
      }
    });

    test('handles empty array', async () => {
      const result = await BrowserHashProvider.hashParts([]);
      expect(result).toSucceed();
    });

    test('handles single part', async () => {
      const result = await BrowserHashProvider.hashParts(['single']);
      const stringResult = await BrowserHashProvider.hashString('single');
      expect(result).toSucceed();
      expect(stringResult).toSucceed();
      if (result.isSuccess() && stringResult.isSuccess()) {
        expect(result.value).toBe(stringResult.value);
      }
    });
  });
});
