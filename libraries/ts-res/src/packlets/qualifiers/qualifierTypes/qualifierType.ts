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

import { Brand, Result, fail, succeed } from '@fgv/ts-utils';
import { ConditionOperator, Convert, QualifierTypeName } from '../../common';

/**
 * Branded type for a validated qualifier condition value - i.e. a value
 * that has been determined to be valid for use in a condition attached
 * to some resource.
 *
 * @example
 * For a language qualifier type, it is likely that a single language
 * tag can be used for either a condition or a context value. However,
 * a list of languages would likely only be valid as a context value.
 * @public
 */
export type QualifierConditionValue = Brand<string, 'QualifierConditionValue'>;

/**
 * Branded type for a validated qualifier context value - i.e. a value
 * that has been determined to be valid for use in some runtime context.
 * @example
 * For a language qualifier type, it is likely that a single language
 * tag can be used for either a condition or a context value. However,
 * a list of languages would likely only be valid as a context value.
 * @public
 */
export type QualifierContextValue = Brand<string, 'QualifierContextValue'>;

/**
 * Branded number representing a score in the range 0.0 (no match) .. 1.0 (perfect match)
 * which results from evaluating some condition.
 * @public
 */
export type QualifierMatchScore = Brand<number, 'QualifierMatchScore'>;

/**
 * Interface for a qualifier type. A qualifier type implements the build and
 * runtime semantics for some class of related qualifiers (e.g. language,
 * territories, etc).
 * @public
 */
export interface IQualifierType {
  /**
   * The name of the qualifier type.
   */
  readonly name: QualifierTypeName;

  /**
   * Validates a condition value for this qualifier type.
   * @param value - The string value to validate.
   * @returns `Success` with the {@link QualifierConditionValue | validated value} if the value
   * is valid for use in a condition, `Failure` with error details otherwise.
   */
  isValidConditionValue(value: string): value is QualifierConditionValue;

  /**
   * Validates a context value for this qualifier type.
   * @param value - The string value to validate.
   * @returns `Success` with the {@link QualifierContextValue | validated value} if the value
   * is valid for use in a runtime context, `Failure` with error details otherwise.
   */
  isValidContextValue(value: string): value is QualifierContextValue;

  /**
   * Validates that a value and optional operator are valid for use in a condition
   * for qualifiers of this type.
   * @param value - The string value to validate.
   * @param operator - An optional operator to validate. Defaults to 'matches'.
   */
  validateCondition(value: string, operator?: ConditionOperator): Result<QualifierConditionValue>;

  /**
   * Validates that a value is valid for use in a runtime context for qualifiers of this type.
   * @param value - The string value to validate.
   * @returns `Success` with the {@link QualifierContextValue | validated value} if the value
   * is valid for use in a runtime context, `Failure` with error details otherwise.
   */
  validateContextValue(value: string): Result<QualifierContextValue>;

  /**
   * Determines the extent to which a condition matches a context value for this qualifier type.
   * @param condition - The condition value to evaluate.
   * @param context - The context value to evaluate.
   * @param operator - The operator to use in evaluating the match.
   * @returns a {@link QualifierMatchScore | score} indicating the extent to which the condition
   * matches the context value.
   */
  matches(
    condition: QualifierConditionValue,
    context: QualifierContextValue,
    operator: ConditionOperator
  ): QualifierMatchScore;
}

/**
 * Parameters used to create a base {@link QualifierType | qualifier type}.
 * @public
 */
export interface IQualifierTypeCreateParams {
  /**
   * The name of the qualifier type. No default value.
   */
  name?: string;
  /**
   * Flag indicating whether this qualifier type allows a list of values in a context.
   * Defaults to `false`.
   */
  allowContextList?: boolean;
}

/**
 * Abstract base class for qualifier types. Provides default implementations for
 * the {@link IQualifierType | IQualifierType} interface.
 * @public
 */
export abstract class QualifierType implements IQualifierType {
  /**
   * {@inheritdoc IQualifierType.name}
   */
  public readonly name: QualifierTypeName;

  /**
   * Flag indicating whether this qualifier type allows a list of values in a context.
   * @public
   */
  protected readonly _allowContextList: boolean;

  /**
   * {@inheritdoc IQualifierType.isValidConditionValue}
   */
  public static readonly noMatch: QualifierMatchScore = 0.0 as QualifierMatchScore;

  /**
   * {@inheritdoc IQualifierType.isValidConditionValue}
   */
  public static readonly perfectMatch: QualifierMatchScore = 1.0 as QualifierMatchScore;

  /**
   * Constructor for use by derived classes.
   * @param name - The name of the qualifier type.
   * @param allowContextList - Flag indicating whether this qualifier type allows a
   * comma-separated list of runtime values in the context. Defaults to `false`.
   */
  protected constructor({ name, allowContextList }: IQualifierTypeCreateParams) {
    this.name = Convert.qualifierTypeName.convert(name).orThrow();
    this._allowContextList = allowContextList === true;
  }

  /**
   * {@inheritdoc IQualifierType.isValidConditionValue}
   */
  public isValidConditionValue(value: string): value is QualifierConditionValue {
    return true;
  }

  /**
   * {@inheritdoc IQualifierType.isValidContextValue}
   */
  public isValidContextValue(value: string): value is QualifierContextValue {
    if (!this.isValidConditionValue(value) && this._allowContextList) {
      return value.split(',').every((v) => this.isValidConditionValue(v));
    }
    return true;
  }

  /**
   * {@inheritdoc IQualifierType.validateCondition}
   */
  public validateCondition(value: string, operator?: ConditionOperator): Result<QualifierConditionValue> {
    if (operator !== 'matches') {
      return fail(`${operator}: unsupported condition operator`);
    } else if (!this.isValidConditionValue(value)) {
      return fail(`${value}: invalid condition value for qualifierType ${this.name}`);
    }
    return succeed(value);
  }

  /**
   * {@inheritdoc IQualifierType.validateContextValue}
   */
  public validateContextValue(value: string): Result<QualifierContextValue> {
    if (!this.isValidContextValue(value)) {
      return fail(`${value}: invalid context value for qualifierType ${this.name}`);
    }
    return succeed(value);
  }

  /**
   * {@inheritdoc IQualifierType.matches}
   */
  public matches(
    condition: QualifierConditionValue,
    context: QualifierContextValue,
    operator: ConditionOperator
  ): QualifierMatchScore {
    if (this._allowContextList) {
      return this._matchList(condition, QualifierType._splitContext(context), operator);
    }
    return this._matchOne(condition, context, operator);
  }

  /**
   * Matches a single condition value against a single context value.
   * @param condition - The {@link QualifierConditionValue | condition value} to match.
   * @param context - The {@link QualifierContextValue | context value} to match.
   * @param operator - The {@link ConditionOperator | operator} to use in the match.
   * @returns a {@link QualifierMatchScore | score} indicating the extent to which the condition
   * matches the context value.
   * @public
   */
  protected abstract _matchOne(
    condition: QualifierConditionValue,
    context: QualifierContextValue,
    operator: ConditionOperator
  ): QualifierMatchScore;

  /**
   * Matches a single condition value against a list of context values.
   * @param condition - The {@link QualifierConditionValue | condition value} to match.
   * @param context - The comma-separated list of {@link QualifierContextValue | context values} to match.
   * @param operator - The {@link ConditionOperator | operator} to use in the match.
   * @returns a {@link QualifierMatchScore | score} indicating the extent to which the condition
   * matches the context value.
   * @public
   */
  protected _matchList(
    condition: QualifierConditionValue,
    context: QualifierContextValue[],
    operator: ConditionOperator
  ): QualifierMatchScore {
    for (let i = 0; i < context.length; i++) {
      const score = this._matchOne(condition, context[i], operator);
      if (score > QualifierType.noMatch) {
        if (i === 0) {
          return score;
        }
        const scorePerPosition = 1 / context.length;
        const adjusted = 1.0 - scorePerPosition * i + score;
        if (QualifierType.isValidMatchScore(adjusted)) {
          return adjusted;
        }
      }
    }
    return QualifierType.noMatch;
  }

  /**
   * Splits a comma-separated {@link QualifierContextValue | context value} into an array of
   * individual values.
   * @param value - The value to split.
   * @returns an array of individual context values.
   * @public
   */
  protected static _splitContext(value: QualifierContextValue): QualifierContextValue[] {
    return value.split(',').map((s) => s.trim() as QualifierContextValue);
  }

  /**
   * Determines whether a supplied value is a valid {@link QualifierMatchScore | match score}.
   * @param value - The value to validate.
   * @returns - `true` if the value is a valid match score, `false` otherwise.
   */
  public static isValidMatchScore(value: number): value is QualifierMatchScore {
    return value >= this.noMatch && value <= this.perfectMatch;
  }

  /**
   * Converts a number to a {@link QualifierMatchScore | match score} if it is a valid score.
   * @param value - The number to convert.
   * @returns `Success` with the converted score if successful, or `Failure` with an error message
   * if not.
   */
  public static validateMatchScore(value: number): Result<QualifierMatchScore> {
    if (!this.isValidMatchScore(value)) {
      return fail(`${value}: not a valid match score`);
    }
    return succeed(value as QualifierMatchScore);
  }
}
