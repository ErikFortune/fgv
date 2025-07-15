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
  fail,
  failWithDetail,
  Hash,
  mapResults,
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
import { IResourceManager, IResource } from '../runtime';
import { ResourceBuilder, ResourceBuilderResultDetail } from './resourceBuilder';
import { Resource } from './resource';
import { ResourceCandidate } from './resourceCandidate';
import * as ResourceJson from '../resource-json';
import * as Context from '../context';

/**
 * Interface for parameters to the {@link Resources.ResourceManagerBuilder.create | ResourceManagerBuilder create method}.
 * @public
 */
export interface IResourceManagerBuilderCreateParams {
  qualifiers: IReadOnlyQualifierCollector;
  resourceTypes: ReadOnlyResourceTypeCollector;
}

/**
 * Error details that can be returned by a {@link Resources.ResourceManagerBuilder | ResourceManagerBuilder}.
 * @public
 */
export type ResourceManagerBuilderResultDetail =
  | Collections.ResultMapResultDetail
  | ResourceBuilderResultDetail;

/**
 * Builder for a collection of {@link Resources.Resource | resources}. Collects
 * {@link Resources.ResourceCandidate | candidates} for each resource into a
 * {@link Resources.ResourceBuilder | ResourceBuilder} per resource, validates them against each other,
 * and builds a collection of {@link Resources.Resource | resources} once all candidates are collected.
 * @public
 */
export class ResourceManagerBuilder implements IResourceManager {
  public readonly qualifiers: IReadOnlyQualifierCollector;
  public readonly resourceTypes: ReadOnlyResourceTypeCollector;

  protected readonly _conditions: ConditionCollector;
  protected readonly _conditionSets: ConditionSetCollector;
  protected readonly _decisions: AbstractDecisionCollector;
  protected readonly _resources: ValidatingResultMap<ResourceId, ResourceBuilder>;
  public readonly _builtResources: ValidatingResultMap<ResourceId, Resource>;

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
   * {@inheritdoc Runtime.IResourceManager.builtResources}
   */
  public get builtResources(): Collections.IReadOnlyResultMap<ResourceId, IResource> {
    return this._performBuild().orThrow();
  }

  /**
   * Constructor for a {@link Resources.ResourceManagerBuilder | ResourceManagerBuilder} object.
   * @param params - Parameters to create a new {@link Resources.ResourceManagerBuilder | ResourceManagerBuilder}.
   * @public
   */
  protected constructor(params: IResourceManagerBuilderCreateParams) {
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
   * Creates a new {@link Resources.ResourceManagerBuilder | ResourceManagerBuilder} object.
   * @param params - Parameters to create a new {@link Resources.ResourceManagerBuilder | ResourceManagerBuilder}.
   * @returns `Success` with the new {@link Resources.ResourceManagerBuilder | ResourceManagerBuilder} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(params: IResourceManagerBuilderCreateParams): Result<ResourceManagerBuilder> {
    return captureResult(() => new ResourceManagerBuilder(params));
  }

  /**
   * Given a {@link ResourceJson.Json.ILooseResourceCandidateDecl | resource candidate declaration}, builds and adds
   * a {@link Resources.ResourceCandidate | candidate} to the manager.
   * @param candidate - The {@link Resources.ResourceCandidate | candidate} to add.
   * @returns `Success` with the candidate if successful, or `Failure` with an error message if not.
   * @public
   */
  public addLooseCandidate(
    decl: ResourceJson.Json.ILooseResourceCandidateDecl
  ): DetailedResult<ResourceCandidate, ResourceBuilderResultDetail> {
    const { value: id, message } = Validate.toResourceId(decl.id);
    if (message !== undefined) {
      return failWithDetail(`${id}: invalid id - ${message}`, 'failure');
    }

    const builderResult = this._resources.getOrAdd(id, () =>
      ResourceBuilder.create({
        id,
        resourceTypes: this.resourceTypes,
        conditionSets: this._conditionSets,
        decisions: this._decisions
      })
    );
    /* c8 ignore next 6 - defense in depth against internal error */
    if (builderResult.isFailure()) {
      return failWithDetail(
        `${id}: unable to get or add resource\n${builderResult.message}`,
        builderResult.detail
      );
    }
    return builderResult.value.addLooseCandidate(decl).onSuccess((c, d) => {
      this._builtResources.delete(id);
      this._built = false;
      return succeedWithDetail(c, d);
    });
  }

  public addResource(
    decl: ResourceJson.Json.ILooseResourceDecl
  ): DetailedResult<ResourceBuilder, ResourceBuilderResultDetail> {
    const { value: id, message } = Validate.toResourceId(decl.id);
    if (message !== undefined) {
      return failWithDetail(`${id}: invalid id - ${message}`, 'failure');
    }

    const {
      value: builder,
      message: getOrAddMessage,
      detail
    } = this._resources.getOrAdd(id, () =>
      ResourceBuilder.create({
        id,
        typeName: decl.resourceTypeName,
        resourceTypes: this.resourceTypes,
        conditionSets: this._conditionSets,
        decisions: this._decisions
      })
    );
    /* c8 ignore next 3 - defense in depth against internal error */
    if (getOrAddMessage !== undefined) {
      return failWithDetail(`${id}: unable to get or add resource\n${getOrAddMessage}`, detail);
    }

    if (detail === 'exists') {
      const { message } = builder.setResourceType(decl.resourceTypeName);
      if (message !== undefined) {
        return failWithDetail(`${id}: unable to set resource type\n${message}`, 'type-mismatch');
      }
    }

    const candidates = decl.candidates ?? [];
    return mapResults(candidates.map((c) => builder.addChildCandidate(c)))
      .onSuccess(() => {
        return succeed(builder);
      })
      .withDetail('failure', detail);
  }

  /**
   * Gets a read-only array of all {@link Resources.ResourceBuilder | resource builders} present in the manager.
   * @returns `Success` with the {@link Resources.ResourceBuilder | resource builder} if successful,
   * or `Failure` with an error message if not.
   */
  public getAllResources(): ReadonlyArray<ResourceBuilder> {
    return Array.from(this._resources.values()).sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Gets a read-only array of all {@link Resources.ResourceCandidate | resource candidates} present in the manager.
   */
  public getAllCandidates(): ReadonlyArray<ResourceCandidate> {
    return this.getAllResources().flatMap((r) => r.candidates);
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
   * Gets a read-only array of all {@link Resources.Resource | built resources} in the manager.
   * @returns `Success` with an array of resources if successful, or `Failure` with an error message if not.
   * @public
   */
  public getAllBuiltResources(): Result<ReadonlyArray<Resource>> {
    return this.build().onSuccess((built) =>
      succeed(Array.from(built.values()).sort((a, b) => a.id.localeCompare(b.id)))
    );
  }

  /**
   * Gets a read-only array of all {@link Resources.Resource | built resources} in the manager.
   * @returns `Success` with an array of resources if successful, or `Failure` with an error message if not.
   * @public
   */
  public getAllBuiltCandidates(): Result<ReadonlyArray<ResourceCandidate>> {
    return this.getAllBuiltResources().onSuccess((built) => succeed(built.flatMap((r) => r.candidates)));
  }

  /**
   * Internal helper method that performs the actual building of resources.
   * @returns `Success` with the built resources if all resources were built successfully, `Failure` otherwise.
   * @internal
   */
  public _performBuild(): Result<Collections.IReadOnlyValidatingResultMap<ResourceId, Resource>> {
    if (this._built) {
      return succeed(this._builtResources);
    }

    const errors: MessageAggregator = new MessageAggregator();
    this._resources.forEach((r, id) => {
      this._builtResources.getOrAdd(id, () => r.build()).aggregateError(errors);
    });
    /* c8 ignore next 3 - defense in depth against internal error */
    if (errors.hasMessages) {
      return fail(`build failed: ${errors.toString()}`);
    }
    this._built = true;
    return succeed(this._builtResources);
  }

  /**
   * Builds the {@link Resources.Resource | resources} from the collected {@link Resources.ResourceCandidate | candidates}.
   * @returns `Success` with a read-only map of {@link Resources.Resource | resources} if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public build(): Result<Collections.IReadOnlyValidatingResultMap<ResourceId, Resource>> {
    return this._performBuild();
  }

  /**
   * Gets a read-only array of all {@link Resources.ResourceCandidate | resource candidates} that can match the supplied context.
   * @param context - The {@link Context.IValidatedContextDecl | context} to match against.
   * @param options - {@link Context.IContextMatchOptions | options} for the context match.
   * @returns A read-only array of {@link Resources.ResourceCandidate | candidates} that can match the context.
   * @public
   */
  public getCandidatesForContext(
    context: Context.IValidatedContextDecl,
    options?: Context.IContextMatchOptions
  ): ReadonlyArray<ResourceCandidate> {
    return this.getAllCandidates().filter((candidate) => candidate.canMatchPartialContext(context, options));
  }

  /**
   * Gets a read-only array of all {@link Resources.ResourceBuilder | resource builders} that have at least one candidate
   * that can match the supplied context.
   * @param context - The {@link Context.IValidatedContextDecl | context} to match against.
   * @param options - {@link Context.IContextMatchOptions | options} for the context match.
   * @returns A read-only array of {@link Resources.ResourceBuilder | resource builders} with matching candidates.
   * @public
   */
  public getResourcesForContext(
    context: Context.IValidatedContextDecl,
    options?: Context.IContextMatchOptions
  ): ReadonlyArray<ResourceBuilder> {
    return this.getAllResources().filter(
      (resource) => resource.getCandidatesForContext(context, options).length > 0
    );
  }

  /**
   * Gets a read-only array of all {@link Resources.ResourceCandidate | built resource candidates} that can match the supplied context.
   * @param context - The {@link Context.IValidatedContextDecl | context} to match against.
   * @param options - {@link Context.IContextMatchOptions | options} for the context match.
   * @returns `Success` with an array of {@link Resources.ResourceCandidate | candidates} if successful, or `Failure` with an error message if not.
   * @public
   */
  public getBuiltCandidatesForContext(
    context: Context.IValidatedContextDecl,
    options?: Context.IContextMatchOptions
  ): Result<ReadonlyArray<ResourceCandidate>> {
    return this.getAllBuiltCandidates().onSuccess((candidates) =>
      succeed(candidates.filter((candidate) => candidate.canMatchPartialContext(context, options)))
    );
  }

  /**
   * Gets a read-only array of all {@link Resources.Resource | built resources} that have at least one candidate
   * that can match the supplied context.
   * @param context - The {@link Context.IValidatedContextDecl | context} to match against.
   * @param options - {@link Context.IContextMatchOptions | options} for the context match.
   * @returns `Success` with an array of {@link Resources.Resource | resources} if successful, or `Failure` with an error message if not.
   * @public
   */
  public getBuiltResourcesForContext(
    context: Context.IValidatedContextDecl,
    options?: Context.IContextMatchOptions
  ): Result<ReadonlyArray<Resource>> {
    return this.getAllBuiltResources().onSuccess((resources) =>
      succeed(resources.filter((resource) => resource.getCandidatesForContext(context, options).length > 0))
    );
  }

  /**
   * Gets a compiled resource collection from the current state of the resource manager builder.
   * This method generates an optimized, index-based representation of all resources, conditions,
   * and decisions that can be used for serialization or efficient runtime processing.
   * @param options - Optional compilation options controlling the output format.
   * @returns Success with the compiled resource collection if successful, Failure otherwise.
   * @public
   */
  public getCompiledResourceCollection(
    options?: ResourceJson.Compiled.ICompiledResourceOptions
  ): Result<ResourceJson.Compiled.ICompiledResourceCollection> {
    // Build resources first to ensure all data is available
    const buildResult = this._performBuild();
    if (buildResult.isFailure()) {
      return fail(`Failed to build resources: ${buildResult.message}`);
    }

    // Generate compiled data from internal collections using the new toCompiled methods
    // Note: All objects have a defined index property due to the collector pattern - indices are assigned during collection building
    const compiledData = {
      qualifierTypes: Array.from(this.qualifiers.qualifierTypes.values()).map((qt) => ({
        name: qt.name
      })),
      qualifiers: Array.from(this.qualifiers.values()).map((q) => ({
        name: q.name,
        type: q.type.index!,
        defaultPriority: q.defaultPriority
      })),
      resourceTypes: Array.from(this.resourceTypes.values()).map((rt) => ({
        name: rt.key
      })),
      conditions: Array.from(this._conditions.values()).map((c) => c.toCompiled(options)),
      conditionSets: Array.from(this._conditionSets.values()).map((cs) => cs.toCompiled(options)),
      decisions: Array.from(this._decisions.values()).map((d) => d.toCompiled(options)),
      resources: Array.from(this._builtResources.values()).map((r) => r.toCompiled(options))
    };

    // Apply validation through the converter
    return ResourceJson.Compiled.Convert.compiledResourceCollection.convert(compiledData);
  }

  /**
   * Gets a resource collection declaration containing all built resources in a flat array structure.
   * This method returns all built resources as an {@link ResourceJson.Normalized.IResourceCollectionDecl | IResourceCollectionDecl}
   * that can be used for serialization, export, or re-import. Resources are sorted by ID for consistent ordering.
   * @param options - Optional {@link ResourceJson.Helpers.IDeclarationOptions | declaration options} controlling the output format.
   * If `options.normalized` is `true`, applies hash-based normalization for additional consistency guarantees.
   * @returns Success with the resource collection declaration if successful, Failure otherwise.
   * @public
   */
  public getResourceCollectionDecl(
    options?: ResourceJson.Helpers.IDeclarationOptions
  ): Result<ResourceJson.Normalized.IResourceCollectionDecl> {
    // Build resources first to ensure all data is available
    const buildResult = this._performBuild();
    if (buildResult.isFailure()) {
      return fail(`Failed to build resources: ${buildResult.message}`);
    }

    // Get all built resources and convert to loose resource declarations
    const resources = Array.from(this._builtResources.values()).map((resource) =>
      resource.toLooseResourceDecl(options)
    );

    // Sort resources by ID for consistent ordering
    resources.sort((a, b) => a.id.localeCompare(b.id));

    // Create the collection declaration structure
    const collectionData = {
      resources
    };

    // Convert and validate using the normalized converter
    return ResourceJson.Convert.resourceCollectionDecl
      .convert(collectionData)
      .onSuccess((compiledCollection) => {
        // Apply hash-based normalization only if requested
        if (options?.normalized === true) {
          const normalizer = new Hash.Crc32Normalizer();
          return normalizer
            .normalize(compiledCollection)
            .withErrorFormat((e) => `Failed to normalize resource collection: ${e}`);
        }
        return succeed(compiledCollection);
      });
  }
}
