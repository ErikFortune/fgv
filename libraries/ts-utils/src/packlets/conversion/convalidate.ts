/*
 * Copyright (c) 2020 Erik Fortune
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

import { Result } from '../base';
import { Validator } from '../validation';
import { Converter } from './converter';

/**
 * Helper type to make it easy to use validators and converters interchangeably.
 * @public
 */
export type ValidatorOrConverter<T, TC = unknown> = Converter<T, TC> | Validator<T, TC>;

/**
 * Convert or validate `unknown` to `Result<T>`.
 * @param cv - Converter or Validator to be applied.
 * @param from - Value to be validated or converted.
 * @param context - optional context
 * @returns `Result<T>`
 * @public
 */
export function convalidate<T, TC = unknown>(
  cv: ValidatorOrConverter<T, TC>,
  from: unknown,
  context?: TC
): Result<T> {
  if ('convert' in cv) {
    return cv.convert(from, context);
  }
  return cv.validate(from, context);
}
