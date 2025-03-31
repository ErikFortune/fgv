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

import { mapResults, Result, succeed } from '@fgv/ts-utils';
import * as Normalized from './normalized';
import * as Json from './json';
import { Helpers as CommonHelpers } from '../common';

/**
 * Helper method to merge a loose candidate with a base name and conditions.
 * @param candidate - The candidate to merge.
 * @param baseName - The base name to merge with the candidate.
 * @param baseConditions - The base conditions to merge with the candidate.
 * @returns `Success` with the merged candidate if successful, otherwise `Failure`.
 * @public
 */
export function mergeLooseCandidate(
  candidate: Normalized.ILooseResourceCandidateDecl,
  baseName?: string,
  baseConditions?: ReadonlyArray<Json.ILooseConditionDecl>
): Result<Normalized.ILooseResourceCandidateDecl> {
  return CommonHelpers.joinResourceIds(baseName, candidate.id).onSuccess((id) => {
    /* c8 ignore next 1 - defense in depth */
    const conditions = [...(baseConditions ?? []), ...(candidate.conditions ?? [])];
    return succeed({ ...candidate, id, conditions });
  });
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
  resource: Normalized.ILooseResourceDecl,
  baseName?: string,
  baseConditions?: ReadonlyArray<Json.ILooseConditionDecl>
): Result<Normalized.ILooseResourceDecl> {
  return CommonHelpers.joinResourceIds(baseName, resource.id).onSuccess((id) => {
    return mapResults(
      /* c8 ignore next 1 - defense in depth */
      (resource.candidates ?? []).map((candidate) => mergeChildCandidate(candidate, baseConditions))
    ).onSuccess((candidates) => {
      return succeed({ ...resource, id, candidates });
    });
  });
}

/**
 * Helper method to merge a child resource with a parent name and conditions.
 * @param resource - The resource to merge.
 * @param name - The name of the resource.
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
