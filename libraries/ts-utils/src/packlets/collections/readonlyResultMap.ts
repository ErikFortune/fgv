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

import { DetailedResult } from '../base';
import { KeyValueEntry } from './common';

/**
 * Additional success or failure details for {@link Collections.ResultMap | ResultMap} calls.
 * @public
 */
export type ResultMapResultDetail =
  | 'added'
  | 'deleted'
  | 'exists'
  | 'failure'
  | 'invalid-key'
  | 'invalid-value'
  | 'not-found'
  | 'success'
  | 'updated';

/**
 * Callback for {@link Collections.ResultMap | ResultMap} `forEach` method.
 * @public
 */
export type ResultMapForEachCb<TK extends string = string, TE = unknown> = (
  value: TE,
  key: TK,
  map: IReadOnlyResultMap<TK, TE>,
  thisArg?: unknown
) => void;

/**
 * A readonly `ReadonlyMap<TK, TV>`-like object which reports success or failure
 * with additional details using the
 * {@link https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils#the-result-pattern | result pattern}.
 * @public
 */
export interface IReadOnlyResultMap<TK extends string = string, TV = unknown> {
  /**
   * {@inheritdoc Collections.ResultMap.size}
   */
  readonly size: number;

  /**
   * {@inheritdoc Collections.ResultMap.entries}
   */
  entries(): IterableIterator<KeyValueEntry<TK, TV>>;

  /**
   * {@inheritdoc Collections.ResultMap.forEach}
   */
  forEach(cb: ResultMapForEachCb, arg?: unknown): void;

  /**
   * {@inheritdoc Collections.ResultMap.get}
   */
  get(key: TK): DetailedResult<TV, ResultMapResultDetail>;

  /**
   * {@inheritdoc Collections.ResultMap.has}
   */
  has(key: TK): boolean;

  /**
   * {@inheritdoc Collections.ResultMap.keys}
   */
  keys(): IterableIterator<TK>;

  /**
   * {@inheritdoc Collections.ResultMap.values}
   */
  values(): IterableIterator<TV>;

  /**
   * Gets an iterator over the map entries.
   * @returns An iterator over the map entries.
   */
  [Symbol.iterator](): IterableIterator<KeyValueEntry<TK, TV>>;
}
