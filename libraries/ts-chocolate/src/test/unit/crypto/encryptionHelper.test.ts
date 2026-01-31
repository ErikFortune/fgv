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

import { JsonObject } from '@fgv/ts-json-base';
import {
  createEncryptedCollectionFile,
  decryptCollectionFile,
  tryDecryptCollectionFile,
  EncryptionHelper,
  nodeCryptoProvider,
  ENCRYPTED_COLLECTION_FORMAT,
  DEFAULT_ALGORITHM,
  isEncryptedCollectionFile
} from '../../../packlets/crypto-utils';

describe('EncryptionHelper', () => {
  const provider = nodeCryptoProvider;

  describe('createEncryptedCollectionFile', () => {
    test('creates valid encrypted collection file from JSON object', async () => {
      const content = { items: [1, 2, 3], name: 'test' };
      const key = (await provider.generateKey()).orThrow();

      const result = await createEncryptedCollectionFile({
        content,
        secretName: 'my-secret',
        key,
        cryptoProvider: provider
      });

      expect(result).toSucceedAndSatisfy((encrypted) => {
        expect(encrypted.format).toBe(ENCRYPTED_COLLECTION_FORMAT);
        expect(encrypted.secretName).toBe('my-secret');
        expect(encrypted.algorithm).toBe(DEFAULT_ALGORITHM);
        expect(encrypted.iv).toBeDefined();
        expect(encrypted.authTag).toBeDefined();
        expect(encrypted.encryptedData).toBeDefined();
      });
    });

    test('includes metadata when provided', async () => {
      const content = { items: [1, 2, 3] };
      const key = (await provider.generateKey()).orThrow();

      const result = await createEncryptedCollectionFile({
        content,
        secretName: 'my-secret',
        key,
        metadata: {
          collectionId: 'test-collection',
          description: 'Test collection',
          itemCount: 3
        },
        cryptoProvider: provider
      });

      expect(result).toSucceedAndSatisfy((encrypted) => {
        expect(encrypted.metadata?.collectionId).toBe('test-collection');
        expect(encrypted.metadata?.description).toBe('Test collection');
        expect(encrypted.metadata?.itemCount).toBe(3);
      });
    });

    test('includes keyDerivation when provided', async () => {
      const content = { items: [1, 2, 3] };
      const key = (await provider.generateKey()).orThrow();

      const result = await createEncryptedCollectionFile({
        content,
        secretName: 'my-secret',
        key,
        keyDerivation: {
          kdf: 'pbkdf2',
          salt: 'dGVzdC1zYWx0LWJhc2U2NA==',
          iterations: 100000
        },
        cryptoProvider: provider
      });

      expect(result).toSucceedAndSatisfy((encrypted) => {
        expect(encrypted.keyDerivation?.kdf).toBe('pbkdf2');
        expect(encrypted.keyDerivation?.salt).toBe('dGVzdC1zYWx0LWJhc2U2NA==');
        expect(encrypted.keyDerivation?.iterations).toBe(100000);
      });
    });

    test('encrypts primitive JSON values', async () => {
      const key = (await provider.generateKey()).orThrow();

      // String
      const strResult = await createEncryptedCollectionFile({
        content: 'hello',
        secretName: 'test',
        key,
        cryptoProvider: provider
      });
      expect(strResult).toSucceed();

      // Number
      const numResult = await createEncryptedCollectionFile({
        content: 42,
        secretName: 'test',
        key,
        cryptoProvider: provider
      });
      expect(numResult).toSucceed();

      // Array
      const arrResult = await createEncryptedCollectionFile({
        content: [1, 2, 3],
        secretName: 'test',
        key,
        cryptoProvider: provider
      });
      expect(arrResult).toSucceed();
    });

    test('fails with invalid key size', async () => {
      const content = { test: 'data' };
      const invalidKey = new Uint8Array(16); // Too short - needs 32 bytes

      const result = await createEncryptedCollectionFile({
        content,
        secretName: 'test',
        key: invalidKey,
        cryptoProvider: provider
      });

      expect(result).toFailWith(/Encryption failed/);
    });

    test('fails when JSON serialization fails', async () => {
      const key = (await provider.generateKey()).orThrow();
      // Create circular reference which JSON.stringify cannot handle
      const circular: Record<string, unknown> = {};
      circular.self = circular;

      const result = await createEncryptedCollectionFile({
        // @ts-expect-error - intentionally passing non-serializable object
        content: circular,
        secretName: 'test',
        key,
        cryptoProvider: provider
      });

      expect(result).toFailWith(/Failed to serialize content/);
    });
  });

  describe('decryptCollectionFile', () => {
    test('decrypts encrypted collection file back to original content', async () => {
      const content = { items: [1, 2, 3], name: 'test', nested: { a: 'b' } };
      const key = (await provider.generateKey()).orThrow();

      const encrypted = (
        await createEncryptedCollectionFile({
          content,
          secretName: 'my-secret',
          key,
          cryptoProvider: provider
        })
      ).orThrow();

      const result = await decryptCollectionFile(encrypted, key, provider);
      expect(result).toSucceedWith(content);
    });

    test('fails with wrong key', async () => {
      const content = { test: 'data' };
      const key1 = (await provider.generateKey()).orThrow();
      const key2 = (await provider.generateKey()).orThrow();

      const encrypted = (
        await createEncryptedCollectionFile({
          content,
          secretName: 'my-secret',
          key: key1,
          cryptoProvider: provider
        })
      ).orThrow();

      const result = await decryptCollectionFile(encrypted, key2, provider);
      expect(result).toFail();
    });
  });

  describe('tryDecryptCollectionFile', () => {
    test('decrypts valid encrypted collection file', async () => {
      const content = { items: [1, 2, 3] };
      const key = (await provider.generateKey()).orThrow();

      const encrypted = (
        await createEncryptedCollectionFile({
          content,
          secretName: 'my-secret',
          key,
          cryptoProvider: provider
        })
      ).orThrow();

      // Cast to JsonObject since the encrypted file conforms to the expected structure
      const result = await tryDecryptCollectionFile(encrypted as unknown as JsonObject, key, provider);
      expect(result).toSucceedWith(content);
    });

    test('fails for non-encrypted JSON object', async () => {
      const plainJson: JsonObject = { items: [1, 2, 3] };
      const key = (await provider.generateKey()).orThrow();

      const result = await tryDecryptCollectionFile(plainJson, key, provider);
      expect(result).toFailWith(/not an encrypted collection file/i);
    });

    test('fails for malformed encrypted file', async () => {
      const malformed: JsonObject = {
        format: ENCRYPTED_COLLECTION_FORMAT,
        // Missing required fields
        secretName: 'test'
      };
      const key = (await provider.generateKey()).orThrow();

      const result = await tryDecryptCollectionFile(malformed, key, provider);
      expect(result).toFailWith(/invalid encrypted collection format/i);
    });
  });

  describe('EncryptionHelper class', () => {
    let helper: EncryptionHelper;
    let key: Uint8Array;

    beforeEach(async () => {
      helper = new EncryptionHelper(provider);
      key = (await provider.generateKey()).orThrow();
    });

    test('cryptoProvider getter returns the provider', () => {
      expect(helper.cryptoProvider).toBe(provider);
    });

    test('encrypt creates valid encrypted file', async () => {
      const content = { test: 'data' };
      const result = await helper.encrypt(content, 'my-secret', key);

      expect(result).toSucceedAndSatisfy((encrypted) => {
        expect(encrypted.format).toBe(ENCRYPTED_COLLECTION_FORMAT);
        expect(encrypted.secretName).toBe('my-secret');
      });
    });

    test('encrypt with metadata includes metadata', async () => {
      const content = { test: 'data' };
      const result = await helper.encrypt(content, 'my-secret', key, { collectionId: 'test', itemCount: 1 });

      expect(result).toSucceedAndSatisfy((encrypted) => {
        expect(encrypted.metadata?.collectionId).toBe('test');
      });
    });

    test('encrypt with keyDerivation includes keyDerivation', async () => {
      const content = { test: 'data' };
      const result = await helper.encrypt(content, 'my-secret', key, undefined, {
        kdf: 'pbkdf2',
        salt: 'dGVzdC1zYWx0',
        iterations: 50000
      });

      expect(result).toSucceedAndSatisfy((encrypted) => {
        expect(encrypted.keyDerivation?.kdf).toBe('pbkdf2');
        expect(encrypted.keyDerivation?.salt).toBe('dGVzdC1zYWx0');
        expect(encrypted.keyDerivation?.iterations).toBe(50000);
      });
    });

    test('decrypt recovers original content', async () => {
      const content = { test: 'data', value: 42 };
      const encrypted = (await helper.encrypt(content, 'my-secret', key)).orThrow();
      const result = await helper.decrypt(encrypted, key);

      expect(result).toSucceedWith(content);
    });

    test('generateKey delegates to crypto provider', async () => {
      const result = await helper.generateKey();
      expect(result).toSucceedAndSatisfy((newKey) => {
        expect(newKey).toBeInstanceOf(Uint8Array);
        expect(newKey.length).toBe(32);
      });
    });

    test('deriveKey delegates to crypto provider', async () => {
      const salt = new Uint8Array(16).fill(1);
      const result = await helper.deriveKey('password', salt, 1000);

      expect(result).toSucceedAndSatisfy((derivedKey) => {
        expect(derivedKey).toBeInstanceOf(Uint8Array);
        expect(derivedKey.length).toBe(32);
      });
    });

    test('isEncrypted returns true for encrypted files', async () => {
      const encrypted = (await helper.encrypt({ test: 'data' }, 'secret', key)).orThrow();
      expect(helper.isEncrypted(encrypted)).toBe(true);
    });

    test('isEncrypted returns false for plain JSON', () => {
      expect(helper.isEncrypted({ test: 'data' })).toBe(false);
    });

    test('isEncrypted returns false for null/undefined', () => {
      expect(helper.isEncrypted(null)).toBe(false);
      expect(helper.isEncrypted(undefined)).toBe(false);
    });
  });

  describe('round-trip with complex JSON', () => {
    test('preserves complex nested structure', async () => {
      const content = {
        id: 'test-123',
        name: 'Complex Collection',
        items: {
          item1: { name: 'First', value: 100, tags: ['a', 'b'] },
          item2: { name: 'Second', value: 200, tags: ['c'] }
        },
        metadata: {
          created: '2024-01-01',
          author: 'Test',
          settings: {
            enabled: true,
            count: 42,
            ratio: 3.14
          }
        }
      };

      const key = (await provider.generateKey()).orThrow();

      const encrypted = (
        await createEncryptedCollectionFile({
          content,
          secretName: 'complex-secret',
          key,
          cryptoProvider: provider
        })
      ).orThrow();

      const decrypted = await decryptCollectionFile(encrypted, key, provider);
      expect(decrypted).toSucceedWith(content);
    });

    test('preserves UTF-8 content', async () => {
      const content = {
        japanese: '日本語',
        chinese: '中文',
        emoji: '🎉🚀💻',
        mixed: 'Hello 世界! 🌍'
      };

      const key = (await provider.generateKey()).orThrow();

      const encrypted = (
        await createEncryptedCollectionFile({
          content,
          secretName: 'utf8-secret',
          key,
          cryptoProvider: provider
        })
      ).orThrow();

      const decrypted = await decryptCollectionFile(encrypted, key, provider);
      expect(decrypted).toSucceedWith(content);
    });
  });

  describe('isEncryptedCollectionFile function', () => {
    test('returns true for encrypted file objects', async () => {
      const key = (await provider.generateKey()).orThrow();
      const encrypted = (
        await createEncryptedCollectionFile({
          content: { test: 'data' },
          secretName: 'test',
          key,
          cryptoProvider: provider
        })
      ).orThrow();

      expect(isEncryptedCollectionFile(encrypted)).toBe(true);
    });

    test('returns false for regular JSON', () => {
      expect(isEncryptedCollectionFile({ test: 'data' })).toBe(false);
    });
  });
});
