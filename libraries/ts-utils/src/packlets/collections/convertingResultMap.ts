/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { captureResult, DetailedResult, Result } from '../base';
import { KeyValueEntry } from './common';
import { IReadOnlyResultMap, ResultMapForEachCb, ResultMapResultDetail } from './readonlyResultMap';
import {
  ReadOnlyConvertingResultMap,
  ConvertingResultMapValueConverter,
  IReadOnlyConvertingResultMapConstructorParams
} from './readOnlyConvertingResultMap';
import { IResultMap, ResultMapValueFactory } from './resultMap';

/**
 * Parameters for constructing a {@link Collections.ConvertingResultMap | ConvertingResultMap}.
 * @public
 */
export interface IConvertingResultMapConstructorParams<
  TK extends string,
  TSRC,
  TTARGET,
  TSRCMAP extends IResultMap<TK, TSRC> = IResultMap<TK, TSRC>
> {
  /**
   * The inner map containing source values.
   */
  inner: TSRCMAP;

  /**
   * The converter function to transform source values to target values.
   */
  converter: ConvertingResultMapValueConverter<TK, TSRC, TTARGET>;
}

/**
 * A wrapper around a mutable result map that invalidates cache entries
 * in the parent {@link Collections.ConvertingResultMap | ConvertingResultMap} when mutations occur.
 * @public
 */
export class CacheInvalidatingResultMapWrapper<
  TK extends string,
  TSRC,
  TTARGET,
  TSRCMAP extends IResultMap<TK, TSRC> = IResultMap<TK, TSRC>
> implements IResultMap<TK, TSRC>
{
  private readonly _inner: TSRCMAP;
  private readonly _parent: ConvertingResultMap<TK, TSRC, TTARGET, TSRCMAP>;

  /**
   * Constructs a new cache-invalidating wrapper.
   * @param inner - The inner map to wrap.
   * @param parent - The parent converting map whose cache should be invalidated.
   */
  public constructor(inner: TSRCMAP, parent: ConvertingResultMap<TK, TSRC, TTARGET, TSRCMAP>) {
    this._inner = inner;
    this._parent = parent;
  }

  /**
   * The number of entries in the map.
   */
  public get size(): number {
    return this._inner.size;
  }

  /**
   * Adds a key/value pair to the map if the key does not already exist.
   * Invalidates the cache entry for the key.
   * @param key - The key to add.
   * @param value - The value to add.
   * @returns The result of the add operation.
   */
  public add(key: TK, value: TSRC): DetailedResult<TSRC, ResultMapResultDetail> {
    this._parent._clearCacheEntry(key);
    return this._inner.add(key, value);
  }

  /**
   * Sets a key/value pair in the map.
   * Invalidates the cache entry for the key.
   * @param key - The key to set.
   * @param value - The value to set.
   * @returns The result of the set operation.
   */
  public set(key: TK, value: TSRC): DetailedResult<TSRC, ResultMapResultDetail> {
    this._parent._clearCacheEntry(key);
    return this._inner.set(key, value);
  }

  /**
   * Updates an existing key in the map.
   * Invalidates the cache entry for the key.
   * @param key - The key to update.
   * @param value - The new value.
   * @returns The result of the update operation.
   */
  public update(key: TK, value: TSRC): DetailedResult<TSRC, ResultMapResultDetail> {
    this._parent._clearCacheEntry(key);
    return this._inner.update(key, value);
  }

  /**
   * Deletes a key from the map.
   * Invalidates the cache entry for the key.
   * @param key - The key to delete.
   * @returns The result of the delete operation.
   */
  public delete(key: TK): DetailedResult<TSRC, ResultMapResultDetail> {
    this._parent._clearCacheEntry(key);
    return this._inner.delete(key);
  }

  /**
   * Gets a value from the map.
   * @param key - The key to retrieve.
   * @returns The result of the get operation.
   */
  public get(key: TK): DetailedResult<TSRC, ResultMapResultDetail> {
    return this._inner.get(key);
  }

  /**
   * Gets a value from the map, or adds a supplied value if it does not exist.
   * Invalidates the cache entry for the key if a new value is added.
   * @param key - The key to retrieve or add.
   * @param value - The value to add if the key does not exist.
   * @returns The result of the operation.
   */
  public getOrAdd(key: TK, value: TSRC): DetailedResult<TSRC, ResultMapResultDetail>;

  /**
   * Gets a value from the map, or adds a value created by a factory if it does not exist.
   * Invalidates the cache entry for the key if a new value is added.
   * @param key - The key to retrieve or add.
   * @param factory - A factory function to create the value if the key does not exist.
   * @returns The result of the operation.
   */
  public getOrAdd(
    key: TK,
    factory: ResultMapValueFactory<TK, TSRC>
  ): DetailedResult<TSRC, ResultMapResultDetail>;

  public getOrAdd(
    key: TK,
    valueOrFactory: TSRC | ResultMapValueFactory<TK, TSRC>
  ): DetailedResult<TSRC, ResultMapResultDetail> {
    const result =
      typeof valueOrFactory === 'function'
        ? this._inner.getOrAdd(key, valueOrFactory as ResultMapValueFactory<TK, TSRC>)
        : this._inner.getOrAdd(key, valueOrFactory);

    if (result.isSuccess() && result.detail === 'added') {
      this._parent._clearCacheEntry(key);
    }
    return result;
  }

  /**
   * Checks if the map contains a key.
   * @param key - The key to check.
   * @returns `true` if the key exists, `false` otherwise.
   */
  public has(key: TK): boolean {
    return this._inner.has(key);
  }

  /**
   * Clears all entries from the map.
   * Clears the entire cache.
   */
  public clear(): void {
    this._parent._clearCache();
    this._inner.clear();
  }

  /**
   * Returns an iterator over the map entries.
   * @returns An iterator over the map entries.
   */
  public entries(): IterableIterator<KeyValueEntry<TK, TSRC>> {
    return this._inner.entries();
  }

  /**
   * Returns an iterator over the map keys.
   * @returns An iterator over the map keys.
   */
  public keys(): IterableIterator<TK> {
    return this._inner.keys();
  }

  /**
   * Returns an iterator over the map values.
   * @returns An iterator over the map values.
   */
  public values(): IterableIterator<TSRC> {
    return this._inner.values();
  }

  /**
   * Calls a callback for each entry in the map.
   * @param cb - The callback to call for each entry.
   * @param thisArg - Optional `this` argument for the callback.
   */
  public forEach(cb: ResultMapForEachCb<TK, TSRC>, thisArg?: unknown): void {
    this._inner.forEach(cb, thisArg);
  }

  /**
   * Gets an iterator over the map entries.
   * @returns An iterator over the map entries.
   */
  public [Symbol.iterator](): IterableIterator<KeyValueEntry<TK, TSRC>> {
    return this._inner[Symbol.iterator]();
  }

  /**
   * Gets a read-only version of this map.
   * @returns A read-only version of this map.
   */
  public toReadOnly(): IReadOnlyResultMap<TK, TSRC> {
    return this._inner.toReadOnly();
  }
}

/**
 * A result map that wraps an inner {@link Collections.IResultMap | IResultMap} of source type
 * and returns lazily-converted, cached values of a target type. Exposes the inner map
 * via a {@link Collections.CacheInvalidatingResultMapWrapper | source} property that
 * invalidates cache entries when mutations occur.
 * @public
 */
export class ConvertingResultMap<
  TK extends string,
  TSRC,
  TTARGET,
  TSRCMAP extends IResultMap<TK, TSRC> = IResultMap<TK, TSRC>
> extends ReadOnlyConvertingResultMap<TK, TSRC, TTARGET> {
  /**
   * A wrapper around the inner map that invalidates cache entries when mutations occur.
   * Use this property to add, update, or delete source values.
   */
  public readonly source: CacheInvalidatingResultMapWrapper<TK, TSRC, TTARGET, TSRCMAP>;

  /**
   * The inner map, typed as the specific source map type.
   */
  protected readonly _typedInner: TSRCMAP;

  /**
   * Constructs a new {@link Collections.ConvertingResultMap | ConvertingResultMap}.
   * @param params - Parameters for constructing the map.
   */
  public constructor(params: IConvertingResultMapConstructorParams<TK, TSRC, TTARGET, TSRCMAP>) {
    super(params as IReadOnlyConvertingResultMapConstructorParams<TK, TSRC, TTARGET>);
    this._typedInner = params.inner;
    this.source = new CacheInvalidatingResultMapWrapper<TK, TSRC, TTARGET, TSRCMAP>(params.inner, this);
  }

  /**
   * Creates a new {@link Collections.ConvertingResultMap | ConvertingResultMap}.
   * @param params - Parameters for constructing the map.
   * @returns `Success` with the new map, or `Failure` with error details if an error occurred.
   */
  public static override create<
    TK extends string,
    TSRC,
    TTARGET,
    TSRCMAP extends IResultMap<TK, TSRC> = IResultMap<TK, TSRC>
  >(
    params: IConvertingResultMapConstructorParams<TK, TSRC, TTARGET, TSRCMAP>
  ): Result<ConvertingResultMap<TK, TSRC, TTARGET, TSRCMAP>> {
    return captureResult(() => new ConvertingResultMap(params));
  }

  /**
   * Clears a single entry from the cache.
   * This method is public to allow the cache-invalidating wrapper to call it.
   * @param key - The key to clear from the cache.
   * @internal
   */
  public override _clearCacheEntry(key: TK): void {
    super._clearCacheEntry(key);
  }

  /**
   * Clears all entries from the cache.
   * This method is public to allow the cache-invalidating wrapper to call it.
   * @internal
   */
  public override _clearCache(): void {
    super._clearCache();
  }
}
