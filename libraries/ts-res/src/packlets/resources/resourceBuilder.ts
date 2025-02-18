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

import {
  Collections,
  DetailedResult,
  Result,
  ResultMap,
  captureResult,
  fail,
  failWithDetail,
  succeedWithDetail
} from '@fgv/ts-utils';
import { ResourceId, Validate } from '../common';
import { ResourceCandidate } from './resourceCandidate';
import { ReadOnlyResourceTypeCollector, ResourceType } from '../resource-types';
import { Resource } from './resource';

/**
 * Parameters for creating a {@link Resources.ResourceBuilder}.
 * @public
 */
export interface IResourceBuilderCreateParams {
  id: string;
  typeName?: string;
  resourceTypes: ReadOnlyResourceTypeCollector;
}

/**
 * Possible result details returned by the resource builder
 * {@link Resources.ResourceBuilder.addCandidate | addCandidate} method.
 * @public
 */
export type ResourceBuilderResultDetail = Collections.ResultMapResultDetail | 'type-mismatch';

/**
 * Represents a builder for a single logical {@link Resources.Resource | resource}.  Collects candidates
 * with a common resource ID, validates them against each other and builds a {@link Resources.Resource | resource}
 * object once all candidates are collected.
 * @public
 */
export class ResourceBuilder {
  /**
   * The unique {@link ResourceId | id} of the resource being built.
   */
  public readonly id: ResourceId;

  /**
   * Supplied or inferred {@link ResourceTypes.ResourceType | type} of the resource being built.
   * If no type is supplied, the type will be inferred from the candidates - at least one candidate must
   * define resource type and all candidates must be of the same type.
   */
  public get resourceType(): ResourceType | undefined {
    return this._resourceType;
  }

  /**
   * Array of {@link Resources.ResourceCandidate | candidates} for the resource being built.
   */
  public get candidates(): ResourceCandidate[] {
    return Array.from(this._candidates.values()).sort(ResourceCandidate.compare);
  }

  /**
   * The supplied or inferred {@link ResourceTypes.ResourceType | type} of the resource
   * being built.
   */
  protected _resourceType: ResourceType | undefined;

  /**
   * Map of {@link Resources.ResourceCandidate | candidates} for the resource being built.
   */
  protected _candidates: ResultMap<string, ResourceCandidate>;

  /**
   * Map of all known {@link ResourceTypes.ResourceType | resource types}.
   */
  protected _resourceTypes: ReadOnlyResourceTypeCollector;

  /**
   * Constructor for a {@link Resources.ResourceBuilder | ResourceBuilder} object.
   * @param params - Parameters to construct the new {@link Resources.ResourceBuilder | ResourceBuilder}.
   */
  protected constructor(params: IResourceBuilderCreateParams) {
    this.id = Validate.toResourceId(params.id).orThrow();
    this._resourceTypes = params.resourceTypes;
    this._candidates = new ResultMap<string, ResourceCandidate>();
    if (params.typeName) {
      this._resourceType = this._resourceTypes.validating.get(params.typeName).orThrow();
    }
  }

  /**
   * Creates a new {@link Resources.ResourceBuilder | ResourceBuilder} object.
   * @param params - Parameters to create a new {@link Resources.ResourceBuilder | ResourceBuilder}.
   * @returns `Success` with the new {@link Resources.ResourceBuilder | ResourceBuilder} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(params: IResourceBuilderCreateParams): Result<ResourceBuilder> {
    return captureResult(() => new ResourceBuilder(params));
  }

  /**
   * Adds a {@link Resources.ResourceCandidate | candidate} to the resource being built.
   * @param candidate - The {@link Resources.ResourceCandidate | candidate} to add to the resource being built.
   * @returns `Success` with the added {@link Resources.ResourceCandidate | candidate} if successful,
   * or `Failure` with an error message if not. Fails with error detail 'type-mismatch' if the candidate
   * specifies a different resource type than previously added candidates, or with 'exists' if a candidate
   * already exists with the same conditions but different values.  Succeeds with 'exists' and returns the
   * existing candidate if the candidate to be added is identical to an existing candidate.
   */
  public addCandidate(
    candidate: ResourceCandidate
  ): DetailedResult<ResourceCandidate, ResourceBuilderResultDetail> {
    if (
      this._resourceType !== undefined &&
      candidate.resourceType !== undefined &&
      this._resourceType !== candidate.resourceType
    ) {
      return failWithDetail<ResourceCandidate, ResourceBuilderResultDetail>(
        `${this.id}: conflicting resource types.`,
        'type-mismatch'
      );
    }

    return this._candidates
      .getOrAdd(candidate.conditions.toString(), candidate)
      .onSuccess((added, detail) => {
        if (detail === 'exists') {
          if (!ResourceCandidate.equal(added, candidate)) {
            return failWithDetail<ResourceCandidate, Collections.ResultMapResultDetail>(
              `${this.id}: conflicting candidates.`,
              'exists'
            );
          }
        }
        if (this._resourceType === undefined && added.resourceType !== undefined) {
          this._resourceType = added.resourceType;
        }
        return succeedWithDetail(added, detail);
      });
  }

  /**
   * Builds the {@link Resources.Resource | resource} object from this builder.
   * @returns `Success` with the new {@link Resources.Resource | Resource} object if successful,
   * or `Failure` with an error message if not. Fails if no candidates have been added
   * or if the resource type is not defined.
   */
  public build(): Result<Resource> {
    if (this._candidates.size === 0) {
      return fail(`${this.id}: no candidates supplied.`);
    }

    if (this._resourceType === undefined) {
      return fail(`${this.id}: no resource type supplied or inferred.`);
    }
    return Resource.create({ id: this.id, resourceType: this._resourceType, candidates: this.candidates });
  }
}
