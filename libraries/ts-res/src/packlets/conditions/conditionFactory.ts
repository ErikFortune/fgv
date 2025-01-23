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
  captureResult,
  Collections,
  failWithDetail,
  Result,
  ResultMap,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';
import { QualifierMap } from '../qualifiers';
import { Condition, IConditionCreateParams } from './condition';

/**
 * Parameters used to create a {@link ConditionFactory} object.
 * @public
 */
export interface IConditionFactoryCreateParams {
  qualifiers: QualifierMap;
}

/**
 * Represents a factory for creating {@link Condition | conditions}.
 * @public
 */
export class ConditionFactory {
  private _map: ResultMap<string, Condition>;
  private _conditions: Condition[];
  private _qualifiers: QualifierMap;

  protected constructor(params: IConditionFactoryCreateParams) {
    this._qualifiers = params.qualifiers;
    this._map = new ResultMap<string, Condition>();
    this._conditions = [];
  }

  public static create(params: IConditionFactoryCreateParams): Result<ConditionFactory> {
    return captureResult(() => new ConditionFactory(params));
  }

  public getOrAdd(params: IConditionCreateParams): Result<Condition> {
    return Condition.create(params).onSuccess((condition) => {
      return this._map.getOrAdd(condition.toString(), condition).onSuccess((added) => {
        if (added !== condition) {
          const diffs = Condition.diff(condition, added).filter((diff) => !/conditionIndex/.test(diff));
          if (diffs.length > 0) {
            return failWithDetail<Condition, Collections.ResultMapResultDetail>(
              `${condition.toString()} conflicts with existing condition:\n   ${diffs.join('\n   ')}`,
              'invalid-value'
            );
          }
        }
        return succeedWithDetail(added, 'added');
      });
    });
  }
}
