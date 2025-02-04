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

import { DetailedResult, failWithDetail } from '../base';
import { IReadOnlyResultMap, ResultMapResultDetail } from './readonlyResultMap';
import { ResultMapValueFactory } from './resultMap';
import { KeyValueConverters } from './keyValueConverters';
import { CollectibleFactoryCallback, ICollectible } from './collectible';
import { Collector, CollectorResultDetail } from './collector';
import { IReadOnlyResultMapValidator } from './resultMapValidator';

/**
 * A read-only interface exposing non-mutating methods of a
 * {@link Collections.CollectorValidator | CollectorValidator}.
 * @public
 */
export interface IReadOnlyCollectorValidator<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY> = ICollectible<TKEY, TINDEX>
> extends IReadOnlyResultMapValidator<TKEY, TITEM> {
  /**
   * {@inheritdoc Collections.ConvertingCollectorValidator.map}
   */
  readonly map: IReadOnlyResultMap<TKEY, TITEM>;

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
    factory: ResultMapValueFactory<TKEY, TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail>;
}

/**
 * Parameters for constructing a {@link Collections.CollectorValidator | CollectorValidator}.
 * @public
 */
export interface ICollectorValidatorCreateParams<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>
> {
  readonly collector: Collector<TKEY, TINDEX, TITEM>;
  readonly converters: KeyValueConverters<TKEY, TITEM>;
}

/**
 * A {@link Collections.Collector | Collector} wrapper which validates weakly-typed keys
 * and values before calling the wrapped collector.
 * @public
 */
export class CollectorValidator<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>
> implements IReadOnlyCollectorValidator<TKEY, TINDEX, TITEM>
{
  public readonly converters: KeyValueConverters<TKEY, TITEM>;

  public get map(): IReadOnlyResultMap<TKEY, TITEM> {
    return this._collector.toReadOnly();
  }

  protected _collector: Collector<TKEY, TINDEX, TITEM>;

  /**
   * Constructs a new {@link Collections.ConvertingCollectorValidator | ConvertingCollectorValidator}.
   * @param params - Required parameters for constructing the collector validator.
   */
  public constructor(params: ICollectorValidatorCreateParams<TKEY, TINDEX, TITEM>) {
    this._collector = params.collector;
    this.converters = params.converters;
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
    factory: ResultMapValueFactory<TKEY, TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail> {
    const keyResult = this.converters.convertKey(key);
    if (keyResult.isFailure()) {
      return failWithDetail(keyResult.message, keyResult.detail);
    }
    return this._collector.getOrAdd(keyResult.value, factory);
  }

  /**
   * {@inheritdoc Collections.ResultMap.has}
   */
  public has(key: string): boolean {
    return this._collector.has(key as TKEY);
  }

  /**
   * {@inheritdoc Collections.Collector.toReadOnly}
   */
  public toReadOnly(): IReadOnlyCollectorValidator<TKEY, TINDEX, TITEM> {
    return this;
  }

  /**
   * Determines if a value is a {@link Collections.CollectibleFactoryCallback | CollectibleFactoryCallback}.
   * @param value - The value to check.
   * @returns `true` if the value is a {@link Collections.CollectibleFactoryCallback | CollectibleFactoryCallback},
   * `false` otherwise.
   * @public
   */
  protected _isCollectibleFactoryCallback(
    value: unknown | CollectibleFactoryCallback<TKEY, TINDEX, TITEM>
  ): value is CollectibleFactoryCallback<TKEY, TINDEX, TITEM> {
    return typeof value === 'function';
  }
}
