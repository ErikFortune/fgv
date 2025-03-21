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

import { captureResult, Collections, mapResults, Result, succeed, ValidatingCollector } from '@fgv/ts-utils';
import { ConditionCollector } from './conditionCollector';
import { IConditionSetDecl } from './conditionSetDecls';
import { ConditionSet } from './conditionSet';
import { validatedConditionSetDecl } from './convert';
import { ConditionSetKey, Convert as CommonConvert } from '../common';

/**
 * Parameters for creating a {@link Conditions.ConditionSetCollector | ConditionSetCollector}.
 * @public
 */
export interface IConditionSetCollectorCreateParams {
  /**
   * The {@link Conditions.ConditionCollector | ConditionCollector} used to create conditions
   * for conditions in this collector.
   */
  conditions: ConditionCollector;

  /**
   * Optional array of {@link Conditions.IConditionSetDecl | condition set declarations} to add to
   * the collector.
   */
  conditionSets?: IConditionSetDecl[];
}

/**
 * A `ValidatingCollector` for {@link Conditions.ConditionSet | ConditionSets},
 * which collects condition sets supplied as {@link Conditions.ConditionSet | ConditionSet} or
 * as {@link Conditions.IConditionSetDecl | IConditionSetDecl} via the methods on the
 * `validating` property.
 * @public
 */
export class ConditionSetCollector extends ValidatingCollector<ConditionSet> {
  /**
   * Gets the {@link Conditions.ConditionCollector | ConditionCollector} used to create conditions
   * for conditions in this collector.
   */
  public conditions: ConditionCollector;

  /**
   * Creates a new {@link Conditions.ConditionSetCollector | ConditionSetCollector}.
   * @param params - {@link Conditions.IConditionSetCollectorCreateParams | Parameters} used to create
   * the collector.
   */
  protected constructor(params: IConditionSetCollectorCreateParams) {
    super({
      converters: new Collections.KeyValueConverters<ConditionSetKey, ConditionSet>({
        key: CommonConvert.conditionSetKey,
        value: (from: unknown) => this._toConditionSet(from)
      })
    });
    this.conditions = params.conditions;
    // it's very helpful for debugging if the unconditional condition set is always
    // in position 0
    this.validating.add(ConditionSet.create({ conditions: [] }).orThrow()).orThrow();
    params.conditionSets?.forEach((item) => this.validating.add(item).orThrow());
  }

  /**
   * Creates a new {@link Conditions.ConditionSetCollector | ConditionSetCollector}.
   * @param params - {@link Conditions.IConditionSetCollectorCreateParams | Parameters} used to create
   * the collector.
   * @returns `Success` with the new collector if successful, or `Failure` with an error message
   * if not.
   */
  public static create(params: IConditionSetCollectorCreateParams): Result<ConditionSetCollector> {
    return captureResult(() => new ConditionSetCollector(params));
  }

  private _toConditionSet(from: unknown): Result<ConditionSet> {
    if (from instanceof ConditionSet) {
      return succeed(from);
    }
    if (Array.isArray(from)) {
      return mapResults(from.map((item) => this.conditions.validating.getOrAdd(item))).onSuccess(
        (conditions) => ConditionSet.create({ conditions })
      );
    }
    return validatedConditionSetDecl
      .convert(from, { conditions: this.conditions, conditionSetIndex: this.size })
      .onSuccess((c) => ConditionSet.create(c));
  }
}

/**
 * A read-only {@link Conditions.ConditionSetCollector | ConditionSetCollector}.
 * @public
 */
export type ReadOnlyConditionSetCollector = Collections.IReadOnlyValidatingCollector<ConditionSet>;
