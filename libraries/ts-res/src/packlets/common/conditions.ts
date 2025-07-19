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
 * Branded number representing a validated condition priority.
 * @public
 */
export type ConditionPriority = Brand<number, 'ConditionPriority'>;

/**
 * Minimum valid priority for a condition.
 * @public
 */
export const MinConditionPriority: ConditionPriority = 0 as ConditionPriority;

/**
 * Maximum valid priority for a condition.
 * @public
 */
export const MaxConditionPriority: ConditionPriority = 1000 as ConditionPriority;

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
 * A string representing a validated condition token.  Condition tokens are
 * typically extracted from the name of some resource (e.g. file or folder)
 * being imported.   A condition token has the form `<qualifierName>=<value>`
 * or `<value>`.
 * @public
 */
export type ConditionToken = Brand<string, 'ConditionToken'>;

/**
 * Branded number representing a validated condition set index.
 * @public
 */
export type ConditionSetIndex = Brand<number, 'ConditionSetIndex'>;

/**
 * Branded string representing a validated condition set key. A condition set key
 * is a string value which fully describes the condition set apart from index. The
 * condition set key can be used to quickly determine if two condition sets are
 * identical apart from index, or for inspection.
 * @public
 */
export type ConditionSetKey = Brand<string, 'ConditionSetKey'>;

/**
 * A string representing a validated condition set token.  Condition set tokens are
 * typically extracted from the name of some resource (e.g. file or folder) being
 * imported.  A condition set token is a comma-separated list of one or more
 * {@link ConditionToken | condition tokens}, where a condition token has either
 * the form `<qualifierName>=<value>` or `<value>`.
 * @public
 */
export type ConditionSetToken = Brand<string, 'ConditionSetToken'>;

/**
 * Branded string representing a hash value for a condition set. The hash value
 * is an 8-character string derived from the crc32 hash of the condition set key
 * and is used to quickly and compactly identify a condition set or compare for
 * equality.
 * @public
 */
export type ConditionSetHash = Brand<string, 'ConditionSetHash'>;

/**
 * Branded string representing a validated decision key. A decision key is a string
 * value which fully describes the decision apart from index. The decision key can
 * be used to quickly determine if two decisions are identical apart from index.
 * @public
 */
export type DecisionKey = Brand<string, 'DecisionKey'>;

/**
 * Branded number representing a validated decision index.
 * @public
 */
export type DecisionIndex = Brand<number, 'DecisionIndex'>;

/**
 * A string representing a validated context qualifier token. Context qualifier tokens are used
 * for filtering resources by context criteria. A context qualifier token has the form
 * `<qualifierName>=<value>` or `<value>`.
 * @public
 */
export type ContextQualifierToken = Brand<string, 'ContextQualifierToken'>;

/**
 * A string representing a validated context token. Context tokens are
 * pipe-separated lists of one or more context qualifier tokens. Uses "|" as separator
 * to avoid conflicts with comma-separated values within context values.
 * Example: "language=en-US,de-DE|territory=US|role=admin"
 * @public
 */
export type ContextToken = Brand<string, 'ContextToken'>;

/**
 * A string representing a single qualifier default value assignment.
 * Format: "qualifierName=defaultValue" or "qualifierName=" (to remove default)
 * Example: "language=en-US,en-CA" or "territory=US"
 * @public
 */
export type QualifierDefaultValueToken = Brand<string, 'QualifierDefaultValueToken'>;

/**
 * A string representing a validated qualifier default values token. Default value tokens are
 * pipe-separated lists of one or more qualifier default value tokens. Uses "|" as separator
 * to avoid conflicts with comma-separated values within default values.
 * Example: "language=en-US,en-CA|territory=US|device=desktop,tablet"
 * @public
 */
export type QualifierDefaultValuesToken = Brand<string, 'QualifierDefaultValuesToken'>;
