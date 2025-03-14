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
import { ConditionSetToken, ConditionToken } from '../conditions';

/**
 * The values needed to create a {@link ConditionToken | condition token}.
 * @public
 */
export interface IConditionTokenParts {
  qualifier?: string;
  value: string;
}

/**
 * Converts a {@link Helpers.IConditionTokenParts | the parts that make up a condition token} into
 * a syntactically validated {@link ConditionToken | condition token}.
 * @param parts - the parts to convert
 * @public
 */
export function buildConditionToken({ qualifier, value }: IConditionTokenParts): Result<ConditionToken> {
  return Validate.toConditionToken(qualifier ? `${qualifier}=${value}` : value);
}

/**
 * Converts an array of {@link Helpers.IConditionTokenParts | condition token parts} into an array of
 * syntactically validated {@link ConditionToken | condition tokens}.
 * @param parts - the parts to convert
 * @public
 */
export function buildConditionSetToken(
  parts: ReadonlyArray<IConditionTokenParts>
): Result<ConditionSetToken> {
  return mapResults(parts.map(buildConditionToken)).onSuccess((tokens) =>
    Validate.toConditionSetToken(tokens.join(','))
  );
}

/**
 * Parses a condition token string into its {@link Helpers.IConditionTokenParts | parts}.
 * @param token - the token string to parse.
 * @returns `Success` with the parts if successful, `Failure` with an error message if not.
 * @public
 */
export function parseConditionTokenParts(token: string): Result<IConditionTokenParts> {
  return Validate.toConditionToken(token).onSuccess((t) => {
    const parts = t.split('=');
    if (parts.length === 1) {
      return succeed({ value: parts[0] });
    }
    return succeed({ qualifier: parts[0], value: parts[1] });
  });
}

/**
 * Parses a condition set token string into an array of {@link Helpers.IConditionTokenParts | condition token parts}.
 * @param token - the conditions set token string to parse.
 * @returns `Success` with the parts if successful, `Failure` with an error message if not.
 * @public
 */
export function parseConditionSetTokenParts(token: string): Result<IConditionTokenParts[]> {
  return mapResults(token.split(',').map(parseConditionTokenParts));
}
