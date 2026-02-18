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
 * ValidatingLibrary - a ValidatingResultMap with integrated find functionality
 * @packageDocumentation
 */

import { Collections, Result, Success, ValidatingResultMap } from '@fgv/ts-utils';
import { IFindOptions } from './indexers';

/**
 * Interface for an orchestrator that provides find functionality.
 * @public
 */
export interface IFindOrchestrator<TEntity, TSpec> {
  /**
   * Finds entities matching a query specification.
   * @param spec - Query specification
   * @param options - Optional find options (aggregation mode)
   * @returns Array of matching entities
   */
  find(spec: TSpec, options?: IFindOptions): Result<ReadonlyArray<TEntity>>;

  /**
   * Converts a JSON query specification to a typed config.
   * @param json - JSON object with query configuration
   * @returns Typed query spec
   */
  convertConfig(json: unknown): Result<TSpec>;

  /**
   * Invalidates all indexer caches.
   */
  invalidate(): void;

  /**
   * Pre-warms all indexers.
   */
  warmUp(): void;
}

/**
 * Read-only interface for ValidatingLibrary.
 * Extends IReadOnlyValidatingResultMap with a find method for query-based search.
 * @public
 */
export interface IReadOnlyValidatingLibrary<TK extends string, TV, TSpec>
  extends Collections.IReadOnlyValidatingResultMap<TK, TV> {
  /**
   * Finds entities matching a query specification.
   * @param spec - Query specification
   * @param options - Optional find options (aggregation mode)
   * @returns Array of matching entities
   */
  find(spec: TSpec, options?: IFindOptions): Result<ReadonlyArray<TV>>;
}

/**
 * Parameters for ValidatingLibrary construction.
 * @public
 */
export interface IValidatingLibraryParams<TK extends string, TV, TSpec, TOrchEntity = TV>
  extends Collections.IValidatingResultMapConstructorParams<TK, TV> {
  /**
   * The orchestrator that provides find functionality.
   * The orchestrator's entity type (TOrchEntity) may be a supertype of TV
   * (e.g., IIngredient when TV is AnyIngredient).
   */
  orchestrator: IFindOrchestrator<TOrchEntity, TSpec>;
}

/**
 * A ValidatingResultMap with integrated find functionality.
 * Combines map-based access (get, has, values) with query-based search (find).
 *
 * This provides a symmetric API where both `library.get(id)` and
 * `library.find({ byTag: {...} })` work together naturally.
 *
 * @typeParam TK - The key type (branded string ID)
 * @typeParam TV - The value type stored in the map
 * @typeParam TSpec - The query specification type
 * @typeParam TOrchEntity - The orchestrator's entity type (defaults to TV, may be a supertype)
 *
 * @public
 */
export class ValidatingLibrary<TK extends string, TV, TSpec, TOrchEntity = TV>
  extends ValidatingResultMap<TK, TV>
  implements IReadOnlyValidatingLibrary<TK, TV, TSpec>
{
  private readonly _orchestrator: IFindOrchestrator<TOrchEntity, TSpec>;

  /**
   * Creates a new ValidatingLibrary.
   * @param params - Parameters including converters and orchestrator
   */
  /* c8 ignore next 4 - coverage intermittently missed in full suite */
  public constructor(params: IValidatingLibraryParams<TK, TV, TSpec, TOrchEntity>) {
    super(params);
    this._orchestrator = params.orchestrator;
  }

  /**
   * Finds entities matching a query specification.
   * @param spec - Query specification
   * @param options - Optional find options (aggregation mode)
   * @returns Array of matching entities
   */
  /* c8 ignore next 9 - coverage intermittently missed in full suite */
  public find(spec: TSpec, options?: IFindOptions): Result<ReadonlyArray<TV>> {
    // The orchestrator returns TOrchEntity which may be a supertype of TV.
    // The actual entities returned are TV (the concrete type stored in this map).
    // Safe cast: orchestrator finds from this library which only contains TV items.
    // TypeScript can't verify TV extends TOrchEntity, so cast through unknown.
    return this._orchestrator.find(spec, options).onSuccess((entities) => {
      return Success.with(entities as unknown as ReadonlyArray<TV>);
    });
  }

  /**
   * Gets a read-only view of this library.
   */
  /* c8 ignore next 3 - type-narrowing override that returns this */
  public override toReadOnly(): IReadOnlyValidatingLibrary<TK, TV, TSpec> {
    return this;
  }
}
