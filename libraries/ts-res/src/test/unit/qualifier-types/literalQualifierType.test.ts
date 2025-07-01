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

import '@fgv/ts-utils-jest';
import * as TsRes from '../../../index';
import { QualifierType } from '../../../packlets/qualifier-types';

const validIdentifiers: string[] = [
  'abc',
  '_a10',
  'this-is-an-identifier',
  '_This_Is_Also-An_Identifier10',
  'A'
];

const invalidIdentifiers: string[] = [
  '',
  ' not_an_identifier',
  'also not an identifier',
  '1not_identifier',
  'rats!'
];

describe('LiteralQualifierType', () => {
  describe('create static method', () => {
    test('creates a new LiteralQualifierType with defaults', () => {
      expect(TsRes.QualifierTypes.LiteralQualifierType.create()).toSucceedAndSatisfy((q) => {
        expect(q.key).toBe('literal');
        expect(q.name).toBe('literal');
        expect(q.allowContextList).toBe(true);
        expect(q.caseSensitive).toBe(false);
        expect(q.enumeratedValues).toBeUndefined();
        expect(q.index).toBeUndefined();
      });
    });

    test('creates a new LiteralQualifierType with specified values', () => {
      const params: TsRes.QualifierTypes.ILiteralQualifierTypeCreateParams = {
        name: 'test',
        allowContextList: false,
        caseSensitive: true,
        enumeratedValues: ['a', 'b', 'c'],
        index: 11
      };
      expect(TsRes.QualifierTypes.LiteralQualifierType.create(params)).toSucceedAndSatisfy((q) => {
        expect(q.key).toBe('test');
        expect(q.name).toBe('test');
        expect(q.allowContextList).toBe(false);
        expect(q.caseSensitive).toBe(true);
        expect(q.enumeratedValues).toEqual(['a', 'b', 'c']);
        expect(q.index).toBe(11);
      });
    });

    test('creates a new LiteralQualifierType with a hierarchy', () => {
      const params: TsRes.QualifierTypes.ILiteralQualifierTypeCreateParams = {
        name: 'test',
        allowContextList: false,
        hierarchy: {
          a: 'b',
          b: 'c'
        },
        enumeratedValues: ['a', 'b', 'c', 'd'],
        index: 11
      };
      expect(TsRes.QualifierTypes.LiteralQualifierType.create(params)).toSucceedAndSatisfy((q) => {
        expect(q.key).toBe('test');
        expect(q.name).toBe('test');
        expect(q.allowContextList).toBe(false);
        expect(q.caseSensitive).toBe(false);
        expect(q.enumeratedValues).toEqual(['a', 'b', 'c', 'd']);
        expect(q.index).toBe(11);
        expect(q.hierarchy).toBeDefined();
        if (q.hierarchy) {
          expect(q.hierarchy.values.get('a')).toBeDefined();
          expect(q.hierarchy.values.get('b')).toBeDefined();
          expect(q.hierarchy.values.get('c')).toBeDefined();
          expect(q.hierarchy.values.get('d')).toBeDefined();
        }
      });
    });

    test('fails if the name is not a valid qualifier type name', () => {
      const name = 'not a valid name';
      expect(TsRes.QualifierTypes.QualifierType.isValidName(name)).toBe(false);
      expect(TsRes.QualifierTypes.LiteralQualifierType.create({ name })).toFailWith(
        /not a valid qualifier type name/i
      );
    });

    test('fails if the index is not a valid qualifier type index', () => {
      const index = -1;
      expect(TsRes.QualifierTypes.QualifierType.isValidIndex(index)).toBe(false);
      expect(TsRes.QualifierTypes.LiteralQualifierType.create({ index })).toFailWith(
        /not a valid qualifier type index/i
      );
    });

    test('fails if any enumerated values are invalid', () => {
      const params: TsRes.QualifierTypes.ILiteralQualifierTypeCreateParams = {
        enumeratedValues: ['a', 'b', '']
      };
      expect(TsRes.QualifierTypes.LiteralQualifierType.create(params)).toFailWith(
        /not a valid literal condition/i
      );
    });

    test('creates hierarchy with values not in enumeratedValues', () => {
      const params: TsRes.QualifierTypes.ILiteralQualifierTypeCreateParams = {
        name: 'test',
        enumeratedValues: ['a', 'b'],
        hierarchy: {
          a: 'parent',
          b: 'parent',
          parent: 'root'
        }
      };
      expect(TsRes.QualifierTypes.LiteralQualifierType.create(params)).toFailWith(
        /parent.*is not a valid literal value/i
      );
    });

    test('creates hierarchy when all referenced values are in enumeratedValues', () => {
      const params: TsRes.QualifierTypes.ILiteralQualifierTypeCreateParams = {
        name: 'test',
        enumeratedValues: ['a', 'b', 'parent', 'root'],
        hierarchy: {
          a: 'parent',
          b: 'parent',
          parent: 'root'
        }
      };
      const q = TsRes.QualifierTypes.LiteralQualifierType.create(params).orThrow();

      // Check hierarchy relationships
      expect(q.hierarchy!.getAncestors('a')).toEqual(['parent', 'root']);
      expect(q.hierarchy!.getAncestors('parent')).toEqual(['root']);
      expect(q.hierarchy!.getRoots()).toEqual(['root']);
    });
  });

  describe('isValidConditionValue', () => {
    describe('with no enumerated values', () => {
      let qt: TsRes.QualifierTypes.QualifierType;

      beforeAll(() => {
        qt = TsRes.QualifierTypes.LiteralQualifierType.create().orThrow();
      });

      test('returns true for any identifier', () => {
        validIdentifiers.forEach((id) => {
          expect(qt.isValidConditionValue(id)).toBe(true);
        });
      });

      test('returns false for non-identifiers', () => {
        invalidIdentifiers.forEach((id) => {
          expect(qt.isValidConditionValue(id)).toBe(false);
        });
      });
    });

    describe('with enumerated values', () => {
      let qt: TsRes.QualifierTypes.QualifierType;
      const enumeratedValues: string[] = ['a', 'b', 'c'];

      beforeAll(() => {
        qt = TsRes.QualifierTypes.LiteralQualifierType.create({ enumeratedValues }).orThrow();
      });

      test('returns true for any enumerated value (case-insensitive)', () => {
        enumeratedValues.forEach((id) => {
          expect(qt.isValidConditionValue(id)).toBe(true);
        });
        enumeratedValues.forEach((id) => {
          expect(qt.isValidConditionValue(id.toUpperCase())).toBe(true);
        });
      });

      test('returns false for non-enumerated values', () => {
        expect(qt.isValidConditionValue('')).toBe(false);
        expect(qt.isValidConditionValue('d')).toBe(false);
        expect(qt.isValidConditionValue('e')).toBe(false);
        expect(qt.isValidConditionValue('f')).toBe(false);
      });
    });

    describe('with case-sensitive enumerated values', () => {
      let qt: TsRes.QualifierTypes.QualifierType;
      const enumeratedValues: string[] = ['a', 'b', 'c'];

      beforeAll(() => {
        qt = TsRes.QualifierTypes.LiteralQualifierType.create({
          enumeratedValues,
          caseSensitive: true
        }).orThrow();
      });

      test('returns true for any enumerated value', () => {
        enumeratedValues.forEach((id) => {
          expect(qt.isValidConditionValue(id)).toBe(true);
        });
      });

      test('returns false for non-enumerated values', () => {
        enumeratedValues.forEach((id) => {
          expect(qt.isValidConditionValue(id.toUpperCase())).toBe(false);
        });
        expect(qt.isValidConditionValue('')).toBe(false);
        expect(qt.isValidConditionValue('d')).toBe(false);
        expect(qt.isValidConditionValue('e')).toBe(false);
        expect(qt.isValidConditionValue('f')).toBe(false);
      });
    });
  });

  describe('validateCondition', () => {
    let qt: TsRes.QualifierTypes.QualifierType;

    beforeAll(() => {
      qt = TsRes.QualifierTypes.LiteralQualifierType.create().orThrow();
    });

    test('succeeds for any valid condition value and default operator or matches', () => {
      validIdentifiers.forEach((id) => {
        expect(qt.validateCondition(id)).toSucceedWith(id as TsRes.QualifierConditionValue);
        expect(qt.validateCondition(id, 'matches')).toSucceedWith(id as TsRes.QualifierConditionValue);
      });
    });

    test('fails for operator other than matches even with valid condition value', () => {
      validIdentifiers.forEach((id) => {
        expect(qt.validateCondition(id, 'always')).toFailWith(/invalid condition operator/i);
        expect(qt.validateCondition(id, 'never')).toFailWith(/invalid condition operator/i);
      });
    });

    test('fails for any invalid condition value', () => {
      invalidIdentifiers.forEach((id) => {
        expect(qt.validateCondition(id)).toFailWith(/invalid condition value/i);
      });
    });
  });

  describe('isValidContextValue/validateContextValue', () => {
    describe('with allowContextList false', () => {
      let qt: TsRes.QualifierTypes.QualifierType;

      beforeAll(() => {
        qt = TsRes.QualifierTypes.LiteralQualifierType.create({
          allowContextList: false
        }).orThrow();
      });

      test('returns true/succeeds for any identifier', () => {
        validIdentifiers.forEach((id) => {
          expect(qt.isValidContextValue(id)).toBe(true);
          expect(qt.validateContextValue(id)).toSucceedWith(id as TsRes.QualifierContextValue);
        });
      });

      test('returns false/fails for non-identifiers', () => {
        invalidIdentifiers.forEach((id) => {
          expect(qt.isValidContextValue(id)).toBe(false);
          expect(qt.validateContextValue(id)).toFailWith(/invalid context value/i);
        });
      });

      test('returns false/fails for lists of identifiers', () => {
        expect(qt.isValidContextValue('a,b,c')).toBe(false);
        expect(qt.isValidContextValue('a, b, c')).toBe(false);
        expect(qt.isValidContextValue('a, b, c,')).toBe(false);
        expect(qt.validateContextValue('a,b,c')).toFailWith(/invalid context value/i);
        expect(qt.validateContextValue('a, b, c')).toFailWith(/invalid context value/i);
        expect(qt.validateContextValue('a, b, c,')).toFailWith(/invalid context value/i);
      });
    });

    describe('with allowContextList true', () => {
      let qt: TsRes.QualifierTypes.QualifierType;

      beforeAll(() => {
        qt = TsRes.QualifierTypes.LiteralQualifierType.create({
          allowContextList: true
        }).orThrow();
      });

      test('returns true/succeeds for any identifier', () => {
        validIdentifiers.forEach((id) => {
          expect(qt.isValidContextValue(id)).toBe(true);
          expect(qt.validateContextValue(id)).toSucceedWith(id as TsRes.QualifierContextValue);
        });
      });

      test('returns true/succeeds for lists of identifiers', () => {
        expect(qt.isValidContextValue('a,b,c')).toBe(true);
        expect(qt.isValidContextValue('a, b, c')).toBe(true);
        expect(qt.validateContextValue('a,b,c')).toSucceedWith('a,b,c' as TsRes.QualifierContextValue);
        expect(qt.validateContextValue('a, b, c')).toSucceedWith('a, b, c' as TsRes.QualifierContextValue);
      });

      test('returns false/fails for non-identifiers', () => {
        invalidIdentifiers.forEach((id) => {
          // list comparison trims whitespace, so some invalid condition values are valid as context values
          if (!qt.isValidConditionValue(id.trim())) {
            expect(qt.isValidContextValue(id)).toBe(false);
            expect(qt.validateContextValue(id)).toFailWith(/invalid context value/i);
          }
        });
      });
    });
  });

  describe('matches', () => {
    let qt: TsRes.QualifierTypes.QualifierType;

    beforeAll(() => {
      qt = TsRes.QualifierTypes.LiteralQualifierType.create().orThrow();
    });

    test('returns PerfectMatch for matching values', () => {
      expect(
        qt.matches('a' as TsRes.QualifierConditionValue, 'a' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);
    });

    test('returns NoMatch for non-matching values', () => {
      expect(
        qt.matches('a' as TsRes.QualifierConditionValue, 'b' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.NoMatch);
    });

    describe('with case-sensitive matching', () => {
      beforeAll(() => {
        qt = TsRes.QualifierTypes.LiteralQualifierType.create({ caseSensitive: true }).orThrow();
      });

      test('returns PerfectMatch for matching values', () => {
        expect(
          qt.matches('a' as TsRes.QualifierConditionValue, 'a' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('a' as TsRes.QualifierConditionValue, 'A' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
      });
    });

    describe('with allowContextList true', () => {
      beforeAll(() => {
        qt = TsRes.QualifierTypes.LiteralQualifierType.create({
          allowContextList: true
        }).orThrow();
      });

      test('returns PerfectMatch for the first value in a list', () => {
        expect(
          qt.matches('a' as TsRes.QualifierConditionValue, 'a,b' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('a' as TsRes.QualifierConditionValue, 'a, b' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
      });

      test('returns decreasing positive scores for subsequent values in a list', () => {
        let score = qt.matches(
          'a' as TsRes.QualifierConditionValue,
          'a,b,c' as TsRes.QualifierContextValue,
          'matches'
        );
        expect(score).toBe(TsRes.PerfectMatch);
        let lastScore = score;
        for (const id of ['b', 'c']) {
          score = qt.matches(
            id as TsRes.QualifierConditionValue,
            'a,b,c' as TsRes.QualifierContextValue,
            'matches'
          );
          expect(score).toBeGreaterThan(TsRes.NoMatch);
          expect(score).toBeLessThan(lastScore);
          lastScore = score;
        }
      });

      test('returns NoMatch for non-matching values', () => {
        expect(
          qt.matches('a' as TsRes.QualifierConditionValue, 'b,c' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
        expect(
          qt.matches('a' as TsRes.QualifierConditionValue, 'b, c' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
      });
    });

    describe('with allowContextList false', () => {
      beforeAll(() => {
        qt = TsRes.QualifierTypes.LiteralQualifierType.create({
          allowContextList: false
        }).orThrow();
      });

      test('returns NoMatch for a list in the context', () => {
        expect(
          qt.matches('a' as TsRes.QualifierConditionValue, 'a,b' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
        expect(
          qt.matches('a' as TsRes.QualifierConditionValue, 'a, b' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
      });
    });

    test('does not match case-insensitively when values are different', () => {
      const params: TsRes.QualifierTypes.ILiteralQualifierTypeCreateParams = {
        name: 'case-insensitive-nonmatch',
        caseSensitive: false,
        enumeratedValues: ['foo', 'bar']
      };
      const qt = TsRes.QualifierTypes.LiteralQualifierType.create(params).orThrow();
      expect(
        qt.matches('foo' as TsRes.QualifierConditionValue, 'baz' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.NoMatch);
    });
  });

  describe('setIndex', () => {
    let qt: TsRes.QualifierTypes.QualifierType;

    beforeEach(() => {
      qt = TsRes.QualifierTypes.LiteralQualifierType.create().getValueOrThrow();
    });

    test('sets the index if it is valid', () => {
      expect(qt.setIndex(10)).toSucceedWith(10 as TsRes.QualifierTypeIndex);
      expect(qt.index).toBe(10);
    });

    test('fails if the index is not valid', () => {
      expect(qt.setIndex(-1)).toFailWith(/not a valid qualifier type index/i);
    });

    test('fails if the index is already set', () => {
      expect(qt.setIndex(1)).toSucceedWith(1 as TsRes.QualifierTypeIndex);
      expect(qt.setIndex(10)).toFailWith(/cannot be changed/i);
    });

    test('succeeds if the index is already set to the same value', () => {
      expect(qt.setIndex(1)).toSucceedWith(1 as TsRes.QualifierTypeIndex);
      expect(qt.setIndex(1)).toSucceedWith(1 as TsRes.QualifierTypeIndex);
    });
  });

  describe('compare', () => {
    test('compares by index first', () => {
      const qt1 = TsRes.QualifierTypes.LiteralQualifierType.create({ index: 1 }).orThrow();
      const qt2 = TsRes.QualifierTypes.LiteralQualifierType.create({ index: 2 }).orThrow();
      expect(QualifierType.compare(qt1, qt2)).toBeLessThan(0);
      expect(QualifierType.compare(qt2, qt1)).toBeGreaterThan(0);
    });

    test('treats undefined index as less than defined index', () => {
      const qt1 = TsRes.QualifierTypes.LiteralQualifierType.create().orThrow();
      const qt2 = TsRes.QualifierTypes.LiteralQualifierType.create({ index: 2 }).orThrow();
      expect(QualifierType.compare(qt1, qt2)).toBeLessThan(0);
      expect(QualifierType.compare(qt2, qt1)).toBeGreaterThan(0);
    });

    test('falls back to name if indexes are equal', () => {
      const qt1 = TsRes.QualifierTypes.LiteralQualifierType.create({
        name: 'abacus',
        index: 1
      }).orThrow();
      const qt2 = TsRes.QualifierTypes.LiteralQualifierType.create({
        name: 'xyzzy',
        index: 1
      }).orThrow();
      expect(QualifierType.compare(qt1, qt2)).toBeLessThan(0);
      expect(QualifierType.compare(qt2, qt1)).toBeGreaterThan(0);
    });

    test('returns 0 for identical qualifier types', () => {
      const qt1 = TsRes.QualifierTypes.LiteralQualifierType.create({
        name: 'abacus',
        index: 1
      }).orThrow();
      const qt2 = TsRes.QualifierTypes.LiteralQualifierType.create({
        name: 'abacus',
        index: 1
      }).orThrow();
      expect(QualifierType.compare(qt1, qt2)).toBe(0);
    });
  });

  describe('case-sensitive matching', () => {
    test('matches case-sensitively when caseSensitive is true', () => {
      const params: TsRes.QualifierTypes.ILiteralQualifierTypeCreateParams = {
        name: 'case-sensitive',
        caseSensitive: true,
        enumeratedValues: ['Test', 'test', 'TEST']
      };
      const qt = TsRes.QualifierTypes.LiteralQualifierType.create(params).orThrow();

      expect(
        qt.matches('Test' as TsRes.QualifierConditionValue, 'Test' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);
      expect(
        qt.matches('test' as TsRes.QualifierConditionValue, 'test' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);
      expect(
        qt.matches('TEST' as TsRes.QualifierConditionValue, 'TEST' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);
      expect(
        qt.matches('Test' as TsRes.QualifierConditionValue, 'test' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.NoMatch);
      expect(
        qt.matches('test' as TsRes.QualifierConditionValue, 'Test' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.NoMatch);
    });

    test('matches case-insensitively when caseSensitive is false', () => {
      const params: TsRes.QualifierTypes.ILiteralQualifierTypeCreateParams = {
        name: 'case-insensitive',
        caseSensitive: false,
        enumeratedValues: ['Test', 'test', 'TEST']
      };
      const qt = TsRes.QualifierTypes.LiteralQualifierType.create(params).orThrow();

      expect(
        qt.matches('Test' as TsRes.QualifierConditionValue, 'Test' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);
      expect(
        qt.matches('test' as TsRes.QualifierConditionValue, 'test' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);
      expect(
        qt.matches('TEST' as TsRes.QualifierConditionValue, 'TEST' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);
      expect(
        qt.matches('Test' as TsRes.QualifierConditionValue, 'test' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);
      expect(
        qt.matches('test' as TsRes.QualifierConditionValue, 'Test' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);
      expect(
        qt.matches('TEST' as TsRes.QualifierConditionValue, 'test' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);
    });

    test('matches case-insensitively by default', () => {
      const params: TsRes.QualifierTypes.ILiteralQualifierTypeCreateParams = {
        name: 'default',
        enumeratedValues: ['Test', 'test', 'TEST']
      };
      const qt = TsRes.QualifierTypes.LiteralQualifierType.create(params).orThrow();

      expect(
        qt.matches('Test' as TsRes.QualifierConditionValue, 'test' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);
      expect(
        qt.matches('test' as TsRes.QualifierConditionValue, 'Test' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);
    });
  });
});
