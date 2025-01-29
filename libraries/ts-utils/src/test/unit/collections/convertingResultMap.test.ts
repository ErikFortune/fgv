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

import {
  Collections,
  fail,
  Failure,
  Result,
  succeed,
  ConvertingResultMap,
  Validation,
  Validators
} from '../../..';
import '../../helpers/jest';

describe('ConvertingResultMap', () => {
  type CavemanFirstName = 'fred' | 'barney' | 'wilma' | 'betty' | 'pebbles';
  type CavemanLastName = 'flintstone' | 'rubble';
  const families: Record<CavemanLastName, CavemanFirstName[]> = {
    flintstone: ['fred', 'wilma', 'pebbles'],
    rubble: ['barney', 'betty']
  };
  const firstNameConverter = Validators.enumeratedValue<CavemanFirstName>([
    'fred',
    'barney',
    'wilma',
    'betty',
    'pebbles'
  ]);
  const lastNameConverter = Validators.enumeratedValue<CavemanLastName>(['flintstone', 'rubble']);
  const familyMemberConverter = new Validation.Base.GenericValidator<[CavemanFirstName, CavemanLastName]>({
    validator: (from: unknown): boolean | Failure<[CavemanFirstName, CavemanLastName]> => {
      if (!Array.isArray(from) || from.length !== 2) {
        return fail('Expected an array of two elements');
      }
      const isValid = firstNameConverter.validate(from[0]).onSuccess((firstName) => {
        return lastNameConverter.validate(from[1]).onSuccess((lastName) => {
          return succeed(families[lastName].includes(firstName));
        });
      });
      if (isValid.isSuccess()) {
        if (!isValid.value) {
          return fail(`No such family member: ${from[0]} ${from[1]}`);
        }
        return true;
      }
      return fail(isValid.message);
    }
  });
  const nameConverters = new Collections.KeyValueConverters({
    key: firstNameConverter,
    value: lastNameConverter
  });
  const familyConverters = new Collections.KeyValueConverters({
    key: firstNameConverter,
    value: lastNameConverter,
    entry: familyMemberConverter
  });

  describe('constructor', () => {
    test('constructs a new instance with the supplied converters', () => {
      const map = new ConvertingResultMap({ converters: nameConverters });
      expect(map.converting.converters).toEqual(nameConverters);
    });

    test('constructs a new instance using the supplied converter functions', () => {
      const map = new ConvertingResultMap({
        converters: new Collections.KeyValueConverters({
          key: (from: unknown): Result<CavemanFirstName> =>
            from === 'fred' ? succeed('fred') : fail('not fred'),
          value: (from: unknown): Result<CavemanLastName> =>
            from === 'flintstone' ? succeed('flintstone') : fail('invalid value'),
          entry: (from: unknown): Result<[CavemanFirstName, CavemanLastName]> => {
            return Array.isArray(from) && from.length === 2 && from[0] === 'barney' && from[1] === 'rubble'
              ? succeed(['barney', 'rubble'])
              : fail('invalid value');
          }
        })
      });
      expect(map.converting.converters.key.convert('fred')).toSucceedWith('fred');
      expect(map.converting.converters.key.convert('barney')).toFailWith('not fred');
      expect(map.converting.converters.value.convert('flintstone')).toSucceedWith('flintstone');
      expect(map.converting.converters.value.convert('rubble')).toFailWith(/invalid value/i);
      expect(map.converting.converters.entry!.convert(['barney', 'rubble'])).toSucceedWith([
        'barney',
        'rubble'
      ]);
      expect(map.converting.converters.entry!.convert(['fred', 'flintstone'])).toFailWith(/invalid value/i);
    });

    test('constructs a new instance with the supplied converters and valid entries', () => {
      const map = new ConvertingResultMap({ converters: nameConverters, entries: [['fred', 'flintstone']] });
      expect(map.converting.converters).toEqual(nameConverters);
      expect(map.get('fred')).toSucceedWith('flintstone');
    });

    test('throws if supplied entries are invalid', () => {
      expect(
        () => new ConvertingResultMap({ converters: nameConverters, entries: [['fred', 'jetson']] })
      ).toThrow();
      expect(
        () => new ConvertingResultMap({ converters: familyConverters, entries: [['fred', 'rubble']] })
      ).toThrow();
    });
  });

  describe('static create', () => {
    test('succeeds and creates a new instance with the supplied converters', () => {
      expect(
        ConvertingResultMap.createConvertingResultMap({ converters: nameConverters })
      ).toSucceedAndSatisfy((map) => {
        expect(map.converting.converters).toEqual(nameConverters);
      });
    });

    test('succeeds and creates a new instance with the supplied converters and valid entries', () => {
      expect(
        ConvertingResultMap.createConvertingResultMap({
          converters: nameConverters,
          entries: [['fred', 'flintstone']]
        })
      ).toSucceedAndSatisfy((map) => {
        expect(map.converting.converters).toEqual(nameConverters);
        expect(map.get('fred')).toSucceedWith('flintstone');
        expect(map.converting.has('fred')).toBe(true);
      });
    });

    test('fails if supplied entries are invalid', () => {
      expect(
        ConvertingResultMap.createConvertingResultMap({
          converters: nameConverters,
          entries: [['fred', 'jetson']]
        })
      ).toFailWith(/invalid entry/);
    });
  });

  describe('validate member', () => {
    test('retrieves from the underlying map', () => {
      const map = new ConvertingResultMap({ converters: nameConverters, entries: [['fred', 'flintstone']] });
      expect(map.converting.get('fred')).toSucceedWith('flintstone');
      expect(map.converting.get('barney')).toFailWithDetail(/not found/i, 'not-found');
      map.set('barney', 'rubble');
      expect(map.converting.get('barney')).toSucceedWith('rubble');
    });

    test('writes to the underlying map', () => {
      const map = new ConvertingResultMap({ converters: nameConverters });
      expect(map.get('fred')).toFailWithDetail(/not found/i, 'not-found');
      expect(map.converting.set('fred', 'flintstone')).toSucceedWith('flintstone');
      expect(map.get('fred')).toSucceedWith('flintstone');
      expect(map.converting.map.get('fred')).toSucceedWith('flintstone');

      expect(map.converting.delete('fred')).toSucceedWithDetail('flintstone', 'deleted');
      expect(map.get('fred')).toFailWithDetail(/not found/i, 'not-found');

      expect(map.get('barney')).toFailWithDetail(/not found/i, 'not-found');
      expect(map.converting.getOrAdd('barney', 'rubble')).toSucceedWithDetail('rubble', 'added');
      expect(map.get('barney')).toSucceedWith('rubble');
      // does not replace existing value
      expect(map.converting.getOrAdd('barney', 'flintstone')).toSucceedWithDetail('rubble', 'exists');
      expect(map.get('barney')).toSucceedWith('rubble');

      expect(map.converting.update('barney', 'flintstone')).toSucceedWithDetail('flintstone', 'updated');
      expect(map.get('barney')).toSucceedWith('flintstone');

      expect(map.converting.add('wilma', 'flintstone')).toSucceedWithDetail('flintstone', 'added');
    });

    test('validates on all validate calls', () => {
      const map = new ConvertingResultMap({ converters: nameConverters, entries: [['fred', 'flintstone']] });
      expect(map.converting.delete('george')).toFailWithDetail(/invalid enumerated value/i, 'invalid-key');
      expect(map.converting.get('george')).toFailWithDetail(/invalid enumerated value/i, 'invalid-key');
      expect(map.converting.getOrAdd('fred', 'jetson')).toFailWithDetail(/invalid entry/i, 'invalid-value');
      expect(map.converting.set('wilma', 'sprockets')).toFailWithDetail(/invalid entry/i, 'invalid-value');
      expect(map.converting.add('george', 'flintstone')).toFailWithDetail(
        /invalid enumerated value/i,
        'invalid-key'
      );
      expect(map.converting.update('fred', 'jetson')).toFailWithDetail(/invalid entry/i, 'invalid-value');
    });

    test('applies entry validation if entry converter is supplied', () => {
      const map = new ConvertingResultMap({ converters: familyConverters });
      expect(map.converting.set('fred', 'rubble')).toFailWithDetail(
        /no such family member/i,
        'invalid-value'
      );
      expect(map.get('fred')).toFailWithDetail(/not found/i, 'not-found');
      expect(map.converting.set('fred', 'flintstone')).toSucceedWith('flintstone');
      expect(map.get('fred')).toSucceedWith('flintstone');
    });

    describe('getOrAdd with factory', () => {
      test('adds a new entry if the key is not found', () => {
        const map = new ConvertingResultMap({ converters: familyConverters });
        const factory = jest.fn(() => succeed<CavemanLastName>('flintstone'));
        expect(map.converting.getOrAdd('wilma', factory)).toSucceedWith('flintstone');
        expect(map.get('wilma')).toSucceedWith('flintstone');
      });

      test('does not add a new entry if the key is found', () => {
        const map = new ConvertingResultMap({
          converters: familyConverters,
          entries: [['fred', 'flintstone']]
        });
        const factory = jest.fn(() => succeed<CavemanLastName>('rubble'));
        expect(map.converting.getOrAdd('fred', factory)).toSucceedWith('flintstone');
        expect(map.get('fred')).toSucceedWith('flintstone');
      });

      test('fails with detail invalid-value if the factory fails', () => {
        const map = new ConvertingResultMap({ converters: familyConverters });
        const factory = jest.fn(() => fail<CavemanLastName>('nope'));
        expect(map.converting.getOrAdd('wilma', factory)).toFailWithDetail('nope', 'invalid-value');
        expect(map.get('wilma')).toFailWithDetail(/not found/i, 'not-found');
      });

      test('does not invoke the factory if the key is found', () => {
        const map = new ConvertingResultMap({
          converters: familyConverters,
          entries: [['fred', 'flintstone']]
        });
        const factory = jest.fn(() => fail<CavemanLastName>('nope'));
        expect(map.converting.getOrAdd('fred', factory)).toSucceedWith('flintstone');
      });
    });
  });

  describe('ResultMap members', () => {
    test('apply entry validation if entry converter is supplied', () => {
      const map = new ConvertingResultMap({
        converters: familyConverters,
        entries: [['fred', 'flintstone']]
      });
      expect(map.set('fred', 'rubble')).toFailWithDetail(/no such family member/i, 'invalid-value');
      expect(map.set('wilma', 'flintstone')).toSucceedWith('flintstone');
      expect(map.get('fred')).toSucceedWith('flintstone');

      expect(map.getOrAdd('fred', 'rubble')).toFailWithDetail(/no such family member/i, 'invalid-value');
      expect(map.add('betty', 'flintstone')).toFailWithDetail(/no such family member/i, 'invalid-value');
      expect(map.update('fred', 'rubble')).toFailWithDetail(/no such family member/i, 'invalid-value');
    });

    describe('getOrAdd with factory', () => {
      test('adds a new entry if the key is not found', () => {
        const map = new ConvertingResultMap({
          converters: familyConverters,
          entries: [['fred', 'flintstone']]
        });
        expect(map.getOrAdd('wilma', () => succeed<CavemanLastName>('flintstone'))).toSucceedWith(
          'flintstone'
        );
        expect(map.get('wilma')).toSucceedWith('flintstone');
      });

      test('does not add a new entry if the key is found', () => {
        const map = new ConvertingResultMap({
          converters: familyConverters,
          entries: [['fred', 'flintstone']]
        });
        expect(map.getOrAdd('fred', () => succeed<CavemanLastName>('rubble'))).toSucceedWith('flintstone');
        expect(map.get('fred')).toSucceedWith('flintstone');
      });

      test('fails with detail invalid-value if the factory fails', () => {
        const map = new ConvertingResultMap({
          converters: familyConverters,
          entries: [['fred', 'flintstone']]
        });
        expect(map.getOrAdd('wilma', () => fail<CavemanLastName>('nope'))).toFailWithDetail(
          /nope/i,
          'invalid-value'
        );
        expect(map.get('wilma')).toFailWithDetail(/not found/i, 'not-found');
      });

      test('does not invoke the factory if the key is found', () => {
        const map = new ConvertingResultMap({
          converters: familyConverters,
          entries: [['fred', 'flintstone']]
        });
        expect(map.getOrAdd('fred', () => fail<CavemanLastName>('nope'))).toSucceedWith('flintstone');
      });
    });
  });

  describe('toReadOnly', () => {
    test('returns a read-only version of the map', () => {
      const map = new ConvertingResultMap({
        converters: familyConverters,
        entries: [['fred', 'flintstone']]
      });
      const readOnly = map.toReadOnly();
      expect(readOnly.get('fred')).toSucceedWith('flintstone');
      expect(readOnly.converting.get('fred')).toSucceedWith('flintstone');
      expect(readOnly.converting.get('barney')).toFailWithDetail(/not found/i, 'not-found');
      expect(readOnly.converting.get('george')).toFailWithDetail(/invalid enumerated value/i, 'invalid-key');

      const roConverters = map.converting.toReadOnly();
      expect(roConverters.get('fred')).toSucceedWith('flintstone');
    });
  });
});
