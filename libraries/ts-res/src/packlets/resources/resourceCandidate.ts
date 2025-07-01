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

import { JsonObject, JsonValue } from '@fgv/ts-json-base';
import { ResourceId, ResourceValueMergeMethod, Validate } from '../common';
import { Condition, ConditionSet, ConditionSetCollector } from '../conditions';
import * as ResourceJson from '../resource-json';
import { ResourceType } from '../resource-types';
import { captureResult, mapResults, Hash, MessageAggregator, Result, fail, succeed } from '@fgv/ts-utils';
import * as Context from '../context';

/**
 * Parameters to create a {@link Resources.ResourceCandidate | ResourceCandidate}.
 * @public
 */
export interface IResourceCandidateCreateParams {
  id: string;
  decl: ResourceJson.Json.IChildResourceCandidateDecl;
  resourceType?: ResourceType;
  parentConditions?: ReadonlyArray<Condition>;
  conditionSets: ConditionSetCollector;
}

/**
 * A {@link Resources.ResourceCandidate | resource candidate} represents a single possible
 * instance value for some resource, with the conditions under which it applies
 * and instructions on how to merge it with other instances.
 * @public
 */
export class ResourceCandidate {
  /**
   * The unique identifier of the resource for which this candidate
   * is a possible instance.
   */
  public readonly id: ResourceId;

  /**
   * The JSON representation of the instance data to be applied.
   */
  public readonly json: JsonValue;

  /**
   * The conditions under which this candidate applies.
   */
  public readonly conditions: ConditionSet;

  /**
   * True if this candidate is a partial instance.
   */
  public readonly isPartial: boolean;

  /**
   * The method to use when merging this candidate with other instances.
   */
  public readonly mergeMethod: ResourceValueMergeMethod;

  /**
   * The {@link ResourceTypes.ResourceType | resource type} for the resource to which
   * this candidate belongs.
   */
  public readonly resourceType: ResourceType | undefined;

  /**
   * Constructor for a {@link Resources.ResourceCandidate | ResourceCandidate} object.
   * @param params - Parameters to create a new {@link Resources.ResourceCandidate | ResourceCandidate}.
   * @public
   */
  protected constructor(params: IResourceCandidateCreateParams) {
    this.id = Validate.toResourceId(params.id).orThrow();
    this.json = params.decl.json;
    this.conditions = ResourceCandidate._mergeConditions(
      params.conditionSets,
      params.decl.conditions,
      params.parentConditions
    ).orThrow();
    this.isPartial = params.decl.isPartial ?? false;
    this.mergeMethod = params.decl.mergeMethod ?? 'augment';
    this.resourceType = params.resourceType;
    if (this.resourceType) {
      this.resourceType.validateDeclaration(this).orThrow();
    }
  }

  /**
   * Creates a new {@link Resources.ResourceCandidate | ResourceCandidate} object.
   * @param params - Parameters to create a new {@link Resources.ResourceCandidate | ResourceCandidate}.
   * @returns `Success` with the new {@link Resources.ResourceCandidate | ResourceCandidate} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(params: IResourceCandidateCreateParams): Result<ResourceCandidate> {
    return captureResult(() => new ResourceCandidate(params));
  }

  /**
   * Determines if this candidate can match the supplied context (possibly partial).
   * @param context - The context to match.
   * @param options - Options to use when matching.
   * @returns `true` if the candidate can match the context, `false` otherwise.
   */
  public canMatchPartialContext(
    context: Context.IValidatedContextDecl,
    options?: Context.IContextMatchOptions
  ): boolean {
    return this.conditions.canMatchPartialContext(context, options);
  }

  /**
   * Gets the {@link ResourceJson.Json.IChildResourceCandidateDecl | child resource candidate declaration}
   * for this candidate.
   * @param options - {@link ResourceJson.Helpers.IDeclarationOptions | options} to use when creating the declaration.
   * @returns The {@link ResourceJson.Json.IChildResourceCandidateDecl | child resource candidate declaration}.
   */
  public toChildResourceCandidateDecl(
    options?: ResourceJson.Helpers.IDeclarationOptions
  ): ResourceJson.Json.IChildResourceCandidateDecl {
    const showDefaults = options?.showDefaults === true;
    return {
      json: this.json as JsonObject,
      conditions: this.conditions.toConditionSetRecordDecl(options),
      ...(showDefaults || this.isPartial ? { isPartial: this.isPartial } : {}),
      ...(showDefaults || this.mergeMethod !== 'augment' ? { mergeMethod: this.mergeMethod } : {})
    };
  }

  /**
   * Gets the {@link ResourceJson.Json.ILooseResourceCandidateDecl | loose resource candidate declaration}
   * for this candidate.
   * @param options - {@link ResourceJson.Helpers.IDeclarationOptions | options} to use when creating the declaration.
   * @returns The {@link ResourceJson.Json.ILooseResourceCandidateDecl | loose resource candidate declaration}.
   */
  public toLooseResourceCandidateDecl(
    options?: ResourceJson.Helpers.IDeclarationOptions
  ): ResourceJson.Json.ILooseResourceCandidateDecl {
    const showDefaults = options?.showDefaults === true;
    const resourceTypeName = this.resourceType?.key;
    return {
      id: this.id.toString(),
      json: this.json as JsonObject,
      conditions: this.conditions.toConditionSetRecordDecl(options),
      ...(showDefaults || this.isPartial ? { isPartial: this.isPartial } : {}),
      ...(showDefaults || this.mergeMethod !== 'augment' ? { mergeMethod: this.mergeMethod } : {}),
      ...(resourceTypeName ? { resourceTypeName } : {})
    };
  }

  /**
   * Extracts the {@link ResourceTypes.ResourceType | resource type} from a list of {@link Resources.ResourceCandidate | resource candidates},
   * if present.
   * @param candidates - The list of candidates from which to extract the resource type.
   * @returns `Success` with the resource type if successful, `Success` with `undefined` if none of the candidates
   * specify a resource tap, and `Failure` with an error message if clients specify conflicting resource types.
   * @public
   */
  public static validateResourceTypes(
    candidates: ReadonlyArray<ResourceCandidate>,
    expectedType?: ResourceType
  ): Result<ResourceType | undefined> {
    const errors = new MessageAggregator();
    let selectedType: ResourceType | undefined = expectedType;
    for (const candidate of candidates) {
      if (selectedType === undefined) {
        selectedType = candidate.resourceType;
      } else if (candidate.resourceType && selectedType !== candidate.resourceType) {
        errors.addMessage(
          `${candidate.id}: resource type mismatch (${selectedType.key} != ${candidate.resourceType.key})`
        );
      }
    }
    return errors.returnOrReport(succeed(selectedType));
  }

  /**
   * Compares two {@link Resources.ResourceCandidate | ResourceCandidates} for sorting purposes.
   * @param rc1 - The first candidate to compare.
   * @param rc2 - The second candidate to compare.
   * @returns A negative number if `rc1` should come before `rc2`, a positive number if `rc2` should come before `rc1`,
   * or zero if they are equivalent.
   * @public
   */
  public static compare(rc1: ResourceCandidate, rc2: ResourceCandidate): number {
    return ConditionSet.compare(rc1.conditions, rc2.conditions);
  }

  /**
   * Compares two {@link Resources.ResourceCandidate | ResourceCandidates} for equality.
   * @param rc1 - The first candidate to compare.
   * @param rc2 - The second candidate to compare.
   * @returns `true` if the candidates are equal, `false` otherwise.
   * @public
   */
  public static equal(rc1: ResourceCandidate, rc2: ResourceCandidate): boolean {
    if (rc1 === rc2) {
      return true;
    }
    let equal =
      rc1.id === rc2.id &&
      rc1.isPartial === rc2.isPartial &&
      rc1.mergeMethod === rc2.mergeMethod &&
      ConditionSet.compare(rc1.conditions, rc2.conditions) === 0;
    if (equal) {
      const normalizer = new Hash.Crc32Normalizer();
      const n1 = normalizer.computeHash(rc1.json).orDefault('(n1 normalization failed)');
      const n2 = normalizer.computeHash(rc2.json).orDefault('(n2 normalization failed)');
      equal = n1 === n2;
    }
    return equal;
  }

  /**
   * Validates declared conditions and merges them with parent conditions.
   * @param conditionSets - The {@link Conditions.ConditionSetCollector | condition set collector}
   * to use for this candidate.
   * @param declared - The declared conditions for the candidate.
   * @param parent - The parent conditions to merge with the declared conditions.
   * @returns `Success` with the merged conditions if successful, `Failure` otherwise.
   * @internal
   */
  private static _mergeConditions(
    conditionSets: ConditionSetCollector,
    declared: ResourceJson.Json.ConditionSetDecl | undefined,
    parent: ReadonlyArray<Condition> | undefined
  ): Result<ConditionSet> {
    /* c8 ignore next 2 - code coverage is flaky */
    declared = declared ?? {};
    parent = parent ?? [];

    const { value: conditionDecls, message } = ResourceJson.Convert.conditionSetDecl.convert(declared);
    if (message !== undefined) {
      return fail(message);
    }

    return mapResults(
      // get or add all declared conditions from our condition collector
      conditionDecls.map((decl) => conditionSets.conditions.validating.getOrAdd(decl))
    ).onSuccess((declaredConditions) => {
      // make sure our parent conditions all come from our condition collector too
      return mapResults(parent.map((c) => conditionSets.conditions.getOrAdd(c))).onSuccess(
        (parentConditions) => {
          const conditions = [...parentConditions, ...declaredConditions];
          return conditionSets.validating.getOrAdd(conditions);
        }
      );
    });
  }
}
