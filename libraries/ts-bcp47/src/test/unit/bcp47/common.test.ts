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

describe('subtagsToString helper function', () => {
  test.each([
    ['primary language', { primaryLanguage: 'en' }, 'en'],
    ['primary language and extlang', { primaryLanguage: 'zh', extlangs: ['cmn'] }, 'zh-cmn'],
    ['primary language and script', { primaryLanguage: 'en', script: 'latn' }, 'en-latn'],
    ['primary language and region', { primaryLanguage: 'en', region: '001' }, 'en-001'],
    ['primary language and variant', { primaryLanguage: 'ca', variants: ['Valencia'] }, 'ca-Valencia'],
    [
      'primary language and variants',
      { primaryLanguage: 'sl', variants: ['rozaj', 'biske'] },
      'sl-rozaj-biske'
    ],
    [
      'primary language and extension',
      { primaryLanguage: 'en', extensions: [{ singleton: 'u', value: 'en-US' }] },
      'en-u-en-US'
    ],
    [
      'primary language and extensions',
      {
        primaryLanguage: 'en',
        extensions: [
          { singleton: 'u', value: 'en-US' },
          { singleton: 't', value: 'ML' }
        ]
      },
      'en-u-en-US-t-ML'
    ],
    ['private use tag', { privateUse: ['tag', 'one'] }, 'x-tag-one'],
    [
      'private use tags',
      { primaryLanguage: 'en', privateUse: ['tag', 'one', 'tag', 'two'] },
      'en-x-tag-one-tag-two'
    ]
  ])('formats %p correctly', (__desc, value, expected) => {
    const subtags = value as Bcp47.ISubtags;
    expect(Bcp47.subtagsToString(subtags)).toBe(expected);
  });
});
