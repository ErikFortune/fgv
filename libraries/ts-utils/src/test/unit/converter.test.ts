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

import '../helpers/jest';

import { Result, fail, succeed } from '../../packlets/base';
import { BaseConverter, Converter, Converters } from '../../packlets/conversion';
import { Conversion } from '../..';

interface ITestContext {
  value: string;
}

describe('BaseConverter class', () => {
  const numberConverter = new BaseConverter<number>((from: unknown) => {
    if (typeof from !== 'number') {
      const num: number = typeof from === 'string' ? Number(from) : NaN;
      return isNaN(num) ? fail(`Not a number: ${JSON.stringify(from)}`) : succeed(num);
    }
    return succeed(from);
  });
  const stringConverter = new BaseConverter<string>((from: unknown) => {
    return typeof from === 'string' ? succeed(from as string) : fail(`Not a string: ${JSON.stringify(from)}`);
  });
  const contextConverter = new BaseConverter<string, ITestContext>(
    (from: unknown, __self: Converter<string, ITestContext>, context?: ITestContext): Result<string> => {
      if (typeof from === 'string') {
        const v = context?.value ?? '';
        return succeed(from.replace('{{value}}', v));
      }
      return fail('Cannot convert non-string');
    },
    { value: 'DEFAULT VALUE' }
  );

  describe('convert method', () => {
    test('passes context if supplied', () => {
      expect(contextConverter.convert('{{value}} is expected', { value: 'expected' })).toSucceedWith(
        'expected is expected'
      );
    });

    test('uses default context if no context is supplied', () => {
      expect(contextConverter.convert('{{value}} is expected')).toSucceedWith('DEFAULT VALUE is expected');
    });
  });

  describe('convertOptional method', () => {
    test('ignores errors by default', () => {
      expect(stringConverter.convertOptional(true)).toSucceed();
    });

    test('passes context if supplied', () => {
      expect(contextConverter.convertOptional('{{value}} is expected', { value: 'expected' })).toSucceedWith(
        'expected is expected'
      );
    });

    test('uses default context if no context is supplied', () => {
      expect(contextConverter.convertOptional('{{value}} is expected')).toSucceedWith(
        'DEFAULT VALUE is expected'
      );
    });
  });

  describe('optional method', () => {
    describe('with failOnError', () => {
      const optionalString = stringConverter.optional('failOnError');

      test('converts a valid value  or undefined as expected', () => {
        ['a string', '', 'true', '10', undefined].forEach((v) => {
          expect(optionalString.convert(v)).toSucceedWith(v);
        });
      });
      test('fails for an invalid value', () => {
        [10, true, [], (): string => 'hello'].forEach((v) => {
          expect(optionalString.convert(v)).toFailWith(/not a string/i);
        });
      });

      test('reports converter is explicitly optional', () => {
        expect(optionalString.isOptional).toBe(true);
      });
    });

    describe('with ignoreErrors', () => {
      const optionalString = stringConverter.optional('ignoreErrors');

      test('converts a valid value or undefined as expected', () => {
        ['a string', '', 'true', '10', undefined].forEach((v) => {
          expect(optionalString.convert(v)).toSucceedWith(v);
        });
      });
      test('succeeds and returns undefined for an invalid value', () => {
        [10, true, [], (): string => 'hello'].forEach((v) => {
          expect(optionalString.convert(v)).toSucceedWith(undefined);
        });
      });
    });

    describe('with default conversion', () => {
      test('fails', () => {
        const optionalString = stringConverter.optional();
        expect(optionalString.convert(true)).toFailWith(/not a string/i);
      });
    });

    test('passes context to base converter', () => {
      const optionalTest = contextConverter.optional();
      expect(optionalTest.convert('{{value}} is expected', { value: 'expected' })).toSucceedWith(
        'expected is expected'
      );
    });

    test('passes default context to base converter if none supplied', () => {
      const optionalTest = contextConverter.optional();
      expect(optionalTest.convert('{{value}} is expected')).toSucceedWith('DEFAULT VALUE is expected');
    });
  });

  describe('map method', () => {
    const targetString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const mapper = (count: number): Result<string> => {
      if (count > 0 && count < targetString.length) {
        return succeed(targetString.substring(0, count));
      }
      return fail(`Count ${count} is out of range.`);
    };
    const mappingConverter = numberConverter.map(mapper);

    test('applies a mapping function to a successful conversion', () => {
      expect(mappingConverter.convert(3)).toSucceedWith(targetString.substring(0, 3));
    });

    test('reports a mapping failure for an otherwise successful conversion', () => {
      expect(mappingConverter.convert(-1)).toFailWith(/out of range/i);
    });

    test('reports a conversion failure without applying the mapping function', () => {
      expect(mappingConverter.convert('test')).toFailWith(/not a number/i);
    });

    test('passes a supplied context to the base converter', () => {
      const testMap = contextConverter.map((from: string): Result<{ got: string }> => {
        return succeed({ got: from });
      });
      expect(testMap.convert('{{value}} is expected', { value: 'expected' })).toSucceedWith({
        got: 'expected is expected'
      });
    });

    test('passes default context to the base converter if no context is supplied', () => {
      const testMap = contextConverter.map((from: string): Result<{ got: string }> => {
        return succeed({ got: from });
      });
      expect(testMap.convert('{{value}} is expected')).toSucceedWith({
        got: 'DEFAULT VALUE is expected'
      });
    });

    test('passes context to the map function', () => {
      const testMap = contextConverter.map(
        (from: string, context?: ITestContext): Result<{ got: string }> => {
          return succeed({ got: `${from} with context ${context?.value ?? 'undefined'}` });
        }
      );
      expect(testMap.convert('{{value}} is expected', { value: 'expected' })).toSucceedWith({
        got: 'expected is expected with context expected'
      });
    });
  });

  describe('mapConvert method', () => {
    const converter = stringConverter.mapConvert(numberConverter);

    test('applies a second converter to a successful conversion', () => {
      expect(converter.convert('100')).toSucceedWith(100);
    });

    test('reports a failure from the chained converter', () => {
      expect(converter.convert('fred')).toFailWith(/not a number/i);
    });

    test('reports a failure from the initial conversion without invoking the second', () => {
      expect(converter.convert(true)).toFailWith(/not a string/i);
    });

    test('passes a supplied context to the base converter', () => {
      const tc = new BaseConverter<{ got: string }>((from: unknown) => {
        return succeed({ got: from as string });
      });
      const cc = contextConverter.mapConvert(tc);
      expect(cc.convert('{{value}} is expected', { value: 'expected' })).toSucceedWith({
        got: 'expected is expected'
      });
    });

    test('passes default context to the base converter if none is supplied', () => {
      const tc = new BaseConverter<{ got: string }>((from: unknown) => {
        return succeed({ got: from as string });
      });
      const cc = contextConverter.mapConvert(tc);
      expect(cc.convert('{{value}} is expected')).toSucceedWith({
        got: 'DEFAULT VALUE is expected'
      });
    });

    test('passes context to the chained converter', () => {
      const tc = new BaseConverter<{ got: string }, ITestContext>(
        (from: unknown, __self: Converter<{ got: string }, ITestContext>, context?: ITestContext) => {
          return succeed({ got: `${from as string} with context ${context?.value ?? 'undefined'}` });
        }
      );
      const cc = contextConverter.mapConvert(tc);
      expect(cc.convert('{{value}} is expected', { value: 'expected' })).toSucceedWith({
        got: 'expected is expected with context expected'
      });
    });
  });

  describe('mapItems', () => {
    function mapNumber(from: unknown, context?: number): Result<number> {
      const n = Number(from);
      if (context && n === context) {
        return fail(`${n} matches context`);
      }
      return Number.isNaN(n) ? fail('not a number') : succeed(n);
    }

    const converter: Converter<number[], number> = Converters.arrayOf<string, number>(
      new Conversion.StringConverter<string, number>()
    ).mapItems(mapNumber);

    test('it succeeds for an array with all valid elements', () => {
      expect(converter.convert(['10', '20'])).toSucceedWith([10, 20]);
    });

    test('it fails for an array with invalid elements', () => {
      expect(converter.convert(['10', '{}'])).toFailWith(/not a number/i);
    });

    test('it fails for a non-array', () => {
      expect(converter.mapItems(mapNumber).convert('10')).toFailWith(/not an array/i);
    });

    test('passes context to the inner map function', () => {
      expect(converter.convert(['10', '20'], 20)).toFailWith('20 matches context');
    });
  });

  describe('mapConvertItems', () => {
    const testStringArray = Converters.arrayOf<string, number>(
      new Conversion.StringConverter<string, number>()
    );
    const itemConverter = new BaseConverter<number, number>(
      (from: unknown, __self: unknown, context?: number): Result<number> => {
        const n = Number(from);
        if (context && n === context) {
          return fail(`${n} matches context`);
        }
        return Number.isNaN(n) ? fail('not a number') : succeed(n);
      }
    );
    const converter: Converter<number[], number> = testStringArray.mapConvertItems(itemConverter);

    test('succeeds for an array with all valid elements', () => {
      expect(converter.convert(['10', '20'])).toSucceedWith([10, 20]);
    });

    test('fails for an array with invalid elements', () => {
      expect(converter.convert(['10', '{}'])).toFailWith(/not a number/i);
    });

    test('fails for a non-array', () => {
      expect(stringConverter.mapConvertItems(numberConverter).convert('10')).toFailWith(/not an array/i);
    });

    test('passes context to the inner converter', () => {
      expect(converter.convert(['10', '20'], 20)).toFailWith('20 matches context');
    });
  });

  describe('with an action', () => {
    const converter = numberConverter.withAction((r, context?: unknown) => {
      if (context && typeof context === 'number' && r.success && r.value === context) {
        return fail(`${r.value} matches context`);
      }
      return r.success ? succeed(r.value + 1) : fail('action ate the error');
    });

    test('passes result of a successful conversion to the action', () => {
      expect(converter.convert(10)).toSucceedWith(11);
    });

    test('passes result of failed conversion to the action', () => {
      expect(converter.convert('not a number')).toFailWith('action ate the error');
    });

    test('passes context to the action', () => {
      expect(converter.convert(10, 10)).toFailWith('10 matches context');
    });
  });

  describe('with type guards', () => {
    type Thing = 'thing1' | 'thing2';
    function isThing(from: unknown, context?: unknown): from is Thing {
      return from === 'thing1' || from === 'thing2' || from === context;
    }

    describe('withTypeGuard method', () => {
      test('succeeds for a value that passes the guard', () => {
        const converter: Converter<Thing> = stringConverter.withTypeGuard(isThing);
        expect(converter.convert('thing1')).toSucceedWith('thing1');
      });

      test('fails for a value that fails the guard', () => {
        const converter: Converter<Thing> = stringConverter.withTypeGuard(isThing);
        expect(converter.convert('thing3')).toFailWith(/invalid type/i);
      });

      test('fails with a custom message for a value that fails the guard', () => {
        const converter: Converter<Thing> = stringConverter.withTypeGuard(isThing, 'not a known thing');
        expect(converter.convert('thing3')).toFailWith(/not a known thing/i);
      });

      test('passes context to the type guard', () => {
        const converter: Converter<Thing> = stringConverter.withTypeGuard(isThing, 'not a known thing');
        expect(converter.convert('thing11')).toFailWith(/not a known thing/i);
        expect(converter.convert('thing11', 'thing11')).toSucceedWith('thing11' as Thing);
      });

      test('fails with the standard message for a value that fails initial conversion', () => {
        const converter: Converter<Thing> = stringConverter.withTypeGuard(isThing, 'not a known thing');
        expect(converter.convert({})).toFailWith(/not a string/i);
      });
    });

    describe('withItemTypeGuard method', () => {
      test('succeeds for an array of values that pass the guard', () => {
        const converter: Converter<Thing[], unknown> = Converters.stringArray.withItemTypeGuard(isThing);
        expect(converter.convert(['thing1', 'thing2'])).toSucceedWith(['thing1', 'thing2']);
      });

      test('fails for a value that fails the guard', () => {
        const converter: Converter<Thing[], unknown> = Converters.stringArray.withItemTypeGuard(isThing);
        expect(converter.convert(['thing3'])).toFailWith(/invalid type/i);
      });

      test('fails with a custom message for a value that fails the guard', () => {
        const converter: Converter<Thing[], unknown> = Converters.stringArray.withItemTypeGuard(
          isThing,
          'not a known thing'
        );
        expect(converter.convert(['thing3'])).toFailWith(/not a known thing/i);
      });

      test('passes context to the type guard', () => {
        const converter: Converter<Thing[], unknown> = Converters.stringArray.withItemTypeGuard(
          isThing,
          'not a known thing'
        );
        expect(converter.convert(['thing11'])).toFailWith(/not a known thing/i);
        expect(converter.convert(['thing11'], 'thing11')).toSucceedWith(['thing11' as Thing]);
      });

      test('fails with the standard message for a value that fails initial conversion', () => {
        const converter: Converter<Thing[], unknown> = Converters.stringArray.withItemTypeGuard(
          isThing,
          'not a known thing'
        );
        expect(converter.convert([{}])).toFailWith(/not a string/i);
      });

      test('fails if the converted value is not an array', () => {
        const converter = stringConverter.withItemTypeGuard(isThing, 'not a known thing');
        expect(converter.convert('thing1')).toFailWith(/not an array/i);
      });
    });
  });

  describe('withConstraint method', () => {
    describe('with a boolean constraint', () => {
      const constrained = numberConverter.withConstraint(
        (n, context?: unknown) => (n >= 0 && n <= 100) || n === context
      );
      test('converts a valid value as expected', () => {
        [0, 100, '50'].forEach((v) => {
          expect(constrained.convert(v)).toSucceedWith(Number(v));
        });
      });

      test('fails for an otherwise valid value that does not meet a boolean constraint', () => {
        [-1, 200, '101'].forEach((v) => {
          expect(constrained.convert(v)).toFailWith(/constraint/i);
        });
      });

      test('passes context to the constraint function', () => {
        expect(constrained.convert(1000)).toFailWith(/constraint/i);
        expect(constrained.convert(1000, 1000)).toSucceedWith(1000);
      });

      test('propagates the error for an invalid value', () => {
        ['hello', {}, true].forEach((v) => {
          expect(constrained.convert(v)).toFailWith(/not a number/i);
        });
      });

      test('uses a description if supplied', () => {
        const withMessage = numberConverter.withConstraint((n) => n >= 0 && n <= 100, {
          description: 'out of range'
        });
        expect(withMessage.convert(200)).toFailWith('"200": out of range');
      });
    });

    describe('with a Result constraint', () => {
      const constrained = numberConverter.withConstraint((n) => {
        return n >= 0 && n <= 100 ? succeed(n) : fail('out of range');
      });

      test('converts a valid value as expected', () => {
        [0, 100, '50'].forEach((v) => {
          expect(constrained.convert(v)).toSucceedWith(Number(v));
        });
      });

      test('fails for an otherwise valid value that does not meet a result constraint', () => {
        [-1, 200, '101'].forEach((v) => {
          expect(constrained.convert(v)).toFailWith(/out of range/i);
        });
      });

      test('propagates the error for an invalid value', () => {
        ['hello', {}, true].forEach((v) => {
          expect(constrained.convert(v)).toFailWith(/not a number/i);
        });
      });

      test('propagates error instead of default description', () => {
        const withMessage = numberConverter.withConstraint(
          (n) => (n >= 0 && n <= 100 ? succeed(n) : fail('out of range')),
          { description: 'DEFAULT DESCRIPTION' }
        );
        expect(withMessage.convert(200)).toFailWith('out of range');
      });
    });

    test('passes a supplied context to the base converter', () => {
      const constrained = contextConverter.withConstraint((s) => s.includes('expected'));
      expect(constrained.convert('{{value}} is expected', { value: 'expected' })).toSucceedWith(
        'expected is expected'
      );
    });

    test('passes the default context to the base converter if none is supplied', () => {
      const constrained = contextConverter.withConstraint((s) => s.includes('expected'));
      expect(constrained.convert('{{value}} is expected')).toSucceedWith('DEFAULT VALUE is expected');
    });
  });

  describe('withBrand method', () => {
    test('brands string types', () => {
      const str1Converter = Converters.string.withBrand('STRING1');
      const str2Converter = Converters.string.withBrand('STRING2');
      const str1 = str1Converter.convert('test').orThrow();
      const str2 = str2Converter.convert('test').orThrow();
      // Uncomment the following to get a type error and see branded types in action
      // expect(str1 === str2).toBe(true);

      // but this still works because they're just strings after all
      expect(str1).toEqual(str2);
    });

    test('records the brand in the converter', () => {
      const str1Converter = Converters.string.withBrand('STRING1');
      expect(str1Converter.brand).toBe('STRING1');
    });

    test('rejects a second brand', () => {
      expect(() => {
        Converters.string.withBrand('ONE').withBrand('B');
      }).toThrow(/cannot replace existing brand/i);
    });
  });

  describe('withFormattedError method', () => {
    test('uses a custom error formatter', () => {
      const converter = numberConverter.withFormattedError((from, message) => {
        return `Error converting "${from}": ${message}`;
      });

      expect(converter.convert('not a number')).toFailWith(
        'Error converting "not a number": Not a number: "not a number"'
      );
    });

    test('passes a supplied context to the base converter', () => {
      const outerContext = { value: 'expected' };
      const formatted = contextConverter.withFormattedError((from, message, context) => {
        expect(context).toEqual(outerContext);
        return `${from} ${message} ${context?.value ?? 'unknown'}`;
      });
      expect(formatted.convert(10, outerContext)).toFailWith('10 Cannot convert non-string expected');
    });

    test('does not affect a successful conversion', () => {
      const converter = numberConverter.withFormattedError((from, message) => {
        return `Error converting "${from}": ${message}`;
      });

      expect(converter.convert(10)).toSucceedWith(10);
    });
  });

  describe('withDefault method', () => {
    test('returns a defaulting converter with the supplied default', () => {
      const converter = numberConverter.withDefault(-1);

      expect(converter.convert(1)).toSucceedWith(1);
      expect(converter.convert('not a number')).toSucceedWith(-1);
    });
  });
});
