/*
 * Copyright (c) 2025 Erik Fortune
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

import { Converter, Converters } from '@fgv/ts-utils';
import { Converters as JsonConverters } from '@fgv/ts-json-base';
import { Convert as ConfigConvert } from '../config';
import { Compiled as ResourceJsonCompiled } from '../resource-json';
import { IBundleMetadata, IBundleExportMetadata, IBundle, IBundleCreateParams } from './model';

/**
 * `Converter` for a {@link Bundle.IBundleMetadata | bundle metadata} object.
 * @public
 */
export const bundleMetadata: Converter<IBundleMetadata> = Converters.strictObject<IBundleMetadata>({
  dateBuilt: Converters.string,
  checksum: Converters.string,
  version: Converters.string.optional(),
  description: Converters.string.optional()
});

/**
 * `Converter` for {@link Bundle.IBundleExportMetadata | bundle export metadata}.
 * @public
 */
export const bundleExportMetadata: Converter<IBundleExportMetadata> =
  Converters.strictObject<IBundleExportMetadata>({
    exportedAt: Converters.string,
    exportedFrom: Converters.string,
    type: Converters.string,
    filterContext: JsonConverters.jsonObject.optional()
  });

/**
 * `Converter` for a {@link Bundle.IBundle | bundle} object.
 * @public
 */
export const bundle: Converter<IBundle> = Converters.strictObject<IBundle>({
  metadata: bundleMetadata,
  config: ConfigConvert.systemConfiguration,
  compiledCollection: ResourceJsonCompiled.Convert.compiledResourceCollection,
  exportMetadata: bundleExportMetadata.optional()
});

/**
 * `Converter` for {@link Bundle.IBundleCreateParams | bundle creation parameters}.
 * @public
 */
export const bundleCreateParams: Converter<IBundleCreateParams> =
  Converters.strictObject<IBundleCreateParams>({
    version: Converters.string.optional(),
    description: Converters.string.optional(),
    dateBuilt: Converters.string.optional()
  });

/**
 * Lightweight converter for bundle structure validation without full processing.
 * Useful for detecting bundle files without the overhead of full validation.
 * @public
 */
export const bundleStructure: Converter<{
  metadata: IBundleMetadata;
  config: unknown;
  compiledCollection: unknown;
}> = Converters.strictObject({
  metadata: bundleMetadata,
  config: JsonConverters.jsonValue,
  compiledCollection: JsonConverters.jsonValue
});
