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

import { captureResult, DetailedResult, Result } from '../base';
import { KeyValueEntry } from './common';
import { IReadOnlyResultMap, ResultMapResultDetail } from './readonlyResultMap';
import { ResultMap } from './resultMap';
import { IReadOnlyResultMapValidator, ResultMapValidator } from './resultMapValidator';
import { KeyValueValidators } from './utils';

/**
 * A read-only interface exposing non-mutating methods of a {@link Collections.ValidatingResultMap | ValidatingResultMap}.
 * @public
 */
export interface IReadOnlyValidatingResultMap<TK extends string = string, TV = unknown>
  extends IReadOnlyResultMap<TK, TV> {
  /**
   * {@inheritdoc Collections.ValidatingResultMap.validate}
   */
  readonly validate: IReadOnlyResultMapValidator<TK, TV>;
}

/**
 * Parameters for constructing a {@link Collections.ResultMap | ResultMap}.
 * @public
 */
export interface IValidatingResultMapConstructorParams<TK extends string = string, TV = unknown> {
  entries?: Iterable<KeyValueEntry<string, unknown>>;
  validators: KeyValueValidators<TK, TV>;
}

/**
 * A {@link Collections.ResultMap | ResultMap} with a {@link Collections.ResultMapValidator | validator}
 * property that enables validated use of the underlying map with weakly-typed keys and values.
 * @public
 */
export class ValidatingResultMap<TK extends string = string, TV = unknown>
  extends ResultMap<TK, TV>
  implements IReadOnlyValidatingResultMap<TK, TV>
{
  /**
   * A {@link Collections.ResultMapValidator | ResultMapValidator} which validates keys and values
   * before inserting them into this collection.
   */
  public readonly validate: ResultMapValidator<TK, TV>;

  /**
   * Constructs a new {@link Collections.ValidatingResultMap | ValidatingResultMap}.
   * @param params - Required parameters for constructing the map.
   */
  public constructor(params: IValidatingResultMapConstructorParams<TK, TV>) {
    const entries = params.validators.validateEntries([...(params.entries ?? [])]).orThrow();
    super({ entries });
    this.validate = new ResultMapValidator<TK, TV>({ map: this, validators: params.validators });
  }

  /**
   * Creates a new {@link Collections.ValidatingResultMap | ValidatingResultMap} instance.
   * @param params - Required parameters for constructing the map.
   * @returns `Success` with the new map if successful, `Failure` otherwise.
   * @public
   */
  public static createValidating<TK extends string = string, TV = unknown>(
    params: IValidatingResultMapConstructorParams<TK, TV>
  ): Result<ValidatingResultMap<TK, TV>> {
    return captureResult(() => new ValidatingResultMap(params));
  }

  /**
   * {@inheritdoc Collections.ResultMap.add}
   */
  public add(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail> {
    return this.validate.validators.validateEntry([key, value]).onSuccess((entry) => {
      return super.add(entry[0], entry[1]);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.getOrAdd}
   */
  public getOrAdd(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail> {
    return this.validate.validators.validateEntry([key, value]).onSuccess((entry) => {
      return super.getOrAdd(entry[0], entry[1]);
    });
  }

  /*
   * {@inheritdoc Collections.ResultMap.set}
   */
  public set(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail> {
    return this.validate.validators.validateEntry([key, value]).onSuccess((entry) => {
      return super.set(entry[0], entry[1]);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.update}
   */
  public update(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail> {
    return this.validate.validators.validateEntry([key, value]).onSuccess((entry) => {
      return super.update(entry[0], entry[1]);
    });
  }

  /**
   * Gets a read-only version of this map.
   */
  public toReadOnly(): IReadOnlyValidatingResultMap<TK, TV> {
    return this;
  }
}
