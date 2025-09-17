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
import { loadLanguageRegistries, loadLanguageRegistriesFromTree } from '../../../packlets/iana';
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
        expect(registries.subtags.languages.getAllKeys()).toHaveLength(8759);
        expect(registries.subtags.scripts.getAllKeys()).toHaveLength(261);
        expect(registries.subtags.regions.getAllKeys()).toHaveLength(342);

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
        expect(registries.subtags.languages.getAllKeys()).toHaveLength(8759);
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
        expect(registries.subtags.languages.getAllKeys()).toHaveLength(8759);
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
});
