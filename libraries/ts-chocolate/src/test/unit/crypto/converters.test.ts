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

import {
  Converters,
  Constants as CryptoConstants,
  isEncryptedCollectionFile
} from '../../../packlets/crypto-utils';

describe('Crypto Converters', () => {
  describe('encryptionAlgorithm', () => {
    test('accepts valid algorithm', () => {
      expect(Converters.encryptionAlgorithm.convert('AES-256-GCM')).toSucceedWith('AES-256-GCM');
    });

    test('rejects invalid algorithm', () => {
      expect(Converters.encryptionAlgorithm.convert('AES-128-GCM')).toFail();
    });

    test('rejects non-string', () => {
      expect(Converters.encryptionAlgorithm.convert(123)).toFail();
    });
  });

  describe('encryptedCollectionFormat', () => {
    test('accepts valid format', () => {
      expect(Converters.encryptedCollectionFormat.convert('encrypted-collection-v1')).toSucceedWith(
        'encrypted-collection-v1'
      );
    });

    test('rejects invalid format', () => {
      expect(Converters.encryptedCollectionFormat.convert('encrypted-collection-v2')).toFail();
    });
  });

  describe('encryptedCollectionErrorMode', () => {
    test('accepts "fail"', () => {
      expect(Converters.encryptedCollectionErrorMode.convert('fail')).toSucceedWith('fail');
    });

    test('accepts "skip"', () => {
      expect(Converters.encryptedCollectionErrorMode.convert('skip')).toSucceedWith('skip');
    });

    test('accepts "warn"', () => {
      expect(Converters.encryptedCollectionErrorMode.convert('warn')).toSucceedWith('warn');
    });

    test('rejects invalid mode', () => {
      expect(Converters.encryptedCollectionErrorMode.convert('ignore')).toFail();
    });
  });

  describe('base64String', () => {
    test('accepts valid base64 string', () => {
      expect(Converters.base64String.convert('SGVsbG8gV29ybGQ=')).toSucceedWith('SGVsbG8gV29ybGQ=');
    });

    test('accepts empty string', () => {
      expect(Converters.base64String.convert('')).toSucceedWith('');
    });

    test('accepts base64 without padding', () => {
      expect(Converters.base64String.convert('SGVsbG8')).toSucceedWith('SGVsbG8');
    });

    test('rejects invalid base64 characters', () => {
      expect(Converters.base64String.convert('Hello!@#$')).toFailWith(/invalid base64/i);
    });

    test('rejects non-string', () => {
      expect(Converters.base64String.convert(123)).toFail();
    });
  });

  describe('encryptedCollectionMetadata', () => {
    test('accepts full metadata', () => {
      const input = {
        collectionId: 'test-collection',
        description: 'Test description',
        itemCount: 42
      };
      expect(Converters.encryptedCollectionMetadata.convert(input)).toSucceedWith(input);
    });

    test('accepts partial metadata', () => {
      expect(Converters.encryptedCollectionMetadata.convert({ collectionId: 'test' })).toSucceedAndSatisfy(
        (result) => {
          expect(result.collectionId).toBe('test');
        }
      );
    });

    test('accepts empty metadata', () => {
      expect(Converters.encryptedCollectionMetadata.convert({})).toSucceed();
    });

    test('rejects invalid itemCount type', () => {
      expect(Converters.encryptedCollectionMetadata.convert({ itemCount: 'not a number' })).toFail();
    });
  });

  describe('encryptedCollectionFile', () => {
    const validTombstone = {
      format: CryptoConstants.ENCRYPTED_COLLECTION_FORMAT,
      secretName: 'my-secret',
      algorithm: CryptoConstants.DEFAULT_ALGORITHM,
      iv: 'AAAAAAAAAAAAAAAA',
      authTag: 'AAAAAAAAAAAAAAAAAAAAAA==',
      encryptedData: 'SGVsbG8gV29ybGQ='
    };

    test('accepts valid tombstone without metadata', () => {
      expect(Converters.encryptedCollectionFile.convert(validTombstone)).toSucceedAndSatisfy((result) => {
        expect(result.format).toBe(CryptoConstants.ENCRYPTED_COLLECTION_FORMAT);
        expect(result.secretName).toBe('my-secret');
        expect(result.algorithm).toBe(CryptoConstants.DEFAULT_ALGORITHM);
      });
    });

    test('accepts valid tombstone with metadata', () => {
      const withMetadata = {
        ...validTombstone,
        metadata: {
          collectionId: 'test-collection',
          description: 'Test',
          itemCount: 10
        }
      };
      expect(Converters.encryptedCollectionFile.convert(withMetadata)).toSucceedAndSatisfy((result) => {
        expect(result.metadata?.collectionId).toBe('test-collection');
      });
    });

    test('rejects missing format', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { format: _format, ...noFormat } = validTombstone;
      expect(Converters.encryptedCollectionFile.convert(noFormat)).toFail();
    });

    test('rejects invalid format', () => {
      expect(Converters.encryptedCollectionFile.convert({ ...validTombstone, format: 'invalid' })).toFail();
    });

    test('rejects missing secretName', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { secretName: _secretName, ...noSecretName } = validTombstone;
      expect(Converters.encryptedCollectionFile.convert(noSecretName)).toFail();
    });

    test('rejects invalid algorithm', () => {
      expect(
        Converters.encryptedCollectionFile.convert({ ...validTombstone, algorithm: 'invalid' })
      ).toFail();
    });
  });

  describe('uint8ArrayFromBase64', () => {
    test('converts valid base64 to Uint8Array', () => {
      expect(Converters.uint8ArrayFromBase64.convert('SGVsbG8=')).toSucceedAndSatisfy((result) => {
        expect(result).toBeInstanceOf(Uint8Array);
        expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]); // "Hello"
      });
    });

    test('converts empty string to empty Uint8Array', () => {
      expect(Converters.uint8ArrayFromBase64.convert('')).toSucceedAndSatisfy((result) => {
        expect(result.length).toBe(0);
      });
    });

    test('rejects non-string', () => {
      expect(Converters.uint8ArrayFromBase64.convert(123)).toFail();
    });
  });

  describe('namedSecret', () => {
    test('converts valid named secret', () => {
      const input = {
        name: 'my-secret',
        key: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' // 32 bytes of zeros
      };
      expect(Converters.namedSecret.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.name).toBe('my-secret');
        expect(result.key).toBeInstanceOf(Uint8Array);
        expect(result.key.length).toBe(32);
      });
    });

    test('rejects missing name', () => {
      expect(Converters.namedSecret.convert({ key: 'AAAA' })).toFail();
    });

    test('rejects missing key', () => {
      expect(Converters.namedSecret.convert({ name: 'test' })).toFail();
    });
  });

  describe('isEncryptedCollectionFile', () => {
    test('returns true for valid tombstone format', () => {
      expect(isEncryptedCollectionFile({ format: CryptoConstants.ENCRYPTED_COLLECTION_FORMAT })).toBe(true);
    });

    test('returns false for wrong format value', () => {
      expect(isEncryptedCollectionFile({ format: 'something-else' })).toBe(false);
    });

    test('returns false for missing format', () => {
      expect(isEncryptedCollectionFile({ notFormat: 'value' })).toBe(false);
    });

    test('returns false for null', () => {
      expect(isEncryptedCollectionFile(null)).toBe(false);
    });

    test('returns false for non-object', () => {
      expect(isEncryptedCollectionFile('string')).toBe(false);
      expect(isEncryptedCollectionFile(123)).toBe(false);
    });
  });
});
