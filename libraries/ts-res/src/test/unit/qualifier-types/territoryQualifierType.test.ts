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

const validTerritories: string[] = ['US', 'DE', 'SE', 'CN', 'TW', 'us', 'mx'];

const invalidTerritories: string[] = ['419', 'mexico', 'usa', 'CAN'];

describe('TerritoryQualifierType', () => {
  describe('create static method', () => {
    test('creates a new TerritoryQualifierType with defaults', () => {
      expect(TsRes.QualifierTypes.TerritoryQualifierType.create()).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
        expect(q.key).toBe('territory');
        expect(q.name).toBe('territory');
        expect(q.allowContextList).toBe(false);
        expect(q.allowedTerritories).toBeUndefined();
        expect(q.index).toBeUndefined();
      });
    });

    test('creates a new TerritoryQualifierType with specified values', () => {
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          name: 'terr',
          allowContextList: true,
          index: 10,
          allowedTerritories: validTerritories
        })
      ).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
        expect(q.key).toBe('terr');
        expect(q.name).toBe('terr');
        expect(q.allowContextList).toBe(true);
        expect(q.allowedTerritories).toEqual(validTerritories.map((t) => t.toUpperCase()));
        expect(q.index).toBe(10);
      });
    });

    test('normalizes allowed territory names to uppercase', () => {
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          name: 'terr',
          allowContextList: true,
          index: 10,
          allowedTerritories: validTerritories.map((t) => t.toLowerCase())
        })
      ).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
        expect(q.key).toBe('terr');
        expect(q.name).toBe('terr');
        expect(q.allowContextList).toBe(true);
        expect(q.allowedTerritories).toEqual(validTerritories.map((t) => t.toUpperCase()));
        expect(q.index).toBe(10);
      });
    });

    test('fails if the name is not a valid qualifier type name', () => {
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          name: 'not a valid name'
        })
      ).toFailWith(/not a valid qualifier type name/i);
    });

    test('fails if an allowed territory is not valid', () => {
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          name: 'terr',
          allowContextList: true,
          index: 10,
          allowedTerritories: [...validTerritories, ...invalidTerritories]
        })
      ).toFailWith(/not a valid territory/i);
    });
  });

  describe('isValidConditionValue', () => {
    let qt: TsRes.QualifierTypes.TerritoryQualifierType;

    beforeEach(() => {
      qt = TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow();
    });

    test('returns true for valid territories regardless of case', () => {
      validTerritories.forEach((t) => {
        expect(qt.isValidConditionValue(t)).toBe(true);
        expect(qt.isValidConditionValue(t.toUpperCase())).toBe(true);
        expect(qt.isValidConditionValue(t.toLowerCase())).toBe(true);
      });
    });

    test('returns false for invalid territories', () => {
      invalidTerritories.forEach((t) => {
        expect(qt.isValidConditionValue(t)).toBe(false);
      });
    });
  });

  describe('matches', () => {
    let qt: TsRes.QualifierTypes.TerritoryQualifierType;

    beforeEach(() => {
      qt = TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow();
    });

    test('returns a perfect match for matching territories', () => {
      const condition = 'US' as TsRes.QualifierConditionValue;
      expect(qt.matches(condition, 'US' as TsRes.QualifierContextValue, 'matches')).toBe(TsRes.PerfectMatch);
      expect(qt.matches(condition, 'us' as TsRes.QualifierContextValue, 'matches')).toBe(TsRes.PerfectMatch);
      expect(
        qt.matches('AQ' as TsRes.QualifierConditionValue, 'aq' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);
    });

    test('returns no match for non-matching territories', () => {
      const condition = 'US' as TsRes.QualifierConditionValue;
      expect(qt.matches(condition, 'CA' as TsRes.QualifierContextValue, 'matches')).toBe(TsRes.NoMatch);
    });

    describe('with allowed territories', () => {
      beforeEach(() => {
        qt = TsRes.QualifierTypes.TerritoryQualifierType.create({
          allowedTerritories: validTerritories
        }).orThrow();
      });

      test('returns a perfect match for matching allowed territories', () => {
        for (const territory of validTerritories) {
          expect(
            qt.matches(
              territory as TsRes.QualifierConditionValue,
              territory as TsRes.QualifierContextValue,
              'matches'
            )
          ).toBe(TsRes.PerfectMatch);
        }
      });

      test('returns no match for invalid territories', () => {
        invalidTerritories.forEach((t) => {
          expect(
            qt.matches(t as TsRes.QualifierConditionValue, t as TsRes.QualifierContextValue, 'matches')
          ).toBe(TsRes.NoMatch);
        });
      });

      test('returns no match for valid but not allowed territories', () => {
        expect(
          qt.matches('AQ' as TsRes.QualifierConditionValue, 'AQ' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
      });
    });
  });

  describe('createFromConfig static method', () => {
    test('creates a new TerritoryQualifierType with minimal config', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ITerritoryQualifierTypeConfig> =
        {
          name: 'territory',
          systemType: 'territory'
        };

      expect(TsRes.QualifierTypes.TerritoryQualifierType.createFromConfig(config)).toSucceedAndSatisfy(
        (q) => {
          expect(q).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
          expect(q.key).toBe('territory');
          expect(q.name).toBe('territory');
          expect(q.allowContextList).toBe(false);
          expect(q.index).toBeUndefined();
          expect(q.allowedTerritories).toBeUndefined();
        }
      );
    });

    test('creates a new TerritoryQualifierType with custom name', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ITerritoryQualifierTypeConfig> =
        {
          name: 'region',
          systemType: 'territory'
        };

      expect(TsRes.QualifierTypes.TerritoryQualifierType.createFromConfig(config)).toSucceedAndSatisfy(
        (q) => {
          expect(q).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
          expect(q.key).toBe('region');
          expect(q.name).toBe('region');
          expect(q.allowContextList).toBe(false);
          expect(q.index).toBeUndefined();
          expect(q.allowedTerritories).toBeUndefined();
        }
      );
    });

    test('creates a new TerritoryQualifierType with allowContextList enabled', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ITerritoryQualifierTypeConfig> =
        {
          name: 'territory',
          systemType: 'territory',
          configuration: {
            allowContextList: true
          }
        };

      expect(TsRes.QualifierTypes.TerritoryQualifierType.createFromConfig(config)).toSucceedAndSatisfy(
        (q) => {
          expect(q).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
          expect(q.key).toBe('territory');
          expect(q.name).toBe('territory');
          expect(q.allowContextList).toBe(true);
          expect(q.index).toBeUndefined();
          expect(q.allowedTerritories).toBeUndefined();
        }
      );
    });

    test('creates a new TerritoryQualifierType with allowContextList disabled', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ITerritoryQualifierTypeConfig> =
        {
          name: 'territory',
          systemType: 'territory',
          configuration: {
            allowContextList: false
          }
        };

      expect(TsRes.QualifierTypes.TerritoryQualifierType.createFromConfig(config)).toSucceedAndSatisfy(
        (q) => {
          expect(q).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
          expect(q.key).toBe('territory');
          expect(q.name).toBe('territory');
          expect(q.allowContextList).toBe(false);
          expect(q.index).toBeUndefined();
          expect(q.allowedTerritories).toBeUndefined();
        }
      );
    });

    test('creates a new TerritoryQualifierType with allowed territories', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ITerritoryQualifierTypeConfig> =
        {
          name: 'territory',
          systemType: 'territory',
          configuration: {
            allowedTerritories: ['US', 'CA', 'GB']
          }
        };

      expect(TsRes.QualifierTypes.TerritoryQualifierType.createFromConfig(config)).toSucceedAndSatisfy(
        (q) => {
          expect(q).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
          expect(q.key).toBe('territory');
          expect(q.name).toBe('territory');
          expect(q.allowContextList).toBe(false);
          expect(q.index).toBeUndefined();
          expect(q.allowedTerritories).toEqual(['US', 'CA', 'GB']);
        }
      );
    });

    test('creates a new TerritoryQualifierType with all configuration options', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ITerritoryQualifierTypeConfig> =
        {
          name: 'region',
          systemType: 'territory',
          configuration: {
            allowContextList: true,
            allowedTerritories: ['US', 'CA', 'GB']
          }
        };

      expect(TsRes.QualifierTypes.TerritoryQualifierType.createFromConfig(config)).toSucceedAndSatisfy(
        (q) => {
          expect(q).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
          expect(q.key).toBe('region');
          expect(q.name).toBe('region');
          expect(q.allowContextList).toBe(true);
          expect(q.index).toBeUndefined();
          expect(q.allowedTerritories).toEqual(['US', 'CA', 'GB']);
        }
      );
    });

    test('fails if the name is not a valid qualifier type name', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ITerritoryQualifierTypeConfig> =
        {
          name: 'not a valid name',
          systemType: 'territory'
        };

      expect(TsRes.QualifierTypes.TerritoryQualifierType.createFromConfig(config)).toFailWith(
        /not a valid qualifier type name/i
      );
    });

    test('fails if allowed territories contain invalid territory codes', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ITerritoryQualifierTypeConfig> =
        {
          name: 'territory',
          systemType: 'territory',
          configuration: {
            allowedTerritories: ['us', 'invalid-code']
          }
        };

      expect(TsRes.QualifierTypes.TerritoryQualifierType.createFromConfig(config)).toFailWith(
        /not a valid territory code/i
      );
    });
  });
});
