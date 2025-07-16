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

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { JsonValue, JsonObject, isJsonObject } from '@fgv/ts-json-base';
import { JsonEditor } from '@fgv/ts-json';
import { QualifierMatchScore, NoMatch } from '../common';
import { Condition, ConditionSet } from '../conditions';
import { AbstractDecision } from '../decisions';
import { ReadOnlyQualifierTypeCollector } from '../qualifier-types';
import { IContextQualifierProvider } from './context';
import { IResourceManager, IResource, IResourceCandidate } from './iResourceManager';
import { ConditionSetResolutionResult, IConditionMatchResult } from './conditionSetResolutionResult';
import { IResourceResolverCacheListener } from './cacheListener';

/**
 * Represents the cached result of resolving a decision.
 * Contains either a failure indicator or a list of instance indices for matching condition sets,
 * ordered by condition set priority.
 * @public
 */
export type DecisionResolutionResult =
  | { success: false }
  | { success: true; instanceIndices: ReadonlyArray<number> };

/**
 * Parameters for creating a {@link Runtime.ResourceResolver | ResourceResolver}.
 * @public
 */
export interface IResourceResolverCreateParams {
  /**
   * The {@link Runtime.IResourceManager | resource manager} that defines the resources available
   * and provides access to qualifiers and conditions.
   */
  resourceManager: IResourceManager;

  /**
   * The {@link QualifierTypes.ReadOnlyQualifierTypeCollector | readonly qualifier type collector}
   * that provides qualifier implementations for condition evaluation.
   */
  qualifierTypes: ReadOnlyQualifierTypeCollector;

  /**
   * The {@link Runtime.Context.IContextQualifierProvider | context qualifier provider} that resolves
   * qualifier values for the current context.
   */
  contextQualifierProvider: IContextQualifierProvider;

  /**
   * An optional listener for {@link Runtime.ResourceResolver | ResourceResolver} cache activity.
   */
  listener?: IResourceResolverCacheListener;
}

/**
 * High-performance runtime resource resolver with O(1) condition caching.
 * Resolves resources for a given context by evaluating conditions against qualifier values
 * and caching results for optimal performance.
 * @public
 */
export class ResourceResolver {
  /**
   * The resource manager that defines available resources and provides condition access.
   */
  public readonly resourceManager: IResourceManager;

  /**
   * The readonly qualifier type collector that provides qualifier implementations.
   */
  public readonly qualifierTypes: ReadOnlyQualifierTypeCollector;

  /**
   * The context qualifier provider that resolves qualifier values.
   */
  public readonly contextQualifierProvider: IContextQualifierProvider;

  /**
   * The cache array for resolved conditions, indexed by condition index for O(1) lookup.
   * Each entry stores the resolved QualifierMatchScore for the corresponding condition.
   */
  public get conditionCache(): ReadonlyArray<QualifierMatchScore | undefined> {
    return this._conditionCache;
  }

  /**
   * The cache array for resolved condition sets, indexed by condition set index for O(1) lookup.
   * Each entry stores the resolved ConditionSetResolutionResult for the corresponding condition set.
   */
  public get conditionSetCache(): ReadonlyArray<ConditionSetResolutionResult | undefined> {
    return this._conditionSetCache;
  }

  /**
   * The cache array for resolved decisions, indexed by decision index for O(1) lookup.
   * Each entry stores the resolved DecisionResolutionResult for the corresponding decision.
   */
  public get decisionCache(): ReadonlyArray<DecisionResolutionResult | undefined> {
    return this._decisionCache;
  }

  /**
   * Cache array for resolved conditions, indexed by condition index for O(1) lookup.
   * Each entry stores the resolved QualifierMatchScore for the corresponding condition.
   */
  private readonly _conditionCache: Array<QualifierMatchScore | undefined>;

  /**
   * Cache array for resolved condition sets, indexed by condition set index for O(1) lookup.
   * Each entry stores the resolved ConditionSetResolutionResult for the corresponding condition set.
   */
  private readonly _conditionSetCache: Array<ConditionSetResolutionResult | undefined>;

  /**
   * Cache array for resolved decisions, indexed by decision index for O(1) lookup.
   * Each entry stores the resolved DecisionResolutionResult for the corresponding decision.
   */
  private readonly _decisionCache: Array<DecisionResolutionResult | undefined>;

  /**
   * The listener for {@link Runtime.ResourceResolver | ResourceResolver} cache activity.
   */
  private readonly _listener?: IResourceResolverCacheListener;

  /**
   * Constructor for a {@link Runtime.ResourceResolver | ResourceResolver} object.
   * @param params - {@link Runtime.IResourceResolverCreateParams | Parameters} used to create the resolver.
   */
  protected constructor(params: IResourceResolverCreateParams) {
    this.resourceManager = params.resourceManager;
    this.qualifierTypes = params.qualifierTypes;
    this.contextQualifierProvider = params.contextQualifierProvider;

    // Initialize condition cache array with size matching the condition collector
    const conditionCollectorSize = this.resourceManager.conditions.size;
    this._conditionCache = new Array<QualifierMatchScore | undefined>(conditionCollectorSize);

    // Initialize condition set cache array with size matching the condition set collector
    const conditionSetCollectorSize = this.resourceManager.conditionSets.size;
    this._conditionSetCache = new Array<ConditionSetResolutionResult | undefined>(conditionSetCollectorSize);

    // Initialize decision cache array with size matching the decision collector
    const decisionCollectorSize = this.resourceManager.decisions.size;
    this._decisionCache = new Array<DecisionResolutionResult | undefined>(decisionCollectorSize);

    this._listener = params.listener;
  }

  /**
   * Creates a new {@link Runtime.ResourceResolver | ResourceResolver} object.
   * @param params - {@link Runtime.IResourceResolverCreateParams | Parameters} used to create the resolver.
   * @returns `Success` with the new {@link Runtime.ResourceResolver | ResourceResolver} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(params: IResourceResolverCreateParams): Result<ResourceResolver> {
    return captureResult(() => new ResourceResolver(params));
  }

  /**
   * Resolves a condition by evaluating it against the current context.
   * Uses O(1) caching based on the condition's globally unique sequential index.
   * @param condition - The {@link Conditions.Condition | condition} to resolve.
   * @returns `Success` with the {@link QualifierMatchScore | match score} if successful,
   * or `Failure` with an error message if the condition cannot be resolved.
   * @public
   */
  public resolveCondition(condition: Condition): Result<QualifierMatchScore> {
    // Get the condition's index for cache lookup
    const conditionIndex = condition.index;
    if (conditionIndex === undefined) {
      return fail(`Condition "${condition.key}" does not have a valid index`);
    }

    // Check cache first for O(1) lookup
    const cachedResult = this._conditionCache[conditionIndex];
    if (cachedResult !== undefined) {
      this._listener?.onCacheHit('condition', conditionIndex);
      return succeed(cachedResult);
    }

    // Resolve the condition by getting qualifier value and evaluating with qualifier type
    const qualifierValueResult = this.contextQualifierProvider.get(condition.qualifier);
    if (qualifierValueResult.isFailure()) {
      this._listener?.onCacheError('condition', conditionIndex);
      return fail(
        `Failed to get qualifier value for "${condition.qualifier.name}": ${qualifierValueResult.message}`
      );
    }

    const qualifierValue = qualifierValueResult.value;

    // Evaluate the condition using the qualifier type's matching logic
    const matchScore = condition.qualifier.type.matches(condition.value, qualifierValue, condition.operator);

    // Cache the resolved value for future O(1) lookup
    this._conditionCache[conditionIndex] = matchScore;
    this._listener?.onCacheMiss('condition', conditionIndex);

    return succeed(matchScore);
  }

  /**
   * Resolves a condition set by evaluating all its constituent conditions against the current context.
   * Uses O(1) caching based on the condition set's globally unique sequential index.
   * @param conditionSet - The {@link Conditions.ConditionSet | condition set} to resolve.
   * @returns `Success` with the {@link Runtime.ConditionSetResolutionResult | resolution result} if successful,
   * or `Failure` with an error message if the condition set cannot be resolved.
   * @public
   */
  public resolveConditionSet(conditionSet: ConditionSet): Result<ConditionSetResolutionResult> {
    // Get the condition set's index for cache lookup
    const conditionSetIndex = conditionSet.index;
    if (conditionSetIndex === undefined) {
      return fail(`ConditionSet "${conditionSet.key}" does not have a valid index`);
    }

    // Check cache first for O(1) lookup
    const cachedResult = this._conditionSetCache[conditionSetIndex];
    if (cachedResult !== undefined) {
      this._listener?.onCacheHit('conditionSet', conditionSetIndex);
      return succeed(cachedResult);
    }

    // Resolve all conditions in the condition set
    const matches: Array<IConditionMatchResult> = [];

    for (const condition of conditionSet.conditions) {
      const scoreResult = this.resolveCondition(condition);

      if (scoreResult.isFailure()) {
        this._listener?.onCacheError('conditionSet', conditionSetIndex);
        return fail(`Failed to resolve condition "${condition.key}": ${scoreResult.message}`);
      }

      const score = scoreResult.value;
      const priority = condition.priority;
      if (score === NoMatch) {
        // Cache the failure result
        const failureResult = ConditionSetResolutionResult.createFailure();
        this._conditionSetCache[conditionSetIndex] = failureResult;
        this._listener?.onCacheMiss('conditionSet', conditionSetIndex);
        return succeed(failureResult);
      }

      matches.push({ priority, score });
    }

    // Cache the successful result
    const successResult = ConditionSetResolutionResult.createSuccess(matches);
    this._conditionSetCache[conditionSetIndex] = successResult;
    this._listener?.onCacheMiss('conditionSet', conditionSetIndex);

    return succeed(successResult);
  }

  /**
   * Resolves a decision by evaluating all its constituent condition sets against the current context.
   * Uses O(1) caching based on the decision's globally unique sequential index.
   * @param decision - The {@link Decisions.AbstractDecision | abstract decision} to resolve.
   * @returns `Success` with the {@link Runtime.DecisionResolutionResult | resolution result} if successful,
   * or `Failure` with an error message if the decision cannot be resolved.
   * @public
   */
  public resolveDecision(decision: AbstractDecision): Result<DecisionResolutionResult> {
    // Get the decision's index for cache lookup
    const decisionIndex = decision.index;
    if (decisionIndex === undefined) {
      return fail(`Decision "${decision.key}" does not have a valid index`);
    }

    // Check cache first for O(1) lookup
    const cachedResult = this._decisionCache[decisionIndex];
    if (cachedResult !== undefined) {
      this._listener?.onCacheHit('decision', decisionIndex);
      return succeed(cachedResult);
    }

    // Resolve all condition sets in the decision
    const matchingInstanceResults: Array<{ index: number; result: ConditionSetResolutionResult }> = [];

    for (let instanceIndex = 0; instanceIndex < decision.candidates.length; instanceIndex++) {
      const candidate = decision.candidates[instanceIndex];
      const conditionSetResult = this.resolveConditionSet(candidate.conditionSet);

      if (conditionSetResult.isFailure()) {
        this._listener?.onCacheError('decision', decisionIndex);
        return fail(`${decision.key}: Failed to resolve condition set": ${conditionSetResult.message}`);
      }

      const resolution = conditionSetResult.value;

      // Only include condition sets that match
      if (resolution.success) {
        matchingInstanceResults.push({
          index: instanceIndex,
          result: resolution
        });
      }
      // If condition set doesn't match, we simply skip it and continue (don't fail the decision)
    }

    // Sort by condition set resolution priority using the proper comparison logic
    matchingInstanceResults.sort((a, b) => ConditionSetResolutionResult.compare(a.result, b.result));

    // Extract just the instance indices in priority order
    const instanceIndices = matchingInstanceResults.map((item) => item.index);

    // Cache the successful result
    const successResult: DecisionResolutionResult = {
      success: true,
      instanceIndices: instanceIndices
    };
    this._decisionCache[decisionIndex] = successResult;
    this._listener?.onCacheMiss('decision', decisionIndex);

    return succeed(successResult);
  }

  /**
   * Resolves a resource by finding the best matching candidate.
   * Uses the resource's associated decision to determine the best match based on the current context.
   * @param resource - The {@link Resources.Resource | resource} to resolve.
   * @returns `Success` with the best matching candidate if successful,
   * or `Failure` with an error message if no candidates match or resolution fails.
   * @public
   */
  public resolveResource(resource: IResource): Result<IResourceCandidate> {
    // Get the abstract decision from the resource's concrete decision
    const abstractDecision = resource.decision.baseDecision;

    // Resolve the decision to get candidate indices in priority order
    const decisionResult = this.resolveDecision(abstractDecision);
    /* c8 ignore next 3 - defense in depth almost impossible to hit */
    if (decisionResult.isFailure()) {
      return fail(`Failed to resolve decision for resource "${resource.id}": ${decisionResult.message}`);
    }

    const resolution = decisionResult.value;

    // Check if any candidates matched
    if (!resolution.success || resolution.instanceIndices.length === 0) {
      return fail(`No matching candidates found for resource "${resource.id}"`);
    }

    // Get the best matching candidate (first in the ordered list)
    const bestCandidateIndex = resolution.instanceIndices[0];
    if (bestCandidateIndex >= resource.candidates.length) {
      return fail(`Invalid candidate index ${bestCandidateIndex} for resource "${resource.id}"`);
    }

    const bestCandidate = resource.candidates[bestCandidateIndex];
    return succeed(bestCandidate);
  }

  /**
   * Resolves all matching resource candidates in priority order.
   * Uses the resource's associated decision to determine all matching candidates based on the current context.
   * @param resource - The {@link Resources.Resource | resource} to resolve.
   * @returns `Success` with an array of all matching candidates in priority order if successful,
   * or `Failure` with an error message if no candidates match or resolution fails.
   * @public
   */
  public resolveAllResourceCandidates(resource: IResource): Result<ReadonlyArray<IResourceCandidate>> {
    // Get the abstract decision from the resource's concrete decision
    const abstractDecision = resource.decision.baseDecision;

    // Resolve the decision to get candidate indices in priority order
    const decisionResult = this.resolveDecision(abstractDecision);
    /* c8 ignore next 3 - defense in depth almost impossible to hit */
    if (decisionResult.isFailure()) {
      return fail(`Failed to resolve decision for resource "${resource.id}": ${decisionResult.message}`);
    }

    const resolution = decisionResult.value;

    // Check if any candidates matched
    if (!resolution.success || resolution.instanceIndices.length === 0) {
      return fail(`No matching candidates found for resource "${resource.id}"`);
    }

    // Get all matching candidates in priority order
    const candidates: IResourceCandidate[] = [];
    for (const candidateIndex of resolution.instanceIndices) {
      if (candidateIndex >= resource.candidates.length) {
        return fail(`Invalid candidate index ${candidateIndex} for resource "${resource.id}"`);
      }

      const candidate = resource.candidates[candidateIndex];
      candidates.push(candidate);
    }

    return succeed(candidates);
  }

  /**
   * Resolves a resource to a composed value by merging matching candidates according to their merge methods.
   * Starting from the highest priority candidates, finds the first "full" candidate and merges all higher
   * priority "partial" candidates into it in ascending order of priority.
   * @param resource - The {@link Resources.Resource | resource} to resolve.
   * @returns `Success` with the composed JsonValue if successful,
   * or `Failure` with an error message if no candidates match or resolution fails.
   * @public
   */
  public resolveComposedResourceValue(resource: IResource): Result<JsonValue> {
    return this.resolveAllResourceCandidates(resource).onSuccess((candidates) => {
      /* c8 ignore next 3 - defense in depth should never occur */
      if (candidates.length === 0) {
        return fail(`${resource.id}: No matching candidates found.`);
      }

      // Find the first full candidate and collect all partial candidates above it
      let fullCandidateIndex = -1;
      const partialCandidates: IResourceCandidate[] = [];

      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        if (!candidate.isPartial) {
          // Found the first full candidate
          fullCandidateIndex = i;
          break;
        } else {
          // Collect partial candidates (these are in ascending priority order)
          partialCandidates.unshift(candidate);
        }
      }

      // If no full candidate found, use the last candidate as the base
      const baseCandidateIndex = fullCandidateIndex >= 0 ? fullCandidateIndex : candidates.length - 1;
      const baseCandidate = candidates[baseCandidateIndex];

      // If there are no partial candidates to merge, return the base candidate's value
      if (partialCandidates.length === 0) {
        return succeed(baseCandidate.json);
      }

      const allCandidates = [
        baseCandidate.json,
        ...partialCandidates.map((candidate) => candidate.json)
      ].filter((v): v is JsonObject => isJsonObject(v));

      /* c8 ignore next 3 - defensive check: non-object values in resource candidates should be prevented at validation time */
      if (allCandidates.length !== partialCandidates.length + 1) {
        return fail(`${resource.id}: Unable to compose non-object candidate values.`);
      }

      return JsonEditor.default
        .mergeObjectsInPlace({}, allCandidates)
        .withErrorFormat((err) => `${resource.id}: Composition failed: ${err}`);
    });
  }

  /**
   * Clears all caches (condition, condition set, and decision), forcing all cached items
   * to be re-evaluated on next access. This should be called when the context changes and cached
   * results are no longer valid.
   * @public
   */
  public clearConditionCache(): void {
    this._conditionCache.fill(undefined);
    this._conditionSetCache.fill(undefined);
    this._decisionCache.fill(undefined);

    this._listener?.onCacheClear('condition');
    this._listener?.onCacheClear('conditionSet');
    this._listener?.onCacheClear('decision');
  }

  /**
   * Gets the current size of the condition cache array.
   * @returns The size of the condition cache array.
   * @public
   */
  public get conditionCacheSize(): number {
    return this._conditionCache.length;
  }

  /**
   * Gets the current size of the condition set cache array.
   * @returns The size of the condition set cache array.
   * @public
   */
  public get conditionSetCacheSize(): number {
    return this._conditionSetCache.length;
  }

  /**
   * Gets the current size of the decision cache array.
   * @returns The size of the decision cache array.
   * @public
   */
  public get decisionCacheSize(): number {
    return this._decisionCache.length;
  }

  /**
   * Compares two resolved conditions by their index.
   * @param c1Index - The index of the first condition.
   * @param c2Index - The index of the second condition.
   * @returns The comparison result.
   * @throws An error if either condition has an invalid index or has not been resolved.
   * @public
   */
  public compareResolvedConditions(c1Index: number, c2Index: number): number {
    const c1 = this.resourceManager.conditions.getAt(c1Index).orThrow();
    const c2 = this.resourceManager.conditions.getAt(c2Index).orThrow();
    const c1Score = this._conditionCache[c1Index];
    const c2Score = this._conditionCache[c2Index];

    if (c1Score === undefined) {
      throw new Error(`${c1Index}: cannot compare - condition has not been resolved.`);
    }

    if (c2Score === undefined) {
      throw new Error(`${c2Index}: cannot compare - condition has not been resolved.`);
    }

    if (c1 === c2) {
      return 0;
    }

    if (c1Score === NoMatch) {
      if (c2Score === NoMatch) {
        return 0;
      }
      return 1;
    } else if (c2Score === NoMatch) {
      return -1;
    }

    if (c1.priority === c2.priority) {
      return c2Score - c1Score;
    }

    return c2.priority - c1.priority;
  }
}
