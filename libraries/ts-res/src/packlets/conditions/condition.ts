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
import { ConditionOperator, ConditionPriority, Validate } from '../common';
import { Qualifier, QualifierMap, QualifierTypes } from '../qualifiers';

/**
 * Parameters used to create a {@link Condition| Condition} object
 * when the instantiated {@link Qualifier | qualifier} is available.
 * @public
 */
export interface IConditionCreateWithQualifierParams {
  qualifier: Qualifier;
  value: string;
  operator?: ConditionOperator;
  priority?: number;
}

/**
 * Parameters used to create a {@link Condition| Condition} object
 * when given a string name for the {@link Qualifier | qualifier}
 * and a {@link QualifierMap | QualifierMap}.
 * @public
 */

export interface IConditionCreateWithNameParams {
  qualifierName: string;
  value: string;
  operator?: ConditionOperator;
  priority?: number;
  qualifierMap: QualifierMap;
}

/**
 * Parameters used to create a {@link Condition| Condition} object.
 * @public
 */
export type IConditionCreateParams = IConditionCreateWithQualifierParams | IConditionCreateWithNameParams;

/**
 * Represents a single condition applied to some resource instance.
 * @public
 */
export class Condition {
  /**
   * The {@link Qualifier | qualifier} used in this condition.
   */
  public readonly qualifier: Qualifier;
  /**
   * The value to be matched in this condition.
   */
  public readonly value: QualifierTypes.QualifierConditionValue;
  /**
   * The {@link ConditionOperator | operator} used when matching context value to condition value.
   */
  public readonly operator: ConditionOperator;
  /**
   * The {@link ConditionPriority | relative priority} of this condition.
   */
  public readonly priority: ConditionPriority;

  /**
   * Constructs a new {@link Condition | Condition} object.
   * @param qualifier - The {@link Qualifier | qualifier} used in this condition.
   * @param value - The value to be matched in this condition.
   * @param operator - The {@link ConditionOperator | operator} used when matching context value to condition value.
   * @param priority - The {@link ConditionPriority | relative priority} of this condition.
   * @public
   */
  protected constructor({ qualifier, value, operator, priority }: IConditionCreateWithQualifierParams) {
    this.qualifier = qualifier;
    this.operator = operator ?? 'matches';
    this.value = qualifier.type.validateCondition(value, this.operator).orThrow();
    this.priority = priority ? Validate.toPriority(priority).orThrow() : qualifier.defaultPriority;
  }

  /**
   * Creates a new {@link Condition | Condition} object from the supplied
   * {@link IConditionCreateParams | parameters}.
   * @param params - The {@link IConditionCreateParams | parameters} to use when creating the new instance.
   * @returns `Success` with the new {@link Condition | Condition} if successful, `Failure` otherwise.
   * @public
   */
  public static create(params: IConditionCreateParams): Result<Condition> {
    if ('qualifier' in params) {
      return captureResult(() => new Condition(params));
    }
    const { value, operator, priority } = params;
    return Validate.toQualifierName(params.qualifierName)
      .onSuccess((name) => params.qualifierMap.get(name))
      .onSuccess((qualifier) => Condition.create({ qualifier, value, operator, priority }));
  }

  /**
   * Compares two conditions for sorting purposes.
   * @param c1 - The first {@link Condition | condition} to compare.
   * @param c2 - The second {@link Condition | condition} to compare.
   * @returns A negative number if c1 should come before c2, a positive number if c2 should come before c1,
   * or zero if they are equivalent.
   * @public
   */
  public static compare(c1: Condition, c2: Condition): number {
    let diff = c1.priority - c2.priority;
    diff = diff === 0 ? c1.qualifier.name.localeCompare(c2.qualifier.name) : diff;
    diff = diff === 0 ? c1.value.localeCompare(c2.value) : diff;
    return diff;
  }

  /**
   * Get a human-readable string representation of the condition.
   * @returns A string representation of the condition.
   * @public
   */
  public toString(): string {
    if (this.operator === 'matches') {
      return `${this.qualifier.name}-${this.value}`;
    }
    return `${this.qualifier.name}-${this.operator}-${this.value}`;
  }
}
