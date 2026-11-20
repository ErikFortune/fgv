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

import { CryptoUtils } from '@fgv/ts-extras';
import { BrowserCryptoProvider } from '../../packlets/crypto-utils';

const provider = new BrowserCryptoProvider();
const nodeProvider = CryptoUtils.nodeCryptoProvider;

// In-memory fixtures only — never logged, exposed, or persisted.
const key = new Uint8Array(Array.from({ length: 32 }, (__unused, i) => i));
const nonce = new Uint8Array(Array.from({ length: 12 }, (__unused, i) => 0xa0 + i));
const aad = new TextEncoder().encode('actor-1|v3|secret');
const plaintext = new TextEncoder().encode('known-answer-plaintext');

// Known-answer vectors precomputed with node:crypto for the fixtures above.
const KAT_CIPHERTEXT_HEX = '8d76135a2be663d11112e2a12a0aacbf19c22d75eac3';
const KAT_TAG_WITH_AAD_HEX = '314d44a2486673fb3cfda154798aea1e';
const KAT_TAG_NO_AAD_HEX = '6e31ae1dd502488285776c15d36e3b9a';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

describe('BrowserCryptoProvider — encryptBytes/decryptBytes', () => {
  describe('round-trip', () => {
    test.each<[string, Uint8Array]>([
      ['32-byte plaintext', new Uint8Array(32).fill(0x11)],
      ['1-byte plaintext', new Uint8Array([0x42])],
      ['1KB plaintext', new Uint8Array(Array.from({ length: 1024 }, (__unused, i) => i % 256))],
      ['empty plaintext', new Uint8Array(0)],
      ['high-bit-set bytes', new Uint8Array(64).fill(0xff)]
    ])('round-trips %s without AAD', async (__label, pt) => {
      const encrypted = (await provider.encryptBytes(key, nonce, pt)).orThrow();
      expect(encrypted.ciphertext.length).toBe(pt.length);
      expect(encrypted.authTag.length).toBe(CryptoUtils.Constants.GCM_AUTH_TAG_SIZE);
      const recovered = await provider.decryptBytes(key, nonce, encrypted.ciphertext, encrypted.authTag);
      expect(recovered).toSucceedWith(pt);
    });

    test('round-trips with AAD', async () => {
      const encrypted = (await provider.encryptBytes(key, nonce, plaintext, aad)).orThrow();
      const recovered = await provider.decryptBytes(key, nonce, encrypted.ciphertext, encrypted.authTag, aad);
      expect(recovered).toSucceedWith(plaintext);
    });

    test('round-trips empty plaintext with AAD', async () => {
      const empty = new Uint8Array(0);
      const encrypted = (await provider.encryptBytes(key, nonce, empty, aad)).orThrow();
      expect(encrypted.ciphertext.length).toBe(0);
      const recovered = await provider.decryptBytes(key, nonce, encrypted.ciphertext, encrypted.authTag, aad);
      expect(recovered).toSucceedWith(empty);
    });
  });

  describe('known-answer vectors', () => {
    test('produces the documented ciphertext/tag layout with AAD', async () => {
      const encrypted = (await provider.encryptBytes(key, nonce, plaintext, aad)).orThrow();
      expect(toHex(encrypted.ciphertext)).toBe(KAT_CIPHERTEXT_HEX);
      expect(toHex(encrypted.authTag)).toBe(KAT_TAG_WITH_AAD_HEX);
    });

    test('produces the documented ciphertext/tag layout without AAD', async () => {
      const encrypted = (await provider.encryptBytes(key, nonce, plaintext)).orThrow();
      expect(toHex(encrypted.ciphertext)).toBe(KAT_CIPHERTEXT_HEX);
      expect(toHex(encrypted.authTag)).toBe(KAT_TAG_NO_AAD_HEX);
    });
  });

  describe('cross-runtime byte-identity with NodeCryptoProvider', () => {
    test('Browser and Node produce byte-identical ciphertext+tag (with AAD)', async () => {
      const browserOut = (await provider.encryptBytes(key, nonce, plaintext, aad)).orThrow();
      const nodeOut = (await nodeProvider.encryptBytes(key, nonce, plaintext, aad)).orThrow();
      expect(toHex(browserOut.ciphertext)).toBe(toHex(nodeOut.ciphertext));
      expect(toHex(browserOut.authTag)).toBe(toHex(nodeOut.authTag));
    });

    test('Browser and Node produce byte-identical ciphertext+tag (no AAD)', async () => {
      const browserOut = (await provider.encryptBytes(key, nonce, plaintext)).orThrow();
      const nodeOut = (await nodeProvider.encryptBytes(key, nonce, plaintext)).orThrow();
      expect(toHex(browserOut.ciphertext)).toBe(toHex(nodeOut.ciphertext));
      expect(toHex(browserOut.authTag)).toBe(toHex(nodeOut.authTag));
    });

    test('Node-encrypted bytes decrypt on the Browser provider', async () => {
      const nodeOut = (await nodeProvider.encryptBytes(key, nonce, plaintext, aad)).orThrow();
      const recovered = await provider.decryptBytes(key, nonce, nodeOut.ciphertext, nodeOut.authTag, aad);
      expect(recovered).toSucceedWith(plaintext);
    });

    test('Browser-encrypted bytes decrypt on the Node provider', async () => {
      const browserOut = (await provider.encryptBytes(key, nonce, plaintext, aad)).orThrow();
      const recovered = await nodeProvider.decryptBytes(
        key,
        nonce,
        browserOut.ciphertext,
        browserOut.authTag,
        aad
      );
      expect(recovered).toSucceedWith(plaintext);
    });
  });

  describe('AAD binding', () => {
    test('decrypt with a different AAD fails authentication', async () => {
      const encrypted = (await provider.encryptBytes(key, nonce, plaintext, aad)).orThrow();
      const wrongAad = new TextEncoder().encode('actor-2|v3|secret');
      expect(
        await provider.decryptBytes(key, nonce, encrypted.ciphertext, encrypted.authTag, wrongAad)
      ).toFailWith(/decryptBytes failed/i);
    });

    test('decrypt without AAD fails when AAD was used at encrypt time', async () => {
      const encrypted = (await provider.encryptBytes(key, nonce, plaintext, aad)).orThrow();
      expect(await provider.decryptBytes(key, nonce, encrypted.ciphertext, encrypted.authTag)).toFailWith(
        /decryptBytes failed/i
      );
    });

    test('decrypt with AAD fails when none was used at encrypt time', async () => {
      const encrypted = (await provider.encryptBytes(key, nonce, plaintext)).orThrow();
      expect(
        await provider.decryptBytes(key, nonce, encrypted.ciphertext, encrypted.authTag, aad)
      ).toFailWith(/decryptBytes failed/i);
    });
  });

  describe('tampering', () => {
    test('flipping a ciphertext byte fails authentication', async () => {
      const encrypted = (await provider.encryptBytes(key, nonce, plaintext, aad)).orThrow();
      const tampered = Uint8Array.from(encrypted.ciphertext);
      tampered[0] ^= 0x01;
      expect(await provider.decryptBytes(key, nonce, tampered, encrypted.authTag, aad)).toFailWith(
        /decryptBytes failed/i
      );
    });

    test('flipping a tag byte fails authentication', async () => {
      const encrypted = (await provider.encryptBytes(key, nonce, plaintext, aad)).orThrow();
      const tamperedTag = Uint8Array.from(encrypted.authTag);
      tamperedTag[0] ^= 0xff;
      expect(await provider.decryptBytes(key, nonce, encrypted.ciphertext, tamperedTag, aad)).toFailWith(
        /decryptBytes failed/i
      );
    });
  });

  describe('wrong key / wrong nonce', () => {
    test('decrypt with a different key fails', async () => {
      const encrypted = (await provider.encryptBytes(key, nonce, plaintext)).orThrow();
      const wrongKey = new Uint8Array(32).fill(0xff);
      expect(
        await provider.decryptBytes(wrongKey, nonce, encrypted.ciphertext, encrypted.authTag)
      ).toFailWith(/decryptBytes failed/i);
    });

    test('decrypt with a different nonce fails', async () => {
      const encrypted = (await provider.encryptBytes(key, nonce, plaintext)).orThrow();
      const wrongNonce = new Uint8Array(12).fill(0x00);
      expect(
        await provider.decryptBytes(key, wrongNonce, encrypted.ciphertext, encrypted.authTag)
      ).toFailWith(/decryptBytes failed/i);
    });
  });

  describe('validation', () => {
    test('encryptBytes fails on wrong key length', async () => {
      expect(await provider.encryptBytes(new Uint8Array(16), nonce, plaintext)).toFailWith(
        /encryptBytes: key must be 32 bytes, got 16/i
      );
    });

    test('encryptBytes fails on wrong nonce length', async () => {
      expect(await provider.encryptBytes(key, new Uint8Array(16), plaintext)).toFailWith(
        /encryptBytes: nonce must be 12 bytes, got 16/i
      );
    });

    test('decryptBytes fails on wrong key length', async () => {
      const encrypted = (await provider.encryptBytes(key, nonce, plaintext)).orThrow();
      expect(
        await provider.decryptBytes(new Uint8Array(31), nonce, encrypted.ciphertext, encrypted.authTag)
      ).toFailWith(/decryptBytes: key must be 32 bytes, got 31/i);
    });

    test('decryptBytes fails on wrong nonce length', async () => {
      const encrypted = (await provider.encryptBytes(key, nonce, plaintext)).orThrow();
      expect(
        await provider.decryptBytes(key, new Uint8Array(8), encrypted.ciphertext, encrypted.authTag)
      ).toFailWith(/decryptBytes: nonce must be 12 bytes, got 8/i);
    });

    test('decryptBytes fails on wrong auth tag length', async () => {
      const encrypted = (await provider.encryptBytes(key, nonce, plaintext)).orThrow();
      expect(await provider.decryptBytes(key, nonce, encrypted.ciphertext, new Uint8Array(8))).toFailWith(
        /decryptBytes: auth tag must be 16 bytes, got 8/i
      );
    });
  });
});
