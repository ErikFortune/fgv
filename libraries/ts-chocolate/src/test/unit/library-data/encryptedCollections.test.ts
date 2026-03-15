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

import { CryptoUtils } from '@fgv/ts-extras';
import { isEncryptedCollectionFile, Converters as ChocolateConverters } from '../../../packlets/library-data';

describe('Encrypted collections', () => {
  describe('encryptedCollectionMetadata', () => {
    test('accepts full metadata', () => {
      const input = {
        collectionId: 'test-collection',
        description: 'Test description',
        itemCount: 42
      };
      expect(ChocolateConverters.encryptedCollectionMetadata.convert(input)).toSucceedWith(input);
    });

    test('accepts partial metadata', () => {
      expect(
        ChocolateConverters.encryptedCollectionMetadata.convert({ collectionId: 'test' })
      ).toSucceedAndSatisfy((result) => {
        expect(result.collectionId).toBe('test');
      });
    });

    test('accepts empty metadata', () => {
      expect(ChocolateConverters.encryptedCollectionMetadata.convert({})).toSucceed();
    });

    test('rejects invalid itemCount type', () => {
      expect(ChocolateConverters.encryptedCollectionMetadata.convert({ itemCount: 'not a number' })).toFail();
    });
  });

  describe('encryptedCollectionFile', () => {
    const validTombstone = {
      format: CryptoUtils.Constants.ENCRYPTED_FILE_FORMAT,
      secretName: 'my-secret',
      algorithm: CryptoUtils.Constants.DEFAULT_ALGORITHM,
      iv: 'AAAAAAAAAAAAAAAA',
      authTag: 'AAAAAAAAAAAAAAAAAAAAAA==',
      encryptedData: 'SGVsbG8gV29ybGQ='
    };

    test('accepts valid tombstone without metadata', () => {
      expect(ChocolateConverters.encryptedCollectionFile.convert(validTombstone)).toSucceedAndSatisfy(
        (result) => {
          expect(result.format).toBe(CryptoUtils.Constants.ENCRYPTED_FILE_FORMAT);
          expect(result.secretName).toBe('my-secret');
          expect(result.algorithm).toBe(CryptoUtils.Constants.DEFAULT_ALGORITHM);
        }
      );
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
      expect(ChocolateConverters.encryptedCollectionFile.convert(withMetadata)).toSucceedAndSatisfy(
        (result) => {
          expect(result.metadata?.collectionId).toBe('test-collection');
        }
      );
    });

    test('rejects missing format', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { format: _format, ...noFormat } = validTombstone;
      expect(ChocolateConverters.encryptedCollectionFile.convert(noFormat)).toFail();
    });

    test('rejects invalid format', () => {
      expect(
        ChocolateConverters.encryptedCollectionFile.convert({ ...validTombstone, format: 'invalid' })
      ).toFail();
    });

    test('rejects missing secretName', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { secretName: _secretName, ...noSecretName } = validTombstone;
      expect(ChocolateConverters.encryptedCollectionFile.convert(noSecretName)).toFail();
    });

    test('rejects invalid algorithm', () => {
      expect(
        ChocolateConverters.encryptedCollectionFile.convert({ ...validTombstone, algorithm: 'invalid' })
      ).toFail();
    });
  });

  describe('isEncryptedCollectionFile', () => {
    test('returns true for valid tombstone format', () => {
      expect(isEncryptedCollectionFile({ format: CryptoUtils.Constants.ENCRYPTED_FILE_FORMAT })).toBe(true);
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

  describe('isEncryptedCollectionFile function', () => {
    const provider = CryptoUtils.nodeCryptoProvider;

    test('returns true for encrypted file objects', async () => {
      const key = (await provider.generateKey()).orThrow();
      const encrypted = (
        await CryptoUtils.createEncryptedFile({
          content: { test: 'data' },
          secretName: 'test',
          key,
          cryptoProvider: provider
        })
      ).orThrow();

      expect(isEncryptedCollectionFile(encrypted)).toBe(true);
    });

    test('returns false for regular JSON', () => {
      expect(isEncryptedCollectionFile({ test: 'data' })).toBe(false);
    });
  });
});
