/*
 * Copyright (c) 2025 Erik Fortune
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
import { FileTree } from '@fgv/ts-json-base';
import {
  loadLanguageRegistries,
  loadLanguageRegistriesFromTree,
  loadLanguageRegistriesFromIanaOrg,
  loadLanguageRegistriesFromUrls,
  LanguageRegistries,
  LanguageSubtags,
  LanguageTagExtensions
} from '../../../packlets/iana';
import * as fs from 'fs';
import * as path from 'path';

describe('languageRegistriesLoader module', () => {
  // Test data paths
  const testDataDir = 'src/data/iana';
  const subtagsFile = 'language-subtags.json';
  const extensionsFile = 'language-tag-extensions.json';

  // Load test data for FileTree tests
  let testSubtagsData: unknown;
  let testExtensionsData: unknown;

  beforeAll(() => {
    // Load actual test data for FileTree tests
    const subtagsPath = path.join(testDataDir, subtagsFile);
    const extensionsPath = path.join(testDataDir, extensionsFile);

    testSubtagsData = JSON.parse(fs.readFileSync(subtagsPath, 'utf-8'));
    testExtensionsData = JSON.parse(fs.readFileSync(extensionsPath, 'utf-8'));
  });

  describe('loadLanguageRegistries function', () => {
    test('successfully loads registries from valid directory', () => {
      const result = loadLanguageRegistries(testDataDir);

      expect(result).toSucceedAndSatisfy((registries) => {
        // Verify both registries are loaded
        expect(registries.subtags).toBeDefined();
        expect(registries.extensions).toBeDefined();

        // Verify expected data structure from known test data
        expect(registries.subtags.languages.getAllKeys()).toHaveLength(8787);
        expect(registries.subtags.scripts.getAllKeys()).toHaveLength(274);
        expect(registries.subtags.regions.getAllKeys()).toHaveLength(343);

        // Verify extensions registry
        expect(registries.extensions.extensions.getAllKeys()).toHaveLength(2);
      });
    });

    test('fails with missing directory', () => {
      const result = loadLanguageRegistries('nonexistent/directory');
      expect(result).toFailWith(/ENOENT|no such file or directory/i);
    });

    test('fails with directory missing subtags file', () => {
      // Create a temporary test scenario - use a directory that exists but doesn't have the expected files
      const result = loadLanguageRegistries('src/test/unit');
      expect(result).toFailWith(/ENOENT|no such file or directory/i);
    });

    test('handles invalid file permissions gracefully', () => {
      // Test with a directory that exists but files are not readable
      // Using a file as directory path to trigger error
      const result = loadLanguageRegistries('src/test/data/iana/language-subtag-registry.json');
      expect(result).toFail();
    });
  });

  describe('loadLanguageRegistriesFromTree function', () => {
    let validFileTree: FileTree.FileTree;

    beforeEach(() => {
      // Create in-memory FileTree with test data
      const files = [
        {
          path: `/language-subtags.json`,
          contents: JSON.stringify(testSubtagsData)
        },
        {
          path: `/language-tag-extensions.json`,
          contents: JSON.stringify(testExtensionsData)
        }
      ];

      validFileTree = FileTree.inMemory(files).orThrow();
    });

    test('successfully loads registries from FileTree with default paths', () => {
      const result = loadLanguageRegistriesFromTree(validFileTree);

      expect(result).toSucceedAndSatisfy((registries) => {
        // Verify both registries are loaded
        expect(registries.subtags).toBeDefined();
        expect(registries.extensions).toBeDefined();

        // Verify expected data structure
        expect(registries.subtags.languages.getAllKeys()).toHaveLength(8787);
        expect(registries.extensions.extensions.getAllKeys()).toHaveLength(2);
      });
    });

    test('successfully loads registries with custom file paths', () => {
      // Create FileTree with custom paths
      const files = [
        {
          path: `/custom/subtags.json`,
          contents: JSON.stringify(testSubtagsData)
        },
        {
          path: `/custom/extensions.json`,
          contents: JSON.stringify(testExtensionsData)
        }
      ];

      const customFileTree = FileTree.inMemory(files).orThrow();
      const result = loadLanguageRegistriesFromTree(
        customFileTree,
        '/custom/subtags.json',
        '/custom/extensions.json'
      );

      expect(result).toSucceedAndSatisfy((registries) => {
        expect(registries.subtags.languages.getAllKeys()).toHaveLength(8787);
        expect(registries.extensions.extensions.getAllKeys()).toHaveLength(2);
      });
    });

    test('loads registries with nested directory structure', () => {
      // Test with nested paths
      const files = [
        {
          path: `/data/iana/language-subtags.json`,
          contents: JSON.stringify(testSubtagsData)
        },
        {
          path: `/data/iana/language-tag-extensions.json`,
          contents: JSON.stringify(testExtensionsData)
        }
      ];

      const nestedFileTree = FileTree.inMemory(files).orThrow();
      const result = loadLanguageRegistriesFromTree(
        nestedFileTree,
        '/data/iana/language-subtags.json',
        '/data/iana/language-tag-extensions.json'
      );

      expect(result).toSucceed();
    });

    test('fails when subtags file is missing', () => {
      // Create FileTree with only extensions file
      const files = [
        {
          path: `/language-tag-extensions.json`,
          contents: JSON.stringify(testExtensionsData)
        }
      ];

      const incompleteFileTree = FileTree.inMemory(files).orThrow();
      const result = loadLanguageRegistriesFromTree(incompleteFileTree);

      expect(result).toFailWith(/not found|missing/i);
    });

    test('fails when extensions file is missing', () => {
      // Create FileTree with only subtags file
      const files = [
        {
          path: `/language-subtags.json`,
          contents: JSON.stringify(testSubtagsData)
        }
      ];

      const incompleteFileTree = FileTree.inMemory(files).orThrow();
      const result = loadLanguageRegistriesFromTree(incompleteFileTree);

      expect(result).toFailWith(/not found|missing/i);
    });

    test('fails with invalid JSON in subtags file', () => {
      const files = [
        {
          path: `/language-subtags.json`,
          contents: '{ invalid json'
        },
        {
          path: `/language-tag-extensions.json`,
          contents: JSON.stringify(testExtensionsData)
        }
      ];

      const invalidFileTree = FileTree.inMemory(files).orThrow();
      const result = loadLanguageRegistriesFromTree(invalidFileTree);

      expect(result).toFailWith(/JSON|parse|syntax/i);
    });

    test('fails with invalid JSON in extensions file', () => {
      const files = [
        {
          path: `/language-subtags.json`,
          contents: JSON.stringify(testSubtagsData)
        },
        {
          path: `/language-tag-extensions.json`,
          contents: '{ invalid json'
        }
      ];

      const invalidFileTree = FileTree.inMemory(files).orThrow();
      const result = loadLanguageRegistriesFromTree(invalidFileTree);

      expect(result).toFailWith(/JSON|parse|syntax/i);
    });

    test('fails with malformed subtags data structure', () => {
      const files = [
        {
          path: `/language-subtags.json`,
          contents: JSON.stringify({ invalid: 'structure' })
        },
        {
          path: `/language-tag-extensions.json`,
          contents: JSON.stringify(testExtensionsData)
        }
      ];

      const malformedFileTree = FileTree.inMemory(files).orThrow();
      const result = loadLanguageRegistriesFromTree(malformedFileTree);

      expect(result).toFail();
    });

    test('fails with malformed extensions data structure', () => {
      const files = [
        {
          path: `/language-subtags.json`,
          contents: JSON.stringify(testSubtagsData)
        },
        {
          path: `/language-tag-extensions.json`,
          contents: JSON.stringify({ invalid: 'structure' })
        }
      ];

      const malformedFileTree = FileTree.inMemory(files).orThrow();
      const result = loadLanguageRegistriesFromTree(malformedFileTree);

      expect(result).toFail();
    });

    test('handles empty FileTree', () => {
      const emptyFileTree = FileTree.inMemory([]).orThrow();
      const result = loadLanguageRegistriesFromTree(emptyFileTree);

      expect(result).toFailWith(/not found|missing/i);
    });

    test('handles FileTree with directories instead of files', () => {
      // Create a FileTree that has directories where files should be
      const files = [
        {
          path: `/language-subtags.json/subfile.txt`,
          contents: 'content'
        }
      ];

      const directoryFileTree = FileTree.inMemory(files).orThrow();
      const result = loadLanguageRegistriesFromTree(directoryFileTree);

      expect(result).toFailWith(/not found|directory|not a file/i);
    });
  });

  describe('integration and data validation', () => {
    test('filesystem and FileTree loading produce equivalent results', () => {
      // Load using filesystem method
      const filesystemResult = loadLanguageRegistries(testDataDir);

      // Load using FileTree method
      const files = [
        {
          path: `/language-subtags.json`,
          contents: JSON.stringify(testSubtagsData)
        },
        {
          path: `/language-tag-extensions.json`,
          contents: JSON.stringify(testExtensionsData)
        }
      ];
      const fileTree = FileTree.inMemory(files).orThrow();
      const fileTreeResult = loadLanguageRegistriesFromTree(fileTree);

      expect(filesystemResult).toSucceed();
      expect(fileTreeResult).toSucceed();

      if (filesystemResult.isSuccess() && fileTreeResult.isSuccess()) {
        const fsRegistries = filesystemResult.value;
        const ftRegistries = fileTreeResult.value;

        // Compare key statistics to ensure equivalent loading
        expect(fsRegistries.subtags.languages.getAllKeys().length).toBe(
          ftRegistries.subtags.languages.getAllKeys().length
        );
        expect(fsRegistries.subtags.scripts.getAllKeys().length).toBe(
          ftRegistries.subtags.scripts.getAllKeys().length
        );
        expect(fsRegistries.subtags.regions.getAllKeys().length).toBe(
          ftRegistries.subtags.regions.getAllKeys().length
        );
        expect(fsRegistries.extensions.extensions.getAllKeys().length).toBe(
          ftRegistries.extensions.extensions.getAllKeys().length
        );
      }
    });

    test('loaded registries have expected data integrity', () => {
      const result = loadLanguageRegistries(testDataDir);

      expect(result).toSucceedAndSatisfy((registries) => {
        // Verify specific known entries exist
        expect(registries.subtags.languages.get('en')).toSucceed();
        expect(registries.subtags.languages.get('fr')).toSucceed();
        expect(registries.subtags.scripts.get('Latn')).toSucceed();
        expect(registries.subtags.regions.get('US')).toSucceed();

        // Verify extensions
        expect(registries.extensions.extensions.get('t')).toSucceed();
        expect(registries.extensions.extensions.get('u')).toSucceed();
      });
    });
  });

  describe('online registry loading', () => {
    // Mock sample IANA registry content
    const mockSubtagsContent = `File-Date: 2023-04-25
%%
Type: language
Subtag: en
Description: English
Added: 2005-10-16
Suppress-Script: Latn
%%
Type: language
Subtag: fr
Description: French
Added: 2005-10-16
Suppress-Script: Latn
%%
Type: script
Subtag: Latn
Description: Latin
Added: 2005-10-16
%%
Type: region
Subtag: US
Description: United States
Added: 2005-10-16
%%`;

    const mockExtensionsContent = `File-Date: 2023-04-25
%%
Identifier: t
Description: Transformed Content
Comments: RFC 6497
Added: 2009-07-29
RFC: 6497
Authority: Unicode Consortium
Contact_Email: cldr-contact@unicode.org
Mailing_List: cldr-users@unicode.org
URL: http://www.unicode.org/reports/tr35/
%%
Identifier: u
Description: Unicode Locale Extension
Comments: RFC 6067
Added: 2010-09-02
RFC: 6067
Authority: Unicode Consortium
Contact_Email: cldr-contact@unicode.org
Mailing_List: cldr-users@unicode.org
URL: http://www.unicode.org/reports/tr35/
%%`;

    beforeEach(() => {
      // Mock fetch globally
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('loadLanguageRegistriesFromUrls function', () => {
      test('successfully loads registries from URLs', async () => {
        // Mock successful fetch responses
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(mockSubtagsContent)
          })
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(mockExtensionsContent)
          });

        const result = await loadLanguageRegistriesFromUrls(
          'https://example.com/subtags',
          'https://example.com/extensions'
        );

        expect(result).toSucceedAndSatisfy((registries) => {
          expect(registries.subtags).toBeDefined();
          expect(registries.extensions).toBeDefined();

          // Verify some basic structure from our mock data
          expect(registries.subtags.languages.get('en')).toSucceed();
          expect(registries.subtags.languages.get('fr')).toSucceed();
          expect(registries.subtags.scripts.get('Latn')).toSucceed();
          expect(registries.subtags.regions.get('US')).toSucceed();

          expect(registries.extensions.extensions.get('t')).toSucceed();
          expect(registries.extensions.extensions.get('u')).toSucceed();
        });

        // Verify fetch was called with correct URLs
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenCalledWith('https://example.com/subtags');
        expect(global.fetch).toHaveBeenCalledWith('https://example.com/extensions');
      });

      test('handles subtags registry fetch failure', async () => {
        // Mock failed subtags fetch, successful extensions fetch
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found'
          })
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(mockExtensionsContent)
          });

        const result = await loadLanguageRegistriesFromUrls(
          'https://example.com/missing-subtags',
          'https://example.com/extensions'
        );

        expect(result).toFailWith(/Failed to fetch language subtags registry: 404 Not Found/i);
      });

      test('handles extensions registry fetch failure', async () => {
        // Mock successful subtags fetch, failed extensions fetch
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(mockSubtagsContent)
          })
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
          });

        const result = await loadLanguageRegistriesFromUrls(
          'https://example.com/subtags',
          'https://example.com/missing-extensions'
        );

        expect(result).toFailWith(
          /Failed to fetch language tag extensions registry: 500 Internal Server Error/i
        );
      });

      test('handles network errors', async () => {
        // Mock network error
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        const result = await loadLanguageRegistriesFromUrls(
          'https://example.com/subtags',
          'https://example.com/extensions'
        );

        expect(result).toFailWith(/Network error/i);
      });

      test('handles invalid content parsing', async () => {
        // Mock responses with invalid content
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue('Invalid content')
          })
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(mockExtensionsContent)
          });

        const result = await loadLanguageRegistriesFromUrls(
          'https://example.com/subtags',
          'https://example.com/extensions'
        );

        expect(result).toFail();
      });
    });

    describe('loadLanguageRegistriesFromIanaOrg function', () => {
      test('uses correct IANA URLs', async () => {
        // Mock successful responses
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(mockSubtagsContent)
          })
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(mockExtensionsContent)
          });

        const result = await loadLanguageRegistriesFromIanaOrg();

        expect(result).toSucceed();

        // Verify it called fetch with the correct IANA URLs
        expect(global.fetch).toHaveBeenCalledWith(
          'https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry'
        );
        expect(global.fetch).toHaveBeenCalledWith(
          'https://www.iana.org/assignments/language-tag-extensions-registry/language-tag-extensions-registry'
        );
      });
    });

    describe('LanguageRegistries static methods', () => {
      test('loadFromIanaOrg calls correct loader function', async () => {
        // Mock successful responses
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(mockSubtagsContent)
          })
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(mockExtensionsContent)
          });

        const result = await LanguageRegistries.loadFromIanaOrg();

        expect(result).toSucceed();
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      test('loadFromUrls calls correct loader function', async () => {
        // Mock successful responses
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(mockSubtagsContent)
          })
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(mockExtensionsContent)
          });

        const customSubtagsUrl = 'https://custom.example.com/subtags';
        const customExtensionsUrl = 'https://custom.example.com/extensions';

        const result = await LanguageRegistries.loadFromUrls(customSubtagsUrl, customExtensionsUrl);

        expect(result).toSucceed();
        expect(global.fetch).toHaveBeenCalledWith(customSubtagsUrl);
        expect(global.fetch).toHaveBeenCalledWith(customExtensionsUrl);
      });

      test('loadDefault loads embedded registries successfully', () => {
        const result = LanguageRegistries.loadDefault();

        expect(result).toSucceedAndSatisfy((registries) => {
          expect(registries.subtags).toBeDefined();
          expect(registries.extensions).toBeDefined();

          // Verify that default registries have content
          expect(registries.subtags.languages.getAllKeys().length).toBeGreaterThan(0);
          expect(registries.extensions.extensions.getAllKeys().length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('string-based parsing functionality', () => {
    // More comprehensive mock content for testing the parsing functionality
    const extendedMockSubtagsContent = `File-Date: 2023-04-25
%%
Type: language
Subtag: en
Description: English
Added: 2005-10-16
Suppress-Script: Latn
%%
Type: language
Subtag: fr
Description: French
Added: 2005-10-16
Suppress-Script: Latn
%%
Type: language
Subtag: de
Description: German
Added: 2005-10-16
Suppress-Script: Latn
%%
Type: script
Subtag: Latn
Description: Latin
Added: 2005-10-16
%%
Type: script
Subtag: Cyrl
Description: Cyrillic
Added: 2005-10-16
%%
Type: region
Subtag: US
Description: United States
Added: 2005-10-16
%%
Type: region
Subtag: GB
Description: United Kingdom
Added: 2005-10-16
%%
Type: variant
Subtag: 1901
Description: Traditional German orthography
Added: 2005-10-16
Prefix: de
%%`;

    const extendedMockExtensionsContent = `File-Date: 2023-04-25
%%
Identifier: t
Description: Transformed Content
Comments: RFC 6497
Added: 2009-07-29
RFC: 6497
Authority: Unicode Consortium
Contact_Email: cldr-contact@unicode.org
Mailing_List: cldr-users@unicode.org
URL: http://www.unicode.org/reports/tr35/
%%
Identifier: u
Description: Unicode Locale Extension
Comments: RFC 6067
Added: 2010-09-02
RFC: 6067
Authority: Unicode Consortium
Contact_Email: cldr-contact@unicode.org
Mailing_List: cldr-users@unicode.org
URL: http://www.unicode.org/reports/tr35/
%%`;

    describe('LanguageSubtags.LanguageSubtagRegistry.createFromTxtContent', () => {
      test('successfully parses valid IANA subtags content', () => {
        const result =
          LanguageSubtags.LanguageSubtagRegistry.createFromTxtContent(extendedMockSubtagsContent);

        expect(result).toSucceedAndSatisfy((registry) => {
          // Verify languages
          expect(registry.languages.get('en')).toSucceed();
          expect(registry.languages.get('fr')).toSucceed();
          expect(registry.languages.get('de')).toSucceed();

          // Verify scripts
          expect(registry.scripts.get('Latn')).toSucceed();
          expect(registry.scripts.get('Cyrl')).toSucceed();

          // Verify regions
          expect(registry.regions.get('US')).toSucceed();
          expect(registry.regions.get('GB')).toSucceed();

          // Verify variants
          expect(registry.variants.get('1901')).toSucceed();
        });
      });

      test('handles empty content gracefully', () => {
        const result = LanguageSubtags.LanguageSubtagRegistry.createFromTxtContent('');
        expect(result).toFail();
      });

      test('handles content with only file date', () => {
        const contentWithOnlyDate = 'File-Date: 2023-04-25\n%%';
        const result = LanguageSubtags.LanguageSubtagRegistry.createFromTxtContent(contentWithOnlyDate);

        expect(result).toSucceedAndSatisfy((registry) => {
          // Should create a valid registry even with no entries
          expect(registry.languages.getAllKeys()).toHaveLength(0);
          expect(registry.scripts.getAllKeys()).toHaveLength(0);
          expect(registry.regions.getAllKeys()).toHaveLength(0);
          expect(registry.variants.getAllKeys()).toHaveLength(0);
        });
      });

      test('fails with malformed IANA content', () => {
        const malformedContent = `File-Date: 2023-04-25
%%
Type: language
Invalid line without proper format
Subtag: en
%%`;
        const result = LanguageSubtags.LanguageSubtagRegistry.createFromTxtContent(malformedContent);
        expect(result).toFail();
      });

      test('handles content with missing file date', () => {
        const contentWithoutDate = `%%
Type: language
Subtag: en
Description: English
Added: 2005-10-16
%%`;
        const result = LanguageSubtags.LanguageSubtagRegistry.createFromTxtContent(contentWithoutDate);
        expect(result).toFail();
      });

      test('handles different line endings (CRLF vs LF)', () => {
        const contentWithCRLF = extendedMockSubtagsContent.replace(/\n/g, '\r\n');
        const result = LanguageSubtags.LanguageSubtagRegistry.createFromTxtContent(contentWithCRLF);

        expect(result).toSucceedAndSatisfy((registry) => {
          expect(registry.languages.get('en')).toSucceed();
          expect(registry.languages.get('fr')).toSucceed();
        });
      });
    });

    describe('LanguageTagExtensions.LanguageTagExtensionRegistry.createFromTxtContent', () => {
      test('successfully parses valid IANA extensions content', () => {
        const result = LanguageTagExtensions.LanguageTagExtensionRegistry.createFromTxtContent(
          extendedMockExtensionsContent
        );

        expect(result).toSucceedAndSatisfy((registry) => {
          // Verify extensions
          expect(registry.extensions.get('t')).toSucceed();
          expect(registry.extensions.get('u')).toSucceed();

          // Verify extension details
          expect(registry.extensions.get('t')).toSucceedAndSatisfy((ext) => {
            expect(ext.description).toEqual(['Transformed Content']);
          });
          expect(registry.extensions.get('u')).toSucceedAndSatisfy((ext) => {
            expect(ext.description).toEqual(['Unicode Locale Extension']);
          });
        });
      });

      test('handles empty extensions content gracefully', () => {
        const result = LanguageTagExtensions.LanguageTagExtensionRegistry.createFromTxtContent('');
        expect(result).toFail();
      });

      test('handles content with only file date', () => {
        const contentWithOnlyDate = 'File-Date: 2023-04-25\n%%';
        const result =
          LanguageTagExtensions.LanguageTagExtensionRegistry.createFromTxtContent(contentWithOnlyDate);

        expect(result).toSucceedAndSatisfy((registry) => {
          // Should create a valid registry even with no entries
          expect(registry.extensions.getAllKeys()).toHaveLength(0);
        });
      });

      test('fails with malformed IANA extensions content', () => {
        const malformedContent = `File-Date: 2023-04-25
%%
Identifier: t
Invalid line format
Description: Transformed Content
%%`;
        const result =
          LanguageTagExtensions.LanguageTagExtensionRegistry.createFromTxtContent(malformedContent);
        expect(result).toFail();
      });

      test('handles content with missing required fields', () => {
        const contentMissingFields = `File-Date: 2023-04-25
%%
Identifier: t
// Missing Description field
Added: 2009-07-29
%%`;
        const result =
          LanguageTagExtensions.LanguageTagExtensionRegistry.createFromTxtContent(contentMissingFields);
        expect(result).toFail();
      });

      test('handles different line endings (CRLF vs LF)', () => {
        const contentWithCRLF = extendedMockExtensionsContent.replace(/\n/g, '\r\n');
        const result =
          LanguageTagExtensions.LanguageTagExtensionRegistry.createFromTxtContent(contentWithCRLF);

        expect(result).toSucceedAndSatisfy((registry) => {
          expect(registry.extensions.get('t')).toSucceed();
          expect(registry.extensions.get('u')).toSucceed();
        });
      });
    });

    describe('integration between string parsing and online loading', () => {
      beforeEach(() => {
        // Mock fetch globally
        global.fetch = jest.fn();
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      test('online loading uses string parsing correctly', async () => {
        // Mock successful fetch responses with extended content
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(extendedMockSubtagsContent)
          })
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(extendedMockExtensionsContent)
          });

        const result = await loadLanguageRegistriesFromUrls(
          'https://example.com/subtags',
          'https://example.com/extensions'
        );

        expect(result).toSucceedAndSatisfy((registries) => {
          // Verify that the online loading parsed the content correctly
          expect(registries.subtags.languages.get('en')).toSucceed();
          expect(registries.subtags.languages.get('fr')).toSucceed();
          expect(registries.subtags.languages.get('de')).toSucceed();

          expect(registries.subtags.scripts.get('Latn')).toSucceed();
          expect(registries.subtags.scripts.get('Cyrl')).toSucceed();

          expect(registries.subtags.regions.get('US')).toSucceed();
          expect(registries.subtags.regions.get('GB')).toSucceed();

          expect(registries.subtags.variants.get('1901')).toSucceed();

          expect(registries.extensions.extensions.get('t')).toSucceed();
          expect(registries.extensions.extensions.get('u')).toSucceed();
        });
      });

      test('online loading fails gracefully when string parsing fails', async () => {
        // Mock responses with invalid content that should fail parsing
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue('Invalid IANA content')
          })
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(extendedMockExtensionsContent)
          });

        const result = await loadLanguageRegistriesFromUrls(
          'https://example.com/invalid-subtags',
          'https://example.com/extensions'
        );

        // Should fail because the subtags content is invalid
        expect(result).toFail();
      });
    });
  });
});
