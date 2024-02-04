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
import { Brand, Result, Success } from '../base';
import { Convalidator } from '../validation';

/**
 * Action to take on conversion failures.
 * @public
 */
export type OnError = 'failOnError' | 'ignoreErrors';

/**
 * Converter traits.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ConverterTraits {
  readonly isOptional: boolean;
  readonly brand?: string;
}

/**
 * Options for {@link Converter.withConstraint}.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ConstraintOptions {
  /**
   * Optional description for error messages when constraint
   * function returns false.
   */
  readonly description: string;
}

/**
 * Generic converter to convert unknown to a templated type `<T>`, using
 * intrinsic rules or as modified by an optional conversion context
 * of optional templated type `<TC>` (default `undefined`).
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface Converter<T, TC = undefined> extends ConverterTraits, Convalidator<T, TC> {
  /**
   * Indicates whether this element is explicitly optional.
   */
  readonly isOptional: boolean;

  /**
   * Returns the brand for a branded type.
   */
  readonly brand?: string;

  /**
   * Converts from `unknown` to `<T>`.  For objects and arrays, is guaranteed
   * to return a new entity, with any unrecognized properties removed.
   * @param from - The `unknown` to be converted
   * @param context - An optional conversion context of type `<TC>` to be used in
   * the conversion.
   * @returns A {@link Result} with a {@link Success} and a value on success or an
   * {@link Failure} with a a message on failure.
   */
  convert(from: unknown, context?: TC): Result<T>;

  /**
   * {@inheritdoc Validation.Convalidator.convalidate}
   */
  convalidate(from: unknown, context?: TC): Result<T>;

  /**
   * Converts from `unknown` to `<T>` or `undefined`, as appropriate.
   *
   * @remarks
   * If `onError` is `failOnError`, the converter succeeds for
   * `undefined` or any convertible value, but reports an error
   * if it encounters a value that cannot be converted.
   *
   * If `onError` is `ignoreErrors` (default) then values that
   * cannot be converted result in a successful return of `undefined`.
   * @param from - The `unknown` to be converted
   * @param context - An optional conversion context of type `<TC>` to be used in
   * the conversion.
   * @param onError - Specifies handling of values that cannot be converted (default `ignoreErrors`).
   * @returns A {@link Result} with a {@link Success} and a value on success or an
   * {@link Failure} with a a message on failure.
   */
  convertOptional(from: unknown, context?: TC, onError?: OnError): Result<T | undefined>;

  /**
   * Creates a {@link Converter} for an optional value.
   *
   * @remarks
   * If `onError` is `failOnError`, the resulting converter will accept `undefined`
   * or a convertible value, but report an error if it encounters a value that cannot be
   * converted.
   *
   * If `onError` is `ignoreErrors` (default) then values that cannot be converted will
   * result in a successful return of `undefined`.
   *
   * @param onError - Specifies handling of values that cannot be converted (default `ignoreErrors`).
   * @returns A new {@link Converter} returning `<T|undefined>`.
   * */
  optional(onError?: OnError): Converter<T | undefined, TC>;

  /**
   * Creates a {@link Converter} which applies a (possibly) mapping conversion to
   * the converted value of this {@link Converter}.
   * @param mapper - A function which maps from the the result type `<T>` of this
   * converter to a new result type `<T2>`.
   * @returns A new {@link Converter} returning `<T2>`.
   */
  map<T2>(mapper: (from: T) => Result<T2>): Converter<T2, TC>;

  /**
   * Creates a {@link Converter} which applies an additional supplied
   * converter to the result of this converter.
   *
   * @param mapConverter - The {@link Converter} to be applied to the
   * converted result from this {@link Converter}.
   * @returns A new {@link Converter} returning `<T2>`.
   */
  mapConvert<T2>(mapConverter: Converter<T2>): Converter<T2, TC>;

  /**
   * Creates a {@link Converter} which maps the individual items of a collection
   * resulting from this {@link Converter} using the supplied map function.
   *
   * @remarks
   * Fails if `from` is not an array.
   *
   * @param mapper - The map function to be applied to each element of the
   * result of this {@link Converter}.
   * @returns A new {@link Converter} returning `<TI[]>`.
   */
  mapItems<TI>(mapper: (from: unknown) => Result<TI>): Converter<TI[], TC>;

  /**
   * Creates a {@link Converter} which maps the individual items of a collection
   * resulting from this {@link Converter} using the supplied {@link Converter}.
   *
   * @remarks
   * Fails if `from` is not an array.
   *
   * @param mapConverter - The {@link Converter} to be applied to each element of the
   * result of this {@link Converter}.
   * @returns A new {@link Converter} returning `<TI[]>`.
   */
  mapConvertItems<TI>(mapConverter: Converter<TI, unknown>): Converter<TI[], TC>;

  /**
   * Creates a {@link Converter | Converter} which applies a supplied action after
   * conversion.  The supplied action is always called regardless of success or failure
   * of the base conversion and is allowed to mutate the return type.
   * @param action - The action to be applied.
   */
  withAction<T2>(action: (result: Result<T>) => Result<T2>): Converter<T2, TC>;

  /**
   * Creates a {@link Converter} which applies a supplied type guard to the conversion
   * result.
   * @param guard - The type guard function to apply.
   * @param message - Optional message to be reported if the type guard fails.
   * @returns A new {@link Converter} returning `<TI>`.
   */
  withTypeGuard<TI>(guard: (from: unknown) => from is TI, message?: string): Converter<TI, TC>;

  /**
   * Creates a {@link Converter} which applies a supplied type guard to each member of
   * the conversion result from this converter.
   *
   * @remarks
   * Fails if the conversion result is not an array or if any member fails the
   * type guard.
   * @param guard - The type guard function to apply to each element.
   * @param message - Optional message to be reported if the type guard fails.
   * @returns A new {@link Converter} returning `<TI>`.
   */
  withItemTypeGuard<TI>(guard: (from: unknown) => from is TI, message?: string): Converter<TI[], TC>;

  /**
   * Creates a {@link Converter} which applies an optional constraint to the result
   * of this conversion.  If this {@link Converter} (the base converter) succeeds, the new
   * converter calls a supplied constraint evaluation function with the conversion, which
   * fails the entire conversion if the constraint function returns either `false` or
   * {@link Failure | Failure<T>}.
   *
   * @param constraint - Constraint evaluation function.
   * @param options - {@link Conversion.ConstraintOptions | Options} for constraint evaluation.
   * @returns A new {@link Converter} returning `<T>`.
   */
  withConstraint(constraint: (val: T) => boolean | Result<T>, options?: ConstraintOptions): Converter<T, TC>;

  /**
   * returns a converter which adds a brand to the type to prevent mismatched usage
   * of simple types.
   * @param brand - The brand to be applied to the result value.
   * @returns A {@link Converter} returning `Brand<T, B>`.
   */
  withBrand<B extends string>(brand: B): Converter<Brand<T, B>, TC>;

  /**
   * Returns a Converter which always succeeds with a default value rather than failing.
   */
  withDefault<TD = T>(dflt: TD): DefaultingConverter<T, TD, TC>;
}

/**
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface DefaultingConverter<T, TD = T, TC = undefined> extends Converter<T | TD, TC> {
  /**
   * Default value to use if the conversion fails.
   */
  readonly defaultValue: TD;

  /**
   * Convert the supplied `unknown` to `Success<T>` or to the `Success` with the default value
   * if conversion is not possible.
   * @param from - the value to be converted.
   * @param ctx - optional context for the conversion.
   */
  convert(from: unknown, ctx?: TC): Success<T | TD>;

  /**
   * {@inheritdoc Converter.convalidate}
   */
  convalidate(from: unknown, ctx?: TC): Success<T | TD>;
}
