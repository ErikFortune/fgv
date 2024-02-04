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

import { Conversion, Converter, Converters, Result, captureResult, fail } from '@fgv/ts-utils';
import { ExtendedArray, RangeOf, RangeOfProperties } from '../experimental';

/**
 * A helper function to create a `Converter` which converts `unknown` to {@link Experimental.ExtendedArray | ExtendedArray<T>}.
 * @remarks
 * If `onError` is `'failOnError'` (default), then the entire conversion fails if any element cannot
 * be converted.  If `onError` is `'ignoreErrors'`, then failing elements are silently ignored.
 * @param converter - `Converter` used to convert each item in the array
 * @param ignoreErrors - Specifies treatment of unconvertible elements
 * @beta
 */
export function extendedArrayOf<T, TC = undefined>(
  label: string,
  converter: Converter<T, TC>,
  onError: Conversion.OnError = 'failOnError'
): Converter<ExtendedArray<T>, TC> {
  return Converters.arrayOf(converter, onError).map((items: T[]) => {
    return captureResult(() => new ExtendedArray(label, ...items));
  });
}

/**
 * A helper wrapper to construct a `Converter` which converts to an arbitrary strongly-typed
 * range of some comparable type.
 * @param converter - `Converter` used to convert `min` and `max` extent of the range.
 * @param constructor - Static constructor to instantiate the object.
 * @public
 */
export function rangeTypeOf<T, RT extends RangeOf<T>, TC = unknown>(
  converter: Converter<T, TC>,
  constructor: (init: RangeOfProperties<T>) => Result<RT>
): Converter<RT, TC> {
  return new Conversion.BaseConverter((from: unknown, __self, context?: TC) => {
    const result = Converters.object(
      {
        min: converter,
        max: converter
      },
      { optionalFields: ['min', 'max'] }
    ).convert(from, context);
    if (result.isSuccess()) {
      return constructor({ min: result.value.min, max: result.value.max });
    }
    return fail(result.message);
  });
}

/**
 * A helper wrapper to construct a `Converter` which converts to {@link Experimental.RangeOf | RangeOf<T>}
 * where `<T>` is some comparable type.
 * @param converter - `Converter` used to convert `min` and `max` extent of the range.
 * @public
 */
export function rangeOf<T, TC = unknown>(converter: Converter<T, TC>): Converter<RangeOf<T>, TC> {
  return rangeTypeOf<T, RangeOf<T>, TC>(converter, RangeOf.createRange);
}
