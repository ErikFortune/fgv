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
   * Returns the number of entries in the map.
   */
  readonly size: number;

  /**
   * Returns an iterator over the map entries.
   * @returns An iterator over the map entries.
   */
  entries(): IterableIterator<KeyValueEntry<TK, TV>>;

  /**
   * Calls a function for each entry in the map.
   * @param cb - The function to call for each entry.
   * @param arg - An optional argument to pass to the callback.
   */
  forEach(cb: ResultMapForEachCb, arg?: unknown): void;

  /**
   * Gets a value from the map.
   * @param key - The key to retrieve.
   * @returns `Success` with the value and detail `exists` if the key was found,
   * `Failure` with detail `not-found` if the key was not found or with detail
   * `invalid-key` if the key is invalid.
   */
  get(key: TK): DetailedResult<TV, ResultMapResultDetail>;

  /**
   * Returns `true` if the map contains a key.
   * @param key - The key to check.
   * @returns `true` if the key exists, `false` otherwise.
   */
  has(key: TK): boolean;

  /**
   * Returns an iterator over the map keys.
   * @returns An iterator over the map keys.
   */
  keys(): IterableIterator<TK>;

  /**
   * Returns an iterator over the map values.
   * @returns An iterator over the map values.
   */
  values(): IterableIterator<TV>;

  /**
   * Gets an iterator over the map entries.
   * @returns An iterator over the map entries.
   */
  [Symbol.iterator](): IterableIterator<KeyValueEntry<TK, TV>>;
}
