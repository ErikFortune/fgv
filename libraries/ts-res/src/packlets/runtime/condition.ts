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
import { Qualifier } from './qualifier';
import { verifySuppliedIndex } from './utils';
import { EntityArray } from '../utils';

/**
 * Parameters to {@link UnconditionalCondition.create | create} a new {@link UnconditionalCondition}.
 * @public
 */
export interface IConditionCreateParams<T extends Common.ICondition = Common.ICondition> {
  from: T;
  index?: number;
  qualifiers: EntityArray<Qualifier, Common.QualifierIndex>;
}

/**
 * Condition that either always or never matches.
 * @public
 */
export class UnconditionalCondition implements Common.IUnconditionalCondition {
  public index: Common.ConditionIndex;
  public readonly operator: Common.UnconditionalOperator;

  protected constructor(index: Common.ConditionIndex, operator: Common.UnconditionalOperator) {
    this.index = index;
    this.operator = operator;
  }

  public static create(init: IConditionCreateParams<UnconditionalCondition>): Result<UnconditionalCondition> {
    return verifySuppliedIndex(init.index, init.from.index, `${init.from.operator} condition`)
      .onSuccess((index) => Common.Validate.conditionIndex.validate(index))
      .onSuccess((index) => {
        return Common.Validate.conditionIndex
          .validate(index)
          .onSuccess((index) => captureResult(() => new UnconditionalCondition(index, init.from.operator)));
      });
  }
}

/**
 * Condition that matches based on a binary comparison.
 * @public
 */
export class BinaryCondition implements Common.IBinaryCondition {
  public index: Common.ConditionIndex;
  public readonly priority: Common.ConditionPriority;
  public readonly operator: Common.BinaryOperator;
  public readonly value: string;
  public readonly qualifier: Qualifier;
  public get qualifierIndex(): Common.QualifierIndex {
    return this.qualifier.index;
  }

  protected constructor(
    index: Common.ConditionIndex,
    priority: Common.ConditionPriority,
    qualifier: Qualifier,
    operator: Common.BinaryOperator,
    value: string
  ) {
    this.index = index;
    this.priority = priority;
    this.qualifier = qualifier;
    this.operator = operator;
    this.value = value;
  }

  public static create(init: IConditionCreateParams<BinaryCondition>): Result<BinaryCondition> {
    return verifySuppliedIndex(init.index, init.from.index, `binary condition ${init.from.operator}`)
      .onSuccess((index) => Common.Validate.conditionIndex.validate(index))
      .onSuccess((index) => {
        return init.qualifiers
          .get(init.from.qualifierIndex, `binary condition ${init.from.operator}`)
          .onSuccess((qualifier) =>
            captureResult(
              () =>
                new BinaryCondition(index, init.from.priority, qualifier, init.from.operator, init.from.value)
            )
          );
      });
  }
}

/**
 * Represents a single condition at runtime.
 * @public
 */
export type Condition = UnconditionalCondition | BinaryCondition;

/**
 * Factory class for {@link Condition | Conditions}.
 * @public
 */
export class ConditionFactory {
  private constructor() {}

  public static create(init: IConditionCreateParams): Result<Condition> {
    if (Common.isUnconditionalCondition(init.from)) {
      return UnconditionalCondition.create(init as IConditionCreateParams<UnconditionalCondition>);
    }
    return BinaryCondition.create(init as IConditionCreateParams<BinaryCondition>);
  }
}
