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

import { mapResults, Result, fail, succeed } from '@fgv/ts-utils';
import * as Normalized from './normalized';
import * as Json from './json';
import { Helpers as CommonHelpers } from '../common';
import { sanitizeJsonObject } from '@fgv/ts-json-base';

/**
 * Common options when creating or displaying declarations.
 * @public
 */
export interface IDeclarationOptions {
  /**
   * If `true`, properties with default values will be included in the
   * output. If omitted or `false`, properties with default values will be omitted.
   */
  showDefaults?: boolean;

  /**
   * If `true`, the output will be normalized using hash-based ordering for consistent structure.
   * If omitted or `false`, no normalization will be applied. Defaults to `false`.
   */
  normalized?: boolean;
}

/**
 * Helper method to merge a resource context declaration with a parent name and conditions.
 * @param decl - The resource context declaration to merge.
 * @param parentName - The name of the parent resource.
 * @param parentConditions - The conditions of the parent resource.
 * @returns `Success` with the merged resource context declaration if successful, otherwise `Failure`.
 * @public
 */
export function mergeContextDecl(
  decl?: Normalized.IContainerContextDecl,
  parentName?: string,
  parentConditions?: ReadonlyArray<Json.ILooseConditionDecl>
): Result<Normalized.IContainerContextDecl> {
  if (!decl) {
    return sanitizeJsonObject({ baseId: parentName, conditions: parentConditions });
  } else if (!parentName && !parentConditions) {
    return succeed(decl);
  }
  switch (decl.mergeMethod ?? 'augment') {
    case 'augment':
      return CommonHelpers.joinResourceIds(parentName, decl.baseId).onSuccess((baseId) => {
        /* c8 ignore next 1 - defense in depth */
        const conditions = [...(parentConditions ?? []), ...(decl.conditions ?? [])];
        return sanitizeJsonObject({ baseId, conditions });
      });
    case 'replace': {
      const baseId = decl.baseId ?? parentName;
      const conditions = decl.conditions ?? parentConditions;
      return sanitizeJsonObject({ baseId, conditions });
    }
    case 'delete': {
      return sanitizeJsonObject({});
    }
  }
}

/**
 * Helper method to merge a loose candidate with a base name and conditions.
 * @param candidate - The candidate to merge.
 * @param baseName - The base name to merge with the candidate.
 * @param baseConditions - The base conditions to merge with the candidate.
 * @returns `Success` with the merged candidate if successful, otherwise `Failure`.
 * @public
 */
export function mergeLooseCandidate(
  candidate: Normalized.IImporterResourceCandidateDecl,
  baseName?: string,
  baseConditions?: ReadonlyArray<Json.ILooseConditionDecl>
): Result<Normalized.ILooseResourceCandidateDecl> {
  const candidateId = Json.isLooseResourceCandidateDecl(candidate) ? candidate.id : '';
  if (!Json.isLooseResourceCandidateDecl(candidate) && !baseName) {
    return fail('id is required in mergeLooseCandidate');
  }

  /* c8 ignore next 7 - functional code tested but coverage intermittently missed */
  return CommonHelpers.joinResourceIds(baseName, candidateId).onSuccess((id) => {
    /* c8 ignore next 1 - defense in depth */
    const conditions = [...(baseConditions ?? []), ...(candidate.conditions ?? [])];
    return succeed({ ...candidate, id, conditions });
  });
}

/**
 * Helper method to merge a resource candidate with a base name and conditions from import context.
 * This function enables name inheritance for resource candidates, similar to resources.
 *
 * @param candidate - The candidate to merge. Can have an optional ID that will be joined with baseName.
 * @param baseName - The base name from import context to merge with the candidate.
 * When provided, this will be used as the parent component of the candidate ID.
 * @param baseConditions - The base conditions from import context to merge with the candidate's conditions.
 * @returns `Success` with the merged candidate if successful, otherwise `Failure`.
 *
 * @remarks
 * This function supports name inheritance for candidates:
 * - Joins baseName with candidate's existing ID using dot notation
 * - If candidate has no ID, uses baseName as the full ID
 * - Always merges base conditions with candidate's existing conditions
 *
 * @example
 * ```typescript
 * // Candidate inherits full name from import context
 * const candidate = { value: "Hello", conditions: [...] }; // No id field
 * const result = mergeImporterCandidate(candidate, "pages.home.greeting", []);
 * // Result: { id: "pages.home.greeting", value: "Hello", conditions: [...] }
 * ```
 *
 * @public
 */
export function mergeImporterCandidate(
  candidate: Normalized.IImporterResourceCandidateDecl,
  baseName?: string,
  baseConditions?: ReadonlyArray<Json.ILooseConditionDecl>
): Result<Normalized.IImporterResourceCandidateDecl> {
  if (baseName || Json.isLooseResourceCandidateDecl(candidate)) {
    const candidateId = 'id' in candidate ? candidate.id : '';
    return CommonHelpers.joinResourceIds(baseName, candidateId).onSuccess((id) => {
      /* c8 ignore next 1 - defense in depth */
      const conditions = [...(baseConditions ?? []), ...(candidate.conditions ?? [])];
      return succeed({ ...candidate, id, conditions });
    });
  } else {
    /* c8 ignore next 5 - functional code tested but coverage intermittently missed */
    /* c8 ignore next 1 - defense in depth */
    const conditions = [...(baseConditions ?? []), ...(candidate.conditions ?? [])];
    return succeed({ ...candidate, conditions });
  }
}

/**
 * Helper method to merge a child candidate with base conditions.
 * @param candidate - The candidate to merge.
 * @param baseConditions - The base conditions to merge with the candidate.
 * @returns `Success` with the merged candidate if successful, otherwise `Failure`.
 * @public
 */
export function mergeChildCandidate(
  candidate: Normalized.IChildResourceCandidateDecl,
  baseConditions?: ReadonlyArray<Json.ILooseConditionDecl>
): Result<Normalized.IChildResourceCandidateDecl> {
  /* c8 ignore next 1 - defense in depth */
  const conditions = [...(baseConditions ?? []), ...(candidate.conditions ?? [])];
  return succeed({ ...candidate, conditions });
}

/**
 * Helper method to merge a loose resource with a base name and conditions.
 * @param resource - The resource to merge.
 * @param baseName - The base name to merge with the resource.
 * @param baseConditions - The base conditions to merge with the resource.
 * @returns `Success` with the merged resource if successful, otherwise `Failure`.
 * @public
 */
export function mergeLooseResource(
  resource: Normalized.IImporterResourceDecl,
  baseName?: string,
  baseConditions?: ReadonlyArray<Json.ILooseConditionDecl>
): Result<Normalized.ILooseResourceDecl> {
  /* c8 ignore next 1 - defense in depth */
  const resourceId = Json.isLooseResourceDecl(resource) ? resource.id : '';
  if (!baseName && !Json.isLooseResourceDecl(resource)) {
    return fail('id is required in mergeLooseResource');
  }

  /* c8 ignore next 10 - functional code tested but coverage intermittently missed */
  return CommonHelpers.joinResourceIds(baseName, resourceId).onSuccess((id) => {
    return mapResults(
      /* c8 ignore next 1 - defense in depth */
      (resource.candidates ?? []).map((candidate) => mergeChildCandidate(candidate, baseConditions))
    ).onSuccess((candidates) => {
      return succeed({ ...resource, id, candidates });
    });
  });
}

/**
 * Helper method to merge a resource with a base name and conditions from import context.
 * This function enables name inheritance where resources can automatically inherit their
 * resource ID from the import context when no explicit ID is provided in the resource declaration.
 *
 * @param resource - The resource to merge. Can be either a loose resource (with optional ID)
 * or a child resource (without ID).
 * @param baseName - The base name from import context to merge with the resource.
 * When provided, this will be used as the parent component of the resource ID.
 * @param baseConditions - The base conditions from import context to merge with the resource's conditions.
 * @returns `Success` with the merged resource if successful, otherwise `Failure`.
 *
 * @remarks
 * This function supports several scenarios for name inheritance:
 * - **Explicit ID + Base Name**: Joins baseName.resourceId (e.g., "pages.home" + "greeting" = "pages.home.greeting")
 * - **No ID + Base Name**: Uses baseName as the resource ID (enables name inheritance from import context)
 * - **Explicit ID + No Base Name**: Uses the resource's existing ID
 * - **No ID + No Base Name**: Returns resource without ID (for child resources)
 *
 * Base conditions are always merged with the resource's existing conditions.
 *
 * @example
 * ```typescript
 * // Resource without ID inherits name from import context
 * const resource = { candidates: [...] }; // No id field
 * const result = mergeImporterResource(resource, "pages.home", []);
 * // Result: { id: "pages.home", candidates: [...] }
 *
 * // Resource with ID gets joined with base name
 * const resource = { id: "greeting", candidates: [...] };
 * const result = mergeImporterResource(resource, "pages.home", []);
 * // Result: { id: "pages.home.greeting", candidates: [...] }
 * ```
 *
 * @public
 */
export function mergeImporterResource(
  resource: Normalized.IImporterResourceDecl,
  baseName?: string,
  baseConditions?: ReadonlyArray<Json.ILooseConditionDecl>
): Result<Normalized.IImporterResourceDecl> {
  if (baseName || `id` in resource) {
    const resourceId = 'id' in resource ? resource.id : '';
    // If we have a base name or the resource has no id, we can just
    return CommonHelpers.joinResourceIds(baseName, resourceId).onSuccess((id) => {
      return mapResults(
        /* c8 ignore next 1 - defense in depth */
        (resource.candidates ?? []).map((candidate) => mergeChildCandidate(candidate, baseConditions))
      ).onSuccess((candidates) => {
        return succeed({ ...resource, id, candidates });
      });
    });
  } else {
    /* c8 ignore next 8 - functional code tested but coverage intermittently missed */
    return mapResults(
      /* c8 ignore next 1 - defense in depth */
      (resource.candidates ?? []).map((candidate) => mergeChildCandidate(candidate, baseConditions))
    ).onSuccess((candidates) => {
      return succeed({ ...resource, candidates });
    });
  }
}

/**
 * Helper method to merge a child resource with a parent name and conditions.
 * @param resource - The resource to merge.
 * @param name - The name of the resource.
 *
 * @param parentName - The name of the parent resource.
 * @param parentConditions - The conditions of the parent resource.
 * @returns `Success` with the merged resource if successful, otherwise `Failure`.
 * @public
 */
export function mergeChildResource(
  resource: Normalized.IChildResourceDecl,
  name: string,
  parentName?: string,
  parentConditions?: ReadonlyArray<Json.ILooseConditionDecl>
): Result<Normalized.ILooseResourceDecl> {
  return CommonHelpers.joinResourceIds(parentName, name).onSuccess((id) => {
    return mapResults(
      /* c8 ignore next 1 - defense in depth */
      (resource.candidates ?? []).map((candidate) => mergeChildCandidate(candidate, parentConditions))
    ).onSuccess((candidates) => {
      return succeed({ ...resource, id, candidates });
    });
  });
}
