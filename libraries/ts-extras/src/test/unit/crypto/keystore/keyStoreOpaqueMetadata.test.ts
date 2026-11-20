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
import { InMemoryPrivateKeyStorage } from './inMemoryPrivateKeyStorage';

describe('KeyStore opaque byte secrets + metadata (keystore-v3)', () => {
  const provider = CryptoUtils.nodeCryptoProvider;
  const testPassword = 'test-password-123';

  describe('opaque byte secrets', () => {
    let keystore: CryptoUtils.KeyStore.KeyStore;
    // Binary payload with an embedded NUL byte and high bytes — must survive
    // verbatim (no UTF-8 round-trip).
    const binaryBytes = new Uint8Array([0x00, 0x01, 0xff, 0x7f, 0x00, 0x80, 0x42]);

    beforeEach(async () => {
      keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
    });

    describe('importSecretBytes / getSecretBytes', () => {
      test('round-trips raw bytes verbatim including 0x00', async () => {
        expect(await keystore.importSecretBytes('blob', binaryBytes)).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.type).toBe('opaque');
          expect(addResult.replaced).toBe(false);
          expect(addResult.entry.createdAt).toBeDefined();
        });

        expect(keystore.getSecretBytes('blob')).toSucceedAndSatisfy((bytes) => {
          expect(Array.from(bytes)).toEqual(Array.from(binaryBytes));
        });
      });

      test('stores a defensive copy of the input bytes', async () => {
        const mutable = new Uint8Array(binaryBytes);
        await keystore.importSecretBytes('blob', mutable);
        mutable[0] = 0x99; // external mutation after import

        expect(keystore.getSecretBytes('blob')).toSucceedAndSatisfy((bytes) => {
          expect(bytes[0]).toBe(0x00);
        });
      });

      test('returns a copy so callers cannot mutate the vault buffer', async () => {
        await keystore.importSecretBytes('blob', binaryBytes);
        const first = keystore.getSecretBytes('blob').orThrow();
        first[0] = 0x99;

        expect(keystore.getSecretBytes('blob')).toSucceedAndSatisfy((bytes) => {
          expect(bytes[0]).toBe(0x00);
        });
      });

      test('supports description and initial metadata', async () => {
        expect(
          await keystore.importSecretBytes('blob', binaryBytes, {
            description: 'credential bundle',
            metadata: { source: 'import', version: 2 }
          })
        ).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.description).toBe('credential bundle');
          expect(addResult.entry.metadata).toEqual({ source: 'import', version: 2 });
        });
      });

      test('does not overwrite an existing secret without replace', async () => {
        await keystore.importSecretBytes('blob', binaryBytes);
        expect(await keystore.importSecretBytes('blob', new Uint8Array([1, 2, 3]))).toFailWith(
          /already exists/i
        );
      });

      test('replaces an existing secret with replace=true', async () => {
        await keystore.importSecretBytes('blob', binaryBytes);
        expect(
          await keystore.importSecretBytes('blob', new Uint8Array([1, 2, 3]), { replace: true })
        ).toSucceedAndSatisfy((addResult) => {
          expect(addResult.replaced).toBe(true);
        });
        expect(keystore.getSecretBytes('blob')).toSucceedAndSatisfy((bytes) => {
          expect(Array.from(bytes)).toEqual([1, 2, 3]);
        });
      });

      test('importSecretBytes fails with empty name', async () => {
        expect(await keystore.importSecretBytes('', binaryBytes)).toFailWith(/name cannot be empty/i);
      });

      test('importSecretBytes fails when locked', async () => {
        keystore.lock(true);
        expect(await keystore.importSecretBytes('blob', binaryBytes)).toFailWith(/locked/i);
      });

      test('getSecretBytes works for encryption-key and api-key entries too', async () => {
        await keystore.addSecret('enc');
        await keystore.importApiKey('api', 'sk-abc');

        expect(keystore.getSecretBytes('enc')).toSucceedAndSatisfy((bytes) => {
          expect(bytes.length).toBe(CryptoUtils.Constants.AES_256_KEY_SIZE);
        });
        expect(keystore.getSecretBytes('api')).toSucceedAndSatisfy((bytes) => {
          expect(new TextDecoder().decode(bytes)).toBe('sk-abc');
        });
      });

      test('getSecretBytes fails on missing name', () => {
        expect(keystore.getSecretBytes('nope')).toFailWith(/not found/i);
      });

      test('getSecretBytes fails on an asymmetric entry', async () => {
        const ks = CryptoUtils.KeyStore.KeyStore.create({
          cryptoProvider: provider,
          privateKeyStorage: new InMemoryPrivateKeyStorage()
        }).orThrow();
        await ks.initialize(testPassword);
        await ks.addKeyPair('kp', { algorithm: 'ecdsa-p256' });

        expect(ks.getSecretBytes('kp')).toFailWith(/asymmetric keypair/i);
      });

      test('getSecretBytes fails when locked', async () => {
        await keystore.importSecretBytes('blob', binaryBytes);
        await keystore.save(testPassword);
        keystore.lock();
        expect(keystore.getSecretBytes('blob')).toFailWith(/locked/i);
      });

      test('opaque entries surface correctly under listSecretsByType / listSecrets', async () => {
        await keystore.importSecretBytes('blob-1', binaryBytes);
        await keystore.importSecretBytes('blob-2', binaryBytes);
        await keystore.importApiKey('api', 'sk-abc');

        expect(keystore.listSecretsByType('opaque')).toSucceedAndSatisfy((names) => {
          expect(names).toEqual(expect.arrayContaining(['blob-1', 'blob-2']));
          expect(names).toHaveLength(2);
        });
        // opaque entries are NOT reported as api-key (the bug this type fixes)
        expect(keystore.listSecretsByType('api-key')).toSucceedWith(['api']);
        expect(keystore.listSecrets()).toSucceedAndSatisfy((names) => {
          expect(names).toEqual(expect.arrayContaining(['blob-1', 'blob-2', 'api']));
        });
      });
    });

    describe('setSecretMetadata', () => {
      test('sets metadata, stamps updatedAt, and leaves key bytes unchanged', async () => {
        await keystore.importSecretBytes('blob', binaryBytes);
        const before = keystore.getSecretBytes('blob').orThrow();

        expect(keystore.setSecretMetadata('blob', { rotated: true, at: 'now' })).toSucceedAndSatisfy(
          (entry) => {
            expect(entry.metadata).toEqual({ rotated: true, at: 'now' });
            expect(entry.updatedAt).toBeDefined();
            // key bytes are the same material as before the metadata update
            expect(Array.from(entry.key)).toEqual(Array.from(binaryBytes));
          }
        );

        // secret still reads back identically after the metadata update
        expect(keystore.getSecretBytes('blob')).toSucceedAndSatisfy((after) => {
          expect(Array.from(after)).toEqual(Array.from(before));
        });
      });

      test('replaces prior metadata', async () => {
        await keystore.importSecretBytes('blob', binaryBytes, { metadata: { a: 1 } });
        keystore.setSecretMetadata('blob', { b: 2 }).orThrow();

        expect(keystore.getSecret('blob')).toSucceedAndSatisfy((entry) => {
          if (entry.type !== 'asymmetric-keypair') {
            expect(entry.metadata).toEqual({ b: 2 });
          }
        });
      });

      test('works on encryption-key entries', async () => {
        await keystore.addSecret('enc');
        expect(keystore.setSecretMetadata('enc', 'a-label')).toSucceedAndSatisfy((entry) => {
          expect(entry.metadata).toBe('a-label');
        });
      });

      test('fails on missing name', () => {
        expect(keystore.setSecretMetadata('nope', {})).toFailWith(/not found/i);
      });

      test('fails on an asymmetric entry', async () => {
        const ks = CryptoUtils.KeyStore.KeyStore.create({
          cryptoProvider: provider,
          privateKeyStorage: new InMemoryPrivateKeyStorage()
        }).orThrow();
        await ks.initialize(testPassword);
        await ks.addKeyPair('kp', { algorithm: 'ecdsa-p256' });

        expect(ks.setSecretMetadata('kp', {})).toFailWith(/asymmetric keypair/i);
      });

      test('fails when locked', () => {
        keystore.lock(true);
        expect(keystore.setSecretMetadata('blob', {})).toFailWith(/locked/i);
      });
    });

    describe('persistence', () => {
      test('opaque secrets and metadata survive a full save/open round-trip', async () => {
        await keystore.importSecretBytes('blob', binaryBytes, { description: 'bundle' });
        keystore.setSecretMetadata('blob', { rotated: true }).orThrow();
        const savedFile = (await keystore.save(testPassword)).orThrow();

        expect(savedFile.format).toBe('keystore-v3');

        const reopened = CryptoUtils.KeyStore.KeyStore.open({
          cryptoProvider: provider,
          keystoreFile: savedFile
        }).orThrow();
        await reopened.unlock(testPassword);

        expect(reopened.listSecretsByType('opaque')).toSucceedWith(['blob']);
        expect(reopened.getSecretBytes('blob')).toSucceedAndSatisfy((bytes) => {
          expect(Array.from(bytes)).toEqual(Array.from(binaryBytes));
        });
        expect(reopened.getSecret('blob')).toSucceedAndSatisfy((entry) => {
          if (entry.type !== 'asymmetric-keypair') {
            expect(entry.description).toBe('bundle');
            expect(entry.metadata).toEqual({ rotated: true });
            expect(entry.updatedAt).toBeDefined();
          }
        });
      });

      test('a new vault is written as keystore-v3', async () => {
        await keystore.addSecret('s');
        const savedFile = (await keystore.save(testPassword)).orThrow();
        expect(savedFile.format).toBe('keystore-v3');
        expect(CryptoUtils.KeyStore.KEYSTORE_FORMAT).toBe('keystore-v3');
      });
    });
  });

  describe('format upgrade to keystore-v3', () => {
    // Builds a real encrypted keystore file for a prior format version by
    // encrypting the vault contents directly with the crypto provider — the
    // same wire shape KeyStore.save would have produced under that version.
    async function buildLegacyVaultFile(
      version: 'keystore-v1' | 'keystore-v2'
    ): Promise<CryptoUtils.KeyStore.IKeyStoreFile> {
      const salt = provider.generateRandomBytes(CryptoUtils.KeyStore.MIN_SALT_LENGTH).orThrow();
      const iterations = 100000;
      const derived = (await provider.deriveKey(testPassword, salt, iterations)).orThrow();
      const keyBytes = provider.generateRandomBytes(CryptoUtils.Constants.AES_256_KEY_SIZE).orThrow();
      const vault = {
        version,
        secrets: {
          'legacy-key': {
            name: 'legacy-key',
            type: 'encryption-key',
            key: provider.toBase64(keyBytes),
            createdAt: new Date().toISOString()
          }
        }
      };
      const enc = (await provider.encrypt(JSON.stringify(vault), derived)).orThrow();
      return {
        format: version,
        algorithm: 'AES-256-GCM',
        iv: provider.toBase64(enc.iv),
        authTag: provider.toBase64(enc.authTag),
        encryptedData: provider.toBase64(enc.encryptedData),
        keyDerivation: {
          kdf: 'pbkdf2',
          salt: provider.toBase64(salt),
          iterations
        }
      };
    }

    test.each(['keystore-v1', 'keystore-v2'] as const)(
      'a %s vault opens and re-saves as keystore-v3',
      async (version) => {
        const legacyFile = await buildLegacyVaultFile(version);
        expect(legacyFile.format).toBe(version);

        const ks = CryptoUtils.KeyStore.KeyStore.open({
          cryptoProvider: provider,
          keystoreFile: legacyFile
        }).orThrow();
        expect(await ks.unlock(testPassword)).toSucceed();
        expect(ks.listSecrets()).toSucceedWith(['legacy-key']);

        // Re-saving silently upgrades the on-disk format to v3.
        const resaved = (await ks.save(testPassword)).orThrow();
        expect(resaved.format).toBe('keystore-v3');
      }
    );
  });
});
