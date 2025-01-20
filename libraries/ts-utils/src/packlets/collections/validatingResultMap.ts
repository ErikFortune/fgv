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
import { ResultMapResultDetail } from './readonlyResultMap';
import { ResultMap } from './resultMap';
import { KeyValueValidators } from './utils';

/**
 * Parameters for constructing a {@link Collections.ResultMap | ResultMap}.
 * @public
 */
export interface IValidatingResultMapConstructorParams<TK extends string = string, TV = unknown> {
  entries?: Iterable<KeyValueEntry<TK, TV>>;
  validators: KeyValueValidators<TK, TV>;
}

/**
 * A {@link Collections.ResultMap | ResultMap} which validates keys and values, which
 * enables it to expose additional methods for working with weakly-typed values.
 * @public
 */
export class ValidatingResultMap<TK extends string = string, TV = unknown> extends ResultMap<TK, TV> {
  protected _validators: KeyValueValidators<TK, TV>;

  /**
   * Constructs a new {@link Collections.ValidatingResultMap | ValidatingResultMap}.
   * @param params - Required parameters for constructing the map.
   */
  public constructor(params: IValidatingResultMapConstructorParams<TK, TV>) {
    if (params.entries) {
      params.validators.validateElements(params.entries).orThrow();
    }
    super(params);
    this._validators = params.validators;
  }

  /**
   * {@inheritdoc Collections.ResultMap.delete}
   */
  public delete(key: string): DetailedResult<TV, ResultMapResultDetail> {
    return this._validators.validateKey(key).onSuccess((k) => {
      return super.delete(k);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.get}
   */
  public get(key: string): DetailedResult<TV, ResultMapResultDetail> {
    return this._validators.validateKey(key).onSuccess((k) => {
      return super.get(k);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.getOrAdd}
   */
  public getOrAdd(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail> {
    return this._validators.validateEntry([key, value]).onSuccess(([vk, vv]) => {
      return super.getOrAdd(vk, vv);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.has}
   */
  public has(key: string): boolean {
    return this._inner.has(key as TK);
  }

  /**
   * {@inheritdoc Collections.ResultMap.set}
   */
  public set(key: string, value: unknown): DetailedResult<TV, ResultMapResultDetail> {
    return this._validators.validateEntry([key, value]).onSuccess(([vk, vv]) => {
      return super.set(vk, vv);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.setNew}
   */
  public setNew(key: string, value: unknown): DetailedResult<TV, ResultMapResultDetail> {
    return this._validators.validateEntry([key, value]).onSuccess(([vk, vv]) => {
      return super.setNew(vk, vv);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.update}
   */
  public update(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail> {
    return this._validators.validateEntry([key, value]).onSuccess(([vk, vv]) => {
      return super.update(vk, vv);
    });
  }
}
