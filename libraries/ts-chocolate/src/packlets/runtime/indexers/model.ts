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

import { Converter, Result } from '@fgv/ts-utils';
import { IndexerId } from '../../common';

// ============================================================================
// Indexer Query Configuration
// ============================================================================

/**
 * Base interface for indexer query configurations.
 * Each indexer defines its own configuration type extending this.
 * @public
 */
export interface IIndexerConfig {
  /**
   * The indexer ID that this config targets.
   * Used by the indexer to determine if it should handle this config.
   */
  readonly indexerId: IndexerId;
}

/**
 * A query specification is a record keyed by IndexerId containing configs for each indexer.
 * Indexers check for their own key and return early if not present.
 * @public
 */
export type QuerySpec = Partial<Record<IndexerId, IIndexerConfig>>;

// ============================================================================
// Indexer Interface
// ============================================================================

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
export interface IIndexer<TEntity, TId, TConfig extends IIndexerConfig> {
  /**
   * Unique identifier for this indexer.
   */
  readonly id: IndexerId;

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

  /**
   * Converter for this indexers JSON configuration.
   */
  configConverter: Converter<TConfig>;
}

// ============================================================================
// Entity Resolver Interface
// ============================================================================

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

// ============================================================================
// Index Orchestrator Interface
// ============================================================================

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

/**
 * Configuration for an index orchestrator.
 * A partial record since not all indexers need to be queried at once.
 * @public
 */
export type IIndexOrchestratorConfig = Partial<Record<IndexerId, IIndexerConfig>>;

/**
 * Interface for the index orchestrator that manages multiple indexers.
 *
 * The orchestrator:
 * - Routes query configs to appropriate indexers
 * - Aggregates results across indexers
 * - Resolves IDs to entities
 *
 * @public
 */
export interface IIndexOrchestrator<TEntity, TId, TOrchestratorConfig extends IIndexOrchestratorConfig> {
  /**
   * Finds entities matching the given query specification.
   *
   * @param spec - Query specification with configs keyed by indexer ID
   * @param options - Optional find options
   * @returns Array of matching entities
   */
  find(spec: QuerySpec, options?: IFindOptions): Result<ReadonlyArray<TEntity>>;

  /**
   * Registers an indexer with the orchestrator.
   * @param indexer - The indexer to register
   */
  register<TConfig extends IIndexerConfig>(indexer: IIndexer<TEntity, TId, TConfig>): void;

  /**
   * Invalidates all registered indexers.
   */
  invalidate(): void;

  /**
   * Warms up all registered indexers.
   */
  warmUp(): void;

  /**
   * Converts a JSON object to an orchestrator configuration.
   * @param json - The JSON object
   * @returns The orchestrator configuration
   */
  convertConfig(json: unknown): Result<TOrchestratorConfig>;
}

// ============================================================================
// Well-known Indexer IDs
// ============================================================================

/**
 * Creates an IndexerId from a string literal.
 * @internal
 */
export function indexerId<T extends string>(id: T): IndexerId {
  return id as unknown as IndexerId;
}

/**
 * Well-known indexer IDs for the chocolate library.
 * @public
 */
export const IndexerIds = {
  /** Indexes recipes by ingredient usage */
  recipesByIngredient: indexerId('recipes-by-ingredient'),
  /** Indexes recipes by tag */
  recipesByTag: indexerId('recipes-by-tag'),
  /** Indexes ingredients by tag */
  ingredientsByTag: indexerId('ingredients-by-tag'),
  /** Indexes recipes by chocolate type */
  recipesByChocolateType: indexerId('recipes-by-chocolate-type')
} as const;
