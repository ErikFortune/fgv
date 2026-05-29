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

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';
import { FileTree } from '@fgv/ts-json-base';
import * as CryptoUtils from '../../../../packlets/crypto-utils';

const EncryptedFilePrivateKeyStorage = CryptoUtils.KeyStore.EncryptedFilePrivateKeyStorage;
const createEncryptedFile = CryptoUtils.createEncryptedFile;
const provider = CryptoUtils.nodeCryptoProvider;
const encoder = new TextEncoder();
const testPassword = 'test-password-123';

function makeKey(): Uint8Array {
  return provider.generateRandomBytes(32).orThrow();
}

function makeTree(): FileTree.IFileTreeDirectoryItem {
  return FileTree.inMemory([], { mutable: true })
    .onSuccess((tree) => tree.getDirectory('/'))
    .orThrow();
}

function makeStorage(
  encryptionKey: Uint8Array = makeKey(),
  tree: FileTree.IFileTreeDirectoryItem = makeTree()
): CryptoUtils.KeyStore.EncryptedFilePrivateKeyStorage {
  return EncryptedFilePrivateKeyStorage.create({
    directory: '/keys',
    encryptionKey,
    cryptoProvider: provider,
    tree
  }).orThrow();
}

describe('EncryptedFilePrivateKeyStorage', () => {
  describe('create', () => {
    test('fails when the encryption key is not 32 bytes', () => {
      expect(
        EncryptedFilePrivateKeyStorage.create({
          directory: '/keys',
          encryptionKey: new Uint8Array(16),
          cryptoProvider: provider,
          tree: makeTree()
        })
      ).toFailWith(/must be 32 bytes, got 16/);
    });

    test('succeeds with a supplied tree', () => {
      expect(
        EncryptedFilePrivateKeyStorage.create({
          directory: '/keys',
          encryptionKey: makeKey(),
          cryptoProvider: provider,
          tree: makeTree()
        })
      ).toSucceed();
    });

    test('fails when the filesystem directory cannot be opened', () => {
      expect(
        EncryptedFilePrivateKeyStorage.create({
          directory: path.join(os.tmpdir(), 'fgv-does-not-exist-xyz', 'nope'),
          encryptionKey: makeKey(),
          cryptoProvider: provider
        })
      ).toFailWith(/failed to open/i);
    });
  });

  describe('store/load round-trip', () => {
    test('signs and verifies with an ecdsa-p256 key loaded from disk', async () => {
      const storage = makeStorage();
      const pair = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();
      expect(await storage.store('signing', pair.privateKey)).toSucceedWith('signing');

      const loaded = (await storage.load('signing')).orThrow();
      const data = encoder.encode('hello');
      const signature = (await provider.sign(loaded, data)).orThrow();
      expect(await provider.verify(pair.publicKey, signature, data)).toSucceedWith(true);
    });

    test('signs and verifies with an ed25519 key loaded from disk', async () => {
      const storage = makeStorage();
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
      await storage.store('ed', pair.privateKey);

      const loaded = (await storage.load('ed')).orThrow();
      const data = encoder.encode('payload');
      const signature = (await provider.sign(loaded, data)).orThrow();
      expect(await provider.verify(pair.publicKey, signature, data)).toSucceedWith(true);
    });

    test.each([['rsa-oaep-2048'], ['ecdh-p256'], ['x25519']] as const)(
      'round-trips a %s private key',
      async (algorithm) => {
        const storage = makeStorage();
        const pair = (await provider.generateKeyPair(algorithm, true)).orThrow();
        await storage.store('k', pair.privateKey);
        expect(await storage.load('k')).toSucceedAndSatisfy((loaded) => {
          expect(loaded.type).toBe('private');
        });
      }
    );

    test('overwrites an existing entry on a second store', async () => {
      const storage = makeStorage();
      const first = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();
      const second = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();
      await storage.store('dup', first.privateKey);
      await storage.store('dup', second.privateKey);

      const loaded = (await storage.load('dup')).orThrow();
      const data = encoder.encode('x');
      const signature = (await provider.sign(loaded, data)).orThrow();
      expect(await provider.verify(second.publicKey, signature, data)).toSucceedWith(true);
      expect(await provider.verify(first.publicKey, signature, data)).toSucceedWith(false);
    });

    test('round-trips against a real filesystem directory', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgv-pks-'));
      try {
        const storage = EncryptedFilePrivateKeyStorage.create({
          directory: dir,
          encryptionKey: makeKey(),
          cryptoProvider: provider
        }).orThrow();
        const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
        await storage.store('fskey', pair.privateKey);

        expect(fs.readdirSync(dir)).toContain('fskey.json');
        const loaded = (await storage.load('fskey')).orThrow();
        const data = encoder.encode('fs');
        const signature = (await provider.sign(loaded, data)).orThrow();
        expect(await provider.verify(pair.publicKey, signature, data)).toSucceedWith(true);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('store failures', () => {
    test('rejects a key whose algorithm is not an asymmetric keypair algorithm', async () => {
      const storage = makeStorage();
      const aesKey = await crypto.webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
        'encrypt',
        'decrypt'
      ]);
      expect(await storage.store('aes', aesKey)).toFailWith(/unsupported key algorithm 'AES-GCM'/);
    });

    test.each([['../evil'], ['a/b'], ['.'], ['..'], [''], ['has space']])(
      'rejects unsafe id %p',
      async (id) => {
        const storage = makeStorage();
        const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
        expect(await storage.store(id, pair.privateKey)).toFailWith(/invalid storage id/);
      }
    );

    test('fails to export a non-extractable key to JWK', async () => {
      const storage = makeStorage();
      const pair = (await provider.generateKeyPair('ed25519', false)).orThrow();
      expect(await storage.store('k', pair.privateKey)).toFailWith(/failed to export private key 'k' to JWK/);
    });

    test('store fails when the backing tree rejects writes', async () => {
      const storage = makeStorage(
        makeKey(),
        FileTree.inMemory([])
          .onSuccess((t) => t.getDirectory('/'))
          .orThrow()
      );
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
      expect(await storage.store('k', pair.privateKey)).toFailWith(/mutab/i);
    });
  });

  describe('load failures', () => {
    test('fails for a missing id', async () => {
      const storage = makeStorage();
      expect(await storage.load('nope')).toFailWith(/key not found: 'nope'/);
    });

    test('rejects an unsafe id', async () => {
      const storage = makeStorage();
      expect(await storage.load('../evil')).toFailWith(/invalid storage id/);
    });

    test('fails when the file is not an encrypted-file envelope', async () => {
      const tree = makeTree();
      const storage = makeStorage(makeKey(), tree);
      (tree as FileTree.IMutableFileTreeDirectoryItem)
        .createChildFile('corrupt.json', JSON.stringify({ not: 'an encrypted file' }))
        .orThrow();
      expect(await storage.load('corrupt')).toFailWith(/failed to decrypt private key 'corrupt'/);
    });

    test('fails to decrypt when the encryption key is wrong', async () => {
      const tree = makeTree();
      const writer = makeStorage(makeKey(), tree);
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
      await writer.store('k', pair.privateKey);

      const reader = makeStorage(makeKey(), tree);
      expect(await reader.load('k')).toFailWith(/failed to decrypt/i);
    });

    test('fails when the decrypted envelope has an unknown algorithm', async () => {
      const key = makeKey();
      const tree = makeTree();
      const storage = makeStorage(key, tree);
      const badEnvelope = (
        await createEncryptedFile({
          content: { algorithm: 'not-an-algorithm', jwk: '{}' },
          secretName: 'bad',
          key,
          cryptoProvider: provider
        })
      ).orThrow();
      (tree as FileTree.IMutableFileTreeDirectoryItem)
        .createChildFile('bad.json', JSON.stringify(badEnvelope))
        .orThrow();

      expect(await storage.load('bad')).toFailWith(/failed to decrypt.*not-an-algorithm|invalid enumerated/i);
    });

    test('fails when the decrypted JWK cannot be imported', async () => {
      const key = makeKey();
      const tree = makeTree();
      const storage = makeStorage(key, tree);
      const badEnvelope = (
        await createEncryptedFile({
          content: { algorithm: 'ecdsa-p256', jwk: '{}' },
          secretName: 'badkey',
          key,
          cryptoProvider: provider
        })
      ).orThrow();
      (tree as FileTree.IMutableFileTreeDirectoryItem)
        .createChildFile('badkey.json', JSON.stringify(badEnvelope))
        .orThrow();

      expect(await storage.load('badkey')).toFailWith(/failed to import private key/i);
    });
  });

  describe('delete', () => {
    test('deletes a stored key and removes it from the listing', async () => {
      const storage = makeStorage();
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
      await storage.store('a', pair.privateKey);
      await storage.store('b', pair.privateKey);

      expect(await storage.delete('a')).toSucceedWith('a');
      expect(await storage.list()).toSucceedWith(['b']);
      expect(await storage.load('a')).toFailWith(/key not found/);
    });

    test('fails for a missing id', async () => {
      const storage = makeStorage();
      expect(await storage.delete('nope')).toFailWith(/key not found: 'nope'/);
    });

    test('rejects an unsafe id', async () => {
      const storage = makeStorage();
      expect(await storage.delete('../evil')).toFailWith(/invalid storage id/);
    });
  });

  describe('list', () => {
    test('returns an empty array for a fresh store', async () => {
      const storage = makeStorage();
      expect(await storage.list()).toSucceedWith([]);
    });

    test('reflects stores and deletes', async () => {
      const storage = makeStorage();
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
      await storage.store('one', pair.privateKey);
      await storage.store('two', pair.privateKey);
      await storage.store('three', pair.privateKey);
      await storage.delete('two');

      expect(await storage.list()).toSucceedAndSatisfy((ids) => {
        expect([...ids].sort()).toEqual(['one', 'three']);
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
      expect(storage.supportsNonExtractable).toBe(false);

      const loaded = (await keystore.getKeyPair('signing')).orThrow();
      const data = encoder.encode('integration');
      const signature = (await provider.sign(loaded.privateKey, data)).orThrow();
      expect(await provider.verify(loaded.publicKey, signature, data)).toSucceedWith(true);

      // The minted storage id is a UUID handle, present in the backend listing.
      expect(await storage.list()).toSucceedWith([added.entry.id]);
    });
  });
});
