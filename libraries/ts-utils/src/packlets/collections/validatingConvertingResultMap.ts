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

import { captureResult, Result } from '../base';
import { KeyValueConverters } from './keyValueConverters';
import { IReadOnlyResultMap } from './readonlyResultMap';
import {
  ReadOnlyConvertingResultMap,
  ConvertingResultMapValueConverter
} from './readOnlyConvertingResultMap';
import { ConvertingResultMap } from './convertingResultMap';
import { IResultMap } from './resultMap';
import { ReadOnlyResultMapValidator } from './resultMapValidator';

/**
 * @deprecated Use {@link Collections.ReadOnlyResultMapValidator | ReadOnlyResultMapValidator} instead.
 * This is a type alias for backwards compatibility.
 * @public
 */
export type ReadOnlyConvertingResultMapValidator<
  TK extends string,
  _TSRC,
  TTARGET
> = ReadOnlyResultMapValidator<TK, TTARGET>;

/**
 * Parameters for constructing a
 * {@link Collections.ValidatingReadOnlyConvertingResultMap | ValidatingReadOnlyConvertingResultMap}.
 * @public
 */
export interface IValidatingReadOnlyConvertingResultMapConstructorParams<TK extends string, TSRC, TTARGET> {
  /**
   * The inner map containing source values.
   */
  inner: IReadOnlyResultMap<TK, TSRC>;

  /**
   * The converter function to transform source values to target values.
   */
  converter: ConvertingResultMapValueConverter<TK, TSRC, TTARGET>;

  /**
   * The key-value converters for validating weakly-typed access.
   */
  converters: KeyValueConverters<TK, TTARGET>;
}

/**
 * A read-only result map that wraps an inner {@link Collections.IReadOnlyResultMap | IReadOnlyResultMap}
 * of source type and returns lazily-converted, cached values of a target type, with a
 * {@link Collections.ReadOnlyConvertingResultMapValidator | validating} property for weakly-typed access.
 * @public
 */
export class ValidatingReadOnlyConvertingResultMap<
  TK extends string,
  TSRC,
  TTARGET
> extends ReadOnlyConvertingResultMap<TK, TSRC, TTARGET> {
  /**
   * A validator for weakly-typed access to the map.
   */
  public readonly validating: ReadOnlyResultMapValidator<TK, TTARGET>;

  /**
   * The key-value converters used for validation.
   */
  protected readonly _converters: KeyValueConverters<TK, TTARGET>;

  /**
   * Constructs a new {@link Collections.ValidatingReadOnlyConvertingResultMap | ValidatingReadOnlyConvertingResultMap}.
   * @param params - Parameters for constructing the map.
   */
  public constructor(params: IValidatingReadOnlyConvertingResultMapConstructorParams<TK, TSRC, TTARGET>) {
    super({ inner: params.inner, converter: params.converter });
    this._converters = params.converters;
    this.validating = new ReadOnlyResultMapValidator(this, params.converters);
  }

  /**
   * Creates a new {@link Collections.ValidatingReadOnlyConvertingResultMap | ValidatingReadOnlyConvertingResultMap}.
   * @param params - Parameters for constructing the map.
   * @returns `Success` with the new map, or `Failure` with error details if an error occurred.
   */
  public static override create<TK extends string, TSRC, TTARGET>(
    params: IValidatingReadOnlyConvertingResultMapConstructorParams<TK, TSRC, TTARGET>
  ): Result<ValidatingReadOnlyConvertingResultMap<TK, TSRC, TTARGET>> {
    return captureResult(() => new ValidatingReadOnlyConvertingResultMap(params));
  }
}

/**
 * Parameters for constructing a
 * {@link Collections.ValidatingConvertingResultMap | ValidatingConvertingResultMap}.
 * @public
 */
export interface IValidatingConvertingResultMapConstructorParams<
  TK extends string,
  TSRC,
  TTARGET,
  TSRCMAP extends IResultMap<TK, TSRC> = IResultMap<TK, TSRC>
> {
  /**
   * The inner map containing source values.
   */
  inner: TSRCMAP;

  /**
   * The converter function to transform source values to target values.
   */
  converter: ConvertingResultMapValueConverter<TK, TSRC, TTARGET>;

  /**
   * The key-value converters for validating weakly-typed access.
   */
  converters: KeyValueConverters<TK, TTARGET>;
}

/**
 * A result map that wraps an inner {@link Collections.IResultMap | IResultMap} of source type
 * and returns lazily-converted, cached values of a target type, with a
 * {@link Collections.ReadOnlyConvertingResultMapValidator | validating} property for weakly-typed access
 * and a {@link Collections.CacheInvalidatingResultMapWrapper | source} property for mutable access
 * to the underlying source map.
 * @public
 */
export class ValidatingConvertingResultMap<
  TK extends string,
  TSRC,
  TTARGET,
  TSRCMAP extends IResultMap<TK, TSRC> = IResultMap<TK, TSRC>
> extends ConvertingResultMap<TK, TSRC, TTARGET, TSRCMAP> {
  /**
   * A validator for weakly-typed access to the map.
   */
  public readonly validating: ReadOnlyResultMapValidator<TK, TTARGET>;

  /**
   * The key-value converters used for validation.
   */
  protected readonly _converters: KeyValueConverters<TK, TTARGET>;

  /**
   * Constructs a new {@link Collections.ValidatingConvertingResultMap | ValidatingConvertingResultMap}.
   * @param params - Parameters for constructing the map.
   */
  public constructor(params: IValidatingConvertingResultMapConstructorParams<TK, TSRC, TTARGET, TSRCMAP>) {
    super({ inner: params.inner, converter: params.converter });
    this._converters = params.converters;
    this.validating = new ReadOnlyResultMapValidator(this, params.converters);
  }

  /**
   * Creates a new {@link Collections.ValidatingConvertingResultMap | ValidatingConvertingResultMap}.
   * @param params - Parameters for constructing the map.
   * @returns `Success` with the new map, or `Failure` with error details if an error occurred.
   */
  public static override create<
    TK extends string,
    TSRC,
    TTARGET,
    TSRCMAP extends IResultMap<TK, TSRC> = IResultMap<TK, TSRC>
  >(
    params: IValidatingConvertingResultMapConstructorParams<TK, TSRC, TTARGET, TSRCMAP>
  ): Result<ValidatingConvertingResultMap<TK, TSRC, TTARGET, TSRCMAP>> {
    return captureResult(() => new ValidatingConvertingResultMap(params));
  }
}
