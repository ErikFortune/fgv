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
 * MaterializedLibrary - a read-only library providing lazily-materialized, cached runtime objects
 * @packageDocumentation
 */

import { Collections, Logging, Result, fail } from '@fgv/ts-utils';
import { IFindOptions } from './indexers';
import { IFindOrchestrator } from './validatingLibrary';

/**
 * Parameters for constructing a MaterializedLibrary.
 * @public
 */
export interface IMaterializedLibraryParams<TId extends string, TEntity, TMaterialized, TQuerySpec = never> {
  /**
   * The underlying data library (SubLibraryBase or similar).
   */
  inner: Collections.IReadOnlyResultMap<TId, TEntity>;

  /**
   * Converter function: (entity, id) =\> Result\<TMaterialized\>
   */
  converter: (entity: TEntity, id: TId) => Result<TMaterialized>;

  /**
   * Optional orchestrator for find/query support.
   */
  orchestrator?: IFindOrchestrator<TMaterialized, TQuerySpec>;

  /**
   * Optional logger for conversion warnings.
   */
  logger?: Logging.ILogger;

  /**
   * Error handling behavior for conversion failures during iteration.
   * Defaults to `'warn'` for chocolate libraries.
   */
  onConversionError?: Collections.ConversionErrorHandling;
}

/**
 * A read-only library providing lazily-materialized, cached runtime objects.
 * Wraps a data-layer library and converts entities to materialized objects on demand.
 *
 * @typeParam TId - The ID type (branded string)
 * @typeParam TEntity - The data-layer entity type
 * @typeParam TMaterialized - The materialized runtime object type
 * @typeParam TQuerySpec - The query specification type (for find support)
 *
 * @public
 */
export class MaterializedLibrary<
  TId extends string,
  TEntity,
  TMaterialized,
  TQuerySpec = never
> extends Collections.ReadOnlyConvertingResultMap<TId, TEntity, TMaterialized> {
  private readonly _orchestrator?: IFindOrchestrator<TMaterialized, TQuerySpec>;

  /**
   * Creates a new MaterializedLibrary.
   * @param params - Parameters including inner library, converter, and optional orchestrator
   */
  public constructor(params: IMaterializedLibraryParams<TId, TEntity, TMaterialized, TQuerySpec>) {
    super({
      inner: params.inner,
      converter: params.converter,
      onConversionError: params.onConversionError ?? 'warn',
      logger: params.logger
    });
    this._orchestrator = params.orchestrator;
  }

  /**
   * Finds materialized objects matching a query specification.
   * @param spec - Query specification
   * @param options - Optional find options (aggregation mode)
   * @returns Array of matching materialized objects
   */
  public find(spec: TQuerySpec, options?: IFindOptions): Result<ReadonlyArray<TMaterialized>> {
    if (!this._orchestrator) {
      return fail('Find not supported on this library');
    }
    return this._orchestrator.find(spec, options);
  }

  /**
   * Whether find is supported on this library.
   */
  public get hasFindSupport(): boolean {
    return this._orchestrator !== undefined;
  }
}
