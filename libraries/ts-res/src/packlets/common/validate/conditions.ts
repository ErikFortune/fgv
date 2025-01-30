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

import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  ConditionPriority,
  QualifierName,
  QualifierTypeName,
  QualifierIndex,
  QualifierTypeIndex,
  ConditionIndex,
  ConditionSetIndex,
  QualifierMatchScore,
  ConditionKey,
  ConditionSetKey
} from '../conditions';
import { conditionKey, identifier } from './regularExpressions';

/**
 * Minimum valid priority for a condition.
 * @public
 */
export const minPriority: ConditionPriority = 0 as ConditionPriority;

/**
 * Maximum valid priority for a condition.
 * @public
 */
export const maxPriority: ConditionPriority = 1000 as ConditionPriority;

/**
 * Determines whether a string is a valid qualifier name.
 * @param name - the string to validate
 * @returns true if the string is a valid qualifier name, false otherwise.
 * @public
 */
export function isValidQualifierName(name: string): name is QualifierName {
  return identifier.test(name);
}

/***
 * Determines whether a string is a valid qualifier type name.
 * @param name - the string to validate
 * @returns true if the string is a valid qualifier type name, false otherwise.
 * @public
 */
export function isValidQualifierTypeName(name: string): name is QualifierTypeName {
  return identifier.test(name);
}

/**
 * Determines whether a number is a valid priority.
 * @param priority - the number to validate
 * @returns true if the number is a valid priority, false otherwise.
 * @public
 */
export function isValidPriority(priority: number): priority is ConditionPriority {
  return priority >= minPriority && priority <= maxPriority;
}

/**
 * Determines whether a number is a valid qualifier index.
 * @param index - the number to validate
 * @returns true if the number is a valid qualifier index, false otherwise.
 * @public
 */
export function isValidQualifierIndex(index: number): index is QualifierIndex {
  return index >= 0;
}

/**
 * Determines whether a number is a valid qualifier type index.
 * @param index - the number to validate
 * @returns true if the number is a valid qualifier type index, false otherwise.
 * @public
 */
export function isValidQualifierTypeIndex(index: number): index is QualifierTypeIndex {
  return index >= 0;
}

/**
 * {@link QualifierMatchScore | Match score} indicating no match.
 * @public
 */
export const NoMatch: QualifierMatchScore = 0.0 as QualifierMatchScore;

/**
 * {@link QualifierMatchScore | Match score} indicating a perfect match.
 * @public
 */
export const PerfectMatch: QualifierMatchScore = 1.0 as QualifierMatchScore;

/**
 * Determines whether a supplied value is a valid {@link QualifierMatchScore | match score}.
 * @param value - The value to validate.
 * @returns - `true` if the value is a valid match score, `false` otherwise.
 * @public
 */
export function isValidMatchScore(value: number): value is QualifierMatchScore {
  return value >= NoMatch && value <= PerfectMatch;
}

/**
 * Converts a number to a {@link QualifierMatchScore | match score} if it is a valid score.
 * @param value - The number to convert.
 * @returns `Success` with the converted score if successful, or `Failure` with an error message
 * if not.
 * @public
 */
export function validateMatchScore(value: number): Result<QualifierMatchScore> {
  if (!isValidMatchScore(value)) {
    return fail(`${value}: not a valid match score`);
  }
  return succeed(value as QualifierMatchScore);
}

/**
 * Determines whether a number is a valid condition index.
 * @param index - the number to validate
 * @returns true if the number is a valid condition index, false otherwise.
 * @public
 */
export function isValidConditionIndex(index: number): index is ConditionIndex {
  return index >= 0;
}

/**
 * Determines whether a string is a valid condition key.  A condition key has
 * the format:
 * `<qualifierName>(-<operator>)?-[<value>]@<priority>`
 * where operator is omitted for the default 'matches' operator.
 * @param key - the string to validate
 * @returns `true` if the string is a valid condition key, `false` otherwise.
 * @public
 */
export function isValidConditionKey(key: string): key is ConditionKey {
  return conditionKey.test(key);
}

/**
 * Determines whether a number is a valid condition set index.
 * @param index - the number to validate
 * @returns true if the number is a valid condition set index, false otherwise.
 * @public
 */
export function isValidConditionSetIndex(index: number): index is ConditionSetIndex {
  return index >= 0;
}

/**
 * Determines whether a string is a valid condition set key.
 * @param key - the string to validate.
 * @returns `true` if the string is a valid condition set key, `false` otherwise.
 */
export function isValidConditionSetKey(key: string): key is ConditionSetKey {
  // a condition set key is a `+` separated list of condition keys
  return key.split('+').every(isValidConditionKey);
}

/**
 * Converts a string to a {@link QualifierName} if it is a valid qualifier name.
 * @param name - the string to convert
 * @returns `Success` with the converted {@link QualifierName} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toQualifierName(name: string): Result<QualifierName> {
  if (!isValidQualifierName(name)) {
    return fail(`${name}: not a valid qualifier name`);
  }
  return succeed(name);
}

/**
 * Converts a number to a {@link QualifierIndex} if it is a valid qualifier index.
 * @param index - the number to convert
 * @returns `Success` with the converted {@link QualifierIndex} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toQualifierIndex(index: number): Result<QualifierIndex> {
  if (!isValidQualifierIndex(index)) {
    return fail(`${index}: not a valid qualifier index`);
  }
  return succeed(index as QualifierIndex);
}

/**
 * Converts a string to a {@link QualifierTypeName} if it is a valid qualifier type name.
 * @param name - the string to convert
 * @returns `Success` with the converted {@link QualifierTypeName} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toQualifierTypeName(name: string): Result<QualifierTypeName> {
  if (!isValidQualifierTypeName(name)) {
    return fail(`${name}: not a valid qualifier type name`);
  }
  return succeed(name);
}

/**
 * Converts a number to a {@link QualifierTypeIndex} if it is a valid qualifier type index.
 * @param index - the number to convert
 * @returns `Success` with the converted {@link QualifierTypeIndex} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toQualifierTypeIndex(index: number): Result<QualifierTypeIndex> {
  if (!isValidQualifierTypeIndex(index)) {
    return fail(`${index}: not a valid qualifier type index`);
  }
  return succeed(index);
}

/**
 * Converts a number to a {@link ConditionPriority} if it is a valid priority.
 * @param priority - the number to convert
 * @returns `Success` with the converted {@link ConditionPriority} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toPriority(priority: number): Result<ConditionPriority> {
  if (!isValidPriority(priority)) {
    return fail(`${priority}: not a valid priority`);
  }
  return succeed(priority);
}

/**
 * Converts a number to a {@link ConditionIndex} if it is a valid condition index.
 * @param index - the number to convert
 * @returns `Success` with the converted {@link ConditionIndex} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toConditionIndex(index: number): Result<ConditionIndex> {
  if (!isValidConditionIndex(index)) {
    return fail(`${index}: not a valid condition index`);
  }
  return succeed(index);
}

/**
 * Converts a string to a {@link ConditionKey} if it is a valid condition key.
 * @param key - the string to convert
 * @returns `Success` with the converted {@link ConditionKey} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toConditionKey(key: string): Result<ConditionKey> {
  if (!isValidConditionKey(key)) {
    return fail(`${key}: not a valid condition key`);
  }
  return succeed(key);
}

/**
 * Converts a number to a {@link ConditionSetIndex} if it is a valid condition set index.
 * @param index - the number to convert
 * @returns `Success` with the converted {@link ConditionSetIndex} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toConditionSetIndex(index: number): Result<ConditionSetIndex> {
  if (!isValidConditionSetIndex(index)) {
    return fail(`${index}: not a valid condition set index`);
  }
  return succeed(index);
}

/**
 * Converts a string to a {@link ConditionSetKey} if it is a valid condition set key.
 * @param key - the string to convert
 * @returns `Success` with the converted {@link ConditionSetKey} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toConditionSetKey(key: string): Result<ConditionSetKey> {
  if (!isValidConditionSetKey(key)) {
    return fail(`${key}: not a valid condition set key`);
  }
  return succeed(key);
}
