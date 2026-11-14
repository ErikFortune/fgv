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

import { HpkeProvider } from '../../packlets/crypto-utils';

const subtle = globalThis.crypto.subtle;

// ---- Cross-runtime test vectors ----
// These must match the values in ts-extras hpke-test-vectors.ts.
// Both test suites use the same vectors to verify that the Node.js (ts-extras)
// and browser Web Crypto (ts-web-extras) implementations produce identical results
// for DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM.

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(hex.length / 2);
  const result = new Uint8Array(buf);
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return result;
}

// Wraps TextEncoder.encode() into an ArrayBuffer-backed Uint8Array so that Jest
// toEqual comparisons work consistently across jsdom and Node.js environments.
function textBytes(s: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(s);
  const buf = new ArrayBuffer(encoded.byteLength);
  new Uint8Array(buf).set(encoded);
  return new Uint8Array(buf);
}

const RECIPIENT_PUB_HEX: string = '036e034c034bcfd6f89af0d3b3bb1302e350efd3c09a3cd75e0086a484874520';
const RECIPIENT_PRIV_JWK: JsonWebKey = {
  key_ops: ['deriveBits'],
  ext: true,
  crv: 'X25519',
  d: 'mHW_qVgPUhL7FkcQpBvEElueXzpTubI3uamBYXcNt1k',
  x: 'A24DTANLz9b4mvDTs7sTAuNQ79PAmjzXXgCGpISHRSA',
  kty: 'OKP'
};

const RECIPIENT_PUB_BYTES: Uint8Array<ArrayBuffer> = hexToBytes(RECIPIENT_PUB_HEX);

// Self-generated cross-runtime anchors (produced by ts-extras Node.js implementation).
const SEAL_VECTORS = [
  {
    label: 'hello world plaintext',
    info: hexToBytes('746573742d6170702f76310063747831'),
    aad: hexToBytes('73656e6465722d69643a616c696365'),
    plaintext: hexToBytes('48656c6c6f2c2048504b4521'),
    enc: hexToBytes('19f69be9a4070248fc5c37630508d7e8078411c1498ebfcee5bcb38f467f261e'),
    ciphertext: hexToBytes('e81ad1eeb687f00f9fd6602dd7ff30420efbf5319ab01c6b869c974d')
  },
  {
    label: 'empty plaintext',
    info: hexToBytes('746573742d6170702f76310063747832'),
    aad: hexToBytes('6161642d64617461'),
    plaintext: new Uint8Array(new ArrayBuffer(0)),
    enc: hexToBytes('771f31479c6e710c8c2f0a39c47576ba52dde4f0f06b200926f747bd8e584069'),
    ciphertext: hexToBytes('8b8aead630453d29744fc2410b43b37a')
  },
  {
    label: 'empty aad',
    info: hexToBytes('746573742d6170702f76310063747833'),
    aad: new Uint8Array(new ArrayBuffer(0)),
    plaintext: hexToBytes('6e6f2d61616420706c61696e74657874'),
    enc: hexToBytes('a6be1054774298019b0afaa8f58b855026cf39b653efa1bc6711452285320e02'),
    ciphertext: hexToBytes('c2192e08b81a8997c2e381a726c8ae8fd7e6ea89ca1934b4b42bb2368b0c14f1')
  }
] as const;

// RFC 5869 HKDF-SHA256 Test Case 1 (Appendix A.1)
const HKDF_RFC5869_CASE1 = {
  ikm: hexToBytes('0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b'),
  salt: hexToBytes('000102030405060708090a0b0c'),
  info: hexToBytes('f0f1f2f3f4f5f6f7f8f9'),
  length: 42,
  okm: hexToBytes('3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865')
};

// ---- Helpers ----

async function importRecipientPub(): Promise<CryptoKey> {
  return subtle.importKey('raw', RECIPIENT_PUB_BYTES, { name: 'X25519' }, true, []);
}

async function importRecipientPriv(): Promise<CryptoKey> {
  return subtle.importKey('jwk', RECIPIENT_PRIV_JWK, { name: 'X25519' }, true, ['deriveBits']);
}

// ---- Tests ----

describe('HpkeProvider (browser / Web Crypto)', () => {
  describe('create', () => {
    test('succeeds with globalThis.crypto.subtle', () => {
      expect(HpkeProvider.create(subtle)).toSucceed();
    });
  });

  describe('sealBase / openBase roundtrip', () => {
    let hpke: typeof HpkeProvider.prototype;
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
        hexToBytes('746573742d6170702f7631006374784272'),
        hexToBytes('6161642d64617461'),
        textBytes('Browser test!')
      ],
      [
        'empty plaintext',
        hexToBytes('746573742d6170702f76310063747842'),
        new Uint8Array(new ArrayBuffer(0)),
        new Uint8Array(new ArrayBuffer(0))
      ],
      [
        'empty aad',
        hexToBytes('746573742d6170702f76310063747843'),
        new Uint8Array(new ArrayBuffer(0)),
        textBytes('no-aad browser')
      ]
    ])('round-trips %s', async (label, info, aad, plaintext) => {
      const sealed = (await hpke.sealBase(recipientPub, info, aad, plaintext)).orThrow();
      expect(sealed.enc.length).toBe(32);
      expect(sealed.ciphertext.length).toBe(plaintext.length + 16);
      expect(
        await hpke.openBase(recipientPriv, info, aad, sealed.enc, sealed.ciphertext)
      ).toSucceedAndSatisfy((pt) => expect(pt).toEqual(plaintext));
    });

    test('returns Failure on wrong private key', async () => {
      const otherPair = (await subtle.generateKey({ name: 'X25519' }, true, ['deriveBits'])) as CryptoKeyPair;
      const info = hexToBytes('746573742d6170702f76310063747844');
      const aad = new Uint8Array(new ArrayBuffer(0));
      const plaintext = textBytes('secret');

      const sealed = (await hpke.sealBase(recipientPub, info, aad, plaintext)).orThrow();
      expect(await hpke.openBase(otherPair.privateKey, info, aad, sealed.enc, sealed.ciphertext)).toFail();
    });

    test('returns Failure on wrong info', async () => {
      const info = hexToBytes('746573742d6170702f76310063747845');
      const wrongInfo = hexToBytes('746573742d6170702f76310063747846');
      const aad = new Uint8Array(new ArrayBuffer(0));
      const plaintext = textBytes('secret');

      const sealed = (await hpke.sealBase(recipientPub, info, aad, plaintext)).orThrow();
      expect(await hpke.openBase(recipientPriv, wrongInfo, aad, sealed.enc, sealed.ciphertext)).toFail();
    });

    test('returns Failure on tampered ciphertext', async () => {
      const info = hexToBytes('746573742d6170702f76310063747847');
      const aad = new Uint8Array(new ArrayBuffer(0));
      const plaintext = textBytes('secret');

      const sealed = (await hpke.sealBase(recipientPub, info, aad, plaintext)).orThrow();
      const tampered = new Uint8Array(sealed.ciphertext);
      tampered[0] ^= 0x01;
      expect(await hpke.openBase(recipientPriv, info, aad, sealed.enc, tampered)).toFail();
    });
  });

  describe('openBase input validation', () => {
    let hpke: typeof HpkeProvider.prototype;
    let recipientPriv: CryptoKey;

    beforeEach(async () => {
      hpke = HpkeProvider.create(subtle).orThrow();
      recipientPriv = await importRecipientPriv();
    });

    test('returns Failure when enc is not 32 bytes', async () => {
      expect(
        await hpke.openBase(
          recipientPriv,
          new Uint8Array(new ArrayBuffer(0)),
          new Uint8Array(new ArrayBuffer(0)),
          new Uint8Array(16),
          new Uint8Array(32)
        )
      ).toFailWith(/enc must be 32 bytes/i);
    });

    test('returns Failure when ciphertext is shorter than 16 bytes', async () => {
      expect(
        await hpke.openBase(
          recipientPriv,
          new Uint8Array(new ArrayBuffer(0)),
          new Uint8Array(new ArrayBuffer(0)),
          new Uint8Array(32),
          new Uint8Array(15)
        )
      ).toFailWith(/ciphertext too short/i);
    });
  });

  describe('openBase with cross-runtime anchors (Node.js-generated vectors)', () => {
    let hpke: typeof HpkeProvider.prototype;
    let recipientPriv: CryptoKey;

    beforeEach(async () => {
      hpke = HpkeProvider.create(subtle).orThrow();
      recipientPriv = await importRecipientPriv();
    });

    test.each(SEAL_VECTORS)(
      'decrypts $label (cross-runtime)',
      async ({ info, aad, plaintext, enc, ciphertext }) => {
        expect(await hpke.openBase(recipientPriv, info, aad, enc, ciphertext)).toSucceedAndSatisfy((pt) => {
          expect(pt).toEqual(plaintext);
        });
      }
    );
  });

  describe('hkdf', () => {
    let hpke: typeof HpkeProvider.prototype;

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
      const secret = textBytes('browser-secret');
      const result1 = (
        await hpke.hkdf(secret, new Uint8Array(new ArrayBuffer(0)), textBytes('ctx-a'), 32)
      ).orThrow();
      const result2 = (
        await hpke.hkdf(secret, new Uint8Array(new ArrayBuffer(0)), textBytes('ctx-b'), 32)
      ).orThrow();
      expect(result1).not.toEqual(result2);
    });

    test('returns Failure when length exceeds 8160 bytes', async () => {
      expect(
        await hpke.hkdf(textBytes('secret'), new Uint8Array(new ArrayBuffer(0)), textBytes('ctx'), 8161)
      ).toFailWith(/exceeds maximum 8160 bytes/i);
    });
  });

  describe('encodeEnvelope / decodeEnvelope', () => {
    test('round-trips an envelope', async () => {
      const hpke = HpkeProvider.create(subtle).orThrow();
      const recipientPub = await importRecipientPub();
      const recipientPriv = await importRecipientPriv();
      const info = hexToBytes('746573742d6170702f76310063747848');
      const aad = textBytes('browser-aad');
      const plaintext = textBytes('browser envelope test');

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
      expect(HpkeProvider.decodeEnvelope(new Uint8Array(48))).toSucceed();
    });
  });
});
