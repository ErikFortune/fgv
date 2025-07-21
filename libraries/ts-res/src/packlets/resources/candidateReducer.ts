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

import { QualifierName, ResourceId, ResourceValueMergeMethod } from '../common';
import * as Context from '../context';
import * as ResourceJson from '../resource-json';
import { ResourceCandidate } from './resourceCandidate';
import { JsonObject } from '@fgv/ts-json-base';
import { JsonEditor } from '@fgv/ts-json';
import { Result, succeed, fail, mapResults } from '@fgv/ts-utils';

/**
 * Action taken on a candidate during reduction processing.
 * @public
 */
export type CandidateAction = 'unchanged' | 'reduced' | 'suppressed';

/**
 * Information about a candidate being processed by the reducer.
 * @public
 */
export interface ICandidateInfo {
  readonly originalCandidate: ResourceCandidate;
  action: CandidateAction;
  conditions: ResourceJson.Json.ILooseConditionDecl[];
  conditionSetKey: string;
  readonly json?: JsonObject;
}

/**
 * Represents a reduced candidate after applying reduction logic.
 * @public
 */
export interface IReducedCandidate {
  readonly candidate: ResourceCandidate;
  readonly conditions: ResourceJson.Json.ConditionSetDecl;
  readonly json?: JsonObject;
  readonly isPartial?: boolean;
  readonly mergeMethod?: ResourceValueMergeMethod;
}

/**
 * Manages candidate reduction logic for filtering and qualifier reduction operations.
 * Encapsulates the state and logic needed to consistently process candidates for reduction.
 * @public
 */
export class CandidateReducer {
  private readonly _candidateInfos: ICandidateInfo[];
  private readonly _filterForContext: Context.IValidatedContextDecl;
  private readonly _qualifiersToReduce: ReadonlySet<QualifierName>;

  /**
   * Constructor for CandidateReducer.
   * @param candidates - The set of candidates to potentially reduce
   * @param filterForContext - Context to filter candidates against
   */
  public constructor(
    candidates: ReadonlyArray<ResourceCandidate>,
    filterForContext: Context.IValidatedContextDecl
  ) {
    this._filterForContext = filterForContext;

    // Use existing logic to determine reducible qualifiers
    this._qualifiersToReduce =
      ResourceCandidate.findReducibleQualifiers(candidates, filterForContext) ?? new Set();

    // Initialize candidate info array with initial reduction attempts
    this._candidateInfos = candidates.map((candidate): ICandidateInfo => {
      const filteredConditions = candidate.conditions.conditions.filter(
        (c) => !this._qualifiersToReduce.has(c.qualifier.name)
      );

      const reducedConditions = filteredConditions.map((c) => c.toLooseConditionDecl());
      const conditionSetKey = CandidateReducer._computeConditionSetKey(reducedConditions);

      const action: CandidateAction =
        filteredConditions.length < candidate.conditions.conditions.length ? 'reduced' : 'unchanged';

      return {
        originalCandidate: candidate,
        action,
        conditions: reducedConditions,
        conditionSetKey,
        json: undefined // Will be set later when needed
      };
    });

    // Resolve collisions by reverting reduced candidates to unchanged when they collide
    this._resolveCollisions();
  }

  /**
   * Computes a string key for a set of condition declarations for collision detection.
   * @param conditions - The conditions to compute a key for
   * @returns A string key representing the condition set
   */
  private static _computeConditionSetKey(conditions: ResourceJson.Json.ILooseConditionDecl[]): string {
    if (conditions.length === 0) {
      return '{}';
    }

    // Sort conditions by qualifier name for consistent keys
    const sortedConditions = [...conditions].sort((a, b) => a.qualifierName.localeCompare(b.qualifierName));
    const pairs = sortedConditions.map((c) => `${c.qualifierName}:${c.value}`);
    return `{${pairs.join(',')}}`;
  }

  /**
   * Merges a partial candidate's JSON value into a base candidate's JSON value.
   * @param baseJson - The base JSON value to merge into
   * @param partialJson - The partial JSON value to merge from
   * @returns The merged JSON value
   * @internal
   */
  private static _mergeJsonValues(baseJson: JsonObject, partialJson: JsonObject): JsonObject {
    // Use JsonEditor.mergeObjectsInPlace for consistent merging behavior
    // Note: JsonEditor concatenates arrays rather than replacing them
    return JsonEditor.default.mergeObjectsInPlace({}, [baseJson, partialJson]).orThrow(); // Internal method should throw on error - this indicates a serious bug
  }

  /**
   * Resolves collisions using smart collision resolution rules.
   * - If a reduced candidate collides with an unchanged candidate and only one reduced candidate collides:
   *   - If reduced candidate is complete: suppress unchanged, keep reduced
   *   - If reduced candidate is partial: merge into unchanged, suppress reduced
   * - Otherwise: revert reduced candidates to unchanged to avoid collisions
   * @internal
   */
  private _resolveCollisions(): void {
    let hasCollisions = true;
    let iterationCount = 0;
    const maxIterations = this._candidateInfos.length; // Safety limit

    while (hasCollisions && iterationCount < maxIterations) {
      hasCollisions = false;
      iterationCount++;

      // Group candidates by their condition set keys (excluding suppressed)
      const conditionKeyGroups = new Map<string, ICandidateInfo[]>();

      for (const candidateInfo of this._candidateInfos) {
        if (candidateInfo.action !== 'suppressed') {
          // Don't include suppressed candidates
          const key = candidateInfo.conditionSetKey;
          if (!conditionKeyGroups.has(key)) {
            conditionKeyGroups.set(key, []);
          }
          conditionKeyGroups.get(key)!.push(candidateInfo);
        }
      }

      // Apply smart collision resolution
      for (const [, candidatesWithSameKey] of conditionKeyGroups) {
        if (candidatesWithSameKey.length > 1) {
          // Categorize candidates
          const unchangedCandidates = candidatesWithSameKey.filter((c) => c.action === 'unchanged');
          const reducedCandidates = candidatesWithSameKey.filter((c) => c.action === 'reduced');

          if (unchangedCandidates.length === 1 && reducedCandidates.length === 1) {
            // Simple case: one unchanged vs one reduced - apply smart resolution
            const unchangedCandidate = unchangedCandidates[0];
            const reducedCandidate = reducedCandidates[0];

            if (!reducedCandidate.originalCandidate.isPartial) {
              // Complete reduced candidate wins - suppress unchanged
              unchangedCandidate.action = 'suppressed';
              hasCollisions = true;
            } else {
              // Partial reduced candidate - merge into unchanged and suppress reduced
              const mergedJson = CandidateReducer._mergeJsonValues(
                unchangedCandidate.originalCandidate.json,
                reducedCandidate.originalCandidate.json
              );

              // Update unchanged candidate with merged JSON, keeping its isPartial status
              (unchangedCandidate as { json?: JsonObject }).json = mergedJson;

              // Suppress the reduced candidate
              reducedCandidate.action = 'suppressed';
              hasCollisions = true;
            }
          } else {
            // Complex collision case - revert all reduced candidates to unchanged
            for (const candidateInfo of reducedCandidates) {
              // Revert to original conditions and mark as unchanged
              const originalConditions = candidateInfo.originalCandidate.conditions.conditions.map((c) =>
                c.toLooseConditionDecl()
              );
              const originalKey = CandidateReducer._computeConditionSetKey(originalConditions);

              // Update the candidate info to revert to original state
              candidateInfo.action = 'unchanged';
              candidateInfo.conditions = originalConditions;
              candidateInfo.conditionSetKey = originalKey;

              hasCollisions = true;
            }
          }
        }
      }
    }
  }

  /**
   * Static convenience method to construct an array of properly reduced
   * {@link ResourceJson.Json.IChildResourceCandidateDecl | child resource candidate declarations}
   * from a set of {@link Resources.ResourceCandidate | resource candidates}.
   * @param candidates - The candidates to reduce
   * @param filterForContext - Optional context to filter against
   * @returns Result with array of reduced candidate declarations, or Failure if reduction fails
   */
  public static reduceToChildResourceCandidateDecls(
    candidates: ReadonlyArray<ResourceCandidate>,
    filterForContext?: Context.IValidatedContextDecl
  ): Result<ResourceJson.Json.IChildResourceCandidateDecl[]> {
    if (!filterForContext || Object.keys(filterForContext).length === 0) {
      return succeed(candidates.map((candidate) => candidate.toChildResourceCandidateDecl()));
    }

    const reducer = new CandidateReducer(candidates, filterForContext);
    const reductionResults = mapResults(candidates.map((candidate) => reducer.reduceCandidate(candidate)));

    return reductionResults.onSuccess((reductions) => {
      const validReductions = reductions.filter(
        (reduction): reduction is IReducedCandidate => reduction !== undefined
      );

      return succeed(
        validReductions.map((reduction) => ({
          /* c8 ignore next 3 -- defense in depth */
          json: reduction.json ?? reduction.candidate.json,
          isPartial: reduction.isPartial ?? reduction.candidate.isPartial,
          mergeMethod: reduction.mergeMethod ?? reduction.candidate.mergeMethod,
          conditions: reduction.conditions
        }))
      );
    });
  }

  /**
   * Static convenience method to construct an array of properly reduced
   * {@link ResourceJson.Json.ILooseResourceCandidateDecl | loose resource candidate declarations}
   * from a set of {@link Resources.ResourceCandidate | resource candidates}.
   * @param id - The id of the resource
   * @param candidates - The candidates to reduce
   * @param filterForContext - Optional context to filter against
   * @returns Result with array of reduced candidate declarations, or Failure if reduction fails
   */
  public static reduceToLooseResourceCandidateDecls(
    id: ResourceId,
    candidates: ReadonlyArray<ResourceCandidate>,
    filterForContext?: Context.IValidatedContextDecl
  ): Result<ResourceJson.Json.ILooseResourceCandidateDecl[]> {
    if (!filterForContext || Object.keys(filterForContext).length === 0) {
      return succeed(candidates.map((candidate) => candidate.toLooseResourceCandidateDecl()));
    }

    const reducer = new CandidateReducer(candidates, filterForContext);
    const reductionResults = mapResults(candidates.map((candidate) => reducer.reduceCandidate(candidate)));

    return reductionResults.onSuccess((reductions) => {
      const validReductions = reductions.filter(
        (reduction): reduction is IReducedCandidate => reduction !== undefined
      );

      return succeed(
        validReductions.map((reduction) => ({
          id,
          /* c8 ignore next 3 -- defense in depth */
          json: reduction.json ?? reduction.candidate.json,
          isPartial: reduction.isPartial ?? reduction.candidate.isPartial,
          mergeMethod: reduction.mergeMethod ?? reduction.candidate.mergeMethod,
          conditions: reduction.conditions
        }))
      );
    });
  }

  /**
   * Reduces a single candidate according to the configured reduction rules.
   * @param candidate - The candidate to reduce
   * @returns Either a reduced candidate declaration or an error if the candidate is not found
   */
  public reduceCandidate(candidate: ResourceCandidate): Result<IReducedCandidate | undefined> {
    const candidateInfo = this._candidateInfos.find((info) => info.originalCandidate === candidate);
    if (!candidateInfo) {
      return fail(`Candidate not found in reducer state`);
    }

    if (candidateInfo.action === 'suppressed') {
      return succeed(undefined);
    }

    // Convert array of conditions back to ConditionSetDecl for compatibility
    const conditionsAsRecord = candidateInfo.conditions.reduce((acc, condition) => {
      return { ...acc, [condition.qualifierName]: condition.value };
    }, {} as ResourceJson.Json.ConditionSetDecl);

    return succeed({
      candidate,
      conditions: conditionsAsRecord,
      json: candidateInfo.json ?? candidate.json,
      isPartial: candidate.isPartial,
      mergeMethod: candidate.mergeMethod
    });
  }
}
