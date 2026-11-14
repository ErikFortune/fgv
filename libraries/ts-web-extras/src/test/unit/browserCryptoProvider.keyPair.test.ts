/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import '@fgv/ts-utils-jest';

import { BrowserCryptoProvider } from '../../packlets/crypto-utils';

const provider = new BrowserCryptoProvider();
const subtle = globalThis.crypto.subtle;

describe('BrowserCryptoProvider — X25519 keypair', () => {
  describe('generateKeyPair', () => {
    test('generates an X25519 keypair with deriveKey/deriveBits usages on private key and empty usages on public', async () => {
      const result = await provider.generateKeyPair('x25519', true);
      expect(result).toSucceedAndSatisfy((pair) => {
        expect(pair.privateKey.algorithm.name).toBe('X25519');
        expect(pair.publicKey.algorithm.name).toBe('X25519');
        expect(pair.privateKey.usages).toContain('deriveKey');
        expect(pair.privateKey.usages).toContain('deriveBits');
        // WebCrypto strips usages a public X25519 key cannot exercise.
        expect(pair.publicKey.usages).toEqual([]);
        expect(pair.privateKey.extractable).toBe(true);
        expect(pair.publicKey.extractable).toBe(true);
      });
    });

    test('generates a non-extractable X25519 private key when extractable=false', async () => {
      const result = await provider.generateKeyPair('x25519', false);
      expect(result).toSucceedAndSatisfy((pair) => {
        expect(pair.privateKey.extractable).toBe(false);
      });
    });
  });

  describe('X25519 JWK round-trip', () => {
    test('exports an X25519 public key as an OKP JWK and re-imports it', async () => {
      const pair = (await provider.generateKeyPair('x25519', true)).orThrow();
      const jwk = (await provider.exportPublicKeyJwk(pair.publicKey)).orThrow();
      expect(jwk.kty).toBe('OKP');
      expect(jwk.crv).toBe('X25519');
      expect(typeof jwk.x).toBe('string');

      const result = await provider.importPublicKeyJwk(jwk, 'x25519');
      expect(result).toSucceedAndSatisfy((reimported) => {
        expect(reimported.algorithm.name).toBe('X25519');
        expect(reimported.usages).toEqual([]);
      });
    });
  });

  describe('X25519 ECDH', () => {
    test('two X25519 keypairs derive the same 32-byte shared secret', async () => {
      const pairA = (await provider.generateKeyPair('x25519', true)).orThrow();
      const pairB = (await provider.generateKeyPair('x25519', true)).orThrow();

      const secretAB = await subtle.deriveBits(
        { name: 'X25519', public: pairB.publicKey },
        pairA.privateKey,
        256
      );
      const secretBA = await subtle.deriveBits(
        { name: 'X25519', public: pairA.publicKey },
        pairB.privateKey,
        256
      );

      expect(new Uint8Array(secretAB).length).toBe(32);
      expect(new Uint8Array(secretBA).length).toBe(32);
      expect(new Uint8Array(secretAB)).toEqual(new Uint8Array(secretBA));
    });
  });

  describe('X25519 negative cases', () => {
    test('exportPublicKeyJwk rejects a private key', async () => {
      const pair = (await provider.generateKeyPair('x25519', false)).orThrow();
      const result = await provider.exportPublicKeyJwk(pair.privateKey);
      expect(result).toFailWith(/requires a public CryptoKey, got 'private'/);
    });
  });
});

describe('BrowserCryptoProvider — Ed25519 keypair', () => {
  describe('generateKeyPair', () => {
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

  describe('end-to-end sign/verify', () => {
    test('signs with private key and verifies with re-imported public key', async () => {
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
      const jwk = (await provider.exportPublicKeyJwk(pair.publicKey)).orThrow();
      expect(jwk.kty).toBe('OKP');
      expect(jwk.crv).toBe('Ed25519');
      const verifyKey = (await provider.importPublicKeyJwk(jwk, 'ed25519')).orThrow();

      const message = new TextEncoder().encode('hello, edwards');
      const signature = await subtle.sign({ name: 'Ed25519' }, pair.privateKey, message);

      const verified = await subtle.verify({ name: 'Ed25519' }, verifyKey, signature, message);
      expect(verified).toBe(true);

      const tampered = new TextEncoder().encode('hello, edwards!');
      const verifiedTampered = await subtle.verify({ name: 'Ed25519' }, verifyKey, signature, tampered);
      expect(verifiedTampered).toBe(false);
    });
  });
});
