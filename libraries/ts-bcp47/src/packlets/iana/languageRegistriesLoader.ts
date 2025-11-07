/*
 * Copyright (c) 2022 Erik Fortune
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

import { Result, captureResult, fail } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { ZipFileTree } from '@fgv/ts-extras';
import { LanguageSubtagRegistry } from './language-subtags';
import * as LanguageSubtagsConverters from './language-subtags/converters';
import { LanguageTagExtensionRegistry } from './language-tag-extensions';
import * as LanguageTagExtensionsConverters from './language-tag-extensions/converters';
import { LanguageRegistries } from './languageRegistries';
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
 * Loads language registries from a FileTree (web-compatible).
 * @param fileTree - The FileTree containing the registry JSON files.
 * @param subtagsPath - Path to the language-subtags.json file within the tree.
 * @param extensionsPath - Path to the language-tag-extensions.json file within the tree.
 * @returns A Result containing the loaded LanguageRegistries or an error.
 * @public
 */
export function loadLanguageRegistriesFromTree(
  fileTree: FileTree.FileTree,
  subtagsPath: string = 'language-subtags.json',
  extensionsPath: string = 'language-tag-extensions.json'
): Result<LanguageRegistries> {
  return fileTree
    .getFile(subtagsPath)
    .onSuccess((file) => file.getContents())
    .onSuccess((subtagsData) => LanguageSubtagRegistry.createFromJson(subtagsData))
    .onSuccess((subtags) => {
      return fileTree
        .getFile(extensionsPath)
        .onSuccess((file) => file.getContents())
        .onSuccess((extensionsData) => LanguageTagExtensionRegistry.createFromJson(extensionsData))
        .onSuccess((extensions) => {
          return LanguageRegistries.create(subtags, extensions);
        });
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

/**
 * Loads language registries from a ZIP buffer containing the registry JSON files (web-compatible).
 * @param zipBuffer - ArrayBuffer or Uint8Array containing the ZIP file data.
 * @param subtagsPath - Path to the language-subtags.json file within the ZIP (default: 'language-subtags.json').
 * @param extensionsPath - Path to the language-tag-extensions.json file within the ZIP (default: 'language-tag-extensions.json').
 * @returns A Result containing the loaded LanguageRegistries or an error.
 * @public
 */
export function loadLanguageRegistriesFromZipBuffer(
  zipBuffer: ArrayBuffer | Uint8Array,
  subtagsPath: string = 'language-subtags.json',
  extensionsPath: string = 'language-tag-extensions.json'
): Result<LanguageRegistries> {
  return ZipFileTree.ZipFileTreeAccessors.fromBuffer(zipBuffer)
    .onSuccess((zipAccessors) => {
      return FileTree.FileTree.create(zipAccessors);
    })
    .onSuccess((fileTree) => {
      return loadLanguageRegistriesFromTree(fileTree, subtagsPath, extensionsPath);
    });
}

/**
 * Loads language registries from the IANA.org online registries.
 * @returns A Promise with a Result containing the loaded LanguageRegistries or an error.
 * @public
 */
export async function loadLanguageRegistriesFromIanaOrg(): Promise<Result<LanguageRegistries>> {
  const subtagsUrl = 'https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry';
  const extensionsUrl =
    'https://www.iana.org/assignments/language-tag-extensions-registry/language-tag-extensions-registry';

  return loadLanguageRegistriesFromUrls(subtagsUrl, extensionsUrl);
}

/**
 * Loads language registries from custom URLs.
 * @param subtagsUrl - URL to the language subtags registry.
 * @param extensionsUrl - URL to the language tag extensions registry.
 * @returns A Promise with a Result containing the loaded LanguageRegistries or an error.
 * @public
 */
export async function loadLanguageRegistriesFromUrls(
  subtagsUrl: string,
  extensionsUrl: string
): Promise<Result<LanguageRegistries>> {
  try {
    // Fetch both registries in parallel
    const [subtagsResponse, extensionsResponse] = await Promise.all([
      fetch(subtagsUrl),
      fetch(extensionsUrl)
    ]);

    if (!subtagsResponse.ok) {
      return fail(
        `Failed to fetch language subtags registry: ${subtagsResponse.status} ${subtagsResponse.statusText}`
      );
    }

    if (!extensionsResponse.ok) {
      return fail(
        `Failed to fetch language tag extensions registry: ${extensionsResponse.status} ${extensionsResponse.statusText}`
      );
    }

    const [subtagsContent, extensionsContent] = await Promise.all([
      subtagsResponse.text(),
      extensionsResponse.text()
    ]);

    return LanguageSubtagRegistry.createFromTxtContent(subtagsContent).onSuccess((subtags) => {
      return LanguageTagExtensionRegistry.createFromTxtContent(extensionsContent).onSuccess((extensions) => {
        return LanguageRegistries.create(subtags, extensions);
      });
    });
  } catch (error) {
    /* c8 ignore next 1 - defense in depth */
    return fail(`Network error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
