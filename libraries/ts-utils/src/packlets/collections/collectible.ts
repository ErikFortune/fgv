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

import { Result, captureResult, fail, succeed } from '../base';
import { Converter, ConverterFunc, Converters } from '../conversion';
import { Validator } from '../validation';

/**
 * An item that can be collected by some {@link ConvertingCollector | Collector}.
 * @public
 */
export interface ICollectible<TKEY extends string = string, TINDEX extends number = number> {
  readonly key: TKEY;
  readonly index: TINDEX | undefined;
  setIndex(index: number): Result<TINDEX>;
}

/**
 * Infer the key type from an {@link Collections.ICollectible | ICollectible} type.
 * @public
 */
export type CollectibleKey<TITEM extends ICollectible> = TITEM extends ICollectible<infer TKEY>
  ? TKEY
  : never;

/**
 * Infer the index type from an {@link Collections.ICollectible | ICollectible} type.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CollectibleIndex<TITEM extends ICollectible> = TITEM extends ICollectible<any, infer TINDEX>
  ? TINDEX
  : never;

/**
 * Factory function for creating a new {@link Collections.ICollectible | ICollectible} instance given a key, an index and a source representation
 * of the item to be added.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CollectibleFactory<TITEM extends ICollectible<any, any>, TSRC> = (
  key: CollectibleKey<TITEM>,
  index: number,
  item: TSRC
) => Result<TITEM>;

/**
 * Factory function for creating a new {@link Collections.ICollectible | ICollectible} instance given a key and an index.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CollectibleFactoryCallback<TITEM extends ICollectible<any, any>> = (
  key: CollectibleKey<TITEM>,
  index: number
) => Result<TITEM>;

/**
 * Parameters for constructing a new {@link Collections.ICollectible | ICollectible} instance with
 * a defined, strongly-typed index.
 * @public
 */
export interface ICollectibleConstructorParamsWithIndex<
  TKEY extends string = string,
  TINDEX extends number = number
> {
  key: TKEY;
  index: TINDEX;
}

/**
 * Parameters for constructing a new {@link Collections.ICollectible | ICollectible} instance with an
 * index converter.
 * @public
 */
export interface ICollectibleConstructorParamsWithConverter<
  TKEY extends string = string,
  TINDEX extends number = number
> {
  key: TKEY;
  index?: number;
  indexConverter: Validator<TINDEX, unknown> | Converter<TINDEX, unknown> | ConverterFunc<TINDEX, undefined>;
}

/**
 * Parameters for constructing a new {@link Collections.ICollectible | ICollectible} instance.
 * @public
 */
export type ICollectibleConstructorParams<TKEY extends string = string, TINDEX extends number = number> =
  | ICollectibleConstructorParamsWithIndex<TKEY, TINDEX>
  | ICollectibleConstructorParamsWithConverter<TKEY, TINDEX>;

/**
 * Simple implementation of {@link Collections.ICollectible | ICollectible} which does not allow the index to be
 * changed once set.
 * @public
 */
export class Collectible<TKEY extends string = string, TINDEX extends number = number>
  implements ICollectible<TKEY, TINDEX>
{
  /**
   * {@link Collections.ICollectible.key}
   */
  public readonly key: TKEY;

  /**
   * {@link Collections.ICollectible.index}
   */
  public get index(): TINDEX | undefined {
    return this._index;
  }

  protected _index: TINDEX | undefined;
  protected readonly _indexConverter?: Validator<TINDEX, unknown> | Converter<TINDEX, unknown>;

  /**
   * Constructs a new {@link Collections.Collectible | Collectible} instance
   * with a defined, strongly-typed index.
   * @param params - {@link Collections.ICollectibleConstructorParamsWithIndex | Parameters} for constructing
   * the collectible.
   */
  public constructor(params: ICollectibleConstructorParamsWithIndex<TKEY, TINDEX>);

  /**
   * Constructs a new {@link Collections.Collectible | Collectible} instance with
   * an undefined index and an index converter to validate te index when it is set.
   * @param params - {@link Collections.ICollectibleConstructorParamsWithConverter | Parameters} for constructing
   * the collectible.
   */
  public constructor(params: ICollectibleConstructorParamsWithConverter<TKEY, TINDEX>);

  /**
   * Constructs a new {@link Collections.Collectible | Collectible} instance.
   * @param params - {@link Collections.ICollectibleConstructorParams | Parameters} for constructing
   * the collectible.
   */
  public constructor(params: ICollectibleConstructorParams<TKEY, TINDEX>);
  public constructor(params: ICollectibleConstructorParams<TKEY, TINDEX>) {
    this.key = params.key;
    if ('indexConverter' in params) {
      this._indexConverter =
        typeof params.indexConverter === 'function'
          ? Converters.generic(params.indexConverter)
          : params.indexConverter;
      if (params.index !== undefined) {
        this._index = this._indexConverter.convert(params.index).orThrow();
      }
    } else {
      this._index = params.index;
    }
  }

  /**
   * Creates a new {@link Collections.Collectible | Collectible} instance with a defined, strongly-typed index.
   * @param params - {@link Collections.ICollectibleConstructorParamsWithIndex | Parameters} for constructing
   * the collectible.
   * @returns {@link Success} with the new collectible if successful, {@link Failure} otherwise.
   */
  public static createCollectible<TKEY extends string = string, TINDEX extends number = number>(
    params: ICollectibleConstructorParamsWithIndex<TKEY, TINDEX>
  ): Result<Collectible<TKEY, TINDEX>>;

  /**
   * Creates a new {@link Collections.Collectible | Collectible} instance with an undefined index and an index
   * converter to validate the index when it is set.
   * @param params - {@link Collections.ICollectibleConstructorParamsWithConverter | Parameters} for constructing
   * the collectible.
   * @returns {@link Success} with the new collectible if successful, {@link Failure} otherwise.
   */
  public static createCollectible<TKEY extends string = string, TINDEX extends number = number>(
    params: ICollectibleConstructorParamsWithConverter<TKEY, TINDEX>
  ): Result<Collectible<TKEY, TINDEX>>;

  /**
   * Creates a new {@link Collections.Collectible | Collectible} instance.
   * @param params - {@link Collections.ICollectibleConstructorParams | Parameters} for constructing
   * the collectible.
   * @returns {@link Success} with the new collectible if successful, {@link Failure} otherwise
   * @public
   */
  public static createCollectible<TKEY extends string = string, TINDEX extends number = number>(
    params: ICollectibleConstructorParams<TKEY, TINDEX>
  ): Result<Collectible<TKEY, TINDEX>>;

  public static createCollectible<TKEY extends string = string, TINDEX extends number = number>(
    params: ICollectibleConstructorParams<TKEY, TINDEX>
  ): Result<Collectible<TKEY, TINDEX>> {
    return captureResult(() => new Collectible(params));
  }

  /**
   * {@link Collections.ICollectible.setIndex}
   */
  public setIndex(index: number): Result<TINDEX> {
    let converted: TINDEX | undefined;
    if (this._indexConverter) {
      const { value, message } = this._indexConverter.convert(index);
      if (message) {
        return fail(message);
      }
      converted = value;
    }

    if (index === this.index) {
      return succeed(this.index);
    } else if (this._index !== undefined) {
      return fail(`index ${this.index} is immutable and cannot be changed to ${index}`);
    }

    /* c8 ignore next 3 - should be impossible */
    if (converted === undefined) {
      return fail(`index ${index} cannot be set on a Collectible without an index converter`);
    }

    this._index = converted;
    return succeed(converted);
  }
}
