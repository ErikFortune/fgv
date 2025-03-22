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

import { captureResult, Collections, Result, fail, succeed, ValidatingCollector } from '@fgv/ts-utils';
import { AbstractDecision } from './abstractDecision';
import { Convert as CommonConvert, DecisionIndex, DecisionKey, Validate } from '../common';
import { ConditionSet, ReadOnlyConditionSetCollector } from '../conditions';

/**
 * Parameters for creating a {@link Decisions.AbstractDecisionCollector | AbstractDecisionCollector}.
 * @public
 */
export interface IAbstractDecisionCollectorCreateParams {
  /**
   * {@link Conditions.ReadOnlyConditionSetCollector | ConditionSetCollector} used to create conditions
   * sets for decisions in this collector.
   */
  conditionSets: ReadOnlyConditionSetCollector;
}

/**
 * A `ValidatingCollector` for {@link Decisions.AbstractDecision | AbstractDecisions}.
 * @public
 */
export class AbstractDecisionCollector extends ValidatingCollector<AbstractDecision> {
  /**
   * The {@link Conditions.ReadOnlyConditionSetCollector | ConditionSetCollector} used to create conditions
   * sets for decisions in this collector.
   */
  public readonly conditionSets: ReadOnlyConditionSetCollector;

  /**
   * The empty decision (no condition sets) for this collector.
   */
  public get emptyDecision(): AbstractDecision {
    return this.getAt(AbstractDecisionCollector.EmptyDecisionIndex).orThrow();
  }

  /**
   * The default-only decision (one condition set with no conditions) for this collector.
   */
  public get defaultOnlyDecision(): AbstractDecision {
    return this.getAt(AbstractDecisionCollector.DefaultOnlyDecisionIndex).orThrow();
  }

  /**
   * The index for the empty decision.
   */
  public static readonly EmptyDecisionIndex: DecisionIndex = Validate.toDecisionIndex(0).orThrow();

  /**
   * The index for the default-only decision.
   */
  public static readonly DefaultOnlyDecisionIndex: DecisionIndex = Validate.toDecisionIndex(1).orThrow();

  /**
   * Creates a new instance of {@link Decisions.AbstractDecisionCollector | AbstractDecisionCollector}.
   */
  protected constructor(params: IAbstractDecisionCollectorCreateParams) {
    super({
      converters: new Collections.KeyValueConverters<DecisionKey, AbstractDecision>({
        key: CommonConvert.decisionKey,
        value: (from: unknown) => this._toAbstractDecision(from)
      })
    });
    this.conditionSets = params.conditionSets;
    this.add(AbstractDecision.createAbstractDecision({ conditionSets: [] }).orThrow()).orThrow();
    const cs = this.conditionSets.validating.get('').orThrow();
    this.add(AbstractDecision.createAbstractDecision({ conditionSets: [cs] }).orThrow()).orThrow();
  }

  /**
   * Creates a new instance of {@link Decisions.AbstractDecisionCollector | AbstractDecisionCollector}.
   * @returns `Success` with the new instance, or `Failure` with an error if the instance could not be created.
   */
  public static create(params: IAbstractDecisionCollectorCreateParams): Result<AbstractDecisionCollector> {
    return captureResult(() => new AbstractDecisionCollector(params));
  }

  private _toAbstractDecision(from: unknown): Result<AbstractDecision> {
    if (from instanceof AbstractDecision) {
      return succeed(from);
    }
    if (this._isConditionSetArray(from)) {
      return AbstractDecision.createAbstractDecision({
        conditionSets: from
      });
    }
    return fail('invalid value: not an abstract decision or condition sets');
  }

  private _isConditionSetArray(from: unknown): from is ConditionSet[] {
    return Array.isArray(from) && from.every((e) => e instanceof ConditionSet);
  }
}

/**
 * A read-only {@link Decisions.AbstractDecisionCollector | AbstractDecisionCollector}.
 * @public
 */
export type ReadOnlyAbstractDecisionCollector = Collections.IReadOnlyValidatingCollector<AbstractDecision>;
