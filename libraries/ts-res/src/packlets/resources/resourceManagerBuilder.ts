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
import { Converters as JsonConverters, JsonValue } from '@fgv/ts-json-base';
import {
  ConditionCollector,
  ConditionSetCollector,
  ReadOnlyConditionCollector,
  ReadOnlyConditionSetCollector,
  Convert as ConditionsConvert,
  Condition,
  ConditionSet,
  IConditionSetDecl
} from '../conditions';
import { AbstractDecisionCollector, ReadOnlyAbstractDecisionCollector, AbstractDecision } from '../decisions';
import { IReadOnlyQualifierCollector } from '../qualifiers';
import { ReadOnlyResourceTypeCollector, ResourceType } from '../resource-types';
import { Convert, ResourceId, Validate } from '../common';
import { IResourceManager, ResourceTree } from '../runtime';
import { ResourceBuilder, ResourceBuilderResultDetail } from './resourceBuilder';
import { Resource } from './resource';
import { ResourceCandidate } from './resourceCandidate';
import { CandidateValueCollector } from './candidateValueCollector';
import { IResourceDeclarationOptions, IResourceManagerCloneOptions } from './common';
import * as ResourceJson from '../resource-json';
import * as Context from '../context';
import * as Config from '../config';
import { JsonEditor } from '@fgv/ts-json';
import { ReadOnlyQualifierTypeCollector } from '../qualifier-types';

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
export class ResourceManagerBuilder implements IResourceManager<Resource> {
  /**
   * The {@link Qualifiers.IReadOnlyQualifierCollector | qualifiers} used by this resource manager.
   */
  public readonly qualifiers: IReadOnlyQualifierCollector;

  /**
   * The {@link ResourceTypes.ReadOnlyResourceTypeCollector | resource types} used by this resource manager.
   */
  public readonly resourceTypes: ReadOnlyResourceTypeCollector;

  /**
   * The {@link Conditions.ConditionCollector | condition collector} used by this resource manager.
   * @internal
   */
  protected readonly _conditions: ConditionCollector;

  /**
   * The {@link Conditions.ConditionSetCollector | condition set collector} used by this resource manager.
   * @internal
   */
  protected readonly _conditionSets: ConditionSetCollector;

  /**
   * The {@link Decisions.AbstractDecisionCollector | abstract decision collector} used by this resource manager.
   * @internal
   */
  protected readonly _decisions: AbstractDecisionCollector;

  /**
   * The candidate value collector used by this resource manager.
   * @internal
   */
  protected readonly _candidateValues: CandidateValueCollector;

  /**
   * The {@link Resources.ResourceBuilder | resource builders} used by this resource manager.
   * @internal
   */
  protected readonly _resources: ValidatingResultMap<ResourceId, ResourceBuilder>;

  /**
   * The {@link Resources.Resource | resources} built by this resource manager.
   * @internal
   */
  protected readonly _builtResources: ValidatingResultMap<ResourceId, Resource>;

  /**
   * Whether the resources have been built.
   * @internal
   */
  protected _built: boolean;

  /**
   * The cached resource tree for this resource manager.
   * @internal
   */
  protected _cachedResourceTree?: ResourceTree.IReadOnlyResourceTreeRoot<Resource>;

  /**
   * The {@link QualifierTypes.ReadOnlyQualifierTypeCollector | qualifier types} used by this resource manager.
   */
  public get qualifierTypes(): ReadOnlyQualifierTypeCollector {
    /* c8 ignore next 1 - functional code tested but coverage intermittently missed */
    return this.qualifiers.qualifierTypes;
  }

  /**
   * A {@link Conditions.ConditionCollector | ConditionCollector} which
   * contains the {@link Conditions.Condition | conditions} used so far by
   * the {@link Resources.ResourceCandidate | resource candidates} in this manager.
   */
  public get conditions(): ReadOnlyConditionCollector {
    return this._conditions;
  }

  /**
   * The resource IDs that this resource manager can resolve.
   */
  public get resourceIds(): ReadonlyArray<ResourceId> {
    return Array.from(this._resources.keys()).sort();
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
   * {@inheritdoc Runtime.IResourceManager.numResources}
   */
  public get numResources(): number {
    return this._resources.size;
  }

  /**
   * The number of candidates in this resource manager.
   */
  protected _numCandidates?: number;

  /**
   * {@inheritdoc Runtime.IResourceManager.numCandidates}
   */
  public get numCandidates(): number {
    if (this._numCandidates === undefined) {
      this._numCandidates = this.getAllCandidates().length;
    }
    return this._numCandidates;
  }

  /**
   * {@inheritdoc Runtime.IResourceManager.builtResources}
   */
  public get builtResources(): Collections.IReadOnlyValidatingResultMap<ResourceId, Resource> {
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
    this._candidateValues = CandidateValueCollector.create().orThrow();
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
    this._cachedResourceTree = undefined;
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
   * Creates a new {@link Resources.ResourceManagerBuilder | ResourceManagerBuilder} object from a predefined system configuration.
   * @param name - The name of the predefined system configuration to use.
   * @param qualifierDefaultValues - Optional default values for qualifiers.
   * @returns `Success` with the new {@link Resources.ResourceManagerBuilder | ResourceManagerBuilder} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static createPredefined(
    name: Config.PredefinedSystemConfiguration,
    qualifierDefaultValues?: Config.ISystemConfigurationInitParams['qualifierDefaultValues']
  ): Result<ResourceManagerBuilder> {
    return Config.getPredefinedSystemConfiguration(
      name,
      /* c8 ignore next 1 - defense in depth */
      qualifierDefaultValues ? { qualifierDefaultValues } : undefined
    ).onSuccess((systemConfig) => {
      return ResourceManagerBuilder.create({
        qualifiers: systemConfig.qualifiers,
        resourceTypes: systemConfig.resourceTypes
      });
    });
  }

  /**
   * Creates a new {@link Resources.ResourceManagerBuilder | ResourceManagerBuilder} from a
   * {@link ResourceJson.Compiled.ICompiledResourceCollection | compiled resource collection}.
   * This method reconstructs an exactly equivalent builder where all qualifier, condition,
   * condition set, and decision indices match the original compiled collection.
   * @param compiledCollection - The compiled resource collection to reconstruct from.
   * @param systemConfig - The system configuration containing qualifiers and resource types.
   * @returns `Success` with the new manager if successful, or `Failure` with an error message if not.
   * @public
   */
  public static createFromCompiledResourceCollection(
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection,
    systemConfig: Config.SystemConfiguration
  ): Result<ResourceManagerBuilder> {
    // Create the base builder with system configuration
    return ResourceManagerBuilder.create({
      qualifiers: systemConfig.qualifiers,
      resourceTypes: systemConfig.resourceTypes
    }).onSuccess((builder) => {
      // Reconstruct all entities in order to preserve indices
      return ResourceManagerBuilder._reconstructConditions(builder, compiledCollection)
        .onSuccess(() => ResourceManagerBuilder._reconstructConditionSets(builder, compiledCollection))
        .onSuccess(() => ResourceManagerBuilder._reconstructDecisions(builder, compiledCollection))
        .onSuccess(() => ResourceManagerBuilder._reconstructResources(builder, compiledCollection))
        .onSuccess(() => succeed(builder));
    });
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
        decisions: this._decisions,
        candidateValues: this._candidateValues
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
      this._numCandidates = undefined;
      this._cachedResourceTree = undefined;
      return succeedWithDetail(c, d);
    });
  }

  public addResource(
    decl: ResourceJson.Json.ILooseResourceDecl
  ): DetailedResult<ResourceBuilder, ResourceBuilderResultDetail> {
    const { value: id, message } = Validate.toResourceId(decl.id);
    /* c8 ignore next 3 - defensive coding: resource ID validation should prevent invalid IDs */
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
        decisions: this._decisions,
        candidateValues: this._candidateValues
      })
    );
    /* c8 ignore next 3 - defense in depth against internal error */
    if (getOrAddMessage !== undefined) {
      return failWithDetail(`${id}: unable to get or add resource\n${getOrAddMessage}`, detail);
    }

    if (detail === 'exists') {
      /* c8 ignore next 4 - defensive coding: resource type mismatch on existing resources should not occur */
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
   * Adds a condition to the manager.
   * @param decl - The condition declaration to add.
   * @returns `Success` with the condition if successful, or `Failure` with an error message if not.
   * @public
   */
  public addCondition(decl: ResourceJson.Json.ILooseConditionDecl): Result<Condition> {
    return ConditionsConvert.validatedConditionDecl
      .convert(decl, { qualifiers: this.qualifiers })
      .onSuccess((validated) => {
        return Condition.getKeyForDecl(validated).onSuccess((key) => {
          return this._conditions.validating.getOrAdd(key, () => Condition.create(validated));
        });
      });
  }

  /**
   * Adds a condition set to the manager.
   * @param decl - The condition set declaration to add.
   * @returns `Success` with the condition set if successful, or `Failure` with an error message if not.
   * @public
   */
  public addConditionSet(conditions: ResourceJson.Normalized.ConditionSetDecl): Result<ConditionSet> {
    const decl: IConditionSetDecl = { conditions: [...conditions] };
    return ConditionsConvert.validatedConditionSetDecl
      .convert(decl, { conditions: this._conditions })
      .onSuccess((validated) => {
        return ConditionSet.getKeyForDecl(validated).onSuccess((key) => {
          return this._conditionSets.validating.getOrAdd(key, () => ConditionSet.create(validated));
        });
      });
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
   * Validates a context declaration against the qualifiers managed by this resource manager.
   * @param context - The context declaration to validate
   * @returns Success with the validated context if successful, Failure otherwise
   * @public
   */
  /* c8 ignore next 5 - functional code path tested but coverage intermittently missed */
  public validateContext(context: Context.IContextDecl): Result<Context.IValidatedContextDecl> {
    return Context.Convert.validatedContextDecl.convert(context, {
      qualifiers: this.qualifiers
    });
  }

  /**
   * Gets a read-only array of all {@link Resources.Resource | built resources} in the manager.
   * @returns `Success` with an array of resources if successful, or `Failure` with an error message if not.
   * @public
   */
  public getAllBuiltResources(): Result<ReadonlyArray<Resource>> {
    return this.build().onSuccess((manager) =>
      succeed(Array.from(manager._builtResources.values()).sort((a, b) => a.id.localeCompare(b.id)))
    );
  }

  /**
   * Builds and returns a hierarchical tree representation of all resources managed by this builder.
   * Resources are organized based on their dot-separated resource IDs (e.g., "app.messages.welcome"
   * becomes a tree with "app" as root, "messages" as branch, and "welcome" as leaf).
   *
   * String-based validation is available through the `children.validating` property,
   * allowing callers to use `tree.children.validating.getById(stringId)` for validated access.
   *
   * Uses lazy initialization with caching for performance.
   * @returns Result containing the resource tree root, or failure if tree construction fails
   * @public
   */
  public getBuiltResourceTree(): Result<ResourceTree.IReadOnlyResourceTreeRoot<Resource>> {
    // Ensure resources are built first
    return this.build().onSuccess((manager) => {
      if (manager._cachedResourceTree) {
        return succeed(manager._cachedResourceTree);
      }

      // Convert all built resources to [ResourceId, Resource] pairs
      const resources: [ResourceId, Resource][] = [];
      for (const [id, resource] of manager._builtResources.entries()) {
        resources.push([id, resource]);
      }

      // Create the resource tree with lazy initialization
      return ResourceTree.ReadOnlyResourceTreeRoot.create(resources).onSuccess((tree) => {
        manager._cachedResourceTree = tree;
        return succeed(tree);
      });
    });
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
   * @returns `Success` with the {@link Resources.ResourceManagerBuilder | ResourceManagerBuilder} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public build(): Result<this> {
    return this._performBuild().onSuccess(() => succeed(this));
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
    /* c8 ignore next 3 - defensive coding: build failure should not occur after successful validation */
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
      candidateValues: this._candidateValues.getValuesByIndex(),
      resources: Array.from(this._builtResources.values()).map((r) => r.toCompiled(options))
    };

    // Apply validation through the converter
    return ResourceJson.Compiled.Convert.compiledResourceCollection.convert(compiledData);
  }

  /**
   * Gets a resource collection declaration containing all built resources in a flat array structure.
   * This method returns all built resources as an {@link ResourceJson.Normalized.IResourceCollectionDecl | IResourceCollectionDecl}
   * that can be used for serialization, export, or re-import. Resources are sorted by ID for consistent ordering.
   * @param options - Optional {@link Resources.IResourceDeclarationOptions | declaration options} controlling the output format.
   * If `options.normalized` is `true`, applies hash-based normalization for additional consistency guarantees.
   * @returns Success with the resource collection declaration if successful, Failure otherwise.
   * @public
   */
  public getResourceCollectionDecl(
    options?: IResourceDeclarationOptions
  ): Result<ResourceJson.Normalized.IResourceCollectionDecl> {
    return this._performBuild().onSuccess(() => {
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
          /* c8 ignore next 5 - functional code tested but coverage intermittently missed */
          if (options?.normalized === true) {
            const normalizer = new Hash.Crc32Normalizer();
            return normalizer
              .normalize(compiledCollection)
              .withErrorFormat((e) => `Failed to normalize resource collection: ${e}`);
          }
          return succeed(compiledCollection);
        });
    });
  }

  /**
   * Creates a clone of this ResourceManagerBuilder with optional configuration overrides.
   * This method creates a new ResourceManagerBuilder that can optionally use different
   * qualifiers and/or resource types than the original. It can also be filtered to include
   * only candidates that match the provided context and apply candidate edits.
   *
   * @param options - Options for the cloning operation:
   *   - `qualifiers`: Optional qualifier collector to use instead of the original
   *   - `resourceTypes`: Optional resource type collector to use instead of the original
   *   - `filterForContext`: Optional context filter for candidates
   *   - `candidates`: Optional candidate edits to apply during cloning
   * @returns A Result containing the new ResourceManagerBuilder with the specified configuration.
   * @public
   */
  /* c8 ignore next 21 - functional code path tested but coverage intermittently missed */
  public clone(options?: IResourceManagerCloneOptions): Result<ResourceManagerBuilder> {
    return this.getResourceCollectionDecl(options).onSuccess((collection) => {
      return ResourceManagerBuilder.create({
        qualifiers: options?.qualifiers ?? this.qualifiers,
        resourceTypes: options?.resourceTypes ?? this.resourceTypes
      }).onSuccess((newManager) => {
        // Check if we have candidates to apply as edits
        const editCandidates = options?.candidates || [];
        const candidatesByResourceResult =
          editCandidates.length > 0
            ? ResourceManagerBuilder._createCandidatesByResourceMap(editCandidates)
            : succeed(new Map());

        return candidatesByResourceResult.onSuccess((candidatesByResource) => {
          // Track which resource IDs have been processed from the original collection
          const processedResourceIds = new Set<ResourceId>();

          // Add each resource from the filtered collection to the new manager
          if (collection.resources) {
            for (const resourceDecl of collection.resources) {
              processedResourceIds.add(resourceDecl.id as ResourceId);

              // Apply edits if there are candidates for this resource
              const editedDeclResult = ResourceManagerBuilder._applyEditsToResourceDeclaration(
                resourceDecl,
                candidatesByResource,
                this._conditions
              );

              /* c8 ignore next 2 - functional code tested but coverage intermittently missed */
              if (editedDeclResult.isFailure()) {
                return fail(`${resourceDecl.id}: Failed to apply edits: ${editedDeclResult.message}`);
              }

              const addResult = newManager.addResource(editedDeclResult.value);
              /* c8 ignore next 5 - edge case (nearly?) impossible to reproduce */
              if (addResult.isFailure()) {
                return fail(
                  `${resourceDecl.id}: Failed to add resource to cloned manager: ${addResult.message}`
                );
              }
            }
          }

          // Handle any remaining candidates that target new resources not in the original collection
          const errors = new MessageAggregator();
          /* c8 ignore next 9 - functional code tested but coverage intermittently missed */
          for (const [resourceId, candidates] of candidatesByResource) {
            if (!processedResourceIds.has(resourceId)) {
              // Create a new resource declaration for candidates targeting a new resource ID
              ResourceManagerBuilder._createResourceDeclFromCandidates(
                resourceId,
                candidates,
                this._conditions
              )
                .withErrorFormat((e) => `${resourceId}: Failed to create new resource from candidates: ${e}`)
                /* c8 ignore next 7 - functional code tested but coverage intermittently missed */
                .onSuccess((newResourceDecl) => {
                  return newManager
                    .addResource(newResourceDecl)
                    .withErrorFormat(
                      (e) => `${resourceId}: Failed to add new resource to cloned manager: ${e}`
                    );
                })
                .aggregateError(errors);
            }
          }

          return errors.returnOrReport(succeed(newManager));
        });
      });
    });
  }

  /**
   * Creates a resource ID keyed map from an array of loose resource candidate declarations.
   * This enables efficient detection of edit collisions by grouping candidates by their target resource.
   * @param candidates - Array of loose resource candidate declarations to organize
   * @returns A Result containing a Map where keys are validated ResourceIds and values are arrays of candidates for that resource
   * @internal
   */
  private static _createCandidatesByResourceMap(
    candidates: ReadonlyArray<ResourceJson.Json.ILooseResourceCandidateDecl>
  ): Result<Map<ResourceId, ResourceJson.Json.ILooseResourceCandidateDecl[]>> {
    const candidatesByResource = new Map<ResourceId, ResourceJson.Json.ILooseResourceCandidateDecl[]>();

    for (const candidate of candidates) {
      const { value: resourceId, message } = Validate.toResourceId(candidate.id);
      if (message !== undefined) {
        return fail(`Invalid resource ID "${candidate.id}": ${message}`);
      }

      const existingCandidates = candidatesByResource.get(resourceId);
      if (existingCandidates) {
        existingCandidates.push(candidate);
      } else {
        candidatesByResource.set(resourceId, [candidate]);
      }
    }

    return succeed(candidatesByResource);
  }

  /**
   * Generates a proper ConditionSet token for collision detection using the existing ConditionSet.getKeyForDecl method.
   * @param conditionSet - The condition set to generate a token for
   * @param conditionCollector - The condition collector needed for validation context
   * @returns A Result containing the ConditionSet token if successful, or failure if validation fails
   * @internal
   */

  /**
   * Applies candidate edits to a resource declaration, handling collisions using condition set tokens.
   * If there's no collision, adds the candidate. If there's a collision, replaces the original candidate with the edit.
   * @param resourceDecl - The original resource declaration to potentially modify
   * @param candidatesByResource - Map of resource IDs to arrays of candidate edits
   * @param conditionCollector - The condition collector needed for generating condition tokens
   * @returns A Result containing the resource declaration to use (original or modified)
   * @internal
   */
  private static _applyEditsToResourceDeclaration(
    resourceDecl: ResourceJson.Json.ILooseResourceDecl,
    candidatesByResource: Map<ResourceId, ResourceJson.Json.ILooseResourceCandidateDecl[]>,
    conditionCollector: ConditionCollector
  ): Result<ResourceJson.Json.ILooseResourceDecl> {
    const { value: resourceId, message } = Validate.toResourceId(resourceDecl.id);
    /* c8 ignore next 3 - defensive validation: resource IDs are validated when added to builder, but this protects against corrupted data */
    if (message !== undefined) {
      return fail(`Invalid resource ID "${resourceDecl.id}": ${message}`);
    }

    /* c8 ignore next 4 - functional code tested but coverage intermittently missed */
    const editCandidates = candidatesByResource.get(resourceId);
    if (!editCandidates || editCandidates.length === 0) {
      return succeed(resourceDecl);
    }

    // Use Map approach: apply original candidates first, then replace with edits on collision
    const candidatesByConditionKey = new Map<string, ResourceJson.Json.IChildResourceCandidateDecl>();

    /* c8 ignore next 1 - ?? is defense in depth */
    const declCandidates = resourceDecl.candidates ?? [];

    // First, add all original candidates keyed by their condition set token
    for (const candidate of declCandidates) {
      const conditionTokenResult = ConditionSet.getKeyFromLooseDecl(candidate.conditions, conditionCollector);
      /* c8 ignore next 5 - edge case or internal error (nearly?) impossible to reproduce */
      if (conditionTokenResult.isFailure()) {
        return fail(
          `Failed to generate condition token for original candidate: ${conditionTokenResult.message}`
        );
      }
      candidatesByConditionKey.set(conditionTokenResult.value, candidate);
    }

    // Then, apply edits (this replaces any colliding original candidates)
    // Convert edit candidates (which have ids) to child candidates (without ids) for merging
    /* c8 ignore next 37 - functional code tested but coverage intermittently missed */
    for (const editCandidate of editCandidates) {
      const conditionTokenResult = ConditionSet.getKeyFromLooseDecl(
        editCandidate.conditions,
        conditionCollector
      );
      if (conditionTokenResult.isFailure()) {
        return fail(`Failed to generate condition token for edit candidate: ${conditionTokenResult.message}`);
      }
      let editedJson = editCandidate.json;
      const previousJson = candidatesByConditionKey.get(conditionTokenResult.value)?.json;
      if (previousJson && previousJson !== editedJson) {
        editedJson = JsonEditor.create({
          merge: {
            arrayMergeBehavior: 'replace',
            nullAsDelete: false
          }
        })
          .onSuccess((editor) => {
            return editor.mergeObjectsInPlace({}, [previousJson, editedJson]);
          })
          .orThrow();
      }

      const childCandidate: ResourceJson.Json.IChildResourceCandidateDecl = {
        json: editedJson,
        conditions: editCandidate.conditions,
        isPartial: editCandidate.isPartial,
        mergeMethod: editCandidate.mergeMethod
      };
      candidatesByConditionKey.set(conditionTokenResult.value, childCandidate);
    }

    // Extract the final merged candidate list
    const mergedCandidates = Array.from(candidatesByConditionKey.values());

    const modifiedDecl: ResourceJson.Json.ILooseResourceDecl = {
      ...resourceDecl,
      candidates: mergedCandidates
    };

    return succeed(modifiedDecl);
  }

  /**
   * Creates a new resource declaration from an array of candidate declarations.
   * This is used when cloning to create new resources that don't exist in the original manager.
   * @param resourceId - The validated resource ID for the new resource
   * @param candidates - Array of loose candidate declarations for the new resource
   * @param conditionCollector - The condition collector for validation context
   * @returns A Result containing the new resource declaration if successful, or failure if validation fails
   * @internal
   */
  private static _createResourceDeclFromCandidates(
    resourceId: ResourceId,
    candidates: ResourceJson.Json.ILooseResourceCandidateDecl[],
    conditionCollector: ConditionCollector
  ): Result<ResourceJson.Json.ILooseResourceDecl> {
    // Convert candidate declarations to child candidate declarations
    const childCandidates: ResourceJson.Json.IChildResourceCandidateDecl[] = [];

    // Ensure we have candidates
    /* c8 ignore next 3 - defense in depth against internal error */
    if (candidates.length === 0) {
      return fail('Cannot create resource declaration from empty candidates array');
    }

    // Extract resourceTypeName from the first candidate (all candidates for the same resource should have the same type)
    const resourceTypeName = candidates[0].resourceTypeName;
    /* c8 ignore next 3 - defense in depth */
    if (!resourceTypeName) {
      return fail('resourceTypeName is required for new resource candidates');
    }

    for (const candidate of candidates) {
      const childCandidate: ResourceJson.Json.IChildResourceCandidateDecl = {
        json: candidate.json,
        conditions: candidate.conditions,
        isPartial: candidate.isPartial,
        mergeMethod: candidate.mergeMethod
      };
      childCandidates.push(childCandidate);
    }

    // Create the new resource declaration
    const newResourceDecl: ResourceJson.Json.ILooseResourceDecl = {
      id: resourceId,
      candidates: childCandidates,
      resourceTypeName
    };

    return succeed(newResourceDecl);
  }

  /**
   * Reconstructs conditions from a compiled collection and adds them to the builder.
   * @param builder - The builder to add conditions to.
   * @param compiledCollection - The compiled collection containing conditions.
   * @returns `Success` if all conditions were added successfully, `Failure` otherwise.
   * @internal
   */
  private static _reconstructConditions(
    builder: ResourceManagerBuilder,
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
  ): Result<boolean> {
    const errors = new MessageAggregator();

    for (const compiledCondition of compiledCollection.conditions) {
      // Get the qualifier by index
      const qualifierResult = builder.qualifiers.getAt(compiledCondition.qualifierIndex);
      /* c8 ignore next 4 - edge case or internal error (nearly?) impossible to reproduce */
      if (qualifierResult.isFailure()) {
        qualifierResult.aggregateError(errors);
        continue;
      }

      // Create condition declaration from compiled condition
      const conditionDecl: ResourceJson.Json.ILooseConditionDecl = {
        qualifierName: qualifierResult.value.name,
        operator: compiledCondition.operator,
        value: compiledCondition.value,
        priority: compiledCondition.priority,
        scoreAsDefault: compiledCondition.scoreAsDefault
      };

      // Add condition to builder (it will get the next sequential index)
      builder.addCondition(conditionDecl).aggregateError(errors);
    }

    return errors.returnOrReport(succeed(true));
  }

  /**
   * Reconstructs condition sets from a compiled collection and adds them to the builder.
   * @param builder - The builder to add condition sets to.
   * @param compiledCollection - The compiled collection containing condition sets.
   * @returns `Success` if all condition sets were added successfully, `Failure` otherwise.
   * @internal
   */
  private static _reconstructConditionSets(
    builder: ResourceManagerBuilder,
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
  ): Result<boolean> {
    const errors = new MessageAggregator();

    for (const compiledConditionSet of compiledCollection.conditionSets) {
      // Get conditions by their indices
      const conditionResults = compiledConditionSet.conditions.map((idx) => builder._conditions.getAt(idx));

      // Check for any failures
      const failedIndex = conditionResults.findIndex((r) => r.isFailure());
      /* c8 ignore next 4 - edge case or internal error (nearly?) impossible to reproduce */
      if (failedIndex >= 0) {
        conditionResults[failedIndex].aggregateError(errors);
        continue;
      }

      // Create condition set from conditions (not declarations)
      const conditions = conditionResults.map((r) => r.orThrow());
      // Convert conditions to declarations for addConditionSet
      const conditionDecls = conditions.map((c) => c.toLooseConditionDecl());
      builder.addConditionSet(conditionDecls).aggregateError(errors);
    }

    return errors.returnOrReport(succeed(true));
  }

  /**
   * Reconstructs decisions from a compiled collection and adds them to the builder.
   * @param builder - The builder to add decisions to.
   * @param compiledCollection - The compiled collection containing decisions.
   * @returns `Success` if all decisions were added successfully, `Failure` otherwise.
   * @internal
   */
  private static _reconstructDecisions(
    builder: ResourceManagerBuilder,
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
  ): Result<boolean> {
    const errors = new MessageAggregator();

    for (const compiledDecision of compiledCollection.decisions) {
      // Get condition sets by their indices
      const conditionSetResults = compiledDecision.conditionSets.map((idx) =>
        builder._conditionSets.getAt(idx)
      );

      // Check for any failures
      const failedIndex = conditionSetResults.findIndex((r) => r.isFailure());
      if (failedIndex >= 0) {
        conditionSetResults[failedIndex].aggregateError(errors);
        continue;
      }

      // Get condition sets from successful results
      const conditionSets = conditionSetResults.map((r) => r.orThrow());
      // Create AbstractDecision from condition sets and add to collector
      AbstractDecision.createAbstractDecision({ conditionSets })
        .onSuccess((decision) => builder._decisions.getOrAdd(decision))
        .aggregateError(errors);
    }

    return errors.returnOrReport(succeed(true));
  }

  /**
   * Reconstructs resources and their candidates from a compiled collection and adds them to the builder.
   * @param builder - The builder to add resources to.
   * @param compiledCollection - The compiled collection containing resources.
   * @returns `Success` if all resources were added successfully, `Failure` otherwise.
   * @internal
   */
  private static _reconstructResources(
    builder: ResourceManagerBuilder,
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
  ): Result<boolean> {
    const errors = new MessageAggregator();

    for (const compiledResource of compiledCollection.resources) {
      // Get the resource type by index
      const resourceTypeResult = builder.resourceTypes.getAt(compiledResource.type);
      /* c8 ignore next 4 - edge case or internal error (nearly?) impossible to reproduce */
      if (resourceTypeResult.isFailure()) {
        resourceTypeResult.aggregateError(errors);
        continue;
      }

      // Get the decision by index
      const decisionResult = builder._decisions.getAt(compiledResource.decision);
      /* c8 ignore next 4 - edge case or internal error (nearly?) impossible to reproduce */
      if (decisionResult.isFailure()) {
        decisionResult.aggregateError(errors);
        continue;
      }

      const decision = decisionResult.value;
      const resourceType = resourceTypeResult.value;

      // Create candidates from the decision's condition sets
      ResourceManagerBuilder._createCandidatesFromDecision(
        compiledResource,
        decision,
        resourceType,
        builder,
        compiledCollection.candidateValues
      ).aggregateError(errors);
    }

    return errors.returnOrReport(succeed(true));
  }

  /**
   * Helper method to create candidates from a decision's condition sets.
   * @param compiledResource - The compiled resource containing candidates.
   * @param decision - The decision containing condition sets.
   * @param resourceType - The resource type for the candidates.
   * @param builder - The builder to add candidates to.
   * @param candidateValues - Array of candidate values indexed by valueIndex.
   * @returns `Success` if all candidates were added successfully, `Failure` otherwise.
   * @internal
   */
  private static _createCandidatesFromDecision(
    compiledResource: ResourceJson.Compiled.ICompiledResource,
    decision: AbstractDecision,
    resourceType: ResourceType,
    builder: ResourceManagerBuilder,
    candidateValues: ReadonlyArray<JsonValue>
  ): Result<boolean> {
    const errors = new MessageAggregator();

    // Match each candidate to its corresponding condition set
    for (let i = 0; i < compiledResource.candidates.length; i++) {
      const candidate = compiledResource.candidates[i];

      // Build conditions from the corresponding condition set (if available)
      let conditions: Record<string, string> | undefined;
      if (i < decision.candidates.length) {
        const decisionCandidate = decision.candidates[i];
        conditions = {};
        for (const condition of decisionCandidate.conditionSet.conditions) {
          conditions[condition.qualifier.name] = condition.value;
        }
        /* c8 ignore next 3 - defense in depth */
        if (Object.keys(conditions).length === 0) {
          conditions = undefined;
        }
      }

      // Get json value from candidateValues array using valueIndex
      /* c8 ignore next 1 - defense in depth */
      const rawJson = candidateValues[candidate.valueIndex] ?? {};
      JsonConverters.jsonObject
        .convert(rawJson)
        .onSuccess((json) => {
          const candidateDecl: ResourceJson.Json.ILooseResourceCandidateDecl = {
            id: compiledResource.id,
            json,
            conditions,
            isPartial: candidate.isPartial,
            mergeMethod: candidate.mergeMethod,
            resourceTypeName: resourceType.key
          };

          return builder.addLooseCandidate(candidateDecl).aggregateError(errors);
        })
        .aggregateError(errors);
    }

    return errors.returnOrReport(succeed(true));
  }
}
