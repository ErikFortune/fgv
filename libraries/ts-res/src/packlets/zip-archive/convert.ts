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

/* eslint-disable @rushstack/typedef-var */

import { Validator, Validators, Converter, Converters } from '@fgv/ts-utils';
import * as Json from './json';
import { Model as ConfigModel, Convert as ConfigConvert } from '../config';

/**
 * Validator for ZIP archive input type
 * @public
 */
export const zipArchiveInputType: Validator<'file' | 'directory'> = Validators.enumeratedValue([
  'file',
  'directory'
] as const);

/**
 * Validator for ZIP archive config type
 * @public
 */
export const zipArchiveConfigType: Validator<'file'> = Validators.enumeratedValue(['file'] as const);

/**
 * Validator for ZIP archive input information
 * @public
 */
export const zipArchiveInputInfo: Validator<Json.IZipArchiveInputInfo> =
  Validators.object<Json.IZipArchiveInputInfo>({
    type: zipArchiveInputType,
    originalPath: Validators.string,
    archivePath: Validators.string
  });

/**
 * Validator for ZIP archive config information
 * @public
 */
export const zipArchiveConfigInfo: Validator<Json.IZipArchiveConfigInfo> =
  Validators.object<Json.IZipArchiveConfigInfo>({
    type: zipArchiveConfigType,
    originalPath: Validators.string,
    archivePath: Validators.string
  });

/**
 * Validator for ZIP archive manifest
 * Compatible with existing tools from ts-res-browser-cli
 * @public
 */
export const zipArchiveManifest: Validator<Json.IZipArchiveManifest> =
  Validators.object<Json.IZipArchiveManifest>({
    timestamp: Validators.string,
    input: zipArchiveInputInfo.optional(),
    config: zipArchiveConfigInfo.optional()
  });

/**
 * Validator for MIME type strings
 * @public
 */
export const mimeType: Validator<string> = Validators.string;

/**
 * Converter for imported file
 * @public
 */
export const importedFile: Converter<Json.IImportedFile> = Converters.strictObject<Json.IImportedFile>({
  name: Converters.string,
  path: Converters.string,
  content: Converters.string,
  type: Converters.string // MIME type as string
});

/**
 * Converter for imported directory structure (recursive)
 * Note: Uses Converter pattern because Validators don't support recursion with self parameter
 * @public
 */
export const importedDirectory: Converter<Json.IImportedDirectory> = Converters.generic<
  Json.IImportedDirectory,
  unknown
>((from: unknown, self: Converter<Json.IImportedDirectory, unknown>, context?: unknown) => {
  return Converters.strictObject<Json.IImportedDirectory>({
    name: Converters.string,
    files: Converters.arrayOf(importedFile),
    subdirectories: Converters.arrayOf(self)
  }).convert(from, context);
});

/**
 * Validator for system configuration (delegates to config packlet)
 * This validates that the parsed JSON conforms to the system configuration schema
 * @public
 */
export const systemConfiguration: Validator<ConfigModel.ISystemConfiguration> = Validators.isA(
  'system configuration',
  (value: unknown): value is ConfigModel.ISystemConfiguration => {
    return ConfigConvert.systemConfiguration.convert(value).isSuccess();
  }
);
