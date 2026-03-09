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

import * as CryptoUtils from '../../../packlets/crypto-utils';

describe('Crypto.NodeCryptoProvider', () => {
  const provider = CryptoUtils.nodeCryptoProvider;

  describe('generateKey', () => {
    test('generates a 32-byte key', async () => {
      const result = await provider.generateKey();
      expect(result).toSucceedAndSatisfy((key) => {
        expect(key).toBeInstanceOf(Uint8Array);
        expect(key.length).toBe(CryptoUtils.Constants.AES_256_KEY_SIZE);
      });
    });

    test('generates unique keys on each call', async () => {
      const key1 = (await provider.generateKey()).orThrow();
      const key2 = (await provider.generateKey()).orThrow();
      expect(key1).not.toEqual(key2);
    });
  });

  describe('encrypt/decrypt round trip', () => {
    test('successfully encrypts and decrypts a simple string', async () => {
      const plaintext = 'Hello, World!';
      const key = (await provider.generateKey()).orThrow();

      const encryptResult = await provider.encrypt(plaintext, key);
      expect(encryptResult).toSucceedAndSatisfy((encrypted) => {
        expect(encrypted.iv.length).toBe(CryptoUtils.Constants.GCM_IV_SIZE);
        expect(encrypted.authTag.length).toBe(CryptoUtils.Constants.GCM_AUTH_TAG_SIZE);
        expect(encrypted.encryptedData.length).toBeGreaterThan(0);
      });

      const encrypted = encryptResult.orThrow();
      const decryptResult = await provider.decrypt(
        encrypted.encryptedData,
        key,
        encrypted.iv,
        encrypted.authTag
      );
      expect(decryptResult).toSucceedWith(plaintext);
    });

    test('successfully encrypts and decrypts UTF-8 content', async () => {
      const plaintext = 'Hello, 世界! 🌍';
      const key = (await provider.generateKey()).orThrow();

      const encrypted = (await provider.encrypt(plaintext, key)).orThrow();
      const decrypted = await provider.decrypt(encrypted.encryptedData, key, encrypted.iv, encrypted.authTag);
      expect(decrypted).toSucceedWith(plaintext);
    });

    test('successfully encrypts and decrypts JSON content', async () => {
      const jsonContent = JSON.stringify({ name: 'test', values: [1, 2, 3], nested: { a: 'b' } });
      const key = (await provider.generateKey()).orThrow();

      const encrypted = (await provider.encrypt(jsonContent, key)).orThrow();
      const decrypted = await provider.decrypt(encrypted.encryptedData, key, encrypted.iv, encrypted.authTag);
      expect(decrypted).toSucceedWith(jsonContent);
    });

    test('successfully encrypts and decrypts an empty string', async () => {
      const plaintext = '';
      const key = (await provider.generateKey()).orThrow();

      const encrypted = (await provider.encrypt(plaintext, key)).orThrow();
      const decrypted = await provider.decrypt(encrypted.encryptedData, key, encrypted.iv, encrypted.authTag);
      expect(decrypted).toSucceedWith(plaintext);
    });

    test('successfully encrypts and decrypts large content', async () => {
      const plaintext = 'x'.repeat(100000);
      const key = (await provider.generateKey()).orThrow();

      const encrypted = (await provider.encrypt(plaintext, key)).orThrow();
      const decrypted = await provider.decrypt(encrypted.encryptedData, key, encrypted.iv, encrypted.authTag);
      expect(decrypted).toSucceedWith(plaintext);
    });
  });

  describe('encrypt', () => {
    test('fails with invalid key size (too short)', async () => {
      const key = new Uint8Array(16); // AES-128 key, not AES-256
      const result = await provider.encrypt('test', key);
      expect(result).toFailWith(/key must be 32 bytes/i);
    });

    test('fails with invalid key size (too long)', async () => {
      const key = new Uint8Array(64);
      const result = await provider.encrypt('test', key);
      expect(result).toFailWith(/key must be 32 bytes/i);
    });

    test('generates unique IV for each encryption', async () => {
      const key = (await provider.generateKey()).orThrow();
      const plaintext = 'test';

      const encrypted1 = (await provider.encrypt(plaintext, key)).orThrow();
      const encrypted2 = (await provider.encrypt(plaintext, key)).orThrow();

      expect(encrypted1.iv).not.toEqual(encrypted2.iv);
      expect(encrypted1.encryptedData).not.toEqual(encrypted2.encryptedData);
    });
  });

  describe('decrypt', () => {
    test('fails with wrong key', async () => {
      const key1 = (await provider.generateKey()).orThrow();
      const key2 = (await provider.generateKey()).orThrow();

      const encrypted = (await provider.encrypt('test', key1)).orThrow();
      const result = await provider.decrypt(encrypted.encryptedData, key2, encrypted.iv, encrypted.authTag);
      expect(result).toFail();
    });

    test('fails with tampered encrypted data', async () => {
      const key = (await provider.generateKey()).orThrow();
      const encrypted = (await provider.encrypt('test', key)).orThrow();

      // Tamper with encrypted data
      const tampered = new Uint8Array(encrypted.encryptedData);
      tampered[0] ^= 0xff;

      const result = await provider.decrypt(tampered, key, encrypted.iv, encrypted.authTag);
      expect(result).toFail();
    });

    test('fails with tampered auth tag', async () => {
      const key = (await provider.generateKey()).orThrow();
      const encrypted = (await provider.encrypt('test', key)).orThrow();

      // Tamper with auth tag
      const tampered = new Uint8Array(encrypted.authTag);
      tampered[0] ^= 0xff;

      const result = await provider.decrypt(encrypted.encryptedData, key, encrypted.iv, tampered);
      expect(result).toFail();
    });

    test('fails with invalid key size', async () => {
      const key = (await provider.generateKey()).orThrow();
      const encrypted = (await provider.encrypt('test', key)).orThrow();

      const shortKey = new Uint8Array(16);
      const result = await provider.decrypt(
        encrypted.encryptedData,
        shortKey,
        encrypted.iv,
        encrypted.authTag
      );
      expect(result).toFailWith(/key must be 32 bytes/i);
    });

    test('fails with invalid IV size', async () => {
      const key = (await provider.generateKey()).orThrow();
      const encrypted = (await provider.encrypt('test', key)).orThrow();

      const shortIv = new Uint8Array(8);
      const result = await provider.decrypt(encrypted.encryptedData, key, shortIv, encrypted.authTag);
      expect(result).toFailWith(/IV must be 12 bytes/i);
    });

    test('fails with invalid auth tag size', async () => {
      const key = (await provider.generateKey()).orThrow();
      const encrypted = (await provider.encrypt('test', key)).orThrow();

      const shortTag = new Uint8Array(8);
      const result = await provider.decrypt(encrypted.encryptedData, key, encrypted.iv, shortTag);
      expect(result).toFailWith(/auth tag must be 16 bytes/i);
    });
  });

  describe('deriveKey', () => {
    test('derives a 32-byte key from password', async () => {
      const password = 'my-secret-password';
      const salt = new Uint8Array(16).fill(1);

      const result = await provider.deriveKey(password, salt, 1000);
      expect(result).toSucceedAndSatisfy((key) => {
        expect(key).toBeInstanceOf(Uint8Array);
        expect(key.length).toBe(CryptoUtils.Constants.AES_256_KEY_SIZE);
      });
    });

    test('produces deterministic output for same inputs', async () => {
      const password = 'my-secret-password';
      const salt = new Uint8Array(16).fill(1);

      const key1 = (await provider.deriveKey(password, salt, 1000)).orThrow();
      const key2 = (await provider.deriveKey(password, salt, 1000)).orThrow();
      expect(key1).toEqual(key2);
    });

    test('produces different output for different passwords', async () => {
      const salt = new Uint8Array(16).fill(1);

      const key1 = (await provider.deriveKey('password1', salt, 1000)).orThrow();
      const key2 = (await provider.deriveKey('password2', salt, 1000)).orThrow();
      expect(key1).not.toEqual(key2);
    });

    test('produces different output for different salts', async () => {
      const password = 'my-secret-password';
      const salt1 = new Uint8Array(16).fill(1);
      const salt2 = new Uint8Array(16).fill(2);

      const key1 = (await provider.deriveKey(password, salt1, 1000)).orThrow();
      const key2 = (await provider.deriveKey(password, salt2, 1000)).orThrow();
      expect(key1).not.toEqual(key2);
    });

    test('produces different output for different iteration counts', async () => {
      const password = 'my-secret-password';
      const salt = new Uint8Array(16).fill(1);

      const key1 = (await provider.deriveKey(password, salt, 1000)).orThrow();
      const key2 = (await provider.deriveKey(password, salt, 2000)).orThrow();
      expect(key1).not.toEqual(key2);
    });

    test('fails with invalid iterations (0)', async () => {
      const result = await provider.deriveKey('password', new Uint8Array(16), 0);
      expect(result).toFailWith(/iterations must be at least 1/i);
    });

    test('fails with invalid iterations (negative)', async () => {
      const result = await provider.deriveKey('password', new Uint8Array(16), -1);
      expect(result).toFailWith(/iterations must be at least 1/i);
    });

    test('fails with salt too short', async () => {
      const result = await provider.deriveKey('password', new Uint8Array(4), 1000);
      expect(result).toFailWith(/salt should be at least 8 bytes/i);
    });

    test('derived key can be used for encryption', async () => {
      const password = 'my-secret-password';
      const salt = new Uint8Array(16).fill(1);
      const key = (await provider.deriveKey(password, salt, 1000)).orThrow();

      const plaintext = 'secret message';
      const encrypted = (await provider.encrypt(plaintext, key)).orThrow();
      const decrypted = await provider.decrypt(encrypted.encryptedData, key, encrypted.iv, encrypted.authTag);
      expect(decrypted).toSucceedWith(plaintext);
    });
  });

  describe('singleton instance', () => {
    test('Crypto.nodeCryptoProvider is a Crypto.NodeCryptoProvider instance', () => {
      expect(CryptoUtils.nodeCryptoProvider).toBeInstanceOf(CryptoUtils.NodeCryptoProvider);
    });
  });

  describe('generateRandomBytes', () => {
    test('generates random bytes of specified length', () => {
      const result = provider.generateRandomBytes(16);
      expect(result).toSucceedAndSatisfy((bytes) => {
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(16);
      });
    });

    test('generates unique bytes on each call', () => {
      const bytes1 = provider.generateRandomBytes(32).orThrow();
      const bytes2 = provider.generateRandomBytes(32).orThrow();
      expect(bytes1).not.toEqual(bytes2);
    });

    test('fails with length less than 1', () => {
      expect(provider.generateRandomBytes(0)).toFailWith(/at least 1/i);
      expect(provider.generateRandomBytes(-1)).toFailWith(/at least 1/i);
    });
  });

  describe('toBase64', () => {
    test('encodes empty array', () => {
      const result = provider.toBase64(new Uint8Array(0));
      expect(result).toBe('');
    });

    test('encodes simple bytes', () => {
      // "Hello" in bytes
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      const result = provider.toBase64(bytes);
      expect(result).toBe('SGVsbG8=');
    });

    test('encodes binary data correctly', () => {
      // All possible byte values 0-255 in a pattern
      const bytes = new Uint8Array([0, 1, 2, 3, 253, 254, 255]);
      const result = provider.toBase64(bytes);
      // Verify round-trip
      expect(provider.fromBase64(result)).toSucceedWith(bytes);
    });
  });

  describe('fromBase64', () => {
    test('decodes empty string', () => {
      const result = provider.fromBase64('');
      expect(result).toSucceedWith(new Uint8Array(0));
    });

    test('decodes simple base64', () => {
      const result = provider.fromBase64('SGVsbG8=');
      expect(result).toSucceedWith(new Uint8Array([72, 101, 108, 108, 111]));
    });

    test('fails with invalid base64 characters', () => {
      expect(provider.fromBase64('not!valid!base64')).toFailWith(/invalid base64/i);
      expect(provider.fromBase64('hello@world')).toFailWith(/invalid base64/i);
    });

    test('round-trips with toBase64', () => {
      const original = provider.generateRandomBytes(32).orThrow();
      const encoded = provider.toBase64(original);
      const decoded = provider.fromBase64(encoded);
      expect(decoded).toSucceedWith(original);
    });
  });
});
