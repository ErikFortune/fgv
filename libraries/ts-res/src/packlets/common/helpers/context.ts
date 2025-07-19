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

import { mapResults, Result, succeed } from '@fgv/ts-utils';
import * as Validate from '../validate';
import {
  ContextToken,
  ContextQualifierToken,
  QualifierDefaultValueToken,
  QualifierDefaultValuesToken
} from '../conditions';

/**
 * The values needed to create a {@link ContextQualifierToken | context qualifier token}.
 * @public
 */
export interface IContextTokenParts {
  qualifier?: string;
  value: string;
}

/**
 * Converts a {@link Helpers.IContextTokenParts | the parts that make up a context qualifier token} into
 * a syntactically validated {@link ContextQualifierToken | context qualifier token}.
 * @param parts - the parts to convert
 * @public
 */
export function buildContextQualifierToken({
  qualifier,
  value
}: IContextTokenParts): Result<ContextQualifierToken> {
  return Validate.toContextQualifierToken(qualifier ? `${qualifier}=${value}` : value);
}

/**
 * Converts an array of {@link Helpers.IContextTokenParts | context qualifier token parts} into a
 * syntactically validated {@link ContextToken | context token}.
 * @param parts - the parts to convert
 * @public
 */
export function buildContextToken(parts: ReadonlyArray<IContextTokenParts>): Result<ContextToken> {
  return mapResults(parts.map(buildContextQualifierToken)).onSuccess((tokens) =>
    Validate.toContextToken(tokens.join('|'))
  );
}

/**
 * Parses a context qualifier token string into its {@link Helpers.IContextTokenParts | parts}.
 * @param token - the token string to parse.
 * @returns `Success` with the parts if successful, `Failure` with an error message if not.
 * @public
 */
export function parseContextQualifierTokenParts(token: string): Result<IContextTokenParts> {
  return Validate.toContextQualifierToken(token).onSuccess((t) => {
    const parts = t.split('=');
    if (parts.length === 1) {
      return succeed({ value: parts[0] });
    }
    return succeed({ qualifier: parts[0], value: parts[1] });
  });
}

/**
 * Parses a context token string into an array of {@link Helpers.IContextTokenParts | context qualifier token parts}.
 * @param token - the context token string to parse.
 * @returns `Success` with the parts if successful, `Failure` with an error message if not.
 * @public
 */
export function parseContextTokenParts(token: string): Result<IContextTokenParts[]> {
  if (token === '') {
    return succeed([]);
  }
  return mapResults(token.split('|').map((part) => parseContextQualifierTokenParts(part.trim())));
}

/**
 * The values needed to create a {@link QualifierDefaultValueToken | qualifier default value token}.
 * @public
 */
export interface IQualifierDefaultValueTokenParts {
  qualifier: string;
  value: string;
}

/**
 * Converts a {@link Helpers.IQualifierDefaultValueTokenParts | the parts that make up a qualifier default value token} into
 * a syntactically validated {@link QualifierDefaultValueToken | qualifier default value token}.
 * @param parts - the parts to convert
 * @public
 */
export function buildQualifierDefaultValueToken({
  qualifier,
  value
}: IQualifierDefaultValueTokenParts): Result<QualifierDefaultValueToken> {
  return Validate.toQualifierDefaultValueToken(`${qualifier}=${value}`);
}

/**
 * Converts an array of {@link Helpers.IQualifierDefaultValueTokenParts | qualifier default value token parts} into a
 * syntactically validated {@link QualifierDefaultValuesToken | qualifier default values token}.
 * @param parts - the parts to convert
 * @public
 */
export function buildQualifierDefaultValuesToken(
  parts: ReadonlyArray<IQualifierDefaultValueTokenParts>
): Result<QualifierDefaultValuesToken> {
  return mapResults(parts.map(buildQualifierDefaultValueToken)).onSuccess((tokens) =>
    Validate.toQualifierDefaultValuesToken(tokens.join('|'))
  );
}

/**
 * Parses a qualifier default value token string into its {@link Helpers.IQualifierDefaultValueTokenParts | parts}.
 * @param token - the token string to parse.
 * @returns `Success` with the parts if successful, `Failure` with an error message if not.
 * @public
 */
export function parseQualifierDefaultValueTokenParts(
  token: string
): Result<IQualifierDefaultValueTokenParts> {
  return Validate.toQualifierDefaultValueToken(token).onSuccess((t) => {
    const parts = t.split('=');
    if (parts.length !== 2) {
      return succeed({ qualifier: parts[0], value: '' });
    }
    return succeed({ qualifier: parts[0], value: parts[1] });
  });
}

/**
 * Parses a qualifier default values token string into an array of {@link Helpers.IQualifierDefaultValueTokenParts | qualifier default value token parts}.
 * @param token - the qualifier default values token string to parse.
 * @returns `Success` with the parts if successful, `Failure` with an error message if not.
 * @public
 */
export function parseQualifierDefaultValuesTokenParts(
  token: string
): Result<IQualifierDefaultValueTokenParts[]> {
  if (token === '') {
    return succeed([]);
  }
  return mapResults(token.split('|').map((part) => parseQualifierDefaultValueTokenParts(part.trim())));
}
