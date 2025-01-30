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
import { Converter, ConverterFunc, Converters } from '../conversion';
import { Validator } from '../validation';
import { KeyValueEntry } from './common';
import { ResultMapResultDetail } from './readonlyResultMap';

/**
 * Parameters for constructing a {@link Collections.KeyValueConverters | KeyValueConverters} instance.
 * @public
 */
export interface IKeyValueConverterConstructorParams<TK extends string = string, TV = unknown> {
  /**
   * Required key {@link Validator | validator}, {@link Converter | converter},
   * or {@link Conversion.ConverterFunc | converter function}.
   */
  key: Validator<TK, unknown> | Converter<TK, unknown> | ConverterFunc<TK, unknown>;

  /**
   * Required value {@link Validator | validator}, {@link Converter | converter},
   * or {@link Conversion.ConverterFunc | converter function}.
   */
  value: Validator<TV, unknown> | Converter<TV, unknown> | ConverterFunc<TV, unknown>;

  /**
   * Optional entry {@link Validator | validator}, {@link Converter | converter},
   * or {@link Conversion.ConverterFunc | converter function}.
   * If no entry validator is provided, an entry is considered valid if both key and
   * value are valid.
   */
  entry?:
    | Validator<KeyValueEntry<TK, TV>, unknown>
    | Converter<KeyValueEntry<TK, TV>, unknown>
    | ConverterFunc<KeyValueEntry<TK, TV>, unknown>;
}

/**
 * Helper class for converting strongly-typed keys, values, or entries
 * from unknown values.
 * @public
 */
export class KeyValueConverters<TK extends string = string, TV = unknown> {
  /**
   * Required key {@link Validator | validator} or {@link Converter | converter}.
   */
  public readonly key: Validator<TK, unknown> | Converter<TK, unknown>;
  /**
   * Required value {@link Validator | validator} or {@link Converter | converter}.
   */
  public readonly value: Validator<TV, unknown> | Converter<TV, unknown>;

  /**
   * Optional entry {@link Validator | validator} or {@link Converter | converter}.
   * If no entry validator is provided, an entry is considered valid if both key and
   * value are valid.
   */
  public readonly entry?:
    | Validator<KeyValueEntry<TK, TV>, unknown>
    | Converter<KeyValueEntry<TK, TV>, unknown>;

  /**
   * Constructs a new key-value validator.
   * @param key - Required key {@link Validator | validator}, {@link Converter | converter},
   * or {@link Conversion.ConverterFunc | converter function}.
   * @param value - Required value {@link Validator | validator}, {@link Converter | converter},
   * or {@link Conversion.ConverterFunc | converter function}.
   * @param entry - Optional entry {@link Validator | validator}, {@link Converter | converter},
   * or {@link Conversion.ConverterFunc | converter function}..  If no entry validator is provided,
   * an entry is considered valid if both key and value are valid.
   */
  public constructor({ key, value, entry }: IKeyValueConverterConstructorParams<TK, TV>) {
    this.key = typeof key === 'function' ? Converters.generic(key) : key;
    this.value = typeof value === 'function' ? Converters.generic(value) : value;
    this.entry = entry ? (typeof entry === 'function' ? Converters.generic(entry) : entry) : undefined;
  }

  /**
   * Converts a supplied unknown to a valid key value of type `<TK>`.
   * @param key - The unknown to be converted.
   * @returns `Success` with the converted key value and 'success' detail if the key is valid,
   * or `Failure` with an error message and 'invalid-key' detail if the key is invalid.
   */
  public convertKey(key: unknown): DetailedResult<TK, ResultMapResultDetail> {
    return this.key.convert(key).withFailureDetail('invalid-key');
  }

  /**
   * Converts a supplied unknown to a valid value of type `<TV>`.
   * @param key - The unknown to be converted.
   * @returns `Success` with the converted value and 'success' detail if the value is valid,
   * or `Failure` with an error message and 'invalid-value' detail if the value is invalid.
   */
  public convertValue(key: unknown): DetailedResult<TV, ResultMapResultDetail> {
    return this.value.convert(key).withFailureDetail('invalid-value');
  }

  /**
   * Converts a supplied unknown to a valid entry of type `[<TK>, <TV>]`.
   * @param entry - The unknown to be converted.
   * @returns `Success` with the converted entry and 'success' detail if the entry
   * is valid, or `Failure` with an error message and 'invalid-key' or 'invalid-value' detail if
   * the entry is invalid
   */
  public convertEntry(entry: unknown): DetailedResult<KeyValueEntry<TK, TV>, ResultMapResultDetail> {
    if (this.entry) {
      return this.entry.convert(entry).withFailureDetail('invalid-value');
    }
    if (Array.isArray(entry) && entry.length === 2) {
      const errors = new MessageAggregator();
      const key = this.convertKey(entry[0]).aggregateError(errors).orDefault();
      const value = this.convertValue(entry[1]).aggregateError(errors).orDefault();
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
   * Converts a supplied iterable of unknowns to valid key-value pairs.
   * @param entries - The iterable of unknowns to be converted.
   * @returns `Success` with an array of converted key-value pairs if all entries are valid,
   * or `Failure` with an error message if any entry is invalid.
   */
  public convertEntries(entries: Iterable<unknown>): Result<KeyValueEntry<TK, TV>[]> {
    const errors = new MessageAggregator();
    const converted: KeyValueEntry<TK, TV>[] = [];
    for (const element of entries) {
      this.convertEntry(element)
        .onSuccess((e) => {
          converted.push(e);
          return succeedWithDetail(e, 'success');
        })
        .aggregateError(errors);
    }
    return errors.returnOrReport(succeed(converted));
  }
}
