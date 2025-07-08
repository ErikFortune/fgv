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

import { captureResult, Collections, Result, succeed, ValidatingCollector } from '@fgv/ts-utils';
import { IReadOnlyQualifierCollector } from '../qualifiers';
import { IConditionDecl } from './conditionDecls';
import { Condition } from './condition';
import { Convert as CommonConvert, ConditionKey } from '../common';
import { validatedConditionDecl } from './convert';

/**
 * Parameters for creating a {@link Conditions.ConditionCollector | ConditionCollector}.
 * @public
 */
export interface IConditionCollectorCreateParams {
  /**
   * The {@link Qualifiers.IReadOnlyQualifierCollector | ReadOnlyQualifierCollector} used to
   * create conditions in this collector.
   */
  qualifiers: IReadOnlyQualifierCollector;

  /**
   * Optional array of condition declarations to add to the collector.
   */
  conditions?: IConditionDecl[];
}

/**
 * A `ValidatingCollector` for {@link Conditions.Condition | Conditions},
 * which collects conditions supplied as either {@link Conditions.Condition | Condition} or
 * {@link Conditions.IConditionDecl | IConditionDecl}.
 * @public
 */
export class ConditionCollector extends ValidatingCollector<Condition> {
  /**
   * The {@link Qualifiers.IReadOnlyQualifierCollector | ReadOnlyQualifierCollector} used to create conditions
   * in this collector.
   * @public
   */
  public qualifiers: IReadOnlyQualifierCollector;

  /**
   * Constructor for a {@link Conditions.ConditionCollector | ConditionCollector} object.
   * @param params - Required {@link Conditions.IConditionCollectorCreateParams | parameters} for
   * creating the collector.
   */
  protected constructor(params: IConditionCollectorCreateParams) {
    super({
      converters: new Collections.KeyValueConverters<ConditionKey, Condition>({
        key: CommonConvert.conditionKey,
        value: (from: unknown) => this._toCondition(from)
      })
    });
    this.qualifiers = params.qualifiers;
    /* c8 ignore next 1 - ? is defense in depth */
    params.conditions?.forEach((c) => this.validating.add(c).orThrow());
  }

  /**
   * Creates a new {@link Conditions.ConditionCollector | ConditionCollector} object.
   * @param params - Required {@link Conditions.IConditionCollectorCreateParams | parameters} for
   * creating the collector.
   * @returns `Success` with the new collector if successful, or `Failure` with
   * an error message if not.
   */
  public static create(params: IConditionCollectorCreateParams): Result<ConditionCollector> {
    return captureResult(() => new ConditionCollector(params));
  }

  private _toCondition(from: unknown): Result<Condition> {
    if (from instanceof Condition) {
      return succeed(from);
    }
    return validatedConditionDecl
      .convert(from, { qualifiers: this.qualifiers, conditionIndex: this.size })
      .onSuccess((c) => Condition.create(c));
  }
}

/**
 * Type alias for a read-only {@link Conditions.ConditionCollector | ConditionCollector}.
 * @public
 */
export type ReadOnlyConditionCollector = Collections.IReadOnlyValidatingCollector<Condition>;
