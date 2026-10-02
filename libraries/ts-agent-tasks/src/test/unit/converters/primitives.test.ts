/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  Instant,
  boundedArrayOf,
  boundedIdentifier,
  boundedSingleLine,
  boundedText,
  instant,
  nonNegativeAmount,
  nonNegativeSafeInteger,
  positiveSafeInteger,
  taskRevision
} from '../../../index';
import { Converters } from '@fgv/ts-utils';

describe('instant', () => {
  test('accepts a canonical UTC instant', () => {
    expect(instant.convert('2026-09-22T12:00:00.000Z')).toSucceedWith(
      '2026-09-22T12:00:00.000Z' as unknown as Instant
    );
  });

  test.each([
    ['zone-free', '2026-09-22T12:00:00.000'],
    ['date only', '2026-09-22'],
    ['offset-qualified', '2026-09-22T12:00:00.000+01:00'],
    ['no fractional seconds', '2026-09-22T12:00:00Z'],
    ['six fractional digits', '2026-09-22T12:00:00.000000Z'],
    ['lowercase separator', '2026-09-22t12:00:00.000Z'],
    ['space separator', '2026-09-22 12:00:00.000Z'],
    ['leading whitespace', ' 2026-09-22T12:00:00.000Z']
  ])('rejects a %s instant', (__label: string, value: string) => {
    expect(instant.convert(value)).toFailWith(/not a canonical UTC instant/i);
  });

  test.each([
    ['an impossible day', '2026-02-30T00:00:00.000Z'],
    ['an impossible month', '2026-13-01T00:00:00.000Z'],
    ['an impossible hour', '2026-09-22T25:00:00.000Z']
  ])('rejects %s that is well-shaped but not a real instant', (__label: string, value: string) => {
    expect(instant.convert(value)).toFailWith(/not a valid instant/i);
  });

  test('rejects a non-string', () => {
    expect(instant.convert(20260922)).toFail();
  });
});

describe('numeric primitives', () => {
  test('positiveSafeInteger accepts 1 and MAX_SAFE_INTEGER', () => {
    expect(positiveSafeInteger.convert(1)).toSucceedWith(1);
    expect(positiveSafeInteger.convert(Number.MAX_SAFE_INTEGER)).toSucceedWith(Number.MAX_SAFE_INTEGER);
  });

  test.each([
    ['zero', 0],
    ['negative', -1],
    ['fractional', 1.5],
    ['beyond the safe range', Number.MAX_SAFE_INTEGER + 1],
    ['infinite', Number.POSITIVE_INFINITY],
    ['NaN', Number.NaN]
  ])('positiveSafeInteger rejects %s', (__label: string, value: number) => {
    expect(positiveSafeInteger.convert(value)).toFailWith(/positive safe integer/i);
  });

  test('a revision beyond the safe range fails before it could be written', () => {
    expect(taskRevision.convert(Number.MAX_SAFE_INTEGER)).toSucceed();
    expect(taskRevision.convert(Number.MAX_SAFE_INTEGER + 1)).toFailWith(/positive safe integer/i);
  });

  test('nonNegativeSafeInteger accepts zero and rejects negatives and fractions', () => {
    expect(nonNegativeSafeInteger.convert(0)).toSucceedWith(0);
    expect(nonNegativeSafeInteger.convert(-1)).toFailWith(/non-negative safe integer/i);
    expect(nonNegativeSafeInteger.convert(0.5)).toFailWith(/non-negative safe integer/i);
  });

  test('nonNegativeAmount accepts finite fractions and rejects negatives and infinities', () => {
    expect(nonNegativeAmount.convert(0)).toSucceedWith(0);
    expect(nonNegativeAmount.convert(2.5)).toSucceedWith(2.5);
    expect(nonNegativeAmount.convert(-0.5)).toFailWith(/finite non-negative/i);
    expect(nonNegativeAmount.convert(Number.POSITIVE_INFINITY)).toFailWith(/finite non-negative/i);
  });
});

describe('boundedIdentifier', () => {
  const id = boundedIdentifier(8, 'test id');

  test.each([['a'], ['A1'], ['a.b'], ['a-.:'], ['9zz']])('accepts %s', (value: string) => {
    expect(id.convert(value)).toSucceedWith(value);
  });

  test.each([
    ['empty', ''],
    ['a path separator', 'a/b'],
    ['a windows separator', 'a\\b'],
    ['a parent traversal', '..'],
    ['a leading separator', '.a'],
    ['whitespace', 'a b'],
    ['a percent escape', 'a%2fb'],
    ['a control character', 'a\u0000b']
  ])('rejects %s', (__label: string, value: string) => {
    expect(id.convert(value)).toFailWith(/not a valid test id/i);
  });

  test('rejects a value over the bound, naming the bound', () => {
    expect(id.convert('123456789')).toFailWith(/9 characters exceeds the maximum of 8/i);
  });
});

describe('boundedSingleLine', () => {
  const line = boundedSingleLine(8, 'test line');

  test('accepts a single line', () => {
    expect(line.convert('abc def')).toSucceedWith('abc def');
  });

  test('rejects an empty value', () => {
    expect(line.convert('')).toFailWith(/test line: .*must not be empty/i);
  });

  test.each([
    ['a newline', 'a\nb'],
    ['a carriage return', 'a\rb'],
    ['a control character', 'a\u0007b']
  ])('rejects %s', (__label: string, value: string) => {
    expect(line.convert(value)).toFail();
  });

  test('rejects a value over the bound, naming what it bounds', () => {
    expect(line.convert('123456789')).toFailWith(/test line:/i);
  });
});

describe('boundedText', () => {
  const text = boundedText(8, 'test text');

  test('accepts multi-line text within the bound', () => {
    expect(text.convert('a\nb')).toSucceedWith('a\nb');
  });

  test('rejects an empty value', () => {
    expect(text.convert('')).toFailWith(/may not be empty/i);
  });

  test('rejects a value over the bound', () => {
    expect(text.convert('123456789')).toFailWith(/exceeds the maximum of 8/i);
  });
});

describe('boundedArrayOf', () => {
  const items = boundedArrayOf(Converters.string, 2, 'test items');

  test('accepts an array at the bound', () => {
    expect(items.convert(['a', 'b'])).toSucceedWith(['a', 'b']);
  });

  test('accepts an empty array', () => {
    expect(items.convert([])).toSucceedWith([]);
  });

  test('rejects one entry over the bound', () => {
    expect(items.convert(['a', 'b', 'c'])).toFailWith(/3 entries exceeds the maximum of 2/i);
  });

  test('rejects an entry of the wrong type', () => {
    expect(items.convert(['a', 3])).toFail();
  });

  test('rejects a non-array', () => {
    expect(items.convert('ab')).toFail();
  });

  test('checks the length before converting any element', () => {
    const element = jest.fn((from: unknown) => Converters.string.convert(from));
    const counted = boundedArrayOf(Converters.generic(element), 2, 'counted items');
    expect(counted.convert(['a', 'b', 'c'])).toFailWith(/3 entries exceeds the maximum of 2/i);
    // An oversized array is refused without doing the per-element work it would cost.
    expect(element).not.toHaveBeenCalled();
    expect(counted.convert(['a', 'b'])).toSucceed();
    expect(element).toHaveBeenCalledTimes(2);
  });

  test('passes the conversion context through to each element', () => {
    const seen: unknown[] = [];
    const contextual = Converters.generic<string, string>((from: unknown, __self, context?: string) => {
      seen.push(context);
      return Converters.string.convert(from);
    });
    expect(boundedArrayOf(contextual, 2, 'contextual items').convert(['a'], 'the-context')).toSucceed();
    expect(seen).toEqual(['the-context']);
  });
});
