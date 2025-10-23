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

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';

/**
 * Primitive (terminal) values allowed in by JSON.
 * @public
 */
// eslint-disable-next-line @rushstack/no-new-null
export type JsonPrimitive = boolean | number | string | null;

/**
 * A {@link JsonObject | JsonObject} is a string-keyed object
 * containing only valid {@link JsonValue | JSON values}.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * A {@link JsonValue | JsonValue} is one of: a {@link JsonPrimitive | JsonPrimitive},
 * a {@link JsonObject | JsonObject} or an {@link JsonArray | JsonArray}.
 * @public
 */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * A {@link JsonArray | JsonArray} is an array containing only valid {@link JsonValue | JsonValues}.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface JsonArray extends Array<JsonValue> {}

/**
 * Classes of {@link JsonValue | JsonValue}.
 * @public
 */
export type JsonValueType = 'primitive' | 'object' | 'array';

/**
 * Helper type to detect if T is exactly unknown.
 */
type IsUnknown<T> = unknown extends T ? ([T] extends [unknown] ? true : false) : false;

/**
 * A constrained type that is compatible with JSON serialization.
 *
 * This type transforms input types to ensure they can be safely serialized to JSON:
 * - JSON primitives (string, number, boolean, null) are preserved as-is
 * - `undefined` is allowed for TypeScript compatibility with optional properties
 * - Objects are recursively transformed with all properties made JSON-compatible
 * - Arrays are transformed to contain only JSON-compatible elements
 * - Functions are transformed to error types
 * - Other non-JSON types are transformed to error types
 *
 * Note: While `undefined` is technically not JSON-serializable, it's allowed here
 * to support TypeScript's optional property patterns. Use `sanitizeJsonObject`
 * to remove undefined properties before actual JSON serialization.
 *
 * @param T - The type to be constrained
 * @returns A constrained type that is compatible with JSON serialization.
 *
 * @example
 * ```typescript
 * interface IUser {
 *   name: string;
 *   email?: string; // Optional property can be undefined
 * }
 *
 * type UserCompatible = JsonCompatible<IUser>; // Allows undefined for email
 *
 * const user: UserCompatible = {
 *   name: "John",
 *   email: undefined // This works
 * };
 *
 * // Before JSON serialization, sanitize to remove undefined:
 * const sanitized = sanitizeJsonObject(user); // Removes undefined properties
 * JSON.stringify(sanitized.value); // Safe to serialize
 * ```
 *
 * @public
 */
export type JsonCompatible<T> = IsUnknown<T> extends true
  ? JsonValue
  : T extends JsonPrimitive | undefined
  ? T
  : T extends Array<unknown>
  ? JsonCompatibleArray<T[number]>
  : // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  T extends Function
  ? ['Error: Function is not JSON-compatible']
  : T extends object
  ? { [K in keyof T]: JsonCompatible<T[K]> }
  : ['Error: Non-JSON type'];

/**
 * A type that represents an array of JSON-compatible values.
 * @param T - The type to be constrained
 * @returns A constrained type that is compatible with JSON serialization.
 * @public
 */
export type JsonCompatibleArray<T> = Array<JsonCompatible<T>>;

/**
 * Test if an `unknown` is a {@link JsonValue | JsonValue}.
 * @param from - The `unknown` to be tested
 * @returns `true` if the supplied parameter is a valid {@link JsonPrimitive | JsonPrimitive},
 * `false` otherwise.
 * @public
 */
export function isJsonPrimitive(from: unknown): from is JsonPrimitive {
  return typeof from === 'boolean' || typeof from === 'number' || typeof from === 'string' || from === null;
}

/**
 * Test if an `unknown` is potentially a {@link JsonObject | JsonObject}.
 * @param from - The `unknown` to be tested.
 * @returns `true` if the supplied parameter is a non-array, non-special object
 * with no symbol keys, `false` otherwise.
 * @public
 */
export function isJsonObject(from: unknown): from is JsonObject {
  return (
    typeof from === 'object' &&
    from !== null &&
    !Array.isArray(from) &&
    !(from instanceof RegExp) &&
    !(from instanceof Date) &&
    !(from instanceof Map) &&
    !(from instanceof Set) &&
    !(from instanceof Error) &&
    Object.getOwnPropertySymbols(from).length === 0
  );
}

/**
 * Test if an `unknown` is potentially a {@link JsonArray | JsonArray}.
 * @param from - The `unknown` to be tested.
 * @returns `true` if the supplied parameter is an array object,
 * `false` otherwise.
 * @public
 */
export function isJsonArray(from: unknown): from is JsonArray {
  return typeof from === 'object' && Array.isArray(from);
}

/**
 * Identifies whether some `unknown` value is a {@link JsonPrimitive | primitive},
 * {@link JsonObject | object} or {@link JsonArray | array}. Fails for any value
 * that cannot be converted to JSON (e.g. a function) _but_ this is a shallow test -
 * it does not test the properties of an object or elements in an array.
 * @param from - The `unknown` value to be tested
 * @public
 */
export function classifyJsonValue(from: unknown): Result<JsonValueType> {
  if (isJsonPrimitive(from)) {
    return succeed('primitive');
  } else if (isJsonObject(from)) {
    return succeed('object');
  } else if (isJsonArray(from)) {
    return succeed('array');
  }
  return fail(`Invalid JSON: ${from}`);
}

/**
 * Picks a nested field from a supplied {@link JsonObject | JsonObject}.
 * @param src - The {@link JsonObject | object} from which the field is to be picked.
 * @param path - Dot-separated path of the member to be picked.
 * @returns `Success` with the property if the path is valid, `Failure`
 * with an error message otherwise.
 * @public
 */
export function pickJsonValue(src: JsonObject, path: string): Result<JsonValue> {
  let result: JsonValue = src;
  for (const part of path.split('.')) {
    if (result && isJsonObject(result)) {
      result = result[part];
      if (result === undefined) {
        return fail(`${path}: child '${part}' does not exist`);
      }
    } else {
      return fail(`${path}: child '${part}' does not exist`);
    }
  }
  return succeed(result);
}

/**
 * Picks a nested {@link JsonObject | JsonObject} from a supplied
 * {@link JsonObject | JsonObject}.
 * @param src - The {@link JsonObject | object} from which the field is
 * to be picked.
 * @param path - Dot-separated path of the member to be picked.
 * @returns `Success` with the property if the path is valid and the value
 * is an object. Returns `Failure` with details if an error occurs.
 * @public
 */
export function pickJsonObject(src: JsonObject, path: string): Result<JsonObject> {
  return pickJsonValue(src, path).onSuccess((v) => {
    if (!isJsonObject(v)) {
      return fail(`${path}: not an object`);
    }
    return succeed(v);
  });
}

/**
 * "Sanitizes" an `unknown` by stringifying and then parsing it.  Guarantees a
 * valid {@link JsonValue | JsonValue} but is not idempotent and gives no guarantees
 * about fidelity. Fails if the supplied value cannot be stringified as Json.
 * @param from - The `unknown` to be sanitized.
 * @returns `Success` with a {@link JsonValue | JsonValue} if conversion succeeds,
 * `Failure` with details if an error occurs.
 * @public
 */
export function sanitizeJson(from: unknown): Result<JsonValue> {
  return captureResult(() => JSON.parse(JSON.stringify(from)));
}

/**
 * Sanitizes some value using JSON stringification and parsing, returning an
 * returning a matching strongly-typed value.
 * @param from - The value to be sanitized.
 * @returns `Success` with a {@link JsonObject | JsonObject} if conversion succeeds,
 * `Failure` with details if an error occurs.
 * @public
 */
export function sanitizeJsonObject<T>(from: T): Result<T> {
  return captureResult(() => JSON.parse(JSON.stringify(from)));
}
