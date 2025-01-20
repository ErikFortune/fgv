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

import { Collections, fail, Failure, succeed, ValidatingResultMap, Validation, Validators } from '../../..';
import '../../helpers/jest';

describe('ValidatingResultMap', () => {
  type CavemanFirstName = 'fred' | 'barney' | 'wilma' | 'betty' | 'pebbles';
  type CavemanLastName = 'flintstone' | 'rubble';
  const families: Record<CavemanLastName, CavemanFirstName[]> = {
    flintstone: ['fred', 'wilma', 'pebbles'],
    rubble: ['barney', 'betty']
  };
  type CavemanMap = ValidatingResultMap<CavemanFirstName, CavemanLastName>;
  const firstNameValidator = Validators.enumeratedValue<CavemanFirstName>([
    'fred',
    'barney',
    'wilma',
    'betty',
    'pebbles'
  ]);
  const lastNameValidator = Validators.enumeratedValue<CavemanLastName>(['flintstone', 'rubble']);
  const familyMemberValidator = new Validation.Base.GenericValidator<[CavemanFirstName, CavemanLastName]>({
    validator: (from: unknown): boolean | Failure<[CavemanFirstName, CavemanLastName]> => {
      if (!Array.isArray(from) || from.length !== 2) {
        return fail('Expected an array of two elements');
      }
      const isValid = firstNameValidator.validate(from[0]).onSuccess((firstName) => {
        return lastNameValidator.validate(from[1]).onSuccess((lastName) => {
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
  const nameValidators = new Collections.Utils.KeyValueValidators(firstNameValidator, lastNameValidator);
  const familyValidators = new Collections.Utils.KeyValueValidators(
    firstNameValidator,
    lastNameValidator,
    familyMemberValidator
  );

  describe('constructor', () => {
    test('constructs a new instance with the supplied validators', () => {
      const map = new ValidatingResultMap({ validators: nameValidators });
      expect(map.validate.validators).toEqual(nameValidators);
    });

    test('constructs a new instance with the supplied validators and valid entries', () => {
      const map = new ValidatingResultMap({ validators: nameValidators, entries: [['fred', 'flintstone']] });
      expect(map.validate.validators).toEqual(nameValidators);
      expect(map.get('fred')).toSucceedWith('flintstone');
    });

    test('throws if supplied entries are invalid', () => {
      expect(
        () => new ValidatingResultMap({ validators: nameValidators, entries: [['fred', 'jetson']] })
      ).toThrow();
      expect(
        () => new ValidatingResultMap({ validators: familyValidators, entries: [['fred', 'rubble']] })
      ).toThrow();
    });
  });

  describe('static create', () => {
    test('succeeds and creates a new instance with the supplied validators', () => {
      expect(
        ValidatingResultMap.createValidating({ validators: nameValidators })
      ).toSucceedAndSatisfy<CavemanMap>((map) => {
        expect(map.validate.validators).toEqual(nameValidators);
      });
    });

    test('succeeds and creates a new instance with the supplied validators and valid entries', () => {
      expect(
        ValidatingResultMap.createValidating({
          validators: nameValidators,
          entries: [['fred', 'flintstone']]
        })
      ).toSucceedAndSatisfy<CavemanMap>((map) => {
        expect(map.validate.validators).toEqual(nameValidators);
        expect(map.get('fred')).toSucceedWith('flintstone');
        expect(map.validate.has('fred')).toBe(true);
      });
    });

    test('fails if supplied entries are invalid', () => {
      expect(
        ValidatingResultMap.createValidating({ validators: nameValidators, entries: [['fred', 'jetson']] })
      ).toFailWith(/invalid entry/);
    });
  });

  describe('validate member', () => {
    test('retrieves from the underlying map', () => {
      const map = new ValidatingResultMap({ validators: nameValidators, entries: [['fred', 'flintstone']] });
      expect(map.validate.get('fred')).toSucceedWith('flintstone');
      expect(map.validate.get('barney')).toFailWithDetail(/not found/i, 'not-found');
      map.set('barney', 'rubble');
      expect(map.validate.get('barney')).toSucceedWith('rubble');
    });

    test('writes to the underlying map', () => {
      const map = new ValidatingResultMap({ validators: nameValidators });
      expect(map.get('fred')).toFailWithDetail(/not found/i, 'not-found');
      expect(map.validate.set('fred', 'flintstone')).toSucceedWith('flintstone');
      expect(map.get('fred')).toSucceedWith('flintstone');

      expect(map.validate.delete('fred')).toSucceedWithDetail('flintstone', 'deleted');
      expect(map.get('fred')).toFailWithDetail(/not found/i, 'not-found');

      expect(map.get('barney')).toFailWithDetail(/not found/i, 'not-found');
      expect(map.validate.getOrAdd('barney', 'rubble')).toSucceedWithDetail('rubble', 'added');
      expect(map.get('barney')).toSucceedWith('rubble');
      // does not replace existing value
      expect(map.validate.getOrAdd('barney', 'flintstone')).toSucceedWithDetail('rubble', 'exists');
      expect(map.get('barney')).toSucceedWith('rubble');

      expect(map.validate.update('barney', 'flintstone')).toSucceedWithDetail('flintstone', 'updated');
      expect(map.get('barney')).toSucceedWith('flintstone');

      expect(map.validate.add('wilma', 'flintstone')).toSucceedWithDetail('flintstone', 'added');
    });

    test('validates on all validate calls', () => {
      const map = new ValidatingResultMap({ validators: nameValidators, entries: [['fred', 'flintstone']] });
      expect(map.validate.delete('george')).toFailWithDetail(/invalid enumerated value/i, 'invalid-key');
      expect(map.validate.get('george')).toFailWithDetail(/invalid enumerated value/i, 'invalid-key');
      expect(map.validate.getOrAdd('fred', 'jetson')).toFailWithDetail(/invalid entry/i, 'invalid-value');
      expect(map.validate.set('wilma', 'sprockets')).toFailWithDetail(/invalid entry/i, 'invalid-value');
      expect(map.validate.add('george', 'flintstone')).toFailWithDetail(
        /invalid enumerated value/i,
        'invalid-key'
      );
      expect(map.validate.update('fred', 'jetson')).toFailWithDetail(/invalid entry/i, 'invalid-value');
    });

    test('applies entry validation if entry validator is supplied', () => {
      const map = new ValidatingResultMap({ validators: familyValidators });
      expect(map.validate.set('fred', 'rubble')).toFailWithDetail(/no such family member/i, 'invalid-value');
      expect(map.get('fred')).toFailWithDetail(/not found/i, 'not-found');
      expect(map.validate.set('fred', 'flintstone')).toSucceedWith('flintstone');
      expect(map.get('fred')).toSucceedWith('flintstone');
    });
  });

  describe('ResultMap members', () => {
    test('apply entry validation if entry validator is supplied', () => {
      const map = new ValidatingResultMap({
        validators: familyValidators,
        entries: [['fred', 'flintstone']]
      });
      expect(map.set('fred', 'rubble')).toFailWithDetail(/no such family member/i, 'invalid-value');
      expect(map.set('wilma', 'flintstone')).toSucceedWith('flintstone');
      expect(map.get('fred')).toSucceedWith('flintstone');

      expect(map.getOrAdd('fred', 'rubble')).toFailWithDetail(/no such family member/i, 'invalid-value');
      expect(map.add('betty', 'flintstone')).toFailWithDetail(/no such family member/i, 'invalid-value');
      expect(map.update('fred', 'rubble')).toFailWithDetail(/no such family member/i, 'invalid-value');
    });
  });
});
