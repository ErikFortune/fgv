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

import { Result, fail, succeed } from '../base';

/**
 * An item that can be collected by some {@link Collector | Collector}.
 * @public
 */
export interface ICollectible<TKEY extends string = string, TINDEX extends number = number> {
  readonly key: TKEY;
  readonly index: TINDEX | undefined;
  setIndex(index: TINDEX): Result<TINDEX>;
}

/**
 * Factory function for creating a new {@link Collections.ICollectible | ICollectible} instance given a key, an index and a source representation
 * of the item to be added.
 * @public
 */
export type CollectibleFactory<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>,
  TSRC = TITEM
> = (key: TKEY, index: number, item: TSRC) => Result<TITEM>;

/**
 * Factory function for creating a new {@link Collections.ICollectible | ICollectible} instance given a key and an index.
 * @public
 */
export type CollectibleFactoryCallback<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>
> = (key: TKEY, index: number) => Result<TITEM>;

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

  /**
   * Constructs a new {@link Collections.Collectible | Collectible} instance.
   * @param key - The key of the item to be collected.
   * @param index - Optional index of the item to be collected.
   */
  public constructor(key: TKEY, index?: TINDEX) {
    this.key = key;
    this._index = index;
  }

  /**
   * {@link Collections.ICollectible.setIndex}
   */
  public setIndex(index: TINDEX): Result<TINDEX> {
    if (this._index !== undefined && index !== this.index) {
      return fail(`index ${this.index} is immutable and cannot be changed to ${index}`);
    }
    this._index = index;
    return succeed(this._index);
  }
}
