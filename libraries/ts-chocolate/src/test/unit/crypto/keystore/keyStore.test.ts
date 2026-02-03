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

describe('KeyStore', () => {
  const provider = Crypto.nodeCryptoProvider;
  const testPassword = 'test-password-123';

  describe('create', () => {
    test('creates a new locked key store', () => {
      const result = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider });

      expect(result).toSucceedAndSatisfy((keystore) => {
        expect(keystore.isUnlocked).toBe(false);
        expect(keystore.state).toBe('locked');
        expect(keystore.isDirty).toBe(false);
      });
    });

    test('uses default iterations when not specified', () => {
      const result = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider });
      expect(result).toSucceed();
    });

    test('accepts custom iterations', () => {
      const result = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider, iterations: 100000 });
      expect(result).toSucceed();
    });

    test('fails with invalid iterations', () => {
      expect(Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider, iterations: 0 })).toFailWith(
        /at least 1/
      );
      expect(Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider, iterations: -1 })).toFailWith(
        /at least 1/
      );
    });
  });

  describe('initialize', () => {
    test('initializes new key store with password', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();

      const result = await keystore.initialize(testPassword);

      expect(result).toSucceedAndSatisfy((ks) => {
        expect(ks.isUnlocked).toBe(true);
        expect(ks.state).toBe('unlocked');
        expect(ks.isDirty).toBe(true); // New store needs to be saved
      });
    });

    test('fails with empty password', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();

      const result = await keystore.initialize('');
      expect(result).toFailWith(/password cannot be empty/i);
    });

    test('fails if already initialized', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);

      const result = await keystore.initialize('another-password');
      expect(result).toFailWith(/already initialized/i);
    });
  });

  describe('secret management', () => {
    let keystore: Crypto.KeyStore.KeyStore;
    beforeEach(async () => {
      keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
    });

    describe('addSecret', () => {
      test('adds a new secret with generated key', async () => {
        const result = await keystore.addSecret('my-secret');

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.name).toBe('my-secret');
          expect(addResult.entry.key).toBeInstanceOf(Uint8Array);
          expect(addResult.entry.key.length).toBe(Crypto.AES_256_KEY_SIZE);
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
        const result = keystore.importSecret('imported-secret', key);

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.name).toBe('imported-secret');
          expect(addResult.entry.key).toEqual(key);
          expect(addResult.replaced).toBe(false);
        });
      });

      test('imports with description', async () => {
        const key = (await provider.generateKey()).orThrow();
        const result = keystore.importSecret('imported-secret', key, { description: 'Imported key' });

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.entry.description).toBe('Imported key');
        });
      });

      test('fails when secret exists and replace not set', async () => {
        const key1 = (await provider.generateKey()).orThrow();
        const key2 = (await provider.generateKey()).orThrow();

        keystore.importSecret('my-secret', key1);
        const result = keystore.importSecret('my-secret', key2);

        expect(result).toFailWith(/already exists/i);
      });

      test('replaces when replace=true', async () => {
        const key1 = (await provider.generateKey()).orThrow();
        const key2 = (await provider.generateKey()).orThrow();

        keystore.importSecret('my-secret', key1);
        const result = keystore.importSecret('my-secret', key2, { replace: true });

        expect(result).toSucceedAndSatisfy((addResult) => {
          expect(addResult.replaced).toBe(true);
          expect(addResult.entry.key).toEqual(key2);
        });
      });

      test('fails with wrong key size', () => {
        const shortKey = new Uint8Array(16);
        const result = keystore.importSecret('my-secret', shortKey);

        expect(result).toFailWith(/32 bytes/);
      });

      test('fails with empty name', async () => {
        const key = (await provider.generateKey()).orThrow();
        const result = keystore.importSecret('', key);

        expect(result).toFailWith(/name cannot be empty/i);
      });

      test('fails when locked', async () => {
        const key = (await provider.generateKey()).orThrow();
        keystore.lock(true);

        const result = keystore.importSecret('my-secret', key);
        expect(result).toFailWith(/locked/i);
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

        const result = keystore.removeSecret('my-secret');

        expect(result).toSucceedAndSatisfy((entry) => {
          expect(entry.name).toBe('my-secret');
        });

        expect(keystore.hasSecret('my-secret')).toSucceedWith(false);
      });

      test('fails for non-existent secret', () => {
        const result = keystore.removeSecret('non-existent');
        expect(result).toFailWith(/not found/i);
      });

      test('fails when locked', () => {
        keystore.lock(true);
        const result = keystore.removeSecret('my-secret');
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
  });

  describe('lock/unlock', () => {
    test('lock clears secrets from memory', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
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
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret');

      const result = keystore.lock();

      expect(result).toFailWith(/unsaved changes/i);
    });

    test('lock with force discards changes', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret');

      const result = keystore.lock(true);

      expect(result).toSucceed();
      expect(keystore.isUnlocked).toBe(false);
    });

    test('lock is idempotent', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.save(testPassword);

      keystore.lock();
      const result = keystore.lock();

      expect(result).toSucceed();
    });
  });

  describe('save and open', () => {
    test('save returns encrypted key store file', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret', { description: 'Test secret' });

      const result = await keystore.save(testPassword);

      expect(result).toSucceedAndSatisfy((file) => {
        expect(file.format).toBe(Crypto.KeyStore.KEYSTORE_FORMAT);
        expect(file.algorithm).toBe('AES-256-GCM');
        expect(file.iv).toBeDefined();
        expect(file.authTag).toBeDefined();
        expect(file.encryptedData).toBeDefined();
        expect(file.keyDerivation.kdf).toBe('pbkdf2');
        expect(file.keyDerivation.iterations).toBe(Crypto.KeyStore.DEFAULT_KEYSTORE_ITERATIONS);
      });
    });

    test('save clears dirty flag', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret');

      expect(keystore.isDirty).toBe(true);

      await keystore.save(testPassword);

      expect(keystore.isDirty).toBe(false);
    });

    test('save fails with empty password', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);

      const result = await keystore.save('');
      expect(result).toFailWith(/password cannot be empty/i);
    });

    test('save fails when locked', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      // Don't initialize - stays locked

      const result = await keystore.save(testPassword);
      expect(result).toFailWith(/locked/i);
    });

    test('open validates file format', () => {
      const invalidFile = { format: 'invalid' };

      const result = Crypto.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: invalidFile as unknown as Crypto.KeyStore.IKeyStoreFile
      });

      expect(result).toFailWith(/invalid key store file/i);
    });

    test('unlock fails with wrong password', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      const savedFile = (await keystore.save(testPassword)).orThrow();

      const keystore2 = Crypto.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();
      const result = await keystore2.unlock('wrong-password');
      expect(result).toFailWith(/incorrect password/i);
    });
  });

  describe('round-trip', () => {
    test('saves and reopens key store with secrets', async () => {
      // Create and populate key store
      const keystore1 = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore1.initialize(testPassword);
      await keystore1.addSecret('secret-1', { description: 'First secret' });
      await keystore1.addSecret('secret-2', { description: 'Second secret' });

      // Save
      const savedFile = (await keystore1.save(testPassword)).orThrow();

      // Reopen
      const keystore2 = Crypto.KeyStore.KeyStore.open({
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
        expect(entry.key.length).toBe(Crypto.AES_256_KEY_SIZE);
      });
    });

    test('preserves key values through round-trip', async () => {
      const originalKey = (await provider.generateKey()).orThrow();

      // Create and import key
      const keystore1 = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore1.initialize(testPassword);
      keystore1.importSecret('my-key', originalKey);

      // Save
      const savedFile = (await keystore1.save(testPassword)).orThrow();

      // Reopen
      const keystore2 = Crypto.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();
      await keystore2.unlock(testPassword);

      // Verify key is identical
      expect(keystore2.getSecret('my-key')).toSucceedAndSatisfy((entry) => {
        expect(entry.key).toEqual(originalKey);
      });
    });
  });

  describe('changePassword', () => {
    test('changes password for key store', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
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
      const keystore2 = Crypto.KeyStore.KeyStore.open({
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
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret');
      await keystore.save(testPassword);

      const result = await keystore.changePassword('wrong-password', 'new-password');
      expect(result).toFailWith(/incorrect/i);
    });

    test('fails with empty new password', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.save(testPassword);

      const result = await keystore.changePassword(testPassword, '');
      expect(result).toFailWith(/cannot be empty/i);
    });

    test('fails when locked', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      // Don't initialize - stays locked

      const result = await keystore.changePassword('old', 'new');
      expect(result).toFailWith(/locked/i);
    });
  });

  describe('getSecretProvider', () => {
    test('returns a working secret provider', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);
      await keystore.addSecret('my-secret');

      const key = keystore.getSecret('my-secret').orThrow().key;

      const secretProvider = keystore.getSecretProvider().orThrow();
      const secretResult = await secretProvider('my-secret');

      expect(secretResult).toSucceedWith(key);
    });

    test('secret provider fails for unknown secret', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);

      const secretProvider = keystore.getSecretProvider().orThrow();
      const result = await secretProvider('non-existent');

      expect(result).toFailWith(/not found/i);
    });

    test('fails when locked', () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      const result = keystore.getSecretProvider();
      expect(result).toFailWith(/locked/i);
    });
  });

  describe('getEncryptionConfig', () => {
    test('returns partial encryption config', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore.initialize(testPassword);

      const result = keystore.getEncryptionConfig();

      expect(result).toSucceedAndSatisfy((config) => {
        expect(config.secretProvider).toBeDefined();
        expect(config.cryptoProvider).toBe(provider);
      });
    });

    test('fails when locked', () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      const result = keystore.getEncryptionConfig();
      expect(result).toFailWith(/locked/i);
    });
  });

  describe('unlock vs initialize', () => {
    test('cannot unlock a new key store', async () => {
      const keystore = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();

      const result = await keystore.unlock(testPassword);
      expect(result).toFailWith(/use initialize/i);
    });

    test('cannot initialize an opened key store', async () => {
      // First create and save a key store
      const keystore1 = Crypto.KeyStore.KeyStore.create({ cryptoProvider: provider }).orThrow();
      await keystore1.initialize(testPassword);
      const savedFile = (await keystore1.save(testPassword)).orThrow();

      // Open it
      const keystore2 = Crypto.KeyStore.KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: savedFile
      }).orThrow();

      const result = await keystore2.initialize('some-password');
      expect(result).toFailWith(/use unlock/i);
    });
  });
});
