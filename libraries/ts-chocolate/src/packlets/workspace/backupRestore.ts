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

/**
 * Backup and restore utilities for storage roots.
 *
 * Supports exporting the raw file tree of one or more storage roots to a ZIP
 * archive (for download or automated backup), and restoring from such an archive
 * into a mutable storage root.
 *
 * @packageDocumentation
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { ZipFileTree } from '@fgv/ts-extras';

import { ensureDirectoryPath } from './platformInit';

// ============================================================================
// Backup Manifest
// ============================================================================

/** Current backup format version. */
const BACKUP_VERSION: string = '1';

/** Manifest file name within the ZIP root. */
const MANIFEST_FILE: string = '_backup-manifest.json';

/**
 * Per-root entry in the backup manifest.
 * @public
 */
export interface IBackupRootEntry {
  /** The storage root ID (matches the subdirectory name in the ZIP). */
  readonly id: string;
  /** Human-readable label for this root. */
  readonly label: string;
}

/**
 * Metadata written to `_backup-manifest.json` at the root of a backup ZIP.
 * @public
 */
export interface IBackupManifest {
  /** Backup format version. */
  readonly version: string;
  /** ISO 8601 creation timestamp. */
  readonly createdAt: string;
  /** One entry per backed-up root. */
  readonly roots: ReadonlyArray<IBackupRootEntry>;
}

// ============================================================================
// Public Input / Output Types
// ============================================================================

/**
 * Input to {@link backupRoots}: a single storage root to include in the backup.
 * @public
 */
export interface IBackupRootInput {
  /** The storage root ID — used as the subdirectory name inside the ZIP. */
  readonly id: string;
  /** Human-readable label stored in the manifest. */
  readonly label: string;
  /** Root directory of the storage tree to back up. */
  readonly dir: FileTree.IFileTreeDirectoryItem;
}

/**
 * Result of a successful {@link restoreRoot} call.
 * @public
 */
export interface IRestoreResult {
  /** Total number of files written to the target root. */
  readonly filesWritten: number;
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Recursively collects all files from a directory as `{ path, contents }` pairs.
 * Paths are relative (no leading slash), separated by `/`.
 * @internal
 */
async function _collectFiles(
  dir: FileTree.IFileTreeDirectoryItem,
  prefix: string
): Promise<Result<Array<{ path: string; contents: string }>>> {
  const childrenResult = dir.getChildren();
  if (childrenResult.isFailure()) {
    return fail(`Failed to read directory '${prefix || '/'}': ${childrenResult.message}`);
  }

  const allFiles: Array<{ path: string; contents: string }> = [];

  for (const child of childrenResult.value) {
    const childPath = prefix ? `${prefix}/${child.name}` : child.name;

    if (child.type === 'directory') {
      const subResult = await _collectFiles(child as FileTree.IFileTreeDirectoryItem, childPath);
      if (subResult.isFailure()) {
        return subResult;
      }
      allFiles.push(...subResult.value);
    } else {
      const contentsResult = child.getRawContents();
      if (contentsResult.isFailure()) {
        return fail(`Failed to read file '${childPath}': ${contentsResult.message}`);
      }
      allFiles.push({ path: childPath, contents: contentsResult.value });
    }
  }

  return succeed(allFiles);
}

/**
 * Writes a single file to a mutable directory, creating or overwriting as needed.
 * @internal
 */
function _writeFile(
  dir: FileTree.IFileTreeDirectoryItem,
  fileName: string,
  contents: string,
  relativePath: string
): Result<boolean> {
  if (!FileTree.isMutableDirectoryItem(dir)) {
    return fail(`Directory for '${relativePath}' is not mutable`);
  }

  // Overwrite if the file already exists
  const childrenResult = dir.getChildren();
  if (childrenResult.isSuccess()) {
    const existing = childrenResult.value.find((c) => c.name === fileName && c.type === 'file');
    if (existing && FileTree.isMutableFileItem(existing)) {
      return existing.setRawContents(contents).onSuccess(() => succeed(true));
    }
  }

  return dir
    .createChildFile(fileName, contents)
    .withErrorFormat((msg) => `Cannot create '${relativePath}': ${msg}`)
    .onSuccess(() => succeed(true));
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Backs up one or more storage roots into a single ZIP archive.
 *
 * ZIP structure:
 * ```
 * _backup-manifest.json
 * {rootId}/
 *   data/
 *     ingredients/
 *       my-collection.yaml
 *     settings/
 *       preferences.json
 * ```
 *
 * @param roots - The storage roots to include. Each entry provides the ID, label, and root directory.
 * @returns Success with the ZIP data as a `Uint8Array`, or Failure if any file could not be read.
 * @public
 */
export async function backupRoots(roots: ReadonlyArray<IBackupRootInput>): Promise<Result<Uint8Array>> {
  const files: Array<{ path: string; contents: string }> = [];

  for (const root of roots) {
    const collected = await _collectFiles(root.dir, root.id);
    if (collected.isFailure()) {
      return fail(`Backup failed for root '${root.id}': ${collected.message}`);
    }
    files.push(...collected.value);
  }

  const manifest: IBackupManifest = {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    roots: roots.map(({ id, label }) => ({ id, label }))
  };

  files.unshift({ path: MANIFEST_FILE, contents: JSON.stringify(manifest, null, 2) });

  return ZipFileTree.createZipFromTextFiles(files);
}

/**
 * Restores files from a backup ZIP into a mutable storage root.
 *
 * Uses "merge" semantics: files from the backup are written to the target
 * directory, but existing files NOT present in the backup are left untouched.
 *
 * @param zipData - The backup ZIP as an `ArrayBuffer`.
 * @param rootId - Which root within the ZIP to restore (must match an entry in the manifest).
 * @param targetDir - The mutable destination root directory.
 * @returns Success with `{ filesWritten }`, or Failure if the ZIP is invalid or writing fails.
 * @public
 */
export async function restoreRoot(
  zipData: ArrayBuffer,
  rootId: string,
  targetDir: FileTree.IFileTreeDirectoryItem
): Promise<Result<IRestoreResult>> {
  // Open the ZIP as a read-only file tree
  const accessorsResult = await ZipFileTree.ZipFileTreeAccessors.fromBufferAsync(zipData);
  if (accessorsResult.isFailure()) {
    return fail(`Failed to open backup archive: ${accessorsResult.message}`);
  }

  const zipAccessors = accessorsResult.value;

  // Validate manifest
  const manifestResult = zipAccessors.getFileContents(`/${MANIFEST_FILE}`);
  if (manifestResult.isFailure()) {
    return fail(`Backup archive is missing manifest file ('${MANIFEST_FILE}'). Is this a valid backup?`);
  }

  let manifest: IBackupManifest;
  try {
    manifest = JSON.parse(manifestResult.value) as IBackupManifest;
  } catch {
    return fail('Backup manifest is not valid JSON.');
  }

  const rootEntry = manifest.roots.find((r) => r.id === rootId);
  if (!rootEntry) {
    const available = manifest.roots.map((r) => r.id).join(', ');
    return fail(`Root '${rootId}' not found in backup. Available roots: ${available}`);
  }

  // Navigate to the root's subdirectory in the ZIP
  const rootDirResult = zipAccessors.getItem(`/${rootId}`);
  if (rootDirResult.isFailure()) {
    return succeed({ filesWritten: 0 }); // Root present in manifest but no files — treat as empty
  }

  const rootDir = rootDirResult.value;
  if (rootDir.type !== 'directory') {
    return fail(`Expected '${rootId}' to be a directory in the backup archive.`);
  }

  // Collect all files for this root from the ZIP
  const collectResult = await _collectFiles(rootDir as FileTree.IFileTreeDirectoryItem, '');
  if (collectResult.isFailure()) {
    return fail(`Failed to read backup for root '${rootId}': ${collectResult.message}`);
  }

  const zipFiles = collectResult.value;
  if (zipFiles.length === 0) {
    return succeed({ filesWritten: 0 });
  }

  // Write each file to the target directory
  let filesWritten = 0;
  for (const { path: relativePath, contents } of zipFiles) {
    const lastSlash = relativePath.lastIndexOf('/');
    const dirPath = lastSlash >= 0 ? relativePath.slice(0, lastSlash) : '';
    const fileName = relativePath.slice(lastSlash + 1);

    // Ensure the directory exists
    const dirResult = dirPath.length > 0 ? ensureDirectoryPath(targetDir, dirPath) : succeed(targetDir);

    if (dirResult.isFailure()) {
      return fail(`Cannot create directory '${dirPath}': ${dirResult.message}`);
    }

    const writeResult = _writeFile(dirResult.value, fileName, contents, relativePath);
    if (writeResult.isFailure()) {
      return fail(writeResult.message);
    }

    filesWritten++;
  }

  return succeed({ filesWritten });
}
