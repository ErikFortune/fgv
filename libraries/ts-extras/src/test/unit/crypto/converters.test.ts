// Copyright (c) 2024 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import '@fgv/ts-utils-jest';

import * as CryptoUtils from '../../../packlets/crypto-utils';

describe('Crypto Converters', () => {
  describe('encryptionAlgorithm', () => {
    test('accepts valid algorithm', () => {
      expect(CryptoUtils.Converters.encryptionAlgorithm.convert('AES-256-GCM')).toSucceedWith('AES-256-GCM');
    });

    test('rejects invalid algorithm', () => {
      expect(CryptoUtils.Converters.encryptionAlgorithm.convert('AES-128-GCM')).toFail();
    });

    test('rejects non-string', () => {
      expect(CryptoUtils.Converters.encryptionAlgorithm.convert(123)).toFail();
    });
  });

  describe('encryptedFileFormat', () => {
    test('accepts valid format', () => {
      expect(CryptoUtils.Converters.encryptedFileFormat.convert('encrypted-collection-v1')).toSucceedWith(
        'encrypted-collection-v1'
      );
    });

    test('rejects invalid format', () => {
      expect(CryptoUtils.Converters.encryptedFileFormat.convert('encrypted-collection-v2')).toFail();
    });
  });

  describe('encryptedFileErrorMode', () => {
    test('accepts "fail"', () => {
      expect(CryptoUtils.Converters.encryptedFileErrorMode.convert('fail')).toSucceedWith('fail');
    });

    test('accepts "skip"', () => {
      expect(CryptoUtils.Converters.encryptedFileErrorMode.convert('skip')).toSucceedWith('skip');
    });

    test('accepts "warn"', () => {
      expect(CryptoUtils.Converters.encryptedFileErrorMode.convert('warn')).toSucceedWith('warn');
    });

    test('rejects invalid mode', () => {
      expect(CryptoUtils.Converters.encryptedFileErrorMode.convert('ignore')).toFail();
    });
  });

  describe('base64String', () => {
    test('accepts valid base64 string', () => {
      expect(CryptoUtils.Converters.base64String.convert('SGVsbG8gV29ybGQ=')).toSucceedWith(
        'SGVsbG8gV29ybGQ='
      );
    });

    test('accepts empty string', () => {
      expect(CryptoUtils.Converters.base64String.convert('')).toSucceedWith('');
    });

    test('accepts base64 without padding', () => {
      expect(CryptoUtils.Converters.base64String.convert('SGVsbG8')).toSucceedWith('SGVsbG8');
    });

    test('rejects invalid base64 characters', () => {
      expect(CryptoUtils.Converters.base64String.convert('Hello!@#$')).toFailWith(/invalid base64/i);
    });

    test('rejects non-string', () => {
      expect(CryptoUtils.Converters.base64String.convert(123)).toFail();
    });
  });

  describe('uint8ArrayFromBase64', () => {
    test('converts valid base64 to Uint8Array', () => {
      expect(CryptoUtils.Converters.uint8ArrayFromBase64.convert('SGVsbG8=')).toSucceedAndSatisfy(
        (result) => {
          expect(result).toBeInstanceOf(Uint8Array);
          expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]); // "Hello"
        }
      );
    });

    test('converts empty string to empty Uint8Array', () => {
      expect(CryptoUtils.Converters.uint8ArrayFromBase64.convert('')).toSucceedAndSatisfy((result) => {
        expect(result.length).toBe(0);
      });
    });

    test('rejects non-string', () => {
      expect(CryptoUtils.Converters.uint8ArrayFromBase64.convert(123)).toFail();
    });
  });

  describe('namedSecret', () => {
    test('converts valid named secret', () => {
      const input = {
        name: 'my-secret',
        key: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' // 32 bytes of zeros
      };
      expect(CryptoUtils.Converters.namedSecret.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.name).toBe('my-secret');
        expect(result.key).toBeInstanceOf(Uint8Array);
        expect(result.key.length).toBe(32);
      });
    });

    test('rejects missing name', () => {
      expect(CryptoUtils.Converters.namedSecret.convert({ key: 'AAAA' })).toFail();
    });

    test('rejects missing key', () => {
      expect(CryptoUtils.Converters.namedSecret.convert({ name: 'test' })).toFail();
    });
  });
});
