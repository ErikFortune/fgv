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

import { Result, fail, isKeyOf, succeed } from '../base';
import { TypeGuardWithContext, Validator } from '../validation';
import { BaseConverter, ConverterFunc } from './baseConverter';
import { Converter, OnError } from './converter';
import { FieldConverters, ObjectConverter, ObjectConverterOptions } from './objectConverter';
import { StringConverter } from './stringConverter';

/**
 * Action to take on conversion failures (deprecated - use Conversion.OnError)
 * @public
 * @deprecated use Conversion.OnError.
 */
export { OnError };

/**
 * A converter to convert unknown to string. Values of type
 * string succeed.  Anything else fails.
 * @public
 */
export const string: StringConverter = new StringConverter();

/**
 * Helper function to create a {@link Converter | Converter} which converts `unknown` to one of a set of supplied
 * enumerated values. Anything else fails.
 *
 * @remarks
 * Allowed enumerated values can also be supplied as context at conversion time.
 * @param values - Array of allowed values.
 * @returns A new {@link Converter | Converter} returning `<T>`.
 * @public
 */
export function enumeratedValue<T>(values: T[]): Converter<T, T[]> {
  return new BaseConverter((from: unknown, __self: Converter<T, T[]>, context?: T[]): Result<T> => {
    const v = context ?? values;
    const index = v.indexOf(from as T);
    return index >= 0 ? succeed(v[index]) : fail(`Invalid enumerated value ${JSON.stringify(from)}`);
  });
}

/**
 * Helper function to create a {@link Converter | Converter} which converts `unknown` to one of a set of supplied enumerated
 * values, mapping any of multiple supplied values to the enumeration.
 * @remarks
 * Enables mapping of multiple input values to a consistent internal representation (so e.g. `'y'`, `'yes'`,
 * `'true'`, `1` and `true` can all map to boolean `true`)
 * @param map - An array of tuples describing the mapping. The first element of each tuple is the result
 * value, the second is the set of values that map to the result.  Tuples are evaluated in the order
 * supplied and are not checked for duplicates.
 * @param message - An optional error message.
 * @returns A {@link Converter | Converter} which applies the mapping and yields `<T>` on success.
 * @public
 */
export function mappedEnumeratedValue<T, TC = unknown>(
  map: [T, unknown[]][],
  message?: string
): Converter<T, TC> {
  return new BaseConverter((from: unknown, __self: Converter<T, TC>, __context?: TC) => {
    for (const item of map) {
      if (item[1].includes(from)) {
        return succeed(item[0]);
      }
    }
    return fail(
      message
        ? `${JSON.stringify(from)}: ${message}`
        : `Cannot map '${JSON.stringify(from)}' to a supported value`
    );
  });
}

/**
 * Helper function to create a {@link Converter | Converter} which converts `unknown` to some supplied literal value. Succeeds with
 * the supplied value if an identity comparison succeeds, fails otherwise.
 * @param value - The value to be compared.
 * @returns A {@link Converter | Converter} which returns the supplied value on success.
 * @public
 */
export function literal<T, TC = unknown>(value: T): Converter<T, TC> {
  return new BaseConverter<T, TC>(
    (from: unknown, __self: Converter<T, TC>, __context?: unknown): Result<T> => {
      return from === value
        ? succeed(value)
        : fail(`${JSON.stringify(from)}: does not match ${JSON.stringify(value)}`);
    }
  );
}

/**
 * Deprecated alias for @see literal
 * @param value - The value to be compared.
 * @deprecated Use {@link Converters.literal} instead.
 * @internal
 */
// eslint-disable-next-line @rushstack/typedef-var
export const value = literal;

/**
 * A {@link Converter | Converter} which converts `unknown` to a `number`.
 * @remarks
 * Numbers and strings with a numeric format succeed. Anything else fails.
 * @public
 */
export const number: Converter<number, unknown> = new BaseConverter<number, unknown>((from: unknown) => {
  if (typeof from !== 'number') {
    const num: number = typeof from === 'string' ? Number(from) : NaN;
    return isNaN(num) ? fail(`Not a number: ${JSON.stringify(from)}`) : succeed(num);
  }
  return succeed(from);
});

/**
 * A {@link Converter | Converter} which converts `unknown` to `boolean`.
 * @remarks
 * Boolean values or the case-insensitive strings `'true'` and `'false'` succeed.
 * Anything else fails.
 * @public
 */
export const boolean: Converter<boolean, unknown> = new BaseConverter<boolean, unknown>((from: unknown) => {
  if (typeof from === 'boolean') {
    return succeed(from as boolean);
  } else if (typeof from === 'string') {
    switch (from.toLowerCase()) {
      case 'true':
        return succeed(true);
      case 'false':
        return succeed(false);
    }
  }
  return fail(`Not a boolean: ${JSON.stringify(from)}`);
});

/**
 * A {@link Converter | Converter} which converts an optional `string` value. Values of type
 * `string` are returned.  Anything else returns {@link Success | Success} with value `undefined`.
 * @public
 */
export const optionalString: Converter<string | undefined, unknown> = string.optional();

/**
 * Helper function to create a {@link Converter | Converter} which converts any `string` into an
 * array of `string`, by separating at a supplied delimiter.
 * @remarks
 * Delimiter may also be supplied as context at conversion time.
 * @param delimiter - The delimiter at which to split.
 * @returns A new {@link Converter | Converter} returning `string[]`.
 * @public
 */
export function delimitedString(
  delimiter: string,
  options: 'filtered' | 'all' = 'filtered'
): Converter<string[], string> {
  return new BaseConverter<string[], string>(
    (from: unknown, __self: Converter<string[], string>, context?: string) => {
      const result = string.convert(from);
      if (result.isSuccess()) {
        let strings = result.value.split(context ?? delimiter);
        if (options !== 'all') {
          strings = strings.filter((s) => s.trim().length > 0);
        }
        return succeed(strings);
      }
      return fail(result.message);
    }
  );
}

/**
 * Helper function to create a {@link Converter | Converter} from any {@link Validation.Validator}
 * @param validator - the validator to be wrapped
 * @returns A {@link Converter | Converter} which uses the supplied validator.
 * @public
 */
export function validated<T, TC = unknown>(validator: Validator<T, TC>): Converter<T, TC> {
  return new BaseConverter((from: unknown, __self?: Converter<T, TC>, context?: TC) => {
    return validator.validate(from, context);
  });
}

/**
 * Helper function to create a {@link Converter | Converter} from a supplied {@link Conversion.ConverterFunc | ConverterFunc}.
 * @param convert - the function to be wrapped
 * @returns A {@link Converter | Converter} which uses the supplied function.
 * @public
 */
export function generic<T, TC = unknown>(convert: ConverterFunc<T, TC>): Converter<T, TC> {
  return new BaseConverter(convert);
}

/**
 * Helper function to create a {@link Converter | Converter} from a supplied type guard function.
 * @param description - a description of the thing to be validated for use in error messages
 * @param guard - a {@link Validation.TypeGuardWithContext} which performs the validation.
 * @returns A new {@link Converter | Converter} which validates the values using the supplied type guard
 * and returns them in place.
 * @public
 */
export function isA<T, TC = unknown>(
  description: string,
  guard: TypeGuardWithContext<T, TC>
): Converter<T, TC> {
  return new BaseConverter((from: unknown, __self?: Converter<T, TC>, context?: TC) => {
    if (guard(from, context)) {
      return succeed(from);
    }
    return fail(`invalid ${description} (${JSON.stringify(from)})`);
  });
}

/**
 * A {@link Converter | Converter} which converts an optional `number` value.
 * @remarks
 * Values of type `number` or numeric strings are converted and returned.
 * Anything else returns {@link Success | Success} with value `undefined`.
 * @public
 */
export const optionalNumber: Converter<number | undefined, unknown> = number.optional();

/**
 * A {@link Converter | Converter} to convert an optional `boolean` value.
 * @remarks
 * Values of type `boolean` or strings that match (case-insensitive) `'true'`
 * or `'false'` are converted and returned.  Anything else returns {@link Success | Success}
 * with value `undefined`.
 * @public
 */
export const optionalBoolean: Converter<boolean | undefined, unknown> = boolean.optional();

/**
 * A helper function to create a {@link Converter | Converter} for polymorphic values.
 * Returns a converter which invokes the wrapped converters in sequence, returning the
 * first successful result.  Returns an error if none of the supplied converters can
 * convert the value.
 * @remarks
 * If `onError` is `ignoreErrors` (default), then errors from any of the
 * converters are ignored provided that some converter succeeds.  If
 * onError is `failOnError`, then an error from any converter fails the entire
 * conversion.
 *
 * @param converters - An ordered list of {@link Converter | converters} or {@link Validator | validators}
 * to be considered.
 * @param onError - Specifies treatment of unconvertible elements.
 * @returns A new {@link Converter | Converter} which yields a value from the union of the types returned
 * by the wrapped converters.
 * @public
 */
export function oneOf<T, TC = unknown>(
  converters: Array<Converter<T, TC> | Validator<T, TC>>,
  onError: OnError = 'ignoreErrors'
): Converter<T, TC> {
  return new BaseConverter((from: unknown, __self, context?: TC) => {
    const errors: string[] = [];
    for (const converter of converters) {
      const result = converter.convert(from, context);
      if (result.isSuccess() && result.value !== undefined) {
        return result;
      }

      if (result.isFailure()) {
        if (onError === 'failOnError') {
          return result;
        }
        errors.push(result.message);
      }
    }
    return fail(`No matching converter for ${JSON.stringify(from)}: ${errors.join('\n')}`);
  });
}

/**
 * A helper function to create a {@link Converter | Converter} which converts `unknown` to an array of `<T>`.
 * @remarks
 * If `onError` is `'failOnError'` (default), then the entire conversion fails if any element cannot
 * be converted.  If `onError` is `'ignoreErrors'`, then failing elements are silently ignored.
 * @param converter - {@link Converter | Converter} or {@link Validator | Validator} used to convert each
 * item in the array.
 * @param ignoreErrors - Specifies treatment of unconvertible elements.
 * @returns A {@link Converter | Converter} which returns an array of `<T>`.
 * @public
 */
export function arrayOf<T, TC = unknown>(
  converter: Converter<T, TC> | Validator<T, TC>,
  onError: OnError = 'failOnError'
): Converter<T[], TC> {
  return new BaseConverter((from: unknown, __self: Converter<T[], TC>, context?: TC) => {
    if (!Array.isArray(from)) {
      return fail(`Not an array: ${JSON.stringify(from)}`);
    }

    const successes: T[] = [];
    const errors: string[] = [];
    for (const item of from) {
      const result = converter.convert(item, context);
      if (result.isSuccess() && result.value !== undefined) {
        successes.push(result.value);
      } else if (result.isFailure()) {
        errors.push(result.message);
      }
    }

    return errors.length === 0 || onError === 'ignoreErrors' ? succeed(successes) : fail(errors.join('\n'));
  });
}

/**
 * {@link Converter | Converter} to convert an `unknown` to an array of `string`.
 * @remarks
 * Returns {@link Success | Success} with the the supplied value if it as an array
 * of strings, returns {@link Failure | Failure} with an error message otherwise.
 * @public
 */
export const stringArray: Converter<string[], unknown> = arrayOf(string);

/**
 * {@link Converter | Converter} to convert an `unknown` to an array of `number`.
 * @remarks
 * Returns {@link Success | Success} with the the supplied value if it as an array
 * of numbers, returns {@link Failure | Failure} with an error message otherwise.
 * @public
 */
export const numberArray: Converter<number[], unknown> = arrayOf(number);

/**
 * Options for {@link Converters.(recordOf:3) | Converters.recordOf} and
 * {@link Converters.(mapOf:3) | Converters.mapOf}
 * helper functions.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface KeyedConverterOptions<T extends string = string, TC = unknown> {
  /**
   * if `onError` is `'fail'` (default), then the entire conversion fails if any key or element
   * cannot be converted.  If `onError` is `'ignore'`, failing elements are silently ignored.
   */
  onError?: 'fail' | 'ignore';
  /**
   * If present, `keyConverter` is used to convert the source object property names to
   * keys in the resulting map or record.
   * @remarks
   * Can be used to coerce key names to supported values and/or strong types.
   */
  keyConverter?: Converter<T, TC> | Validator<T, TC>;
}

/**
 * A helper function to create a {@link Converter | Converter} which converts the `string`-keyed
 * properties using a supplied {@link Converter | Converter<T, TC>} or {@link Validator | Validator<T>} to
 * produce a `Record<string, T>`.
 * @remarks
 * The resulting converter fails conversion if any element cannot be converted.
 * @param converter - {@link Converter | Converter} or {@link Validator | Validator} used for each
 * item in the source object.
 * @returns A {@link Converter | Converter} which returns `Record<string, T>`.
 * {@label WITH_DEFAULT}
 * @public
 */
export function recordOf<T, TC = unknown, TK extends string = string>(
  converter: Converter<T, TC> | Validator<T, TC>
): Converter<Record<TK, T>, TC>;

/**
 * A helper function to create a {@link Converter | Converter} which converts the `string`-keyed properties
 * using a supplied {@link Converter | Converter<T, TC>} or {@link Validator | Validator<T>} to produce a
 * `Record<string, T>` and optionally specified handling of elements that cannot be converted.
 * @remarks
 * if `onError` is `'fail'` (default), then the entire conversion fails if any key or element
 * cannot be converted.  If `onError` is `'ignore'`, failing elements are silently ignored.
 * @param converter - {@link Converter | Converter} or {@link Validator | Validator} for each item in
 * the source object.
 * @returns A {@link Converter | Converter} which returns `Record<string, T>`.
 * {@label WITH_ON_ERROR}
 * @public
 */
export function recordOf<T, TC = unknown, TK extends string = string>(
  converter: Converter<T, TC> | Validator<T, TC>,
  onError: 'fail' | 'ignore'
): Converter<Record<TK, T>, TC>;

/**
 * A helper function to create a {@link Converter | Converter} or which converts the `string`-keyed properties
 * using a supplied {@link Converter | Converter<T, TC>} or {@link Validator | Validator<T>} to produce a
 * `Record<TK, T>`.
 * @remarks
 * If present, the supplied {@link Converters.KeyedConverterOptions | options} can provide a strongly-typed
 * converter for keys and/or control the handling of elements that fail conversion.
 * @param converter - {@link Converter | Converter} or {@link Validator | Validator} used for each item in the source object.
 * @param options - Optional {@link Converters.KeyedConverterOptions | KeyedConverterOptions<TK, TC>} which
 * supplies a key converter and/or error-handling options.
 * @returns A {@link Converter | Converter} which returns `Record<TK, T>`.
 * {@label WITH_OPTIONS}
 * @public
 */
export function recordOf<T, TC = unknown, TK extends string = string>(
  converter: Converter<T, TC> | Validator<T, TC>,
  options: KeyedConverterOptions<TK, TC>
): Converter<Record<TK, T>, TC>;

/**
 * Concrete implementation of {@link Converters.(recordOf:1) | Converters.recordOf(Converter<T, TC>)},
 * {@link Converters.(recordOf:2) | Converters.recordOf(Converter<T, TC>, 'fail' or 'ignore')}, and
 * {@link Converters.(recordOf:3) | Converters.recordOf(Converter<T, TC>, KeyedConverterOptions)}.
 * @internal
 */
export function recordOf<T, TC = unknown, TK extends string = string>(
  converter: Converter<T, TC> | Validator<T, TC>,
  option: 'fail' | 'ignore' | KeyedConverterOptions<TK, TC> = 'fail'
): Converter<Record<TK, T>, TC> {
  const options: KeyedConverterOptions<TK, TC> =
    typeof option === 'string' ? { onError: option } : { onError: 'fail', ...option };
  return new BaseConverter((from: unknown, __self: Converter<Record<TK, T>, TC>, context?: TC) => {
    if (typeof from !== 'object' || from === null || Array.isArray(from)) {
      return fail(`Not a string-keyed object: ${JSON.stringify(from)}`);
    }

    const record: Record<string, T> = {};
    const errors: string[] = [];

    for (const key in from) {
      if (isKeyOf(key, from)) {
        const writeKeyResult = options.keyConverter?.convert(key, context) ?? succeed(key);

        writeKeyResult
          .onSuccess((writeKey) => {
            return converter.convert(from[key] as unknown, context).onSuccess((value) => {
              record[writeKey] = value;
              return succeed(true);
            });
          })
          .onFailure((message) => {
            errors.push(message);
            return fail(message);
          });
      }
    }

    return errors.length === 0 || options.onError === 'ignore' ? succeed(record) : fail(errors.join('\n'));
  });
}

/**
 * A helper function to create a {@link Converter | Converter} which converts the `string`-keyed properties
 * using a supplied {@link Converter | Converter<T, TC>} or {@link Validator | Validator<T>} to produce a
 * `Map<string, T>`.
 * @remarks
 * The resulting converter fails conversion if any element cannot be converted.
 * @param converter - {@link Converter | Converter} | {@link Validator | Validator} used for each item in
 * the source object.
 * @returns A {@link Converter | Converter} which returns `Map<string, T>`.
 * {@label WITH_DEFAULT}
 * @public
 */
export function mapOf<T, TC = unknown, TK extends string = string>(
  converter: Converter<T, TC> | Validator<T, TC>
): Converter<Map<TK, T>, TC>;

/**
 * A helper function to create a {@link Converter | Converter} which converts the `string`-keyed properties
 * using a supplied {@link Converter | Converter<T, TC>} or {@link Validator | Validator<T>} to produce a
 * `Map<string, T>` and specified handling of elements that cannot be converted.
 * @remarks
 * if `onError` is `'fail'` (default), then the entire conversion fails if any key or element
 * cannot be converted.  If `onError` is `'ignore'`, failing elements are silently ignored.
 * @param converter - {@link Converter | Converter} or {@link Validator | Validator} used for
 * each item in the source object.
 * @returns A {@link Converter | Converter} which returns `Map<string, T>`.
 * {@label WITH_ON_ERROR}
 * @public
 */
export function mapOf<T, TC = unknown, TK extends string = string>(
  converter: Converter<T, TC> | Validator<T, TC>,
  onError: 'fail' | 'ignore'
): Converter<Map<TK, T>, TC>;

/**
 * A helper function to create a {@link Converter | Converter} which converts the `string`-keyed properties
 * using a supplied {@link Converter | Converter<T, TC>} or {@link Validator | Validator<T>} to produce
 * a `Map<TK,T>`.
 * @remarks
 * If present, the supplied {@link Converters.KeyedConverterOptions | options} can provide a strongly-typed
 * converter for keys and/or control the handling of elements that fail conversion.
 * @param converter - {@link Converter | Converter} or {@link Validator | Validator} used for each item
 * in the source object.
 * @param options - Optional {@link Converters.KeyedConverterOptions | KeyedConverterOptions<TK, TC>} which
 * supplies a key converter and/or error-handling options.
 * @returns A {@link Converter | Converter} which returns `Map<TK,T>`.
 * {@label WITH_OPTIONS}
 * @public
 */
export function mapOf<T, TC = unknown, TK extends string = string>(
  converter: Converter<T, TC> | Validator<T, TC>,
  options: KeyedConverterOptions<TK, TC>
): Converter<Map<TK, T>, TC>;

/**
 * Concrete implementation of {@link Converters.(mapOf:1) | Converters.mapOf(Converter<T, TC>)},
 * {@link Converters.(mapOf:2) | Converters.mapOf(Converter<T, TC>, 'fail' or 'ignore')}, and
 * {@link Converters.(mapOf:3) | Converters.mapOf(Converter<T, TC>, KeyedConverterOptions)}.
 * @internal
 */
export function mapOf<T, TC = unknown, TK extends string = string>(
  converter: Converter<T, TC> | Validator<T, TC>,
  option: 'fail' | 'ignore' | KeyedConverterOptions<TK, TC> = 'fail'
): Converter<Map<TK, T>, TC> {
  const options = typeof option === 'string' ? { onError: option } : { onError: 'fail', ...option };
  return new BaseConverter((from: unknown, __self: Converter<Map<TK, T>, TC>, context?: TC) => {
    if (typeof from !== 'object' || from === null || Array.isArray(from)) {
      return fail(`Not a string-keyed object: ${JSON.stringify(from)}`);
    }

    const map = new Map<TK, T>();
    const errors: string[] = [];

    for (const key in from) {
      if (isKeyOf(key, from)) {
        const writeKeyResult = options.keyConverter?.convert(key, context) ?? succeed(key);

        writeKeyResult
          .onSuccess((writeKey) => {
            return converter.convert(from[key] as unknown, context).onSuccess((value) => {
              map.set(writeKey, value);
              return succeed(true);
            });
          })
          .onFailure((message) => {
            errors.push(message);
            return fail(message);
          });
      }
    }

    return errors.length === 0 || options.onError === 'ignore' ? succeed(map) : fail(errors.join('\n'));
  });
}

/**
 * Helper function to create  a {@link Converter | Converter} which validates that a supplied value is
 * of a type validated by a supplied validator function and returns it.
 * @remarks
 * If `validator` succeeds, this {@link Converter | Converter} returns {@link Success | Success} with the supplied
 * value of `from` coerced to type `<T>`.  Returns a {@link Failure | Failure} with additional
 * information otherwise.
 * @param validator - A validator function to determine if the converted value is valid.
 * @param description - A description of the validated type for use in error messages.
 * @returns A new {@link Converter | Converter<T, TC>} which applies the supplied validation.
 * @public
 */
export function validateWith<T, TC = unknown>(
  validator: (from: unknown) => from is T,
  description?: string
): Converter<T, TC> {
  return new BaseConverter((from: unknown, __self: Converter<T, TC>, __context?: TC) => {
    if (validator(from)) {
      return succeed(from);
    }
    return fail(`${JSON.stringify(from)}: invalid ${description ?? 'value'}`);
  });
}

/**
 * A helper function to create a {@link Converter | Converter} which extracts and converts an element from an array.
 * @remarks
 * The returned {@link Converter | Converter} returns {@link Success | Success} with the converted value if the element exists
 * in the supplied array and can be converted. Returns {@link Failure | Failure} with an error message otherwise.
 * @param index - The index of the element to be extracted.
 * @param converter - A {@link Converter | Converter} or {@link Validator | Validator} for the extracted element.
 * @returns A {@link Converter | Converter<T, TC>} which extracts the specified element from an array.
 * @public
 */
export function element<T, TC = unknown>(
  index: number,
  converter: Converter<T, TC> | Validator<T, TC>
): Converter<T, TC> {
  return new BaseConverter((from: unknown, __self: Converter<T, TC>, context?: TC) => {
    if (index < 0) {
      return fail(`${index}: cannot convert for a negative element index`);
    } else if (!Array.isArray(from)) {
      return fail('element converter: source is not an array');
    } else if (index >= from.length) {
      return fail(`${index}: element converter index out of range (0..${from.length - 1})`);
    }
    return converter.convert(from[index], context);
  });
}

/**
 * A helper function to create a {@link Converter | Converter} which extracts and converts an optional element from an array.
 * @remarks
 * The resulting {@link Converter | Converter} returns {@link Success | Success} with the converted value if the element exists
 * in the supplied array and can be converted. Returns {@link Success | Success} with value `undefined` if the parameter
 * is an array but the index is out of range. Returns {@link Failure | Failure} with a message if the supplied parameter
 * is not an array, if the requested index is negative, or if the element cannot be converted.
 * @param index - The index of the element to be extracted.
 * @param converter - A {@link Converter | Converter} or {@link Validator | Validator} used for the extracted element.
 * @returns A {@link Converter | Converter<T, TC>} which extracts the specified element from an array.
 * @public
 */
export function optionalElement<T, TC = unknown>(
  index: number,
  converter: Converter<T, TC> | Validator<T, TC>
): Converter<T | undefined, TC> {
  return new BaseConverter((from: unknown, __self: Converter<T | undefined, TC>, context?: TC) => {
    if (index < 0) {
      return fail(`${index}: cannot convert for a negative element index`);
    } else if (!Array.isArray(from)) {
      return fail('element converter: source is not an array');
    } else if (index >= from.length) {
      return succeed(undefined);
    }
    return converter.convert(from[index], context);
  });
}

/**
 * A helper function to create a {@link Converter | Converter} which extracts and convert a property specified
 * by name from an object.
 * @remarks
 * The resulting {@link Converter | Converter} returns {@link Success | Success} with the converted value of the corresponding
 * object property if the field exists and can be converted. Returns {@link Failure | Failure} with an error message
 * otherwise.
 * @param name - The name of the field to be extracted.
 * @param converter - {@link Converter | Converter}  or {@link Validator | Validator} to use for the extracted
 * field.
 * @public
 */
export function field<T, TC = unknown>(
  name: string,
  converter: Converter<T, TC> | Validator<T, TC>
): Converter<T, TC> {
  return new BaseConverter((from: unknown, __self: Converter<T, TC>, context?: TC) => {
    if (typeof from === 'object' && !Array.isArray(from) && from !== null) {
      if (isKeyOf(name, from)) {
        return converter.convert(from[name], context).onFailure((message) => {
          return fail(`Field ${name}: ${message}`);
        });
      }
      return fail(`Field ${name} not found in: ${JSON.stringify(from)}`);
    }
    return fail(`Cannot convert field "${name}" from non-object ${JSON.stringify(from)}`);
  });
}

/**
 * A helper function to create a {@link Converter | Converter} which extracts and convert a property specified
 * by name from an object.
 * @remarks
 * The resulting {@link Converter | Converter} returns {@link Success | Success} with the converted value of
 * the corresponding object property if the field exists and can be converted. Returns {@link Success | Success}
 * with `undefined` if the supplied parameter is an object but the named field is not present.
 * Returns {@link Failure | Failure} with an error message otherwise.
 * @param name - The name of the field to be extracted.
 * @param converter - {@link Converter | Converter} or {@link Validator | Validator} to use for the extracted field.
 * @public
 */
export function optionalField<T, TC = unknown>(
  name: string,
  converter: Converter<T, TC> | Validator<T, TC>
): Converter<T | undefined, TC> {
  return new BaseConverter(
    (from: unknown, __self: Converter<T | undefined, TC>, context?: TC) => {
      if (typeof from === 'object' && !Array.isArray(from) && from !== null) {
        if (isKeyOf(name, from)) {
          const result = converter.convert(from[name], context).onFailure((message) => {
            return fail(`${name}: ${message}`);
          });

          // if conversion was successful or input was undefined we
          // succeed with 'undefined', but we propagate actual
          // failures.
          if (result.isSuccess() || from[name] !== undefined) {
            return result;
          }
        }
        return succeed(undefined);
      }
      return fail(`Cannot convert field "${name}" from non-object ${JSON.stringify(from)}`);
    },
    undefined,
    { isOptional: true }
  );
}

/**
 * Helper function to create a {@link Conversion.ObjectConverter | ObjectConverter<T, TC>} which converts an object
 * without changing shape, given a {@link Conversion.FieldConverters | FieldConverters<T, TC>} and an optional
 * {@link Conversion.ObjectConverterOptions | ObjectConverterOptions<T>} to further refine conversion behavior.
 * @remarks
 * By default, if all of the requested fields exist and can be converted, returns {@link Success | Success}
 * with a new object that contains the converted values under the original key names.  If any required properties
 * do not exist or cannot be converted, the entire conversion fails, returning {@link Failure | Failure} with additional
 * error information.
 *
 * Fields that succeed but convert to undefined are omitted from the result object but do not
 * fail the conversion.
 * @param properties - An {@link Conversion.FieldConverters | FieldConverters<T, TC>} defining the shape of the
 * source object and {@link Converter | converters} to be applied to each properties.
 * @param options - An {@link Conversion.ObjectConverterOptions | ObjectConverterOptions<T>} containing options
 * for the object converter.
 * @returns A new {@link Conversion.ObjectConverter | ObjectConverter} which applies the specified conversions.
 * {@label WITH_OPTIONS}
 * @public
 */
export function object<T, TC = unknown>(
  properties: FieldConverters<T, TC>,
  options?: ObjectConverterOptions<T>
): ObjectConverter<T, TC>;

/**
 * Helper function to create a {@link Conversion.ObjectConverter | ObjectConverter<T, TC>} which converts an object
 * without changing shape, given a {@link Conversion.FieldConverters | FieldConverters<T, TC>} and a set of
 * optional properties.
 * @remarks
 * By default, if all of the requested fields exist and can be converted, returns {@link Success | Success}
 * with a new object that contains the converted values under the original key names.  If any required properties
 * do not exist or cannot be converted, the entire conversion fails, returning {@link Failure | Failure} with additional
 * error information.
 *
 * Fields that succeed but convert to undefined are omitted from the result object but do not
 * fail the conversion.
 * @param properties - An {@link Conversion.FieldConverters | FieldConverters<T, TC>} defining the shape of the
 * source object and {@link Converter | converters} to be applied to each properties.
 * @param optional - An array of `(keyof T)` listing the keys to be considered optional.
 * {@label WITH_KEYS}
 * @returns A new {@link Conversion.ObjectConverter | ObjectConverter} which applies the specified conversions.
 * @public
 * @deprecated Use {@link Converters.(object:1) | Converters.object(fields, options)} instead.
 */

export function object<T, TC = unknown>(
  properties: FieldConverters<T, TC>,
  optional: (keyof T)[]
): ObjectConverter<T, TC>;

/**
 * Concrete implementation of {@link Converters.(object:1) | Converters.object(fields, options)}
 * and {@link Converters.(object:2) | Converters.objects(fields, optionalKeys)}.
 * @internal
 */
export function object<T, TC>(
  properties: FieldConverters<T, TC>,
  options?: (keyof T)[] | ObjectConverterOptions<T>
): ObjectConverter<T, TC> {
  return new ObjectConverter(properties, options as ObjectConverterOptions<T>);
}

/**
 * Options for the {@link Converters.(strictObject:1)} helper function.
 * @public
 */
export type StrictObjectConverterOptions<T> = Omit<ObjectConverterOptions<T>, 'strict'>;

/**
 * Helper function to create a {@link Conversion.ObjectConverter | ObjectConverter} which converts an object
 * without changing shape, a {@link Conversion.FieldConverters | FieldConverters<T, TC>} and an optional
 * {@link Converters.StrictObjectConverterOptions | StrictObjectConverterOptions<T>} to further refine
 * conversion behavior.
 *
 * @remarks
 * Fields that succeed but convert to undefined are omitted from the result object but do not
 * fail the conversion.
 *
 * The conversion fails if any unexpected fields are encountered.
 *
 * @param properties - An object containing defining the shape and converters to be applied.
 * @param options - An optional @see StrictObjectConverterOptions<T> containing options for the object converter.
 * @returns A new {@link Conversion.ObjectConverter | ObjectConverter} which applies the specified conversions.
 * {@label WITH_OPTIONS}
 * @public
 */
export function strictObject<T, TC = unknown>(
  properties: FieldConverters<T, TC>,
  options?: StrictObjectConverterOptions<T>
): ObjectConverter<T, TC>;

/**
 * Helper function to create a {@link Conversion.ObjectConverter | ObjectConverter} which converts an object
 * without changing shape, a {@link Conversion.FieldConverters | FieldConverters<T, TC>} and an optional
 * {@link Converters.StrictObjectConverterOptions | StrictObjectConverterOptions<T>} to further refine
 * conversion behavior.
 *
 * @remarks
 * Fields that succeed but convert to undefined are omitted from the result object but do not
 * fail the conversion.
 *
 * The conversion fails if any unexpected fields are encountered.
 *
 * @param properties - An object containing defining the shape and converters to be applied.
 * @param optional - An array of `keyof T` containing keys to be considered optional.
 * @returns A new {@link Conversion.ObjectConverter | ObjectConverter} which applies the specified conversions.
 * {@label WITH_KEYS}
 * @deprecated Use {@link Converters.(strictObject:1) | Converters.strictObject(options)} instead.
 * @public
 */
export function strictObject<T, TC = unknown>(
  properties: FieldConverters<T, TC>,
  optional: (keyof T)[]
): ObjectConverter<T, TC>;

/**
 * Concrete implementation for {@link Converters.(strictObject:1) | Converters.strictObject(fields, options)}
 * and {@link Converters.strictObject | Converters.strictObject(fields, optional)}.
 * @internal
 */
export function strictObject<T, TC = unknown>(
  properties: FieldConverters<T, TC>,
  opt?: (keyof T)[] | StrictObjectConverterOptions<T>
): ObjectConverter<T, TC> {
  /* c8 ignore next 2 */
  const options: ObjectConverterOptions<T> =
    opt && Array.isArray(opt) ? { strict: true, optionalFields: opt } : { ...(opt ?? {}), strict: true };
  return new ObjectConverter<T, TC>(properties, options);
}

/**
 * A string-keyed `Record<string, Converter>` which maps specific {@link Converter | converters} or
 * {@link Validator | Validators} to the value of a discriminator property.
 * @public
 */
export type DiscriminatedObjectConverters<T, TD extends string = string, TC = unknown> = Record<
  TD,
  Converter<T, TC> | Validator<T, TC>
>;

/**
 * Helper to create a {@link Converter | Converter} which converts a discriminated object without changing shape.
 * @remarks
 * Takes the name of the discriminator property and a
 * {@link Converters.DiscriminatedObjectConverters | string-keyed Record of converters and validators}. During conversion,
 * the resulting {@link Converter | Converter} invokes the converter from `converters` that corresponds to the value of
 * the discriminator property in the source object.
 *
 * If the source is not an object, the discriminator property is missing, or the discriminator has
 * a value not present in the converters, conversion fails and returns {@link Failure | Failure} with more information.
 * @param discriminatorProp - Name of the property used to discriminate types.
 * @param converters - {@link Converters.DiscriminatedObjectConverters | String-keyed record of converters and validators}
 * to invoke, where each key corresponds to a value of the discriminator property.
 * @returns A {@link Converter | Converter} which converts the corresponding discriminated object.
 * @public
 */
export function discriminatedObject<T, TD extends string = string, TC = unknown>(
  discriminatorProp: string,
  converters: DiscriminatedObjectConverters<T, TD>
): Converter<T, TC> {
  return new BaseConverter((from: unknown) => {
    if (typeof from !== 'object' || Array.isArray(from) || from === null) {
      return fail(`Not a discriminated object: "${JSON.stringify(from)}"`);
    }
    if (!isKeyOf(discriminatorProp, from) || !from[discriminatorProp]) {
      return fail(`Discriminator property ${discriminatorProp} not present in "${JSON.stringify(from)}"`);
    }

    const discriminatorValue = from[discriminatorProp] as TD;
    const converter = converters[discriminatorValue];
    if (converter === undefined) {
      return fail(`No converter for discriminator ${discriminatorProp}="${discriminatorValue}"`);
    }
    return converter.convert(from);
  });
}

/**
 * Helper to create a {@link Converter | Converter} which converts a source object to a new object with a
 * different shape.
 *
 * @remarks
 * On successful conversion, the resulting {@link Converter | Converter} returns {@link Success | Success} with a new
 * object, which contains the converted values under the key names specified at initialization time.
 * It returns {@link Failure | Failure} with an error message if any fields to be extracted do not exist
 * or cannot be converted.
 *
 * Fields that succeed but convert to undefined are omitted from the result object but do not
 * fail the conversion.
 *
 * @param properties - An object with key names that correspond to the target object and an
 * appropriate {@link Conversion.FieldConverters | FieldConverter} which extracts and converts
 * a single filed from the source object.
 * @returns A {@link Converter | Converter} with the specified conversion behavior.
 * @public
 */
export function transform<T, TC = unknown>(properties: FieldConverters<T, TC>): Converter<T, TC> {
  return new BaseConverter((from: unknown, __self, context?: TC) => {
    // eslint bug thinks key is used before defined
    // eslint-disable-next-line no-use-before-define
    const converted = {} as { [key in keyof T]: T[key] };
    const errors: string[] = [];

    for (const key in properties) {
      if (properties[key]) {
        const result = properties[key].convert(from, context);
        if (result.isSuccess() && result.value !== undefined) {
          converted[key] = result.value;
        } else if (result.isFailure()) {
          errors.push(result.message);
        }
      }
    }

    return errors.length === 0 ? succeed(converted) : fail(errors.join('\n'));
  });
}

/**
 * Per-property converters and configuration for each field in the destination object of
 * a {@link Converters.transformObject} call.
 * @public
 */
export type FieldTransformers<TSRC, TDEST, TC = unknown> = {
  [key in keyof TDEST]: {
    /**
     * The name of the property in the source object to be converted.
     */
    from: keyof TSRC;
    /**
     * The converter or validator used to convert the property.
     */
    converter: Converter<TDEST[key], TC> | Validator<TDEST[key], TC>;
    /**
     * If `true` then a missing source property is ignored.  If `false` or omitted
     * then a missing source property causes an error.
     */
    optional?: boolean;
  };
};

/**
 * Options for a {@link Converters.transformObject} call.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface TransformObjectOptions<TSRC> {
  /**
   * If `strict` is `true` then unused properties in the source object cause
   * an error, otherwise they are ignored.
   */
  strict: true;

  /**
   * An optional list of source properties to be ignored when strict mode
   * is enabled.
   */
  ignore?: (keyof TSRC)[];

  /**
   * An optional description of this transform to be used for error messages.
   */
  description?: string;
}

/**
 * Helper to create a strongly-typed {@link Converter | Converter} which converts a source object to a
 * new object with a different shape.
 *
 * @remarks
 * On successful conversion, the resulting {@link Converter | Converter} returns {@link Success | Success} with a new
 * object, which contains the converted values under the key names specified at initialization time.
 *
 * It returns {@link Failure | Failure} with an error message if any fields to be extracted do not exist
 * or cannot be converted.
 *
 * @param destinationFields - An object with key names that correspond to the target object and an
 * appropriate {@link Converters.FieldTransformers | FieldTransformers} which specifies the name
 * of the corresponding property in the source object, the converter or validator used for each source
 * property and any other configuration to guide the conversion.
 * @param options - Options which affect the transformation.
 *
 * @returns A {@link Converter | Converter} with the specified conversion behavior.
 * @public
 */
export function transformObject<TSRC, TDEST, TC = unknown>(
  destinationFields: FieldTransformers<TSRC, TDEST, TC>,
  options?: TransformObjectOptions<TSRC>
): Converter<TDEST, TC> {
  return new BaseConverter((from: unknown, __self, context?: TC) => {
    // eslint bug thinks key is used before defined
    // eslint-disable-next-line no-use-before-define
    const converted = {} as { [key in keyof TDEST]: TDEST[key] };
    const errors: string[] = [];
    const used: Set<keyof TSRC> = new Set(options?.ignore);

    if (typeof from === 'object' && !Array.isArray(from) && from !== null) {
      for (const destinationKey in destinationFields) {
        if (destinationFields[destinationKey]) {
          const srcKey = destinationFields[destinationKey].from;
          const converter = destinationFields[destinationKey].converter;

          if (isKeyOf(srcKey, from)) {
            const result = converter.convert(from[srcKey], context);
            if (result.isSuccess() && result.value !== undefined) {
              converted[destinationKey] = result.value;
            } else if (result.isFailure()) {
              errors.push(`${srcKey}->${destinationKey}: ${result.message}`);
            }
            used.add(srcKey);
          } else if (destinationFields[destinationKey].optional !== true) {
            errors.push(`${String(srcKey)}: required property missing in source object.`);
          }
        }
      }

      if (options?.strict === true) {
        for (const key in from) {
          if (isKeyOf(key, from) && !used.has(key as keyof TSRC)) {
            errors.push(`${key}: unexpected property in source object`);
          }
        }
      }
    } else {
      errors.push('source is not an object');
    }

    return errors.length === 0
      ? succeed(converted)
      : fail(options?.description ? `${options.description}:\n  ${errors.join('\n  ')}` : errors.join('\n'));
  });
}
