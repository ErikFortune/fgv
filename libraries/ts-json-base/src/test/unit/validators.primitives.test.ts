/*
 * Copyright (c) 2025 Erik Fortune
 */

import '@fgv/ts-utils-jest';

import { Validator as BaseValidator } from '@fgv/ts-utils';
import { Validators } from '../..';

describe('validators (primitive & literal) with JSON context', () => {
  test('type compatibility: foo<T>(Validator<T, IJsonValidatorContext>) accepts primitives and literal', () => {
    function foo<T>(v: BaseValidator<T, Validators.IJsonValidatorContext>): void {}

    foo(Validators.string);
    foo(Validators.number);
    foo(Validators.boolean);
    foo(Validators.literal('x'));
  });

  describe('string', () => {
    const v = Validators.string;

    test('succeeds for strings', () => {
      ['abc', '', '100'].forEach((val) => {
        expect(v.validate(val)).toSucceedWith(val);
      });
    });

    test('fails for non-strings', () => {
      [10, true, {}, [], null].forEach((val) => {
        expect(v.validate(val)).toFailWith(/not a string|string/i);
      });
    });
  });

  describe('number', () => {
    const v = Validators.number;

    test('succeeds for numbers', () => {
      [-1, 0, 10].forEach((val) => {
        expect(v.validate(val)).toSucceedWith(val);
      });
    });

    test('fails for non-numbers', () => {
      ['test', true, '10', {}, [], () => 100].forEach((val) => {
        expect(v.validate(val)).toFailWith(/not a number/i);
      });
    });
  });

  describe('boolean', () => {
    const v = Validators.boolean;

    test('succeeds for booleans', () => {
      [true, false].forEach((val) => {
        expect(v.validate(val)).toSucceedWith(val);
      });
    });

    test('fails for non-booleans', () => {
      ['test', 0, 1, {}, [], null, undefined].forEach((val) => {
        expect(v.validate(val)).toFailWith(/not a boolean/i);
      });
    });
  });

  describe('literal', () => {
    test('succeeds for an exact match and fails otherwise', () => {
      const v = Validators.literal('ok');
      expect(v.validate('ok')).toSucceedWith('ok');
      expect(v.validate('no')).toFail();
    });
  });
});

describe('enumeratedValue with JSON context', () => {
  test('type compatibility: Validator<T, IJsonValidatorContext | T[]> is accepted', () => {
    function foo<T>(v: BaseValidator<T, Validators.IJsonValidatorContext | ReadonlyArray<T>>): void {}
    foo(Validators.enumeratedValue(['a', 'b'] as const));
  });

  test('succeeds for allowed values and fails for others', () => {
    const v = Validators.enumeratedValue(['a', 'b']);
    expect(v.validate('a')).toSucceedWith('a');
    expect(v.validate('b')).toSucceedWith('b');
    expect(v.validate('c')).toFailWith(/invalid enumerated value|invalid/i);
  });

  test('uses custom failure message when provided', () => {
    const v = Validators.enumeratedValue(['a', 'b'], 'bad value');
    expect(v.validate('c')).toFailWith(/bad value/i);
  });

  test('supports overriding allowed values via context array', () => {
    const v = Validators.enumeratedValue(['a', 'b']);
    expect(v.validate('c', ['c'])).toSucceedWith('c');
    expect(v.validate('a', ['c'])).toFailWith(/invalid enumerated value|invalid/i);
  });

  test('ignores non-array JSON context (uses creation-time values)', () => {
    const v = Validators.enumeratedValue(['a', 'b']);
    expect(v.validate('a', { ignoreUndefinedProperties: true })).toSucceedWith('a');
    expect(v.validate('c', { ignoreUndefinedProperties: true })).toFailWith(
      /invalid enumerated value|invalid/i
    );
  });
});
