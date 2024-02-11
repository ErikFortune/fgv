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

import { DetailedResult, Result, fail, succeed } from './result';

/**
 * Aggregates successful result values from a collection of {@link Result | Result<T>}.
 * @param results - The collection of {@link Result | Result<T>} to be mapped.
 * @param aggregatedErrors  - Optional string array to which any error messages will be
 * appended.  Each error is appended as an individual string.
 * @returns  If all {@link Result | results} are successful, returns {@link Success} with an
 * array containing all returned values.  If any {@link Result | results} failed, returns
 * {@link Failure} with a concatenated summary of all error messages.
 * @public
 */
export function mapResults<T>(results: Iterable<Result<T>>, aggregatedErrors?: string[]): Result<T[]> {
  const errors: string[] = [];
  const elements: T[] = [];

  for (const result of results) {
    if (result.isSuccess()) {
      elements.push(result.value);
    } else {
      errors.push(result.message);
    }
  }

  if (errors.length > 0) {
    aggregatedErrors?.push(...errors);
    return fail(errors.join('\n'));
  }
  return succeed(elements);
}

/**
 * Aggregates successful results from a collection of {@link DetailedResult | DetailedResult<T, TD>},
 * optionally ignoring certain error details.
 * @param results - The collection of {@link DetailedResult | DetailedResult<T, TD>} to be mapped.
 * @param ignore - An array of error detail values (of type `<TD>`) that should be ignored.
 * @param aggregatedErrors  - Optional string array to which any non-ignorable error messages will be
 * appended.  Each error is appended as an individual string.
 * @returns {@link Success} with an array containing all successful results if all results either
 * succeeded or returned error details listed in `ignore`.  If any results failed with details
 * that cannot be ignored, returns {@link Failure} with an concatenated summary of all non-ignorable
 * error messages.
 * @public
 */
export function mapDetailedResults<T, TD>(
  results: Iterable<DetailedResult<T, TD>>,
  ignore: TD[],
  aggregatedErrors?: string[]
): Result<T[]> {
  const errors: string[] = [];
  const elements: T[] = [];

  for (const result of results) {
    if (result.isSuccess()) {
      elements.push(result.value);
    } else if (!ignore.includes(result.detail)) {
      errors.push(result.message);
    }
  }

  if (errors.length > 0) {
    aggregatedErrors?.push(...errors);
    return fail(errors.join('\n'));
  }
  return succeed(elements);
}

/**
 * Aggregates successful results from a a collection of {@link Result | Result<T>}.
 * @param results - An `Iterable` of {@link Result | Result<T>} from which success
 * results are to be aggregated.
 * @param aggregatedErrors  - Optional string array to which any returned error messages will be
 * appended.  Each error is appended as an individual string.
 * @returns {@link Success} with an array of `<T>` if any results were successful. If
 * all {@link Result | results} failed, returns {@link Failure} with a concatenated
 * summary of all error messages.
 * @public
 */
export function mapSuccess<T>(results: Iterable<Result<T>>, aggregatedErrors?: string[]): Result<T[]> {
  const errors: string[] = [];
  const elements: T[] = [];

  for (const result of results) {
    if (result.isSuccess()) {
      elements.push(result.value);
    } else {
      errors.push(result.message);
    }
  }

  if (elements.length === 0 && errors.length > 0) {
    aggregatedErrors?.push(...errors);
    return fail(errors.join('\n'));
  }
  return succeed(elements);
}

/**
 * Aggregates error messages from a collection of {@link Result | Result<T>}.
 * @param results - An iterable collection of {@link Result | Result<T>} for which
 * error messages are aggregated.
 * @param aggregatedErrors  - Optional string array to which any returned error messages will be
 * appended.  Each error is appended as an individual string.
 * @returns An array of strings consisting of all error messages returned by
 * {@link Result | results} in the source collection. Ignores {@link Success}
 * results and returns an empty array if there were no errors.
 * @public
 */
export function mapFailures<T>(results: Iterable<Result<T>>, aggregatedErrors?: string[]): string[] {
  const errors: string[] = [];
  for (const result of results) {
    if (result.isFailure()) {
      errors.push(result.message);
      aggregatedErrors?.push(result.message);
    }
  }
  return errors;
}

/**
 * Determines if an iterable collection of {@link Result | Result<T>} were all successful.
 * @param results - The collection of {@link Result | Result<T>} to be tested.
 * @param successValue - The value to be returned if results are successful.
 * @param aggregatedErrors  - Optional string array to which any returned error messages will be
 * appended.  Each error is appended as an individual string.
 * @returns Returns {@link Success} with `successValue` if all {@link Result | results} are successful.
 * If any are unsuccessful, returns {@link Failure} with a concatenated summary of the error
 * messages from all failed elements.
 * @public
 */
export function allSucceed<T>(
  results: Iterable<Result<unknown>>,
  successValue: T,
  aggregatedErrors?: string[]
): Result<T> {
  const errors: string[] = [];

  if (results !== undefined) {
    for (const result of results) {
      if (result.isFailure()) {
        errors.push(result.message);
      }
    }
  }

  if (errors.length > 0) {
    aggregatedErrors?.push(...errors);
    return fail(errors.join('\n'));
  }
  return succeed(successValue);
}

/**
 * String-keyed record of initialization functions to be passed to {@link (populateObject:1)}
 * or {@link (populateObject:2)}.
 * @public
 */
export type FieldInitializers<T> = { [key in keyof T]: (state: Partial<T>) => Result<T[key]> };

/**
 * Options for the {@link (populateObject:1)} function.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface PopulateObjectOptions<T> {
  /**
   * If present, specifies the order in which property values should
   * be evaluated.  Any keys not listed are evaluated after all listed
   * keys in indeterminate order.  If 'order' is not present, keys
   * are evaluated in indeterminate order.
   */
  order?: (keyof T)[];

  /**
   * Specify handling of `undefined` values.  By default, successful
   * `undefined` results are written to the result object.  If this value
   * is `true` then `undefined` results are suppressed for all properties.
   * If this value is an array of property keys then `undefined` results
   * are suppressed for those properties only.
   */
  suppressUndefined?: boolean | (keyof T)[];
}

/**
 * Populates an an object based on a prototype full of field initializers that return {@link Result | Result<T[key]>}.
 * Returns {@link Success} with the populated object if all initializers succeed, or {@link Failure} with a
 * concatenated list of all error messages.
 * @param initializers - An object with the shape of the target but with initializer functions for
 * each property.
 * @param options - An optional {@link PopulateObjectOptions | set of options} which
 * modify the behavior of this call.
 * @param aggregatedErrors  - Optional string array to which any returned error messages will be
 * appended.  Each error is appended as an individual string.
 * {@label WITH_OPTIONS}
 * @public
 */
export function populateObject<T>(
  initializers: FieldInitializers<T>,
  options?: PopulateObjectOptions<T>,
  aggregatedErrors?: string[]
): Result<T>;

/**
 * Populates an an object based on a prototype full of field initializers that return {@link Result | Result<T[key]>}.
 * Returns {@link Success} with the populated object if all initializers succeed, or {@link Failure} with a
 * concatenated list of all error messages.
 * @param initializers - An object with the shape of the target but with initializer functions for
 * each property.
 * @param order - Optional order in which keys should be written.
 * @param aggregatedErrors  - Optional string array to which any returned error messages will be
 * appended.  Each error is appended as an individual string.
 * @public
 * {@label WITH_ORDER}
 * @deprecated Pass {@link PopulateObjectOptions} instead.
 */
export function populateObject<T>(
  initializers: FieldInitializers<T>,
  order: (keyof T)[] | undefined,
  aggregatedErrors?: string[]
): Result<T>;
export function populateObject<T>(
  initializers: FieldInitializers<T>,
  optionsOrOrder?: PopulateObjectOptions<T> | (keyof T)[],
  aggregatedErrors?: string[]
): Result<T> {
  const options: PopulateObjectOptions<T> = optionsOrOrder
    ? Array.isArray(optionsOrOrder)
      ? { order: optionsOrOrder }
      : optionsOrOrder
    : {};
  const state = {} as { [key in keyof T]: T[key] };
  const errors: string[] = [];
  const keys: (keyof T)[] = Array.from(options.order ?? []);
  const foundKeys = new Set<keyof T>(options.order);

  // start with the supplied order then append anything else we find
  for (const key in initializers) {
    if (!foundKeys.has(key)) {
      keys.push(key);
      foundKeys.add(key);
    }
  }

  for (const key of keys) {
    if (initializers[key]) {
      const result = initializers[key](state);
      if (result.isSuccess()) {
        if (result.value === undefined) {
          if (
            options.suppressUndefined === true ||
            (Array.isArray(options.suppressUndefined) && options.suppressUndefined.includes(key))
          ) {
            continue;
          }
        }
        state[key] = result.value;
      } else {
        errors.push(result.message);
      }
    } else {
      errors.push(`populateObject: Key ${String(key)} is present but has no initializer`);
    }
  }

  if (errors.length > 0) {
    aggregatedErrors?.push(...errors);
    return fail(errors.join('\n'));
  }
  return succeed(state as T);
}
