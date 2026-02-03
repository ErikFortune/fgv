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
