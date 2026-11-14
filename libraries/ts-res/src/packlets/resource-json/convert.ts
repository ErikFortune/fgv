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
    priority: CommonConvert.conditionPriority.optional(),
    scoreAsDefault: Converters.number.optional()
  });

/**
 * `Converter` for a normalized {@link ResourceJson.Json.IChildConditionDecl | child condition declaration}.
 * @public
 */
export const childConditionDecl: Converter<Json.IChildConditionDecl> =
  Converters.strictObject<Json.IChildConditionDecl>({
    value: Converters.string,
    operator: CommonConvert.conditionOperator.optional(),
    priority: CommonConvert.conditionPriority.optional(),
    scoreAsDefault: Converters.number.optional()
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
    __self: Converter<Normalized.ConditionSetDecl, unknown>,
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
 * `Converter` for a normalized {@link ResourceJson.Normalized.IImporterResourceCandidateDecl | importer resource candidate declaration}.
 * @public
 */
export const importerResourceCandidateDecl: Converter<Normalized.IImporterResourceCandidateDecl> =
  Converters.strictObject<Normalized.IImporterResourceCandidateDecl>({
    id: CommonConvert.resourceId.optional(),
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
 * `Converter` for a normalized {@link ResourceJson.Normalized.IContainerContextDecl | resource context declaration}.
 * @public
 */
export const containerContextDecl: Converter<Normalized.IContainerContextDecl> =
  Converters.strictObject<Normalized.IContainerContextDecl>({
    baseId: Converters.oneOf([CommonConvert.resourceId, Converters.literal('')]).optional(),
    conditions: conditionSetDecl.optional(),
    mergeMethod: CommonConvert.resourceValueMergeMethod.optional()
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
    context: containerContextDecl.optional(),
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
      context: containerContextDecl.optional(),
      candidates: Converters.arrayOf(looseResourceCandidateDecl).optional(),
      resources: Converters.arrayOf(looseResourceDecl).optional(),
      collections: Converters.arrayOf(self).optional(),
      metadata: JsonConverters.jsonObject.optional()
    }).convert(from, context);
  }
);

/**
 * `Converter` for a normalized {@link ResourceJson.Normalized.IImporterResourceCollectionDecl | importer resource collection declaration}.
 * This allows for a mix of loose and child resource declarations.
 * @public
 */
export const importerResourceCollectionDecl: Converter<Normalized.IImporterResourceCollectionDecl> =
  Converters.generic<Normalized.IImporterResourceCollectionDecl, unknown>(
    (
      from: unknown,
      self: Converter<Normalized.IImporterResourceCollectionDecl, unknown>,
      context?: unknown
    ): Result<Normalized.IImporterResourceCollectionDecl> => {
      return Converters.strictObject<Normalized.IImporterResourceCollectionDecl>({
        context: containerContextDecl.optional(),
        candidates: Converters.arrayOf(importerResourceCandidateDecl).optional(),
        resources: Converters.arrayOf(Converters.oneOf([looseResourceDecl, childResourceDecl])).optional(),
        collections: Converters.arrayOf(self).optional(),
        metadata: JsonConverters.jsonObject.optional()
      }).convert(from, context);
    }
  );

// --- Typed sibling converters (Phase B-2) -----------------------------------
//
// Each `typed*<TQualifierNames>(qualifierNameConverter)` returns a converter
// whose result type is narrowed on `TQualifierNames`. The existing untyped
// exports above remain unchanged at the signature and behavior level; consumers
// opt in by calling a typed sibling. Internally each typed factory composes
// lower-level typed factories so a single `qualifierNameConverter` flows
// end-to-end through the converter tree.
//
// DRIFT HAZARD: each typed sibling duplicates the field list of its untyped
// twin (the duplication exists to preserve `ObjectConverter` return types on
// the defaults — see phase-b2-result.md). If a field is added, removed, or
// re-typed on an untyped converter above, the typed sibling MUST be updated
// in lockstep. The per-pair `keep in sync with X` markers below flag each
// pair at the call site.

/**
 * Returns a `Converter` for a `Json.ILooseConditionDecl<TQualifierNames>`
 * narrowed on a supplied `qualifierName` converter.
 *
 * @public
 */
// Keep in sync with `looseConditionDecl` above.
export function typedLooseConditionDecl<TQualifierNames extends string>(
  qualifierNameConverter: Converter<TQualifierNames>
): Converter<Json.ILooseConditionDecl<TQualifierNames>> {
  return Converters.strictObject<Json.ILooseConditionDecl<TQualifierNames>>({
    qualifierName: qualifierNameConverter,
    value: Converters.string,
    operator: CommonConvert.conditionOperator.optional(),
    priority: CommonConvert.conditionPriority.optional(),
    scoreAsDefault: Converters.number.optional()
  });
}

function _typedConditionSetDeclFromArray<TQualifierNames extends string>(
  innerLooseConditionDecl: Converter<Json.ILooseConditionDecl<TQualifierNames>>
): Converter<Json.ConditionSetDeclAsArray<TQualifierNames>> {
  return Converters.arrayOf(innerLooseConditionDecl);
}

function _typedConditionSetDeclFromRecord<TQualifierNames extends string>(
  innerLooseConditionDecl: Converter<Json.ILooseConditionDecl<TQualifierNames>>
): Converter<Json.ConditionSetDecl<TQualifierNames>> {
  return Converters.generic<Json.ConditionSetDecl<TQualifierNames>, unknown>(
    (
      from: unknown,
      __self: Converter<Json.ConditionSetDecl<TQualifierNames>, unknown>,
      context?: unknown
    ): Result<Json.ConditionSetDecl<TQualifierNames>> => {
      /* c8 ignore next 3 - branch covered by underlying record check */
      if (!_isConditionSetRecord(from)) {
        return fail('Expected an object');
      }
      return mapResults(
        Array.from(Object.entries(from)).map(([qualifierName, value]) => {
          const toConvert: Json.ILooseConditionDecl =
            typeof value === 'string' ? { qualifierName, value } : { qualifierName, ...value };
          return innerLooseConditionDecl.convert(toConvert, context);
        })
      );
    }
  );
}

/**
 * Returns a `Converter` for a `Json.ConditionSetDecl<TQualifierNames>`
 * (either array form or record form) narrowed on a supplied `qualifierName`
 * converter.
 *
 * @public
 */
// Keep in sync with `conditionSetDecl` (and its two private feeder converters
// `conditionSetDeclFromArray` / `conditionSetDeclFromRecord`) above.
export function typedConditionSetDecl<TQualifierNames extends string>(
  qualifierNameConverter: Converter<TQualifierNames>
): Converter<Json.ConditionSetDecl<TQualifierNames>> {
  const inner = typedLooseConditionDecl(qualifierNameConverter);
  return Converters.oneOf<Json.ConditionSetDecl<TQualifierNames>>([
    _typedConditionSetDeclFromArray(inner),
    _typedConditionSetDeclFromRecord(inner)
  ]);
}

/**
 * Returns a `Converter` for a `Json.ILooseResourceCandidateDecl<TQualifierNames>`
 * narrowed on a supplied `qualifierName` converter.
 *
 * @public
 */
// Keep in sync with `looseResourceCandidateDecl` above.
export function typedLooseResourceCandidateDecl<TQualifierNames extends string>(
  qualifierNameConverter: Converter<TQualifierNames>
): Converter<Json.ILooseResourceCandidateDecl<TQualifierNames>> {
  return Converters.strictObject<Json.ILooseResourceCandidateDecl<TQualifierNames>>({
    id: CommonConvert.resourceId,
    json: JsonConverters.jsonObject,
    conditions: typedConditionSetDecl(qualifierNameConverter).optional(),
    mergeMethod: CommonConvert.resourceValueMergeMethod.optional(),
    isPartial: Converters.boolean.optional(),
    resourceTypeName: CommonConvert.resourceTypeName.optional()
  });
}

/**
 * Returns a `Converter` for a `Json.IImporterResourceCandidateDecl<TQualifierNames>`
 * narrowed on a supplied `qualifierName` converter.
 *
 * @public
 */
// Keep in sync with `importerResourceCandidateDecl` above.
export function typedImporterResourceCandidateDecl<TQualifierNames extends string>(
  qualifierNameConverter: Converter<TQualifierNames>
): Converter<Json.IImporterResourceCandidateDecl<TQualifierNames>> {
  return Converters.strictObject<Json.IImporterResourceCandidateDecl<TQualifierNames>>({
    id: CommonConvert.resourceId.optional(),
    json: JsonConverters.jsonObject,
    conditions: typedConditionSetDecl(qualifierNameConverter).optional(),
    mergeMethod: CommonConvert.resourceValueMergeMethod.optional(),
    isPartial: Converters.boolean.optional(),
    resourceTypeName: CommonConvert.resourceTypeName.optional()
  });
}

/**
 * Returns a `Converter` for a `Json.IChildResourceCandidateDecl<TQualifierNames>`
 * narrowed on a supplied `qualifierName` converter.
 *
 * @public
 */
// Keep in sync with `childResourceCandidateDecl` above.
export function typedChildResourceCandidateDecl<TQualifierNames extends string>(
  qualifierNameConverter: Converter<TQualifierNames>
): Converter<Json.IChildResourceCandidateDecl<TQualifierNames>> {
  return Converters.strictObject<Json.IChildResourceCandidateDecl<TQualifierNames>>({
    json: JsonConverters.jsonObject,
    conditions: typedConditionSetDecl(qualifierNameConverter).optional(),
    isPartial: Converters.boolean.optional(),
    mergeMethod: CommonConvert.resourceValueMergeMethod.optional()
  });
}

/**
 * Returns a `Converter` for a `Json.ILooseResourceDecl<TQualifierNames>`
 * narrowed on a supplied `qualifierName` converter.
 *
 * @public
 */
// Keep in sync with `looseResourceDecl` above.
export function typedLooseResourceDecl<TQualifierNames extends string>(
  qualifierNameConverter: Converter<TQualifierNames>
): Converter<Json.ILooseResourceDecl<TQualifierNames>> {
  return Converters.strictObject<Json.ILooseResourceDecl<TQualifierNames>>({
    id: CommonConvert.resourceId,
    resourceTypeName: CommonConvert.resourceTypeName,
    candidates: Converters.arrayOf(typedChildResourceCandidateDecl(qualifierNameConverter)).optional()
  });
}

/**
 * Returns a `Converter` for a `Json.IChildResourceDecl<TQualifierNames>`
 * narrowed on a supplied `qualifierName` converter.
 *
 * @public
 */
// Keep in sync with `childResourceDecl` above.
export function typedChildResourceDecl<TQualifierNames extends string>(
  qualifierNameConverter: Converter<TQualifierNames>
): Converter<Json.IChildResourceDecl<TQualifierNames>> {
  return Converters.strictObject<Json.IChildResourceDecl<TQualifierNames>>({
    resourceTypeName: CommonConvert.resourceTypeName,
    candidates: Converters.arrayOf(typedChildResourceCandidateDecl(qualifierNameConverter)).optional()
  });
}

/**
 * Returns a `Converter` for a `Json.IContainerContextDecl<TQualifierNames>`
 * narrowed on a supplied `qualifierName` converter.
 *
 * @public
 */
// Keep in sync with `containerContextDecl` above.
export function typedContainerContextDecl<TQualifierNames extends string>(
  qualifierNameConverter: Converter<TQualifierNames>
): Converter<Json.IContainerContextDecl<TQualifierNames>> {
  return Converters.strictObject<Json.IContainerContextDecl<TQualifierNames>>({
    baseId: Converters.oneOf([CommonConvert.resourceId, Converters.literal('')]).optional(),
    conditions: typedConditionSetDecl(qualifierNameConverter).optional(),
    mergeMethod: CommonConvert.resourceValueMergeMethod.optional()
  });
}

/**
 * Returns a `Converter` for a `Json.IResourceTreeChildNodeDecl<TQualifierNames>`
 * narrowed on a supplied `qualifierName` converter.
 *
 * @public
 */
// Keep in sync with `resourceTreeChildNodeDecl` above.
export function typedResourceTreeChildNodeDecl<TQualifierNames extends string>(
  qualifierNameConverter: Converter<TQualifierNames>
): Converter<Json.IResourceTreeChildNodeDecl<TQualifierNames>> {
  const childResource = typedChildResourceDecl(qualifierNameConverter);
  return Converters.generic<Json.IResourceTreeChildNodeDecl<TQualifierNames>, unknown>(
    (
      from: unknown,
      self: Converter<Json.IResourceTreeChildNodeDecl<TQualifierNames>, unknown>,
      context?: unknown
    ): Result<Json.IResourceTreeChildNodeDecl<TQualifierNames>> => {
      return Converters.strictObject<Json.IResourceTreeChildNodeDecl<TQualifierNames>>({
        resources: Converters.recordOf(childResource).optional(),
        children: Converters.recordOf(self).optional()
      }).convert(from, context);
    }
  );
}

/**
 * Returns a `Converter` for a `Json.IResourceTreeRootDecl<TQualifierNames>`
 * narrowed on a supplied `qualifierName` converter.
 *
 * @public
 */
// Keep in sync with `resourceTreeRootDecl` above.
export function typedResourceTreeRootDecl<TQualifierNames extends string>(
  qualifierNameConverter: Converter<TQualifierNames>
): Converter<Json.IResourceTreeRootDecl<TQualifierNames>> {
  return Converters.strictObject<Json.IResourceTreeRootDecl<TQualifierNames>>({
    context: typedContainerContextDecl(qualifierNameConverter).optional(),
    resources: Converters.recordOf(typedChildResourceDecl(qualifierNameConverter)).optional(),
    children: Converters.recordOf(typedResourceTreeChildNodeDecl(qualifierNameConverter)).optional()
  });
}

/**
 * Returns a `Converter` for a `Json.IResourceCollectionDecl<TQualifierNames>`
 * narrowed on a supplied `qualifierName` converter.
 *
 * @public
 */
// Keep in sync with `resourceCollectionDecl` above.
export function typedResourceCollectionDecl<TQualifierNames extends string>(
  qualifierNameConverter: Converter<TQualifierNames>
): Converter<Json.IResourceCollectionDecl<TQualifierNames>> {
  const containerContext = typedContainerContextDecl(qualifierNameConverter);
  const looseCandidate = typedLooseResourceCandidateDecl(qualifierNameConverter);
  const looseResource = typedLooseResourceDecl(qualifierNameConverter);
  return Converters.generic<Json.IResourceCollectionDecl<TQualifierNames>, unknown>(
    (
      from: unknown,
      self: Converter<Json.IResourceCollectionDecl<TQualifierNames>, unknown>,
      context?: unknown
    ): Result<Json.IResourceCollectionDecl<TQualifierNames>> => {
      return Converters.strictObject<Json.IResourceCollectionDecl<TQualifierNames>>({
        context: containerContext.optional(),
        candidates: Converters.arrayOf(looseCandidate).optional(),
        resources: Converters.arrayOf(looseResource).optional(),
        collections: Converters.arrayOf(self).optional(),
        metadata: JsonConverters.jsonObject.optional()
      }).convert(from, context);
    }
  );
}

/**
 * Returns a `Converter` for a `Json.IImporterResourceCollectionDecl<TQualifierNames>`
 * narrowed on a supplied `qualifierName` converter.
 *
 * @public
 */
// Keep in sync with `importerResourceCollectionDecl` above.
export function typedImporterResourceCollectionDecl<TQualifierNames extends string>(
  qualifierNameConverter: Converter<TQualifierNames>
): Converter<Json.IImporterResourceCollectionDecl<TQualifierNames>> {
  const containerContext = typedContainerContextDecl(qualifierNameConverter);
  const importerCandidate = typedImporterResourceCandidateDecl(qualifierNameConverter);
  const looseResource = typedLooseResourceDecl(qualifierNameConverter);
  const childResource = typedChildResourceDecl(qualifierNameConverter);
  return Converters.generic<Json.IImporterResourceCollectionDecl<TQualifierNames>, unknown>(
    (
      from: unknown,
      self: Converter<Json.IImporterResourceCollectionDecl<TQualifierNames>, unknown>,
      context?: unknown
    ): Result<Json.IImporterResourceCollectionDecl<TQualifierNames>> => {
      return Converters.strictObject<Json.IImporterResourceCollectionDecl<TQualifierNames>>({
        context: containerContext.optional(),
        candidates: Converters.arrayOf(importerCandidate).optional(),
        resources: Converters.arrayOf(Converters.oneOf([looseResource, childResource])).optional(),
        collections: Converters.arrayOf(self).optional(),
        metadata: JsonConverters.jsonObject.optional()
      }).convert(from, context);
    }
  );
}
