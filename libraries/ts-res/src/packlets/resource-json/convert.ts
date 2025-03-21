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
import { Convert as CommonConvert } from '../common';
import { isJsonObject, Converters as JsonConverters } from '@fgv/ts-json-base';
import * as Json from './json';
import * as Normalized from './normalized';

/**
 * `Converter` for a normalized {@link ResourceJson.Json.ILooseConditionDecl | loose condition declaration}.
 * @public
 */
export const looseConditionDecl: Converter<Json.ILooseConditionDecl> =
  Converters.strictObject<Json.ILooseConditionDecl>({
    qualifierName: CommonConvert.qualifierName,
    value: Converters.string,
    operator: CommonConvert.conditionOperator.optional(),
    priority: CommonConvert.conditionPriority.optional()
  });

/**
 * `Converter` for a normalized {@link ResourceJson.Json.IChildConditionDecl | child condition declaration}.
 * @public
 */
export const childConditionDecl: Converter<Json.IChildConditionDecl> =
  Converters.strictObject<Json.IChildConditionDecl>({
    value: Converters.string,
    operator: CommonConvert.conditionOperator.optional(),
    priority: CommonConvert.conditionPriority.optional()
  });

function _isConditionSetRecord(from: unknown): from is Record<string, string | Json.IChildConditionDecl> {
  return isJsonObject(from);
}

const conditionSetDeclFromArray: Converter<Normalized.ConditionSetDecl> =
  Converters.arrayOf(looseConditionDecl);
const conditionSetDeclFromRecord: Converter<Normalized.ConditionSetDecl> = Converters.generic<
  Normalized.ConditionSetDecl,
  unknown
>(
  (
    from: unknown,
    self: Converter<Normalized.ConditionSetDecl, unknown>,
    context?: unknown
  ): Result<Normalized.ConditionSetDecl> => {
    /* c8 ignore next 3 - this is tested but coverage is confused */
    if (!_isConditionSetRecord(from)) {
      return fail('Expected an object');
    }
    return mapResults(
      Array.from(Object.entries(from)).map(([qualifierName, value]) => {
        const toConvert: Json.ILooseConditionDecl =
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
export const conditionSetDecl: Converter<Normalized.ConditionSetDecl> =
  Converters.oneOf<Normalized.ConditionSetDecl>([conditionSetDeclFromArray, conditionSetDeclFromRecord]);

/**
 * `Converter` for a normalized {@link ResourceJson.Json.ILooseResourceCandidateDecl | loose resource candidate declaration}.
 * @public
 */
export const looseResourceCandidateDecl: Converter<Normalized.ILooseResourceCandidateDecl> =
  Converters.strictObject<Normalized.ILooseResourceCandidateDecl>({
    id: CommonConvert.resourceId,
    json: JsonConverters.jsonObject,
    conditions: conditionSetDecl.optional(),
    mergeMethod: CommonConvert.resourceValueMergeMethod.optional(),
    isPartial: Converters.boolean.optional(),
    resourceTypeName: CommonConvert.resourceTypeName.optional()
  });

/**
 * `Converter` for a normalized {@link ResourceJson.Json.IChildResourceCandidateDecl | child resource candidate declaration}.
 * @public
 */
export const childResourceCandidateDecl: Converter<Normalized.IChildResourceCandidateDecl> =
  Converters.strictObject<Normalized.IChildResourceCandidateDecl>({
    json: JsonConverters.jsonObject,
    conditions: conditionSetDecl.optional(),
    isPartial: Converters.boolean.optional(),
    mergeMethod: CommonConvert.resourceValueMergeMethod.optional()
  });

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.ILooseResourceDecl | loose resource declaration}.
 * @public
 */
export const looseResourceDecl: Converter<Normalized.ILooseResourceDecl> =
  Converters.strictObject<Normalized.ILooseResourceDecl>({
    id: CommonConvert.resourceId,
    resourceTypeName: CommonConvert.resourceTypeName,
    candidates: Converters.arrayOf(childResourceCandidateDecl).optional()
  });

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.IChildResourceDecl | child resource declaration}.
 * @public
 */
export const childResourceDecl: Converter<Normalized.IChildResourceDecl> =
  Converters.strictObject<Normalized.IChildResourceDecl>({
    resourceTypeName: CommonConvert.resourceTypeName,
    candidates: Converters.arrayOf(childResourceCandidateDecl).optional()
  });

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.IResourceTreeChildNodeDecl | resource tree child node declaration}.
 * @public
 */
export const resourceTreeChildNodeDecl: Converter<Normalized.IResourceTreeChildNodeDecl> = Converters.generic<
  Normalized.IResourceTreeChildNodeDecl,
  unknown
>(
  (
    from: unknown,
    self: Converter<Normalized.IResourceTreeChildNodeDecl, unknown>,
    context?: unknown
  ): Result<Normalized.IResourceTreeChildNodeDecl> => {
    return Converters.strictObject<Normalized.IResourceTreeChildNodeDecl>({
      resources: Converters.recordOf(childResourceDecl).optional(),
      children: Converters.recordOf(self).optional()
    }).convert(from, context);
  }
);

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.IResourceTreeRootDecl | resource tree root declaration}.
 * @public
 */
export const resourceTreeRootDecl: Converter<Normalized.IResourceTreeRootDecl> =
  Converters.strictObject<Normalized.IResourceTreeRootDecl>({
    baseName: CommonConvert.resourceId.optional(),
    resources: Converters.recordOf(childResourceDecl).optional(),
    children: Converters.recordOf(resourceTreeChildNodeDecl).optional()
  });

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.IResourceCollectionDecl | resource collection declaration}.
 * @public
 */
export const resourceCollectionDecl: Converter<Normalized.IResourceCollectionDecl> = Converters.generic<
  Normalized.IResourceCollectionDecl,
  unknown
>(
  (
    from: unknown,
    self: Converter<Normalized.IResourceCollectionDecl, unknown>,
    context?: unknown
  ): Result<Normalized.IResourceCollectionDecl> => {
    return Converters.strictObject<Normalized.IResourceCollectionDecl>({
      baseName: CommonConvert.resourceId.optional(),
      baseConditions: conditionSetDecl.optional(),
      candidates: Converters.arrayOf(looseResourceCandidateDecl).optional(),
      resources: Converters.arrayOf(looseResourceDecl).optional(),
      collections: Converters.arrayOf(self).optional()
    }).convert(from, context);
  }
);
