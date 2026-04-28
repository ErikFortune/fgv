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

describe('KeyStore', () => {
  const provider = CryptoUtils.nodeCryptoProvider;
  const testPassword = 'test-password-123';

  describe('create', () => {
    test('creates a new locked key store', () => {
      const result = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider });

      expect(result).toSucceedAndSatisfy((keystore) => {
        expect(keystore.isUnlocked).toBe(false);
        expect(keystore.state).toBe('locked');
        expect(keystore.isDirty).toBe(false);
        expect(keystore.isNew).toBe(true);
        expect(keystore.cryptoProvider).toBe(provider);
      });
    });

    test('uses default iterations when not specified', () => {
      const result = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider });
      expect(result).toSucceed();
    });

    test('accepts custom iterations', () => {
      const result = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider, iterations: 100000 });
      expect(result).toSucceed();
    });

    test('fails with invalid iterations', () => {
      expect(CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider, iterations: 0 })).toFailWith(
        /at least 1/
      );
      expect(CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider, iterations: -1 })).toFailWith(
        /at least 1/
      );
    });
  });

  describe('initialize', () => {
    test('initializes new key store with password', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();

      const result = await keystore.initialize(testPassword);

      expect(result).toSucceedAndSatisfy((ks) => {
        expect(ks.isUnlocked).toBe(true);
        expect(ks.state).toBe('unlocked');
        expect(ks.isDirty).toBe(true); // New store needs to be saved
      });
    });

    test('fails with empty password', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();

      const result = await keystore.initialize('');
      expect(result).toFailWith(/password cannot be empty/i);
    });

    test('fails if already initialized', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);

      const result = await keystore.initialize('another-password');
      expect(result).toFailWith(/already initialized/i);
    });
  });

  describe('secret management', () => {
    let keystore: CryptoUtils.KeyStore.KeyStore;
    beforeEach(async () => {
      keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
    });

    describe('addSecret', () => {
      test('adds a new secret with generated key', async () => {
        const result = await keystore.addSecret('my-secret');

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.name).toBe('my-secret');
          expect(addResult.entry.key).toBeInstanceOf(Uint8Array);
          expect(addResult.entry.key.length).toBe(CryptoUtils.Constants.AES_256_KEY_SIZE);
          expect(addResult.entry.createdAt).toBeDefined();
          expect(addResult.replaced).toBe(false);
        });
      });

      test('adds secret with description', async () => {
        const result = await keystore.addSecret('my-secret', { description: 'A test secret' });

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.description).toBe('A test secret');
        });
      });

      test('replaces existing secret with same name', async () => {
        await keystore.addSecret('my-secret', { description: 'First' });
        const result = await keystore.addSecret('my-secret', { description: 'Second' });

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.replaced).toBe(true);
          expect(addResult.entry.description).toBe('Second');
        });
      });

      test('fails with empty name', async () => {
        const result = await keystore.addSecret('');
        expect(result).toFailWith(/name cannot be empty/i);
      });

      test('fails when locked', async () => {
        keystore.lock(true);

        const result = await keystore.addSecret('my-secret');
        expect(result).toFailWith(/locked/i);
      });
    });

    describe('importSecret', () => {
      test('imports an existing key', async () => {
        const key = (await provider.generateKey()).orThrow();
        const result = await keystore.importSecret('imported-secret', key);

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.name).toBe('imported-secret');
          expect(addResult.entry.key).toEqual(key);
          expect(addResult.replaced).toBe(false);
        });
      });

      test('imports with description', async () => {
        const key = (await provider.generateKey()).orThrow();
        const result = await keystore.importSecret('imported-secret', key, { description: 'Imported key' });

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.description).toBe('Imported key');
        });
      });

      test('fails when secret exists and replace not set', async () => {
        const key1 = (await provider.generateKey()).orThrow();
        const key2 = (await provider.generateKey()).orThrow();

        await keystore.importSecret('my-secret', key1);
        const result = await keystore.importSecret('my-secret', key2);

        expect(result).toFailWith(/already exists/i);
      });

      test('replaces when replace=true', async () => {
        const key1 = (await provider.generateKey()).orThrow();
        const key2 = (await provider.generateKey()).orThrow();

        await keystore.importSecret('my-secret', key1);
        const result = await keystore.importSecret('my-secret', key2, { replace: true });

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.replaced).toBe(true);
          expect(addResult.entry.key).toEqual(key2);
        });
      });

      test('fails with wrong key size', async () => {
        const shortKey = new Uint8Array(16);
        const result = await keystore.importSecret('my-secret', shortKey);

        expect(result).toFailWith(/32 bytes/);
      });

      test('fails with empty name', async () => {
        const key = (await provider.generateKey()).orThrow();
        const result = await keystore.importSecret('', key);

        expect(result).toFailWith(/name cannot be empty/i);
      });

      test('fails when locked', async () => {
        const key = (await provider.generateKey()).orThrow();
        keystore.lock(true);

        const result = await keystore.importSecret('my-secret', key);
        expect(result).toFailWith(/locked/i);
      });

      test('defaults to encryption-key type when type not specified', async () => {
        const key = (await provider.generateKey()).orThrow();
        const result = await keystore.importSecret('imported-secret', key);

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.type).toBe('encryption-key');
        });
      });

      test('stores specified type classification', async () => {
        const key = (await provider.generateKey()).orThrow();
        const result = await keystore.importSecret('imported-secret', key, { type: 'encryption-key' });

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.type).toBe('encryption-key');
        });
      });

      test('type classification integrates with listSecretsByType', async () => {
        const key1 = (await provider.generateKey()).orThrow();
        const key2 = (await provider.generateKey()).orThrow();
        await keystore.importSecret('secret-a', key1); // defaults to 'encryption-key'
        await keystore.importSecret('secret-b', key2, { type: 'encryption-key' });

        expect(keystore.listSecretsByType('encryption-key')).toSucceedAndSatisfy((names) => {
          expect(names).toContain('secret-a');
          expect(names).toContain('secret-b');
        });
      });

      test('type does not affect 32-byte key validation', async () => {
        const shortKey = new Uint8Array(16);
        const result = await keystore.importSecret('my-secret', shortKey, { type: 'encryption-key' });

        expect(result).toFailWith(/32 bytes/);
      });

      test('type works with description and replace options', async () => {
        const key1 = (await provider.generateKey()).orThrow();
        const key2 = (await provider.generateKey()).orThrow();

        await keystore.importSecret('my-secret', key1, { type: 'encryption-key', description: 'first' });
        const result = await keystore.importSecret('my-secret', key2, {
          type: 'encryption-key',
          description: 'replaced',
          replace: true
        });

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.type).toBe('encryption-key');
          expect(addResult.entry.description).toBe('replaced');
          expect(addResult.replaced).toBe(true);
        });
      });
    });

    describe('addSecretFromPassword', () => {
      test('derives a key from password and adds it', async () => {
        const result = await keystore.addSecretFromPassword('pw-secret', 'my-password');

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.name).toBe('pw-secret');
          expect(addResult.entry.key).toBeInstanceOf(Uint8Array);
          expect(addResult.entry.key.length).toBe(CryptoUtils.Constants.AES_256_KEY_SIZE);
          expect(addResult.entry.createdAt).toBeDefined();
          expect(addResult.replaced).toBe(false);
          expect(addResult.keyDerivation).toBeDefined();
          expect(addResult.keyDerivation.kdf).toBe('pbkdf2');
          expect(addResult.keyDerivation.salt).toBeDefined();
          expect(addResult.keyDerivation.iterations).toBe(CryptoUtils.KeyStore.DEFAULT_SECRET_ITERATIONS);
        });
      });

      test('adds secret with custom iterations', async () => {
        const result = await keystore.addSecretFromPassword('pw-secret', 'my-password', {
          iterations: 100000
        });

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.keyDerivation.iterations).toBe(100000);
        });
      });

      test('adds secret with description', async () => {
        const result = await keystore.addSecretFromPassword('pw-secret', 'my-password', {
          description: 'Password-derived key'
        });

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.description).toBe('Password-derived key');
        });
      });

      test('fails when secret exists and replace not set', async () => {
        await keystore.addSecretFromPassword('pw-secret', 'password-1');
        const result = await keystore.addSecretFromPassword('pw-secret', 'password-2');

        expect(result).toFailWith(/already exists/i);
      });

      test('replaces when replace=true', async () => {
        await keystore.addSecretFromPassword('pw-secret', 'password-1');
        const result = await keystore.addSecretFromPassword('pw-secret', 'password-2', { replace: true });

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.replaced).toBe(true);
        });
      });

      test('fails with empty name', async () => {
        const result = await keystore.addSecretFromPassword('', 'my-password');
        expect(result).toFailWith(/name cannot be empty/i);
      });

      test('fails with empty password', async () => {
        const result = await keystore.addSecretFromPassword('pw-secret', '');
        expect(result).toFailWith(/password cannot be empty/i);
      });

      test('fails when locked', async () => {
        keystore.lock(true);
        const result = await keystore.addSecretFromPassword('pw-secret', 'my-password');
        expect(result).toFailWith(/locked/i);
      });

      test('derived key is deterministic with same salt and iterations', async () => {
        // Derive a key and then verify we can re-derive the same key
        const addResult = (await keystore.addSecretFromPassword('pw-secret', 'my-password')).orThrow();
        const originalKey = addResult.entry.key;
        const { salt, iterations } = addResult.keyDerivation;

        // Re-derive with the same params
        const saltBytes = CryptoUtils.fromBase64(salt);
        const reDerived = (await provider.deriveKey('my-password', saltBytes, iterations)).orThrow();

        expect(reDerived).toEqual(originalKey);
      });

      test('marks keystore as dirty', async () => {
        // Save to clear dirty flag from initialization
        await keystore.save(testPassword);
        expect(keystore.isDirty).toBe(false);
        await keystore.addSecretFromPassword('pw-secret', 'my-password');
        expect(keystore.isDirty).toBe(true);
      });
    });

    describe('getSecret', () => {
      test('retrieves an existing secret', async () => {
        await keystore.addSecret('my-secret', { description: 'Test' });

        const result = keystore.getSecret('my-secret');

        expect(result).toSucceedAndSatisfy((entry) => {
          expect(entry.name).toBe('my-secret');
          expect(entry.description).toBe('Test');
        });
      });

      test('fails for non-existent secret', () => {
        const result = keystore.getSecret('non-existent');
        expect(result).toFailWith(/not found/i);
      });

      test('fails when locked', () => {
        keystore.lock(true);
        const result = keystore.getSecret('my-secret');
        expect(result).toFailWith(/locked/i);
      });
    });

    describe('hasSecret', () => {
      test('returns true for existing secret', async () => {
        await keystore.addSecret('my-secret');

        const result = keystore.hasSecret('my-secret');
        expect(result).toSucceedWith(true);
      });

      test('returns false for non-existent secret', () => {
        const result = keystore.hasSecret('non-existent');
        expect(result).toSucceedWith(false);
      });

      test('fails when locked', () => {
        keystore.lock(true);
        const result = keystore.hasSecret('my-secret');
        expect(result).toFailWith(/locked/i);
      });
    });

    describe('listSecrets', () => {
      test('returns empty list when no secrets', () => {
        const result = keystore.listSecrets();
        expect(result).toSucceedWith([]);
      });

      test('returns all secret names', async () => {
        await keystore.addSecret('secret-1');
        await keystore.addSecret('secret-2');
        await keystore.addSecret('secret-3');

        const result = keystore.listSecrets();
        expect(result).toSucceedAndSatisfy((names) => {
          expect(names).toHaveLength(3);
          expect(names).toContain('secret-1');
          expect(names).toContain('secret-2');
          expect(names).toContain('secret-3');
        });
      });

      test('fails when locked', () => {
        keystore.lock(true);
        const result = keystore.listSecrets();
        expect(result).toFailWith(/locked/i);
      });
    });

    describe('removeSecret', () => {
      test('removes an existing secret', async () => {
        await keystore.addSecret('my-secret', { description: 'Test' });

        const result = await keystore.removeSecret('my-secret');

        expect(result).toSucceedAndSatisfy(({ entry, warning }) => {
          expect(entry.name).toBe('my-secret');
          expect(warning).toBeUndefined();
        });

        expect(keystore.hasSecret('my-secret')).toSucceedWith(false);
      });

      test('fails for non-existent secret', async () => {
        const result = await keystore.removeSecret('non-existent');
        expect(result).toFailWith(/not found/i);
      });

      test('fails when locked', async () => {
        keystore.lock(true);
        const result = await keystore.removeSecret('my-secret');
        expect(result).toFailWith(/locked/i);
      });
    });

    describe('renameSecret', () => {
      test('renames an existing secret', async () => {
        await keystore.addSecret('old-name', { description: 'Test' });

        const result = keystore.renameSecret('old-name', 'new-name');

        expect(result).toSucceedAndSatisfy((entry) => {
          expect(entry.name).toBe('new-name');
          expect(entry.description).toBe('Test');
        });

        expect(keystore.hasSecret('old-name')).toSucceedWith(false);
        expect(keystore.hasSecret('new-name')).toSucceedWith(true);
      });

      test('fails for non-existent source', () => {
        const result = keystore.renameSecret('non-existent', 'new-name');
        expect(result).toFailWith(/not found/i);
      });

      test('fails if target exists', async () => {
        await keystore.addSecret('source');
        await keystore.addSecret('target');

        const result = keystore.renameSecret('source', 'target');
        expect(result).toFailWith(/already exists/i);
      });

      test('allows renaming to same name', async () => {
        await keystore.addSecret('my-secret');

        const result = keystore.renameSecret('my-secret', 'my-secret');
        expect(result).toSucceed();
      });

      test('fails with empty new name', async () => {
        await keystore.addSecret('my-secret');

        const result = keystore.renameSecret('my-secret', '');
        expect(result).toFailWith(/cannot be empty/i);
      });

      test('fails when locked', () => {
        keystore.lock(true);
        const result = keystore.renameSecret('old', 'new');
        expect(result).toFailWith(/locked/i);
      });
    });

    describe('importApiKey', () => {
      test('imports an API key string', async () => {
        const result = await keystore.importApiKey('my-api-key', 'sk-abc123');

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.name).toBe('my-api-key');
          expect(addResult.entry.type).toBe('api-key');
          expect(addResult.entry.key).toBeInstanceOf(Uint8Array);
          expect(addResult.entry.createdAt).toBeDefined();
          expect(addResult.replaced).toBe(false);
        });
      });

      test('imports with description', async () => {
        const result = await keystore.importApiKey('my-api-key', 'sk-abc123', {
          description: 'OpenAI key'
        });

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.description).toBe('OpenAI key');
        });
      });

      test('fails when secret exists and replace not set', async () => {
        await keystore.importApiKey('my-api-key', 'sk-abc123');
        const result = await keystore.importApiKey('my-api-key', 'sk-def456');

        expect(result).toFailWith(/already exists/i);
      });

      test('replaces when replace=true', async () => {
        await keystore.importApiKey('my-api-key', 'sk-abc123');
        const result = await keystore.importApiKey('my-api-key', 'sk-def456', { replace: true });

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.replaced).toBe(true);
        });
      });

      test('fails with empty name', async () => {
        const result = await keystore.importApiKey('', 'sk-abc123');
        expect(result).toFailWith(/name cannot be empty/i);
      });

      test('fails with empty API key', async () => {
        const result = await keystore.importApiKey('my-api-key', '');
        expect(result).toFailWith(/api key cannot be empty/i);
      });

      test('fails when locked', async () => {
        keystore.lock(true);
        const result = await keystore.importApiKey('my-api-key', 'sk-abc123');
        expect(result).toFailWith(/locked/i);
      });
    });

    describe('getApiKey', () => {
      test('retrieves an imported API key', async () => {
        await keystore.importApiKey('my-api-key', 'sk-abc123');

        const result = keystore.getApiKey('my-api-key');
        expect(result).toSucceedWith('sk-abc123');
      });

      test('fails for non-existent secret', () => {
        const result = keystore.getApiKey('non-existent');
        expect(result).toFailWith(/not found/i);
      });

      test('fails for non-api-key type secret', async () => {
        await keystore.addSecret('encryption-secret');

        const result = keystore.getApiKey('encryption-secret');
        expect(result).toFailWith(/not an API key/i);
      });

      test('fails when locked', () => {
        keystore.lock(true);
        const result = keystore.getApiKey('my-api-key');
        expect(result).toFailWith(/locked/i);
      });
    });

    describe('listSecretsByType', () => {
      test('returns only secrets of the specified type', async () => {
        await keystore.addSecret('enc-key-1');
        await keystore.addSecret('enc-key-2');
        await keystore.importApiKey('api-key-1', 'sk-abc');
        await keystore.importApiKey('api-key-2', 'sk-def');

        expect(keystore.listSecretsByType('api-key')).toSucceedAndSatisfy((names) => {
          expect(names).toHaveLength(2);
          expect(names).toContain('api-key-1');
          expect(names).toContain('api-key-2');
        });

        expect(keystore.listSecretsByType('encryption-key')).toSucceedAndSatisfy((names) => {
          expect(names).toHaveLength(2);
          expect(names).toContain('enc-key-1');
          expect(names).toContain('enc-key-2');
        });
      });

      test('returns empty array when no secrets match', () => {
        const result = keystore.listSecretsByType('api-key');
        expect(result).toSucceedWith([]);
      });

      test('fails when locked', () => {
        keystore.lock(true);
        const result = keystore.listSecretsByType('api-key');
        expect(result).toFailWith(/locked/i);
      });
    });
  });

  describe('lock/unlock', () => {
    test('lock clears secrets from memory', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret');

      // Save first to avoid dirty check
      await keystore.save(testPassword);

      const lockResult = keystore.lock();

      expect(lockResult).toSucceed();
      expect(keystore.isUnlocked).toBe(false);
      expect(keystore.listSecrets()).toFailWith(/locked/i);
    });

    test('lock fails with unsaved changes', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret');

      const result = keystore.lock();

      expect(result).toFailWith(/unsaved changes/i);
    });

    test('lock with force discards changes', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret');

      const result = keystore.lock(true);

      expect(result).toSucceed();
      expect(keystore.isUnlocked).toBe(false);
    });

    test('lock is idempotent', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.save(testPassword);

      keystore.lock();
      const result = keystore.lock();

      expect(result).toSucceed();
    });
  });

  describe('save and open', () => {
    test('save returns encrypted key store file', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret', { description: 'Test secret' });

      const result = await keystore.save(testPassword);

      expect(result).toSucceedAndSatisfy((file) => {
        expect(file.format).toBe(CryptoUtils.KeyStore.KEYSTORE_FORMAT);
        expect(file.algorithm).toBe('AES-256-GCM');
        expect(file.iv).toBeDefined();
        expect(file.authTag).toBeDefined();
        expect(file.encryptedData).toBeDefined();
        expect(file.keyDerivation.kdf).toBe('pbkdf2');
        expect(file.keyDerivation.iterations).toBe(CryptoUtils.KeyStore.DEFAULT_KEYSTORE_ITERATIONS);
      });
    });

    test('save clears dirty flag', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret');

      expect(keystore.isDirty).toBe(true);

      await keystore.save(testPassword);

      expect(keystore.isDirty).toBe(false);
    });

    test('save fails with empty password', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);

      const result = await keystore.save('');
      expect(result).toFailWith(/password cannot be empty/i);
    });

    test('save fails when locked', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      // Don't initialize - stays locked

      const result = await keystore.save(testPassword);
      expect(result).toFailWith(/locked/i);
    });

    test('open validates file format', () => {
      const invalidFile = { format: 'invalid' };

      const result = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: invalidFile as unknown as CryptoUtils.KeyStore.IKeyStoreFile
      });

      expect(result).toFailWith(/invalid key store file/i);
    });

    test('unlock fails with wrong password', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      const savedFile = (await keystore.save(testPassword)).orThrow();

      const keystore2 = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();
      expect(keystore2.isNew).toBe(false);
      const result = await keystore2.unlock('wrong-password');
      expect(result).toFailWith(/incorrect password/i);
    });
  });

  describe('round-trip', () => {
    test('saves and reopens key store with secrets', async () => {
      // Create and populate key store
      const keystore1 = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore1.initialize(testPassword);
      await keystore1.addSecret('secret-1', { description: 'First secret' });
      await keystore1.addSecret('secret-2', { description: 'Second secret' });

      // Save
      const savedFile = (await keystore1.save(testPassword)).orThrow();

      // Reopen
      const keystore2 = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();
      const unlockResult = await keystore2.unlock(testPassword);

      expect(unlockResult).toSucceed();

      // Verify secrets
      expect(keystore2.listSecrets()).toSucceedAndSatisfy((names) => {
        expect(names).toHaveLength(2);
        expect(names).toContain('secret-1');
        expect(names).toContain('secret-2');
      });

      expect(keystore2.getSecret('secret-1')).toSucceedAndSatisfy((entry) => {
        expect(entry.description).toBe('First secret');
        if (entry.type !== 'asymmetric-keypair') {
          expect(entry.key.length).toBe(CryptoUtils.Constants.AES_256_KEY_SIZE);
        }
      });
    });

    test('preserves key values through round-trip', async () => {
      const originalKey = (await provider.generateKey()).orThrow();

      // Create and import key
      const keystore1 = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore1.initialize(testPassword);
      await keystore1.importSecret('my-key', originalKey);

      // Save
      const savedFile = (await keystore1.save(testPassword)).orThrow();

      // Reopen
      const keystore2 = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();
      await keystore2.unlock(testPassword);

      // Verify key is identical
      expect(keystore2.getSecret('my-key')).toSucceedAndSatisfy((entry) => {
        if (entry.type !== 'asymmetric-keypair') {
          expect(entry.key).toEqual(originalKey);
        }
      });
    });
  });

  describe('changePassword', () => {
    test('changes password for key store', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret', { description: 'Test' });
      await keystore.save(testPassword);

      const newPassword = 'new-password-456';
      const result = await keystore.changePassword(testPassword, newPassword);

      expect(result).toSucceed();
      expect(keystore.isDirty).toBe(false); // changePassword saves

      // Save again with new password to get the file
      const savedFile = (await keystore.save(newPassword)).orThrow();

      // Open with new file and verify we can unlock with new password
      const keystore2 = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();
      const unlockResult = await keystore2.unlock(newPassword);

      expect(unlockResult).toSucceed();
      expect(keystore2.getSecret('my-secret')).toSucceedAndSatisfy((entry) => {
        expect(entry.description).toBe('Test');
      });
    });

    test('fails with wrong current password', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret');
      await keystore.save(testPassword);

      const result = await keystore.changePassword('wrong-password', 'new-password');
      expect(result).toFailWith(/incorrect/i);
    });

    test('fails with empty new password', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.save(testPassword);

      const result = await keystore.changePassword(testPassword, '');
      expect(result).toFailWith(/cannot be empty/i);
    });

    test('fails when locked', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      // Don't initialize - stays locked

      const result = await keystore.changePassword('old', 'new');
      expect(result).toFailWith(/locked/i);
    });
  });

  describe('getSecretProvider', () => {
    test('returns a working secret provider', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret');

      const entry = keystore.getSecret('my-secret').orThrow();
      if (entry.type === 'asymmetric-keypair') {
        throw new Error('expected symmetric entry');
      }
      const key = entry.key;

      const secretProvider = keystore.getSecretProvider().orThrow();
      const secretResult = await secretProvider('my-secret');

      expect(secretResult).toSucceedWith(key);
    });

    test('secret provider fails for unknown secret', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);

      const secretProvider = keystore.getSecretProvider().orThrow();
      const result = await secretProvider('non-existent');

      expect(result).toFailWith(/not found/i);
    });

    test('fails when locked', () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      const result = keystore.getSecretProvider();
      expect(result).toFailWith(/locked/i);
    });
  });

  describe('getEncryptionConfig', () => {
    test('returns partial encryption config', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);

      const result = keystore.getEncryptionConfig();

      expect(result).toSucceedAndSatisfy((config) => {
        expect(config.secretProvider).toBeDefined();
        expect(config.cryptoProvider).toBe(provider);
      });
    });

    test('fails when locked', () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      const result = keystore.getEncryptionConfig();
      expect(result).toFailWith(/locked/i);
    });
  });

  describe('unlock vs initialize', () => {
    test('cannot unlock a new key store', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();

      const result = await keystore.unlock(testPassword);
      expect(result).toFailWith(/use initialize/i);
    });

    test('cannot initialize an opened key store', async () => {
      // First create and save a key store
      const keystore1 = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore1.initialize(testPassword);
      const savedFile = (await keystore1.save(testPassword)).orThrow();

      // Open it
      const keystore2 = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();

      const result = await keystore2.initialize('some-password');
      expect(result).toFailWith(/use unlock/i);
    });
  });

  describe('unlockWithKey', () => {
    let savedFile: CryptoUtils.KeyStore.IKeyStoreFile;
    let derivedKey: Uint8Array;

    beforeEach(async () => {
      // Create, populate, and save a key store
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret', { description: 'Test secret' });
      savedFile = (await keystore.save(testPassword)).orThrow();

      // Derive the key externally using the file's PBKDF2 params
      const salt = CryptoUtils.fromBase64(savedFile.keyDerivation.salt);
      derivedKey = (
        await provider.deriveKey(testPassword, salt, savedFile.keyDerivation.iterations)
      ).orThrow();
    });

    test('unlocks with a pre-derived key', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();

      const result = await keystore.unlockWithKey(derivedKey);

      expect(result).toSucceedAndSatisfy((ks) => {
        expect(ks.isUnlocked).toBe(true);
        expect(ks.state).toBe('unlocked');
      });
    });

    test('secrets are accessible after unlockWithKey', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();
      await keystore.unlockWithKey(derivedKey);

      expect(keystore.getSecret('my-secret')).toSucceedAndSatisfy((entry) => {
        expect(entry.name).toBe('my-secret');
        expect(entry.description).toBe('Test secret');
        if (entry.type !== 'asymmetric-keypair') {
          expect(entry.key.length).toBe(CryptoUtils.Constants.AES_256_KEY_SIZE);
        }
      });
    });

    test('fails with wrong-length key', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();

      const shortKey = new Uint8Array(16);
      const result = await keystore.unlockWithKey(shortKey);
      expect(result).toFailWith(/key must be 32 bytes/i);
    });

    test('fails with wrong key', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();

      const wrongKey = new Uint8Array(32);
      wrongKey.fill(0xff);

      const result = await keystore.unlockWithKey(wrongKey);
      expect(result).toFailWith(/incorrect password/i);
    });

    test('fails on a new key store', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();

      const result = await keystore.unlockWithKey(derivedKey);
      expect(result).toFailWith(/use initialize/i);
    });

    test('fails when already unlocked', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();
      await keystore.unlockWithKey(derivedKey);

      const result = await keystore.unlockWithKey(derivedKey);
      expect(result).toFailWith(/already unlocked/i);
    });

    test('key derived from same password produces identical secrets as unlock', async () => {
      // Unlock via password
      const ks1 = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();
      await ks1.unlock(testPassword);
      const secretViaPassword = ks1.getSecret('my-secret').orThrow();

      // Unlock via derived key
      const ks2 = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();
      await ks2.unlockWithKey(derivedKey);
      const secretViaKey = ks2.getSecret('my-secret').orThrow();

      if (secretViaKey.type !== 'asymmetric-keypair' && secretViaPassword.type !== 'asymmetric-keypair') {
        expect(secretViaKey.key).toEqual(secretViaPassword.key);
      }
      expect(secretViaKey.name).toBe(secretViaPassword.name);
      expect(secretViaKey.description).toBe(secretViaPassword.description);
    });

    test('fails when salt has invalid base64', async () => {
      // Corrupt the salt after saving but before opening — decryption will
      // succeed (key was derived from original salt) but the post-decrypt
      // salt decode in _decryptVault will fail.
      const corruptedFile: CryptoUtils.KeyStore.IKeyStoreFile = {
        ...savedFile,
        keyDerivation: {
          ...savedFile.keyDerivation,
          salt: '!!!not-valid-base64!!!'
        }
      };

      const keystore = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: corruptedFile
      }).orThrow();

      const result = await keystore.unlockWithKey(derivedKey);
      expect(result).toFailWith(/invalid salt/i);
    });
  });

  // ==========================================================================
  // saveWithKey
  // ==========================================================================

  describe('saveWithKey', () => {
    let keystore: CryptoUtils.KeyStore.KeyStore;
    let derivedKey: Uint8Array;

    beforeEach(async () => {
      // Create and populate a key store, then save with password to get a baseline
      keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret', { description: 'Test secret' });
      const savedFile = (await keystore.save(testPassword)).orThrow();

      // Derive the key externally using the file's PBKDF2 params
      const salt = CryptoUtils.fromBase64(savedFile.keyDerivation.salt);
      derivedKey = (
        await provider.deriveKey(testPassword, salt, savedFile.keyDerivation.iterations)
      ).orThrow();
    });

    test('saves with a pre-derived key', async () => {
      const result = await keystore.saveWithKey(derivedKey);

      expect(result).toSucceedAndSatisfy((file) => {
        expect(file.format).toBe(CryptoUtils.KeyStore.KEYSTORE_FORMAT);
        expect(file.algorithm).toBe('AES-256-GCM');
        expect(file.iv).toBeDefined();
        expect(file.authTag).toBeDefined();
        expect(file.encryptedData).toBeDefined();
        expect(file.keyDerivation.kdf).toBe('pbkdf2');
        expect(file.keyDerivation.iterations).toBe(CryptoUtils.KeyStore.DEFAULT_KEYSTORE_ITERATIONS);
      });
    });

    test('clears dirty flag', async () => {
      // Add another secret to make it dirty again
      await keystore.addSecret('another-secret');
      expect(keystore.isDirty).toBe(true);

      await keystore.saveWithKey(derivedKey);

      expect(keystore.isDirty).toBe(false);
    });

    test('saved file can be opened and unlocked with same key', async () => {
      // Add a second secret before saving with key
      await keystore.addSecret('second-secret', { description: 'Second' });
      const savedFile = (await keystore.saveWithKey(derivedKey)).orThrow();

      // Reopen and unlock with the same derived key
      const keystore2 = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();
      const unlockResult = await keystore2.unlockWithKey(derivedKey);

      expect(unlockResult).toSucceed();
      expect(keystore2.listSecrets()).toSucceedAndSatisfy((names) => {
        expect(names).toHaveLength(2);
        expect(names).toContain('my-secret');
        expect(names).toContain('second-secret');
      });
    });

    test('saved file can be opened and unlocked with password', async () => {
      const savedFile = (await keystore.saveWithKey(derivedKey)).orThrow();

      // Reopen and unlock with the original password
      const keystore2 = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();
      const unlockResult = await keystore2.unlock(testPassword);

      expect(unlockResult).toSucceed();
      expect(keystore2.getSecret('my-secret')).toSucceedAndSatisfy((entry) => {
        expect(entry.name).toBe('my-secret');
        expect(entry.description).toBe('Test secret');
      });
    });

    test('key derived from password produces identical file that round-trips', async () => {
      // Save with key
      const savedWithKey = (await keystore.saveWithKey(derivedKey)).orThrow();

      // Open the key-saved file with password and verify secrets match
      const keystore2 = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedWithKey
      }).orThrow();
      await keystore2.unlock(testPassword);

      const originalSecret = keystore.getSecret('my-secret').orThrow();
      const roundTrippedSecret = keystore2.getSecret('my-secret').orThrow();

      if (roundTrippedSecret.type !== 'asymmetric-keypair' && originalSecret.type !== 'asymmetric-keypair') {
        expect(roundTrippedSecret.key).toEqual(originalSecret.key);
      }
      expect(roundTrippedSecret.name).toBe(originalSecret.name);
      expect(roundTrippedSecret.description).toBe(originalSecret.description);
    });

    test('fails with wrong-length key', async () => {
      const shortKey = new Uint8Array(16);
      const result = await keystore.saveWithKey(shortKey);
      expect(result).toFailWith(/key must be 32 bytes/i);
    });

    test('fails when locked', async () => {
      keystore.lock(true);

      const result = await keystore.saveWithKey(derivedKey);
      expect(result).toFailWith(/locked/i);
    });
  });

  // ==========================================================================
  // encryptByName (IEncryptionProvider)
  // ==========================================================================

  describe('encryptByName', () => {
    test('encrypts content using a named secret', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret');

      const content = { hello: 'world' };
      const result = await keystore.encryptByName('my-secret', content);
      expect(result).toSucceedAndSatisfy((encrypted) => {
        expect(encrypted.format).toBe(CryptoUtils.Constants.ENCRYPTED_FILE_FORMAT);
        expect(encrypted.secretName).toBe('my-secret');
        expect(typeof encrypted.encryptedData).toBe('string');
      });
    });

    test('includes metadata in encrypted file', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret');

      const metadata = { collectionId: 'test-collection', itemCount: 5 };
      const result = await keystore.encryptByName('my-secret', { data: 1 }, metadata);
      expect(result).toSucceedAndSatisfy((encrypted) => {
        expect(encrypted.metadata).toEqual(metadata);
      });
    });

    test('fails when secret not found', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);

      const result = await keystore.encryptByName('missing', { data: 1 });
      expect(result).toFailWith(/not found/i);
    });

    test('fails when locked', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret');
      keystore.lock(true);

      const result = await keystore.encryptByName('my-secret', { data: 1 });
      expect(result).toFailWith(/locked/i);
    });

    test('encrypted content can be decrypted', async () => {
      const keystore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret');

      const originalContent = { items: [1, 2, 3], name: 'test' };
      const encryptResult = await keystore.encryptByName('my-secret', originalContent);
      expect(encryptResult).toSucceed();

      const secret = keystore.getSecret('my-secret').orThrow();
      if (secret.type === 'asymmetric-keypair') {
        throw new Error('expected symmetric entry');
      }
      const decryptResult = await CryptoUtils.decryptFile(encryptResult.orThrow(), secret.key, provider);
      expect(decryptResult).toSucceedAndSatisfy((decrypted) => {
        expect(decrypted).toEqual(originalContent);
      });
    });
  });

  // ==========================================================================
  // Asymmetric keypair management
  // ==========================================================================

  describe('asymmetric keypairs', () => {
    let keystore: CryptoUtils.KeyStore.KeyStore;
    let storage: InMemoryPrivateKeyStorage;

    beforeEach(async () => {
      storage = new InMemoryPrivateKeyStorage();
      keystore = CryptoUtils.KeyStore.KeyStore.create({
        cryptoProvider: provider,
        privateKeyStorage: storage
      }).orThrow();
      await keystore.initialize(testPassword);
    });

    describe('addKeyPair', () => {
      test('adds an ECDSA P-256 keypair and persists private key in storage', async () => {
        const result = await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });

        expect(result).toSucceedAndSatisfy(({ entry, replaced, warning }) => {
          expect(entry.name).toBe('signing');
          expect(entry.type).toBe('asymmetric-keypair');
          expect(entry.algorithm).toBe('ecdsa-p256');
          expect(entry.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
          expect(entry.publicKeyJwk.kty).toBe('EC');
          expect(replaced).toBe(false);
          expect(warning).toBeUndefined();
        });

        const entry = keystore.getSecret('signing').orThrow();
        if (entry.type !== 'asymmetric-keypair') {
          throw new Error('expected asymmetric entry');
        }
        expect(storage.entries.has(entry.id)).toBe(true);
      });

      test('adds an RSA-OAEP 2048 keypair', async () => {
        const result = await keystore.addKeyPair('encrypting', { algorithm: 'rsa-oaep-2048' });

        expect(result).toSucceedAndSatisfy(({ entry }) => {
          expect(entry.algorithm).toBe('rsa-oaep-2048');
          expect(entry.publicKeyJwk.kty).toBe('RSA');
        });
      });

      test('honours description and stores via storage backend', async () => {
        const result = await keystore.addKeyPair('signing', {
          algorithm: 'ecdsa-p256',
          description: 'For document signing'
        });

        expect(result).toSucceedAndSatisfy(({ entry }) => {
          expect(entry.description).toBe('For document signing');
        });
      });

      test('passes extractable=false when backend supports it', async () => {
        const result = await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });

        expect(result).toSucceedAndSatisfy(({ entry }) => {
          const stored = storage.entries.get(entry.id);
          expect(stored?.extractable).toBe(false);
        });
      });

      test('passes extractable=true when backend cannot hold non-extractable keys', async () => {
        const extractableStorage = new InMemoryPrivateKeyStorage({ supportsNonExtractable: false });
        const ks = CryptoUtils.KeyStore.KeyStore.create({
          cryptoProvider: provider,
          privateKeyStorage: extractableStorage
        }).orThrow();
        await ks.initialize(testPassword);

        const result = await ks.addKeyPair('signing', { algorithm: 'ecdsa-p256' });

        expect(result).toSucceedAndSatisfy(({ entry }) => {
          const stored = extractableStorage.entries.get(entry.id);
          expect(stored?.extractable).toBe(true);
        });
      });

      test('fails without a private key storage backend', async () => {
        const ksNoStorage = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
        await ksNoStorage.initialize(testPassword);

        const result = await ksNoStorage.addKeyPair('signing', { algorithm: 'ecdsa-p256' });
        expect(result).toFailWith(/no private key storage configured/i);
      });

      test('fails when locked', async () => {
        keystore.lock(true);
        const result = await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });
        expect(result).toFailWith(/locked/i);
      });

      test('fails with empty name', async () => {
        const result = await keystore.addKeyPair('', { algorithm: 'ecdsa-p256' });
        expect(result).toFailWith(/name cannot be empty/i);
      });

      test('rejects existing entry without replace=true', async () => {
        await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });
        const result = await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });
        expect(result).toFailWith(/already exists/i);
      });

      test('storage-write failure aborts addKeyPair (no vault entry written)', async () => {
        const failing = new InMemoryPrivateKeyStorage({ failOn: { store: 'simulated store outage' } });
        const ks = CryptoUtils.KeyStore.KeyStore.create({
          cryptoProvider: provider,
          privateKeyStorage: failing
        }).orThrow();
        await ks.initialize(testPassword);

        const result = await ks.addKeyPair('signing', { algorithm: 'ecdsa-p256' });
        expect(result).toFailWith(/simulated store outage/);

        expect(ks.hasSecret('signing')).toSucceedWith(false);
        expect(failing.entries.size).toBe(0);
      });

      describe('replace semantics', () => {
        test('replaces an existing asymmetric entry, mints fresh id, deletes prior blob', async () => {
          const first = (await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' })).orThrow();
          const oldId = first.entry.id;

          const second = (
            await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256', replace: true })
          ).orThrow();

          expect(second.replaced).toBe(true);
          expect(second.entry.id).not.toBe(oldId);
          expect(second.warning).toBeUndefined();
          expect(storage.entries.has(oldId)).toBe(false);
          expect(storage.entries.has(second.entry.id)).toBe(true);
        });

        test('replace reports warning when storage-delete of prior blob fails', async () => {
          const failing = new InMemoryPrivateKeyStorage();
          const ks = CryptoUtils.KeyStore.KeyStore.create({
            cryptoProvider: provider,
            privateKeyStorage: failing
          }).orThrow();
          await ks.initialize(testPassword);

          const first = (await ks.addKeyPair('signing', { algorithm: 'ecdsa-p256' })).orThrow();
          // Manually drop the entry from the underlying map so storage.delete fails.
          failing.entries.delete(first.entry.id);

          const second = (
            await ks.addKeyPair('signing', { algorithm: 'ecdsa-p256', replace: true })
          ).orThrow();

          expect(second.replaced).toBe(true);
          expect(second.warning).toMatch(/Failed to delete prior storage blob/);
          // New blob is still stored — replacement is not rolled back.
          expect(failing.entries.has(second.entry.id)).toBe(true);
        });

        test('replacing a symmetric entry with an asymmetric one zeroes the prior bytes', async () => {
          const key = (await provider.generateKey()).orThrow();
          await keystore.importSecret('mixed', key);
          const sym = keystore.getSecret('mixed').orThrow();
          if (sym.type === 'asymmetric-keypair') {
            throw new Error('expected symmetric entry');
          }
          const symKey = sym.key;

          const result = (
            await keystore.addKeyPair('mixed', { algorithm: 'ecdsa-p256', replace: true })
          ).orThrow();

          expect(result.replaced).toBe(true);
          expect(result.entry.type).toBe('asymmetric-keypair');
          // The pre-replacement key bytes were zeroed in place.
          expect(symKey.every((b) => b === 0)).toBe(true);
        });

        test('replacing an asymmetric entry with a symmetric one releases the storage blob', async () => {
          const first = (await keystore.addKeyPair('mixed', { algorithm: 'ecdsa-p256' })).orThrow();
          expect(storage.entries.has(first.entry.id)).toBe(true);

          const key = (await provider.generateKey()).orThrow();
          const result = (await keystore.importSecret('mixed', key, { replace: true })).orThrow();

          expect(result.replaced).toBe(true);
          expect(result.entry.type).toBe('encryption-key');
          expect(storage.entries.has(first.entry.id)).toBe(false);
        });

        test('replacing an asymmetric entry via importApiKey releases storage blob', async () => {
          const first = (await keystore.addKeyPair('mixed', { algorithm: 'ecdsa-p256' })).orThrow();
          const result = (
            await keystore.importApiKey('mixed', 'sk-replacement', { replace: true })
          ).orThrow();
          expect(result.replaced).toBe(true);
          expect(storage.entries.has(first.entry.id)).toBe(false);
        });

        test('replacing an asymmetric entry via addSecretFromPassword releases storage blob', async () => {
          const first = (await keystore.addKeyPair('mixed', { algorithm: 'ecdsa-p256' })).orThrow();
          const result = (
            await keystore.addSecretFromPassword('mixed', 'pw', { replace: true, iterations: 100 })
          ).orThrow();
          expect(result.replaced).toBe(true);
          expect(storage.entries.has(first.entry.id)).toBe(false);
        });

        test('addSecret silently replacing an asymmetric entry releases storage blob', async () => {
          const first = (await keystore.addKeyPair('mixed', { algorithm: 'ecdsa-p256' })).orThrow();
          const result = (await keystore.addSecret('mixed')).orThrow();
          expect(result.replaced).toBe(true);
          expect(storage.entries.has(first.entry.id)).toBe(false);
        });
      });
    });

    describe('getKeyPair', () => {
      test('returns importable public key and storage-loaded private key', async () => {
        await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });

        const result = await keystore.getKeyPair('signing');
        expect(result).toSucceedAndSatisfy(({ publicKey, privateKey }) => {
          expect(publicKey.algorithm.name).toBe('ECDSA');
          expect(privateKey.algorithm.name).toBe('ECDSA');
          expect(publicKey.usages).toEqual(['verify']);
        });
      });

      test('returns a freshly-imported public key on every call (no caching)', async () => {
        await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });

        const first = (await keystore.getKeyPair('signing')).orThrow();
        const second = (await keystore.getKeyPair('signing')).orThrow();

        // Distinct CryptoKey object identities — keystore re-imports each call.
        expect(first.publicKey).not.toBe(second.publicKey);
      });

      test('returns the same private key reference held by storage', async () => {
        const added = (await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' })).orThrow();
        const result = (await keystore.getKeyPair('signing')).orThrow();
        expect(result.privateKey).toBe(storage.entries.get(added.entry.id));
      });

      test('fails for non-existent entry', async () => {
        const result = await keystore.getKeyPair('missing');
        expect(result).toFailWith(/not found/i);
      });

      test('fails when entry is symmetric', async () => {
        await keystore.addSecret('sym');
        const result = await keystore.getKeyPair('sym');
        expect(result).toFailWith(/not an asymmetric keypair/i);
      });

      test('fails without a private key storage backend', async () => {
        // Add a keypair via a configured keystore, save, then reopen without a backend.
        await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });
        const file = (await keystore.save(testPassword)).orThrow();

        const ksNoStorage = CryptoUtils.KeyStore.KeyStore.open({
          cryptoProvider: provider,
          keystoreFile: file
        }).orThrow();
        await ksNoStorage.unlock(testPassword);

        const result = await ksNoStorage.getKeyPair('signing');
        expect(result).toFailWith(/no private key storage configured/i);
      });

      test('storage-load failure surfaces with context', async () => {
        const failing = new InMemoryPrivateKeyStorage({ failOn: { load: 'simulated load outage' } });
        const ks = CryptoUtils.KeyStore.KeyStore.create({
          cryptoProvider: provider,
          privateKeyStorage: failing
        }).orThrow();
        await ks.initialize(testPassword);
        await ks.addKeyPair('signing', { algorithm: 'ecdsa-p256' });

        const result = await ks.getKeyPair('signing');
        expect(result).toFailWith(/simulated load outage/);
      });

      test('fails when locked', async () => {
        await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });
        await keystore.save(testPassword);
        keystore.lock();

        const result = await keystore.getKeyPair('signing');
        expect(result).toFailWith(/locked/i);
      });
    });

    describe('getPublicKeyJwk', () => {
      test('returns the JWK without touching storage', async () => {
        const added = (await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' })).orThrow();
        const result = keystore.getPublicKeyJwk('signing');
        expect(result).toSucceedWith(added.entry.publicKeyJwk);
      });

      test('works after dropping the storage backend (vault-only data)', async () => {
        await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });
        const file = (await keystore.save(testPassword)).orThrow();

        const ksNoStorage = CryptoUtils.KeyStore.KeyStore.open({
          cryptoProvider: provider,
          keystoreFile: file
        }).orThrow();
        await ksNoStorage.unlock(testPassword);

        expect(ksNoStorage.getPublicKeyJwk('signing')).toSucceedAndSatisfy((jwk) => {
          expect(jwk.kty).toBe('EC');
        });
      });

      test('fails for non-existent entry', () => {
        expect(keystore.getPublicKeyJwk('missing')).toFailWith(/not found/i);
      });

      test('fails for symmetric entry', async () => {
        await keystore.addSecret('sym');
        expect(keystore.getPublicKeyJwk('sym')).toFailWith(/not an asymmetric keypair/i);
      });

      test('fails when locked', () => {
        keystore.lock(true);
        expect(keystore.getPublicKeyJwk('signing')).toFailWith(/locked/i);
      });
    });

    describe('removeSecret on asymmetric entries', () => {
      test('drops vault entry and deletes storage blob', async () => {
        const added = (await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' })).orThrow();

        const result = await keystore.removeSecret('signing');
        expect(result).toSucceedAndSatisfy(({ entry, warning }) => {
          expect(entry.name).toBe('signing');
          expect(entry.type).toBe('asymmetric-keypair');
          expect(warning).toBeUndefined();
        });
        expect(keystore.hasSecret('signing')).toSucceedWith(false);
        expect(storage.entries.has(added.entry.id)).toBe(false);
      });

      test('returns warning if storage-delete fails but still drops vault entry', async () => {
        const failing = new InMemoryPrivateKeyStorage();
        const ks = CryptoUtils.KeyStore.KeyStore.create({
          cryptoProvider: provider,
          privateKeyStorage: failing
        }).orThrow();
        await ks.initialize(testPassword);
        const added = (await ks.addKeyPair('signing', { algorithm: 'ecdsa-p256' })).orThrow();

        // Force storage.delete to fail by removing the underlying entry first.
        failing.entries.delete(added.entry.id);
        const result = await ks.removeSecret('signing');

        expect(result).toSucceedAndSatisfy(({ entry, warning }) => {
          expect(entry.name).toBe('signing');
          expect(warning).toMatch(/Failed to delete prior storage blob/);
        });
        expect(ks.hasSecret('signing')).toSucceedWith(false);
      });

      test('without a backend, vault removal still succeeds and is silent', async () => {
        // Build a vault that already contains an asymmetric entry, then reopen
        // without a backend.
        await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });
        const file = (await keystore.save(testPassword)).orThrow();

        const ksNoStorage = CryptoUtils.KeyStore.KeyStore.open({
          cryptoProvider: provider,
          keystoreFile: file
        }).orThrow();
        await ksNoStorage.unlock(testPassword);

        const result = await ksNoStorage.removeSecret('signing');
        expect(result).toSucceedAndSatisfy(({ warning }) => {
          expect(warning).toBeUndefined();
        });
        expect(ksNoStorage.hasSecret('signing')).toSucceedWith(false);
      });
    });

    describe('renameSecret on asymmetric entries', () => {
      test('preserves the storage id across rename', async () => {
        const added = (await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' })).orThrow();
        const oldId = added.entry.id;

        const renamed = keystore.renameSecret('signing', 'docsigning').orThrow();
        if (renamed.type !== 'asymmetric-keypair') {
          throw new Error('expected asymmetric entry');
        }
        expect(renamed.id).toBe(oldId);
        expect(storage.entries.has(oldId)).toBe(true);

        // getKeyPair under the new name still resolves the same private key.
        const pair = (await keystore.getKeyPair('docsigning')).orThrow();
        expect(pair.privateKey).toBe(storage.entries.get(oldId));
      });
    });

    describe('listSecretsByType for asymmetric entries', () => {
      test('separates asymmetric entries from symmetric ones', async () => {
        await keystore.addSecret('encryption');
        await keystore.importApiKey('apikey', 'sk-1');
        await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });

        expect(keystore.listSecretsByType('asymmetric-keypair')).toSucceedAndSatisfy((names) => {
          expect(names).toEqual(['signing']);
        });
        expect(keystore.listSecretsByType('encryption-key')).toSucceedAndSatisfy((names) => {
          expect(names).toEqual(['encryption']);
        });
      });
    });

    describe('round-trip with asymmetric entries', () => {
      test('save and reopen preserves the asymmetric vault entry; getKeyPair still works', async () => {
        const added = (await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' })).orThrow();
        const file = (await keystore.save(testPassword)).orThrow();

        const ks2 = CryptoUtils.KeyStore.KeyStore.open({
          cryptoProvider: provider,
          keystoreFile: file,
          privateKeyStorage: storage
        }).orThrow();
        await ks2.unlock(testPassword);

        const result = await ks2.getKeyPair('signing');
        expect(result).toSucceedAndSatisfy(({ publicKey, privateKey }) => {
          expect(publicKey.algorithm.name).toBe('ECDSA');
          expect(privateKey).toBe(storage.entries.get(added.entry.id));
        });
        expect(ks2.getPublicKeyJwk('signing')).toSucceedWith(added.entry.publicKeyJwk);
      });

      test('mixed symmetric and asymmetric vault round-trips', async () => {
        await keystore.addSecret('symmetric');
        await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });
        const file = (await keystore.save(testPassword)).orThrow();

        const ks2 = CryptoUtils.KeyStore.KeyStore.open({
          cryptoProvider: provider,
          keystoreFile: file,
          privateKeyStorage: storage
        }).orThrow();
        await ks2.unlock(testPassword);

        expect(ks2.listSecrets()).toSucceedAndSatisfy((names) => {
          expect(names).toContain('symmetric');
          expect(names).toContain('signing');
        });
      });

      test('encryptByName fails on asymmetric entries', async () => {
        await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });
        const result = await keystore.encryptByName('signing', { hello: 'world' });
        expect(result).toFailWith(/asymmetric keypair, not symmetric/i);
      });

      test('getSecretProvider rejects asymmetric entries', async () => {
        await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });
        const sp = keystore.getSecretProvider().orThrow();
        const result = await sp('signing');
        expect(result).toFailWith(/asymmetric keypair, not symmetric/i);
      });
    });

    describe('ECDH P-256 keypairs', () => {
      test('addKeyPair persists an ECDH P-256 entry with an EC public-key JWK', async () => {
        const result = await keystore.addKeyPair('buyer-key', { algorithm: 'ecdh-p256' });

        expect(result).toSucceedAndSatisfy(({ entry, replaced, warning }) => {
          expect(entry.algorithm).toBe('ecdh-p256');
          expect(entry.publicKeyJwk.kty).toBe('EC');
          expect(entry.publicKeyJwk.crv).toBe('P-256');
          expect(replaced).toBe(false);
          expect(warning).toBeUndefined();
        });

        const entry = keystore.getSecret('buyer-key').orThrow();
        if (entry.type !== 'asymmetric-keypair') {
          throw new Error('expected asymmetric entry');
        }
        expect(storage.entries.has(entry.id)).toBe(true);
      });

      test('getPublicKeyJwk returns the stored ECDH P-256 JWK', async () => {
        const added = (await keystore.addKeyPair('buyer-key', { algorithm: 'ecdh-p256' })).orThrow();
        expect(keystore.getPublicKeyJwk('buyer-key')).toSucceedWith(added.entry.publicKeyJwk);
      });

      test('getKeyPair returns an importable ECDH public key and storage-loaded private key', async () => {
        await keystore.addKeyPair('buyer-key', { algorithm: 'ecdh-p256' });

        const result = await keystore.getKeyPair('buyer-key');
        expect(result).toSucceedAndSatisfy(({ publicKey, privateKey }) => {
          expect(publicKey.algorithm.name).toBe('ECDH');
          expect(privateKey.algorithm.name).toBe('ECDH');
          expect((publicKey.algorithm as EcKeyAlgorithm).namedCurve).toBe('P-256');
          expect((privateKey.algorithm as EcKeyAlgorithm).namedCurve).toBe('P-256');
        });
      });

      test('end-to-end: keystore-generated ECDH P-256 keypair round-trips through wrapBytes/unwrapBytes', async () => {
        await keystore.addKeyPair('buyer-key', { algorithm: 'ecdh-p256' });
        const { publicKey, privateKey } = (await keystore.getKeyPair('buyer-key')).orThrow();

        const plaintext = new TextEncoder().encode('per-buyer wrapped secret');
        const options = {
          salt: new TextEncoder().encode('content-hash'),
          info: new TextEncoder().encode('secret-name')
        };

        const wrapped = (await provider.wrapBytes(plaintext, publicKey, options)).orThrow();
        const unwrapped = (await provider.unwrapBytes(wrapped, privateKey, options)).orThrow();
        expect(unwrapped).toEqual(plaintext);
      });

      test('save and reopen preserves the ECDH P-256 entry; getKeyPair still works', async () => {
        const added = (await keystore.addKeyPair('buyer-key', { algorithm: 'ecdh-p256' })).orThrow();
        const file = (await keystore.save(testPassword)).orThrow();

        const ks2 = CryptoUtils.KeyStore.KeyStore.open({
          cryptoProvider: provider,
          keystoreFile: file,
          privateKeyStorage: storage
        }).orThrow();
        await ks2.unlock(testPassword);

        const result = await ks2.getKeyPair('buyer-key');
        expect(result).toSucceedAndSatisfy(({ publicKey, privateKey }) => {
          expect(publicKey.algorithm.name).toBe('ECDH');
          expect(privateKey).toBe(storage.entries.get(added.entry.id));
        });
        expect(ks2.getPublicKeyJwk('buyer-key')).toSucceedWith(added.entry.publicKeyJwk);
      });
    });
  });

  // ==========================================================================
  // Backwards compatibility: vaults written before asymmetric support
  // ==========================================================================

  describe('backwards compatibility', () => {
    test('vault produced by a prior keystore (symmetric only) opens unchanged', async () => {
      // Build a vault with the current code, then reopen with no provider —
      // the converter accepts legacy missing-type fields and the keystore
      // ignores asymmetric-only state when no asymmetric entries exist.
      const ks1 = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await ks1.initialize(testPassword);
      await ks1.addSecret('legacy-key', { description: 'pre-asymmetric vault' });
      await ks1.importApiKey('legacy-api', 'sk-old');
      const file = (await ks1.save(testPassword)).orThrow();

      const ks2 = CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: file
      }).orThrow();
      await ks2.unlock(testPassword);

      expect(ks2.listSecrets()).toSucceedAndSatisfy((names) => {
        expect(names).toEqual(expect.arrayContaining(['legacy-key', 'legacy-api']));
      });
      expect(ks2.getApiKey('legacy-api')).toSucceedWith('sk-old');
    });
  });
});
