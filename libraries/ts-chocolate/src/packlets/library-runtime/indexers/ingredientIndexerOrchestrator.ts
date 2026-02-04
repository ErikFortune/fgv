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
 * Ingredient-specific index orchestrator
 * @packageDocumentation
 */

import { Converter, Converters, Failure, MessageAggregator, Result, Success } from '@fgv/ts-utils';
import { IngredientId } from '../../common';
import { ChocolateLibrary } from '../chocolateLibrary';
import { IIngredient } from '../model';
import { BaseIndexerOrchestrator } from './baseIndexerOrchestrator';
import { AggregationMode, IFindOptions } from './model';
import {
  IIngredientsByTagConfig,
  IngredientsByTagIndexer,
  ingredientsByTagConfigConverter
} from './ingredientsByTagIndexer';

// ============================================================================
// Ingredient Query Spec Types
// ============================================================================

/**
 * Query specification for ingredient indexers.
 * Each key corresponds to an indexer, and the value is that indexer's config.
 * @public
 */
export interface IIngredientQuerySpec {
  readonly byTag?: IIngredientsByTagConfig;
}

/**
 * Valid ingredient indexer names (inferred from query spec keys).
 * @public
 */
export type IngredientIndexerName = keyof IIngredientQuerySpec;

/**
 * Converter for ingredient query specification from JSON.
 * @public
 */
export const ingredientQuerySpecConverter: Converter<IIngredientQuerySpec> =
  Converters.strictObject<IIngredientQuerySpec>({
    byTag: ingredientsByTagConfigConverter.optional()
  });

/**
 * Ingredient resolver function type.
 * Provided by RuntimeContext to resolve ingredient IDs to entities.
 * @public
 */
export type IngredientResolver = (id: IngredientId) => Result<IIngredient>;

/**
 * Orchestrator for ingredient indexers.
 *
 * Encapsulates all ingredient-related indexers and provides a unified
 * find interface. The resolver is provided by the RuntimeContext
 * to enable ID-to-entity resolution.
 *
 * @public
 */
export class IngredientIndexerOrchestrator extends BaseIndexerOrchestrator<IIngredient, IngredientId> {
  private readonly _indexers: {
    byTag: IngredientsByTagIndexer;
  };

  /**
   * Creates a new IngredientIndexerOrchestrator.
   * @param library - The chocolate library to index
   * @param resolver - Function to resolve ingredient IDs to entities
   */
  public constructor(library: ChocolateLibrary, resolver: IngredientResolver) {
    super(library, {
      resolve: resolver,
      isId: (value): value is IngredientId => typeof value === 'string'
    });

    // Get logger from library for all indexers
    this._indexers = {
      byTag: new IngredientsByTagIndexer(library)
    };
  }

  /**
   * Finds ingredients matching a query specification.
   * @param spec - Query specification with configs keyed by indexer name
   * @param options - Optional find options (aggregation mode)
   * @returns Array of matching ingredients
   */
  public find(spec: IIngredientQuerySpec, options?: IFindOptions): Result<ReadonlyArray<IIngredient>> {
    const aggregation: AggregationMode = options?.aggregation ?? 'intersection';

    // Collect results from each specified indexer
    const indexerResults: Array<Set<IngredientId | IIngredient>> = [];
    const errors = new MessageAggregator();

    if (spec.byTag !== undefined) {
      this._indexers.byTag
        .find(spec.byTag)
        .onSuccess((result) => Success.with(indexerResults.push(new Set(result))))
        .aggregateError(errors)
        .report(this._logger);
    }

    if (indexerResults.length === 0) {
      /* c8 ignore next 3 - defensive: current indexers never return Failure */
      if (errors.hasMessages) {
        return Failure.with(`Errors during indexing: ${errors.messages.join('; ')}`);
      }
      return Success.with([]);
    }

    // Aggregate results
    let aggregatedSet: Set<IngredientId | IIngredient>;
    if (aggregation === 'intersection') {
      aggregatedSet = this._intersect(indexerResults);
    } else {
      aggregatedSet = this._union(indexerResults);
    }

    // Resolve IDs to entities
    return this._resolveToEntities(aggregatedSet).report(this._logger);
  }

  /**
   * Converts a JSON query specification to a typed config.
   * @param json - JSON object with indexer name strings as keys and config objects as values
   * @returns Typed query spec
   */
  public convertConfig(json: unknown): Result<IIngredientQuerySpec> {
    return ingredientQuerySpecConverter.convert(json);
  }

  /**
   * Invalidates all indexer caches.
   */
  public invalidate(): void {
    this._indexers.byTag.invalidate();
  }

  /**
   * Pre-warms all indexers.
   */
  public warmUp(): void {
    this._indexers.byTag.warmUp();
  }
}
