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

import { ResultMap } from '../../../packlets/collections';
import '../../helpers/jest';

describe('ResultMap', () => {
  describe('constructor', () => {
    test('should construct an empty ResultMap by default', () => {
      const resultMap = new ResultMap();
      expect(resultMap.size).toBe(0);
      expect(resultMap.inner.size).toBe(0);
    });

    test('should construct a ResultMap from supplied entries', () => {
      const resultMap = new ResultMap([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.size).toBe(2);
      expect(resultMap.inner.size).toBe(2);
      expect(resultMap.get('key1')).toSucceedWith(1);
      expect(resultMap.get('key2')).toSucceedWith(2);
    });

    test('should construct a ResultMap from supplied initializer', () => {
      const resultMap = new ResultMap({
        entries: [
          ['key1', 1],
          ['key2', 2]
        ]
      });
      expect(resultMap.size).toBe(2);
      expect(resultMap.inner.size).toBe(2);
      expect(resultMap.get('key1')).toSucceedWith(1);
      expect(resultMap.get('key2')).toSucceedWith(2);
    });
  });

  describe('create static method', () => {
    test('should create an empty ResultMap by default', () => {
      expect(ResultMap.create()).toSucceedAndSatisfy((resultMap: ResultMap) => {
        expect(resultMap.size).toBe(0);
        expect(resultMap.inner.size).toBe(0);
      });
    });

    test('should create a ResultMap from supplied entries', () => {
      expect(
        ResultMap.create([
          ['key1', 1],
          ['key2', 2]
        ])
      ).toSucceedAndSatisfy((resultMap: ResultMap) => {
        expect(resultMap.size).toBe(2);
        expect(resultMap.inner.size).toBe(2);
        expect(resultMap.get('key1')).toSucceedWith(1);
        expect(resultMap.get('key2')).toSucceedWith(2);
      });
    });
  });

  describe('clear method', () => {
    test('should clear all key-value pairs', () => {
      const resultMap = new ResultMap([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.size).toBe(2);
      resultMap.clear();
      expect(resultMap.size).toBe(0);
    });
  });

  describe('delete method', () => {
    test('should remove an existing key-value pair and return Success with detail "exists"', () => {
      const resultMap = new ResultMap([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.size).toBe(2);
      expect(resultMap.delete('key1')).toSucceedWithDetail(1, 'deleted');
      expect(resultMap.size).toBe(1);
      expect(resultMap.delete('key1')).toFailWithDetail(/not found/i, 'not-found');
      expect(resultMap.size).toBe(1);
    });

    test('should return Failure with detail "not-found" if key does not exist', () => {
      const resultMap = new ResultMap<string, number>([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.size).toBe(2);
      expect(resultMap.delete('key3')).toFailWithDetail(/not found/i, 'not-found');
      expect(resultMap.size).toBe(2);
    });
  });

  describe('entries method', () => {
    test('should return an iterator over key-value pairs', () => {
      const resultMap = new ResultMap([
        ['key1', 1],
        ['key2', 2]
      ]);
      const entries = resultMap.entries();
      expect(entries.next().value).toEqual(['key1', 1]);
      expect(entries.next().value).toEqual(['key2', 2]);
      expect(entries.next().done).toBe(true);
    });
  });

  describe('forEach method', () => {
    test('should iterate over all key-value pairs', () => {
      const resultMap = new ResultMap<string, number>([
        ['key1', 1],
        ['key2', 2]
      ]);
      const keys: string[] = [];
      const values: number[] = [];
      resultMap.forEach((value, key) => {
        keys.push(key);
        values.push(value);
      });
      expect(keys).toEqual(['key1', 'key2']);
      expect(values).toEqual([1, 2]);
    });
  });

  describe('get method', () => {
    test('should return Success with the map and detail "exists" for an existing key', () => {
      const resultMap = new ResultMap([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.get('key1')).toSucceedWithDetail(1, 'exists');
      expect(resultMap.get('key2')).toSucceedWithDetail(2, 'exists');
    });

    test('should return Failure with detail "not-found" for a non-existent key', () => {
      const resultMap = new ResultMap<string, number>([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.get('key3')).toFailWithDetail(/not found/i, 'not-found');
    });
  });

  describe('getOrAdd method', () => {
    test('should return Success with the existing value and detail "exists" for an existing key', () => {
      const resultMap = new ResultMap([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.getOrAdd('key1', 3)).toSucceedWithDetail(1, 'exists');
    });

    test('should add a new key-value pair and return Success with the value and detail "added" for a non-existent key', () => {
      const resultMap = new ResultMap<string, number>([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.getOrAdd('key3', 3)).toSucceedWithDetail(3, 'added');
      expect(resultMap.get('key3')).toSucceedWith(3);
    });
  });

  describe('has method', () => {
    test('should return true for an existing key', () => {
      const resultMap = new ResultMap([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.has('key1')).toBe(true);
    });

    test('should return false for a non-existent key', () => {
      const resultMap = new ResultMap<string, number>([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.has('key3')).toBe(false);
    });
  });

  describe('keys method', () => {
    test('should return an iterator over the map keys', () => {
      const resultMap = new ResultMap([
        ['key1', 1],
        ['key2', 2]
      ]);
      const keys = resultMap.keys();
      expect(keys.next().value).toBe('key1');
      expect(keys.next().value).toBe('key2');
    });
  });

  describe('set method', () => {
    test('should update an existing key-value pair and return Success with detail "updated"', () => {
      const resultMap = new ResultMap([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.set('key1', 3)).toSucceedWithDetail(3, 'updated');
      expect(resultMap.get('key1')).toSucceedWith(3);
    });

    test('should add a new key-value pair and return Success with detail "added"', () => {
      const resultMap = new ResultMap<string, number>([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.set('key3', 3)).toSucceedWithDetail(3, 'added');
      expect(resultMap.get('key3')).toSucceedWith(3);
    });
  });

  describe('setNew method', () => {
    test('should add a new key-value pair and return Success with detail "added"', () => {
      const resultMap = new ResultMap<string, number>([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.add('key3', 3)).toSucceedWithDetail(3, 'added');
      expect(resultMap.get('key3')).toSucceedWith(3);
    });

    test('should return Failure with detail "exists" for an existing key', () => {
      const resultMap = new ResultMap([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.add('key1', 3)).toFailWithDetail(/already exists/i, 'exists');
    });
  });

  describe('update method', () => {
    test('should update an existing key-value pair and return Success with detail "updated"', () => {
      const resultMap = new ResultMap([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.update('key1', 2)).toSucceedWithDetail(2, 'updated');
      expect(resultMap.get('key1')).toSucceedWith(2);
    });

    test('should return Failure with detail "not-found" for a non-existent key', () => {
      const resultMap = new ResultMap<string, number>([
        ['key1', 1],
        ['key2', 2]
      ]);
      expect(resultMap.update('key3', 3)).toFailWithDetail(/not found/i, 'not-found');
    });
  });

  describe('values method', () => {
    test('should return an iterator over the map values', () => {
      const resultMap = new ResultMap([
        ['key1', 1],
        ['key2', 2]
      ]);
      const values = resultMap.values();
      expect(values.next().value).toBe(1);
      expect(values.next().value).toBe(2);
    });
  });

  describe('iterator', () => {
    test('should allow iteration over key-value pairs', () => {
      const resultMap = new ResultMap<string, number>([
        ['key1', 1],
        ['key2', 2]
      ]);
      const keys: string[] = [];
      const values: number[] = [];
      for (const [key, value] of resultMap) {
        keys.push(key);
        values.push(value);
      }
      expect(keys).toEqual(['key1', 'key2']);
      expect(values).toEqual([1, 2]);
    });
  });
});
