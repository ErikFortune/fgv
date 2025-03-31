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

import { MessageAggregator, Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { ResourceId, Validate } from '../common';
import { ResourceCandidate } from './resourceCandidate';
import { ResourceType } from '../resource-types';
import * as ResourceJson from '../resource-json';

/**
 * Parameters used to create a {@link Resources.Resource | Resource} object.
 * @public
 */
export interface IResourceCreateParams {
  /**
   * The id of the resource.
   */
  id?: string;
  /**
   * Optional {@link ResourceTypes.ResourceType | type} of the resource. If not specified, the type will be inferred
   * from the candidates.
   */
  resourceType?: ResourceType;
  /**
   * Array of {@link Resources.ResourceCandidate | candidates} for the resource.
   */
  candidates: ReadonlyArray<ResourceCandidate>;
}

/**
 * Represents a single logical resource, with a unique id and a set of possible
 * candidate instances.
 * @public
 */
export class Resource {
  /**
   * The unique {@link ResourceId | id} of the resource.
   */
  public readonly id: ResourceId;
  /**
   * The {@link ResourceTypes.ResourceType | type} of the resource.
   */
  public readonly resourceType: ResourceType;
  /**
   * The array of {@link Resources.ResourceCandidate | candidates} for the resource.
   */
  public readonly candidates: ReadonlyArray<ResourceCandidate>;

  /**
   * Constructor for a {@link Resources.Resource | Resource} object.
   * @param params - {@link Resources.IResourceCreateParams | Parameters} used to create the resource.
   * @public
   */
  protected constructor(params: IResourceCreateParams) {
    if (params.candidates.length === 0) {
      throw new Error(`${params.id ?? 'resource constructor'}: no candidates specified.`);
    }

    const id = params.id ? Validate.toResourceId(params.id).orThrow() : undefined;
    this.id = Resource._validateCandidateResourceIds(id, params.candidates).orThrow();
    this.resourceType = ResourceCandidate.validateResourceTypes(params.candidates, params.resourceType)
      .onSuccess((t) => {
        if (t === undefined) {
          return fail<ResourceType>(`${params.id}: no type specified and no candidates with types.`);
        }
        return succeed(t);
      })
      .orThrow();

    this.candidates = Resource._validateAndNormalizeCandidates(params.candidates).orThrow();
  }

  /**
   * Creates a new {@link Resources.Resource | Resource} object.
   * @param params - {@link Resources.IResourceCreateParams | Parameters} used to create the resource.
   * @returns `Success` with the new {@link Resources.Resource | Resource} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(params: IResourceCreateParams): Result<Resource> {
    return captureResult(() => new Resource(params));
  }

  /**
   * Gets the {@link ResourceJson.Json.IChildResourceDecl | child resource declaration} for this resource.
   * @returns The {@link ResourceJson.Json.IChildResourceDecl | child resource declaration}.
   */
  public toChildResourceDecl(): ResourceJson.Json.IChildResourceDecl {
    const candidates = this.candidates.map((c) => c.toChildResourceCandidateDecl());
    return {
      resourceTypeName: this.resourceType.key,
      ...(candidates.length > 0 ? { candidates } : {})
    };
  }

  /**
   * Gets the {@link ResourceJson.Json.ILooseResourceDecl | loose resource declaration} for this resource.
   * @returns The {@link ResourceJson.Json.ILooseResourceDecl | loose resource declaration}.
   */
  public toLooseResourceDecl(): ResourceJson.Json.ILooseResourceDecl {
    const candidates = this.candidates.map((c) => c.toChildResourceCandidateDecl());
    return {
      id: this.id,
      resourceTypeName: this.resourceType.key,
      ...(candidates.length > 0 ? { candidates } : {})
    };
  }

  /**
   * Validates that all candidates have the same id as the resource.
   * @param resourceId - The expected id of the resource.
   * @param candidates - The array of candidates to validate.
   * @returns `Success` with the resource id if all candidates have the same id,
   * `Failure` with an error message otherwise.
   * @internal
   */
  private static _validateCandidateResourceIds(
    resourceId: ResourceId | undefined,
    candidates: ReadonlyArray<ResourceCandidate>
  ): Result<ResourceId> {
    resourceId = resourceId ?? candidates[0].id;

    const mismatched = candidates.filter((c) => c.id !== resourceId).map((c) => c.id);
    if (mismatched.length > 0) {
      return fail(`${resourceId}: candidates with mismatched ids ${mismatched.join(', ')}.`);
    }
    return succeed(resourceId);
  }

  /**
   * Validates and normalizes an array of {@link Resources.ResourceCandidate | candidates}. Fails if there
   * are multiple candidates for the same set of conditions.
   * @param candidates - The array of candidates to validate.
   * @returns `Success` with the validated and sorted array of candidates if successful,
   * `Failure` with an error message otherwise.
   * @internal
   */
  private static _validateAndNormalizeCandidates(
    candidates: ReadonlyArray<ResourceCandidate>
  ): Result<ReadonlyArray<ResourceCandidate>> {
    const errors = new MessageAggregator();
    const validated: Map<string, ResourceCandidate> = new Map();

    for (const candidate of candidates) {
      const conditionSetString = candidate.conditions.toString();
      const existing = validated.get(conditionSetString);
      if (existing) {
        if (!ResourceCandidate.equal(candidate, existing)) {
          errors.addMessage(`${candidate.id}: duplicate candidates for ${conditionSetString}.`);
        }
      } else {
        validated.set(conditionSetString, candidate);
      }
    }
    return errors.returnOrReport(
      succeed(Array.from(validated.values()).sort(ResourceCandidate.compare).reverse())
    );
  }
}
