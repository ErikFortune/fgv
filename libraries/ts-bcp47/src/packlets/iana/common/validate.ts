/*
 * Copyright (c) 2021 Erik Fortune
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

import { succeed } from '@fgv/ts-utils';
import { RegExpValidationHelpers } from '../../utils';
import * as Model from './model';

/**
 * @public
 */
export const yearMonthDateSpec = new RegExpValidationHelpers<Model.YearMonthDaySpec>({
  description: 'Year-Month-Date value',
  wellFormed: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  canonical: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/
});

/**
 * @public
 */
export const isoAlpha2RegionCode = new RegExpValidationHelpers<Model.IsoAlpha2RegionCode>({
  description: 'ISO 3166-2 Alpha-2 region code',
  wellFormed: /^[A-Za-z]{2}$/,
  canonical: /^[A-Z]{2}$/,
  toCanonical: (from: Model.IsoAlpha2RegionCode) => succeed(from.toUpperCase() as Model.IsoAlpha2RegionCode)
});

/**
 * @public
 */
export const isoAlpha3RegionCode = new RegExpValidationHelpers<Model.IsoAlpha3RegionCode>({
  description: 'ISO 3166-2 Alpha-3 region code',
  wellFormed: /^[A-Za-z]{3}$/,
  canonical: /^[A-Z]{3}$/,
  toCanonical: (from: Model.IsoAlpha3RegionCode) => succeed(from.toUpperCase() as Model.IsoAlpha3RegionCode)
});

/**
 * @public
 */
export const unM49RegionCode = new RegExpValidationHelpers<Model.UnM49RegionCode>({
  description: 'UN M.49 3-digit region code',
  wellFormed: /^[0-9]{3}$/,
  canonical: /^[0-9]{3}$/
});
