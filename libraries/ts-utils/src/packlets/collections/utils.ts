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

import {
  DetailedResult,
  failWithDetail,
  MessageAggregator,
  Result,
  succeed,
  succeedWithDetail
} from '../base';
import { Converter } from '../conversion';
import { Validator } from '../validation';
import { KeyValueEntry } from './common';
import { ResultMapResultDetail } from './readonlyResultMap';

/**
 * Determines if a supplied value is an iterable object or some other type.
 * @param value - The value to be tested.
 * @returns `true` if the value is an iterable object, `false` otherwise.
 * @public
 */
export function isIterable<TE = unknown, TI extends Iterable<TE> = Iterable<TE>, TO = unknown>(
  value: TI | TO
): value is TI {
  return (value && typeof value === 'object' && Symbol.iterator in value) === true;
}

/**
 * Helper class for validating key-value pairs.
 * @public
 */
export class KeyValueValidators<TK extends string = string, TV = unknown> {
  /**
   * Required key validator or converter.
   */
  public readonly key: Validator<TK, unknown> | Converter<TK, unknown>;

  /**
   * Required value validator or converter.
   */
  public readonly value: Validator<TV, unknown> | Converter<TV, unknown>;

  /**
   * Optional entry validator or converter.  If no entry validator is provided,
   * an entry is considered valid if both key and value are valid.
   */
  public readonly entry?:
    | Validator<KeyValueEntry<TK, TV>, unknown>
    | Converter<KeyValueEntry<TK, TV>, unknown>;

  /**
   * Constructs a new key-value validator.
   * @param key - Required key validator or converter.
   * @param value - Required value validator or converter.
   * @param entry - Optional entry validator or converter.  If no entry validator is provided,
   * an entry is considered valid if both key and value are valid.
   */
  public constructor(
    key: Validator<TK, unknown> | Converter<TK, unknown>,
    value: Validator<TV, unknown> | Converter<TV, unknown>,
    entry?: Validator<KeyValueEntry<TK, TV>, unknown> | Converter<KeyValueEntry<TK, TV>, unknown>
  ) {
    this.key = key;
    this.value = value;
    this.entry = entry;
  }

  /**
   * Validates a supplied unknown as a valid key value.
   * @param key - The unknown to be validated.
   * @returns `Success` with the validated key value and 'success' detail if the key is valid,
   * or `Failure` with an error message and 'invalid-key' detail if the key is invalid.
   */
  public validateKey(key: unknown): DetailedResult<TK, ResultMapResultDetail> {
    return this.key.convert(key).withFailureDetail('invalid-key');
  }

  /**
   * Validates a supplied unknown as a valid value.
   * @param key - The unknown to be validated.
   * @returns `Success` with the validated value and 'success' detail if the value is valid,
   * or `Failure` with an error message and 'invalid-value' detail if the value is invalid.
   */
  public validateValue(key: unknown): DetailedResult<TV, ResultMapResultDetail> {
    return this.value.convert(key).withFailureDetail('invalid-value');
  }

  /**
   * Validates a supplied unknown as a valid key-value pair.
   * @param entry - The unknown to be validated.
   * @returns `Success` with the validated key-value pair and 'success' detail if the entry
   * is valid, or `Failure` with an error message and 'invalid-key' or 'invalid-value' detail if
   * the entry is invalid
   */
  public validateEntry(entry: unknown): DetailedResult<KeyValueEntry<TK, TV>, ResultMapResultDetail> {
    if (this.entry) {
      return this.entry.convert(entry).withFailureDetail('invalid-value');
    }
    if (Array.isArray(entry) && entry.length === 2) {
      const errors = new MessageAggregator();
      const key = this.validateKey(entry[0]).aggregateError(errors).orDefault();
      const value = this.validateValue(entry[1]).aggregateError(errors).orDefault();
      if (key && value) {
        return succeedWithDetail([key, value], 'success');
      }
      const detail = key ? 'invalid-value' : 'invalid-key';
      return failWithDetail(`invalid entry: ${errors.toString()}`, detail);
    }
    /* c8 ignore next 2 */
    return failWithDetail(`malformed entry: "${JSON.stringify(entry)}"`, 'invalid-value');
  }

  /**
   * Validates a supplied iterable of unknowns as valid key-value pairs.
   * @param entries - The iterable of unknowns to be validated.
   * @returns `Success` with an array of validated key-value pairs if all entries are valid,
   * or `Failure` with an error message if any entry is invalid.
   */
  public validateEntries(entries: Iterable<unknown>): Result<KeyValueEntry<TK, TV>[]> {
    const errors = new MessageAggregator();
    const validated: KeyValueEntry<TK, TV>[] = [];
    for (const element of entries) {
      this.validateEntry(element)
        .onSuccess((e) => {
          validated.push(e);
          return succeedWithDetail(e, 'success');
        })
        .aggregateError(errors);
    }
    return errors.returnOrReport(succeed(validated));
  }
}
