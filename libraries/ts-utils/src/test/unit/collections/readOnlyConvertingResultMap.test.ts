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

import '../../helpers/jest';
import { fail, succeed } from '../../../packlets/base';
import {
  ReadOnlyConvertingResultMap,
  ResultMap,
  ConvertingResultMapValueConverter
} from '../../../packlets/collections';

interface ISourceItem {
  id: string;
  value: number;
}

interface ITargetItem {
  id: string;
  doubledValue: number;
  label: string;
}

describe('ReadOnlyConvertingResultMap', () => {
  const converter: ConvertingResultMapValueConverter<string, ISourceItem, ITargetItem> = (src, key) => {
    return succeed({
      id: src.id,
      doubledValue: src.value * 2,
      label: `Item ${key}`
    });
  };

  const failingConverter: ConvertingResultMapValueConverter<string, ISourceItem, ITargetItem> = (
    src,
    key
  ) => {
    if (src.value < 0) {
      return fail(`Cannot convert negative value for key ${key}`);
    }
    return succeed({
      id: src.id,
      doubledValue: src.value * 2,
      label: `Item ${key}`
    });
  };

  function createSourceMap(): ResultMap<string, ISourceItem> {
    return new ResultMap<string, ISourceItem>([
      ['a', { id: 'a', value: 1 }],
      ['b', { id: 'b', value: 2 }],
      ['c', { id: 'c', value: 3 }]
    ]);
  }

  describe('constructor', () => {
    test('creates an empty converting map from an empty source', () => {
      const inner = new ResultMap<string, ISourceItem>();
      const map = new ReadOnlyConvertingResultMap({ inner, converter });
      expect(map.size).toBe(0);
    });

    test('creates a converting map from a populated source', () => {
      const inner = createSourceMap();
      const map = new ReadOnlyConvertingResultMap({ inner, converter });
      expect(map.size).toBe(3);
    });
  });

  describe('create static method', () => {
    test('returns Success with a new map', () => {
      const inner = createSourceMap();
      expect(ReadOnlyConvertingResultMap.create({ inner, converter })).toSucceedAndSatisfy((map) => {
        expect(map.size).toBe(3);
      });
    });
  });

  describe('get method', () => {
    test('returns converted value for existing key', () => {
      const inner = createSourceMap();
      const map = new ReadOnlyConvertingResultMap({ inner, converter });

      expect(map.get('a')).toSucceedAndSatisfy((item) => {
        expect(item).toEqual({
          id: 'a',
          doubledValue: 2,
          label: 'Item a'
        });
      });
    });

    test('returns cached value on subsequent access', () => {
      const inner = createSourceMap();
      const converterFn = jest.fn(converter);
      const map = new ReadOnlyConvertingResultMap({ inner, converter: converterFn });

      expect(map.get('a')).toSucceed();
      expect(map.get('a')).toSucceed();
      expect(converterFn).toHaveBeenCalledTimes(1);
    });

    test('fails with not-found for missing key', () => {
      const inner = createSourceMap();
      const map = new ReadOnlyConvertingResultMap({ inner, converter });

      expect(map.get('missing')).toFailWithDetail(/not found/, 'not-found');
    });

    test('fails with invalid-value when conversion fails', () => {
      const inner = new ResultMap<string, ISourceItem>([['neg', { id: 'neg', value: -1 }]]);
      const map = new ReadOnlyConvertingResultMap({ inner, converter: failingConverter });

      expect(map.get('neg')).toFailWithDetail(/Cannot convert negative/, 'invalid-value');
    });
  });

  describe('has method', () => {
    test('returns true for existing key', () => {
      const inner = createSourceMap();
      const map = new ReadOnlyConvertingResultMap({ inner, converter });

      expect(map.has('a')).toBe(true);
      expect(map.has('b')).toBe(true);
    });

    test('returns false for missing key', () => {
      const inner = createSourceMap();
      const map = new ReadOnlyConvertingResultMap({ inner, converter });

      expect(map.has('missing')).toBe(false);
    });
  });

  describe('entries method', () => {
    test('iterates over all entries with converted values', () => {
      const inner = createSourceMap();
      const map = new ReadOnlyConvertingResultMap({ inner, converter });

      const entries = Array.from(map.entries());
      expect(entries).toHaveLength(3);
      expect(entries).toContainEqual(['a', { id: 'a', doubledValue: 2, label: 'Item a' }]);
      expect(entries).toContainEqual(['b', { id: 'b', doubledValue: 4, label: 'Item b' }]);
      expect(entries).toContainEqual(['c', { id: 'c', doubledValue: 6, label: 'Item c' }]);
    });

    test('skips entries that fail conversion', () => {
      const inner = new ResultMap<string, ISourceItem>([
        ['a', { id: 'a', value: 1 }],
        ['neg', { id: 'neg', value: -1 }],
        ['b', { id: 'b', value: 2 }]
      ]);
      const map = new ReadOnlyConvertingResultMap({ inner, converter: failingConverter });

      const entries = Array.from(map.entries());
      expect(entries).toHaveLength(2);
      expect(entries.map(([k]) => k)).toEqual(['a', 'b']);
    });

    test('uses cached values', () => {
      const inner = createSourceMap();
      const converterFn = jest.fn(converter);
      const map = new ReadOnlyConvertingResultMap({ inner, converter: converterFn });

      map.get('a').orThrow();
      converterFn.mockClear();

      Array.from(map.entries());
      expect(converterFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('keys method', () => {
    test('iterates over all keys', () => {
      const inner = createSourceMap();
      const map = new ReadOnlyConvertingResultMap({ inner, converter });

      const keys = Array.from(map.keys());
      expect(keys).toEqual(['a', 'b', 'c']);
    });
  });

  describe('values method', () => {
    test('iterates over all converted values', () => {
      const inner = createSourceMap();
      const map = new ReadOnlyConvertingResultMap({ inner, converter });

      const values = Array.from(map.values());
      expect(values).toHaveLength(3);
      expect(values).toContainEqual({ id: 'a', doubledValue: 2, label: 'Item a' });
      expect(values).toContainEqual({ id: 'b', doubledValue: 4, label: 'Item b' });
      expect(values).toContainEqual({ id: 'c', doubledValue: 6, label: 'Item c' });
    });

    test('skips values that fail conversion', () => {
      const inner = new ResultMap<string, ISourceItem>([
        ['a', { id: 'a', value: 1 }],
        ['neg', { id: 'neg', value: -1 }],
        ['b', { id: 'b', value: 2 }]
      ]);
      const map = new ReadOnlyConvertingResultMap({ inner, converter: failingConverter });

      const values = Array.from(map.values());
      expect(values).toHaveLength(2);
    });
  });

  describe('forEach method', () => {
    test('calls callback for each entry with converted values', () => {
      const inner = createSourceMap();
      const map = new ReadOnlyConvertingResultMap({ inner, converter });

      const visited: Array<[string, ITargetItem]> = [];
      map.forEach((value, key) => {
        visited.push([key, value]);
      });

      expect(visited).toHaveLength(3);
      expect(visited.map(([k]) => k)).toEqual(['a', 'b', 'c']);
    });

    test('skips entries that fail conversion', () => {
      const inner = new ResultMap<string, ISourceItem>([
        ['a', { id: 'a', value: 1 }],
        ['neg', { id: 'neg', value: -1 }],
        ['b', { id: 'b', value: 2 }]
      ]);
      const map = new ReadOnlyConvertingResultMap({ inner, converter: failingConverter });

      const visited: string[] = [];
      map.forEach((_, key) => {
        visited.push(key);
      });

      expect(visited).toEqual(['a', 'b']);
    });

    test('passes thisArg to callback', () => {
      const inner = createSourceMap();
      const map = new ReadOnlyConvertingResultMap({ inner, converter });

      const context = { count: 0 };
      map.forEach(function (this: typeof context) {
        this.count++;
      }, context);

      expect(context.count).toBe(3);
    });
  });

  describe('Symbol.iterator', () => {
    test('allows iteration with for...of', () => {
      const inner = createSourceMap();
      const map = new ReadOnlyConvertingResultMap({ inner, converter });

      const entries: Array<[string, ITargetItem]> = [];
      for (const entry of map) {
        entries.push(entry);
      }

      expect(entries).toHaveLength(3);
    });
  });

  describe('toReadOnly method', () => {
    test('returns the same instance', () => {
      const inner = createSourceMap();
      const map = new ReadOnlyConvertingResultMap({ inner, converter });

      expect(map.toReadOnly()).toBe(map);
    });
  });

  describe('size property', () => {
    test('reflects the size of the inner map', () => {
      const inner = createSourceMap();
      const map = new ReadOnlyConvertingResultMap({ inner, converter });

      expect(map.size).toBe(inner.size);
    });
  });
});
