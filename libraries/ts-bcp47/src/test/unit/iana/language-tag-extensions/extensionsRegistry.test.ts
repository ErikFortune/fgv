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

describe('TagExtensionRegistry class', () => {
  describe('create static method', () => {
    test('creates from a supplied a extension registry', () => {
      const registry = Iana.LanguageTagExtensions.JarConverters.loadJsonLanguageTagExtensionsRegistryFileSync(
        'src/test/data/iana/language-tag-extension-registry.json'
      ).orThrow();
      expect(Iana.LanguageTagExtensions.LanguageTagExtensionRegistry.create(registry)).toSucceedAndSatisfy(
        (tags) => {
          expect(tags.extensions.getAllKeys()).toHaveLength(2);
        }
      );
    });
  });

  describe('load static methods', () => {
    test('loads JSON subtags', () => {
      const data = Iana.LanguageTagExtensions.Converters.loadLanguageTagExtensionsJsonFileSync(
        'src/data/iana/language-tag-extensions.json'
      );
      expect(
        data.onSuccess((d) => Iana.LanguageTagExtensions.LanguageTagExtensionRegistry.create(d))
      ).toSucceedAndSatisfy((tags) => {
        expect(tags.extensions.getAllKeys()).toHaveLength(2);
      });
    });

    test('loads JAR as JSON tag extension registry', () => {
      const data = Iana.LanguageTagExtensions.JarConverters.loadJsonLanguageTagExtensionsRegistryFileSync(
        'src/test/data/iana/language-tag-extension-registry.json'
      );
      expect(
        data.onSuccess((d) => Iana.LanguageTagExtensions.LanguageTagExtensionRegistry.create(d))
      ).toSucceedAndSatisfy((tags) => {
        expect(tags.extensions.getAllKeys()).toHaveLength(2);
      });
    });

    test('loads JAR tag extension registry', () => {
      const data = Iana.LanguageTagExtensions.JarConverters.loadTxtLanguageTagExtensionsRegistryFileSync(
        'src/test/data/iana/language-tag-extension-registry.txt'
      );
      expect(
        data.onSuccess((d) => Iana.LanguageTagExtensions.LanguageTagExtensionRegistry.create(d))
      ).toSucceedAndSatisfy((tags) => {
        expect(tags.extensions.getAllKeys()).toHaveLength(2);
      });
    });

    test('loads default tag extension registry from embedded zip data', () => {
      expect(Iana.LanguageTagExtensions.LanguageTagExtensionRegistry.loadDefault()).toSucceedAndSatisfy(
        (tags) => {
          expect(tags.extensions.getAllKeys()).toHaveLength(2);
        }
      );
    });

    test('creates from TXT content', () => {
      const testContent = `File-Date: 2023-01-01
%%
Identifier: u
Description: Unicode Locale/Language Extensions
Comments: RFC 6067 describes the u extension for Unicode locale identifiers.
Added: 2010-09-02
RFC: 6067
Authority: Unicode Consortium
Contact_Email: test@example.com
Mailing_List: test-list@example.com
URL: http://example.com
%%
Identifier: t
Description: Transformed Content
Comments: RFC 6497 describes the t extension for language tag transformation.
Added: 2011-08-16
RFC: 6497
Authority: Unicode Consortium
Contact_Email: test@example.com
Mailing_List: test-list@example.com
URL: http://example.com
%%`;

      expect(
        Iana.LanguageTagExtensions.LanguageTagExtensionRegistry.createFromTxtContent(testContent)
      ).toSucceedAndSatisfy((tags) => {
        expect(tags.extensions.getAllKeys()).toHaveLength(2);
        expect(tags.extensions.getAllKeys()).toContain('u');
        expect(tags.extensions.getAllKeys()).toContain('t');
      });
    });
  });

  describe('JAR converter functions', () => {
    test('loadRawLanguageTagExtensionsRegistryFileSync loads JAR format file successfully', () => {
      expect(
        Iana.LanguageTagExtensions.JarConverters.loadRawLanguageTagExtensionsRegistryFileSync(
          'src/test/data/iana/language-tag-extension-registry.txt'
        )
      ).toSucceedAndSatisfy((registry) => {
        expect(registry.fileDate).toBe('2014-04-02');
        expect(registry.entries.length).toBeGreaterThan(0);
        expect(registry.entries[0]).toHaveProperty('Identifier');
      });
    });

    test('loadRawLanguageTagExtensionsRegistryFileSync fails for non-existent file', () => {
      expect(
        Iana.LanguageTagExtensions.JarConverters.loadRawLanguageTagExtensionsRegistryFileSync(
          'src/test/data/iana/non-existent-file.txt'
        )
      ).toFailWith(/ENOENT|no such file/i);
    });

    test('loadRawLanguageTagExtensionsRegistryFromString loads from string content successfully', () => {
      const testContent = `File-Date: 2023-01-01
%%
Identifier: u
Description: Unicode Locale/Language Extensions
Comments: RFC 6067 describes the u extension for Unicode locale identifiers.
Added: 2010-09-02
RFC: 6067
Authority: Unicode Consortium
Contact_Email: test@example.com
Mailing_List: test-list@example.com
URL: http://example.com
%%
Identifier: t
Description: Transformed Content
Comments: RFC 6497 describes the t extension for language tag transformation.
Added: 2011-08-16
RFC: 6497
Authority: Unicode Consortium
Contact_Email: test@example.com
Mailing_List: test-list@example.com
URL: http://example.com
%%`;

      expect(
        Iana.LanguageTagExtensions.JarConverters.loadRawLanguageTagExtensionsRegistryFromString(testContent)
      ).toSucceedAndSatisfy((registry) => {
        expect(registry.fileDate).toBe('2023-01-01');
        expect(registry.entries).toHaveLength(2);
        expect(registry.entries[0]).toMatchObject({
          Identifier: 'u',
          Description: ['Unicode Locale/Language Extensions']
        });
        expect(registry.entries[1]).toMatchObject({
          Identifier: 't',
          Description: ['Transformed Content']
        });
      });
    });

    test('loadRawLanguageTagExtensionsRegistryFromString fails for malformed content', () => {
      const malformedContent = `File-Date: invalid-date
%%
Identifier: u
%%`;

      expect(
        Iana.LanguageTagExtensions.JarConverters.loadRawLanguageTagExtensionsRegistryFromString(
          malformedContent
        )
      ).toFailWith(/invalid year-month-date/i);
    });
  });
});
