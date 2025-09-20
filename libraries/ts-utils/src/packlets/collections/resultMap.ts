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

import { captureResult, DetailedResult, failWithDetail, Result, succeed, succeedWithDetail } from '../base';
import { KeyValueEntry } from './common';
import { IReadOnlyResultMap, ResultMapForEachCb, ResultMapResultDetail } from './readonlyResultMap';
import { isIterable } from './utils';

/**
 * Parameters for constructing a {@link Collections.ResultMap | ResultMap}.
 * @public
 */
export interface IResultMapConstructorParams<TK extends string = string, TV = unknown> {
  entries?: Iterable<KeyValueEntry<TK, TV>>;
}

/**
 * Deferred constructor for the {@link Collections.ResultMap.(getOrAdd:2) | getOrAdd} method.
 * @public
 */
export type ResultMapValueFactory<TK extends string = string, TV = unknown> = (key: TK) => Result<TV>;

/**
 * A {@link Collections.ResultMap | ResultMap} class as a `Map<TK, TV>`-like object which
 * reports success or failure with additional details using the
 * {@link https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils#the-result-pattern | result pattern}.
 * @public
 */
export class ResultMap<TK extends string = string, TV = unknown> implements IReadOnlyResultMap<TK, TV> {
  /**
   * Protected raw access to the inner `Map<TK, TV>` object.
   * @public
   */
  protected readonly _inner: Map<TK, TV>;

  /**
   * Constructs a new {@link Collections.ResultMap | ResultMap}.
   * @param iterable - An iterable to initialize the map.
   */
  public constructor(iterable?: Iterable<KeyValueEntry<TK, TV>>);

  /**
   * Constructs a new {@link Collections.ResultMap | ResultMap}.
   * @param params - An optional set of parameters to configure the map.
   */
  public constructor(params: IResultMapConstructorParams);

  /**
   * Constructs a new {@link Collections.ResultMap | ResultMap}.
   * @param iterableOrParams - An iterable to initialize the map, or a set of parameters
   * to configure the map.
   */
  public constructor(
    iterableOrParams?: Iterable<KeyValueEntry<TK, TV>> | IResultMapConstructorParams<TK, TV>
  ) {
    const params = isIterable(iterableOrParams) ? { entries: iterableOrParams } : iterableOrParams ?? {};
    this._inner = new Map(params.entries);
  }

  /**
   * Creates a new {@link Collections.ResultMap | ResultMap}.
   * @param elements - An optional iterable to initialize the map.
   * @returns `Success` with the new map, or `Failure` with error details
   * if an error occurred.
   * @public
   */
  public static create<TK extends string = string, TV = unknown>(
    elements: Iterable<KeyValueEntry<TK, TV>>
  ): Result<ResultMap<TK, TV>>;

  /**
   * Creates a new {@link Collections.ResultMap | ResultMap}.
   * @param params - An optional set of parameters to configure the map.
   * @returns `Success` with the new map, or `Failure` with error details
   * if an error occurred.
   * @public
   */
  public static create<TK extends string = string, TV = unknown>(
    params?: IResultMapConstructorParams<TK, TV>
  ): Result<ResultMap<TK, TV>>;

  /**
   * Creates a new {@link Collections.ResultMap | ResultMap}.
   * @param elementsOrParams - An optional iterable to initialize the map, or a set of parameters
   * to configure the map.
   * @returns `Success` with the new map, or `Failure` with error details
   * if an error occurred.
   * @public
   */
  public static create<TK extends string = string, TV = unknown>(
    elementsOrParams?: Iterable<KeyValueEntry<TK, TV>> | IResultMapConstructorParams<TK, TV>
  ): Result<ResultMap<TK, TV>> {
    return captureResult(() => new ResultMap(elementsOrParams as IResultMapConstructorParams<TK, TV>));
  }

  /**
   * Sets a key/value pair in the map if the key does not already exist.
   * @param key - The key to set.
   * @param value - The value to set.
   * @returns `Success` with the value and detail `added` if the key was added,
   * `Failure` with detail `exists` if the key already exists. Fails with detail
   * 'invalid-key' or 'invalid-value' and an error message if either is invalid.
   */
  public add(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail> {
    if (this._inner.has(key)) {
      return failWithDetail(`${key}: already exists.`, 'exists');
    }
    this._inner.set(key, value);
    return succeedWithDetail(value, 'added');
  }

  /**
   * Clears the map.
   */
  public clear(): void {
    this._inner.clear();
  }

  /**
   * Deletes a key from the map.
   * @param key - The key to delete.
   * @returns `Success` with the previous value and the detail 'deleted'
   * if the key was found and deleted, `Failure` with detail 'not-found'
   * if the key was not found, or with detail 'invalid-key' if the key is invalid.
   */
  public delete(key: TK): DetailedResult<TV, ResultMapResultDetail> {
    const was = this._inner.get(key);
    if (this._inner.delete(key)) {
      return succeedWithDetail(was!, 'deleted');
    }
    return failWithDetail(`${key}: not found.`, 'not-found');
  }

  /**
   * Returns an iterator over the map entries.
   * @returns An iterator over the map entries.
   */
  public entries(): IterableIterator<KeyValueEntry<TK, TV>> {
    return this._inner.entries();
  }

  /**
   * Calls a function for each entry in the map.
   * @param cb - The function to call for each entry.
   * @param arg - An optional argument to pass to the callback.
   */
  public forEach(cb: ResultMapForEachCb<TK, TV>, arg?: unknown): void {
    for (const [key, value] of this._inner.entries()) {
      cb(value, key as TK, this, arg);
    }
  }

  /**
   * Gets a value from the map.
   * @param key - The key to retrieve.
   * @returns `Success` with the value and detail `exists` if the key was found,
   * `Failure` with detail `not-found` if the key was not found or with detail
   * `invalid-key` if the key is invalid.
   */
  public get(key: TK): DetailedResult<TV, ResultMapResultDetail> {
    if (this._inner.has(key)) {
      return succeedWithDetail(this._inner.get(key)!, 'exists');
    }
    return failWithDetail(`${key}: not found.`, 'not-found');
  }

  /**
   * Gets a value from the map, or adds a supplied value it if it does not exist.
   * @param key - The key to be retrieved or created.
   * @param value - The value to add if the key does not exist.
   * @returns `Success` with the value and detail `exists` if the key was found,
   * `Success` with the value and detail `added` if the key was not found and added.
   * Fails with detail 'invalid-key' or 'invalid-value' and an error message if either
   * is invalid.
   * {@label WITH_VALUE}
   */
  public getOrAdd(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail>;

  /**
   * Gets a value from the map, or adds a value created by a factory function if it does not exist.
   * @param key - The key of the element to be retrieved or created.
   * @param factory - A {@link Collections.ResultMapValueFactory | factory function} to create the value if
   * the key does not exist.
   * @returns `Success` with the value and detail `exists` if the key was found, `Success` with
   * the value and detail `added` if the key was not found and added. Fails with detail 'invalid-key'
   * or 'invalid-value' and an error message if either is invalid.
   * {@label WITH_FACTORY}
   */
  public getOrAdd(key: TK, factory: ResultMapValueFactory<TK, TV>): DetailedResult<TV, ResultMapResultDetail>;
  public getOrAdd(
    key: TK,
    valueOrFactory: TV | ResultMapValueFactory<TK, TV>
  ): DetailedResult<TV, ResultMapResultDetail> {
    if (this._inner.has(key)) {
      return succeedWithDetail(this._inner.get(key)!, 'exists');
    }

    const factory: ResultMapValueFactory<TK, TV> = this._isResultMapValueFactory(valueOrFactory)
      ? valueOrFactory
      : () => succeed(valueOrFactory);

    return factory(key)
      .onSuccess((val) => {
        this._inner.set(key, val);
        return succeedWithDetail(val, 'added');
      })
      .withDetail('invalid-value', 'added');
  }

  /**
   * Returns `true` if the map contains a key.
   * @param key - The key to check.
   * @returns `true` if the key exists, `false` otherwise.
   */
  public has(key: TK): boolean {
    return this._inner.has(key);
  }

  /**
   * Returns an iterator over the map keys.
   * @returns An iterator over the map keys.
   */
  public keys(): IterableIterator<TK> {
    return this._inner.keys();
  }

  /**
   * Sets a key/value pair in the map.
   * @param key - The key to set.
   * @param value - The value to set.
   * @returns `Success` with the new value and the detail `updated` if the
   * key was found and updated, `Success` with the new value and detail
   * `added` if the key was not found and added.  Fails with detail
   * 'invalid-key' or 'invalid-value' and an error message if either is invalid.
   */
  public set(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail> {
    const detail: ResultMapResultDetail = this._inner.has(key) ? 'updated' : 'added';
    this._inner.set(key, value);
    return succeedWithDetail(value, detail);
  }

  /**
   * Returns the number of entries in the map.
   */
  public get size(): number {
    return this._inner.size;
  }

  /**
   * Updates an existing key in the map - the map is not updated if the key does
   * not exist.
   * @param key - The key to update.
   * @param value - The value to set.
   * @returns `Success` with the value and detail 'exists' if the key was found
   * and the value updated, `Failure` an error message and with detail `not-found`
   * if the key was not found, or with detail 'invalid-key' or 'invalid-value'
   * if either is invalid.
   */
  public update(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail> {
    if (this._inner.has(key)) {
      this._inner.set(key, value);
      return succeedWithDetail(value, 'updated');
    }
    return failWithDetail(`${key}: not found.`, 'not-found');
  }

  /**
   * Returns an iterator over the map values.
   * @returns An iterator over the map values.
   */
  public values(): IterableIterator<TV> {
    return this._inner.values();
  }

  /**
   * Gets an iterator over the map entries.
   * @returns An iterator over the map entries.
   */
  public [Symbol.iterator](): IterableIterator<KeyValueEntry<TK, TV>> {
    return this._inner[Symbol.iterator]();
  }

  /**
   * Gets a readonly version of this map.
   * @returns A readonly version of this map.
   */
  public toReadOnly(): IReadOnlyResultMap<TK, TV> {
    return this;
  }

  /**
   * Determines if a value is a {@link Collections.ResultMapValueFactory | ResultMapValueFactory}.
   * @param value - The value to check.
   * @returns `true` if the value is a {@link Collections.ResultMapValueFactory | ResultMapValueFactory},
   * `false` otherwise.
   * @public
   */
  protected _isResultMapValueFactory<TK extends string, TV>(
    value: TV | ResultMapValueFactory<TK, TV>
  ): value is ResultMapValueFactory<TK, TV> {
    return typeof value === 'function';
  }
}
