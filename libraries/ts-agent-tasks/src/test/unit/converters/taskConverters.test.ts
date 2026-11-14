/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { ITaskFieldBounds, TaskConverters, defaultTaskFieldBounds } from '../../../index';

describe('TaskConverters.create', () => {
  test('defaults to the published field bounds', () => {
    expect(TaskConverters.create()).toSucceedAndSatisfy((converters) => {
      expect(converters.bounds).toEqual(defaultTaskFieldBounds);
    });
  });

  test('an empty parameter object is the same as none', () => {
    expect(TaskConverters.create({})).toSucceedAndSatisfy((converters) => {
      expect(converters.bounds).toEqual(defaultTaskFieldBounds);
    });
  });

  test('lowers the bounds it is given and defaults the rest', () => {
    expect(TaskConverters.create({ bounds: { maxScopes: 4 } })).toSucceedAndSatisfy((converters) => {
      expect(converters.bounds.maxScopes).toBe(4);
      expect(converters.bounds.maxTitleLength).toBe(defaultTaskFieldBounds.maxTitleLength);
    });
  });

  test('accepts a bound equal to the default', () => {
    expect(TaskConverters.create({ bounds: { maxScopes: defaultTaskFieldBounds.maxScopes } })).toSucceed();
  });

  test('refuses to raise a bound', () => {
    expect(TaskConverters.create({ bounds: { maxScopes: 65 } })).toFailWith(
      /maxScopes: 65 exceeds the default bound of 64; bounds may only be lowered/i
    );
  });

  test.each([
    ['zero', 0],
    ['negative', -1],
    ['fractional', 2.5],
    ['beyond the safe range', Number.MAX_SAFE_INTEGER + 1]
  ])('refuses a %s bound', (__label: string, value: number) => {
    expect(TaskConverters.create({ bounds: { maxScopes: value } })).toFailWith(
      /TaskConverters\.create: maxScopes: bound must be a positive safe integer/i
    );
  });

  test.each(Object.keys(defaultTaskFieldBounds) as ReadonlyArray<keyof ITaskFieldBounds>)(
    'the %s bound can be lowered',
    (name: keyof ITaskFieldBounds) => {
      expect(TaskConverters.create({ bounds: { [name]: 1 } })).toSucceedAndSatisfy((converters) => {
        expect(converters.bounds[name]).toBe(1);
      });
    }
  );

  test('two converter sets do not share their bounds', () => {
    const tight: TaskConverters = TaskConverters.create({ bounds: { maxScopes: 1 } }).orThrow();
    const loose: TaskConverters = TaskConverters.create().orThrow();
    const twoScopes: unknown = [
      { namespace: 'a', key: 'x' },
      { namespace: 'b', key: 'y' }
    ];
    expect(tight.values.scopes.convert(twoScopes)).toFail();
    expect(loose.values.scopes.convert(twoScopes)).toSucceed();
  });
});
