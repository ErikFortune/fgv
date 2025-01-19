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
import { ResourceId } from '../common';
import { ResourceCandidate } from './resourceCandidate';
import { IResourceType } from './resourceTypeManager';

/**
 * Parameters used to create a {@link Resource | Resource} object.
 * @public
 */
export interface IResourceCreateParams {
  /**
   * The id of the resource.
   */
  id: ResourceId;
  /**
   * Optional {@link IResourceType | type} of the resource. If not specified, the type will be inferred
   * from the candidates.
   */
  type?: IResourceType;
  /**
   * Array of {@link ResourceCandidate | candidates} for the resource.
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
   * The {@link IResourceType | type} of the resource.
   */
  public readonly type: IResourceType;
  /**
   * The array of {@link ResourceCandidate | candidates} for the resource.
   */
  public readonly candidates: ReadonlyArray<ResourceCandidate>;

  /**
   * Constructor for a {@link Resource | Resource} object.
   * @param params - {@link IResourceCreateParams | Parameters} used to create the resource.
   * @public
   */
  protected constructor(params: IResourceCreateParams) {
    this.id = Resource._validateCandidateResourceIds(params.id, params.candidates).orThrow();
    this.type = ResourceCandidate.validateResourceTypes(params.candidates, params.type)
      .onSuccess((t) => {
        if (t === undefined) {
          return fail<IResourceType>(`${params.id}: no type specified and no candidates with types.`);
        }
        return succeed(t);
      })
      .orThrow();

    this.candidates = Resource._validateAndNormalizeCandidates(params.candidates).orThrow();
  }

  /**
   * Creates a new {@link Resource | Resource} object.
   * @param params - {@link IResourceCreateParams | Parameters} used to create the resource.
   * @returns `Success` with the new {@link Resource | Resource} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(params: IResourceCreateParams): Result<Resource> {
    return captureResult(() => new Resource(params));
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
    resourceId: ResourceId,
    candidates: ReadonlyArray<ResourceCandidate>
  ): Result<ResourceId> {
    const mismatched = candidates.filter((c) => c.id !== resourceId).map((c) => c.id);
    if (mismatched.length > 0) {
      return fail(`${resourceId}: candidates with mismatched ids ${mismatched.join(', ')}.`);
    }
    return succeed(resourceId);
  }

  /**
   * Validates and normalizes an array of {@link ResourceCandidate | candidates}. Fails if there
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

    const conditionSetStrings = new Set<string>();
    for (const candidate of candidates) {
      const conditionSetString = candidate.conditions.toString();
      if (conditionSetStrings.has(conditionSetString)) {
        errors.addMessage(`${candidate.id}: duplicate candidates for ${conditionSetString}.`);
      } else {
        conditionSetStrings.add(conditionSetString);
      }
    }
    return errors.returnOrReport(succeed(Array.from(candidates).sort(ResourceCandidate.compare)));
  }
}
