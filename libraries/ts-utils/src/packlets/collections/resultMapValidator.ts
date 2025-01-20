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
import { ResultMapResultDetail } from './readonlyResultMap';
import { ResultMap } from './resultMap';
import { KeyValueValidators } from './utils';

/**
 * Parameters for constructing a {@link Collections.ResultMap | ResultMap}.
 * @public
 */
export interface IResultMapValidatorCreateParams<TK extends string = string, TV = unknown> {
  map: ResultMap<TK, TV>;
  validators: KeyValueValidators<TK, TV>;
}

/**
 * A {@link Collections.ResultMap | ResultMap} wrapper which validates weakly-typed keys
 * before calling the wrapped result map.
 * @public
 */
export class ResultMapValidator<TK extends string = string, TV = unknown> {
  public readonly map: ResultMap<TK, TV>;
  public readonly validators: KeyValueValidators<TK, TV>;

  /**
   * Constructs a new {@link Collections.ValidatingResultMap | ValidatingResultMap}.
   * @param params - Required parameters for constructing the map.
   */
  public constructor(params: IResultMapValidatorCreateParams<TK, TV>) {
    this.map = params.map;
    this.validators = params.validators;
  }

  /**
   * {@inheritdoc Collections.ResultMap.add}
   */
  public add(key: string, value: unknown): DetailedResult<TV, ResultMapResultDetail> {
    return this.validators.validateEntry([key, value]).onSuccess(([vk, vv]) => {
      return this.map.add(vk, vv);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.delete}
   */
  public delete(key: string): DetailedResult<TV, ResultMapResultDetail> {
    return this.validators.validateKey(key).onSuccess((k) => {
      return this.map.delete(k);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.get}
   */
  public get(key: string): DetailedResult<TV, ResultMapResultDetail> {
    return this.validators.validateKey(key).onSuccess((k) => {
      return this.map.get(k);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.getOrAdd}
   */
  public getOrAdd(key: string, value: unknown): DetailedResult<TV, ResultMapResultDetail> {
    return this.validators.validateEntry([key, value]).onSuccess(([vk, vv]) => {
      return this.map.getOrAdd(vk, vv);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.has}
   */
  public has(key: string): boolean {
    return this.map.has(key as TK);
  }

  /**
   * {@inheritdoc Collections.ResultMap.set}
   */
  public set(key: string, value: unknown): DetailedResult<TV, ResultMapResultDetail> {
    return this.validators.validateEntry([key, value]).onSuccess(([vk, vv]) => {
      return this.map.set(vk, vv);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.update}
   */
  public update(key: string, value: unknown): DetailedResult<TV, ResultMapResultDetail> {
    return this.validators.validateEntry([key, value]).onSuccess(([vk, vv]) => {
      return this.map.update(vk, vv);
    });
  }
}
