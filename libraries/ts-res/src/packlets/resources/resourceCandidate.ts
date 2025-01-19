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

import { JsonValue } from '@fgv/ts-json-base';
import { ResourceId } from '../common';
import { Condition, ConditionSet } from '../conditions';
import { QualifierMap } from '../qualifiers';
import * as ResourceJson from '../resource-json';
import { IResourceType, ResourceTypeManager } from './resourceTypeManager';
import { captureResult, MessageAggregator, Result, succeed } from '@fgv/ts-utils';

/**
 * Parameters to create a {@link ResourceCandidate | ResourceCandidate}.
 * @public
 */
export interface IResourceCandidateCreateParams {
  decl: ResourceJson.IResourceCandidateDecl;
  parentConditions: ReadonlyArray<Condition>;
  qualifiers: QualifierMap;
  resourceTypes: ResourceTypeManager;
}

/**
 * A {@link ResourceCandidate | resource candidate} represents a single possible
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
  public readonly mergeMethod: ResourceJson.ResourceValueMergeMethod;

  /**
   * The {@link IResourceType | resource type} for the resource to which
   * this candidate belongs.
   */
  public get resourceType(): IResourceType | undefined {
    return this._resourceType;
  }

  private _resourceType: IResourceType | undefined;

  /**
   * Constructor for a {@link ResourceCandidate | ResourceCandidate} object.
   * @param params - Parameters to create a new {@link ResourceCandidate | ResourceCandidate}.
   * @public
   */
  protected constructor(params: IResourceCandidateCreateParams) {
    this.id = params.decl.id;
    this.json = params.decl.json;
    this.conditions = ResourceCandidate._mergeConditions(
      params.qualifiers,
      params.decl.conditions,
      params.parentConditions
    )
      .onSuccess((conditions) => ConditionSet.create({ conditions }))
      .orThrow();
    this.isPartial = params.decl.isPartial ?? false;
    this.mergeMethod = params.decl.mergeMethod ?? 'replace';
    this._resourceType = params.decl.resourceTypeName
      ? params.resourceTypes.getResourceType(params.decl.resourceTypeName).orThrow()
      : undefined;
    if (this._resourceType) {
      this._resourceType.validateDeclaration(this.json, this.isPartial, this.mergeMethod).orThrow();
    }
  }

  /**
   * Creates a new {@link ResourceCandidate | ResourceCandidate} object.
   * @param params - Parameters to create a new {@link ResourceCandidate | ResourceCandidate}.
   * @returns `Success` with the new {@link ResourceCandidate | ResourceCandidate} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(params: IResourceCandidateCreateParams): Result<ResourceCandidate> {
    return captureResult(() => new ResourceCandidate(params));
  }

  /**
   * Extracts the {@link IResourceType | resource type} from a list of {@link ResourceCandidate | resource candidates},
   * if present.
   * @param candidates - The list of candidates from which to extract the resource type.
   * @returns `Success` with the resource type if successful, `Success` with `undefined` if none of the candidates
   * specify a resource tap, and `Failure` with an error message if clients specify conflicting resource types.
   * @public
   */
  public static validateResourceTypes(
    candidates: ReadonlyArray<ResourceCandidate>,
    expectedType?: IResourceType
  ): Result<IResourceType | undefined> {
    const errors = new MessageAggregator();
    let selectedType: IResourceType | undefined = expectedType;
    for (const candidate of candidates) {
      if (selectedType === undefined) {
        selectedType = candidate.resourceType;
      } else if (candidate.resourceType && selectedType !== candidate.resourceType) {
        errors.addMessage(
          `${candidate.id}: resource type mismatch (${selectedType.name} != ${candidate.resourceType?.name})`
        );
      }
    }
    return errors.returnOrReport(succeed(selectedType));
  }

  /**
   * Compares two {@link ResourceCandidate | ResourceCandidates} for sorting purposes.
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
   * Validates declared conditions and merges them with parent conditions.
   * @param qualifiers - The {@link QualifierMap | qualifiers} to use when creating conditions.
   * @param declared - The declared conditions for the candidate.
   * @param parent - The parent conditions to merge with the declared conditions.
   * @returns `Success` with the merged conditions if successful, `Failure` otherwise.
   * @internal
   */
  private static _mergeConditions(
    qualifiers: QualifierMap,
    declared: ResourceJson.ConditionSetDecl | undefined,
    parent: ReadonlyArray<Condition> | undefined
  ): Result<Condition[]> {
    const errors = new MessageAggregator();
    const conditions = Array.from(parent ?? []);

    for (const [qualifierName, value] of Object.entries(declared ?? {})) {
      Condition.create({
        qualifierName,
        value: value as string,
        qualifierMap: qualifiers
      })
        .aggregateError(errors)
        .onSuccess((condition) => {
          conditions.push(condition);
          return succeed(condition);
        });
    }

    return errors.returnOrReport(succeed(conditions));
  }
}
