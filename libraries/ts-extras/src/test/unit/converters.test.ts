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

import { Converters } from '@fgv/ts-utils';
import '@fgv/ts-utils-jest';

import { Converters as ExtraConverters } from '../..';
import { ExtendedArray, RangeOf } from '../../packlets/experimental';

describe('Converters module', () => {
  describe('extendedArrayOf converter', () => {
    test('converts a valid array', () => {
      const srcArray = ['s1', 's2', 's3'];
      expect(
        ExtraConverters.extendedArrayOf('strings', Converters.string).convert(srcArray)
      ).toSucceedAndSatisfy((got: ExtendedArray<string>) => {
        expect(got.first()).toSucceedWith('s1');
      });
    });

    test('fails an array which contains values that cannot be converted if onError is "fail"', () => {
      const srcArray = ['s1', 's2', 's3', 10];
      expect(
        ExtraConverters.extendedArrayOf('strings', Converters.string, 'failOnError').convert(srcArray)
      ).toFailWith(/not a string/i);
    });

    test('ignores values that cannot be converted if onError is "ignore"', () => {
      const validArray = ['s1', 's2', 's3'];
      const badArray = [100, ...validArray, 10];
      expect(
        ExtraConverters.extendedArrayOf('strings', Converters.string, 'ignoreErrors').convert(badArray)
      ).toSucceedAndSatisfy((got: ExtendedArray<string>) => {
        expect(got.all()).toEqual(validArray);
      });
    });

    test('defaults to onError="failOnError"', () => {
      expect(ExtraConverters.extendedArrayOf('strings', Converters.string).convert([true])).toFail();
    });

    test('ignores undefined values returned by a converter', () => {
      const validArray = ['s1', 's2', 's3'];
      const badArray = [100, ...validArray, 10];
      expect(
        ExtraConverters.extendedArrayOf('strings', Converters.string.optional('ignoreErrors')).convert(
          badArray
        )
      ).toSucceedAndSatisfy((got: ExtendedArray<string | undefined>) => {
        expect(got.all()).toEqual(validArray);
      });
    });

    test('fails when converting a non-array', () => {
      expect(ExtraConverters.extendedArrayOf('strings', Converters.string).convert(123)).toFailWith(
        /not an array/i
      );
    });

    test('passes a supplied context to the base converter', () => {
      const context = { value: 'expected' };
      const sourceArray = ['{{value}} is expected', 'hello'];
      const expected = ['expected is expected', 'hello'];
      expect(
        ExtraConverters.extendedArrayOf('templateStrings', Converters.templateString()).convert(
          sourceArray,
          context
        )
      ).toSucceedWith(expect.arrayContaining(expected));
    });
  });

  describe('rangeOf converter', () => {
    const min = 0;
    const max = 1000;
    const converter = ExtraConverters.rangeOf(Converters.number);
    test('converts a range with valid or omitted min and max specifications', () => {
      const expected = [{ min, max }, { min }, { max }, {}];
      const toConvert = expected.map((x) => {
        const result: { min?: unknown; max?: unknown } = {};
        if (x.min !== undefined) {
          result.min = `${x.min}`;
        }
        if (x.max !== undefined) {
          result.max = x.max.toString();
        }
        return result;
      });

      for (let i = 0; i < toConvert.length; i++) {
        expect(converter.convert(toConvert[i])).toSucceedWith(expected[i] as RangeOf<number>);
      }
    });

    test('converts and ignore extra fields', () => {
      const expected = { min, max };
      const conversion = converter.convert({
        min,
        max,
        extra: 'whatever'
      });
      expect(conversion).toSucceedWith(expected as RangeOf<number>);
    });

    test('fails if either min or max is invalid', () => {
      const bad = [{ min: 'not a number' }, { min, max: true }];
      for (const t of bad) {
        expect(converter.convert(t)).toFailWith(/not a number/i);
      }
    });

    test('fails if the range is inverted', () => {
      const bad = { min: max, max: min };
      expect(converter.convert(bad)).toFailWith(/inverted/i);
    });
  });
});
