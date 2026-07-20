// Copyright (c) 2024 Erik Fortune
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

import { JsonValue } from '@fgv/ts-json-base';
import { Brand, Result, Uuid } from '@fgv/ts-utils';

import * as Constants from './constants';
export { Constants };

// ============================================================================
// Public Key Types
// ============================================================================

/**
 * A multibase base64url-encoded SPKI (SubjectPublicKeyInfo) public key string —
 * a `'m'` multibase prefix followed by a base64url-no-pad body. Produced by
 * {@link CryptoUtils.exportPublicKeyAsMultibaseSpki} and consumed by
 * {@link CryptoUtils.importPublicKeyFromMultibaseSpki}. Obtain the brand at a
 * boundary via {@link CryptoUtils.isValidMultibaseSpkiPublicKey} or the
 * {@link CryptoUtils.Converters.multibaseSpkiPublicKey} converter.
 * @public
 */
export type MultibaseSpkiPublicKey = Brand<string, 'MultibaseSpkiPublicKey'>;

// ============================================================================
// Encryption Types
// ============================================================================

/**
 * Supported encryption algorithms.
 * @public
 */
export type EncryptionAlgorithm = typeof Constants.DEFAULT_ALGORITHM;

/**
 * Format version for encrypted files.
 * @public
 */
export type EncryptedFileFormat = typeof Constants.ENCRYPTED_FILE_FORMAT;

/**
 * Named secret for encryption/decryption.
 * @public
 */
export interface INamedSecret {
  /**
   * Unique name for this secret (referenced in encrypted files).
   */
  readonly name: string;

  /**
   * The actual secret key (32 bytes for AES-256).
   */
  readonly key: Uint8Array;
}

/**
 * Result of an encryption operation.
 * @public
 */
export interface IEncryptionResult {
  /**
   * Initialization vector used for encryption (12 bytes for GCM).
   */
  readonly iv: Uint8Array;

  /**
   * Authentication tag from GCM mode (16 bytes).
   */
  readonly authTag: Uint8Array;

  /**
   * The encrypted data.
   */
  readonly encryptedData: Uint8Array;
}

/**
 * Result of a raw-byte AES-256-GCM encryption via
 * {@link CryptoUtils.ICryptoProvider.encryptBytes | encryptBytes}. The
 * authentication tag is returned separately from the ciphertext, mirroring the
 * separated-tag convention of {@link CryptoUtils.IEncryptionResult}. The exact
 * byte layout is:
 * - `ciphertext`: the AES-GCM ciphertext, byte-for-byte the same length as the
 *   input plaintext (GCM is a stream cipher — no padding). Empty plaintext
 *   yields an empty `ciphertext`.
 * - `authTag`: the 16-byte (128-bit) GCM authentication tag, computed over the
 *   ciphertext, the nonce, and any `aad`.
 *
 * The caller persists both fields alongside the (caller-owned) nonce and feeds
 * them back to {@link CryptoUtils.ICryptoProvider.decryptBytes | decryptBytes}.
 * @public
 */
export interface IEncryptBytesResult {
  /**
   * The AES-256-GCM ciphertext. Same length as the input plaintext (no tag
   * appended — the tag is carried separately in the `authTag` field).
   */
  readonly ciphertext: Uint8Array;

  /**
   * The 16-byte (128-bit) GCM authentication tag.
   */
  readonly authTag: Uint8Array;
}

/**
 * Asymmetric keypair algorithms supported by the crypto provider.
 * - `'ecdsa-p256'`: ECDSA over the P-256 curve, for signing.
 * - `'rsa-oaep-2048'`: RSA-OAEP, 2048-bit modulus with SHA-256, for encryption.
 * - `'ecdh-p256'`: ECDH over the P-256 curve, for key agreement
 *   (e.g. as the recipient keypair in
 *   {@link CryptoUtils.ICryptoProvider.wrapBytes | wrapBytes} /
 *   {@link CryptoUtils.ICryptoProvider.unwrapBytes | unwrapBytes}).
 * - `'ed25519'`: EdDSA over the Edwards25519 curve, for signing.
 *   Deterministic — the per-signature nonce is derived from the private key
 *   and message rather than sampled randomly, eliminating the random-nonce
 *   reuse risk that ECDSA carries. Distinct from X25519 (key agreement over
 *   the Montgomery form, Curve25519).
 * - `'x25519'`: Diffie-Hellman key agreement over the Montgomery form of
 *   Curve25519. Key-agreement only — use `deriveBits`/`deriveKey` to produce
 *   a shared secret from one party's private key and the peer's public key.
 *   Distinct from Ed25519 (which uses the twisted-Edwards form for signing).
 * @public
 */
export type KeyPairAlgorithm = 'ecdsa-p256' | 'rsa-oaep-2048' | 'ecdh-p256' | 'ed25519' | 'x25519';

/**
 * The subset of {@link CryptoUtils.KeyPairAlgorithm} whose keypair can be
 * derived *deterministically* from a fixed secret seed, for use with
 * {@link CryptoUtils.ICryptoProvider.importKeyPairFromSeed | importKeyPairFromSeed}.
 *
 * Two algorithms are supported, both of whose 32-byte private scalar *is* the
 * seed and whose public key is a deterministic function of it, so the same seed
 * always yields the same keypair on every runtime:
 * - `'ed25519'` — signing keypair (RFC 8032). Private usage `'sign'`, public
 *   usage `'verify'`.
 * - `'x25519'` — Diffie-Hellman key-agreement keypair (RFC 7748), the recipient
 *   keypair consumed by {@link CryptoUtils.HpkeProvider}. Private usage
 *   `'deriveBits'`, public key imported with no usages. Deriving a fixed X25519
 *   recipient keypair from a checked-in seed is what makes a deterministic HPKE
 *   seal/open round-trip vector possible.
 *
 * The type is a proper subset of {@link CryptoUtils.KeyPairAlgorithm} because
 * algorithms like RSA or the NIST curves are not recoverable from a bare seed.
 * @public
 */
export type SeedDerivableAlgorithm = 'ed25519' | 'x25519';

/**
 * Caller-supplied HKDF parameters that domain-separate one
 * {@link CryptoUtils.ICryptoProvider.wrapBytes | wrapBytes} call from another.
 * Two wraps that share recipient but differ on `salt` or `info` derive distinct
 * wrap keys, so callers should pick values that bind the wrap to its
 * application context (e.g. a content hash for `salt` and a secret name for
 * `info`).
 *
 * Both fields are required; pass an empty `Uint8Array` if the caller has no
 * value to bind on a given axis. Silent defaulting would hide protocol
 * mistakes, so the API does not pick defaults.
 * @public
 */
export interface IWrapBytesOptions {
  /**
   * HKDF salt. Domain-separates this wrap from others in different contexts.
   * Caller picks; common choices include a content hash, document id, channel
   * id, etc.
   */
  readonly salt: Uint8Array;

  /**
   * HKDF info. Further binds the derived key to a specific use within the
   * calling application. Caller picks; common choices include a secret name,
   * message type, or version tag.
   */
  readonly info: Uint8Array;
}

/**
 * Output of {@link CryptoUtils.ICryptoProvider.wrapBytes | wrapBytes}. The
 * shape is JSON-serializable so it can travel directly over the wire or be
 * persisted as-is.
 * @public
 */
export interface IWrappedBytes {
  /**
   * Sender's ephemeral ECDH P-256 public key as a JSON Web Key. The matching
   * ephemeral private key is dropped after the shared-secret derive.
   */
  readonly ephemeralPublicKey: JsonWebKey;

  /**
   * AES-GCM nonce, base64-encoded. 12 bytes (96 bits) — the standard AES-GCM
   * nonce length.
   */
  readonly nonce: string;

  /**
   * AES-GCM ciphertext concatenated with the 16-byte authentication tag,
   * base64-encoded. Tampering with either the nonce or the ciphertext causes
   * unwrap to fail GCM authentication.
   */
  readonly ciphertext: string;
}

/**
 * All valid key pair algorithms.
 * @public
 */
export const allKeyPairAlgorithms: ReadonlyArray<KeyPairAlgorithm> = [
  'ecdsa-p256',
  'rsa-oaep-2048',
  'ecdh-p256',
  'ed25519',
  'x25519'
];

/**
 * Supported key derivation functions.
 * @public
 */
export type KeyDerivationFunction = 'pbkdf2' | 'argon2id';

/**
 * PBKDF2 key derivation parameters.
 * @public
 */
export interface IPbkdf2KeyDerivationParams {
  /** Key derivation function discriminator. */
  readonly kdf: 'pbkdf2';
  /** Base64-encoded salt used for key derivation. */
  readonly salt: string;
  /** Number of iterations used for key derivation. */
  readonly iterations: number;
}

/**
 * Argon2id key derivation parameters (RFC 9106).
 * @public
 */
export interface IArgon2idKeyDerivationParams {
  /** Key derivation function discriminator. */
  readonly kdf: 'argon2id';
  /** Base64-encoded salt used for key derivation. */
  readonly salt: string;
  /** Memory cost in kibibytes. */
  readonly memoryKiB: number;
  /** Number of passes (time cost). */
  readonly iterations: number;
  /** Degree of parallelism. */
  readonly parallelism: number;
}

/**
 * Key derivation parameters stored in encrypted files.
 * Discriminated union on `kdf` field: `'pbkdf2'` or `'argon2id'`.
 * @public
 */
export type IKeyDerivationParams = IPbkdf2KeyDerivationParams | IArgon2idKeyDerivationParams;

// ============================================================================
// Argon2id Types
// ============================================================================

/**
 * Parameters for Argon2id key derivation (RFC 9106).
 * All fields are required; fgv does not pick defaults silently.
 * @public
 */
export interface IArgon2idParams {
  /**
   * Memory cost in kibibytes (KiB).
   * OWASP 2023 minimum: 19456 (19 MiB). Stronger: 65536 (64 MiB).
   * Constraint: \>= 8.
   */
  readonly memoryKiB: number;

  /**
   * Number of passes (iterations / time cost).
   * OWASP 2023 minimum: 2. Range: \>= 1.
   */
  readonly iterations: number;

  /**
   * Degree of parallelism (threads).
   * Note: WASM-based implementations compute sequentially regardless of this value,
   * but the value is wired into the algorithm and AFFECTS the output hash bytes.
   * Callers must use the same parallelism value consistently for a given secret.
   * Range: 1–255.
   */
  readonly parallelism: number;

  /**
   * Number of output bytes (hash length).
   * Typical values: 16 (128-bit), 32 (256-bit, AES-256 key), 64 (512-bit).
   * Constraint: \>= 4.
   */
  readonly outputBytes: number;
}

/**
 * Recommended OWASP 2023 minimum Argon2id parameters.
 * Suitable for recovery-row key derivation (high-entropy inputs).
 * @public
 */
export const ARGON2ID_OWASP_MIN: IArgon2idParams = {
  memoryKiB: 19456,
  iterations: 2,
  parallelism: 1,
  outputBytes: 32
} as const;

/**
 * Stronger Argon2id parameters suitable for user-typed passphrases.
 * @public
 */
export const ARGON2ID_PASSPHRASE: IArgon2idParams = {
  memoryKiB: 65536,
  iterations: 3,
  parallelism: 1,
  outputBytes: 32
} as const;

/**
 * Optional keyed-hashing inputs for {@link CryptoUtils.IArgon2idProvider.argon2id | argon2id}
 * (RFC 9106 §3.1). These are distinct from the cost parameters in
 * {@link CryptoUtils.IArgon2idParams} — they change the derived output but are
 * not tuning knobs. Both fields are optional; omitting a field (or passing an
 * empty `Uint8Array`) is a no-op that leaves the output byte-identical to a call
 * with no options at all.
 * @public
 */
export interface IArgon2idKeyingOptions {
  /**
   * Optional secret key K (RFC 9106 keyed hashing, sometimes called a "pepper").
   * When present and non-empty it is mixed into the hash so that the derived
   * output cannot be reproduced without also knowing K. Empty or omitted means
   * no secret. Honored by both the Node and browser backends.
   */
  readonly secret?: Uint8Array;

  /**
   * Optional associated data X (RFC 9106 §3.1). When present and non-empty it is
   * mixed into the hash. **Node-only:** the WASM (`hash-wasm`) browser backend
   * has no associated-data input, so `BrowserArgon2Provider` fails loudly rather
   * than silently dropping it (which would produce wrong bytes). Empty or omitted
   * means no associated data and is accepted by both backends.
   */
  readonly associatedData?: Uint8Array;
}

/**
 * Argon2id key derivation provider (RFC 9106).
 *
 * Implementations are in separate packages to avoid WASM bundle costs for
 * consumers who don't need Argon2id:
 * - Node: `@fgv/ts-extras-argon2` (`NodeArgon2Provider`)
 * - Browser: `@fgv/ts-web-extras-argon2` (`BrowserArgon2Provider`)
 *
 * @public
 */
export interface IArgon2idProvider {
  /**
   * Derives key material from a password using Argon2id (RFC 9106 §3.1).
   *
   * Returns the raw derived bytes as a `Uint8Array`. For the same inputs that
   * both backends support, the Node and browser implementations produce
   * byte-identical output. The optional `associatedData` in
   * {@link CryptoUtils.IArgon2idKeyingOptions} is the one exception: it is
   * Node-only (the browser WASM backend has no associated-data input), so a call
   * that supplies non-empty `associatedData` is not portable to the browser
   * backend. Every input the browser backend *does* support (including the
   * optional `secret`) is byte-identical across the two.
   *
   * @param password - Password or passphrase. Accepts string (UTF-8) or raw bytes.
   * @param salt - Salt bytes. Must be random and unique per credential (\>= 16 bytes recommended).
   * @param params - Argon2id parameters. Use `ARGON2ID_OWASP_MIN` as a starting point.
   * @param options - Optional {@link CryptoUtils.IArgon2idKeyingOptions | keyed-hashing inputs}
   * (secret K and/or associated data X). Omitting them (the default) leaves the
   * output byte-identical to prior behavior.
   * @returns Success with derived bytes, Failure with error context.
   */
  argon2id(
    password: Uint8Array | string,
    salt: Uint8Array,
    params: IArgon2idParams,
    options?: IArgon2idKeyingOptions
  ): Promise<Result<Uint8Array>>;
}

/**
 * Generic encrypted file format.
 * This is the JSON structure stored in encrypted files.
 * @typeParam TMetadata - Type of optional unencrypted metadata
 * @public
 */
export interface IEncryptedFile<TMetadata = JsonValue> {
  /**
   * Format identifier for versioning.
   */
  readonly format: EncryptedFileFormat;

  /**
   * Name of the secret required to decrypt (references INamedSecret.name).
   */
  readonly secretName: string;

  /**
   * Algorithm used for encryption.
   */
  readonly algorithm: EncryptionAlgorithm;

  /**
   * Base64-encoded initialization vector.
   */
  readonly iv: string;

  /**
   * Base64-encoded authentication tag (for GCM mode).
   */
  readonly authTag: string;

  /**
   * Base64-encoded encrypted data (JSON string when decrypted).
   */
  readonly encryptedData: string;

  /**
   * Optional unencrypted metadata for display/filtering.
   */
  readonly metadata?: TMetadata;

  /**
   * Optional key derivation parameters.
   * If present, allows decryption using a password with these parameters.
   * If absent, a pre-derived key must be provided.
   */
  readonly keyDerivation?: IKeyDerivationParams;
}

// ============================================================================
// Crypto Provider Interface
// ============================================================================

/**
 * Crypto provider interface for cross-platform encryption.
 * Implementations provided for Node.js (crypto module) and browser (Web Crypto API).
 * @public
 */
export interface ICryptoProvider {
  /**
   * Encrypts plaintext using AES-256-GCM.
   * @param plaintext - UTF-8 string to encrypt
   * @param key - 32-byte encryption key
   * @returns Success with encryption result, or Failure with error
   */
  encrypt(plaintext: string, key: Uint8Array): Promise<Result<IEncryptionResult>>;

  /**
   * Decrypts ciphertext using AES-256-GCM.
   * @param encryptedData - Encrypted bytes
   * @param key - 32-byte decryption key
   * @param iv - Initialization vector (12 bytes)
   * @param authTag - GCM authentication tag (16 bytes)
   * @returns Success with decrypted UTF-8 string, or Failure with error
   */
  decrypt(
    encryptedData: Uint8Array,
    key: Uint8Array,
    iv: Uint8Array,
    authTag: Uint8Array
  ): Promise<Result<string>>;

  /**
   * Encrypts raw bytes using AES-256-GCM with a **caller-supplied nonce** and
   * optional additional authenticated data (AAD).
   *
   * This is the raw-byte sibling of {@link CryptoUtils.ICryptoProvider.encrypt | encrypt}.
   * Unlike `encrypt`, it takes and returns `Uint8Array` (no UTF-8 coding), the
   * caller owns the nonce (rather than the provider generating one), and it
   * binds optional `aad` into the GCM authentication. Use it when you need to
   * bind context (e.g. an actor id, key version, or row kind) into the
   * authentication so a wrapped secret cannot be replayed across
   * users/versions/kinds, or when you manage nonces yourself.
   *
   * @remarks
   * **⚠️ NONCE UNIQUENESS IS THE CALLER'S RESPONSIBILITY AND IS CRITICAL.**
   * Because the caller supplies the nonce, this primitive cannot guarantee
   * uniqueness. Reusing a `(key, nonce)` pair for two different messages is
   * **catastrophic** for AES-GCM: it breaks confidentiality (the XOR of the two
   * plaintexts leaks) AND authentication (the GCM authentication key can be
   * recovered, letting an attacker forge tags for arbitrary messages under that
   * key). The caller MUST use a unique nonce for every message encrypted under a
   * given key — draw it from {@link CryptoUtils.ICryptoProvider.generateRandomBytes | generateRandomBytes(12)}
   * (12 random bytes has negligible collision probability well within a single
   * key's message budget) or from a strictly-increasing counter. Never hardcode
   * a nonce and never reuse one.
   *
   * @param key - 32-byte AES-256 key. Wrong lengths fail with error context.
   * @param nonce - 12-byte (96-bit) GCM nonce. MUST be unique per message under
   * `key` (see the nonce-uniqueness warning above). Wrong lengths fail with
   * error context.
   * @param plaintext - The bytes to encrypt. Empty plaintext is permitted and
   * round-trips (GCM produces a valid tag over zero-length plaintext).
   * @param aad - Optional additional authenticated data bound into the GCM tag
   * but NOT encrypted. If provided at encrypt time, the identical bytes must be
   * supplied to `decryptBytes` or decryption fails authentication. Absent means
   * no AAD.
   * @returns `Success` with the {@link CryptoUtils.IEncryptBytesResult | ciphertext and 16-byte auth tag},
   * or `Failure` with error context.
   */
  encryptBytes(
    key: Uint8Array,
    nonce: Uint8Array,
    plaintext: Uint8Array,
    aad?: Uint8Array
  ): Promise<Result<IEncryptBytesResult>>;

  /**
   * Decrypts raw bytes produced by
   * {@link CryptoUtils.ICryptoProvider.encryptBytes | encryptBytes} using
   * AES-256-GCM. The inverse of `encryptBytes`: the `ciphertext` and `authTag`
   * from an `encryptBytes` result, together with the same `key`, `nonce`, and
   * `aad`, recover the original plaintext.
   *
   * Fails (never throws) on any authentication failure: a tampered ciphertext
   * or tag, the wrong key or nonce, or an `aad` that differs from the one used
   * at encrypt time. AES-GCM authentication is fail-closed — a mismatched `aad`
   * fails exactly as a tampered ciphertext does.
   *
   * @param key - 32-byte AES-256 key (the same key used to encrypt).
   * @param nonce - 12-byte (96-bit) GCM nonce (the same nonce used to encrypt).
   * @param ciphertext - The ciphertext from the `encryptBytes` result.
   * @param authTag - The 16-byte (128-bit) GCM authentication tag from the
   * `encryptBytes` result.
   * @param aad - The identical additional authenticated data supplied at encrypt
   * time (or absent if none was supplied). A mismatch fails authentication.
   * @returns `Success` with the decrypted plaintext bytes, or `Failure` with
   * error context (including all authentication failures).
   */
  decryptBytes(
    key: Uint8Array,
    nonce: Uint8Array,
    ciphertext: Uint8Array,
    authTag: Uint8Array,
    aad?: Uint8Array
  ): Promise<Result<Uint8Array>>;

  /**
   * Generates a random 32-byte key suitable for AES-256.
   * @returns Success with generated key, or Failure with error
   */
  generateKey(): Promise<Result<Uint8Array>>;

  /**
   * Derives a key from a password using PBKDF2.
   * @param password - Password string
   * @param salt - Salt bytes (should be at least 16 bytes)
   * @param iterations - Number of iterations (recommend 100000+)
   * @returns Success with derived 32-byte key, or Failure with error
   */
  deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<Result<Uint8Array>>;

  /**
   * Computes a SHA-256 hash of the given data.
   * @param data - UTF-8 string to hash
   * @returns Success with hex-encoded hash string, or Failure with error
   */
  sha256(data: string): Promise<Result<string>>;

  // ============================================================================
  // Platform Utility Methods
  // ============================================================================

  /**
   * Generates cryptographically secure random bytes.
   * @param length - Number of bytes to generate
   * @returns Success with random bytes, or Failure with error
   */
  generateRandomBytes(length: number): Result<Uint8Array>;

  /**
   * Generates a cryptographically random UUIDv4 using the provider's
   * underlying source of randomness. The default Node and browser
   * implementations delegate to `globalThis.crypto.randomUUID`;
   * deterministic providers (e.g. test stubs) may override to produce
   * reproducible values.
   * @returns Success with a canonical UUID, or Failure with error.
   */
  generateUuid(): Result<Uuid>;

  /**
   * Encodes binary data to base64 string.
   * @param data - Binary data to encode
   * @returns Base64-encoded string
   */
  toBase64(data: Uint8Array): string;

  /**
   * Decodes base64 string to binary data.
   * @param base64 - Base64-encoded string
   * @returns Success with decoded bytes, or Failure if invalid base64
   */
  fromBase64(base64: string): Result<Uint8Array>;

  // ============================================================================
  // Asymmetric Key Operations
  // ============================================================================

  /**
   * Generates a new asymmetric keypair for the requested algorithm.
   * @param algorithm - The {@link CryptoUtils.KeyPairAlgorithm | algorithm} to use.
   * @param extractable - Whether the resulting `CryptoKey` objects may be exported.
   * Set `false` on backends that store `CryptoKey` references directly (e.g.
   * IndexedDB). Set `true` when the private key must round-trip through JWK or
   * PKCS#8 (e.g. encrypted-file backends).
   * @returns Success with the generated `CryptoKeyPair`, or Failure with error context.
   */
  generateKeyPair(algorithm: KeyPairAlgorithm, extractable: boolean): Promise<Result<CryptoKeyPair>>;

  /**
   * Derives an asymmetric keypair *deterministically* from a fixed secret seed.
   * The same `seed` always yields the same keypair on every runtime, so this is
   * the primitive to use when a keypair must be reconstructable from stored seed
   * material (key escrow, HD-style derivation, deterministic test vectors) rather
   * than freshly sampled by {@link CryptoUtils.ICryptoProvider.generateKeyPair | generateKeyPair}.
   *
   * For both `'ed25519'` and `'x25519'` the private key *is* its 32-byte seed and
   * the public key is a deterministic function of that seed (RFC 8032 / RFC 7748),
   * so the returned public key is recovered even when the caller requests a
   * non-extractable private key. The transient extractable key used internally to
   * recover the public half is never returned or logged when `extractable` is
   * `false`. The returned keys carry the algorithm's usages: `'ed25519'` →
   * private `'sign'` / public `'verify'`; `'x25519'` → private `'deriveBits'` /
   * public no-usage (ready to hand to {@link CryptoUtils.HpkeProvider}).
   * @param algorithm - The {@link CryptoUtils.SeedDerivableAlgorithm | seed-derivable algorithm}
   * (`'ed25519'` or `'x25519'`); any other value fails loudly with context.
   * @param seed - The secret seed. It must be exactly 32 bytes for both supported
   * algorithms; any other length fails loudly, before any WebCrypto call. The
   * bytes are copied, not retained or mutated.
   * @param extractable - Whether the returned private key may be exported. The
   * returned public key is identical for a given seed regardless of this flag.
   * @returns Success with the derived `CryptoKeyPair`, or Failure with error context.
   */
  importKeyPairFromSeed(
    algorithm: SeedDerivableAlgorithm,
    seed: Uint8Array,
    extractable: boolean
  ): Promise<Result<CryptoKeyPair>>;

  /**
   * Exports the public half of a keypair as a JSON Web Key.
   * @param publicKey - The public `CryptoKey` to export. Must be an `extractable`
   * key generated for an asymmetric algorithm.
   * @returns Success with the JWK, or Failure with error context.
   */
  exportPublicKeyJwk(publicKey: CryptoKey): Promise<Result<JsonWebKey>>;

  /**
   * Re-imports a public-key JWK as a `CryptoKey` usable for verification or
   * encryption (depending on algorithm).
   * @param jwk - The JSON Web Key produced by {@link CryptoUtils.ICryptoProvider.exportPublicKeyJwk | exportPublicKeyJwk}.
   * @param algorithm - The {@link CryptoUtils.KeyPairAlgorithm | algorithm} the
   * key was generated for. Determines the import parameters and key usages.
   * @returns Success with the imported public `CryptoKey`, or Failure with error context.
   */
  importPublicKeyJwk(jwk: JsonWebKey, algorithm: KeyPairAlgorithm): Promise<Result<CryptoKey>>;

  /**
   * Exports a public `CryptoKey` as a DER-encoded SPKI (SubjectPublicKeyInfo) blob.
   * SPKI is the standard algorithm-agnostic format for public key storage and transport.
   * @param publicKey - The `CryptoKey` to export. Must have `key.type === 'public'`.
   * @returns `Success` with the raw SPKI bytes, or `Failure` with error context.
   */
  exportPublicKeySpki(publicKey: CryptoKey): Promise<Result<Uint8Array>>;

  /**
   * Imports a public key from a DER-encoded SPKI blob.
   * @param spkiBytes - The raw SPKI bytes produced by {@link CryptoUtils.ICryptoProvider.exportPublicKeySpki | exportPublicKeySpki}.
   * @param algorithm - The {@link CryptoUtils.KeyPairAlgorithm | algorithm} the key was generated for.
   * @returns `Success` with the imported public `CryptoKey`, or `Failure` with error context.
   */
  importPublicKeySpki(spkiBytes: Uint8Array, algorithm: KeyPairAlgorithm): Promise<Result<CryptoKey>>;

  /**
   * Wraps `plaintext` for delivery to the holder of the private key paired
   * with `recipientPublicKey`. Uses ECIES with ECDH P-256, HKDF-SHA256, and
   * AES-GCM-256.
   *
   * Generates a fresh ephemeral keypair per call; the ephemeral private key
   * is discarded after the shared-secret derive. Only the recipient (with the
   * matching private key) and the same HKDF parameters can recover
   * `plaintext`.
   *
   * Empty `plaintext` is permitted; the resulting wrap contains only the
   * 16-byte GCM authentication tag and round-trips back to an empty
   * `Uint8Array`.
   * @param plaintext - The bytes to wrap. Any length supported by AES-GCM
   * (in practice, well below 2^39 - 256 bits).
   * @param recipientPublicKey - The recipient's ECDH P-256 public `CryptoKey`.
   * Must have algorithm name `'ECDH'` and named curve `'P-256'`; mismatched
   * algorithm or curve yields a `Failure` with error context.
   * @param options - HKDF parameters; see {@link CryptoUtils.IWrapBytesOptions | IWrapBytesOptions}.
   * @returns `Success` with the wrapped payload, or `Failure` with error context.
   */
  wrapBytes(
    plaintext: Uint8Array,
    recipientPublicKey: CryptoKey,
    options: IWrapBytesOptions
  ): Promise<Result<IWrappedBytes>>;

  /**
   * Inverse of {@link CryptoUtils.ICryptoProvider.wrapBytes | wrapBytes}.
   * Recovers the original `plaintext` from a wrapped payload using the
   * recipient's private key.
   *
   * Returns a `Failure` (never throws) on any of:
   * - Tampered nonce or ciphertext (AES-GCM authentication fails)
   * - Wrong private key (different shared secret derives a different wrap key)
   * - Wrong HKDF parameters (different wrap key)
   * - Malformed `ephemeralPublicKey` JWK
   * - Malformed base64 in `nonce` or `ciphertext`
   * @param wrapped - The wrapped payload produced by `wrapBytes`.
   * @param recipientPrivateKey - The recipient's ECDH P-256 private
   * `CryptoKey`. Must have algorithm name `'ECDH'` and named curve `'P-256'`,
   * and key usages including `'deriveKey'` or `'deriveBits'`.
   * @param options - The same HKDF parameters used at wrap time.
   * @returns `Success` with the original `plaintext`, or `Failure` with error context.
   */
  unwrapBytes(
    wrapped: IWrappedBytes,
    recipientPrivateKey: CryptoKey,
    options: IWrapBytesOptions
  ): Promise<Result<Uint8Array>>;

  // ============================================================================
  // Signing Operations
  // ============================================================================

  /**
   * Signs `data` with `privateKey` using the algorithm inferred from the key.
   * Delegates to `crypto.subtle.sign`; the algorithm is derived from
   * `privateKey.algorithm.name` — ECDSA keys are augmented with
   * `hash: 'SHA-256'` at sign time (the hash is not stored in the key);
   * all other algorithm names are passed through as-is.
   * Intended for Ed25519 and ECDSA-P256 asymmetric private keys; for
   * HMAC-SHA256 authentication codes use {@link ICryptoProvider.hmacSha256} instead.
   * @param privateKey - A `CryptoKey` with `'sign'` usage (e.g. generated by
   * {@link CryptoUtils.ICryptoProvider.generateKeyPair | generateKeyPair} with
   * `'ecdsa-p256'` or `'ed25519'`).
   * @param data - The bytes to sign.
   * @returns `Success` with the raw signature bytes, or `Failure` with error context.
   */
  sign(privateKey: CryptoKey, data: Uint8Array): Promise<Result<Uint8Array>>;

  /**
   * Verifies a signature produced by {@link ICryptoProvider.sign}.
   * Delegates to `crypto.subtle.verify`; the algorithm is derived from
   * `publicKey.algorithm.name` — ECDSA keys are augmented with
   * `hash: 'SHA-256'`; all other algorithm names are passed through as-is.
   * Intended for Ed25519 and ECDSA-P256 asymmetric public keys; for
   * HMAC-SHA256 verification use {@link ICryptoProvider.verifyHmacSha256} instead.
   * @param publicKey - A `CryptoKey` with `'verify'` usage (e.g. the public
   * half of a keypair generated by
   * {@link CryptoUtils.ICryptoProvider.generateKeyPair | generateKeyPair} with
   * `'ecdsa-p256'` or `'ed25519'`).
   * @param signature - The raw signature bytes produced by `sign`.
   * @param data - The original data that was signed.
   * @returns `Success` with `true` if the signature is valid, `false` if it is
   * not, or `Failure` with error context if the operation itself failed.
   */
  verify(publicKey: CryptoKey, signature: Uint8Array, data: Uint8Array): Promise<Result<boolean>>;

  /**
   * Compares two byte arrays in constant time.
   *
   * The comparison visits all bytes of `a` and `b` regardless of where they
   * diverge, accumulating XOR differences with bitwise-OR. No early-return is
   * possible once the length check passes, making timing independent of the
   * byte values. This prevents timing side-channels when comparing MAC outputs,
   * signed-token bytes, or any secret-derived byte sequences.
   *
   * Returns `false` immediately (before the loop) when `a.length !== b.length`;
   * the length mismatch itself is not secret in normal use.
   * @param a - First byte array.
   * @param b - Second byte array.
   * @returns `true` if the arrays have the same length and identical contents,
   * `false` otherwise.
   */
  timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;

  /**
   * Computes an HMAC-SHA256 authentication code for `data` using `key`.
   *
   * The key must be a `CryptoKey` with `'sign'` usage and algorithm name
   * `'HMAC'` (e.g. derived via PBKDF2 or imported with
   * `crypto.subtle.importKey`). Use {@link ICryptoProvider.verifyHmacSha256}
   * for constant-time verification of the output.
   * @param key - An HMAC `CryptoKey` with `'sign'` usage.
   * @param data - The bytes to authenticate.
   * @returns `Success` with the 32-byte MAC, or `Failure` with error context.
   */
  hmacSha256(key: CryptoKey, data: Uint8Array): Promise<Result<Uint8Array>>;

  /**
   * Verifies an HMAC-SHA256 authentication code in constant time.
   *
   * Computes the expected MAC over `data` with `key`, then compares it to
   * `signature` using {@link ICryptoProvider.timingSafeEqual} so that
   * mismatches do not leak information through timing.
   * @param key - An HMAC `CryptoKey` with `'sign'` usage.
   * @param signature - The MAC bytes to verify (typically 32 bytes).
   * @param data - The original data that was authenticated.
   * @returns `Success` with `true` if the MAC is valid, `false` if it is not,
   * or `Failure` with error context if the MAC computation itself failed.
   */
  verifyHmacSha256(key: CryptoKey, signature: Uint8Array, data: Uint8Array): Promise<Result<boolean>>;
}

// ============================================================================
// Encryption Provider Interface
// ============================================================================

/**
 * High-level interface for encrypting JSON content by secret name.
 *
 * This abstraction unifies two common encryption workflows:
 * - **KeyStore**: looks up the named secret and crypto provider from the vault
 * - **DirectEncryptionProvider**: uses a pre-supplied key and crypto provider,
 *   optionally bound to a specific secret name for safety
 *
 * Callers that need to encrypt (e.g. `EditableCollection.save()`) depend on
 * this interface rather than on `KeyStore` directly, allowing mix-and-match.
 *
 * @public
 */
export interface IEncryptionProvider {
  /**
   * Encrypts JSON content under a named secret.
   *
   * @param secretName - Name of the secret to encrypt with
   * @param content - JSON-safe content to encrypt
   * @param metadata - Optional unencrypted metadata to include in the encrypted file
   * @returns Success with encrypted file structure, or Failure with error context
   */
  encryptByName<TMetadata = JsonValue>(
    secretName: string,
    content: JsonValue,
    metadata?: TMetadata
  ): Promise<Result<IEncryptedFile<TMetadata>>>;
}

// ============================================================================
// Encryption Configuration
// ============================================================================

/**
 * Behavior when an encrypted file cannot be decrypted.
 * @public
 */
export type EncryptedFileErrorMode =
  | 'fail' // Return failure, abort loading
  | 'skip' // Skip file silently, continue loading others
  | 'warn'; // Log warning, skip file, continue loading

/**
 * Function type for dynamic secret retrieval.
 * @public
 */
export type SecretProvider = (secretName: string) => Promise<Result<Uint8Array>>;

/**
 * Configuration for encrypted file handling during loading.
 * @public
 */
export interface IEncryptionConfig {
  /**
   * Named secrets available for decryption.
   */
  readonly secrets?: ReadonlyArray<INamedSecret>;

  /**
   * Alternative: dynamic secret provider function.
   * Called when a secret is not found in the secrets array.
   */
  readonly secretProvider?: SecretProvider;

  /**
   * Crypto provider implementation (Node.js or browser).
   */
  readonly cryptoProvider: ICryptoProvider;

  /**
   * Behavior when decryption key is missing (default: 'fail').
   */
  readonly onMissingKey?: EncryptedFileErrorMode;

  /**
   * Behavior when decryption fails (default: 'fail').
   */
  readonly onDecryptionError?: EncryptedFileErrorMode;
}

// ============================================================================
// Detection Helper
// ============================================================================

/**
 * Checks if a JSON object appears to be an encrypted file.
 * Uses the format field as a discriminator.
 * @param json - JSON object to check
 * @returns true if the object has the encrypted file format field
 * @public
 */
export function isEncryptedFile(json: unknown): boolean {
  if (typeof json !== 'object' || json === null) {
    return false;
  }
  const obj = json as Record<string, unknown>;
  return obj.format === Constants.ENCRYPTED_FILE_FORMAT;
}
