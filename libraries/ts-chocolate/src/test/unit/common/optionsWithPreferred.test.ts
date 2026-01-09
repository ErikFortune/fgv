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
import {
  getPreferred,
  getPreferredOrFirst,
  getPreferredId,
  getPreferredIdOrFirst,
  IOptionsWithPreferred,
  IIdsWithPreferred
} from '../../../packlets/common';

describe('optionsWithPreferred', () => {
  // Test types
  interface TestOption {
    readonly id: string;
    readonly name: string;
  }

  describe('getPreferred', () => {
    test('returns undefined when preferredId is not specified', () => {
      const collection: IOptionsWithPreferred<TestOption, string> = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ]
      };
      expect(getPreferred(collection)).toBeUndefined();
    });

    test('returns the preferred option when it exists', () => {
      const collection: IOptionsWithPreferred<TestOption, string> = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ],
        preferredId: 'b'
      };
      expect(getPreferred(collection)).toEqual({ id: 'b', name: 'Option B' });
    });

    test('returns undefined when preferredId is not in options', () => {
      const collection: IOptionsWithPreferred<TestOption, string> = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ],
        preferredId: 'c'
      };
      expect(getPreferred(collection)).toBeUndefined();
    });

    test('returns undefined for empty options', () => {
      const collection: IOptionsWithPreferred<TestOption, string> = {
        options: [],
        preferredId: 'a'
      };
      expect(getPreferred(collection)).toBeUndefined();
    });
  });

  describe('getPreferredOrFirst', () => {
    test('returns the preferred option when it exists', () => {
      const collection: IOptionsWithPreferred<TestOption, string> = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ],
        preferredId: 'b'
      };
      expect(getPreferredOrFirst(collection)).toEqual({ id: 'b', name: 'Option B' });
    });

    test('returns the first option when no preferredId', () => {
      const collection: IOptionsWithPreferred<TestOption, string> = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ]
      };
      expect(getPreferredOrFirst(collection)).toEqual({ id: 'a', name: 'Option A' });
    });

    test('returns the first option when preferredId is not found', () => {
      const collection: IOptionsWithPreferred<TestOption, string> = {
        options: [
          { id: 'a', name: 'Option A' },
          { id: 'b', name: 'Option B' }
        ],
        preferredId: 'c'
      };
      expect(getPreferredOrFirst(collection)).toEqual({ id: 'a', name: 'Option A' });
    });

    test('returns undefined for empty options', () => {
      const collection: IOptionsWithPreferred<TestOption, string> = {
        options: []
      };
      expect(getPreferredOrFirst(collection)).toBeUndefined();
    });
  });

  describe('getPreferredId', () => {
    test('returns undefined when preferredId is not specified', () => {
      const collection: IIdsWithPreferred<string> = {
        ids: ['a', 'b', 'c']
      };
      expect(getPreferredId(collection)).toBeUndefined();
    });

    test('returns the preferredId when it exists in ids', () => {
      const collection: IIdsWithPreferred<string> = {
        ids: ['a', 'b', 'c'],
        preferredId: 'b'
      };
      expect(getPreferredId(collection)).toBe('b');
    });

    test('returns undefined when preferredId is not in ids', () => {
      const collection: IIdsWithPreferred<string> = {
        ids: ['a', 'b', 'c'],
        preferredId: 'd'
      };
      expect(getPreferredId(collection)).toBeUndefined();
    });

    test('returns undefined for empty ids', () => {
      const collection: IIdsWithPreferred<string> = {
        ids: [],
        preferredId: 'a'
      };
      expect(getPreferredId(collection)).toBeUndefined();
    });
  });

  describe('getPreferredIdOrFirst', () => {
    test('returns the preferredId when it exists in ids', () => {
      const collection: IIdsWithPreferred<string> = {
        ids: ['a', 'b', 'c'],
        preferredId: 'b'
      };
      expect(getPreferredIdOrFirst(collection)).toBe('b');
    });

    test('returns the first id when no preferredId', () => {
      const collection: IIdsWithPreferred<string> = {
        ids: ['a', 'b', 'c']
      };
      expect(getPreferredIdOrFirst(collection)).toBe('a');
    });

    test('returns the first id when preferredId is not found', () => {
      const collection: IIdsWithPreferred<string> = {
        ids: ['a', 'b', 'c'],
        preferredId: 'd'
      };
      expect(getPreferredIdOrFirst(collection)).toBe('a');
    });

    test('returns undefined for empty ids', () => {
      const collection: IIdsWithPreferred<string> = {
        ids: []
      };
      expect(getPreferredIdOrFirst(collection)).toBeUndefined();
    });
  });
});
