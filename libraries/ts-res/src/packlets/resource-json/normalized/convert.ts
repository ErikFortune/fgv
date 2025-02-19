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

import { Converter, Converters, mapResults, Result, fail } from '@fgv/ts-utils';
import { Convert as CommonConvert } from '../../common';
import { isJsonObject, Converters as JsonConverters } from '@fgv/ts-json-base';
import * as Model from './model';

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.ILooseConditionDecl | loose condition declaration}.
 * @public
 */
export const looseConditionDecl: Converter<Model.ILooseConditionDecl> =
  Converters.strictObject<Model.ILooseConditionDecl>({
    qualifierName: Converters.string,
    value: Converters.string,
    operator: CommonConvert.conditionOperator.optional(),
    priority: Converters.number.optional()
  });

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.IChildConditionDecl | child condition declaration}.
 * @public
 */
export const childConditionDecl: Converter<Model.IChildConditionDecl> =
  Converters.strictObject<Model.IChildConditionDecl>({
    value: Converters.string,
    operator: CommonConvert.conditionOperator.optional(),
    priority: Converters.number.optional()
  });

function _isConditionSetRecord(from: unknown): from is Record<string, string | Model.IChildConditionDecl> {
  return isJsonObject(from);
}

const conditionSetDeclFromArray: Converter<Model.ConditionSetDecl> = Converters.arrayOf(looseConditionDecl);
const conditionSetDeclFromRecord: Converter<Model.ConditionSetDecl> = Converters.generic<
  Model.ConditionSetDecl,
  unknown
>(
  (
    from: unknown,
    self: Converter<Model.ConditionSetDecl, unknown>,
    context?: unknown
  ): Result<Model.ConditionSetDecl> => {
    if (!_isConditionSetRecord(from)) {
      return fail('Expected an object');
    }
    return mapResults(
      Array.from(Object.entries(from)).map(([qualifierName, value]) => {
        const toConvert: Model.ILooseConditionDecl =
          typeof value === 'string' ? { qualifierName, value } : { qualifierName, ...value };
        return looseConditionDecl.convert(toConvert, context);
      })
    );
  }
);

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.ConditionSetDecl | condition set declaration}.
 * @public
 */
export const conditionSetDecl: Converter<Model.ConditionSetDecl> = Converters.oneOf<Model.ConditionSetDecl>([
  conditionSetDeclFromArray,
  conditionSetDeclFromRecord
]);

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.ILooseResourceCandidateDecl | loose resource candidate declaration}.
 * @public
 */
export const looseResourceCandidateDecl: Converter<Model.ILooseResourceCandidateDecl> =
  Converters.strictObject<Model.ILooseResourceCandidateDecl>({
    id: CommonConvert.resourceId,
    json: JsonConverters.jsonObject,
    conditions: conditionSetDecl.optional(),
    mergeMethod: CommonConvert.resourceValueMergeMethod.optional(),
    isPartial: Converters.boolean.optional(),
    resourceTypeName: CommonConvert.resourceTypeName.optional()
  });

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.IChildResourceCandidateDecl | child resource candidate declaration}.
 * @public
 */
export const childResourceCandidateDecl: Converter<Model.IChildResourceCandidateDecl> =
  Converters.strictObject<Model.IChildResourceCandidateDecl>({
    json: JsonConverters.jsonObject,
    conditions: conditionSetDecl.optional(),
    isPartial: Converters.boolean.optional(),
    mergeMethod: CommonConvert.resourceValueMergeMethod.optional()
  });

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.ILooseResourceDecl | loose resource declaration}.
 * @public
 */
export const looseResourceDecl: Converter<Model.ILooseResourceDecl> =
  Converters.strictObject<Model.ILooseResourceDecl>({
    id: Converters.string,
    resourceTypeName: CommonConvert.resourceTypeName,
    candidates: Converters.arrayOf(looseResourceCandidateDecl).optional()
  });

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.IChildResourceDecl | child resource declaration}.
 * @public
 */
export const childResourceDecl: Converter<Model.IChildResourceDecl> =
  Converters.strictObject<Model.IChildResourceDecl>({
    name: Converters.string,
    resourceTypeName: Converters.string,
    candidates: Converters.arrayOf(childResourceCandidateDecl).optional()
  });

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.IResourceTreeNodeDecl | resource tree node declaration}.
 * @public
 */
export const resourceTreeNodeDecl: Converter<Model.IResourceTreeNodeDecl> = Converters.generic<
  Model.IResourceTreeNodeDecl,
  unknown
>(
  (
    from: unknown,
    self: Converter<Model.IResourceTreeNodeDecl, unknown>,
    context?: unknown
  ): Result<Model.IResourceTreeNodeDecl> => {
    return Converters.strictObject<Model.IResourceTreeNodeDecl>({
      name: Converters.string,
      children: Converters.recordOf(
        Converters.oneOf<Model.IChildResourceDecl | Model.IResourceTreeNodeDecl>([childResourceDecl, self])
      )
    }).convert(from, context);
  }
);

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.IResourceTreeRootDecl | resource tree root declaration}.
 * @public
 */
export const resourceTreeRootDecl: Converter<Model.IResourceTreeRootDecl> =
  Converters.strictObject<Model.IResourceTreeRootDecl>({
    baseName: Converters.string.optional(),
    children: Converters.recordOf(
      Converters.oneOf<Model.IChildResourceDecl | Model.IResourceTreeNodeDecl>([
        childResourceDecl,
        resourceTreeNodeDecl
      ])
    )
  });

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.IResourceCollectionDecl | resource collection declaration}.
 * @public
 */
export const resourceCollectionDecl: Converter<Model.IResourceCollectionDecl> = Converters.generic<
  Model.IResourceCollectionDecl,
  unknown
>(
  (
    from: unknown,
    self: Converter<Model.IResourceCollectionDecl, unknown>,
    context?: unknown
  ): Result<Model.IResourceCollectionDecl> => {
    return Converters.strictObject<Model.IResourceCollectionDecl>({
      baseName: Converters.string.optional(),
      baseConditions: conditionSetDecl.optional(),
      candidates: Converters.arrayOf(looseResourceCandidateDecl).optional(),
      resources: Converters.arrayOf(looseResourceDecl).optional(),
      collections: Converters.arrayOf(self).optional()
    }).convert(from, context);
  }
);
