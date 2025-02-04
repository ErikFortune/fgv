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

import { captureResult, DetailedResult, failWithDetail, Result, succeedWithDetail } from '../base';
import { ICollectible, CollectibleFactoryCallback, CollectibleFactory, CollectibleKey } from './collectible';
import { Collector, CollectorResultDetail } from './collector';
import { KeyValueEntry } from './common';

/**
 * Parameters for constructing a {@link Collections.ConvertingCollector | ConvertingCollector}.
 * @public
 */
export interface IConvertingCollectorConstructorParams<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TITEM extends ICollectible<any, any>,
  TSRC = TITEM
> {
  /**
   * The default {@link Collections.CollectibleFactory | factory} to create items.
   */
  factory: CollectibleFactory<TITEM, TSRC>;
  /**
   * An optional array of entries to add to the collector.
   */
  entries?: KeyValueEntry<CollectibleKey<TITEM>, TSRC>[];
}

/**
 * A {@link Collector | collector} that collects {@link Collections.ICollectible | ICollectible} items,
 * optionally converting them from a source representation to the target representation using a factory
 * supplied at default or at the time of collection.
 * @public
 */
export class ConvertingCollector<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TITEM extends ICollectible<any, any>,
  TSRC = TITEM
> extends Collector<TITEM> {
  private _factory: CollectibleFactory<TITEM, TSRC>;

  /**
   * Constructs a new {@link Collections.ConvertingCollector | ConvertingCollector}.
   * @param params - Parameters for constructing the collector.
   */
  public constructor(params: IConvertingCollectorConstructorParams<TITEM, TSRC>) {
    super();
    this._factory = params.factory;
    params.entries?.forEach((entry) => {
      this.getOrAdd(entry[0], entry[1]).orThrow();
    });
  }

  /**
   * Creates a new {@link Collections.ConvertingCollector | ConvertingCollector}.
   * @param params - Required parameters for constructing the collector.
   * @returns Returns {@link Success | Success} with the new collector if it is created, or {@link Failure | Failure}
   * with an error if the collector cannot be created.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static createConvertingCollector<TITEM extends ICollectible<any, any>, TSRC = TITEM>(
    params: IConvertingCollectorConstructorParams<TITEM, TSRC>
  ): Result<ConvertingCollector<TITEM, TSRC>> {
    return captureResult(() => new ConvertingCollector(params));
  }

  /**
   * {@inheritdoc Collections.Collector.add}
   */
  public add(item: TITEM): DetailedResult<TITEM, CollectorResultDetail>;

  /**
   * Adds an item to the collector using the default {@link Collections.CollectibleFactory | factory}
   * at a specified key, failing if an item with that key already exists.
   * @param key - The key of the item to add.
   * @param item - The source representation of the item to be added.
   * @returns Returns {@link Success | Success} with the item if it is added, or {@link Failure | Failure} with
   * an error if the item cannot be created and indexed.
   * @public
   */
  public add(key: CollectibleKey<TITEM>, item: TSRC): DetailedResult<TITEM, CollectorResultDetail>;

  /**
   * Adds an item to the collector using a supplied {@link Collections.CollectibleFactoryCallback | factory callback}
   * at a specified key, failing if an item with that key already exists or if the created item is invalid.
   * @param key - The key of the item to add.
   * @param callback - The factory callback to create the item.
   * @returns Returns {@link Success | Success} with the item if it is added, or {@link Failure | Failure} with
   * an error if the item cannot be created and indexed.
   */
  public add(
    key: CollectibleKey<TITEM>,
    cb: CollectibleFactoryCallback<TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail>;

  public add(
    keyOrItem: CollectibleKey<TITEM> | TITEM,
    itemOrCb?: TSRC | CollectibleFactoryCallback<TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail> {
    if (this._overloadIsItem(keyOrItem, itemOrCb)) {
      return super.add(keyOrItem);
    }
    return this._buildItem(keyOrItem, itemOrCb!)
      .withFailureDetail<CollectorResultDetail>('invalid-value')
      .onSuccess((item) => {
        return super.add(item);
      });
  }

  /**
   * {@inheritdoc Collections.Collector.(getOrAdd:1)}
   */
  public getOrAdd(item: TITEM): DetailedResult<TITEM, CollectorResultDetail>;

  /**
   * {@inheritdoc Collections.Collector.(getOrAdd:2)}
   */
  public getOrAdd(
    key: CollectibleKey<TITEM>,
    callback: CollectibleFactoryCallback<TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail>;

  /**
   * Gets an item by key if it exists, or creates a new item and adds it using the default {@link Collections.CollectibleFactory | factory} if not.
   * @param key - The key of the item to retrieve.
   * @param item - The source representation of the item to be added if it does not exist.
   * @returns Returns {@link Success | Success} with the item if it exists or could be created, or {@link Failure | Failure} with an error if the
   * item cannot be created and indexed.
   */
  public getOrAdd(key: CollectibleKey<TITEM>, item: TSRC): DetailedResult<TITEM, CollectorResultDetail>;

  public getOrAdd(
    keyOrItem: CollectibleKey<TITEM> | TITEM,
    itemOrCb?: TSRC | CollectibleFactoryCallback<TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail> {
    if (this._overloadIsItem(keyOrItem, itemOrCb)) {
      return super.getOrAdd(keyOrItem);
    }

    if (this.has(keyOrItem)) {
      return this.get(keyOrItem);
    }

    return this._buildItem(keyOrItem, itemOrCb!)
      .withFailureDetail<CollectorResultDetail>('invalid-value')
      .onSuccess((item) => {
        if (item.key !== keyOrItem) {
          return failWithDetail<TITEM, CollectorResultDetail>(
            `${keyOrItem}: key mismatch - item has unexpected key ${item.key}`,
            'invalid-key'
          );
        }
        return succeedWithDetail(item, 'success');
      })
      .onSuccess((item) => {
        return super.add(item);
      });
  }

  /**
   * Helper method for derived classes to determine if a supplied
   * itemOrCb parameter is a factory callback.
   * @param itemOrCb - Overloaded parameter is either `CollectibleKey<TITEM>` or
   * a {@link Collections.CollectibleFactoryCallback | factory callback}.
   * @returns Returns `true` if the parameter is a factory callback, `false` otherwise.
   * @public
   */
  protected _isFactoryCB(
    itemOrCb: TSRC | CollectibleFactoryCallback<TITEM>
  ): itemOrCb is CollectibleFactoryCallback<TITEM> {
    return typeof itemOrCb === 'function';
  }

  /**
   * Helper method for derived classes to determine if a supplied
   * keyOrItem parameter is an item.
   * @param keyOrItem - Overloaded parameter is either `CollectibleKey<TITEM>` or `TITEM`.
   * @param itemOrCb - Overloaded parameter is either `TSRC`, a {@link Collections.CollectibleFactoryCallback | factory callback}
   * or `undefined`.
   * @returns Returns `true` if the parameter is an item, `false` otherwise.
   * @public
   */
  protected _overloadIsItem(
    keyOrItem: CollectibleKey<TITEM> | TITEM,
    itemOrCb?: TSRC | CollectibleFactoryCallback<TITEM>
  ): keyOrItem is TITEM {
    return itemOrCb === undefined;
  }

  /**
   * Helper method for derived classes to build an item from a key and a source representation using
   * a default or supplied factory.
   * @param key - The key of the item to build.
   * @param itemOrCb - The source representation of the item to build, or a factory callback to create it.
   * @returns Returns {@link Success | Success} with the item if it is built, or {@link Failure | Failure}
   * with an error if the item cannot be built.
   * @public
   */
  protected _buildItem(
    key: CollectibleKey<TITEM>,
    itemOrCb: TSRC | CollectibleFactoryCallback<TITEM>
  ): Result<TITEM> {
    return this._isFactoryCB(itemOrCb) ? itemOrCb(key, this.size) : this._factory(key, this.size, itemOrCb);
  }
}
