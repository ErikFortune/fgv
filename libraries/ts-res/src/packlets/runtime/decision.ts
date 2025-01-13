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

import { Result, captureResult } from '@fgv/ts-utils';
import * as Common from '../common';
import { ConditionSet } from './conditionSet';
import { EntityArray } from '../utils';
import { verifySuppliedIndex } from './utils';

/**
 * Parameters for creating a {@link Decision | Decision}.
 * @public
 */
export interface IDecisionCreateParams {
  index?: number;
  from: Common.IDecision;
  conditionSets: EntityArray<ConditionSet, Common.ConditionSetIndex>;
}

/**
 * Represents a single instantiated decision at runtime.
 * @public
 */
export class Decision {
  public readonly index: Common.DecisionIndex;
  public readonly conditionSets: ReadonlyArray<ConditionSet>;

  public get numConditionSets(): number {
    return this.conditionSets.length;
  }

  protected constructor(index: Common.DecisionIndex, conditionSets: ReadonlyArray<ConditionSet>) {
    this.index = index;
    this.conditionSets = conditionSets;
  }

  public static create(init: IDecisionCreateParams): Result<Decision> {
    return verifySuppliedIndex(init.index, init.from.index, 'decision')
      .onSuccess((index) => Common.Validate.decisionIndex.validate(index))
      .onSuccess((index) => {
        return init.conditionSets
          .mapIndices(init.from.conditionSetIndices, `decision ${index}`)
          .onSuccess((conditionSets) => captureResult(() => new Decision(index, conditionSets)));
      });
  }
}
