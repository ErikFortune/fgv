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
        expect(q.acceptLowercase).toBe(false);
      });
    });

    test('creates a new TerritoryQualifierType with specified values', () => {
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          name: 'terr',
          allowContextList: true,
          index: 10,
          allowedTerritories: validTerritories,
          acceptLowercase: true
        })
      ).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
        expect(q.key).toBe('terr');
        expect(q.name).toBe('terr');
        expect(q.allowContextList).toBe(true);
        expect(q.allowedTerritories).toEqual(validTerritories.map((t) => t.toUpperCase()));
        expect(q.index).toBe(10);
        expect(q.acceptLowercase).toBe(true);
      });
    });

    test('normalizes allowed territory names to uppercase', () => {
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          name: 'terr',
          allowContextList: true,
          index: 10,
          allowedTerritories: validTerritories.map((t) => t.toLowerCase()),
          acceptLowercase: false
        })
      ).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
        expect(q.key).toBe('terr');
        expect(q.name).toBe('terr');
        expect(q.allowContextList).toBe(true);
        expect(q.allowedTerritories).toEqual(validTerritories.map((t) => t.toUpperCase()));
        expect(q.index).toBe(10);
        expect(q.acceptLowercase).toBe(false);
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
    describe('with default case-sensitive behavior', () => {
      let qt: TsRes.QualifierTypes.TerritoryQualifierType;

      beforeEach(() => {
        qt = TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow();
      });

      test('returns true for valid uppercase territories', () => {
        expect(qt.isValidConditionValue('US')).toBe(true);
        expect(qt.isValidConditionValue('DE')).toBe(true);
        expect(qt.isValidConditionValue('CN')).toBe(true);
      });

      test('returns false for otherwise valid lowercase territories', () => {
        expect(qt.isValidConditionValue('us')).toBe(false);
        expect(qt.isValidConditionValue('de')).toBe(false);
        expect(qt.isValidConditionValue('cn')).toBe(false);
      });

      test('returns false for otherwise valid mixed-case territories', () => {
        expect(qt.isValidConditionValue('Us')).toBe(false);
        expect(qt.isValidConditionValue('De')).toBe(false);
        expect(qt.isValidConditionValue('Cn')).toBe(false);
      });

      test('returns false for invalid territories', () => {
        invalidTerritories.forEach((t) => {
          expect(qt.isValidConditionValue(t)).toBe(false);
        });
      });
    });

    describe('with acceptLowercase enabled', () => {
      let qt: TsRes.QualifierTypes.TerritoryQualifierType;

      beforeEach(() => {
        qt = TsRes.QualifierTypes.TerritoryQualifierType.create({ acceptLowercase: true }).orThrow();
      });

      test('returns true for valid territories in any case', () => {
        expect(qt.isValidConditionValue('US')).toBe(true);
        expect(qt.isValidConditionValue('us')).toBe(true);
        expect(qt.isValidConditionValue('Us')).toBe(true);
        expect(qt.isValidConditionValue('DE')).toBe(true);
        expect(qt.isValidConditionValue('de')).toBe(true);
        expect(qt.isValidConditionValue('De')).toBe(true);
      });

      test('returns false for invalid territories', () => {
        invalidTerritories.forEach((t) => {
          expect(qt.isValidConditionValue(t)).toBe(false);
        });
      });
    });

    describe('with allowed territories and default case-sensitive behavior', () => {
      let qt: TsRes.QualifierTypes.TerritoryQualifierType;

      beforeEach(() => {
        qt = TsRes.QualifierTypes.TerritoryQualifierType.create({
          allowedTerritories: ['US', 'DE', 'cn'] // Mixed case in config, should be normalized
        }).orThrow();
      });

      test('returns true for allowed uppercase territories', () => {
        expect(qt.isValidConditionValue('US')).toBe(true);
        expect(qt.isValidConditionValue('DE')).toBe(true);
        expect(qt.isValidConditionValue('CN')).toBe(true); // Normalized from 'cn'
      });

      test('returns false for allowed territories in lowercase', () => {
        expect(qt.isValidConditionValue('us')).toBe(false);
        expect(qt.isValidConditionValue('de')).toBe(false);
        expect(qt.isValidConditionValue('cn')).toBe(false);
      });

      test('returns false for valid but not allowed territories', () => {
        expect(qt.isValidConditionValue('CA')).toBe(false);
        expect(qt.isValidConditionValue('GB')).toBe(false);
      });
    });

    describe('with allowed territories and acceptLowercase enabled', () => {
      let qt: TsRes.QualifierTypes.TerritoryQualifierType;

      beforeEach(() => {
        qt = TsRes.QualifierTypes.TerritoryQualifierType.create({
          allowedTerritories: ['US', 'de', 'CN'], // Mixed case in config, should be normalized
          acceptLowercase: true
        }).orThrow();
      });

      test('returns true for allowed territories in any case', () => {
        expect(qt.isValidConditionValue('US')).toBe(true);
        expect(qt.isValidConditionValue('us')).toBe(true);
        expect(qt.isValidConditionValue('DE')).toBe(true); // Normalized from 'de'
        expect(qt.isValidConditionValue('de')).toBe(true);
        expect(qt.isValidConditionValue('CN')).toBe(true);
        expect(qt.isValidConditionValue('cn')).toBe(true);
      });

      test('returns false for valid but not allowed territories', () => {
        expect(qt.isValidConditionValue('CA')).toBe(false);
        expect(qt.isValidConditionValue('ca')).toBe(false);
        expect(qt.isValidConditionValue('GB')).toBe(false);
        expect(qt.isValidConditionValue('gb')).toBe(false);
      });
    });
  });

  describe('matches', () => {
    describe('with default case-sensitive behavior', () => {
      let qt: TsRes.QualifierTypes.TerritoryQualifierType;

      beforeEach(() => {
        qt = TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow();
      });

      test('returns a perfect match for matching uppercase territories', () => {
        expect(
          qt.matches('US' as TsRes.QualifierConditionValue, 'US' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('US' as TsRes.QualifierConditionValue, 'us' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
      });

      test('returns no match for lowercase condition values', () => {
        // Lowercase condition values are invalid with default case-sensitive behavior
        expect(
          qt.matches('us' as TsRes.QualifierConditionValue, 'US' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
        expect(
          qt.matches('us' as TsRes.QualifierConditionValue, 'us' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
      });

      test('returns no match for non-matching territories', () => {
        expect(
          qt.matches('US' as TsRes.QualifierConditionValue, 'CA' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
      });
    });

    describe('with acceptLowercase enabled', () => {
      let qt: TsRes.QualifierTypes.TerritoryQualifierType;

      beforeEach(() => {
        qt = TsRes.QualifierTypes.TerritoryQualifierType.create({ acceptLowercase: true }).orThrow();
      });

      test('returns a perfect match for matching territories in any case', () => {
        expect(
          qt.matches('US' as TsRes.QualifierConditionValue, 'US' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('US' as TsRes.QualifierConditionValue, 'us' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('us' as TsRes.QualifierConditionValue, 'US' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('us' as TsRes.QualifierConditionValue, 'us' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
      });

      test('returns no match for non-matching territories', () => {
        expect(
          qt.matches('US' as TsRes.QualifierConditionValue, 'CA' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
        expect(
          qt.matches('us' as TsRes.QualifierConditionValue, 'ca' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
      });
    });

    describe('with allowed territories and default case-sensitive behavior', () => {
      let qt: TsRes.QualifierTypes.TerritoryQualifierType;

      beforeEach(() => {
        qt = TsRes.QualifierTypes.TerritoryQualifierType.create({
          allowedTerritories: ['US', 'DE', 'cn'] // Mixed case in config, normalized to uppercase
        }).orThrow();
      });

      test('returns a perfect match for matching allowed territories', () => {
        expect(
          qt.matches('US' as TsRes.QualifierConditionValue, 'US' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('DE' as TsRes.QualifierConditionValue, 'de' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('CN' as TsRes.QualifierConditionValue, 'cn' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
      });

      test('returns no match for lowercase condition values', () => {
        expect(
          qt.matches('us' as TsRes.QualifierConditionValue, 'US' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
        expect(
          qt.matches('de' as TsRes.QualifierConditionValue, 'DE' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
      });

      test('returns no match for valid but not allowed territories', () => {
        expect(
          qt.matches('CA' as TsRes.QualifierConditionValue, 'CA' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
      });
    });

    describe('with allowed territories and acceptLowercase enabled', () => {
      let qt: TsRes.QualifierTypes.TerritoryQualifierType;

      beforeEach(() => {
        qt = TsRes.QualifierTypes.TerritoryQualifierType.create({
          allowedTerritories: ['US', 'de', 'CN'], // Mixed case in config, normalized to uppercase
          acceptLowercase: true
        }).orThrow();
      });

      test('returns a perfect match for matching allowed territories in any case', () => {
        expect(
          qt.matches('US' as TsRes.QualifierConditionValue, 'US' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('us' as TsRes.QualifierConditionValue, 'us' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('DE' as TsRes.QualifierConditionValue, 'de' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('de' as TsRes.QualifierConditionValue, 'DE' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('CN' as TsRes.QualifierConditionValue, 'cn' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('cn' as TsRes.QualifierConditionValue, 'CN' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
      });

      test('returns no match for valid but not allowed territories', () => {
        expect(
          qt.matches('CA' as TsRes.QualifierConditionValue, 'CA' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
        expect(
          qt.matches('ca' as TsRes.QualifierConditionValue, 'ca' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
      });
    });
  });

  describe('isValidTerritoryConditionValue static method', () => {
    describe('with default case-sensitive behavior', () => {
      test('returns true for valid uppercase territories', () => {
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('US')).toBe(true);
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('DE')).toBe(true);
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('CN')).toBe(true);
      });

      test('returns false for valid lowercase territories', () => {
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('us')).toBe(false);
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('de')).toBe(false);
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('cn')).toBe(false);
      });

      test('returns false for valid mixed-case territories', () => {
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('Us')).toBe(false);
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('De')).toBe(false);
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('Cn')).toBe(false);
      });

      test('returns false for invalid territories', () => {
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('419')).toBe(false);
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('USA')).toBe(false);
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('mexico')).toBe(
          false
        );
      });
    });

    describe('with acceptLowercase enabled', () => {
      test('returns true for valid territories in any case', () => {
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('US', true)).toBe(
          true
        );
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('us', true)).toBe(
          true
        );
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('Us', true)).toBe(
          true
        );
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('DE', true)).toBe(
          true
        );
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('de', true)).toBe(
          true
        );
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('De', true)).toBe(
          true
        );
      });

      test('returns false for invalid territories', () => {
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('419', true)).toBe(
          false
        );
        expect(TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('USA', true)).toBe(
          false
        );
        expect(
          TsRes.QualifierTypes.TerritoryQualifierType.isValidTerritoryConditionValue('mexico', true)
        ).toBe(false);
      });
    });
  });

  describe('toTerritoryConditionValue static method', () => {
    describe('with default case-sensitive behavior', () => {
      test('succeeds for valid uppercase territories', () => {
        expect(TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('US')).toSucceedWith(
          'US' as TsRes.QualifierConditionValue
        );
        expect(TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('DE')).toSucceedWith(
          'DE' as TsRes.QualifierConditionValue
        );
        expect(TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('CN')).toSucceedWith(
          'CN' as TsRes.QualifierConditionValue
        );
      });

      test('normalizes mixed-case territories to uppercase', () => {
        expect(TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('us')).toSucceedWith(
          'US' as TsRes.QualifierConditionValue
        );
        expect(TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('de')).toSucceedWith(
          'DE' as TsRes.QualifierConditionValue
        );
        expect(TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('cn')).toSucceedWith(
          'CN' as TsRes.QualifierConditionValue
        );
        expect(TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('Us')).toSucceedWith(
          'US' as TsRes.QualifierConditionValue
        );
      });

      test('fails for invalid territories', () => {
        expect(TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('419')).toFailWith(
          /not a valid territory code/i
        );
        expect(TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('USA')).toFailWith(
          /not a valid territory code/i
        );
        expect(TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('mexico')).toFailWith(
          /not a valid territory code/i
        );
      });
    });

    describe('with acceptLowercase enabled', () => {
      test('succeeds for valid territories in any case', () => {
        expect(
          TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('US', true)
        ).toSucceedWith('US' as TsRes.QualifierConditionValue);
        expect(
          TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('us', true)
        ).toSucceedWith('US' as TsRes.QualifierConditionValue);
        expect(
          TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('Us', true)
        ).toSucceedWith('US' as TsRes.QualifierConditionValue);
        expect(
          TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('DE', true)
        ).toSucceedWith('DE' as TsRes.QualifierConditionValue);
        expect(
          TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('de', true)
        ).toSucceedWith('DE' as TsRes.QualifierConditionValue);
        expect(
          TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('De', true)
        ).toSucceedWith('DE' as TsRes.QualifierConditionValue);
      });

      test('fails for invalid territories', () => {
        expect(TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('419', true)).toFailWith(
          /not a valid territory code/i
        );
        expect(TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('USA', true)).toFailWith(
          /not a valid territory code/i
        );
        expect(
          TsRes.QualifierTypes.TerritoryQualifierType.toTerritoryConditionValue('mexico', true)
        ).toFailWith(/not a valid territory code/i);
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
          expect(q.acceptLowercase).toBe(false);
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
            allowedTerritories: ['US', 'CA', 'GB'],
            acceptLowercase: true
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
          expect(q.acceptLowercase).toBe(true);
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

    test('creates a new TerritoryQualifierType with acceptLowercase from config', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ITerritoryQualifierTypeConfig> =
        {
          name: 'territory',
          systemType: 'territory',
          configuration: {
            acceptLowercase: true
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
          expect(q.acceptLowercase).toBe(true);
        }
      );
    });
  });
});
