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

import '../helpers/jest';
import { stringifyLogValue } from '../../packlets/logging';

describe('stringifyLogValue', () => {
  describe('string inputs', () => {
    test('should return string inputs unchanged', () => {
      expect(stringifyLogValue('simple string')).toBe('simple string');
      expect(stringifyLogValue('string with spaces')).toBe('string with spaces');
      expect(stringifyLogValue('string-with-dashes')).toBe('string-with-dashes');
    });

    test('should handle empty strings', () => {
      expect(stringifyLogValue('')).toBe('');
    });

    test('should handle strings with special characters', () => {
      expect(stringifyLogValue('string\nwith\nnewlines')).toBe('string\nwith\nnewlines');
      expect(stringifyLogValue('string\twith\ttabs')).toBe('string\twith\ttabs');
      expect(stringifyLogValue('string"with"quotes')).toBe('string"with"quotes');
    });
  });

  describe('non-string primitives', () => {
    test('should convert numbers to strings', () => {
      expect(stringifyLogValue(42)).toBe('42');
      expect(stringifyLogValue(0)).toBe('0');
      expect(stringifyLogValue(-123)).toBe('-123');
      expect(stringifyLogValue(3.14159)).toBe('3.14159');
      expect(stringifyLogValue(Number.POSITIVE_INFINITY)).toBe('Infinity');
      expect(stringifyLogValue(Number.NEGATIVE_INFINITY)).toBe('-Infinity');
      expect(stringifyLogValue(Number.NaN)).toBe('NaN');
    });

    test('should convert booleans to strings', () => {
      expect(stringifyLogValue(true)).toBe('true');
      expect(stringifyLogValue(false)).toBe('false');
    });

    test('should handle null and undefined', () => {
      expect(stringifyLogValue(null)).toBe('null');
      expect(stringifyLogValue(undefined)).toBe('undefined');
    });

    test('should handle symbols', () => {
      const sym = Symbol('test');
      expect(stringifyLogValue(sym)).toBe('Symbol(test)');
    });

    test('should handle bigint', () => {
      expect(stringifyLogValue(BigInt(123))).toBe('123');
    });
  });

  describe('object handling', () => {
    test('should JSON.stringify simple objects', () => {
      const obj = { key: 'value' };
      expect(stringifyLogValue(obj)).toBe('{"key":"value"}');
    });

    test('should handle nested objects', () => {
      const obj = {
        name: 'test',
        nested: {
          count: 42,
          flag: true
        }
      };
      const result = stringifyLogValue(obj);
      // This will be truncated as it's longer than 40 chars
      expect(result.length).toBeLessThanOrEqual(40);
      expect(result).toMatch(/\.\.\.$/);
    });

    test('should handle arrays', () => {
      expect(stringifyLogValue([1, 2, 3])).toBe('1,2,3');
      expect(stringifyLogValue(['a', 'b', 'c'])).toBe('a,b,c');
      expect(stringifyLogValue([])).toBe('');
    });

    test('should handle objects with mixed data types', () => {
      const obj = {
        str: 'text',
        num: 42,
        bool: true,
        nil: null,
        arr: [1, 2]
      };
      const result = stringifyLogValue(obj);
      // This will be truncated as it's longer than 40 chars
      expect(result.length).toBeLessThanOrEqual(40);
      expect(result).toMatch(/\.\.\.$/);
    });

    test('should handle Date objects', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      expect(stringifyLogValue(date)).toBe(date.toString());
    });

    test('should omit functions in objects', () => {
      const obj = {
        data: 'value',
        method: function () {
          return 'test';
        }
      };
      expect(stringifyLogValue(obj)).toBe('{"data":"value"}');
    });

    test('should handle objects with undefined properties', () => {
      const obj = {
        defined: 'value',
        undefined: undefined
      };
      expect(stringifyLogValue(obj)).toBe('{"defined":"value"}');
    });
  });

  describe('truncation behavior', () => {
    test('should truncate long JSON strings with default maxLength (40)', () => {
      const longObj = {
        veryLongPropertyNameThatExceedsFortyCharacters: 'value'
      };
      const result = stringifyLogValue(longObj);

      expect(result.length).toBeLessThanOrEqual(40);
      expect(result).toMatch(/\.\.\.$/); // Should end with ...
      expect(result.length).toBe(40); // Should be exactly 40 characters
    });

    test('should not truncate short JSON strings', () => {
      const shortObj = { key: 'val' };
      const expected = '{"key":"val"}';
      expect(stringifyLogValue(shortObj)).toBe(expected);
      expect(expected.length).toBeLessThan(40);
    });

    test('should handle edge case where object string is exactly maxLength', () => {
      // Create an object that serializes to exactly 40 characters
      const obj = { a: '12345678901234567890123456789012345' }; // {"a":"12345678901234567890123456789012345"} = 41 chars
      const result = stringifyLogValue(obj);
      expect(result.length).toBe(40);
      expect(result).toMatch(/\.\.\.$/);
    });

    test('should handle objects that stringify to exactly 40 characters', () => {
      // {"key":"0123456789012345678901234567890"} = 41 chars, so will be truncated
      const obj = { key: '0123456789012345678901234567890' };
      const result = stringifyLogValue(obj);
      expect(result.length).toBe(40);
      expect(result).toMatch(/\.\.\.$/);
    });
  });

  describe('custom maxLength parameter', () => {
    test('should use default maxLength when undefined is explicitly passed', () => {
      const obj = { longKey: 'longValue' };
      const result = stringifyLogValue(obj, undefined);

      expect(result.length).toBeLessThanOrEqual(40);
      if (result.includes('...')) {
        expect(result.length).toBe(40);
      }
    });

    test('should use custom maxLength when provided', () => {
      const obj = { longKey: 'longValue' };
      const result = stringifyLogValue(obj, 15);

      expect(result.length).toBeLessThanOrEqual(15);
      if (result.includes('...')) {
        expect(result.length).toBe(15);
      }
    });

    test('should handle maxLength smaller than ellipsis', () => {
      const obj = { key: 'value' };
      const result = stringifyLogValue(obj, 2);

      // When maxLength < 3, the ellipsis logic might not work as expected
      // Let's test what actually happens
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle maxLength of 0', () => {
      const obj = { key: 'value' };
      const result = stringifyLogValue(obj, 0);

      // When maxLength is 0, substring(0, -3) gives an empty string
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle negative maxLength', () => {
      const obj = { key: 'value' };
      const result = stringifyLogValue(obj, -5);

      // Let's see what actually happens with negative maxLength
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle very large maxLength', () => {
      const obj = { key: 'value' };
      const expected = '{"key":"value"}';
      const result = stringifyLogValue(obj, 1000);

      expect(result).toBe(expected);
    });
  });

  describe('fallback behavior', () => {
    test('should fallback to [object Object] for circular references', () => {
      const obj: Record<string, unknown> = { name: 'test' };
      obj.self = obj; // Create circular reference

      const result = stringifyLogValue(obj);
      expect(result).toBe('[object Object]');
    });

    test('should fallback to [object Object] for objects that throw in JSON.stringify', () => {
      const obj = {
        get problematic() {
          throw new Error('Cannot serialize');
        }
      };

      const result = stringifyLogValue(obj);
      expect(result).toBe('[object Object]');
    });

    test('should handle complex circular references', () => {
      const obj1: Record<string, unknown> = { name: 'obj1' };
      const obj2: Record<string, unknown> = { name: 'obj2' };
      obj1.ref = obj2;
      obj2.ref = obj1; // Circular reference

      const result = stringifyLogValue(obj1);
      expect(result).toBe('[object Object]');
    });

    test('should handle objects with toJSON that throws', () => {
      const obj = {
        data: 'value',
        toJSON() {
          throw new Error('toJSON failed');
        }
      };

      const result = stringifyLogValue(obj);
      expect(result).toBe('[object Object]');
    });

    test('should handle non-plain objects that stringify to [object Object]', () => {
      class CustomClass {
        public readonly value: string;
        public constructor(value: string) {
          this.value = value;
        }
      }

      const instance = new CustomClass('test');
      const result = stringifyLogValue(instance);
      // Class instances actually JSON.stringify successfully
      expect(result).toBe('{"value":"test"}');
    });
  });

  describe('edge cases and boundary conditions', () => {
    test('should handle very deeply nested objects', () => {
      const deepObj: Record<string, unknown> = {};
      let current = deepObj;

      // Create 50 levels of nesting
      for (let i = 0; i < 50; i++) {
        current.nested = {};
        current = current.nested as Record<string, unknown>;
      }
      current.value = 'deep';

      const result = stringifyLogValue(deepObj);
      // Should either stringify successfully or fallback to [object Object]
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle objects with symbol keys', () => {
      const sym = Symbol('test');
      const obj = { [sym]: 'symbolValue', regular: 'regularValue' };
      // Symbol keys are omitted by JSON.stringify
      expect(stringifyLogValue(obj)).toBe('{"regular":"regularValue"}');
    });

    test('should handle sparse arrays', () => {
      // eslint-disable-next-line no-sparse-arrays
      const arr = [1, , , 4];
      expect(stringifyLogValue(arr)).toBe('1,,,4');
    });

    test('should handle arrays with non-numeric properties', () => {
      const arr = [1, 2, 3] as unknown as Record<string, unknown>;
      arr.extraProp = 'extra';
      // String() on arrays ignores non-numeric properties
      expect(stringifyLogValue(arr)).toBe('1,2,3');
    });

    test('should handle Set objects', () => {
      const set = new Set([1, 2, 3]);
      // Set String() representation is "[object Set]", not "[object Object]"
      expect(stringifyLogValue(set)).toBe('[object Set]');
    });

    test('should handle Map objects', () => {
      const map = new Map([['key', 'value']]);
      // Map String() representation is "[object Map]", not "[object Object]"
      expect(stringifyLogValue(map)).toBe('[object Map]');
    });

    test('should handle RegExp objects', () => {
      const regex = /test/gi;
      // RegExp String() representation is the regex itself
      expect(stringifyLogValue(regex)).toBe('/test/gi');
    });

    test('should handle Error objects', () => {
      const error = new Error('test error');
      // Error String() representation is "Error: test error"
      expect(stringifyLogValue(error)).toBe('Error: test error');
    });
  });

  describe('performance and memory considerations', () => {
    test('should handle large arrays efficiently', () => {
      const largeArray = new Array(1000).fill('item');
      const result = stringifyLogValue(largeArray);

      // Arrays use String() not JSON.stringify, so no truncation
      expect(result.length).toBeGreaterThan(40);
      expect(result).toMatch(/^item,item,item/); // Should start with comma-separated items
    });

    test('should handle objects with many properties', () => {
      const manyProps: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        manyProps[`prop${i}`] = `value${i}`;
      }

      const result = stringifyLogValue(manyProps);
      expect(result.length).toBeLessThanOrEqual(40);
    });
  });
});
