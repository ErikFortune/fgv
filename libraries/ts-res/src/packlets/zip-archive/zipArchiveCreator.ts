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
   * Create a ZIP archive buffer from file system paths
   * @param options - Input paths and configuration
   * @param onProgress - Optional progress callback
   * @returns Result containing ZIP buffer and manifest
   */
  public async createBuffer(
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

        const fileTreeResult = FileTree.forFilesystem();
        if (fileTreeResult.isFailure()) {
          return fail(`Failed to create file tree: ${fileTreeResult.message}`);
        }
        const fileTree = fileTreeResult.value;

        const itemResult = fileTree.getItem(options.input);
        if (itemResult.isFailure()) {
          return fail(`Input path does not exist: ${options.input}`);
        }
        const item = itemResult.value;

        if (item.type === 'directory') {
          // Add entire directory recursively, preserving structure
          const archivePath = `input/${item.name}`;

          const addDirResult = await this._addDirectoryTreeToZip(files, item, archivePath, onProgress);
          if (addDirResult.isFailure()) {
            return fail(addDirResult.message);
          }

          manifest = createZipArchiveManifest('directory', item.absolutePath, archivePath);
        } else if (item.type === 'file') {
          // Add single file
          const archivePath = `input/${item.name}`;

          const addFileResult = await this._addFileTreeItemToZip(files, item, archivePath);
          if (addFileResult.isFailure()) {
            return fail(addFileResult.message);
          }

          manifest = createZipArchiveManifest('file', item.absolutePath, archivePath);
        }
      }

      // Process config file using FileTree
      if (options.config) {
        onProgress?.('reading-file', 40, `Processing config: ${options.config}`);

        const fileTreeResult = FileTree.forFilesystem();
        if (fileTreeResult.isFailure()) {
          return fail(`Failed to create file tree: ${fileTreeResult.message}`);
        }
        const fileTree = fileTreeResult.value;

        const fileResult = fileTree.getFile(options.config);
        if (fileResult.isFailure()) {
          return fail(`Config file does not exist or is not a file: ${options.config}`);
        }
        const configFile = fileResult.value;

        const archivePath = `config/${configFile.name}`;

        const addConfigResult = await this._addFileTreeItemToZip(files, configFile, archivePath);
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
    const contentResult = fileItem.getRawContents();
    if (contentResult.isFailure()) {
      return fail(`Failed to read file ${fileItem.absolutePath}: ${contentResult.message}`);
    }

    const content = new TextEncoder().encode(contentResult.value);
    files[normalizePath(archivePath)] = content;
    return succeed(undefined);
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
    if (childrenResult.isFailure()) {
      return fail(`Failed to read directory ${directoryItem.absolutePath}: ${childrenResult.message}`);
    }

    for (const child of childrenResult.value) {
      const itemArchivePath = normalizePath(`${archivePrefix}/${child.name}`);

      if (child.type === 'directory') {
        // Recursively add subdirectory
        const addDirResult = await this._addDirectoryTreeToZip(files, child, itemArchivePath, onProgress);
        if (addDirResult.isFailure()) {
          return fail(addDirResult.message);
        }
      } else if (child.type === 'file') {
        // Add file
        const addFileResult = await this._addFileTreeItemToZip(files, child, itemArchivePath);
        if (addFileResult.isFailure()) {
          return fail(addFileResult.message);
        }
        onProgress?.('reading-file', 0, `Added file: ${itemArchivePath}`);
      }
    }

    return succeed(undefined);
  }
}
