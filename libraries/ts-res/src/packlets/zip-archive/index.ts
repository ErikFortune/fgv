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

/**
 * ZIP archive functionality for ts-res source file archives
 *
 * This packlet provides consolidated ZIP archive creation and loading functionality
 * for source files, compatible with existing tools while using fflate for
 * universal browser compatibility.
 *
 * @remarks
 * ZIP archives contain source files for resource ingestion with directory
 * structure preserved and optional validation but no processing or transformation.
 * This is distinct from ZIP bundles which contain processed resource output.
 *
 * @packageDocumentation
 */

import * as Json from './json';
import * as Convert from './convert';

// Namespaces
export { Json, Convert };

// Core classes
export { ZipArchiveCreator } from './zipArchiveCreator';
export { ZipArchiveLoader } from './zipArchiveLoader';

// Types and interfaces
export type {
  IZipArchiveOptions,
  IZipArchiveResult,
  IZipArchiveManifest,
  IZipArchiveLoadOptions,
  IZipArchiveLoadResult,
  IImportedFile,
  IImportedDirectory,
  ZipArchiveProgressCallback
} from './types';

// Format utilities
export {
  createZipArchiveManifest,
  parseZipArchiveManifest,
  validateZipArchiveManifest,
  parseZipArchiveConfiguration,
  generateZipArchiveFilename,
  normalizePath,
  getDirectoryName,
  sanitizeFilename,
  isZipFile
} from './zipArchiveFormat';

// Constants
export { ZipArchiveConstants } from './types';
