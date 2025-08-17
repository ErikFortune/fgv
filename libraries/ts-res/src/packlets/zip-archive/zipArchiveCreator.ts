/*
 * Copyright (c) 2025 Erik Fortune
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

import { zipSync } from 'fflate';
import { Result, succeed, fail, FileTree } from '@fgv/ts-utils';
import type { IZipArchiveOptions, IZipArchiveResult, ZipArchiveProgressCallback } from './types';
import { createZipArchiveManifest, normalizePath } from './zipArchiveFormat';
import * as Json from './json';

/**
 * ZIP archive creator using fflate for universal compatibility
 * @public
 */
export class ZipArchiveCreator {
  /**
   * Create a ZIP archive buffer from a supplied buffer
   * @param options - Input paths and configuration
   * @param onProgress - Optional progress callback
   * @returns Result containing ZIP buffer and manifest
   */
  public async createFromBuffer(
    options: IZipArchiveOptions,
    onProgress?: ZipArchiveProgressCallback
  ): Promise<Result<IZipArchiveResult>> {
    try {
      onProgress?.('creating-zip', 0, 'Starting ZIP archive creation');

      const files: Record<string, Uint8Array> = {};
      let manifest: Json.IZipArchiveManifest = createZipArchiveManifest('file', '', '');

      // Process input files/directory using FileTree
      if (options.input) {
        onProgress?.('reading-file', 10, `Processing input: ${options.input}`);

        const { value: item, message: itemError } = FileTree.forFilesystem()
          .withErrorFormat((msg) => `Failed to create file tree: ${msg}`)
          .onSuccess((fileTree) =>
            fileTree.getItem(options.input!).withErrorFormat((msg) => `Failed to get item: ${msg}`)
          );

        /* c8 ignore next 3 - defense in depth against internal error */
        if (itemError !== undefined) {
          return fail(itemError);
        }

        if (item.type === 'directory') {
          // Add entire directory recursively, preserving structure
          const archivePath = `input/${item.name}`;

          const addDirResult = await this._addDirectoryTreeToZip(files, item, archivePath, onProgress);
          /* c8 ignore next 3 - defense in depth against internal error */
          if (addDirResult.isFailure()) {
            return fail(addDirResult.message);
          }

          manifest = createZipArchiveManifest('directory', item.absolutePath, archivePath);
        } else if (item.type === 'file') {
          // Add single file
          const archivePath = `input/${item.name}`;

          const addFileResult = await this._addFileTreeItemToZip(files, item, archivePath);
          /* c8 ignore next 3 - defense in depth against internal error */
          if (addFileResult.isFailure()) {
            return fail(addFileResult.message);
          }

          manifest = createZipArchiveManifest('file', item.absolutePath, archivePath);
        }
      }

      // Process config file using FileTree
      if (options.config) {
        onProgress?.('reading-file', 40, `Processing config: ${options.config}`);

        const { value: configFile, message: configFileError } = FileTree.forFilesystem()
          .withErrorFormat((msg) => `Failed to create file tree: ${msg}`)
          .onSuccess((fileTree) =>
            fileTree.getFile(options.config!).withErrorFormat((msg) => `Failed to get config file: ${msg}`)
          );

        /* c8 ignore next 3 - defense in depth against internal error */
        if (configFileError !== undefined) {
          return fail(configFileError);
        }

        const archivePath = `config/${configFile.name}`;

        const addConfigResult = await this._addFileTreeItemToZip(files, configFile, archivePath);
        /* c8 ignore next 3 - defense in depth against internal error */
        if (addConfigResult.isFailure()) {
          return fail(addConfigResult.message);
        }

        // Update manifest with config info
        manifest.config = {
          type: 'file',
          originalPath: configFile.absolutePath,
          archivePath
        };
      }

      // Add manifest to ZIP
      onProgress?.('creating-zip', 70, 'Adding manifest');
      const manifestJson = JSON.stringify(manifest, null, 2);
      files['manifest.json'] = new TextEncoder().encode(manifestJson);

      // Create ZIP buffer using fflate
      onProgress?.('creating-zip', 80, 'Compressing files');
      const zipBuffer = zipSync(files, { level: 6 });

      const result: IZipArchiveResult = {
        zipBuffer,
        manifest,
        size: zipBuffer.length
      };

      onProgress?.('creating-zip', 100, 'ZIP archive buffer created');

      return succeed(result);
    } catch (error) {
      /* c8 ignore next 3 - defense in depth against internal error */
      return fail(`Failed to create ZIP archive: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add a single FileTree item to the ZIP archive
   * @param files - ZIP files collection
   * @param fileItem - FileTree file item to add
   * @param archivePath - Path within the archive
   * @returns Result indicating success or failure
   */
  private async _addFileTreeItemToZip(
    files: Record<string, Uint8Array>,
    fileItem: FileTree.IFileTreeFileItem,
    archivePath: string
  ): Promise<Result<void>> {
    return fileItem.getRawContents().onSuccess((content) => {
      const contentBuffer = new TextEncoder().encode(content);
      files[normalizePath(archivePath)] = contentBuffer;
      return succeed(undefined);
    });
  }

  /**
   * Add a directory recursively to the ZIP archive using FileTree
   * @param files - ZIP files collection
   * @param directoryItem - FileTree directory item to add
   * @param archivePrefix - Prefix path within the archive
   * @param onProgress - Optional progress callback
   * @returns Result indicating success or failure
   */
  private async _addDirectoryTreeToZip(
    files: Record<string, Uint8Array>,
    directoryItem: FileTree.IFileTreeDirectoryItem,
    archivePrefix: string,
    onProgress?: ZipArchiveProgressCallback
  ): Promise<Result<void>> {
    const childrenResult = directoryItem.getChildren();
    /* c8 ignore next 3 - defense in depth against internal error */
    if (childrenResult.isFailure()) {
      return fail(`Failed to read directory ${directoryItem.absolutePath}: ${childrenResult.message}`);
    }

    for (const child of childrenResult.value) {
      const itemArchivePath = normalizePath(`${archivePrefix}/${child.name}`);

      if (child.type === 'directory') {
        // Recursively add subdirectory
        const addDirResult = await this._addDirectoryTreeToZip(files, child, itemArchivePath, onProgress);
        /* c8 ignore next 3 - defense in depth against internal error */
        if (addDirResult.isFailure()) {
          return fail(addDirResult.message);
        }
      } else if (child.type === 'file') {
        // Add file
        const addFileResult = await this._addFileTreeItemToZip(files, child, itemArchivePath);
        /* c8 ignore next 3 - defense in depth against internal error */
        if (addFileResult.isFailure()) {
          return fail(addFileResult.message);
        }
        onProgress?.('reading-file', 0, `Added file: ${itemArchivePath}`);
      }
    }

    return succeed(undefined);
  }
}
