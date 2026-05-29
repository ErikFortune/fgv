/*
 * Copyright (c) 2026 Erik Fortune
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

import { IDBFactory } from 'fake-indexeddb';
import { CryptoUtils } from '@fgv/ts-extras';
import { BrowserCryptoProvider, IdbPrivateKeyStorage } from '../../packlets/crypto-utils';

// jsdom's test environment does not provide structuredClone, which fake-indexeddb
// uses to clone values for storage. CryptoKey is immutable, so an identity clone
// is a sufficient stand-in for these tests; real browsers provide the genuine
// (deep) structuredClone that the implementation relies on.
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (<T>(value: T): T => value) as typeof globalThis.structuredClone;
}

const provider = new BrowserCryptoProvider();
const encoder = new TextEncoder();
const testPassword = 'test-password-123';

function makeStorage(factory: IDBFactory = new IDBFactory()): IdbPrivateKeyStorage {
  return IdbPrivateKeyStorage.create({ indexedDB: factory }).orThrow();
}

async function makeSigningKey(): Promise<CryptoKey> {
  const pair = (await provider.generateKeyPair('ed25519', false)).orThrow();
  return pair.privateKey;
}

describe('IdbPrivateKeyStorage', () => {
  describe('create', () => {
    test('reports supportsNonExtractable: true', () => {
      expect(makeStorage().supportsNonExtractable).toBe(true);
    });

    test('succeeds with an explicit factory and custom names', () => {
      expect(
        IdbPrivateKeyStorage.create({
          indexedDB: new IDBFactory(),
          databaseName: 'custom-db',
          storeName: 'custom-store'
        })
      ).toSucceed();
    });

    test('fails when no IndexedDB factory is available', () => {
      // jsdom does not implement indexedDB, so globalThis.indexedDB is undefined here.
      expect(IdbPrivateKeyStorage.create()).toFailWith(/no IndexedDB factory available/);
    });
  });

  describe('store/load round-trip', () => {
    test('stores a CryptoKey and loads it back usably', async () => {
      const storage = makeStorage();
      const pair = (await provider.generateKeyPair('ed25519', false)).orThrow();
      expect(await storage.store('signing', pair.privateKey)).toSucceedWith('signing');

      const loaded = (await storage.load('signing')).orThrow();
      const data = encoder.encode('hello');
      const signature = (await provider.sign(loaded, data)).orThrow();
      expect(await provider.verify(pair.publicKey, signature, data)).toSucceedWith(true);
    });

    test('overwrites an existing entry on a second store', async () => {
      const storage = makeStorage();
      const first = await makeSigningKey();
      const second = await makeSigningKey();
      await storage.store('dup', first);
      await storage.store('dup', second);

      const loaded = (await storage.load('dup')).orThrow();
      expect(loaded.algorithm.name).toBe('Ed25519');
      expect(await storage.list()).toSucceedWith(['dup']);
    });

    test('reuses the cached database connection across operations', async () => {
      const storage = makeStorage();
      const key = await makeSigningKey();
      await storage.store('a', key);
      // second operation hits the cached _db
      expect(await storage.load('a')).toSucceed();
    });
  });

  describe('load', () => {
    test('fails for a missing id', async () => {
      const storage = makeStorage();
      expect(await storage.load('nope')).toFailWith(/key not found: 'nope'/);
    });
  });

  describe('delete', () => {
    test('deletes a stored key and removes it from the listing', async () => {
      const storage = makeStorage();
      const key = await makeSigningKey();
      await storage.store('a', key);
      await storage.store('b', key);

      expect(await storage.delete('a')).toSucceedWith('a');
      expect(await storage.list()).toSucceedWith(['b']);
      expect(await storage.load('a')).toFailWith(/key not found/);
    });

    test('fails for a missing id', async () => {
      const storage = makeStorage();
      expect(await storage.delete('nope')).toFailWith(/key not found: 'nope'/);
    });
  });

  describe('list', () => {
    test('returns an empty array for a fresh store', async () => {
      const storage = makeStorage();
      expect(await storage.list()).toSucceedWith([]);
    });

    test('reflects stores and deletes', async () => {
      const storage = makeStorage();
      const key = await makeSigningKey();
      await storage.store('one', key);
      await storage.store('two', key);
      await storage.store('three', key);
      await storage.delete('two');

      expect(await storage.list()).toSucceedAndSatisfy((ids) => {
        expect([...ids].sort()).toEqual(['one', 'three']);
      });
    });
  });

  describe('schema persistence', () => {
    test('a second instance reads keys written by the first (same db/store)', async () => {
      const factory = new IDBFactory();
      const writer = makeStorage(factory);
      const key = await makeSigningKey();
      await writer.store('shared', key);

      const reader = makeStorage(factory);
      expect(await reader.load('shared')).toSucceedAndSatisfy((loaded) => {
        expect(loaded.algorithm.name).toBe('Ed25519');
      });
    });
  });

  describe('KeyStore integration', () => {
    test('drives addKeyPair → getKeyPair → sign/verify end-to-end', async () => {
      const storage = makeStorage();
      const keystore = CryptoUtils.KeyStore.KeyStore.create({
        cryptoProvider: provider,
        privateKeyStorage: storage
      }).orThrow();
      await keystore.initialize(testPassword);

      const added = (await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' })).orThrow();
      const loaded = (await keystore.getKeyPair('signing')).orThrow();
      // supportsNonExtractable: true → the keystore minted a non-extractable private key.
      expect(loaded.privateKey.extractable).toBe(false);

      const data = encoder.encode('integration');
      const signature = (await provider.sign(loaded.privateKey, data)).orThrow();
      expect(await provider.verify(loaded.publicKey, signature, data)).toSucceedWith(true);

      expect(await storage.list()).toSucceedWith([added.entry.id]);
    });
  });
});
