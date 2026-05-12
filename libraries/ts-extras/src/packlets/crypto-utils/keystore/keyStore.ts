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

import { JsonValue } from '@fgv/ts-json-base';
import { captureResult, fail, Result, succeed } from '@fgv/ts-utils';
import * as Constants from '../constants';
import { createEncryptedFile } from '../encryptedFile';
import {
  ICryptoProvider,
  IEncryptedFile,
  IEncryptionConfig,
  IEncryptionProvider,
  IArgon2idKeyDerivationParams,
  IArgon2idProvider,
  IArgon2idParams,
  IKeyDerivationParams,
  ARGON2ID_OWASP_MIN,
  SecretProvider
} from '../model';
import {
  DEFAULT_KEYSTORE_ITERATIONS,
  DEFAULT_SECRET_ITERATIONS,
  IAddKeyPairOptions,
  IAddKeyPairResult,
  IAddSecretFromPasswordArgon2idOptions,
  IAddSecretFromPasswordOptions,
  IAddSecretFromPasswordResult,
  IAddSecretOptions,
  IAddSecretResult,
  IImportKeyOptions,
  IImportSecretOptions,
  IKeyStoreAsymmetricEntry,
  IKeyStoreCreateParams,
  IKeyStoreEntry,
  IKeyStoreEntryJson,
  IKeyStoreFile,
  IKeyStoreOpenParams,
  IKeyStoreSymmetricEntry,
  IKeyStoreVaultContents,
  IRemoveSecretResult,
  KEYSTORE_FORMAT,
  KeyStoreLockState,
  KeyStoreSecretType,
  MIN_SALT_LENGTH
} from './model';
import { IPrivateKeyStorage } from './privateKeyStorage';
import { keystoreFile, keystoreVaultContents } from './converters';

/**
 * Gets the current ISO timestamp.
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// ============================================================================
// KeyStore Class
// ============================================================================

/**
 * Password-protected key store for managing encryption secrets.
 *
 * The KeyStore provides a secure vault for storing named encryption keys.
 * The vault is encrypted at rest using a master password via PBKDF2 key derivation.
 *
 * @example
 * ```typescript
 * // Create new key store
 * const keystore = KeyStore.create({ cryptoProvider: nodeCryptoProvider }).orThrow();
 * await keystore.initialize('master-password');
 *
 * // Add secrets
 * await keystore.addSecret('my-key', { description: 'Production key' });
 *
 * // Save to file
 * const fileContent = await keystore.save();
 *
 * // Later: Open existing key store
 * const keystore2 = KeyStore.open({
 *   cryptoProvider: nodeCryptoProvider,
 *   keystoreFile: fileContent.value
 * }).orThrow();
 * await keystore2.unlock('master-password');
 *
 * // Use as secret provider for encrypted file loading
 * const encryptionConfig = keystore2.getEncryptionConfig().orThrow();
 * ```
 *
 * @public
 */
export class KeyStore implements IEncryptionProvider {
  private readonly _cryptoProvider: ICryptoProvider;
  private readonly _privateKeyStorage: IPrivateKeyStorage | undefined;
  private readonly _iterations: number;
  private _keystoreFile: IKeyStoreFile | undefined;
  private _salt: Uint8Array | undefined;
  private _secrets: Map<string, IKeyStoreEntry> | undefined;
  private _state: KeyStoreLockState;
  private _dirty: boolean;
  private _isNew: boolean;

  private constructor(
    cryptoProvider: ICryptoProvider,
    iterations: number,
    keystoreFile: IKeyStoreFile | undefined,
    isNew: boolean,
    privateKeyStorage: IPrivateKeyStorage | undefined
  ) {
    this._cryptoProvider = cryptoProvider;
    this._privateKeyStorage = privateKeyStorage;
    this._iterations = iterations;
    this._keystoreFile = keystoreFile;
    this._state = 'locked';
    this._dirty = false;
    this._isNew = isNew;
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Creates a new, empty key store.
   * Call `initialize(password)` to set the master password.
   * @param params - Creation parameters
   * @returns Success with new KeyStore instance, or Failure if parameters invalid
   * @public
   */
  public static create(params: IKeyStoreCreateParams): Result<KeyStore> {
    const iterations = params.iterations ?? DEFAULT_KEYSTORE_ITERATIONS;
    if (iterations < 1) {
      return fail('Iterations must be at least 1');
    }
    return succeed(
      new KeyStore(params.cryptoProvider, iterations, undefined, true, params.privateKeyStorage)
    );
  }

  /**
   * Opens an existing encrypted key store.
   * Call `unlock(password)` to decrypt and access secrets.
   * @param params - Open parameters including the encrypted file
   * @returns Success with KeyStore instance, or Failure if file format invalid
   * @public
   */
  public static open(params: IKeyStoreOpenParams): Result<KeyStore> {
    // Validate the file format
    const fileResult = keystoreFile.convert(params.keystoreFile);
    if (fileResult.isFailure()) {
      return fail(`Invalid key store file: ${fileResult.message}`);
    }

    const iterations = fileResult.value.keyDerivation.iterations;
    return succeed(
      new KeyStore(params.cryptoProvider, iterations, fileResult.value, false, params.privateKeyStorage)
    );
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  /**
   * Initializes a new key store with the master password.
   * Generates a random salt for key derivation.
   * Only valid for newly created (not opened) key stores.
   * @param password - The master password
   * @returns Success with this instance when initialized, Failure if already initialized or opened
   * @public
   */
  public async initialize(password: string): Promise<Result<KeyStore>> {
    if (!this._isNew) {
      return fail('Cannot initialize an opened key store - use unlock() instead');
    }
    if (this._state === 'unlocked') {
      return fail('Key store is already initialized');
    }
    if (!password || password.length === 0) {
      return fail('Password cannot be empty');
    }

    // Generate salt for this key store using crypto provider
    const saltResult = this._cryptoProvider.generateRandomBytes(MIN_SALT_LENGTH);
    /* c8 ignore next 3 - crypto provider errors tested but coverage intermittently missed */
    if (saltResult.isFailure()) {
      return fail(`Failed to generate salt: ${saltResult.message}`);
    }

    this._salt = saltResult.value;
    this._secrets = new Map();
    this._state = 'unlocked';
    this._dirty = true; // New store needs to be saved

    return succeed(this);
  }

  /**
   * Unlocks an existing key store with the master password.
   * Decrypts the vault and loads secrets into memory.
   * @param password - The master password
   * @returns Success with this instance when unlocked, Failure if password incorrect
   * @public
   */
  public async unlock(password: string): Promise<Result<KeyStore>> {
    if (this._isNew) {
      return fail('Cannot unlock a new key store - use initialize() instead');
    }
    /* c8 ignore next 6 - error paths tested but coverage intermittently missed */
    if (this._state === 'unlocked') {
      return fail('Key store is already unlocked');
    }
    if (!this._keystoreFile) {
      return fail('No key store file to unlock');
    }

    const keyDerivation = this._keystoreFile.keyDerivation;
    const saltResult = this._cryptoProvider.fromBase64(keyDerivation.salt);
    /* c8 ignore next 3 - error path tested but coverage intermittently missed */
    if (saltResult.isFailure()) {
      return fail(`Invalid salt in key store file: ${saltResult.message}`);
    }
    const salt = saltResult.value;

    // Derive the key from password
    const keyResult = await this._cryptoProvider.deriveKey(password, salt, keyDerivation.iterations);
    /* c8 ignore next 3 - error path tested but coverage intermittently missed */
    if (keyResult.isFailure()) {
      return fail(`Key derivation failed: ${keyResult.message}`);
    }

    return this._decryptVault(keyResult.value);
  }

  /**
   * Unlocks an existing key store with a pre-derived key, bypassing
   * PBKDF2 key derivation. Use this when the derived key has been
   * stored externally (e.g., in another key store) and the original
   * password is no longer available.
   *
   * The supplied key must have been derived from the correct password
   * using the key store file's own PBKDF2 parameters (salt and
   * iteration count).
   *
   * @param derivedKey - The pre-derived master key (32 bytes for AES-256)
   * @returns Success with this instance when unlocked, Failure if key is incorrect
   * @public
   */
  public async unlockWithKey(derivedKey: Uint8Array): Promise<Result<KeyStore>> {
    if (this._isNew) {
      return fail('Cannot unlock a new key store - use initialize() instead');
    }
    if (this._state === 'unlocked') {
      return fail('Key store is already unlocked');
    }
    if (derivedKey.length !== Constants.AES_256_KEY_SIZE) {
      return fail(`Key must be ${Constants.AES_256_KEY_SIZE} bytes, got ${derivedKey.length}`);
    }
    /* c8 ignore next 3 - defensive coding: unreachable via public API (open sets file, create sets isNew) */
    if (!this._keystoreFile) {
      return fail('No key store file to unlock');
    }

    return this._decryptVault(derivedKey);
  }

  /**
   * Locks the key store, clearing all secrets from memory.
   * @param force - If true, discards unsaved changes
   * @returns Success when locked, Failure if unsaved changes and !force
   * @public
   */
  public lock(force?: boolean): Result<KeyStore> {
    if (this._state === 'locked') {
      return succeed(this);
    }

    if (this._dirty && !force) {
      return fail('Unsaved changes - use force=true to discard or save() first');
    }

    // Clear secrets from memory (overwrite for security)
    if (this._secrets) {
      for (const entry of this._secrets.values()) {
        if (entry.type !== 'asymmetric-keypair') {
          entry.key.fill(0);
        }
      }
      this._secrets.clear();
      this._secrets = undefined;
    }

    this._state = 'locked';
    this._dirty = false;

    return succeed(this);
  }

  /**
   * Checks if the key store is unlocked.
   * @public
   */
  public get isUnlocked(): boolean {
    return this._state === 'unlocked';
  }

  /**
   * Checks if there are unsaved changes.
   * @public
   */
  public get isDirty(): boolean {
    return this._dirty;
  }

  /**
   * Whether this is a newly created key store (not opened from a file).
   * A new key store must be initialized with a password before use.
   * An opened key store must be unlocked with the existing password.
   * @public
   */
  public get isNew(): boolean {
    return this._isNew;
  }

  /**
   * Gets the current lock state.
   * @public
   */
  public get state(): KeyStoreLockState {
    return this._state;
  }

  /**
   * Gets the crypto provider used by this key store.
   * Available regardless of lock state.
   * @public
   */
  public get cryptoProvider(): ICryptoProvider {
    return this._cryptoProvider;
  }

  // ============================================================================
  // Secret Management
  // ============================================================================

  /**
   * Lists all secret names in the key store.
   * @returns Success with array of secret names, Failure if locked
   * @public
   */
  public listSecrets(): Result<readonly string[]> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    return succeed(Array.from(this._secrets.keys()));
  }

  /**
   * Gets a secret by name. Returns the {@link CryptoUtils.KeyStore.IKeyStoreEntry | discriminated union}
   * — callers must check `entry.type` before accessing `key`/`id` since asymmetric
   * entries carry no raw key material.
   * @param name - Name of the secret
   * @returns Success with secret entry, Failure if not found or locked
   * @public
   */
  public getSecret(name: string): Result<IKeyStoreEntry> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    const entry = this._secrets.get(name);
    if (!entry) {
      return fail(`Secret '${name}' not found`);
    }
    return succeed(entry);
  }

  /**
   * Returns the public-key JWK for an asymmetric-keypair entry.
   * Available without {@link CryptoUtils.KeyStore.IPrivateKeyStorage} since the
   * public key lives in the vault metadata directly.
   * @param name - Name of the entry
   * @returns Success with the JWK, Failure if not found, locked, or wrong type
   * @public
   */
  public getPublicKeyJwk(name: string): Result<JsonWebKey> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    const entry = this._secrets.get(name);
    if (!entry) {
      return fail(`Secret '${name}' not found`);
    }
    if (entry.type !== 'asymmetric-keypair') {
      return fail(`Secret '${name}' is not an asymmetric keypair (type: ${entry.type})`);
    }
    return succeed(entry.publicKeyJwk);
  }

  /**
   * Checks if a secret exists.
   * @param name - Name of the secret
   * @returns Success with boolean, Failure if locked
   * @public
   */
  public hasSecret(name: string): Result<boolean> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    return succeed(this._secrets.has(name));
  }

  /**
   * Adds a new secret with a randomly generated key.
   * @param name - Unique name for the secret
   * @param options - Optional description
   * @returns Success with the generated entry, Failure if locked or name invalid
   * @public
   */
  public async addSecret(name: string, options?: IAddSecretOptions): Promise<Result<IAddSecretResult>> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    if (!name || name.length === 0) {
      return fail('Secret name cannot be empty');
    }

    // Generate a new random key
    const keyResult = await this._cryptoProvider.generateKey();
    /* c8 ignore next 3 - crypto provider errors tested but coverage intermittently missed */
    if (keyResult.isFailure()) {
      return fail(`Failed to generate key: ${keyResult.message}`);
    }

    const entry: IKeyStoreSymmetricEntry = {
      name,
      type: 'encryption-key',
      key: keyResult.value,
      description: options?.description,
      createdAt: getCurrentTimestamp()
    };

    const existing = this._secrets.get(name);
    const warning = existing ? await this._releaseEntryResources(existing) : undefined;

    this._secrets.set(name, entry);
    this._dirty = true;

    return succeed({ entry, replaced: existing !== undefined, warning });
  }

  /**
   * Imports raw 32-byte key material into the vault.
   *
   * Always validates that the key is exactly 32 bytes (AES-256). The optional
   * `type` field is a classification label stored with the entry; it does not
   * change the validation rules.  For importing UTF-8 API key strings (variable
   * length), use {@link KeyStore.importApiKey} instead.
   *
   * @param name - Unique name for the secret
   * @param key - The 32-byte AES-256 key material
   * @param options - Optional type classification, description, whether to replace existing
   * @returns Success with entry, Failure if locked, key invalid, or exists and !replace
   * @public
   */
  public async importSecret(
    name: string,
    key: Uint8Array,
    options?: IImportKeyOptions
  ): Promise<Result<IAddSecretResult>> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    if (!name || name.length === 0) {
      return fail('Secret name cannot be empty');
    }
    if (key.length !== Constants.AES_256_KEY_SIZE) {
      return fail(`Key must be ${Constants.AES_256_KEY_SIZE} bytes, got ${key.length}`);
    }

    const existing = this._secrets.get(name);
    if (existing && !options?.replace) {
      return fail(`Secret '${name}' already exists - use replace=true to overwrite`);
    }

    const entry: IKeyStoreSymmetricEntry = {
      name,
      type: options?.type ?? 'encryption-key',
      key: new Uint8Array(key), // Copy to prevent external modification
      description: options?.description,
      createdAt: getCurrentTimestamp()
    };

    const warning = existing ? await this._releaseEntryResources(existing) : undefined;
    this._secrets.set(name, entry);
    this._dirty = true;

    return succeed({ entry, replaced: existing !== undefined, warning });
  }

  /**
   * Adds a secret derived from a password using PBKDF2.
   *
   * Generates a random salt, derives a 32-byte AES-256 key from the password,
   * and stores it in the vault. Returns the key derivation parameters so they
   * can be stored alongside encrypted files, enabling decryption with just the
   * password (without unlocking the keystore).
   *
   * @param name - Unique name for the secret
   * @param password - Password to derive the key from
   * @param options - Optional description, iterations, replace flag
   * @returns Success with entry and keyDerivation params, Failure if locked or invalid
   * @public
   */
  public async addSecretFromPassword(
    name: string,
    password: string,
    options?: IAddSecretFromPasswordOptions
  ): Promise<Result<IAddSecretFromPasswordResult>> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    if (!name || name.length === 0) {
      return fail('Secret name cannot be empty');
    }
    if (!password || password.length === 0) {
      return fail('Password cannot be empty');
    }

    const existing = this._secrets.get(name);
    if (existing && !options?.replace) {
      return fail(`Secret '${name}' already exists - use replace=true to overwrite`);
    }

    const iterations = options?.iterations ?? DEFAULT_SECRET_ITERATIONS;

    // Generate a random salt for this secret's key derivation
    const saltResult = this._cryptoProvider.generateRandomBytes(MIN_SALT_LENGTH);
    /* c8 ignore next 3 - crypto provider errors tested but coverage intermittently missed */
    if (saltResult.isFailure()) {
      return fail(`Failed to generate salt: ${saltResult.message}`);
    }

    // Derive the key from password
    const keyResult = await this._cryptoProvider.deriveKey(password, saltResult.value, iterations);
    /* c8 ignore next 3 - crypto provider errors tested but coverage intermittently missed */
    if (keyResult.isFailure()) {
      return fail(`Key derivation failed: ${keyResult.message}`);
    }

    const entry: IKeyStoreSymmetricEntry = {
      name,
      type: 'encryption-key',
      key: keyResult.value,
      description: options?.description,
      createdAt: getCurrentTimestamp()
    };

    const warning = existing ? await this._releaseEntryResources(existing) : undefined;
    this._secrets.set(name, entry);
    this._dirty = true;

    return succeed({
      entry,
      replaced: existing !== undefined,
      warning,
      keyDerivation: {
        kdf: 'pbkdf2',
        salt: this._cryptoProvider.toBase64(saltResult.value),
        iterations
      }
    });
  }

  /**
   * Verifies that a candidate password derives the same key material currently
   * stored under `name`, using the supplied
   * {@link CryptoUtils.IKeyDerivationParams | key derivation parameters}.
   *
   * The keystore does not persist per-slot key derivation parameters with the
   * entry — callers receive them from `addSecretFromPassword` and store them
   * alongside the encrypted artifact (or wherever else makes sense). Pass
   * those same parameters here for verification.
   *
   * Re-derives a key from `password` + `keyDerivation`, then compares it to
   * the stored key material in constant time. Restricted to entries of type
   * `'encryption-key'` — the type produced by `addSecretFromPassword`. Other
   * symmetric types (`'api-key'`) and asymmetric entries are rejected so
   * the boolean result reflects "this slot accepts this password" rather
   * than an incidental byte-equality match against unrelated material.
   *
   * Note: the keystore does not currently flag whether an `'encryption-key'`
   * entry was actually password-derived (vs. random via `addSecret` or raw
   * via `importSecret`). A `true` result therefore means "the candidate
   * password produces the same 32 bytes currently stored", which is what
   * the equivalent consumer-side helper (`verifyGatePassword`) already
   * implies for entries it manages.
   *
   * @param name - Name of the secret to verify against
   * @param password - Candidate password to test
   * @param keyDerivation - The key derivation parameters returned by
   * `addSecretFromPassword` when the secret was created. Only
   * `kdf: 'pbkdf2'` is supported.
   * @returns Success(true) when the candidate matches the stored key,
   * Success(false) when it does not, Failure if locked, secret missing,
   * wrong type, unsupported `kdf`, or key derivation fails
   * @public
   */
  public async verifySecretFromPassword(
    name: string,
    password: string,
    keyDerivation: IKeyDerivationParams
  ): Promise<Result<boolean>> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    if (!password || password.length === 0) {
      return fail('Password cannot be empty');
    }
    if (keyDerivation.kdf !== 'pbkdf2') {
      return fail(`Unsupported kdf '${keyDerivation.kdf}' (expected 'pbkdf2')`);
    }

    const entry = this._secrets.get(name);
    if (!entry) {
      return fail(`Secret '${name}' not found`);
    }
    if (entry.type !== 'encryption-key') {
      return fail(`Secret '${name}' is not a password-verifiable encryption key (type: ${entry.type})`);
    }

    const saltResult = this._cryptoProvider.fromBase64(keyDerivation.salt);
    if (saltResult.isFailure()) {
      return fail(`Invalid salt: ${saltResult.message}`);
    }

    const derivedResult = await this._cryptoProvider.deriveKey(
      password,
      saltResult.value,
      keyDerivation.iterations
    );
    /* c8 ignore next 3 - crypto provider errors covered in nodeCryptoProvider tests */
    if (derivedResult.isFailure()) {
      return fail(`Key derivation failed: ${derivedResult.message}`);
    }

    return succeed(KeyStore._timingSafeEqual(derivedResult.value, entry.key));
  }

  /**
   * Adds a secret derived from a password using Argon2id (RFC 9106).
   *
   * The Argon2id provider must be supplied explicitly; the KeyStore does not
   * hold one by default (consumers opt in by depending on the argon2 package).
   *
   * Returns the key derivation parameters so callers can store them alongside
   * encrypted artifacts, enabling future re-derivation and verification.
   *
   * @param name - Unique name for the secret
   * @param password - Password or passphrase
   * @param argon2idProvider - Argon2id provider (Node or Browser implementation)
   * @param options - Optional: Argon2id params (defaults to ARGON2ID_OWASP_MIN), description, replace flag
   * @returns Success with entry and keyDerivation params, Failure if locked or invalid
   * @public
   */
  public async addSecretFromPasswordArgon2id(
    name: string,
    password: string,
    argon2idProvider: IArgon2idProvider,
    options?: IAddSecretFromPasswordArgon2idOptions
  ): Promise<Result<IAddSecretFromPasswordResult>> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    if (!name || name.length === 0) {
      return fail('Secret name cannot be empty');
    }
    if (!password || password.length === 0) {
      return fail('Password cannot be empty');
    }

    const existing = this._secrets.get(name);
    if (existing && !options?.replace) {
      return fail(`Secret '${name}' already exists - use replace=true to overwrite`);
    }

    const params: IArgon2idParams = options?.params ?? ARGON2ID_OWASP_MIN;

    const saltResult = this._cryptoProvider.generateRandomBytes(MIN_SALT_LENGTH);
    /* c8 ignore next 3 - crypto provider errors tested but coverage intermittently missed */
    if (saltResult.isFailure()) {
      return fail(`Failed to generate salt: ${saltResult.message}`);
    }

    const keyResult = await argon2idProvider.argon2id(password, saltResult.value, params);
    if (keyResult.isFailure()) {
      return fail(`Argon2id key derivation failed: ${keyResult.message}`);
    }

    const entry: IKeyStoreSymmetricEntry = {
      name,
      type: 'encryption-key',
      key: keyResult.value,
      description: options?.description,
      createdAt: getCurrentTimestamp()
    };

    const warning = existing ? await this._releaseEntryResources(existing) : undefined;
    this._secrets.set(name, entry);
    this._dirty = true;

    const keyDerivation: IArgon2idKeyDerivationParams = {
      kdf: 'argon2id',
      salt: this._cryptoProvider.toBase64(saltResult.value),
      memoryKiB: params.memoryKiB,
      iterations: params.iterations,
      parallelism: params.parallelism
    };

    return succeed({ entry, replaced: existing !== undefined, warning, keyDerivation });
  }

  /**
   * Verifies a candidate password against an Argon2id-derived entry using the
   * supplied key derivation parameters. Constant-time comparison.
   *
   * @param name - Name of the secret to verify against
   * @param password - Candidate password to test
   * @param argon2idProvider - Argon2id provider (must produce bit-identical output for identical inputs)
   * @param keyDerivation - The Argon2id key derivation parameters returned by `addSecretFromPasswordArgon2id`
   * @returns Success(true) if candidate matches stored key, Success(false) if not,
   * Failure if locked, secret missing, wrong type, or derivation fails
   * @public
   */
  public async verifySecretFromPasswordArgon2id(
    name: string,
    password: string,
    argon2idProvider: IArgon2idProvider,
    keyDerivation: IArgon2idKeyDerivationParams
  ): Promise<Result<boolean>> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    if (!password || password.length === 0) {
      return fail('Password cannot be empty');
    }

    const entry = this._secrets.get(name);
    if (!entry) {
      return fail(`Secret '${name}' not found`);
    }
    if (entry.type !== 'encryption-key') {
      return fail(`Secret '${name}' is not a password-verifiable encryption key (type: ${entry.type})`);
    }

    const saltResult = this._cryptoProvider.fromBase64(keyDerivation.salt);
    if (saltResult.isFailure()) {
      return fail(`Invalid salt: ${saltResult.message}`);
    }

    const params: IArgon2idParams = {
      memoryKiB: keyDerivation.memoryKiB,
      iterations: keyDerivation.iterations,
      parallelism: keyDerivation.parallelism,
      outputBytes: entry.key.length
    };

    const derivedResult = await argon2idProvider.argon2id(password, saltResult.value, params);
    if (derivedResult.isFailure()) {
      return fail(`Argon2id key derivation failed: ${derivedResult.message}`);
    }

    return succeed(KeyStore._timingSafeEqual(derivedResult.value, entry.key));
  }

  /**
   * Removes a secret by name. Vault-first: the in-memory vault entry is dropped
   * before any storage cleanup runs. For asymmetric-keypair entries, best-effort
   * calls {@link CryptoUtils.KeyStore.IPrivateKeyStorage}.delete on the entry's
   * `id`; a failure is reported via `warning` on the result but does not roll
   * back the vault removal.
   * @param name - Name of the secret to remove
   * @returns Success with removed entry (and optional warning), Failure if not found or locked
   * @public
   */
  public async removeSecret(name: string): Promise<Result<IRemoveSecretResult>> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }

    const entry = this._secrets.get(name);
    if (!entry) {
      return fail(`Secret '${name}' not found`);
    }

    // Vault-first: drop the in-memory entry before touching storage so a
    // storage failure cannot block removal.
    this._secrets.delete(name);
    this._dirty = true;

    const warning = await this._releaseEntryResources(entry);
    return succeed({ entry, warning });
  }

  /**
   * Imports an API key string into the vault.
   * The string is UTF-8 encoded and stored with type `'api-key'`.
   * @param name - Unique name for the secret
   * @param apiKey - The API key string
   * @param options - Optional description, whether to replace existing
   * @returns Success with entry, Failure if locked, empty, or exists and !replace
   * @public
   */
  public async importApiKey(
    name: string,
    apiKey: string,
    options?: IImportSecretOptions
  ): Promise<Result<IAddSecretResult>> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    if (!name || name.length === 0) {
      return fail('Secret name cannot be empty');
    }
    if (!apiKey || apiKey.length === 0) {
      return fail('API key cannot be empty');
    }

    const existing = this._secrets.get(name);
    if (existing && !options?.replace) {
      return fail(`Secret '${name}' already exists - use replace=true to overwrite`);
    }

    const encoder = new TextEncoder();
    const entry: IKeyStoreSymmetricEntry = {
      name,
      type: 'api-key',
      key: encoder.encode(apiKey),
      description: options?.description,
      createdAt: getCurrentTimestamp()
    };

    const warning = existing ? await this._releaseEntryResources(existing) : undefined;
    this._secrets.set(name, entry);
    this._dirty = true;

    return succeed({ entry, replaced: existing !== undefined, warning });
  }

  /**
   * Retrieves an API key string by name.
   * Only works for secrets with type `'api-key'`.
   * @param name - Name of the secret
   * @returns Success with the API key string, Failure if not found, locked, or wrong type
   * @public
   */
  public getApiKey(name: string): Result<string> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    const entry = this._secrets.get(name);
    if (!entry) {
      return fail(`Secret '${name}' not found`);
    }
    if (entry.type !== 'api-key') {
      return fail(`Secret '${name}' is not an API key (type: ${entry.type})`);
    }
    const decoder = new TextDecoder();
    return succeed(decoder.decode(entry.key));
  }

  // ============================================================================
  // Asymmetric Keypair Management
  // ============================================================================

  /**
   * Adds a new asymmetric keypair to the vault. Storage-first: the private key
   * is stored under a freshly-minted `id` before the public-key vault entry is
   * committed. If the storage call fails, no vault entry is written and the
   * operation returns Failure.
   *
   * When `replace: true` displaces an existing entry (asymmetric or symmetric),
   * a fresh `id` is minted; the displaced entry's resources are released
   * best-effort. Failure of the storage delete is reported via `warning` on the
   * result but does not roll back the replacement.
   *
   * Requires a {@link CryptoUtils.KeyStore.IPrivateKeyStorage} backend
   * supplied at construction.
   *
   * @param name - Unique name for the entry
   * @param options - Algorithm, optional description, replace flag
   * @returns Success with the new entry, Failure if locked, no provider, or storage write failed
   * @public
   */
  public async addKeyPair(name: string, options: IAddKeyPairOptions): Promise<Result<IAddKeyPairResult>> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    if (!name || name.length === 0) {
      return fail('Entry name cannot be empty');
    }
    if (!this._privateKeyStorage) {
      return fail('No private key storage configured');
    }

    const existing = this._secrets.get(name);
    if (existing && !options.replace) {
      return fail(`Secret '${name}' already exists - use replace=true to overwrite`);
    }

    // Generate the keypair before touching storage. extractable=true on backends
    // that round-trip via JWK; extractable=false on backends that hold CryptoKey
    // refs directly.
    const extractable = !this._privateKeyStorage.supportsNonExtractable;
    const keyPairResult = await this._cryptoProvider.generateKeyPair(options.algorithm, extractable);
    /* c8 ignore next 3 - crypto provider errors covered in nodeCryptoProvider tests; cannot be triggered here without mocking */
    if (keyPairResult.isFailure()) {
      return fail(`Failed to generate keypair for '${name}': ${keyPairResult.message}`);
    }
    const { publicKey, privateKey } = keyPairResult.value;

    const jwkResult = await this._cryptoProvider.exportPublicKeyJwk(publicKey);
    /* c8 ignore next 3 - export of an extractable freshly-generated public key is hard to fail */
    if (jwkResult.isFailure()) {
      return fail(`Failed to export public key for '${name}': ${jwkResult.message}`);
    }

    const idResult = this._generateId();
    /* c8 ignore next 3 - random-bytes failure is hard to trigger with a healthy provider */
    if (idResult.isFailure()) {
      return fail(`Failed to mint storage id for '${name}': ${idResult.message}`);
    }
    const id = idResult.value;

    // Storage-first: write the private key before committing the vault entry.
    const storeResult = await this._privateKeyStorage.store(id, privateKey);
    if (storeResult.isFailure()) {
      return fail(`Failed to persist private key for '${name}': ${storeResult.message}`);
    }

    const entry: IKeyStoreAsymmetricEntry = {
      name,
      type: 'asymmetric-keypair',
      id,
      algorithm: options.algorithm,
      publicKeyJwk: jwkResult.value,
      description: options.description,
      createdAt: getCurrentTimestamp()
    };

    const warning = existing ? await this._releaseEntryResources(existing) : undefined;
    this._secrets.set(name, entry);
    this._dirty = true;

    return succeed({ entry, replaced: existing !== undefined, warning });
  }

  /**
   * Retrieves the keypair for an asymmetric-keypair entry. The private key is
   * loaded from {@link CryptoUtils.KeyStore.IPrivateKeyStorage} on every call —
   * the keystore never caches private `CryptoKey` references between calls.
   * The public key is re-imported from the vault's JWK so callers always
   * receive a `CryptoKey` rather than the JWK form.
   * @param name - Name of the entry
   * @returns Success with `{ publicKey, privateKey }`, Failure if not found,
   * locked, wrong type, no provider, or storage load failed.
   * @public
   */
  public async getKeyPair(name: string): Promise<Result<{ publicKey: CryptoKey; privateKey: CryptoKey }>> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    const entry = this._secrets.get(name);
    if (!entry) {
      return fail(`Secret '${name}' not found`);
    }
    if (entry.type !== 'asymmetric-keypair') {
      return fail(`Secret '${name}' is not an asymmetric keypair (type: ${entry.type})`);
    }
    if (!this._privateKeyStorage) {
      return fail('No private key storage configured');
    }

    const privateResult = await this._privateKeyStorage.load(entry.id);
    if (privateResult.isFailure()) {
      return fail(`Failed to load private key for '${name}': ${privateResult.message}`);
    }

    const publicResult = await this._cryptoProvider.importPublicKeyJwk(entry.publicKeyJwk, entry.algorithm);
    /* c8 ignore next 3 - vault JWKs that previously exported cleanly are extremely unlikely to fail re-import */
    if (publicResult.isFailure()) {
      return fail(`Failed to re-import public key for '${name}': ${publicResult.message}`);
    }

    return succeed({ publicKey: publicResult.value, privateKey: privateResult.value });
  }

  /**
   * Lists secret names filtered by type.
   * @param type - The secret type to filter by
   * @returns Success with array of matching secret names, Failure if locked
   * @public
   */
  public listSecretsByType(type: KeyStoreSecretType): Result<readonly string[]> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    const names: string[] = [];
    for (const [name, entry] of this._secrets) {
      if (entry.type === type) {
        names.push(name);
      }
    }
    return succeed(names);
  }

  /**
   * Renames a secret.
   * @param oldName - Current name
   * @param newName - New name
   * @returns Success with updated entry, Failure if source not found, target exists, or locked
   * @public
   */
  public renameSecret(oldName: string, newName: string): Result<IKeyStoreEntry> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    if (!newName || newName.length === 0) {
      return fail('New name cannot be empty');
    }

    const entry = this._secrets.get(oldName);
    if (!entry) {
      return fail(`Secret '${oldName}' not found`);
    }

    if (oldName !== newName && this._secrets.has(newName)) {
      return fail(`Secret '${newName}' already exists`);
    }

    // Create new entry with new name. For asymmetric entries the spread
    // preserves `id` so the storage handle survives the rename.
    const newEntry: IKeyStoreEntry = {
      ...entry,
      name: newName
    };

    this._secrets.delete(oldName);
    this._secrets.set(newName, newEntry);
    this._dirty = true;

    return succeed(newEntry);
  }

  // ============================================================================
  // Persistence
  // ============================================================================

  /**
   * Saves the key store, returning the encrypted file content.
   * Requires the master password to encrypt.
   * @param password - The master password
   * @returns Success with IKeyStoreFile, Failure if locked
   * @public
   */
  public async save(password: string): Promise<Result<IKeyStoreFile>> {
    if (!this._secrets || !this._salt) {
      return fail('Key store is locked');
    }
    if (!password || password.length === 0) {
      return fail('Password cannot be empty');
    }

    // Derive the encryption key
    const keyResult = await this._cryptoProvider.deriveKey(password, this._salt, this._iterations);
    /* c8 ignore next 3 - crypto provider errors tested but coverage intermittently missed */
    if (keyResult.isFailure()) {
      return fail(`Key derivation failed: ${keyResult.message}`);
    }

    return this._encryptVault(keyResult.value);
  }

  /**
   * Saves the key store using a pre-derived key, bypassing PBKDF2 key
   * derivation. Use this when the derived key has been stored externally
   * (e.g., in another key store) and the original password is no longer
   * available.
   *
   * The supplied key must be the same key that was (or would be) derived
   * from the master password using the key store's PBKDF2 parameters.
   *
   * @param derivedKey - The pre-derived master key (32 bytes for AES-256)
   * @returns Success with IKeyStoreFile, Failure if locked or key invalid
   * @public
   */
  public async saveWithKey(derivedKey: Uint8Array): Promise<Result<IKeyStoreFile>> {
    if (!this._secrets || !this._salt) {
      return fail('Key store is locked');
    }
    if (derivedKey.length !== Constants.AES_256_KEY_SIZE) {
      return fail(`Key must be ${Constants.AES_256_KEY_SIZE} bytes, got ${derivedKey.length}`);
    }

    return this._encryptVault(derivedKey);
  }

  /**
   * Changes the master password.
   * Re-encrypts the vault with the new password-derived key.
   * @param currentPassword - Current master password (for verification)
   * @param newPassword - New master password
   * @returns Success when password changed, Failure if locked or current password incorrect
   * @public
   */
  public async changePassword(currentPassword: string, newPassword: string): Promise<Result<KeyStore>> {
    if (!this._secrets || !this._salt) {
      return fail('Key store is locked');
    }
    if (!newPassword || newPassword.length === 0) {
      return fail('New password cannot be empty');
    }

    // Verify current password by trying to derive and re-encrypt
    // (For opened stores, we'd need to verify against the stored file)
    if (this._keystoreFile) {
      const saltResult = this._cryptoProvider.fromBase64(this._keystoreFile.keyDerivation.salt);
      /* c8 ignore next 3 - error path tested but coverage intermittently missed */
      if (saltResult.isFailure()) {
        return fail(`Invalid salt in key store file: ${saltResult.message}`);
      }

      const keyResult = await this._cryptoProvider.deriveKey(
        currentPassword,
        saltResult.value,
        this._keystoreFile.keyDerivation.iterations
      );
      /* c8 ignore next 3 - error path tested but coverage intermittently missed */
      if (keyResult.isFailure()) {
        return fail(`Key derivation failed: ${keyResult.message}`);
      }

      // Try to decrypt to verify password
      const ivResult = this._cryptoProvider.fromBase64(this._keystoreFile.iv);
      const authTagResult = this._cryptoProvider.fromBase64(this._keystoreFile.authTag);
      const encryptedDataResult = this._cryptoProvider.fromBase64(this._keystoreFile.encryptedData);

      /* c8 ignore next 3 - error path tested but coverage intermittently missed */
      if (ivResult.isFailure() || authTagResult.isFailure() || encryptedDataResult.isFailure()) {
        return fail('Invalid key store file format');
      }

      const decryptResult = await this._cryptoProvider.decrypt(
        encryptedDataResult.value,
        keyResult.value,
        ivResult.value,
        authTagResult.value
      );
      if (decryptResult.isFailure()) {
        return fail('Current password is incorrect');
      }
    }

    // Generate new salt for the new password using crypto provider
    const saltResult = this._cryptoProvider.generateRandomBytes(MIN_SALT_LENGTH);
    /* c8 ignore next 3 - crypto provider errors tested but coverage intermittently missed */
    if (saltResult.isFailure()) {
      return fail(`Failed to generate salt: ${saltResult.message}`);
    }

    this._salt = saltResult.value;
    this._dirty = true;

    // Save with new password
    const saveResult = await this.save(newPassword);
    /* c8 ignore next 3 - error path tested but coverage intermittently missed */
    if (saveResult.isFailure()) {
      return fail(saveResult.message);
    }
    return succeed(this);
  }

  // ============================================================================
  // IEncryptionProvider
  // ============================================================================

  /** {@inheritDoc IEncryptionProvider.encryptByName} */
  public async encryptByName<TMetadata = JsonValue>(
    secretName: string,
    content: JsonValue,
    metadata?: TMetadata
  ): Promise<Result<IEncryptedFile<TMetadata>>> {
    const secretResult = this.getSecret(secretName);
    if (secretResult.isFailure()) {
      return fail(`encryptByName: ${secretResult.message}`);
    }
    if (secretResult.value.type === 'asymmetric-keypair') {
      return fail(
        `encryptByName: secret '${secretName}' is an asymmetric keypair, not symmetric key material`
      );
    }

    return createEncryptedFile({
      content,
      secretName,
      key: secretResult.value.key,
      cryptoProvider: this._cryptoProvider,
      metadata
    });
  }

  // ============================================================================
  // Integration with IEncryptionConfig
  // ============================================================================

  /**
   * Creates a SecretProvider function for use with IEncryptionConfig.
   * The returned function looks up secrets from this key store.
   * @returns Success with SecretProvider, Failure if locked
   * @public
   */
  public getSecretProvider(): Result<SecretProvider> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }

    const secrets = this._secrets;
    const provider: SecretProvider = async (secretName: string): Promise<Result<Uint8Array>> => {
      const entry = secrets.get(secretName);
      if (!entry) {
        return fail(`Secret '${secretName}' not found in key store`);
      }
      if (entry.type === 'asymmetric-keypair') {
        return fail(`Secret '${secretName}' is an asymmetric keypair, not symmetric key material`);
      }
      return succeed(entry.key);
    };

    return succeed(provider);
  }

  /**
   * Creates a partial IEncryptionConfig using this key store as the secret source.
   * @returns Partial config that can be spread into a full IEncryptionConfig
   * @public
   */
  public getEncryptionConfig(): Result<Pick<IEncryptionConfig, 'secretProvider' | 'cryptoProvider'>> {
    const providerResult = this.getSecretProvider();
    if (providerResult.isFailure()) {
      return fail(providerResult.message);
    }

    return succeed({
      secretProvider: providerResult.value,
      cryptoProvider: this._cryptoProvider
    });
  }

  // ============================================================================
  // Private: Vault Encryption / Decryption
  // ============================================================================

  /**
   * Encrypts the vault with a derived key and returns the key store file.
   * Shared by `save()` and `saveWithKey()`.
   */
  private async _encryptVault(derivedKey: Uint8Array): Promise<Result<IKeyStoreFile>> {
    // _secrets and _salt are guaranteed non-undefined by callers
    const secrets = this._secrets!;
    const salt = this._salt!;

    // Build vault contents
    const secretEntries: Record<string, IKeyStoreEntryJson> = {};
    for (const [name, entry] of secrets) {
      if (entry.type === 'asymmetric-keypair') {
        secretEntries[name] = {
          name: entry.name,
          type: entry.type,
          id: entry.id,
          algorithm: entry.algorithm,
          publicKeyJwk: entry.publicKeyJwk,
          description: entry.description,
          createdAt: entry.createdAt
        };
      } else {
        secretEntries[name] = {
          name: entry.name,
          type: entry.type,
          key: this._cryptoProvider.toBase64(entry.key),
          description: entry.description,
          createdAt: entry.createdAt
        };
      }
    }

    const vaultContents: IKeyStoreVaultContents = {
      version: KEYSTORE_FORMAT,
      secrets: secretEntries
    };

    // Serialize and encrypt
    const jsonResult = captureResult(() => JSON.stringify(vaultContents));
    /* c8 ignore next 3 - error path tested but coverage intermittently missed */
    if (jsonResult.isFailure()) {
      return fail(`Failed to serialize vault: ${jsonResult.message}`);
    }

    const encryptResult = await this._cryptoProvider.encrypt(jsonResult.value, derivedKey);
    /* c8 ignore next 3 - crypto provider errors tested but coverage intermittently missed */
    if (encryptResult.isFailure()) {
      return fail(`Encryption failed: ${encryptResult.message}`);
    }

    const { iv, authTag, encryptedData } = encryptResult.value;

    const keystoreFileData: IKeyStoreFile = {
      format: KEYSTORE_FORMAT,
      algorithm: Constants.DEFAULT_ALGORITHM,
      iv: this._cryptoProvider.toBase64(iv),
      authTag: this._cryptoProvider.toBase64(authTag),
      encryptedData: this._cryptoProvider.toBase64(encryptedData),
      keyDerivation: {
        kdf: 'pbkdf2',
        salt: this._cryptoProvider.toBase64(salt),
        iterations: this._iterations
      }
    };

    this._keystoreFile = keystoreFileData;
    this._dirty = false;
    this._isNew = false;

    return succeed(keystoreFileData);
  }

  /**
   * Decrypts the vault with a derived key and loads secrets into memory.
   * Shared by `unlock()` and `unlockWithKey()`.
   */
  private async _decryptVault(derivedKey: Uint8Array): Promise<Result<KeyStore>> {
    const keystoreFile = this._keystoreFile;
    /* c8 ignore next 3 - defensive: _decryptVault is only called after a successful open() or create() */
    if (keystoreFile === undefined) {
      return fail('No key store file loaded');
    }

    const ivResult = this._cryptoProvider.fromBase64(keystoreFile.iv);
    const authTagResult = this._cryptoProvider.fromBase64(keystoreFile.authTag);
    const encryptedDataResult = this._cryptoProvider.fromBase64(keystoreFile.encryptedData);

    /* c8 ignore next 9 - base64 decode errors tested but coverage intermittently missed */
    if (ivResult.isFailure()) {
      return fail(`Invalid IV in key store file: ${ivResult.message}`);
    }
    if (authTagResult.isFailure()) {
      return fail(`Invalid auth tag in key store file: ${authTagResult.message}`);
    }
    if (encryptedDataResult.isFailure()) {
      return fail(`Invalid encrypted data in key store file: ${encryptedDataResult.message}`);
    }

    const decryptResult = await this._cryptoProvider.decrypt(
      encryptedDataResult.value,
      derivedKey,
      ivResult.value,
      authTagResult.value
    );
    if (decryptResult.isFailure()) {
      return fail('Incorrect password or corrupted key store');
    }

    // Parse the vault contents
    const parseResult = captureResult(() => JSON.parse(decryptResult.value) as unknown);
    /* c8 ignore next 3 - error path tested but coverage intermittently missed */
    if (parseResult.isFailure()) {
      return fail(`Failed to parse vault contents: ${parseResult.message}`);
    }

    const vaultResult = keystoreVaultContents.convert(parseResult.value);
    /* c8 ignore next 3 - error path tested but coverage intermittently missed */
    if (vaultResult.isFailure()) {
      return fail(`Invalid vault format: ${vaultResult.message}`);
    }

    // Build secrets into local variables to avoid partial state on failure
    const saltResult = this._cryptoProvider.fromBase64(keystoreFile.keyDerivation.salt);
    if (saltResult.isFailure()) {
      return fail(`Invalid salt in key store file: ${saltResult.message}`);
    }
    const secrets = new Map<string, IKeyStoreEntry>();
    for (const [name, jsonEntry] of Object.entries(vaultResult.value.secrets)) {
      if (jsonEntry.type === 'asymmetric-keypair') {
        const entry: IKeyStoreAsymmetricEntry = {
          name,
          type: jsonEntry.type,
          id: jsonEntry.id,
          algorithm: jsonEntry.algorithm,
          publicKeyJwk: jsonEntry.publicKeyJwk,
          description: jsonEntry.description,
          createdAt: jsonEntry.createdAt
        };
        secrets.set(name, entry);
      } else {
        const keyBytesResult = this._cryptoProvider.fromBase64(jsonEntry.key);
        /* c8 ignore next 3 - error path tested but coverage intermittently missed */
        if (keyBytesResult.isFailure()) {
          return fail(`Invalid key for secret '${name}': ${keyBytesResult.message}`);
        }
        const entry: IKeyStoreSymmetricEntry = {
          name,
          type: jsonEntry.type,
          key: keyBytesResult.value,
          description: jsonEntry.description,
          createdAt: jsonEntry.createdAt
        };
        secrets.set(name, entry);
      }
    }

    // All validation passed — commit state atomically
    this._salt = saltResult.value;
    this._secrets = secrets;
    this._state = 'unlocked';
    this._dirty = false;

    return succeed(this);
  }

  // ============================================================================
  // Private: Helpers for asymmetric flows
  // ============================================================================

  /**
   * Releases the resources held by an entry being displaced from the vault.
   * Symmetric entries get their key buffer zeroed in place. Asymmetric entries
   * have their private-key blob best-effort deleted from
   * {@link CryptoUtils.KeyStore.IPrivateKeyStorage}; if the storage call fails,
   * a warning string is returned but the displacement still proceeds — the
   * orphaned blob is left for consumer-side GC. Without a configured provider,
   * asymmetric cleanup is silently skipped.
   * @returns A warning string if storage cleanup failed, otherwise undefined.
   */
  private async _releaseEntryResources(entry: IKeyStoreEntry): Promise<string | undefined> {
    if (entry.type === 'asymmetric-keypair') {
      if (!this._privateKeyStorage) {
        return undefined;
      }
      const deleteResult = await this._privateKeyStorage.delete(entry.id);
      if (deleteResult.isFailure()) {
        return `Failed to delete prior storage blob for '${entry.name}' (id ${entry.id}): ${deleteResult.message}`;
      }
      return undefined;
    }
    entry.key.fill(0);
    return undefined;
  }

  /**
   * Constant-time byte comparison. Returns false immediately for length
   * mismatch (length is not secret); for equal-length inputs, walks the full
   * buffer accumulating differences via XOR so the running time does not leak
   * the position of the first differing byte.
   */
  private static _timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
    /* c8 ignore next 3 - defensive: callers compare equal-length 32-byte PBKDF2 keys */
    if (a.length !== b.length) {
      return false;
    }
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      // eslint-disable-next-line no-bitwise
      diff |= a[i] ^ b[i];
    }
    return diff === 0;
  }

  /**
   * Mints a fresh UUID v4 storage handle using the crypto provider's
   * {@link CryptoUtils.ICryptoProvider.generateRandomBytes | generateRandomBytes}.
   * Random-bytes failures propagate as Failure.
   */
  private _generateId(): Result<string> {
    return this._cryptoProvider.generateRandomBytes(16).onSuccess((bytes) => {
      // Per RFC 4122 §4.4: set version (4) and variant (10xx) bits.
      // eslint-disable-next-line no-bitwise
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      // eslint-disable-next-line no-bitwise
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return succeed(
        `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(
          20,
          32
        )}`
      );
    });
  }
}
