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

/**
 * Helper interface to make it easy to use validators and converters interchangeably.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface Convalidator<T, TC = unknown> {
  /**
   * Converts or validates from `unknown` to `<T>`.  For objects and arrays, makes no
   * guarantees wrt in-place validation or unrecognized properties.
   * @param from - The `unknown` to be converted or validated.
   * @param context - An optional conversion context of type `<TC>` to be used in
   * the operation.
   * @returns A {@link Result} with a {@link Success} and a value on success or an
   * {@link Failure} with a a message on failure.
   */
  convalidate(from: unknown, context?: TC): Result<T>;
}
