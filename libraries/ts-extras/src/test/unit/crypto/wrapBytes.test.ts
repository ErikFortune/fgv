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

import * as crypto from 'crypto';
import * as CryptoUtils from '../../../packlets/crypto-utils';

const subtle = crypto.webcrypto.subtle;

async function generateEcdhPair(curve: 'P-256' | 'P-384' = 'P-256'): Promise<CryptoKeyPair> {
  return (await subtle.generateKey({ name: 'ECDH', namedCurve: curve }, true, [
    'deriveKey',
    'deriveBits'
  ])) as CryptoKeyPair;
}

async function generateEcdsaPair(): Promise<CryptoKeyPair> {
  return (await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify'
  ])) as CryptoKeyPair;
}

describe('Crypto.NodeCryptoProvider — wrapBytes/unwrapBytes', () => {
  const provider = CryptoUtils.nodeCryptoProvider;
  const defaultOptions: CryptoUtils.IWrapBytesOptions = {
    salt: new TextEncoder().encode('test-salt'),
    info: new TextEncoder().encode('test-info')
  };

  describe('round-trip', () => {
    test.each<[string, Uint8Array]>([
      ['32-byte plaintext (AES-256 key shape)', new Uint8Array(crypto.randomBytes(32))],
      ['1-byte plaintext', new Uint8Array([0x42])],
      ['1KB plaintext', new Uint8Array(crypto.randomBytes(1024))],
      ['empty plaintext', new Uint8Array(0)],
      ['high-bit-set bytes', new Uint8Array(64).fill(0xff)]
    ])('round-trips %s', async (__label, plaintext) => {
      const pair = await generateEcdhPair();
      const wrapped = (await provider.wrapBytes(plaintext, pair.publicKey, defaultOptions)).orThrow();
      expect(wrapped.ephemeralPublicKey.kty).toBe('EC');
      expect(wrapped.ephemeralPublicKey.crv).toBe('P-256');
      const recovered = (await provider.unwrapBytes(wrapped, pair.privateKey, defaultOptions)).orThrow();
      expect(new Uint8Array(recovered)).toEqual(plaintext);
    });

    test('unwrap with the recipient privateKey returns identical bytes', async () => {
      const pair = await generateEcdhPair();
      const plaintext = new Uint8Array(crypto.randomBytes(48));
      const wrapped = (await provider.wrapBytes(plaintext, pair.publicKey, defaultOptions)).orThrow();
      const recovered = (await provider.unwrapBytes(wrapped, pair.privateKey, defaultOptions)).orThrow();
      expect(Buffer.from(recovered).equals(Buffer.from(plaintext))).toBe(true);
    });
  });

  describe('determinism / freshness', () => {
    test('two wraps of identical inputs produce different ephemeral keys and ciphertexts', async () => {
      const pair = await generateEcdhPair();
      const plaintext = new TextEncoder().encode('same payload');
      const w1 = (await provider.wrapBytes(plaintext, pair.publicKey, defaultOptions)).orThrow();
      const w2 = (await provider.wrapBytes(plaintext, pair.publicKey, defaultOptions)).orThrow();
      expect(w1.ephemeralPublicKey).not.toEqual(w2.ephemeralPublicKey);
      expect(w1.ciphertext).not.toEqual(w2.ciphertext);
      expect(w1.nonce).not.toEqual(w2.nonce);
    });
  });

  describe('tampering', () => {
    test('flipping a bit in the nonce fails GCM authentication', async () => {
      const pair = await generateEcdhPair();
      const wrapped = (
        await provider.wrapBytes(new TextEncoder().encode('payload'), pair.publicKey, defaultOptions)
      ).orThrow();
      const nonce = provider.fromBase64(wrapped.nonce).orThrow();
      nonce[0] ^= 0xff;
      const tampered: CryptoUtils.IWrappedBytes = { ...wrapped, nonce: provider.toBase64(nonce) };
      expect(await provider.unwrapBytes(tampered, pair.privateKey, defaultOptions)).toFailWith(
        /unwrapBytes failed/i
      );
    });

    test('flipping a bit in the ciphertext fails GCM authentication', async () => {
      const pair = await generateEcdhPair();
      const wrapped = (
        await provider.wrapBytes(new TextEncoder().encode('payload'), pair.publicKey, defaultOptions)
      ).orThrow();
      const ct = provider.fromBase64(wrapped.ciphertext).orThrow();
      ct[0] ^= 0x01;
      const tampered: CryptoUtils.IWrappedBytes = { ...wrapped, ciphertext: provider.toBase64(ct) };
      expect(await provider.unwrapBytes(tampered, pair.privateKey, defaultOptions)).toFailWith(
        /unwrapBytes failed/i
      );
    });

    test('truncating ciphertext by one byte fails GCM authentication', async () => {
      const pair = await generateEcdhPair();
      const wrapped = (
        await provider.wrapBytes(new TextEncoder().encode('payload'), pair.publicKey, defaultOptions)
      ).orThrow();
      const ct = provider.fromBase64(wrapped.ciphertext).orThrow();
      const truncated = ct.slice(0, ct.length - 1);
      const tampered: CryptoUtils.IWrappedBytes = { ...wrapped, ciphertext: provider.toBase64(truncated) };
      expect(await provider.unwrapBytes(tampered, pair.privateKey, defaultOptions)).toFailWith(
        /unwrapBytes failed/i
      );
    });

    test('substituting a different ephemeral public key fails authentication', async () => {
      const pair = await generateEcdhPair();
      const wrapped = (
        await provider.wrapBytes(new TextEncoder().encode('payload'), pair.publicKey, defaultOptions)
      ).orThrow();
      // A second wrap to harvest a valid-but-different ephemeral public key.
      const other = (
        await provider.wrapBytes(new TextEncoder().encode('payload'), pair.publicKey, defaultOptions)
      ).orThrow();
      const tampered: CryptoUtils.IWrappedBytes = {
        ...wrapped,
        ephemeralPublicKey: other.ephemeralPublicKey
      };
      expect(await provider.unwrapBytes(tampered, pair.privateKey, defaultOptions)).toFailWith(
        /unwrapBytes failed/i
      );
    });
  });

  describe('wrong-key / wrong-options', () => {
    test('unwrap with a different recipient private key fails', async () => {
      const pair = await generateEcdhPair();
      const other = await generateEcdhPair();
      const wrapped = (
        await provider.wrapBytes(new TextEncoder().encode('payload'), pair.publicKey, defaultOptions)
      ).orThrow();
      expect(await provider.unwrapBytes(wrapped, other.privateKey, defaultOptions)).toFailWith(
        /unwrapBytes failed/i
      );
    });

    test('unwrap with a different HKDF salt fails authentication', async () => {
      const pair = await generateEcdhPair();
      const wrapped = (
        await provider.wrapBytes(new TextEncoder().encode('payload'), pair.publicKey, defaultOptions)
      ).orThrow();
      const wrongSalt: CryptoUtils.IWrapBytesOptions = {
        salt: new TextEncoder().encode('different-salt'),
        info: defaultOptions.info
      };
      expect(await provider.unwrapBytes(wrapped, pair.privateKey, wrongSalt)).toFailWith(
        /unwrapBytes failed/i
      );
    });

    test('unwrap with a different HKDF info fails authentication', async () => {
      const pair = await generateEcdhPair();
      const wrapped = (
        await provider.wrapBytes(new TextEncoder().encode('payload'), pair.publicKey, defaultOptions)
      ).orThrow();
      const wrongInfo: CryptoUtils.IWrapBytesOptions = {
        salt: defaultOptions.salt,
        info: new TextEncoder().encode('different-info')
      };
      expect(await provider.unwrapBytes(wrapped, pair.privateKey, wrongInfo)).toFailWith(
        /unwrapBytes failed/i
      );
    });

    test('empty salt and info round-trip when both sides agree', async () => {
      const pair = await generateEcdhPair();
      const empty: CryptoUtils.IWrapBytesOptions = { salt: new Uint8Array(0), info: new Uint8Array(0) };
      const plaintext = new Uint8Array(crypto.randomBytes(16));
      const wrapped = (await provider.wrapBytes(plaintext, pair.publicKey, empty)).orThrow();
      const recovered = (await provider.unwrapBytes(wrapped, pair.privateKey, empty)).orThrow();
      expect(new Uint8Array(recovered)).toEqual(plaintext);
    });
  });

  describe('malformed input', () => {
    test('malformed ephemeralPublicKey JWK fails', async () => {
      const pair = await generateEcdhPair();
      const wrapped = (
        await provider.wrapBytes(new TextEncoder().encode('payload'), pair.publicKey, defaultOptions)
      ).orThrow();
      const bogus: CryptoUtils.IWrappedBytes = {
        ...wrapped,
        ephemeralPublicKey: { kty: 'EC', crv: 'P-256' } as JsonWebKey
      };
      expect(await provider.unwrapBytes(bogus, pair.privateKey, defaultOptions)).toFailWith(
        /unwrapBytes failed/i
      );
    });

    test('ephemeralPublicKey on the wrong curve (P-384) fails', async () => {
      const pair = await generateEcdhPair();
      const wrongCurve = await generateEcdhPair('P-384');
      const wrongJwk = await subtle.exportKey('jwk', wrongCurve.publicKey);
      const wrapped = (
        await provider.wrapBytes(new TextEncoder().encode('payload'), pair.publicKey, defaultOptions)
      ).orThrow();
      const tampered: CryptoUtils.IWrappedBytes = { ...wrapped, ephemeralPublicKey: wrongJwk };
      expect(await provider.unwrapBytes(tampered, pair.privateKey, defaultOptions)).toFailWith(
        /unwrapBytes failed/i
      );
    });

    test('non-base64 nonce fails with a clean error', async () => {
      const pair = await generateEcdhPair();
      const wrapped = (
        await provider.wrapBytes(new TextEncoder().encode('payload'), pair.publicKey, defaultOptions)
      ).orThrow();
      const tampered: CryptoUtils.IWrappedBytes = { ...wrapped, nonce: 'not!base64!' };
      expect(await provider.unwrapBytes(tampered, pair.privateKey, defaultOptions)).toFailWith(
        /unwrapBytes failed: nonce/i
      );
    });

    test('non-base64 ciphertext fails with a clean error', async () => {
      const pair = await generateEcdhPair();
      const wrapped = (
        await provider.wrapBytes(new TextEncoder().encode('payload'), pair.publicKey, defaultOptions)
      ).orThrow();
      const tampered: CryptoUtils.IWrappedBytes = { ...wrapped, ciphertext: 'not!base64!' };
      expect(await provider.unwrapBytes(tampered, pair.privateKey, defaultOptions)).toFailWith(
        /unwrapBytes failed: ciphertext/i
      );
    });

    test('wrong-length nonce (after base64 decode) fails before reaching AES-GCM', async () => {
      const pair = await generateEcdhPair();
      const wrapped = (
        await provider.wrapBytes(new TextEncoder().encode('payload'), pair.publicKey, defaultOptions)
      ).orThrow();
      const shortNonce = new Uint8Array(8); // 8 bytes, not 12
      const tampered: CryptoUtils.IWrappedBytes = { ...wrapped, nonce: provider.toBase64(shortNonce) };
      expect(await provider.unwrapBytes(tampered, pair.privateKey, defaultOptions)).toFailWith(
        /unwrapBytes failed: nonce must be 12 bytes \(got 8\)/i
      );
    });

    test('ciphertext shorter than the GCM auth tag fails before reaching AES-GCM', async () => {
      const pair = await generateEcdhPair();
      const wrapped = (
        await provider.wrapBytes(new TextEncoder().encode('payload'), pair.publicKey, defaultOptions)
      ).orThrow();
      const shortCt = new Uint8Array(8); // 8 bytes, less than the 16-byte auth tag
      const tampered: CryptoUtils.IWrappedBytes = { ...wrapped, ciphertext: provider.toBase64(shortCt) };
      expect(await provider.unwrapBytes(tampered, pair.privateKey, defaultOptions)).toFailWith(
        /unwrapBytes failed: ciphertext must be at least 16 bytes \(got 8\)/i
      );
    });
  });

  describe('algorithm mismatch on recipient key', () => {
    test('wrap fails when recipient public key is RSA-OAEP, not ECDH', async () => {
      const rsa = (await provider.generateKeyPair('rsa-oaep-2048', true)).orThrow();
      const result = await provider.wrapBytes(new Uint8Array([1, 2, 3]), rsa.publicKey, defaultOptions);
      expect(result).toFailWith(/wrapBytes failed: recipient public key must be ECDH P-256.*RSA-OAEP/i);
    });

    test('wrap fails when recipient public key is ECDSA P-256, not ECDH', async () => {
      const ecdsa = await generateEcdsaPair();
      const result = await provider.wrapBytes(new Uint8Array([1, 2, 3]), ecdsa.publicKey, defaultOptions);
      expect(result).toFailWith(/wrapBytes failed: recipient public key must be ECDH P-256.*ECDSA/i);
    });

    test('wrap fails when recipient public key is ECDH P-384, not P-256', async () => {
      const wrongCurve = await generateEcdhPair('P-384');
      const result = await provider.wrapBytes(
        new Uint8Array([1, 2, 3]),
        wrongCurve.publicKey,
        defaultOptions
      );
      expect(result).toFailWith(/wrapBytes failed: recipient public key must be ECDH P-256.*P-384/i);
    });

    test('unwrap fails when recipient private key is RSA-OAEP, not ECDH', async () => {
      const pair = await generateEcdhPair();
      const wrapped = (
        await provider.wrapBytes(new Uint8Array([1, 2, 3]), pair.publicKey, defaultOptions)
      ).orThrow();
      const rsa = (await provider.generateKeyPair('rsa-oaep-2048', true)).orThrow();
      const result = await provider.unwrapBytes(wrapped, rsa.privateKey, defaultOptions);
      expect(result).toFailWith(/unwrapBytes failed: recipient private key must be ECDH P-256.*RSA-OAEP/i);
    });

    test('unwrap fails when recipient private key is ECDH P-384, not P-256', async () => {
      const pair = await generateEcdhPair();
      const wrapped = (
        await provider.wrapBytes(new Uint8Array([1, 2, 3]), pair.publicKey, defaultOptions)
      ).orThrow();
      const wrongCurve = await generateEcdhPair('P-384');
      const result = await provider.unwrapBytes(wrapped, wrongCurve.privateKey, defaultOptions);
      expect(result).toFailWith(/unwrapBytes failed: recipient private key must be ECDH P-256.*P-384/i);
    });

    test('wrap fails when recipient is an ECDH private key (not public)', async () => {
      const pair = await generateEcdhPair();
      const result = await provider.wrapBytes(new Uint8Array([1, 2, 3]), pair.privateKey, defaultOptions);
      expect(result).toFailWith(
        /wrapBytes failed: recipient public key must be a public CryptoKey \(got 'private'\)/i
      );
    });

    test('unwrap fails when recipient is an ECDH public key (not private)', async () => {
      const pair = await generateEcdhPair();
      const wrapped = (
        await provider.wrapBytes(new Uint8Array([1, 2, 3]), pair.publicKey, defaultOptions)
      ).orThrow();
      const result = await provider.unwrapBytes(wrapped, pair.publicKey, defaultOptions);
      expect(result).toFailWith(
        /unwrapBytes failed: recipient private key must be a private CryptoKey \(got 'public'\)/i
      );
    });
  });
});
