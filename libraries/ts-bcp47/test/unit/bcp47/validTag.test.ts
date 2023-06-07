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

import { Bcp47 } from '../../../src';
import { Subtags } from '../../../src/bcp47';

describe('ValidTag class', () => {
  describe('create static method', () => {
    test.each([
      ['valid canonical primary language', 'en', 'en'],
      ['valid primary language', 'EN', 'en'],
      ['valid canonical extlang', 'zh-cmn', 'zh-cmn'],
      ['valid extlang', 'ZH-Yue', 'zh-yue'],
      ['private use primary language', 'qpn', 'qpn'],
      ['valid script', 'en-LATN', 'en-Latn'],
      ['private use script', 'en-Qabc', 'en-Qabc'],
      ['valid iso3166 region', 'en-aq', 'en-AQ'],
      ['valid UN M.49 region', 'es-419', 'es-419'],
      ['private use region', 'en-QX', 'en-QX'],
      ['valid variant', 'ca-ES-Valencia', 'ca-ES-valencia'],
      ['valid variants', 'sl-Rozaj-Lipaw', 'sl-rozaj-lipaw'],
      ['valid extensions', 'en-US-u-en-US-t-MT', 'en-US-u-en-US-t-mt'],
      ['valid private-use subtag', 'en-x-Pig-Latin', 'en-x-pig-latin'],
      ['valid i- grandfathered tag', 'i-ami', 'i-ami'],
      ['valid other grandfathered tag', 'en-GB-oed', 'en-GB-oed']
    ])('succeeds for %p', (_desc, tag, expected) => {
      expect(
        Bcp47.LanguageTag.createFromTag(tag, { validity: 'valid', normalization: 'canonical' })
      ).toSucceedAndSatisfy((valid: Bcp47.LanguageTag) => {
        expect(valid.toString()).toEqual(expected);
      });
    });

    test.each([
      ['invalid primary language', 'ENG', /invalid language/i],
      ['invalid extlang', 'zh-han', /invalid extlang/i],
      ['multiple extlang', 'zh-cmn-yue', /multiple extlang/i],
      ['invalid script', 'en-Aaaa', /invalid script/i],
      ['invalid region', 'es-AJ', /invalid region/i],
      ['invalid variant', 'en-US-xyzzy', /invalid variant/i],
      ['duplicate variants', 'ca-ES-valencia-valencia', /duplicate variant/i],
      ['invalid extension', 'en-US-a-extend', /invalid.*extension/i],
      ['duplicate extension', 'en-US-u-US-u-GB', /duplicate extension/i]
    ])('fails for %p', (_desc, tag, expected) => {
      expect(Bcp47.LanguageTag.createFromTag(tag, { validity: 'valid' })).toFailWith(expected);
    });
  });

  describe('validateExtlangPrefix method', () => {
    test.each([
      ['valid extlang prefix', { primaryLanguage: 'zh', extlangs: ['cmn'] }],
      ['non-canonical extlang', { primaryLanguage: 'zh', extlangs: ['Yue'] }],
      ['non-canonical prefix', { primaryLanguage: 'ZH', extlangs: ['yue'] }]
    ])('succeeds for %p', (_desc, value) => {
      const subtags = value as Subtags;
      expect(Bcp47.LanguageTag.createFromSubtags(subtags, { validity: 'strictly-valid' })).toSucceed();
    });

    test.each([
      ['missing primary language', { extlangs: ['cmn', 'yue'] }, /missing primary language/i],
      ['multiple extlang', { primaryLanguage: 'zh', extlangs: ['cmn', 'yue'] }, /multiple extlang/i],
      ['unknown extlang', { primaryLanguage: 'zh', extlangs: ['han'] }, /invalid extlang/i],
      ['invalid prefix', { primaryLanguage: 'en', extlangs: ['cmn'] }, /invalid prefix/i]
    ])('fails for %p', (_desc, value, expected) => {
      const subtags = value as Subtags;
      expect(Bcp47.LanguageTag.createFromSubtags(subtags, { validity: 'strictly-valid' })).toFailWith(
        expected
      );
    });
  });

  describe('validateVariantPrefix static method', () => {
    test.each([
      ['valid variant prefix', { primaryLanguage: 'sl', variants: ['rozaj'] }],
      ['valid non-canonical variant', { primaryLanguage: 'sl', variants: ['Rozaj'] }],
      ['valid non-canonical prefix', { primaryLanguage: 'SL', variants: ['rozaj'] }],
      ['valid successive variant prefixes', { primaryLanguage: 'sl', variants: ['rozaj', 'lipaw'] }],
      ['valid variant sequence prefixes', { primaryLanguage: 'sl', variants: ['rozaj', 'biske', '1994'] }],
      ['any prefix for variant with no registered prefix', { primaryLanguage: 'en', variants: ['alalc97'] }]
    ])('succeeds for %p', (_desc, value) => {
      const subtags = value as Subtags;
      expect(Bcp47.LanguageTag.createFromSubtags(subtags, { validity: 'valid' })).toSucceed();
    });

    test.each([
      ['unknown variant', { primaryLanguage: 'zh', variants: ['xyzzy'] }, /invalid variant/i],
      ['invalid prefix', { primaryLanguage: 'en', variants: ['rozaj'] }, /invalid prefix/i],
      ['invalid prefix sequence', { primaryLanguage: 'sl', variants: ['rozaj', '1996'] }, /invalid prefix/i]
    ])('fails for %p', (_desc, value, expected) => {
      const subtags = value as Subtags;
      expect(
        Bcp47.LanguageTag.createFromSubtags(subtags, {
          validity: 'strictly-valid',
          normalization: 'canonical'
        })
      ).toFailWith(expected);
    });
  });

  describe('validateSubtags static method', () => {
    test.each([
      ['valid canonical primary language', { primaryLanguage: 'en' }, { primaryLanguage: 'en' }],
      ['valid primary language', { primaryLanguage: 'EN' }, { primaryLanguage: 'en' }],
      [
        'valid canonical extlang',
        { primaryLanguage: 'zh', extlangs: ['yue'] },
        { primaryLanguage: 'zh', extlangs: ['yue'] }
      ],
      [
        'valid extlang',
        { primaryLanguage: 'zh', extlangs: ['Cmn'] },
        { primaryLanguage: 'zh', extlangs: ['cmn'] }
      ],
      ['private use primary language', { primaryLanguage: 'qpn' }, { primaryLanguage: 'qpn' }],
      ['valid script', { primaryLanguage: 'fr', script: 'LATN' }, { primaryLanguage: 'fr', script: 'Latn' }],
      [
        'private use script',
        { primaryLanguage: 'de', script: 'Qabc' },
        { primaryLanguage: 'de', script: 'Qabc' }
      ],
      [
        'valid iso3166 region',
        { primaryLanguage: 'en', region: 'aq' },
        { primaryLanguage: 'en', region: 'AQ' }
      ],
      [
        'valid UN M.49 region',
        { primaryLanguage: 'es', region: '419' },
        { primaryLanguage: 'es', region: '419' }
      ],
      [
        'private use region',
        { primaryLanguage: 'es', region: 'QX' },
        { primaryLanguage: 'es', region: 'QX' }
      ],
      [
        'valid variant',
        { primaryLanguage: 'es', variants: ['Valencia'] },
        { primaryLanguage: 'es', variants: ['valencia'] }
      ],
      [
        'valid variants',
        { primaryLanguage: 'es', variants: ['Valencia', 'lipaw'] },
        { primaryLanguage: 'es', variants: ['valencia', 'lipaw'] }
      ],
      ['valid private tag', { privateUse: ['Tag-one'] }, { privateUse: ['tag', 'one'] }]
    ])('succeeds for %p', (_desc, from, expected) => {
      const subtags = from as Bcp47.Subtags;
      expect(
        Bcp47.LanguageTag.createFromSubtags(subtags, { validity: 'valid', normalization: 'canonical' })
      ).toSucceedAndSatisfy((t: Bcp47.LanguageTag) => {
        expect(t.subtags).toEqual(expected);
      });
    });

    test.each([
      ['invalid primary language', { primaryLanguage: 'ENG' }, /invalid language/i],
      ['invalid extlang', { primaryLanguage: 'zh', extlangs: ['han'] }, /invalid extlang/i],
      ['multiple extlang', { primaryLanguage: 'zh', extlangs: ['Yue', 'Cmn'] }, /multiple extlang/i],
      ['invalid script', { primaryLanguage: 'en', script: 'AAAA' }, /invalid script/i],
      ['invalid region', { primaryLanguage: 'en', region: 'aj' }, /invalid region/i],
      ['invalid variant', { primaryLanguage: 'en', variants: ['xyzzy'] }, /invalid variant/i],
      ['invalid grandfathered tag', { grandfathered: 'i-dothraki' }, /invalid grandfathered/i],
      ['missing primary language', { script: 'Latn' }, /missing primary language/i]
    ])('fails for %p', (_desc, from, expected) => {
      const subtags = from as Bcp47.Subtags;
      expect(
        Bcp47.LanguageTag.createFromSubtags(subtags, { validity: 'valid', normalization: 'canonical' })
      ).toFailWith(expected);
    });
  });
});
