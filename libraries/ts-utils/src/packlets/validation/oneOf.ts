/*
 * Copyright (c) 2024 Erik Fortune
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

import { Failure, fail } from '../base';
import { Validator, ValidatorOptions } from './validator';
import { ValidatorBase, ValidatorBaseConstructorParams } from './validatorBase';

/**
 * Parameters used to construct a {@link Validation.Classes.OneOfValidator | OneOfValidator}.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface OneOfValidatorConstructorParams<T, TC = unknown>
  extends ValidatorBaseConstructorParams<T, TC> {
  validators: Validator<T, TC>[];
}

/**
 * An in-place {@link Validator | Validator} which validates that a supplied
 * value matches one of several other validators.
 * @public
 */
export class OneOfValidator<T, TC = unknown> extends ValidatorBase<T, TC> {
  /**
   * {@link Validation.ValidatorOptions | Options} which apply to this
   * validator.
   */
  public readonly options: ValidatorOptions<TC>;

  protected readonly _validators: Validator<T, TC>[];

  /**
   * Constructs a new {@link Validation.Classes.OneOfValidator | OneOfValidator}.
   * @param params - Optional {@link Validation.Classes.OneOfValidatorConstructorParams | init params} for the
   * new {@link Validation.Classes.OneOfValidator | OneOfValidator}.
   */
  public constructor(params: OneOfValidatorConstructorParams<T, TC>) {
    super(params);
    this._validators = params.validators;
    this.options =
      params.options ??
      // istanbul ignore next - ?? is defense in depth
      {};
  }

  /**
   * Static method which validates that a supplied `unknown` value matches at least one
   * of the configured validators.
   * @param from - The `unknown` value to be tested.
   * @param context - Optional validation context will be propagated to element validator.
   * @returns Returns `true` if `from` is an `array` of valid elements, or
   * {@link Failure} with an error message if not.
   */
  protected _validate<T>(from: unknown, context?: TC): boolean | Failure<T> {
    const found = this._validators.some((v) => v.validate(from).success);
    if (found) {
      return true;
    }
    return fail(`value "${from}" does not match any validator.`);
  }
}
