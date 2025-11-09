/*
 * Copyright (c) 2020 Erik Fortune
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

import {
  classifyJsonValue,
  isJsonObject,
  isJsonPrimitive,
  pickJsonObject,
  pickJsonValue,
  sanitizeJsonObject
} from '../../packlets/json';

describe('json/common module', () => {
  describe('isJsonObject function', () => {
    test('returns true for a JSON object', () => {
      expect(isJsonObject({ prop: 'value' })).toBe(true);
    });

    test('returns false for a non-object or an array', () => {
      [
        'hello',
        true,
        10,
        [{ property: 'value' }],
        () => {
          return { property: 'value' };
        }
      ].forEach((t) => {
        expect(isJsonObject(t)).toBe(false);
      });
    });

    test('returns false for objects with symbol keys', () => {
      const sym1 = Symbol('test');
      const sym2 = Symbol('another');

      // Object with only symbol keys
      const symbolOnly = { [sym1]: 'value1' };
      expect(isJsonObject(symbolOnly)).toBe(false);

      // Object with mixed string and symbol keys
      const mixed = {
        stringKey: 'value',
        [sym1]: 'symbolValue1',
        [sym2]: 'symbolValue2'
      };
      expect(isJsonObject(mixed)).toBe(false);

      // Object with well-known symbol
      const withWellKnown = {
        normal: 'value',
        [Symbol.iterator]: function* () {
          yield 1;
        }
      };
      expect(isJsonObject(withWellKnown)).toBe(false);
    });

    test('returns true for objects with only string keys', () => {
      const validObjects = [
        {},
        { a: 1 },
        { stringKey: 'value', numberKey: 42, boolKey: true, nullKey: null },
        { nested: { deep: { value: 'test' } } }
      ];

      validObjects.forEach((obj) => {
        expect(isJsonObject(obj)).toBe(true);
      });
    });

    test('returns false for special objects that are not JSON-compatible', () => {
      const specialObjects = [new Date(), new RegExp('test'), new Map(), new Set(), new Error('test')];

      specialObjects.forEach((obj) => {
        expect(isJsonObject(obj)).toBe(false);
      });
    });
  });

  describe('isJsonPrimitive function', () => {
    test('returns true for a JSON primitive', () => {
      ['string', 10, true, null].forEach((t) => {
        expect(isJsonPrimitive(t)).toBe(true);
      });
    });

    test('returns false for non-JSON primitives', () => {
      [[1, 2, 3], { a: true }, () => 'hello'].forEach((t) => {
        expect(isJsonPrimitive(t)).toBe(false);
      });
    });
  });

  describe('classifyJsonValue function', () => {
    test('returns "primitive" for a valid JsonPrimitive', () => {
      ['string', 10, true, null].forEach((t) => {
        expect(classifyJsonValue(t)).toSucceedWith('primitive');
      });
    });

    test('returns "object" for a non-array object', () => {
      [{ prop: 'value ' }].forEach((t) => {
        expect(classifyJsonValue(t)).toSucceedWith('object');
      });
    });

    test('returns "array" for an array', () => {
      [[{ prop: 'value ' }, 1]].forEach((t) => {
        expect(classifyJsonValue(t)).toSucceedWith('array');
      });
    });

    test('fails for invalid JSON values', () => {
      [() => 'hello', undefined].forEach((t) => {
        expect(classifyJsonValue(t)).toFailWith(/invalid json/i);
      });
    });

    test('fails for objects with symbol keys', () => {
      const sym = Symbol('test');
      const objectsWithSymbols = [
        { [sym]: 'value' },
        { normal: 'value', [sym]: 'symbolValue' },
        {
          [Symbol.iterator]: function* () {
            yield 1;
          }
        }
      ];

      objectsWithSymbols.forEach((obj) => {
        expect(classifyJsonValue(obj)).toFailWith(/invalid json/i);
      });
    });
  });

  describe('pick functions', () => {
    const src = {
      topString: 'top',
      child: {
        childArray: [1, 2, 3],
        childString: 'hello',
        childNull: null,
        grandChild: {
          grandChildNumber: 1
        }
      }
    };

    describe('pickJsonValue', () => {
      test('picks nested properties that exist', () => {
        [
          {
            path: 'topString',
            expected: src.topString
          },
          {
            path: 'child.grandChild',
            expected: src.child.grandChild
          },
          {
            path: 'child.childNull',
            expected: src.child.childNull
          }
        ].forEach((t) => {
          expect(pickJsonValue(src, t.path)).toSucceedWith(t.expected);
        });
      });

      test('fails for nested properties that do not exist', () => {
        [
          'topstring',
          'topString.childString',
          'child.grandChild.number',
          'childString',
          'child.childNull.property'
        ].forEach((t) => {
          expect(pickJsonValue(src, t)).toFailWith(/does not exist/i);
        });
      });
    });

    describe('pickJsonObject', () => {
      test('succeeds for an object property', () => {
        [
          {
            path: 'child.grandChild',
            expected: src.child.grandChild
          }
        ].forEach((t) => {
          expect(pickJsonObject(src, t.path)).toSucceedWith(t.expected);
        });
      });

      test('fails for a non-object property that exists', () => {
        expect(pickJsonObject(src, 'child.childArray')).toFailWith(/not an object/i);
        expect(pickJsonObject(src, 'child.grandChild.grandChildNumber')).toFailWith(/not an object/i);
      });
    });
  });

  describe('sanitizeJsonObject function', () => {
    test('returns a sanitized object', () => {
      interface ITestThing {
        a: string;
        b?: string;
      }

      expect(sanitizeJsonObject<ITestThing>({ a: 'hello' })).toSucceedWith({ a: 'hello' });
      expect(sanitizeJsonObject<ITestThing>({ a: 'hello', b: 'world' })).toSucceedWith({
        a: 'hello',
        b: 'world'
      });
      expect(sanitizeJsonObject<ITestThing>({ a: 'hello', b: undefined })).toSucceedWith({
        a: 'hello'
      });
    });
  });
});
