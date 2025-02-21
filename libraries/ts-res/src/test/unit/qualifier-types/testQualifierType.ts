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

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import * as TsRes from '../../../index';

export interface ITestQualifierTypeConstructorParams {
  name?: string;
  allowContextList?: string;
  index?: number;
}

export class TestQualifierType extends TsRes.QualifierTypes.QualifierType {
  public constructor(params?: ITestQualifierTypeConstructorParams) {
    super({
      name: params?.name ?? 'test',
      allowContextList: params?.allowContextList === 'true',
      index: params?.index
    });
  }

  public static create(params?: ITestQualifierTypeConstructorParams): Result<TestQualifierType> {
    return captureResult(() => new TestQualifierType(params));
  }

  public isValidConditionValue(value: string): value is TsRes.QualifierConditionValue {
    return true;
  }

  public validateCondition(
    value: string,
    operator?: TsRes.ConditionOperator
  ): Result<TsRes.QualifierConditionValue> {
    return this.isValidConditionValue(value) ? succeed(value) : fail(`Invalid condition value: ${value}`);
  }

  protected _matchOne(
    condition: TsRes.QualifierConditionValue,
    context: TsRes.QualifierContextValue,
    operator: TsRes.ConditionOperator
  ): TsRes.QualifierMatchScore {
    if ((condition as string) === context) {
      return TsRes.PerfectMatch;
    }
    if (condition.toLowerCase() === context.toLowerCase()) {
      return 0.5 as TsRes.QualifierMatchScore;
    }
    return TsRes.NoMatch;
  }
}
