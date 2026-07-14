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

import { Converter, Converters, succeed, Validation, Validator, Validators } from '@fgv/ts-utils';
import { base64String, encryptionAlgorithm, pbkdf2KeyDerivationParams } from '../converters';
import {
  allKeyPairAlgorithms,
  allKeyStoreFormats,
  allKeyStoreSecretTypes,
  allKeyStoreSymmetricSecretTypes,
  IKeyStoreAsymmetricEntryJson,
  IKeyStoreEntryJson,
  IKeyStoreFile,
  IKeyStoreSymmetricEntryJson,
  IKeyStoreVaultContents,
  KeyPairAlgorithm,
  KeyStoreAsymmetricSecretType,
  KeyStoreFormat,
  KeyStoreSecretType,
  KeyStoreSymmetricSecretType,
  allKeyStoreAsymmetricSecretTypes
} from './model';

// ============================================================================
// Key Store Format Converter
// ============================================================================

/**
 * Converter for {@link CryptoUtils.KeyStore.KeyStoreFormat | key store format} version.
 * @public
 */
export const keystoreFormat: Converter<KeyStoreFormat> =
  Converters.enumeratedValue<KeyStoreFormat>(allKeyStoreFormats);

// ============================================================================
// Secret Type Converters
// ============================================================================

/**
 * Converter for {@link CryptoUtils.KeyStore.KeyStoreSecretType | any key store secret type} discriminator.
 * Accepts both symmetric and asymmetric type values.
 * @public
 */
export const keystoreSecretType: Converter<KeyStoreSecretType> =
  Converters.enumeratedValue<KeyStoreSecretType>(allKeyStoreSecretTypes);

/**
 * Converter for {@link CryptoUtils.KeyStore.KeyStoreSymmetricSecretType | symmetric secret type} discriminator.
 * Accepts only `'encryption-key'` and `'api-key'`.
 * @public
 */
export const keystoreSymmetricSecretType: Converter<KeyStoreSymmetricSecretType> =
  Converters.enumeratedValue<KeyStoreSymmetricSecretType>(allKeyStoreSymmetricSecretTypes);

/**
 * Converter for {@link CryptoUtils.KeyStore.KeyStoreAsymmetricSecretType | asymmetric secret type} discriminator.
 * Accepts only `'asymmetric-keypair'`.
 * @public
 */
export const keystoreAsymmetricSecretType: Converter<KeyStoreAsymmetricSecretType> =
  Converters.enumeratedValue<KeyStoreAsymmetricSecretType>(allKeyStoreAsymmetricSecretTypes);

// ============================================================================
// Key Pair Algorithm Converter
// ============================================================================

/**
 * Converter for {@link CryptoUtils.KeyStore.KeyPairAlgorithm | key pair algorithm}.
 * @public
 */
export const keyPairAlgorithm: Converter<KeyPairAlgorithm> =
  Converters.enumeratedValue<KeyPairAlgorithm>(allKeyPairAlgorithms);

// ============================================================================
// JWK Shape Validator
// ============================================================================

/**
 * In-place shape check for a JSON Web Key. Asserts only that the input is a
 * non-array object whose `kty` discriminator is a string; every other JWK
 * field passes through untouched. This is intentionally **not** a true JWK
 * validator — per-algorithm correctness (RSA `n`/`e`, EC `crv`/`x`/`y`,
 * key-size constraints, etc.) is delegated to `crypto.subtle.importKey` at
 * first use, which is the authoritative checker. The "shape" suffix in the
 * name is the warning sign for readers expecting full validation.
 * @remarks
 * Built with `Validators.object` (in-place, non-strict) so unknown JWK fields
 * survive the round-trip; the cast to `FieldValidators<JsonWebKey>` is required
 * only because TypeScript's mapped type demands an entry for every key in
 * `JsonWebKey`. At runtime the `ObjectValidator` only inspects keys present in
 * the field-validators map.
 * @public
 */
export const jsonWebKeyShape: Validator<JsonWebKey> = Validators.object<JsonWebKey>({
  kty: Validators.string
} as Validation.Classes.FieldValidators<JsonWebKey>);

// ============================================================================
// Symmetric Secret Entry Converter
// ============================================================================

/**
 * Converter for {@link CryptoUtils.KeyStore.IKeyStoreSymmetricEntryJson | symmetric secret entry} in JSON form.
 *
 * @remarks
 * Backwards compatibility with vaults written before asymmetric-keypair
 * support: those entries may lack the `type` discriminator on the wire. To
 * keep the model type honest (`type` is required on
 * {@link CryptoUtils.KeyStore.IKeyStoreSymmetricEntryJson}, see its docs),
 * we declare `type` in `optionalFields` so the inner `Converters.object` will
 * accept input without it, then `.map()` injects the default
 * `'encryption-key'` when missing. The output therefore always carries the
 * discriminator and downstream code never sees the legacy missing-type form.
 *
 * @public
 */
export const keystoreSymmetricEntryJson: Converter<IKeyStoreSymmetricEntryJson> =
  Converters.object<IKeyStoreSymmetricEntryJson>(
    {
      name: Converters.string,
      type: keystoreSymmetricSecretType,
      key: base64String,
      description: Converters.string,
      createdAt: Converters.string
    },
    {
      // `type` is optional at the input layer for legacy-vault compatibility;
      // the .map() below normalizes by injecting the default.
      optionalFields: ['type', 'description']
    }
  ).map((entry) =>
    succeed<IKeyStoreSymmetricEntryJson>({
      ...entry,
      type: entry.type ?? 'encryption-key'
    })
  );

// ============================================================================
// Asymmetric Keypair Entry Converter
// ============================================================================

/**
 * Converter for {@link CryptoUtils.KeyStore.IKeyStoreAsymmetricEntryJson | asymmetric keypair entry} in JSON form.
 * The `publicKeyJwk` field passes through {@link CryptoUtils.KeyStore.Converters.jsonWebKeyShape | jsonWebKeyShape}
 * (shape check only — see its docs); cryptographic correctness is enforced by
 * `crypto.subtle.importKey` at use.
 * @public
 */
export const keystoreAsymmetricEntryJson: Converter<IKeyStoreAsymmetricEntryJson> =
  Converters.object<IKeyStoreAsymmetricEntryJson>({
    name: Converters.string,
    type: keystoreAsymmetricSecretType,
    id: Converters.string,
    algorithm: keyPairAlgorithm,
    publicKeyJwk: jsonWebKeyShape,
    escrowedPrivateKeyJwk: jsonWebKeyShape.optional(),
    description: Converters.string.optional(),
    createdAt: Converters.string
  });

// ============================================================================
// Discriminated-Union Entry Converter
// ============================================================================

/**
 * Discriminated-union converter for any {@link CryptoUtils.KeyStore.IKeyStoreEntryJson | key store entry} in JSON form.
 * Routes by the `type` field: `'asymmetric-keypair'` is parsed by
 * {@link CryptoUtils.KeyStore.Converters.keystoreAsymmetricEntryJson | keystoreAsymmetricEntryJson},
 * anything else (including a missing `type` field for backwards compatibility) by
 * {@link CryptoUtils.KeyStore.Converters.keystoreSymmetricEntryJson | keystoreSymmetricEntryJson}.
 * @public
 */
export const keystoreSecretEntryJson: Converter<IKeyStoreEntryJson> = Converters.oneOf<IKeyStoreEntryJson>([
  keystoreAsymmetricEntryJson,
  keystoreSymmetricEntryJson
]);

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
  keyDerivation: pbkdf2KeyDerivationParams
});
