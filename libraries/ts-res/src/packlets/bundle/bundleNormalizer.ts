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

import { Result, succeed, fail } from '@fgv/ts-utils';
import { ResourceManagerBuilder } from '../resources';
import { ResourceCandidate } from '../resources';
import {
  SystemConfiguration,
  PredefinedSystemConfiguration,
  getPredefinedSystemConfiguration
} from '../config';

/**
 * Normalizes ResourceManagerBuilder instances to ensure consistent ordering
 * of internal entities, enabling order-independent bundle checksums.
 *
 * The normalization process rebuilds the ResourceManagerBuilder from the ground up
 * in a canonical order to ensure identical index assignments regardless of
 * original construction order.
 * @internal
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
  ): Result<ResourceManagerBuilder> {
    // For now, use the 'default' predefined configuration to create a fresh builder
    // This should work for most cases since the predefined configs are standardized
    return ResourceManagerBuilder.createPredefined('default').onSuccess((normalizedBuilder) => {
      return BundleNormalizer._addNormalizedResources(originalBuilder, normalizedBuilder).onSuccess(() =>
        succeed(normalizedBuilder)
      );
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
   * Extracts all candidates from the original builder and adds them to the
   * normalized builder in canonical order (using ResourceCandidate.compare).
   *
   * @param originalBuilder - The source ResourceManagerBuilder
   * @param normalizedBuilder - The target normalized ResourceManagerBuilder
   * @returns Success if all resources were added successfully, Failure otherwise
   * @internal
   */
  private static _addNormalizedResources(
    originalBuilder: ResourceManagerBuilder,
    normalizedBuilder: ResourceManagerBuilder
  ): Result<void> {
    // Extract all candidates and sort them using the canonical compare method
    const candidates = Array.from(originalBuilder.getAllCandidates()).sort(ResourceCandidate.compare);

    // Group candidates by resource ID to rebuild resources properly
    const candidatesByResourceId = new Map<string, ResourceCandidate[]>();
    for (const candidate of candidates) {
      const resourceId = candidate.id;
      if (!candidatesByResourceId.has(resourceId)) {
        candidatesByResourceId.set(resourceId, []);
      }
      candidatesByResourceId.get(resourceId)!.push(candidate);
    }

    // Sort resource IDs for consistent processing order
    const sortedResourceIds = Array.from(candidatesByResourceId.keys()).sort();

    // Add each resource with its candidates in normalized order
    for (const resourceId of sortedResourceIds) {
      const resourceCandidates = candidatesByResourceId.get(resourceId)!;

      // Convert candidates to declarations for resource creation
      const candidateDecls = resourceCandidates.map((candidate) => {
        // Convert condition array to condition set declaration (qualifier -> value map)
        const conditions =
          candidate.conditions.conditions.length > 0
            ? Object.fromEntries(
                candidate.conditions.conditions.map((condition) => [
                  condition.qualifier.name,
                  condition.value
                ])
              )
            : undefined;

        return {
          json: candidate.json,
          isPartial: candidate.isPartial,
          mergeMethod: candidate.mergeMethod,
          conditions
        };
      });

      const addResult = normalizedBuilder.addResource({
        id: resourceId,
        resourceTypeName: resourceCandidates[0].resourceType?.key ?? 'json',
        candidates: candidateDecls
      });

      if (addResult.isFailure()) {
        return fail(addResult.message);
      }
    }

    return succeed(undefined);
  }
}
