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
import * as Bcp47 from '../../../../packlets/bcp47';

describe('choose helper method', () => {
  interface IFilterTest {
    description: string;
    desired: Bcp47.LanguageSpec[];
    available: Bcp47.LanguageSpec[];
    expected: Bcp47.LanguageSpec[];
    options?: Bcp47.ILanguageTagInitOptions & Bcp47.ILanguageChooserOptions;
  }

  const tests: IFilterTest[] = [
    {
      description: 'exact matching languages',
      desired: ['en-US', 'de-DE', 'es-419'],
      available: ['es-419', 'fr-FR'],
      expected: ['es-419'],
      options: undefined
    },
    {
      description: 'matching available languages in order matching "desired" parameter',
      desired: ['en-US', 'de-DE', 'es-419'],
      available: ['es-MX', 'en-US'],
      expected: ['en-US', 'es-MX']
    },
    {
      description:
        'matching desired languages in order matching "desired" parameter if use is desiredLanguage',
      desired: ['en-US', 'de-DE', 'es-419'],
      available: ['es-MX', 'en-US'],
      expected: ['en-US', 'es-419'],
      options: { use: 'desiredLanguage' }
    },
    {
      description: 'partial match',
      desired: ['en-US'],
      available: ['en', 'en-GB', 'de', 'es', 'fr'],
      expected: ['en']
    },
    {
      description: 'matches with > 10 desired languages',
      desired: ['en-GB', 'nl', 'de-DE', 'de-AT', 'fr', 'es', 'pt', 'pl', 'cs', 'hu', 'it'],
      available: ['it'],
      expected: ['it']
    },
    {
      description: 'best match if multiple available languages match - neutral',
      desired: ['en-AU'],
      available: ['en-US', 'en-CA', 'en-GB', 'en'],
      expected: ['en']
    },
    {
      description: 'best match if multiple available languages match - affinity',
      desired: ['en-AU'],
      available: ['en-US', 'en-CA', 'en-GB'],
      expected: ['en-GB']
    },
    {
      description: 'all matches if filter option is "none"',
      desired: ['en-AU'],
      available: ['en-US', 'en-CA', 'en-GB', 'en'],
      expected: ['en', 'en-GB', 'en-CA', 'en-US'],
      options: { filter: 'none' }
    },
    {
      description: 'matches grandfathered tags',
      desired: ['i-klingon'],
      available: ['x-dothraki', 'i-klingon'],
      expected: ['i-klingon']
    },
    {
      description: 'matches private-use tags',
      desired: ['x-some-tag'],
      available: ['x-other-tag', 'x-some-tag'],
      expected: ['x-some-tag']
    },
    {
      description: 'empty list if no languages match',
      desired: ['de'],
      available: ['en-US'],
      expected: []
    },
    {
      description: 'ultimate fallback if no languages match',
      desired: ['de'],
      available: ['en-US'],
      expected: ['fr'],
      options: { ultimateFallback: 'fr' }
    },
    {
      description: 'ultimate fallback as language tag',
      desired: ['de'],
      available: ['en-US'],
      expected: ['fr-FR'],
      options: { ultimateFallback: Bcp47.tag('fr-FR').orDefault() }
    }
  ];

  test.each(tests)('filter($desired, $available) yields $expected ($description)', (tc) => {
    expect(Bcp47.choose(tc.desired, tc.available, tc.options)).toSucceedAndSatisfy(
      (filtered: Bcp47.LanguageTag[]) => {
        expect(filtered.map((f) => f.tag)).toEqual(tc.expected);
      }
    );
  });
});
