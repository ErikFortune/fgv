/*
 * Copyright (c) 2026 Erik Fortune
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

import { captureResult, DetailedResult, failWithDetail, Result, succeedWithDetail } from '../base';
import { KeyValueEntry } from './common';
import { IReadOnlyResultMap, ResultMapForEachCb, ResultMapResultDetail } from './readonlyResultMap';

/**
 * A function that converts a source value to a target value.
 * @public
 */
export type ConvertingResultMapValueConverter<TK extends string, TSRC, TTARGET> = (
  src: TSRC,
  key: TK
) => Result<TTARGET>;

/**
 * Parameters for constructing a {@link Collections.ReadOnlyConvertingResultMap | ReadOnlyConvertingResultMap}.
 * @public
 */
export interface IReadOnlyConvertingResultMapConstructorParams<TK extends string, TSRC, TTARGET> {
  /**
   * The inner map containing source values.
   */
  inner: IReadOnlyResultMap<TK, TSRC>;

  /**
   * The converter function to transform source values to target values.
   */
  converter: ConvertingResultMapValueConverter<TK, TSRC, TTARGET>;
}

/**
 * A read-only result map that wraps an inner {@link Collections.IReadOnlyResultMap | IReadOnlyResultMap}
 * of source type and returns lazily-converted, cached values of a target type.
 * @public
 */
export class ReadOnlyConvertingResultMap<TK extends string, TSRC, TTARGET>
  implements IReadOnlyResultMap<TK, TTARGET>
{
  /**
   * The inner map containing source values.
   */
  protected readonly _inner: IReadOnlyResultMap<TK, TSRC>;

  /**
   * The converter function to transform source values to target values.
   */
  protected readonly _converter: ConvertingResultMapValueConverter<TK, TSRC, TTARGET>;

  /**
   * Cache of converted target values.
   */
  protected readonly _cache: Map<TK, TTARGET>;

  /**
   * Constructs a new {@link Collections.ReadOnlyConvertingResultMap | ReadOnlyConvertingResultMap}.
   * @param params - Parameters for constructing the map.
   */
  public constructor(params: IReadOnlyConvertingResultMapConstructorParams<TK, TSRC, TTARGET>) {
    this._inner = params.inner;
    this._converter = params.converter;
    this._cache = new Map<TK, TTARGET>();
  }

  /**
   * Creates a new {@link Collections.ReadOnlyConvertingResultMap | ReadOnlyConvertingResultMap}.
   * @param params - Parameters for constructing the map.
   * @returns `Success` with the new map, or `Failure` with error details if an error occurred.
   */
  public static create<TK extends string, TSRC, TTARGET>(
    params: IReadOnlyConvertingResultMapConstructorParams<TK, TSRC, TTARGET>
  ): Result<ReadOnlyConvertingResultMap<TK, TSRC, TTARGET>> {
    return captureResult(() => new ReadOnlyConvertingResultMap(params));
  }

  /**
   * The number of entries in the map.
   */
  public get size(): number {
    return this._inner.size;
  }

  /**
   * Gets a converted value from the map by key.
   * @param key - The key to retrieve.
   * @returns `Success` with the converted value and detail `exists` if the key was found,
   * `Failure` with detail `not-found` if the key was not found, or `Failure` with
   * detail `invalid-value` if conversion failed.
   */
  public get(key: TK): DetailedResult<TTARGET, ResultMapResultDetail> {
    const cached = this._cache.get(key);
    if (cached !== undefined) {
      return succeedWithDetail(cached, 'exists');
    }

    return this._inner.get(key).onSuccess((src) => {
      return this._convertAndCache(key, src);
    });
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
   * Returns an iterator over the map entries with converted values.
   * @returns An iterator over the map entries.
   */
  public *entries(): IterableIterator<KeyValueEntry<TK, TTARGET>> {
    for (const [key, src] of this._inner.entries()) {
      const target = this._getOrConvert(key, src);
      if (target !== undefined) {
        yield [key, target];
      }
    }
  }

  /**
   * Returns an iterator over the map keys.
   * @returns An iterator over the map keys.
   */
  public keys(): IterableIterator<TK> {
    return this._inner.keys();
  }

  /**
   * Returns an iterator over the converted map values.
   * @returns An iterator over the map values.
   */
  public *values(): IterableIterator<TTARGET> {
    for (const [key, src] of this._inner.entries()) {
      const target = this._getOrConvert(key, src);
      if (target !== undefined) {
        yield target;
      }
    }
  }

  /**
   * Calls a callback for each entry in the map with converted values.
   * @param cb - The callback to call for each entry.
   * @param thisArg - Optional `this` argument for the callback.
   */
  public forEach(cb: ResultMapForEachCb<TK, TTARGET>, thisArg?: unknown): void {
    for (const [key, src] of this._inner.entries()) {
      const target = this._getOrConvert(key, src);
      if (target !== undefined) {
        cb.call(thisArg, target, key, this);
      }
    }
  }

  /**
   * Gets an iterator over the map entries.
   * @returns An iterator over the map entries.
   */
  public [Symbol.iterator](): IterableIterator<KeyValueEntry<TK, TTARGET>> {
    return this.entries();
  }

  /**
   * Gets a read-only version of this map.
   * @returns A read-only version of this map.
   */
  public toReadOnly(): IReadOnlyResultMap<TK, TTARGET> {
    return this;
  }

  /**
   * Converts a source value to a target value and caches the result.
   * @param key - The key of the value.
   * @param src - The source value to convert.
   * @returns `Success` with the converted value if successful, `Failure` otherwise.
   */
  protected _convertAndCache(key: TK, src: TSRC): DetailedResult<TTARGET, ResultMapResultDetail> {
    const result = this._converter(src, key);
    if (result.isFailure()) {
      return failWithDetail(result.message, 'invalid-value');
    }
    this._cache.set(key, result.value);
    return succeedWithDetail(result.value, 'exists');
  }

  /**
   * Gets a cached value or converts and caches a source value.
   * Used by iterators where we want to silently skip conversion failures.
   * @param key - The key of the value.
   * @param src - The source value to convert if not cached.
   * @returns The converted value, or `undefined` if conversion failed.
   */
  protected _getOrConvert(key: TK, src: TSRC): TTARGET | undefined {
    const cached = this._cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = this._converter(src, key);
    if (result.isSuccess()) {
      this._cache.set(key, result.value);
      return result.value;
    }
    return undefined;
  }

  /**
   * Clears a single entry from the cache.
   * @param key - The key to clear from the cache.
   */
  protected _clearCacheEntry(key: TK): void {
    this._cache.delete(key);
  }

  /**
   * Clears all entries from the cache.
   */
  protected _clearCache(): void {
    this._cache.clear();
  }
}
