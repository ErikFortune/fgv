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
import { CollectibleFactoryCallback, ICollectible } from './collectible';
import { ICollector } from './collector';
import { IReadOnlyResultMapConverter } from './resultMapConverter';

/**
 * Parameters for constructing a {@link Collections.CollectorConverter | CollectorConverter}.
 * @public
 */
export interface ICollectorConverterCreateParams<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>,
  TSRC = TITEM
> {
  collector: ICollector<TKEY, TINDEX, TITEM, TSRC>;
  converters: KeyValueConverters<TKEY, TSRC>;
}

/**
 * A {@link Collections.Collector | Collector} wrapper which validates weakly-typed keys
 * and values before calling the wrapped collector.
 * @public
 */
export class CollectorConverter<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>,
  TSRC = TITEM
> implements IReadOnlyResultMapConverter<TKEY, TITEM>
{
  public readonly converters: KeyValueConverters<TKEY, TSRC>;

  public get map(): IReadOnlyResultMap<TKEY, TITEM> {
    return this._collector.toReadOnly();
  }

  protected _collector: ICollector<TKEY, TINDEX, TITEM, TSRC>;

  /**
   * Constructs a new {@link Collections.CollectorConverter | CollectorConverter}.
   * @param params - Required parameters for constructing the collector converter.
   */
  public constructor(params: ICollectorConverterCreateParams<TKEY, TINDEX, TITEM, TSRC>) {
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
   * {@inheritdoc Collections.Collector.(getOrAdd:1)}
   */
  public getOrAdd(key: string, value: unknown): DetailedResult<TITEM, ResultMapResultDetail>;

  /**
   * {@inheritdoc Collections.Collector.(getOrAdd:2)}
   */
  public getOrAdd(
    key: string,
    factory: ResultMapValueFactory<TKEY, TITEM>
  ): DetailedResult<TITEM, ResultMapResultDetail>;
  public getOrAdd(
    key: string,
    valueOrFactory: unknown | CollectibleFactoryCallback<TKEY, TINDEX, TITEM>
  ): DetailedResult<TITEM, ResultMapResultDetail> {
    if (!this._isCollectibleFactoryCallback(valueOrFactory)) {
      return this.converters.convertEntry([key, valueOrFactory]).onSuccess(([vk, vs]) => {
        return this._collector.getOrAdd(vk, vs);
      });
    } else {
      return this.converters.convertKey(key).onSuccess((k) => {
        return this._collector.getOrAdd(k, valueOrFactory);
      });
    }
  }

  /**
   * {@inheritdoc Collections.Collector.has}
   */
  public has(key: string): boolean {
    return this._collector.has(key as TKEY);
  }

  /**
   * {@inheritdoc Collections.Collector.toReadOnly}
   */
  public toReadOnly(): IReadOnlyResultMapConverter<TKEY, TITEM> {
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
