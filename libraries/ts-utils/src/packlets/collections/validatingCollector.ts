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

import { captureResult, Result } from '../base';
import { CollectibleFactory, ICollectible } from './collectible';
import { Collector } from './collector';
import { CollectorConverter, IReadOnlyCollectorConverter } from './collectorValidator';
import { KeyValueEntry } from './common';
import { IReadOnlyValidatingResultMap } from './validatingResultMap';
import { KeyValueConverters } from './keyValueConverters';

/**
 * A read-only interface exposing non-mutating methods of a
 * {@link Collections.ConvertingCollector | ConvertingCollector}.
 * @public
 */

export interface IReadOnlyConvertingCollector<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>
> extends IReadOnlyValidatingResultMap<TKEY, TITEM> {
  /**
   * {@inheritdoc Collections.ConvertingCollector.validating}
   */
  readonly validating: IReadOnlyCollectorConverter<TKEY, TINDEX, TITEM>;

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
  public readonly validating: CollectorConverter<TKEY, TINDEX, TITEM, TSRC>;

  protected readonly _converters: KeyValueConverters<TKEY, TSRC>;

  /**
   * Constructs a new {@link Collections.ConvertingCollector | ConvertingCollector}
   * from the supplied {@link Collections.IConvertingCollectorConstructorParams | parameters}.
   * @param params - Required parameters for constructing the collector.
   */
  public constructor(params: IConvertingCollectorConstructorParams<TKEY, TINDEX, TITEM, TSRC>) {
    super({ factory: params.factory });
    this._converters = params.converters;
    this.validating = new CollectorConverter({ collector: this, converters: params.converters });
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
   * Gets a read-only version of this collector as a
   * {@link Collections.IReadOnlyValidatingResultMap | read-only map}.
   * @returns
   */
  public toReadOnly(): IReadOnlyConvertingCollector<TKEY, TINDEX, TITEM> {
    return this;
  }
}
