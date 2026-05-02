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

import * as crypto from 'crypto';
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

  describe('sha256', () => {
    test('hashes a simple string', async () => {
      const result = await provider.sha256('hello');
      expect(result).toSucceedAndSatisfy((hash) => {
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
        // Known SHA-256 of "hello"
        expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
      });
    });

    test('hashes an empty string', async () => {
      const result = await provider.sha256('');
      expect(result).toSucceedAndSatisfy((hash) => {
        // Known SHA-256 of ""
        expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      });
    });

    test('hashes UTF-8 content', async () => {
      const result = await provider.sha256('Hello, 世界!');
      expect(result).toSucceedAndSatisfy((hash) => {
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
      });
    });

    test('produces deterministic output', async () => {
      const hash1 = (await provider.sha256('test-input')).orThrow();
      const hash2 = (await provider.sha256('test-input')).orThrow();
      expect(hash1).toBe(hash2);
    });

    test('produces different output for different inputs', async () => {
      const hash1 = (await provider.sha256('input-1')).orThrow();
      const hash2 = (await provider.sha256('input-2')).orThrow();
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('singleton instance', () => {
    test('Crypto.nodeCryptoProvider is a Crypto.NodeCryptoProvider instance', () => {
      expect(CryptoUtils.nodeCryptoProvider).toBeInstanceOf(CryptoUtils.NodeCryptoProvider);
    });
  });

  describe('generateKeyPair', () => {
    test('generates an ECDSA P-256 keypair with sign/verify usages', async () => {
      const result = await provider.generateKeyPair('ecdsa-p256', true);
      expect(result).toSucceedAndSatisfy((pair) => {
        expect(pair.privateKey.algorithm.name).toBe('ECDSA');
        expect(pair.publicKey.algorithm.name).toBe('ECDSA');
        expect(pair.privateKey.usages).toContain('sign');
        expect(pair.publicKey.usages).toContain('verify');
        expect(pair.privateKey.extractable).toBe(true);
        expect(pair.publicKey.extractable).toBe(true);
      });
    });

    test('generates an RSA-OAEP 2048 keypair with encrypt/decrypt usages', async () => {
      const result = await provider.generateKeyPair('rsa-oaep-2048', true);
      expect(result).toSucceedAndSatisfy((pair) => {
        expect(pair.privateKey.algorithm.name).toBe('RSA-OAEP');
        expect(pair.publicKey.algorithm.name).toBe('RSA-OAEP');
        expect(pair.privateKey.usages).toContain('decrypt');
        expect(pair.publicKey.usages).toContain('encrypt');
      });
    });

    test('generates a non-extractable private key when extractable=false', async () => {
      const result = await provider.generateKeyPair('ecdsa-p256', false);
      expect(result).toSucceedAndSatisfy((pair) => {
        expect(pair.privateKey.extractable).toBe(false);
      });
    });

    test('generates unique keypairs across calls', async () => {
      const pair1 = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();
      const pair2 = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();
      const jwk1 = (await provider.exportPublicKeyJwk(pair1.publicKey)).orThrow();
      const jwk2 = (await provider.exportPublicKeyJwk(pair2.publicKey)).orThrow();
      expect(jwk1).not.toEqual(jwk2);
    });

    test('generates an ECDH P-256 keypair with derive usages on the private key', async () => {
      const result = await provider.generateKeyPair('ecdh-p256', true);
      expect(result).toSucceedAndSatisfy((pair) => {
        expect(pair.privateKey.algorithm.name).toBe('ECDH');
        expect(pair.publicKey.algorithm.name).toBe('ECDH');
        expect((pair.privateKey.algorithm as EcKeyAlgorithm).namedCurve).toBe('P-256');
        expect((pair.publicKey.algorithm as EcKeyAlgorithm).namedCurve).toBe('P-256');
        expect(pair.privateKey.usages).toContain('deriveKey');
        // WebCrypto strips usages a public ECDH key cannot exercise.
        expect(pair.publicKey.usages).toEqual([]);
        expect(pair.privateKey.extractable).toBe(true);
        expect(pair.publicKey.extractable).toBe(true);
      });
    });

    test('generates a non-extractable ECDH P-256 private key when extractable=false', async () => {
      const result = await provider.generateKeyPair('ecdh-p256', false);
      expect(result).toSucceedAndSatisfy((pair) => {
        expect(pair.privateKey.extractable).toBe(false);
      });
    });

    test('generates an Ed25519 keypair with sign/verify usages', async () => {
      const result = await provider.generateKeyPair('ed25519', true);
      expect(result).toSucceedAndSatisfy((pair) => {
        expect(pair.privateKey.algorithm.name).toBe('Ed25519');
        expect(pair.publicKey.algorithm.name).toBe('Ed25519');
        expect(pair.privateKey.usages).toContain('sign');
        expect(pair.publicKey.usages).toContain('verify');
        expect(pair.privateKey.extractable).toBe(true);
        expect(pair.publicKey.extractable).toBe(true);
      });
    });

    test('generates a non-extractable Ed25519 private key when extractable=false', async () => {
      const result = await provider.generateKeyPair('ed25519', false);
      expect(result).toSucceedAndSatisfy((pair) => {
        expect(pair.privateKey.extractable).toBe(false);
      });
    });
  });

  describe('exportPublicKeyJwk', () => {
    test('exports an ECDSA public key as a P-256 EC JWK', async () => {
      const pair = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();
      const result = await provider.exportPublicKeyJwk(pair.publicKey);
      expect(result).toSucceedAndSatisfy((jwk) => {
        expect(jwk.kty).toBe('EC');
        expect(jwk.crv).toBe('P-256');
        expect(typeof jwk.x).toBe('string');
        expect(typeof jwk.y).toBe('string');
      });
    });

    test('exports an RSA public key as an RSA JWK', async () => {
      const pair = (await provider.generateKeyPair('rsa-oaep-2048', true)).orThrow();
      const result = await provider.exportPublicKeyJwk(pair.publicKey);
      expect(result).toSucceedAndSatisfy((jwk) => {
        expect(jwk.kty).toBe('RSA');
        expect(typeof jwk.n).toBe('string');
        expect(jwk.e).toBe('AQAB');
      });
    });

    test('exports an ECDH public key as a P-256 EC JWK', async () => {
      const pair = (await provider.generateKeyPair('ecdh-p256', true)).orThrow();
      const result = await provider.exportPublicKeyJwk(pair.publicKey);
      expect(result).toSucceedAndSatisfy((jwk) => {
        expect(jwk.kty).toBe('EC');
        expect(jwk.crv).toBe('P-256');
        expect(typeof jwk.x).toBe('string');
        expect(typeof jwk.y).toBe('string');
      });
    });

    test('exports an Ed25519 public key as an OKP JWK', async () => {
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
      const result = await provider.exportPublicKeyJwk(pair.publicKey);
      expect(result).toSucceedAndSatisfy((jwk) => {
        expect(jwk.kty).toBe('OKP');
        expect(jwk.crv).toBe('Ed25519');
        expect(typeof jwk.x).toBe('string');
      });
    });

    test('rejects a private CryptoKey to prevent leaking private fields as JWK', async () => {
      // WebCrypto's exportKey('jwk', privateKey) would happily return the
      // private fields (d/p/q/...) — the runtime guard on `key.type`
      // ensures the method honours its public-only contract.
      const pair = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();
      const result = await provider.exportPublicKeyJwk(pair.privateKey);
      expect(result).toFailWith(/requires a public CryptoKey, got 'private'/);
    });
  });

  describe('importPublicKeyJwk', () => {
    test('round-trips an ECDSA P-256 public key through JWK', async () => {
      const pair = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();
      const jwk = (await provider.exportPublicKeyJwk(pair.publicKey)).orThrow();
      const result = await provider.importPublicKeyJwk(jwk, 'ecdsa-p256');
      expect(result).toSucceedAndSatisfy((reimported) => {
        expect(reimported.algorithm.name).toBe('ECDSA');
        expect(reimported.usages).toEqual(['verify']);
      });
    });

    test('round-trips an RSA-OAEP 2048 public key through JWK', async () => {
      const pair = (await provider.generateKeyPair('rsa-oaep-2048', true)).orThrow();
      const jwk = (await provider.exportPublicKeyJwk(pair.publicKey)).orThrow();
      const result = await provider.importPublicKeyJwk(jwk, 'rsa-oaep-2048');
      expect(result).toSucceedAndSatisfy((reimported) => {
        expect(reimported.algorithm.name).toBe('RSA-OAEP');
        expect(reimported.usages).toEqual(['encrypt']);
      });
    });

    test('round-trips an ECDH P-256 public key through JWK', async () => {
      const pair = (await provider.generateKeyPair('ecdh-p256', true)).orThrow();
      const jwk = (await provider.exportPublicKeyJwk(pair.publicKey)).orThrow();
      const result = await provider.importPublicKeyJwk(jwk, 'ecdh-p256');
      expect(result).toSucceedAndSatisfy((reimported) => {
        expect(reimported.algorithm.name).toBe('ECDH');
        expect((reimported.algorithm as EcKeyAlgorithm).namedCurve).toBe('P-256');
        // Public ECDH keys cannot derive on their own — empty usages.
        expect(reimported.usages).toEqual([]);
      });
    });

    test('round-trips an Ed25519 public key through JWK', async () => {
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
      const jwk = (await provider.exportPublicKeyJwk(pair.publicKey)).orThrow();
      const result = await provider.importPublicKeyJwk(jwk, 'ed25519');
      expect(result).toSucceedAndSatisfy((reimported) => {
        expect(reimported.algorithm.name).toBe('Ed25519');
        expect(reimported.usages).toEqual(['verify']);
      });
    });

    test('fails when JWK does not match the requested algorithm', async () => {
      const pair = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();
      const jwk = (await provider.exportPublicKeyJwk(pair.publicKey)).orThrow();
      const result = await provider.importPublicKeyJwk(jwk, 'rsa-oaep-2048');
      expect(result).toFailWith(/import.*rsa-oaep-2048/i);
    });

    test('fails on malformed JWK', async () => {
      const result = await provider.importPublicKeyJwk({ kty: 'EC' } as JsonWebKey, 'ecdsa-p256');
      expect(result).toFailWith(/import.*ecdsa-p256/i);
    });
  });

  describe('end-to-end asymmetric usage', () => {
    test('ECDSA: signs with private key, verifies with re-imported public key', async () => {
      const pair = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();
      const jwk = (await provider.exportPublicKeyJwk(pair.publicKey)).orThrow();
      const verifyKey = (await provider.importPublicKeyJwk(jwk, 'ecdsa-p256')).orThrow();

      const message = new TextEncoder().encode('hello, asymmetry');
      const signature = await crypto.webcrypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        pair.privateKey,
        message
      );

      const verified = await crypto.webcrypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        verifyKey,
        signature,
        message
      );
      expect(verified).toBe(true);
    });

    test('RSA-OAEP: encrypts with re-imported public key, decrypts with private key', async () => {
      const pair = (await provider.generateKeyPair('rsa-oaep-2048', true)).orThrow();
      const jwk = (await provider.exportPublicKeyJwk(pair.publicKey)).orThrow();
      const encryptKey = (await provider.importPublicKeyJwk(jwk, 'rsa-oaep-2048')).orThrow();

      const plaintext = new TextEncoder().encode('confidential payload');
      const ciphertext = await crypto.webcrypto.subtle.encrypt({ name: 'RSA-OAEP' }, encryptKey, plaintext);

      const decrypted = await crypto.webcrypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        pair.privateKey,
        ciphertext
      );
      expect(new TextDecoder().decode(decrypted)).toBe('confidential payload');
    });

    test('Ed25519: signs with private key, verifies with re-imported public key', async () => {
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
      const jwk = (await provider.exportPublicKeyJwk(pair.publicKey)).orThrow();
      const verifyKey = (await provider.importPublicKeyJwk(jwk, 'ed25519')).orThrow();

      const message = new TextEncoder().encode('hello, edwards');
      const signature = await crypto.webcrypto.subtle.sign({ name: 'Ed25519' }, pair.privateKey, message);

      const verified = await crypto.webcrypto.subtle.verify(
        { name: 'Ed25519' },
        verifyKey,
        signature,
        message
      );
      expect(verified).toBe(true);

      const tampered = new TextEncoder().encode('hello, edwards!');
      const verifiedTampered = await crypto.webcrypto.subtle.verify(
        { name: 'Ed25519' },
        verifyKey,
        signature,
        tampered
      );
      expect(verifiedTampered).toBe(false);
    });

    test('ECDH P-256: wrapBytes with re-imported public key, unwrapBytes with private key', async () => {
      const recipient = (await provider.generateKeyPair('ecdh-p256', true)).orThrow();
      const jwk = (await provider.exportPublicKeyJwk(recipient.publicKey)).orThrow();
      const recipientPublic = (await provider.importPublicKeyJwk(jwk, 'ecdh-p256')).orThrow();

      const plaintext = new TextEncoder().encode('per-buyer wrapped secret');
      const options = {
        salt: new TextEncoder().encode('content-hash'),
        info: new TextEncoder().encode('secret-name')
      };

      const wrapped = (await provider.wrapBytes(plaintext, recipientPublic, options)).orThrow();
      const unwrapped = (await provider.unwrapBytes(wrapped, recipient.privateKey, options)).orThrow();
      expect(unwrapped).toEqual(plaintext);
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
