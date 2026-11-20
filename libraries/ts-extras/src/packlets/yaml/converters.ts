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

import { Conversion, Converter, Result, captureResult, fail } from '@fgv/ts-utils';
import * as yaml from 'js-yaml';

/**
 * Creates a converter that parses YAML string content and then applies the supplied converter.
 * @param converter - Converter to apply to the parsed YAML
 * @returns Converter that parses YAML then validates
 * @public
 */
export function yamlConverter<T>(converter: Converter<T>): Converter<T> {
  return new Conversion.BaseConverter<T>((from: unknown): Result<T> => {
    if (typeof from !== 'string') {
      return fail('Input must be a string');
    }

    const parseResult = captureResult(() => yaml.load(from));
    if (parseResult.isFailure()) {
      return fail(`Failed to parse YAML: ${parseResult.message}`);
    }

    const parsed = parseResult.value;
    if (typeof parsed !== 'object' || parsed === null) {
      return fail('Failed to parse YAML: YAML content must be an object');
    }

    return converter.convert(parsed);
  });
}
