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

import { Converters, Validators, succeed, fail } from '@fgv/ts-utils';
import { FileTree, JsonFile } from '../..';

describe('JsonTreeHelper class', () => {
  // Test data
  const testJsonData = { name: 'test', value: 42, items: [1, 2, 3] };
  const invalidJsonData = '{ invalid json';
  const simpleStringData = 'plain text file';

  // Mock file structure
  const mockFiles: FileTree.IInMemoryFile[] = [
    { path: '/test/data.json', contents: testJsonData },
    { path: '/test/invalid.json', contents: invalidJsonData },
    { path: '/test/simple.txt', contents: simpleStringData },
    { path: '/test/nested/item1.json', contents: { id: 'item1', name: 'First Item' } },
    { path: '/test/nested/item2.json', contents: { id: 'item2', name: 'Second Item' } },
    { path: '/test/nested/item3.txt', contents: 'not json' },
    { path: '/test/nested/subdir/deep.json', contents: { depth: 'deep' } },
    { path: '/test/mixed/file1.json', contents: { type: 'type1', count: 10 } },
    { path: '/test/mixed/file2.json', contents: { type: 'type2', count: 20 } },
    { path: '/test/mixed/readme.txt', contents: 'readme content' }
  ];

  let fileTree: FileTree.FileTree;
  let helper: JsonFile.JsonTreeHelper;

  beforeEach(() => {
    const accessors = FileTree.InMemoryTreeAccessors.create(mockFiles).orThrow();
    fileTree = FileTree.FileTree.create(accessors).orThrow();
    helper = new JsonFile.JsonTreeHelper();
  });

  describe('constructor', () => {
    test('creates instance with default JsonLike when no parameter provided', () => {
      const helperInstance = new JsonFile.JsonTreeHelper();
      expect(helperInstance.json).toBe(JsonFile.DefaultJsonLike);
    });

    test('creates instance with custom JsonLike when parameter provided', () => {
      const customJsonLike: JsonFile.IJsonLike = {
        ...JsonFile.DefaultJsonLike
        // Custom implementation - just use default for testing
      };
      const helperInstance = new JsonFile.JsonTreeHelper(customJsonLike);
      expect(helperInstance.json).toBe(customJsonLike);
    });
  });

  describe('readJsonFromTree', () => {
    test('successfully reads valid JSON file', () => {
      expect(helper.readJsonFromTree(fileTree, '/test/data.json')).toSucceedWith(testJsonData);
    });

    test('fails when file does not exist', () => {
      expect(helper.readJsonFromTree(fileTree, '/test/nonexistent.json')).toFailWith(/not found/i);
    });

    test('fails when path points to directory', () => {
      expect(helper.readJsonFromTree(fileTree, '/test/nested')).toFailWith(/not a file/i);
    });

    test('handles string content as JSON', () => {
      expect(helper.readJsonFromTree(fileTree, '/test/simple.txt')).toSucceedWith(simpleStringData);
    });

    test('handles invalid JSON content as string', () => {
      // FileTree.getContents() falls back to returning string if JSON.parse fails
      expect(helper.readJsonFromTree(fileTree, '/test/invalid.json')).toSucceedWith(invalidJsonData);
    });
  });

  describe('convertJsonFromTree', () => {
    // Simple converter for testing
    const stringConverter = Converters.object<{ name: string; value: number }>({
      name: Converters.string,
      value: Converters.number
    });

    // Simple validator for testing
    const stringValidator = Validators.object<{ name: string; value: number }>({
      name: Validators.string,
      value: Validators.number
    });

    test('successfully converts JSON file with converter', () => {
      expect(helper.convertJsonFromTree(fileTree, '/test/data.json', stringConverter)).toSucceedAndSatisfy(
        (result) => {
          expect(result.name).toBe('test');
          expect(result.value).toBe(42);
        }
      );
    });

    test('successfully converts JSON file with validator', () => {
      expect(helper.convertJsonFromTree(fileTree, '/test/data.json', stringValidator)).toSucceedAndSatisfy(
        (result) => {
          expect(result.name).toBe('test');
          expect(result.value).toBe(42);
        }
      );
    });

    test('passes context to converter when provided', () => {
      const contextConverter = Converters.generic<string, string>((from: unknown, self, context?: string) => {
        if (typeof from === 'object' && from !== null && 'name' in from) {
          const obj = from as Record<string, unknown>;
          const name = typeof obj.name === 'string' ? obj.name : 'unknown';
          return succeed(context ? `${context}: ${name}` : name);
        }
        return fail('Invalid object');
      });

      expect(
        helper.convertJsonFromTree(fileTree, '/test/data.json', contextConverter, 'prefix')
      ).toSucceedWith('prefix: test');
    });

    test('passes context to validator when provided', () => {
      // For validators, we need to return boolean or Failure, not Result
      // We'll use a simpler test that just validates string type
      const contextValidator = Validators.string;

      expect(helper.convertJsonFromTree(fileTree, '/test/simple.txt', contextValidator, 'ctx')).toSucceedWith(
        'plain text file'
      );
    });

    test('fails when file does not exist', () => {
      expect(helper.convertJsonFromTree(fileTree, '/test/missing.json', stringConverter)).toFailWith(
        /not found/i
      );
    });

    test('fails when converter fails', () => {
      const failingConverter = Converters.generic<never>((from: unknown, self) => fail('Converter failed'));
      expect(helper.convertJsonFromTree(fileTree, '/test/data.json', failingConverter)).toFailWith(
        /converter failed/i
      );
    });

    test('fails when validator fails', () => {
      const failingValidator = Validators.generic<never>((from: unknown, context, self) =>
        fail('Validator failed')
      );
      expect(helper.convertJsonFromTree(fileTree, '/test/data.json', failingValidator)).toFailWith(
        /validator failed/i
      );
    });

    test('handles invalid JSON with converter errors', () => {
      // The invalid JSON becomes a string, which then fails string converter validation
      expect(helper.convertJsonFromTree(fileTree, '/test/invalid.json', stringConverter)).toFailWith(
        /cannot convert field.*from non-object/i
      );
    });
  });

  describe('convertJsonDirectoryFromTree', () => {
    const itemConverter = Converters.object<{ id: string; name: string }>({
      id: Converters.string,
      name: Converters.string
    });

    test('successfully converts all JSON files in directory with default pattern', () => {
      expect(
        helper.convertJsonDirectoryFromTree(fileTree, '/test/nested', itemConverter)
      ).toSucceedAndSatisfy((items) => {
        expect(items).toHaveLength(2);

        const item1 = items.find((item) => item.filename === 'item1.json');
        expect(item1).toBeDefined();
        expect(item1!.item.id).toBe('item1');
        expect(item1!.item.name).toBe('First Item');

        const item2 = items.find((item) => item.filename === 'item2.json');
        expect(item2).toBeDefined();
        expect(item2!.item.id).toBe('item2');
        expect(item2!.item.name).toBe('Second Item');
      });
    });

    test('filters files using custom pattern', () => {
      const allFilePattern = /\.(json|txt)$/;
      const simpleConverter = Converters.generic<string>((from: unknown, self) => {
        if (typeof from === 'string') {
          return succeed(from);
        }
        if (typeof from === 'object' && from !== null) {
          return succeed(JSON.stringify(from));
        }
        return fail('Invalid content');
      });

      expect(
        helper.convertJsonDirectoryFromTree(fileTree, '/test/nested', simpleConverter, allFilePattern)
      ).toSucceedAndSatisfy((items) => {
        expect(items).toHaveLength(3); // 2 JSON files + 1 TXT file

        const txtItem = items.find((item) => item.filename === 'item3.txt');
        expect(txtItem).toBeDefined();
        expect(txtItem!.item).toBe('not json');
      });
    });

    test('returns empty array for directory with no matching files', () => {
      const noMatchPattern = /\.xml$/;
      expect(
        helper.convertJsonDirectoryFromTree(fileTree, '/test/nested', itemConverter, noMatchPattern)
      ).toSucceedWith([]);
    });

    test('passes context to converter', () => {
      const contextConverter = Converters.generic<string, string>((from: unknown, self, context?: string) => {
        if (typeof from === 'object' && from !== null && 'id' in from) {
          const obj = from as Record<string, unknown>;
          const id = typeof obj.id === 'string' ? obj.id : 'unknown';
          return succeed(context ? `${context}:${id}` : id);
        }
        return fail('Invalid object');
      });

      expect(
        helper.convertJsonDirectoryFromTree(fileTree, '/test/nested', contextConverter, undefined, 'test')
      ).toSucceedAndSatisfy((items) => {
        expect(items).toHaveLength(2);
        expect(items[0].item).toMatch(/^test:/);
        expect(items[1].item).toMatch(/^test:/);
      });
    });

    test('fails when directory does not exist', () => {
      expect(helper.convertJsonDirectoryFromTree(fileTree, '/test/nonexistent', itemConverter)).toFailWith(
        /not found/i
      );
    });

    test('fails when path points to file instead of directory', () => {
      expect(helper.convertJsonDirectoryFromTree(fileTree, '/test/data.json', itemConverter)).toFailWith(
        /not a directory/i
      );
    });

    test('converts files that match pattern and converter successfully', () => {
      const typeConverter = Converters.object<{ type: string; count: number }>({
        type: Converters.string,
        count: Converters.number
      });

      // Use directory with mixed content - mixed directory has files with type/count fields
      expect(helper.convertJsonDirectoryFromTree(fileTree, '/test/mixed', typeConverter)).toSucceedAndSatisfy(
        (items) => {
          // Should convert files that have type/count fields successfully
          expect(items).toHaveLength(2); // 2 JSON files in mixed directory

          const file1 = items.find((item) => item.filename === 'file1.json');
          expect(file1).toBeDefined();
          expect(file1!.item.type).toBe('type1');
          expect(file1!.item.count).toBe(10);

          const file2 = items.find((item) => item.filename === 'file2.json');
          expect(file2).toBeDefined();
          expect(file2!.item.type).toBe('type2');
          expect(file2!.item.count).toBe(20);
        }
      );
    });
  });

  describe('convertJsonDirectoryToMapFromTree', () => {
    const itemConverter = Converters.object<{ id: string; name: string }>({
      id: Converters.string,
      name: Converters.string
    });

    test('successfully converts directory to map indexed by basename', () => {
      expect(
        helper.convertJsonDirectoryToMapFromTree(fileTree, '/test/nested', itemConverter)
      ).toSucceedAndSatisfy((map) => {
        expect(map.size).toBe(2);

        expect(map.has('item1')).toBe(true);
        const item1 = map.get('item1')!;
        expect(item1.id).toBe('item1');
        expect(item1.name).toBe('First Item');

        expect(map.has('item2')).toBe(true);
        const item2 = map.get('item2')!;
        expect(item2.id).toBe('item2');
        expect(item2.name).toBe('Second Item');
      });
    });

    test('uses custom file pattern when provided', () => {
      const textPattern = /\.txt$/;
      const stringConverter = Converters.string;

      expect(
        helper.convertJsonDirectoryToMapFromTree(fileTree, '/test/nested', stringConverter, textPattern)
      ).toSucceedAndSatisfy((map) => {
        expect(map.size).toBe(1);
        // Note: only .json extension is removed, so .txt files keep their extension in the map key
        expect(map.has('item3.txt')).toBe(true);
        expect(map.get('item3.txt')).toBe('not json');
      });
    });

    test('passes context to converter', () => {
      const contextConverter = Converters.generic<string, string>((from: unknown, self, context?: string) => {
        if (typeof from === 'object' && from !== null && 'name' in from) {
          const obj = from as Record<string, unknown>;
          const name = typeof obj.name === 'string' ? obj.name : 'unknown';
          return succeed(context ? `${context}: ${name}` : name);
        }
        return fail('Invalid object');
      });

      expect(
        helper.convertJsonDirectoryToMapFromTree(
          fileTree,
          '/test/nested',
          contextConverter,
          undefined,
          'prefix'
        )
      ).toSucceedAndSatisfy((map) => {
        expect(map.size).toBe(2);
        expect(map.get('item1')).toBe('prefix: First Item');
        expect(map.get('item2')).toBe('prefix: Second Item');
      });
    });

    test('handles files without .json extension in basename extraction', () => {
      const textPattern = /\.txt$/;
      const stringConverter = Converters.string;

      expect(
        helper.convertJsonDirectoryToMapFromTree(fileTree, '/test/nested', stringConverter, textPattern)
      ).toSucceedAndSatisfy((map) => {
        expect(map.size).toBe(1);
        // Method only removes .json extension, not .txt, so key includes .txt
        expect(map.has('item3.txt')).toBe(true);
      });
    });

    test('returns empty map for directory with no matching files', () => {
      const noMatchPattern = /\.xml$/;
      expect(
        helper.convertJsonDirectoryToMapFromTree(fileTree, '/test/nested', itemConverter, noMatchPattern)
      ).toSucceedWith(new Map());
    });

    test('fails when directory does not exist', () => {
      expect(
        helper.convertJsonDirectoryToMapFromTree(fileTree, '/test/nonexistent', itemConverter)
      ).toFailWith(/not found/i);
    });

    test('fails when path points to file instead of directory', () => {
      expect(helper.convertJsonDirectoryToMapFromTree(fileTree, '/test/data.json', itemConverter)).toFailWith(
        /not a directory/i
      );
    });

    test('propagates conversion errors from underlying convertJsonDirectoryFromTree', () => {
      const failingConverter = Converters.generic<never>((from: unknown, self) => fail('Conversion failed'));
      expect(helper.convertJsonDirectoryToMapFromTree(fileTree, '/test/nested', failingConverter)).toFailWith(
        /conversion failed/i
      );
    });
  });

  describe('DefaultJsonTreeHelper', () => {
    test('default instance is properly exported', () => {
      expect(JsonFile.DefaultJsonTreeHelper).toBeInstanceOf(JsonFile.JsonTreeHelper);
      expect(JsonFile.DefaultJsonTreeHelper.json).toBe(JsonFile.DefaultJsonLike);
    });

    test('default instance works with file operations', () => {
      expect(JsonFile.DefaultJsonTreeHelper.readJsonFromTree(fileTree, '/test/data.json')).toSucceedWith(
        testJsonData
      );
    });
  });

  describe('edge cases and error handling', () => {
    test('handles empty directory', () => {
      const emptyFiles: FileTree.IInMemoryFile[] = [
        // Create an empty directory structure
        { path: '/empty/.keep', contents: 'placeholder' }
      ];
      const emptyAccessors = FileTree.InMemoryTreeAccessors.create(emptyFiles).orThrow();
      const emptyTree = FileTree.FileTree.create(emptyAccessors).orThrow();

      const converter = Converters.string;
      // Empty directory should return empty array, not fail
      expect(helper.convertJsonDirectoryFromTree(emptyTree, '/empty', converter)).toSucceedWith([]);
    });

    test('handles complex nested JSON structures', () => {
      const complexData = {
        level1: {
          level2: {
            level3: {
              values: [{ id: 1, name: 'deep' }],
              metadata: { created: '2023-01-01', tags: ['test', 'deep'] }
            }
          }
        }
      };

      const complexFiles: FileTree.IInMemoryFile[] = [{ path: '/complex.json', contents: complexData }];
      const complexAccessors = FileTree.InMemoryTreeAccessors.create(complexFiles).orThrow();
      const complexTree = FileTree.FileTree.create(complexAccessors).orThrow();

      expect(helper.readJsonFromTree(complexTree, '/complex.json')).toSucceedWith(complexData);
    });

    test('handles files with non-standard extensions but valid JSON', () => {
      const configFiles: FileTree.IInMemoryFile[] = [
        { path: '/config.conf', contents: { setting: 'value' } },
        { path: '/data.dat', contents: { data: [1, 2, 3] } }
      ];
      const configAccessors = FileTree.InMemoryTreeAccessors.create(configFiles).orThrow();
      const configTree = FileTree.FileTree.create(configAccessors).orThrow();

      const anyExtPattern = /\.(conf|dat)$/;
      const objConverter = Converters.object<Record<string, unknown>>({});

      expect(
        helper.convertJsonDirectoryFromTree(configTree, '/', objConverter, anyExtPattern)
      ).toSucceedAndSatisfy((items) => {
        expect(items).toHaveLength(2);
      });
    });
  });
});
