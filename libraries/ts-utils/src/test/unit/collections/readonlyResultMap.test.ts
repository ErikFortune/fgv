/*
 * Copyright (c) 2026 Erik Fortune
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

import { Collections, ResultMap, Validators } from '../../..';

describe('ReadOnlyResultMap', () => {
  test('exposes IReadOnlyResultMap members and delegates to the inner map', () => {
    const inner = new ResultMap([
      ['key1', 1],
      ['key2', 2]
    ]);
    const ro = new Collections.ReadOnlyResultMap(inner);

    expect(ro.size).toBe(2);
    expect(ro.has('key1')).toBe(true);
    expect(ro.get('key1')).toSucceedWithDetail(1, 'exists');

    const keys = [...ro.keys()];
    const values = [...ro.values()];
    const entries = [...ro.entries()];

    expect(keys).toEqual(['key1', 'key2']);
    expect(values).toEqual([1, 2]);
    expect(entries).toEqual([
      ['key1', 1],
      ['key2', 2]
    ]);
  });

  test('supports forEach (with arg) and Symbol.iterator', () => {
    const inner = new ResultMap([
      ['key1', 1],
      ['key2', 2]
    ]);
    const ro = new Collections.ReadOnlyResultMap(inner);

    const seen: Array<[string, unknown, unknown]> = [];
    const token = { t: 1 };
    ro.forEach((value, key, __map, thisArg) => {
      seen.push([key, value, thisArg]);
    }, token);

    expect(seen).toEqual([
      ['key1', 1, token],
      ['key2', 2, token]
    ]);

    expect([...ro]).toEqual([
      ['key1', 1],
      ['key2', 2]
    ]);
  });
});

describe('ReadOnlyValidatingResultMap', () => {
  type CavemanFirstName = 'fred' | 'barney';
  type CavemanLastName = 'flintstone' | 'rubble';

  const firstNameValidator = Validators.enumeratedValue<CavemanFirstName>(['fred', 'barney']);
  const lastNameValidator = Validators.enumeratedValue<CavemanLastName>(['flintstone', 'rubble']);
  const converters = new Collections.KeyValueConverters({
    key: firstNameValidator,
    value: lastNameValidator
  });

  test('validating wrapper validates keys for get/has', () => {
    const inner = new ResultMap<CavemanFirstName, CavemanLastName>([['fred', 'flintstone']]);
    const ro = new Collections.ReadOnlyValidatingResultMap({ map: inner, converters });

    expect(ro.get('fred')).toSucceedWithDetail('flintstone', 'exists');
    expect(ro.validating.get('fred')).toSucceedWithDetail('flintstone', 'exists');

    expect(ro.validating.get('george')).toFailWithDetail(/invalid enumerated value/i, 'invalid-key');
    expect(ro.validating.has('george')).toBe(false);
  });
});
