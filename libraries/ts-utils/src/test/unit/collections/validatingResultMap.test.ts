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

import { Collections, fail, Result, succeed, ValidatingResultMap, Validators } from '../../..';
import '../../helpers/jest';

describe('ValidatingResultMap', () => {
  type CavemanFirstName = 'fred' | 'barney' | 'wilma' | 'betty' | 'pebbles';
  type CavemanLastName = 'flintstone' | 'rubble';
  const firstNameConverter = Validators.enumeratedValue<CavemanFirstName>([
    'fred',
    'barney',
    'wilma',
    'betty',
    'pebbles'
  ]);
  const lastNameConverter = Validators.enumeratedValue<CavemanLastName>(['flintstone', 'rubble']);
  const nameConverters = new Collections.KeyValueConverters({
    key: firstNameConverter,
    value: lastNameConverter
  });

  describe('constructor', () => {
    test('constructs a new instance with the supplied converters', () => {
      const map = new ValidatingResultMap({ converters: nameConverters });
      expect(map.validating.converters).toEqual(nameConverters);
    });

    test('constructs a new instance using the supplied converter functions', () => {
      const map = new ValidatingResultMap({
        converters: new Collections.KeyValueConverters({
          key: (from: unknown): Result<CavemanFirstName> =>
            from === 'fred' ? succeed('fred') : fail('not fred'),
          value: (from: unknown): Result<CavemanLastName> =>
            from === 'flintstone' ? succeed('flintstone') : fail('invalid value')
        })
      });
      expect(map.validating.converters.key.convert('fred')).toSucceedWith('fred');
      expect(map.validating.converters.key.convert('barney')).toFailWith('not fred');
      expect(map.validating.converters.value.convert('flintstone')).toSucceedWith('flintstone');
      expect(map.validating.converters.value.convert('rubble')).toFailWith(/invalid value/i);
    });

    test('constructs a new instance with the supplied converters and valid entries', () => {
      const map = new ValidatingResultMap({ converters: nameConverters, entries: [['fred', 'flintstone']] });
      expect(map.validating.converters).toEqual(nameConverters);
      expect(map.get('fred')).toSucceedWith('flintstone');
    });

    test('throws if supplied entries are invalid', () => {
      expect(
        () => new ValidatingResultMap({ converters: nameConverters, entries: [['fred', 'jetson']] })
      ).toThrow();
    });
  });

  describe('static create', () => {
    test('succeeds and creates a new instance with the supplied converters', () => {
      expect(
        ValidatingResultMap.createValidatingResultMap({ converters: nameConverters })
      ).toSucceedAndSatisfy((map) => {
        expect(map.validating.converters).toEqual(nameConverters);
      });
    });

    test('succeeds and creates a new instance with the supplied converters and valid entries', () => {
      expect(
        ValidatingResultMap.createValidatingResultMap({
          converters: nameConverters,
          entries: [['fred', 'flintstone']]
        })
      ).toSucceedAndSatisfy((map) => {
        expect(map.validating.converters).toEqual(nameConverters);
        expect(map.get('fred')).toSucceedWith('flintstone');
        expect(map.validating.has('fred')).toBe(true);
      });
    });

    test('fails if supplied entries are invalid', () => {
      expect(
        ValidatingResultMap.createValidatingResultMap({
          converters: nameConverters,
          entries: [['fred', 'jetson']]
        })
      ).toFailWith(/invalid entry/);
    });
  });

  describe('validating member', () => {
    test('retrieves from the underlying map', () => {
      const map = new ValidatingResultMap({ converters: nameConverters, entries: [['fred', 'flintstone']] });
      expect(map.validating.get('fred')).toSucceedWith('flintstone');
      expect(map.validating.get('barney')).toFailWithDetail(/not found/i, 'not-found');
      map.set('barney', 'rubble');
      expect(map.validating.get('barney')).toSucceedWith('rubble');
    });

    test('writes to the underlying map', () => {
      const map = new ValidatingResultMap({ converters: nameConverters });
      expect(map.get('fred')).toFailWithDetail(/not found/i, 'not-found');
      expect(map.validating.set('fred', 'flintstone')).toSucceedWith('flintstone');
      expect(map.get('fred')).toSucceedWith('flintstone');
      expect(map.validating.map.get('fred')).toSucceedWith('flintstone');

      expect(map.validating.delete('fred')).toSucceedWithDetail('flintstone', 'deleted');
      expect(map.get('fred')).toFailWithDetail(/not found/i, 'not-found');

      expect(map.get('barney')).toFailWithDetail(/not found/i, 'not-found');
      expect(map.validating.getOrAdd('barney', 'rubble')).toSucceedWithDetail('rubble', 'added');
      expect(map.get('barney')).toSucceedWith('rubble');
      // does not replace existing value
      expect(map.validating.getOrAdd('barney', 'flintstone')).toSucceedWithDetail('rubble', 'exists');
      expect(map.get('barney')).toSucceedWith('rubble');

      expect(map.validating.update('barney', 'flintstone')).toSucceedWithDetail('flintstone', 'updated');
      expect(map.get('barney')).toSucceedWith('flintstone');

      expect(map.validating.add('wilma', 'flintstone')).toSucceedWithDetail('flintstone', 'added');
    });

    test('validates on all appropriate calls', () => {
      const map = new ValidatingResultMap({ converters: nameConverters, entries: [['fred', 'flintstone']] });
      expect(map.validating.delete('george')).toFailWithDetail(/invalid enumerated value/i, 'invalid-key');
      expect(map.validating.get('george')).toFailWithDetail(/invalid enumerated value/i, 'invalid-key');
      expect(map.validating.getOrAdd('fred', 'jetson')).toFailWithDetail(/invalid entry/i, 'invalid-value');
      expect(map.validating.set('wilma', 'sprockets')).toFailWithDetail(/invalid entry/i, 'invalid-value');
      expect(map.validating.add('george', 'flintstone')).toFailWithDetail(
        /invalid enumerated value/i,
        'invalid-key'
      );
      expect(map.validating.update('fred', 'jetson')).toFailWithDetail(/invalid entry/i, 'invalid-value');
    });

    describe('getOrAdd with factory', () => {
      test('adds a new entry if the key is not found', () => {
        const map = new ValidatingResultMap({ converters: nameConverters });
        const factory = jest.fn(() => succeed<CavemanLastName>('flintstone'));
        expect(map.validating.getOrAdd('wilma', factory)).toSucceedWith('flintstone');
        expect(map.get('wilma')).toSucceedWith('flintstone');
      });

      test('does not add a new entry if the key is found', () => {
        const map = new ValidatingResultMap({
          converters: nameConverters,
          entries: [['fred', 'flintstone']]
        });
        const factory = jest.fn(() => succeed<CavemanLastName>('rubble'));
        expect(map.validating.getOrAdd('fred', factory)).toSucceedWith('flintstone');
        expect(map.get('fred')).toSucceedWith('flintstone');
      });

      test('fails with detail invalid-value if the factory fails', () => {
        const map = new ValidatingResultMap({ converters: nameConverters });
        const factory = jest.fn(() => fail<CavemanLastName>('nope'));
        expect(map.validating.getOrAdd('wilma', factory)).toFailWithDetail('nope', 'invalid-value');
        expect(map.get('wilma')).toFailWithDetail(/not found/i, 'not-found');
      });

      test('does not invoke the factory if the key is found', () => {
        const map = new ValidatingResultMap({
          converters: nameConverters,
          entries: [['fred', 'flintstone']]
        });
        const factory = jest.fn(() => fail<CavemanLastName>('nope'));
        expect(map.validating.getOrAdd('fred', factory)).toSucceedWith('flintstone');
      });
    });
  });

  describe('ResultMap members', () => {
    describe('getOrAdd with factory', () => {
      test('adds a new entry if the key is not found', () => {
        const map = new ValidatingResultMap({
          converters: nameConverters,
          entries: [['fred', 'flintstone']]
        });
        expect(map.getOrAdd('wilma', () => succeed<CavemanLastName>('flintstone'))).toSucceedWith(
          'flintstone'
        );
        expect(map.get('wilma')).toSucceedWith('flintstone');
      });

      test('does not add a new entry if the key is found', () => {
        const map = new ValidatingResultMap({
          converters: nameConverters,
          entries: [['fred', 'flintstone']]
        });
        expect(map.getOrAdd('fred', () => succeed<CavemanLastName>('rubble'))).toSucceedWith('flintstone');
        expect(map.get('fred')).toSucceedWith('flintstone');
      });

      test('fails with detail invalid-value if the factory fails', () => {
        const map = new ValidatingResultMap({
          converters: nameConverters,
          entries: [['fred', 'flintstone']]
        });
        expect(map.getOrAdd('wilma', () => fail<CavemanLastName>('nope'))).toFailWithDetail(
          /nope/i,
          'invalid-value'
        );
        expect(map.get('wilma')).toFailWithDetail(/not found/i, 'not-found');
      });

      test('does not invoke the factory if the key is found', () => {
        const map = new ValidatingResultMap({
          converters: nameConverters,
          entries: [['fred', 'flintstone']]
        });
        expect(map.getOrAdd('fred', () => fail<CavemanLastName>('nope'))).toSucceedWith('flintstone');
      });
    });
  });

  describe('toReadOnly', () => {
    test('returns a read-only version of the map', () => {
      const map = new ValidatingResultMap({
        converters: nameConverters,
        entries: [['fred', 'flintstone']]
      });
      const readOnly = map.toReadOnly();
      expect(readOnly.get('fred')).toSucceedWith('flintstone');
      expect(readOnly.validating.get('fred')).toSucceedWith('flintstone');
      expect(readOnly.validating.get('barney')).toFailWithDetail(/not found/i, 'not-found');
      expect(readOnly.validating.get('george')).toFailWithDetail(/invalid enumerated value/i, 'invalid-key');

      const roConverters = map.validating.toReadOnly();
      expect(roConverters.get('fred')).toSucceedWith('flintstone');
    });
  });
});
