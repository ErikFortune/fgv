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

import { Result, Collections } from '@fgv/ts-utils';
import { JsonObject } from '@fgv/ts-json-base';
import { ReadOnlyConditionCollector, ReadOnlyConditionSetCollector } from '../conditions';
import { ReadOnlyAbstractDecisionCollector, ConcreteDecision } from '../decisions';
import { ResourceId, ResourceValueMergeMethod } from '../common';
import { IResourceType } from '../resource-types';
import { IContextDecl, IValidatedContextDecl } from '../context';
import { IReadOnlyResourceTreeRoot } from './resource-tree';

/**
 * Runtime representation of a resource candidate with the minimal data needed for resolution.
 * @public
 */
export interface IResourceCandidate {
  /** The JSON value for this candidate */
  readonly json: JsonObject;

  /**
   * Indicates if this candidate is a partial resource.
   */
  readonly isPartial: boolean;

  /**
   * Specifies the resource type of this candidate.
   */
  readonly mergeMethod: ResourceValueMergeMethod;
}

/**
 * Interface for a resource that can be used in the runtime layer.
 * This provides the minimal properties needed from a resource without requiring
 * the full Resources layer dependencies.
 * @public
 */
export interface IResource {
  /** The resource identifier */
  readonly id: string;
  /** The resource name */
  readonly name: string;
  /** The resource type */
  readonly resourceType: IResourceType;
  /** The decision used to select candidates */
  readonly decision: ConcreteDecision;
  /** The available candidates for this resource */
  readonly candidates: ReadonlyArray<IResourceCandidate>;
}

/**
 * Interface defining the read-only properties that the runtime resource resolver needs
 * from a resource manager. This abstraction allows the runtime to work with different
 * implementations without requiring the full ResourceManagerBuilder build mechanics.
 * @public
 */
export interface IResourceManager<TR extends IResource = IResource> {
  /**
   * A {@link Conditions.ReadOnlyConditionCollector | ReadOnlyConditionCollector} which
   * contains the {@link Conditions.Condition | conditions} used by resource candidates.
   */
  readonly conditions: ReadOnlyConditionCollector;

  /**
   * A {@link Conditions.ReadOnlyConditionSetCollector | ReadOnlyConditionSetCollector} which
   * contains the {@link Conditions.ConditionSet | condition sets} used by resource candidates.
   */
  readonly conditionSets: ReadOnlyConditionSetCollector;

  /**
   * A {@link Decisions.ReadOnlyAbstractDecisionCollector | ReadOnlyAbstractDecisionCollector} which
   * contains the {@link Decisions.Decision | abstract decisions} used by resource candidates.
   */
  readonly decisions: ReadOnlyAbstractDecisionCollector;

  /**
   * Gets a built resource by ID for runtime resolution.
   * @param id - The resource identifier
   * @returns Success with the runtime resource if found, Failure otherwise
   */
  getBuiltResource(id: string): Result<TR>;

  /**
   * Gets a resource tree built from the resources in this resource manager.
   * @returns Result containing the resource tree root, or failure if tree construction fails
   */
  getBuiltResourceTree(): Result<IReadOnlyResourceTreeRoot<TR>>;

  /**
   * A read-only result map of all built resources, keyed by resource ID.
   * Resources are built on-demand when accessed and returns Results for error handling.
   */
  readonly builtResources: Collections.IReadOnlyValidatingResultMap<ResourceId, TR>;

  /**
   * The number of resources in this resource manager.
   */
  readonly numResources: number;

  /**
   * The resource IDs that this resource manager can resolve.
   */
  readonly resourceIds: ReadonlyArray<ResourceId>;

  /**
   * The number of candidates in this resource manager.
   */
  readonly numCandidates: number;

  /**
   * Validates a context declaration against the qualifiers managed by this resource manager.
   * @param context - The context declaration to validate
   * @returns Success with the validated context if successful, Failure otherwise
   */
  validateContext(context: IContextDecl): Result<IValidatedContextDecl>;
}
