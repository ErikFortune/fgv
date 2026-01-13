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

import { Result } from '../base';
import { IReadOnlyResultMap } from './readonlyResultMap';
import { IReadOnlyResultMapValidator } from './resultMapValidator';
import type { LazyItem } from './lazyInstantiator';

/**
 * A factory which can create a value from a base value and key.
 * @public
 */
export type LazyInstantiatorFactory<TKey extends string, TBase, TValue> = (
  base: TBase,
  key: TKey
) => Result<TValue>;

/**
 * A read-only result map view that exposes {@link Collections.LazyItem | LazyItem} values.
 * @public
 */
export type LazyItemsResultMapView<
  TKey extends string = string,
  TBase = unknown,
  TValue = unknown
> = IReadOnlyResultMap<TKey, LazyItem<TKey, TBase, TValue>>;

/**
 * A read-only result map view where `get()` materializes values and caches them.
 * @public
 */
export type MaterializingResultMapView<TKey extends string = string, TValue = unknown> = IReadOnlyResultMap<
  TKey,
  TValue
>;

/**
 * Validators for {@link Collections.ValidatingLazyInstantiator | ValidatingLazyInstantiator} views.
 * @public
 */
export interface IReadOnlyLazyInstantiatorValidator<
  TKey extends string = string,
  TBase = unknown,
  TValue = unknown
> {
  readonly base: IReadOnlyResultMapValidator<TKey, TBase>;
  readonly loaded: IReadOnlyResultMapValidator<TKey, TValue>;
  readonly materializing: IReadOnlyResultMapValidator<TKey, TValue>;
  readonly items: IReadOnlyResultMapValidator<TKey, LazyItem<TKey, TBase, TValue>>;
}
