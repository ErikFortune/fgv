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

import { Failure, Result, fail, formatValueForMessage, succeed } from '../base';
import { Validator } from './validator';
import { ValidatorBase, ValidatorBaseConstructorParams } from './validatorBase';

/**
 * All supported `CompositeIdSplitMode` values.
 * @public
 */
export const allCompositeIdSplitModes = ['exact', 'first', 'last'] as const;

/**
 * How a composite ID string is split into its collection and item parts:
 * - `'exact'` (the default) requires exactly one separator and fails if the
 *   string contains more than one.
 * - `'first'` splits at the first separator; everything after it, including any
 *   further separators, is passed untouched to the item ID converter or validator.
 * - `'last'` splits at the last separator; everything before it, including any
 *   further separators, is passed untouched to the collection ID converter or validator.
 *
 * `'first'` and `'last'` require a non-empty separator and fail without one.
 *
 * @remarks
 * To accept a nested composite as one part, split with `'first'` or `'last'` so
 * the nested value arrives intact, validate that part as a plain string, and then
 * re-parse it with its own composite ID converter or validator.
 * @public
 */
export type CompositeIdSplitMode = (typeof allCompositeIdSplitModes)[number];

// Keep in step with the identical module-private copy in `conversion/advancedConverters.ts`.
/**
 * Splits a composite ID string into its collection and item parts.
 * @param value - The composite ID string.
 * @param separator - The separator string.
 * @param split - The `CompositeIdSplitMode`.
 * @returns `Success` with the `[collectionId, itemId]` strings, or `Failure` if
 * the separator is missing, repeated (for `'exact'`), or empty (for `'first'` / `'last'`).
 */
function splitCompositeIdString(
  value: string,
  separator: string,
  split: CompositeIdSplitMode
): Result<readonly [string, string]> {
  if (split === 'exact') {
    const parts = value.split(separator);
    if (parts.length < 2) {
      return fail(`${value}: invalid composite ID - separator '${separator}' not found.`);
    } else if (parts.length > 2) {
      return fail(`${value}: invalid composite ID - multiple separators '${separator}' found.`);
    }
    return succeed([parts[0], parts[1]]);
  }
  if (separator.length === 0) {
    return fail(`${value}: invalid composite ID - split '${split}' requires a non-empty separator.`);
  }
  const index = split === 'last' ? value.lastIndexOf(separator) : value.indexOf(separator);
  if (index < 0) {
    return fail(`${value}: invalid composite ID - separator '${separator}' not found.`);
  }
  return succeed([value.slice(0, index), value.slice(index + separator.length)]);
}

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
  /**
   * How to split the composite ID string. Defaults to `'exact'`; see
   * `CompositeIdSplitMode`.
   */
  readonly split?: CompositeIdSplitMode;
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
  protected readonly _split: CompositeIdSplitMode;

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
    const { collectionId, separator, itemId, split } = params;

    this._collectionIdValidator = collectionId.withFormattedError(
      (value, err) => `${value}: invalid composite collection ID (${err}).`
    );
    this._itemIdValidator = itemId.withFormattedError(
      (value, err) => `${value}: invalid composite item ID (${err}).`
    );
    this._separator = separator;
    this._split = split ?? 'exact';
  }

  protected override _validate(value: unknown, context?: TC): boolean | Failure<T> {
    if (typeof value !== 'string') {
      return fail(`${formatValueForMessage(value, { style: 'string' })}: invalid non-string composite ID.`);
    }
    const result = splitCompositeIdString(value, this._separator, this._split).onSuccess(
      ([collectionId, itemId]) =>
        this._collectionIdValidator
          .validate(collectionId, context)
          .onSuccess(() => this._itemIdValidator.validate(itemId, context))
          .withErrorFormat((message) => `${value}: invalid composite ID - ${message}`)
    );
    return result.isSuccess() ? true : Failure.with<T>(result.message);
  }
}
