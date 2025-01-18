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
import { identifierRegExp } from './utils';

/**
 * Branded string representing a validated qualifier name.
 * @public
 */
export type QualifierName = Brand<string, 'QualifierName'>;

/**
 * Branded number representing a validated qualifier index.
 * @public
 */
export type QualifierIndex = Brand<number, 'QualifierIndex'>;

/**
 * Branded string representing a validated qualifier type name.
 * @public
 */
export type QualifierTypeName = Brand<string, 'QualifierTypeName'>;

/**
 * Branded number representing a validated qualifier type index.
 * @public
 */
export type QualifierTypeIndex = Brand<number, 'QualifierTypeIndex'>;

/**
 * Branded number representing a validated condition priority.
 * @public
 */
export type ConditionPriority = Brand<number, 'ConditionPriority'>;

/**
 * Condition operators for use in conditions.
 * @public
 */
export type ConditionOperator = 'always' | 'never' | 'matches';

/**
 * Array of all valid condition operators.
 * @public
 */
export const allConditionOperators: ConditionOperator[] = ['always', 'never', 'matches'];

/**
 * Branded number representing a validated condition index.
 * @public
 */
export type ConditionIndex = Brand<number, 'ConditionIndex'>;

/**
 * Branded number representing a validated condition set index.
 * @public
 */
export type ConditionSetIndex = Brand<number, 'ConditionSetIndex'>;

/**
 * The `Conditions` class provides utility methods for validating and converting
 * condition-related values such as qualifier names, qualifier type names, and priorities.
 *
 * @public
 */
export class Conditions {
  /**
   * Minimum valid priority for a condition.
   * @public
   */
  public static readonly minPriority: ConditionPriority = 0 as ConditionPriority;

  /**
   * Maximum valid priority for a condition.
   * @public
   */
  public static readonly maxPriority: ConditionPriority = 1000 as ConditionPriority;

  private constructor() {}

  /**
   * Determines whether a string is a valid qualifier name.
   * @param name - the string to validate
   * @returns true if the string is a valid qualifier name, false otherwise.
   * @public
   */
  public static isValidQualifierName(name: string): name is QualifierName {
    return identifierRegExp.test(name);
  }

  /***
   * Determines whether a string is a valid qualifier type name.
   * @param name - the string to validate
   * @returns true if the string is a valid qualifier type name, false otherwise.
   * @public
   */
  public static isValidQualifierTypeName(name: string): name is QualifierTypeName {
    return identifierRegExp.test(name);
  }

  /**
   * Determines whether a number is a valid priority.
   * @param priority - the number to validate
   * @returns true if the number is a valid priority, false otherwise.
   * @public
   */
  public static isValidPriority(priority: number): priority is ConditionPriority {
    return priority >= Conditions.minPriority && priority <= Conditions.maxPriority;
  }

  /**
   * Determines whether a number is a valid qualifier index.
   * @param index - the number to validate
   * @returns true if the number is a valid qualifier index, false otherwise.
   * @public
   */
  public static isValidQualifierIndex(index: number): index is QualifierIndex {
    return index >= 0;
  }

  /**
   * Determines whether a number is a valid qualifier type index.
   * @param index - the number to validate
   * @returns true if the number is a valid qualifier type index, false otherwise.
   * @public
   */
  public static isValidQualifierTypeIndex(index: number): index is QualifierTypeIndex {
    return index >= 0;
  }

  /**
   * Determines whether a number is a valid condition index.
   * @param index - the number to validate
   * @returns true if the number is a valid condition index, false otherwise.
   * @public
   */
  public static isValidConditionIndex(index: number): index is ConditionIndex {
    return index >= 0;
  }

  /**
   * Determines whether a number is a valid condition set index.
   * @param index - the number to validate
   * @returns true if the number is a valid condition set index, false otherwise.
   * @public
   */
  public static isValidConditionSetIndex(index: number): index is ConditionSetIndex {
    return index >= 0;
  }

  /**
   * Converts a string to a {@link QualifierName} if it is a valid qualifier name.
   * @param name - the string to convert
   * @returns `Success` with the converted {@link QualifierName} if successful, or `Failure` with an
   * error message if not.
   * @public
   */
  public static toQualifierName(name: string): Result<QualifierName> {
    if (!this.isValidQualifierName(name)) {
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
  public static toQualifierIndex(index: number): Result<QualifierIndex> {
    if (!this.isValidQualifierIndex(index)) {
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
  public static toQualifierTypeName(name: string): Result<QualifierTypeName> {
    if (!this.isValidQualifierTypeName(name)) {
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
  public static toQualifierTypeIndex(index: number): Result<QualifierTypeIndex> {
    if (!this.isValidQualifierTypeIndex(index)) {
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
  public static toPriority(priority: number): Result<ConditionPriority> {
    if (!this.isValidPriority(priority)) {
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
  public static toConditionIndex(index: number): Result<ConditionIndex> {
    if (!this.isValidConditionIndex(index)) {
      return fail(`${index}: not a valid condition index`);
    }
    return succeed(index);
  }

  /**
   * Converts a number to a {@link ConditionSetIndex} if it is a valid condition set index.
   * @param index - the number to convert
   * @returns `Success` with the converted {@link ConditionSetIndex} if successful, or `Failure` with an
   * error message if not.
   * @public
   */
  public static toConditionSetIndex(index: number): Result<ConditionSetIndex> {
    if (!this.isValidConditionSetIndex(index)) {
      return fail(`${index}: not a valid condition set index`);
    }
    return succeed(index);
  }
}
