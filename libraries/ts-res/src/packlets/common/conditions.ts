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

import { Brand } from '@fgv/ts-utils';

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
 * A branded string representing a validated condition key.  A condition key is a
 * string value which fully describes the condition apart from index.  The condition
 * key can be used to quickly determine if two conditions are identical apart from
 * index, or for inspection.
 * @public
 */
export type ConditionKey = Brand<string, 'ConditionKey'>;

/**
 * Branded number representing a validated condition set index.
 * @public
 */
export type ConditionSetIndex = Brand<number, 'ConditionSetIndex'>;
