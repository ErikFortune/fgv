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
import { LanguageSimilarityMatcher, tagSimilarity } from '../../../../src/bcp47/match';
import { LanguageTag, LanguageTagInitOptions } from '../../../../src/bcp47/languageTag';
import { Bcp47 } from '../../../../src';

describe('LanguageSimilarityComparer class', () => {
  describe('matchLanguageTags method', () => {
    const matcher = new LanguageSimilarityMatcher();

    test.each([
      { description: 'exact primary language match', l1: 'en', l2: 'En', expected: tagSimilarity.exact },
      {
        description: 'undetermined primary language match',
        l1: 'und',
        l2: 'En',
        expected: tagSimilarity.undetermined
      },
      { description: 'extlang match', l1: 'zh-cmn', l2: 'zh-Cmn', expected: tagSimilarity.exact },
      {
        description: 'extlang and no extlang do not match',
        l1: 'zh',
        l2: 'zh-cmn',
        expected: tagSimilarity.none
      },
      { description: 'extlang mismatch', l1: 'zh-Cmn', l2: 'zh-yue', expected: tagSimilarity.none },
      {
        description: 'extlang length mismatch',
        l1: 'zh-cmn-yue',
        l2: 'zh-cmn',
        expected: tagSimilarity.none
      },
      {
        description: 'exact language and script match',
        l1: 'zh-hans',
        l2: 'zh-Hans',
        expected: tagSimilarity.exact
      },
      {
        description: 'language and suppressed script match',
        l1: 'en',
        l2: 'en-latn',
        expected: tagSimilarity.exact
      },
      {
        description: 'invalid language has no suppressed script',
        l1: 'zzz-Latn',
        l2: 'zzz',
        expected: tagSimilarity.none
      },
      { description: 'script mismatch', l1: 'zh-hans', l2: 'zh-hant', expected: tagSimilarity.none },
      { description: 'suppressed script mismatch', l1: 'en-Cyrl', l2: 'en', expected: tagSimilarity.none },
      {
        description: 'undetermined matches any script',
        l1: 'und',
        l2: 'zh-hans',
        expected: tagSimilarity.undetermined
      },
      {
        description: 'undetermined with script matches that script',
        l1: 'und-hans',
        l2: 'zh-hans',
        expected: tagSimilarity.undetermined
      },
      {
        description: 'undetermined with script does not match other scripts',
        l1: 'und-hant',
        l2: 'zh-hans',
        expected: tagSimilarity.undetermined
      },
      { description: 'region matches', l1: 'en-US', l2: 'en-us', expected: tagSimilarity.exact },
      {
        description: 'region is partial match with neutral',
        l1: 'en-US',
        l2: 'en',
        expected: tagSimilarity.neutralRegion
      },
      {
        description: 'region is partial match with global',
        l1: 'en-US',
        l2: 'en-001',
        expected: tagSimilarity.neutralRegion
      },
      {
        description: 'global is exact match with region neutral',
        l1: 'en',
        l2: 'en-001',
        expected: tagSimilarity.exact
      },
      {
        description: 'macro-region match with area is partial',
        l1: 'es-419',
        l2: 'es-AR',
        expected: tagSimilarity.macroRegion
      },
      {
        description: 'macro-region match with area order is irrelevant',
        l1: 'es-AR',
        l2: 'es-419',
        expected: tagSimilarity.macroRegion
      },
      {
        description: 'macro-region match with region is partial',
        l1: 'es-019',
        l2: 'es-419',
        expected: tagSimilarity.macroRegion
      },
      {
        description: 'macro-region match with region order is irrelevant',
        l1: 'es-419',
        l2: 'es-019',
        expected: tagSimilarity.macroRegion
      },
      {
        description: 'region mismatch is partial',
        l1: 'en-US',
        l2: 'en-GB',
        expected: tagSimilarity.sibling
      },
      {
        description: 'variants match is exact',
        l1: 'ca-valencia',
        l2: 'ca-Valencia',
        expected: tagSimilarity.exact
      },
      {
        description: 'variant is partial match with no variant',
        l1: 'ca-valencia',
        l2: 'ca',
        expected: tagSimilarity.region
      },
      {
        description: 'variant mismatch is partial match',
        l1: 'ca-valencia',
        l2: 'ca-variant',
        expected: tagSimilarity.region
      },
      {
        description: 'variant partial match with no variant does not override region',
        l1: 'ca-valencia',
        l2: 'ca-ES',
        expected: tagSimilarity.neutralRegion
      },
      {
        description: 'language affinity applies for related languages',
        l1: 'en-AU',
        l2: 'en-CA',
        expected: tagSimilarity.affinity
      },
      {
        description: 'preferred language affinity applies for related languages if one is primary',
        l1: 'en-GB',
        l2: 'en-AU',
        expected: tagSimilarity.preferredAffinity
      },
      {
        description: 'language affinity does not apply for unrelated languages',
        l1: 'en-US',
        l2: 'en-GB',
        expected: tagSimilarity.sibling
      },
      {
        description: 'preferredRegion match if one tag is preferred region',
        l1: 'fr-BE',
        l2: 'fr-FR',
        expected: tagSimilarity.preferredRegion
      },
      {
        description: 'sibling match if neither region is preferred region',
        l1: 'fr-BE',
        l2: 'fr-CA',
        expected: tagSimilarity.sibling
      },
      {
        description: 'extension exact match is exact',
        l1: 'en-US-u-GB',
        l2: 'en-US-u-GB',
        expected: tagSimilarity.exact
      },
      {
        description: 'extension singleton mismatch is partial',
        l1: 'en-US-u-GB',
        l2: 'en-US-t-GB',
        expected: tagSimilarity.variant
      },
      {
        description: 'extension value mismatch is partial',
        l1: 'en-US-u-GB',
        l2: 'en-US-u-CA',
        expected: tagSimilarity.variant
      },
      {
        description: 'extension count mismatch is partial',
        l1: 'en-US-u-GB-t-MT',
        l2: 'en-US-u-gb',
        expected: tagSimilarity.variant
      },
      {
        description: 'extension mismatch is partial',
        l1: 'en-US-u-GB',
        l2: 'en-US-t-MT',
        expected: tagSimilarity.variant
      },
      {
        description: 'private tag match is exact',
        l1: 'en-US-x-some-tag',
        l2: 'en-US-x-some-tag',
        expected: tagSimilarity.exact
      },
      {
        description: 'extra private tag is partial',
        l1: 'en-US',
        l2: 'en-US-x-some-tag',
        expected: tagSimilarity.variant
      },
      {
        description: 'private tag mismatch is partial',
        l1: 'en-US-x-tag1',
        l2: 'en-US-x-tag2',
        expected: tagSimilarity.variant
      },
      {
        description: 'exact full private tag match',
        l1: 'x-some-tag',
        l2: 'x-Some-Tag',
        expected: tagSimilarity.exact
      },
      {
        description: 'exact valid grandfathered tag match',
        l1: 'i-klingon',
        l2: 'i-Klingon',
        expected: tagSimilarity.exact
      },
      { description: 'non-matching primary language', l1: 'en', l2: 'fr', expected: tagSimilarity.none },
      {
        description: 'non-matching private tags',
        l1: 'x-some-tag',
        l2: 'x-some-other-tag',
        expected: tagSimilarity.none
      },
      {
        description: 'private and non-private do not match',
        l1: 'x-en-US',
        l2: 'en-US',
        expected: tagSimilarity.none
      },
      {
        description: 'does not match preferred form of language if preferred normalization is not specified',
        l1: 'id',
        l2: 'in',
        expected: tagSimilarity.none
      },
      {
        description: 'matches preferred form of language if preferred normalization specified',
        l1: 'id',
        l2: 'in',
        expected: tagSimilarity.exact,
        options: { normalization: 'preferred' } as LanguageTagInitOptions
      },
      {
        description: 'does not match preferred form of region if preferred normalization is not specified',
        l1: 'my-BU',
        l2: 'my-MM',
        expected: tagSimilarity.sibling
      },
      {
        description: 'matches preferred form of region if preferred normalization specified',
        l1: 'my-BU',
        l2: 'my-MM',
        expected: tagSimilarity.exact,
        options: { normalization: 'preferred' } as LanguageTagInitOptions
      },
      {
        description:
          'does not match preferred form of grandfathered tag if preferred normalization is not specified',
        l1: 'i-klingon',
        l2: 'tlh',
        expected: tagSimilarity.none
      },
      {
        description: 'matches preferred form of grandfathered tag if preferred normalization specified',
        l1: 'i-klingon',
        l2: 'tlh',
        expected: tagSimilarity.exact,
        options: { normalization: 'preferred' } as LanguageTagInitOptions
      },
      {
        description: 'matching variant does not override mismatched region',
        l1: 'ca-ES-valencia',
        l2: 'ca-FR-valencia',
        expected: tagSimilarity.sibling
      }
    ])('"$l1"/"$l2" yields $expected ($description)', (tc) => {
      const lt1 = LanguageTag.create(tc.l1, tc.options).orThrow();
      const lt2 = LanguageTag.create(tc.l2, tc.options).orThrow();

      expect(matcher.matchLanguageTags(lt1, lt2)).toBe(tc.expected);
    });
  });

  describe('torture tests', () => {
    test.each([
      {
        description: 'single variant match overrides affinity or preference',
        base: 'ca-ES-valencia',
        compare: [
          { lang: 'ca-ES', similarity: tagSimilarity.region },
          { lang: 'ca-valencia', similarity: tagSimilarity.neutralRegion },
          { lang: 'ca-150-valencia', similarity: tagSimilarity.macroRegion },
          { lang: 'ca-ES-valencia', similarity: tagSimilarity.exact }
        ],
        expectedOrder: ['ca-ES-valencia', 'ca-ES', 'ca-150-valencia', 'ca-valencia']
      }
    ])(`Match "$base" against yields order "$expectedOrder"`, (tc) => {
      const base = Bcp47.tag(tc.base).orThrow();
      for (const t of tc.compare) {
        expect(Bcp47.similarity(base, t.lang).orThrow()).toEqual(t.similarity);
      }

      const langs = tc.compare
        .map((t) => Bcp47.tag(t.lang).orThrow())
        .sort((l1, l2) => Bcp47.similarity(base, l2).orThrow() - Bcp47.similarity(tc.base, l1).orThrow());
      expect(langs.map((l) => l.tag)).toEqual(tc.expectedOrder);
    });
  });
});
