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

import { captureResult, fail, Logging, MessageAggregator, Result, succeed } from '@fgv/ts-utils';
import { JsonValue, isJsonObject } from '@fgv/ts-json-base';
import { Diff } from '@fgv/ts-json';
import { ResourceId } from '../common';
import { IResourceResolver } from '../common';
import { ResourceManagerBuilder } from './resourceManagerBuilder';
import { ResourceResolver } from '../runtime';
import * as ResourceJson from '../resource-json';
import * as Context from '../context';

/**
 * Interface for parameters to create a {@link Resources.DeltaGenerator | DeltaGenerator}.
 * @public
 */
export interface IDeltaGeneratorParams {
  /**
   * The baseline resource resolver to compare against.
   */
  baselineResolver: IResourceResolver;

  /**
   * The delta resource resolver containing changes.
   */
  deltaResolver: IResourceResolver;

  /**
   * The resource manager to clone and update.
   */
  resourceManager: ResourceManagerBuilder;

  /**
   * Optional logger for status and error reporting.
   */
  logger?: Logging.ILogger;
}

/**
 * Interface for options controlling delta generation behavior.
 * @public
 */
export interface IDeltaGeneratorOptions {
  /**
   * Context to use when resolving resources. If not provided, uses empty context.
   */
  context?: Context.IContextDecl;

  /**
   * Array of specific resource IDs to include in delta generation.
   * If not provided, generates deltas for all resources in the delta resolver.
   */
  resourceIds?: ReadonlyArray<string>;

  /**
   * Whether to skip resources that haven't changed. Default: true.
   */
  skipUnchanged?: boolean;
}

/**
 * Result of processing a single resource delta.
 * @internal
 */
interface IResourceDeltaResult {
  type: 'updated' | 'new' | 'skipped';
  resourceId: ResourceId;
}

/**
 * Class for generating resource deltas between baseline and delta resolvers.
 * Creates partial/augment candidates for updated resources and full/replace candidates for new resources.
 * Uses Diff.jsonThreeWayDiff for efficient delta computation.
 * @public
 */
export class DeltaGenerator {
  /**
   * The baseline resource resolver to compare against.
   * @internal
   */
  private readonly _baselineResolver: IResourceResolver;

  /**
   * The delta resource resolver containing changes.
   * @internal
   */
  private readonly _deltaResolver: IResourceResolver;

  /**
   * The resource manager to clone and update.
   * @internal
   */
  private readonly _resourceManager: ResourceManagerBuilder;

  /**
   * Logger for status and error reporting.
   * @internal
   */
  private readonly _logger: Logging.ILogger;

  /**
   * Constructor for a {@link Resources.DeltaGenerator | DeltaGenerator} object.
   * @param params - Parameters to create a new {@link Resources.DeltaGenerator | DeltaGenerator}.
   * @internal
   */
  protected constructor(params: IDeltaGeneratorParams) {
    this._baselineResolver = params.baselineResolver;
    this._deltaResolver = params.deltaResolver;
    this._resourceManager = params.resourceManager;
    this._logger = params.logger ?? new Logging.NoOpLogger();
  }

  /**
   * Creates a new {@link Resources.DeltaGenerator | DeltaGenerator} object.
   * @param params - Parameters to create a new {@link Resources.DeltaGenerator | DeltaGenerator}.
   * @returns `Success` with the new {@link Resources.DeltaGenerator | DeltaGenerator} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(params: IDeltaGeneratorParams): Result<DeltaGenerator> {
    return captureResult(() => new DeltaGenerator(params));
  }

  /**
   * Generates deltas between baseline and delta resolvers.
   * Creates a cloned resource manager with partial/augment candidates for updates
   * and full/replace candidates for new resources.
   *
   * @param options - Options controlling delta generation behavior.
   * @returns `Success` with the updated resource manager if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public generate(options?: IDeltaGeneratorOptions): Result<ResourceManagerBuilder> {
    this._logger.info('Starting delta generation');

    const context = options?.context ?? {};
    const skipUnchanged = options?.skipUnchanged ?? true;

    return this._validateContext(context)
      .onSuccess((validatedContext) => this._enumerateTargetResources(options?.resourceIds, validatedContext))
      .onSuccess((resourceIds) => {
        return this._cloneResourceManager()
          .onSuccess((clonedManager) =>
            this._generateDeltas(clonedManager, resourceIds, context, skipUnchanged)
          )
          .onSuccess((manager) => {
            this._logger.info(`Delta generation completed successfully with ${manager.size} resources`);
            return succeed(manager);
          });
      });
  }

  /**
   * Validates the provided context declaration.
   * @param context - The context declaration to validate.
   * @returns `Success` with the validated context if successful, `Failure` otherwise.
   * @internal
   */
  private _validateContext(context: Context.IContextDecl): Result<Context.IValidatedContextDecl> {
    return this._resourceManager.validateContext(context);
  }

  /**
   * Enumerates target resource IDs for delta generation.
   * If specific resource IDs are provided, uses those. Otherwise, discovers all resources
   * from both the baseline resource manager and the delta resolver to ensure comprehensive
   * coverage of all potential resources.
   *
   * @param requestedIds - Optional array of specific resource IDs to target.
   * @param context - The validated context to use for resource discovery.
   * @returns `Success` with array of resource IDs if successful, `Failure` otherwise.
   * @internal
   */
  private _enumerateTargetResources(
    requestedIds: ReadonlyArray<string> | undefined,
    context: Context.IValidatedContextDecl
  ): Result<ReadonlyArray<ResourceId>> {
    if (requestedIds && requestedIds.length > 0) {
      this._logger.info(`Using ${requestedIds.length} specified resource IDs`);
      // Validate the requested IDs
      const validatedIds: ResourceId[] = [];
      const errors = new MessageAggregator();

      for (const id of requestedIds) {
        const validationResult = this._resourceManager.getBuiltResource(id);
        if (validationResult.isSuccess()) {
          validatedIds.push(id as ResourceId);
        } else {
          errors.addMessage(`Invalid resource ID "${id}": ${validationResult.message}`);
        }
      }

      if (errors.hasMessages) {
        return fail(errors.toString());
      }

      return succeed(validatedIds);
    }

    // Discover resources from both baseline and delta resolvers to ensure comprehensive coverage
    this._logger.info('Discovering resources from both baseline and delta resolvers');

    return this._discoverAllResourceIds().onSuccess((allResourceIds) => {
      this._logger.info(`Discovered ${allResourceIds.length} unique resources across both resolvers`);
      return succeed(allResourceIds);
    });
  }

  /**
   * Discovers all unique resource IDs from both baseline and delta resolvers.
   * Creates a union of resource IDs from the baseline resource manager and delta resolver's
   * resource manager to ensure comprehensive coverage of all resources.
   *
   * @returns `Success` with array of unique resource IDs if successful, `Failure` otherwise.
   * @internal
   */
  private _discoverAllResourceIds(): Result<ReadonlyArray<ResourceId>> {
    // Get resource IDs from baseline resource manager
    return this._resourceManager.getAllBuiltResources().onSuccess((baselineResources) => {
      const baselineResourceIds = baselineResources.map((r) => r.id);
      this._logger.detail(`Found ${baselineResourceIds.length} resources in baseline`);

      // Extract the delta resolver's resource manager to get its resource IDs
      // Note: We need to cast to access the resourceManager property since IResourceResolver
      // interface doesn't expose it, but the concrete ResourceResolver implementation does
      const deltaResolverResourceManager = (this._deltaResolver as unknown as ResourceResolver)
        .resourceManager;

      if (!deltaResolverResourceManager || !deltaResolverResourceManager.builtResources) {
        // Fallback: just use baseline resources if delta resolver doesn't expose resource manager
        this._logger.warn('Delta resolver does not expose resource manager, using baseline resources only');
        return succeed(baselineResourceIds);
      }

      // Get resource IDs from delta resolver's resource manager using the builtResources keys
      const deltaResourceIds = Array.from(deltaResolverResourceManager.builtResources.keys());
      this._logger.detail(`Found ${deltaResourceIds.length} resources in delta`);

      // Create a union of resource IDs from both sources
      const allResourceIds = new Set<ResourceId>();

      // Add baseline resource IDs
      baselineResourceIds.forEach((id) => {
        allResourceIds.add(id);
      });

      // Add delta resource IDs
      deltaResourceIds.forEach((id) => {
        allResourceIds.add(id);
      });

      const uniqueResourceIds = Array.from(allResourceIds);
      this._logger.detail(`Created union of ${uniqueResourceIds.length} unique resource IDs`);

      return succeed(uniqueResourceIds);
    });
  }

  /**
   * Creates a clone of the resource manager for delta operations.
   * @returns `Success` with the cloned resource manager if successful, `Failure` otherwise.
   * @internal
   */
  private _cloneResourceManager(): Result<ResourceManagerBuilder> {
    this._logger.info('Cloning resource manager');
    return this._resourceManager.clone();
  }

  /**
   * Generates deltas for the specified resources and adds them to the cloned manager.
   *
   * @param clonedManager - The cloned resource manager to update.
   * @param resourceIds - Array of resource IDs to process.
   * @param context - The context to use for resource resolution.
   * @param skipUnchanged - Whether to skip resources that haven't changed.
   * @returns `Success` with the updated manager if successful, `Failure` otherwise.
   * @internal
   */
  private _generateDeltas(
    clonedManager: ResourceManagerBuilder,
    resourceIds: ReadonlyArray<ResourceId>,
    context: Context.IContextDecl,
    skipUnchanged: boolean
  ): Result<ResourceManagerBuilder> {
    this._logger.info(`Generating deltas for ${resourceIds.length} resources`);

    const errors = new MessageAggregator();
    let processedCount = 0;
    let changedCount = 0;
    let newCount = 0;
    let skippedCount = 0;

    for (const resourceId of resourceIds) {
      this._logger.detail(`Processing resource: ${resourceId}`);

      const result = this._generateResourceDelta(clonedManager, resourceId, context, skipUnchanged);
      if (result.isFailure()) {
        errors.addMessage(`${resourceId}: ${result.message}`);
        continue;
      }

      processedCount++;

      // Track statistics based on result
      const deltaResult = result.value;
      if (deltaResult.type === 'skipped') {
        skippedCount++;
      } else if (deltaResult.type === 'new') {
        newCount++;
      } else {
        changedCount++;
      }
    }

    this._logger.info(
      `Processed ${processedCount} resources: ${changedCount} updated, ${newCount} new, ${skippedCount} skipped`
    );

    if (errors.hasMessages) {
      return fail(`Delta generation failed with errors:\n${errors.toString()}`);
    }

    return succeed(clonedManager);
  }

  /**
   * Generates a delta for a single resource and adds appropriate candidates to the manager.
   *
   * @param manager - The resource manager to update.
   * @param resourceId - The resource ID to process.
   * @param context - The context to use for resource resolution.
   * @param skipUnchanged - Whether to skip resources that haven't changed.
   * @returns `Success` with the resource delta result if successful, `Failure` otherwise.
   * @internal
   */
  private _generateResourceDelta(
    manager: ResourceManagerBuilder,
    resourceId: ResourceId,
    context: Context.IContextDecl,
    skipUnchanged: boolean
  ): Result<IResourceDeltaResult> {
    // Resolve values from both resolvers
    const baselineResult = this._baselineResolver.resolveComposedResourceValue(resourceId);
    const deltaResult = this._deltaResolver.resolveComposedResourceValue(resourceId);

    const baselineExists = baselineResult.isSuccess();
    const deltaExists = deltaResult.isSuccess();

    if (deltaExists && !baselineExists) {
      // New resource - exists in delta but not in baseline
      this._logger.detail(`${resourceId}: New resource detected (exists in delta only)`);
      return this._createNewResourceCandidate(manager, resourceId, deltaResult.value, context).onSuccess(() =>
        succeed({ type: 'new' as const, resourceId })
      );
    }

    if (baselineExists && !deltaExists) {
      // Baseline-only resource - exists in baseline but not in delta (potential deletion)
      // For now, skip these resources since delete merge method is not yet implemented
      // TODO: When 'delete' merge method is available, create deletion candidates here
      this._logger.detail(
        `${resourceId}: Baseline-only resource detected, skipping (delete merge method not yet implemented)`
      );
      return succeed({ type: 'skipped' as const, resourceId });
    }

    if (!baselineExists && !deltaExists) {
      // Resource doesn't exist in either resolver - this shouldn't happen due to enumeration logic
      return fail(`Resource ${resourceId} not found in either baseline or delta resolvers`);
    }

    // Both resolvers have the resource - check for changes
    // At this point, both results are successful so values are guaranteed to exist
    const baselineValue = baselineResult.value!;
    const deltaValue = deltaResult.value!;

    // Check if values are identical
    if (skipUnchanged && this._areValuesIdentical(baselineValue, deltaValue)) {
      this._logger.detail(`${resourceId}: No changes detected, skipping`);
      return succeed({ type: 'skipped' as const, resourceId });
    }

    // Updated resource - compute delta and create partial/augment candidate
    this._logger.detail(`${resourceId}: Changes detected, computing delta`);
    return this._createDeltaCandidate(manager, resourceId, baselineValue, deltaValue, context).onSuccess(() =>
      succeed({ type: 'updated' as const, resourceId })
    );
  }

  /**
   * Checks if two JSON values are identical.
   * @param value1 - First value to compare.
   * @param value2 - Second value to compare.
   * @returns True if values are identical, false otherwise.
   * @internal
   */
  private _areValuesIdentical(value1: JsonValue, value2: JsonValue): boolean {
    return JSON.stringify(value1) === JSON.stringify(value2);
  }

  /**
   * Creates a new resource candidate for a newly discovered resource.
   * Uses full/replace merge method since this is a completely new resource.
   *
   * @param manager - The resource manager to update.
   * @param resourceId - The resource ID for the new resource.
   * @param value - The resolved value for the new resource.
   * @param context - The context used for resolution.
   * @returns `Success` if the candidate was added successfully, `Failure` otherwise.
   * @internal
   */
  private _createNewResourceCandidate(
    manager: ResourceManagerBuilder,
    resourceId: ResourceId,
    value: JsonValue,
    context: Context.IContextDecl
  ): Result<void> {
    if (!isJsonObject(value)) {
      return fail(`Resource value must be a JSON object, got ${typeof value}`);
    }

    const candidateDecl: ResourceJson.Json.ILooseResourceCandidateDecl = {
      id: resourceId,
      json: value,
      conditions: Object.keys(context).length > 0 ? context : undefined,
      isPartial: false,
      mergeMethod: 'replace',
      resourceTypeName: 'json' // Use 'json' resource type for new JSON resources
    };

    const result = manager.addLooseCandidate(candidateDecl);
    if (result.isFailure()) {
      return fail(result.message);
    }
    return succeed(undefined);
  }

  /**
   * Creates a delta candidate for an updated resource.
   * Computes the difference between baseline and delta values and creates
   * a partial/augment candidate with only the changed properties.
   *
   * @param manager - The resource manager to update.
   * @param resourceId - The resource ID for the updated resource.
   * @param baselineValue - The baseline resolved value.
   * @param deltaValue - The delta resolved value.
   * @param context - The context used for resolution.
   * @returns `Success` if the candidate was added successfully, `Failure` otherwise.
   * @internal
   */
  private _createDeltaCandidate(
    manager: ResourceManagerBuilder,
    resourceId: ResourceId,
    baselineValue: JsonValue,
    deltaValue: JsonValue,
    context: Context.IContextDecl
  ): Result<void> {
    // Compute three-way diff to get only the changed properties
    return Diff.jsonThreeWayDiff(baselineValue, deltaValue).onSuccess((diff) => {
      if (diff.identical) {
        // This shouldn't happen if we checked for identity earlier, but be defensive
        this._logger.warn(`${resourceId}: Diff reports identical values, skipping`);
        return succeed(undefined);
      }

      // Use onlyInB (second object) which contains new/changed properties
      const deltaChanges = diff.onlyInB;

      if (!isJsonObject(deltaChanges)) {
        return fail(`Delta changes must be a JSON object, got ${typeof deltaChanges}`);
      }

      // TODO: Handle deletions using 'augment' merge method with null values
      // Note: The 'delete' merge type is not yet implemented in ts-res, so we use 'augment'
      // with null values for deletion semantics (as used in ts-res-ui-components).
      // When the 'delete' merge type is available, this should be updated to use it.

      const candidateDecl: ResourceJson.Json.ILooseResourceCandidateDecl = {
        id: resourceId,
        json: deltaChanges,
        conditions: Object.keys(context).length > 0 ? context : undefined,
        isPartial: true,
        mergeMethod: 'augment',
        resourceTypeName: undefined // Will be inferred by the manager
      };

      const result = manager.addLooseCandidate(candidateDecl);
      if (result.isFailure()) {
        return fail(result.message);
      }
      return succeed(undefined);
    });
  }
}
