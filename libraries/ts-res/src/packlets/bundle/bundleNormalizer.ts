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
  ): Result<ResourceManagerBuilder> {
    // Create a fresh builder using the same system configuration
    return ResourceManagerBuilder.create({
      qualifiers: systemConfig.qualifiers,
      resourceTypes: systemConfig.resourceTypes
    }).onSuccess((normalizedBuilder) => {
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
}
