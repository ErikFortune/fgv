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

import { Converters as JsonConverters, JsonValue } from '@fgv/ts-json-base';
import { Converter, Converters, fail, succeed } from '@fgv/ts-utils';
import * as Constants from './constants';
import {
  EncryptedFileErrorMode,
  EncryptedFileFormat,
  EncryptionAlgorithm,
  IEncryptedFile,
  IKeyDerivationParams,
  INamedSecret,
  KeyDerivationFunction
} from './model';

// ============================================================================
// Base Converters
// ============================================================================

/**
 * Converter for {@link EncryptionAlgorithm | encryption algorithm} values.
 * @public
 */
export const encryptionAlgorithm: Converter<EncryptionAlgorithm> =
  Converters.enumeratedValue<EncryptionAlgorithm>([Constants.DEFAULT_ALGORITHM]);

/**
 * Converter for {@link EncryptedFileFormat | encrypted file format} version.
 * @public
 */
export const encryptedFileFormat: Converter<EncryptedFileFormat> = Converters.enumeratedValue([
  Constants.ENCRYPTED_FILE_FORMAT
]);

/**
 * Converter for {@link EncryptedFileErrorMode | encrypted file error mode}.
 * @public
 */
export const encryptedFileErrorMode: Converter<EncryptedFileErrorMode> =
  Converters.enumeratedValue<EncryptedFileErrorMode>(['fail', 'skip', 'warn']);

/**
 * Converter for {@link KeyDerivationFunction | key derivation function} type.
 * @public
 */
export const keyDerivationFunction: Converter<KeyDerivationFunction> =
  Converters.enumeratedValue<KeyDerivationFunction>(['pbkdf2']);

/**
 * Converter for {@link IKeyDerivationParams | key derivation parameters}.
 * @public
 */
export const keyDerivationParams: Converter<IKeyDerivationParams> = Converters.object<IKeyDerivationParams>({
  kdf: keyDerivationFunction,
  salt: Converters.string,
  iterations: Converters.number
});

/**
 * Converter for base64 strings (validates format).
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
// Uint8Array Converter
// ============================================================================

/**
 * Converter which converts a base64 string to a Uint8Array.
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

// ============================================================================
// Named Secret Converter
// ============================================================================

/**
 * Converter for {@link INamedSecret | named secret} from JSON representation.
 * Expects key as base64 string in JSON, converts to Uint8Array.
 * @public
 */
export const namedSecret: Converter<INamedSecret> = Converters.object<INamedSecret>({
  name: Converters.string,
  key: uint8ArrayFromBase64
});

// ============================================================================
// Encrypted File Converter Factory
// ============================================================================

/**
 * Base encrypted file structure without metadata typing.
 * Used internally by the converter factory.
 */
interface IBaseEncryptedFile {
  readonly format: EncryptedFileFormat;
  readonly secretName: string;
  readonly algorithm: EncryptionAlgorithm;
  readonly iv: string;
  readonly authTag: string;
  readonly encryptedData: string;
  readonly keyDerivation?: IKeyDerivationParams;
  readonly metadata?: JsonValue;
}

/**
 * Base converter for encrypted file structure (without typed metadata).
 */
const baseEncryptedFileConverter: Converter<IBaseEncryptedFile> = Converters.object<IBaseEncryptedFile>(
  {
    format: encryptedFileFormat,
    secretName: Converters.string,
    algorithm: encryptionAlgorithm,
    iv: base64String,
    authTag: base64String,
    encryptedData: base64String,
    keyDerivation: keyDerivationParams,
    metadata: JsonConverters.jsonValue
  },
  { optionalFields: ['keyDerivation', 'metadata'] }
);

/**
 * Creates a converter for {@link IEncryptedFile | encrypted files} with optional typed metadata.
 * @typeParam TMetadata - Type of optional unencrypted metadata
 * @param metadataConverter - Optional converter for validating metadata field
 * @returns A converter that validates and converts encrypted file structures
 * @public
 */
export function createEncryptedFileConverter<TMetadata = JsonValue>(
  metadataConverter?: Converter<TMetadata>
): Converter<IEncryptedFile<TMetadata>> {
  return Converters.generic<IEncryptedFile<TMetadata>>((from: unknown) => {
    // First validate base structure
    const baseResult = baseEncryptedFileConverter.convert(from);
    if (baseResult.isFailure()) {
      return fail(baseResult.message);
    }

    const base = baseResult.value;

    // Validate metadata with specific converter if provided and metadata exists
    if (metadataConverter !== undefined && base.metadata !== undefined) {
      const metaResult = metadataConverter.convert(base.metadata);
      if (metaResult.isFailure()) {
        return fail(`Invalid metadata: ${metaResult.message}`);
      }
      return succeed({
        ...base,
        metadata: metaResult.value
      } as IEncryptedFile<TMetadata>);
    }

    // Return as-is (metadata is either undefined or untyped JsonValue)
    return succeed(base as IEncryptedFile<TMetadata>);
  });
}

/**
 * Default converter for encrypted files without typed metadata.
 * @public
 */
export const encryptedFile: Converter<IEncryptedFile> = createEncryptedFileConverter();
