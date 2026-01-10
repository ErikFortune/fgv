// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Converters for mold types.
 * @packageDocumentation
 */

import { Converter, Converters } from '@fgv/ts-utils';

import { Converters as CommonConverters } from '../common';
import { ICavityDimensions, IMold } from './model';
import { Mold } from './mold';

/**
 * Converter for {@link Molds.ICavityDimensions | ICavityDimensions}.
 * @public
 */
export const cavityDimensions: Converter<ICavityDimensions> = Converters.object<ICavityDimensions>({
  width: CommonConverters.millimeters,
  length: CommonConverters.millimeters,
  depth: CommonConverters.millimeters
});

/**
 * Converter for {@link Molds.IMold | IMold} data structure.
 * @public
 */
export const moldData: Converter<IMold> = Converters.object<IMold>({
  baseId: CommonConverters.baseMoldId,
  manufacturer: Converters.string,
  productNumber: Converters.string,
  description: Converters.string.optional(),
  cavityCount: Converters.number,
  cavityWeight: CommonConverters.measurement.optional(),
  cavityDimensions: cavityDimensions.optional(),
  format: CommonConverters.moldFormat,
  tags: Converters.arrayOf(Converters.string).optional(),
  notes: Converters.string.optional(),
  urls: Converters.arrayOf(CommonConverters.categorizedUrl).optional()
});

/**
 * Converter for {@link Molds.Mold | Mold} class instances.
 * @public
 */
export const mold: Converter<Mold> = Converters.generic<Mold>((from: unknown) => {
  return moldData.convert(from).onSuccess((data) => Mold.create(data));
});

/**
 * Convenience alias for the mold converter.
 * @public
 */
export const moldConverter: Converter<Mold> = mold;
