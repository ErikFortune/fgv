// Copyright (c) 2026 Erik Fortune
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
import { Converters } from '@fgv/ts-utils';
import {
  Converters as CommonConverters,
  Helpers,
  Model as CommonModel,
  Validation
} from '../../../packlets/common';

describe('optionsWithPreferred', () => {
  // Test types
  interface TestOption {
    readonly id: string;
    readonly name: string;
  }

  describe('getPreferred', () => {
    test('returns undefined when preferredId is not specified', () => {
      const collection: CommonModel.IOptionsWithPreferred<TestOption, string> = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ]
      };
      expect(Helpers.getPreferred(collection)).toBeUndefined();
    });

    test('returns the preferred option when it exists', () => {
      const collection: CommonModel.IOptionsWithPreferred<TestOption, string> = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ],
        preferredId: 'b'
      };
      expect(Helpers.getPreferred(collection)).toEqual({ id: 'b', name: 'Option B' });
    });

    test('returns undefined when preferredId is not in options', () => {
      const collection: CommonModel.IOptionsWithPreferred<TestOption, string> = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ],
        preferredId: 'c'
      };
      expect(Helpers.getPreferred(collection)).toBeUndefined();
    });

    test('returns undefined for empty options', () => {
      const collection: CommonModel.IOptionsWithPreferred<TestOption, string> = {
        options: [],
        preferredId: 'a'
      };
      expect(Helpers.getPreferred(collection)).toBeUndefined();
    });
  });

  describe('getPreferredOrFirst', () => {
    test('returns the preferred option when it exists', () => {
      const collection: CommonModel.IOptionsWithPreferred<TestOption, string> = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ],
        preferredId: 'b'
      };
      expect(Helpers.getPreferredOrFirst(collection)).toEqual({ id: 'b', name: 'Option B' });
    });

    test('returns the first option when no preferredId', () => {
      const collection: CommonModel.IOptionsWithPreferred<TestOption, string> = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ]
      };
      expect(Helpers.getPreferredOrFirst(collection)).toEqual({ id: 'a', name: 'Option A' });
    });

    test('returns the first option when preferredId is not found', () => {
      const collection: CommonModel.IOptionsWithPreferred<TestOption, string> = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ],
        preferredId: 'c'
      };
      expect(Helpers.getPreferredOrFirst(collection)).toEqual({ id: 'a', name: 'Option A' });
    });

    test('returns undefined for empty options', () => {
      const collection: CommonModel.IOptionsWithPreferred<TestOption, string> = {
        options: []
      };
      expect(Helpers.getPreferredOrFirst(collection)).toBeUndefined();
    });
  });

  describe('getPreferredId', () => {
    test('returns undefined when preferredId is not specified', () => {
      const collection: CommonModel.IIdsWithPreferred<string> = {
        ids: ['a', 'b', 'c']
      };
      expect(Helpers.getPreferredId(collection)).toBeUndefined();
    });

    test('returns the preferredId when it exists in ids', () => {
      const collection: CommonModel.IIdsWithPreferred<string> = {
        ids: ['a', 'b', 'c'],
        preferredId: 'b'
      };
      expect(Helpers.getPreferredId(collection)).toBe('b');
    });

    test('returns undefined when preferredId is not in ids', () => {
      const collection: CommonModel.IIdsWithPreferred<string> = {
        ids: ['a', 'b', 'c'],
        preferredId: 'd'
      };
      expect(Helpers.getPreferredId(collection)).toBeUndefined();
    });

    test('returns undefined for empty ids', () => {
      const collection: CommonModel.IIdsWithPreferred<string> = {
        ids: [],
        preferredId: 'a'
      };
      expect(Helpers.getPreferredId(collection)).toBeUndefined();
    });
  });

  describe('getPreferredIdOrFirst', () => {
    test('returns the preferredId when it exists in ids', () => {
      const collection: CommonModel.IIdsWithPreferred<string> = {
        ids: ['a', 'b', 'c'],
        preferredId: 'b'
      };
      expect(Helpers.getPreferredIdOrFirst(collection)).toBe('b');
    });

    test('returns the first id when no preferredId', () => {
      const collection: CommonModel.IIdsWithPreferred<string> = {
        ids: ['a', 'b', 'c']
      };
      expect(Helpers.getPreferredIdOrFirst(collection)).toBe('a');
    });

    test('returns the first id when preferredId is not found', () => {
      const collection: CommonModel.IIdsWithPreferred<string> = {
        ids: ['a', 'b', 'c'],
        preferredId: 'd'
      };
      expect(Helpers.getPreferredIdOrFirst(collection)).toBe('a');
    });

    test('returns undefined for empty ids', () => {
      const collection: CommonModel.IIdsWithPreferred<string> = {
        ids: []
      };
      expect(Helpers.getPreferredIdOrFirst(collection)).toBeUndefined();
    });
  });

  describe('validateOptionsWithPreferred', () => {
    test('succeeds when preferredId is undefined', () => {
      const collection: CommonModel.IOptionsWithPreferred<TestOption, string> = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ]
      };
      expect(Validation.validateOptionsWithPreferred(collection)).toSucceedWith(collection);
    });

    test('succeeds when preferredId exists in options', () => {
      const collection: CommonModel.IOptionsWithPreferred<TestOption, string> = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ],
        preferredId: 'b'
      };
      expect(Validation.validateOptionsWithPreferred(collection)).toSucceedWith(collection);
    });

    test('fails when preferredId is not in options', () => {
      const collection: CommonModel.IOptionsWithPreferred<TestOption, string> = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ],
        preferredId: 'c'
      };
      expect(Validation.validateOptionsWithPreferred(collection)).toFailWith(
        /preferredId 'c' not found in options/
      );
    });

    test('fails with context in error message', () => {
      const collection: CommonModel.IOptionsWithPreferred<TestOption, string> = {
        options: [{ id: 'a', name: 'Option A' }],
        preferredId: 'missing'
      };
      expect(Validation.validateOptionsWithPreferred(collection, 'filling slot "center"')).toFailWith(
        /filling slot "center": preferredId 'missing' not found in options/
      );
    });

    test('fails for empty options with preferredId', () => {
      const collection: CommonModel.IOptionsWithPreferred<TestOption, string> = {
        options: [],
        preferredId: 'a'
      };
      expect(Validation.validateOptionsWithPreferred(collection)).toFailWith(
        /preferredId 'a' not found in options/
      );
    });
  });

  describe('validateIdsWithPreferred', () => {
    test('succeeds when preferredId is undefined', () => {
      const collection: CommonModel.IIdsWithPreferred<string> = {
        ids: ['a', 'b', 'c']
      };
      expect(Validation.validateIdsWithPreferred(collection)).toSucceedWith(collection);
    });

    test('succeeds when preferredId exists in ids', () => {
      const collection: CommonModel.IIdsWithPreferred<string> = {
        ids: ['a', 'b', 'c'],
        preferredId: 'b'
      };
      expect(Validation.validateIdsWithPreferred(collection)).toSucceedWith(collection);
    });

    test('fails when preferredId is not in ids', () => {
      const collection: CommonModel.IIdsWithPreferred<string> = {
        ids: ['a', 'b', 'c'],
        preferredId: 'd'
      };
      expect(Validation.validateIdsWithPreferred(collection)).toFailWith(/preferredId 'd' not found in ids/);
    });

    test('fails with context in error message', () => {
      const collection: CommonModel.IIdsWithPreferred<string> = {
        ids: ['a', 'b'],
        preferredId: 'missing'
      };
      expect(Validation.validateIdsWithPreferred(collection, 'shell chocolate')).toFailWith(
        /shell chocolate: preferredId 'missing' not found in ids/
      );
    });

    test('fails for empty ids with preferredId', () => {
      const collection: CommonModel.IIdsWithPreferred<string> = {
        ids: [],
        preferredId: 'a'
      };
      expect(Validation.validateIdsWithPreferred(collection)).toFailWith(/preferredId 'a' not found in ids/);
    });
  });

  describe('optionsWithPreferred converter', () => {
    // Create a simple option converter for testing
    const testOptionConverter = Converters.object<TestOption>({
      id: Converters.string,
      name: Converters.string
    });

    const converter = CommonConverters.optionsWithPreferred(
      testOptionConverter,
      Converters.string,
      'testOptions'
    );

    test('converts valid data without preferredId', () => {
      const input = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ]
      };
      expect(converter.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options).toHaveLength(2);
        expect(result.options[0]).toEqual({ id: 'a', name: 'Option A' });
        expect(result.preferredId).toBeUndefined();
      });
    });

    test('converts valid data with preferredId that exists in options', () => {
      const input = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ],
        preferredId: 'b'
      };
      expect(converter.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options).toHaveLength(2);
        expect(result.preferredId).toBe('b');
      });
    });

    test('fails when preferredId is not in options', () => {
      const input = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ],
        preferredId: 'c'
      };
      expect(converter.convert(input)).toFailWith(/testOptions: preferredId 'c' not found in options/);
    });

    test('fails when options is missing', () => {
      const input = { preferredId: 'a' };
      expect(converter.convert(input)).toFail();
    });

    test('fails when option has invalid structure', () => {
      const input = {
        options: [{ id: 'a' }] // missing name
      };
      expect(converter.convert(input)).toFail();
    });

    test('works without context for error messages', () => {
      const converterNoContext = CommonConverters.optionsWithPreferred(
        testOptionConverter,
        Converters.string
      );
      const input = {
        options: [{ id: 'a', name: 'Option A' }],
        preferredId: 'missing'
      };
      expect(converterNoContext.convert(input)).toFailWith(/preferredId 'missing' not found in options/);
    });
  });

  describe('idsWithPreferred converter', () => {
    const converter = CommonConverters.idsWithPreferred(Converters.string, 'testIds');

    test('converts valid data without preferredId', () => {
      const input = {
        ids: ['a', 'b', 'c']
      };
      expect(converter.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ids).toEqual(['a', 'b', 'c']);
        expect(result.preferredId).toBeUndefined();
      });
    });

    test('converts valid data with preferredId that exists in ids', () => {
      const input = {
        ids: ['a', 'b', 'c'],
        preferredId: 'b'
      };
      expect(converter.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ids).toEqual(['a', 'b', 'c']);
        expect(result.preferredId).toBe('b');
      });
    });

    test('fails when preferredId is not in ids', () => {
      const input = {
        ids: ['a', 'b', 'c'],
        preferredId: 'd'
      };
      expect(converter.convert(input)).toFailWith(/testIds: preferredId 'd' not found in ids/);
    });

    test('fails when ids is missing', () => {
      const input = { preferredId: 'a' };
      expect(converter.convert(input)).toFail();
    });

    test('fails when ids contains invalid values', () => {
      const input = {
        ids: ['a', 123, 'c'] // 123 is not a string
      };
      expect(converter.convert(input)).toFail();
    });

    test('works without context for error messages', () => {
      const converterNoContext = CommonConverters.idsWithPreferred(Converters.string);
      const input = {
        ids: ['a', 'b'],
        preferredId: 'missing'
      };
      expect(converterNoContext.convert(input)).toFailWith(/preferredId 'missing' not found in ids/);
    });
  });

  describe('refWithNotes converter', () => {
    // Use a simple string converter for testing
    const converter = CommonConverters.refWithNotes(Converters.string);

    test('converts valid data with id only', () => {
      const input = { id: 'test-id' };
      expect(converter.convert(input)).toSucceedAndSatisfy((result: CommonModel.IRefWithNotes<string>) => {
        expect(result.id).toBe('test-id');
        expect(result.notes).toBeUndefined();
      });
    });

    test('converts valid data with id and notes', () => {
      const input = { id: 'test-id', notes: [{ category: 'user', note: 'Some notes about this ref' }] };
      expect(converter.convert(input)).toSucceedAndSatisfy((result: CommonModel.IRefWithNotes<string>) => {
        expect(result.id).toBe('test-id');
        expect(result.notes).toEqual([{ category: 'user', note: 'Some notes about this ref' }]);
      });
    });

    test('fails when id is missing', () => {
      const input = { notes: 'Some notes' };
      expect(converter.convert(input)).toFail();
    });

    test('fails when id has wrong type', () => {
      const input = { id: 123 };
      expect(converter.convert(input)).toFail();
    });

    test('fails when notes has wrong type', () => {
      const input = { id: 'test-id', notes: 'not-an-array' };
      expect(converter.convert(input)).toFail();
    });

    test('fails for non-object input', () => {
      expect(converter.convert('not-an-object')).toFail();
      expect(converter.convert(null)).toFail();
      expect(converter.convert(undefined)).toFail();
    });

    test('works with branded type converters', () => {
      // Simulate a branded type converter
      const brandedConverter = Converters.string.withConstraint((s) => s.startsWith('prefix-'), {
        description: 'must start with prefix-'
      });
      const brandedRefConverter = CommonConverters.refWithNotes(brandedConverter);

      expect(brandedRefConverter.convert({ id: 'prefix-123' })).toSucceedAndSatisfy((result) => {
        expect(result.id).toBe('prefix-123');
      });

      expect(brandedRefConverter.convert({ id: 'invalid-123' })).toFail();
    });
  });
});
