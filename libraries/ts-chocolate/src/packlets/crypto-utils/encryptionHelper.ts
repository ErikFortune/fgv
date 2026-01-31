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

import { captureResult, fail, Result, succeed } from '@fgv/ts-utils';
import { JsonObject, JsonValue } from '@fgv/ts-json-base';
import {
  DEFAULT_ALGORITHM,
  ENCRYPTED_COLLECTION_FORMAT,
  ICryptoProvider,
  IEncryptedCollectionFile,
  IEncryptedCollectionMetadata,
  IKeyDerivationParams
} from './model';
import * as Convert from './converters';

// ============================================================================
// Base64 Utilities
// ============================================================================

/**
 * Encodes a `Uint8Array` to a base64 string.
 * @param bytes - Bytes to encode
 * @returns Base64 string
 */
/* c8 ignore start - Browser-only fallback cannot be tested in Node.js environment */
function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  // Browser fallback
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
/* c8 ignore stop */

/**
 * Decodes a base64 string to a `Uint8Array`.
 * @param base64 - Base64 string to decode
 * @returns Decoded bytes
 */
/* c8 ignore start - Browser-only fallback cannot be tested in Node.js environment */
function fromBase64(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  // Browser fallback
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
/* c8 ignore stop */

// ============================================================================
// Encryption Helper
// ============================================================================

/**
 * Parameters for creating an {@link CryptoUtils.IEncryptedCollectionFile | encrypted collection file}.
 * @public
 */
export interface ICreateEncryptedFileParams {
  /**
   * The JSON content to encrypt (typically a collection's items).
   */
  readonly content: JsonValue;

  /**
   * Name of the secret used for encryption.
   */
  readonly secretName: string;

  /**
   * The encryption key (32 bytes for AES-256).
   */
  readonly key: Uint8Array;

  /**
   * Optional {@link CryptoUtils.IEncryptedCollectionMetadata | metadata} to include in the tombstone (unencrypted).
   */
  readonly metadata?: IEncryptedCollectionMetadata;

  /**
   * Optional {@link CryptoUtils.IKeyDerivationParams | key derivation parameters}.
   * If provided, stores the salt and iterations used to derive the key from a password.
   * This allows decryption using only a password (the salt/iterations are read from the file).
   */
  readonly keyDerivation?: IKeyDerivationParams;

  /**
   * {@link CryptoUtils.ICryptoProvider | Crypto provider} to use for encryption.
   */
  readonly cryptoProvider: ICryptoProvider;
}

/**
 * Creates an {@link CryptoUtils.IEncryptedCollectionFile | encrypted collection tombstone file} from JSON content.
 * @param params - Encryption parameters
 * @returns `Success` with encrypted file structure, or `Failure` with an error.
 * @public
 */
export async function createEncryptedCollectionFile(
  params: ICreateEncryptedFileParams
): Promise<Result<IEncryptedCollectionFile>> {
  const { content, secretName, key, metadata, keyDerivation, cryptoProvider } = params;

  // Serialize content to JSON string
  const jsonResult = captureResult(() => JSON.stringify(content));
  if (jsonResult.isFailure()) {
    return fail(`Failed to serialize content: ${jsonResult.message}`);
  }

  // Encrypt the JSON string
  const encryptResult = await cryptoProvider.encrypt(jsonResult.value, key);
  if (encryptResult.isFailure()) {
    return fail(`Encryption failed: ${encryptResult.message}`);
  }

  const { iv, authTag, encryptedData } = encryptResult.value;

  // Build the tombstone structure
  const tombstone: IEncryptedCollectionFile = {
    format: ENCRYPTED_COLLECTION_FORMAT,
    secretName,
    algorithm: DEFAULT_ALGORITHM,
    iv: toBase64(iv),
    authTag: toBase64(authTag),
    encryptedData: toBase64(encryptedData),
    ...(metadata ? { metadata } : {}),
    ...(keyDerivation ? { keyDerivation } : {})
  };

  return succeed(tombstone);
}

/**
 * Decrypts an {@link CryptoUtils.IEncryptedCollectionFile | encrypted collection file} and returns the JSON content.
 * @param tombstone - The encrypted collection file structure
 * @param key - The decryption key (32 bytes for AES-256)
 * @param cryptoProvider - {@link CryptoUtils.ICryptoProvider | Crypto provider} to use for decryption
 * @returns `Success` with decrypted JSON content, or `Failure` with an error.
 * @public
 */
export async function decryptCollectionFile(
  tombstone: IEncryptedCollectionFile,
  key: Uint8Array,
  cryptoProvider: ICryptoProvider
): Promise<Result<JsonObject>> {
  // Decode base64 values
  const iv = fromBase64(tombstone.iv);
  const authTag = fromBase64(tombstone.authTag);
  const encryptedData = fromBase64(tombstone.encryptedData);

  // Decrypt
  const decryptResult = await cryptoProvider.decrypt(encryptedData, key, iv, authTag);
  if (decryptResult.isFailure()) {
    return fail(decryptResult.message);
  }

  // Parse JSON
  return captureResult(() => JSON.parse(decryptResult.value) as JsonObject).withErrorFormat(
    (e) => `Failed to parse decrypted content as JSON: ${e}`
  );
}

/**
 * Attempts to parse and decrypt a JSON object as an {@link CryptoUtils.IEncryptedCollectionFile | encrypted collection file}.
 * @param json - JSON object that may be an encrypted collection file
 * @param key - The decryption key (32 bytes for AES-256)
 * @param cryptoProvider - {@link CryptoUtils.ICryptoProvider | Crypto provider} to use for decryption
 * @returns `Success` with decrypted JSON content, or `Failure` with an error (including if not encrypted)
 * @public
 */
export async function tryDecryptCollectionFile(
  json: JsonObject,
  key: Uint8Array,
  cryptoProvider: ICryptoProvider
): Promise<Result<JsonObject>> {
  // Check if it's an encrypted file
  if (!Convert.isEncryptedCollectionFile(json)) {
    return fail('Not an encrypted collection file');
  }

  // Validate and convert to typed tombstone
  const tombstoneResult = Convert.encryptedCollectionFile.convert(json);
  if (tombstoneResult.isFailure()) {
    return fail(`Invalid encrypted collection format: ${tombstoneResult.message}`);
  }

  return decryptCollectionFile(tombstoneResult.value, key, cryptoProvider);
}

/**
 * High-level helper class for encrypting and decrypting collection files.
 * @public
 */
export class EncryptionHelper {
  private readonly _cryptoProvider: ICryptoProvider;

  /**
   * Creates a new {@link CryptoUtils.EncryptionHelper | EncryptionHelper}.
   * @param cryptoProvider - The crypto provider to use
   */
  public constructor(cryptoProvider: ICryptoProvider) {
    this._cryptoProvider = cryptoProvider;
  }

  /**
   * Gets the {@link CryptoUtils.ICryptoProvider | crypto provider}.
   */
  public get cryptoProvider(): ICryptoProvider {
    return this._cryptoProvider;
  }

  /**
   * Creates an {@link CryptoUtils.IEncryptedCollectionFile | encrypted collection file} from JSON content.
   * @param content - JSON content to encrypt
   * @param secretName - Name of the secret used for encryption
   * @param key - Encryption key (32 bytes)
   * @param metadata - Optional metadata to include unencrypted
   * @param keyDerivation - Optional key derivation parameters (for password-based encryption)
   * @returns `Success` with encrypted file structure, or `Failure` with an error.
   */
  public async encrypt(
    content: JsonValue,
    secretName: string,
    key: Uint8Array,
    metadata?: IEncryptedCollectionMetadata,
    keyDerivation?: IKeyDerivationParams
  ): Promise<Result<IEncryptedCollectionFile>> {
    return createEncryptedCollectionFile({
      content,
      secretName,
      key,
      metadata,
      keyDerivation,
      cryptoProvider: this._cryptoProvider
    });
  }

  /**
   * Decrypts an {@link CryptoUtils.IEncryptedCollectionFile | encrypted collection file}.
   * @param tombstone - The encrypted file structure
   * @param key - Decryption key (32 bytes)
   * @returns `Success` with decrypted JSON content, or `Failure` with an error.
   */
  public async decrypt(tombstone: IEncryptedCollectionFile, key: Uint8Array): Promise<Result<JsonObject>> {
    return decryptCollectionFile(tombstone, key, this._cryptoProvider);
  }

  /**
   * Generates a new encryption key.
   * @returns `Success` with 32-byte key, or `Failure` with an error.
   */
  public async generateKey(): Promise<Result<Uint8Array>> {
    return this._cryptoProvider.generateKey();
  }

  /**
   * Derives a key from a password.
   * @param password - Password to derive from
   * @param salt - Salt bytes (at least 16 bytes recommended)
   * @param iterations - Number of iterations (100000+ recommended)
   * @returns Success with 32-byte derived key, or Failure with error
   */
  public async deriveKey(
    password: string,
    salt: Uint8Array,
    iterations: number
  ): Promise<Result<Uint8Array>> {
    return this._cryptoProvider.deriveKey(password, salt, iterations);
  }

  /**
   * Checks if a JSON object is an encrypted collection file.
   * @param json - JSON to check
   * @returns true if the JSON is an encrypted collection file
   */
  public isEncrypted(json: unknown): boolean {
    return Convert.isEncryptedCollectionFile(json);
  }
}
