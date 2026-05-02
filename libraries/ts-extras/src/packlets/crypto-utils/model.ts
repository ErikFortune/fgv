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
import { Result } from '@fgv/ts-utils';

import * as Constants from './constants';
export { Constants };

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
 * @public
 */
export type KeyPairAlgorithm = 'ecdsa-p256' | 'rsa-oaep-2048' | 'ecdh-p256' | 'ed25519';

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
  'ed25519'
];

/**
 * Supported key derivation functions.
 * @public
 */
export type KeyDerivationFunction = 'pbkdf2';

/**
 * Key derivation parameters stored in encrypted files.
 * Allows decryption with password without needing to know the original salt/iterations.
 * @public
 */
export interface IKeyDerivationParams {
  /**
   * Key derivation function used.
   */
  readonly kdf: KeyDerivationFunction;

  /**
   * Base64-encoded salt used for key derivation.
   */
  readonly salt: string;

  /**
   * Number of iterations used for key derivation.
   */
  readonly iterations: number;
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
