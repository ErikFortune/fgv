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
import { HpkeProvider, IHpkeSealResult } from '../../../packlets/crypto-utils';
import {
  HKDF_RFC5869_CASE1,
  RECIPIENT_PRIV_JWK,
  RECIPIENT_PUB_BYTES,
  SEAL_VECTORS
} from './hpke-test-vectors';

const subtle = (crypto as { webcrypto: { subtle: SubtleCrypto } }).webcrypto.subtle;

function toArrayBuffer(arr: Uint8Array): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(arr.byteLength);
  const view = new Uint8Array(buf);
  view.set(arr);
  return view;
}

async function importRecipientPub(): Promise<CryptoKey> {
  return subtle.importKey('raw', toArrayBuffer(RECIPIENT_PUB_BYTES), { name: 'X25519' }, true, []);
}

async function importRecipientPriv(): Promise<CryptoKey> {
  return subtle.importKey('jwk', RECIPIENT_PRIV_JWK, { name: 'X25519' }, true, ['deriveBits']);
}

describe('HpkeProvider', () => {
  describe('create', () => {
    test('succeeds with a valid SubtleCrypto', () => {
      expect(HpkeProvider.create(subtle)).toSucceed();
    });
  });

  describe('sealBase / openBase roundtrip', () => {
    let hpke: HpkeProvider;
    let recipientPub: CryptoKey;
    let recipientPriv: CryptoKey;

    beforeEach(async () => {
      hpke = HpkeProvider.create(subtle).orThrow();
      recipientPub = await importRecipientPub();
      recipientPriv = await importRecipientPriv();
    });

    test.each<[string, Uint8Array, Uint8Array, Uint8Array]>([
      [
        'typical plaintext',
        new TextEncoder().encode('test-app/v1\x00ctx'),
        new TextEncoder().encode('aad-data'),
        new TextEncoder().encode('Hello, World!')
      ],
      [
        'empty plaintext',
        new TextEncoder().encode('test-app/v1\x00ctx'),
        new Uint8Array(0),
        new Uint8Array(0)
      ],
      [
        'empty aad',
        new TextEncoder().encode('test-app/v1\x00ctx'),
        new Uint8Array(0),
        new TextEncoder().encode('no-aad message')
      ],
      [
        '1KB plaintext',
        new TextEncoder().encode('test-app/v1\x00ctx'),
        new TextEncoder().encode('aad'),
        globalThis.crypto.getRandomValues(new Uint8Array(1024))
      ]
    ])('round-trips %s', async (label, info, aad, plaintext) => {
      const sealed = (await hpke.sealBase(recipientPub, info, aad, plaintext)).orThrow();
      expect(sealed.enc.length).toBe(32);
      expect(sealed.ciphertext.length).toBe(plaintext.length + 16);

      expect(
        await hpke.openBase(recipientPriv, info, aad, sealed.enc, sealed.ciphertext)
      ).toSucceedAndSatisfy((pt) => {
        expect(pt).toEqual(plaintext);
      });
    });

    test('returns Failure on wrong private key', async () => {
      const otherPair = (await subtle.generateKey({ name: 'X25519' }, true, ['deriveBits'])) as CryptoKeyPair;
      const info = new TextEncoder().encode('ctx');
      const aad = new Uint8Array(0);
      const plaintext = new TextEncoder().encode('secret');

      const sealed = (await hpke.sealBase(recipientPub, info, aad, plaintext)).orThrow();
      expect(await hpke.openBase(otherPair.privateKey, info, aad, sealed.enc, sealed.ciphertext)).toFail();
    });

    test('returns Failure on wrong info', async () => {
      const info = new TextEncoder().encode('ctx-a');
      const wrongInfo = new TextEncoder().encode('ctx-b');
      const aad = new Uint8Array(0);
      const plaintext = new TextEncoder().encode('secret');

      const sealed = (await hpke.sealBase(recipientPub, info, aad, plaintext)).orThrow();
      expect(await hpke.openBase(recipientPriv, wrongInfo, aad, sealed.enc, sealed.ciphertext)).toFail();
    });

    test('returns Failure on wrong aad', async () => {
      const info = new TextEncoder().encode('ctx');
      const aad = new TextEncoder().encode('original-aad');
      const wrongAad = new TextEncoder().encode('tampered-aad');
      const plaintext = new TextEncoder().encode('secret');

      const sealed = (await hpke.sealBase(recipientPub, info, aad, plaintext)).orThrow();
      expect(await hpke.openBase(recipientPriv, info, wrongAad, sealed.enc, sealed.ciphertext)).toFail();
    });

    test('returns Failure on tampered ciphertext', async () => {
      const info = new TextEncoder().encode('ctx');
      const aad = new Uint8Array(0);
      const plaintext = new TextEncoder().encode('secret');

      const sealed = (await hpke.sealBase(recipientPub, info, aad, plaintext)).orThrow();
      const tampered = new Uint8Array(sealed.ciphertext);
      tampered[0] ^= 0x01;
      expect(await hpke.openBase(recipientPriv, info, aad, sealed.enc, tampered)).toFail();
    });

    test('returns Failure on tampered enc', async () => {
      const info = new TextEncoder().encode('ctx');
      const aad = new Uint8Array(0);
      const plaintext = new TextEncoder().encode('secret');

      const sealed = (await hpke.sealBase(recipientPub, info, aad, plaintext)).orThrow();
      const tamperedEnc = new Uint8Array(sealed.enc);
      tamperedEnc[0] ^= 0x01;
      expect(await hpke.openBase(recipientPriv, info, aad, tamperedEnc, sealed.ciphertext)).toFail();
    });
  });

  describe('openBase input validation', () => {
    let hpke: HpkeProvider;
    let recipientPriv: CryptoKey;

    beforeEach(async () => {
      hpke = HpkeProvider.create(subtle).orThrow();
      recipientPriv = await importRecipientPriv();
    });

    test('returns Failure when enc is not 32 bytes', async () => {
      const enc = new Uint8Array(16);
      const ciphertext = new Uint8Array(32);
      expect(
        await hpke.openBase(recipientPriv, new Uint8Array(0), new Uint8Array(0), enc, ciphertext)
      ).toFailWith(/enc must be 32 bytes/i);
    });

    test('returns Failure when ciphertext is shorter than 16 bytes', async () => {
      const enc = new Uint8Array(32);
      const ciphertext = new Uint8Array(15);
      expect(
        await hpke.openBase(recipientPriv, new Uint8Array(0), new Uint8Array(0), enc, ciphertext)
      ).toFailWith(/ciphertext too short/i);
    });
  });

  describe('openBase with self-generated vectors', () => {
    let hpke: HpkeProvider;
    let recipientPriv: CryptoKey;

    beforeEach(async () => {
      hpke = HpkeProvider.create(subtle).orThrow();
      recipientPriv = await importRecipientPriv();
    });

    test.each(SEAL_VECTORS)('decrypts $label', async ({ info, aad, plaintext, enc, ciphertext }) => {
      expect(await hpke.openBase(recipientPriv, info, aad, enc, ciphertext)).toSucceedAndSatisfy((pt) => {
        expect(pt).toEqual(plaintext);
      });
    });
  });

  describe('hkdf', () => {
    let hpke: HpkeProvider;

    beforeEach(() => {
      hpke = HpkeProvider.create(subtle).orThrow();
    });

    test('RFC 5869 Test Case 1 — matches expected OKM', async () => {
      const { ikm, salt, info, length, okm } = HKDF_RFC5869_CASE1;
      expect(await hpke.hkdf(ikm, salt, info, length)).toSucceedAndSatisfy((derived) => {
        expect(derived).toEqual(okm);
      });
    });

    test('produces different output for different info', async () => {
      const secret = new TextEncoder().encode('my-secret');
      const salt = new Uint8Array(0);
      const result1 = (await hpke.hkdf(secret, salt, new TextEncoder().encode('ctx-a'), 32)).orThrow();
      const result2 = (await hpke.hkdf(secret, salt, new TextEncoder().encode('ctx-b'), 32)).orThrow();
      expect(result1).not.toEqual(result2);
    });

    test('produces different output for different salt', async () => {
      const secret = new TextEncoder().encode('my-secret');
      const info = new TextEncoder().encode('ctx');
      const result1 = (await hpke.hkdf(secret, new TextEncoder().encode('salt-a'), info, 32)).orThrow();
      const result2 = (await hpke.hkdf(secret, new TextEncoder().encode('salt-b'), info, 32)).orThrow();
      expect(result1).not.toEqual(result2);
    });

    test('handles empty salt (uses RFC 5869 zero-byte default)', async () => {
      const secret = new TextEncoder().encode('my-secret');
      const result = await hpke.hkdf(secret, new Uint8Array(0), new TextEncoder().encode('ctx'), 32);
      expect(result).toSucceedAndSatisfy((derived) => {
        expect(derived.length).toBe(32);
      });
    });

    test('returns requested length', async () => {
      const secret = new TextEncoder().encode('my-secret');
      for (const len of [16, 32, 64, 128]) {
        const result = (
          await hpke.hkdf(secret, new Uint8Array(0), new TextEncoder().encode('ctx'), len)
        ).orThrow();
        expect(result.length).toBe(len);
      }
    });

    test('returns Failure when length exceeds 8160 bytes (255 * HashLen)', async () => {
      const secret = new TextEncoder().encode('my-secret');
      expect(await hpke.hkdf(secret, new Uint8Array(0), new TextEncoder().encode('ctx'), 8161)).toFailWith(
        /exceeds maximum 8160 bytes/i
      );
    });
  });

  describe('encodeEnvelope / decodeEnvelope', () => {
    test('encodes and decodes a seal result', async () => {
      const hpke = HpkeProvider.create(subtle).orThrow();
      const recipientPub = await importRecipientPub();
      const recipientPriv = await importRecipientPriv();

      const info = new TextEncoder().encode('ctx');
      const aad = new TextEncoder().encode('aad');
      const plaintext = new TextEncoder().encode('hello');

      const sealed = (await hpke.sealBase(recipientPub, info, aad, plaintext)).orThrow();
      const envelope = HpkeProvider.encodeEnvelope(sealed);

      expect(envelope.length).toBe(sealed.enc.length + sealed.ciphertext.length);

      expect(HpkeProvider.decodeEnvelope(envelope)).toSucceedAndSatisfy((decoded) => {
        expect(decoded.enc).toEqual(sealed.enc);
        expect(decoded.ciphertext).toEqual(sealed.ciphertext);
      });

      expect(
        await hpke.openBase(recipientPriv, info, aad, sealed.enc, sealed.ciphertext)
      ).toSucceedAndSatisfy((pt) => expect(pt).toEqual(plaintext));
    });

    test('decodeEnvelope returns Failure for too-short envelope', () => {
      expect(HpkeProvider.decodeEnvelope(new Uint8Array(47))).toFailWith(/envelope too short/i);
    });

    test('decodeEnvelope accepts minimum-length envelope (32+16 bytes)', () => {
      const minEnvelope = new Uint8Array(48);
      expect(HpkeProvider.decodeEnvelope(minEnvelope)).toSucceedAndSatisfy((decoded: IHpkeSealResult) => {
        expect(decoded.enc.length).toBe(32);
        expect(decoded.ciphertext.length).toBe(16);
      });
    });
  });
});
