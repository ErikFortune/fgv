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

import {
  EncryptionAlgorithm,
  ICryptoProvider,
  IArgon2idParams,
  IKeyDerivationParams,
  IPbkdf2KeyDerivationParams,
  KeyPairAlgorithm
} from '../model';
import { IPrivateKeyStorage } from './privateKeyStorage';

// Re-export so consumers can continue to access the algorithm enum via the
// CryptoUtils.KeyStore namespace alongside the rest of the keystore types.
export { allKeyPairAlgorithms, KeyPairAlgorithm } from '../model';

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
 * Discriminator for symmetric secret types stored in the vault.
 * - `'encryption-key'`: A 32-byte AES-256 encryption key.
 * - `'api-key'`: An arbitrary-length API key string (UTF-8 encoded).
 * @public
 */
export type KeyStoreSymmetricSecretType = 'encryption-key' | 'api-key';

/**
 * All valid symmetric secret types.
 * @public
 */
export const allKeyStoreSymmetricSecretTypes: ReadonlyArray<KeyStoreSymmetricSecretType> = [
  'encryption-key',
  'api-key'
];

/**
 * Discriminator for asymmetric secret types stored in the vault.
 * - `'asymmetric-keypair'`: A public/private key pair. The public key is held in
 *   the vault as a JWK; the private key lives in the supplied
 *   {@link CryptoUtils.KeyStore.IPrivateKeyStorage} provider.
 * @public
 */
export type KeyStoreAsymmetricSecretType = 'asymmetric-keypair';

/**
 * All valid asymmetric secret types.
 * @public
 */
export const allKeyStoreAsymmetricSecretTypes: ReadonlyArray<KeyStoreAsymmetricSecretType> = [
  'asymmetric-keypair'
];

/**
 * Discriminator for any secret type stored in the vault.
 * @public
 */
export type KeyStoreSecretType = KeyStoreSymmetricSecretType | KeyStoreAsymmetricSecretType;

/**
 * All valid key store secret types.
 * @public
 */
export const allKeyStoreSecretTypes: ReadonlyArray<KeyStoreSecretType> = [
  ...allKeyStoreAsymmetricSecretTypes,
  ...allKeyStoreSymmetricSecretTypes
];

/**
 * A symmetric secret entry stored in the vault (in-memory representation).
 * Holds the raw key material directly — for `'encryption-key'` it is a 32-byte
 * AES-256 key; for `'api-key'` it is the UTF-8 encoded API key string.
 * @public
 */
export interface IKeyStoreSymmetricEntry {
  /**
   * Unique name for this secret (used as lookup key).
   */
  readonly name: string;

  /**
   * Symmetric secret type discriminator.
   */
  readonly type: KeyStoreSymmetricSecretType;

  /**
   * The secret data.
   * - For `'encryption-key'`: 32-byte AES-256 key.
   * - For `'api-key'`: UTF-8 encoded API key string (arbitrary length).
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
 * An asymmetric keypair entry stored in the vault (in-memory representation).
 * Holds only the public key (as a JWK) and a stable handle (`id`) the
 * {@link CryptoUtils.KeyStore.IPrivateKeyStorage} provider uses to fetch the private key.
 * @public
 */
export interface IKeyStoreAsymmetricEntry {
  /**
   * Unique name for this entry (used as vault lookup key, renameable).
   */
  readonly name: string;

  /**
   * Asymmetric secret type discriminator.
   */
  readonly type: KeyStoreAsymmetricSecretType;

  /**
   * Immutable handle used by {@link CryptoUtils.KeyStore.IPrivateKeyStorage} to address the
   * private key. Independent of `name`; survives renames.
   */
  readonly id: string;

  /**
   * Algorithm used to generate this keypair.
   */
  readonly algorithm: KeyPairAlgorithm;

  /**
   * The public key as a JSON Web Key.
   */
  readonly publicKeyJwk: JsonWebKey;

  /**
   * Optional description for this entry.
   */
  readonly description?: string;

  /**
   * When this entry was added (ISO 8601).
   */
  readonly createdAt: string;
}

/**
 * Any vault entry, discriminated by `type`.
 * @public
 */
export type IKeyStoreEntry = IKeyStoreSymmetricEntry | IKeyStoreAsymmetricEntry;

/**
 * Backwards-compatible alias for {@link CryptoUtils.KeyStore.IKeyStoreSymmetricEntry}.
 * @deprecated Use {@link CryptoUtils.KeyStore.IKeyStoreSymmetricEntry} for symmetric
 * entries or {@link CryptoUtils.KeyStore.IKeyStoreEntry} for the discriminated union.
 * @public
 */
export type IKeyStoreSecretEntry = IKeyStoreSymmetricEntry;

/**
 * JSON-serializable representation of a symmetric secret entry.
 *
 * @remarks
 * Describes the *normalized* shape after parsing. `type` is required here
 * because the converter (see
 * {@link CryptoUtils.KeyStore.Converters.keystoreSymmetricEntryJson | keystoreSymmetricEntryJson})
 * injects the default `'encryption-key'` when reading vaults written before
 * asymmetric-keypair support added the discriminator. Raw on-wire bytes from
 * a legacy vault may therefore omit `type`; downstream code only ever sees
 * the post-conversion shape declared here.
 *
 * @public
 */
export interface IKeyStoreSymmetricEntryJson {
  /**
   * Unique name for this secret.
   */
  readonly name: string;

  /**
   * Symmetric secret type discriminator.
   *
   * Required on this normalized model type. Vaults written prior to the
   * asymmetric-keypair support may omit this field on the wire; the
   * converter injects `'encryption-key'` when missing for backwards
   * compatibility, so by the time a value of this type is observed the
   * discriminator is always present.
   */
  readonly type: KeyStoreSymmetricSecretType;

  /**
   * Base64-encoded secret data.
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
 * JSON-serializable representation of an asymmetric keypair entry.
 * The private key is not present here — it lives in the
 * {@link CryptoUtils.KeyStore.IPrivateKeyStorage} provider, addressed by `id`.
 * @public
 */
export interface IKeyStoreAsymmetricEntryJson {
  /**
   * Unique name for this entry.
   */
  readonly name: string;

  /**
   * Asymmetric secret type discriminator.
   */
  readonly type: KeyStoreAsymmetricSecretType;

  /**
   * Immutable handle used by {@link CryptoUtils.KeyStore.IPrivateKeyStorage} to address the
   * private key.
   */
  readonly id: string;

  /**
   * Algorithm used to generate this keypair.
   */
  readonly algorithm: KeyPairAlgorithm;

  /**
   * The public key as a JSON Web Key.
   */
  readonly publicKeyJwk: JsonWebKey;

  /**
   * Optional description.
   */
  readonly description?: string;

  /**
   * When this entry was added (ISO 8601).
   */
  readonly createdAt: string;
}

/**
 * Any JSON vault entry, discriminated by `type`.
 * @public
 */
export type IKeyStoreEntryJson = IKeyStoreSymmetricEntryJson | IKeyStoreAsymmetricEntryJson;

/**
 * Backwards-compatible alias for {@link CryptoUtils.KeyStore.IKeyStoreSymmetricEntryJson}.
 * @deprecated Use {@link CryptoUtils.KeyStore.IKeyStoreSymmetricEntryJson} for
 * symmetric entries or {@link CryptoUtils.KeyStore.IKeyStoreEntryJson} for the
 * discriminated union.
 * @public
 */
export type IKeyStoreSecretEntryJson = IKeyStoreSymmetricEntryJson;

/**
 * The decrypted vault contents - a versioned map of entries.
 * @public
 */
export interface IKeyStoreVaultContents {
  /**
   * Format version for vault contents.
   */
  readonly version: KeyStoreFormat;

  /**
   * Map of entry name to entry (symmetric or asymmetric).
   */
  readonly secrets: Record<string, IKeyStoreEntryJson>;
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
   * Key derivation parameters for the vault master key (always PBKDF2).
   */
  readonly keyDerivation: IPbkdf2KeyDerivationParams;
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

  /**
   * Optional private-key storage backend. Required to use `addKeyPair` /
   * `getKeyPair`; absent backends still permit opening, listing, and reading
   * public-key metadata for asymmetric entries.
   */
  readonly privateKeyStorage?: IPrivateKeyStorage;
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

  /**
   * Optional private-key storage backend. Required to use `addKeyPair` /
   * `getKeyPair`; absent backends still permit opening, listing, and reading
   * public-key metadata for asymmetric entries.
   */
  readonly privateKeyStorage?: IPrivateKeyStorage;
}

/**
 * Result of adding a secret to the key store.
 * @public
 */
export interface IAddSecretResult {
  /**
   * The secret entry that was added.
   */
  readonly entry: IKeyStoreSymmetricEntry;

  /**
   * Whether this replaced an existing secret.
   */
  readonly replaced: boolean;

  /**
   * Best-effort warning from displaced-resource cleanup. Set when this call
   * replaced an asymmetric-keypair entry but the corresponding
   * {@link CryptoUtils.KeyStore.IPrivateKeyStorage}.delete failed; the new
   * entry is still committed and the orphaned blob is left for consumer-side
   * GC to reconcile.
   */
  readonly warning?: string;
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
 * Options for importing raw key material via {@link KeyStore.importSecret}.
 * Extends {@link IImportSecretOptions} with a type classification.
 * @public
 */
export interface IImportKeyOptions extends IImportSecretOptions {
  /**
   * Symmetric secret type classification for the imported key material.
   * @defaultValue 'encryption-key'
   */
  readonly type?: KeyStoreSymmetricSecretType;
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

/**
 * Options for adding an Argon2id password-derived secret.
 * @public
 */
export interface IAddSecretFromPasswordArgon2idOptions {
  /**
   * Argon2id parameters. Defaults to {@link CryptoUtils.ARGON2ID_OWASP_MIN}.
   */
  readonly params?: IArgon2idParams;
  /**
   * Optional description for the secret.
   */
  readonly description?: string;
  /**
   * Whether to replace an existing secret with the same name.
   */
  readonly replace?: boolean;
}

/**
 * Options for adding an asymmetric keypair to the key store.
 * @public
 */
export interface IAddKeyPairOptions {
  /**
   * Algorithm to use for the new keypair.
   */
  readonly algorithm: KeyPairAlgorithm;

  /**
   * Optional description for the entry.
   */
  readonly description?: string;

  /**
   * Whether to replace an existing entry with the same name.
   * Replacement mints a fresh storage `id` and best-effort deletes the
   * displaced storage blob; see the keystore design doc for details.
   */
  readonly replace?: boolean;
}

/**
 * Result of adding an asymmetric keypair to the key store.
 * @public
 */
export interface IAddKeyPairResult {
  /**
   * The asymmetric entry that was added.
   */
  readonly entry: IKeyStoreAsymmetricEntry;

  /**
   * Whether this replaced an existing entry.
   */
  readonly replaced: boolean;

  /**
   * Best-effort warning from displaced-resource cleanup. Set when this call
   * replaced a prior entry but the corresponding
   * {@link CryptoUtils.KeyStore.IPrivateKeyStorage}.delete failed; the new
   * keypair is still committed and the orphaned blob is left for consumer-side
   * GC to reconcile.
   */
  readonly warning?: string;
}

/**
 * Result of removing a secret from the key store.
 * @public
 */
export interface IRemoveSecretResult {
  /**
   * The secret entry that was removed from the vault.
   */
  readonly entry: IKeyStoreEntry;

  /**
   * Best-effort warning from {@link CryptoUtils.KeyStore.IPrivateKeyStorage}.delete
   * for asymmetric entries when the storage call failed. The vault entry is
   * still considered removed and the orphaned blob is left for consumer-side
   * GC to reconcile.
   */
  readonly warning?: string;
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
