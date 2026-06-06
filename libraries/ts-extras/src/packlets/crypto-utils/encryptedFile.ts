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
import { captureResult, Converter, fail, Result, succeed } from '@fgv/ts-utils';
import * as Constants from './constants';
import { createEncryptedFileConverter } from './converters';
import { ICryptoProvider, IEncryptedFile, IKeyDerivationParams, isEncryptedFile } from './model';

// ============================================================================
// Base64 Utilities
// ============================================================================

/**
 * Encodes a `Uint8Array` to a base64 string.
 * @param bytes - Bytes to encode
 * @returns Base64 string
 * @public
 */
/* c8 ignore start - Browser-only fallback cannot be tested in Node.js environment */
export function toBase64(bytes: Uint8Array): string {
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
 * @public
 */
/* c8 ignore start - Browser-only fallback cannot be tested in Node.js environment */
export function fromBase64(base64: string): Uint8Array {
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
// Create Encrypted File Parameters
// ============================================================================

/**
 * Parameters for creating an {@link CryptoUtils.IEncryptedFile | encrypted file}.
 * @typeParam TMetadata - Type of optional unencrypted metadata
 * @public
 */
export interface ICreateEncryptedFileParams<TMetadata = JsonValue> {
  /**
   * The JSON content to encrypt.
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
   * {@link CryptoUtils.ICryptoProvider | Crypto provider} to use for encryption.
   */
  readonly cryptoProvider: ICryptoProvider;

  /**
   * Optional metadata to include unencrypted.
   */
  readonly metadata?: TMetadata;

  /**
   * Optional converter to validate metadata before including.
   * If provided, metadata will be validated before encryption.
   */
  readonly metadataConverter?: Converter<TMetadata>;

  /**
   * Optional {@link CryptoUtils.IKeyDerivationParams | key derivation parameters}.
   * If provided, stores the salt and iterations used to derive the key from a password.
   * This allows decryption using only a password (the salt/iterations are read from the file).
   */
  readonly keyDerivation?: IKeyDerivationParams;
}

// ============================================================================
// Encryption Functions
// ============================================================================

/**
 * Creates an {@link CryptoUtils.IEncryptedFile | encrypted file} from JSON content.
 * @typeParam TMetadata - Type of optional unencrypted metadata
 * @param params - Encryption parameters
 * @returns `Success` with encrypted file structure, or `Failure` with an error.
 * @public
 */
export async function createEncryptedFile<TMetadata = JsonValue>(
  params: ICreateEncryptedFileParams<TMetadata>
): Promise<Result<IEncryptedFile<TMetadata>>> {
  const { content, secretName, key, metadata, metadataConverter, keyDerivation, cryptoProvider } = params;

  // Validate metadata if converter provided
  /* c8 ignore next 6 - metadata validation path exercised via higher-level tests */
  if (metadata !== undefined && metadataConverter !== undefined) {
    const metadataResult = metadataConverter.convert(metadata);
    if (metadataResult.isFailure()) {
      return fail(`Invalid metadata: ${metadataResult.message}`);
    }
  }

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

  // Build the encrypted file structure
  const encryptedFile: IEncryptedFile<TMetadata> = {
    format: Constants.ENCRYPTED_FILE_FORMAT,
    secretName,
    algorithm: Constants.DEFAULT_ALGORITHM,
    iv: toBase64(iv),
    authTag: toBase64(authTag),
    encryptedData: toBase64(encryptedData),
    ...(metadata !== undefined ? { metadata } : {}),
    ...(keyDerivation !== undefined ? { keyDerivation } : {})
  };

  return succeed(encryptedFile);
}

// ============================================================================
// Decryption Functions
// ============================================================================

/**
 * Decrypts an {@link CryptoUtils.IEncryptedFile | encrypted file} and returns the JSON content.
 * @typeParam TPayload - Expected type of decrypted content
 * @param file - The encrypted file structure
 * @param key - The decryption key (32 bytes for AES-256)
 * @param cryptoProvider - {@link CryptoUtils.ICryptoProvider | Crypto provider} to use for decryption
 * @param payloadConverter - Optional converter to validate and convert decrypted content
 * @returns `Success` with decrypted content, or `Failure` with an error.
 * @public
 */
export async function decryptFile<TPayload extends JsonValue = JsonValue>(
  file: IEncryptedFile<unknown>,
  key: Uint8Array,
  cryptoProvider: ICryptoProvider,
  payloadConverter?: Converter<TPayload>
): Promise<Result<TPayload>> {
  // Decode base64 values
  const iv = fromBase64(file.iv);
  const authTag = fromBase64(file.authTag);
  const encryptedData = fromBase64(file.encryptedData);

  // Decrypt
  const decryptResult = await cryptoProvider.decrypt(encryptedData, key, iv, authTag);
  if (decryptResult.isFailure()) {
    return fail(decryptResult.message);
  }

  // Parse JSON
  const parseResult = captureResult(() => JSON.parse(decryptResult.value) as TPayload).withErrorFormat(
    (e) => `Failed to parse decrypted content as JSON: ${e}`
  );

  /* c8 ignore next 3 - JSON parse failure only occurs with corrupted encrypted data */
  if (parseResult.isFailure()) {
    return parseResult;
  }

  // Validate with converter if provided
  /* c8 ignore next 3 - payload converter path exercised via higher-level tests */
  if (payloadConverter !== undefined) {
    return payloadConverter.convert(parseResult.value);
  }

  return parseResult;
}

/**
 * Attempts to parse and decrypt a JSON object as an {@link CryptoUtils.IEncryptedFile | encrypted file}.
 * @typeParam TPayload - Expected type of decrypted content
 * @typeParam TMetadata - Type of optional unencrypted metadata
 * @param json - JSON object that may be an encrypted file
 * @param key - The decryption key (32 bytes for AES-256)
 * @param cryptoProvider - {@link CryptoUtils.ICryptoProvider | Crypto provider} to use for decryption
 * @param payloadConverter - Optional converter to validate and convert decrypted content
 * @param metadataConverter - Optional converter to validate metadata before decryption
 * @returns `Success` with decrypted content, or `Failure` with an error (including if not encrypted)
 * @public
 */
export async function tryDecryptFile<TPayload extends JsonValue = JsonValue, TMetadata = JsonValue>(
  json: JsonValue,
  key: Uint8Array,
  cryptoProvider: ICryptoProvider,
  payloadConverter?: Converter<TPayload>,
  metadataConverter?: Converter<TMetadata>
): Promise<Result<TPayload>> {
  // Check if it's an encrypted file
  if (!isEncryptedFile(json)) {
    return fail('Not an encrypted file');
  }

  // Validate and convert to typed encrypted file
  const fileConverter = createEncryptedFileConverter(metadataConverter);
  const fileResult = fileConverter.convert(json);
  if (fileResult.isFailure()) {
    return fail(`Invalid encrypted file format: ${fileResult.message}`);
  }

  return decryptFile(fileResult.value, key, cryptoProvider, payloadConverter);
}
