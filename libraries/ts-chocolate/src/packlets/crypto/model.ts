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

import { Result } from '@fgv/ts-utils';

// ============================================================================
// Encryption Types
// ============================================================================

/**
 * Supported encryption algorithms.
 * @public
 */
export type EncryptionAlgorithm = 'AES-256-GCM';

/**
 * Format version for encrypted collection files.
 * @public
 */
export type EncryptedCollectionFormat = 'encrypted-collection-v1';

/**
 * Named secret for collection encryption/decryption.
 * @public
 */
export interface INamedSecret {
  /**
   * Unique name for this secret (referenced in tombstone files).
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
 * Optional unencrypted metadata for encrypted collection files.
 * Allows filtering/display without decryption.
 * @public
 */
export interface IEncryptedCollectionMetadata {
  /**
   * Collection ID (unencrypted for filtering/display).
   */
  readonly collectionId?: string;

  /**
   * Human-readable description.
   */
  readonly description?: string;

  /**
   * Number of items in the collection.
   */
  readonly itemCount?: number;
}

/**
 * Encrypted collection tombstone file format.
 * This is the JSON structure stored in encrypted collection files.
 * @public
 */
export interface IEncryptedCollectionFile {
  /**
   * Format identifier for versioning.
   */
  readonly format: EncryptedCollectionFormat;

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
   * Base64-encoded encrypted collection data (JSON string when decrypted).
   */
  readonly encryptedData: string;

  /**
   * Optional unencrypted metadata for display/filtering.
   */
  readonly metadata?: IEncryptedCollectionMetadata;
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
}

// ============================================================================
// Encryption Configuration
// ============================================================================

/**
 * Behavior when an encrypted collection cannot be decrypted.
 * @public
 */
export type EncryptedCollectionErrorMode =
  | 'fail' // Return failure, abort loading
  | 'skip' // Skip collection silently, continue loading others
  | 'warn'; // Log warning, skip collection, continue loading

/**
 * Function type for dynamic secret retrieval.
 * @public
 */
export type SecretProvider = (secretName: string) => Promise<Result<Uint8Array>>;

/**
 * Configuration for encrypted collection handling during loading.
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
  readonly onMissingKey?: EncryptedCollectionErrorMode;

  /**
   * Behavior when decryption fails (default: 'fail').
   */
  readonly onDecryptionError?: EncryptedCollectionErrorMode;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Current format version for encrypted collection files.
 * @public
 */
export const ENCRYPTED_COLLECTION_FORMAT: EncryptedCollectionFormat = 'encrypted-collection-v1';

/**
 * Default encryption algorithm.
 * @public
 */
export const DEFAULT_ALGORITHM: EncryptionAlgorithm = 'AES-256-GCM';

/**
 * Key size in bytes for AES-256.
 * @public
 */
export const AES_256_KEY_SIZE: number = 32;

/**
 * IV size in bytes for GCM mode.
 * @public
 */
export const GCM_IV_SIZE: number = 12;

/**
 * Auth tag size in bytes for GCM mode.
 * @public
 */
export const GCM_AUTH_TAG_SIZE: number = 16;
