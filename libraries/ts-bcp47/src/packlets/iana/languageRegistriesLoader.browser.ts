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

// Browser-safe language registry loaders
// Only includes functions that work in browser environments (no filesystem access)

import { Result, fail } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { ZipFileTree } from '@fgv/ts-extras';
import type { LanguageSubtagRegistry } from './language-subtags';
import type { LanguageTagExtensionRegistry } from './language-tag-extensions';
import type { LanguageRegistries } from './languageRegistries.browser';

// Import browser-safe factory functions instead of registry classes
import * as SubtagRegistryFactory from './language-subtags/registryFactory.browser';
import * as ExtensionRegistryFactory from './language-tag-extensions/registryFactory.browser';
import { LanguageRegistries as LanguageRegistriesImpl } from './languageRegistries.browser';

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
    .onSuccess((subtagsData) => SubtagRegistryFactory.createFromJson(subtagsData))
    .onSuccess((subtags) => {
      return fileTree
        .getFile(extensionsPath)
        .onSuccess((file) => file.getContents())
        .onSuccess((extensionsData) => ExtensionRegistryFactory.createFromJson(extensionsData))
        .onSuccess((extensions) => {
          return LanguageRegistriesImpl.create(
            subtags as unknown as LanguageSubtagRegistry,
            extensions as unknown as LanguageTagExtensionRegistry
          );
        });
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

    return SubtagRegistryFactory.createFromTxtContent(subtagsContent).onSuccess((subtags) => {
      return ExtensionRegistryFactory.createFromTxtContent(extensionsContent).onSuccess((extensions) => {
        return LanguageRegistriesImpl.create(
          subtags as unknown as LanguageSubtagRegistry,
          extensions as unknown as LanguageTagExtensionRegistry
        );
      });
    });
  } catch (error) {
    /* c8 ignore next 1 - defense in depth */
    return fail(`Network error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
