/*
 * Copyright (c) 2024 Erik Fortune
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

import { Result, captureResult, fail } from '@fgv/ts-utils';
import * as yaml from 'js-yaml';

/**
 * Options for YAML serialization, mirroring commonly-used `js-yaml` `DumpOptions`.
 * @public
 */
export interface IYamlSerializeOptions {
  /**
   * Indentation width in spaces (default: 2).
   */
  readonly indent?: number;

  /**
   * Nesting level at which to switch from block to flow style.
   * -1 means block style everywhere (default: -1).
   */
  readonly flowLevel?: number;

  /**
   * If true, sort keys when dumping (default: false).
   */
  readonly sortKeys?: boolean;

  /**
   * Maximum line width (default: 80).
   */
  readonly lineWidth?: number;

  /**
   * If true, don't convert duplicate objects into references (default: false).
   */
  readonly noRefs?: boolean;

  /**
   * If true, don't add an indentation level to array elements (default: false).
   */
  readonly noArrayIndent?: boolean;

  /**
   * If true, all non-key strings will be quoted (default: false).
   */
  readonly forceQuotes?: boolean;
}

/**
 * Serializes a value to a YAML string.
 * @param value - The value to serialize (must be an object or array)
 * @param options - Optional serialization options
 * @returns `Success` with YAML string, or `Failure` with error
 * @public
 */
export function yamlStringify(value: unknown, options?: IYamlSerializeOptions): Result<string> {
  if (value === null || value === undefined) {
    return fail('Cannot serialize null or undefined to YAML');
  }
  if (typeof value !== 'object') {
    return fail('YAML serialization requires an object or array');
  }

  return captureResult(() =>
    yaml.dump(value, {
      indent: options?.indent,
      flowLevel: options?.flowLevel,
      sortKeys: options?.sortKeys,
      lineWidth: options?.lineWidth,
      noRefs: options?.noRefs,
      noArrayIndent: options?.noArrayIndent,
      forceQuotes: options?.forceQuotes
    })
  );
}
