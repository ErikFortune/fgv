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

import { captureResult, DetailedResult, failWithDetail, Result, succeed } from '../base';
import { KeyValueEntry } from './common';
import { IReadOnlyResultMap, ResultMapResultDetail } from './readonlyResultMap';
import { ResultMap, ResultMapValueFactory } from './resultMap';
import { IReadOnlyResultMapConverter, ResultMapConverter } from './resultMapConverter';
import { KeyValueConverters } from './keyValueConverters';

/**
 * A read-only interface exposing non-mutating methods of a {@link Collections.ConvertingResultMap | ConvertingResultMap}.
 * @public
 */
export interface IReadOnlyConvertingResultMap<TK extends string = string, TV = unknown>
  extends IReadOnlyResultMap<TK, TV> {
  /**
   * {@inheritdoc Collections.ConvertingResultMap.converting}
   */
  readonly converting: IReadOnlyResultMapConverter<TK, TV>;
}

/**
 * Parameters for constructing a {@link Collections.ResultMap | ResultMap}.
 * @public
 */
export interface IConvertingResultMapConstructorParams<TK extends string = string, TV = unknown> {
  entries?: Iterable<KeyValueEntry<string, unknown>>;
  converters: KeyValueConverters<TK, TV>;
}

/**
 * A {@link Collections.ResultMap | ResultMap} with a {@link Collections.ResultMapConverter | validator}
 * property that enables validated use of the underlying map with weakly-typed keys and values.
 * @public
 */
export class ConvertingResultMap<TK extends string = string, TV = unknown>
  extends ResultMap<TK, TV>
  implements IReadOnlyConvertingResultMap<TK, TV>
{
  /**
   * A {@link Collections.ResultMapConverter | ResultMapConverter} which validates keys and values
   * before inserting them into this collection.
   */
  public readonly converting: ResultMapConverter<TK, TV>;

  /**
   * Constructs a new {@link Collections.ConvertingResultMap | ConvertingResultMap}.
   * @param params - Required parameters for constructing the map.
   */
  public constructor(params: IConvertingResultMapConstructorParams<TK, TV>) {
    const entries = params.converters.convertEntries([...(params.entries ?? [])]).orThrow();
    super({ entries });
    this.converting = new ResultMapConverter<TK, TV>({ map: this, converters: params.converters });
  }

  /**
   * Creates a new {@link Collections.ConvertingResultMap | ConvertingResultMap} instance.
   * @param params - Required parameters for constructing the map.
   * @returns `Success` with the new map if successful, `Failure` otherwise.
   * @public
   */
  public static createConvertingResultMap<TK extends string = string, TV = unknown>(
    params: IConvertingResultMapConstructorParams<TK, TV>
  ): Result<ConvertingResultMap<TK, TV>> {
    return captureResult(() => new ConvertingResultMap(params));
  }

  /**
   * {@inheritdoc Collections.ResultMap.add}
   */
  public add(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail> {
    return this.converting.converters.convertEntry([key, value]).onSuccess((entry) => {
      return super.add(entry[0], entry[1]);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.(getOrAdd:1)}
   */
  public getOrAdd(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail>;
  /**
   * {@inheritdoc Collections.ResultMap.(getOrAdd:2)}
   */
  public getOrAdd(key: TK, factory: ResultMapValueFactory<TK, TV>): DetailedResult<TV, ResultMapResultDetail>;
  public getOrAdd(
    key: TK,
    valueOrFactory: TV | ResultMapValueFactory<TK, TV>
  ): DetailedResult<TV, ResultMapResultDetail> {
    if (!this._isResultMapValueFactory(valueOrFactory)) {
      return this.converting.converters.convertEntry([key, valueOrFactory]).onSuccess((entry) => {
        return super.getOrAdd(entry[0], entry[1]);
      });
    } else {
      return super.get(key).onFailure(() => {
        const value = valueOrFactory(key)
          .onSuccess((value) => this.converting.converters.convertEntry([key, value]))
          .onSuccess(([__key, value]) => succeed(value));
        return value.success
          ? super.add(key, value.value)
          : failWithDetail<TV, ResultMapResultDetail>(value.message, 'invalid-value');
      });
    }
  }

  /**
   * {@inheritdoc Collections.ResultMap.set}
   */
  public set(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail> {
    return this.converting.converters.convertEntry([key, value]).onSuccess((entry) => {
      return super.set(entry[0], entry[1]);
    });
  }

  /**
   * {@inheritdoc Collections.ResultMap.update}
   */
  public update(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail> {
    return this.converting.converters.convertEntry([key, value]).onSuccess((entry) => {
      return super.update(entry[0], entry[1]);
    });
  }

  /**
   * Gets a read-only version of this map.
   */
  public toReadOnly(): IReadOnlyConvertingResultMap<TK, TV> {
    return this;
  }
}
