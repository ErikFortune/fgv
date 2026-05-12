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

describe('NodeCryptoProvider — sign/verify', () => {
  const provider = CryptoUtils.nodeCryptoProvider;

  describe('ed25519 round-trip', () => {
    test('signs and produces a non-empty signature (Ed25519)', async () => {
      const data = new TextEncoder().encode('hello, ed25519');
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();

      const sigResult = await provider.sign(pair.privateKey, data);
      expect(sigResult).toSucceedAndSatisfy((sig) => {
        expect(sig).toBeInstanceOf(Uint8Array);
        expect(sig.length).toBeGreaterThan(0);
      });
    });

    test('round-trips sign then verify (Ed25519)', async () => {
      const data = new TextEncoder().encode('hello, ed25519');
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();

      const sig = (await provider.sign(pair.privateKey, data)).orThrow();
      expect(await provider.verify(pair.publicKey, sig, data)).toSucceedWith(true);
    });

    test('verify returns false for tampered data (Ed25519)', async () => {
      const data = new TextEncoder().encode('original');
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();

      const sig = (await provider.sign(pair.privateKey, data)).orThrow();
      const tampered = new TextEncoder().encode('tampered');

      expect(await provider.verify(pair.publicKey, sig, tampered)).toSucceedWith(false);
    });

    test('verify returns false for tampered signature (Ed25519)', async () => {
      const data = new TextEncoder().encode('hello');
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();

      const sig = (await provider.sign(pair.privateKey, data)).orThrow();
      const badSig = new Uint8Array(sig);
      badSig[0] ^= 0xff;

      expect(await provider.verify(pair.publicKey, badSig, data)).toSucceedWith(false);
    });

    test('verify returns false for wrong key (Ed25519)', async () => {
      const data = new TextEncoder().encode('hello');
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();
      const otherPair = (await provider.generateKeyPair('ed25519', true)).orThrow();

      const sig = (await provider.sign(pair.privateKey, data)).orThrow();

      expect(await provider.verify(otherPair.publicKey, sig, data)).toSucceedWith(false);
    });

    test('handles empty data (Ed25519)', async () => {
      const data = new Uint8Array(0);
      const pair = (await provider.generateKeyPair('ed25519', true)).orThrow();

      const sig = (await provider.sign(pair.privateKey, data)).orThrow();
      expect(await provider.verify(pair.publicKey, sig, data)).toSucceedWith(true);
    });
  });

  describe('ecdsa-p256 round-trip', () => {
    test('signs and produces a non-empty signature (ECDSA-P256)', async () => {
      const data = new TextEncoder().encode('hello, ecdsa');
      const pair = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();

      const sigResult = await provider.sign(pair.privateKey, data);
      expect(sigResult).toSucceedAndSatisfy((sig) => {
        expect(sig).toBeInstanceOf(Uint8Array);
        expect(sig.length).toBeGreaterThan(0);
      });
    });

    test('round-trips sign then verify (ECDSA-P256)', async () => {
      const data = new TextEncoder().encode('hello, ecdsa');
      const pair = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();

      const sig = (await provider.sign(pair.privateKey, data)).orThrow();
      expect(await provider.verify(pair.publicKey, sig, data)).toSucceedWith(true);
    });

    test('verify returns false for tampered data (ECDSA-P256)', async () => {
      const data = new TextEncoder().encode('original');
      const pair = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();

      const sig = (await provider.sign(pair.privateKey, data)).orThrow();
      const tampered = new TextEncoder().encode('tampered');

      expect(await provider.verify(pair.publicKey, sig, tampered)).toSucceedWith(false);
    });

    test('verify returns false for tampered signature (ECDSA-P256)', async () => {
      const data = new TextEncoder().encode('hello');
      const pair = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();

      const sig = (await provider.sign(pair.privateKey, data)).orThrow();
      const badSig = new Uint8Array(sig);
      badSig[0] ^= 0xff;

      expect(await provider.verify(pair.publicKey, badSig, data)).toSucceedWith(false);
    });

    test('verify returns false for wrong key (ECDSA-P256)', async () => {
      const data = new TextEncoder().encode('hello');
      const pair = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();
      const otherPair = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();

      const sig = (await provider.sign(pair.privateKey, data)).orThrow();

      expect(await provider.verify(otherPair.publicKey, sig, data)).toSucceedWith(false);
    });

    test('handles empty data (ECDSA-P256)', async () => {
      const data = new Uint8Array(0);
      const pair = (await provider.generateKeyPair('ecdsa-p256', true)).orThrow();

      const sig = (await provider.sign(pair.privateKey, data)).orThrow();
      expect(await provider.verify(pair.publicKey, sig, data)).toSucceedWith(true);
    });
  });

  describe('sign failure cases', () => {
    test('sign fails with a non-signing key (ecdh-p256)', async () => {
      const data = new TextEncoder().encode('hello');
      const pair = (await provider.generateKeyPair('ecdh-p256', true)).orThrow();

      expect(await provider.sign(pair.privateKey, data)).toFailWith(/sign failed/i);
    });
  });

  describe('verify failure cases', () => {
    test('verify fails with a non-verify key (ecdh-p256)', async () => {
      const data = new TextEncoder().encode('hello');
      const pair = (await provider.generateKeyPair('ecdh-p256', true)).orThrow();
      const fakeSig = new Uint8Array(64);

      expect(await provider.verify(pair.publicKey, fakeSig, data)).toFailWith(/verify failed/i);
    });
  });
});

describe('NodeCryptoProvider — timingSafeEqual', () => {
  const provider = CryptoUtils.nodeCryptoProvider;

  test('returns true for identical byte arrays', () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4, 5]);
    expect(provider.timingSafeEqual(a, b)).toBe(true);
  });

  test('returns false for arrays that differ in one byte', () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4, 6]);
    expect(provider.timingSafeEqual(a, b)).toBe(false);
  });

  test('returns false for arrays of different lengths (a shorter)', () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 3, 4]);
    expect(provider.timingSafeEqual(a, b)).toBe(false);
  });

  test('returns false for arrays of different lengths (b shorter)', () => {
    const a = new Uint8Array([1, 2, 3, 4]);
    const b = new Uint8Array([1, 2, 3]);
    expect(provider.timingSafeEqual(a, b)).toBe(false);
  });

  test('returns true for two empty arrays', () => {
    expect(provider.timingSafeEqual(new Uint8Array(0), new Uint8Array(0))).toBe(true);
  });

  test('returns false for empty vs non-empty', () => {
    expect(provider.timingSafeEqual(new Uint8Array(0), new Uint8Array([0]))).toBe(false);
  });

  test('returns true for single-byte equal arrays', () => {
    expect(provider.timingSafeEqual(new Uint8Array([42]), new Uint8Array([42]))).toBe(true);
  });

  test('returns false for single-byte unequal arrays', () => {
    expect(provider.timingSafeEqual(new Uint8Array([42]), new Uint8Array([43]))).toBe(false);
  });

  test('works correctly with 32-byte arrays (HMAC/AES key size)', () => {
    const a = new Uint8Array(32).fill(0xab);
    const b = new Uint8Array(32).fill(0xab);
    const c = new Uint8Array(32).fill(0xac);
    expect(provider.timingSafeEqual(a, b)).toBe(true);
    expect(provider.timingSafeEqual(a, c)).toBe(false);
  });
});
