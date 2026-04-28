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

import { KeyPairAlgorithm } from './model';

/**
 * WebCrypto parameters for a single {@link CryptoUtils.KeyPairAlgorithm}.
 * Implementations of {@link CryptoUtils.ICryptoProvider} use this table to
 * translate the small public algorithm enum into the WebCrypto algorithm
 * objects and key-usage arrays expected by `crypto.subtle`.
 * @public
 */
export interface IKeyPairAlgorithmParams {
  /**
   * Algorithm parameters for `crypto.subtle.generateKey`. Always an asymmetric
   * variant — these algorithms produce a `CryptoKeyPair`, not a single key.
   */
  readonly generateKey: RsaHashedKeyGenParams | EcKeyGenParams;

  /**
   * Algorithm parameters for `crypto.subtle.importKey('jwk', ...)` when
   * importing the public half of a keypair.
   */
  readonly importPublicKey: RsaHashedImportParams | EcKeyImportParams;

  /**
   * Default key usages for the generated `CryptoKeyPair`. Both halves receive
   * the usages WebCrypto considers valid for their role; the platform filters.
   */
  readonly keyPairUsages: ReadonlyArray<KeyUsage>;

  /**
   * Key usages applied when re-importing only the public key.
   */
  readonly publicKeyUsages: ReadonlyArray<KeyUsage>;
}

/**
 * Lookup table from {@link CryptoUtils.KeyPairAlgorithm} to the WebCrypto
 * parameters needed to drive `crypto.subtle`. Shared between every
 * {@link CryptoUtils.ICryptoProvider} implementation since both Node and
 * browser providers speak the same WebCrypto API. Exposed for downstream
 * provider implementations (e.g. browser-side providers in `@fgv/ts-web-extras`).
 * @public
 */
export const keyPairAlgorithmParams: Readonly<Record<KeyPairAlgorithm, IKeyPairAlgorithmParams>> = {
  'ecdsa-p256': {
    generateKey: { name: 'ECDSA', namedCurve: 'P-256' },
    importPublicKey: { name: 'ECDSA', namedCurve: 'P-256' },
    keyPairUsages: ['sign', 'verify'],
    publicKeyUsages: ['verify']
  },
  'rsa-oaep-2048': {
    generateKey: {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256'
    },
    importPublicKey: { name: 'RSA-OAEP', hash: 'SHA-256' },
    keyPairUsages: ['encrypt', 'decrypt'],
    publicKeyUsages: ['encrypt']
  },
  'ecdh-p256': {
    generateKey: { name: 'ECDH', namedCurve: 'P-256' },
    importPublicKey: { name: 'ECDH', namedCurve: 'P-256' },
    // WebCrypto filters per-role: the private key takes both derive usages,
    // and the public key gets [] since an ECDH public key alone cannot derive.
    keyPairUsages: ['deriveKey', 'deriveBits'],
    // Importing only the recipient's public key — empty usages because a
    // standalone ECDH public key has no derivation capability.
    publicKeyUsages: []
  }
};
