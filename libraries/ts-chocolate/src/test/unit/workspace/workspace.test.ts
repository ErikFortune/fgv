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

import { Measurement } from '../../../packlets/common';
import { KeyStore, nodeCryptoProvider } from '../../../packlets/crypto-utils';
import { createNodeWorkspace, Workspace } from '../../../packlets/workspace';

describe('Workspace', () => {
  describe('create', () => {
    test('creates workspace with default parameters', () => {
      expect(Workspace.create()).toSucceedAndSatisfy((workspace) => {
        expect(workspace.state).toBe('no-keystore');
        expect(workspace.isReady).toBe(true);
        expect(workspace.keyStore).toBeUndefined();
        expect(workspace.runtime).toBeDefined();
        expect(workspace.runtime.library).toBeDefined();
      });
    });

    test('creates workspace with empty parameters', () => {
      expect(Workspace.create({})).toSucceedAndSatisfy((workspace) => {
        expect(workspace.state).toBe('no-keystore');
        expect(workspace.isReady).toBe(true);
      });
    });

    test('creates workspace with built-in data disabled', () => {
      expect(Workspace.create({ builtin: false })).toSucceedAndSatisfy((workspace) => {
        expect(workspace.runtime.library.ingredients.size).toBe(0);
        expect(workspace.runtime.library.fillings.size).toBe(0);
      });
    });

    test('creates workspace with preWarm enabled', () => {
      expect(Workspace.create({ preWarm: true })).toSucceedAndSatisfy((workspace) => {
        // Pre-warming warms up query indexes (not ingredient/recipe caches)
        // Verify workspace is functional after pre-warming
        expect(workspace.state).toBe('no-keystore');
        expect(workspace.isReady).toBe(true);
        // Access ingredients via runtime to verify indexes are queryable
        expect(workspace.runtime.ingredients.size).toBeGreaterThan(0);
      });
    });
  });

  describe('create with key store', () => {
    test('creates workspace with new key store (no file)', () => {
      expect(
        Workspace.create({
          keyStore: {
            cryptoProvider: nodeCryptoProvider
          }
        })
      ).toSucceedAndSatisfy((workspace) => {
        // New keystore starts locked until initialized
        expect(workspace.state).toBe('locked');
        expect(workspace.isReady).toBe(false);
        expect(workspace.keyStore).toBeDefined();
        expect(workspace.keyStore?.state).toBe('locked');
      });
    });

    test('creates workspace with existing key store file', async () => {
      // First create and initialize a key store
      const keyStore = KeyStore.KeyStore.create({ cryptoProvider: nodeCryptoProvider }).orThrow();
      await keyStore.initialize('test-password');
      const keystoreFile = (await keyStore.save('test-password')).orThrow();

      // Now create a workspace with that key store file
      expect(
        Workspace.create({
          keyStore: {
            file: keystoreFile,
            cryptoProvider: nodeCryptoProvider
          }
        })
      ).toSucceedAndSatisfy((workspace) => {
        expect(workspace.state).toBe('locked');
        expect(workspace.isReady).toBe(false);
        expect(workspace.keyStore).toBeDefined();
        expect(workspace.keyStore?.state).toBe('locked');
      });
    });
  });

  describe('library access', () => {
    test('provides access to runtime ingredients', () => {
      const workspace = Workspace.create().orThrow();
      expect(workspace.runtime.ingredients).toBeDefined();
      expect(workspace.runtime.ingredients.size).toBeGreaterThan(0);
    });

    test('provides access to runtime fillings', () => {
      const workspace = Workspace.create().orThrow();
      expect(workspace.runtime.fillings).toBeDefined();
      expect(workspace.runtime.fillings.size).toBeGreaterThan(0);
    });

    test('provides access to journals via workspace', () => {
      const workspace = Workspace.create().orThrow();
      expect(workspace.journals).toBeDefined();
    });

    test('getRuntimeConfection via runtime returns confection', () => {
      const workspace = Workspace.create().orThrow();
      const confectionIds = Array.from(workspace.runtime.library.confections.keys());
      if (confectionIds.length > 0) {
        expect(workspace.runtime.getRuntimeConfection(confectionIds[0])).toSucceed();
      }
    });

    test('getRuntimeConfection via runtime fails for unknown ID', () => {
      const workspace = Workspace.create().orThrow();
      expect(
        workspace.runtime.getRuntimeConfection(
          'unknown.confection' as Parameters<typeof workspace.runtime.getRuntimeConfection>[0]
        )
      ).toFail();
    });
  });

  describe('session creation via runtime', () => {
    test('createFillingSession creates editing session', () => {
      const workspace = Workspace.create().orThrow();
      const fillings = Array.from(workspace.runtime.fillings.values());
      if (fillings.length > 0) {
        const filling = fillings[0];
        expect(workspace.runtime.createFillingSession(filling, 100 as Measurement)).toSucceed();
      }
    });
  });

  describe('lock/unlock lifecycle', () => {
    test('lock fails when no key store configured', () => {
      const workspace = Workspace.create().orThrow();
      expect(workspace.lock()).toFailWith(/no key store/i);
    });

    test('unlock fails when no key store configured', async () => {
      const workspace = Workspace.create().orThrow();
      await expect(workspace.unlock('password')).resolves.toFailWith(/no key store/i);
    });

    test('lock succeeds when key store is already locked', async () => {
      // Create key store file
      const keyStore = KeyStore.KeyStore.create({ cryptoProvider: nodeCryptoProvider }).orThrow();
      await keyStore.initialize('test-password');
      const keystoreFile = (await keyStore.save('test-password')).orThrow();

      // Create workspace with locked key store
      const workspace = Workspace.create({
        keyStore: {
          file: keystoreFile,
          cryptoProvider: nodeCryptoProvider
        }
      }).orThrow();

      expect(workspace.state).toBe('locked');
      expect(workspace.lock()).toSucceedWith(workspace);
    });

    test('unlock succeeds when key store is already unlocked', async () => {
      // Create new key store (not initialized = locked state)
      const workspace = Workspace.create({
        keyStore: {
          cryptoProvider: nodeCryptoProvider
        }
      }).orThrow();

      // Initialize the key store to unlock it
      await workspace.keyStore!.initialize('test-password');
      expect(workspace.state).toBe('unlocked');

      // Unlock again should succeed immediately (already unlocked)
      const result = await workspace.unlock('test-password');
      expect(result).toSucceedWith(workspace);
    });

    test('full lock/unlock cycle works', async () => {
      // Create key store file
      const keyStore = KeyStore.KeyStore.create({ cryptoProvider: nodeCryptoProvider }).orThrow();
      await keyStore.initialize('test-password');
      const keystoreFile = (await keyStore.save('test-password')).orThrow();

      // Create workspace with locked key store
      const workspace = Workspace.create({
        keyStore: {
          file: keystoreFile,
          cryptoProvider: nodeCryptoProvider
        }
      }).orThrow();

      expect(workspace.state).toBe('locked');
      expect(workspace.isReady).toBe(false);

      // Unlock with correct password
      const unlockResult = await workspace.unlock('test-password');
      expect(unlockResult).toSucceedWith(workspace);
      expect(workspace.state).toBe('unlocked');
      expect(workspace.isReady).toBe(true);

      // Lock again
      expect(workspace.lock()).toSucceedWith(workspace);
      expect(workspace.state).toBe('locked');
      expect(workspace.isReady).toBe(false);
    });

    test('unlock fails with wrong password', async () => {
      // Create key store file
      const keyStore = KeyStore.KeyStore.create({ cryptoProvider: nodeCryptoProvider }).orThrow();
      await keyStore.initialize('correct-password');
      const keystoreFile = (await keyStore.save('correct-password')).orThrow();

      // Create workspace with locked key store
      const workspace = Workspace.create({
        keyStore: {
          file: keystoreFile,
          cryptoProvider: nodeCryptoProvider
        }
      }).orThrow();

      // Unlock with wrong password
      await expect(workspace.unlock('wrong-password')).resolves.toFailWith(/failed to unlock/i);
    });
  });

  describe('state property', () => {
    test('returns no-keystore when no key store configured', () => {
      const workspace = Workspace.create().orThrow();
      expect(workspace.state).toBe('no-keystore');
    });

    test('returns locked when key store is locked', async () => {
      const keyStore = KeyStore.KeyStore.create({ cryptoProvider: nodeCryptoProvider }).orThrow();
      await keyStore.initialize('test-password');
      const keystoreFile = (await keyStore.save('test-password')).orThrow();

      const workspace = Workspace.create({
        keyStore: {
          file: keystoreFile,
          cryptoProvider: nodeCryptoProvider
        }
      }).orThrow();

      expect(workspace.state).toBe('locked');
    });

    test('returns unlocked when key store is unlocked', async () => {
      const keyStore = KeyStore.KeyStore.create({ cryptoProvider: nodeCryptoProvider }).orThrow();
      await keyStore.initialize('test-password');
      const keystoreFile = (await keyStore.save('test-password')).orThrow();

      const workspace = Workspace.create({
        keyStore: {
          file: keystoreFile,
          cryptoProvider: nodeCryptoProvider
        }
      }).orThrow();

      await workspace.unlock('test-password');
      expect(workspace.state).toBe('unlocked');
    });
  });
});

describe('createNodeWorkspace', () => {
  test('creates workspace without keystore', () => {
    expect(createNodeWorkspace()).toSucceedAndSatisfy((workspace) => {
      expect(workspace.state).toBe('no-keystore');
      expect(workspace.isReady).toBe(true);
      expect(workspace.keyStore).toBeUndefined();
    });
  });

  test('creates workspace with keystore file', async () => {
    // First create and initialize a key store
    const keyStore = KeyStore.KeyStore.create({ cryptoProvider: nodeCryptoProvider }).orThrow();
    await keyStore.initialize('test-password');
    const keystoreFile = (await keyStore.save('test-password')).orThrow();

    expect(createNodeWorkspace({ keyStoreFile: keystoreFile })).toSucceedAndSatisfy((workspace) => {
      expect(workspace.state).toBe('locked');
      expect(workspace.keyStore).toBeDefined();
    });
  });

  test('creates workspace with library options', () => {
    expect(createNodeWorkspace({ builtin: false })).toSucceedAndSatisfy((workspace) => {
      expect(workspace.runtime.library.ingredients.size).toBe(0);
    });
  });
});
