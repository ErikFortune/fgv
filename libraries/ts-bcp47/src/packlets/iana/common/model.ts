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

import { Brand } from '@fgv/ts-utils';

/**
 * Represents an ISO 3166 Alpha-2 region code.
 * @public
 */
export type IsoAlpha2RegionCode = Brand<string, 'IsoAlpha2RegionCode'>;

/**
 * Represents an ISO 3166 Alpha-3 region code.
 * @public
 */
export type IsoAlpha3RegionCode = Brand<string, 'IsoAlpha3RegionCode'>;

/**
 * Represents a UN M.49 numeric region code.
 * @public
 */
export type UnM49RegionCode = Brand<string, 'UnM49RegionCode'>;

/**
 * Represents a date string in the format YYYY-MM-DD.
 * @public
 */
export type YearMonthDaySpec = Brand<string, 'YearMonthDaySpec'>;

/**
 * A dated collection of registry entries of a specified templated type.
 * @public
 */
export interface IDatedRegistry<T> {
  fileDate: YearMonthDaySpec;
  entries: T[];
}
