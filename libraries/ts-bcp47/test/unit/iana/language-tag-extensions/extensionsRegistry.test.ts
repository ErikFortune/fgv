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

import '@fgv/ts-utils-jest';
import * as JarConverters from '../../../../src/iana/language-tag-extensions/jarConverters';
import { LanguageTagExtensionRegistry } from '../../../../src/iana/language-tag-extensions';

describe('TagExtensionRegistry class', () => {
  describe('create static method', () => {
    test('creates from a supplied a extension registry', () => {
      const registry = JarConverters.loadJsonLanguageTagExtensionsRegistryFileSync(
        'test/data/iana/language-tag-extension-registry.json'
      ).orThrow();
      expect(LanguageTagExtensionRegistry.create(registry)).toSucceedAndSatisfy((tags) => {
        expect(tags.extensions.getAllKeys()).toHaveLength(2);
      });
    });
  });

  describe('load static methods', () => {
    test('loads JSON subtags', () => {
      expect(
        LanguageTagExtensionRegistry.load('src/data/iana/language-tag-extensions.json')
      ).toSucceedAndSatisfy((tags) => {
        expect(tags.extensions.getAllKeys()).toHaveLength(2);
      });
    });

    test('loads JAR as JSON tag extension registry', () => {
      expect(
        LanguageTagExtensionRegistry.loadJsonRegistryFile(
          'test/data/iana/language-tag-extension-registry.json'
        )
      ).toSucceedAndSatisfy((tags) => {
        expect(tags.extensions.getAllKeys()).toHaveLength(2);
      });
    });

    test('loads JAR tag extension registry', () => {
      expect(
        LanguageTagExtensionRegistry.loadTxtRegistryFile('test/data/iana/language-tag-extension-registry.txt')
      ).toSucceedAndSatisfy((tags) => {
        expect(tags.extensions.getAllKeys()).toHaveLength(2);
      });
    });
  });
});
