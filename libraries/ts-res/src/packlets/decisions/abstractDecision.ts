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

import { captureResult, Result } from '@fgv/ts-utils';
import { ConditionSet } from '../conditions';
import { Candidate } from './candidate';
import { Decision } from './decision';

/**
 * Parameters to create an {@link Decisions.AbstractDecision | AbstractDecision}.
 * @public
 */
export interface IAbstractDecisionCreateParams {
  conditionSets: ConditionSet[];
  index?: number;
}

/**
 * An abstract decision represents a class of decisions with candidates
 * that differ only in value.  It is a {@link Decisions.Decision | IDecision<number>}
 * in which the `number` values are sequentially assigned indexes.
 * This allows us to represent each related {@link Decisions.IDecision | decision} as an
 * {@link Decisions.AbstractDecision | abstract decision} and a matching array containing
 * the corresponding value for each candidate.  This representation is highly cacheable.
 * @public
 */
export class AbstractDecision extends Decision<number> {
  /**
   * Constructor for an {@link Decisions.AbstractDecision | AbstractDecision} object.
   * @param params - {@link Decisions.IAbstractDecisionCreateParams | Parameters}
   * used to create the decision.
   * @public
   */
  protected constructor(params: IAbstractDecisionCreateParams) {
    const candidates = Array.from(params.conditionSets)
      .map((conditionSet, value) => Candidate.createCandidate({ conditionSet, value }).orThrow())
      .sort(Candidate.compare);
    super({ candidates, index: params.index, isAbstract: true });
  }

  /**
   * Creates a new {@link Decisions.AbstractDecision | AbstractDecision} object.
   * @param params - {@link Decisions.IAbstractDecisionCreateParams | Parameters}
   * used to create the decision.
   * @returns `Success` with the new decision if successful, or `Failure` with an
   * error message if not.
   * @public
   */
  public static createAbstractDecision(params: IAbstractDecisionCreateParams): Result<AbstractDecision> {
    return captureResult(() => new AbstractDecision(params));
  }
}
