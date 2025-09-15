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

import { Result, captureResult } from '@fgv/ts-utils';
import { Model as ConfigModel } from '../config';
import * as Json from './json';
import * as Convert from './convert';

/**
 * Create a ZIP archive manifest object
 * @param inputType - Type of input (file or directory)
 * @param originalPath - Original file/directory path
 * @param archivePath - Path within the archive
 * @param configPath - Optional configuration file path
 * @returns ZIP archive manifest
 * @public
 */
export function createZipArchiveManifest(
  inputType: 'file' | 'directory',
  originalPath: string,
  archivePath: string,
  configPath?: string
): Json.IZipArchiveManifest {
  const manifest: Json.IZipArchiveManifest = {
    timestamp: new Date().toISOString(),
    input: {
      type: inputType,
      originalPath,
      archivePath
    }
  };

  if (configPath) {
    manifest.config = {
      type: 'file',
      originalPath: configPath,
      archivePath: 'config.json'
    };
  }

  return manifest;
}

/**
 * Parse and validate a ZIP archive manifest
 * @param manifestData - JSON string containing manifest data
 * @returns Result containing validated manifest
 * @public
 */
export function parseZipArchiveManifest(manifestData: string): Result<Json.IZipArchiveManifest> {
  return captureResult(() => {
    const parsed = JSON.parse(manifestData);
    return parsed;
  })
    .onSuccess((parsed) => Convert.zipArchiveManifest.validate(parsed))
    .withErrorFormat((e) => `Failed to parse ZIP archive manifest: ${e}`);
}

/**
 * Validate a ZIP archive manifest object
 * @param manifest - Object to validate as manifest
 * @returns Result containing validated manifest
 * @public
 */
export function validateZipArchiveManifest(manifest: unknown): Result<Json.IZipArchiveManifest> {
  return Convert.zipArchiveManifest.validate(manifest);
}

/**
 * Parse and validate configuration JSON
 * @param configData - JSON string containing configuration
 * @returns Result containing validated configuration
 * @public
 */
export function parseZipArchiveConfiguration(configData: string): Result<ConfigModel.ISystemConfiguration> {
  return captureResult(() => {
    const parsed = JSON.parse(configData);
    return parsed;
  })
    .onSuccess((parsed) => Convert.systemConfiguration.validate(parsed))
    .withErrorFormat((e) => `Failed to parse ZIP archive configuration: ${e}`);
}

/**
 * Generate a timestamp-based filename for ZIP archives
 * @param customName - Optional custom name prefix
 * @returns Generated filename
 * @public
 */
export function generateZipArchiveFilename(customName?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
  return customName ? `${customName}-${timestamp}.zip` : `ts-res-archive-${timestamp}.zip`;
}

/**
 * Normalize path separators for cross-platform compatibility
 * @param path - Path to normalize
 * @returns Normalized path
 * @public
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}

/**
 * Extract directory name from a file path
 * @param path - File path
 * @returns Directory name
 * @public
 */
export function getDirectoryName(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  return parts[parts.length - 1] || 'archive';
}

/**
 * Create a safe filename by removing invalid characters
 * @param filename - Original filename
 * @returns Sanitized filename
 * @public
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

/**
 * Validate ZIP file extension
 * @param filename - Filename to validate
 * @returns True if filename has .zip extension
 * @public
 */
export function isZipFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.zip');
}
