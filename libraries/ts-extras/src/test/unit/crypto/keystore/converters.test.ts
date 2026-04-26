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

import * as CryptoUtils from '../../../../packlets/crypto-utils';

describe('Key Store Converters', () => {
  describe('keystoreFormat', () => {
    test('accepts valid format', () => {
      expect(CryptoUtils.KeyStore.Converters.keystoreFormat.convert('keystore-v1')).toSucceedWith(
        'keystore-v1'
      );
    });

    test('rejects invalid format', () => {
      expect(CryptoUtils.KeyStore.Converters.keystoreFormat.convert('keystore-v2')).toFail();
    });

    test('rejects non-string', () => {
      expect(CryptoUtils.KeyStore.Converters.keystoreFormat.convert(123)).toFail();
    });
  });

  describe('keystoreSymmetricSecretType', () => {
    test('accepts encryption-key', () => {
      expect(
        CryptoUtils.KeyStore.Converters.keystoreSymmetricSecretType.convert('encryption-key')
      ).toSucceedWith('encryption-key');
    });

    test('accepts api-key', () => {
      expect(CryptoUtils.KeyStore.Converters.keystoreSymmetricSecretType.convert('api-key')).toSucceedWith(
        'api-key'
      );
    });

    test('rejects asymmetric-keypair', () => {
      expect(
        CryptoUtils.KeyStore.Converters.keystoreSymmetricSecretType.convert('asymmetric-keypair')
      ).toFail();
    });
  });

  describe('keystoreAsymmetricSecretType', () => {
    test('accepts asymmetric-keypair', () => {
      expect(
        CryptoUtils.KeyStore.Converters.keystoreAsymmetricSecretType.convert('asymmetric-keypair')
      ).toSucceedWith('asymmetric-keypair');
    });

    test('rejects encryption-key', () => {
      expect(CryptoUtils.KeyStore.Converters.keystoreAsymmetricSecretType.convert('encryption-key')).toFail();
    });
  });

  describe('keyPairAlgorithm', () => {
    test('accepts ecdsa-p256', () => {
      expect(CryptoUtils.KeyStore.Converters.keyPairAlgorithm.convert('ecdsa-p256')).toSucceedWith(
        'ecdsa-p256'
      );
    });

    test('accepts rsa-oaep-2048', () => {
      expect(CryptoUtils.KeyStore.Converters.keyPairAlgorithm.convert('rsa-oaep-2048')).toSucceedWith(
        'rsa-oaep-2048'
      );
    });

    test('rejects unknown algorithm', () => {
      expect(CryptoUtils.KeyStore.Converters.keyPairAlgorithm.convert('ed25519')).toFail();
    });

    test('rejects non-string', () => {
      expect(CryptoUtils.KeyStore.Converters.keyPairAlgorithm.convert(42)).toFail();
    });
  });

  describe('jsonWebKey', () => {
    test('accepts a JWK with kty and other fields', () => {
      const input = {
        kty: 'EC',
        crv: 'P-256',
        x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
        y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
        ext: true
      };
      expect(CryptoUtils.KeyStore.Converters.jsonWebKey.validate(input)).toSucceedAndSatisfy((jwk) => {
        // Validators preserve extra fields in place
        expect(jwk).toBe(input);
        expect(jwk.kty).toBe('EC');
      });
    });

    test('rejects an object with no kty', () => {
      expect(CryptoUtils.KeyStore.Converters.jsonWebKey.validate({ crv: 'P-256' })).toFail();
    });

    test('rejects when kty is not a string', () => {
      expect(CryptoUtils.KeyStore.Converters.jsonWebKey.validate({ kty: 42 })).toFail();
    });

    test('rejects an array', () => {
      expect(CryptoUtils.KeyStore.Converters.jsonWebKey.validate(['EC', 'P-256'])).toFail();
    });

    test('rejects null', () => {
      expect(CryptoUtils.KeyStore.Converters.jsonWebKey.validate(null)).toFail();
    });

    test('rejects a primitive', () => {
      expect(CryptoUtils.KeyStore.Converters.jsonWebKey.validate('EC')).toFail();
    });
  });

  describe('keystoreSymmetricEntryJson', () => {
    test('accepts a complete encryption-key entry', () => {
      const input = {
        name: 'my-secret',
        type: 'encryption-key',
        key: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        description: 'A test secret',
        createdAt: '2024-01-15T10:30:00Z'
      };
      expect(CryptoUtils.KeyStore.Converters.keystoreSymmetricEntryJson.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.name).toBe('my-secret');
          expect(result.type).toBe('encryption-key');
          expect(result.key).toBe('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
          expect(result.description).toBe('A test secret');
        }
      );
    });

    test('accepts an api-key entry', () => {
      const input = {
        name: 'service',
        type: 'api-key',
        key: 'c2stMTIzNA==',
        createdAt: '2024-01-15T10:30:00Z'
      };
      expect(CryptoUtils.KeyStore.Converters.keystoreSymmetricEntryJson.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.type).toBe('api-key');
          expect(result.description).toBeUndefined();
        }
      );
    });

    test('injects encryption-key default for legacy entries with no type', () => {
      const input = {
        name: 'legacy',
        key: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        createdAt: '2024-01-15T10:30:00Z'
      };
      expect(CryptoUtils.KeyStore.Converters.keystoreSymmetricEntryJson.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.type).toBe('encryption-key');
        }
      );
    });

    test('rejects an asymmetric-keypair entry', () => {
      const input = {
        name: 'pair',
        type: 'asymmetric-keypair',
        key: 'AAAA',
        createdAt: '2024-01-15T10:30:00Z'
      };
      expect(CryptoUtils.KeyStore.Converters.keystoreSymmetricEntryJson.convert(input)).toFail();
    });

    test('rejects missing key', () => {
      const input = {
        name: 'my-secret',
        type: 'encryption-key',
        createdAt: '2024-01-15T10:30:00Z'
      };
      expect(CryptoUtils.KeyStore.Converters.keystoreSymmetricEntryJson.convert(input)).toFail();
    });

    test('rejects an invalid base64 key', () => {
      const input = {
        name: 'my-secret',
        type: 'encryption-key',
        key: 'not!valid!base64',
        createdAt: '2024-01-15T10:30:00Z'
      };
      expect(CryptoUtils.KeyStore.Converters.keystoreSymmetricEntryJson.convert(input)).toFail();
    });
  });

  describe('keystoreAsymmetricEntryJson', () => {
    const validInput = {
      name: 'signing',
      type: 'asymmetric-keypair',
      id: 'a3b1f9e0-0000-4000-8000-000000000000',
      algorithm: 'ecdsa-p256',
      publicKeyJwk: {
        kty: 'EC',
        crv: 'P-256',
        x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
        y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0'
      },
      description: 'Signing key',
      createdAt: '2024-02-15T10:30:00Z'
    };

    test('accepts a complete asymmetric entry and preserves JWK fields', () => {
      expect(
        CryptoUtils.KeyStore.Converters.keystoreAsymmetricEntryJson.convert(validInput)
      ).toSucceedAndSatisfy((result) => {
        expect(result.name).toBe('signing');
        expect(result.type).toBe('asymmetric-keypair');
        expect(result.id).toBe(validInput.id);
        expect(result.algorithm).toBe('ecdsa-p256');
        expect(result.publicKeyJwk).toEqual(validInput.publicKeyJwk);
        expect(result.publicKeyJwk.crv).toBe('P-256');
      });
    });

    test('accepts an entry without description', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { description: _description, ...input } = validInput;
      expect(CryptoUtils.KeyStore.Converters.keystoreAsymmetricEntryJson.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.description).toBeUndefined();
        }
      );
    });

    test('rejects a missing type', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { type: _type, ...input } = validInput;
      expect(CryptoUtils.KeyStore.Converters.keystoreAsymmetricEntryJson.convert(input)).toFail();
    });

    test('rejects an unsupported algorithm', () => {
      expect(
        CryptoUtils.KeyStore.Converters.keystoreAsymmetricEntryJson.convert({
          ...validInput,
          algorithm: 'ed25519'
        })
      ).toFail();
    });

    test('rejects a JWK without kty', () => {
      expect(
        CryptoUtils.KeyStore.Converters.keystoreAsymmetricEntryJson.convert({
          ...validInput,
          publicKeyJwk: { crv: 'P-256' }
        })
      ).toFail();
    });

    test('rejects a missing id', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...input } = validInput;
      expect(CryptoUtils.KeyStore.Converters.keystoreAsymmetricEntryJson.convert(input)).toFail();
    });

    test('rejects a symmetric type', () => {
      expect(
        CryptoUtils.KeyStore.Converters.keystoreAsymmetricEntryJson.convert({
          ...validInput,
          type: 'encryption-key'
        })
      ).toFail();
    });
  });

  describe('keystoreSecretEntryJson (discriminated union)', () => {
    test('routes a symmetric entry through the symmetric branch', () => {
      const input = {
        name: 'my-secret',
        type: 'encryption-key',
        key: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        createdAt: '2024-01-15T10:30:00Z'
      };
      expect(CryptoUtils.KeyStore.Converters.keystoreSecretEntryJson.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.type).toBe('encryption-key');
          if (result.type !== 'asymmetric-keypair') {
            expect(result.key).toBe('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
          }
        }
      );
    });

    test('routes an asymmetric entry through the asymmetric branch', () => {
      const input = {
        name: 'pair',
        type: 'asymmetric-keypair',
        id: 'b1c2d3e4-0000-4000-8000-000000000000',
        algorithm: 'rsa-oaep-2048',
        publicKeyJwk: { kty: 'RSA', n: 'abc', e: 'AQAB' },
        createdAt: '2024-03-10T08:00:00Z'
      };
      expect(CryptoUtils.KeyStore.Converters.keystoreSecretEntryJson.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.type).toBe('asymmetric-keypair');
          if (result.type === 'asymmetric-keypair') {
            expect(result.algorithm).toBe('rsa-oaep-2048');
            expect(result.id).toBe(input.id);
          }
        }
      );
    });

    test('routes legacy entries (no type) through the symmetric branch', () => {
      const input = {
        name: 'legacy',
        key: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        createdAt: '2024-01-15T10:30:00Z'
      };
      expect(CryptoUtils.KeyStore.Converters.keystoreSecretEntryJson.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.type).toBe('encryption-key');
        }
      );
    });

    test('rejects an entry that fits neither branch', () => {
      const input = {
        name: 'broken',
        type: 'asymmetric-keypair'
      };
      expect(CryptoUtils.KeyStore.Converters.keystoreSecretEntryJson.convert(input)).toFail();
    });
  });

  describe('keystoreVaultContents', () => {
    test('accepts valid vault with secrets', () => {
      const input = {
        version: CryptoUtils.KeyStore.KEYSTORE_FORMAT,
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
      expect(CryptoUtils.KeyStore.Converters.keystoreVaultContents.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.version).toBe(CryptoUtils.KeyStore.KEYSTORE_FORMAT);
          expect(Object.keys(result.secrets)).toHaveLength(2);
          expect(result.secrets.secretOne.name).toBe('secretOne');
          expect(result.secrets.secretTwo.description).toBe('Another secret');
        }
      );
    });

    test('round-trips a vault containing both symmetric and asymmetric entries', () => {
      const input = {
        version: CryptoUtils.KeyStore.KEYSTORE_FORMAT,
        secrets: {
          symmetricOne: {
            name: 'symmetricOne',
            type: 'encryption-key',
            key: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
            createdAt: '2024-01-15T10:30:00Z'
          },
          legacy: {
            name: 'legacy',
            key: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC8=',
            createdAt: '2024-01-15T10:30:00Z'
          },
          signingKey: {
            name: 'signingKey',
            type: 'asymmetric-keypair',
            id: 'b1c2d3e4-0000-4000-8000-000000000000',
            algorithm: 'ecdsa-p256',
            publicKeyJwk: {
              kty: 'EC',
              crv: 'P-256',
              x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
              y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0'
            },
            description: 'For document signing',
            createdAt: '2024-02-15T10:30:00Z'
          }
        }
      };
      expect(CryptoUtils.KeyStore.Converters.keystoreVaultContents.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(Object.keys(result.secrets)).toHaveLength(3);

          const symmetricOne = result.secrets.symmetricOne;
          expect(symmetricOne.type).toBe('encryption-key');
          if (symmetricOne.type !== 'asymmetric-keypair') {
            expect(symmetricOne.key).toBe('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
          }

          const legacy = result.secrets.legacy;
          expect(legacy.type).toBe('encryption-key');

          const signingKey = result.secrets.signingKey;
          expect(signingKey.type).toBe('asymmetric-keypair');
          if (signingKey.type === 'asymmetric-keypair') {
            expect(signingKey.id).toBe('b1c2d3e4-0000-4000-8000-000000000000');
            expect(signingKey.algorithm).toBe('ecdsa-p256');
            expect(signingKey.publicKeyJwk.kty).toBe('EC');
            // JWK extras survive validation
            expect(signingKey.publicKeyJwk).toEqual(input.secrets.signingKey.publicKeyJwk);
          }
        }
      );
    });

    test('accepts vault with empty secrets', () => {
      const input = {
        version: CryptoUtils.KeyStore.KEYSTORE_FORMAT,
        secrets: {}
      };
      expect(CryptoUtils.KeyStore.Converters.keystoreVaultContents.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.version).toBe(CryptoUtils.KeyStore.KEYSTORE_FORMAT);
          expect(Object.keys(result.secrets)).toHaveLength(0);
        }
      );
    });

    test('rejects invalid version', () => {
      const input = {
        version: 'keystore-v99',
        secrets: {}
      };
      expect(CryptoUtils.KeyStore.Converters.keystoreVaultContents.convert(input)).toFail();
    });

    test('rejects missing version', () => {
      const input = {
        secrets: {}
      };
      expect(CryptoUtils.KeyStore.Converters.keystoreVaultContents.convert(input)).toFail();
    });

    test('rejects missing secrets', () => {
      const input = {
        version: CryptoUtils.KeyStore.KEYSTORE_FORMAT
      };
      expect(CryptoUtils.KeyStore.Converters.keystoreVaultContents.convert(input)).toFail();
    });
  });

  describe('keystoreFile', () => {
    const validKeystoreFile = {
      format: CryptoUtils.KeyStore.KEYSTORE_FORMAT,
      algorithm: CryptoUtils.Constants.DEFAULT_ALGORITHM,
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
      expect(CryptoUtils.KeyStore.Converters.keystoreFile.convert(validKeystoreFile)).toSucceedAndSatisfy(
        (result) => {
          expect(result.format).toBe(CryptoUtils.KeyStore.KEYSTORE_FORMAT);
          expect(result.algorithm).toBe(CryptoUtils.Constants.DEFAULT_ALGORITHM);
          expect(result.keyDerivation.kdf).toBe('pbkdf2');
          expect(result.keyDerivation.iterations).toBe(600000);
        }
      );
    });

    test('rejects missing format', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { format: _format, ...noFormat } = validKeystoreFile;
      expect(CryptoUtils.KeyStore.Converters.keystoreFile.convert(noFormat)).toFail();
    });

    test('rejects invalid format', () => {
      expect(
        CryptoUtils.KeyStore.Converters.keystoreFile.convert({ ...validKeystoreFile, format: 'invalid' })
      ).toFail();
    });

    test('rejects missing keyDerivation', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { keyDerivation: _keyDerivation, ...noKeyDerivation } = validKeystoreFile;
      expect(CryptoUtils.KeyStore.Converters.keystoreFile.convert(noKeyDerivation)).toFail();
    });

    test('rejects invalid algorithm', () => {
      expect(
        CryptoUtils.KeyStore.Converters.keystoreFile.convert({
          ...validKeystoreFile,
          algorithm: 'AES-128-GCM'
        })
      ).toFail();
    });

    test('rejects invalid iv', () => {
      expect(
        CryptoUtils.KeyStore.Converters.keystoreFile.convert({ ...validKeystoreFile, iv: 'not!valid!base64' })
      ).toFail();
    });

    test('rejects invalid authTag', () => {
      expect(
        CryptoUtils.KeyStore.Converters.keystoreFile.convert({ ...validKeystoreFile, authTag: 'invalid!' })
      ).toFail();
    });

    test('rejects invalid encryptedData', () => {
      expect(
        CryptoUtils.KeyStore.Converters.keystoreFile.convert({ ...validKeystoreFile, encryptedData: '!!!' })
      ).toFail();
    });

    test('rejects invalid keyDerivation kdf', () => {
      expect(
        CryptoUtils.KeyStore.Converters.keystoreFile.convert({
          ...validKeystoreFile,
          keyDerivation: { ...validKeystoreFile.keyDerivation, kdf: 'scrypt' }
        })
      ).toFail();
    });

    test('rejects invalid keyDerivation iterations type', () => {
      expect(
        CryptoUtils.KeyStore.Converters.keystoreFile.convert({
          ...validKeystoreFile,
          keyDerivation: { ...validKeystoreFile.keyDerivation, iterations: 'many' }
        })
      ).toFail();
    });
  });

  describe('isKeyStoreFile', () => {
    test('returns true for valid key store format', () => {
      expect(CryptoUtils.KeyStore.isKeyStoreFile({ format: CryptoUtils.KeyStore.KEYSTORE_FORMAT })).toBe(
        true
      );
    });

    test('returns false for encrypted collection format', () => {
      expect(CryptoUtils.KeyStore.isKeyStoreFile({ format: 'encrypted-collection-v1' })).toBe(false);
    });

    test('returns false for wrong format value', () => {
      expect(CryptoUtils.KeyStore.isKeyStoreFile({ format: 'something-else' })).toBe(false);
    });

    test('returns false for missing format', () => {
      expect(CryptoUtils.KeyStore.isKeyStoreFile({ notFormat: 'value' })).toBe(false);
    });

    test('returns false for null', () => {
      expect(CryptoUtils.KeyStore.isKeyStoreFile(null)).toBe(false);
    });

    test('returns false for undefined', () => {
      expect(CryptoUtils.KeyStore.isKeyStoreFile(undefined)).toBe(false);
    });

    test('returns false for non-object', () => {
      expect(CryptoUtils.KeyStore.isKeyStoreFile('string')).toBe(false);
      expect(CryptoUtils.KeyStore.isKeyStoreFile(123)).toBe(false);
      expect(CryptoUtils.KeyStore.isKeyStoreFile(true)).toBe(false);
    });
  });
});
