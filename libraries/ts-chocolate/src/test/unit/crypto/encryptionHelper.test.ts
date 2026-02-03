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
import { Crypto } from '@fgv/ts-extras';
import { isEncryptedCollectionFile } from '../../../packlets/library-data';

describe('Encryption Functions', () => {
  const provider = Crypto.nodeCryptoProvider;

  describe('Crypto.createEncryptedFile', () => {
    test('creates valid encrypted file from JSON object', async () => {
      const content = { items: [1, 2, 3], name: 'test' };
      const key = (await provider.generateKey()).orThrow();

      const result = await Crypto.createEncryptedFile({
        content,
        secretName: 'my-secret',
        key,
        cryptoProvider: provider
      });

      expect(result).toSucceedAndSatisfy((encrypted) => {
        expect(encrypted.format).toBe(Crypto.ENCRYPTED_FILE_FORMAT);
        expect(encrypted.secretName).toBe('my-secret');
        expect(encrypted.algorithm).toBe(Crypto.DEFAULT_ALGORITHM);
        expect(encrypted.iv).toBeDefined();
        expect(encrypted.authTag).toBeDefined();
        expect(encrypted.encryptedData).toBeDefined();
      });
    });

    test('includes metadata when provided', async () => {
      const content = { items: [1, 2, 3] };
      const key = (await provider.generateKey()).orThrow();

      const result = await Crypto.createEncryptedFile({
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

      const result = await Crypto.createEncryptedFile({
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
      const strResult = await Crypto.createEncryptedFile({
        content: 'hello',
        secretName: 'test',
        key,
        cryptoProvider: provider
      });
      expect(strResult).toSucceed();

      // Number
      const numResult = await Crypto.createEncryptedFile({
        content: 42,
        secretName: 'test',
        key,
        cryptoProvider: provider
      });
      expect(numResult).toSucceed();

      // Array
      const arrResult = await Crypto.createEncryptedFile({
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

      const result = await Crypto.createEncryptedFile({
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

      const result = await Crypto.createEncryptedFile({
        // @ts-expect-error - intentionally passing non-serializable object for test
        content: circular,
        secretName: 'test',
        key,
        cryptoProvider: provider
      });

      expect(result).toFailWith(/Failed to serialize content/);
    });
  });

  describe('Crypto.decryptFile', () => {
    test('decrypts encrypted file back to original content', async () => {
      const content = { items: [1, 2, 3], name: 'test', nested: { a: 'b' } };
      const key = (await provider.generateKey()).orThrow();

      const encrypted = (
        await Crypto.createEncryptedFile({
          content,
          secretName: 'my-secret',
          key,
          cryptoProvider: provider
        })
      ).orThrow();

      const result = await Crypto.decryptFile(encrypted, key, provider);
      expect(result).toSucceedWith(content);
    });

    test('fails with wrong key', async () => {
      const content = { test: 'data' };
      const key1 = (await provider.generateKey()).orThrow();
      const key2 = (await provider.generateKey()).orThrow();

      const encrypted = (
        await Crypto.createEncryptedFile({
          content,
          secretName: 'my-secret',
          key: key1,
          cryptoProvider: provider
        })
      ).orThrow();

      const result = await Crypto.decryptFile(encrypted, key2, provider);
      expect(result).toFail();
    });
  });

  describe('Crypto.tryDecryptFile', () => {
    test('decrypts valid encrypted file', async () => {
      const content = { items: [1, 2, 3] };
      const key = (await provider.generateKey()).orThrow();

      const encrypted = (
        await Crypto.createEncryptedFile({
          content,
          secretName: 'my-secret',
          key,
          cryptoProvider: provider
        })
      ).orThrow();

      // Cast to JsonObject since the encrypted file conforms to the expected structure
      const result = await Crypto.tryDecryptFile(encrypted as unknown as JsonObject, key, provider);
      expect(result).toSucceedWith(content);
    });

    test('fails for non-encrypted JSON object', async () => {
      const plainJson: JsonObject = { items: [1, 2, 3] };
      const key = (await provider.generateKey()).orThrow();

      const result = await Crypto.tryDecryptFile(plainJson, key, provider);
      expect(result).toFailWith(/not an encrypted file/i);
    });

    test('fails for malformed encrypted file', async () => {
      const malformed: JsonObject = {
        format: Crypto.ENCRYPTED_FILE_FORMAT,
        // Missing required fields
        secretName: 'test'
      };
      const key = (await provider.generateKey()).orThrow();

      const result = await Crypto.tryDecryptFile(malformed, key, provider);
      expect(result).toFailWith(/invalid encrypted file format/i);
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
        await Crypto.createEncryptedFile({
          content,
          secretName: 'complex-secret',
          key,
          cryptoProvider: provider
        })
      ).orThrow();

      const decrypted = await Crypto.decryptFile(encrypted, key, provider);
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
        await Crypto.createEncryptedFile({
          content,
          secretName: 'utf8-secret',
          key,
          cryptoProvider: provider
        })
      ).orThrow();

      const decrypted = await Crypto.decryptFile(encrypted, key, provider);
      expect(decrypted).toSucceedWith(content);
    });
  });

  describe('isEncryptedCollectionFile function', () => {
    test('returns true for encrypted file objects', async () => {
      const key = (await provider.generateKey()).orThrow();
      const encrypted = (
        await Crypto.createEncryptedFile({
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
