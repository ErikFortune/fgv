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

import { DetailedResult, Result, fail, failWithDetail, succeed, succeedWithDetail } from '../base';
import { ICollectible, CollectibleFactoryCallback, CollectibleFactory } from './collectible';
import { KeyValueEntry } from './common';
import { IReadOnlyResultMap, ResultMapForEachCb, ResultMapResultDetail } from './readonlyResultMap';

/**
 * Collects {@link Collections.ICollectible | ICollectible} items. Items in a collector are created by key and are assigned an index at the
 * time of addition.  Items are immutable once added.
 * @public
 */
export interface ICollector<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>,
  TSRC = TITEM
> extends IReadOnlyResultMap<TKEY, TITEM> {
  /**
   * Gets the item at a specified index.
   * @param index - The index of the item to retrieve.
   * @returns Returs {@link Success | Success} with the item if it exists, or {@link Failure | Failure} with an error if the index is out of range.
   */
  getAt(index: TINDEX): Result<TITEM>;

  /**
   * Gets an item by key if it exists, or creates a new item and adds it using the default {@link Collections.CollectibleFactory | factory} if not.
   * @param key - The key of the item to retrieve.
   * @param item - The source representation of the item to be added if it does not exist.
   * @returns Returns {@link Success | Success} with the item if it exists or could be created, or {@link Failure | Failure} with an error if the
   * item cannot be created and indexed.
   */
  getOrAdd(key: TKEY, item: TSRC): DetailedResult<TITEM, ResultMapResultDetail>;

  /**
   * Gets an item by key if it exists, or creates a new item and adds it using the specified {@link Collections.CollectibleFactoryCallback | factory callback} if not.
   * @param key - The key of the item to retrieve.
   * @param callback - The factory callback to create the item if it does not exist.
   * @returns Returns {@link Success | Success} with the item if it exists, or {@link Failure | Failure} with an error if the item is not found.
   */
  getOrAdd(
    key: TKEY,
    callback: CollectibleFactoryCallback<TKEY, TINDEX>
  ): DetailedResult<TITEM, ResultMapResultDetail>;

  /**
   * Gets a {@link IReadOnlyResultMap | read-only map} which can access the items in the collector.
   */
  toReadOnly(): IReadOnlyResultMap<TKEY, TITEM>;
}

/**
 * A simple {@link ICollector | ICollector} with non-branded `string` key and `number` index, and no transformation of source items.
 * @public
 */
export type ISimpleCollector<TITEM extends ICollectible<string, number>> = ICollector<
  string,
  number,
  TITEM,
  TITEM
>;

/**
 * A {@link ICollector | Collector} with non-branded `string` key and `number` index, and transformation of source items.
 * @public
 */
export type IConvertingCollector<TITEM extends ICollectible<string, number>, TSRC> = ICollector<
  string,
  number,
  TITEM,
  TSRC
>;

/**
 * Parameters for constructing a {@link ICollector | Collector}.
 * @public
 */
export interface ICollectorConstructorParams<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>,
  TSRC = TITEM
> {
  /**
   * The default {@link Collections.CollectibleFactory | factory} to create items.
   */
  factory: CollectibleFactory<TKEY, TINDEX, TITEM, TSRC>;
  /**
   * An optional array of entries to add to the collector.
   */
  entries?: KeyValueEntry<TKEY, TSRC>[];
}

/**
 * A {@link ICollector | Collector} that collects {@link Collections.ICollectible | ICollectible} items. Items in a collector are created by key and are assigned an index at the
 * time of addition.  Items are immutable once added.  Keys and indexes might be branded types, and source items might be transformed on addition.
 * @public
 */
export class Collector<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>,
  TSRC = TITEM
> implements ICollector<TKEY, TINDEX, TITEM, TSRC>
{
  private _byKey: Map<TKEY, TITEM>;
  private _byIndex: TITEM[];
  private _factory: CollectibleFactory<TKEY, TINDEX, TITEM, TSRC>;

  /**
   * {@inheritdoc IReadOnlyResultMap.inner}
   */
  public get inner(): ReadonlyMap<TKEY, TITEM> {
    return this._byKey;
  }

  /**
   * Constructor for derived classes.
   * @param params - Parameters for constructing the collector.
   */
  protected constructor(params: ICollectorConstructorParams<TKEY, TINDEX, TITEM, TSRC>) {
    this._byKey = new Map<TKEY, TITEM>();
    this._byIndex = [];
    this._factory = params.factory;
    params.entries?.forEach((entry) => {
      this.getOrAdd(entry[0], entry[1]);
    });
  }

  /**
   * {@inheritdoc IReadOnlyResultMap.size}
   */
  public get size(): number {
    return this._byKey.size;
  }

  /**
   * {@inheritdoc IReadOnlyResultMap.keys}
   */
  public keys(): IterableIterator<TKEY> {
    return this._byKey.keys();
  }

  /**
   * {@inheritdoc IReadOnlyResultMap.values}
   */
  public values(): IterableIterator<TITEM> {
    return this._byKey.values();
  }

  /**
   * {@inheritdoc IReadOnlyResultMap.entries}
   */
  public entries(): IterableIterator<[TKEY, TITEM]> {
    return this._byKey.entries();
  }

  /**
   * {@inheritdoc IReadOnlyResultMap.forEach}
   */
  public forEach(callback: ResultMapForEachCb<TKEY, TITEM>, arg?: unknown): void {
    for (const [key, value] of this._byKey.entries()) {
      callback(value, key, this, arg);
    }
  }

  /**
   * {@inheritdoc IReadOnlyResultMap.get}
   */
  public get(key: TKEY): DetailedResult<TITEM, ResultMapResultDetail> {
    const item = this._byKey.get(key);
    if (item === undefined) {
      return failWithDetail<TITEM, ResultMapResultDetail>(`${key}: not found.`, 'not-found');
    }
    return succeedWithDetail(item, 'success');
  }

  /**
   * {@inheritdoc ICollector.getAt}
   */
  public getAt(index: TINDEX): Result<TITEM> {
    if (index < 0 || index >= this._byIndex.length) {
      return fail(`${index}: out of range.`);
    }
    return succeed(this._byIndex[index]);
  }

  /**
   * {@inheritdoc ICollector.(getOrAdd:1)}
   */
  public getOrAdd(key: TKEY, item: TSRC): DetailedResult<TITEM, ResultMapResultDetail>;
  /**
   * {@inheritdoc ICollector.(getOrAdd:2)}
   */
  public getOrAdd(
    key: TKEY,
    cb: CollectibleFactoryCallback<TKEY, TINDEX, TITEM>
  ): DetailedResult<TITEM, ResultMapResultDetail>;
  public getOrAdd(
    key: TKEY,
    itemOrCb: TSRC | CollectibleFactoryCallback<TKEY, TINDEX, TITEM>
  ): DetailedResult<TITEM, ResultMapResultDetail> {
    if (this._byKey.has(key)) {
      return succeedWithDetail(this._byKey.get(key)!, 'exists');
    }
    const build = this._isFactoryCB(itemOrCb)
      ? itemOrCb(key, this._byIndex.length)
      : this._factory(key, this._byIndex.length, itemOrCb);
    if (build.isFailure()) {
      return failWithDetail<TITEM, ResultMapResultDetail>(build.message, 'invalid-value');
    }
    const newItem = build.value;

    if (newItem.key !== key) {
      return failWithDetail(
        `$[key}: key mismatch in created item - ${newItem.key} !== ${key}`,
        'invalid-key'
      );
    }
    if (newItem.index !== this._byIndex.length) {
      return failWithDetail(
        `$[key}: index mismatch in created item - ${newItem.index} !== ${this._byIndex.length}`,
        'invalid-value'
      );
    }
    this._byKey.set(key, newItem);
    this._byIndex.push(newItem);
    return succeedWithDetail(newItem, 'added');
  }

  /**
   * {@inheritdoc IReadOnlyResultMap.has}
   */
  public has(key: TKEY): boolean {
    return this._byKey.has(key);
  }

  /**
   * {@inheritdoc ICollector.toReadOnly}
   */
  public toReadOnly(): IReadOnlyResultMap<TKEY, TITEM> {
    return this;
  }

  /**
   * Gets an iterator over the map entries.
   * @returns An iterator over the map entries.
   */
  public [Symbol.iterator](): IterableIterator<KeyValueEntry<TKEY, TITEM>> {
    return this._byKey[Symbol.iterator]();
  }

  protected _isFactoryCB(
    item: TSRC | CollectibleFactoryCallback<TKEY, TINDEX, TITEM>
  ): item is CollectibleFactoryCallback<TKEY, TINDEX, TITEM> {
    return typeof item === 'function';
  }
}
