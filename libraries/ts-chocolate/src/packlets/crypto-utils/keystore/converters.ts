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

import { Converter, Converters } from '@fgv/ts-utils';
import { base64String, encryptionAlgorithm, keyDerivationParams } from '../converters';
import {
  IKeyStoreFile,
  IKeyStoreSecretEntryJson,
  IKeyStoreVaultContents,
  KEYSTORE_FORMAT,
  KeyStoreFormat
} from './model';

// ============================================================================
// Key Store Format Converter
// ============================================================================

/**
 * Converter for {@link KeyStoreFormat | key store format} version.
 * @public
 */
export const keystoreFormat: Converter<KeyStoreFormat> = Converters.enumeratedValue<KeyStoreFormat>([
  KEYSTORE_FORMAT
]);

// ============================================================================
// Secret Entry Converters
// ============================================================================

/**
 * Converter for {@link IKeyStoreSecretEntryJson | key store secret entry} in JSON format.
 * @public
 */
export const keystoreSecretEntryJson: Converter<IKeyStoreSecretEntryJson> =
  Converters.object<IKeyStoreSecretEntryJson>(
    {
      name: Converters.string,
      key: base64String,
      description: Converters.string,
      createdAt: Converters.string
    },
    {
      optionalFields: ['description']
    }
  );

// ============================================================================
// Vault Contents Converter
// ============================================================================

/**
 * Converter for {@link IKeyStoreVaultContents | key store vault contents} (decrypted state).
 * @public
 */
export const keystoreVaultContents: Converter<IKeyStoreVaultContents> =
  Converters.object<IKeyStoreVaultContents>({
    version: keystoreFormat,
    secrets: Converters.recordOf(keystoreSecretEntryJson)
  });

// ============================================================================
// Key Store File Converter
// ============================================================================

/**
 * Converter for {@link IKeyStoreFile | encrypted key store file}.
 * @public
 */
export const keystoreFile: Converter<IKeyStoreFile> = Converters.object<IKeyStoreFile>({
  format: keystoreFormat,
  algorithm: encryptionAlgorithm,
  iv: base64String,
  authTag: base64String,
  encryptedData: base64String,
  keyDerivation: keyDerivationParams
});

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
