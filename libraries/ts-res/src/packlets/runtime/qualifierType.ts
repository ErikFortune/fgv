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
import * as Common from '../common';

/**
 * A type alias for a number in the range 0.0 to 1.0 that represents a match value for a qualifier.
 *  @public
 */
export type QualifierMatch = Brand<number, 'QualifierMatch'>;

/**
 * Validates a numeric value as a {@link QualifierMatch | QualifierMatch} in the range
 * 0.0 to 1.0.
 * @param value - The value to validate as a {@link QualifierMatch | QualifierMatch}
 * @returns `true` if the value is valid, `false` otherwise.
 * @public
 */
export function isValidQualifierMatch(value: number): value is QualifierMatch {
  return value >= 0.0 && value <= 1.0;
}

/**
 * Converts a supplied number to a strongly-typed {@link QualifierMatch | QualifierMatch} if
 * valid.
 * @param value - The value to convert to a {@link QualifierMatch | QualifierMatch}
 * @returns `Success` with the corresponding value if the value is valid, `Failure` otherwise.
 * @public
 */
export function toQualifierMatch(value: number): Result<QualifierMatch> {
  return isValidQualifierMatch(value) ? succeed(value) : fail(`Invalid qualifier match value ${value}`);
}

/**
 * @public
 */
export interface IQualifierType {
  name: Common.QualifierTypeName;
  index: Common.QualifierTypeIndex;
  config: Common.QualifierTypeConfig;

  compare(contextValue: string, resourceValue: string, operator: Common.BinaryOperator): number;
}
