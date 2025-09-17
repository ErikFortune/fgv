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

import { Result, captureResult } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { LanguageSubtagRegistry } from './language-subtags';
import { LanguageTagExtensionRegistry } from './language-tag-extensions';
import { LanguageRegistries } from './languageRegistries';
import path from 'path';

/**
 * Loads language registries from filesystem.
 * @param root - The root directory containing the registry JSON files.
 * @returns A Result containing the loaded LanguageRegistries or an error.
 * @public
 */
export function loadLanguageRegistries(root: string): Result<LanguageRegistries> {
  return captureResult(() => {
    const subtags = LanguageSubtagRegistry.load(path.join(root, 'language-subtags.json')).orThrow();
    const extensions = LanguageTagExtensionRegistry.load(
      path.join(root, 'language-tag-extensions.json')
    ).orThrow();
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
