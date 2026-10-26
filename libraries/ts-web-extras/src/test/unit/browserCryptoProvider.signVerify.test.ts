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

describe('BrowserCryptoProvider — sign/verify', () => {
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

describe('BrowserCryptoProvider — timingSafeEqual', () => {
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

  test('detects a single differing bit anywhere in the array', () => {
    const a = new Uint8Array(16).fill(0x00);
    const b = new Uint8Array(16).fill(0x00);
    b[15] = 0x01;
    expect(provider.timingSafeEqual(a, b)).toBe(false);
  });
});

describe('BrowserCryptoProvider — hmacSha256 / verifyHmacSha256', () => {
  async function generateHmacKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  }

  describe('round-trip', () => {
    test('produces a non-empty MAC', async () => {
      const data = new TextEncoder().encode('hello, hmac');
      const key = await generateHmacKey();

      const macResult = await provider.hmacSha256(key, data);
      expect(macResult).toSucceedAndSatisfy((mac) => {
        expect(mac).toBeInstanceOf(Uint8Array);
        expect(mac.length).toBeGreaterThan(0);
      });
    });

    test('verifyHmacSha256 returns true for a correct MAC', async () => {
      const data = new TextEncoder().encode('hello, hmac');
      const key = await generateHmacKey();

      const mac = (await provider.hmacSha256(key, data)).orThrow();
      expect(await provider.verifyHmacSha256(key, mac, data)).toSucceedWith(true);
    });

    test('verifyHmacSha256 returns false for tampered data', async () => {
      const data = new TextEncoder().encode('original');
      const key = await generateHmacKey();

      const mac = (await provider.hmacSha256(key, data)).orThrow();
      const tampered = new TextEncoder().encode('tampered');

      expect(await provider.verifyHmacSha256(key, mac, tampered)).toSucceedWith(false);
    });

    test('verifyHmacSha256 returns false for tampered MAC', async () => {
      const data = new TextEncoder().encode('hello');
      const key = await generateHmacKey();

      const mac = (await provider.hmacSha256(key, data)).orThrow();
      const badMac = new Uint8Array(mac);
      badMac[0] ^= 0xff;

      expect(await provider.verifyHmacSha256(key, badMac, data)).toSucceedWith(false);
    });

    test('verifyHmacSha256 returns false for wrong key', async () => {
      const data = new TextEncoder().encode('hello');
      const key = await generateHmacKey();
      const otherKey = await generateHmacKey();

      const mac = (await provider.hmacSha256(key, data)).orThrow();
      expect(await provider.verifyHmacSha256(otherKey, mac, data)).toSucceedWith(false);
    });

    test('handles empty data', async () => {
      const data = new Uint8Array(0);
      const key = await generateHmacKey();

      const mac = (await provider.hmacSha256(key, data)).orThrow();
      expect(await provider.verifyHmacSha256(key, mac, data)).toSucceedWith(true);
    });
  });

  describe('failure cases', () => {
    test('hmacSha256 fails with a non-HMAC key (AES-GCM)', async () => {
      const data = new TextEncoder().encode('hello');
      const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt']);

      expect(await provider.hmacSha256(key, data)).toFailWith(/hmacSha256 failed/i);
    });
  });
});

describe('BrowserCryptoProvider — generateHmacKey / importHmacKey', () => {
  const data = new TextEncoder().encode('hello, hmac key');

  describe('generateHmacKey', () => {
    test('generates a non-extractable 256-bit HMAC-SHA256 key with sign/verify usages by default', async () => {
      expect(await provider.generateHmacKey()).toSucceedAndSatisfy((key) => {
        expect(key.type).toBe('secret');
        expect(key.extractable).toBe(false);
        expect(key.algorithm).toEqual(
          expect.objectContaining({
            name: 'HMAC',
            hash: expect.objectContaining({ name: 'SHA-256' }),
            length: 256
          })
        );
        expect([...key.usages].sort()).toEqual(['sign', 'verify']);
      });
    });

    test('generates an extractable key whose raw bytes are 32 bytes when asked', async () => {
      const key = (await provider.generateHmacKey({ extractable: true })).orThrow();
      expect(key.extractable).toBe(true);
      const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
      expect(raw.length).toBe(32);
    });

    test('a non-extractable key refuses export', async () => {
      const key = (await provider.generateHmacKey({ extractable: false })).orThrow();
      await expect(crypto.subtle.exportKey('raw', key)).rejects.toThrow();
    });

    test('round-trips sign and verify with a generated key', async () => {
      const key = (await provider.generateHmacKey()).orThrow();
      const mac = (await provider.hmacSha256(key, data)).orThrow();
      expect(mac.length).toBe(32);
      expect(await provider.verifyHmacSha256(key, mac, data)).toSucceedWith(true);
      expect(await provider.verifyHmacSha256(key, mac, new TextEncoder().encode('other'))).toSucceedWith(
        false
      );
    });

    test('two generated keys are distinct', async () => {
      const a = (await provider.generateHmacKey()).orThrow();
      const b = (await provider.generateHmacKey()).orThrow();
      const mac = (await provider.hmacSha256(a, data)).orThrow();
      expect(await provider.verifyHmacSha256(b, mac, data)).toSucceedWith(false);
    });
  });

  describe('importHmacKey', () => {
    const raw32 = Uint8Array.from(Array(32).keys());

    test('imports a 32-byte key as non-extractable with sign/verify usages by default', async () => {
      expect(await provider.importHmacKey(raw32)).toSucceedAndSatisfy((key) => {
        expect(key.type).toBe('secret');
        expect(key.extractable).toBe(false);
        expect(key.algorithm).toEqual(
          expect.objectContaining({ name: 'HMAC', hash: expect.objectContaining({ name: 'SHA-256' }) })
        );
        expect([...key.usages].sort()).toEqual(['sign', 'verify']);
      });
    });

    test('imports an extractable key that exports the same bytes', async () => {
      const key = (await provider.importHmacKey(raw32, { extractable: true })).orThrow();
      expect(key.extractable).toBe(true);
      expect(new Uint8Array(await crypto.subtle.exportKey('raw', key))).toEqual(raw32);
    });

    test('accepts a key longer than 32 bytes', async () => {
      expect(await provider.importHmacKey(new Uint8Array(64).fill(7))).toSucceed();
    });

    test('refuses a key shorter than 32 bytes', async () => {
      expect(await provider.importHmacKey(new Uint8Array(31))).toFailWith(/at least 32 bytes, got 31/i);
      expect(await provider.importHmacKey(new Uint8Array(0))).toFailWith(/at least 32 bytes, got 0/i);
    });

    test('round-trips sign and verify across two imports of the same bytes', async () => {
      const signer = (await provider.importHmacKey(raw32)).orThrow();
      const verifier = (await provider.importHmacKey(raw32)).orThrow();
      const mac = (await provider.hmacSha256(signer, data)).orThrow();
      expect(await provider.verifyHmacSha256(verifier, mac, data)).toSucceedWith(true);
    });

    test('imports deriveKey output', async () => {
      const derived = (await provider.deriveKey('password', new Uint8Array(16).fill(1), 1000)).orThrow();
      const key = (await provider.importHmacKey(derived)).orThrow();
      const mac = (await provider.hmacSha256(key, data)).orThrow();
      expect(await provider.verifyHmacSha256(key, mac, data)).toSucceedWith(true);
    });
  });

  describe('subtle failures', () => {
    function failingProvider(): BrowserCryptoProvider {
      const subtle = {
        generateKey: (): Promise<CryptoKey> => Promise.reject(new Error('boom')),
        importKey: (): Promise<CryptoKey> => Promise.reject(new Error('boom'))
      };
      return new BrowserCryptoProvider({ subtle } as unknown as Crypto);
    }

    test('generateHmacKey reports a subtle failure with context', async () => {
      expect(await failingProvider().generateHmacKey()).toFailWith(/generateHmacKey failed: boom/i);
    });

    test('importHmacKey reports a subtle failure with context', async () => {
      expect(await failingProvider().importHmacKey(new Uint8Array(32))).toFailWith(
        /importHmacKey failed: boom/i
      );
    });
  });
});
