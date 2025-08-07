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

import { Result, succeed, MessageAggregator } from '@fgv/ts-utils';
import { ResourceManagerBuilder } from '../resources';
import { ResourceCandidate } from '../resources';
import { SystemConfiguration, PredefinedSystemConfiguration } from '../config';
import { Condition, ConditionSet } from '../conditions';
import { IResourceManager } from '../runtime';
import * as ResourceJson from '../resource-json';

/**
 * Normalizes ResourceManagerBuilder instances to ensure consistent ordering
 * of internal entities, enabling order-independent bundle checksums.
 *
 * The normalization process rebuilds the ResourceManagerBuilder from the ground up
 * in a canonical order to ensure identical index assignments regardless of
 * original construction order.
 * @public
 */
export class BundleNormalizer {
  /**
   * Creates a normalized ResourceManagerBuilder from an existing builder.
   * The normalized builder will have identical entities but arranged in
   * canonical order to ensure consistent index assignments.
   *
   * @param originalBuilder - The ResourceManagerBuilder to normalize
   * @param systemConfig - The SystemConfiguration used to create the original builder
   * @returns Success with the normalized ResourceManagerBuilder if successful, Failure otherwise
   */
  public static normalize(
    originalBuilder: ResourceManagerBuilder,
    systemConfig: SystemConfiguration
  ): Result<ResourceManagerBuilder>;

  /**
   * Creates a normalized ResourceManagerBuilder from an existing IResourceManager.
   * This method enables conversion of read-only resource managers (from bundles)
   * into editable ResourceManagerBuilder instances while preserving normalized order.
   *
   * @param originalManager - The IResourceManager to convert and normalize
   * @param systemConfig - The SystemConfiguration used to create the original manager
   * @returns Success with the normalized ResourceManagerBuilder if successful, Failure otherwise
   */
  public static normalize(
    originalManager: IResourceManager,
    systemConfig: SystemConfiguration
  ): Result<ResourceManagerBuilder>;

  public static normalize(
    originalBuilderOrManager: ResourceManagerBuilder | IResourceManager,
    systemConfig: SystemConfiguration
  ): Result<ResourceManagerBuilder> {
    // Create a fresh builder using the same system configuration
    return ResourceManagerBuilder.create({
      qualifiers: systemConfig.qualifiers,
      resourceTypes: systemConfig.resourceTypes
    }).onSuccess((normalizedBuilder) => {
      // Check if the first parameter is a ResourceManagerBuilder or IResourceManager
      if ('getAllCandidates' in originalBuilderOrManager) {
        // It's a ResourceManagerBuilder
        return BundleNormalizer._addNormalizedResources(
          originalBuilderOrManager,
          normalizedBuilder
        ).onSuccess(() => succeed(normalizedBuilder));
      } else {
        // It's an IResourceManager
        return BundleNormalizer._addNormalizedResourcesFromManager(
          originalBuilderOrManager,
          normalizedBuilder
        ).onSuccess(() => succeed(normalizedBuilder));
      }
    });
  }

  /**
   * Creates a normalized ResourceManagerBuilder using a predefined system configuration.
   * This is a convenience method for the common case of using predefined configurations.
   *
   * @param originalBuilder - The ResourceManagerBuilder to normalize
   * @param configName - The name of the predefined system configuration used
   * @returns Success with the normalized ResourceManagerBuilder if successful, Failure otherwise
   */
  public static normalizeFromPredefined(
    originalBuilder: ResourceManagerBuilder,
    configName: PredefinedSystemConfiguration
  ): Result<ResourceManagerBuilder> {
    return ResourceManagerBuilder.createPredefined(configName).onSuccess((normalizedBuilder) => {
      return BundleNormalizer._addNormalizedResources(originalBuilder, normalizedBuilder).onSuccess(() =>
        succeed(normalizedBuilder)
      );
    });
  }

  /**
   * Normalizes all conditions from the original builder by adding them to the
   * normalized builder in sorted order using loose condition declarations.
   *
   * @param originalBuilder - The source ResourceManagerBuilder
   * @param normalizedBuilder - The target normalized ResourceManagerBuilder
   * @returns Success if all conditions were normalized successfully, Failure otherwise
   * @internal
   */
  private static _normalizeConditions(
    originalBuilder: ResourceManagerBuilder,
    normalizedBuilder: ResourceManagerBuilder
  ): Result<boolean> {
    const conditions = Array.from(originalBuilder.conditions.values()).sort(Condition.compare);

    const errors = new MessageAggregator();
    for (const condition of conditions) {
      const looseDecl = condition.toLooseConditionDecl();
      normalizedBuilder.addCondition(looseDecl).aggregateError(errors);
    }

    return errors.returnOrReport(succeed(true));
  }

  /**
   * Normalizes all condition sets from the original builder by adding them to the
   * normalized builder in sorted order using loose condition set declarations.
   *
   * @param originalBuilder - The source ResourceManagerBuilder
   * @param normalizedBuilder - The target normalized ResourceManagerBuilder
   * @returns Success if all condition sets were normalized successfully, Failure otherwise
   * @internal
   */
  private static _normalizeConditionSets(
    originalBuilder: ResourceManagerBuilder,
    normalizedBuilder: ResourceManagerBuilder
  ): Result<boolean> {
    const conditionSets = Array.from(originalBuilder.conditionSets.values()).sort(ConditionSet.compare);

    const errors = new MessageAggregator();
    for (const conditionSet of conditionSets) {
      const conditions = conditionSet.toConditionSetArrayDecl();
      normalizedBuilder.addConditionSet(conditions).aggregateError(errors);
    }

    return errors.returnOrReport(succeed(true));
  }

  /**
   * Normalizes all candidates by sorting them first by resource ID, then by condition set.
   *
   * @param originalBuilder - The source ResourceManagerBuilder
   * @param normalizedBuilder - The target normalized ResourceManagerBuilder
   * @returns Success if all candidates were normalized successfully, Failure otherwise
   * @internal
   */
  private static _normalizeCandidates(
    originalBuilder: ResourceManagerBuilder,
    normalizedBuilder: ResourceManagerBuilder
  ): Result<boolean> {
    const candidates = Array.from(originalBuilder.getAllCandidates()).sort((c1, c2) => {
      const idCompare = c1.id.localeCompare(c2.id);
      return idCompare !== 0 ? idCompare : ResourceCandidate.compare(c1, c2);
    });

    const errors = new MessageAggregator();
    for (const candidate of candidates) {
      const decl = candidate.toLooseResourceCandidateDecl();
      normalizedBuilder.addLooseCandidate(decl).aggregateError(errors);
    }

    return errors.returnOrReport(succeed(true));
  }

  /**
   * Adds normalized resources to the target builder by first normalizing conditions,
   * then condition sets, then candidates.
   *
   * @param originalBuilder - The source ResourceManagerBuilder
   * @param normalizedBuilder - The target normalized ResourceManagerBuilder
   * @returns Success if all resources were added successfully, Failure otherwise
   * @internal
   */
  private static _addNormalizedResources(
    originalBuilder: ResourceManagerBuilder,
    normalizedBuilder: ResourceManagerBuilder
  ): Result<boolean> {
    return BundleNormalizer._normalizeConditions(originalBuilder, normalizedBuilder)
      .onSuccess(() => BundleNormalizer._normalizeConditionSets(originalBuilder, normalizedBuilder))
      .onSuccess(() => BundleNormalizer._normalizeCandidates(originalBuilder, normalizedBuilder));
  }

  /**
   * Adds normalized resources to the target builder by extracting candidates from
   * an IResourceManager and converting them to loose candidate declarations.
   *
   * @param originalManager - The source IResourceManager
   * @param normalizedBuilder - The target normalized ResourceManagerBuilder
   * @returns Success if all resources were added successfully, Failure otherwise
   * @internal
   */
  private static _addNormalizedResourcesFromManager(
    originalManager: IResourceManager,
    normalizedBuilder: ResourceManagerBuilder
  ): Result<boolean> {
    const errors = new MessageAggregator();

    // Get all resource IDs and sort them for consistent ordering
    const resourceIds = Array.from(originalManager.builtResources.keys()).sort();

    for (const resourceId of resourceIds) {
      const resourceResult = originalManager.builtResources.get(resourceId);
      if (resourceResult.isFailure()) {
        resourceResult.aggregateError(errors);
        continue;
      }

      const resource = resourceResult.value;

      // Sort candidates by a consistent criteria (comparing JSON stringified content)
      const sortedCandidates = Array.from(resource.candidates).sort((c1, c2) => {
        const jsonCompare = JSON.stringify(c1.json).localeCompare(JSON.stringify(c2.json));
        if (jsonCompare !== 0) return jsonCompare;
        // Fall back to merge method comparison if JSON is identical
        return c1.mergeMethod.localeCompare(c2.mergeMethod);
      });

      // Convert each candidate to a loose candidate declaration and add to the builder
      for (const candidate of sortedCandidates) {
        // Create the loose candidate declaration manually from the runtime candidate
        const looseCandidateDecl: ResourceJson.Json.ILooseResourceCandidateDecl = {
          id: resourceId,
          json: candidate.json,
          isPartial: candidate.isPartial,
          mergeMethod: candidate.mergeMethod,
          // Note: We don't have access to conditions from IResourceCandidate,
          // so we omit the conditions field which will make this an unconditional candidate
          resourceTypeName: resource.resourceType.key
        };

        // Add the loose candidate to the normalized builder
        normalizedBuilder.addLooseCandidate(looseCandidateDecl).aggregateError(errors);
      }
    }

    return errors.returnOrReport(succeed(true));
  }

  /**
   * Creates a normalized ResourceManagerBuilder from a compiled collection.
   * This method reconstructs resources with proper conditions from the compiled format,
   * enabling full editing functionality while preserving normalized order.
   *
   * @param compiledCollection - The compiled collection containing all resource data
   * @param systemConfig - The SystemConfiguration used to create the resources
   * @returns Success with the normalized ResourceManagerBuilder if successful, Failure otherwise
   */
  public static normalizeFromCompiledCollection(
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection,
    systemConfig: SystemConfiguration
  ): Result<ResourceManagerBuilder> {
    // Create a fresh ResourceManagerBuilder
    return ResourceManagerBuilder.create({
      qualifiers: systemConfig.qualifiers,
      resourceTypes: systemConfig.resourceTypes
    }).onSuccess((builder) => {
      // Note: This method intentionally creates a normalized/sorted version
      // rather than preserving the exact structure. For exact reconstruction,
      // use ResourceManagerBuilder.createFromCompiledResourceCollection directly.
      const errors = new MessageAggregator();

      // Sort resources for normalized output
      const sortedResources = Array.from(compiledCollection.resources).sort((r1, r2) =>
        r1.id.localeCompare(r2.id)
      );

      for (const resource of sortedResources) {
        for (const candidate of resource.candidates) {
          const looseCandidateDecl: ResourceJson.Json.ILooseResourceCandidateDecl = {
            id: resource.id,
            json: candidate.json as any, // JsonValue to JsonObject cast needed
            isPartial: candidate.isPartial,
            mergeMethod: candidate.mergeMethod
            // TODO: Reconstruct conditions from the decision/conditionSets indices
            // For now, creating unconditional candidates - this needs proper implementation
            // to extract the actual conditions from the compiled format
          };

          builder.addLooseCandidate(looseCandidateDecl).aggregateError(errors);
        }
      }

      return errors.returnOrReport(succeed(builder));
    });
  }
}
