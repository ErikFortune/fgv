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
import { CollectibleFactory, CollectibleFactoryCallback, ICollectible } from './collectible';
import { Collector } from './collector';
import { CollectorConverter, IReadOnlyCollectorConverter } from './collectorConverter';
import { KeyValueEntry } from './common';
import { IReadOnlyConvertingResultMap } from './convertingResultMap';
import { KeyValueConverters } from './keyValueConverters';
import { ResultMapResultDetail } from './readonlyResultMap';

/**
 * A read-only interface exposing non-mutating methods of a
 * {@link Collections.ConvertingCollector | ConvertingCollector}.
 * @public
 */

export interface IReadOnlyConvertingCollector<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>
> extends IReadOnlyConvertingResultMap<TKEY, TITEM> {
  /**
   * {@inheritdoc Collections.ConvertingCollector.converting}
   */
  readonly converting: IReadOnlyCollectorConverter<TKEY, TINDEX, TITEM>;

  /**
   * {@inheritdoc Collections.Collector.getAt}
   */
  readonly getAt: (index: number) => Result<TITEM>;
}

/**
 * Parameters for constructing a {@link Collections.ConvertingCollector | ConvertingCollector}.
 * @public
 */
export interface IConvertingCollectorConstructorParams<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>,
  TSRC = TITEM
> {
  /**
   * {@inheritdoc Collections.ICollectorConstructorParams.factory}
   */
  factory: CollectibleFactory<TKEY, TINDEX, TITEM, TSRC>;

  /**
   * {@inheritdoc Collections.ICollectorConverterCreateParams.converters}
   */
  converters: KeyValueConverters<TKEY, TSRC>;

  /**
   * {@inheritdoc Collections.ICollectorConstructorParams.entries}
   */
  entries?: KeyValueEntry<TKEY, TSRC>[];
}

/**
 * A {@link Collections.Collector | Collector} with a {@link Collections.CollectorConverter | CollectorConverter}
 * property that enables validated use of the underlying map with weakly-typed keys and values.
 * @public
 */
export class ConvertingCollector<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>,
  TSRC = TITEM
> extends Collector<TKEY, TINDEX, TITEM, TSRC> {
  /**
   * A {@link Collections.CollectorConverter | CollectorConverter} which validates keys and values
   * before inserting them into this collector.
   */
  public readonly converting: CollectorConverter<TKEY, TINDEX, TITEM, TSRC>;

  protected readonly _converters: KeyValueConverters<TKEY, TSRC>;

  /**
   * Constructs a new {@link Collections.ConvertingCollector | ConvertingCollector}
   * from the supplied {@link Collections.IConvertingCollectorConstructorParams | parameters}.
   * @param params - Required parameters for constructing the collector.
   */
  public constructor(params: IConvertingCollectorConstructorParams<TKEY, TINDEX, TITEM, TSRC>) {
    super({ factory: params.factory });
    this._converters = params.converters;
    this.converting = new CollectorConverter({ collector: this, converters: params.converters });
    for (const entry of params.entries ?? []) {
      this.getOrAdd(entry[0], entry[1]).orThrow();
    }
  }

  /**
   * Creates a new {@link Collections.ConvertingCollector | ConvertingCollector} instance from
   * the supplied {@link Collections.IConvertingCollectorConstructorParams | parameters}.
   * @param params - Required parameters for constructing the collector.
   * @returns {@link Success} with the new collector if successful, {@link Failure} otherwise.
   */
  public static createConvertingCollector<
    TKEY extends string = string,
    TINDEX extends number = number,
    TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>,
    TSRC = TITEM
  >(
    params: IConvertingCollectorConstructorParams<TKEY, TINDEX, TITEM, TSRC>
  ): Result<ConvertingCollector<TKEY, TINDEX, TITEM, TSRC>> {
    return captureResult(() => new ConvertingCollector(params));
  }

  /**
   * {@inheritdoc Collections.Collector.(getOrAdd:1)}
   */
  public getOrAdd(key: TKEY, item: TSRC): DetailedResult<TITEM, ResultMapResultDetail>;

  /**
   * {@inheritdoc Collections.Collector.(getOrAdd:2)}
   */
  public getOrAdd(
    key: TKEY,
    cb: CollectibleFactoryCallback<TKEY, TINDEX, TITEM>
  ): DetailedResult<TITEM, ResultMapResultDetail>;
  public getOrAdd(
    key: TKEY,
    itemOrCb: TSRC | CollectibleFactoryCallback<TKEY, TINDEX, TITEM>
  ): DetailedResult<TITEM, ResultMapResultDetail> {
    if (this._isFactoryCB(itemOrCb)) {
      return this.converting.converters.convertKey(key).onSuccess((k) => {
        return super.getOrAdd(k, itemOrCb);
      });
    }
    return this.converting.converters.convertEntry([key, itemOrCb]).onSuccess(([k, v]) => {
      return super.getOrAdd(k, v);
    });
  }

  /**
   * Gets a read-only version of this collector as a
   * {@link Collections.IReadOnlyConvertingResultMap | read-only map}.
   * @returns
   */
  public toReadOnly(): IReadOnlyConvertingCollector<TKEY, TINDEX, TITEM> {
    return this;
  }
}
