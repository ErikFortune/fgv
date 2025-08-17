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

// Node.js specific imports (conditionally loaded)
let fs: typeof import('fs') | undefined;
let path: typeof import('path') | undefined;

// Dynamically import Node.js modules if available
if (typeof require !== 'undefined') {
  try {
    fs = require('fs');
    path = require('path');
  } catch {
    // Running in browser environment
  }
}

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
    const manifest = this._loadManifestFromAccessors(zipAccessors);
    onProgress?.('loading-manifest', 100, 'Manifest loaded');

    // Load configuration
    onProgress?.('loading-config', 0, 'Loading configuration');
    const config = this._loadConfigurationFromAccessors(zipAccessors, options);
    onProgress?.('loading-config', 100, 'Configuration loaded');

    // Extract files and directory structure
    onProgress?.('extracting-files', 0, 'Extracting files');
    const filesResult = await this._extractFilesFromAccessors(zipAccessors, onProgress);
    if (filesResult.isFailure()) {
      return fail(filesResult.message);
    }

    const { files, directory } = filesResult.value;
    onProgress?.('extracting-files', 100, `Extracted ${files.length} files`);

    // TODO: Process resources if requested (future implementation)
    const processedResources: unknown = null;
    if (options.autoProcessResources) {
      onProgress?.('processing-resources', 0, 'Processing resources');
      // Future implementation: integrate with ts-res resource processing
      onProgress?.('processing-resources', 100, 'Resources processed');
    }

    onProgress?.('extracting-files', 100, 'ZIP loading complete');

    return succeed({
      manifest: manifest || undefined,
      config: options.overrideConfig || config || undefined,
      files,
      directory,
      processedResources
    });
  }

  /**
   * Load ZIP archive from file path (Node.js)
   * @param filePath - Path to ZIP file
   * @param options - Loading options
   * @param onProgress - Optional progress callback
   * @returns Result containing loaded archive data
   */
  public async loadFromPath(
    filePath: string,
    options: IZipArchiveLoadOptions = {},
    onProgress?: ZipArchiveProgressCallback
  ): Promise<Result<IZipArchiveLoadResult>> {
    if (!fs || !path) {
      return fail('File system operations not available in this environment');
    }

    onProgress?.('reading-file', 0, `Reading file: ${filePath}`);

    if (!isZipFile(filePath)) {
      return fail(`File ${filePath} is not a ZIP file`);
    }

    try {
      const resolvedPath = path!.resolve(filePath);

      if (!fs!.existsSync(resolvedPath)) {
        return fail(`ZIP file does not exist: ${resolvedPath}`);
      }

      const buffer = fs!.readFileSync(resolvedPath);
      onProgress?.('reading-file', 100, 'File read complete');

      return await this.loadFromBuffer(buffer.buffer, options, onProgress);
    } catch (error) {
      return fail(
        `Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load manifest from ZIP using ZipFileTreeAccessors
   * @param zipAccessors - ZIP file tree accessors
   * @returns Parsed manifest or null
   */
  private _loadManifestFromAccessors(
    zipAccessors: ZipFileTree.ZipFileTreeAccessors
  ): Json.IZipArchiveManifest | undefined {
    const manifestResult = zipAccessors.getFileContents('manifest.json');
    if (manifestResult.isFailure()) {
      return undefined;
    }

    const parseResult = parseZipArchiveManifest(manifestResult.value);
    return parseResult.isSuccess() ? parseResult.value : undefined;
  }

  /**
   * Load configuration from ZIP using ZipFileTreeAccessors
   * @param zipAccessors - ZIP file tree accessors
   * @param options - Loading options
   * @returns Parsed configuration or null
   */
  private _loadConfigurationFromAccessors(
    zipAccessors: ZipFileTree.ZipFileTreeAccessors,
    options: IZipArchiveLoadOptions
  ): ConfigModel.ISystemConfiguration | undefined {
    if (options.overrideConfig) {
      return options.overrideConfig;
    }

    const configResult = zipAccessors.getFileContents('config.json');
    if (configResult.isFailure()) {
      return undefined;
    }

    const parseResult = parseZipArchiveConfiguration(configResult.value);
    return parseResult.isSuccess() ? parseResult.value : undefined;
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
