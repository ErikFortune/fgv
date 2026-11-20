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
import { succeed } from '../../../packlets/base';
import {
  ConvertingResultMap,
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

describe('ConvertingResultMap', () => {
  const converter: ConvertingResultMapValueConverter<string, ISourceItem, ITargetItem> = (src, key) => {
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
    test('creates a converting map with source access', () => {
      const inner = createSourceMap();
      const map = new ConvertingResultMap({ inner, converter });
      expect(map.size).toBe(3);
      expect(map.source).toBeDefined();
    });
  });

  describe('create static method', () => {
    test('returns Success with a new map', () => {
      const inner = createSourceMap();
      expect(ConvertingResultMap.create({ inner, converter })).toSucceedAndSatisfy((map) => {
        expect(map.size).toBe(3);
        expect(map.source).toBeDefined();
      });
    });
  });

  describe('source property', () => {
    describe('get method', () => {
      test('returns source value for existing key', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        expect(map.source.get('a')).toSucceedAndSatisfy((item) => {
          expect(item).toEqual({ id: 'a', value: 1 });
        });
      });
    });

    describe('add method', () => {
      test('adds a new source value and invalidates cache', () => {
        const inner = createSourceMap();
        const converterFn = jest.fn(converter);
        const map = new ConvertingResultMap({ inner, converter: converterFn });

        map.get('a').orThrow();
        converterFn.mockClear();

        expect(map.source.add('d', { id: 'd', value: 4 })).toSucceedWithDetail(
          { id: 'd', value: 4 },
          'added'
        );

        expect(map.get('d')).toSucceedAndSatisfy((item) => {
          expect(item.doubledValue).toBe(8);
        });
        expect(converterFn).toHaveBeenCalledTimes(1);
      });

      test('fails when key already exists', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        expect(map.source.add('a', { id: 'a', value: 10 })).toFailWithDetail(/already exists/, 'exists');
      });
    });

    describe('set method', () => {
      test('sets a source value and invalidates cache', () => {
        const inner = createSourceMap();
        const converterFn = jest.fn(converter);
        const map = new ConvertingResultMap({ inner, converter: converterFn });

        expect(map.get('a')).toSucceedAndSatisfy((item) => {
          expect(item.doubledValue).toBe(2);
        });
        converterFn.mockClear();

        expect(map.source.set('a', { id: 'a', value: 10 })).toSucceed();

        expect(map.get('a')).toSucceedAndSatisfy((item) => {
          expect(item.doubledValue).toBe(20);
        });
        expect(converterFn).toHaveBeenCalledTimes(1);
      });

      test('adds a new value if key does not exist', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        expect(map.source.set('d', { id: 'd', value: 4 })).toSucceedWithDetail(
          { id: 'd', value: 4 },
          'added'
        );
        expect(map.size).toBe(4);
      });
    });

    describe('update method', () => {
      test('updates an existing source value and invalidates cache', () => {
        const inner = createSourceMap();
        const converterFn = jest.fn(converter);
        const map = new ConvertingResultMap({ inner, converter: converterFn });

        map.get('a').orThrow();
        converterFn.mockClear();

        expect(map.source.update('a', { id: 'a', value: 100 })).toSucceed();

        expect(map.get('a')).toSucceedAndSatisfy((item) => {
          expect(item.doubledValue).toBe(200);
        });
        expect(converterFn).toHaveBeenCalledTimes(1);
      });

      test('fails when key does not exist', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        expect(map.source.update('missing', { id: 'missing', value: 1 })).toFailWithDetail(
          /not found/,
          'not-found'
        );
      });
    });

    describe('delete method', () => {
      test('deletes a source value and invalidates cache', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        map.get('a').orThrow();

        expect(map.source.delete('a')).toSucceedWithDetail({ id: 'a', value: 1 }, 'deleted');
        expect(map.size).toBe(2);
        expect(map.has('a')).toBe(false);
      });

      test('fails when key does not exist', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        expect(map.source.delete('missing')).toFailWithDetail(/not found/, 'not-found');
      });
    });

    describe('getOrAdd method', () => {
      test('returns existing value without invalidating cache', () => {
        const inner = createSourceMap();
        const converterFn = jest.fn(converter);
        const map = new ConvertingResultMap({ inner, converter: converterFn });

        map.get('a').orThrow();
        converterFn.mockClear();

        expect(map.source.getOrAdd('a', { id: 'a', value: 999 })).toSucceedWithDetail(
          { id: 'a', value: 1 },
          'exists'
        );

        expect(map.get('a')).toSucceedAndSatisfy((item) => {
          expect(item.doubledValue).toBe(2);
        });
        expect(converterFn).not.toHaveBeenCalled();
      });

      test('adds new value and invalidates cache when key does not exist', () => {
        const inner = createSourceMap();
        const converterFn = jest.fn(converter);
        const map = new ConvertingResultMap({ inner, converter: converterFn });

        expect(map.source.getOrAdd('d', { id: 'd', value: 4 })).toSucceedWithDetail(
          { id: 'd', value: 4 },
          'added'
        );

        expect(map.get('d')).toSucceedAndSatisfy((item) => {
          expect(item.doubledValue).toBe(8);
        });
      });

      test('works with factory function', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        expect(map.source.getOrAdd('d', (key) => succeed({ id: key, value: 4 }))).toSucceedWithDetail(
          { id: 'd', value: 4 },
          'added'
        );

        expect(map.get('d')).toSucceedAndSatisfy((item) => {
          expect(item.doubledValue).toBe(8);
        });
      });

      test('returns existing value with factory function without calling factory', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });
        const factory = jest.fn((key: string) => succeed({ id: key, value: 999 }));

        expect(map.source.getOrAdd('a', factory)).toSucceedWithDetail({ id: 'a', value: 1 }, 'exists');
        expect(factory).not.toHaveBeenCalled();
      });
    });

    describe('clear method', () => {
      test('clears all source values and the entire cache', () => {
        const inner = createSourceMap();
        const converterFn = jest.fn(converter);
        const map = new ConvertingResultMap({ inner, converter: converterFn });

        map.get('a').orThrow();
        map.get('b').orThrow();
        converterFn.mockClear();

        map.source.clear();

        expect(map.size).toBe(0);

        map.source.add('a', { id: 'a', value: 1 }).orThrow();
        map.get('a').orThrow();
        expect(converterFn).toHaveBeenCalledTimes(1);
      });
    });

    describe('has method', () => {
      test('returns true for existing key', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        expect(map.source.has('a')).toBe(true);
      });

      test('returns false for missing key', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        expect(map.source.has('missing')).toBe(false);
      });
    });

    describe('size property', () => {
      test('returns the size of the inner map', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        expect(map.source.size).toBe(3);
      });
    });

    describe('entries method', () => {
      test('iterates over source entries', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        const entries = Array.from(map.source.entries());
        expect(entries).toHaveLength(3);
        expect(entries).toContainEqual(['a', { id: 'a', value: 1 }]);
      });
    });

    describe('keys method', () => {
      test('iterates over keys', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        const keys = Array.from(map.source.keys());
        expect(keys).toEqual(['a', 'b', 'c']);
      });
    });

    describe('values method', () => {
      test('iterates over source values', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        const values = Array.from(map.source.values());
        expect(values).toHaveLength(3);
        expect(values).toContainEqual({ id: 'a', value: 1 });
      });
    });

    describe('forEach method', () => {
      test('calls callback for each source entry', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        const visited: string[] = [];
        map.source.forEach((_, key) => {
          visited.push(key);
        });

        expect(visited).toEqual(['a', 'b', 'c']);
      });
    });

    describe('Symbol.iterator', () => {
      test('allows iteration with for...of', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        const entries: Array<[string, ISourceItem]> = [];
        for (const entry of map.source) {
          entries.push(entry);
        }

        expect(entries).toHaveLength(3);
      });
    });

    describe('toReadOnly method', () => {
      test('returns a read-only view of the inner map', () => {
        const inner = createSourceMap();
        const map = new ConvertingResultMap({ inner, converter });

        const readOnly = map.source.toReadOnly();
        expect(readOnly.size).toBe(3);
      });
    });
  });

  describe('cache invalidation', () => {
    test('cache is invalidated per-key, not globally', () => {
      const inner = createSourceMap();
      const converterFn = jest.fn(converter);
      const map = new ConvertingResultMap({ inner, converter: converterFn });

      map.get('a').orThrow();
      map.get('b').orThrow();
      expect(converterFn).toHaveBeenCalledTimes(2);
      converterFn.mockClear();

      map.source.set('a', { id: 'a', value: 10 }).orThrow();

      map.get('a').orThrow();
      expect(converterFn).toHaveBeenCalledTimes(1);

      map.get('b').orThrow();
      expect(converterFn).toHaveBeenCalledTimes(1);
    });
  });
});
