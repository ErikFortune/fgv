// Copyright (c) 2026 Erik Fortune
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

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

import { Converter, Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { Entities } from '@fgv/ts-chocolate';

import { EntityTypeName } from './editTypes';

/**
 * Result of loading an entity from a file.
 */
export interface ILoadedEntity {
  readonly entity: unknown;
  readonly format: 'json' | 'yaml';
}

/**
 * Gets the appropriate entity converter for a given entity type name.
 * @param entityType - The entity type to get a converter for
 * @returns The converter for the entity type
 */
export function getEntityConverter(entityType: EntityTypeName): Converter<unknown> {
  switch (entityType) {
    case 'task':
      return Entities.Converters.Tasks.rawTaskEntity as Converter<unknown>;
    case 'ingredient':
      return Entities.Converters.Ingredients.ingredientEntity as Converter<unknown>;
    case 'mold':
      return Entities.Converters.Molds.moldEntity as Converter<unknown>;
    case 'procedure':
      return Entities.Converters.Procedures.procedureEntity as Converter<unknown>;
    case 'filling':
      return Entities.Converters.Fillings.fillingRecipeEntity as Converter<unknown>;
    case 'confection':
      return Entities.Converters.Confections.anyConfectionRawEntity as Converter<unknown>;
  }
}

/**
 * Detects the file format from the file extension.
 * @param filePath - Path to the file
 * @returns 'json' or 'yaml', or failure if extension is unsupported
 */
function detectFormat(filePath: string): Result<'json' | 'yaml'> {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.json':
      return succeed('json');
    case '.yaml':
    case '.yml':
      return succeed('yaml');
    default:
      return fail(`Unsupported file extension "${ext}": expected .json, .yaml, or .yml`);
  }
}

/**
 * Parses file content based on format.
 * @param content - Raw file content
 * @param format - File format
 * @returns Parsed content as unknown
 */
function parseContent(content: string, format: 'json' | 'yaml'): Result<unknown> {
  if (format === 'json') {
    return captureResult(() => JSON.parse(content) as unknown);
  }
  return captureResult(() => yaml.parse(content) as unknown);
}

/**
 * Loads an entity from a JSON or YAML file.
 *
 * Detects format from file extension, parses the content, then validates
 * through the appropriate entity converter.
 *
 * @param filePath - Path to the JSON or YAML file
 * @param entityType - Type of entity to validate against
 * @returns Result containing the validated entity and detected format
 */
export function loadEntityFromFile(filePath: string, entityType: EntityTypeName): Result<ILoadedEntity> {
  return detectFormat(filePath).onSuccess((format) => {
    const readResult = captureResult(() => fs.readFileSync(filePath, 'utf-8'));
    return readResult
      .withErrorFormat((msg) => `Failed to read file "${filePath}": ${msg}`)
      .onSuccess((content) => {
        return parseContent(content, format)
          .withErrorFormat((msg) => `Failed to parse ${format} file "${filePath}": ${msg}`)
          .onSuccess((parsed) => {
            const converter = getEntityConverter(entityType);
            return converter
              .convert(parsed)
              .withErrorFormat((msg) => `Validation failed for ${entityType} in "${filePath}": ${msg}`)
              .onSuccess((entity) => succeed({ entity, format }));
          });
      });
  });
}
