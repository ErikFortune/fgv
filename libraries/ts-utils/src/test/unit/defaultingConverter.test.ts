/*
 * Copyright (c) 2024 Erik Fortune
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

import { Conversion, Result, fail, succeed } from '../..';
import { BaseConverter, Converters, GenericDefaultingConverter } from '../../packlets/conversion';
import '../helpers/jest';

describe('GenericDefaultingConverter', () => {
  describe('isOptional', () => {
    test('propagates inner optional trait', () => {
      expect(new Conversion.GenericDefaultingConverter(Converters.number, 1).isOptional).toBe(false);
      expect(new Conversion.GenericDefaultingConverter(Converters.number.optional(), 1).isOptional).toBe(
        true
      );
    });
  });

  describe('brand', () => {
    test('propagates inner brand trait', () => {
      expect(new Conversion.GenericDefaultingConverter(Converters.string, 'dflt').brand).toBe(undefined);
      expect(
        new Conversion.GenericDefaultingConverter(Converters.string.withBrand('Brand'), 'dflt').brand
      ).toEqual('Brand');
    });
  });

  describe('convert', () => {
    const negativeDefault = new GenericDefaultingConverter(Converters.number, -1);
    test('returns success with the result of a successful conversion', () => {
      expect(negativeDefault.convert(100)).toSucceedWith(100);
      // notice that type validation allows us to access value without a guard
      expect(negativeDefault.convert(-1000).value).toBe(-1000);
    });

    test('returns success with the default for a failed conversion', () => {
      expect(negativeDefault.convert('not a number')).toSucceedWith(-1);

      // notice that type validation allows us to access value without a guard
      expect(negativeDefault.convert('not a number').value).toBe(-1);
    });

    test('allows default to extend the returned type', () => {
      const undefinedDefault = new GenericDefaultingConverter(Converters.number, undefined);
      expect(undefinedDefault.convert(-1000).value).toBe(-1000);
      expect(undefinedDefault.convert('not a number').value).toBeUndefined();
    });
  });

  describe('convertOptional', () => {
    const genericDefault = 'generic default';
    const converter = new GenericDefaultingConverter(Converters.string, genericDefault);

    test('propagates successful conversion from the inner converter', () => {
      expect(converter.convertOptional('test')).toSucceedWith('test');
    });

    test('propagates undefined from inner converter by default', () => {
      expect(converter.convertOptional(undefined)).toSucceedWith(undefined);
    });

    test('propagates inner error as undefined by default', () => {
      expect(converter.convertOptional({})).toSucceedWith(undefined);
    });

    test('propagates inner error as undefined if ignoreErrors is specified', () => {
      expect(converter.convertOptional({}, undefined, 'ignoreErrors')).toSucceedWith(undefined);
    });

    test('propagates inner error as generic default if failOnError is specified', () => {
      expect(converter.convertOptional({}, undefined, 'failOnError')).toSucceedWith(genericDefault);
    });
  });

  describe('optional', () => {
    const genericDefault = 'generic default';
    const converter = new GenericDefaultingConverter(Converters.string, genericDefault).optional();

    test('resulting converter has optional trait', () => {
      expect(converter.isOptional).toBe(true);
    });

    test('resulting converter propagates successful conversion', () => {
      expect(converter.convert('test')).toSucceedWith('test');
    });

    test('resulting converter propagates undefined by default', () => {
      expect(converter.convert(undefined)).toSucceedWith(undefined);
    });

    test('resulting converter propagates inner error as generic default by default', () => {
      expect(converter.convert({})).toSucceedWith(genericDefault);
    });

    test('resulting converter propagates inner error as undefined if ignoreErrors is specified on constructor', () => {
      const converter2 = new GenericDefaultingConverter(Converters.string, genericDefault).optional(
        'ignoreErrors'
      );
      expect(converter2.convert({})).toSucceedWith(undefined);
    });

    test('resulting converter propagates inner error as generic default if failOnError is specified', () => {
      expect(converter.convert({})).toSucceedWith(genericDefault);
    });
  });

  describe('map', () => {
    const genericDefault = 'generic default';
    const converter = new GenericDefaultingConverter(Converters.string, genericDefault).map((v: string) => {
      return succeed([v]);
    });

    test('resulting converter maps inner success', () => {
      expect(converter.convert('some string')).toSucceedWith(['some string']);
    });

    test('resulting converter maps generic default on inner error', () => {
      expect(converter.convert(10)).toSucceedWith([genericDefault]);
    });
  });

  describe('mapConvert', () => {
    const genericDefault = 'generic default';
    const mapConverter = new BaseConverter((from: unknown) => {
      if (typeof from === 'string') {
        return succeed([from]);
      }
      return fail('not a string');
    });
    const converter = new GenericDefaultingConverter(Converters.string, genericDefault).mapConvert(
      mapConverter
    );

    test('resulting converter maps inner success', () => {
      expect(converter.convert('some string')).toSucceedWith(['some string']);
    });

    test('resulting converter maps generic default on inner error', () => {
      expect(converter.convert(10)).toSucceedWith([genericDefault]);
    });
  });

  describe('mapItems', () => {
    const genericDefault = ['string 1', 'string 2'];
    const inner = Converters.arrayOf(Converters.string);
    const toUpperMapper = (from: unknown): Result<string> => {
      if (typeof from === 'string') {
        if (from === 'fail anyway') {
          return fail('item mapper forced error');
        }
        return succeed(from.toUpperCase());
      }
      return fail('cannot map non-string');
    };
    const converter = new GenericDefaultingConverter(inner, genericDefault).mapItems(toUpperMapper);

    test('resulting converter maps inner success', () => {
      expect(converter.convert(['one', 'two'])).toSucceedWith(['ONE', 'TWO']);
    });

    test('resulting converter maps inner error to generic default', () => {
      expect(converter.convert(1)).toSucceedWith(genericDefault.map((s) => s.toUpperCase()));
    });

    test('resulting converter returns an error if inner converter succeeds but mapper fails', () => {
      expect(converter.convert(['str1', 'fail anyway'])).toFailWith(/forced error/);
    });

    test('resulting converter fails on inner error if default cannot be mapped', () => {
      const converter = new GenericDefaultingConverter(inner, 'not mappable').mapItems(toUpperMapper);
      expect(converter.convert(['one', 'two'])).toSucceedWith(['ONE', 'TWO']);
      expect(converter.convert(1)).toFailWith(/not an array/i);
    });

    test('resulting converter fails on inner error if default contains an error that cannot be mapped', () => {
      const converter = new GenericDefaultingConverter(inner, ['str1', 'fail anyway']).mapItems(
        toUpperMapper
      );
      expect(converter.convert(['one', 'two'])).toSucceedWith(['ONE', 'TWO']);
      expect(converter.convert(1)).toFailWith(/forced error/i);
    });
  });

  describe('mapConvertItems', () => {
    const genericDefault = ['string 1', 'string 2'];
    const inner = Converters.arrayOf(Converters.string);
    const toUpperConverter = new BaseConverter((from: unknown): Result<string> => {
      if (typeof from === 'string') {
        if (from === 'fail anyway') {
          return fail('item mapper forced error');
        }
        return succeed(from.toUpperCase());
      }
      return fail('cannot map non-string');
    });
    const converter = new GenericDefaultingConverter(inner, genericDefault).mapConvertItems(toUpperConverter);

    test('resulting converter maps inner success', () => {
      expect(converter.convert(['one', 'two'])).toSucceedWith(['ONE', 'TWO']);
    });

    test('resulting converter maps inner error to generic default', () => {
      expect(converter.convert(1)).toSucceedWith(genericDefault.map((s) => s.toUpperCase()));
    });

    test('resulting converter returns an error if inner converter succeeds but mapper fails', () => {
      expect(converter.convert(['str1', 'fail anyway'])).toFailWith(/forced error/);
    });

    test('resulting converter fails on inner error if default cannot be mapped', () => {
      const converter = new GenericDefaultingConverter(inner, 'not mappable').mapConvertItems(
        toUpperConverter
      );
      expect(converter.convert(['one', 'two'])).toSucceedWith(['ONE', 'TWO']);
      expect(converter.convert(1)).toFailWith(/not an array/i);
    });

    test('resulting converter fails on inner error if default contains an error that cannot be mapped', () => {
      const converter = new GenericDefaultingConverter(inner, ['str1', 'fail anyway']).mapConvertItems(
        toUpperConverter
      );
      expect(converter.convert(['one', 'two'])).toSucceedWith(['ONE', 'TWO']);
      expect(converter.convert(1)).toFailWith(/forced error/i);
    });
  });

  describe('withAction', () => {
    const genericDefault = 'generic default';
    const inner = Converters.string;
    const converter = new GenericDefaultingConverter(inner, genericDefault).withAction((r) => {
      if (r.success) {
        return succeed(`success with: '${r.value}'`);
      }
      return fail(`failed with: '${r.message}'`);
    });

    test('action receives success with converted value on inner success', () => {
      expect(converter.convert('a string')).toSucceedWith("success with: 'a string'");
    });

    test('action receives success with generic default on inner error', () => {
      expect(converter.convert(10)).toSucceedWith(`success with: '${genericDefault}'`);
    });
  });

  describe('type guards', () => {
    type Thing = 'thing1' | 'thing2';
    function isThing(from: unknown): from is Thing {
      return from === 'thing1' || from === 'thing2';
    }

    describe('withTypeGuard', () => {
      const genericDefault = 'thing1';
      const inner = Converters.string;

      const converter = new GenericDefaultingConverter(inner, genericDefault).withTypeGuard(isThing);

      test('succeeds for a successful inner conversion that passes the guard', () => {
        expect(converter.convert('thing1')).toSucceedWith('thing1');
      });

      test('succeeds with generic default for a failed inner conversion, if generic default passes the guard', () => {
        expect(converter.convert(10)).toSucceedWith(genericDefault as Thing);
      });

      test('fails for a failed inner conversion, if generic default does not pass the guard', () => {
        const converter = new GenericDefaultingConverter(inner, 'not a thing').withTypeGuard(isThing);
        expect(converter.convert('thing2')).toSucceedWith('thing2');
        expect(converter.convert(10)).toFailWith(/invalid type/i);
      });
    });

    describe('withItemTypeGuard', () => {
      const genericDefault: Thing[] = ['thing2', 'thing1', 'thing2'];
      const inner = Converters.arrayOf(Converters.string);
      const converter = new GenericDefaultingConverter(inner, genericDefault).withItemTypeGuard(isThing);

      test('succeeds for an array of values that pass the guard', () => {
        expect(converter.convert(['thing2'])).toSucceedWith(['thing2']);
      });

      test('fails for an array of values that pass the inner converter but fail the guard', () => {
        expect(converter.convert(['thing3'])).toFailWith(/invalid type/);
      });

      test('returns well-formed generic default for a value that fails inner conversion', () => {
        expect(converter.convert(10)).toSucceedWith(genericDefault);
      });

      test('fails for a a value that fails inner conversion if generic default fails the guard', () => {
        const genericDefault = ['thing3'];
        const inner = Converters.arrayOf(Converters.string);
        const converter = new GenericDefaultingConverter(inner, genericDefault).withItemTypeGuard(isThing);

        expect(converter.convert(10)).toFailWith(/invalid type/i);
      });
    });
  });

  describe('withConstraint', () => {
    const genericDefault = 'generic default';
    const inner = Converters.string;
    const constraint = (s: string): boolean | Result<string> => {
      if (s === 'force true') {
        return true;
      }
      if (s === 'force false') {
        return false;
      }
      if (s === 'force error') {
        return fail('forced error');
      }
      return succeed(s);
    };
    const converter = new GenericDefaultingConverter(inner, genericDefault).withConstraint(constraint);

    test('succeeds for a successful inner conversion that meets the constraint', () => {
      expect(converter.convert('valid string')).toSucceedWith('valid string');
    });

    test('fails for a value that passes inner conversion but fails the constraint', () => {
      expect(converter.convert('force error')).toFailWith('forced error');
    });

    test('returns valid generic default for a value that fails inner conversion', () => {
      expect(converter.convert(10)).toSucceedWith(genericDefault);
    });

    test('fails for a value that fails inner conversion if generic default fails constraint', () => {
      const genericDefault = 'force error';
      const converter = new GenericDefaultingConverter(inner, genericDefault).withConstraint(constraint);
      expect(converter.convert(10)).toFailWith('forced error');
    });
  });

  describe('withBrand', () => {
    const genericDefault = 'generic default';
    const inner = Converters.string;
    const converter = new GenericDefaultingConverter(inner, genericDefault).withBrand('Brand1');

    test('resulting converter reports brand', () => {
      expect(converter.brand).toBe('Brand1');
    });

    test('returns a branded value on inner converter success', () => {
      expect(converter.convert('some string')).toSucceedWith('some string');
    });

    test('returns a branded generic default on inner converter failure', () => {
      expect(converter.convert(10)).toSucceedWith(genericDefault);
    });

    test('rejects a second brand', () => {
      expect(() => converter.withBrand('Brand 2')).toThrow(/cannot replace existing brand/i);
    });
  });

  describe('withDefault', () => {
    const genericDefault = 'generic default';
    const otherDefault = 'other default';
    const inner = Converters.string;
    const converter = new GenericDefaultingConverter(inner, genericDefault).withDefault(otherDefault);

    test('propagates result on inner success', () => {
      expect(converter.convert('a string')).toSucceedWith('a string');
    });

    test('succeeds with updated default on inner failure', () => {
      expect(converter.convert(10)).toSucceedWith(otherDefault);
    });
  });

  describe('withFormattedError', () => {
    const genericDefault = 'generic default';
    const converter = new GenericDefaultingConverter(Converters.string, genericDefault).withFormattedError(
      (from, message) => `formatted error: ${message ?? 'no message'}`
    );

    test('propagates result on inner success', () => {
      expect(converter.convert('some string')).toSucceedWith('some string');
    });

    test('resulting converter maps generic default on inner error', () => {
      expect(converter.convert(10)).toSucceedWith(genericDefault);
    });
  });
});
