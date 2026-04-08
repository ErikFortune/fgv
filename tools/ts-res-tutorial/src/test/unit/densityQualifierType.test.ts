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
import { NoMatch, PerfectMatch, QualifierConditionValue, QualifierContextValue } from '@fgv/ts-res';
import { DENSITY_BUCKETS, DensityQualifierType, DensityQualifierTypeFactory } from '../../qualifierTypes';

describe('DensityQualifierType', () => {
  describe('create()', () => {
    test('succeeds with no parameters and defaults the name to "density"', () => {
      expect(DensityQualifierType.create()).toSucceedAndSatisfy((qt) => {
        expect(qt.name).toBe('density');
        expect(qt.systemTypeName).toBe('density');
        expect(qt.allowContextList).toBe(false);
      });
    });

    test('accepts a custom name', () => {
      expect(DensityQualifierType.create({ name: 'screenDensity' })).toSucceedAndSatisfy((qt) => {
        expect(qt.name).toBe('screenDensity');
      });
    });
  });

  describe('isValidConditionValue()', () => {
    const qt = DensityQualifierType.create().orThrow();

    test.each(DENSITY_BUCKETS)('accepts "%s"', (bucket) => {
      expect(qt.isValidConditionValue(bucket)).toBe(true);
    });

    test('accepts values regardless of case', () => {
      expect(qt.isValidConditionValue('HDPI')).toBe(true);
      expect(qt.isValidConditionValue('xHdPi')).toBe(true);
    });

    test('rejects unknown values', () => {
      expect(qt.isValidConditionValue('ultra')).toBe(false);
      expect(qt.isValidConditionValue('')).toBe(false);
      expect(qt.isValidConditionValue('xxxhdpi')).toBe(false);
    });
  });

  describe('matches()', () => {
    const qt = DensityQualifierType.create().orThrow();

    function score(condition: string, context: string): number {
      return qt.matches(condition as QualifierConditionValue, context as QualifierContextValue, 'matches');
    }

    test('returns PerfectMatch for an exact bucket match', () => {
      expect(score('hdpi', 'hdpi')).toBe(PerfectMatch);
      expect(score('xxhdpi', 'xxhdpi')).toBe(PerfectMatch);
    });

    test('matches are case-insensitive', () => {
      expect(score('HDPI', 'hdpi')).toBe(PerfectMatch);
      expect(score('hdpi', 'HDPI')).toBe(PerfectMatch);
    });

    test('adjacent buckets score a strong partial match', () => {
      expect(score('hdpi', 'xhdpi')).toBeCloseTo(0.7);
      expect(score('xhdpi', 'hdpi')).toBeCloseTo(0.7);
      expect(score('ldpi', 'mdpi')).toBeCloseTo(0.7);
    });

    test('two buckets away score a weak partial match', () => {
      expect(score('hdpi', 'xxhdpi')).toBeCloseTo(0.4);
      expect(score('ldpi', 'hdpi')).toBeCloseTo(0.4);
    });

    test('three buckets away is NoMatch', () => {
      expect(score('ldpi', 'xhdpi')).toBe(NoMatch);
      expect(score('ldpi', 'xxhdpi')).toBe(NoMatch);
    });

    test('unknown values are NoMatch', () => {
      expect(score('ultra', 'hdpi')).toBe(NoMatch);
      expect(score('hdpi', 'ultra')).toBe(NoMatch);
    });

    test('operators other than "matches" are NoMatch', () => {
      expect(qt.matches('hdpi' as QualifierConditionValue, 'hdpi' as QualifierContextValue, 'always')).toBe(
        NoMatch
      );
    });
  });

  describe('getConfigurationJson()', () => {
    test('returns a roundtrippable config object', () => {
      const qt = DensityQualifierType.create({ name: 'density' }).orThrow();
      expect(qt.getConfigurationJson()).toSucceedAndSatisfy((config) => {
        expect(config.name).toBe('density');
        expect(config.systemType).toBe('density');
      });
    });
  });

  describe('validateConfigurationJson()', () => {
    test('accepts well-formed configuration objects', () => {
      const qt = DensityQualifierType.create().orThrow();
      expect(qt.validateConfigurationJson({ name: 'density', systemType: 'density' })).toSucceed();
    });
  });
});

describe('DensityQualifierTypeFactory', () => {
  const factory = new DensityQualifierTypeFactory();

  test('creates a DensityQualifierType when systemType is "density"', () => {
    expect(factory.create({ name: 'density', systemType: 'density' })).toSucceedAndSatisfy((qt) => {
      expect(qt).toBeInstanceOf(DensityQualifierType);
    });
  });

  test('rejects configurations with a different systemType', () => {
    expect(factory.create({ name: 'language', systemType: 'language' })).toFailWith(/unknown systemType/i);
  });
});
