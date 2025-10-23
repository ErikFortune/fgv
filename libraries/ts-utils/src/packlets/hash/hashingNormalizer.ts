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
 * Normalizes an arbitrary JSON object
 * @public
 */
export class HashingNormalizer extends Normalizer {
  private _hash: HashFunction;

  public constructor(hash: HashFunction) {
    super();
    this._hash = hash;
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
