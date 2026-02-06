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
 * FillingRecipe-specific index orchestrator
 * @packageDocumentation
 */

import { Converter, Converters, Failure, MessageAggregator, Result, Success } from '@fgv/ts-utils';
import { FillingId } from '../../common';
import { EntityLibrary } from '../chocolateLibrary';
import { FillingRecipe } from '../fillings/fillingRecipe';
import { BaseIndexerOrchestrator } from './baseIndexerOrchestrator';
import { AggregationMode, IFindOptions } from './model';
import {
  IFillingRecipesByIngredientConfig,
  FillingRecipesByIngredientIndexer,
  fillingRecipesByIngredientConfigConverter
} from './fillingRecipesByIngredientIndexer';
import {
  IFillingRecipesByTagConfig,
  FillingRecipesByTagIndexer,
  fillingRecipesByTagConfigConverter
} from './fillingRecipesByTagIndexer';
import {
  IFillingRecipesByChocolateTypeConfig,
  FillingRecipesByChocolateTypeIndexer,
  fillingRecipesByChocolateTypeConfigConverter
} from './fillingRecipesByChocolateTypeIndexer';
import {
  IFillingRecipesByCategoryConfig,
  FillingRecipesByCategoryIndexer,
  fillingRecipesByCategoryConfigConverter
} from './fillingRecipesByCategoryIndexer';

/**
 * Query specification for filling recipe indexers.
 * Each key corresponds to an indexer, and the value is that indexer's config.
 * @public
 */
export interface IFillingRecipeQuerySpec {
  readonly byTag?: IFillingRecipesByTagConfig;
  readonly byIngredient?: IFillingRecipesByIngredientConfig;
  readonly byChocolateType?: IFillingRecipesByChocolateTypeConfig;
  readonly byCategory?: IFillingRecipesByCategoryConfig;
}

/**
 * Valid filling recipe indexer names (inferred from query spec keys).
 * @public
 */
export type FillingRecipeIndexerName = keyof IFillingRecipeQuerySpec;

/**
 * Converter for filling recipe query specification from JSON.
 * @public
 */
export const fillingRecipeQuerySpecConverter: Converter<IFillingRecipeQuerySpec> =
  Converters.strictObject<IFillingRecipeQuerySpec>({
    byTag: fillingRecipesByTagConfigConverter.optional(),
    byIngredient: fillingRecipesByIngredientConfigConverter.optional(),
    byChocolateType: fillingRecipesByChocolateTypeConfigConverter.optional(),
    byCategory: fillingRecipesByCategoryConfigConverter.optional()
  });

/**
 * Filling recipe resolver function type.
 * Provided by RuntimeContext to resolve filling recipe IDs to entities.
 * @public
 */
export type FillingRecipeResolver = (id: FillingId) => Result<FillingRecipe>;

/**
 * Orchestrator for filling recipe indexers.
 *
 * Encapsulates all filling recipe-related indexers and provides a unified
 * find interface. The resolver is provided by the RuntimeContext
 * to enable ID-to-entity resolution.
 *
 * @public
 */
export class FillingRecipeIndexerOrchestrator extends BaseIndexerOrchestrator<FillingRecipe, FillingId> {
  private readonly _indexers: {
    byTag: FillingRecipesByTagIndexer;
    byIngredient: FillingRecipesByIngredientIndexer;
    byChocolateType: FillingRecipesByChocolateTypeIndexer;
    byCategory: FillingRecipesByCategoryIndexer;
  };

  /**
   * Creates a new FillingRecipeIndexerOrchestrator.
   * @param library - The chocolate library to index
   * @param resolver - Function to resolve filling recipe IDs to entities
   */
  public constructor(library: EntityLibrary, resolver: FillingRecipeResolver) {
    super(library, {
      resolve: resolver,
      isId: (value): value is FillingId => typeof value === 'string'
    });

    this._indexers = {
      byTag: new FillingRecipesByTagIndexer(library),
      byIngredient: new FillingRecipesByIngredientIndexer(library),
      byChocolateType: new FillingRecipesByChocolateTypeIndexer(library),
      byCategory: new FillingRecipesByCategoryIndexer(library)
    };
  }

  /**
   * Finds recipes matching a query specification.
   * @param spec - Query specification with configs keyed by indexer name
   * @param options - Optional find options (aggregation mode)
   * @returns Array of matching recipes
   */
  public find(spec: IFillingRecipeQuerySpec, options?: IFindOptions): Result<ReadonlyArray<FillingRecipe>> {
    const aggregation: AggregationMode = options?.aggregation ?? 'intersection';

    // Collect results from each specified indexer
    const indexerResults: Array<Set<FillingId>> = [];
    const errors = new MessageAggregator();

    if (spec.byTag !== undefined) {
      this._indexers.byTag
        .find(spec.byTag)
        .onSuccess((result) => Success.with(indexerResults.push(new Set(result))))
        .aggregateError(errors)
        .report(this._logger);
    }

    if (spec.byIngredient !== undefined) {
      this._indexers.byIngredient
        .find(spec.byIngredient)
        .onSuccess((result) => Success.with(indexerResults.push(new Set(result))))
        .aggregateError(errors)
        .report(this._logger);
    }

    if (spec.byChocolateType !== undefined) {
      this._indexers.byChocolateType
        .find(spec.byChocolateType)
        .onSuccess((result) => Success.with(indexerResults.push(new Set(result))))
        .aggregateError(errors)
        .report(this._logger);
    }

    if (spec.byCategory !== undefined) {
      this._indexers.byCategory
        .find(spec.byCategory)
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
    let aggregatedSet: Set<FillingId>;
    if (aggregation === 'intersection') {
      aggregatedSet = this._intersect(indexerResults);
    } else {
      aggregatedSet = this._union(indexerResults);
    }

    // Resolve IDs to entities
    return this._resolveToEntities(aggregatedSet);
  }

  /**
   * Converts a JSON query specification to a typed config.
   * @param json - JSON object with indexer name strings as keys and config objects as values
   * @returns Typed query spec
   */
  public convertConfig(json: unknown): Result<IFillingRecipeQuerySpec> {
    return fillingRecipeQuerySpecConverter.convert(json);
  }

  /**
   * Invalidates all indexer caches.
   */
  public invalidate(): void {
    this._indexers.byTag.invalidate();
    this._indexers.byIngredient.invalidate();
    this._indexers.byChocolateType.invalidate();
    this._indexers.byCategory.invalidate();
  }

  /**
   * Pre-warms all indexers.
   */
  public warmUp(): void {
    this._indexers.byTag.warmUp();
    this._indexers.byIngredient.warmUp();
    this._indexers.byChocolateType.warmUp();
    this._indexers.byCategory.warmUp();
  }
}
