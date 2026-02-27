/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Save helpers for editable collections with encryption support.
 *
 * Handles the save-in-place flow:
 * 1. If collection has a secretName and the key is available, encrypt and save as JSON.
 * 2. If no secretName, save as plain YAML.
 * 3. Returns a typed result so callers can decide recovery actions on failure.
 *
 * @packageDocumentation
 */

import { fail, Result, succeed } from '@fgv/ts-utils';
import { Converters as JsonConverters, FileTree } from '@fgv/ts-json-base';

import { CryptoUtils } from '@fgv/ts-extras';
import { type CollectionId, Editing } from '@fgv/ts-chocolate';

// ============================================================================
// Save Result Types
// ============================================================================

/**
 * Outcome of a save-in-place attempt.
 * @public
 */
export type SaveOutcome = 'saved-encrypted' | 'saved-plain' | 'no-source-item';

/**
 * Successful save result with details about what happened.
 * @public
 */
export interface ISaveCollectionResult {
  /** How the file was saved */
  readonly outcome: SaveOutcome;
  /** The collection ID that was saved */
  readonly collectionId: CollectionId;
}

// ============================================================================
// Save Parameters
// ============================================================================

/**
 * Parameters for saving an editable collection.
 * @public
 */
export interface ISaveCollectionParams {
  /** The collection to save */
  readonly collection: Editing.EditableCollection<unknown, string>;

  /** KeyStore for secret lookup (optional - if absent, always saves plain) */
  readonly keyStore?: CryptoUtils.KeyStore.KeyStore;

  /** Key derivation params to embed in encrypted files (from addSecretFromPassword result) */
  readonly keyDerivation?: CryptoUtils.IKeyDerivationParams;
}

// ============================================================================
// Core Save Function
// ============================================================================

/**
 * Saves an editable collection in place.
 *
 * Strategy:
 * - If the collection has a `secretName` in its metadata and the key is available
 *   in the keystore, encrypts and saves as JSON.
 * - Otherwise saves as plain YAML.
 * - If there is no `sourceItem`, returns `no-source-item` outcome (not a failure).
 *
 * @param params - Save parameters
 * @returns Success with save details, or Failure with error context
 * @public
 */
export async function saveEditableCollection(
  params: ISaveCollectionParams
): Promise<Result<ISaveCollectionResult>> {
  const { collection, keyStore, keyDerivation } = params;
  const collectionId = collection.collectionId;

  if (!collection.sourceItem) {
    return succeed({ outcome: 'no-source-item', collectionId });
  }

  // TODO: use or create a proper helper (in ts-json base) - these sorts of tests in code are obscure and fragile
  // Check if source is a writable file
  if (!('setRawContents' in collection.sourceItem)) {
    return fail(`${collectionId}: source item is not a file`);
  }

  const fileItem = collection.sourceItem;
  const secretName = collection.metadata.secretName;

  // Try encrypted save if collection has a secretName and we have a keystore with the key
  if (secretName && keyStore) {
    const encryptResult = await tryEncryptedSave(collection, fileItem, keyStore, secretName, keyDerivation);
    if (encryptResult.isSuccess()) {
      return succeed({ outcome: 'saved-encrypted', collectionId });
    }
    // Encryption failed - fall through to plain save
  }

  // Plain YAML save
  return collection
    .serializeToYaml()
    .withErrorFormat((msg) => `${collectionId}: serialize: ${msg}`)
    .onSuccess((yaml) =>
      fileItem
        .setRawContents(yaml)
        .withErrorFormat((msg) => `${collectionId}: write: ${msg}`)
        .onSuccess(() => succeed({ outcome: 'saved-plain', collectionId }))
    );
}

// ============================================================================
// Encrypted Save Helper
// ============================================================================

/**
 * Attempts to encrypt and save a collection.
 * @internal
 */
async function tryEncryptedSave(
  collection: Editing.EditableCollection<unknown, string>,
  fileItem: FileTree.IFileTreeFileItem,
  keyStore: CryptoUtils.KeyStore.KeyStore,
  secretName: string,
  keyDerivation?: CryptoUtils.IKeyDerivationParams
): Promise<Result<true>> {
  const secretResult = keyStore.getSecret(secretName);
  if (secretResult.isFailure()) {
    return fail(`secret '${secretName}' not available: ${secretResult.message}`);
  }

  const encConfigResult = keyStore.getEncryptionConfig();
  if (encConfigResult.isFailure()) {
    return fail(`encryption config: ${encConfigResult.message}`);
  }

  // Build items record for encryption
  const items: Record<string, unknown> = {};
  for (const [key, value] of collection.entries()) {
    items[key] = value;
  }

  const contentResult = JsonConverters.jsonValue.convert(items);
  if (contentResult.isFailure()) {
    return fail(`serialize items: ${contentResult.message}`);
  }

  const encryptedResult = await CryptoUtils.createEncryptedFile({
    content: contentResult.value,
    secretName,
    key: secretResult.value.key,
    metadata: {
      collectionId: collection.collectionId,
      itemCount: collection.size
    },
    keyDerivation,
    cryptoProvider: encConfigResult.value.cryptoProvider
  });

  if (encryptedResult.isFailure()) {
    return fail(`encrypt: ${encryptedResult.message}`);
  }

  const jsonContent = JSON.stringify(encryptedResult.value, null, 2);
  return fileItem
    .setRawContents(jsonContent)
    .withErrorFormat((msg) => `write encrypted: ${msg}`)
    .onSuccess(() => succeed(true as const));
}
