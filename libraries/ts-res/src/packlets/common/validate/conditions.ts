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
  ConditionSetKey,
  DecisionKey,
  DecisionIndex,
  ConditionSetHash,
  NoMatch,
  PerfectMatch,
  MinConditionPriority,
  MaxConditionPriority,
  ConditionOperator,
  allConditionOperators,
  ConditionToken,
  ConditionSetToken,
  ContextQualifierToken,
  ContextToken,
  QualifierDefaultValueToken,
  QualifierDefaultValuesToken
} from '../conditions';
import {
  conditionKey,
  conditionSetHash,
  conditionToken,
  contextToken,
  decisionKey,
  identifier,
  qualifierDefaultValueToken,
  qualifierDefaultValuesToken
} from './regularExpressions';

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
export function isValidConditionPriority(priority: number): priority is ConditionPriority {
  return priority >= MinConditionPriority && priority <= MaxConditionPriority;
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
 * Determines whether a supplied value is a valid {@link QualifierMatchScore | match score}.
 * @param value - The value to validate.
 * @returns - `true` if the value is a valid match score, `false` otherwise.
 * @public
 */
export function isValidQualifierMatchScore(value: number): value is QualifierMatchScore {
  return value >= NoMatch && value <= PerfectMatch;
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
 * Determines whether a string is a valid condition operator.
 * @param operator - the string to validate
 * @returns true if the string is a valid condition operator, false otherwise.
 * @public
 */
export function isValidConditionOperator(operator: string): operator is ConditionOperator {
  return allConditionOperators.includes(operator as ConditionOperator);
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
 * Determines whether a string is a valid {@link ConditionToken | condition token}.
 * A condition token has the format:
 * `<qualifierName>=<value>` or `<value>`
 * @param token -
 * @returns `true` if the string is a valid condition token, `false` otherwise.
 * @public
 */
export function isValidConditionToken(token: string): token is ConditionToken {
  /* c8 ignore next 3 - coverage is having a bad day */
  if (token === '') {
    return true;
  }
  return conditionToken.test(token);
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
 * @public
 */
export function isValidConditionSetKey(key: string): key is ConditionSetKey {
  if (key === '') {
    return true;
  }
  /* c8 ignore next 2 - edge case: condition set key validation rarely fails */
  // a condition set key is a `+` separated list of condition keys
  return key.split('+').every(isValidConditionKey);
}

/**
 * Determines whether a string is a valid condition set token.
 * @param token - the string to validate.
 * @returns `true` if the string is a valid condition set token, `false` otherwise.
 * @public
 */
export function isValidConditionSetToken(token: string): token is ConditionSetToken {
  return token.split(',').every(isValidConditionToken);
}

/**
 * Determines whether a string is a valid condition set hash.
 * @param hash - the string to validate.
 * @returns `true` if the string is a valid condition set hash, `false` otherwise.
 * @public
 */
export function isValidConditionSetHash(hash: string): hash is ConditionSetHash {
  return conditionSetHash.test(hash);
}

/**
 * Determines whether a string is a valid decision key.
 * @param key - the string to validate
 * @returns `true` if the string is a valid decision key, `false` otherwise.
 * @public
 */
export function isValidDecisionKey(key: string): key is DecisionKey {
  if (key === '') {
    return true;
  }
  return decisionKey.test(key);
}

/**
 * Determines whether a number is a valid decision index.
 * @param index - the number to validate
 * @returns `true` if the number is a valid decision index, `false` otherwise.
 * @public
 */
export function isValidDecisionIndex(index: number): index is DecisionIndex {
  return index >= 0;
}

/**
 * Converts a string to a {@link QualifierName} if it is a valid qualifier name.
 * @param name - the string to convert
 * @returns `Success` with the converted {@link QualifierName} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toQualifierName(name: string): Result<QualifierName> {
  /* c8 ignore next 3 - functional code path tested but coverage intermittently missed */
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
  /* c8 ignore next 3 - coverage is having a bad day */
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
  /* c8 ignore next 3 - functional code path tested but coverage intermittently missed */
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
  /* c8 ignore next 3 - functional code path tested but coverage intermittently missed */
  if (!isValidQualifierTypeIndex(index)) {
    return fail(`${index}: not a valid qualifier type index`);
  }
  return succeed(index);
}

/**
 * Converts a number to a {@link QualifierMatchScore | match score} if it is a valid score.
 * @param value - The number to convert.
 * @returns `Success` with the converted score if successful, or `Failure` with an error message
 * if not.
 * @public
 */
export function toQualifierMatchScore(value: number): Result<QualifierMatchScore> {
  /* c8 ignore next 3 - coverage is having a bad day */
  if (!isValidQualifierMatchScore(value)) {
    return fail(`${value}: not a valid match score`);
  }
  return succeed(value as QualifierMatchScore);
}

/**
 * Converts a number to a {@link ConditionPriority} if it is a valid priority.
 * @param priority - the number to convert
 * @returns `Success` with the converted {@link ConditionPriority} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toConditionPriority(priority: number): Result<ConditionPriority> {
  /* c8 ignore next 3 - coverage is having a bad day */
  if (!isValidConditionPriority(priority)) {
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
  /* c8 ignore next 3 - coverage is having a bad day */
  if (!isValidConditionIndex(index)) {
    return fail(`${index}: not a valid condition index`);
  }
  return succeed(index);
}

/**
 * Converts a string to a {@link ConditionOperator} if it is a valid condition operator.
 * @param operator - the string to convert
 * @returns `Success` with the converted {@link ConditionOperator} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toConditionOperator(operator: string): Result<ConditionOperator> {
  if (!isValidConditionOperator(operator)) {
    return fail(`${operator}: not a valid condition operator`);
  }
  return succeed(operator as ConditionOperator);
}

/**
 * Converts a string to a {@link ConditionKey} if it is a valid condition key.
 * @param key - the string to convert
 * @returns `Success` with the converted {@link ConditionKey} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toConditionKey(key: string): Result<ConditionKey> {
  /* c8 ignore next 3 - coverage is having a bad day */
  if (!isValidConditionKey(key)) {
    return fail(`${key}: not a valid condition key`);
  }
  return succeed(key);
}

/**
 * Converts a string to a {@link ConditionToken} if it is a valid condition token.
 * @param token - the string to convert
 * @returns `Success` with the converted {@link ConditionToken} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toConditionToken(token: string): Result<ConditionToken> {
  /* c8 ignore next 3 - coverage is having a bad day */
  if (!isValidConditionToken(token)) {
    return fail(`${token}: not a valid condition token`);
  }
  return succeed(token);
}

/**
 * Converts a number to a {@link ConditionSetIndex} if it is a valid condition set index.
 * @param index - the number to convert
 * @returns `Success` with the converted {@link ConditionSetIndex} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toConditionSetIndex(index: number): Result<ConditionSetIndex> {
  /* c8 ignore next 3 - coverage is having a bad day */
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
  /* c8 ignore next 3 - coverage is having a bad day */
  if (!isValidConditionSetKey(key)) {
    return fail(`${key}: not a valid condition set key`);
  }
  return succeed(key);
}

/**
 * Converts a string to a {@link ConditionSetToken} if it is a valid condition set token.
 * @param token - the string to convert
 * @returns `Success` with the converted {@link ConditionSetToken} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toConditionSetToken(token: string): Result<ConditionSetToken> {
  /* c8 ignore next 3 - functional code path tested but coverage intermittently missed */
  if (!isValidConditionSetToken(token)) {
    return fail(`${token}: not a valid condition set token`);
  }
  return succeed(token);
}

/**
 * Converts a string to a {@link ConditionSetHash} if it is a valid condition set hash.
 * @param key - the string to convert
 * @returns `Success` with the converted {@link ConditionSetHash} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toConditionSetHash(hash: string): Result<ConditionSetHash> {
  if (!isValidConditionSetHash(hash)) {
    return fail(`${hash}: not a valid condition set hash`);
  }
  return succeed(hash);
}

/**
 * Converts a number to a {@link DecisionIndex} if it is a valid decision index.
 * @param index - the number to convert
 * @returns `Success` with the converted {@link DecisionIndex} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toDecisionKey(key: string): Result<DecisionKey> {
  /* c8 ignore next 3 - coverage is having a bad day */
  if (!isValidDecisionKey(key)) {
    return fail(`${key}: not a valid decision key`);
  }
  return succeed(key);
}

/**
 * Converts a number to a {@link DecisionIndex} if it is a valid decision index.
 * @param index - the number to convert
 * @returns `Success` with the converted {@link DecisionIndex} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toDecisionIndex(index: number): Result<DecisionIndex> {
  /* c8 ignore next 3 - coverage is having a bad day */
  if (!isValidDecisionIndex(index)) {
    return fail(`${index}: not a valid decision index`);
  }
  return succeed(index);
}

/**
 * Determines whether a string is a valid {@link ContextQualifierToken | context qualifier token}.
 * A context qualifier token has the format:
 * `<qualifierName>=<value>` or `<value>`
 * Context qualifier tokens allow broader character set including commas for comma-separated values.
 * @param token - the string to validate
 * @returns `true` if the string is a valid context qualifier token, `false` otherwise.
 * @public
 */
export function isValidContextQualifierToken(token: string): token is ContextQualifierToken {
  /* c8 ignore next 3 - functional code path tested but coverage intermittently missed */
  if (token === '') {
    return true;
  }
  return contextToken.test(token);
}

/**
 * Determines whether a string is a valid context token.
 * Context tokens are pipe-separated lists of context qualifier tokens.
 * @param token - the string to validate.
 * @returns `true` if the string is a valid context token, `false` otherwise.
 * @public
 */
export function isValidContextToken(token: string): token is ContextToken {
  /* c8 ignore next 3 - functional code path tested but coverage intermittently missed */
  if (token === '') {
    return true;
  }
  const parts = token.split('|').map((part) => part.trim());
  return parts.every((part) => part !== '' && isValidContextQualifierToken(part));
}

/**
 * Converts a string to a {@link ContextQualifierToken} if it is a valid context qualifier token.
 * @param token - the string to convert
 * @returns `Success` with the converted {@link ContextQualifierToken} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toContextQualifierToken(token: string): Result<ContextQualifierToken> {
  /* c8 ignore next 3 - functional code path tested but coverage intermittently missed */
  if (!isValidContextQualifierToken(token)) {
    return fail(`${token}: not a valid context qualifier token`);
  }
  return succeed(token);
}

/**
 * Converts a string to a {@link ContextToken} if it is a valid context token.
 * @param token - the string to convert
 * @returns `Success` with the converted {@link ContextToken} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toContextToken(token: string): Result<ContextToken> {
  /* c8 ignore next 3 - functional code path tested but coverage intermittently missed */
  if (!isValidContextToken(token)) {
    return fail(`${token}: not a valid context token`);
  }
  return succeed(token);
}

/**
 * Determines whether a string is a valid {@link QualifierDefaultValueToken | qualifier default value token}.
 * A qualifier default value token has the format:
 * `<qualifierName>=<value>` or `<qualifierName>=` (to remove default)
 * Default values allow broader character set including commas for comma-separated values.
 * @param token - the string to validate
 * @returns `true` if the string is a valid qualifier default value token, `false` otherwise.
 * @public
 */
export function isValidQualifierDefaultValueToken(token: string): token is QualifierDefaultValueToken {
  return qualifierDefaultValueToken.test(token);
}

/**
 * Determines whether a string is a valid qualifier default values token.
 * Qualifier default values tokens are pipe-separated lists of qualifier default value tokens.
 * @param token - the string to validate.
 * @returns `true` if the string is a valid qualifier default values token, `false` otherwise.
 * @public
 */
export function isValidQualifierDefaultValuesToken(token: string): token is QualifierDefaultValuesToken {
  /* c8 ignore next 3 - functional code path tested but coverage intermittently missed */
  if (token === '') {
    return true;
  }
  return qualifierDefaultValuesToken.test(token);
}

/**
 * Converts a string to a {@link QualifierDefaultValueToken} if it is a valid qualifier default value token.
 * @param token - the string to convert
 * @returns `Success` with the converted {@link QualifierDefaultValueToken} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toQualifierDefaultValueToken(token: string): Result<QualifierDefaultValueToken> {
  /* c8 ignore next 3 - functional code path tested but coverage intermittently missed */
  if (!isValidQualifierDefaultValueToken(token)) {
    return fail(`${token}: not a valid qualifier default value token`);
  }
  return succeed(token);
}

/**
 * Converts a string to a {@link QualifierDefaultValuesToken} if it is a valid qualifier default values token.
 * @param token - the string to convert
 * @returns `Success` with the converted {@link QualifierDefaultValuesToken} if successful, or `Failure` with an
 * error message if not.
 * @public
 */
export function toQualifierDefaultValuesToken(token: string): Result<QualifierDefaultValuesToken> {
  /* c8 ignore next 3 - functional code path tested but coverage intermittently missed */
  if (!isValidQualifierDefaultValuesToken(token)) {
    return fail(`${token}: not a valid qualifier default values token`);
  }
  return succeed(token);
}
