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

import {
  captureResult,
  DetailedResult,
  failWithDetail,
  Result,
  fail,
  succeed,
  succeedWithDetail
} from '../base';
import { CollectibleFactoryCallback, CollectibleKey, ICollectible } from './collectible';
import { KeyValueEntry } from './common';
import { IReadOnlyResultMap, ResultMapForEachCb, ResultMapResultDetail } from './readonlyResultMap';

/**
 * Additional success or failure details for mutating collector calls.
 * @public
 */
export type CollectorResultDetail = ResultMapResultDetail | 'invalid-index';

/**
 * A read-only interface exposing only the non-mutating methods of a {@link Collections.Collector | ICollector}.
 * @public
 */
export interface IReadOnlyCollector<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TITEM extends ICollectible<any, any>
> extends IReadOnlyResultMap<CollectibleKey<TITEM>, TITEM> {
  /**
   * Gets the item at a specified index.
   * @param index - The index of the item to retrieve.
   * @returns Returns {@link Success | Success} with the item if it exists, or {@link Failure | Failure}
   * with an error if the index is out of range.
   */
  getAt(index: number): Result<TITEM>;

  /**
   * Gets all items in the collection, ordered by index.
   * @returns An array of items in the collection, ordered by index.
   */
  valuesByIndex(): ReadonlyArray<TITEM>;
}

/**
 * Parameters for constructing a {@link Collections.Collector | ICollector}.
 * @public
 */
export interface ICollectorConstructorParams<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TITEM extends ICollectible<any, any>
> {
  items?: TITEM[];
}

/**
 * A {@link Collections.Collector | Collector} that is a specialized collection
 * which contains items of type {@link Collections.ICollectible | ICollectible},
 * which have a unique key and a write-once index.
 *
 * Items are assigned an index sequentially as they are added to the collection.
 * Once added, items are immutable - they cannot be removed or replaced.
 * @public
 */
export class Collector<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TITEM extends ICollectible<any, any>
> implements IReadOnlyCollector<TITEM>
{
  private readonly _byKey: Map<CollectibleKey<TITEM>, TITEM>;
  private readonly _byIndex: TITEM[];

  /**
   * {@inheritdoc Collections.ResultMap.size}
   */
  public get size(): number {
    return this._byIndex.length;
  }

  /**
   * Constructs a new {@link Collections.Collector | Collector}.
   * @param params - Optional {@link Collections.ICollectorConstructorParams | initialization parameters} used
   * to construct the collector.
   */
  public constructor(params?: ICollectorConstructorParams<TITEM>) {
    this._byKey = new Map<CollectibleKey<TITEM>, TITEM>();
    this._byIndex = [];
    for (const item of params?.items ?? []) {
      this.add(item).orThrow();
    }
  }

  /**
   * Creates a new {@link Collections.Collector | Collector} instance.
   * @param params - Optional {@link Collections.ICollectorConstructorParams | initialization parameters} used
   * to create the collector.
   * @returns Returns {@link Success | Success} with the new collector if it was created successfully,
   * or {@link Failure | Failure} with an error if the collector could not be created.
   */
  public static createCollector<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TITEM extends ICollectible<any, any>
  >(params?: ICollectorConstructorParams<TITEM>): Result<Collector<TITEM>> {
    return captureResult(() => new Collector(params));
  }

  /**
   * Adds an item to the collection, failing if a different item with the same key already exists. Note
   * that adding an object that is already in the collection again will succeed without updating the collection.
   * @param item - The item to add.
   * @returns Returns {@link DetailedSuccess | Success} with the item and detail `added` if it was added
   * or detail `exists` if the item was already in the map.  Returns {@link DetailedFailure | Failure} with
   * an error message and appropriate detail if the item could not be added.
   */
  public add(item: TITEM): DetailedResult<TITEM, CollectorResultDetail> {
    const existing = this._byKey.get(item.key);
    if (existing === item) {
      return succeedWithDetail(item, 'exists');
    } else if (existing) {
      return failWithDetail(`${item.key}: already exists`, 'exists');
    }
    const indexResult = item.setIndex(this._byIndex.length);
    if (indexResult.isFailure()) {
      return failWithDetail(`${item.key}: ${indexResult.message}`, 'invalid-index');
    } else if (item.index !== this._byIndex.length) {
      return failWithDetail(`${item.key}: index mismatch - built item has ${item.index}`, 'invalid-index');
    }
    this._byKey.set(item.key, item);
    this._byIndex.push(item);
    return succeedWithDetail(item, 'added');
  }

  /**
   * {@inheritdoc Collections.ResultMap.entries}
   */
  public entries(): IterableIterator<KeyValueEntry<CollectibleKey<TITEM>, TITEM>> {
    return this._byKey.entries();
  }

  /**
   * {@inheritdoc Collections.ResultMap.forEach}
   */
  public forEach(callback: ResultMapForEachCb<CollectibleKey<TITEM>, TITEM>, arg?: unknown): void {
    for (const [key, value] of this._byKey.entries()) {
      callback(value, key, this, arg);
    }
  }

  /**
   * {@inheritdoc Collections.ResultMap.get}
   */
  public get(key: CollectibleKey<TITEM>): DetailedResult<TITEM, ResultMapResultDetail> {
    const item = this._byKey.get(key);
    return item ? succeedWithDetail(item, 'exists') : failWithDetail(`${key}: not found`, 'not-found');
  }

  /**
   * {@inheritdoc Collections.IReadOnlyCollector.getAt}
   */
  public getAt(index: number): Result<TITEM> {
    if (typeof index !== 'number') {
      // Handle Symbol conversion safely
      const indexStr = typeof index === 'symbol' ? (index as symbol).toString() : String(index);
      return fail(`${indexStr}: collector index must be a number.`);
    }

    // Check that the number is a finite integer (handles NaN, Infinity, and non-integers)
    if (!Number.isFinite(index) || !Number.isInteger(index)) {
      return fail(`${index}: collector index must be a finite integer.`);
    }

    if (index < 0 || index >= this._byIndex.length) {
      return fail(`${index}: collector index out of range.`);
    }

    return succeed(this._byIndex[index]);
  }

  /**
   * Gets an existing item with a key matching that of a supplied item, or adds the supplied
   * item to the collector if no item with that key exists.
   * @param item - The item to get or add.
   * @returns Returns {@link DetailedSuccess | Success} with the item stored in the collector -
   * detail `exists` indicates that an existing item return and detail `added` indicates that the
   * item was added. Returns {@link DetailedFailure | Failure} with an error and appropriate
   * detail if the item could not be added.
   */
  public getOrAdd(item: TITEM): DetailedResult<TITEM, CollectorResultDetail>;

  /**
   * Gets an existing item with a key matching the supplied key, or adds a new item to the collector
   * using a factory callback if no item with that key exists.
   * @param key - The key of the item to add.
   * @param callback - The factory callback to create the item.
   * @returns Returns {@link DetailedSuccess | Success} with the item stored in the collector -
   * detail `exists` indicates that an existing item return and detail `added` indicates that the
   * item was added. Returns {@link DetailedFailure | Failure} with an error and appropriate
   * detail if the item could not be added.
   */
  public getOrAdd(
    key: CollectibleKey<TITEM>,
    factory: CollectibleFactoryCallback<TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail>;

  public getOrAdd(
    keyOrItem: CollectibleKey<TITEM> | TITEM,
    factory?: CollectibleFactoryCallback<TITEM>
  ): DetailedResult<TITEM, CollectorResultDetail> {
    const key = !this._isItem(keyOrItem) ? keyOrItem : keyOrItem.key;
    const existing = this._byKey.get(key);
    if (existing) {
      return succeedWithDetail(existing, 'exists');
    }

    const itemResult = !this._isItem(keyOrItem)
      ? factory!(keyOrItem, this._byIndex.length)
      : succeed(keyOrItem);
    if (itemResult.isFailure()) {
      return failWithDetail(`${key}: ${itemResult.message}`, 'invalid-value');
    }
    const item = itemResult.value;

    if (item.key !== key) {
      return failWithDetail(`${key}: key mismatch - built item has ${key}`, 'invalid-key');
    }

    return itemResult.withFailureDetail<CollectorResultDetail>('invalid-index').onSuccess((item) => {
      return this.add(item);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.has}
   */
  public has(key: CollectibleKey<TITEM>): boolean {
    return this._byKey.has(key);
  }

  /**
   * {@inheritdoc Collections.ResultMap.keys}
   */
  public keys(): IterableIterator<CollectibleKey<TITEM>> {
    return this._byKey.keys();
  }

  /**
   * {@inheritdoc Collections.ResultMap.values}
   */
  public values(): IterableIterator<TITEM> {
    return this._byKey.values();
  }

  /**
   * {@inheritdoc Collections.IReadOnlyCollector.valuesByIndex}
   */
  public valuesByIndex(): ReadonlyArray<TITEM> {
    return this._byIndex;
  }

  /**
   * Gets a read-only version of this collector.
   */
  public toReadOnly(): IReadOnlyCollector<TITEM> {
    return this;
  }

  /**
   * Gets an iterator over the map entries.
   * @returns An iterator over the map entries.
   */
  public [Symbol.iterator](): IterableIterator<KeyValueEntry<CollectibleKey<TITEM>, TITEM>> {
    return this._byKey[Symbol.iterator]();
  }

  protected _isItem(keyOrItem: CollectibleKey<TITEM> | TITEM): keyOrItem is TITEM {
    return typeof keyOrItem !== 'string';
  }
}
