/*
 * Copyright (c) 2025 Erik Fortune
 */

import '@fgv/ts-utils-jest';

import { Converters as BaseConverters, Converter as BaseConverter } from '@fgv/ts-utils';
import { Converters } from '../..';

describe('converters (primitive & literal) with JSON context', () => {
  test('type compatibility: foo<T>(Converter<T, IJsonConverterContext>) accepts primitives and literal', () => {
    function foo<T>(c: BaseConverter<T, Converters.IJsonConverterContext>): void {}

    foo(Converters.string);
    foo(Converters.number);
    foo(Converters.boolean);
    foo(Converters.literal('x'));
  });

  describe('string', () => {
    const c = Converters.string;

    test('succeeds for strings', () => {
      ['abc', '', '100'].forEach((v) => {
        expect(c.convert(v)).toSucceedWith(v);
      });
    });

    test('fails for non-strings', () => {
      [10, true, {}, [], null].forEach((v) => {
        expect(c.convert(v)).toFailWith(/not a string|string/i);
      });
    });
  });

  describe('number', () => {
    const c = Converters.number;

    test('succeeds for numbers and numeric strings (parity with ts-utils)', () => {
      [-1, 0, 10, '100', '0', '-10'].forEach((v) => {
        const expected = BaseConverters.number.convert(v).orThrow();
        expect(c.convert(v)).toSucceedWith(expected);
      });
    });

    test('fails for non-numbers', () => {
      ['test', true, '10der', '100 tests', {}, [], () => 100].forEach((v) => {
        expect(c.convert(v)).toFailWith(/not a number|invalid/i);
      });
    });
  });

  describe('boolean', () => {
    const c = Converters.boolean;

    test('succeeds for booleans and true/false strings (parity with ts-utils)', () => {
      const mapping: Array<[unknown, boolean]> = [
        [true, true],
        [false, false],
        ['true', true],
        ['false', false]
      ];
      mapping.forEach(([from, to]) => {
        expect(c.convert(from)).toSucceedWith(to);
      });
    });

    test('fails for non-boolean inputs', () => {
      ['t', 'f', 'yes', 'no', 1, 0, {}, []].forEach((v) => {
        expect(c.convert(v)).toFailWith(/not a boolean|invalid/i);
      });
    });
  });

  describe('literal', () => {
    const c = Converters.literal('x');

    test('succeeds for the exact literal', () => {
      expect(c.convert('x')).toSucceedWith('x');
    });

    test('fails for anything else', () => {
      ['y', 1, true, {}, []].forEach((v) => {
        expect(c.convert(v)).toFailWith(/does not match/i);
      });
    });
  });
});

describe('enumeratedValue with JSON context', () => {
  test('type compatibility: Converter<T, IJsonConverterContext | T[]> is accepted', () => {
    function foo<T>(c: BaseConverter<T, Converters.IJsonConverterContext | ReadonlyArray<T>>): void {}
    foo(Converters.enumeratedValue(['a', 'b'] as const));
  });

  test('succeeds for allowed values and fails for others', () => {
    const c = Converters.enumeratedValue(['a', 'b']);
    expect(c.convert('a')).toSucceedWith('a');
    expect(c.convert('b')).toSucceedWith('b');
    expect(c.convert('c')).toFailWith(/invalid enumerated value/i);
  });

  test('uses custom failure message when provided', () => {
    const c = Converters.enumeratedValue(['a', 'b'], 'bad value');
    expect(c.convert('c')).toFailWith(/bad value/i);
  });

  test('supports overriding allowed values via context array', () => {
    const c = Converters.enumeratedValue(['a', 'b']);
    expect(c.convert('c', ['c'])).toSucceedWith('c');
    expect(c.convert('a', ['c'])).toFailWith(/invalid enumerated value/i);
  });

  test('ignores non-array JSON context (uses creation-time values)', () => {
    const c = Converters.enumeratedValue(['a', 'b']);
    expect(c.convert('a', { ignoreUndefinedProperties: true })).toSucceedWith('a');
    expect(c.convert('c', { ignoreUndefinedProperties: true })).toFailWith(/invalid enumerated value/i);
  });
});
