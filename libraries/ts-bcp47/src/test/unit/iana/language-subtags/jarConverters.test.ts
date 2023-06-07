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

/*
 * Most converters are tested indirectly via other tests, but a few error cases
 * need explicit test cases.
 */
describe('IANA registry converters', () => {
  describe('registeredExtLang converter', () => {
    test('fails for a prefix with an invalid tag', () => {
      expect(
        Iana.LanguageSubtags.JarConverters.registeredExtLang.convert({
          /* eslint-disable @typescript-eslint/naming-convention */
          Type: 'extlang',
          Subtag: 'aao',
          Description: ['Algerian Saharan Arabic'],
          Added: '2009-07-29',
          'Preferred-Value': 'aao',
          Prefix: ['not a language tag'],
          Macrolanguage: 'ar'
          /* eslint-enable @typescript-eslint/naming-convention */
        })
      ).toFailWith(/invalid language subtag/i);
    });

    test('fails for a prefix with more than one tag', () => {
      expect(
        Iana.LanguageSubtags.JarConverters.registeredExtLang.convert({
          /* eslint-disable @typescript-eslint/naming-convention */
          Type: 'extlang',
          Subtag: 'aao',
          Description: ['Algerian Saharan Arabic'],
          Added: '2009-07-29',
          'Preferred-Value': 'aao',
          Prefix: ['ar', 'abv'],
          Macrolanguage: 'ar'
          /* eslint-enable @typescript-eslint/naming-convention */
        })
      ).toFailWith(/malformed extlang prefix/i);
    });
  });
});
