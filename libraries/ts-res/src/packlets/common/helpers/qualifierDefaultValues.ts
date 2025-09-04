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
import { QualifierDefaultValueToken, QualifierDefaultValuesToken } from '../conditions';

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
    const [qualifier, value] = t.split('=');
    return succeed({ qualifier, value });
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
