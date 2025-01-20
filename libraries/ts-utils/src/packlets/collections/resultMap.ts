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

import {
  captureResult,
  DetailedResult,
  failWithDetail,
  MessageAggregator,
  Result,
  succeed,
  succeedWithDetail
} from '../base';
import {
  IReadOnlyResultMap,
  ResultMapEntry,
  ResultMapForEachCb,
  ResultMapResultDetail
} from './readonlyResultMap';
import { isIterable } from './utils';

/**
 * Validate a key in a {@link Collections.ResultMap | ResultMap}.
 * @public
 */
export type KeyValidationFunction<TK extends string> = (key: string) => Result<TK>;

/**
 * Validate a value in a {@link Collections.ResultMap | ResultMap}.
 * @public
 */
export type ValueValidationFunction<TV> = (value: unknown) => Result<TV>;

/**
 * Parameters for constructing a {@link Collections.ResultMap | ResultMap}.
 * @public
 */
export interface IResultMapConstructorParams<TK extends string = string, TV = unknown> {
  elements?: Iterable<ResultMapEntry<TK, TV>>;
  validateKey?: KeyValidationFunction<TK>;
  validateValue?: ValueValidationFunction<TV>;
}

/**
 * A {@link Collections.ResultMap | ResultMap} class as a `Map<TK, TV>`-like object which
 * reports success or failure with additional details using the
 * {@link https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils#the-result-pattern | result pattern}.
 * @public
 */
export class ResultMap<TK extends string = string, TV = unknown> implements IReadOnlyResultMap<TK, TV> {
  /**
   * Readonly raw access to the inner `Map<TK, TV>` object.
   */
  public get inner(): ReadonlyMap<TK, TV> {
    return this._inner;
  }

  /**
   * Protected raw access to the inner `Map<TK, TV>` object.
   * @public
   */
  protected readonly _inner: Map<TK, TV>;
  protected readonly _keyValidator: KeyValidationFunction<TK> | undefined;
  protected readonly _valueValidator: ValueValidationFunction<TV> | undefined;

  /**
   * Constructs a new {@link Collections.ResultMap | ResultMap}.
   * @param iterable - An iterable to initialize the map.
   */
  public constructor(iterable?: Iterable<ResultMapEntry<TK, TV>>);

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
    iterableOrParams?: Iterable<ResultMapEntry<TK, TV>> | IResultMapConstructorParams<TK, TV>
  ) {
    const params = isIterable(iterableOrParams) ? { elements: iterableOrParams } : iterableOrParams ?? {};
    this._inner = new Map(params?.elements);
    this._keyValidator = params?.validateKey;
    this._valueValidator = params?.validateValue;
    ResultMap.validateElements(this._inner.entries(), params?.validateKey, params?.validateValue).orThrow();
  }

  /**
   * Creates a new {@link Collections.ResultMap | ResultMap}.
   * @param elements - An optional iterable to initialize the map.
   * @returns `Success` with the new map, or `Failure` with error details
   * if an error occurred.
   * @public
   */
  public static create<TK extends string = string, TV = unknown>(
    elements: Iterable<ResultMapEntry<TK, TV>>
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
    elementsOrParams?: Iterable<ResultMapEntry<TK, TV>> | IResultMapConstructorParams<TK, TV>
  ): Result<ResultMap<TK, TV>> {
    return captureResult(() => new ResultMap(elementsOrParams as IResultMapConstructorParams<TK, TV>));
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
   * @returns `Success` with detail `deleted`if the key was found and deleted,
   * `Failure` with detail `not-found` if the key was not found.
   */
  public delete(key: TK): DetailedResult<true, ResultMapResultDetail> {
    if (this._inner.delete(key)) {
      return succeedWithDetail(true, 'deleted');
    }
    return failWithDetail(`${key}: not found.`, 'not-found');
  }

  /**
   * Returns an iterator over the map entries.
   * @returns An iterator over the map entries.
   */
  public entries(): MapIterator<ResultMapEntry<TK, TV>> {
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
   * `Failure` with detail `not-found` if the key was not found.
   */
  public get(key: TK): DetailedResult<TV, ResultMapResultDetail> {
    if (this._inner.has(key)) {
      return succeedWithDetail(this._inner.get(key)!, 'exists');
    }
    return failWithDetail(`${key}: not found.`, 'not-found');
  }

  /**
   * Gets a value from the map, or adds a supplied value it if it does not exist.
   * @param key - The key to retrieve.
   * @param value - The value to add if the key does not exist.
   * @returns `Success` with the value and detail `exists` if the key was found,
   * `Success` with the value and detail `added` if the key was not found and added.
   */
  public getOrAdd(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail> {
    if (this._inner.has(key)) {
      return succeedWithDetail(this._inner.get(key)!, 'exists');
    }
    return this._validateKeyAndValue(key, value).onSuccess(({ k, v }) => {
      this._inner.set(k, v);
      return succeedWithDetail(v, 'added');
    });
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
  public keys(): MapIterator<TK> {
    return this._inner.keys();
  }

  /**
   * Sets a key/value pair in the map.
   * @param key - The key to set.
   * @param value - The value to set.
   * @returns `Success` with detail `updated` if the key was found and updated,
   * `Success` with detail `added` if the key was not found and added.
   */
  public set(key: TK, value: TV): DetailedResult<ResultMap<TK, TV>, ResultMapResultDetail> {
    const detail: ResultMapResultDetail = this._inner.has(key) ? 'updated' : 'added';
    this._inner.set(key, value);
    return succeedWithDetail(this, detail);
  }

  /**
   * Sets a key/value pair in the map if the key does not already exist.
   * @param key - The key to set.
   * @param value - The value to set.
   * @returns `Success` with detail `added` if the key was added,
   * `Failure` with detail `exists` if the key already exists.
   */
  public setNew(key: TK, value: TV): DetailedResult<ResultMap<TK, TV>, ResultMapResultDetail> {
    if (this._inner.has(key)) {
      return failWithDetail(`${key}: already exists.`, 'exists');
    }
    this._inner.set(key, value);
    return succeedWithDetail(this, 'added');
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
   * @returns `Success` with detail `exists` if the key was found and updated,
   * `Failure` with detail `not-found` if the key was not found.
   */
  public update(key: TK, value: TV): DetailedResult<ResultMap<TK, TV>, ResultMapResultDetail> {
    if (this._inner.has(key)) {
      this._inner.set(key, value);
      return succeedWithDetail(this, 'updated');
    }
    return failWithDetail(`${key}: not found.`, 'not-found');
  }

  /**
   * Returns an iterator over the map values.
   * @returns An iterator over the map values.
   */
  public values(): MapIterator<TV> {
    return this._inner.values();
  }

  /**
   * Gets an iterator over the map entries.
   * @returns An iterator over the map entries.
   */
  public [Symbol.iterator](): IterableIterator<ResultMapEntry<TK, TV>> {
    return this._inner[Symbol.iterator]();
  }

  /**
   * Validates supplied keys and values for inclusion in the map using the supplied
   * validators.
   *
   * @returns `Success` if all keys and values are valid, `Failure` with error details
   * if any keys or values are invalid.
   */
  public static validateElements<
    TKS extends string = string,
    TVS = unknown,
    TKV extends string = TKS,
    TVV = TVS
  >(
    elements: Iterable<ResultMapEntry<TKS, TVS>>,
    keyValidator?: KeyValidationFunction<TKV>,
    valueValidator?: ValueValidationFunction<TVV>
  ): Result<ResultMapEntry<TKV, TVV>[]> {
    const validated: ResultMapEntry<TKV, TVV>[] = [];
    if (keyValidator !== undefined || valueValidator !== undefined) {
      const errors = new MessageAggregator();
      for (const [key, value] of elements) {
        const vk = keyValidator?.(key).aggregateError(errors).orDefault() ?? (key as unknown as TKV);
        const vv = valueValidator?.(value).aggregateError(errors).orDefault() ?? (value as unknown as TVV);
        validated.push([vk, vv]);
      }
      return errors.returnOrReport(succeed(validated));
    }
    return succeed(validated);
  }

  /**
   * Helper method to determine if a supplied parameter is an iterable.
   * @param iterableOrParams -
   * @returns
   */
  protected static _isIterable<TI extends Iterable<unknown>, TO>(
    iterableOrParams?: TI | TO
  ): iterableOrParams is TI {
    return (
      (iterableOrParams && typeof iterableOrParams === 'object' && Symbol.iterator in iterableOrParams) ===
      true
    );
  }

  protected _validateKey(key: string): DetailedResult<TK, ResultMapResultDetail> {
    return this._keyValidator !== undefined
      ? this._keyValidator(key).withFailureDetail('invalid-key')
      : succeedWithDetail(key as TK, 'success');
  }

  protected _validateValue(value: unknown): DetailedResult<TV, ResultMapResultDetail> {
    return this._valueValidator !== undefined
      ? this._valueValidator(value).withFailureDetail('invalid-value')
      : succeedWithDetail(value as TV, 'success');
  }

  protected _validateKeyAndValue(
    key: string,
    value: unknown
  ): DetailedResult<{ k: TK; v: TV }, ResultMapResultDetail> {
    return this._validateKey(key).onSuccess((k) => {
      return this._validateValue(value).onSuccess((v) => succeedWithDetail({ k, v }, 'success'));
    });
  }
}
