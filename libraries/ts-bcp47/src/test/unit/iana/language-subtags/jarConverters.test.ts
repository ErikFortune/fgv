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
 * and uncovered functions need explicit test cases.
 */
describe('IANA registry converters', () => {
  describe('registeredExtLang converter', () => {
    test('fails for a prefix with an invalid tag', () => {
      expect(
        Iana.LanguageSubtags.JarConverters.registeredExtLang.convert({
          Type: 'extlang',
          Subtag: 'aao',
          Description: ['Algerian Saharan Arabic'],
          Added: '2009-07-29',
          'Preferred-Value': 'aao',
          Prefix: ['not a language tag'],
          Macrolanguage: 'ar'
        })
      ).toFailWith(/invalid language subtag/i);
    });

    test('fails for a prefix with more than one tag', () => {
      expect(
        Iana.LanguageSubtags.JarConverters.registeredExtLang.convert({
          Type: 'extlang',
          Subtag: 'aao',
          Description: ['Algerian Saharan Arabic'],
          Added: '2009-07-29',
          'Preferred-Value': 'aao',
          Prefix: ['ar', 'abv'],
          Macrolanguage: 'ar'
        })
      ).toFailWith(/malformed extlang prefix/i);
    });
  });

  describe('loadRawSubtagRegistryFileSync function', () => {
    test('loads JAR format registry file successfully', () => {
      expect(
        Iana.LanguageSubtags.JarConverters.loadRawSubtagRegistryFileSync(
          'src/test/data/iana/language-subtag-registry.txt'
        )
      ).toSucceedAndSatisfy((registry) => {
        expect(registry.fileDate).toBe('2025-08-25');
        expect(registry.entries.length).toBeGreaterThan(9000);
        expect(registry.entries[0]).toHaveProperty('Type');
      });
    });

    test('fails for non-existent file', () => {
      expect(
        Iana.LanguageSubtags.JarConverters.loadRawSubtagRegistryFileSync(
          'src/test/data/iana/non-existent-file.txt'
        )
      ).toFailWith(/ENOENT|no such file/i);
    });
  });

  describe('loadRawSubtagRegistryFromString function', () => {
    test('loads JAR format registry from string content successfully', () => {
      const testContent = `File-Date: 2023-01-01
%%
Type: language
Subtag: en
Description: English
Added: 2005-10-16
%%
Type: language
Subtag: zh
Description: Chinese
Added: 2005-10-16
%%`;

      expect(
        Iana.LanguageSubtags.JarConverters.loadRawSubtagRegistryFromString(testContent)
      ).toSucceedAndSatisfy((registry) => {
        expect(registry.fileDate).toBe('2023-01-01');
        expect(registry.entries).toHaveLength(2);
        expect(registry.entries[0]).toMatchObject({
          Type: 'language',
          Subtag: 'en',
          Description: ['English']
        });
        expect(registry.entries[1]).toMatchObject({
          Type: 'language',
          Subtag: 'zh',
          Description: ['Chinese']
        });
      });
    });

    test('handles range formatting correctly for private use languages', () => {
      const testContentWithRange = `File-Date: 2023-01-01
%%
Type: language
Subtag: qaa..qtz
Description: Reserved for local use
Added: 2005-10-16
%%`;

      expect(
        Iana.LanguageSubtags.JarConverters.loadRawSubtagRegistryFromString(testContentWithRange)
      ).toSucceedAndSatisfy((registry) => {
        const entry = registry.entries[0];
        expect(entry.Type).toBe('language');
        if ('Subtag' in entry) {
          expect(entry.Subtag).toBe('qaa..qtz');
        }
        expect(entry.Description).toEqual(['Reserved for local use']);
      });
    });

    test('handles range formatting correctly for script ranges', () => {
      const testContentWithRange = `File-Date: 2023-01-01
%%
Type: script
Subtag: Qaaa..Qabx
Description: Reserved for private use
Added: 2005-10-16
%%`;

      expect(
        Iana.LanguageSubtags.JarConverters.loadRawSubtagRegistryFromString(testContentWithRange)
      ).toSucceedAndSatisfy((registry) => {
        const entry = registry.entries[0];
        expect(entry.Type).toBe('script');
        if ('Subtag' in entry) {
          expect(entry.Subtag).toBe('Qaaa..Qabx');
        }
      });
    });

    test('fails for malformed content', () => {
      const malformedContent = `File-Date: invalid-date
%%
Type: language
%%`;

      expect(Iana.LanguageSubtags.JarConverters.loadRawSubtagRegistryFromString(malformedContent)).toFailWith(
        /invalid year-month-date/i
      );
    });
  });
});
