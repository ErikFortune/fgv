// Copyright (c) 2024 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { Result, captureResult } from '@fgv/ts-utils';
import * as yaml from 'js-yaml';
import { ICollectionSourceFile } from '../library-data';
import { IExportOptions } from './model';

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Serialize a collection to YAML string.
 * @param collection - Collection source file to serialize
 * @param options - Optional export options
 * @returns Result containing YAML string or failure
 * @public
 */
export function serializeToYaml<T>(
  collection: ICollectionSourceFile<T>,
  options?: IExportOptions
): Result<string> {
  const prettyPrint = options?.prettyPrint ?? true;

  return captureResult(() => {
    const yamlString = yaml.dump(collection, {
      indent: prettyPrint ? 2 : 0,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false
    });
    return yamlString;
  }).withErrorFormat((error) => `Failed to serialize collection to YAML: ${error}`);
}

/**
 * Serialize a collection to JSON string.
 * @param collection - Collection source file to serialize
 * @param options - Optional export options
 * @returns Result containing JSON string or failure
 * @public
 */
export function serializeToJson<T>(
  collection: ICollectionSourceFile<T>,
  options?: IExportOptions
): Result<string> {
  const prettyPrint = options?.prettyPrint ?? true;

  return captureResult(() => {
    if (prettyPrint) {
      return JSON.stringify(collection, null, 2);
    }
    return JSON.stringify(collection);
  }).withErrorFormat((error) => `Failed to serialize collection to JSON: ${error}`);
}

/**
 * Serialize a collection to string based on format.
 * @param collection - Collection source file to serialize
 * @param format - Export format ('yaml' or 'json')
 * @param options - Optional export options
 * @returns Result containing serialized string or failure
 * @public
 */
export function serializeCollection<T>(
  collection: ICollectionSourceFile<T>,
  format: 'yaml' | 'json',
  options?: IExportOptions
): Result<string> {
  if (format === 'yaml') {
    return serializeToYaml(collection, options);
  }
  return serializeToJson(collection, options);
}
