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

import {
  Conversion,
  Converter,
  Converters as BaseConverters,
  Result,
  StringConverter,
  fail,
  succeed
} from '@fgv/ts-utils';
import { JsonArray, JsonObject, JsonPrimitive, JsonValue, isJsonArray, isJsonObject } from '../json';

/* eslint-disable @typescript-eslint/no-use-before-define */

/**
 * Conversion context for JSON converters.
 * @public
 */
export interface IJsonConverterContext {
  ignoreUndefinedProperties?: boolean;
}

/**
 * An converter which converts a supplied `unknown` value to a valid {@link JsonPrimitive | JsonPrimitive}.
 * @public
 */
export const jsonPrimitive: Converter<JsonPrimitive, IJsonConverterContext> = new Conversion.BaseConverter(
  (
    from: unknown,
    __self: Converter<JsonPrimitive, IJsonConverterContext>,
    ctx?: IJsonConverterContext
  ): Result<JsonPrimitive> => {
    if (from === null) {
      return succeed(null);
    }
    switch (typeof from) {
      case 'boolean':
      case 'string':
        return succeed(from);
      case 'number':
        if (!Number.isNaN(from)) {
          return succeed(from);
        }
        break;
    }
    return fail(`"${String(from)}": invalid JSON primitive.`);
  }
);

/**
 * An copying converter which converts a supplied `unknown` value into
 * a valid {@link JsonObject | JsonObject}. Fails by default if any properties or array elements
 * are `undefined` - this default behavior can be overridden by supplying an appropriate
 * {@link Converters.IJsonConverterContext | context} at runtime.
 *
 * Guaranteed to return a new object.
 * @public
 */
export const jsonObject: Converter<JsonObject, IJsonConverterContext> = new Conversion.BaseConverter(
  (
    from: unknown,
    __self: Converter<JsonObject, IJsonConverterContext>,
    ctx?: IJsonConverterContext
  ): Result<JsonObject> => {
    if (!isJsonObject(from)) {
      return fail('invalid JSON object.');
    }
    const obj: JsonObject = {};
    const errors: string[] = [];
    for (const [name, value] of Object.entries(from)) {
      if (value === undefined && ctx?.ignoreUndefinedProperties === true) {
        // optionally ignore undefined values
        continue;
      }
      jsonValue
        .convert(value, ctx)
        .onSuccess((v: JsonValue) => {
          obj[name] = v;
          return succeed(v);
        })
        .onFailure((m) => {
          errors.push(`${name}: ${m}`);
          return fail(m);
        });
    }
    if (errors.length > 0) {
      return fail(`invalid JSON object:\n${errors.join('\n')}`);
    }
    return succeed(obj);
  }
);

/**
 * An copying converter which converts a supplied `unknown` value to
 * a valid {@link JsonArray | JsonArray}. Fails by default if any properties or array elements
 * are `undefined` - this default behavior can be overridden by supplying an appropriate
 * {@link Converters.IJsonConverterContext | context} at runtime.
 *
 * Guaranteed to return a new array.
 * @public
 */
export const jsonArray: Converter<JsonArray, IJsonConverterContext> = new Conversion.BaseConverter(
  (
    from: unknown,
    __self: Converter<JsonArray, IJsonConverterContext>,
    ctx?: IJsonConverterContext
  ): Result<JsonArray> => {
    if (!isJsonArray(from)) {
      return fail('not an array');
    }
    const arr: JsonValue[] = [];
    const errors: string[] = [];
    for (let i = 0; i < from.length; i++) {
      const value = from[i];
      if (value === undefined && ctx?.ignoreUndefinedProperties === true) {
        // convert undefined to 'null' for parity with JSON.stringify
        arr.push(null);
        continue;
      }
      jsonValue
        .convert(value, ctx)
        .onSuccess((v) => {
          arr.push(v);
          return succeed(v);
        })
        .onFailure((m) => {
          errors.push(`${i}: ${m}`);
          return fail(m);
        });
    }
    if (errors.length > 0) {
      return fail(`array contains non-json elements:\n${errors.join('\n')}`);
    }
    return succeed(arr);
  }
);

/**
 * An copying converter which converts a supplied `unknown` value to a
 * valid {@link JsonValue | JsonValue}. Fails by default if any properties or array elements
 * are `undefined` - this default behavior can be overridden by supplying an appropriate
 * {@link Converters.IJsonConverterContext | context} at runtime.
 * @public
 */
export const jsonValue: Converter<JsonValue, IJsonConverterContext> = new Conversion.BaseConverter<
  JsonValue,
  IJsonConverterContext
>(
  (
    from: unknown,
    __self: Converter<JsonValue, IJsonConverterContext>,
    ctx?: IJsonConverterContext
  ): Result<JsonValue> => {
    if (isJsonArray(from)) {
      return jsonArray.convert(from, ctx);
    } else if (isJsonObject(from)) {
      return jsonObject.convert(from, ctx);
    }
    return jsonPrimitive.convert(from, ctx);
  }
);

/**
 * A {@link Converter | Converter} which converts `unknown` to a `string`.
 * Accepts {@link Converters.IJsonConverterContext | IJsonConverterContext} but ignores it.
 * @public
 */
export const string: StringConverter<string, IJsonConverterContext> = new StringConverter<
  string,
  IJsonConverterContext
>();

/**
 * A {@link Converter | Converter} which converts `unknown` to a `number`.
 * Accepts {@link Converters.IJsonConverterContext | IJsonConverterContext} but ignores it.
 * Mirrors the behavior of `@fgv/ts-utils`.
 * @public
 */
export const number: Converter<number, IJsonConverterContext> = new Conversion.BaseConverter<
  number,
  IJsonConverterContext
>((from: unknown): Result<number> => BaseConverters.number.convert(from));

/**
 * A {@link Converter | Converter} which converts `unknown` to a `boolean`.
 * Accepts {@link Converters.IJsonConverterContext | IJsonConverterContext} but ignores it.
 * Mirrors the behavior of `@fgv/ts-utils`.
 * @public
 */
export const boolean: Converter<boolean, IJsonConverterContext> = new Conversion.BaseConverter<
  boolean,
  IJsonConverterContext
>((from: unknown): Result<boolean> => BaseConverters.boolean.convert(from));

/**
 * Helper to create a converter for a literal value.
 * Accepts {@link Converters.IJsonConverterContext | IJsonConverterContext} but ignores it.
 * Mirrors the behavior of `@fgv/ts-utils`.
 * @public
 */
export function literal<T>(value: T): Converter<T, IJsonConverterContext> {
  return BaseConverters.literal<T, IJsonConverterContext>(value);
}

/**
 * Helper function to create a {@link Converter | Converter} which converts `unknown` to one of a set of
 * supplied enumerated values. Anything else fails.
 *
 * @remarks
 * This JSON variant accepts an {@link Converters.IJsonConverterContext | IJsonConverterContext} OR
 * a `ReadonlyArray<T>` as its conversion context. If the context is an array, it is used to override the
 * allowed values for that conversion; otherwise, the original `values` supplied at creation time are used.
 *
 * @param values - Array of allowed values.
 * @param message - Optional custom failure message.
 * @returns A new {@link Converter | Converter} returning `<T>`.
 * @public
 */
export function enumeratedValue<T>(
  values: ReadonlyArray<T>,
  message?: string
): Converter<T, IJsonConverterContext | ReadonlyArray<T>> {
  return new Conversion.BaseConverter<T, IJsonConverterContext | ReadonlyArray<T>>(
    (
      from: unknown,
      __self: Converter<T, IJsonConverterContext | ReadonlyArray<T>>,
      context?: IJsonConverterContext | ReadonlyArray<T>
    ): Result<T> => {
      const effectiveValues = Array.isArray(context) ? (context as ReadonlyArray<T>) : values;
      const index = effectiveValues.indexOf(from as T);
      if (index >= 0) {
        return succeed(effectiveValues[index]);
      }
      return fail(message ?? `Invalid enumerated value ${JSON.stringify(from)}`);
    }
  );
}
