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
import { ConditionSet } from '../conditions';
import { captureResult, Result } from '@fgv/ts-utils';
import { ResourceValueMergeMethod } from '../common';

/**
 * A {@link Decisions.ICandidate | resource candidate} represents a single
 * possible value for some resource, with the conditions under which it is valid.
 * @public
 */
export interface ICandidate<TVALUE extends JsonValue = JsonValue> {
  readonly conditionSet: ConditionSet;
  readonly value: TVALUE;
  readonly isPartial?: boolean;
  readonly mergeMethod?: ResourceValueMergeMethod;
}

/**
 * Simple implementation of {@link Decisions.ICandidate | ICandidate} with
 * helper methods for sorting and presentation.
 * @public
 */
export class Candidate<TVALUE extends JsonValue = JsonValue> implements ICandidate<TVALUE> {
  public readonly conditionSet: ConditionSet;
  public readonly value: TVALUE;
  public readonly isPartial: boolean;
  public readonly mergeMethod: ResourceValueMergeMethod;

  /**
   * Key of the condition set for this candidate.
   */
  public get key(): string {
    return this.conditionSet.key;
  }

  /**
   * Construct a new {@link Decisions.Candidate | Candidate}.
   * @param params - The {@link Decisions.ICandidate | parameters} to use to create the
   * new candidate.
   */
  protected constructor(params: ICandidate<TVALUE>) {
    this.conditionSet = params.conditionSet;
    this.value = params.value;
    this.isPartial = params.isPartial === true;
    this.mergeMethod = params.mergeMethod ?? 'augment';
  }

  /**
   * Create a new {@link Decisions.Candidate | candidate}.
   * @param params - The {@link Decisions.ICandidate | parameters} to use to create the
   * new candidate.
   * @returns `Success` with the new candidate if successful, or `Failure` if the
   * candidate could not be created.
   */
  public static createCandidate<TVALUE extends JsonValue>(
    params: ICandidate<TVALUE>
  ): Result<Candidate<TVALUE>> {
    return captureResult(() => new Candidate(params));
  }

  /**
   * Compare two {@link Decisions.ICandidate | candidates} for sorting purposes.
   * @param c1 - The first candidate to compare.
   * @param c2 - The second candidate to compare.
   * @returns A negative number if c1 should come before c2, a positive number if c1 should
   * come after c2, or zero if they are equivalent.
   */
  public static compare(c1: ICandidate, c2: ICandidate): number {
    return ConditionSet.compare(c1.conditionSet, c2.conditionSet);
  }

  /**
   * Returns a string representation of the {@link Decisions.Candidate | candidate}.
   * @returns A string representation of this candidate.
   */
  public toString(): string {
    return `${this.key}: ${JSON.stringify(this.value)}`;
  }
}
