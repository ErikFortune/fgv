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

import { captureResult, fail, Result, succeed } from '@fgv/ts-utils';
import { Constants as CryptoConstants, ICryptoProvider, IEncryptionConfig, SecretProvider } from '../model';
import {
  DEFAULT_KEYSTORE_ITERATIONS,
  IAddSecretOptions,
  IAddSecretResult,
  IImportSecretOptions,
  IKeyStoreCreateParams,
  IKeyStoreFile,
  IKeyStoreOpenParams,
  IKeyStoreSecretEntry,
  IKeyStoreSecretEntryJson,
  IKeyStoreVaultContents,
  KEYSTORE_FORMAT,
  KeyStoreLockState,
  MIN_SALT_LENGTH
} from './model';
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
 * // Use as secret provider for library loading
 * const encryptionConfig = keystore2.getEncryptionConfig().orThrow();
 * ```
 *
 * @public
 */
export class KeyStore {
  private readonly _cryptoProvider: ICryptoProvider;
  private readonly _iterations: number;
  private _keystoreFile: IKeyStoreFile | undefined;
  private _salt: Uint8Array | undefined;
  private _secrets: Map<string, IKeyStoreSecretEntry> | undefined;
  private _state: KeyStoreLockState;
  private _dirty: boolean;
  private _isNew: boolean;

  private constructor(
    cryptoProvider: ICryptoProvider,
    iterations: number,
    keystoreFile?: IKeyStoreFile,
    isNew: boolean = true
  ) {
    this._cryptoProvider = cryptoProvider;
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
    return succeed(new KeyStore(params.cryptoProvider, iterations, undefined, true));
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
    return succeed(new KeyStore(params.cryptoProvider, iterations, fileResult.value, false));
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
    if (this._state === 'unlocked') {
      return fail('Key store is already unlocked');
    }
    if (!this._keystoreFile) {
      return fail('No key store file to unlock');
    }

    const keyDerivation = this._keystoreFile.keyDerivation;
    const saltResult = this._cryptoProvider.fromBase64(keyDerivation.salt);
    if (saltResult.isFailure()) {
      return fail(`Invalid salt in key store file: ${saltResult.message}`);
    }
    const salt = saltResult.value;

    // Derive the key from password
    const keyResult = await this._cryptoProvider.deriveKey(password, salt, keyDerivation.iterations);
    if (keyResult.isFailure()) {
      return fail(`Key derivation failed: ${keyResult.message}`);
    }

    // Decrypt the vault
    const ivResult = this._cryptoProvider.fromBase64(this._keystoreFile.iv);
    const authTagResult = this._cryptoProvider.fromBase64(this._keystoreFile.authTag);
    const encryptedDataResult = this._cryptoProvider.fromBase64(this._keystoreFile.encryptedData);

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
      keyResult.value,
      ivResult.value,
      authTagResult.value
    );
    if (decryptResult.isFailure()) {
      return fail('Incorrect password or corrupted key store');
    }

    // Parse the vault contents
    const parseResult = captureResult(() => JSON.parse(decryptResult.value) as unknown);
    if (parseResult.isFailure()) {
      return fail(`Failed to parse vault contents: ${parseResult.message}`);
    }

    const vaultResult = keystoreVaultContents.convert(parseResult.value);
    if (vaultResult.isFailure()) {
      return fail(`Invalid vault format: ${vaultResult.message}`);
    }

    // Load secrets into memory
    this._salt = salt;
    this._secrets = new Map();
    for (const [name, jsonEntry] of Object.entries(vaultResult.value.secrets)) {
      const keyBytesResult = this._cryptoProvider.fromBase64(jsonEntry.key);
      if (keyBytesResult.isFailure()) {
        return fail(`Invalid key for secret '${name}': ${keyBytesResult.message}`);
      }
      const entry: IKeyStoreSecretEntry = {
        name,
        key: keyBytesResult.value,
        description: jsonEntry.description,
        createdAt: jsonEntry.createdAt
      };
      this._secrets.set(name, entry);
    }

    this._state = 'unlocked';
    this._dirty = false;

    return succeed(this);
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
        entry.key.fill(0);
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
   * Gets the current lock state.
   * @public
   */
  public get state(): KeyStoreLockState {
    return this._state;
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
   * Gets a secret by name.
   * @param name - Name of the secret
   * @returns Success with secret entry, Failure if not found or locked
   * @public
   */
  public getSecret(name: string): Result<IKeyStoreSecretEntry> {
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

    const replaced = this._secrets.has(name);

    // Generate a new random key
    const keyResult = await this._cryptoProvider.generateKey();
    if (keyResult.isFailure()) {
      return fail(`Failed to generate key: ${keyResult.message}`);
    }

    const entry: IKeyStoreSecretEntry = {
      name,
      key: keyResult.value,
      description: options?.description,
      createdAt: getCurrentTimestamp()
    };

    this._secrets.set(name, entry);
    this._dirty = true;

    return succeed({ entry, replaced });
  }

  /**
   * Imports an existing secret key.
   * @param name - Unique name for the secret
   * @param key - The 32-byte AES-256 key
   * @param options - Optional description, whether to replace existing
   * @returns Success with entry, Failure if locked, key invalid, or exists and !replace
   * @public
   */
  public importSecret(
    name: string,
    key: Uint8Array,
    options?: IImportSecretOptions
  ): Result<IAddSecretResult> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }
    if (!name || name.length === 0) {
      return fail('Secret name cannot be empty');
    }
    if (key.length !== CryptoConstants.AES_256_KEY_SIZE) {
      return fail(`Key must be ${CryptoConstants.AES_256_KEY_SIZE} bytes, got ${key.length}`);
    }

    const exists = this._secrets.has(name);
    if (exists && !options?.replace) {
      return fail(`Secret '${name}' already exists - use replace=true to overwrite`);
    }

    const entry: IKeyStoreSecretEntry = {
      name,
      key: new Uint8Array(key), // Copy to prevent external modification
      description: options?.description,
      createdAt: getCurrentTimestamp()
    };

    this._secrets.set(name, entry);
    this._dirty = true;

    return succeed({ entry, replaced: exists });
  }

  /**
   * Removes a secret by name.
   * @param name - Name of the secret to remove
   * @returns Success with removed entry, Failure if not found or locked
   * @public
   */
  public removeSecret(name: string): Result<IKeyStoreSecretEntry> {
    if (!this._secrets) {
      return fail('Key store is locked');
    }

    const entry = this._secrets.get(name);
    if (!entry) {
      return fail(`Secret '${name}' not found`);
    }

    // Clear the key before removing (security)
    entry.key.fill(0);
    this._secrets.delete(name);
    this._dirty = true;

    return succeed(entry);
  }

  /**
   * Renames a secret.
   * @param oldName - Current name
   * @param newName - New name
   * @returns Success with updated entry, Failure if source not found, target exists, or locked
   * @public
   */
  public renameSecret(oldName: string, newName: string): Result<IKeyStoreSecretEntry> {
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

    // Create new entry with new name
    const newEntry: IKeyStoreSecretEntry = {
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
    if (keyResult.isFailure()) {
      return fail(`Key derivation failed: ${keyResult.message}`);
    }

    // Build vault contents
    const secrets: Record<string, IKeyStoreSecretEntryJson> = {};
    for (const [name, entry] of this._secrets) {
      secrets[name] = {
        name: entry.name,
        key: this._cryptoProvider.toBase64(entry.key),
        description: entry.description,
        createdAt: entry.createdAt
      };
    }

    const vaultContents: IKeyStoreVaultContents = {
      version: KEYSTORE_FORMAT,
      secrets
    };

    // Serialize and encrypt
    const jsonResult = captureResult(() => JSON.stringify(vaultContents));
    if (jsonResult.isFailure()) {
      return fail(`Failed to serialize vault: ${jsonResult.message}`);
    }

    const encryptResult = await this._cryptoProvider.encrypt(jsonResult.value, keyResult.value);
    if (encryptResult.isFailure()) {
      return fail(`Encryption failed: ${encryptResult.message}`);
    }

    const { iv, authTag, encryptedData } = encryptResult.value;

    const keystoreFileData: IKeyStoreFile = {
      format: KEYSTORE_FORMAT,
      algorithm: CryptoConstants.DEFAULT_ALGORITHM,
      iv: this._cryptoProvider.toBase64(iv),
      authTag: this._cryptoProvider.toBase64(authTag),
      encryptedData: this._cryptoProvider.toBase64(encryptedData),
      keyDerivation: {
        kdf: 'pbkdf2',
        salt: this._cryptoProvider.toBase64(this._salt),
        iterations: this._iterations
      }
    };

    this._keystoreFile = keystoreFileData;
    this._dirty = false;
    this._isNew = false;

    return succeed(keystoreFileData);
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
      if (saltResult.isFailure()) {
        return fail(`Invalid salt in key store file: ${saltResult.message}`);
      }

      const keyResult = await this._cryptoProvider.deriveKey(
        currentPassword,
        saltResult.value,
        this._keystoreFile.keyDerivation.iterations
      );
      if (keyResult.isFailure()) {
        return fail(`Key derivation failed: ${keyResult.message}`);
      }

      // Try to decrypt to verify password
      const ivResult = this._cryptoProvider.fromBase64(this._keystoreFile.iv);
      const authTagResult = this._cryptoProvider.fromBase64(this._keystoreFile.authTag);
      const encryptedDataResult = this._cryptoProvider.fromBase64(this._keystoreFile.encryptedData);

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
    if (saltResult.isFailure()) {
      return fail(`Failed to generate salt: ${saltResult.message}`);
    }

    this._salt = saltResult.value;
    this._dirty = true;

    // Save with new password
    const saveResult = await this.save(newPassword);
    if (saveResult.isFailure()) {
      return fail(saveResult.message);
    }
    return succeed(this);
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
}
