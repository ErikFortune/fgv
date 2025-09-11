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
import { Brand, Result, fail, mapResults, succeed } from '../base';
import {
  ConstraintOptions,
  ConversionErrorFormatter,
  Converter,
  ConverterTraits,
  DefaultingConverter,
  OnError
} from './converter';
import { GenericDefaultingConverter } from './defaultingConverter';

/**
 * internal
 */
type InnerInferredType<TCONV> = TCONV extends Converter<infer TTO>
  ? TTO extends Array<infer TTOELEM>
    ? InnerInferredType<TTOELEM>[]
    : TTO
  : TCONV extends Array<infer TELEM>
  ? InnerInferredType<TELEM>[]
  : TCONV;

/**
 * Infers the type that will be returned by an instantiated converter.  Works
 * for complex as well as simple types.
 * @example `Infer<typeof Converters.mapOf(Converters.stringArray)>` is `Map<string, string[]>`
 * @beta
 */
export type Infer<TCONV> = TCONV extends Converter<infer TTO, unknown> ? InnerInferredType<TTO> : never;

/**
 * Deprecated name for Infer<T> retained for compatibility
 * @deprecated use @see Infer instead
 * @internal
 */
export type ConvertedToType<TCONV> = Infer<TCONV>;

/**
 * Function signature for a converter function.
 * @public
 */
export type ConverterFunc<T, TC> = (from: unknown, self: Converter<T, TC>, context?: TC) => Result<T>;

/**
 * Base templated wrapper to simplify creation of new {@link Converter}s.
 * @public
 */
export class BaseConverter<T, TC = unknown> implements Converter<T, TC> {
  /**
   * @internal
   */
  protected readonly _defaultContext?: TC;
  /**
   * @internal
   */
  protected _isOptional: boolean = false;
  /**
   * @internal
   */
  protected _brand?: string;

  private readonly _converter: (from: unknown, self: Converter<T, TC>, context?: TC) => Result<T>;

  /**
   * Constructs a new {@link Converter} which uses the supplied function to perform the conversion.
   * @param converter - The conversion function to be applied.
   * @param defaultContext - Optional conversion context to be used by default.
   * @param traits - Optional {@link Conversion.ConverterTraits | traits} to be assigned to the resulting
   * converter.
   */
  public constructor(converter: ConverterFunc<T, TC>, defaultContext?: TC, traits?: ConverterTraits) {
    this._converter = converter;
    this._defaultContext = defaultContext;
    this._isOptional = traits?.isOptional === true;
    this._brand = traits?.brand;
  }

  /**
   * {@inheritdoc Converter.isOptional}
   */
  public get isOptional(): boolean {
    return this._isOptional;
  }

  /**
   * {@inheritdoc Converter.brand}
   */
  public get brand(): string | undefined {
    return this._brand;
  }

  /**
   * {@inheritdoc Converter.convert}
   */
  public convert(from: unknown, context?: TC): Result<T> {
    return this._converter(from, this, context ?? this._defaultContext);
  }

  /**
   * {@inheritdoc Converter.convertOptional}
   */
  public convertOptional(from: unknown, context?: TC, onError?: OnError): Result<T | undefined> {
    const result = this._converter(from, this, this._context(context));
    if (result.isFailure()) {
      onError = onError ?? 'ignoreErrors';
      return from === undefined || onError === 'ignoreErrors' ? succeed(undefined) : result;
    }
    return result;
  }

  /**
   * {@inheritdoc Converter.optional}
   */
  public optional(onError?: OnError): Converter<T | undefined, TC> {
    return new BaseConverter((from: unknown, __self: Converter<T | undefined, TC>, context?: TC) => {
      onError = onError ?? 'failOnError';
      return this.convertOptional(from, this._context(context), onError);
    })._with(this._traits({ isOptional: true }));
  }

  /**
   * {@inheritdoc Converter.map}
   */
  public map<T2>(mapper: (from: T, context?: TC) => Result<T2>): Converter<T2, TC> {
    return new BaseConverter<T2, TC>((from: unknown, __self: Converter<T2, TC>, context?: TC) => {
      const innerResult = this._converter(from, this, this._context(context));
      if (innerResult.isSuccess()) {
        return mapper(innerResult.value, this._context(context));
      }
      return fail(innerResult.message);
    })._with(this._traits());
  }

  /**
   * {@inheritdoc Converter.mapConvert}
   */
  public mapConvert<T2>(mapConverter: Converter<T2>): Converter<T2, TC> {
    return new BaseConverter<T2, TC>((from: unknown, __self: Converter<T2, TC>, context?: TC) => {
      const innerResult = this._converter(from, this, this._context(context));
      if (innerResult.isSuccess()) {
        return mapConverter.convert(innerResult.value, this._context(context));
      }
      return fail(innerResult.message);
    })._with(this._traits());
  }

  /**
   * {@inheritdoc Converter.mapItems}
   */
  public mapItems<TI>(mapper: (from: unknown, context?: TC) => Result<TI>): Converter<TI[], TC> {
    return new BaseConverter<TI[], TC>((from: unknown, __self: Converter<TI[], TC>, context?: TC) => {
      return this._converter(from, this, this._context(context)).onSuccess((items) => {
        if (Array.isArray(items)) {
          return mapResults(items.map((i) => mapper(i, this._context(context))));
        }
        return fail('Cannot map items - not an array');
      });
    });
  }

  /**
   * {@inheritdoc Converter.mapConvertItems}
   */
  public mapConvertItems<TI>(mapConverter: Converter<TI, unknown>): Converter<TI[], TC> {
    return new BaseConverter<TI[], TC>((from: unknown, __self: Converter<TI[], TC>, context?: TC) => {
      return this._converter(from, this, this._context(context)).onSuccess((items) => {
        if (Array.isArray(items)) {
          return mapResults(items.map((i) => mapConverter.convert(i, this._context(context))));
        }
        return fail('Cannot map items - not an array');
      });
    });
  }

  /**
   * {@inheritdoc Converter.withAction}
   */
  public withAction<TI>(action: (result: Result<T>, context?: TC) => Result<TI>): Converter<TI, TC> {
    return new BaseConverter<TI, TC>((from: unknown, __self: Converter<TI, TC>, context?: TC) => {
      return action(this._converter(from, this, this._context(context)), this._context(context));
    })._with(this._traits());
  }

  /**
   * {@inheritdoc Converter.withTypeGuard}
   */
  public withTypeGuard<TI>(
    guard: (from: unknown, context?: TC) => from is TI,
    message?: string
  ): Converter<TI, TC> {
    return new BaseConverter<TI, TC>((from: unknown, __self: Converter<TI, TC>, context?: TC) => {
      return this._converter(from, this, this._context(context)).onSuccess((inner) => {
        message = message ?? 'invalid type';
        return guard(inner, this._context(context))
          ? succeed(inner)
          : fail(`${message}: ${JSON.stringify(from)}`);
      });
    })._with(this._traits());
  }

  /**
   * {@inheritdoc Converter.withItemTypeGuard}
   */
  public withItemTypeGuard<TI>(
    guard: (from: unknown, context?: TC) => from is TI,
    message?: string
  ): Converter<TI[], TC> {
    return new BaseConverter<TI[], TC>((from: unknown, __self: Converter<TI[], TC>, context?: TC) => {
      return this._converter(from, this, this._context(context)).onSuccess((items) => {
        if (Array.isArray(items)) {
          return mapResults(
            items.map((i) => {
              message = message ?? 'invalid type';
              return guard(i, this._context(context))
                ? succeed(i)
                : fail(`${message}: ${JSON.stringify(from)}`);
            })
          );
        }
        return fail('Cannot guard item type - not an array');
      });
    })._with(this._traits());
  }

  /**
   * {@inheritdoc Converter.withConstraint}
   */
  public withConstraint(
    constraint: (val: T, context?: TC) => boolean | Result<T>,
    options?: ConstraintOptions
  ): Converter<T, TC> {
    return new BaseConverter<T, TC>((from: unknown, __self: Converter<T, TC>, context?: TC) => {
      const result = this._converter(from, this, this._context(context));
      if (result.isSuccess()) {
        const constraintResult = constraint(result.value, this._context(context));
        if (typeof constraintResult === 'boolean') {
          return constraintResult
            ? result
            : fail(
                `"${JSON.stringify(result.value)}": ${options?.description ?? 'does not meet constraint'}`
              );
        }
        return constraintResult;
      }
      return result;
    })._with(this._traits());
  }

  /**
   * {@inheritdoc Converter.withBrand}
   */
  public withBrand<B extends string>(brand: B): Converter<Brand<T, B>, TC> {
    if (this._brand) {
      throw new Error(`Cannot replace existing brand "${this._brand}" with "${brand}".`);
    }

    return new BaseConverter<Brand<T, B>, TC>((from: unknown, __self: Converter<T, TC>, context?: TC) => {
      return this._converter(from, this, this._context(context)).onSuccess((v) => {
        return succeed(v as Brand<T, B>);
      });
    })._with(this._traits({ brand }));
  }

  /**
   * {@inheritdoc Converter.withDefault}
   */
  public withDefault<TD = T>(defaultValue: TD): DefaultingConverter<T, TD, TC> {
    return new GenericDefaultingConverter<T, TD, TC>(this, defaultValue);
  }

  /**
   * @internal
   */
  protected _context(supplied?: TC): TC | undefined {
    return supplied ?? this._defaultContext;
  }

  /**
   * {@inheritdoc Converter.withFormattedError}
   */
  public withFormattedError(formatter: ConversionErrorFormatter<TC>): Converter<T, TC> {
    return new BaseConverter<T, TC>((from: unknown, __self: Converter<T, TC>, context?: TC) => {
      return this._converter(from, this, this._context(context)).onFailure((msg) => {
        return fail(formatter(from, msg, this._context(context)));
      });
    })._with(this._traits());
  }

  /**
   * @internal
   */
  protected _traits(traits?: Partial<ConverterTraits>): ConverterTraits {
    return {
      isOptional: this.isOptional,
      brand: this.brand,
      ...(traits ?? {})
    };
  }

  /**
   * @internal
   */
  protected _with(traits: Partial<ConverterTraits>): this {
    this._isOptional = traits.isOptional === true;
    this._brand = traits.brand;
    return this;
  }
}
