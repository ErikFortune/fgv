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
  fail,
  mapResults,
  MessageAggregator,
  Result,
  succeed,
  ValidatingResultMap
} from '@fgv/ts-utils';
import {
  ConditionCollector,
  ConditionSetCollector,
  ReadOnlyConditionCollector,
  ReadOnlyConditionSetCollector
} from '../conditions';
import { AbstractDecisionCollector, ReadOnlyAbstractDecisionCollector } from '../decisions';
import { QualifierCollector } from '../qualifiers';
import { ResourceType, ResourceTypeCollector } from '../resource-types';
import { QualifierType, QualifierTypeCollector } from '../qualifier-types';
import { Convert, ResourceId, Helpers } from '../common';
import { Converters } from '@fgv/ts-json-base';
import { IResourceManager, IResource, IResourceCandidate } from './iResourceManager';
import { ConcreteDecision } from '../decisions';
import * as Validate from './validate';
import * as ResourceJson from '../resource-json';
import { ReadOnlyResourceTreeRoot } from './resource-tree';
import * as Context from '../context';

/**
 * Interface for parameters to create a {@link Runtime.CompiledResourceCollection | CompiledResourceCollection}.
 * @public
 */
export interface ICompiledResourceCollectionCreateParams {
  /**
   * The compiled resource collection data.
   */
  compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection;
  /**
   * Map of qualifier type names to qualifier type objects.
   */
  qualifierTypes: Collections.IReadOnlyResultMap<string, QualifierType>;
  /**
   * Map of resource type names to resource type objects.
   */
  resourceTypes: Collections.IReadOnlyResultMap<string, ResourceType>;
}

/**
 * A compiled resource collection implements {@link Runtime.IResourceManager | IResourceManager}
 * by reconstructing runtime objects from compiled data. This provides an efficient way to load
 * and use pre-compiled resource collections without rebuilding them from scratch.
 * @public
 */
export class CompiledResourceCollection implements IResourceManager<IResource> {
  public readonly conditions: ReadOnlyConditionCollector;
  public readonly conditionSets: ReadOnlyConditionSetCollector;
  public readonly decisions: ReadOnlyAbstractDecisionCollector;

  private readonly _qualifierTypes: QualifierTypeCollector;
  private readonly _qualifiers: QualifierCollector;
  private readonly _resourceTypes: ResourceTypeCollector;
  private readonly _builtResources: ValidatingResultMap<ResourceId, IResource>;
  private _cachedResourceTree?: ReadOnlyResourceTreeRoot<IResource>;

  /**
   * A {@link QualifierTypes.QualifierTypeCollector | QualifierTypeCollector} which
   * contains the {@link QualifierTypes.QualifierType | qualifier types} used in this collection.
   */
  public get qualifierTypes(): QualifierTypeCollector {
    return this._qualifierTypes;
  }

  /**
   * A {@link Qualifiers.QualifierCollector | QualifierCollector} which
   * contains the {@link Qualifiers.Qualifier | qualifiers} used in this collection.
   */
  public get qualifiers(): QualifierCollector {
    return this._qualifiers;
  }

  /**
   * A {@link ResourceTypes.ResourceTypeCollector | ResourceTypeCollector} which
   * contains the {@link ResourceTypes.ResourceType | resource types} used in this collection.
   */
  public get resourceTypes(): ResourceTypeCollector {
    return this._resourceTypes;
  }

  /**
   * {@inheritdoc Runtime.IResourceManager.builtResources}
   */
  public get builtResources(): Collections.IReadOnlyValidatingResultMap<ResourceId, IResource> {
    return this._builtResources;
  }

  /**
   * {@inheritdoc Runtime.IResourceManager.numResources}
   */
  public get numResources(): number {
    return this._builtResources.size;
  }

  protected _numCandidates?: number;

  /**
   * {@inheritdoc Runtime.IResourceManager.numCandidates}
   */
  public get numCandidates(): number {
    if (this._numCandidates === undefined) {
      this._numCandidates = [...this._builtResources.values()].reduce(
        (acc, resource) => acc + resource.candidates.length,
        0
      );
    }
    return this._numCandidates;
  }

  /**
   * Constructor for a {@link Runtime.CompiledResourceCollection | CompiledResourceCollection} object.
   * @param params - Parameters to create a new {@link Runtime.CompiledResourceCollection | CompiledResourceCollection}.
   * @internal
   */
  protected constructor(params: ICompiledResourceCollectionCreateParams) {
    // Reconstruct collectors from compiled data
    this._qualifierTypes = this._buildQualifierTypes(
      params.compiledCollection,
      params.qualifierTypes
    ).orThrow();
    this._qualifiers = this._buildQualifiers(params.compiledCollection, this._qualifierTypes).orThrow();
    this._resourceTypes = this._buildResourceTypes(params.compiledCollection, params.resourceTypes).orThrow();

    // Build collectors from compiled data
    const conditionCollector = this._buildConditions(params.compiledCollection, this._qualifiers).orThrow();
    const conditionSetCollector = this._buildConditionSets(
      params.compiledCollection,
      conditionCollector
    ).orThrow();
    const decisionCollector = this._buildDecisions(
      params.compiledCollection,
      conditionSetCollector
    ).orThrow();

    this.conditions = conditionCollector;
    this.conditionSets = conditionSetCollector;
    this.decisions = decisionCollector;

    // Build resources from compiled data
    this._builtResources = this._buildResources(
      params.compiledCollection,
      this._resourceTypes,
      decisionCollector
    ).orThrow();
  }

  /**
   * Creates a new {@link Runtime.CompiledResourceCollection | CompiledResourceCollection} object.
   * @param params - Parameters to create a new {@link Runtime.CompiledResourceCollection | CompiledResourceCollection}.
   * @returns `Success` with the new {@link Runtime.CompiledResourceCollection | CompiledResourceCollection} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(params: ICompiledResourceCollectionCreateParams): Result<CompiledResourceCollection> {
    return captureResult(() => new CompiledResourceCollection(params));
  }

  /**
   * {@inheritdoc Runtime.IResourceManager.getBuiltResource}
   */
  public getBuiltResource(id: string): Result<IResource> {
    return this._builtResources.validating.get(id);
  }

  /**
   * {@inheritdoc Runtime.IResourceManager.validateContext}
   */
  public validateContext(context: Context.IContextDecl): Result<Context.IValidatedContextDecl> {
    return Context.Convert.validatedContextDecl.convert(context, {
      qualifiers: this._qualifiers
    });
  }

  /**
   * Gets a resource tree built from the resources in this collection.
   * The tree provides hierarchical access to resources based on their ResourceId structure.
   * For example, resources with IDs like "app.messages.welcome" create a tree structure
   * where "app" and "messages" are branch nodes, and "welcome" is a leaf containing the resource.
   *
   * String-based validation is available through the `children.validating` property,
   * allowing callers to use `tree.children.validating.getById(stringId)` for validated access.
   *
   * Uses lazy initialization with caching for performance.
   * @returns Result containing the resource tree root, or failure if tree construction fails
   * @public
   */
  public getBuiltResourceTree(): Result<ReadOnlyResourceTreeRoot<IResource>> {
    if (this._cachedResourceTree) {
      return succeed(this._cachedResourceTree);
    }

    // Convert all built resources to [ResourceId, IResource] pairs
    const resources: [ResourceId, IResource][] = [];
    for (const [id, resource] of this._builtResources.entries()) {
      resources.push([id, resource]);
    }

    // Create the resource tree with lazy initialization
    return ReadOnlyResourceTreeRoot.create(resources).onSuccess((tree) => {
      this._cachedResourceTree = tree;
      return succeed(tree);
    });
  }

  /**
   * Reconstructs a QualifierTypeCollector from compiled data.
   * @param compiled - The compiled resource collection
   * @param qualifierTypes - Map of qualifier type names to qualifier type objects
   * @returns The reconstructed QualifierTypeCollector
   * @internal
   */
  private _buildQualifierTypes(
    compiled: ResourceJson.Compiled.ICompiledResourceCollection,
    qualifierTypes: Collections.IReadOnlyResultMap<string, QualifierType>
  ): Result<QualifierTypeCollector> {
    return mapResults(
      compiled.qualifierTypes.map((compiledQualifierType) => qualifierTypes.get(compiledQualifierType.name))
    ).onSuccess((referencedQualifierTypes) => {
      return QualifierTypeCollector.create({
        qualifierTypes: referencedQualifierTypes
      });
    });
  }

  /**
   * Reconstructs a QualifierCollector from compiled data.
   * @param compiled - The compiled resource collection
   * @param qualifierTypes - The reconstructed QualifierTypeCollector
   * @returns The reconstructed QualifierCollector
   * @internal
   */
  private _buildQualifiers(
    compiled: ResourceJson.Compiled.ICompiledResourceCollection,
    qualifierTypes: QualifierTypeCollector
  ): Result<QualifierCollector> {
    return mapResults(
      compiled.qualifiers.map((compiledQualifier) => {
        return qualifierTypes.getAt(compiledQualifier.type).onSuccess((qualifierType) => {
          return succeed({
            name: compiledQualifier.name,
            typeName: qualifierType.name,
            defaultPriority: compiledQualifier.defaultPriority
          });
        });
      })
    ).onSuccess((qualifierDecls) => {
      return QualifierCollector.create({
        qualifierTypes,
        qualifiers: qualifierDecls
      });
    });
  }

  /**
   * Reconstructs a ResourceTypeCollector from compiled data.
   * @param compiled - The compiled resource collection
   * @param resourceTypes - Map of resource type names to resource type objects
   * @returns The reconstructed ResourceTypeCollector
   * @internal
   */
  private _buildResourceTypes(
    compiled: ResourceJson.Compiled.ICompiledResourceCollection,
    resourceTypes: Collections.IReadOnlyResultMap<string, ResourceType>
  ): Result<ResourceTypeCollector> {
    return mapResults(
      compiled.resourceTypes.map((compiledResourceType) => resourceTypes.get(compiledResourceType.name))
    ).onSuccess((referencedResourceTypes) => {
      return ResourceTypeCollector.create({
        resourceTypes: referencedResourceTypes
      });
    });
  }

  /**
   * Reconstructs a ConditionCollector from compiled data.
   * @param compiled - The compiled resource collection
   * @param qualifiers - The reconstructed QualifierCollector
   * @returns The reconstructed ConditionCollector
   * @internal
   */
  private _buildConditions(
    compiled: ResourceJson.Compiled.ICompiledResourceCollection,
    qualifiers: QualifierCollector
  ): Result<ConditionCollector> {
    const errors = new MessageAggregator();

    const conditionCollectorResult = ConditionCollector.create({ qualifiers });
    /* c8 ignore next 3 - defensive coding for ConditionCollector creation failure */
    if (conditionCollectorResult.isFailure()) {
      return conditionCollectorResult;
    }
    const conditionCollector = conditionCollectorResult.value;

    for (const [index, compiledCondition] of compiled.conditions.entries()) {
      const qualifierResult = qualifiers.getAt(compiledCondition.qualifierIndex);
      if (qualifierResult.isFailure()) {
        errors.addMessage(
          `Invalid qualifier index ${compiledCondition.qualifierIndex} at condition ${index}: ${qualifierResult.message}`
        );
        continue;
      }
      const qualifier = qualifierResult.value;

      /* c8 ignore next 1 - not really testable atm as "matches" is the only supported operator */
      const operator = compiledCondition.operator ?? 'matches'; // Default to 'matches' if not provided
      const conditionDecl = {
        qualifierName: qualifier.name,
        value: compiledCondition.value,
        operator,
        priority: compiledCondition.priority,
        scoreAsDefault: compiledCondition.scoreAsDefault
      };

      const conditionResult = conditionCollector.validating.add(conditionDecl);
      /* c8 ignore next 4 - defensive coding for condition addition failure */
      if (conditionResult.isFailure()) {
        errors.addMessage(`Failed to add condition at index ${index}: ${conditionResult.message}`);
        continue;
      }
      const condition = conditionResult.value;

      // Validate that the assigned index matches our expected index
      const expectedIndexResult = Convert.conditionIndex.convert(index);
      /* c8 ignore next 4 - defensive coding for invalid condition index conversion */
      if (expectedIndexResult.isFailure()) {
        errors.addMessage(`Invalid condition index ${index}: ${expectedIndexResult.message}`);
        continue;
      }
      const expectedIndex = expectedIndexResult.value;

      /* c8 ignore next 5 - defensive coding for condition index mismatch */
      if (condition.index !== expectedIndex) {
        errors.addMessage(
          `Index mismatch at condition ${index}: expected ${expectedIndex}, got ${condition.index}`
        );
      }
    }

    return errors.hasMessages ? fail(errors.toString()) : succeed(conditionCollector);
  }

  /**
   * Reconstructs a ConditionSetCollector from compiled data.
   * @param compiled - The compiled resource collection
   * @param conditions - The reconstructed ConditionCollector
   * @returns The reconstructed ConditionSetCollector
   * @internal
   */
  private _buildConditionSets(
    compiled: ResourceJson.Compiled.ICompiledResourceCollection,
    conditions: ConditionCollector
  ): Result<ConditionSetCollector> {
    const errors = new MessageAggregator();

    const conditionSetCollectorResult = ConditionSetCollector.create({ conditions });
    /* c8 ignore next 3 - defensive coding for ConditionSetCollector creation failure */
    if (conditionSetCollectorResult.isFailure()) {
      return conditionSetCollectorResult;
    }
    const conditionSetCollector = conditionSetCollectorResult.value;

    for (const [index, compiledConditionSet] of compiled.conditionSets.entries()) {
      const referencedConditionsResult = mapResults(
        compiledConditionSet.conditions.map((conditionIndex) => conditions.getAt(conditionIndex))
      );
      if (referencedConditionsResult.isFailure()) {
        errors.addMessage(
          `Failed to resolve conditions for condition set ${index}: ${referencedConditionsResult.message}`
        );
        continue;
      }
      const referencedConditions = referencedConditionsResult.value;

      const conditionSetResult = conditionSetCollector.validating.getOrAdd(referencedConditions);
      /* c8 ignore next 4 - defensive coding for condition set addition failure */
      if (conditionSetResult.isFailure()) {
        errors.addMessage(`Failed to add condition set at index ${index}: ${conditionSetResult.message}`);
        continue;
      }
      const conditionSet = conditionSetResult.value;

      // Validate that the assigned index matches our expected index
      const expectedIndexResult = Convert.conditionSetIndex.convert(index);
      /* c8 ignore next 4 - defensive coding for invalid condition set index conversion */
      if (expectedIndexResult.isFailure()) {
        errors.addMessage(`Invalid condition set index ${index}: ${expectedIndexResult.message}`);
        continue;
      }
      const expectedIndex = expectedIndexResult.value;

      /* c8 ignore next 5 - defensive coding for condition set index mismatch */
      if (conditionSet.index !== expectedIndex) {
        errors.addMessage(
          `Index mismatch at condition set ${index}: expected ${expectedIndex}, got ${conditionSet.index}`
        );
      }
    }

    return errors.hasMessages ? fail(errors.toString()) : succeed(conditionSetCollector);
  }

  /**
   * Reconstructs an AbstractDecisionCollector from compiled data.
   * @param compiled - The compiled resource collection
   * @param conditionSets - The reconstructed ConditionSetCollector
   * @returns The reconstructed AbstractDecisionCollector
   * @internal
   */
  private _buildDecisions(
    compiled: ResourceJson.Compiled.ICompiledResourceCollection,
    conditionSets: ConditionSetCollector
  ): Result<AbstractDecisionCollector> {
    const errors = new MessageAggregator();

    const decisionCollectorResult = AbstractDecisionCollector.create({ conditionSets });
    /* c8 ignore next 3 - defensive coding for AbstractDecisionCollector creation failure */
    if (decisionCollectorResult.isFailure()) {
      return decisionCollectorResult;
    }
    const decisionCollector = decisionCollectorResult.value;

    for (const [index, compiledDecision] of compiled.decisions.entries()) {
      const referencedConditionSetsResult = mapResults(
        compiledDecision.conditionSets.map((conditionSetIndex) => conditionSets.getAt(conditionSetIndex))
      );
      if (referencedConditionSetsResult.isFailure()) {
        errors.addMessage(
          `Failed to resolve condition sets for decision ${index}: ${referencedConditionSetsResult.message}`
        );
        continue;
      }
      const referencedConditionSets = referencedConditionSetsResult.value;

      const decisionResult = decisionCollector.validating.getOrAdd(referencedConditionSets);
      /* c8 ignore next 4 - defensive coding for decision addition failure */
      if (decisionResult.isFailure()) {
        errors.addMessage(`Failed to add decision at index ${index}: ${decisionResult.message}`);
        continue;
      }
      const decision = decisionResult.value;

      // Validate that the assigned index matches our expected index
      const expectedIndexResult = Convert.decisionIndex.convert(index);
      /* c8 ignore next 4 - defensive coding for invalid decision index conversion */
      if (expectedIndexResult.isFailure()) {
        errors.addMessage(`Invalid decision index ${index}: ${expectedIndexResult.message}`);
        continue;
      }
      const expectedIndex = expectedIndexResult.value;

      /* c8 ignore next 5 - defensive coding for decision index mismatch */
      if (decision.index !== expectedIndex) {
        errors.addMessage(
          `Index mismatch at decision ${index}: expected ${expectedIndex}, got ${decision.index}`
        );
      }
    }

    return errors.hasMessages ? fail(errors.toString()) : succeed(decisionCollector);
  }

  /**
   * Reconstructs a ValidatingResultMap of resources from compiled data.
   * @param compiled - The compiled resource collection
   * @param resourceTypes - The reconstructed ResourceTypeCollector
   * @param decisions - The reconstructed AbstractDecisionCollector
   * @returns The reconstructed ValidatingResultMap of resources
   * @internal
   */
  private _buildResources(
    compiled: ResourceJson.Compiled.ICompiledResourceCollection,
    resourceTypes: ResourceTypeCollector,
    decisions: AbstractDecisionCollector
  ): Result<ValidatingResultMap<ResourceId, IResource>> {
    const errors = new MessageAggregator();

    const resourceMap = new ValidatingResultMap<ResourceId, IResource>({
      converters: new Collections.KeyValueConverters<ResourceId, IResource>({
        key: Convert.resourceId,
        value: (from: unknown): Result<IResource> => {
          return Validate.resource.validate(from);
        }
      })
    });

    for (const compiledResource of compiled.resources) {
      const resourceTypeResult = resourceTypes.getAt(compiledResource.type);
      if (resourceTypeResult.isFailure()) {
        errors.addMessage(
          `Invalid resource type index ${compiledResource.type} for resource ${compiledResource.id}: ${resourceTypeResult.message}`
        );
        continue;
      }
      const resourceType = resourceTypeResult.value;

      const decisionResult = decisions.getAt(compiledResource.decision);
      if (decisionResult.isFailure()) {
        errors.addMessage(
          `Invalid decision index ${compiledResource.decision} for resource ${compiledResource.id}: ${decisionResult.message}`
        );
        continue;
      }
      const decision = decisionResult.value;

      // Build candidates from compiled data
      const candidateDeclsResult = mapResults(
        compiledResource.candidates.map((compiledCandidate) =>
          Converters.jsonObject.convert(compiledCandidate.json).onSuccess((json) => {
            return succeed({
              json,
              isPartial: compiledCandidate.isPartial,
              mergeMethod: compiledCandidate.mergeMethod
            });
          })
        )
      );
      if (candidateDeclsResult.isFailure()) {
        errors.addMessage(
          `Failed to convert candidate JSON for resource ${compiledResource.id}: ${candidateDeclsResult.message}`
        );
        continue;
      }
      const candidateDecls = candidateDeclsResult.value;

      // Create minimal candidates that implement IResourceCandidate
      const candidates: IResourceCandidate[] = candidateDecls.map((candidateDecl) => ({
        json: candidateDecl.json,
        isPartial: candidateDecl.isPartial,
        mergeMethod: candidateDecl.mergeMethod
      }));

      const candidatesWithConditionSets = decision.candidates.map((baseCandidate, idx) => ({
        conditionSet: baseCandidate.conditionSet,
        value: candidates[idx].json
      }));

      const concreteDecisionResult = ConcreteDecision.create({
        decisions,
        candidates: candidatesWithConditionSets
      });
      /* c8 ignore next 6 - defensive coding for ConcreteDecision creation failure */
      if (concreteDecisionResult.isFailure()) {
        errors.addMessage(
          `Failed to create concrete decision for resource ${compiledResource.id}: ${concreteDecisionResult.message}`
        );
        continue;
      }
      const concreteDecision = concreteDecisionResult.value;

      const { value: name, message: nameError } = Helpers.getNameForResourceId(compiledResource.id);
      /* c8 ignore next 4 - defense in depth nearly impossible to reproduce */
      if (nameError !== undefined) {
        errors.addMessage(`Failed to get name for resource ${compiledResource.id}: ${nameError}`);
        continue;
      }

      // Create minimal resource that implements IResource
      const resource: IResource = {
        id: compiledResource.id,
        name,
        resourceType,
        decision: concreteDecision,
        candidates
      };

      const setResult = resourceMap.set(compiledResource.id, resource);
      /* c8 ignore next 3 - defensive coding for resource map set failure */
      if (setResult.isFailure()) {
        errors.addMessage(`Failed to add resource ${compiledResource.id}: ${setResult.message}`);
      }
    }

    return errors.hasMessages ? fail(errors.toString()) : succeed(resourceMap);
  }
}
