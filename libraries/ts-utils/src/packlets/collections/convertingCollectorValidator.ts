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
import { CollectibleFactoryCallback, CollectibleKey, ICollectible } from './collectible';
import { CollectorResultDetail } from './collector';
import { ConvertingCollector } from './convertingCollector';
import { IReadOnlyCollectorValidator } from './collectorValidator';

/**
 * Parameters for constructing a {@link Collections.ConvertingCollectorValidator | ConvertingCollectorValidator}.
 * @public
 */
export interface IConvertingCollectorValidatorCreateParams<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TITEM extends ICollectible<any, any>,
  TSRC = TITEM
> {
  /** The converting collector to validate access to. */
  collector: ConvertingCollector<TITEM, TSRC>;
  /** The key-value converters for validation. */
  converters: KeyValueConverters<CollectibleKey<TITEM>, TSRC>;
}

/**
 * A {@link Collections.ConvertingCollector | ConvertingCollector} wrapper which validates weakly-typed keys
 * and values before calling the wrapped collector.  Unlike the basic {@link Collections.CollectorValidator | CollectorValidator},
 * the converting collector expects the items to be in the source type of the converting collector, not the target type.
 * @public
 */
export class ConvertingCollectorValidator<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TITEM extends ICollectible<any, any>,
  TSRC = TITEM
> implements IReadOnlyCollectorValidator<TITEM>
{
  public readonly converters: KeyValueConverters<CollectibleKey<TITEM>, TSRC>;

  public get map(): IReadOnlyResultMap<CollectibleKey<TITEM>, TITEM> {
    return this._collector.toReadOnly();
  }

  protected _collector: ConvertingCollector<TITEM, TSRC>;

  /**
   * Constructs a new {@link Collections.ConvertingCollectorValidator | ConvertingCollectorValidator}.
   * @param params - Required parameters for constructing the collector validator.
   */
  public constructor(params: IConvertingCollectorValidatorCreateParams<TITEM, TSRC>) {
    this._collector = params.collector;
    this.converters = params.converters;
  }

  /**
   * Adds an item to the collector using the default factory at a specified key,
   * failing if an item with that key already exists.
   * @param key - The weakly-typed key of the item to add.
   * @param value - The source representation of the item to be added.
   * @returns Returns {@link Success | Success} with the item if it is added, or {@link Failure | Failure} with
   * an error if the item cannot be created and indexed.
   */
  public add(key: string, value: unknown): DetailedResult<TITEM, CollectorResultDetail>;

  /**
   * Adds an item to the collector using a supplied factory callback
   * at a specified key, validating the key first.
   */
  public add(
    key: string,
    factory: ResultMapValueFactory<CollectibleKey<TITEM>, TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail>;
  public add(
    key: string,
    valueOrFactory: unknown | ResultMapValueFactory<CollectibleKey<TITEM>, TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail> {
    if (this.has(key)) {
      return failWithDetail(`${key}: already exists`, 'exists');
    }
    return this.getOrAdd(key, valueOrFactory);
  }

  /**
   * {@inheritDoc Collections.Collector.get}
   */
  public get(key: string): DetailedResult<TITEM, ResultMapResultDetail> {
    return this.converters.convertKey(key).onSuccess((k) => {
      return this._collector.get(k);
    });
  }

  /**
   * Gets an existing item with a key matching the supplied key, or adds a new item to the collector
   * by converting the supplied weakly-typed value if no item with that key exists.
   * @param key - The weakly-typed key of the item to get or add.
   * @param value - The weakly-typed source value to convert and add if the key does not exist.
   * @returns Returns {@link DetailedSuccess | Success} with the item stored in the collector -
   * detail `exists` indicates that an existing item was returned and detail `added` indicates
   * that the item was added. Returns {@link DetailedFailure | Failure} with an error and
   * appropriate detail if the item could not be added.
   */
  public getOrAdd(key: string, value: unknown): DetailedResult<TITEM, CollectorResultDetail>;

  /**
   * Gets an existing item with a key matching the supplied key, or adds a new item to the collector
   * using a factory callback if no item with that key exists.
   * @param key - The weakly-typed key of the item to get or add.
   * @param factory - The factory callback to create the item.
   * @returns Returns {@link DetailedSuccess | Success} with the item stored in the collector -
   * detail `exists` indicates that an existing item was returned and detail `added` indicates
   * that the item was added. Returns {@link DetailedFailure | Failure} with an error and
   * appropriate detail if the item could not be added.
   */
  public getOrAdd(
    key: string,
    factory: ResultMapValueFactory<CollectibleKey<TITEM>, TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail>;

  public getOrAdd(
    key: string,
    valueOrFactory: unknown | CollectibleFactoryCallback<TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail> {
    if (!this._isCollectibleFactoryCallback(valueOrFactory)) {
      const converted = this.converters.convertEntry([key, valueOrFactory]);
      if (converted.isFailure()) {
        return failWithDetail(converted.message, converted.detail);
      }
      const [vk, vs] = converted.value;
      return this._collector.getOrAdd(vk, vs);
    } else {
      const converted = this.converters.convertKey(key);
      if (converted.isFailure()) {
        return failWithDetail(converted.message, converted.detail);
      }
      return this._collector.getOrAdd(converted.value, valueOrFactory);
    }
  }

  /**
   * {@inheritDoc Collections.ResultMap.has}
   */
  public has(key: string): boolean {
    return this._collector.has(key as CollectibleKey<TITEM>);
  }

  /**
   * {@inheritDoc Collections.Collector.toReadOnly}
   */
  public toReadOnly(): IReadOnlyCollectorValidator<TITEM> {
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
    value: unknown | CollectibleFactoryCallback<TITEM>
  ): value is CollectibleFactoryCallback<TITEM> {
    return typeof value === 'function';
  }
}
