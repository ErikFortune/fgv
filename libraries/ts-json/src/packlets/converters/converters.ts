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

import { JsonArray, JsonObject } from '@fgv/ts-json-base';
import { Converter } from '@fgv/ts-utils';
import { IJsonContext } from '../context';
import {
  ConditionalJsonConverter,
  ConditionalJsonConverterOptions,
  JsonConverter,
  RichJsonConverter,
  RichJsonConverterOptions,
  TemplatedJsonConverter,
  TemplatedJsonConverterOptions
} from './jsonConverter';

/**
 * A simple validating {@link JsonConverter | JSON converter}. Converts unknown to
 * JSON or fails if the unknown contains any invalid JSON values.
 * @public
 */
export const json: JsonConverter = new JsonConverter();

/**
 * A simple validating {@link JsonConverter | JSON converter}. Converts unknown
 * to a `JsonObject`, or fails if the `unknown` contains invalid
 * JSON or is not an object.
 * @public
 */
export const jsonObject: Converter<JsonObject, IJsonContext> = json.object();

/**
 * A simple validating {@link JsonConverter | JSON converter}. Converts `unknown` to a
 * `JsonArray`, or fails if the unknown contains invalid JSON or is
 * not an array.
 * @public
 */
export const jsonArray: Converter<JsonArray, IJsonContext> = json.array();

let templatedJsonDefault: JsonConverter | undefined;
let conditionalJsonDefault: JsonConverter | undefined;
let richJsonDefault: JsonConverter | undefined;

/**
 * Helper function which creates a new {@link JsonConverter | JsonConverter} which converts an
 * `unknown` value to JSON, rendering any property names or string values using mustache with
 * the supplied context.  See the mustache documentation for details of mustache syntax and view.
 * @param options - {@link TemplatedJsonConverterOptions | Options and context} for
 * the conversion.
 * @public
 */
export function templatedJson(options?: Partial<TemplatedJsonConverterOptions>): JsonConverter {
  if (!options) {
    if (!templatedJsonDefault) {
      templatedJsonDefault = new TemplatedJsonConverter();
    }
    return templatedJsonDefault;
  }
  return new TemplatedJsonConverter(options);
}

/**
 * Helper function which creates a new {@link JsonConverter | JsonConverter} which converts a
 * supplied `unknown` to strongly-typed JSON, by first rendering any property
 * names or string values using mustache with the supplied context, then applying
 * multi-value property expansion and conditional flattening based on property names.
 * @param options - {@link ConditionalJsonConverterOptions | Options and context} for
 * the conversion.
 * @public
 */
export function conditionalJson(options?: Partial<ConditionalJsonConverterOptions>): JsonConverter {
  if (!options) {
    if (!conditionalJsonDefault) {
      conditionalJsonDefault = new ConditionalJsonConverter();
    }
    return conditionalJsonDefault;
  }
  return new ConditionalJsonConverter(options);
}

/**
 * Helper function which creates a new {@link JsonConverter | JsonConverter} which converts a
 * supplied `unknown` to strongly-typed JSON, by first rendering any property
 * names or string values using mustache with the supplied context, then applying
 * multi-value property expansion and conditional flattening based on property names.
 * @param options - {@link RichJsonConverterOptions | Options and context} for
 * the conversion.
 * @public
 */
export function richJson(options?: Partial<RichJsonConverterOptions>): JsonConverter {
  if (!options) {
    if (!richJsonDefault) {
      richJsonDefault = new RichJsonConverter();
    }
    return richJsonDefault;
  }
  return new RichJsonConverter(options);
}
