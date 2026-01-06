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
 * Indexer infrastructure interfaces and types
 * @packageDocumentation
 */

import { Result } from '@fgv/ts-utils';
/**
 * Interface for a single indexer that can find entities matching a query config.
 *
 * Indexers are templated by:
 * - TEntity: The entity type returned (e.g., IRuntimeRecipe)
 * - TId: The ID type for the entity (e.g., RecipeId)
 * - TConfig: The specific config type for this indexer
 *
 * Indexers can return either entities or IDs - the orchestrator resolves IDs to entities.
 *
 * @public
 */
export interface IIndexer<TEntity, TId, TConfig> {
  /**
   * Finds entities or IDs matching the given configuration.
   * Returns undefined if this indexer has no work to do (config not relevant).
   * Returns empty array if config is relevant but no matches found.
   *
   * @param config - The indexer-specific configuration
   * @returns Array of entities or IDs, undefined if not applicable, or Failure on error
   */
  find(config: TConfig): Result<ReadonlyArray<TEntity | TId>> | undefined;

  /**
   * Invalidates any cached index data.
   * Called when underlying library data changes.
   */
  invalidate(): void;

  /**
   * Pre-builds the index for efficient queries.
   * Called during warmup.
   */
  warmUp(): void;
}

/**
 * Interface for resolving entity IDs to entities.
 * The orchestrator uses this to resolve any IDs returned by indexers.
 *
 * @public
 */
export interface IEntityResolver<TEntity, TId> {
  /**
   * Resolves an entity ID to an entity.
   * @param id - The entity ID
   * @returns Success with entity, or Failure if not found
   */
  resolve(id: TId): Result<TEntity>;

  /**
   * Type guard to check if a value is an ID (not an entity).
   * @param value - The value to check
   * @returns True if the value is an ID
   */
  isId(value: TEntity | TId): value is TId;
}

/**
 * Aggregation mode for combining results from multiple indexers.
 * @public
 */
export type AggregationMode = 'intersection' | 'union';

/**
 * Options for the find operation.
 * @public
 */
export interface IFindOptions {
  /**
   * How to aggregate results from multiple indexers.
   * - 'intersection': Return only entities matching ALL indexers (AND semantics)
   * - 'union': Return entities matching ANY indexer (OR semantics)
   * Defaults to 'intersection'.
   */
  aggregation?: AggregationMode;
}
