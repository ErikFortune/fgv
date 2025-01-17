/*
 * Copyright (c) 2021 Erik Fortune
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

import { Brand, Failure, Result } from '../base';
import { ConstraintTrait, ValidatorTraits } from './traits';

/**
 * Options that apply to any {@link Validation.Validator | Validator}.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ValidatorOptions<TC> {
  defaultContext?: TC;
}

/**
 * A {@link Validation.Constraint | Constraint<T>} function returns
 * `true` if the supplied value meets the constraint. Can return
 * {@link Failure} with an error message or simply return `false`
 * for a default message.
 * @public
 */
export type Constraint<T> = (val: T) => boolean | Failure<T>;

/**
 * Formats an incoming error message and value that failed validation.
 * @param val - The value that failed validation.
 * @param message - The default error message, if any.
 * @param context - Optional validation context.
 * @returns The formatted error message.
 * @public
 */
export type ValidationErrorFormatter<TC = unknown> = (val: unknown, message?: string, context?: TC) => string;

/**
 * In-place validation that a supplied unknown matches some
 * required characteristics (type, values, etc).
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface Validator<T, TC = unknown> {
  /**
   * {@link Validation.ValidatorTraits | Traits} describing this validation.
   */
  readonly traits: ValidatorTraits;

  /**
   * Indicates whether this element is explicitly optional.
   */
  readonly isOptional: boolean;

  /**
   * The brand for a branded type.
   */
  readonly brand: string | undefined;

  /**
   * Tests to see if a supplied `unknown` value matches this validation.  All
   * validate calls are guaranteed to return the entity passed in on Success.
   * @param from - The `unknown` value to be tested.
   * @param context - Optional validation context.
   * @returns {@link Success} with the typed, validated value,
   * or {@link Failure} with an error message if validation fails.
   */
  validate(from: unknown, context?: TC): Result<T>;

  /**
   * Tests to see if a supplied 'unknown' value matches this validation.  In
   * contrast to {@link Validator.validate | validate}, makes no guarantees
   * about the identity of the returned value.
   * @param from - The `unknown` value to be tested.
   * @param context - Optional validation context.
   * @returns {@link Success} with the typed, conversion value,
   * or {@link Failure} with an error message if conversion fails.
   */
  convert(from: unknown, context?: TC): Result<T>;

  /**
   * Tests to see if a supplied `unknown` value matches this
   * validation.  Accepts `undefined`.
   * @param from - The `unknown` value to be tested.
   * @param context - Optional validation context.
   * @returns {@link Success} with the typed, validated value,
   * or {@link Failure} with an error message if validation fails.
   */
  validateOptional(from: unknown, context?: TC): Result<T | undefined>;

  /**
   * Non-throwing type guard
   * @param from - The value to be tested.
   * @param context - Optional validation context.
   */
  guard(from: unknown, context?: TC): from is T;

  /**
   * Creates an {@link Validation.Validator | in-place validator}
   * which is derived from this one but which also matches `undefined`.
   */
  optional(): Validator<T | undefined, TC>;

  /**
   * Creates an {@link Validation.Validator | in-place validator}
   * which is derived from this one but which applies additional constraints.
   * @param constraint - the constraint to be applied
   * @param trait - As optional {@link Validation.ConstraintTrait | ConstraintTrait}
   * to be applied to the resulting {@link Validation.Validator | Validator}.
   * @returns A new {@link Validation.Validator | Validator}.
   */
  withConstraint(constraint: Constraint<T>, trait?: ConstraintTrait): Validator<T, TC>;

  /**
   * Creates a new {@link Validation.Validator | in-place validator} which
   * is derived from this one but which matches a branded result.
   * @param brand - The brand to be applied.
   */
  withBrand<B extends string>(brand: B): Validator<Brand<T, B>, TC>;

  /**
   * Creates a new {@link Validation.Validator | in-place validator} which
   * is derived from this one but which returns an error message supplied
   * by the provided formatter if an error occurs.
   * @param formatter - The error message formatter to be applied.
   * @returns A new {@link Validation.Validator | Validator}.
   */
  withFormattedError(formatter: ValidationErrorFormatter<TC>): Validator<T, TC>;
}
