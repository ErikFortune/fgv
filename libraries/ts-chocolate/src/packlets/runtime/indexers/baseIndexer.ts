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
 * Abstract base class for indexers with common functionality
 * @packageDocumentation
 */

import { Logging, Result, Success } from '@fgv/ts-utils';
import { IIndexer } from './model';
import { ChocolateLibrary } from '../chocolateLibrary';

/**
 * Abstract base class for indexers providing common functionality.
 *
 * Subclasses must implement:
 * - `_buildIndex()`: Build the internal index structure
 * - `_findInternal(config)`: Execute the query against the index
 *
 * @public
 */
export abstract class BaseIndexer<TEntity, TId, TConfig> implements IIndexer<TEntity, TId, TConfig> {
  /**
   * The chocolate library being indexed.
   */
  public readonly library: ChocolateLibrary;

  /**
   * Flag indicating if the index has been built.
   */
  protected _isBuilt: boolean = false;

  /**
   * Logger for reporting index operations.
   */
  protected get _logger(): Logging.LogReporter<unknown> {
    return this.library.logger;
  }

  /**
   * Creates a new indexer with optional logging.
   * @param logger - Optional logger for reporting index operations
   */
  protected constructor(library: ChocolateLibrary) {
    this.library = library;
  }

  /**
   * Finds entities or IDs matching the given configuration.
   * @param config - The indexer-specific configuration
   * @returns Array of entities or IDs, or Failure on error
   */
  public find(config: TConfig): Result<ReadonlyArray<TEntity | TId>> {
    // Ensure index is built
    this._ensureBuilt();

    // Delegate to subclass implementation
    return this._findInternal(config);
  }

  /** {@inheritdoc Runtime.Indexers.IIndexer.invalidate} */
  public invalidate(): void {
    this._isBuilt = false;
    this._clearIndex();
  }

  /** {@inheritdoc Runtime.Indexers.IIndexer.warmUp} */
  public warmUp(): void {
    this._ensureBuilt();
  }

  /**
   * Ensures the index is built before querying.
   */
  protected _ensureBuilt(): void {
    if (!this._isBuilt) {
      const start = Date.now();
      this._buildIndex();
      this._isBuilt = true;
      const elapsed = Date.now() - start;
      this._logger.info(`${this._indexerName} index built in ${elapsed}ms`);
    }
  }

  /**
   * Returns the name of this indexer for logging purposes.
   * Subclasses should override to provide a meaningful name.
   */
  protected get _indexerName(): string {
    return this.constructor.name;
  }

  /**
   * Builds the internal index structure.
   * Called lazily on first query or explicitly via warmUp().
   */
  protected abstract _buildIndex(): void;

  /**
   * Clears the internal index structure.
   * Called when invalidating the index.
   */
  protected abstract _clearIndex(): void;

  /**
   * Executes the query against the built index.
   * @param config - The query configuration
   * @returns Array of matching entities or IDs
   */
  protected abstract _findInternal(config: TConfig): Result<ReadonlyArray<TEntity | TId>>;

  // ============================================================================
  // Common Helper Methods
  // ============================================================================

  /**
   * Helper to add a value to a Set-based index.
   */
  protected _addToSetIndex<TKey, TValue>(index: Map<TKey, Set<TValue>>, key: TKey, value: TValue): void {
    let set = index.get(key);
    if (!set) {
      set = new Set<TValue>();
      index.set(key, set);
    }
    set.add(value);
  }

  /**
   * Helper to get values from a Set-based index as an array.
   */
  protected _getFromSetIndex<TKey, TValue>(index: Map<TKey, Set<TValue>>, key: TKey): ReadonlyArray<TValue> {
    const set = index.get(key);
    return set ? [...set] : [];
  }

  /**
   * Helper to return an empty success result.
   */
  protected _emptyResult(): Result<ReadonlyArray<TEntity | TId>> {
    return Success.with([]);
  }
}
