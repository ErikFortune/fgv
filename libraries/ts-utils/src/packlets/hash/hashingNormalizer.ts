/*
 * Copyright (c) 2021 Erik Fortune
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

import { Normalizer, Result, captureResult, fail, mapResults, succeed } from '../base';

/**
 * Function to compute a hash from a pre-normalized array of strings.
 * @public
 */
export type HashFunction = (parts: string[]) => string;

/**
 * JSON-compatible value as defined by RFC 8785 scope: primitive, object, or array.
 * Intentionally local to avoid a hard dependency from ts-utils → ts-json-base.
 * @internal
 */
type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

/**
 * Normalizes an arbitrary JSON object
 * @public
 */
export class HashingNormalizer extends Normalizer {
  private _hash: HashFunction;

  public constructor(hash: HashFunction) {
    super();
    this._hash = hash;
  }

  /**
   * Produces a stable, byte-identical JSON string for the given `JsonValue`
   * following the RFC 8785 "JSON Canonicalization Scheme" key-ordering rules.
   *
   * **RFC 8785 compliance scope:**
   * - Object keys are sorted lexicographically via `String(k1) < String(k2)`
   *   (the same comparison used by {@link Normalizer._compareKeys}), which is
   *   the ordering RFC 8785 §3.2.3 requires.
   * - Output is emitted directly to a string via recursive descent rather than
   *   by constructing a new JS object. This is necessary because JS engines
   *   reorder integer-string keys (`"0"`, `"1"`, `"10"`, `"2"`) numerically
   *   when an object is reconstructed, which would violate the lexicographic
   *   ordering mandate for those keys (e.g. `"10"` must sort before `"2"`).
   * - Strings are serialized via `JSON.stringify(s)` so that control characters
   *   and Unicode escapes are handled correctly.
   * - Numbers are serialized via `JSON.stringify(n)`, which produces standard
   *   IEEE 754 double-precision output. **Numbers outside the safe integer range
   *   or with more significant digits than a double can represent may lose
   *   precision**; the RFC 8785 §3.2.2 requirement for arbitrary-precision
   *   decimal is not covered by this implementation.
   *
   * @param value - A JSON-compatible value (string, number, boolean, null,
   *   array, or plain object).
   * @returns A stable JSON string with object keys in lexicographic order.
   * @public
   */
  public canonicalize(value: JsonValue): string {
    return this._canonicalizeValue(value);
  }

  private _canonicalizeValue(value: JsonValue): string {
    if (value === null) {
      return 'null';
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (typeof value === 'number') {
      return JSON.stringify(value);
    }
    if (typeof value === 'string') {
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      const items = value.map((item) => this._canonicalizeValue(item));
      return '[' + items.join(',') + ']';
    }
    // Plain object: sort keys lexicographically (same as _compareKeys)
    const obj = value as { [key: string]: JsonValue };
    const sortedKeys = Object.keys(obj).sort((k1, k2) => {
      const s1 = String(k1);
      const s2 = String(k2);
      if (s1 < s2) return -1;
      if (s1 > s2) return 1;
      /* c8 ignore next - defensive: object keys are distinct, equal comparison is unreachable */
      return 0;
    });
    const pairs = sortedKeys.map((k) => JSON.stringify(k) + ':' + this._canonicalizeValue(obj[k]));
    return '{' + pairs.join(',') + '}';
  }

  public computeHash(from: unknown): Result<string> {
    switch (typeof from) {
      case 'string':
      case 'bigint':
      case 'boolean':
      case 'number':
      case 'symbol':
      case 'undefined':
        return this._normalizeLiteralToString(from).onSuccess((v) => {
          return captureResult(() => this._hash([v]));
        });
      case 'object':
        if (from === null || from instanceof Date || from instanceof RegExp) {
          return this._normalizeLiteralToString(from).onSuccess((v) => {
            return captureResult(() => this._hash([v]));
          });
        } else if (Array.isArray(from)) {
          return mapResults(from.map((e) => this.computeHash(e))).onSuccess((a) => {
            return captureResult(() => this._hash(['array', ...a]));
          });
        } else if (from instanceof Map || from instanceof Set) {
          const type = from instanceof Map ? 'map' : 'set';
          return this.computeHash([type, ...this.normalizeEntries(from.entries())]);
        }
        return this.computeHash(['object', ...this.normalizeEntries(Object.entries(from))]);
    }
    return fail(`computeHash: Unexpected type - cannot hash '${typeof from}'`);
  }

  /**
   * Constructs a normalized string representation of some literal value.
   * @param from - The literal value to be normalized.
   * @returns A normalized string representation of the literal.
   * @internal
   */
  protected _normalizeLiteralToString(
    from: string | number | bigint | boolean | symbol | undefined | Date | RegExp | null
  ): Result<string> {
    switch (typeof from) {
      case 'string':
        return succeed(from);
      case 'bigint':
      case 'boolean':
      case 'number':
      case 'symbol':
      case 'undefined':
        return succeed(`${typeof from}:[[[${String(from)}]]]`);
    }
    if (from === null) {
      return succeed('object:[[[null]]');
    }
    if (from instanceof Date) {
      return succeed(`Date:[[[${String(from.valueOf())}]]]`);
    }
    if (from instanceof RegExp) {
      return succeed(`RegExp:[[[${from.toString()}]]]`);
    }
    /* c8 ignore next 2 */
    return fail(`cannot normalize ${JSON.stringify(from)}`);
  }
}
