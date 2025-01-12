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

import { JsonValue } from '@fgv/ts-json-base';
import { Brand, Result, succeed } from '@fgv/ts-utils';

/**
 * String name for a qualifier. Must be unique in any resource collection.
 * @public
 */
export type QualifierName = Brand<string, 'QualifierName'>;

/**
 * Sequential numeric identifier for a qualifier in a compiled resource collection.
 * @public
 */
export type QualifierIndex = Brand<number, 'QualifierIndex'>;

/**
 * @public
 */
export type QualifierTypeName = Brand<string, 'QualifierTypeName'>;

/**
 * @public
 */
export type QualifierTypeIndex = Brand<number, 'QualifierTypeIndex'>;

/**
 * @public
 */
export type QualifierTypeConfig = Brand<JsonValue, 'QualifierTypeConfig'>;

/**
 * A type alias for a number in the range 0.0 to 1.0 that represents a match value for a qualifier.
 *  @public
 */
export type QualifierMatchScore = Brand<number, 'QualifierMatchScore'>;

/**
 * Validates a numeric value as a {@link QualifierMatchScore | QualifierMatch} in the range
 * 0.0 to 1.0.
 * @param value - The value to validate as a {@link QualifierMatchScore | QualifierMatch}
 * @returns `true` if the value is valid, `false` otherwise.
 * @public
 */
export function isValidQualifierMatchScore(value: number): value is QualifierMatchScore {
  return value >= 0.0 && value <= 1.0;
}

/**
 * Converts a supplied number to a strongly-typed {@link QualifierMatchScore | QualifierMatch} if
 * valid.
 * @param value - The value to convert to a {@link QualifierMatchScore | QualifierMatch}
 * @returns `Success` with the corresponding value if the value is valid, `Failure` otherwise.
 * @public
 */
export function toQualifierMatchScore(value: number): Result<QualifierMatchScore> {
  return isValidQualifierMatchScore(value) ? succeed(value) : fail(`Invalid qualifier match value ${value}`);
}

/**
 * @public
 */
export interface IQualifierType {
  index?: QualifierTypeIndex;
  name: QualifierTypeName;
  config?: QualifierTypeConfig;
}

/**
 * @public
 */
export interface IQualifier {
  index?: QualifierIndex;
  name: QualifierName;
  qualifierTypeIndex: QualifierTypeIndex;
}
