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

import { Model as ConfigModel } from '../config';
import * as Json from './json';

/**
 * Options for creating a ZIP archive (compatible with existing ZipArchiver)
 * @public
 */
export interface IZipArchiveOptions {
  /** File or directory path to include in the archive */
  input?: string;
  /** Optional configuration file path */
  config?: string;
  /** Optional output directory for saving the archive file */
  outputDir?: string;
}

/**
 * Standardized ZIP archive manifest format (compatible with existing tools)
 * @public
 */
export type IZipArchiveManifest = Json.IZipArchiveManifest;

/**
 * Result of ZIP archive creation
 * @public
 */
export interface IZipArchiveResult {
  /** Raw ZIP data buffer */
  zipBuffer: Uint8Array;
  /** Archive manifest with metadata */
  manifest: IZipArchiveManifest;
  /** Total ZIP size in bytes */
  size: number;
  /** Optional file path if saved to disk */
  filePath?: string;
}

/**
 * Options for loading a ZIP archive
 * @public
 */
export interface IZipArchiveLoadOptions {
  /** Automatically process resources using ts-res */
  autoProcessResources?: boolean;

  /** Override configuration for processing */
  overrideConfig?: ConfigModel.ISystemConfiguration;

  /** Validate manifest strictly */
  strictManifestValidation?: boolean;
}

/**
 * Result of ZIP archive loading
 * @public
 */
export interface IZipArchiveLoadResult {
  /** Parsed archive manifest */
  manifest: IZipArchiveManifest | undefined;
  /** Loaded configuration */
  config: ConfigModel.ISystemConfiguration | undefined;
  /** All files extracted from the archive */
  files: IImportedFile[];
  /** Directory structure if available */
  directory: IImportedDirectory | undefined;
  /** Auto-processed resources if requested */
  processedResources?: unknown; // ProcessedResources type from ui-components
}

/**
 * Imported file representation
 * @public
 */
export type IImportedFile = Json.IImportedFile;

/**
 * Imported directory structure
 * @public
 */
export type IImportedDirectory = Json.IImportedDirectory;

/**
 * Progress callback for ZIP operations
 * @public
 */
export type ZipArchiveProgressCallback = (
  stage:
    | 'reading-file'
    | 'parsing-zip'
    | 'loading-manifest'
    | 'loading-config'
    | 'extracting-files'
    | 'processing-resources'
    | 'creating-zip'
    | 'saving-file',
  progress: number, // 0-100
  details: string
) => void;

/**
 * Constants for ZIP archive structure
 * @public
 */
export const ZipArchiveConstants = {
  /** Manifest file name */
  MANIFEST_FILE: 'manifest.json',
  /** Configuration file name */
  CONFIG_FILE: 'config.json',
  /** Input files directory */
  INPUT_DIR: 'input',
  /** Configuration files directory */
  CONFIG_DIR: 'config'
} as const;
