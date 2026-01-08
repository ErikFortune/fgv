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
 * Base class for index orchestrators
 * @packageDocumentation
 */

import { Failure, Logging, Result, Success } from '@fgv/ts-utils';
import { IEntityResolver } from './model';
import { ChocolateLibrary } from '../chocolateLibrary';

/**
 * Base class for index orchestrators that provides common
 * set operations and entity resolution logic.
 *
 * @typeParam TEntity - The entity type (e.g., IRuntimeRecipe)
 * @typeParam TId - The ID type (e.g., RecipeId)
 *
 * @public
 */
export abstract class BaseIndexerOrchestrator<TEntity, TId> {
  /**
   * The chocolate library being indexed.
   */
  public readonly library: ChocolateLibrary;

  /**
   * The entity resolver for converting IDs to entities.
   */
  protected readonly _resolver: IEntityResolver<TEntity, TId>;

  /**
   * Logger for reporting indexer or orchestrator operations.
   */
  protected get _logger(): Logging.LogReporter<unknown> {
    return this.library.logger;
  }

  /**
   * Creates a new BaseIndexerOrchestrator.
   * @param resolver - The entity resolver
   */
  protected constructor(library: ChocolateLibrary, resolver: IEntityResolver<TEntity, TId>) {
    this.library = library;
    this._resolver = resolver;
  }

  // ============================================================================
  // Protected Helper Methods
  // ============================================================================

  /**
   * Computes intersection of multiple sets.
   * @param sets - Array of sets to intersect
   * @returns Set containing items present in all input sets
   */
  protected _intersect(sets: Array<Set<TId | TEntity>>): Set<TId | TEntity> {
    /* c8 ignore next 3 - defensive: orchestrators only call with non-empty results array */
    if (sets.length === 0) {
      return new Set();
    }

    // Start with smallest set for efficiency
    const sortedSets = [...sets].sort((a, b) => a.size - b.size);
    const result = new Set(sortedSets[0]);

    for (let i = 1; i < sortedSets.length; i++) {
      const currentSet = sortedSets[i];
      for (const item of result) {
        if (!currentSet.has(item)) {
          result.delete(item);
        }
      }
    }

    return result;
  }

  /**
   * Computes union of multiple sets.
   * @param sets - Array of sets to union
   * @returns Set containing items present in any input set
   */
  protected _union(sets: Array<Set<TId | TEntity>>): Set<TId | TEntity> {
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
   * @param items - Set of entities or IDs to resolve
   * @returns Array of resolved entities, or Failure if any resolution fails
   */
  protected _resolveToEntities(items: Set<TId | TEntity>): Result<ReadonlyArray<TEntity>> {
    const entities: TEntity[] = [];
    const errors: string[] = [];

    for (const item of items) {
      if (this._resolver.isId(item)) {
        const resolved = this._resolver.resolve(item);
        if (resolved.isSuccess()) {
          entities.push(resolved.value);
        } else {
          errors.push(resolved.message);
        }
        /* c8 ignore next 3 - defensive: current indexers return IDs not entities */
      } else {
        entities.push(item);
      }
    }

    if (errors.length > 0) {
      return Failure.with(`Failed to resolve entities: ${errors.join('; ')}`);
    }

    return Success.with(entities);
  }
}
