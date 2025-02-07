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

import { JsonValue } from '@fgv/ts-json-base';
import { Candidate, ICandidate } from './candidate';
import { IDecision } from './common';
import { AbstractDecisionCollector } from './abstractDecisionCollector';
import { AbstractDecision } from './abstractDecision';
import { captureResult, mapResults, Result, succeed } from '@fgv/ts-utils';
import { ConditionSet } from '../conditions';
import { Convert as CommonConvert, DecisionIndex, DecisionKey } from '../common';
import { Decision } from './decision';

/**
 * Parameters used to create a new {@link Decisions.ConcreteDecision | ConcreteDecision},
 * given an {@link Decisions.AbstractDecisionCollector | AbstractDecisionCollector} and a
 * list of {@link Decisions.ICandidate | candidates}.
 * @public
 */
export interface IConcreteDecisionCreateParams<TVALUE extends JsonValue = JsonValue> {
  decisions: AbstractDecisionCollector;
  candidates: ReadonlyArray<ICandidate<TVALUE>>;
  index?: number;
}

/**
 * Protected constructor parameters for {@link Decisions.ConcreteDecision | ConcreteDecision},
 * used to create a new concrete decision from an existing {@link Decisions.AbstractDecision | AbstractDecision}
 * and a list of values.
 * @public
 */
export interface IConcreteDecisionConstructorParams<TVALUE extends JsonValue = JsonValue> {
  baseDecision: AbstractDecision;
  values: TVALUE[];
  index?: DecisionIndex;
}

/**
 * A {@link Decisions.ConcreteDecision | concrete decision} is a {@link Decisions.IDecision | decision}
 * implemented as a reference to a common {@link Decisions.AbstractDecision | abstract decision} and a list of
 * values that correspond to the candidates in the abstract decision.  This allows us to represent a large
 * number of related decisions with a single abstract decision and a list of values.
 * @public
 */
export class ConcreteDecision<TVALUE extends JsonValue = JsonValue> implements IDecision<TVALUE> {
  public readonly baseDecision: AbstractDecision;
  public readonly values: TVALUE[];
  public readonly candidates: ReadonlyArray<ICandidate<TVALUE>>;
  public readonly key: DecisionKey;
  public readonly index?: DecisionIndex;

  /**
   * Constructor for a {@link Decisions.ConcreteDecision | ConcreteDecision} object.
   * @param params - {@link Decisions.IConcreteDecisionConstructorParams | Parameters}
   * used to create the decision.
   * @public
   */
  protected constructor(params: IConcreteDecisionConstructorParams<TVALUE>) {
    this.baseDecision = params.baseDecision;
    this.values = params.values;
    this.candidates = this.baseDecision.candidates.map((candidate) => {
      const value = this.values[candidate.value];
      return new Candidate({ conditionSet: candidate.conditionSet, value });
    });
    this.key = Decision.getKey(this.candidates);
    this.index = params.index;
  }

  /**
   * Creates a new {@link Decisions.ConcreteDecision | ConcreteDecision} object.
   * @param params - {@link Decisions.IConcreteDecisionCreateParams | Parameters}
   * used to create the decision.
   * @returns `Success` with the new decision if successful, or `Failure` with an
   * error message if not.
   * @public
   */
  public static create<TVALUE extends JsonValue = JsonValue>(
    params: IConcreteDecisionCreateParams<TVALUE>
  ): Result<ConcreteDecision<TVALUE>> {
    const conditionSets = params.candidates
      .map((candidate) => candidate.conditionSet)
      .sort(ConditionSet.compare);

    const getBase = params.decisions.validating.getOrAdd(conditionSets);
    if (getBase.isFailure()) {
      return fail(getBase.message);
    }
    const baseDecision = getBase.value;
    return mapResults(
      params.candidates.map((candidate, index) => {
        if (candidate.conditionSet.key !== baseDecision.candidates[index].conditionSet.key) {
          return fail(
            `${candidate.conditionSet.key}: Candidate does not match base decision ${candidate.conditionSet.key}`
          );
        }
        return succeed(candidate.value);
      })
    ).onSuccess((values) => {
      if (params.index) {
        return CommonConvert.decisionIndex.convert(params.index).onSuccess((index) => {
          return captureResult(() => new ConcreteDecision({ baseDecision, values, index }));
        });
      }
      return captureResult(() => new ConcreteDecision({ baseDecision, values }));
    });
  }
}
