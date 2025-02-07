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

import { captureResult, Collections, Hash, Result } from '@fgv/ts-utils';
import { Convert as CommonConvert, DecisionIndex, DecisionKey } from '../common';
import { JsonValue } from '@fgv/ts-json-base';
import { Candidate, ICandidate } from './candidate';
import { IDecision } from './common';
import { AbstractDecision } from './abstractDecision';

/**
 * Parameters used to create a new {@link Decisions.Decision | Decision}.
 * @public
 */
export interface IDecisionCreateParams<TVALUE extends JsonValue = JsonValue> {
  candidates: ReadonlyArray<ICandidate<TVALUE>>;
  index?: number;
}

/**
 * Simple collectible implementation of {@link Decisions.IDecision | IDecision}.
 * @public
 */
export class Decision<TVALUE extends JsonValue = JsonValue> implements IDecision<TVALUE> {
  /**
   * The sorted {@link Conditions.ConditionSet  | ConditionSets} that make up this decision.
   * @public
   */
  public readonly candidates: ReadonlyArray<Candidate<TVALUE>>;

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
  protected constructor(params: IDecisionCreateParams<TVALUE>) {
    this.candidates = Array.from(params.candidates)
      .map((c) => new Candidate(c))
      .sort(Candidate.compare);

    this._collectible = new Collections.Collectible<DecisionKey, DecisionIndex>({
      key: Decision.getKey(this.candidates),
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
  public static createDecision(params: IDecisionCreateParams): Result<Decision> {
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
  public static getKey<TVALUE extends JsonValue = JsonValue>(
    candidates: ReadonlyArray<ICandidate<TVALUE>>
  ): DecisionKey {
    const abstractKey = AbstractDecision.getAbstractKey(candidates.map((c) => c.conditionSet));
    const valueKey = Hash.Crc32Normalizer.crc32Hash(candidates.map((c) => JSON.stringify(c.value)));
    return CommonConvert.decisionKey.convert(`${abstractKey}|${valueKey}`).orThrow();
  }
}
