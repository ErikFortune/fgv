/*
 * Copyright (c) 2026 Erik Fortune
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

import { Result, Success } from '../base';
import { Converter, Converters } from '../conversion';
import { KeyValueEntry } from './common';

/**
 * Initialization parameters for the {@link Collections.Converters.keyValueEntry | keyValueEntry} converter.
 * @public
 */
export interface IKeyValueEntryConverterParams<TK extends string, TV> {
  key: Converter<TK, unknown>;
  value: Converter<TV, unknown>;
}

/**
 * A {@link Converter | Converter} for {@link Collections.KeyValueEntry | KeyValueEntry} instances.
 * @param params - Conversion parameters.
 * @returns A converter for which validates key value entries using the supplied validators.
 * @public
 */
export function keyValueEntry<TK extends string, TV>(
  params: IKeyValueEntryConverterParams<TK, TV>
): Converter<KeyValueEntry<TK, TV>, unknown> {
  return Converters.generic((from: unknown): Result<KeyValueEntry<TK, TV>> => {
    return params.key.convert(from).onSuccess((key: TK) => {
      return params.value.convert(from).onSuccess((value: TV) => {
        return Success.with([key, value]);
      });
    });
  });
}
