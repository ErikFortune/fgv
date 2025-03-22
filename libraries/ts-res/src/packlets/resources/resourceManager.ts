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
  captureResult,
  Collections,
  DetailedResult,
  failWithDetail,
  MessageAggregator,
  Result,
  succeed,
  succeedWithDetail,
  ValidatingResultMap
} from '@fgv/ts-utils';
import {
  ConditionCollector,
  ConditionSetCollector,
  ReadOnlyConditionCollector,
  ReadOnlyConditionSetCollector
} from '../conditions';
import { AbstractDecisionCollector, ReadOnlyAbstractDecisionCollector } from '../decisions';
import { IReadOnlyQualifierCollector } from '../qualifiers';
import { ReadOnlyResourceTypeCollector } from '../resource-types';
import { Convert, ResourceId, Validate } from '../common';
import { ResourceBuilder, ResourceBuilderResultDetail } from './resourceBuilder';
import { Resource } from './resource';
import { ResourceCandidate } from './resourceCandidate';
import * as ResourceJson from '../resource-json';

/**
 * Interface for parameters to the {@link Resources.ResourceManager.create | ResourceManager create method}.
 * @public
 */
export interface IResourceManagerCreateParams {
  qualifiers: IReadOnlyQualifierCollector;
  resourceTypes: ReadOnlyResourceTypeCollector;
}

/**
 * Error details that can be returned by a {@link Resources.ResourceManager | ResourceManager}.
 * @public
 */
export type ResourceManagerResultDetail = Collections.ResultMapResultDetail | ResourceBuilderResultDetail;

/**
 * Represents a manager for a collection of {@link Resources.Resource | resources}.  Collects
 * {@link Resources.ResourceCandidate | candidates} for each resource into a
 * {@link Resources.ResourceBuilder | ResourceBuilder} per resource, validates them against each other,
 * and builds a collection of {@link Resources.Resource | resources} once all candidates are collected.
 * @public
 */
export class ResourceManager {
  public readonly qualifiers: IReadOnlyQualifierCollector;
  public readonly resourceTypes: ReadOnlyResourceTypeCollector;

  protected readonly _conditions: ConditionCollector;
  protected readonly _conditionSets: ConditionSetCollector;
  protected readonly _decisions: AbstractDecisionCollector;
  protected readonly _resources: ValidatingResultMap<ResourceId, ResourceBuilder>;
  protected readonly _builtResources: ValidatingResultMap<ResourceId, Resource>;
  protected _built: boolean;

  /**
   * A {@link Conditions.ConditionCollector | ConditionCollector} which
   * contains the {@link Conditions.Condition | conditions} used so far by
   * the {@link Resources.ResourceCandidate | resource candidates} in this manager.
   */
  public get conditions(): ReadOnlyConditionCollector {
    return this._conditions;
  }

  /**
   * A {@link Conditions.ConditionSetCollector | ConditionSetCollector} which
   * contains the {@link Conditions.ConditionSet | condition sets} used so far by
   * the {@link Resources.ResourceCandidate | resource candidates} in this manager.
   */
  public get conditionSets(): ReadOnlyConditionSetCollector {
    return this._conditionSets;
  }

  /**
   * A {@link Decisions.AbstractDecisionCollector | AbstractDecisionCollector} which
   * contains the {@link Decisions.Decision | abstract decisions} used so far by
   * the {@link Resources.ResourceCandidate | resource candidates} in this manager.
   */
  public get decisions(): ReadOnlyAbstractDecisionCollector {
    return this._decisions;
  }

  /**
   * A read-only map of {@link Resources.ResourceBuilder | resource builders} used by the manager.
   */
  public get resources(): Collections.IReadOnlyValidatingResultMap<ResourceId, ResourceBuilder> {
    return this._resources;
  }

  /**
   * The number of {@link Resources.Resource | resources} contained by the manager.
   */
  public get size(): number {
    return this._resources.size;
  }

  /**
   * Constructor for a {@link Resources.ResourceManager | ResourceManager} object.
   * @param params - Parameters to create a new {@link Resources.ResourceManager | ResourceManager}.
   * @public
   */
  protected constructor(params: IResourceManagerCreateParams) {
    this.qualifiers = params.qualifiers;
    this.resourceTypes = params.resourceTypes;
    this._conditions = ConditionCollector.create({ qualifiers: params.qualifiers }).orThrow();
    this._conditionSets = ConditionSetCollector.create({ conditions: this._conditions }).orThrow();
    this._decisions = AbstractDecisionCollector.create({ conditionSets: this._conditionSets }).orThrow();
    this._resources = new ValidatingResultMap({
      converters: new Collections.KeyValueConverters<ResourceId, ResourceBuilder>({
        key: Convert.resourceId,
        /* c8 ignore next 2 - defense in depth against internal error */
        value: (from: unknown) =>
          from instanceof ResourceBuilder ? succeed(from) : fail('not a resource builder')
      })
    });
    this._builtResources = new ValidatingResultMap({
      converters: new Collections.KeyValueConverters<ResourceId, Resource>({
        key: Convert.resourceId,
        /* c8 ignore next 1 - defense in depth against internal error */
        value: (from: unknown) => (from instanceof Resource ? succeed(from) : fail('not a resource'))
      })
    });
    this._built = false;
  }

  /**
   * Creates a new {@link Resources.ResourceManager | ResourceManager} object.
   * @param params - Parameters to create a new {@link Resources.ResourceManager | ResourceManager}.
   * @returns `Success` with the new {@link Resources.ResourceManager | ResourceManager} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(params: IResourceManagerCreateParams): Result<ResourceManager> {
    return captureResult(() => new ResourceManager(params));
  }

  /**
   * Given a {@link ResourceJson.Json.ILooseResourceCandidateDecl | resource candidate declaration}, builds and adds
   * a {@link Resources.ResourceCandidate | candidate} to the manager.
   * @param candidate - The {@link Resources.ResourceCandidate | candidate} to add.
   * @returns `Success` with the candidate if successful, or `Failure` with an error message if not.
   * @public
   */
  public addCandidate(
    decl: ResourceJson.Json.ILooseResourceCandidateDecl
  ): DetailedResult<ResourceCandidate, ResourceManagerResultDetail> {
    const { value: id, message } = Validate.toResourceId(decl.id);
    if (message !== undefined) {
      return failWithDetail(`${decl.id}: invalid id - ${message}`, 'failure');
    }

    const builderResult = this._resources.getOrAdd(id, () =>
      ResourceBuilder.create({
        id,
        resourceTypes: this.resourceTypes,
        conditionSets: this._conditionSets
      })
    );
    /* c8 ignore next 6 - defense in depth against internal error */
    if (builderResult.isFailure()) {
      return failWithDetail(
        `${id}: unable to get or add resource\n${builderResult.message}`,
        builderResult.detail
      );
    }
    return builderResult.value.addCandidate(decl).onSuccess((c, d) => {
      this._builtResources.delete(id);
      this._built = false;
      return succeedWithDetail(c, d);
    });
  }

  /**
   * Gets an individual {@link Resources.Resource | built resource} from the manager.
   * @param id - The {@link ResourceId | id} of the resource to get.
   * @returns `Success` with the resource if successful, or `Failure` with an error message if not.
   * @public
   */
  public getBuiltResource(id: string): Result<Resource> {
    return this._resources.validating
      .get(id)
      .onSuccess((builder) => this._builtResources.validating.getOrAdd(id, () => builder.build()));
  }

  /**
   * Builds the {@link Resources.Resource | resources} from the collected {@link Resources.ResourceCandidate | candidates}.
   * @returns `Success` with a read-only map of {@link Resources.Resource | resources} if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public build(): Result<Collections.IReadOnlyValidatingResultMap<ResourceId, Resource>> {
    if (!this._built) {
      const errors: MessageAggregator = new MessageAggregator();
      this._resources.forEach((r, id) => {
        this._builtResources.getOrAdd(id, () => r.build()).aggregateError(errors);
      });
      /* c8 ignore next 3 - defense in depth against internal error */
      if (errors.hasMessages) {
        return fail(`build failed: ${errors.toString()}`);
      }
      this._built = true;
    }
    return succeed(this._builtResources);
  }
}
