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
import { Converters } from '@fgv/ts-utils';

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

  describe('isEncryptedFile', () => {
    test('returns true for valid encrypted file object', () => {
      const validFile = {
        format: 'encrypted-collection-v1',
        secretName: 'test',
        algorithm: 'AES-256-GCM',
        iv: 'AAAA',
        authTag: 'BBBB',
        encryptedData: 'CCCC'
      };
      expect(CryptoUtils.isEncryptedFile(validFile)).toBe(true);
    });

    test('returns false for non-object values', () => {
      expect(CryptoUtils.isEncryptedFile(null)).toBe(false);
      expect(CryptoUtils.isEncryptedFile(undefined)).toBe(false);
      expect(CryptoUtils.isEncryptedFile('string')).toBe(false);
      expect(CryptoUtils.isEncryptedFile(123)).toBe(false);
    });

    test('returns false for objects without correct format', () => {
      expect(CryptoUtils.isEncryptedFile({})).toBe(false);
      expect(CryptoUtils.isEncryptedFile({ format: 'wrong-format' })).toBe(false);
    });
  });

  describe('createEncryptedFileConverter', () => {
    const validEncryptedFile = {
      format: 'encrypted-collection-v1',
      secretName: 'test-secret',
      algorithm: 'AES-256-GCM',
      iv: 'AAAAAAAAAAAAAAAA',
      authTag: 'AAAAAAAAAAAAAAAAAAAAAA==',
      encryptedData: 'SGVsbG8gV29ybGQ='
    };

    test('converts encrypted file without metadata converter', () => {
      const converter = CryptoUtils.Converters.createEncryptedFileConverter();
      expect(converter.convert(validEncryptedFile)).toSucceed();
    });

    test('converts encrypted file with typed metadata when metadata matches', () => {
      interface ITestMetadata {
        version: number;
      }
      const metadataConverter = Converters.object<ITestMetadata>({
        version: Converters.number
      });
      const converter = CryptoUtils.Converters.createEncryptedFileConverter(metadataConverter);

      const fileWithMetadata = {
        ...validEncryptedFile,
        metadata: { version: 1 }
      };

      expect(converter.convert(fileWithMetadata)).toSucceedAndSatisfy((result) => {
        expect(result.metadata).toEqual({ version: 1 });
      });
    });

    test('fails when typed metadata does not match converter', () => {
      interface ITestMetadata {
        version: number;
      }
      const metadataConverter = Converters.object<ITestMetadata>({
        version: Converters.number
      });
      const converter = CryptoUtils.Converters.createEncryptedFileConverter(metadataConverter);

      const fileWithBadMetadata = {
        ...validEncryptedFile,
        metadata: { version: 'not-a-number' }
      };

      expect(converter.convert(fileWithBadMetadata)).toFailWith(/Invalid metadata/i);
    });
  });

  describe('keyDerivationFunction', () => {
    test('accepts "pbkdf2"', () => {
      expect(CryptoUtils.Converters.keyDerivationFunction.convert('pbkdf2')).toSucceedWith('pbkdf2');
    });

    test('accepts "argon2id"', () => {
      expect(CryptoUtils.Converters.keyDerivationFunction.convert('argon2id')).toSucceedWith('argon2id');
    });

    test('rejects unknown kdf', () => {
      expect(CryptoUtils.Converters.keyDerivationFunction.convert('scrypt')).toFail();
    });
  });

  describe('pbkdf2KeyDerivationParams', () => {
    test('converts valid PBKDF2 params', () => {
      expect(
        CryptoUtils.Converters.pbkdf2KeyDerivationParams.convert({
          kdf: 'pbkdf2',
          salt: 'AAAA',
          iterations: 100000
        })
      ).toSucceedWith({ kdf: 'pbkdf2', salt: 'AAAA', iterations: 100000 });
    });

    test('rejects argon2id kdf value', () => {
      expect(
        CryptoUtils.Converters.pbkdf2KeyDerivationParams.convert({
          kdf: 'argon2id',
          salt: 'AAAA',
          iterations: 3,
          memoryKiB: 19456,
          parallelism: 1
        })
      ).toFail();
    });

    test('rejects missing salt', () => {
      expect(
        CryptoUtils.Converters.pbkdf2KeyDerivationParams.convert({ kdf: 'pbkdf2', iterations: 1 })
      ).toFail();
    });
  });

  describe('argon2idKeyDerivationParams', () => {
    test('converts valid Argon2id params', () => {
      expect(
        CryptoUtils.Converters.argon2idKeyDerivationParams.convert({
          kdf: 'argon2id',
          salt: 'AAAA',
          memoryKiB: 19456,
          iterations: 2,
          parallelism: 1
        })
      ).toSucceedWith({ kdf: 'argon2id', salt: 'AAAA', memoryKiB: 19456, iterations: 2, parallelism: 1 });
    });

    test('rejects pbkdf2 kdf value', () => {
      expect(
        CryptoUtils.Converters.argon2idKeyDerivationParams.convert({
          kdf: 'pbkdf2',
          salt: 'AAAA',
          iterations: 1
        })
      ).toFail();
    });

    test('rejects missing memoryKiB', () => {
      expect(
        CryptoUtils.Converters.argon2idKeyDerivationParams.convert({
          kdf: 'argon2id',
          salt: 'AAAA',
          iterations: 2,
          parallelism: 1
        })
      ).toFail();
    });
  });

  describe('keyDerivationParams (discriminated union)', () => {
    test('converts PBKDF2 params', () => {
      expect(
        CryptoUtils.Converters.keyDerivationParams.convert({
          kdf: 'pbkdf2',
          salt: 'AAAA',
          iterations: 350000
        })
      ).toSucceedWith({ kdf: 'pbkdf2', salt: 'AAAA', iterations: 350000 });
    });

    test('converts Argon2id params', () => {
      expect(
        CryptoUtils.Converters.keyDerivationParams.convert({
          kdf: 'argon2id',
          salt: 'BBBB',
          memoryKiB: 65536,
          iterations: 3,
          parallelism: 1
        })
      ).toSucceedWith({ kdf: 'argon2id', salt: 'BBBB', memoryKiB: 65536, iterations: 3, parallelism: 1 });
    });

    test('rejects unknown kdf', () => {
      expect(
        CryptoUtils.Converters.keyDerivationParams.convert({ kdf: 'scrypt', salt: 'AAAA', iterations: 1 })
      ).toFail();
    });

    test('rejects non-object', () => {
      expect(CryptoUtils.Converters.keyDerivationParams.convert('pbkdf2')).toFail();
    });
  });
});
