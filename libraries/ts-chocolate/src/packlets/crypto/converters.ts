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

import { Converter, Converters, fail, succeed } from '@fgv/ts-utils';
import {
  DEFAULT_ALGORITHM,
  ENCRYPTED_COLLECTION_FORMAT,
  EncryptedCollectionErrorMode,
  EncryptedCollectionFormat,
  EncryptionAlgorithm,
  IEncryptedCollectionFile,
  IEncryptedCollectionMetadata,
  IKeyDerivationParams,
  INamedSecret,
  KeyDerivationFunction
} from './model';

// ============================================================================
// Base Converters
// ============================================================================

/**
 * Converter for encryption algorithm values.
 * @public
 */
export const encryptionAlgorithm: Converter<EncryptionAlgorithm> =
  Converters.enumeratedValue<EncryptionAlgorithm>([DEFAULT_ALGORITHM]);

/**
 * Converter for encrypted collection format version.
 * @public
 */
export const encryptedCollectionFormat: Converter<EncryptedCollectionFormat> = Converters.enumeratedValue([
  ENCRYPTED_COLLECTION_FORMAT
]);

/**
 * Converter for encrypted collection error mode.
 * @public
 */
export const encryptedCollectionErrorMode: Converter<EncryptedCollectionErrorMode> =
  Converters.enumeratedValue<EncryptedCollectionErrorMode>(['fail', 'skip', 'warn']);

/**
 * Converter for key derivation function type.
 * @public
 */
export const keyDerivationFunction: Converter<KeyDerivationFunction> =
  Converters.enumeratedValue<KeyDerivationFunction>(['pbkdf2']);

/**
 * Converter for key derivation parameters.
 * @public
 */
export const keyDerivationParams: Converter<IKeyDerivationParams> = Converters.object<IKeyDerivationParams>({
  kdf: keyDerivationFunction,
  salt: Converters.string,
  iterations: Converters.number
});

/**
 * Converter for base64-encoded strings (validates format).
 * @public
 */
export const base64String: Converter<string> = Converters.string.withConstraint((value) => {
  // Basic base64 validation - check for valid characters and padding
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(value)) {
    return fail('Invalid base64 encoding');
  }
  return succeed(value);
});

// ============================================================================
// Metadata Converter
// ============================================================================

/**
 * Converter for encrypted collection metadata.
 * @public
 */
export const encryptedCollectionMetadata: Converter<IEncryptedCollectionMetadata> =
  Converters.object<IEncryptedCollectionMetadata>(
    {
      collectionId: Converters.string,
      description: Converters.string,
      itemCount: Converters.number
    },
    {
      optionalFields: ['collectionId', 'description', 'itemCount']
    }
  );

// ============================================================================
// Tombstone File Converter
// ============================================================================

/**
 * Converter for encrypted collection tombstone files.
 * Validates the complete structure of an encrypted collection file.
 * @public
 */
export const encryptedCollectionFile: Converter<IEncryptedCollectionFile> =
  Converters.object<IEncryptedCollectionFile>(
    {
      format: encryptedCollectionFormat,
      secretName: Converters.string,
      algorithm: encryptionAlgorithm,
      iv: base64String,
      authTag: base64String,
      encryptedData: base64String,
      metadata: encryptedCollectionMetadata,
      keyDerivation: keyDerivationParams
    },
    {
      optionalFields: ['metadata', 'keyDerivation']
    }
  );

// ============================================================================
// Named Secret Converter
// ============================================================================

/**
 * Converter for Uint8Array from base64 string.
 * @public
 */
export const uint8ArrayFromBase64: Converter<Uint8Array> = Converters.string.map((base64) => {
  try {
    // Use Buffer in Node.js environment, atob in browser
    if (typeof Buffer !== 'undefined') {
      return succeed(Uint8Array.from(Buffer.from(base64, 'base64')));
    }
    /* c8 ignore start - Browser-only fallback cannot be tested in Node.js environment */
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return succeed(bytes);
  } catch (e) {
    // This catch is for browser's atob() which throws on invalid base64
    // Node's Buffer.from() doesn't throw, it ignores invalid characters
    const message = e instanceof Error ? e.message : String(e);
    return fail(`Invalid base64: ${message}`);
  }
  /* c8 ignore stop */
});

/**
 * Converter for named secret from JSON representation.
 * Expects key as base64 string in JSON, converts to Uint8Array.
 * @public
 */
export const namedSecret: Converter<INamedSecret> = Converters.object<INamedSecret>({
  name: Converters.string,
  key: uint8ArrayFromBase64
});

// ============================================================================
// Detection Helper
// ============================================================================

/**
 * Checks if a JSON object appears to be an encrypted collection tombstone.
 * Uses the format field as a discriminator.
 * @param json - JSON object to check
 * @returns true if the object has the encrypted collection format field
 * @public
 */
export function isEncryptedCollectionFile(json: unknown): boolean {
  if (typeof json !== 'object' || json === null) {
    return false;
  }
  const obj = json as Record<string, unknown>;
  return obj.format === ENCRYPTED_COLLECTION_FORMAT;
}
