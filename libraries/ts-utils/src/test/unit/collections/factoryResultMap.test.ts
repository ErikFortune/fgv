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

import { Collections, fail, succeed, Validators } from '../../..';

describe('FactoryResultMap', () => {
  type CavemanFirstName = 'fred' | 'barney' | 'wilma';
  type CavemanLastName = 'flintstone' | 'rubble';

  describe('get', () => {
    test('returns existing value without invoking factory', () => {
      const factory = jest.fn(() => succeed<CavemanLastName>('rubble'));
      const entries: Array<[CavemanFirstName, CavemanLastName]> = [['fred', 'flintstone']];
      const map = new Collections.FactoryResultMap<CavemanFirstName, CavemanLastName>({
        entries: entries[Symbol.iterator](),
        factory
      });

      expect(map.get('fred')).toSucceedWithDetail('flintstone', 'exists');
      expect(factory).not.toHaveBeenCalled();
    });

    test('uses factory to add missing key and returns detail "added"', () => {
      const factory = jest.fn((k: CavemanFirstName) =>
        k === 'barney' ? succeed<CavemanLastName>('rubble') : fail<CavemanLastName>('unexpected key')
      );
      const entries: Array<[CavemanFirstName, CavemanLastName]> = [['fred', 'flintstone']];
      const map = new Collections.FactoryResultMap<CavemanFirstName, CavemanLastName>({
        entries: entries[Symbol.iterator](),
        factory
      });

      expect(map.size).toBe(1);
      expect(map.get('barney')).toSucceedWithDetail('rubble', 'added');
      expect(map.size).toBe(2);
      expect(map.get('barney')).toSucceedWithDetail('rubble', 'exists');
      expect(factory).toHaveBeenCalledTimes(1);
      expect(factory).toHaveBeenCalledWith('barney');
    });

    test('propagates factory failure with detail "failure" and does not add', () => {
      const factory = jest.fn(() => fail<CavemanLastName>('nope'));
      const map = new Collections.FactoryResultMap<CavemanFirstName, CavemanLastName>({
        factory
      });

      expect(map.size).toBe(0);
      expect(map.get('wilma')).toFailWithDetail(/nope/i, 'failure');
      expect(map.size).toBe(0);
    });
  });

  describe('has', () => {
    test('returns true for existing keys', () => {
      const factory = jest.fn(() => succeed<CavemanLastName>('rubble'));
      const entries: Array<[CavemanFirstName, CavemanLastName]> = [['fred', 'flintstone']];
      const map = new Collections.FactoryResultMap<CavemanFirstName, CavemanLastName>({
        entries: entries[Symbol.iterator](),
        factory
      });

      expect(map.has('fred')).toBe(true);
      expect(factory).not.toHaveBeenCalled();
    });

    test('invokes factory and adds missing key when checking existence', () => {
      const factory = jest.fn(() => succeed<CavemanLastName>('rubble'));
      const map = new Collections.FactoryResultMap<CavemanFirstName, CavemanLastName>({
        factory
      });

      expect(map.has('barney')).toBe(true);
      expect(map.get('barney')).toSucceedWithDetail('rubble', 'exists');
      expect(factory).toHaveBeenCalledTimes(1);
    });

    test('returns false if the factory fails', () => {
      const factory = jest.fn(() => fail<CavemanLastName>('nope'));
      const map = new Collections.FactoryResultMap<CavemanFirstName, CavemanLastName>({
        factory
      });

      expect(map.has('wilma')).toBe(false);
      expect(map.get('wilma')).toFailWithDetail(/nope/i, 'failure');
      expect(factory).toHaveBeenCalledTimes(2);
    });
  });

  describe('asReadOnly', () => {
    test('does not invoke factory and does not mutate', () => {
      const factory = jest.fn(() => succeed<CavemanLastName>('rubble'));
      const map = new Collections.FactoryResultMap<CavemanFirstName, CavemanLastName>({
        factory
      });
      const ro = map.asReadOnly();

      expect(ro.get('fred')).toFailWithDetail(/not found/i, 'not-found');
      expect(ro.has('fred')).toBe(false);
      expect(factory).not.toHaveBeenCalled();
      expect(map.size).toBe(0);
    });
  });

  describe('iteration APIs', () => {
    test('delegates entries/keys/values/iterator and forEach', () => {
      const factory = jest.fn(() => succeed<CavemanLastName>('rubble'));
      const entries: Array<[CavemanFirstName, CavemanLastName]> = [
        ['fred', 'flintstone'],
        ['barney', 'rubble']
      ];
      const map = new Collections.FactoryResultMap<CavemanFirstName, CavemanLastName>({
        entries: entries[Symbol.iterator](),
        factory
      });

      expect(map.size).toBe(2);
      expect([...map.entries()]).toEqual(entries);
      expect([...map.keys()]).toEqual(['fred', 'barney']);
      expect([...map.values()]).toEqual(['flintstone', 'rubble']);
      expect([...map]).toEqual(entries);

      const seen: Array<[string, unknown, unknown]> = [];
      const token = { a: 1 };
      map.forEach((value, key, __map, thisArg) => {
        seen.push([key, value, thisArg]);
      }, token);

      expect(seen).toEqual([
        ['fred', 'flintstone', token],
        ['barney', 'rubble', token]
      ]);
      expect(factory).not.toHaveBeenCalled();
    });
  });
});

describe('ValidatingFactoryResultMap', () => {
  type CavemanFirstName = 'fred' | 'barney' | 'wilma';
  type CavemanLastName = 'flintstone' | 'rubble';

  const firstNameValidator = Validators.enumeratedValue<CavemanFirstName>(['fred', 'barney', 'wilma']);
  const lastNameValidator = Validators.enumeratedValue<CavemanLastName>(['flintstone', 'rubble']);
  const nameConverters = new Collections.KeyValueConverters({
    key: firstNameValidator,
    value: lastNameValidator
  });

  test('validating.get validates key and can create via factory', () => {
    const factory = jest.fn((k: CavemanFirstName) =>
      k === 'fred' ? succeed<CavemanLastName>('flintstone') : succeed<CavemanLastName>('rubble')
    );

    const map = new Collections.ValidatingFactoryResultMap<CavemanFirstName, CavemanLastName>({
      factory,
      converters: nameConverters
    });

    expect(map.validating.get('fred')).toSucceedWithDetail('flintstone', 'added');
    expect(map.get('fred')).toSucceedWithDetail('flintstone', 'exists');
  });

  test('validating.get fails with invalid-key for invalid string keys', () => {
    const map = new Collections.ValidatingFactoryResultMap<CavemanFirstName, CavemanLastName>({
      factory: () => succeed('flintstone'),
      converters: nameConverters
    });

    expect(map.validating.get('george')).toFailWithDetail(/invalid enumerated value/i, 'invalid-key');
  });

  test('validating.has returns false for invalid key and can create via factory for valid keys', () => {
    const factory = jest.fn(() => succeed<CavemanLastName>('rubble'));
    const map = new Collections.ValidatingFactoryResultMap<CavemanFirstName, CavemanLastName>({
      factory,
      converters: nameConverters
    });

    expect(map.validating.has('george')).toBe(false);
    expect(map.validating.has('barney')).toBe(true);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(map.get('barney')).toSucceedWithDetail('rubble', 'exists');
  });
});
