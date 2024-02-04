/*
 * Copyright (c) 2023 Erik Fortune
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

import { Result, fail, succeed } from '../base';
import { BaseConverter } from './baseConverter';
import { Converter, ConverterTraits } from './converter';

/**
 * Options for {@link Conversion.StringConverter | StringConverter}
 * matching method
 * @public
 */

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface StringMatchOptions {
  /**
   * An optional message to be displayed if a non-matching string
   * is encountered.
   */
  message?: string;
}

/**
 * The {@link Conversion.StringConverter | StringConverter} class extends
 * {@link Conversion.BaseConverter | BaseConverter} to provide string-specific
 * helper methods.
 * @public
 */
export class StringConverter<T extends string = string, TC = unknown> extends BaseConverter<T, TC> {
  /**
   * Construct a new {@link Conversion.StringConverter | StringConverter}.
   * @param defaultContext - Optional context used by the conversion.
   * @param traits - Optional traits to be applied to the conversion.
   * @param converter - Optional conversion function to be used for the conversion.
   */
  public constructor(
    defaultContext?: TC,
    traits?: ConverterTraits,
    converter: (from: unknown, self: Converter<T, TC>, context?: TC) => Result<T> = StringConverter._convert
  ) {
    super(converter, defaultContext, traits);
  }

  /**
   * @internal
   */
  protected static _convert<T extends string>(from: unknown): Result<T> {
    return typeof from === 'string' ? succeed(from as T) : fail(`Not a string: ${JSON.stringify(from)}`);
  }

  /**
   * @internal
   */
  protected static _wrap<T extends string, TC>(
    wrapped: StringConverter<T, TC>,
    converter: (from: T) => Result<T>,
    traits?: ConverterTraits
  ): StringConverter<T, TC> {
    return new StringConverter<T, TC>(undefined, undefined, (from: unknown) => {
      return wrapped.convert(from).onSuccess(converter);
    })._with(wrapped._traits(traits));
  }

  /**
   * Returns a {@link Conversion.StringConverter | StringConverter} which constrains the result to match
   * a supplied string.
   * @param match - The string to be matched
   * @param options - Optional {@link Conversion.StringMatchOptions} for this conversion.
   * @returns {@link Success} with a matching string or {@link Failure} with an informative
   * error if the string does not match.
   * {@label WITH_STRING}
   */
  public matching(match: string, options?: Partial<StringMatchOptions>): StringConverter<T, TC>;

  /**
   * Returns a {@link Conversion.StringConverter | StringConverter} which constrains the result to match
   * one of a supplied array of strings.
   * @param match - The array of allowed strings.
   * @param options - Optional {@link Conversion.StringMatchOptions} for this conversion.
   * @returns {@link Success} with a matching string or {@link Failure} with an informative
   * error if the string does not match.
   * {@label WITH_ARRAY}
   */
  public matching(match: string[], options?: Partial<StringMatchOptions>): StringConverter<T, TC>;

  /**
   * Returns a {@link Conversion.StringConverter | StringConverter} which constrains the result to match
   * one of a supplied `Set` of strings.
   * @param match - The `Set` of allowed strings.
   * @param options - Optional {@link Conversion.StringMatchOptions} for this conversion.
   * @returns {@link Success} with a matching string or {@link Failure} with an informative
   * error if the string does not match.
   * {@label WITH_SET}
   */
  public matching(match: Set<T>, options?: Partial<StringMatchOptions>): StringConverter<T, TC>;

  /**
   * Returns a {@link Conversion.StringConverter | StringConverter} which constrains the result to match
   * a supplied regular expression.
   * @param match - The regular expression to be used as a constraint.
   * @param options - Optional {@link Conversion.StringMatchOptions} for this conversion
   * @returns {@link Success} with a matching string or {@link Failure} with an informative
   * error if the string does not match.
   * {@label WITH_REGEXP}
   */
  public matching(match: RegExp, options?: Partial<StringMatchOptions>): StringConverter<T, TC>;

  /**
   * Concrete implementation of {@link Conversion.StringConverter.matching#string | StringConverter.matching(string)},
   * {@link Conversion.StringConverter.matching#array | StringConverter.matching(string[])},
   * {@link Conversion.StringConverter.matching#set | StringConverter.matching(Set<string>)}, and
   * {@link Conversion.StringConverter.matching#regexp | StringConverter.matching(RegExp)}.
   * @internal
   */
  public matching(
    match: string | string[] | Set<T> | RegExp,
    options?: Partial<StringMatchOptions>
  ): StringConverter<T, TC> {
    const message = options?.message;
    if (typeof match === 'string') {
      return StringConverter._wrap<T, TC>(this, (from: T) => {
        return match === from
          ? succeed(from as T)
          : fail(message ? `"${from}": ${message}` : `"${from}": does not match "${match}"`);
      });
    } else if (match instanceof RegExp) {
      return StringConverter._wrap<T, TC>(this, (from: T) => {
        return match.test(from)
          ? succeed(from as T)
          : fail(message ? `"${from}": ${message}` : `"${from}": does not match "${match}"`);
      });
    } else if (match instanceof Set) {
      return StringConverter._wrap<T, TC>(this, (from: T) => {
        return match.has(from)
          ? succeed(from as T)
          : fail(message ? `"${from}": ${message}` : `"${from}": not found in set`);
      });
    } else {
      return StringConverter._wrap<T, TC>(this, (from: T) => {
        return match.includes(from)
          ? succeed(from as T)
          : fail(message ? `"${from}": ${message}` : `"${from}": not found in [${match.join(',')}]`);
      });
    }
  }
}
