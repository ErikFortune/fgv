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

import { DetailedResult, failWithDetail, succeedWithDetail, Success } from '../base';
import { IReadOnlyResultMap, ResultMapResultDetail } from './readonlyResultMap';
import { IResultMap, ResultMapValueFactory } from './resultMap';
import { KeyValueConverters } from './keyValueConverters';

/**
 * A read-only interface exposing non-mutating methods of a {@link Collections.ResultMapValidator | ResultMapValidator}.
 * @public
 */
export interface IReadOnlyResultMapValidator<TK extends string = string, TV = unknown> {
  /**
   * {@inheritdoc Collections.ResultMapValidator.map}
   */
  readonly map: IReadOnlyResultMap<TK, TV>;

  /**
   * {@inheritdoc Collections.ResultMap.get}
   */
  get(key: string): DetailedResult<TV, ResultMapResultDetail>;

  /**
   * {@inheritdoc Collections.ResultMap.has}
   */
  has(key: string): boolean;
}

/**
 * Parameters for constructing a {@link Collections.ResultMapValidator | ResultMapValidator}.
 * @public
 */
export interface IResultMapValidatorCreateParams<TK extends string = string, TV = unknown> {
  map: IResultMap<TK, TV>;
  converters: KeyValueConverters<TK, TV>;
}

/**
 * A {@link Collections.ResultMap | ResultMap} wrapper which validates weakly-typed keys
 * before calling the wrapped result map.
 * @public
 */
export class ResultMapValidator<TK extends string = string, TV = unknown>
  implements IReadOnlyResultMapValidator<TK, TV>
{
  public readonly converters: KeyValueConverters<TK, TV>;
  public get map(): IReadOnlyResultMap<TK, TV> {
    return this._map;
  }

  protected _map: IResultMap<TK, TV>;

  /**
   * Constructs a new {@link Collections.ResultMapValidator | ResultMapValidator}.
   * @param params - Required parameters for constructing the result map validator.
   */
  public constructor(params: IResultMapValidatorCreateParams<TK, TV>) {
    this._map = params.map;
    this.converters = params.converters;
  }

  /**
   * {@inheritdoc Collections.ResultMap.add}
   */
  public add(key: string, value: unknown): DetailedResult<TV, ResultMapResultDetail> {
    return this.converters.convertEntry([key, value]).onSuccess(([vk, vv]) => {
      return this._map.add(vk, vv);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.delete}
   */
  public delete(key: string): DetailedResult<TV, ResultMapResultDetail> {
    return this.converters.convertKey(key).onSuccess((k) => {
      return this._map.delete(k);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.get}
   */
  public get(key: string): DetailedResult<TV, ResultMapResultDetail> {
    return this.converters.convertKey(key).onSuccess((k) => {
      return this._map.get(k);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.(getOrAdd:1)}
   */
  public getOrAdd(key: string, value: unknown): DetailedResult<TV, ResultMapResultDetail>;

  /**
   * {@inheritdoc Collections.ResultMap.(getOrAdd:2)}
   */
  public getOrAdd(
    key: string,
    factory: ResultMapValueFactory<TK, TV>
  ): DetailedResult<TV, ResultMapResultDetail>;
  public getOrAdd(
    key: string,
    valueOrFactory: unknown | ResultMapValueFactory<TK, TV>
  ): DetailedResult<TV, ResultMapResultDetail> {
    if (!this._isResultMapValueFactory(valueOrFactory)) {
      return this.converters.convertEntry([key, valueOrFactory]).onSuccess(([vk, vv]) => {
        return this._map.getOrAdd(vk, vv);
      });
    } else {
      return this.converters.convertKey(key).onSuccess((k) => {
        return this._map.get(k).onFailure(() => {
          const value = valueOrFactory(k)
            .onSuccess((value) => this.converters.convertEntry([k, value]))
            .onSuccess(([__key, value]) => succeedWithDetail(value, 'added'));

          return value.success
            ? this._map.add(k, value.value)
            : failWithDetail<TV, ResultMapResultDetail>(value.message, 'invalid-value');
        });
      });
    }
  }

  /**
   * {@inheritdoc Collections.ResultMap.has}
   */
  public has(key: string): boolean {
    return this._map.has(key as TK);
  }

  /**
   * {@inheritdoc Collections.ResultMap.set}
   */
  public set(key: string, value: unknown): DetailedResult<TV, ResultMapResultDetail> {
    return this.converters.convertEntry([key, value]).onSuccess(([vk, vv]) => {
      return this._map.set(vk, vv);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.update}
   */
  public update(key: string, value: unknown): DetailedResult<TV, ResultMapResultDetail> {
    return this.converters.convertEntry([key, value]).onSuccess(([vk, vv]) => {
      return this._map.update(vk, vv);
    });
  }

  /**
   * Gets a read-only version of this validator.
   */
  public toReadOnly(): IReadOnlyResultMapValidator<TK, TV> {
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

/**
 * Parameters for constructing a {@link Collections.ResultMapValidator | ResultMapValidator}.
 * @public
 */
export interface IReadOnlyResultMapValidatorCreateParams<TK extends string = string, TV = unknown> {
  map: IReadOnlyResultMap<TK, TV>;
  converters: KeyValueConverters<TK, TV>;
}

/**
 * A {@link Collections.IReadOnlyResultMapValidator | read-only ResultMapValidator} wrapper around
 * an existing {@link Collections.IReadOnlyResultMapValidator | IReadOnlyResultMap}, which uses
 * supplied converters to validate keys.
 * @public
 */
export class ReadOnlyResultMapValidator<TK extends string = string, TV = unknown>
  implements IReadOnlyResultMapValidator<TK, TV>
{
  public readonly map: IReadOnlyResultMap<TK, TV>;
  public readonly converters: KeyValueConverters<TK, TV>;

  /**
   * Constructs a {@link Collections.ReadOnlyResultMapValidator | ReadOnlyResultMapValidator}
   * from the given validator.
   * @param inner - The inner validator.
   * @public
   */
  public constructor(params: IReadOnlyResultMapValidatorCreateParams<TK, TV>) {
    this.map = params.map;
    this.converters = params.converters;
  }

  /**
   * {@inheritdoc Collections.ResultMap.get}
   */
  public get(key: string): DetailedResult<TV, ResultMapResultDetail> {
    return this.converters.convertKey(key).onSuccess((k) => {
      return this.map.get(k);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.has}
   */
  public has(key: string): boolean {
    return this.converters
      .convertKey(key)
      .asResult.onSuccess((k) => {
        return Success.with(this.map.has(k));
      })
      .orDefault(false);
  }
}
