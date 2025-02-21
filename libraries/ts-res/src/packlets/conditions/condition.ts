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
import {
  Convert as CommonConvert,
  ConditionIndex,
  ConditionKey,
  ConditionOperator,
  ConditionPriority,
  QualifierConditionValue,
  QualifierMatchScore,
  Validate
} from '../common';
import { Qualifier } from '../qualifiers';
import { IValidatedConditionDecl } from './conditionDecls';

// eslint-disable-next-line @rushstack/typedef-var
const scoreFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 });

/**
 * Represents a single condition applied to some resource instance.
 * @public
 */
export class Condition implements IValidatedConditionDecl {
  /**
   * The {@link Qualifiers.Qualifier | qualifier} used in this condition.
   */
  public readonly qualifier: Qualifier;

  /**
   * The value to be matched in this condition.
   */
  public readonly value: QualifierConditionValue;

  /**
   * The {@link ConditionOperator | operator} used when matching context value to condition value.
   */
  public readonly operator: ConditionOperator;

  /**
   * The {@link ConditionPriority | relative priority} of this condition.
   */
  public readonly priority: ConditionPriority;

  /**
   * The {@link QualifierMatchScore | score} to be used when this condition is the default.
   */
  public readonly scoreAsDefault?: QualifierMatchScore;

  protected _collectible: Collections.Collectible<ConditionKey, ConditionIndex>;

  /**
   * Constructs a new {@link Conditions.Condition | Condition} object.
   * @param qualifier - The {@link Qualifiers.Qualifier | qualifier} used in this condition.
   * @param value - The value to be matched in this condition.
   * @param operator - The {@link ConditionOperator | operator} used when matching context value to condition value.
   * @param priority - The {@link ConditionPriority | relative priority} of this condition.
   * @public
   */
  protected constructor({
    qualifier,
    value,
    operator,
    priority,
    scoreAsDefault,
    index
  }: IValidatedConditionDecl) {
    this.qualifier = qualifier;
    this.operator = operator;
    this.value = qualifier.type.validateCondition(value, operator).orThrow();
    this.priority = priority;
    this.scoreAsDefault = scoreAsDefault;
    this._collectible = new Collections.Collectible({
      key: this.toKey(),
      index,
      indexConverter: CommonConvert.conditionIndex
    });
  }

  public get key(): ConditionKey {
    return this._collectible.key;
  }

  public get index(): ConditionIndex | undefined {
    return this._collectible.index;
  }

  public setIndex(index: ConditionIndex): Result<ConditionIndex> {
    return this._collectible.setIndex(index);
  }

  /**
   * Creates a new {@link Conditions.Condition | Condition} object from the supplied
   * {@link Conditions.IValidatedConditionDecl | validated condition declaration}.
   * @param decl - The {@link Conditions.IValidatedConditionDecl | validated condition declaration}
   * describing the condition to create.
   * @returns `Success` with the new {@link Conditions.Condition | Condition} if successful,
   * `Failure` otherwise.
   * @public
   */
  public static create(decl: IValidatedConditionDecl): Result<Condition> {
    return captureResult(() => new Condition(decl));
  }

  /**
   * Compares two conditions for sorting purposes.
   * @param c1 - The first {@link Conditions.Condition | condition} to compare.
   * @param c2 - The second {@link Conditions.Condition | condition} to compare.
   * @returns A negative number if c1 should come before c2, a positive number
   * if c2 should come before c1, or zero if they are equivalent.
   * @public
   */
  public static compare(c1: Condition, c2: Condition): number {
    let diff = c1.priority - c2.priority;
    diff = diff === 0 ? (c1.scoreAsDefault ?? 0) - (c2.scoreAsDefault ?? 0) : diff;
    diff = diff === 0 ? c1.qualifier.name.localeCompare(c2.qualifier.name) : diff;
    diff = diff === 0 ? c1.value.localeCompare(c2.value) : diff;
    return diff;
  }

  /**
   * Gets the {@link ConditionKey | key} for this condition.
   * @returns -
   */
  public toKey(): ConditionKey {
    return Condition.getKeyForDecl(this).orThrow();
  }

  /**
   * Get a human-readable string representation of the condition.
   * @returns A string representation of the condition.
   * @public
   */
  public toString(): string {
    return this.toKey();
  }

  /**
   * Gets the {@link ConditionKey | condition key} for a supplied {@link Conditions.IValidatedConditionDecl | condition declaration}.
   * @param decl - The {@link Conditions.IValidatedConditionDecl | condition declaration} for which to get the key.
   * @returns `Success` with the condition key if successful, `Failure` otherwise.
   * @public
   */
  public static getKeyForDecl(decl: IValidatedConditionDecl): Result<ConditionKey> {
    const scoreAsDefault = decl.scoreAsDefault ? `(${scoreFormatter.format(decl.scoreAsDefault)})` : '';
    const key =
      decl.operator === 'matches'
        ? `${decl.qualifier.name}-[${decl.value}]@${decl.priority}${scoreAsDefault}`
        : `${decl.qualifier.name}-${decl.operator}-[${decl.value}]@${decl.priority}${scoreAsDefault}`;
    return Validate.toConditionKey(key);
  }
}
