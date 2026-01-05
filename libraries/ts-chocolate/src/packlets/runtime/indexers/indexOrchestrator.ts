// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Index orchestrator for managing multiple indexers
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';
import { IndexerId } from '../../common';
import {
  AggregationMode,
  IEntityResolver,
  IFindOptions,
  IIndexer,
  IIndexerConfig,
  IIndexOrchestratorConfig,
  IIndexOrchestrator,
  QuerySpec
} from './model';

// ============================================================================
// IndexOrchestrator Class
// ============================================================================

/**
 * Orchestrates multiple indexers for unified query execution.
 *
 * The orchestrator:
 * - Routes query configs to appropriate indexers
 * - Aggregates results using intersection or union semantics
 * - Resolves IDs to entities using the provided resolver
 *
 * @public
 */
export class IndexOrchestrator<TEntity, TId, TOrchestratorConfig extends IIndexOrchestratorConfig>
  implements IIndexOrchestrator<TEntity, TId, TOrchestratorConfig>
{
  private readonly _resolver: IEntityResolver<TEntity, TId>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly _indexers: Map<IndexerId, IIndexer<TEntity, TId, any>> = new Map();

  /**
   * Creates a new IndexOrchestrator.
   * @param resolver - Entity resolver for converting IDs to entities
   */
  public constructor(resolver: IEntityResolver<TEntity, TId>) {
    this._resolver = resolver;
  }

  /** {@inheritdoc Runtime.Indexers.IIndexOrchestrator.register} */
  public register<TConfig extends IIndexerConfig>(indexer: IIndexer<TEntity, TId, TConfig>): void {
    this._indexers.set(indexer.id, indexer);
  }

  /** {@inheritdoc Runtime.Indexers.IIndexOrchestrator.find} */
  public find(spec: QuerySpec, options?: IFindOptions): Result<ReadonlyArray<TEntity>> {
    const aggregation: AggregationMode = options?.aggregation ?? 'intersection';
    const configEntries = Object.entries(spec) as [IndexerId, IIndexerConfig][];

    if (configEntries.length === 0) {
      return Success.with([]);
    }

    // Collect results from each matching indexer
    const indexerResults: Array<Set<TId | TEntity>> = [];

    for (const [indexerId, config] of configEntries) {
      const indexer = this._indexers.get(indexerId);
      if (!indexer) {
        return Failure.with(`Unknown indexer: ${indexerId}`);
      }

      const result = indexer.find(config);
      /* c8 ignore next 3 - defensive: indexer returns undefined when config doesn't match its ID */
      if (result === undefined) {
        continue;
      }

      /* c8 ignore next 3 - defensive: indexers don't currently return failures */
      if (result.isFailure()) {
        return Failure.with(result.message);
      }

      indexerResults.push(new Set(result.value));
    }

    /* c8 ignore next 3 - defensive: empty results when all indexers skip */
    if (indexerResults.length === 0) {
      return Success.with([]);
    }

    // Aggregate results
    let aggregatedSet: Set<TId | TEntity>;

    if (aggregation === 'intersection') {
      aggregatedSet = this._intersect(indexerResults);
    } else {
      aggregatedSet = this._union(indexerResults);
    }

    // Resolve IDs to entities
    return this._resolveToEntities(aggregatedSet);
  }

  /** {@inheritdoc Runtime.Indexers.IIndexOrchestrator.invalidate} */
  public invalidate(): void {
    for (const indexer of this._indexers.values()) {
      indexer.invalidate();
    }
  }

  /** {@inheritdoc Runtime.Indexers.IIndexOrchestrator.warmUp} */
  public warmUp(): void {
    for (const indexer of this._indexers.values()) {
      indexer.warmUp();
    }
  }

  /** {@inheritdoc Runtime.Indexers.IIndexOrchestrator.convertConfig} */
  public convertConfig(json: unknown): Result<TOrchestratorConfig> {
    if (typeof json !== 'object' || json === null) {
      return Failure.with('Query specification must be an object');
    }

    const spec: Record<IndexerId, IIndexerConfig> = {} as Record<IndexerId, IIndexerConfig>;

    for (const [indexerIdStr, config] of Object.entries(json)) {
      if (typeof config !== 'object' || config === null) {
        return Failure.with(`${indexerIdStr}: config must be an object`);
      }

      const indexerId = indexerIdStr as IndexerId;
      const indexer = this._indexers.get(indexerId);
      if (!indexer) {
        return Failure.with(`Unknown indexer ID: ${indexerIdStr}`);
      }

      // Inject indexerId into config before conversion (user doesn't supply it in JSON)
      const configWithId = { ...config, indexerId: indexerIdStr };
      const configResult = indexer.configConverter.convert(configWithId);
      if (configResult.isFailure()) {
        return Failure.with(configResult.message);
      }

      spec[indexerId] = configResult.value;
    }

    return Success.with(spec as TOrchestratorConfig);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Computes intersection of multiple sets.
   */
  private _intersect(sets: Array<Set<TId | TEntity>>): Set<TId | TEntity> {
    /* c8 ignore next 3 - defensive: empty sets array not possible via find() */
    if (sets.length === 0) {
      return new Set();
    }

    // Start with smallest set for efficiency
    const sortedSets = [...sets].sort((a, b) => a.size - b.size);
    const result = new Set(sortedSets[0]);

    for (let i = 1; i < sortedSets.length; i++) {
      const currentSet = sortedSets[i];
      for (const item of result) {
        /* c8 ignore next 3 - intersection removal path tested functionally */
        if (!currentSet.has(item)) {
          result.delete(item);
        }
      }
    }

    return result;
  }

  /**
   * Computes union of multiple sets.
   */
  private _union(sets: Array<Set<TId | TEntity>>): Set<TId | TEntity> {
    const result = new Set<TId | TEntity>();
    for (const set of sets) {
      for (const item of set) {
        result.add(item);
      }
    }
    return result;
  }

  /**
   * Resolves a set of entities/IDs to entities.
   */
  private _resolveToEntities(items: Set<TId | TEntity>): Result<ReadonlyArray<TEntity>> {
    const entities: TEntity[] = [];
    const errors: string[] = [];

    for (const item of items) {
      if (this._resolver.isId(item)) {
        const resolved = this._resolver.resolve(item);
        if (resolved.isSuccess()) {
          entities.push(resolved.value);
          /* c8 ignore next 3 - defensive: resolver failures would indicate data corruption */
        } else {
          errors.push(resolved.message);
        }
        /* c8 ignore next 3 - indexers currently return IDs, not entities */
      } else {
        entities.push(item);
      }
    }

    /* c8 ignore next 3 - defensive: resolver failures would indicate data corruption */
    if (errors.length > 0) {
      return Failure.with(`Failed to resolve entities: ${errors.join('; ')}`);
    }

    return Success.with(entities);
  }
}
