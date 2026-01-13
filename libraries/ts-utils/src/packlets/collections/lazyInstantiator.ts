/*
 * Copyright (c) 2026 Erik Fortune
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

import { DetailedResult, fail, failWithDetail, succeedWithDetail } from '../base';
import { KeyValueEntry } from './common';
import type {
  IReadOnlyLazyInstantiatorValidator,
  LazyInstantiatorFactory,
  LazyItemsResultMapView,
  MaterializingResultMapView
} from './classes';
import { KeyValueConverters } from './keyValueConverters';
import {
  IReadOnlyResultMap,
  ReadOnlyResultMap,
  ResultMapForEachCb,
  ResultMapResultDetail
} from './readonlyResultMap';
import { ResultMap } from './resultMap';
import { ReadOnlyResultMapValidator } from './resultMapValidator';

/**
 * Parameters for creating a {@link Collections.LazyInstantiator | LazyInstantiator}.
 * @public
 */
export interface ILazyInstantiatorCreateParams<
  TKey extends string = string,
  TBase = unknown,
  TValue = unknown
> {
  /**
   * The base map which defines keyspace and supplies base values.
   * @remarks This map is never materialized by this class.
   */
  base: IReadOnlyResultMap<TKey, TBase>;

  /**
   * Factory function which materializes a value from a base value and key.
   */
  factory: LazyInstantiatorFactory<TKey, TBase, TValue>;

  /**
   * Optional preloaded values.
   */
  loaded?: IterableIterator<KeyValueEntry<TKey, TValue>>;
}

/**
 * A lazily-materialized item backed by a base value.
 * @public
 */
export class LazyItem<TKey extends string = string, TBase = unknown, TValue = unknown> {
  public readonly key: TKey;
  public readonly base: TBase;

  private readonly _materialize: () => DetailedResult<TValue, ResultMapResultDetail>;
  private readonly _peekLoaded: () => DetailedResult<TValue, ResultMapResultDetail>;
  private readonly _isLoaded: () => boolean;

  /**
   * @internal
   */
  public constructor(params: {
    key: TKey;
    base: TBase;
    materialize: () => DetailedResult<TValue, ResultMapResultDetail>;
    peekLoaded: () => DetailedResult<TValue, ResultMapResultDetail>;
    isLoaded: () => boolean;
  }) {
    this.key = params.key;
    this.base = params.base;
    this._materialize = params.materialize;
    this._peekLoaded = params.peekLoaded;
    this._isLoaded = params.isLoaded;
  }

  /**
   * Returns `true` if the value for this key has been materialized and cached.
   */
  public isLoaded(): boolean {
    return this._isLoaded();
  }

  /**
   * Returns the currently materialized value, if any, without materializing.
   */
  public peekLoaded(): DetailedResult<TValue, ResultMapResultDetail> {
    const result = this._peekLoaded();
    return result;
  }

  /**
   * Materializes (and caches) the value for this item.
   */
  public materialize(): DetailedResult<TValue, ResultMapResultDetail> {
    return this._materialize();
  }
}

class LazyItemsResultMap<TKey extends string, TBase, TValue>
  implements IReadOnlyResultMap<TKey, LazyItem<TKey, TBase, TValue>>
{
  private readonly _instantiator: LazyInstantiator<TKey, TBase, TValue>;

  public constructor(instantiator: LazyInstantiator<TKey, TBase, TValue>) {
    this._instantiator = instantiator;
  }

  public get size(): number {
    return this._instantiator.base.size;
  }

  public entries(): IterableIterator<KeyValueEntry<TKey, LazyItem<TKey, TBase, TValue>>> {
    return this[Symbol.iterator]();
  }

  public forEach(cb: ResultMapForEachCb, arg?: unknown): void {
    for (const [key, item] of this) {
      cb(item, key, this, arg);
    }
  }

  public get(key: TKey): DetailedResult<LazyItem<TKey, TBase, TValue>, ResultMapResultDetail> {
    const baseResult = this._instantiator.base.get(key);
    if (!baseResult.success) {
      return failWithDetail(baseResult.message, baseResult.detail);
    }

    return succeedWithDetail(this._instantiator._makeItem(key, baseResult.value), baseResult.detail);
  }

  public has(key: TKey): boolean {
    return this._instantiator.base.has(key);
  }

  public keys(): IterableIterator<TKey> {
    return this._instantiator.base.keys();
  }

  public values(): IterableIterator<LazyItem<TKey, TBase, TValue>> {
    const iter = this._instantiator.base.entries();
    const self = this;
    return (function* () {
      for (const [key, base] of iter) {
        yield self._instantiator._makeItem(key, base);
      }
    })();
  }

  public [Symbol.iterator](): IterableIterator<KeyValueEntry<TKey, LazyItem<TKey, TBase, TValue>>> {
    const iter = this._instantiator.base.entries();
    const self = this;
    return (function* () {
      for (const [key, base] of iter) {
        yield [key, self._instantiator._makeItem(key, base)];
      }
    })();
  }
}

class MaterializingLoadedResultMap<TKey extends string, TBase, TValue>
  implements IReadOnlyResultMap<TKey, TValue>
{
  private readonly _instantiator: LazyInstantiator<TKey, TBase, TValue>;
  public constructor(instantiator: LazyInstantiator<TKey, TBase, TValue>) {
    this._instantiator = instantiator;
  }

  public get size(): number {
    return this._instantiator.base.size;
  }

  public entries(): IterableIterator<KeyValueEntry<TKey, TValue>> {
    const baseIter = this._instantiator.base.entries();
    const self = this;
    return (function* () {
      for (const [key, base] of baseIter) {
        const result = self._instantiator.materialize(key, base);
        if (result.success) {
          yield [key, result.value];
        }
      }
    })();
  }

  public forEach(cb: ResultMapForEachCb, arg?: unknown): void {
    for (const [key, value] of this) {
      cb(value, key, this, arg);
    }
  }

  public get(key: TKey): DetailedResult<TValue, ResultMapResultDetail> {
    return this._instantiator.materialize(key);
  }

  public has(key: TKey): boolean {
    return this._instantiator.base.has(key);
  }

  public keys(): IterableIterator<TKey> {
    return this._instantiator.base.keys();
  }

  public values(): IterableIterator<TValue> {
    const iter = this.entries();
    return (function* () {
      for (const entry of iter) {
        yield entry[1];
      }
    })();
  }

  public [Symbol.iterator](): IterableIterator<KeyValueEntry<TKey, TValue>> {
    return this.entries();
  }
}

/**
 * A helper which supports lazy materialization of values based on a base map.
 *
 * @remarks
 * - `base` defines keyspace and provides base values.
 * - `loaded` contains only materialized values.
 * - `items` provides {@link Collections.LazyItem | LazyItem} views for base keys.
 *
 * Neither `base` nor `items` will materialize values.
 * @public
 */
export class LazyInstantiator<TKey extends string = string, TBase = unknown, TValue = unknown> {
  public readonly base: IReadOnlyResultMap<TKey, TBase>;
  public readonly loaded: IReadOnlyResultMap<TKey, TValue>;
  /**
   * A convenience view where `get()` materializes values and caches them into {@link Collections.LazyInstantiator.loaded | loaded}.
   *
   * @remarks
   * - `has()`/`keys()` reflect the full keyspace in {@link Collections.LazyInstantiator.base | base} and do not materialize.
   * - `get()`/iteration methods materialize values as needed and cache them into {@link Collections.LazyInstantiator.loaded | loaded}.
   */
  public readonly materializing: MaterializingResultMapView<TKey, TValue>;
  public readonly items: LazyItemsResultMapView<TKey, TBase, TValue>;

  private readonly _factory: LazyInstantiatorFactory<TKey, TBase, TValue>;
  private readonly _loaded: ResultMap<TKey, TValue>;

  public constructor(params: ILazyInstantiatorCreateParams<TKey, TBase, TValue>) {
    this.base = params.base;
    this._factory = params.factory;
    this._loaded = new ResultMap<TKey, TValue>(params.loaded);
    this.loaded = new ReadOnlyResultMap<TKey, TValue>(this._loaded);
    this.materializing = new MaterializingLoadedResultMap<TKey, TBase, TValue>(this);
    this.items = new LazyItemsResultMap<TKey, TBase, TValue>(this);
  }

  /**
   * Materializes a value for the given key if needed.
   */
  public materialize(key: TKey): DetailedResult<TValue, ResultMapResultDetail>;
  /**
   * Materializes a value for the given key using an already-resolved base value.
   * @internal
   */
  public materialize(key: TKey, base: TBase): DetailedResult<TValue, ResultMapResultDetail>;
  public materialize(key: TKey, base?: TBase): DetailedResult<TValue, ResultMapResultDetail> {
    const existing = this._loaded.get(key);
    if (existing.success) {
      return existing;
    }

    const baseResult = base !== undefined ? succeedWithDetail(base, 'exists') : this.base.get(key);
    if (!baseResult.success) {
      return failWithDetail(baseResult.message, baseResult.detail);
    }

    const created = this._factory(baseResult.value, key);
    if (!created.success) {
      return failWithDetail(created.message, 'failure');
    }

    this._loaded.set(key, created.value);
    return succeedWithDetail(created.value, 'added');
  }

  /**
   * @internal
   */
  public _makeItem(key: TKey, base: TBase): LazyItem<TKey, TBase, TValue> {
    return new LazyItem<TKey, TBase, TValue>({
      key,
      base,
      materialize: () => this.materialize(key, base),
      peekLoaded: () => this._loaded.get(key),
      isLoaded: () => this._loaded.has(key)
    });
  }
}

/**
 * Parameters for creating a {@link Collections.ValidatingLazyInstantiator | ValidatingLazyInstantiator}.
 * @public
 */
export interface IValidatingLazyInstantiatorCreateParams<
  TKey extends string = string,
  TBase = unknown,
  TValue = unknown
> extends ILazyInstantiatorCreateParams<TKey, TBase, TValue> {
  baseConverters: KeyValueConverters<TKey, TBase>;
  loadedConverters: KeyValueConverters<TKey, TValue>;
}

/**
 * Validators for {@link Collections.ValidatingLazyInstantiator | ValidatingLazyInstantiator} views.
 * @public
 */
/**
 * A {@link Collections.LazyInstantiator | LazyInstantiator} with validating views.
 * @public
 */
export class ValidatingLazyInstantiator<
  TKey extends string = string,
  TBase = unknown,
  TValue = unknown
> extends LazyInstantiator<TKey, TBase, TValue> {
  public readonly validating: IReadOnlyLazyInstantiatorValidator<TKey, TBase, TValue>;

  public constructor(params: IValidatingLazyInstantiatorCreateParams<TKey, TBase, TValue>) {
    super(params);

    const itemsConverters = new KeyValueConverters<TKey, LazyItem<TKey, TBase, TValue>>({
      key: params.baseConverters.key,
      value: (_from: unknown) => fail('LazyItem values cannot be converted from unknown')
    });

    this.validating = {
      base: new ReadOnlyResultMapValidator<TKey, TBase>({
        map: this.base,
        converters: params.baseConverters
      }),
      loaded: new ReadOnlyResultMapValidator<TKey, TValue>({
        map: this.loaded,
        converters: params.loadedConverters
      }),
      materializing: new ReadOnlyResultMapValidator<TKey, TValue>({
        map: this.materializing,
        converters: params.loadedConverters
      }),
      items: new ReadOnlyResultMapValidator<TKey, LazyItem<TKey, TBase, TValue>>({
        map: this.items,
        converters: itemsConverters
      })
    };
  }
}
