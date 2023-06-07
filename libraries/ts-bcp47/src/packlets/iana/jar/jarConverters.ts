/*
 * Copyright (c) 2022 Erik Fortune
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
/* eslint-disable @rushstack/typedef-var */

import * as CommonConverters from '../common/converters';

import { Conversion, Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { IDatedRegistry } from '../common/model';
import { IFileDateEntry } from './jarModel';

/**
 * Converter for the file date record found at the start of a registry file.
 * @public
 */
export const fileDateEntry = Converters.strictObject<IFileDateEntry>({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'File-Date': CommonConverters.yearMonthDaySpec
});

/**
 * Helper function which creates a converter that returns a validated {@Link Iana.Model.DatedRegistry | DatedRegistry}
 * containing entries of supplied template type `T`.
 * @param entryConverter - A `Converter<T>` to validate each entry
 * @returns A new validating `Converter` which yields {@Link Iana.Model.DatedRegistry | DatedRegistry<T>}
 * @internal
 */
export function datedRegistryFromJarRecords<T, TC = unknown>(
  entryConverter: Converter<T, TC>
): Converter<IDatedRegistry<T>, TC> {
  return new Conversion.BaseConverter<IDatedRegistry<T>, TC>(
    (from: unknown, __self: Converter<IDatedRegistry<T>, TC>, __context?: TC): Result<IDatedRegistry<T>> => {
      if (typeof from === 'string' || !Array.isArray(from)) {
        return fail('JAR dated registry cannot convert non-array');
      }
      const dateEntry = fileDateEntry.convert(from[0]);
      if (dateEntry.isFailure()) {
        return fail(`Error in JAR datedRegistry date entry (${dateEntry.message})`);
      }

      const entries = Converters.arrayOf(entryConverter).convert(from.slice(1));
      if (entries.isFailure()) {
        return fail(`Error in JAR datedRegistry entries (${entries.message})`);
      }

      return succeed({
        fileDate: dateEntry.value['File-Date'],
        entries: entries.value
      });
    }
  );
}
