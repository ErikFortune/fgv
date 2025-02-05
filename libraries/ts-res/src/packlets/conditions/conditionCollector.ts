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
  DetailedResult,
  fail,
  Result,
  succeed,
  ValidatingCollector
} from '@fgv/ts-utils';
import { ReadOnlyQualifierCollector } from '../qualifiers';
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
   * The {@link Qualifiers.ReadOnlyQualifierCollector | ReadOnlyQualifierCollector} used to
   * create conditions in this collector.
   */
  qualifiers: ReadOnlyQualifierCollector;

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
   * The {@link Qualifiers.ReadOnlyQualifierCollector | ReadOnlyQualifierCollector} used to create conditions
   * in this collector.
   * @public
   */
  protected _qualifiers: ReadOnlyQualifierCollector;

  /**
   * Constructor for a {@link Conditions.ConditionCollector | ConditionCollector} object.
   * @param params - Required {@link Conditions.IConditionCollectorCreateParams | parameters} for
   * creating the collector.
   */
  protected constructor(params: IConditionCollectorCreateParams) {
    super({
      converters: new Collections.KeyValueConverters<ConditionKey, Condition>({
        key: CommonConvert.conditionKey,
        value: (value: unknown) => {
          return value instanceof Condition ? succeed(value) : fail('not a Condition');
        }
      })
    });
    this._qualifiers = params.qualifiers;
    params.conditions?.forEach((c) => this.add(c));
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

  /**
   * Adds a condition to the collector given a {@link Conditions.IConditionDecl | condition declaration}.
   * If an identical condition is already in the collector, the existing condition is returned.
   * @param decl - The condition to add to the collector, supplied as an `unknown` value but
   * expected to be a well-formed {@link Conditions.IConditionDecl | IConditionDecl}.
   * @returns Returns `DetailedSuccess` with the condition and detail `added` if it was added
   * or detail `exists` if the item was already in the map.  Returns `DetailedFailure` with
   * an error message and appropriate detail if the condition could not be added.
   */
  public add(decl: unknown): DetailedResult<Condition, Collections.CollectorResultDetail>;

  /**
   * Adds a {@link Conditions.Condition | Condition} to the collection, failing if a different condition with
   * the same key already exists. Note that adding condition that is already in the collection (using identity
   * comparison) again will succeed without updating the collection.
   * @param condition - The condition to add.
   * @returns Returns `DetailedSuccess` with the condition and detail `added` if it was added
   * or detail `exists` if the item was already in the map.  Returns `DetailedFailure` with
   * an error message and appropriate detail if the condition could not be added.
   */
  public add(condition: Condition): DetailedResult<Condition, Collections.CollectorResultDetail>;
  public add(
    condition: Condition | IConditionDecl
  ): DetailedResult<Condition, Collections.CollectorResultDetail> {
    if (condition instanceof Condition) {
      return super.add(condition);
    }
    return (
      validatedConditionDecl
        .convert(condition, { qualifiers: this._qualifiers, index: this.size })
        .onSuccess((c) => Condition.create(c))
        // if this is a re-add, get the existing condition
        .onSuccess((c) => succeed(this.get(c.key).orDefault(c)))
        .withDetail<Collections.CollectorResultDetail>('failure', 'success')
        .onSuccess((c) => super.add(c))
    );
  }

  /**
   * Gets an existing {@link Conditions.Condition | condition} with a key matching that of a supplied
   * {@link Conditions.IConditionDecl | condition declaration}, or creates a new condition from the
   * declaration and adds that to the collection if no matching condition already exists.
   * @param decl - The condition to get or add, supplied as an `unknown` value but expected to be a
   * well-formed {@link Conditions.IConditionDecl | IConditionDecl}.
   * @returns Returns `DetailedSuccess` with the condition stored in the collector - detail
   * `exists` indicates that an existing condition was returned and detail `added` indicates that a new condition
   * was created an added. Returns `DetailedFailure` with an error and appropriate detail
   * if the condition could not be added.
   */
  public getOrAdd(decl: unknown): DetailedResult<Condition, Collections.CollectorResultDetail>;
  /**
   * Gets an existing {@link Conditions.Condition | condition} with a key matching that of a supplied
   * condition, or adds the supplied condition to the collector if no condition with that key exists.
   * @param condition - The condition to get or add.
   * @returns Returns `DetailedSuccess` with the {@link Conditions.Condition | condition}
   * stored in the collector - detail `exists` indicates that an existing condition was returned and detail
   * `added` indicates that the condition was added. Returns `DetailedFailure` with an error
   * and appropriate detail if the condition could not be added.
   */
  public getOrAdd(condition: Condition): DetailedResult<Condition, Collections.CollectorResultDetail>;
  public getOrAdd(
    condition: Condition | IConditionDecl
  ): DetailedResult<Condition, Collections.CollectorResultDetail> {
    if (condition instanceof Condition) {
      return super.getOrAdd(condition);
    }
    return validatedConditionDecl
      .convert(condition, { qualifiers: this._qualifiers, index: this.size })
      .onSuccess((c) => Condition.create(c))
      .onSuccess((c) => succeed(this.get(c.key).orDefault(c)))
      .withDetail<Collections.CollectorResultDetail>('failure', 'success')
      .onSuccess((c) => super.getOrAdd(c));
  }
}

/**
 * Type alias for a read-only {@link Conditions.ConditionCollector | ConditionCollector}.
 * @public
 */
export type IReadOnlyConditionCollector = Collections.IReadOnlyCollector<Condition>;
