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

import { captureResult, Collections, Result } from '@fgv/ts-utils';
import { ConditionSet } from '../conditions';
import { Convert as CommonConvert, DecisionIndex, DecisionKey } from '../common';

/**
 * Parameters used to create a new {@link Decisions.Decision | Decision}.
 * @public
 */
export interface IDecisionCreateParams {
  conditionSets: ReadonlyArray<ConditionSet>;
  index?: number;
}

/**
 * Represents an abstract decision, which is comprised of one
 * {@link Conditions.ConditionSet  | ConditionSet} for each possible outcome.
 * @public
 */
export class Decision {
  /**
   * The sorted {@link Conditions.ConditionSet  | ConditionSets} that make up this decision.
   * @public
   */
  public readonly conditionSets: ReadonlyArray<ConditionSet>;

  /**
   * Unique global key for this decision, derived from the contents
   * of the decision.
   */
  public get key(): DecisionKey {
    return this._collectible.key;
  }

  /**
   * Unique global index for this decision.
   */
  public get index(): DecisionIndex | undefined {
    return this._collectible.index;
  }

  private _collectible: Collections.Collectible<DecisionKey, DecisionIndex>;

  /**
   * Constructor for a {@link Decisions.Decision | Decision} object.
   * @param params - {@link Decisions.IDecisionCreateParams | Parameters} used to create the decision.
   * @public
   */
  protected constructor(params: IDecisionCreateParams) {
    this.conditionSets = Array.from(params.conditionSets).sort();
    this._collectible = new Collections.Collectible<DecisionKey, DecisionIndex>({
      key: Decision.getKey(this.conditionSets),
      index: params.index,
      indexConverter: CommonConvert.decisionIndex
    });
  }

  /**
   * Creates a new {@link Decisions.Decision | Decision} object.
   * @param params - {@link Decisions.IDecisionCreateParams | Parameters} used to create the decision.
   * @returns `Success` with the new decision if successful, or `Failure` with an error message if not.
   * @public
   */
  public static create(params: IDecisionCreateParams): Result<Decision> {
    return captureResult(() => new Decision(params));
  }

  /**
   * Sets the index for this decision.  Once set, index is immutable.
   * @param index - The index to set.
   * @returns `Success` with the new index if successful, or `Failure` with an error message if not.
   * @public
   */
  public setIndex(index: number): Result<DecisionIndex> {
    return this._collectible.setIndex(index);
  }

  /**
   * Helper function to return a stable key for a set of condition sets.
   * @param conditionSets - The condition sets to use to create the key.
   * @returns A key derived from the condition set hashes.
   * @public
   */
  public static getKey(conditionSets: ReadonlyArray<ConditionSet>): DecisionKey {
    return CommonConvert.decisionKey
      .convert(
        Array.from(conditionSets)
          .sort()
          .map((c) => c.toHash())
          .join('+')
      )
      .orThrow();
  }
}
