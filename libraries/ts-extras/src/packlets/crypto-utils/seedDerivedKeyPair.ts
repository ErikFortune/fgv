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
 * Per-algorithm parameters for the shared seed→keypair derivation. The two
 * supported algorithms differ only in the OID embedded in the PKCS#8 envelope,
 * the WebCrypto algorithm name, the JWK curve name, and the key usages — the
 * envelope structure and 32-byte seed handling are identical.
 */
interface ISeedAlgorithmParams {
  /**
   * The RFC 8410 §7 DER prefix for a PKCS#8 `OneAsymmetricKey` wrapping a bare
   * 32-byte seed. Decodes as:
   *
   * ```text
   *   30 2e             SEQUENCE (46 bytes)
   *     02 01 00        INTEGER version 0 (v1)
   *     30 05           SEQUENCE AlgorithmIdentifier (5 bytes)
   *       06 03 2b65XX    OID 1.3.101.XXX
   *     04 22           OCTET STRING privateKey (34 bytes)
   *       04 20         OCTET STRING CurvePrivateKey (32 bytes)
   * ```
   *
   * The 32-byte seed follows immediately (total 48 bytes). Ed25519 uses OID
   * 1.3.101.112 (`...2b 65 70`); X25519 uses 1.3.101.110 (`...2b 65 6e`) — the
   * two prefixes differ only in that final OID byte.
   */
  readonly pkcs8Prefix: ReadonlyArray<number>;
  /** WebCrypto algorithm name (`importKey`'s `algorithm.name`). */
  readonly webCryptoName: 'Ed25519' | 'X25519';
  /** JWK curve name for the reconstructed public key. */
  readonly jwkCrv: 'Ed25519' | 'X25519';
  /** Usages for the imported private key. */
  readonly privateUsages: ReadonlyArray<KeyUsage>;
  /** Usages for the reconstructed public key (empty for X25519). */
  readonly publicUsages: ReadonlyArray<KeyUsage>;
}

/**
 * An Ed25519 or X25519 private key *is* its 32-byte seed (RFC 8032 §5.1.5 /
 * RFC 7748 §5), and the public key is a deterministic function of that seed, so
 * wrapping the seed in the PKCS#8 envelope and importing it via WebCrypto
 * recovers the exact keypair on every runtime.
 */
const _SEED_ALGORITHMS: Readonly<Record<SeedDerivableAlgorithm, ISeedAlgorithmParams>> = {
  ed25519: {
    pkcs8Prefix: [
      0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20
    ],
    webCryptoName: 'Ed25519',
    jwkCrv: 'Ed25519',
    privateUsages: ['sign'],
    publicUsages: ['verify']
  },
  x25519: {
    pkcs8Prefix: [
      0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x04, 0x22, 0x04, 0x20
    ],
    webCryptoName: 'X25519',
    jwkCrv: 'X25519',
    privateUsages: ['deriveBits'],
    publicUsages: []
  }
};

/**
 * Required length, in bytes, of an Ed25519 / X25519 seed (RFC 8032 §5.1.5 /
 * RFC 7748 §5).
 */
const _SEED_LENGTH: number = 32;

/**
 * Derives an asymmetric keypair *deterministically* from a fixed secret seed
 * using `globalThis.crypto.subtle`, shared by the Node and browser
 * {@link CryptoUtils.ICryptoProvider} implementations (both speak the same
 * WebCrypto API). See
 * {@link CryptoUtils.ICryptoProvider.importKeyPairFromSeed | importKeyPairFromSeed}
 * for the public contract.
 *
 * For each supported algorithm: wraps the 32-byte seed in the RFC 8410 PKCS#8
 * envelope, then runs a transient-extractable-then-derive dance so the public
 * key is recoverable even when the caller requests a non-extractable private key:
 *
 * 1. Import the PKCS#8 as a *transient* extractable private key.
 * 2. Export it to JWK to read the deterministic public coordinate `x`.
 * 3. Import `{ kty: 'OKP', crv, x }` as the returned public key.
 * 4. For the returned private key: reuse the transient key when `extractable`
 *    is `true`; otherwise re-import the same PKCS#8 as a non-extractable key.
 *    The transient extractable key is never returned when `extractable` is
 *    `false`, so seed material cannot escape through it.
 *
 * The two algorithms differ only in the OID/name/curve/usages (see
 * {@link ISeedAlgorithmParams}); `'x25519'` yields the DH key-agreement keypair
 * (private `'deriveBits'`, public no-usage) that {@link CryptoUtils.HpkeProvider}
 * consumes as its recipient key.
 *
 * The seed bytes are copied into a freshly allocated PKCS#8 buffer, so the
 * `BufferSource` handed to WebCrypto is always backed by a plain `ArrayBuffer`
 * (side-stepping the Node-20 `SharedArrayBuffer`-view rejection) and the
 * caller's `seed` is never mutated.
 *
 * @param algorithm - The seed-derivable algorithm (`'ed25519'` or `'x25519'`).
 * Any other value fails loudly rather than being mis-handled.
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
  const params = _SEED_ALGORITHMS[algorithm];
  if (params === undefined) {
    return fail(
      `importKeyPairFromSeed: unsupported seed-derivable algorithm '${algorithm}' (supported: 'ed25519', 'x25519')`
    );
  }
  if (seed.length !== _SEED_LENGTH) {
    return fail(
      `importKeyPairFromSeed: ${algorithm} seed must be exactly ${_SEED_LENGTH} bytes, got ${seed.length}`
    );
  }

  // Back the PKCS#8 by a fresh, non-shared ArrayBuffer so the BufferSource handed
  // to WebCrypto is a `Uint8Array<ArrayBuffer>` — Node 20+ rejects a shared-buffer
  // view, and TypeScript's `BufferSource` excludes the `SharedArrayBuffer` branch.
  const pkcs8: Uint8Array<ArrayBuffer> = new Uint8Array(
    new ArrayBuffer(params.pkcs8Prefix.length + _SEED_LENGTH)
  );
  pkcs8.set(params.pkcs8Prefix, 0);
  pkcs8.set(seed, params.pkcs8Prefix.length);

  const algo = { name: params.webCryptoName };
  const privateUsages = [...params.privateUsages];

  return (
    await captureAsyncResult<CryptoKeyPair>(async () => {
      const subtle = globalThis.crypto.subtle;
      // Transient extractable private key — only used to read the deterministic
      // public coordinate; dropped (never returned/logged) when the caller
      // asked for a non-extractable private key.
      const transientPrivateKey = await subtle.importKey('pkcs8', pkcs8, algo, true, privateUsages);
      const jwk = await subtle.exportKey('jwk', transientPrivateKey);
      const publicKey = await subtle.importKey(
        'jwk',
        { kty: 'OKP', crv: params.jwkCrv, x: jwk.x },
        algo,
        true,
        [...params.publicUsages]
      );
      const privateKey = extractable
        ? transientPrivateKey
        : await subtle.importKey('pkcs8', pkcs8, algo, false, privateUsages);
      return { publicKey, privateKey };
    })
  ).withErrorFormat((e) => `importKeyPairFromSeed: failed to derive ${algorithm} keypair from seed: ${e}`);
}
