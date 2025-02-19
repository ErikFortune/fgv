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

import { Convert as CommonConvert } from '../common';
import { Conversion, Converter, Converters } from '@fgv/ts-utils';
import { Converters as JsonConverters } from '@fgv/ts-json-base';
import { ILooseResourceCandidateDecl, IResourceCollectionDecl } from './model';

/* eslint-disable @rushstack/typedef-var */

/**
 * `Converter` for a condition set declaration.
 * @public
 */
export const conditionSetDecl = Converters.recordOf(Converters.string, {
  keyConverter: CommonConvert.qualifierName
});

/**
 * `Converter` for a {@link ResourceJson.ILooseResourceCandidateDecl | loose resource candidate declaration}.
 * @public
 */
export const looseResourceCandidateDecl = Converters.object<ILooseResourceCandidateDecl>({
  id: CommonConvert.resourceId,
  json: JsonConverters.jsonValue,
  conditions: conditionSetDecl,
  mergeMethod: CommonConvert.resourceValueMergeMethod.optional(),
  isPartial: Converters.boolean.optional(),
  resourceTypeName: CommonConvert.resourceTypeName.optional()
});

/**
 * `Converter` for a {@link ResourceJson.IResourceCollectionDecl | resource collection declaration}.
 * @public
 */
export const resourceCollectionDecl = new Conversion.BaseConverter<IResourceCollectionDecl>(
  (from: unknown, self: Converter<IResourceCollectionDecl, unknown>, context?: unknown) => {
    return Converters.strictObject<IResourceCollectionDecl>({
      id: CommonConvert.resourceId.optional(),
      conditions: conditionSetDecl.optional(),
      resources: Converters.arrayOf(looseResourceCandidateDecl).optional(),
      collections: Converters.arrayOf(self).optional()
    }).convert(from, context);
  }
);
