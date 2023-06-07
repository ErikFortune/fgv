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

import * as Validate from './validate';

import { Converter, Converters } from '@fgv/ts-utils';
import { IDatedRegistry } from './model';

/**
 * Validating converter from string {@link Iana.Model.YearMonthDaySpec}.
 * @public
 */
export const yearMonthDaySpec = Validate.yearMonthDateSpec.converter;

/**
 * Validating converter from string {@link Iana.Model.IsoAlpha2RegionCode}.
 * @public
 */
export const isoAlpha2RegionCode = Validate.isoAlpha2RegionCode.converter;

/**
 * Validating converter from string {@link Iana.Model.IsoAlpha3RegionCode}.
 * @public
 */
export const isoAlpha3RegionCode = Validate.isoAlpha3RegionCode.converter;

/**
 * Validating converter from string {@link Iana.Model.UnM49RegionCode}.
 * @public
 */
export const unM49RegionCode = Validate.unM49RegionCode.converter;

/**
 * Helper function which creates a converter that returns a validated {@Link Iana.Model.DatedRegistry | DatedRegistry}
 * containing entries of supplied template type `T`.
 * @param entryConverter - A `Converter<T>` to validate each entry
 * @returns A new validating `Converter` which yields {@Link Iana.Model.DatedRegistry | DatedRegistry<T>}
 * @public
 */
export function datedRegistry<T, TC = unknown>(
  entryConverter: Converter<T, TC>
): Converter<IDatedRegistry<T>, TC> {
  return Converters.strictObject<IDatedRegistry<T>>({
    fileDate: yearMonthDaySpec,
    entries: Converters.arrayOf(entryConverter)
  });
}
