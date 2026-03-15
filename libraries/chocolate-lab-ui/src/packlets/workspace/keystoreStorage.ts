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
 * Keystore persistence layer using the FileTree abstraction.
 *
 * Provides save/load functions for persisting KeyStore files via
 * {@link FileTree.IFileTreeFileItem | IFileTreeFileItem}. The keystore vault
 * is already encrypted by the KeyStore class; this module handles
 * serialization and FileTree-based storage.
 *
 * @packageDocumentation
 */

import { captureResult, fail, Result, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { CryptoUtils } from '@fgv/ts-extras';
import { LibraryData } from '@fgv/ts-chocolate';

/**
 * Saves a keystore to a FileTree file item.
 *
 * Calls `keyStore.save(password)` to produce the encrypted vault file,
 * then serializes and writes it via the file item's `setRawContents`.
 *
 * @param keyStore - The unlocked keystore to save
 * @param password - The master password (needed to encrypt the vault)
 * @param fileItem - The FileTree file item to write to
 * @returns Success with true, or Failure with error context
 * @public
 */
export async function saveKeystoreToFile(
  keyStore: CryptoUtils.KeyStore.KeyStore,
  password: string,
  fileItem: FileTree.IMutableFileTreeFileItem
): Promise<Result<true>> {
  const saveResult = await keyStore.save(password);
  if (saveResult.isFailure()) {
    return fail(`keystore save: ${saveResult.message}`);
  }

  const jsonResult = captureResult(() => JSON.stringify(saveResult.value, null, 2));
  if (jsonResult.isFailure()) {
    return fail(`keystore serialize: ${jsonResult.message}`);
  }

  return fileItem
    .setRawContents(jsonResult.value)
    .withErrorFormat((msg) => `keystore write: ${msg}`)
    .onSuccess(() => succeed(true as const));
}

/**
 * Directory name used to store the keystore file in the FileTree.
 * The pathToKeyMap maps this directory to a dedicated localStorage key.
 * @internal
 */
const KEYSTORE_DIR: string = 'keystore';

/**
 * Finds the keystore subdirectory under the root, if it exists.
 * @internal
 */
function findKeystoreDir(root: FileTree.IFileTreeDirectoryItem): FileTree.IFileTreeDirectoryItem | undefined {
  const childrenResult = root.getChildren();
  if (childrenResult.isFailure()) {
    return undefined;
  }
  return childrenResult.value.find(
    (child): child is FileTree.IFileTreeDirectoryItem =>
      child.type === 'directory' && child.name === KEYSTORE_DIR
  );
}

/**
 * Loads a keystore file from a FileTree.
 *
 * Attempts to find the keystore file at the standard location
 * (`/keystore/keystore.json` relative to the user library root), then
 * reads, parses, and validates the keystore file format.
 *
 * Returns `undefined` (not Failure) if no keystore file exists.
 *
 * @param userLibraryTree - The root directory of the user library
 * @returns Success with IKeyStoreFile or undefined if not found, Failure on parse/validation error
 * @public
 */
export function loadKeystoreFromTree(
  userLibraryTree: FileTree.IFileTreeDirectoryItem
): Result<CryptoUtils.KeyStore.IKeyStoreFile | undefined> {
  const keystoreDir = findKeystoreDir(userLibraryTree);
  if (!keystoreDir) {
    return succeed(undefined);
  }

  const childrenResult = keystoreDir.getChildren();
  if (childrenResult.isFailure()) {
    return succeed(undefined);
  }

  const keystoreItem = childrenResult.value.find(
    (child): child is FileTree.IFileTreeFileItem =>
      child.type === 'file' && child.name === LibraryData.LibraryPaths.keyStore
  );

  if (!keystoreItem) {
    return succeed(undefined);
  }

  return keystoreItem
    .getContents()
    .withErrorFormat((msg) => `keystore read: ${msg}`)
    .onSuccess((json) =>
      CryptoUtils.KeyStore.Converters.keystoreFile
        .convert(json)
        .withErrorFormat((msg) => `keystore format: ${msg}`)
    );
}

/**
 * Gets or creates the keystore file item in a FileTree.
 *
 * If the keystore file already exists, returns it.
 * If not, creates a new file in the `/keystore/` directory.
 *
 * @param userLibraryTree - The root directory of the user library
 * @returns Success with the file item, or Failure if creation is not supported
 * @public
 */
export function getOrCreateKeystoreFileItem(
  userLibraryTree: FileTree.AnyFileTreeDirectoryItem
): Result<FileTree.IMutableFileTreeFileItem> {
  // Find or create the keystore directory
  let keystoreDir: FileTree.AnyFileTreeDirectoryItem | undefined = findKeystoreDir(userLibraryTree);
  if (!keystoreDir) {
    if (!FileTree.isMutableDirectoryItem(userLibraryTree)) {
      return fail('keystore: directory creation not supported on this tree');
    }
    const dirResult = userLibraryTree.createChildDirectory(KEYSTORE_DIR);
    if (dirResult.isFailure()) {
      return fail(`keystore dir: ${dirResult.message}`);
    }
    keystoreDir = dirResult.value;
  }

  // Look for existing file
  const childrenResult = keystoreDir.getChildren();
  if (childrenResult.isSuccess()) {
    const existing = childrenResult.value.find(
      (child) => child.type === 'file' && child.name === LibraryData.LibraryPaths.keyStore
    );
    if (existing && FileTree.isMutableFileItem(existing)) {
      return succeed(existing);
    }
  }

  // Create the file
  if (!FileTree.isMutableDirectoryItem(keystoreDir)) {
    return fail('keystore: file creation not supported on this tree');
  }

  return keystoreDir
    .createChildFile(LibraryData.LibraryPaths.keyStore, '{}')
    .withErrorFormat((msg) => `keystore create: ${msg}`);
}
