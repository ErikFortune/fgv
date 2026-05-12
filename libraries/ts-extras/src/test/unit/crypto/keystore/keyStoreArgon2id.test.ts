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
import { fail, succeed } from '@fgv/ts-utils';

import * as CryptoUtils from '../../../../packlets/crypto-utils';
import { InMemoryPrivateKeyStorage } from './inMemoryPrivateKeyStorage';

function makeDeterministicKey(
  password: Uint8Array | string,
  salt: Uint8Array,
  outputBytes: number
): Uint8Array {
  const pw = typeof password === 'string' ? password : Buffer.from(password).toString('utf-8');
  let seed = pw.split('').reduce((s, c, i) => s + c.charCodeAt(0) * (i + 1), 0);
  for (let i = 0; i < salt.length; i++) seed += salt[i] * (i + 1);
  const key = new Uint8Array(outputBytes);
  for (let i = 0; i < key.length; i++) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    key[i] = seed % 256;
  }
  return key;
}

const mockArgon2idProvider: CryptoUtils.IArgon2idProvider = {
  async argon2id(password: Uint8Array | string, salt: Uint8Array, params: CryptoUtils.IArgon2idParams) {
    return succeed(makeDeterministicKey(password, salt, params.outputBytes));
  }
};

const failingArgon2idProvider: CryptoUtils.IArgon2idProvider = {
  async argon2id() {
    return fail('argon2id unavailable');
  }
};

describe('KeyStore Argon2id methods', () => {
  const provider = CryptoUtils.nodeCryptoProvider;
  const testPassword = 'test-password-123';
  let keystore: CryptoUtils.KeyStore.KeyStore;

  beforeEach(async () => {
    keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
    await keystore.initialize(testPassword);
  });

  describe('addSecretFromPasswordArgon2id', () => {
    test('derives a key and adds it with default params', async () => {
      const result = await keystore.addSecretFromPasswordArgon2id(
        'a2-secret',
        'my-password',
        mockArgon2idProvider
      );

      expect(result).toSucceedAndSatisfy((addResult) => {
        expect(addResult.entry.name).toBe('a2-secret');
        expect(addResult.entry.type).toBe('encryption-key');
        expect(addResult.entry.key).toBeInstanceOf(Uint8Array);
        expect(addResult.entry.key.length).toBe(CryptoUtils.ARGON2ID_OWASP_MIN.outputBytes);
        expect(addResult.replaced).toBe(false);
        expect(addResult.keyDerivation.kdf).toBe('argon2id');
        expect(addResult.keyDerivation.salt).toBeDefined();
        const kd = addResult.keyDerivation as CryptoUtils.IArgon2idKeyDerivationParams;
        expect(kd.memoryKiB).toBe(CryptoUtils.ARGON2ID_OWASP_MIN.memoryKiB);
        expect(kd.iterations).toBe(CryptoUtils.ARGON2ID_OWASP_MIN.iterations);
        expect(kd.parallelism).toBe(CryptoUtils.ARGON2ID_OWASP_MIN.parallelism);
      });
    });

    test('uses custom params when supplied', async () => {
      const customParams: CryptoUtils.IArgon2idParams = {
        memoryKiB: 65536,
        iterations: 3,
        parallelism: 1,
        outputBytes: 64
      };
      const result = await keystore.addSecretFromPasswordArgon2id(
        'a2-secret',
        'my-password',
        mockArgon2idProvider,
        {
          params: customParams
        }
      );

      expect(result).toSucceedAndSatisfy((addResult) => {
        expect(addResult.entry.key.length).toBe(64);
        const kd = addResult.keyDerivation as CryptoUtils.IArgon2idKeyDerivationParams;
        expect(kd.memoryKiB).toBe(65536);
        expect(kd.iterations).toBe(3);
      });
    });

    test('adds description when supplied', async () => {
      const result = await keystore.addSecretFromPasswordArgon2id(
        'a2-secret',
        'my-password',
        mockArgon2idProvider,
        {
          description: 'Argon2id key'
        }
      );

      expect(result).toSucceedAndSatisfy((addResult) => {
        expect(addResult.entry.description).toBe('Argon2id key');
      });
    });

    test('fails when secret exists and replace not set', async () => {
      await keystore.addSecretFromPasswordArgon2id('a2-secret', 'password-1', mockArgon2idProvider);
      const result = await keystore.addSecretFromPasswordArgon2id(
        'a2-secret',
        'password-2',
        mockArgon2idProvider
      );
      expect(result).toFailWith(/already exists/i);
    });

    test('replaces when replace=true', async () => {
      await keystore.addSecretFromPasswordArgon2id('a2-secret', 'password-1', mockArgon2idProvider);
      const result = await keystore.addSecretFromPasswordArgon2id(
        'a2-secret',
        'password-2',
        mockArgon2idProvider,
        {
          replace: true
        }
      );

      expect(result).toSucceedAndSatisfy((addResult) => {
        expect(addResult.replaced).toBe(true);
      });
    });

    test('fails with empty name', async () => {
      const result = await keystore.addSecretFromPasswordArgon2id('', 'my-password', mockArgon2idProvider);
      expect(result).toFailWith(/name cannot be empty/i);
    });

    test('fails with empty password', async () => {
      const result = await keystore.addSecretFromPasswordArgon2id('a2-secret', '', mockArgon2idProvider);
      expect(result).toFailWith(/password cannot be empty/i);
    });

    test('fails when locked', async () => {
      keystore.lock(true);
      const result = await keystore.addSecretFromPasswordArgon2id(
        'a2-secret',
        'my-password',
        mockArgon2idProvider
      );
      expect(result).toFailWith(/locked/i);
    });

    test('fails when provider returns failure', async () => {
      const result = await keystore.addSecretFromPasswordArgon2id(
        'a2-secret',
        'my-password',
        failingArgon2idProvider
      );
      expect(result).toFailWith(/argon2id key derivation failed/i);
    });

    test('marks keystore as dirty', async () => {
      await keystore.save(testPassword);
      expect(keystore.isDirty).toBe(false);
      await keystore.addSecretFromPasswordArgon2id('a2-secret', 'my-password', mockArgon2idProvider);
      expect(keystore.isDirty).toBe(true);
    });

    test('replaces an existing asymmetric-keypair entry', async () => {
      const storage = new InMemoryPrivateKeyStorage();
      const ksWithStorage = CryptoUtils.KeyStore.KeyStore.create({
        cryptoProvider: provider,
        privateKeyStorage: storage
      }).orThrow();
      await ksWithStorage.initialize(testPassword);
      await ksWithStorage.addKeyPair('kp', { algorithm: 'ed25519' });

      const result = await ksWithStorage.addSecretFromPasswordArgon2id(
        'kp',
        'my-password',
        mockArgon2idProvider,
        {
          replace: true
        }
      );
      expect(result).toSucceedAndSatisfy((addResult) => {
        expect(addResult.replaced).toBe(true);
        expect(addResult.entry.type).toBe('encryption-key');
      });
    });
  });

  describe('verifySecretFromPasswordArgon2id', () => {
    test('returns true for matching password', async () => {
      const added = (
        await keystore.addSecretFromPasswordArgon2id('a2-secret', 'my-password', mockArgon2idProvider)
      ).orThrow();
      const kd = added.keyDerivation as CryptoUtils.IArgon2idKeyDerivationParams;
      const result = await keystore.verifySecretFromPasswordArgon2id(
        'a2-secret',
        'my-password',
        mockArgon2idProvider,
        kd
      );
      expect(result).toSucceedWith(true);
    });

    test('returns false for mismatched password', async () => {
      const added = (
        await keystore.addSecretFromPasswordArgon2id('a2-secret', 'my-password', mockArgon2idProvider)
      ).orThrow();
      const kd = added.keyDerivation as CryptoUtils.IArgon2idKeyDerivationParams;
      const result = await keystore.verifySecretFromPasswordArgon2id(
        'a2-secret',
        'wrong-password',
        mockArgon2idProvider,
        kd
      );
      expect(result).toSucceedWith(false);
    });

    test('returns false when salt does not match', async () => {
      const added = (
        await keystore.addSecretFromPasswordArgon2id('a2-secret', 'my-password', mockArgon2idProvider)
      ).orThrow();
      const kd = added.keyDerivation as CryptoUtils.IArgon2idKeyDerivationParams;
      const otherSalt = provider.generateRandomBytes(16).orThrow();
      const result = await keystore.verifySecretFromPasswordArgon2id(
        'a2-secret',
        'my-password',
        mockArgon2idProvider,
        {
          ...kd,
          salt: CryptoUtils.toBase64(otherSalt)
        }
      );
      expect(result).toSucceedWith(false);
    });

    test('fails when locked', async () => {
      const added = (
        await keystore.addSecretFromPasswordArgon2id('a2-secret', 'my-password', mockArgon2idProvider)
      ).orThrow();
      const kd = added.keyDerivation as CryptoUtils.IArgon2idKeyDerivationParams;
      keystore.lock(true);
      const result = await keystore.verifySecretFromPasswordArgon2id(
        'a2-secret',
        'my-password',
        mockArgon2idProvider,
        kd
      );
      expect(result).toFailWith(/locked/i);
    });

    test('fails with empty password', async () => {
      const added = (
        await keystore.addSecretFromPasswordArgon2id('a2-secret', 'my-password', mockArgon2idProvider)
      ).orThrow();
      const kd = added.keyDerivation as CryptoUtils.IArgon2idKeyDerivationParams;
      const result = await keystore.verifySecretFromPasswordArgon2id(
        'a2-secret',
        '',
        mockArgon2idProvider,
        kd
      );
      expect(result).toFailWith(/password cannot be empty/i);
    });

    test('fails when secret does not exist', async () => {
      const result = await keystore.verifySecretFromPasswordArgon2id('missing', 'pw', mockArgon2idProvider, {
        kdf: 'argon2id',
        salt: CryptoUtils.toBase64(provider.generateRandomBytes(16).orThrow()),
        memoryKiB: 19456,
        iterations: 2,
        parallelism: 1
      });
      expect(result).toFailWith(/not found/i);
    });

    test('rejects api-key entries', async () => {
      const salt = provider.generateRandomBytes(16).orThrow();
      const fakeKey = new Uint8Array(32).fill(0xab);
      await keystore.importSecret('api-key-entry', fakeKey, { type: 'api-key' });
      const result = await keystore.verifySecretFromPasswordArgon2id(
        'api-key-entry',
        'pw',
        mockArgon2idProvider,
        {
          kdf: 'argon2id',
          salt: CryptoUtils.toBase64(salt),
          memoryKiB: 19456,
          iterations: 2,
          parallelism: 1
        }
      );
      expect(result).toFailWith(/not a password-verifiable encryption key/i);
    });

    test('fails for asymmetric-keypair entries', async () => {
      const storage = new InMemoryPrivateKeyStorage();
      const ksWithStorage = CryptoUtils.KeyStore.KeyStore.create({
        cryptoProvider: provider,
        privateKeyStorage: storage
      }).orThrow();
      await ksWithStorage.initialize(testPassword);
      await ksWithStorage.addKeyPair('kp', { algorithm: 'ed25519' });

      const result = await ksWithStorage.verifySecretFromPasswordArgon2id(
        'kp',
        'anything',
        mockArgon2idProvider,
        {
          kdf: 'argon2id',
          salt: CryptoUtils.toBase64(provider.generateRandomBytes(16).orThrow()),
          memoryKiB: 19456,
          iterations: 2,
          parallelism: 1
        }
      );
      expect(result).toFailWith(/not a password-verifiable encryption key/i);
    });

    test('fails with invalid base64 salt', async () => {
      await keystore.addSecretFromPasswordArgon2id('a2-secret', 'my-password', mockArgon2idProvider);
      const result = await keystore.verifySecretFromPasswordArgon2id(
        'a2-secret',
        'my-password',
        mockArgon2idProvider,
        {
          kdf: 'argon2id',
          salt: '!!!not-base64!!!',
          memoryKiB: 19456,
          iterations: 2,
          parallelism: 1
        }
      );
      expect(result).toFailWith(/invalid salt/i);
    });

    test('fails when provider returns failure', async () => {
      const added = (
        await keystore.addSecretFromPasswordArgon2id('a2-secret', 'my-password', mockArgon2idProvider)
      ).orThrow();
      const kd = added.keyDerivation as CryptoUtils.IArgon2idKeyDerivationParams;
      const result = await keystore.verifySecretFromPasswordArgon2id(
        'a2-secret',
        'my-password',
        failingArgon2idProvider,
        kd
      );
      expect(result).toFailWith(/argon2id key derivation failed/i);
    });
  });
});
