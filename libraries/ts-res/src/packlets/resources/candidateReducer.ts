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
  private readonly _candidates: ReadonlyArray<ResourceCandidate>;
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
    this._candidates = candidates;
    this._filterForContext = filterForContext;

    // Use existing logic to determine reducible qualifiers
    this._qualifiersToReduce =
      ResourceCandidate.findReducibleQualifiers(candidates, filterForContext) ?? new Set();
  }

  /**
   * Static convenience method to construct an array of properly reduced
   * {@link ResourceJson.Json.IChildResourceCandidateDecl | child resource candidate declarations}
   * from a set of {@link Resources.ResourceCandidate | resource candidates}.
   * @param candidates - The candidates to reduce
   * @param filterForContext - Optional context to filter against
   * @returns Array of reduced candidate declarations
   */
  public static reduceToChildResourceCandidateDecls(
    candidates: ReadonlyArray<ResourceCandidate>,
    filterForContext?: Context.IValidatedContextDecl
  ): ResourceJson.Json.IChildResourceCandidateDecl[] {
    if (!filterForContext || Object.keys(filterForContext).length === 0) {
      return candidates.map((candidate) => candidate.toChildResourceCandidateDecl());
    }

    const reducer = new CandidateReducer(candidates, filterForContext);
    return candidates
      .map((candidate) => reducer.reduceCandidate(candidate))
      .filter((reduction): reduction is IReducedCandidate => reduction !== undefined)
      .map((reduction) => {
        return {
          json: reduction.json ?? reduction.candidate.json,
          isPartial: reduction.isPartial ?? reduction.candidate.isPartial,
          mergeMethod: reduction.mergeMethod ?? reduction.candidate.mergeMethod,
          conditions: reduction.conditions
        };
      });
  }

  /**
   * Static convenience method to construct an array of properly reduced
   * {@link ResourceJson.Json.ILooseResourceCandidateDecl | loose resource candidate declarations}
   * from a set of {@link Resources.ResourceCandidate | resource candidates}.
   * @param id - The id of the resource
   * @param candidates - The candidates to reduce
   * @param filterForContext - Optional context to filter against
   * @returns Array of reduced candidate declarations
   */
  public static reduceToLooseResourceCandidateDecls(
    id: ResourceId,
    candidates: ReadonlyArray<ResourceCandidate>,
    filterForContext?: Context.IValidatedContextDecl
  ): ResourceJson.Json.ILooseResourceCandidateDecl[] {
    if (!filterForContext || Object.keys(filterForContext).length === 0) {
      return candidates.map((candidate) => candidate.toLooseResourceCandidateDecl());
    }

    const reducer = new CandidateReducer(candidates, filterForContext);
    return candidates
      .map((candidate) => reducer.reduceCandidate(candidate))
      .filter((reduction): reduction is IReducedCandidate => reduction !== undefined)
      .map((reduction) => {
        return {
          id,
          json: reduction.json ?? reduction.candidate.json,
          isPartial: reduction.isPartial ?? reduction.candidate.isPartial,
          mergeMethod: reduction.mergeMethod ?? reduction.candidate.mergeMethod,
          conditions: reduction.conditions
        };
      });
  }

  /**
   * Reduces a single candidate according to the configured reduction rules.
   * @param candidate - The candidate to reduce
   * @returns Either a reduced candidate declaration or undefined if the candidate should be filtered out
   */
  public reduceCandidate(candidate: ResourceCandidate): IReducedCandidate | undefined {
    // For now, we don't filter out any candidates - just apply reduction
    // This preserves the existing behavior while setting up for future collision detection
    const conditions = candidate.conditions.conditions
      .filter((c) => !this._qualifiersToReduce.has(c.qualifier.name))
      .map((c) => c.toLooseConditionDecl());

    return { candidate, conditions };
  }

  /**
   * Gets the set of qualifiers that will be reduced by this reducer.
   * @returns The set of qualifier names to be reduced, or undefined if no reduction will occur
   */
  public get qualifiersToReduce(): ReadonlySet<QualifierName> | undefined {
    return this._qualifiersToReduce;
  }
}
