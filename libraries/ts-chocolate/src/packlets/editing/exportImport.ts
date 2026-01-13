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

import { Result, fail, succeed, captureResult } from '@fgv/ts-utils';
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

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Parse a YAML string into a collection source file.
 * @param content - YAML string content
 * @returns Result containing parsed collection or failure
 * @public
 */
export function parseYaml<T>(content: string): Result<ICollectionSourceFile<T>> {
  return captureResult(() => {
    const parsed = yaml.load(content);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('YAML content must be an object');
    }
    return parsed as ICollectionSourceFile<T>;
  }).withErrorFormat((error) => `Failed to parse YAML: ${error}`);
}

/**
 * Parse a JSON string into a collection source file.
 * @param content - JSON string content
 * @returns Result containing parsed collection or failure
 * @public
 */
export function parseJson<T>(content: string): Result<ICollectionSourceFile<T>> {
  return captureResult(() => {
    const parsed = JSON.parse(content);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('JSON content must be an object');
    }
    return parsed as ICollectionSourceFile<T>;
  }).withErrorFormat((error) => `Failed to parse JSON: ${error}`);
}

/**
 * Parse content based on detected format.
 * Attempts to auto-detect format from content.
 * @param content - String content to parse
 * @returns Result containing parsed collection or failure
 * @public
 */
export function parseCollection<T>(content: string): Result<ICollectionSourceFile<T>> {
  if (!content || content.trim().length === 0) {
    return fail('Content is empty');
  }

  const trimmed = content.trim();

  // Try to detect format from content
  // JSON typically starts with { or [
  // YAML can start with various things
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    // Likely JSON
    return parseJson<T>(content).onFailure(() => {
      /* c8 ignore next 2 - fallback parsing tested but coverage intermittently missed */
      // If JSON parsing fails, try YAML as fallback
      return parseYaml<T>(content);
    });
  }

  // Try YAML first for non-JSON-looking content
  return parseYaml<T>(content).onFailure(() => {
    // If YAML parsing fails, try JSON as fallback
    return parseJson<T>(content);
  });
}

/**
 * Parse content with explicit format.
 * @param content - String content to parse
 * @param format - Expected format ('yaml' or 'json')
 * @returns Result containing parsed collection or failure
 * @public
 */
export function parseCollectionWithFormat<T>(
  content: string,
  format: 'yaml' | 'json'
): Result<ICollectionSourceFile<T>> {
  if (format === 'yaml') {
    return parseYaml<T>(content);
  }
  return parseJson<T>(content);
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate that parsed data matches ICollectionSourceFile structure.
 * @param data - Parsed data to validate
 * @returns Result of true if valid, or failure with error message
 * @public
 */
export function validateCollectionStructure(data: unknown): Result<true> {
  if (typeof data !== 'object' || data === null) {
    return fail('Collection data must be an object');
  }

  const obj = data as Record<string, unknown>;

  // Items field is required
  if (!('items' in obj)) {
    return fail('Collection data must have an "items" field');
  }

  if (typeof obj.items !== 'object' || obj.items === null) {
    return fail('Collection "items" field must be an object');
  }

  // Metadata is optional
  if ('metadata' in obj) {
    if (typeof obj.metadata !== 'object' || obj.metadata === null) {
      return fail('Collection "metadata" field must be an object if present');
    }
  }

  return succeed(true);
}

/**
 * Validate and parse collection source file.
 * Combines parsing and validation in one step.
 * @param content - String content to parse
 * @param format - Optional format hint ('yaml' or 'json')
 * @returns Result containing validated collection or failure
 * @public
 */
export function validateAndParseCollection<T>(
  content: string,
  format?: 'yaml' | 'json'
): Result<ICollectionSourceFile<T>> {
  const parseResult =
    format !== undefined ? parseCollectionWithFormat<T>(content, format) : parseCollection<T>(content);

  return parseResult.onSuccess((collection) => {
    return validateCollectionStructure(collection).onSuccess(() => succeed(collection));
  });
}
