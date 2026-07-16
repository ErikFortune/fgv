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

import { captureAsyncResult, fail, Result } from '@fgv/ts-utils';
import { SeedDerivableAlgorithm } from './model';

/**
 * The RFC 8410 §7 DER prefix for an Ed25519 PKCS#8 `OneAsymmetricKey`
 * (a.k.a. `PrivateKeyInfo`) wrapping a bare 32-byte seed. The 16 bytes below
 * decode as:
 *
 * ```text
 *   30 2e             SEQUENCE (46 bytes)
 *     02 01 00        INTEGER version 0 (v1)
 *     30 05           SEQUENCE AlgorithmIdentifier (5 bytes)
 *       06 03 2b6570    OID 1.3.101.112 (id-Ed25519)
 *     04 22           OCTET STRING privateKey (34 bytes)
 *       04 20         OCTET STRING CurvePrivateKey (32 bytes)
 * ```
 *
 * The 32-byte seed follows immediately, for a total of 48 bytes. An Ed25519
 * private key *is* its 32-byte seed (RFC 8032 §5.1.5), and the public key is a
 * deterministic function of that seed, so wrapping the seed in this envelope and
 * importing it via WebCrypto recovers the exact keypair on every runtime.
 */
const _ED25519_PKCS8_SEED_PREFIX: ReadonlyArray<number> = [
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20
];

/**
 * Required length, in bytes, of an Ed25519 seed (RFC 8032 §5.1.5).
 */
const _ED25519_SEED_LENGTH: number = 32;

/**
 * Derives an asymmetric keypair *deterministically* from a fixed secret seed
 * using `globalThis.crypto.subtle`, shared by the Node and browser
 * {@link CryptoUtils.ICryptoProvider} implementations (both speak the same
 * WebCrypto API). See
 * {@link CryptoUtils.ICryptoProvider.importKeyPairFromSeed | importKeyPairFromSeed}
 * for the public contract.
 *
 * For `'ed25519'`: wraps the 32-byte seed in the RFC 8410 PKCS#8 envelope, then
 * runs a transient-extractable-then-derive dance so the public key is
 * recoverable even when the caller requests a non-extractable private key:
 *
 * 1. Import the PKCS#8 as a *transient* extractable private key.
 * 2. Export it to JWK to read the deterministic public coordinate `x`.
 * 3. Import `{ kty: 'OKP', crv: 'Ed25519', x }` as the returned public key.
 * 4. For the returned private key: reuse the transient key when `extractable`
 *    is `true`; otherwise re-import the same PKCS#8 as a non-extractable key.
 *    The transient extractable key is never returned when `extractable` is
 *    `false`, so seed material cannot escape through it.
 *
 * The seed bytes are copied into a freshly allocated PKCS#8 buffer, so the
 * `BufferSource` handed to WebCrypto is always backed by a plain `ArrayBuffer`
 * (side-stepping the Node-20 `SharedArrayBuffer`-view rejection) and the
 * caller's `seed` is never mutated.
 *
 * @param algorithm - The seed-derivable algorithm; only `'ed25519'` is
 * supported today. Any other value fails loudly rather than being mis-handled.
 * @param seed - The 32-byte secret seed. Any other length fails loudly, before
 * any WebCrypto call.
 * @param extractable - Whether the returned private key may be exported.
 * @returns `Success` with the derived `CryptoKeyPair`, or `Failure` with error context.
 * @public
 */
export async function deriveKeyPairFromSeed(
  algorithm: SeedDerivableAlgorithm,
  seed: Uint8Array,
  extractable: boolean
): Promise<Result<CryptoKeyPair>> {
  if (algorithm !== 'ed25519') {
    return fail(
      `importKeyPairFromSeed: unsupported seed-derivable algorithm '${algorithm}' (only 'ed25519' is supported)`
    );
  }
  if (seed.length !== _ED25519_SEED_LENGTH) {
    return fail(
      `importKeyPairFromSeed: ed25519 seed must be exactly ${_ED25519_SEED_LENGTH} bytes, got ${seed.length}`
    );
  }

  // Back the PKCS#8 by a fresh, non-shared ArrayBuffer so the BufferSource handed
  // to WebCrypto is a `Uint8Array<ArrayBuffer>` — Node 20+ rejects a shared-buffer
  // view, and TypeScript's `BufferSource` excludes the `SharedArrayBuffer` branch.
  const pkcs8: Uint8Array<ArrayBuffer> = new Uint8Array(
    new ArrayBuffer(_ED25519_PKCS8_SEED_PREFIX.length + _ED25519_SEED_LENGTH)
  );
  pkcs8.set(_ED25519_PKCS8_SEED_PREFIX, 0);
  pkcs8.set(seed, _ED25519_PKCS8_SEED_PREFIX.length);

  return (
    await captureAsyncResult<CryptoKeyPair>(async () => {
      const subtle = globalThis.crypto.subtle;
      // Transient extractable private key — only used to read the deterministic
      // public coordinate; dropped (never returned/logged) when the caller
      // asked for a non-extractable private key.
      const transientPrivateKey = await subtle.importKey('pkcs8', pkcs8, { name: 'Ed25519' }, true, ['sign']);
      const jwk = await subtle.exportKey('jwk', transientPrivateKey);
      const publicKey = await subtle.importKey(
        'jwk',
        { kty: 'OKP', crv: 'Ed25519', x: jwk.x },
        { name: 'Ed25519' },
        true,
        ['verify']
      );
      const privateKey = extractable
        ? transientPrivateKey
        : await subtle.importKey('pkcs8', pkcs8, { name: 'Ed25519' }, false, ['sign']);
      return { publicKey, privateKey };
    })
  ).withErrorFormat((e) => `importKeyPairFromSeed: failed to derive ${algorithm} keypair from seed: ${e}`);
}
