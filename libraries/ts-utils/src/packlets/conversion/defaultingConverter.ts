/*
 * Copyright (c) 2020 Erik Fortune
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

import { Brand, Result, Success, succeed } from '../base';
import { ConstraintOptions, ConversionErrorFormatter, Converter, DefaultingConverter } from './converter';

/**
 * Generic {@link Conversion.DefaultingConverter | DefaultingConverter}, which wraps another converter
 * to substitute a supplied default value for any errors returned by the inner converter.
 * @public
 */
export class GenericDefaultingConverter<T, TD = T, TC = unknown> implements DefaultingConverter<T, TD, TC> {
  private _converter: Converter<T, TC>;

  /**
   * {@inheritDoc Conversion.DefaultingConverter.defaultValue}
   */
  public defaultValue: TD;

  /**
   * {@inheritDoc Converter.isOptional}
   */
  public get isOptional(): boolean {
    return this._converter.isOptional;
  }

  /**
   * {@inheritDoc Converter.isOptional}
   */
  public get brand(): string | undefined {
    return this._converter.brand;
  }

  /**
   * Constructs a new {@link Conversion.GenericDefaultingConverter | generic defaulting converter}.
   * @param converter - inner {@link Converter | Converter} used for the base conversion.
   * @param defaultValue - default value to be supplied if the inner conversion fails.
   */
  public constructor(converter: Converter<T, TC>, defaultValue: TD) {
    this.defaultValue = defaultValue;
    this._converter = converter;
  }

  /**
   * {@inheritDoc Converter.convert}
   */
  public convert(from: unknown, ctx?: TC | undefined): Success<T | TD> {
    return this._applyDefault(this._converter.convert(from, ctx));
  }

  /**
   * {@inheritDoc Converter.convertOptional}
   */
  public convertOptional(
    from: unknown,
    context?: TC | undefined,
    onError?: ('failOnError' | 'ignoreErrors') | undefined
  ): Result<T | TD | undefined> {
    const converted = this._converter.convertOptional(from, context, onError);
    if (converted.isFailure()) {
      return succeed(this.defaultValue);
    }
    return converted;
  }

  /**
   * {@inheritDoc Converter.optional}
   */
  public optional(onError?: ('failOnError' | 'ignoreErrors') | undefined): Converter<T | TD | undefined, TC> {
    // need to let the inner converter do its optional thing first or our default
    // steps on everything
    return this._converter.optional(onError).withAction((result) => this._applyDefault(result));
  }

  /**
   * {@inheritDoc Converter.map}
   */
  public map<T2>(mapper: (from: T | TD) => Result<T2>): Converter<T2, TC> {
    return this._converter.withAction((result) => this._applyDefault(result)).map(mapper);
  }

  /**
   * {@inheritDoc Converter.mapConvert}
   */
  public mapConvert<T2>(mapConverter: Converter<T2, unknown>): Converter<T2, TC> {
    return this._converter.withAction((result) => this._applyDefault(result)).mapConvert(mapConverter);
  }

  /**
   * {@inheritDoc Converter.mapItems}
   */
  public mapItems<TI>(mapper: (from: unknown) => Result<TI>): Converter<TI[], TC> {
    return this._converter.withAction((result) => this._applyDefault(result)).mapItems(mapper);
  }

  /**
   * {@inheritDoc Converter.mapConvertItems}
   */
  public mapConvertItems<TI>(mapConverter: Converter<TI, unknown>): Converter<TI[], TC> {
    return this._converter.withAction((result) => this._applyDefault(result)).mapConvertItems(mapConverter);
  }

  /**
   * {@inheritDoc Converter.withAction}
   */
  public withAction<T2>(action: (result: Result<T | TD>) => Result<T2>): Converter<T2, TC> {
    return this._converter.withAction((result) => this._applyDefault(result)).withAction(action);
  }

  /**
   * {@inheritDoc Converter.withTypeGuard}
   */
  public withTypeGuard<TI>(
    guard: (from: unknown) => from is TI,
    message?: string | undefined
  ): Converter<TI, TC> {
    return this._converter.withAction((result) => this._applyDefault(result)).withTypeGuard(guard);
  }

  /**
   * {@inheritDoc Converter.withItemTypeGuard}
   */
  public withItemTypeGuard<TI>(
    guard: (from: unknown) => from is TI,
    message?: string | undefined
  ): Converter<TI[], TC> {
    return this._converter.withAction((result) => this._applyDefault(result)).withItemTypeGuard(guard);
  }

  /**
   * {@inheritDoc Converter.withConstraint}
   */
  public withConstraint(
    constraint: (val: T | TD) => boolean | Result<T | TD>,
    options?: ConstraintOptions | undefined
  ): Converter<T | TD, TC> {
    return this._converter.withAction((result) => this._applyDefault(result)).withConstraint(constraint);
  }

  /**
   * {@inheritDoc Converter.withBrand}
   */
  public withBrand<B extends string>(brand: B): Converter<Brand<T | TD, B>, TC> {
    return this._converter.withAction((result) => this._applyDefault(result)).withBrand(brand);
  }

  /**
   * {@inheritDoc Converter.withFormattedError}
   */
  public withFormattedError(formatter: ConversionErrorFormatter<TC>): Converter<T | TD, TC> {
    // formatter should never actually be invoked for a defaulting converter
    return this._converter.withAction((result) => this._applyDefault(result)).withFormattedError(formatter);
  }

  /**
   * Returns a Converter which always succeeds with the supplied default value rather
   * than failing.
   *
   * Note that the supplied default value *overrides* the default value of this
   * {@link Conversion.DefaultingConverter | DefaultingConverter}.
   */
  public withDefault<TD2 = T>(dflt: TD2): DefaultingConverter<T, TD2, TC> {
    return new GenericDefaultingConverter(this._converter, dflt);
  }

  /**
   * {@inheritDoc Converter.or}
   */
  public or(__converter: Converter<T, TC>): DefaultingConverter<T, TD, TC> {
    return this;
  }

  private _applyDefault<T2 = T>(converted: Result<T2>): Success<T2 | TD> {
    return converted.success ? converted : succeed(this.defaultValue);
  }
}
