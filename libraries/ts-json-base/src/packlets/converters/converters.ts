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

import { Conversion, Converter, Result, fail, succeed } from '@fgv/ts-utils';
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
    return fail(`"${String(from)}": not a valid JSON primitive.`);
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
      return fail('not a valid JSON object.');
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
      return fail(`not a valid JSON object:\n${errors.join('\n')}`);
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
