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
  KeyValueConverters,
  ResultMap,
  ConvertingResultMapValueConverter,
  ValidatingReadOnlyConvertingResultMap,
  ValidatingConvertingResultMap
} from '../../../packlets/collections';
import { Converters } from '../../../packlets/conversion';

interface ISourceItem {
  id: string;
  value: number;
}

interface ITargetItem {
  id: string;
  doubledValue: number;
  label: string;
}

const itemKeyConverter = Converters.string.withConstraint((s) => /^[a-z]$/.test(s));

const targetItemConverter = Converters.strictObject<ITargetItem>({
  id: Converters.string,
  doubledValue: Converters.number,
  label: Converters.string
});

describe('ValidatingReadOnlyConvertingResultMap', () => {
  const converter: ConvertingResultMapValueConverter<string, ISourceItem, ITargetItem> = (src, key) => {
    return succeed({
      id: src.id,
      doubledValue: src.value * 2,
      label: `Item ${key}`
    });
  };

  const converters = new KeyValueConverters<string, ITargetItem>({
    key: itemKeyConverter,
    value: targetItemConverter
  });

  function createSourceMap(): ResultMap<string, ISourceItem> {
    return new ResultMap<string, ISourceItem>([
      ['a', { id: 'a', value: 1 }],
      ['b', { id: 'b', value: 2 }],
      ['c', { id: 'c', value: 3 }]
    ]);
  }

  describe('constructor', () => {
    test('creates a validating converting map', () => {
      const inner = createSourceMap();
      const map = new ValidatingReadOnlyConvertingResultMap({ inner, converter, converters });
      expect(map.size).toBe(3);
      expect(map.validating).toBeDefined();
    });
  });

  describe('create static method', () => {
    test('returns Success with a new map', () => {
      const inner = createSourceMap();
      expect(
        ValidatingReadOnlyConvertingResultMap.create({ inner, converter, converters })
      ).toSucceedAndSatisfy((map) => {
        expect(map.size).toBe(3);
        expect(map.validating).toBeDefined();
      });
    });
  });

  describe('validating property', () => {
    describe('get method', () => {
      test('returns converted value for valid key', () => {
        const inner = createSourceMap();
        const map = new ValidatingReadOnlyConvertingResultMap({ inner, converter, converters });

        expect(map.validating.get('a')).toSucceedAndSatisfy((item) => {
          expect(item).toEqual({
            id: 'a',
            doubledValue: 2,
            label: 'Item a'
          });
        });
      });

      test('fails with invalid-key for invalid key format', () => {
        const inner = createSourceMap();
        const map = new ValidatingReadOnlyConvertingResultMap({ inner, converter, converters });

        expect(map.validating.get('invalid_key')).toFailWithDetail(/invalid/, 'invalid-key');
      });

      test('fails with not-found for valid but missing key', () => {
        const inner = createSourceMap();
        const map = new ValidatingReadOnlyConvertingResultMap({ inner, converter, converters });

        expect(map.validating.get('z')).toFailWithDetail(/not found/, 'not-found');
      });
    });

    describe('has method', () => {
      test('returns true for existing valid key', () => {
        const inner = createSourceMap();
        const map = new ValidatingReadOnlyConvertingResultMap({ inner, converter, converters });

        expect(map.validating.has('a')).toBe(true);
      });

      test('returns false for invalid key', () => {
        const inner = createSourceMap();
        const map = new ValidatingReadOnlyConvertingResultMap({ inner, converter, converters });

        expect(map.validating.has('invalid_key')).toBe(false);
      });

      test('returns false for valid but missing key', () => {
        const inner = createSourceMap();
        const map = new ValidatingReadOnlyConvertingResultMap({ inner, converter, converters });

        expect(map.validating.has('z')).toBe(false);
      });
    });

    describe('map property', () => {
      test('returns the underlying map', () => {
        const inner = createSourceMap();
        const map = new ValidatingReadOnlyConvertingResultMap({ inner, converter, converters });

        expect(map.validating.map).toBe(map);
      });
    });
  });
});

describe('ValidatingConvertingResultMap', () => {
  const converter: ConvertingResultMapValueConverter<string, ISourceItem, ITargetItem> = (src, key) => {
    return succeed({
      id: src.id,
      doubledValue: src.value * 2,
      label: `Item ${key}`
    });
  };

  const converters = new KeyValueConverters<string, ITargetItem>({
    key: itemKeyConverter,
    value: targetItemConverter
  });

  function createSourceMap(): ResultMap<string, ISourceItem> {
    return new ResultMap<string, ISourceItem>([
      ['a', { id: 'a', value: 1 }],
      ['b', { id: 'b', value: 2 }],
      ['c', { id: 'c', value: 3 }]
    ]);
  }

  describe('constructor', () => {
    test('creates a validating converting map with source access', () => {
      const inner = createSourceMap();
      const map = new ValidatingConvertingResultMap({ inner, converter, converters });
      expect(map.size).toBe(3);
      expect(map.validating).toBeDefined();
      expect(map.source).toBeDefined();
    });
  });

  describe('create static method', () => {
    test('returns Success with a new map', () => {
      const inner = createSourceMap();
      expect(ValidatingConvertingResultMap.create({ inner, converter, converters })).toSucceedAndSatisfy(
        (map) => {
          expect(map.size).toBe(3);
          expect(map.validating).toBeDefined();
          expect(map.source).toBeDefined();
        }
      );
    });
  });

  describe('validating property', () => {
    test('validates keys before accessing converted values', () => {
      const inner = createSourceMap();
      const map = new ValidatingConvertingResultMap({ inner, converter, converters });

      expect(map.validating.get('a')).toSucceedAndSatisfy((item) => {
        expect(item.doubledValue).toBe(2);
      });

      expect(map.validating.get('invalid')).toFailWithDetail(/invalid/, 'invalid-key');
    });
  });

  describe('source property', () => {
    test('allows mutation of source values', () => {
      const inner = createSourceMap();
      const map = new ValidatingConvertingResultMap({ inner, converter, converters });

      expect(map.source.set('a', { id: 'a', value: 10 })).toSucceed();

      expect(map.get('a')).toSucceedAndSatisfy((item) => {
        expect(item.doubledValue).toBe(20);
      });
    });
  });

  describe('integration', () => {
    test('validating access works after source mutation', () => {
      const inner = createSourceMap();
      const map = new ValidatingConvertingResultMap({ inner, converter, converters });

      expect(map.validating.get('a')).toSucceedAndSatisfy((item) => {
        expect(item.doubledValue).toBe(2);
      });

      map.source.set('a', { id: 'a', value: 100 }).orThrow();

      expect(map.validating.get('a')).toSucceedAndSatisfy((item) => {
        expect(item.doubledValue).toBe(200);
      });
    });
  });
});
