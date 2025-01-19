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
import { ConditionOperator, Utils } from '../../common';
import {
  IQualifierTypeCreateParams,
  QualifierConditionValue,
  QualifierContextValue,
  QualifierMatchScore,
  QualifierType
} from './qualifierType';

/**
 * Interface defining the parameters that can be used to create a new {@link LiteralQualifierType | LiteralQualifierType}.
 * @public
 */
export interface ILiteralQualifierTypeCreateParams extends IQualifierTypeCreateParams {
  /**
   * Optional name for the qualifier type. Defaults to 'literal'.
   */
  name?: string;

  /**
   * Optional flag indicating whether the match should be case-sensitive. Defaults to false.
   */
  caseSensitive?: boolean;

  /**
   * Optional array of enumerated values to further constrain the type. Defaults to no
   * constraint.
   */
  enumeratedValues?: ReadonlyArray<string>;
}

/**
 * A {@link QualifierType | qualifier} that matches a literal value., optionally case-sensitive
 * or matching against an ordered list of values at runtime.
 * @public
 */
export class LiteralQualifierType extends QualifierType {
  /**
   * Indicates whether the qualifier match is case-sensitive.
   */
  protected readonly _caseSensitive: boolean;

  /**
   * Optional array of enumerated values to further constrain the type.
   */
  protected readonly _enumeratedValues?: ReadonlyArray<string>;

  /**
   * Constructs a new {@link LiteralQualifierType | LiteralQualifierType}.
   * @param name - Optional name for the qualifier type. Defaults to 'literal'.
   * @param caseSensitive - Optional flag indicating whether the match should be case-sensitive. Defaults to false.
   * @param allowContextList - Optional flag indicating whether the context can be a list of values. Defaults to false.
   * @public
   */
  protected constructor({
    name,
    caseSensitive,
    allowContextList,
    enumeratedValues
  }: ILiteralQualifierTypeCreateParams) {
    super({ name: name ?? 'literal', allowContextList });
    this._caseSensitive = caseSensitive === true;
    this._enumeratedValues = enumeratedValues ? Array.from(enumeratedValues) : undefined;
  }

  /**
   * Determines whether a value is a valid condition value for a literal qualifier. The
   * {@link LiteralQualifierType | LiteralQualifierType} accepts any identifier as a valid condition value.
   * @param value - The value to validate.
   * @returns `true` if the value is a valid condition value, `false` otherwise.
   */
  public isValidConditionValue(value: string): value is QualifierConditionValue {
    if (this._enumeratedValues) {
      if (this._caseSensitive) {
        return this._enumeratedValues.includes(value);
      }
      return this._enumeratedValues.some((v) => v.toLowerCase() === value.toLowerCase());
    }
    return Utils.identifierRegExp.test(value);
  }

  /**
   * {@inheritdoc QualifierType._matchOne}
   */
  protected _matchOne(
    condition: QualifierConditionValue,
    context: QualifierContextValue,
    operator: ConditionOperator
  ): QualifierMatchScore {
    if (this._caseSensitive) {
      return condition === (context as string) ? QualifierType.perfectMatch : QualifierType.noMatch;
    } else {
      return condition.toLowerCase() === context.toLowerCase()
        ? QualifierType.perfectMatch
        : QualifierType.noMatch;
    }
  }

  /**
   * Creates a new {@link LiteralQualifierType | LiteralQualifierType}.
   * @param params - Optional {@link ILiteralQualifierTypeCreateParams | parameters} to use when creating the new instance.
   * @returns `Success` with the new {@link LiteralQualifierType | LiteralQualifierType} if successful, `Failure` with
   * an error message otherwise.
   * @public
   */
  public static create(params: ILiteralQualifierTypeCreateParams): Result<LiteralQualifierType> {
    return captureResult(() => new LiteralQualifierType(params));
  }
}
