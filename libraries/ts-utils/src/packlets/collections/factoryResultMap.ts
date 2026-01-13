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

import { DetailedResult, Success } from '../base';
import { KeyValueEntry } from './common';
import { KeyValueConverters } from './keyValueConverters';
import {
  IReadOnlyResultMap,
  ReadOnlyResultMap,
  ResultMapForEachCb,
  ResultMapResultDetail
} from './readonlyResultMap';
import { IResultMap, ResultMap, ResultMapValueFactory } from './resultMap';
import { IReadOnlyResultMapValidator, ReadOnlyResultMapValidator } from './resultMapValidator';

/**
 * Parameters for creating a {@link Collections.FactoryResultMap | FactoryResultMap} from an array of entries.
 * @public
 */
export interface IFactoryResultMapCreateParams<TKey extends string = string, TValue = unknown> {
  entries?: IterableIterator<[TKey, TValue]>;
  factory: ResultMapValueFactory<TKey, TValue>;
}

/**
 * A factory which lazily creates a {@link Collections.ResultMap | ResultMap} from either an existing map
 * or an array of entries.
 *
 * @public
 */
export class FactoryResultMap<TKey extends string = string, TValue = unknown>
  implements IReadOnlyResultMap<TKey, TValue>
{
  private readonly _inner: IResultMap<TKey, TValue>;
  private readonly _factory: ResultMapValueFactory<TKey, TValue>;

  /**
   * Constructs a {@link Collections.FactoryResultMap | FactoryResultMap} from the given parameters.
   * @param params - The {@link Collections.IFactoryResultMapCreateParams | FactoryResultMapCreateParams} used to create the map.
   * @public
   */
  public constructor(params: IFactoryResultMapCreateParams<TKey, TValue>) {
    this._inner = new ResultMap<TKey, TValue>(params.entries);
    this._factory = params.factory;
  }

  /** {@inheritdoc Collections.ResultMap.size} */
  public get size(): number {
    return this._inner.size;
  }

  /** {@inheritdoc Collections.ResultMap.entries} */
  public entries(): IterableIterator<KeyValueEntry<TKey, TValue>> {
    return this._inner.entries();
  }

  /** {@inheritdoc Collections.ResultMap.forEach} */
  public forEach(cb: ResultMapForEachCb, arg?: unknown): void {
    this._inner.forEach(cb, arg);
  }

  /**
   * Gets a value from the map, creating it using the factory if it does not already exist.
   * @param key - The key to retrieve.
   * @returns `Success` with the value and detail `exists` if the key was found,
   * `Failure` with detail `not-found` if the key was not found or with detail
   * `invalid-key` if the key is invalid.
   * @remarks Note that, despite the name, this function can mutate the map.
   */
  public get(key: TKey): DetailedResult<TValue, ResultMapResultDetail> {
    if (this._inner.has(key)) {
      return this._inner.get(key);
    }

    return this._factory(key)
      .onSuccess((value) => {
        this._inner.set(key, value);
        return Success.with(value);
      })
      .withDetail<ResultMapResultDetail>('failure', 'added');
  }

  /**
   * Determines whether the map has a value for the given key, attempting to construct
   * an item using the factory if it does not already exist.
   * @param key - The key to check.
   * @returns `true` if the map has a value for the key, `false` otherwise.
   * @remarks Note that, despite the name, this function can mutate the map.
   */
  public has(key: TKey): boolean {
    return this.get(key).success;
  }

  /** {@inheritdoc Collections.ResultMap.keys} */
  public keys(): IterableIterator<TKey> {
    return this._inner.keys();
  }

  /** {@inheritdoc Collections.ResultMap.values} */
  public values(): IterableIterator<TValue> {
    return this._inner.values();
  }

  /**
   * Gets an iterator over the map entries.
   */
  public [Symbol.iterator](): IterableIterator<KeyValueEntry<TKey, TValue>> {
    return this._inner[Symbol.iterator]();
  }

  /**
   * Gets a truly readonly (get and has do not mutate) view of this map.
   * @returns
   */
  public asReadOnly(): IReadOnlyResultMap<TKey, TValue> {
    return new ReadOnlyResultMap<TKey, TValue>(this._inner);
  }
}

/**
 * Parameters for creating a {@link Collections.ValidatingFactoryResultMap | ValidatingFactoryResultMap}.
 * @public
 */
export interface IValidatingFactoryResultMapCreateParams<TKey extends string = string, TValue = unknown>
  extends IFactoryResultMapCreateParams<TKey, TValue> {
  converters: KeyValueConverters<TKey, TValue>;
}

/**
 * A {@link Collections.FactoryResultMap | FactoryResultMap} with a
 * {@link Collections.ResultMapValidator | validator} property that enables validated use of the
 * underlying map with weakly-typed keys and values.
 *
 * @public
 */
export class ValidatingFactoryResultMap<
  TKey extends string = string,
  TValue = unknown
> extends FactoryResultMap<TKey, TValue> {
  public readonly validating: IReadOnlyResultMapValidator<TKey, TValue>;
  public constructor(params: IValidatingFactoryResultMapCreateParams<TKey, TValue>) {
    super(params);
    this.validating = new ReadOnlyResultMapValidator<TKey, TValue>({
      map: this,
      converters: params.converters
    });
  }
}
