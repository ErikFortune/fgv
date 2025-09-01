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
      });

      test('returns no match for lowercase condition values', () => {
        // Lowercase condition values are invalid with default case-sensitive behavior
        expect(
          qt.matches('us' as TsRes.QualifierConditionValue, 'US' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
        expect(
          qt.matches('us' as TsRes.QualifierConditionValue, 'us' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
        expect(
          qt.matches('US' as TsRes.QualifierConditionValue, 'us' as TsRes.QualifierContextValue, 'matches')
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
      });

      test('returns no match for lowercase condition values', () => {
        expect(
          qt.matches('us' as TsRes.QualifierConditionValue, 'US' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
        expect(
          qt.matches('de' as TsRes.QualifierConditionValue, 'DE' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
        expect(
          qt.matches('DE' as TsRes.QualifierConditionValue, 'de' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
        expect(
          qt.matches('CN' as TsRes.QualifierConditionValue, 'cn' as TsRes.QualifierContextValue, 'matches')
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

  describe('hierarchy support', () => {
    test('creates a TerritoryQualifierType with hierarchy using valid ISO-3166 codes', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ITerritoryQualifierTypeConfig> =
        {
          name: 'territory',
          systemType: 'territory',
          configuration: {
            allowedTerritories: ['US', 'PR', 'VI'],
            hierarchy: {
              PR: 'US', // Puerto Rico is a US territory
              VI: 'US' // US Virgin Islands is a US territory
            }
          }
        };

      expect(TsRes.QualifierTypes.TerritoryQualifierType.createFromConfig(config)).toSucceedAndSatisfy(
        (q) => {
          expect(q).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
          expect(q.hierarchy).toBeDefined();
          expect(q.hierarchy?.hasValue('US')).toBe(true);
          expect(q.hierarchy?.hasValue('PR')).toBe(true);
          expect(q.hierarchy?.hasValue('VI')).toBe(true);
        }
      );
    });

    test('uses hierarchy for matching when configured with allowedTerritories', () => {
      const qt = TsRes.QualifierTypes.TerritoryQualifierType.create({
        allowedTerritories: ['US', 'PR', 'VI'],
        hierarchy: {
          PR: 'US', // Puerto Rico is a US territory
          VI: 'US' // US Virgin Islands is a US territory
        }
      }).orThrow();

      // Perfect match - same territory
      expect(
        qt.matches('US' as TsRes.QualifierConditionValue, 'US' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);

      // Hierarchical match - context is child of condition
      const usToPrScore = qt.matches(
        'US' as TsRes.QualifierConditionValue,
        'PR' as TsRes.QualifierContextValue,
        'matches'
      );
      expect(usToPrScore).toBeGreaterThan(TsRes.NoMatch);
      expect(usToPrScore).toBeLessThan(TsRes.PerfectMatch);

      // Hierarchical match - context is child of condition
      const usToViScore = qt.matches(
        'US' as TsRes.QualifierConditionValue,
        'VI' as TsRes.QualifierContextValue,
        'matches'
      );
      expect(usToViScore).toBeGreaterThan(TsRes.NoMatch);
      expect(usToViScore).toBeLessThan(TsRes.PerfectMatch);

      // No match - reverse hierarchy (parent cannot match child)
      expect(
        qt.matches('PR' as TsRes.QualifierConditionValue, 'US' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.NoMatch);

      // No match - unrelated territories
      expect(
        qt.matches('PR' as TsRes.QualifierConditionValue, 'VI' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.NoMatch);
    });

    test('normalizes territory codes for hierarchy matching', () => {
      const qt = TsRes.QualifierTypes.TerritoryQualifierType.create({
        allowedTerritories: ['US', 'PR', 'VI'],
        acceptLowercase: true,
        hierarchy: {
          PR: 'US',
          VI: 'US'
        }
      }).orThrow();

      // Should work with mixed case
      const score = qt.matches(
        'us' as TsRes.QualifierConditionValue,
        'pr' as TsRes.QualifierContextValue,
        'matches'
      );
      expect(score).toBeGreaterThan(TsRes.NoMatch);
      expect(score).toBeLessThan(TsRes.PerfectMatch);
    });

    test('falls back to regular matching when no hierarchy is configured', () => {
      const qt = TsRes.QualifierTypes.TerritoryQualifierType.create({
        allowedTerritories: ['US', 'PR', 'VI']
        // No hierarchy configured
      }).orThrow();

      // Perfect match works
      expect(
        qt.matches('US' as TsRes.QualifierConditionValue, 'US' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.PerfectMatch);

      // No hierarchical matching
      expect(
        qt.matches('US' as TsRes.QualifierConditionValue, 'PR' as TsRes.QualifierContextValue, 'matches')
      ).toBe(TsRes.NoMatch);
    });

    describe('hierarchy without allowedTerritories', () => {
      test('creates a hierarchy with open values mode', () => {
        const qt = TsRes.QualifierTypes.TerritoryQualifierType.create({
          hierarchy: {
            PR: 'US', // Puerto Rico is a US territory
            VI: 'US' // US Virgin Islands is a US territory
          }
          // No allowedTerritories - open values mode
        }).orThrow();

        expect(qt.hierarchy).toBeDefined();
        expect(qt.allowedTerritories).toBeUndefined();
        expect(qt.hierarchy?.hasValue('US')).toBe(true);
        expect(qt.hierarchy?.hasValue('PR')).toBe(true);
        expect(qt.hierarchy?.hasValue('VI')).toBe(true);
      });

      test('uses hierarchy matching for territories in hierarchy', () => {
        const qt = TsRes.QualifierTypes.TerritoryQualifierType.create({
          hierarchy: {
            PR: 'US',
            VI: 'US'
          }
        }).orThrow();

        // Perfect matches for territories in hierarchy
        expect(
          qt.matches('US' as TsRes.QualifierConditionValue, 'US' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);
        expect(
          qt.matches('PR' as TsRes.QualifierConditionValue, 'PR' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);

        // Hierarchical matches
        const usToPrScore = qt.matches(
          'US' as TsRes.QualifierConditionValue,
          'PR' as TsRes.QualifierContextValue,
          'matches'
        );
        expect(usToPrScore).toBeGreaterThan(TsRes.NoMatch);
        expect(usToPrScore).toBeLessThan(TsRes.PerfectMatch);

        const usToViScore = qt.matches(
          'US' as TsRes.QualifierConditionValue,
          'VI' as TsRes.QualifierContextValue,
          'matches'
        );
        expect(usToViScore).toBeGreaterThan(TsRes.NoMatch);
        expect(usToViScore).toBeLessThan(TsRes.PerfectMatch);
      });

      test('uses regular matching for territories not in hierarchy', () => {
        const qt = TsRes.QualifierTypes.TerritoryQualifierType.create({
          hierarchy: {
            PR: 'US',
            VI: 'US'
          }
        }).orThrow();

        // Perfect match for territories not in hierarchy
        expect(
          qt.matches('CA' as TsRes.QualifierConditionValue, 'CA' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.PerfectMatch);

        // No match for unrelated territories not in hierarchy
        expect(
          qt.matches('CA' as TsRes.QualifierConditionValue, 'GB' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);

        // No match between hierarchy and non-hierarchy territories
        expect(
          qt.matches('US' as TsRes.QualifierConditionValue, 'CA' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
        expect(
          qt.matches('CA' as TsRes.QualifierConditionValue, 'PR' as TsRes.QualifierContextValue, 'matches')
        ).toBe(TsRes.NoMatch);
      });

      test('validates condition values correctly with hierarchy only', () => {
        const qt = TsRes.QualifierTypes.TerritoryQualifierType.create({
          hierarchy: {
            PR: 'US',
            VI: 'US'
          }
        }).orThrow();

        // All valid ISO-3166 codes should be accepted (no allowedTerritories constraint)
        expect(qt.isValidConditionValue('US')).toBe(true);
        expect(qt.isValidConditionValue('PR')).toBe(true);
        expect(qt.isValidConditionValue('VI')).toBe(true);
        expect(qt.isValidConditionValue('CA')).toBe(true);
        expect(qt.isValidConditionValue('GB')).toBe(true);

        // Invalid codes should still be rejected
        expect(qt.isValidConditionValue('USA')).toBe(false);
        expect(qt.isValidConditionValue('123')).toBe(false);
        expect(qt.isValidConditionValue('invalid')).toBe(false);
      });
    });
  });

  describe('getConfigurationJson', () => {
    test('returns valid configuration JSON with default settings', () => {
      expect(TsRes.QualifierTypes.TerritoryQualifierType.create()).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((config) => {
          expect(config).toEqual({
            name: 'territory',
            systemType: 'territory',
            configuration: {
              allowContextList: false,
              acceptLowercase: false
            }
          });
        });
      });
    });

    test('returns valid configuration JSON with custom name and allowContextList enabled', () => {
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          name: 'custom-territory',
          allowContextList: true
        })
      ).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((config) => {
          expect(config).toEqual({
            name: 'custom-territory',
            systemType: 'territory',
            configuration: {
              allowContextList: true,
              acceptLowercase: false
            }
          });
        });
      });
    });

    test('returns valid configuration JSON with acceptLowercase enabled', () => {
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          acceptLowercase: true
        })
      ).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((config) => {
          expect(config).toEqual({
            name: 'territory',
            systemType: 'territory',
            configuration: {
              allowContextList: false,
              acceptLowercase: true
            }
          });
        });
      });
    });

    test('returns valid configuration JSON with allowedTerritories', () => {
      const allowedTerritories = ['US', 'CA', 'MX'];
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          allowedTerritories
        })
      ).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((config) => {
          expect(config).toEqual({
            name: 'territory',
            systemType: 'territory',
            configuration: {
              allowContextList: false,
              acceptLowercase: false,
              allowedTerritories: ['US', 'CA', 'MX']
            }
          });
        });
      });
    });

    test('returns valid configuration JSON with hierarchy', () => {
      const hierarchy = {
        US: 'NA',
        CA: 'NA',
        MX: 'NA'
      };
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          allowedTerritories: ['US', 'CA', 'MX', 'NA'],
          hierarchy
        })
      ).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((config) => {
          expect(config).toEqual({
            name: 'territory',
            systemType: 'territory',
            configuration: {
              allowContextList: false,
              acceptLowercase: false,
              allowedTerritories: ['US', 'CA', 'MX', 'NA'],
              hierarchy
            }
          });
        });
      });
    });

    test('returns valid configuration JSON with all custom settings', () => {
      const params = {
        name: 'specialized-territory',
        allowContextList: true,
        acceptLowercase: true,
        allowedTerritories: ['US', 'GB', 'DE'],
        index: 42
      };
      expect(TsRes.QualifierTypes.TerritoryQualifierType.create(params)).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((config) => {
          expect(config).toEqual({
            name: 'specialized-territory',
            systemType: 'territory',
            configuration: {
              allowContextList: true,
              acceptLowercase: true,
              allowedTerritories: ['US', 'GB', 'DE']
            }
          });
        });
      });
    });
  });

  describe('getConfiguration', () => {
    test('strongly-typed getConfiguration method exists', () => {
      expect(TsRes.QualifierTypes.TerritoryQualifierType.create()).toSucceedAndSatisfy((qt) => {
        expect(typeof qt.getConfiguration).toBe('function');
      });
    });

    test('returns strongly-typed configuration matching getConfigurationJson', () => {
      expect(TsRes.QualifierTypes.TerritoryQualifierType.create()).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfiguration()).toSucceedWith({
          name: 'territory',
          systemType: 'territory',
          configuration: {
            allowContextList: false,
            acceptLowercase: false
          }
        });
      });
    });

    test('getConfiguration returns correct values for custom settings', () => {
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          name: 'custom-territory',
          allowContextList: true,
          acceptLowercase: true
        })
      ).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfiguration()).toSucceedWith({
          name: 'custom-territory',
          systemType: 'territory',
          configuration: {
            allowContextList: true,
            acceptLowercase: true
          }
        });
      });
    });

    test('getConfiguration returns correct values with allowedTerritories', () => {
      const allowedTerritories = ['US', 'CA', 'MX'];
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          allowedTerritories
        })
      ).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfiguration()).toSucceedWith({
          name: 'territory',
          systemType: 'territory',
          configuration: {
            allowContextList: false,
            acceptLowercase: false,
            allowedTerritories: ['US', 'CA', 'MX']
          }
        });
      });
    });

    test('getConfiguration returns correct values with hierarchy', () => {
      const hierarchy = {
        US: 'NA',
        CA: 'NA',
        MX: 'NA'
      };
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          allowedTerritories: ['US', 'CA', 'MX', 'NA'],
          hierarchy
        })
      ).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfiguration()).toSucceedWith({
          name: 'territory',
          systemType: 'territory',
          configuration: {
            allowContextList: false,
            acceptLowercase: false,
            allowedTerritories: ['US', 'CA', 'MX', 'NA'],
            hierarchy
          }
        });
      });
    });

    test('getConfiguration and getConfigurationJson return equivalent data', () => {
      expect(TsRes.QualifierTypes.TerritoryQualifierType.create()).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((jsonConfig) => {
          expect(qt.getConfiguration()).toSucceedAndSatisfy((typedConfig) => {
            // Both should return equivalent data structures
            expect(typedConfig).toEqual(jsonConfig);
            expect(typedConfig).toEqual({
              name: 'territory',
              systemType: 'territory',
              configuration: {
                allowContextList: false,
                acceptLowercase: false
              }
            });
          });
        });
      });
    });

    test('getConfiguration and getConfigurationJson return equivalent data with custom settings', () => {
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          name: 'custom-territory',
          allowContextList: true,
          acceptLowercase: true
        })
      ).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((jsonConfig) => {
          expect(qt.getConfiguration()).toSucceedAndSatisfy((typedConfig) => {
            expect(typedConfig).toEqual(jsonConfig);
            expect(typedConfig).toEqual({
              name: 'custom-territory',
              systemType: 'territory',
              configuration: {
                allowContextList: true,
                acceptLowercase: true
              }
            });
          });
        });
      });
    });

    test('getConfiguration and getConfigurationJson return equivalent data with acceptLowercase enabled', () => {
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          acceptLowercase: true
        })
      ).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((jsonConfig) => {
          expect(qt.getConfiguration()).toSucceedAndSatisfy((typedConfig) => {
            expect(typedConfig).toEqual(jsonConfig);
            expect(typedConfig).toEqual({
              name: 'territory',
              systemType: 'territory',
              configuration: {
                allowContextList: false,
                acceptLowercase: true
              }
            });
          });
        });
      });
    });

    test('getConfiguration and getConfigurationJson return equivalent data with allowedTerritories', () => {
      const allowedTerritories = ['US', 'CA', 'MX'];
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          allowedTerritories
        })
      ).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((jsonConfig) => {
          expect(qt.getConfiguration()).toSucceedAndSatisfy((typedConfig) => {
            expect(typedConfig).toEqual(jsonConfig);
            expect(typedConfig).toEqual({
              name: 'territory',
              systemType: 'territory',
              configuration: {
                allowContextList: false,
                acceptLowercase: false,
                allowedTerritories: ['US', 'CA', 'MX']
              }
            });
          });
        });
      });
    });

    test('getConfiguration and getConfigurationJson return equivalent data with hierarchy', () => {
      const hierarchy = {
        US: 'NA',
        CA: 'NA',
        MX: 'NA'
      };
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          allowedTerritories: ['US', 'CA', 'MX', 'NA'],
          hierarchy
        })
      ).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((jsonConfig) => {
          expect(qt.getConfiguration()).toSucceedAndSatisfy((typedConfig) => {
            expect(typedConfig).toEqual(jsonConfig);
            expect(typedConfig).toEqual({
              name: 'territory',
              systemType: 'territory',
              configuration: {
                allowContextList: false,
                acceptLowercase: false,
                allowedTerritories: ['US', 'CA', 'MX', 'NA'],
                hierarchy
              }
            });
          });
        });
      });
    });

    test('getConfiguration and getConfigurationJson return equivalent data with all custom settings', () => {
      const params = {
        name: 'specialized-territory',
        allowContextList: true,
        acceptLowercase: true,
        allowedTerritories: ['US', 'GB', 'DE'],
        index: 42
      };
      expect(TsRes.QualifierTypes.TerritoryQualifierType.create(params)).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((jsonConfig) => {
          expect(qt.getConfiguration()).toSucceedAndSatisfy((typedConfig) => {
            expect(typedConfig).toEqual(jsonConfig);
            expect(typedConfig).toEqual({
              name: 'specialized-territory',
              systemType: 'territory',
              configuration: {
                allowContextList: true,
                acceptLowercase: true,
                allowedTerritories: ['US', 'GB', 'DE']
              }
            });
          });
        });
      });
    });

    test('getConfiguration method returns strongly typed results', () => {
      expect(TsRes.QualifierTypes.TerritoryQualifierType.create()).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfiguration()).toSucceedAndSatisfy((config) => {
          // Verify the configuration has the expected structure and types
          expect(config.name).toBe('territory');
          expect(config.systemType).toBe('territory');
          expect(config.configuration).toBeDefined();
          if (config.configuration) {
            expect(config.configuration.allowContextList).toBe(false);
            expect(config.configuration.acceptLowercase).toBe(false);

            // The method should provide compile-time type safety
            // (this is verified by TypeScript compilation, not runtime assertions)
            expect(typeof config.name).toBe('string');
            expect(typeof config.systemType).toBe('string');
            expect(typeof config.configuration.allowContextList).toBe('boolean');
            expect(typeof config.configuration.acceptLowercase).toBe('boolean');
          }
        });
      });
    });

    test('getConfiguration method returns strongly typed results with complex configuration', () => {
      const allowedTerritories = ['US', 'CA', 'MX'];
      const hierarchy = { US: 'NA', CA: 'NA', MX: 'NA' };
      expect(
        TsRes.QualifierTypes.TerritoryQualifierType.create({
          allowedTerritories: [...allowedTerritories, 'NA'],
          hierarchy,
          acceptLowercase: true
        })
      ).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfiguration()).toSucceedAndSatisfy((config) => {
          // Verify complex configuration structures
          if (config.configuration) {
            expect(config.configuration.allowedTerritories).toEqual(['US', 'CA', 'MX', 'NA']);
            expect(config.configuration.hierarchy).toEqual(hierarchy);
            expect(config.configuration.acceptLowercase).toBe(true);

            // Type safety verification
            expect(Array.isArray(config.configuration.allowedTerritories)).toBe(true);
            expect(typeof config.configuration.hierarchy).toBe('object');
            expect(config.configuration.hierarchy).not.toBeNull();
          }
        });
      });
    });
  });
});
