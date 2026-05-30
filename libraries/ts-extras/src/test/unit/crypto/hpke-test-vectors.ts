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

/**
 * Shared HPKE test vectors used by both ts-extras and ts-web-extras test suites.
 *
 * Cross-runtime anchor strategy (per design §6):
 * - RFC 9180 Appendix A does not include vectors for DHKEM(X25519)+AES-256-GCM.
 *   (A.1 covers X25519+AES-128-GCM; A.6 covers P-521+AES-256-GCM.)
 * - These self-generated vectors were produced by the Node.js implementation and
 *   are used in both the ts-extras (Node) and ts-web-extras (browser Web Crypto)
 *   test suites to verify cross-runtime equivalence.
 * - RFC 5869 HKDF vectors below are from the authoritative RFC Appendix A and
 *   validate the HKDF-Extract / HKDF-Expand implementation.
 */

function hexToBytes(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return result;
}

/**
 * Fixed X25519 recipient keypair used across all self-generated vector cases.
 * Generated with Node.js crypto.webcrypto.subtle; raw public key + JWK private key.
 */
export const RECIPIENT_PUB_HEX: string = '036e034c034bcfd6f89af0d3b3bb1302e350efd3c09a3cd75e0086a484874520';
export const RECIPIENT_PRIV_JWK: JsonWebKey = {
  key_ops: ['deriveBits'],
  ext: true,
  crv: 'X25519',
  d: 'mHW_qVgPUhL7FkcQpBvEElueXzpTubI3uamBYXcNt1k',
  x: 'A24DTANLz9b4mvDTs7sTAuNQ79PAmjzXXgCGpISHRSA',
  kty: 'OKP'
};

export const RECIPIENT_PUB_BYTES: Uint8Array = hexToBytes(RECIPIENT_PUB_HEX);

/**
 * Self-generated sealed ciphertext vectors for openBase validation.
 * Each vector was sealed under RECIPIENT_PUB_BYTES using the reference Node.js
 * implementation of DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM.
 */
export const SEAL_VECTORS = [
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
    plaintext: new Uint8Array(0),
    enc: hexToBytes('771f31479c6e710c8c2f0a39c47576ba52dde4f0f06b200926f747bd8e584069'),
    ciphertext: hexToBytes('8b8aead630453d29744fc2410b43b37a')
  },
  {
    label: 'empty aad',
    info: hexToBytes('746573742d6170702f76310063747833'),
    aad: new Uint8Array(0),
    plaintext: hexToBytes('6e6f2d61616420706c61696e74657874'),
    enc: hexToBytes('a6be1054774298019b0afaa8f58b855026cf39b653efa1bc6711452285320e02'),
    ciphertext: hexToBytes('c2192e08b81a8997c2e381a726c8ae8fd7e6ea89ca1934b4b42bb2368b0c14f1')
  }
] as const;

interface IHkdfTestVector {
  ikm: Uint8Array;
  salt: Uint8Array;
  info: Uint8Array;
  length: number;
  prk: Uint8Array;
  okm: Uint8Array;
}

/**
 * RFC 5869 HKDF-SHA256 Test Case 1 (from RFC 5869 Appendix A.1).
 * Used to validate the HpkeProvider.hkdf method (raw unlabeled HKDF).
 */
export const HKDF_RFC5869_CASE1: IHkdfTestVector = {
  ikm: hexToBytes('0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b'),
  salt: hexToBytes('000102030405060708090a0b0c'),
  info: hexToBytes('f0f1f2f3f4f5f6f7f8f9'),
  length: 42,
  prk: hexToBytes('077709362c2e32df0ddc3f0dc47bba6390b6c73bb50f9c3122ec844ad7c2b3e5'),
  okm: hexToBytes('3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865')
};
