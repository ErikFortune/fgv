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

import { EncryptionAlgorithm, ICryptoProvider, IKeyDerivationParams } from '../model';

// ============================================================================
// Key Store Format Types
// ============================================================================

/**
 * Format version for key store files.
 * @public
 */
export type KeyStoreFormat = 'keystore-v1';

/**
 * Current format version constant.
 * @public
 */
export const KEYSTORE_FORMAT: KeyStoreFormat = 'keystore-v1';

/**
 * Default PBKDF2 iterations for key store encryption.
 * Higher than regular files since this protects the master key vault.
 * @public
 */
export const DEFAULT_KEYSTORE_ITERATIONS: number = 600000;

/**
 * Minimum salt length for key derivation.
 * @public
 */
export const MIN_SALT_LENGTH: number = 16;

// ============================================================================
// Key Store Vault Contents (Decrypted State)
// ============================================================================

/**
 * A secret entry stored in the vault (in-memory representation).
 * @public
 */
export interface IKeyStoreSecretEntry {
  /**
   * Unique name for this secret (used as lookup key).
   */
  readonly name: string;

  /**
   * The 32-byte AES-256 key.
   */
  readonly key: Uint8Array;

  /**
   * Optional description for this secret.
   */
  readonly description?: string;

  /**
   * When this secret was added (ISO 8601).
   */
  readonly createdAt: string;
}

/**
 * JSON-serializable version of secret entry (for storage).
 * @public
 */
export interface IKeyStoreSecretEntryJson {
  /**
   * Unique name for this secret.
   */
  readonly name: string;

  /**
   * Base64-encoded 32-byte key.
   */
  readonly key: string;

  /**
   * Optional description.
   */
  readonly description?: string;

  /**
   * When this secret was added (ISO 8601).
   */
  readonly createdAt: string;
}

/**
 * The decrypted vault contents - a versioned map of secrets.
 * @public
 */
export interface IKeyStoreVaultContents {
  /**
   * Format version for vault contents.
   */
  readonly version: KeyStoreFormat;

  /**
   * Map of secret name to secret entry.
   */
  readonly secrets: Record<string, IKeyStoreSecretEntryJson>;
}

// ============================================================================
// Key Store File Format (Encrypted State)
// ============================================================================

/**
 * The encrypted key store file format.
 * @public
 */
export interface IKeyStoreFile {
  /**
   * Format identifier.
   */
  readonly format: KeyStoreFormat;

  /**
   * Algorithm used for encryption.
   */
  readonly algorithm: EncryptionAlgorithm;

  /**
   * Base64-encoded initialization vector.
   */
  readonly iv: string;

  /**
   * Base64-encoded authentication tag.
   */
  readonly authTag: string;

  /**
   * Base64-encoded encrypted vault contents.
   */
  readonly encryptedData: string;

  /**
   * Key derivation parameters (required for key store - always password-derived).
   */
  readonly keyDerivation: IKeyDerivationParams;
}

// ============================================================================
// Key Store State and Configuration
// ============================================================================

/**
 * Key store lock state.
 * @public
 */
export type KeyStoreLockState = 'locked' | 'unlocked';

/**
 * Parameters for creating a new key store.
 * @public
 */
export interface IKeyStoreCreateParams {
  /**
   * Crypto provider to use.
   */
  readonly cryptoProvider: ICryptoProvider;

  /**
   * PBKDF2 iterations (defaults to DEFAULT_KEYSTORE_ITERATIONS).
   */
  readonly iterations?: number;
}

/**
 * Parameters for opening an existing key store.
 * @public
 */
export interface IKeyStoreOpenParams {
  /**
   * Crypto provider to use.
   */
  readonly cryptoProvider: ICryptoProvider;

  /**
   * The encrypted key store file content.
   */
  readonly keystoreFile: IKeyStoreFile;
}

/**
 * Result of adding a secret to the key store.
 * @public
 */
export interface IAddSecretResult {
  /**
   * The secret entry that was added.
   */
  readonly entry: IKeyStoreSecretEntry;

  /**
   * Whether this replaced an existing secret.
   */
  readonly replaced: boolean;
}

/**
 * Options for adding a secret.
 * @public
 */
export interface IAddSecretOptions {
  /**
   * Optional description for the secret.
   */
  readonly description?: string;
}

/**
 * Options for importing a secret.
 * @public
 */
export interface IImportSecretOptions extends IAddSecretOptions {
  /**
   * Whether to replace an existing secret with the same name.
   */
  readonly replace?: boolean;
}

/**
 * Options for adding a secret derived from a password.
 * @public
 */
export interface IAddSecretFromPasswordOptions extends IAddSecretOptions {
  /**
   * Whether to replace an existing secret with the same name.
   */
  readonly replace?: boolean;

  /**
   * PBKDF2 iterations for key derivation.
   * @defaultValue DEFAULT_SECRET_ITERATIONS (350000)
   */
  readonly iterations?: number;
}

/**
 * Default PBKDF2 iterations for secret-level key derivation.
 * Lower than keystore encryption since these are used more frequently.
 * @public
 */
export const DEFAULT_SECRET_ITERATIONS: number = 350000;

/**
 * Result of adding a password-derived secret.
 * Extends {@link IAddSecretResult} with key derivation parameters
 * needed to store alongside encrypted files.
 * @public
 */
export interface IAddSecretFromPasswordResult extends IAddSecretResult {
  /**
   * Key derivation parameters used to derive the secret key.
   * Store these in encrypted file metadata so the password alone
   * can re-derive the same key for decryption.
   */
  readonly keyDerivation: IKeyDerivationParams;
}

// ============================================================================
// Detection Helper
// ============================================================================

/**
 * Checks if a JSON object appears to be a key store file.
 * Uses the format field as a discriminator.
 * @param json - JSON object to check
 * @returns true if the object has the key store format field
 * @public
 */
export function isKeyStoreFile(json: unknown): boolean {
  if (typeof json !== 'object' || json === null) {
    return false;
  }
  const obj = json as Record<string, unknown>;
  return obj.format === KEYSTORE_FORMAT;
}
