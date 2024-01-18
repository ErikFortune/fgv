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

import { JsonObject, JsonValue } from '@fgv/ts-json-base';
import { DetailedResult, Result, succeed } from '@fgv/ts-utils';

/**
 * Collection of variables used for template replacement in a JSON edit or
 * conversion.
 * @public
 */
export type TemplateVars = Record<string, unknown>;

/**
 * Describes one value in a {@link TemplateVars | TemplateVars} collection of
 * variables.
 * @public
 */
export type VariableValue = [string, unknown];

/**
 * Function used to create a new collection of {@link TemplateVars | TemplateVars} with
 * one or more new or changed values.
 * @public
 */
export type TemplateVarsExtendFunction = (
  base: TemplateVars | undefined,
  values: VariableValue[]
) => Result<TemplateVars | undefined>;

/**
 * This default implementation of a {@link TemplateVarsExtendFunction | TemplateVarsExtendFunction}
 * creates a new collection via inheritance from the supplied collection.
 * @param base - The base {@link TemplateVars | variables} to be extended.
 * @param values - The {@link VariableValue | values} to be added or overridden in the new variables.
 * @public
 */
export function defaultExtendVars(
  base: TemplateVars | undefined,
  values: VariableValue[]
): Result<TemplateVars | undefined> {
  const rtrn = base ? Object.create(base) : {};
  for (const v of values) {
    rtrn[v[0]] = v[1];
  }
  return succeed(rtrn);
}

/**
 * Failure reason for {@link IJsonReferenceMap | IJsonReferenceMap} lookup, where `'unknown'`
 * means that the object is not present in the map and `'error'` means
 * that an error occurred while retrieving or converting it.
 * @public
 */
export type JsonReferenceMapFailureReason = 'unknown' | 'error';

/**
 * Interface for a simple map that returns named {@link JsonValue | JsonValue} values with templating,
 * conditional logic, and external reference lookups applied using an optionally supplied context.
 * @public
 */
export interface IJsonReferenceMap {
  /**
   * Determine if a key might be valid for this map but does not determine if key actually
   * exists. Allows key range to be constrained.
   * @param key - The key to be tested.
   * @returns `true` if the key is in the valid range, `false` otherwise.
   */
  keyIsInRange(key: string): boolean;

  /**
   * Determines if an object with the specified key actually exists in the map.
   * @param key - The key to be tested.
   * @returns `true` if an object with the specified key exists, `false` otherwise.
   */
  has(key: string): boolean;

  /**
   * Gets a {@link JsonObject | JsonObject} specified by key.
   * @param key - The key of the object to be retrieved.
   * @param context - Optional {@link IJsonContext | IJsonContext} used to construct
   * the object.
   * @returns `Success` with the formatted {@link JsonObject | object} if successful. `Failure`
   * with detail `'unknown'`  if no such object exists, or `Failure` with detail `'error'` if
   * the object was found but could not be formatted.
   */
  // eslint-disable-next-line no-use-before-define
  getJsonObject(
    key: string,
    context?: IJsonContext
  ): DetailedResult<JsonObject, JsonReferenceMapFailureReason>;

  /**
   * Gets a {@link JsonValue | JsonValue} specified by key.
   * @param key - The key of the object to be retrieved.
   * @param context - Optional {@link IJsonContext | JSON Context} used to format the value
   * @returns `Success` with the formatted {@link JsonValue | value} if successful. `Failure`
   * with detail `'unknown'` if no such object exists, or `Failure` with detail `'error'` if
   * the object was found but could not be formatted.
   */
  // eslint-disable-next-line no-use-before-define
  getJsonValue(key: string, context?: IJsonContext): DetailedResult<JsonValue, JsonReferenceMapFailureReason>;
}

/**
 * Context used to convert or edit JSON objects.
 * @public
 */
export interface IJsonContext {
  vars?: TemplateVars;
  refs?: IJsonReferenceMap;
  extendVars?: TemplateVarsExtendFunction;
}
