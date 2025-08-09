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
      expect(q.hierarchy!.getAncestors('a')).toSucceedWith(['parent', 'root']);
      expect(q.hierarchy!.getAncestors('parent')).toSucceedWith(['root']);
      expect(q.hierarchy!.getRoots()).toSucceedWith(['root']);

      // Test matching using hierarchy
      expect(
        q.matches('a' as TsRes.QualifierConditionValue, 'a' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);
      expect(
        q.matches('parent' as TsRes.QualifierConditionValue, 'a' as TsRes.QualifierContextValue, 'matches')
      ).toBeGreaterThan(TsRes.NoMatch);
      expect(
        q.matches('root' as TsRes.QualifierConditionValue, 'a' as TsRes.QualifierContextValue, 'matches')
      ).toBeGreaterThan(TsRes.NoMatch);
      expect(
        q.matches('a' as TsRes.QualifierConditionValue, 'parent' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.NoMatch);
    });

    test('creates hierarchy without enumerated values (uses empty array fallback)', () => {
      const params: TsRes.QualifierTypes.ILiteralQualifierTypeCreateParams = {
        name: 'test-no-enum',
        hierarchy: {
          a: 'parent',
          b: 'parent',
          parent: 'root'
        }
        // No enumeratedValues - should collect values from hierarchy for open values mode
      };
      // This should succeed because the hierarchy will collect values from the hierarchy
      expect(TsRes.QualifierTypes.LiteralQualifierType.create(params)).toSucceed();
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

    describe('with case-insensitive matching (no enumerated values)', () => {
      beforeAll(() => {
        qt = TsRes.QualifierTypes.LiteralQualifierType.create({ caseSensitive: false }).orThrow();
      });

      test('returns PerfectMatch for matching values (case-insensitive)', () => {
        expect(
          qt.matches('a' as TsRes.QualifierConditionValue, 'a' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('a' as TsRes.QualifierConditionValue, 'A' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('A' as TsRes.QualifierConditionValue, 'a' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches(
            'Test' as TsRes.QualifierConditionValue,
            'test' as TsRes.QualifierContextValue,
            'matches'
          )
        ).toBe(TsRes.PerfectMatch);
      });

      test('returns NoMatch for non-matching values', () => {
        expect(
          qt.matches('a' as TsRes.QualifierConditionValue, 'b' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
        expect(
          qt.matches(
            'Test' as TsRes.QualifierConditionValue,
            'Other' as TsRes.QualifierContextValue,
            'matches'
          )
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

  describe('createFromConfig static method', () => {
    test('creates a new LiteralQualifierType with minimal config', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILiteralQualifierTypeConfig> =
        {
          name: 'literal',
          systemType: 'literal'
        };

      expect(TsRes.QualifierTypes.LiteralQualifierType.createFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LiteralQualifierType);
        expect(q.key).toBe('literal');
        expect(q.name).toBe('literal');
        expect(q.allowContextList).toBe(false);
        expect(q.caseSensitive).toBe(false);
        expect(q.index).toBeUndefined();
        expect(q.enumeratedValues).toBeUndefined();
        expect(q.hierarchy).toBeUndefined();
      });
    });

    test('creates a new LiteralQualifierType with custom name', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILiteralQualifierTypeConfig> =
        {
          name: 'category',
          systemType: 'literal'
        };

      expect(TsRes.QualifierTypes.LiteralQualifierType.createFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LiteralQualifierType);
        expect(q.key).toBe('category');
        expect(q.name).toBe('category');
        expect(q.allowContextList).toBe(false);
        expect(q.caseSensitive).toBe(false);
        expect(q.index).toBeUndefined();
        expect(q.enumeratedValues).toBeUndefined();
        expect(q.hierarchy).toBeUndefined();
      });
    });

    test('creates a new LiteralQualifierType with allowContextList enabled', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILiteralQualifierTypeConfig> =
        {
          name: 'literal',
          systemType: 'literal',
          configuration: {
            allowContextList: true
          }
        };

      expect(TsRes.QualifierTypes.LiteralQualifierType.createFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LiteralQualifierType);
        expect(q.key).toBe('literal');
        expect(q.name).toBe('literal');
        expect(q.allowContextList).toBe(true);
        expect(q.caseSensitive).toBe(false);
        expect(q.index).toBeUndefined();
        expect(q.enumeratedValues).toBeUndefined();
        expect(q.hierarchy).toBeUndefined();
      });
    });

    test('creates a new LiteralQualifierType with case sensitivity enabled', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILiteralQualifierTypeConfig> =
        {
          name: 'literal',
          systemType: 'literal',
          configuration: {
            caseSensitive: true
          }
        };

      expect(TsRes.QualifierTypes.LiteralQualifierType.createFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LiteralQualifierType);
        expect(q.key).toBe('literal');
        expect(q.name).toBe('literal');
        expect(q.allowContextList).toBe(false);
        expect(q.caseSensitive).toBe(true);
        expect(q.index).toBeUndefined();
        expect(q.enumeratedValues).toBeUndefined();
        expect(q.hierarchy).toBeUndefined();
      });
    });

    test('creates a new LiteralQualifierType with enumerated values', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILiteralQualifierTypeConfig> =
        {
          name: 'literal',
          systemType: 'literal',
          configuration: {
            enumeratedValues: ['value1', 'value2', 'value3']
          }
        };

      expect(TsRes.QualifierTypes.LiteralQualifierType.createFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LiteralQualifierType);
        expect(q.key).toBe('literal');
        expect(q.name).toBe('literal');
        expect(q.allowContextList).toBe(false);
        expect(q.caseSensitive).toBe(false);
        expect(q.index).toBeUndefined();
        expect(q.enumeratedValues).toEqual(['value1', 'value2', 'value3']);
        expect(q.hierarchy).toBeUndefined();
      });
    });

    test('creates a new LiteralQualifierType with hierarchy', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILiteralQualifierTypeConfig> =
        {
          name: 'literal',
          systemType: 'literal',
          configuration: {
            hierarchy: {
              child: 'parent',
              parent: 'grandparent'
            }
          }
        };

      expect(TsRes.QualifierTypes.LiteralQualifierType.createFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LiteralQualifierType);
        expect(q.key).toBe('literal');
        expect(q.name).toBe('literal');
        expect(q.allowContextList).toBe(false);
        expect(q.caseSensitive).toBe(false);
        expect(q.index).toBeUndefined();
        expect(q.enumeratedValues).toBeUndefined();
        expect(q.hierarchy).toBeDefined();
        expect(q.hierarchy?.values.get('child')).toBeDefined();
        expect(q.hierarchy?.values.get('parent')).toBeDefined();
      });
    });

    test('creates a new LiteralQualifierType with all configuration options', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILiteralQualifierTypeConfig> =
        {
          name: 'category',
          systemType: 'literal',
          configuration: {
            allowContextList: true,
            caseSensitive: true,
            enumeratedValues: ['value1', 'value2', 'value3', 'child', 'parent', 'grandparent'],
            hierarchy: {
              child: 'parent',
              parent: 'grandparent'
            }
          }
        };

      expect(TsRes.QualifierTypes.LiteralQualifierType.createFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LiteralQualifierType);
        expect(q.key).toBe('category');
        expect(q.name).toBe('category');
        expect(q.allowContextList).toBe(true);
        expect(q.caseSensitive).toBe(true);
        expect(q.index).toBeUndefined();
        expect(q.enumeratedValues).toEqual(['value1', 'value2', 'value3', 'child', 'parent', 'grandparent']);
        expect(q.hierarchy).toBeDefined();
        expect(q.hierarchy?.values.get('child')).toBeDefined();
        expect(q.hierarchy?.values.get('parent')).toBeDefined();
      });
    });

    test('fails if the name is not a valid qualifier type name', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILiteralQualifierTypeConfig> =
        {
          name: 'not a valid name',
          systemType: 'literal'
        };

      expect(TsRes.QualifierTypes.LiteralQualifierType.createFromConfig(config)).toFailWith(
        /not a valid qualifier type name/i
      );
    });

    test('fails if enumerated values contain invalid values', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILiteralQualifierTypeConfig> =
        {
          name: 'literal',
          systemType: 'literal',
          configuration: {
            enumeratedValues: ['valid', '']
          }
        };

      expect(TsRes.QualifierTypes.LiteralQualifierType.createFromConfig(config)).toFailWith(
        /not a valid literal condition value/i
      );
    });

    test('fails if hierarchy contains invalid values', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILiteralQualifierTypeConfig> =
        {
          name: 'literal',
          systemType: 'literal',
          configuration: {
            enumeratedValues: ['valid', ''],
            hierarchy: {
              valid: '',
              child: 'parent'
            }
          }
        };

      expect(TsRes.QualifierTypes.LiteralQualifierType.createFromConfig(config)).toFailWith(
        /not a valid literal condition value/i
      );
    });
  });

  describe('isPotentialMatch with hierarchical ancestors', () => {
    let hierarchicalQualifierType: TsRes.QualifierTypes.LiteralQualifierType;

    beforeAll(() => {
      const params: TsRes.QualifierTypes.ILiteralQualifierTypeCreateParams = {
        name: 'hierarchical',
        enumeratedValues: ['child1', 'child2', 'parent', 'grandparent', 'root'],
        hierarchy: {
          child1: 'parent',
          child2: 'parent',
          parent: 'grandparent',
          grandparent: 'root'
        }
      };
      hierarchicalQualifierType = TsRes.QualifierTypes.LiteralQualifierType.create(params).orThrow();
    });

    test('returns true for exact matches', () => {
      expect(hierarchicalQualifierType.isPotentialMatch('child1', 'child1')).toBe(true);
      expect(hierarchicalQualifierType.isPotentialMatch('parent', 'parent')).toBe(true);
      expect(hierarchicalQualifierType.isPotentialMatch('root', 'root')).toBe(true);
    });

    test('returns true when condition value has context value as an ancestor', () => {
      // child1 has parent as ancestor - potential match via isAncestor check
      expect(hierarchicalQualifierType.isPotentialMatch('child1', 'parent')).toBe(true);

      // child1 has grandparent as ancestor (through parent)
      expect(hierarchicalQualifierType.isPotentialMatch('child1', 'grandparent')).toBe(true);

      // child1 has root as ancestor (through parent -> grandparent)
      expect(hierarchicalQualifierType.isPotentialMatch('child1', 'root')).toBe(true);

      // parent has grandparent as ancestor
      expect(hierarchicalQualifierType.isPotentialMatch('parent', 'grandparent')).toBe(true);

      // grandparent has root as ancestor
      expect(hierarchicalQualifierType.isPotentialMatch('grandparent', 'root')).toBe(true);
    });

    test('returns true when context value is a descendant of condition value', () => {
      // parent condition can match child1 context via hierarchy match (returns 0.9 score)
      expect(hierarchicalQualifierType.isPotentialMatch('parent', 'child1')).toBe(true);

      // grandparent condition can match parent context via hierarchy match
      expect(hierarchicalQualifierType.isPotentialMatch('grandparent', 'parent')).toBe(true);

      // root condition can match grandparent context via hierarchy match
      expect(hierarchicalQualifierType.isPotentialMatch('root', 'grandparent')).toBe(true);
    });

    test('returns false for sibling values in hierarchy', () => {
      // child1 and child2 are siblings under parent
      expect(hierarchicalQualifierType.isPotentialMatch('child1', 'child2')).toBe(false);
      expect(hierarchicalQualifierType.isPotentialMatch('child2', 'child1')).toBe(false);
    });

    test('returns false for unrelated values', () => {
      // Values not in hierarchy relationships
      expect(hierarchicalQualifierType.isPotentialMatch('child1', 'nonexistent')).toBe(false);
      expect(hierarchicalQualifierType.isPotentialMatch('nonexistent', 'child1')).toBe(false);
    });

    test('returns false when condition value is invalid', () => {
      expect(hierarchicalQualifierType.isPotentialMatch('invalid', 'child1')).toBe(false);
      expect(hierarchicalQualifierType.isPotentialMatch('', 'child1')).toBe(false);
    });

    test('returns false when context value is invalid', () => {
      expect(hierarchicalQualifierType.isPotentialMatch('parent', 'invalid')).toBe(false);
      expect(hierarchicalQualifierType.isPotentialMatch('parent', '')).toBe(false);
    });
  });

  describe('isPotentialMatch without hierarchy', () => {
    let nonHierarchicalQualifierType: TsRes.QualifierTypes.LiteralQualifierType;

    beforeAll(() => {
      nonHierarchicalQualifierType = TsRes.QualifierTypes.LiteralQualifierType.create({
        name: 'non-hierarchical',
        enumeratedValues: ['a', 'b', 'c']
      }).orThrow();
    });

    test('returns true for exact matches only', () => {
      expect(nonHierarchicalQualifierType.isPotentialMatch('a', 'a')).toBe(true);
      expect(nonHierarchicalQualifierType.isPotentialMatch('b', 'b')).toBe(true);
      expect(nonHierarchicalQualifierType.isPotentialMatch('c', 'c')).toBe(true);
    });

    test('returns false for non-matching values', () => {
      expect(nonHierarchicalQualifierType.isPotentialMatch('a', 'b')).toBe(false);
      expect(nonHierarchicalQualifierType.isPotentialMatch('b', 'c')).toBe(false);
      expect(nonHierarchicalQualifierType.isPotentialMatch('c', 'a')).toBe(false);
    });

    test('handles case-insensitive matching when caseSensitive is false', () => {
      const caseInsensitiveType = TsRes.QualifierTypes.LiteralQualifierType.create({
        name: 'case-insensitive',
        caseSensitive: false,
        enumeratedValues: ['Test', 'Value']
      }).orThrow();

      expect(caseInsensitiveType.isPotentialMatch('Test', 'test')).toBe(true);
      expect(caseInsensitiveType.isPotentialMatch('test', 'Test')).toBe(true);
      expect(caseInsensitiveType.isPotentialMatch('VALUE', 'value')).toBe(true);
    });

    test('handles case-sensitive matching when caseSensitive is true', () => {
      const caseSensitiveType = TsRes.QualifierTypes.LiteralQualifierType.create({
        name: 'case-sensitive',
        caseSensitive: true,
        enumeratedValues: ['Test', 'test']
      }).orThrow();

      expect(caseSensitiveType.isPotentialMatch('Test', 'Test')).toBe(true);
      expect(caseSensitiveType.isPotentialMatch('test', 'test')).toBe(true);
      expect(caseSensitiveType.isPotentialMatch('Test', 'test')).toBe(false);
      expect(caseSensitiveType.isPotentialMatch('test', 'Test')).toBe(false);
    });
  });
});
