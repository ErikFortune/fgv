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
import { Condition } from './condition';
import { verifySuppliedIndex } from './utils';
import { EntityArray } from '../utils';

/**
 * Parameters for creating a {@link ConditionSet | ConditionSet}.
 * @public
 */
export interface IConditionSetCreateParams {
  index?: number;
  from: Common.IConditionSet;
  conditions: EntityArray<Condition, Common.ConditionIndex>;
}

/**
 * Represents a single instantiated condition set at runtime.
 * @public
 */
export class ConditionSet {
  public readonly index: Common.ConditionSetIndex;
  public readonly conditions: ReadonlyArray<Condition>;

  protected constructor(index: Common.ConditionSetIndex, conditions: ReadonlyArray<Condition>) {
    this.index = index;
    this.conditions = conditions;
  }

  public static create(init: IConditionSetCreateParams): Result<ConditionSet> {
    return verifySuppliedIndex(init.index, init.from.index, 'condition set')
      .onSuccess((index) => Common.Validate.conditionSetIndex.validate(index))
      .onSuccess((index) => {
        return init.conditions
          .mapIndices(init.from.conditionIndices, `condition set ${index}`)
          .onSuccess((conditions) => captureResult(() => new ConditionSet(index, conditions)));
      });
  }
}
