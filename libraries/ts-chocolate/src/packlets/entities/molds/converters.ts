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

import { Converters as CommonConverters } from '../../common';
import { ICavities, ICavityDimensions, ICavityInfo, IMoldEntity } from './model';

/**
 * Converter for {@link Entities.Molds.ICavityDimensions | ICavityDimensions}.
 * @public
 */
export const cavityDimensions: Converter<ICavityDimensions> = Converters.object<ICavityDimensions>({
  width: CommonConverters.millimeters,
  length: CommonConverters.millimeters,
  depth: CommonConverters.millimeters
});

/**
 * Converter for {@link Entities.Molds.ICavityInfo | ICavityInfo}.
 * @public
 */
export const cavityInfo: Converter<ICavityInfo> = Converters.object<ICavityInfo>({
  weight: CommonConverters.measurement.optional(),
  dimensions: cavityDimensions.optional()
});

/**
 * Converter for {@link Entities.Molds.ICavities | ICavities} data structure.
 * @public
 */
const cavitiesGrid: Converter<Extract<ICavities, { kind: 'grid' }>> = Converters.object<
  Extract<ICavities, { kind: 'grid' }>
>({
  kind: Converters.literal('grid'),
  columns: Converters.number,
  rows: Converters.number,
  info: cavityInfo.optional()
});

/**
 * Converter for {@link Entities.Molds.ICavities | ICavities} data structure.
 * @public
 */
const cavitiesCount: Converter<Extract<ICavities, { kind: 'count' }>> = Converters.object<
  Extract<ICavities, { kind: 'count' }>
>({
  kind: Converters.literal('count'),
  count: Converters.number,
  info: cavityInfo.optional()
});

/**
 * Converter for {@link Entities.Molds.ICavities | ICavities} data structure.
 * @public
 */
export const cavities: Converter<ICavities> = Converters.oneOf<ICavities>([cavitiesGrid, cavitiesCount]);

/**
 * Converter for {@link Entities.Molds.IMoldEntity | IMoldEntity} data structure.
 * @public
 */
export const moldEntity: Converter<IMoldEntity> = Converters.object<IMoldEntity>({
  baseId: CommonConverters.baseMoldId,
  manufacturer: Converters.string,
  productNumber: Converters.string,
  description: Converters.string.optional(),
  cavities,
  format: CommonConverters.moldFormat,
  tags: Converters.arrayOf(Converters.string).optional(),
  related: Converters.arrayOf(CommonConverters.moldId).optional(),
  notes: Converters.arrayOf(CommonConverters.categorizedNote).optional(),
  urls: Converters.arrayOf(CommonConverters.categorizedUrl).optional()
});
