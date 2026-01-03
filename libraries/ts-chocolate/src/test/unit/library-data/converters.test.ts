// Copyright (c) 2024 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import '@fgv/ts-utils-jest';

import { Converters as LibraryDataConverters } from '../../../packlets/library-data';
import { Converters, succeed } from '@fgv/ts-utils';

// Branded string types for testing
type TestCollectionId = string & { readonly __testCollectionId: unique symbol };
type TestItemId = string & { readonly __testItemId: unique symbol };

interface ITestItem {
  name: string;
  value: number;
}

const testCollectionIdConverter = Converters.string.map((s) => succeed(s as TestCollectionId));
const testItemIdConverter = Converters.string.map((s) => succeed(s as TestItemId));
const testItemConverter = Converters.strictObject<ITestItem>({
  name: Converters.string,
  value: Converters.number
});

describe('LibraryData.Converters', () => {
  // ============================================================================
  // removeExtension Tests
  // ============================================================================

  describe('removeExtension', () => {
    test('returns string converter for empty extensions array', () => {
      const converter = LibraryDataConverters.removeExtension([]);
      expect(converter.convert('test.json')).toSucceedWith('test.json');
      expect(converter.convert('anything')).toSucceedWith('anything');
    });

    test('removes single extension', () => {
      const converter = LibraryDataConverters.removeExtension(['.json']);
      expect(converter.convert('file.json')).toSucceedWith('file');
      expect(converter.convert('path/to/file.json')).toSucceedWith('path/to/file');
    });

    test('removes first matching extension from multiple options', () => {
      const converter = LibraryDataConverters.removeExtension(['.json', '.yaml', '.yml']);
      expect(converter.convert('file.json')).toSucceedWith('file');
      expect(converter.convert('file.yaml')).toSucceedWith('file');
      expect(converter.convert('file.yml')).toSucceedWith('file');
    });

    test('fails for non-string input', () => {
      const converter = LibraryDataConverters.removeExtension(['.json']);
      expect(converter.convert(123)).toFailWith(/not a string/i);
      expect(converter.convert(null)).toFailWith(/not a string/i);
      expect(converter.convert(undefined)).toFailWith(/not a string/i);
      expect(converter.convert({ file: 'test.json' })).toFailWith(/not a string/i);
    });

    test('fails when name consists only of extension', () => {
      const converter = LibraryDataConverters.removeExtension(['.json']);
      expect(converter.convert('.json')).toFailWith(/consists only of extension/i);
    });

    test('fails when no supported extension matches', () => {
      const converter = LibraryDataConverters.removeExtension(['.json', '.yaml']);
      expect(converter.convert('file.txt')).toFailWith(/no supported extension/i);
      expect(converter.convert('file')).toFailWith(/no supported extension/i);
    });

    test('handles complex file names', () => {
      const converter = LibraryDataConverters.removeExtension(['.json']);
      expect(converter.convert('file.name.with.dots.json')).toSucceedWith('file.name.with.dots');
      expect(converter.convert('kebab-case-file.json')).toSucceedWith('kebab-case-file');
      expect(converter.convert('snake_case_file.json')).toSucceedWith('snake_case_file');
    });
  });

  // ============================================================================
  // removeJsonExtension Tests
  // ============================================================================

  describe('removeJsonExtension', () => {
    test('removes .json extension', () => {
      expect(LibraryDataConverters.removeJsonExtension.convert('file.json')).toSucceedWith('file');
      expect(LibraryDataConverters.removeJsonExtension.convert('nested/path/file.json')).toSucceedWith(
        'nested/path/file'
      );
    });

    test('fails for non-json extensions', () => {
      expect(LibraryDataConverters.removeJsonExtension.convert('file.yaml')).toFailWith(
        /no supported extension/i
      );
      expect(LibraryDataConverters.removeJsonExtension.convert('file.txt')).toFailWith(
        /no supported extension/i
      );
    });
  });

  // ============================================================================
  // collection Tests
  // ============================================================================

  describe('collection', () => {
    const collectionConverter = LibraryDataConverters.collection({
      collectionIdConverter: testCollectionIdConverter,
      itemIdConverter: testItemIdConverter,
      itemConverter: testItemConverter
    });

    test('converts valid collection object', () => {
      const input = {
        id: 'test-collection',
        isMutable: true,
        items: {
          /* eslint-disable @typescript-eslint/naming-convention */
          'item-1': { name: 'Item One', value: 1 },
          'item-2': { name: 'Item Two', value: 2 }
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      };

      expect(collectionConverter.convert(input)).toSucceedAndSatisfy((collection) => {
        expect(collection.id).toBe('test-collection');
        expect(collection.isMutable).toBe(true);
        expect(Object.keys(collection.items)).toHaveLength(2);
        expect(collection.items['item-1' as TestItemId]).toEqual({ name: 'Item One', value: 1 });
        expect(collection.items['item-2' as TestItemId]).toEqual({ name: 'Item Two', value: 2 });
      });
    });

    test('converts collection with empty items', () => {
      const input = {
        id: 'empty-collection',
        isMutable: false,
        items: {}
      };

      expect(collectionConverter.convert(input)).toSucceedAndSatisfy((collection) => {
        expect(collection.id).toBe('empty-collection');
        expect(collection.isMutable).toBe(false);
        expect(Object.keys(collection.items)).toHaveLength(0);
      });
    });

    test('fails for missing id', () => {
      const input = {
        isMutable: true,
        items: {}
      };

      expect(collectionConverter.convert(input)).toFail();
    });

    test('fails for missing isMutable', () => {
      const input = {
        id: 'test-collection',
        items: {}
      };

      expect(collectionConverter.convert(input)).toFail();
    });

    test('fails for missing items', () => {
      const input = {
        id: 'test-collection',
        isMutable: true
      };

      expect(collectionConverter.convert(input)).toFail();
    });

    test('fails for invalid item structure', () => {
      const input = {
        id: 'test-collection',
        isMutable: true,
        items: {
          /* eslint-disable @typescript-eslint/naming-convention */
          'item-1': { name: 'Valid', value: 1 },
          'item-2': { name: 'Invalid' } // missing value
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      };

      expect(collectionConverter.convert(input)).toFail();
    });

    test('fails for non-object input', () => {
      expect(collectionConverter.convert('not an object')).toFail();
      expect(collectionConverter.convert(null)).toFail();
      expect(collectionConverter.convert(123)).toFail();
    });

    test('fails for extra properties (strictObject)', () => {
      const input = {
        id: 'test-collection',
        isMutable: true,
        items: {},
        extraField: 'should fail'
      };

      expect(collectionConverter.convert(input)).toFail();
    });
  });
});
