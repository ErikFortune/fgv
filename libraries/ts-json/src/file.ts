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

import { Converter, Result, captureResult, fail, mapResults, succeed } from '@fgv/ts-utils';
import * as fs from 'fs';
import * as path from 'path';

import { JsonValue } from './common';

/**
 * Convenience function to read type-safe JSON from a file
 * @param srcPath - Path of the file to read
 * @returns `Success` with a {@link JsonValue | JsonValue} or `Failure`
 * with a message if an error occurs.
 * @public
 */
export function readJsonFileSync(srcPath: string): Result<JsonValue> {
  return captureResult(() => {
    const fullPath = path.resolve(srcPath);
    const body = fs.readFileSync(fullPath, 'utf8').toString();
    return JSON.parse(body) as JsonValue;
  });
}

/**
 * Convenience function to read a JSON file and apply a supplied converter.
 * @param srcPath - Path of the file to read.
 * @param converter - `Converter` used to convert the file contents
 * @returns `Success` with a result of type `<T>`, or `Failure`
 * with a message if an error occurs.
 * @public
 */
export function convertJsonFileSync<T>(srcPath: string, converter: Converter<T>): Result<T> {
  return readJsonFileSync(srcPath).onSuccess((json) => {
    return converter.convert(json);
  });
}

/**
 * Options for directory conversion.
 * TODO: add filtering, allowed and excluded.
 * @public
 */
export interface IDirectoryConvertOptions<T, TC = unknown> {
  /**
   * The converter used to convert incoming JSON objects.
   */
  converter: Converter<T, TC>;
}

/**
 * Return value for one item in a directory conversion.
 * @public
 */
export interface IReadDirectoryItem<T> {
  /**
   * Relative name of the file that was processed
   */
  filename: string;

  /**
   * The payload of the file.
   */
  item: T;
}

/**
 * Reads all JSON files from a directory and apply a supplied converter.
 * @param srcPath - The path of the folder to be read.
 * @param options - {@link IDirectoryConvertOptions | Options} to control
 * conversion and filtering
 * @public
 */
export function convertJsonDirectorySync<T>(
  srcPath: string,
  options: IDirectoryConvertOptions<T>
): Result<IReadDirectoryItem<T>[]> {
  return captureResult<IReadDirectoryItem<T>[]>(() => {
    const fullPath = path.resolve(srcPath);
    if (!fs.statSync(fullPath).isDirectory()) {
      throw new Error(`${fullPath}: Not a directory`);
    }
    const files = fs.readdirSync(fullPath, { withFileTypes: true });
    const results = files
      .map((fi) => {
        if (fi.isFile() && path.extname(fi.name) === '.json') {
          const filePath = path.resolve(fullPath, fi.name);
          return convertJsonFileSync(filePath, options.converter)
            .onSuccess((payload) => {
              return succeed({
                filename: fi.name,
                item: payload
              });
            })
            .onFailure((message) => {
              return fail(`${fi.name}: ${message}`);
            });
        }
        return undefined;
      })
      .filter((r): r is Result<IReadDirectoryItem<T>> => r !== undefined);
    return mapResults(results).orThrow();
  });
}

/**
 * Function to transform the name of a some entity, given an original name
 * and the contents of the entity.
 * @public
 */
export type ItemNameTransformFunction<T> = (name: string, item: T) => Result<string>;

/**
 * Options controlling conversion of a directory.
 * @public
 */
export interface IDirectoryToMapConvertOptions<T, TC = unknown> extends IDirectoryConvertOptions<T, TC> {
  transformName?: ItemNameTransformFunction<T>;
}

/**
 * Function to transform the name of some entity, given only a previous name. This
 * default implementation always returns `Success` with the value that was passed in.
 * @param n - The name to be transformed.
 * @returns - `Success` with the string that was passed in.
 * @public
 */
const defaultNameTransformer = (n: string): Result<string> => succeed(n);

/**
 * Reads and converts all JSON files from a directory, returning a
 * `Map<string, T>` indexed by file base name (i.e. minus the extension)
 * with an optional name transformation applied if present.
 * @param srcPath - The path of the folder to be read.
 * @param options - {@link IDirectoryToMapConvertOptions | Options} to control conversion,
 * filtering and naming.
 * @public
 */
export function convertJsonDirectoryToMapSync<T, TC = unknown>(
  srcPath: string,
  options: IDirectoryToMapConvertOptions<T, TC>
): Result<Map<string, T>> {
  return convertJsonDirectorySync(srcPath, options).onSuccess((items) => {
    const transformName = options.transformName ?? defaultNameTransformer;
    return mapResults(
      items.map((item) => {
        const basename = path.basename(item.filename, '.json');
        return transformName(basename, item.item).onSuccess((name) => {
          return succeed<[string, T]>([name, item.item]);
        });
      })
    ).onSuccess((items) => {
      return succeed(new Map<string, T>(items));
    });
  });
}

/**
 * Convenience function to write type-safe JSON to a file.
 * @param srcPath - Path of the file to write.
 * @param value - The {@link JsonValue | JsonValue} to be written.
 * @public
 */
export function writeJsonFileSync(srcPath: string, value: JsonValue): Result<boolean> {
  return captureResult(() => {
    const fullPath = path.resolve(srcPath);
    fs.writeFileSync(fullPath, JSON.stringify(value, undefined, 2));
    return true;
  });
}
