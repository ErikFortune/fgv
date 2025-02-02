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
import { ICollectible } from './collectible';
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
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>
> extends IReadOnlyResultMap<TKEY, TITEM> {
  /**
   * Gets the item at a specified index.
   * @param index - The index of the item to retrieve.
   * @returns Returns {@link Success | Success} with the item if it exists, or {@link Failure | Failure}
   * with an error if the index is out of range.
   */
  getAt(index: number): Result<TITEM>;
}

/**
 * Parameters for constructing a {@link Collections.Collector | ICollector}.
 * @public
 */
export interface ICollectorCreateParams<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>
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
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>
> implements IReadOnlyCollector<TKEY, TINDEX, TITEM>
{
  private readonly _byKey: Map<TKEY, TITEM>;
  private readonly _byIndex: TITEM[];

  /**
   * {@inheritdoc Collections.ResultMap.inner}
   */
  public get inner(): ReadonlyMap<TKEY, TITEM> {
    return this._byKey;
  }

  /**
   * {@inheritdoc Collections.ResultMap.size}
   */
  public get size(): number {
    return this._byIndex.length;
  }

  /**
   * Constructs a new {@link Collections.Collector | Collector}.
   * @param params - Optional {@link Collections.ICollectorCreateParams | initialization parameters} used
   * to construct the collector.
   */
  public constructor(params?: ICollectorCreateParams<TKEY, TINDEX, TITEM>) {
    this._byKey = new Map<TKEY, TITEM>();
    this._byIndex = [];
    for (const item of params?.items ?? []) {
      this.add(item).orThrow();
    }
  }

  /**
   * Creates a new {@link Collections.Collector | Collector} instance.
   * @param params - Optional {@link Collections.ICollectorCreateParams | initialization parameters} used
   * to create the collector.
   * @returns Returns {@link Success | Success} with the new collector if it was created successfully,
   * or {@link Failure | Failure} with an error if the collector could not be created.
   */
  public static createCollector<
    TKEY extends string = string,
    TINDEX extends number = number,
    TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>
  >(params?: ICollectorCreateParams<TKEY, TINDEX, TITEM>): Result<Collector<TKEY, TINDEX, TITEM>> {
    return captureResult(() => new Collector(params));
  }

  /**
   * Adds an item to the collection, failing if an item with that key already exists.
   * @param item - The item to add.
   * @returns Returns {@link Success | Success} with the item if it was added successfully, or
   * {@link Failure | Failure} with an error if the item could not be added.
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
    }
    this._byKey.set(item.key, item);
    this._byIndex.push(item);
    return succeedWithDetail(item, 'added');
  }

  /**
   * {@inheritdoc Collections.IReadOnlyResultMap.entries}
   */
  public entries(): MapIterator<KeyValueEntry<TKEY, TITEM>> {
    return this._byKey.entries();
  }

  /**
   * {@inheritdoc Collections.IReadOnlyResultMap.forEach}
   */
  public forEach(callback: ResultMapForEachCb<TKEY, TITEM>, arg?: unknown): void {
    for (const [key, value] of this._byKey.entries()) {
      callback(value, key, this, arg);
    }
  }

  /**
   * {@inheritdoc Collections.IReadOnlyResultMap.get}
   */
  public get(key: TKEY): DetailedResult<TITEM, ResultMapResultDetail> {
    const item = this._byKey.get(key);
    return item ? succeedWithDetail(item, 'exists') : failWithDetail(`${key}: not found`, 'not-found');
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
   * Gets an existing item with a key matching that of a supplied item, or adds the supplied
   * item to the collector if no item with that key exists.
   * @param item - The item to retrieve or add.
   * @returns Returns {@link Success | Success} with the item stored in the collector
   * or {@link Failure | Failure} with an error if the item cannot be created and indexed.
   */
  public getOrAdd(item: TITEM): DetailedResult<TITEM, CollectorResultDetail> {
    const existing = this._byKey.get(item.key);
    if (existing) {
      return succeedWithDetail(existing, 'exists');
    }
    return this.add(item);
  }

  /**
   * {@inheritdoc IReadOnlyResultMap.has}
   */
  public has(key: TKEY): boolean {
    return this._byKey.has(key);
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
   * {@inheritdoc IConvertingCollector.toReadOnly}
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
}
