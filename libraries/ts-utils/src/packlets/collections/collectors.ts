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

import { Result, captureResult } from '../base';
import { ICollectible } from './collectible';
import { ConvertingCollector } from './collector';

/**
 * Parameters for creating a {@link SimpleCollector | simple collector}.
 * @public
 */
export interface ISimpleCollectorCreateParams<TITEM extends ICollectible<string, number>> {
  items?: TITEM[];
}

/**
 * A simple {@link ConvertingCollector | collector} that collects {@link Collections.ICollectible | ICollectible items}
 * with non-branded `string` key and `number` index, and with no transformation other than index assignment
 * on addition.
 * @public
 */
export class SimpleCollector<TITEM extends ICollectible<string, number>> extends ConvertingCollector<
  string,
  number,
  TITEM,
  TITEM
> {
  /**
   * Constructs a new {@link SimpleCollector | simple collector}.
   * @param params - {@link Collections.ISimpleCollectorCreateParams | Creation parameters} for the collector.
   */
  public constructor(params?: ISimpleCollectorCreateParams<TITEM>) {
    const entries = params?.items?.map((item): [string, TITEM] => [item.key, item]);
    super({ factory: ConvertingCollector._simpleFactory, entries });
  }

  /**
   * Creates a new {@link SimpleCollector | simple collector}.
   * @param params - {@link Collections.ISimpleCollectorCreateParams | Creation parameters} for the collector.
   * @returns {@link Success | Success} if the collector is created successfully, or {@link Failure | Failure} if not.
   * @public
   */
  public static createSimpleCollector<TITEM extends ICollectible<string, number>>(
    params?: ISimpleCollectorCreateParams<TITEM>
  ): Result<SimpleCollector<TITEM>> {
    return captureResult(() => new SimpleCollector(params));
  }
}
