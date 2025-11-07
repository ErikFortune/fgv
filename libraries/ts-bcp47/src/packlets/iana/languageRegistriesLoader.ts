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
import { FileTree } from '@fgv/ts-json-base';
import { ZipFileTree } from '@fgv/ts-extras';
import { LanguageSubtagRegistry } from './language-subtags';
import * as LanguageSubtagsConverters from './language-subtags/converters';
import { LanguageTagExtensionRegistry } from './language-tag-extensions';
import * as LanguageTagExtensionsConverters from './language-tag-extensions/converters';
import { LanguageRegistries } from './languageRegistries';
import { loadLanguageRegistriesFromTree } from './languageRegistriesLoaderBrowser';
import path from 'path';
import fs from 'fs';

/**
 * Loads language registries from filesystem.
 * @param root - The root directory containing the registry JSON files or path to a ZIP file.
 * @returns A Result containing the loaded LanguageRegistries or an error.
 * @public
 */
export function loadLanguageRegistries(root: string): Result<LanguageRegistries> {
  // Check if root is a ZIP file
  if (root.toLowerCase().endsWith('.zip')) {
    return loadLanguageRegistriesFromZip(root);
  }

  // Handle directory with individual JSON files
  return captureResult(() => {
    const subtagsData = LanguageSubtagsConverters.loadLanguageSubtagsJsonFileSync(
      path.join(root, 'language-subtags.json')
    ).orThrow();
    const subtags = LanguageSubtagRegistry.create(subtagsData).orThrow();

    const extensionsData = LanguageTagExtensionsConverters.loadLanguageTagExtensionsJsonFileSync(
      path.join(root, 'language-tag-extensions.json')
    ).orThrow();
    const extensions = LanguageTagExtensionRegistry.create(extensionsData).orThrow();

    return LanguageRegistries.create(subtags, extensions).orThrow();
  });
}

/**
 * Loads language registries from a ZIP file containing the registry JSON files.
 * @param zipPath - Path to the ZIP file containing language-subtags.json and language-tag-extensions.json.
 * @param subtagsPath - Path to the language-subtags.json file within the ZIP (default: 'language-subtags.json').
 * @param extensionsPath - Path to the language-tag-extensions.json file within the ZIP (default: 'language-tag-extensions.json').
 * @returns A Result containing the loaded LanguageRegistries or an error.
 * @public
 */
export function loadLanguageRegistriesFromZip(
  zipPath: string,
  subtagsPath: string = 'language-subtags.json',
  extensionsPath: string = 'language-tag-extensions.json'
): Result<LanguageRegistries> {
  return captureResult(() => {
    // Read the ZIP file
    const zipBuffer = fs.readFileSync(zipPath);

    // Create ZIP file tree accessors
    const zipAccessors = ZipFileTree.ZipFileTreeAccessors.fromBuffer(zipBuffer).orThrow();

    // Create FileTree from ZIP accessors
    const fileTree = FileTree.FileTree.create(zipAccessors).orThrow();

    // Use existing tree loading function
    return loadLanguageRegistriesFromTree(fileTree, subtagsPath, extensionsPath).orThrow();
  });
}
