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
  allKeyStoreSecretTypes,
  IKeyStoreFile,
  IKeyStoreSecretEntryJson,
  IKeyStoreVaultContents,
  KEYSTORE_FORMAT,
  KeyStoreFormat,
  KeyStoreSecretType
} from './model';

// ============================================================================
// Key Store Format Converter
// ============================================================================

/**
 * Converter for {@link CryptoUtils.KeyStore.KeyStoreFormat | key store format} version.
 * @public
 */
export const keystoreFormat: Converter<KeyStoreFormat> = Converters.enumeratedValue<KeyStoreFormat>([
  KEYSTORE_FORMAT
]);

// ============================================================================
// Secret Type Converter
// ============================================================================

/**
 * Converter for {@link CryptoUtils.KeyStore.KeyStoreSecretType | key store secret type} discriminator.
 * @public
 */
export const keystoreSecretType: Converter<KeyStoreSecretType> =
  Converters.enumeratedValue<KeyStoreSecretType>(allKeyStoreSecretTypes);

// ============================================================================
// Secret Entry Converters
// ============================================================================

/**
 * Converter for {@link CryptoUtils.KeyStore.IKeyStoreSecretEntryJson | key store secret entry} in JSON format.
 * The `type` field is optional for backwards compatibility — missing means `'encryption-key'`.
 * @public
 */
export const keystoreSecretEntryJson: Converter<IKeyStoreSecretEntryJson> =
  Converters.object<IKeyStoreSecretEntryJson>(
    {
      name: Converters.string,
      type: keystoreSecretType,
      key: base64String,
      description: Converters.string,
      createdAt: Converters.string
    },
    {
      optionalFields: ['type', 'description']
    }
  );

// ============================================================================
// Vault Contents Converter
// ============================================================================

/**
 * Converter for {@link CryptoUtils.KeyStore.IKeyStoreVaultContents | key store vault contents} (decrypted state).
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
 * Converter for {@link CryptoUtils.KeyStore.IKeyStoreFile | encrypted key store file}.
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
