// Copyright (c) 2026 Erik Fortune
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

import { Crypto } from '@fgv/ts-extras';

describe('Key Store Converters', () => {
  describe('keystoreFormat', () => {
    test('accepts valid format', () => {
      expect(Crypto.KeyStore.Converters.keystoreFormat.convert('keystore-v1')).toSucceedWith('keystore-v1');
    });

    test('rejects invalid format', () => {
      expect(Crypto.KeyStore.Converters.keystoreFormat.convert('keystore-v2')).toFail();
    });

    test('rejects non-string', () => {
      expect(Crypto.KeyStore.Converters.keystoreFormat.convert(123)).toFail();
    });
  });

  describe('keystoreSecretEntryJson', () => {
    test('accepts valid entry with all fields', () => {
      const input = {
        name: 'my-secret',
        key: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        description: 'A test secret',
        createdAt: '2024-01-15T10:30:00Z'
      };
      expect(Crypto.KeyStore.Converters.keystoreSecretEntryJson.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.name).toBe('my-secret');
          expect(result.key).toBe('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
          expect(result.description).toBe('A test secret');
          expect(result.createdAt).toBe('2024-01-15T10:30:00Z');
        }
      );
    });

    test('accepts valid entry without description', () => {
      const input = {
        name: 'my-secret',
        key: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        createdAt: '2024-01-15T10:30:00Z'
      };
      expect(Crypto.KeyStore.Converters.keystoreSecretEntryJson.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.name).toBe('my-secret');
          expect(result.description).toBeUndefined();
        }
      );
    });

    test('rejects missing name', () => {
      const input = {
        key: 'AAAA',
        createdAt: '2024-01-15T10:30:00Z'
      };
      expect(Crypto.KeyStore.Converters.keystoreSecretEntryJson.convert(input)).toFail();
    });

    test('rejects missing key', () => {
      const input = {
        name: 'my-secret',
        createdAt: '2024-01-15T10:30:00Z'
      };
      expect(Crypto.KeyStore.Converters.keystoreSecretEntryJson.convert(input)).toFail();
    });

    test('rejects missing createdAt', () => {
      const input = {
        name: 'my-secret',
        key: 'AAAA'
      };
      expect(Crypto.KeyStore.Converters.keystoreSecretEntryJson.convert(input)).toFail();
    });

    test('rejects invalid key format', () => {
      const input = {
        name: 'my-secret',
        key: 'not!valid!base64',
        createdAt: '2024-01-15T10:30:00Z'
      };
      expect(Crypto.KeyStore.Converters.keystoreSecretEntryJson.convert(input)).toFail();
    });
  });

  describe('keystoreVaultContents', () => {
    test('accepts valid vault with secrets', () => {
      const input = {
        version: Crypto.KeyStore.KEYSTORE_FORMAT,
        secrets: {
          secretOne: {
            name: 'secretOne',
            key: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
            createdAt: '2024-01-15T10:30:00Z'
          },
          secretTwo: {
            name: 'secretTwo',
            key: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB8=',
            description: 'Another secret',
            createdAt: '2024-01-16T11:00:00Z'
          }
        }
      };
      expect(Crypto.KeyStore.Converters.keystoreVaultContents.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.version).toBe(Crypto.KeyStore.KEYSTORE_FORMAT);
          expect(Object.keys(result.secrets)).toHaveLength(2);
          expect(result.secrets.secretOne.name).toBe('secretOne');
          expect(result.secrets.secretTwo.description).toBe('Another secret');
        }
      );
    });

    test('accepts vault with empty secrets', () => {
      const input = {
        version: Crypto.KeyStore.KEYSTORE_FORMAT,
        secrets: {}
      };
      expect(Crypto.KeyStore.Converters.keystoreVaultContents.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.version).toBe(Crypto.KeyStore.KEYSTORE_FORMAT);
          expect(Object.keys(result.secrets)).toHaveLength(0);
        }
      );
    });

    test('rejects invalid version', () => {
      const input = {
        version: 'keystore-v99',
        secrets: {}
      };
      expect(Crypto.KeyStore.Converters.keystoreVaultContents.convert(input)).toFail();
    });

    test('rejects missing version', () => {
      const input = {
        secrets: {}
      };
      expect(Crypto.KeyStore.Converters.keystoreVaultContents.convert(input)).toFail();
    });

    test('rejects missing secrets', () => {
      const input = {
        version: Crypto.KeyStore.KEYSTORE_FORMAT
      };
      expect(Crypto.KeyStore.Converters.keystoreVaultContents.convert(input)).toFail();
    });
  });

  describe('keystoreFile', () => {
    const validKeystoreFile = {
      format: Crypto.KeyStore.KEYSTORE_FORMAT,
      algorithm: Crypto.DEFAULT_ALGORITHM,
      iv: 'AAAAAAAAAAAAAAAA',
      authTag: 'AAAAAAAAAAAAAAAAAAAAAA==',
      encryptedData: 'SGVsbG8gV29ybGQ=',
      keyDerivation: {
        kdf: 'pbkdf2',
        salt: 'AAAAAAAAAAAAAAAAAAAAAA==',
        iterations: 600000
      }
    };

    test('accepts valid key store file', () => {
      expect(Crypto.KeyStore.Converters.keystoreFile.convert(validKeystoreFile)).toSucceedAndSatisfy(
        (result) => {
          expect(result.format).toBe(Crypto.KeyStore.KEYSTORE_FORMAT);
          expect(result.algorithm).toBe(Crypto.DEFAULT_ALGORITHM);
          expect(result.keyDerivation.kdf).toBe('pbkdf2');
          expect(result.keyDerivation.iterations).toBe(600000);
        }
      );
    });

    test('rejects missing format', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { format: _format, ...noFormat } = validKeystoreFile;
      expect(Crypto.KeyStore.Converters.keystoreFile.convert(noFormat)).toFail();
    });

    test('rejects invalid format', () => {
      expect(
        Crypto.KeyStore.Converters.keystoreFile.convert({ ...validKeystoreFile, format: 'invalid' })
      ).toFail();
    });

    test('rejects missing keyDerivation', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { keyDerivation: _keyDerivation, ...noKeyDerivation } = validKeystoreFile;
      expect(Crypto.KeyStore.Converters.keystoreFile.convert(noKeyDerivation)).toFail();
    });

    test('rejects invalid algorithm', () => {
      expect(
        Crypto.KeyStore.Converters.keystoreFile.convert({ ...validKeystoreFile, algorithm: 'AES-128-GCM' })
      ).toFail();
    });

    test('rejects invalid iv', () => {
      expect(
        Crypto.KeyStore.Converters.keystoreFile.convert({ ...validKeystoreFile, iv: 'not!valid!base64' })
      ).toFail();
    });

    test('rejects invalid authTag', () => {
      expect(
        Crypto.KeyStore.Converters.keystoreFile.convert({ ...validKeystoreFile, authTag: 'invalid!' })
      ).toFail();
    });

    test('rejects invalid encryptedData', () => {
      expect(
        Crypto.KeyStore.Converters.keystoreFile.convert({ ...validKeystoreFile, encryptedData: '!!!' })
      ).toFail();
    });

    test('rejects invalid keyDerivation kdf', () => {
      expect(
        Crypto.KeyStore.Converters.keystoreFile.convert({
          ...validKeystoreFile,
          keyDerivation: { ...validKeystoreFile.keyDerivation, kdf: 'scrypt' }
        })
      ).toFail();
    });

    test('rejects invalid keyDerivation iterations type', () => {
      expect(
        Crypto.KeyStore.Converters.keystoreFile.convert({
          ...validKeystoreFile,
          keyDerivation: { ...validKeystoreFile.keyDerivation, iterations: 'many' }
        })
      ).toFail();
    });
  });

  describe('isKeyStoreFile', () => {
    test('returns true for valid key store format', () => {
      expect(Crypto.KeyStore.isKeyStoreFile({ format: Crypto.KeyStore.KEYSTORE_FORMAT })).toBe(true);
    });

    test('returns false for encrypted collection format', () => {
      expect(Crypto.KeyStore.isKeyStoreFile({ format: 'encrypted-collection-v1' })).toBe(false);
    });

    test('returns false for wrong format value', () => {
      expect(Crypto.KeyStore.isKeyStoreFile({ format: 'something-else' })).toBe(false);
    });

    test('returns false for missing format', () => {
      expect(Crypto.KeyStore.isKeyStoreFile({ notFormat: 'value' })).toBe(false);
    });

    test('returns false for null', () => {
      expect(Crypto.KeyStore.isKeyStoreFile(null)).toBe(false);
    });

    test('returns false for undefined', () => {
      expect(Crypto.KeyStore.isKeyStoreFile(undefined)).toBe(false);
    });

    test('returns false for non-object', () => {
      expect(Crypto.KeyStore.isKeyStoreFile('string')).toBe(false);
      expect(Crypto.KeyStore.isKeyStoreFile(123)).toBe(false);
      expect(Crypto.KeyStore.isKeyStoreFile(true)).toBe(false);
    });
  });
});
