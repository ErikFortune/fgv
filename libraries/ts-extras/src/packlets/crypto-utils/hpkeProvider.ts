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

import { Result, captureAsyncResult, captureResult, fail, succeed } from '@fgv/ts-utils';

// ---- Internal constants ----

// "HPKE-v1" (7 bytes) — RFC 9180 domain separator prefix
const _HPKE_VERSION: Uint8Array<ArrayBuffer> = new Uint8Array([0x48, 0x50, 0x4b, 0x45, 0x2d, 0x76, 0x31]);

// suite_id = "HPKE" || I2OSP(KEM_ID=0x0020, 2) || I2OSP(KDF_ID=0x0001, 2) || I2OSP(AEAD_ID=0x0002, 2)
// Used in key schedule LabeledExtract/LabeledExpand calls.
const _SUITE_ID: Uint8Array<ArrayBuffer> = new Uint8Array([
  0x48, 0x50, 0x4b, 0x45, 0x00, 0x20, 0x00, 0x01, 0x00, 0x02
]);

// kem_suite_id = "KEM" || I2OSP(KEM_ID=0x0020, 2)
// Used in DHKEM-internal LabeledExtract/LabeledExpand calls.
const _KEM_SUITE_ID: Uint8Array<ArrayBuffer> = new Uint8Array([0x4b, 0x45, 0x4d, 0x00, 0x20]);

const _N_SECRET: number = 32; // Nsecret: KEM shared-secret output length
const _N_PK: number = 32; // Npk: X25519 public key (raw) length — also the enc length
const _N_K: number = 32; // Nk: AES-256-GCM key length
const _N_N: number = 12; // Nn: AES-256-GCM nonce length
const _N_T: number = 16; // Nt: AES-256-GCM authentication tag length
const _MODE_BASE: number = 0x00; // RFC 9180 mode_base

// ---- Internal helpers ----
// These are NOT exported. Per design D7, only the five public operations are public surface.

// Copies any Uint8Array into a fresh Uint8Array<ArrayBuffer>.
// Required to satisfy TypeScript's strict BufferSource typing for Web Crypto API calls —
// subtle.* rejects Uint8Array<ArrayBufferLike> but accepts Uint8Array<ArrayBuffer>.
// Pattern follows browserCryptoProvider.ts toBufferView.
function _toBufferView(arr: Uint8Array): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(arr.byteLength);
  const view = new Uint8Array(buffer);
  view.set(arr);
  return view;
}

function _concat(...arrays: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const buffer = new ArrayBuffer(total);
  const out = new Uint8Array(buffer);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

function _i2osp(value: number, length: number): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(length);
  const out = new Uint8Array(buffer);
  for (let i = length - 1; i >= 0; i--) {
    out[i] = value % 256;
    value = Math.floor(value / 256);
  }
  return out;
}

// Decodes a base64url-encoded string to Uint8Array<ArrayBuffer>.
// Uses `atob` (global in Node 18+ and all modern browsers; no import needed).
function _base64UrlDecode(s: string): Uint8Array<ArrayBuffer> {
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

// HMAC-SHA256(key, data) — the underlying primitive for HKDF.
async function _hmacSha256(
  subtle: SubtleCrypto,
  key: Uint8Array,
  data: Uint8Array
): Promise<Uint8Array<ArrayBuffer>> {
  const hmacKey = await subtle.importKey(
    'raw',
    _toBufferView(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return new Uint8Array(await subtle.sign('HMAC', hmacKey, _toBufferView(data)));
}

// RFC 5869 HKDF-Extract(salt, IKM) = HMAC-SHA256(key=salt, msg=IKM).
// If salt is empty (length 0), uses 32 zero bytes per RFC 5869 §2.2.
async function _hkdfExtract(
  subtle: SubtleCrypto,
  salt: Uint8Array,
  ikm: Uint8Array
): Promise<Uint8Array<ArrayBuffer>> {
  const effectiveSalt = salt.length === 0 ? new Uint8Array(32) : salt;
  return _hmacSha256(subtle, effectiveSalt, ikm);
}

// RFC 5869 HKDF-Expand(PRK, info, L) — iterative HMAC expansion.
async function _hkdfExpand(
  subtle: SubtleCrypto,
  prk: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array<ArrayBuffer>> {
  if (length > 255 * 32) {
    throw new Error(`HKDF-Expand: requested length ${length} exceeds maximum 8160 bytes (255 * HashLen)`);
  }
  const n = Math.ceil(length / 32);
  const buffer = new ArrayBuffer(length);
  const okm = new Uint8Array(buffer);
  let prev: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(0));
  let offset = 0;
  for (let i = 1; i <= n; i++) {
    prev = await _hmacSha256(subtle, prk, _concat(prev, info, new Uint8Array([i])));
    const toCopy = Math.min(32, length - offset);
    okm.set(prev.subarray(0, toCopy), offset);
    offset += toCopy;
  }
  return okm;
}

// RFC 9180 §4 LabeledExtract — HKDF-Extract with HPKE-v1 domain label.
// labeled_ikm = "HPKE-v1" || suite_id || label || ikm
// Extract(salt, labeled_ikm)
async function _labeledExtract(
  subtle: SubtleCrypto,
  suiteId: Uint8Array,
  salt: Uint8Array,
  label: string,
  ikm: Uint8Array
): Promise<Uint8Array<ArrayBuffer>> {
  const labeledIkm = _concat(_HPKE_VERSION, suiteId, new TextEncoder().encode(label), ikm);
  return _hkdfExtract(subtle, salt, labeledIkm);
}

// RFC 9180 §4 LabeledExpand — HKDF-Expand with HPKE-v1 domain label.
// labeled_info = I2OSP(L, 2) || "HPKE-v1" || suite_id || label || info
// Expand(prk, labeled_info, L)
async function _labeledExpand(
  subtle: SubtleCrypto,
  suiteId: Uint8Array,
  prk: Uint8Array,
  label: string,
  info: Uint8Array,
  length: number
): Promise<Uint8Array<ArrayBuffer>> {
  const labeledInfo = _concat(
    _i2osp(length, 2),
    _HPKE_VERSION,
    suiteId,
    new TextEncoder().encode(label),
    info
  );
  return _hkdfExpand(subtle, prk, labeledInfo, length);
}

// RFC 9180 §4.1 DHKEM Encap — generates ephemeral keypair, DH with recipient pubkey,
// derives shared_secret via ExtractAndExpand.
// NOTE: uses label "eae_prk" (not "dh") per RFC 9180 §4.1 ExtractAndExpand.
async function _kemEncap(
  subtle: SubtleCrypto,
  recipientPublicKey: CryptoKey
): Promise<{ sharedSecret: Uint8Array<ArrayBuffer>; enc: Uint8Array<ArrayBuffer> }> {
  const ephemeral = (await subtle.generateKey({ name: 'X25519' }, true, ['deriveBits'])) as CryptoKeyPair;
  const enc = new Uint8Array(await subtle.exportKey('raw', ephemeral.publicKey));
  const dh = new Uint8Array(
    await subtle.deriveBits({ name: 'X25519', public: recipientPublicKey }, ephemeral.privateKey, 256)
  );
  const pkRm = new Uint8Array(await subtle.exportKey('raw', recipientPublicKey));
  const kemContext = _concat(enc, pkRm);
  const eaePrk = await _labeledExtract(subtle, _KEM_SUITE_ID, new Uint8Array(0), 'eae_prk', dh);
  const sharedSecret = await _labeledExpand(
    subtle,
    _KEM_SUITE_ID,
    eaePrk,
    'shared_secret',
    kemContext,
    _N_SECRET
  );
  return { sharedSecret, enc };
}

// RFC 9180 §4.1 DHKEM Decap — deserializes enc, DH with recipient privkey,
// derives same shared_secret via ExtractAndExpand.
// The DH step (deriveBits) works on a non-extractable recipientPrivateKey. Recovering the
// recipient's own public key bytes (pkRm) for kem_context normally requires a JWK export, which
// in turn requires recipientPrivateKey to be extractable — UNLESS the caller supplies pkRm
// directly (raw 32-byte X25519 public key), in which case no JWK export happens and
// recipientPrivateKey may be non-extractable.
async function _kemDecap(
  subtle: SubtleCrypto,
  enc: Uint8Array,
  recipientPrivateKey: CryptoKey,
  recipientPublicKey?: Uint8Array
): Promise<Uint8Array<ArrayBuffer>> {
  const pkE = await subtle.importKey('raw', _toBufferView(enc), { name: 'X25519' }, true, []);
  const dh = new Uint8Array(
    await subtle.deriveBits({ name: 'X25519', public: pkE }, recipientPrivateKey, 256)
  );
  let pkRm: Uint8Array;
  if (recipientPublicKey !== undefined) {
    // Caller-supplied; length already validated in openBase.
    pkRm = recipientPublicKey;
  } else {
    // Recover recipient's own public key from JWK x field (base64url-encoded raw X25519 public key).
    const jwk = (await subtle.exportKey('jwk', recipientPrivateKey)) as JsonWebKey;
    /* c8 ignore next 3 - defensive: X25519 JWK always has an x field; unreachable via public API */
    if (!jwk.x) {
      throw new Error('HPKE Decap: failed to extract public key bytes from recipient private key JWK');
    }
    pkRm = _base64UrlDecode(jwk.x);
  }
  const kemContext = _concat(enc, pkRm);
  const eaePrk = await _labeledExtract(subtle, _KEM_SUITE_ID, new Uint8Array(0), 'eae_prk', dh);
  return _labeledExpand(subtle, _KEM_SUITE_ID, eaePrk, 'shared_secret', kemContext, _N_SECRET);
}

// RFC 9180 §5 KeySchedule (base mode, psk = b"", psk_id = b"").
async function _keyScheduleBase(
  subtle: SubtleCrypto,
  sharedSecret: Uint8Array,
  info: Uint8Array
): Promise<{ key: Uint8Array<ArrayBuffer>; baseNonce: Uint8Array<ArrayBuffer> }> {
  const empty = new Uint8Array(0);
  const pskIdHash = await _labeledExtract(subtle, _SUITE_ID, empty, 'psk_id_hash', empty);
  const infoHash = await _labeledExtract(subtle, _SUITE_ID, empty, 'info_hash', info);
  const ksContext = _concat(new Uint8Array([_MODE_BASE]), pskIdHash, infoHash);
  const prk = await _labeledExtract(subtle, _SUITE_ID, sharedSecret, 'secret', empty);
  const key = await _labeledExpand(subtle, _SUITE_ID, prk, 'key', ksContext, _N_K);
  const baseNonce = await _labeledExpand(subtle, _SUITE_ID, prk, 'base_nonce', ksContext, _N_N);
  return { key, baseNonce };
}

// ---- Public types ----

/**
 * Output of {@link HpkeProvider.sealBase}.
 *
 * The `ciphertext` field includes the 16-byte AES-256-GCM authentication tag
 * appended by Web Crypto's `encrypt()` operation: `length = plaintext.length + 16`.
 * @public
 */
export interface IHpkeSealResult {
  /**
   * Encapsulated key — 32-byte raw X25519 ephemeral public key (`enc` in RFC 9180).
   * Must be transmitted to the recipient alongside `ciphertext`.
   */
  readonly enc: Uint8Array;

  /**
   * AES-256-GCM ciphertext with the 16-byte authentication tag appended.
   * Length = `plaintext.length + 16`.
   */
  readonly ciphertext: Uint8Array;
}

// ---- Public class ----

/**
 * HPKE base mode (RFC 9180) — `DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM`.
 *
 * Class-based provider that captures a `SubtleCrypto` instance at construction,
 * matching the existing `NodeCryptoProvider` / `BrowserCryptoProvider` / `KeyStore`
 * factory pattern used throughout `@fgv/ts-extras/crypto-utils`.
 *
 * **Node.js usage:**
 * ```typescript
 * import * as crypto from 'crypto';
 * const hpke = HpkeProvider.create(crypto.webcrypto.subtle).orThrow();
 * ```
 *
 * **Browser usage:**
 * ```typescript
 * const hpke = HpkeProvider.create(globalThis.crypto.subtle).orThrow();
 * ```
 *
 * **Runtime requirements:** Node.js 20+ (X25519 in `crypto.webcrypto`);
 * Chrome 113+, Safari 16.4+, Firefox 118+ (X25519 added to Web Crypto in 2023).
 * @public
 */
export class HpkeProvider {
  private readonly _subtle: SubtleCrypto;

  private constructor(subtle: SubtleCrypto) {
    this._subtle = subtle;
  }

  /**
   * Creates an `HpkeProvider` bound to the given `SubtleCrypto` instance.
   *
   * @param subtle - Web Crypto SubtleCrypto instance.
   *   Node.js: `(await import('crypto')).webcrypto.subtle`.
   *   Browser: `globalThis.crypto.subtle`.
   * @returns `Success` with the provider, or `Failure` if construction fails.
   */
  public static create(subtle: SubtleCrypto): Result<HpkeProvider> {
    return captureResult(() => new HpkeProvider(subtle));
  }

  /**
   * HPKE base-mode seal (sender side). RFC 9180 §6.1.
   *
   * Generates a fresh ephemeral X25519 keypair, runs DHKEM Encap to produce a
   * shared secret and `enc` (32-byte raw ephemeral public key), derives the AEAD
   * key and nonce deterministically via the RFC 9180 key schedule, then encrypts
   * `plaintext` with AES-256-GCM.
   *
   * @param recipientPublicKey - Recipient's X25519 public `CryptoKey`
   *   (`algorithm.name === 'X25519'`, `type === 'public'`, **`extractable: true`**).
   *   Must be extractable — DHKEM Encap calls `exportKey('raw', ...)` on this key to
   *   build the KEM shared-secret context. Keys imported with `extractable: false` will
   *   cause this method to return a `Failure`.
   * @param info - Context-binding bytes. **Load-bearing — no default.**
   *   Binds this ciphertext to a specific application context, preventing replay
   *   across different contexts sharing the same recipient keypair.
   *   Use `new TextEncoder().encode('myapp/v1/use-case\x00' + contextId)` pattern.
   *   Never pass an empty array in production: empty `info` provides no context binding.
   * @param aad - Additional authenticated data. Integrity-protected but not encrypted.
   *   `new Uint8Array(0)` is valid when no AAD is needed.
   * @param plaintext - Bytes to encrypt. `new Uint8Array(0)` is valid.
   * @returns `Success` with `{ enc, ciphertext }`, or `Failure` with error context.
   */
  public async sealBase(
    recipientPublicKey: CryptoKey,
    info: Uint8Array,
    aad: Uint8Array,
    plaintext: Uint8Array
  ): Promise<Result<IHpkeSealResult>> {
    const result = await captureAsyncResult(async () => {
      const { sharedSecret, enc } = await _kemEncap(this._subtle, recipientPublicKey);
      const { key, baseNonce } = await _keyScheduleBase(this._subtle, sharedSecret, info);
      const aesKey = await this._subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['encrypt']);
      const ct = await this._subtle.encrypt(
        { name: 'AES-GCM', iv: baseNonce, additionalData: _toBufferView(aad) },
        aesKey,
        _toBufferView(plaintext)
      );
      return { enc, ciphertext: new Uint8Array(ct) };
    });
    return result.withErrorFormat((e: string) => `HPKE sealBase failed: ${e}`);
  }

  /**
   * HPKE base-mode open (recipient side). RFC 9180 §6.1.
   *
   * Decapsulates `enc` using the recipient's X25519 private key, derives the same
   * AEAD key and nonce from the shared secret and `info`, then authenticates and
   * decrypts `ciphertext` with AES-256-GCM.
   *
   * Returns `Failure` on any of:
   * - Wrong private key (different DH output → different key derivation)
   * - Wrong `info` (different key schedule context → different AEAD key)
   * - Wrong `aad` (AES-GCM authentication fails)
   * - Tampered `ciphertext` or `enc` (authentication fails or DH fails)
   * - `enc` not exactly 32 bytes
   * - `ciphertext` shorter than 16 bytes (no room for authentication tag)
   *
   * @param recipientPrivateKey - Recipient's X25519 private `CryptoKey`
   *   (`algorithm.name === 'X25519'`, `type === 'private'`, `usages` includes `'deriveBits'`).
   *   **Must be extractable** (`extractable: true`) only when `recipientPublicKey` is not
   *   supplied — the recipient's public key bytes are then recovered from the JWK `x` field
   *   during Decap. When `recipientPublicKey` is supplied, `recipientPrivateKey` may be
   *   non-extractable.
   * @param info - Context-binding bytes. Must exactly match `info` from `sealBase`.
   * @param aad - Must exactly match `aad` from `sealBase`.
   * @param enc - The encapsulated key from `sealBase` — exactly 32 bytes.
   * @param ciphertext - The ciphertext from `sealBase` — `plaintext.length + 16` bytes.
   * @param recipientPublicKey - Optional raw 32-byte X25519 public key matching
   *   `recipientPrivateKey` (`pkRm` in RFC 9180 §4.1). Public material — supplying it lets
   *   Decap build `kem_context` without exporting `recipientPrivateKey` to JWK, so
   *   `recipientPrivateKey` no longer needs to be extractable. A mismatched value only breaks
   *   the caller's own decryption (AEAD authentication fails) — it cannot be used to attack
   *   another party's ciphertext.
   * @returns `Success` with decrypted plaintext bytes, or `Failure` with error context.
   */
  public async openBase(
    recipientPrivateKey: CryptoKey,
    info: Uint8Array,
    aad: Uint8Array,
    enc: Uint8Array,
    ciphertext: Uint8Array,
    recipientPublicKey?: Uint8Array
  ): Promise<Result<Uint8Array>> {
    if (enc.length !== _N_PK) {
      return fail(`HPKE openBase: enc must be ${_N_PK} bytes, got ${enc.length}`);
    }
    if (ciphertext.length < _N_T) {
      return fail(
        `HPKE openBase: ciphertext too short (minimum ${_N_T} bytes for auth tag, got ${ciphertext.length})`
      );
    }
    if (recipientPublicKey !== undefined && recipientPublicKey.length !== _N_PK) {
      return fail(
        `HPKE openBase: recipientPublicKey must be ${_N_PK} bytes, got ${recipientPublicKey.length}`
      );
    }
    const result = await captureAsyncResult(async () => {
      const sharedSecret = await _kemDecap(this._subtle, enc, recipientPrivateKey, recipientPublicKey);
      const { key, baseNonce } = await _keyScheduleBase(this._subtle, sharedSecret, info);
      const aesKey = await this._subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['decrypt']);
      const pt = await this._subtle.decrypt(
        { name: 'AES-GCM', iv: baseNonce, additionalData: _toBufferView(aad) },
        aesKey,
        _toBufferView(ciphertext)
      );
      return new Uint8Array(pt);
    });
    return result.withErrorFormat((e: string) => `HPKE openBase failed: ${e}`);
  }

  /**
   * HKDF-SHA256 key derivation (RFC 5869). Extract-then-Expand using SHA-256.
   *
   * This is raw RFC 5869 HKDF — it does **not** use RFC 9180's labeled variants.
   * The HPKE key schedule internally uses labeled HKDF; this method is the unlabeled
   * version for callers that need standalone key derivation.
   *
   * @param secret - Input keying material (IKM). Any length.
   * @param salt - Optional salt. Use `new Uint8Array(0)` if no salt is available
   *   (RFC 5869: 32 zero bytes are used internally when salt is empty).
   * @param info - Context / application-binding bytes. Any length.
   * @param length - Number of output bytes to derive. Maximum 8160 bytes (255 × 32).
   * @returns `Success` with derived bytes, or `Failure` with error context.
   */
  public async hkdf(
    secret: Uint8Array,
    salt: Uint8Array,
    info: Uint8Array,
    length: number
  ): Promise<Result<Uint8Array>> {
    const result = await captureAsyncResult(async () => {
      const prk = await _hkdfExtract(this._subtle, salt, secret);
      return _hkdfExpand(this._subtle, prk, info, length);
    });
    return result.withErrorFormat((e: string) => `HKDF failed: ${e}`);
  }

  /**
   * Encodes an {@link IHpkeSealResult} as a single contiguous byte array for wire transport.
   *
   * Format: `enc` (32 bytes, fixed) || `ciphertext` (variable length).
   * The 32-byte `enc` length is fixed for X25519; the split point is unambiguous.
   *
   * @param result - The output of {@link HpkeProvider.sealBase}.
   * @returns Concatenated bytes: `enc || ciphertext`.
   */
  public static encodeEnvelope(result: IHpkeSealResult): Uint8Array {
    return _concat(result.enc, result.ciphertext);
  }

  /**
   * Decodes an envelope produced by {@link HpkeProvider.encodeEnvelope}.
   *
   * Validates that the buffer is at least 48 bytes (32-byte enc + 16-byte minimum
   * ciphertext containing the AES-GCM auth tag; zero-length plaintext is the minimum
   * meaningful case).
   *
   * @param envelope - Envelope bytes from `encodeEnvelope`.
   * @returns `Success` with `{ enc, ciphertext }`, or `Failure` if malformed.
   */
  public static decodeEnvelope(envelope: Uint8Array): Result<IHpkeSealResult> {
    const minLen = _N_PK + _N_T;
    if (envelope.length < minLen) {
      return fail(
        `HPKE decodeEnvelope: envelope too short (minimum ${minLen} bytes, got ${envelope.length})`
      );
    }
    return succeed({
      enc: envelope.slice(0, _N_PK),
      ciphertext: envelope.slice(_N_PK)
    });
  }
}
