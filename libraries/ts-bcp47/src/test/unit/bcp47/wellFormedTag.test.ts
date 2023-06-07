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
import * as Bcp47 from '../../../packlets/bcp47';

describe('BCP-47 WellFormedTag class', () => {
  describe('create static method', () => {
    describe('with string', () => {
      test.each([
        ['canonical alpha-2 language', 'en', { primaryLanguage: 'en' }],
        ['well-formed alpha-2 language', 'EN', { primaryLanguage: 'EN' }],
        ['canonical alpha-3 language', 'deu', { primaryLanguage: 'deu' }],
        ['canonical language with extlang', 'zh-cmn', { primaryLanguage: 'zh', extlangs: ['cmn'] }],
        ['canonical language with script', 'cmn-Hant', { primaryLanguage: 'cmn', script: 'Hant' }],
        ['canonical language with variant', 'de-1996', { primaryLanguage: 'de', variants: ['1996'] }],
        [
          'canonical language with multiple variants',
          'sl-rozaj-lipaw',
          { primaryLanguage: 'sl', variants: ['rozaj', 'lipaw'] }
        ],
        [
          'canonical language with extlang and script',
          'zh-cmn-Hant',
          { primaryLanguage: 'zh', extlangs: ['cmn'], script: 'Hant' }
        ],
        [
          'canonical language with script and region',
          'cmn-Hant-CN',
          { primaryLanguage: 'cmn', script: 'Hant', region: 'CN' }
        ],
        ['canonical language with region', 'en-US', { primaryLanguage: 'en', region: 'US' }],
        ['canonical language with numeric region', 'es-419', { primaryLanguage: 'es', region: '419' }],
        ['grandfathered tag', 'i-klingon', { grandfathered: 'i-klingon' }],
        [
          'single extension',
          'en-US-u-en-US',
          { primaryLanguage: 'en', region: 'US', extensions: [{ singleton: 'u', value: 'en-US' }] }
        ],
        [
          'multiple extensions',
          'en-US-u-US-t-tl',
          {
            primaryLanguage: 'en',
            region: 'US',
            extensions: [
              { singleton: 'u', value: 'US' },
              { singleton: 't', value: 'tl' }
            ]
          }
        ],
        [
          'single private tag',
          'en-US-x-pig-latin',
          { primaryLanguage: 'en', region: 'US', privateUse: ['pig', 'latin'] }
        ],
        ['only private tags', 'x-en-US-some-other-tag', { privateUse: ['en', 'US', 'some', 'other', 'tag'] }]
      ])('succeeds for %p (%p)', (__desc, tag, expected) => {
        expect(Bcp47.LanguageTag.createFromTag(tag, { validity: 'well-formed' })).toSucceedAndSatisfy(
          (wellFormed: Bcp47.LanguageTag) => {
            expect(wellFormed.subtags).toEqual(expected);
            expect(wellFormed.toString()).toEqual(tag);
          }
        );
      });

      test.each([
        ['no primary language', 'Latn', /no primary language/i],
        ['unknown grandfathered tag', 'i-dothraki', /no primary language/i],
        ['too many extlang', 'zh-cmn-han-yue-abc', /too many extlang/i],
        ['extension without subtags', 'en-US-u', /at least one subtag/i],
        ['extensions without subtags', 'en-US-u-t-translation', /at least one subtag/i],
        ['long extension subtag', 'en-US-u-veryLongTag', /malformed extension subtag/i],
        ['empty extension subtag', 'en-us-u--t-mt', /malformed extension subtag/i],
        ['private tag without subtags', 'en-US-x', /at least one subtag/i],
        ['long private subtag', 'en-US-x-veryLongTag', /malformed private-use subtag/i],
        ['empty private use subtag', 'en-US-x-tag--other', /malformed private-use subtag/i],
        ['extra subtags', 'en-US-US', /unexpected subtag/i]
      ])('fails for %p (%p)', (__desc, tag, expected) => {
        expect(Bcp47.LanguageTag.createFromTag(tag)).toFailWith(expected);
      });
    });

    describe('with subtags', () => {
      test.each([
        ['language only', { primaryLanguage: 'en' }],
        ['language and extlang', { primaryLanguage: 'ZH', extlangs: ['CMN'] }],
        ['language and script', { primaryLanguage: 'Sr', script: 'latn' }],
        ['grandfathered', { grandfathered: 'i-klingon' }],
        ['private use only', { privateUse: ['some-private-tag'] }]
      ])('succeeds for %p', (__desc, from) => {
        const subtags = from as Bcp47.ISubtags;
        expect(Bcp47.LanguageTag.createFromSubtags(subtags)).toSucceedAndSatisfy((tag: Bcp47.LanguageTag) => {
          expect(tag.subtags).toEqual(subtags);
        });
      });

      test.each([
        ['malformed primary language', { primaryLanguage: 'german' }, /malformed language/i],
        ['missing primary language', { script: 'Latn' }, /missing primary language/i],
        [
          'too many extlangs',
          { primaryLanguage: 'zh', extlangs: ['cmn', 'yue', 'abc', 'def'] },
          /too many extlang/i
        ],
        ['malformed extlang', { primaryLanguage: 'ZH', extlangs: ['Cantonese'] }, /malformed extlang/i],
        ['malformed script', { primaryLanguage: 'sr', script: 'Cyrillic' }, /malformed script/i],
        ['malformed region', { primaryLanguage: 'en', region: '1234' }, /malformed region/i],
        ['malformed variant', { primaryLanguage: 'en', variants: ['123'] }, /malformed variant/i],
        [
          'malformed extension singleton',
          { primaryLanguage: 'en', extensions: [{ singleton: '!', value: 'hello' }] },
          /malformed.*extension singleton/i
        ],
        [
          'malformed extension subtag value',
          { primaryLanguage: 'en', extensions: [{ singleton: '1', value: 'veryLongTagNotAllowed' }] },
          /malformed.*extension subtag/i
        ],
        [
          'malformed private-use tag',
          { primaryLanguage: 'en', privateUse: ['veryLongTagsNotAllowed'] },
          /malformed extended language range/i
        ]
      ])('fails for %p', (__desc, from, expected) => {
        const subtags = from as Bcp47.ISubtags;
        expect(Bcp47.LanguageTag.createFromSubtags(subtags)).toFailWith(expected);
      });
    });
  });
});
