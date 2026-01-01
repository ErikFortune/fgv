/*
 * Copyright (c) 2026 Erik Fortune
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
import { Validator } from './validator';
import { ValidatorBase, ValidatorBaseConstructorParams } from './validatorBase';

/**
 * Parameters used to construct a {@link Validation.Classes.StringValidator | StringValidator}.
 * @public
 */
export interface CompositeIdValidatorConstructorParams<
  T extends string = string,
  TCOLLECTIONID extends string = string,
  TITEMID extends string = string,
  TC = unknown
> extends ValidatorBaseConstructorParams<T, TC> {
  readonly collectionId: Validator<TCOLLECTIONID, TC>;
  readonly separator: string;
  readonly itemId: Validator<TITEMID, TC>;
}

/**
 * An in-place {@link Validation.Validator | Validator} for a strongly-typed composite ID.
 * @public
 */
export class CompositeIdValidator<
  T extends string = string,
  TCOLLECTIONID extends string = string,
  TITEMID extends string = string,
  TC = unknown
> extends ValidatorBase<T, TC> {
  protected readonly _collectionIdValidator: Validator<TCOLLECTIONID, TC>;
  protected readonly _itemIdValidator: Validator<TITEMID, TC>;
  protected readonly _separator: string;

  /**
   * Constructs a new {@link Validation.Classes.StringValidator | StringValidator}.
   * @param params - Optional {@link Validation.Classes.StringValidatorConstructorParams | init params}
   * for the new {@link Validation.Classes.StringValidator | StringValidator}.
   */
  public constructor(params: CompositeIdValidatorConstructorParams<T, TCOLLECTIONID, TITEMID, TC>) {
    /* c8 ignore next */
    super({
      ...params
    });
    const { collectionId, separator, itemId } = params;

    this._collectionIdValidator = collectionId.withFormattedError(
      (value, err) => `${value}: invalid composite collection ID (${err}).`
    );
    this._itemIdValidator = itemId.withFormattedError(
      (value, err) => `${value}: invalid composite item ID (${err}).`
    );
    this._separator = separator;
  }

  protected override _validate(value: unknown, context?: TC): boolean | Failure<T> {
    if (typeof value !== 'string') {
      return fail(`${value}: invalid non-string composite ID.`);
    }
    const parts = value.split(this._separator);
    if (parts.length !== 2) {
      return fail(`${value}: invalid composite ID - separator '${this._separator}' not found.`);
    }
    const [collectionId, itemId] = parts;
    const result = this._collectionIdValidator
      .validate(collectionId, context)
      .onSuccess(() => this._itemIdValidator.validate(itemId, context));
    return result.isSuccess() ? true : Failure.with<T>(`${value}: invalid composite ID - ${result.message}`);
  }
}
