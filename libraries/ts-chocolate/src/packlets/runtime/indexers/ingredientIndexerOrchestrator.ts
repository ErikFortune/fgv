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

import { Result } from '@fgv/ts-utils';
import { IngredientId } from '../../common';
import { ChocolateLibrary } from '../chocolateLibrary';
import { IRuntimeIngredient } from '../model';
import { IEntityResolver, IFindOptions, IIndexOrchestratorConfig, QuerySpec } from './model';
import { IndexOrchestrator } from './indexOrchestrator';
import { IngredientsByTagIndexer } from './ingredientsByTagIndexer';

/**
 * Ingredient resolver function type.
 * Provided by RuntimeContext to resolve ingredient IDs to entities.
 * @public
 */
export type IngredientResolver = (id: IngredientId) => Result<IRuntimeIngredient>;

/**
 * Orchestrator for ingredient indexers.
 *
 * Encapsulates all ingredient-related indexers and provides a unified
 * find interface. The resolver is provided by the RuntimeContext
 * to enable ID-to-entity resolution.
 *
 * @public
 */
export class IngredientIndexerOrchestrator {
  private readonly _orchestrator: IndexOrchestrator<
    IRuntimeIngredient,
    IngredientId,
    IIndexOrchestratorConfig
  >;

  /**
   * Creates a new IngredientIndexerOrchestrator.
   * @param library - The chocolate library to index
   * @param resolver - Function to resolve ingredient IDs to entities
   */
  public constructor(library: ChocolateLibrary, resolver: IngredientResolver) {
    const entityResolver: IEntityResolver<IRuntimeIngredient, IngredientId> = {
      resolve: resolver,
      isId: (value): value is IngredientId => typeof value === 'string'
    };

    this._orchestrator = new IndexOrchestrator(entityResolver);
    this._orchestrator.register(new IngredientsByTagIndexer(library));
  }

  /**
   * Finds ingredients matching a query specification.
   * @param spec - Query specification with configs keyed by indexer ID
   * @param options - Optional find options (aggregation mode)
   * @returns Array of matching ingredients
   */
  public find(spec: QuerySpec, options?: IFindOptions): Result<ReadonlyArray<IRuntimeIngredient>> {
    return this._orchestrator.find(spec, options);
  }

  /**
   * Converts a JSON query specification to a typed config.
   * @param json - JSON object with indexer ID strings as keys and config objects as values
   * @returns Typed orchestrator config
   */
  public convertConfig(json: unknown): Result<IIndexOrchestratorConfig> {
    return this._orchestrator.convertConfig(json);
  }

  /**
   * Invalidates all indexer caches.
   */
  public invalidate(): void {
    this._orchestrator.invalidate();
  }

  /**
   * Pre-warms all indexers.
   */
  public warmUp(): void {
    this._orchestrator.warmUp();
  }
}
