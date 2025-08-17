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

import { Result, succeed, fail, FileTree } from '@fgv/ts-utils';
import { ZipFileTree } from '@fgv/ts-extras';
import type {
  IZipArchiveLoadOptions,
  IZipArchiveLoadResult,
  ZipArchiveProgressCallback,
  IImportedFile,
  IImportedDirectory
} from './types';
import { Model as ConfigModel } from '../config';
import * as Json from './json';
import { parseZipArchiveManifest, parseZipArchiveConfiguration, isZipFile } from './zipArchiveFormat';

/**
 * ZIP archive loader extending ts-extras foundation
 * @public
 */
export class ZipArchiveLoader {
  /**
   * Load ZIP archive from File object (Browser)
   * @param file - File object from file input
   * @param options - Loading options
   * @param onProgress - Optional progress callback
   * @returns Result containing loaded archive data
   */
  public async loadFromFile(
    file: File,
    options: IZipArchiveLoadOptions = {},
    onProgress?: ZipArchiveProgressCallback
  ): Promise<Result<IZipArchiveLoadResult>> {
    onProgress?.('reading-file', 0, `Reading file: ${file.name}`);

    if (!isZipFile(file.name)) {
      return fail(`File ${file.name} is not a ZIP file`);
    }

    try {
      const buffer = await file.arrayBuffer();
      onProgress?.('reading-file', 100, 'File read complete');

      return await this.loadFromBuffer(buffer, options, onProgress);
      /* c8 ignore next 3 - defense in depth against internal error */
    } catch (error) {
      return fail(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load ZIP archive from ArrayBuffer (Universal)
   * @param buffer - ZIP data buffer
   * @param options - Loading options
   * @param onProgress - Optional progress callback
   * @returns Result containing loaded archive data
   */
  public async loadFromBuffer(
    buffer: ArrayBuffer,
    options: IZipArchiveLoadOptions = {},
    onProgress?: ZipArchiveProgressCallback
  ): Promise<Result<IZipArchiveLoadResult>> {
    onProgress?.('parsing-zip', 0, 'Parsing ZIP archive');

    const zipAccessorsResult = ZipFileTree.ZipFileTreeAccessors.fromBuffer(buffer);
    if (zipAccessorsResult.isFailure()) {
      return fail(`Failed to parse ZIP: ${zipAccessorsResult.message}`);
    }

    const zipAccessors = zipAccessorsResult.value;
    onProgress?.('parsing-zip', 100, 'ZIP archive parsed');

    // Load manifest
    onProgress?.('loading-manifest', 0, 'Loading manifest');
    const manifestResult = this._loadManifestFromAccessors(zipAccessors);
    if (manifestResult.isFailure()) {
      return fail(manifestResult.message);
    }
    const manifest = manifestResult.value;
    onProgress?.('loading-manifest', 100, 'Manifest loaded');

    // Load configuration
    onProgress?.('loading-config', 0, 'Loading configuration');
    const configResult = this._loadConfigurationFromAccessors(zipAccessors, manifest, options);
    if (configResult.isFailure()) {
      return fail(configResult.message);
    }
    const config = configResult.value;
    onProgress?.('loading-config', 100, 'Configuration loaded');

    // Extract files and directory structure
    onProgress?.('extracting-files', 0, 'Extracting files');
    const filesResult = await this._extractFilesFromAccessors(zipAccessors, onProgress);
    /* c8 ignore next 3 - defense in depth against internal error */
    if (filesResult.isFailure()) {
      return fail(filesResult.message);
    }

    const { files, directory } = filesResult.value;
    onProgress?.('extracting-files', 100, `Extracted ${files.length} files`);

    onProgress?.('extracting-files', 100, 'ZIP loading complete');

    return succeed({
      manifest,
      config,
      files,
      directory
    });
  }

  /**
   * Load manifest from ZIP using ZipFileTreeAccessors
   * @param zipAccessors - ZIP file tree accessors
   * @returns Result containing parsed manifest
   */
  private _loadManifestFromAccessors(
    zipAccessors: ZipFileTree.ZipFileTreeAccessors
  ): Result<Json.IZipArchiveManifest | undefined> {
    const manifestResult = zipAccessors.getFileContents('manifest.json');
    if (manifestResult.isFailure()) {
      // Manifest is optional - return success with undefined
      return succeed(undefined);
    }

    const parseResult = parseZipArchiveManifest(manifestResult.value);
    if (parseResult.isFailure()) {
      return fail(`Failed to parse manifest.json: ${parseResult.message}`);
    }

    return succeed(parseResult.value);
  }

  /**
   * Load configuration from ZIP using ZipFileTreeAccessors
   * @param zipAccessors - ZIP file tree accessors
   * @param manifest - Parsed manifest (may be undefined)
   * @param options - Loading options
   * @returns Result containing parsed configuration
   */
  private _loadConfigurationFromAccessors(
    zipAccessors: ZipFileTree.ZipFileTreeAccessors,
    manifest: Json.IZipArchiveManifest | undefined,
    options: IZipArchiveLoadOptions
  ): Result<ConfigModel.ISystemConfiguration | undefined> {
    // Check if manifest specifies a config file
    const manifestSpecifiesConfig = manifest?.config !== undefined;

    if (!manifestSpecifiesConfig) {
      // If no config specified in manifest, config is optional
      return succeed(undefined);
    }

    // Get the config path from the manifest
    const configPath = manifest!.config!.archivePath;
    const configResult = zipAccessors.getFileContents(configPath);
    if (configResult.isFailure()) {
      return fail(`Manifest specifies config file at '${configPath}' but it was not found in archive`);
    }

    const parseResult = parseZipArchiveConfiguration(configResult.value);
    if (parseResult.isFailure()) {
      return fail(`Failed to parse config file '${configPath}': ${parseResult.message}`);
    }

    return succeed(parseResult.value);
  }

  /**
   * Extract files and directory structure from ZIP
   * @param zipAccessors - ZIP file tree accessors
   * @param onProgress - Optional progress callback
   * @returns Result containing files and directory structure
   */
  private async _extractFilesFromAccessors(
    zipAccessors: ZipFileTree.ZipFileTreeAccessors,
    onProgress?: ZipArchiveProgressCallback
  ): Promise<Result<{ files: IImportedFile[]; directory: IImportedDirectory | undefined }>> {
    try {
      const files: IImportedFile[] = [];
      const directories = new Map<string, IImportedDirectory>();

      // Get all children from root
      const rootChildrenResult = zipAccessors.getChildren('/');
      /* c8 ignore next 3 - defense in depth against internal error */
      if (rootChildrenResult.isFailure()) {
        return fail(`Failed to read ZIP contents: ${rootChildrenResult.message}`);
      }

      // Process all items recursively
      await this._processFileTreeItems(
        zipAccessors,
        '/',
        rootChildrenResult.value,
        files,
        directories,
        onProgress
      );

      // Build directory structure
      const directory = this._buildDirectoryStructure(files, directories);

      return succeed({ files, directory });
      /* c8 ignore next 3 - defense in depth against internal error */
    } catch (error) {
      return fail(`Failed to extract files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Recursively process file tree items
   * @param zipAccessors - ZIP file tree accessors
   * @param currentPath - Current directory path
   * @param items - Items to process
   * @param files - Files collection
   * @param directories - Directories collection
   * @param onProgress - Optional progress callback
   * @param processed - Processing counter
   */
  private async _processFileTreeItems(
    zipAccessors: ZipFileTree.ZipFileTreeAccessors,
    currentPath: string,
    items: readonly FileTree.FileTreeItem[],
    files: IImportedFile[],
    directories: Map<string, IImportedDirectory>,
    onProgress?: ZipArchiveProgressCallback,
    processed: { count: number } = { count: 0 }
  ): Promise<void> {
    for (const item of items) {
      /* c8 ignore next 1 - defense in depth */
      const itemPath = item.absolutePath.startsWith('/') ? item.absolutePath.substring(1) : item.absolutePath;

      if (item.type === 'directory') {
        // Track directory
        if (!directories.has(itemPath)) {
          directories.set(itemPath, {
            name: item.name,
            files: [],
            subdirectories: []
          });
        }

        // Recursively process children
        const childrenResult = zipAccessors.getChildren(item.absolutePath);
        if (childrenResult.isSuccess()) {
          await this._processFileTreeItems(
            zipAccessors,
            item.absolutePath,
            childrenResult.value,
            files,
            directories,
            onProgress,
            processed
          );
        }
      } else if (item.type === 'file') {
        // Get file content
        const contentResult = item.getRawContents();
        const content = contentResult.orDefault('');

        files.push({
          name: item.name,
          path: itemPath,
          content,
          type: this._getFileType(item.name)
        });
      }

      processed.count++;
      onProgress?.('extracting-files', 0, `Processing ${itemPath}`);
    }
  }

  /**
   * Build directory structure from files
   * @param files - Extracted files
   * @param directories - Directories map
   * @returns Root directory structure or null
   */
  private _buildDirectoryStructure(
    files: IImportedFile[],
    directories: Map<string, IImportedDirectory>
  ): IImportedDirectory | undefined {
    /* c8 ignore next 3 - should never happen with fflate */
    if (files.length === 0) {
      return undefined;
    }

    const rootDir: IImportedDirectory = {
      name: 'root',
      files: [],
      subdirectories: []
    };

    // Process files to build directory structure
    for (const file of files) {
      const pathParts = file.path.split('/').filter((part: string) => part.length > 0);

      /* c8 ignore next 1 - defense in depth should never happen */
      if (pathParts.length === 0) continue;

      // Ensure all parent directories exist
      let currentDir = rootDir;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const dirName = pathParts[i];
        let foundDir = currentDir.subdirectories.find((d) => d.name === dirName);

        if (!foundDir) {
          foundDir = {
            name: dirName,
            files: [],
            subdirectories: []
          };
          currentDir.subdirectories.push(foundDir);
        }

        currentDir = foundDir;
      }

      // Add file to its parent directory
      currentDir.files.push(file);
    }

    return rootDir;
  }

  /**
   * Get file MIME type based on extension
   * @param filename - Filename
   * @returns MIME type
   */
  private _getFileType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    /* c8 ignore next 20 - no need to test every one */
    switch (ext) {
      case 'json':
        return 'application/json';
      case 'yaml':
      case 'yml':
        return 'application/yaml';
      case 'xml':
        return 'application/xml';
      case 'txt':
        return 'text/plain';
      case 'md':
        return 'text/markdown';
      case 'js':
        return 'application/javascript';
      case 'ts':
        return 'application/typescript';
      default:
        return 'application/octet-stream';
    }
  }
}
