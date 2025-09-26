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
import { Result, fail, succeed } from '@fgv/ts-utils';
import { JsonCompatible, JsonObject } from '@fgv/ts-json-base';
import * as TsRes from '../../../index';

/**
 * Test class that uses the base QualifierType's validateCondition method
 * without overriding it to test the base implementation.
 */
class BaseQualifierTypeTest extends TsRes.QualifierTypes.QualifierType {
  private _validValues: string[];
  private _allowInvalidConditions: boolean;

  public readonly systemTypeName: TsRes.QualifierTypeName = TsRes.Convert.qualifierTypeName
    .convert('base-test')
    .orThrow();

  public constructor(
    validValues: string[] = ['valid', 'test'],
    allowInvalidConditions: boolean = false,
    allowContextList: boolean = false
  ) {
    super({
      name: 'base-test',
      allowContextList,
      index: undefined
    });
    this._validValues = validValues;
    this._allowInvalidConditions = allowInvalidConditions;
  }

  public static create(
    validValues?: string[],
    allowInvalidConditions?: boolean,
    allowContextList?: boolean
  ): Result<BaseQualifierTypeTest> {
    try {
      return succeed(new BaseQualifierTypeTest(validValues, allowInvalidConditions, allowContextList));
    } catch (error) {
      return fail(`Failed to create BaseQualifierTypeTest: ${error}`);
    }
  }

  public isValidConditionValue(value: string): value is TsRes.QualifierConditionValue {
    return this._allowInvalidConditions || this._validValues.includes(value);
  }

  public getConfigurationJson(): Result<
    JsonCompatible<TsRes.QualifierTypes.Config.IQualifierTypeConfig<JsonObject>>
  > {
    return succeed({
      name: this.name,
      systemType: 'base-test' as const,
      configuration: {}
    });
  }

  public validateConfigurationJson(
    from: unknown
  ): Result<JsonCompatible<TsRes.QualifierTypes.Config.IQualifierTypeConfig<JsonObject>>> {
    // Simple validation for test class
    if (typeof from !== 'object' || from === null) {
      return fail('Expected object');
    }
    const obj = from as Record<string, unknown>;
    if (typeof obj.name !== 'string') {
      return fail('name must be string');
    }
    if (obj.systemType !== 'base-test') {
      return fail('systemType must be base-test');
    }
    return succeed(from as JsonCompatible<TsRes.QualifierTypes.Config.IQualifierTypeConfig<JsonObject>>);
  }

  protected _matchOne(
    condition: TsRes.QualifierConditionValue,
    context: TsRes.QualifierContextValue,
    operator: TsRes.ConditionOperator
  ): TsRes.QualifierMatchScore {
    if ((condition as string) === (context as string)) {
      return TsRes.PerfectMatch;
    }
    return TsRes.NoMatch;
  }
}

describe('QualifierType base class', () => {
  describe('validateCondition', () => {
    let qt: BaseQualifierTypeTest;

    beforeEach(() => {
      qt = BaseQualifierTypeTest.create().orThrow();
    });

    test('fails for invalid condition operator', () => {
      expect(qt.validateCondition('valid', 'always')).toFailWith(/invalid condition operator/i);
      expect(qt.validateCondition('valid', 'never')).toFailWith(/invalid condition operator/i);
    });

    test('fails for invalid condition value', () => {
      expect(qt.validateCondition('invalid')).toFailWith(/invalid condition value/i);
      expect(qt.validateCondition('notvalid')).toFailWith(/invalid condition value/i);
    });

    test('succeeds for valid condition value with matches operator', () => {
      expect(qt.validateCondition('valid')).toSucceedWith('valid' as TsRes.QualifierConditionValue);
      expect(qt.validateCondition('test')).toSucceedWith('test' as TsRes.QualifierConditionValue);
      expect(qt.validateCondition('valid', 'matches')).toSucceedWith(
        'valid' as TsRes.QualifierConditionValue
      );
    });
  });

  describe('validateContextValue', () => {
    test('fails for invalid context value', () => {
      const qt = BaseQualifierTypeTest.create(['valid', 'test'], false, false).orThrow();
      expect(qt.validateContextValue('invalid')).toFailWith(/invalid context value/i);
      expect(qt.validateContextValue('notvalid')).toFailWith(/invalid context value/i);
    });

    test('succeeds for valid context value', () => {
      const qt = BaseQualifierTypeTest.create(['valid', 'test'], false, false).orThrow();
      expect(qt.validateContextValue('valid')).toSucceedWith('valid' as TsRes.QualifierContextValue);
      expect(qt.validateContextValue('test')).toSucceedWith('test' as TsRes.QualifierContextValue);
    });
  });

  describe('isValidContextValue with allowContextList', () => {
    test('returns true for valid list when allowContextList is true', () => {
      const qt = BaseQualifierTypeTest.create(['a', 'b', 'c'], false, true).orThrow();
      expect(qt.isValidContextValue('a,b,c')).toBe(true);
      expect(qt.isValidContextValue('a, b, c')).toBe(true);
      expect(qt.isValidContextValue('a')).toBe(true);
    });

    test('returns false for invalid list when allowContextList is true', () => {
      const qt = BaseQualifierTypeTest.create(['a', 'b', 'c'], false, true).orThrow();
      expect(qt.isValidContextValue('a,b,invalid')).toBe(false);
      expect(qt.isValidContextValue('invalid, b, c')).toBe(false);
    });

    test('returns false for list when allowContextList is false', () => {
      const qt = BaseQualifierTypeTest.create(['a', 'b', 'c'], false, false).orThrow();
      expect(qt.isValidContextValue('a,b,c')).toBe(false);
      expect(qt.isValidContextValue('a, b, c')).toBe(false);
    });
  });

  describe('isPotentialMatch', () => {
    let qt: BaseQualifierTypeTest;

    beforeEach(() => {
      qt = BaseQualifierTypeTest.create(['valid', 'test'], false, false).orThrow();
    });

    test('returns true for valid condition and context values that match', () => {
      expect(qt.isPotentialMatch('valid', 'valid')).toBe(true);
      expect(qt.isPotentialMatch('test', 'test')).toBe(true);
    });

    test('returns false for valid condition and context values that do not match', () => {
      expect(qt.isPotentialMatch('valid', 'test')).toBe(false);
      expect(qt.isPotentialMatch('test', 'valid')).toBe(false);
    });

    test('returns false when condition value is invalid', () => {
      expect(qt.isPotentialMatch('invalid', 'valid')).toBe(false);
      expect(qt.isPotentialMatch('notvalid', 'test')).toBe(false);
    });

    test('returns false when context value is invalid', () => {
      expect(qt.isPotentialMatch('valid', 'invalid')).toBe(false);
      expect(qt.isPotentialMatch('test', 'notvalid')).toBe(false);
    });

    test('returns false when both condition and context values are invalid', () => {
      expect(qt.isPotentialMatch('invalid', 'notvalid')).toBe(false);
      expect(qt.isPotentialMatch('notvalid', 'invalid')).toBe(false);
    });
  });
});
