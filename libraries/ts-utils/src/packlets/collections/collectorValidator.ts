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

import { DetailedResult } from '../base';
import { IReadOnlyResultMap, ResultMapResultDetail } from './readonlyResultMap';
import { ResultMapValueFactory } from './resultMap';
import { KeyValueConverters } from './keyValueConverters';
import { Collector, CollectorResultDetail } from './collector';
import { IReadOnlyResultMapValidator } from './resultMapValidator';
import { CollectibleKey, ICollectible } from './collectible';

/**
 * A read-only interface exposing non-mutating methods of a
 * {@link Collections.CollectorValidator | CollectorValidator}.
 * @public
 */
export interface IReadOnlyCollectorValidator<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TITEM extends ICollectible<any, any>
> extends IReadOnlyResultMapValidator<CollectibleKey<TITEM>, TITEM> {
  /**
   * {@inheritdoc Collections.ConvertingCollectorValidator.map}
   */
  readonly map: IReadOnlyResultMap<CollectibleKey<TITEM>, TITEM>;

  /**
   * {@inheritdoc Collections.Collector.get}
   */
  get(key: string): DetailedResult<TITEM, ResultMapResultDetail>;

  /**
   * {@inheritdoc Collections.ResultMap.has}
   */
  has(key: string): boolean;

  /**
   * {@inheritdoc Collections.Collector.(getOrAdd:2)}
   */
  getOrAdd(
    key: string,
    factory: ResultMapValueFactory<CollectibleKey<TITEM>, TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail>;
}

/**
 * Parameters for constructing a {@link Collections.CollectorValidator | CollectorValidator}.
 * @public
 */
export interface ICollectorValidatorCreateParams<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TITEM extends ICollectible<any, any>
> {
  readonly collector: Collector<TITEM>;
  readonly converters: KeyValueConverters<CollectibleKey<TITEM>, TITEM>;
}

/**
 * A {@link Collections.Collector | Collector} wrapper which validates weakly-typed keys
 * and values before calling the wrapped collector.
 * @public
 */
export class CollectorValidator<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TITEM extends ICollectible<any, any>
> implements IReadOnlyCollectorValidator<TITEM>
{
  public readonly converters: KeyValueConverters<CollectibleKey<TITEM>, TITEM>;

  public get map(): IReadOnlyResultMap<CollectibleKey<TITEM>, TITEM> {
    return this._collector.toReadOnly();
  }

  protected _collector: Collector<TITEM>;

  /**
   * Constructs a new {@link Collections.ConvertingCollectorValidator | ConvertingCollectorValidator}.
   * @param params - Required parameters for constructing the collector validator.
   */
  public constructor(params: ICollectorValidatorCreateParams<TITEM>) {
    this._collector = params.collector;
    this.converters = params.converters;
  }

  /**
   * {@inheritdoc Collections.Collector.add}
   */
  public add(item: unknown): DetailedResult<TITEM, CollectorResultDetail> {
    return this._convertValue(item).onSuccess((i) => {
      return this._collector.add(i);
    });
  }

  /**
   * {@inheritdoc Collections.Collector.get}
   */
  public get(key: string): DetailedResult<TITEM, ResultMapResultDetail> {
    return this.converters.convertKey(key).onSuccess((k) => {
      return this._collector.get(k);
    });
  }

  /**
   * {@inheritdoc Collections.Collector.(getOrAdd:2)}
   */
  public getOrAdd(
    key: string,
    factory: ResultMapValueFactory<CollectibleKey<TITEM>, TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail>;

  /**
   * {@inheritdoc Collections.Collector.(getOrAdd:1)}
   * @param item - The item to add to the collector.
   */
  public getOrAdd(item: unknown): DetailedResult<TITEM, CollectorResultDetail>;

  public getOrAdd(
    keyOrItem: string | unknown,
    factoryCb?: ResultMapValueFactory<CollectibleKey<TITEM>, TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail> {
    if (factoryCb === undefined) {
      return this._convertValue(keyOrItem).onSuccess((item) => this._collector.getOrAdd(item));
    } else {
      return this.converters
        .convertKey(keyOrItem)
        .withDetail<CollectorResultDetail>('invalid-key', 'success')
        .onSuccess((key) => this._collector.getOrAdd(key, factoryCb));
    }
  }

  /**
   * {@inheritdoc Collections.ResultMap.has}
   */
  public has(key: string): boolean {
    return this._collector.has(key as CollectibleKey<TITEM>);
  }

  /**
   * {@inheritdoc Collections.Collector.toReadOnly}
   */
  public toReadOnly(): IReadOnlyCollectorValidator<TITEM> {
    return this;
  }

  /**
   * Helper to convert a value, returning a {@link DetailedResult | DetailedResult}
   * and formatting the error message.
   * @param value - The value to convert.
   * @returns {@link DetailedSuccess | DetailedSuccess} with the converted value
   * and detail `success` if conversion is successful, or
   * {@link DetailedFailure | DetailedFailure} with the error message and detail `invalid-value`
   * if conversion fails.
   */
  protected _convertValue(value: unknown): DetailedResult<TITEM, CollectorResultDetail> {
    return this.converters
      .convertValue(value)
      .withErrorFormat((message) => `invalid item: ${message}`)
      .withDetail<CollectorResultDetail>('invalid-value', 'success');
  }
}
