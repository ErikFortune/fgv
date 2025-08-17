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
import { Result, succeed, fail } from '@fgv/ts-utils';
import type { IZipArchiveOptions, IZipArchiveResult, ZipArchiveProgressCallback } from './types';
import { createZipArchiveManifest, generateZipArchiveFilename, normalizePath } from './zipArchiveFormat';
import * as Json from './json';

// Node.js specific imports (conditionally loaded)
let fs: typeof import('fs') | undefined;
let path: typeof import('path') | undefined;
let os: typeof import('os') | undefined;

// Dynamically import Node.js modules if available
if (typeof require !== 'undefined') {
  try {
    fs = require('fs');
    path = require('path');
    os = require('os');
  } catch {
    // Running in browser environment
  }
}

/**
 * ZIP archive creator using fflate for universal compatibility
 * @public
 */
export class ZipArchiveCreator {
  /**
   * Create a ZIP archive from file system paths (compatible with existing ZipArchiver)
   * @param options - Input paths and configuration (matches existing ZipArchiveOptions)
   * @param onProgress - Optional progress callback
   * @returns Result containing ZIP buffer and manifest
   */
  public async create(
    options: IZipArchiveOptions,
    onProgress?: ZipArchiveProgressCallback
  ): Promise<Result<IZipArchiveResult>> {
    try {
      onProgress?.('creating-zip', 0, 'Starting ZIP archive creation');

      // Validate environment for file system operations
      if (!fs || !path || !os) {
        return fail('File system operations not available in this environment');
      }

      const files: Record<string, Uint8Array> = {};
      let manifest: Json.IZipArchiveManifest = createZipArchiveManifest('file', '', '');

      // Process input files/directory
      if (options.input) {
        onProgress?.('reading-file', 10, `Processing input: ${options.input}`);

        const inputPath = path.resolve(options.input);

        if (!fs.existsSync(inputPath)) {
          return fail(`Input path does not exist: ${inputPath}`);
        }

        const stats = fs.statSync(inputPath);

        if (stats.isDirectory()) {
          // Add entire directory recursively, preserving structure
          const dirName = path.basename(inputPath);
          const archivePath = `input/${dirName}`;

          const addDirResult = this._addDirectoryToZip(files, inputPath, archivePath, onProgress);
          if (addDirResult.isFailure()) {
            return fail(addDirResult.message);
          }

          manifest = createZipArchiveManifest('directory', inputPath, archivePath);
        } else if (stats.isFile()) {
          // Add single file
          const fileName = path.basename(inputPath);
          const archivePath = `input/${fileName}`;

          const addFileResult = this._addFileToZip(files, inputPath, archivePath);
          if (addFileResult.isFailure()) {
            return fail(addFileResult.message);
          }

          manifest = createZipArchiveManifest('file', inputPath, archivePath);
        } else {
          return fail(`Input path is not a file or directory: ${inputPath}`);
        }
      }

      // Process config file
      if (options.config) {
        onProgress?.('reading-file', 40, `Processing config: ${options.config}`);

        const configPath = path.resolve(options.config);

        if (!fs.existsSync(configPath)) {
          return fail(`Config file does not exist: ${configPath}`);
        }

        const stats = fs.statSync(configPath);
        if (!stats.isFile()) {
          return fail(`Config path must be a file: ${configPath}`);
        }

        const fileName = path.basename(configPath);
        const archivePath = `config/${fileName}`;

        const addConfigResult = this._addFileToZip(files, configPath, archivePath);
        if (addConfigResult.isFailure()) {
          return fail(addConfigResult.message);
        }

        // Update manifest with config info
        manifest.config = {
          type: 'file',
          originalPath: configPath,
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

      // Save to file if outputDir is specified
      if (options.outputDir) {
        onProgress?.('saving-file', 90, 'Saving ZIP file');

        const outputDir = path.resolve(options.outputDir);

        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const zipFileName = generateZipArchiveFilename();
        const zipPath = path.join(outputDir, zipFileName);

        fs.writeFileSync(zipPath, zipBuffer);
        result.filePath = zipPath;

        onProgress?.('saving-file', 100, `ZIP saved to: ${zipPath}`);
      } else {
        onProgress?.('creating-zip', 100, 'ZIP archive created in memory');
      }

      return succeed(result);
    } catch (error) {
      return fail(`Failed to create ZIP archive: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add a single file to the ZIP archive
   * @param files - ZIP files collection
   * @param filePath - Path to the file to add
   * @param archivePath - Path within the archive
   * @returns Result indicating success or failure
   */
  private _addFileToZip(
    files: Record<string, Uint8Array>,
    filePath: string,
    archivePath: string
  ): Result<void> {
    try {
      if (!fs) {
        return fail('File system not available');
      }

      const content = fs.readFileSync(filePath);
      files[normalizePath(archivePath)] = content;
      return succeed(undefined);
    } catch (error) {
      return fail(
        `Failed to add file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Add a directory recursively to the ZIP archive
   * @param files - ZIP files collection
   * @param dirPath - Path to the directory to add
   * @param archivePrefix - Prefix path within the archive
   * @param onProgress - Optional progress callback
   * @returns Result indicating success or failure
   */
  private _addDirectoryToZip(
    files: Record<string, Uint8Array>,
    dirPath: string,
    archivePrefix: string,
    onProgress?: ZipArchiveProgressCallback
  ): Result<void> {
    try {
      if (!fs || !path) {
        return fail('File system not available');
      }

      const addDirectoryRecursive = (currentPath: string, currentPrefix: string): void => {
        const items = fs!.readdirSync(currentPath);

        for (const item of items) {
          const itemPath = path!.join(currentPath, item);
          const itemArchivePath = normalizePath(`${currentPrefix}/${item}`);
          const stats = fs!.statSync(itemPath);

          if (stats.isDirectory()) {
            // Recursively add subdirectory
            addDirectoryRecursive(itemPath, itemArchivePath);
          } else if (stats.isFile()) {
            // Add file
            const content = fs!.readFileSync(itemPath);
            files[itemArchivePath] = content;
            onProgress?.('reading-file', 0, `Added file: ${itemArchivePath}`);
          }
        }
      };

      addDirectoryRecursive(dirPath, archivePrefix);
      return succeed(undefined);
    } catch (error) {
      return fail(
        `Failed to add directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
