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

describe('KeyStore.addKeyPair extractable override', () => {
  const provider = CryptoUtils.nodeCryptoProvider;
  const testPassword = 'test-password-123';

  let storage: InMemoryPrivateKeyStorage;
  let keystore: CryptoUtils.KeyStore.KeyStore;

  beforeEach(async () => {
    storage = new InMemoryPrivateKeyStorage();
    keystore = CryptoUtils.KeyStore.KeyStore.create({
      cryptoProvider: provider,
      privateKeyStorage: storage
    }).orThrow();
    await keystore.initialize(testPassword);
  });

  test('omitted extractable preserves default behavior on a non-extractable-capable backend', async () => {
    const result = await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256' });

    expect(result).toSucceedAndSatisfy(({ entry }) => {
      const stored = storage.entries.get(entry.id);
      expect(stored?.extractable).toBe(false);
    });
  });

  test('omitted extractable preserves default behavior on an extractable-only backend', async () => {
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

  test('extractable: true is honored on a non-extractable-capable backend', async () => {
    const result = await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256', extractable: true });

    expect(result).toSucceedAndSatisfy(({ entry }) => {
      const stored = storage.entries.get(entry.id);
      expect(stored?.extractable).toBe(true);
    });
  });

  test('extractable: true is honored on an extractable-only backend', async () => {
    const extractableStorage = new InMemoryPrivateKeyStorage({ supportsNonExtractable: false });
    const ks = CryptoUtils.KeyStore.KeyStore.create({
      cryptoProvider: provider,
      privateKeyStorage: extractableStorage
    }).orThrow();
    await ks.initialize(testPassword);

    const result = await ks.addKeyPair('signing', { algorithm: 'ecdsa-p256', extractable: true });

    expect(result).toSucceedAndSatisfy(({ entry }) => {
      const stored = extractableStorage.entries.get(entry.id);
      expect(stored?.extractable).toBe(true);
    });
  });

  test('extractable: false is honored on a non-extractable-capable backend', async () => {
    const result = await keystore.addKeyPair('signing', { algorithm: 'ecdsa-p256', extractable: false });

    expect(result).toSucceedAndSatisfy(({ entry }) => {
      const stored = storage.entries.get(entry.id);
      expect(stored?.extractable).toBe(false);
    });
  });

  test('extractable: false fails loudly on an extractable-only backend and adds no key', async () => {
    const extractableStorage = new InMemoryPrivateKeyStorage({ supportsNonExtractable: false });
    const ks = CryptoUtils.KeyStore.KeyStore.create({
      cryptoProvider: provider,
      privateKeyStorage: extractableStorage
    }).orThrow();
    await ks.initialize(testPassword);

    const result = await ks.addKeyPair('signing', { algorithm: 'ecdsa-p256', extractable: false });

    expect(result).toFailWith(/does not support non-extractable keys/i);
    expect(ks.hasSecret('signing')).toSucceedWith(false);
    expect(extractableStorage.entries.size).toBe(0);
  });
});
