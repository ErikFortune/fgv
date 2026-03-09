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

import * as CryptoUtils from '../../../packlets/crypto-utils';

describe('DirectEncryptionProvider', () => {
  const cryptoProvider = CryptoUtils.nodeCryptoProvider;
  let testKey: Uint8Array;

  beforeAll(async () => {
    testKey = (await cryptoProvider.generateKey()).orThrow();
  });

  describe('create', () => {
    test('creates a provider with key and cryptoProvider', () => {
      const result = CryptoUtils.DirectEncryptionProvider.create({
        cryptoProvider,
        key: testKey
      });
      expect(result).toSucceedAndSatisfy((provider) => {
        expect(provider.boundSecretName).toBeUndefined();
      });
    });

    test('creates a provider with bound secret name', () => {
      const result = CryptoUtils.DirectEncryptionProvider.create({
        cryptoProvider,
        key: testKey,
        boundSecretName: 'my-secret'
      });
      expect(result).toSucceedAndSatisfy((provider) => {
        expect(provider.boundSecretName).toBe('my-secret');
      });
    });

    test('fails with empty key', () => {
      const result = CryptoUtils.DirectEncryptionProvider.create({
        cryptoProvider,
        key: new Uint8Array(0)
      });
      expect(result).toFailWith(/empty/i);
    });
  });

  describe('encryptByName', () => {
    test('encrypts content with any secret name when unbound', async () => {
      const provider = CryptoUtils.DirectEncryptionProvider.create({
        cryptoProvider,
        key: testKey
      }).orThrow();

      const result = await provider.encryptByName('any-name', { hello: 'world' });
      expect(result).toSucceedAndSatisfy((encrypted) => {
        expect(encrypted.format).toBe(CryptoUtils.Constants.ENCRYPTED_FILE_FORMAT);
        expect(encrypted.secretName).toBe('any-name');
        expect(typeof encrypted.encryptedData).toBe('string');
      });
    });

    test('encrypts content when secret name matches bound name', async () => {
      const provider = CryptoUtils.DirectEncryptionProvider.create({
        cryptoProvider,
        key: testKey,
        boundSecretName: 'my-secret'
      }).orThrow();

      const result = await provider.encryptByName('my-secret', { data: 42 });
      expect(result).toSucceedAndSatisfy((encrypted) => {
        expect(encrypted.secretName).toBe('my-secret');
      });
    });

    test('fails when secret name does not match bound name', async () => {
      const provider = CryptoUtils.DirectEncryptionProvider.create({
        cryptoProvider,
        key: testKey,
        boundSecretName: 'my-secret'
      }).orThrow();

      const result = await provider.encryptByName('wrong-name', { data: 42 });
      expect(result).toFailWith(/mismatch/i);
    });

    test('includes metadata in encrypted file', async () => {
      const provider = CryptoUtils.DirectEncryptionProvider.create({
        cryptoProvider,
        key: testKey
      }).orThrow();

      const metadata = { collectionId: 'test', itemCount: 3 };
      const result = await provider.encryptByName('my-secret', { data: 1 }, metadata);
      expect(result).toSucceedAndSatisfy((encrypted) => {
        expect(encrypted.metadata).toEqual(metadata);
      });
    });

    test('encrypted content can be decrypted', async () => {
      const provider = CryptoUtils.DirectEncryptionProvider.create({
        cryptoProvider,
        key: testKey
      }).orThrow();

      const originalContent = { items: [1, 2, 3], nested: { key: 'value' } };
      const encryptResult = await provider.encryptByName('my-secret', originalContent);
      expect(encryptResult).toSucceed();

      const decryptResult = await CryptoUtils.decryptFile(encryptResult.orThrow(), testKey, cryptoProvider);
      expect(decryptResult).toSucceedAndSatisfy((decrypted) => {
        expect(decrypted).toEqual(originalContent);
      });
    });
  });
});
