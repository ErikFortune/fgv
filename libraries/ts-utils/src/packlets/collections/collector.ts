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
 * Additional success or failure details for mutating {@link ICollector | Collector} calls.
 * @public
 */
export type CollectorResultDetail = ResultMapResultDetail | 'invalid-index';

/**
 * A read-only interface exposing non-mutating methods of a {@link Collections.ICollector | Collector}.
 * @public
 */
export interface IReadOnlyCollector<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>
> extends IReadOnlyResultMap<TKEY, TITEM> {
  /**
   * Gets the item at a specified index.
   * @param index - The index of the item to retrieve.
   * @returns Returns {@link Success | Success} with the item if it exists, or {@link Failure | Failure} with an error if the index is out of range.
   */
  getAt(index: number): Result<TITEM>;
}

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
> extends IReadOnlyCollector<TKEY, TINDEX, TITEM> {
  /**
   * Adds an item to the collector using the default {@link Collections.CollectibleFactory | factory}
   * at a specified key, failing if an item with that key already exists.
   * @param key - The key of the item to add.
   * @param item - The source representation of the item to be added.
   * @returns Returns {@link Success | Success} with the item if it is added, or {@link Failure | Failure} with
   * an error if the item cannot be created and indexed.
   * @public
   */
  add(key: TKEY, item: TSRC): DetailedResult<TITEM, CollectorResultDetail>;
  add(
    key: TKEY,
    callback: CollectibleFactoryCallback<TKEY, TINDEX>
  ): DetailedResult<TITEM, CollectorResultDetail>;

  /**
   * Adds an item to the collector using the default {@link Collections.CollectibleFactory | factory}
   * at a specified key, failing if an item with that key already exists.
   * @param item - The item to add.
   * @returns Returns {@link Success | Success} with the item if it is added, or {@link Failure | Failure} with an
   * error if the item cannot be created and indexed.
   */
  addItem(item: TITEM): DetailedResult<TITEM, CollectorResultDetail>;

  /**
   * Gets an item by key if it exists, or creates a new item and adds it using the default {@link Collections.CollectibleFactory | factory} if not.
   * @param key - The key of the item to retrieve.
   * @param item - The source representation of the item to be added if it does not exist.
   * @returns Returns {@link Success | Success} with the item if it exists or could be created, or {@link Failure | Failure} with an error if the
   * item cannot be created and indexed.
   */
  getOrAdd(key: TKEY, item: TSRC): DetailedResult<TITEM, CollectorResultDetail>;

  /**
   * Gets an item by key if it exists, or creates a new item and adds it using the specified {@link Collections.CollectibleFactoryCallback | factory callback} if not.
   * @param key - The key of the item to retrieve.
   * @param callback - The factory callback to create the item if it does not exist.
   * @returns Returns {@link Success | Success} with the item if it exists, or {@link Failure | Failure} with an error if the item is not found.
   */
  getOrAdd(
    key: TKEY,
    callback: CollectibleFactoryCallback<TKEY, TINDEX>
  ): DetailedResult<TITEM, CollectorResultDetail>;

  /**
   * Gets an existing item with a key matching that of a supplied item, or adds the supplied
   * item to the collector if no item with that key exists.
   * @param item - The item to retrieve or add.
   * @returns Returns {@link Success | Success} with the item stored in the collector
   * or {@link Failure | Failure} with an error if the item cannot be created and indexed.
   */
  getOrAddItem(item: TITEM): DetailedResult<TITEM, CollectorResultDetail>;

  /**
   * Gets a {@link IReadOnlyResultMap | read-only map} which can access the items in the collector.
   */
  toReadOnly(): IReadOnlyCollector<TKEY, TINDEX, TITEM>;
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
   * {@inheritdoc Collections.IReadOnlyCollector.getAt}
   */
  public getAt(index: number): Result<TITEM> {
    if (index < 0 || index >= this._byIndex.length) {
      return fail(`${index}: out of range.`);
    }
    return succeed(this._byIndex[index]);
  }

  /**
   * {@inheritdoc ICollector.(add:1)}
   */
  public add(key: TKEY, item: TSRC): DetailedResult<TITEM, CollectorResultDetail>;
  /**
   * {@inheritdoc ICollector.(add:2)}
   */
  public add(
    key: TKEY,
    cb: CollectibleFactoryCallback<TKEY, TINDEX, TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail>;
  public add(
    key: TKEY,
    itemOrCb: TSRC | CollectibleFactoryCallback<TKEY, TINDEX, TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail> {
    if (this._byKey.has(key)) {
      return failWithDetail(`${key}: already exists.`, 'exists');
    }
    return this.getOrAdd(key, itemOrCb as TSRC);
  }

  /**
   * {@inheritdoc ICollector.addItem}
   */
  public addItem(item: TITEM): DetailedResult<TITEM, CollectorResultDetail> {
    if (this._byKey.has(item.key)) {
      return failWithDetail(`${item.key}: already exists.`, 'exists');
    }
    return this.getOrAddItem(item);
  }

  /**
   * {@inheritdoc ICollector.(getOrAdd:1)}
   */
  public getOrAdd(key: TKEY, item: TSRC): DetailedResult<TITEM, CollectorResultDetail>;
  /**
   * {@inheritdoc ICollector.(getOrAdd:2)}
   */
  public getOrAdd(
    key: TKEY,
    cb: CollectibleFactoryCallback<TKEY, TINDEX, TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail>;

  public getOrAdd(
    key: TKEY,
    itemOrCb: TSRC | CollectibleFactoryCallback<TKEY, TINDEX, TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail> {
    if (this._byKey.has(key)) {
      return succeedWithDetail(this._byKey.get(key)!, 'exists');
    }
    const build = this._isFactoryCB(itemOrCb)
      ? itemOrCb(key, this._byIndex.length)
      : this._factory(key, this._byIndex.length, itemOrCb);
    if (build.isFailure()) {
      return failWithDetail<TITEM, CollectorResultDetail>(build.message, 'invalid-value');
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
        'invalid-index'
      );
    }
    this._byKey.set(key, newItem);
    this._byIndex.push(newItem);
    return succeedWithDetail(newItem, 'added');
  }

  /**
   * {@inheritdoc ICollector.getOrAddItem}
   */
  public getOrAddItem(item: TITEM): DetailedResult<TITEM, CollectorResultDetail> {
    if (this._byKey.has(item.key)) {
      return succeedWithDetail(this._byKey.get(item.key)!, 'exists');
    }
    const { message } = item.setIndex(this._byIndex.length);
    if (message !== undefined) {
      return failWithDetail(message, 'invalid-index');
    }
    this._byKey.set(item.key, item);
    this._byIndex.push(item);
    return succeedWithDetail(item, 'added');
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
  public toReadOnly(): IReadOnlyCollector<TKEY, TINDEX, TITEM> {
    return this;
  }

  /**
   * Gets an iterator over the map entries.
   * @returns An iterator over the map entries.
   */
  public [Symbol.iterator](): IterableIterator<KeyValueEntry<TKEY, TITEM>> {
    return this._byKey[Symbol.iterator]();
  }

  /**
   * A simple factory method for derived classes which directly store the supplied
   * object.
   * @param key - The key of the item to create.
   * @param index - The index of the item to create.
   * @param item - The source item to create.
   * @returns `Success` with the created item and a detail of 'success', or
   * `Failure` with an error message and appropriate detail.
   */
  protected static _simpleFactory<
    TKEY extends string = string,
    TINDEX extends number = number,
    TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>
  >(key: TKEY, index: number, item: TITEM): Result<TITEM> {
    return item.setIndex(index).onSuccess(() => succeed(item));
  }

  protected _isFactoryCB(
    item: TSRC | CollectibleFactoryCallback<TKEY, TINDEX, TITEM>
  ): item is CollectibleFactoryCallback<TKEY, TINDEX, TITEM> {
    return typeof item === 'function';
  }
}
