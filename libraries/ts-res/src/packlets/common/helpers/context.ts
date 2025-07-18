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
import { ContextToken, ContextQualifierToken } from '../conditions';

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
