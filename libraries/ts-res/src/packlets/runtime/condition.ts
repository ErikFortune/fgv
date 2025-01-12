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
export interface IUnconditionalConditionCreateParams {
  from: Common.IUnconditionalCondition;
  index?: Common.ConditionIndex;
  qualifiers?: ReadonlyArray<Qualifier>;
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

  public static create(init: IUnconditionalConditionCreateParams): Result<UnconditionalCondition> {
    return verifySuppliedIndex(init.index, init.from.index, `${init.from.operator} condition`).onSuccess(
      (index) =>
        captureResult(() => {
          return new UnconditionalCondition(index, init.from.operator);
        })
    );
  }
}

/**
 * Parameters to {@link BinaryCondition.create | create} a new {@link BinaryCondition}.
 * @public
 */
export interface IBinaryConditionCreateParams {
  from: Common.IBinaryCondition;
  index?: Common.ConditionIndex;
  qualifiers: EntityArray<Qualifier, Common.QualifierIndex>;
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

  public static create(init: IBinaryConditionCreateParams): Result<BinaryCondition> {
    return verifySuppliedIndex(
      init.index,
      init.from.index,
      `binary condition ${init.from.operator}`
    ).onSuccess((index) => {
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
 * Builder class for {@link Condition | Conditions}.
 * @public
 */
export class ConditionBuilder {
  private constructor() {}

  public static build(
    init: IUnconditionalConditionCreateParams | IBinaryConditionCreateParams
  ): Result<Condition> {
    if (ConditionBuilder.isUnconditionalInitializer(init)) {
      return UnconditionalCondition.create(init);
    }
    return BinaryCondition.create(init);
  }

  public static isUnconditionalInitializer(
    init: IUnconditionalConditionCreateParams | IBinaryConditionCreateParams
  ): init is IUnconditionalConditionCreateParams {
    return Common.isUnconditionalCondition(init.from);
  }
}
