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
import * as Iana from '../../../../packlets/iana';
import { EXPECTED_REGISTRY_COUNTS, TEST_DATA_PATHS } from '../testConstants';

/**
 * Helper function to verify that a LanguageSubtagRegistry has the expected counts
 * for all registry categories.
 */
function expectRegistryToHaveExpectedCounts(tags: Iana.LanguageSubtags.LanguageSubtagRegistry): void {
  expect(tags.languages.getAllKeys()).toHaveLength(EXPECTED_REGISTRY_COUNTS.languages);
  expect(tags.extlangs.getAllKeys()).toHaveLength(EXPECTED_REGISTRY_COUNTS.extlangs);
  expect(tags.scripts.getAllKeys()).toHaveLength(EXPECTED_REGISTRY_COUNTS.scripts);
  expect(tags.regions.getAllKeys()).toHaveLength(EXPECTED_REGISTRY_COUNTS.regions);
  expect(tags.variants.getAllKeys()).toHaveLength(EXPECTED_REGISTRY_COUNTS.variants);

  expect(tags.collections.getAllKeys()).toHaveLength(EXPECTED_REGISTRY_COUNTS.collections);
  expect(tags.macrolanguages.getAllKeys()).toHaveLength(EXPECTED_REGISTRY_COUNTS.macrolanguages);
  expect(tags.privateUse.getAllKeys()).toHaveLength(EXPECTED_REGISTRY_COUNTS.privateUse);
  expect(tags.special.getAllKeys()).toHaveLength(EXPECTED_REGISTRY_COUNTS.special);

  expect(tags.grandfathered.getAllKeys()).toHaveLength(EXPECTED_REGISTRY_COUNTS.grandfathered);
  expect(tags.redundant.getAllKeys()).toHaveLength(EXPECTED_REGISTRY_COUNTS.redundant);
}

describe('LanguageSubtagRegistry class', () => {
  describe('create static method', () => {
    test('creates from a supplied a tag registry', () => {
      const registry = Iana.LanguageSubtags.JarConverters.loadJsonSubtagRegistryFileSync(
        TEST_DATA_PATHS.registryJson
      ).orThrow();
      expect(Iana.LanguageSubtags.LanguageSubtagRegistry.create(registry)).toSucceedAndSatisfy((tags) => {
        expectRegistryToHaveExpectedCounts(tags);
      });
    });
  });

  describe('load static methods', () => {
    test('loads JSON subtags', () => {
      const data = Iana.LanguageSubtags.Converters.loadLanguageSubtagsJsonFileSync(
        TEST_DATA_PATHS.subtagsJson
      );
      expect(
        data.onSuccess((d) => Iana.LanguageSubtags.LanguageSubtagRegistry.create(d))
      ).toSucceedAndSatisfy((tags) => {
        expectRegistryToHaveExpectedCounts(tags);
      });
    });

    test('loads JAR as JSON subtag registry', () => {
      const data = Iana.LanguageSubtags.JarConverters.loadJsonSubtagRegistryFileSync(
        TEST_DATA_PATHS.registryJson
      );
      expect(
        data.onSuccess((d) => Iana.LanguageSubtags.LanguageSubtagRegistry.create(d))
      ).toSucceedAndSatisfy((tags) => {
        expectRegistryToHaveExpectedCounts(tags);
      });
    });

    test('loads JAR subtag registry', () => {
      const data = Iana.LanguageSubtags.JarConverters.loadTxtSubtagRegistryFileSync(
        TEST_DATA_PATHS.registryTxt
      );
      expect(
        data.onSuccess((d) => Iana.LanguageSubtags.LanguageSubtagRegistry.create(d))
      ).toSucceedAndSatisfy((tags) => {
        expectRegistryToHaveExpectedCounts(tags);
      });
    });

    test('loads default subtag registry from embedded zip data', () => {
      expect(Iana.LanguageSubtags.LanguageSubtagRegistry.loadDefault()).toSucceedAndSatisfy((tags) => {
        expectRegistryToHaveExpectedCounts(tags);
      });
    });
  });
});
