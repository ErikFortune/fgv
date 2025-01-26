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
import {
  ConditionOperator,
  Convert,
  QualifierConditionValue,
  QualifierContextValue,
  QualifierMatchScore,
  Validate
} from '../../common';
import { QualifierType } from './qualifierType';

/**
 * Interface defining the parameters that can be used to create a new
 * {@link Qualifiers.QualifierTypes.LiteralQualifierType | LiteralQualifierType}.
 * @public
 */
export interface ILiteralQualifierTypeCreateParams {
  /**
   * Optional name for the qualifier type. Defaults to 'literal'.
   */
  name?: string;

  /**
   * Optional flag indicating whether the context can be a list of values.
   * Defaults to `true`.
   */
  allowContextList?: boolean;

  /**
   * Optional flag indicating whether the match should be case-sensitive. Defaults to false.
   */
  caseSensitive?: boolean;

  /**
   * Optional array of enumerated values to further constrain the type. Defaults to no
   * constraint.
   */
  enumeratedValues?: ReadonlyArray<string>;

  /**
   * Global index for this qualifier type.
   */
  index: number;
}

/**
 * A {@link Qualifiers.QualifierTypes.QualifierType | qualifier} that matches a literal value., optionally case-sensitive
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
   * Constructs a new {@link Qualifiers.QualifierTypes.LiteralQualifierType | LiteralQualifierType}.
   * @param name - Optional name for the qualifier type. Defaults to 'literal'.
   * @param caseSensitive - Optional flag indicating whether the match should be case-sensitive. Defaults to false.
   * @param allowContextList - Optional flag indicating whether the context can be a list of values. Defaults to false.
   * @public
   */
  protected constructor({
    name,
    caseSensitive,
    allowContextList,
    enumeratedValues,
    index
  }: ILiteralQualifierTypeCreateParams) {
    super({
      name: name ?? 'literal',
      allowContextList,
      index: Convert.qualifierTypeIndex.convert(index).orThrow()
    });
    this._caseSensitive = caseSensitive === true;
    this._enumeratedValues = enumeratedValues ? Array.from(enumeratedValues) : undefined;
  }

  /**
   * Determines whether a value is a valid condition value for a literal qualifier. The
   * {@link Qualifiers.QualifierTypes.LiteralQualifierType | LiteralQualifierType} accepts
   * any identifier as a valid condition value.
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
    return Validate.RegularExpressions.identifier.test(value);
  }

  /**
   * {@inheritdoc Qualifiers.QualifierTypes.QualifierType._matchOne}
   */
  protected _matchOne(
    condition: QualifierConditionValue,
    context: QualifierContextValue,
    operator: ConditionOperator
  ): QualifierMatchScore {
    if (this._caseSensitive) {
      return condition === (context as string) ? Validate.PerfectMatch : Validate.NoMatch;
    } else {
      return condition.toLowerCase() === context.toLowerCase() ? Validate.PerfectMatch : Validate.NoMatch;
    }
  }

  /**
   * Creates a new {@link Qualifiers.QualifierTypes.LiteralQualifierType | LiteralQualifierType}.
   * @param params - Optional {@link Qualifiers.QualifierTypes.ILiteralQualifierTypeCreateParams | parameters}
   * to use when creating the new instance.
   * @returns `Success` with the new {@link Qualifiers.QualifierTypes.LiteralQualifierType | LiteralQualifierType}
   * if successful, `Failure` with an error message otherwise.
   * @public
   */
  public static create(params: ILiteralQualifierTypeCreateParams): Result<LiteralQualifierType> {
    return captureResult(() => new LiteralQualifierType(params));
  }
}
