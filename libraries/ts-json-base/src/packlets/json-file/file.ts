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

import { Converter, Result } from '@fgv/ts-utils';
import { JsonValue } from '../json';
import {
  DefaultJsonFsHelper,
  IDirectoryConvertOptions,
  IDirectoryToMapConvertOptions,
  IReadDirectoryItem,
  JsonFsHelper
} from './jsonFsHelper';
import { DefaultJsonLike } from './jsonLike';

/**
 * {@inheritdoc JsonFile.JsonFsHelper.readJsonFileSync}
 * @public
 */
export function readJsonFileSync(srcPath: string): Result<JsonValue> {
  return DefaultJsonFsHelper.readJsonFileSync(srcPath);
}

/**
 * Read a JSON file and apply a supplied converter.
 * @param srcPath - Path of the file to read.
 * @param converter - `Converter` used to convert the file contents
 * @returns `Success` with a result of type `<T>`, or `Failure`* with a message if an error occurs.
 * @public
 */
export function convertJsonFileSync<T>(srcPath: string, converter: Converter<T>): Result<T> {
  return DefaultJsonFsHelper.processJsonFileSync(srcPath, converter);
}

/**
 * Reads all JSON files from a directory and apply a supplied converter.
 * @param srcPath - The path of the folder to be read.
 * @param options - {@link JsonFile.IDirectoryConvertOptions | Options} to control
 * conversion and filtering
 * @public
 */
export function convertJsonDirectorySync<T>(
  srcPath: string,
  options: IDirectoryConvertOptions<T>
): Result<IReadDirectoryItem<T>[]> {
  return DefaultJsonFsHelper.processJsonDirectorySync(srcPath, options);
}

/**
 * Reads and converts all JSON files from a directory, returning a
 * `Map<string, T>` indexed by file base name (i.e. minus the extension)
 * with an optional name transformation applied if present.
 * @param srcPath - The path of the folder to be read.
 * @param options - {@link JsonFile.IDirectoryToMapConvertOptions | Options} to control conversion,
 * filtering and naming.
 * @public
 */
export function convertJsonDirectoryToMapSync<T, TC = unknown>(
  srcPath: string,
  options: IDirectoryToMapConvertOptions<T, TC>
): Result<Map<string, T>> {
  return DefaultJsonFsHelper.processJsonDirectoryToMapSync(srcPath, options);
}

const CompatJsonFsHelper: JsonFsHelper = new JsonFsHelper({
  json: DefaultJsonLike,
  allowUndefinedWrite: true // for compatibility
});

/**
 * {@inheritDoc JsonFile.JsonFsHelper.writeJsonFileSync}
 * @public
 */
export function writeJsonFileSync(srcPath: string, value: JsonValue): Result<boolean> {
  return CompatJsonFsHelper.writeJsonFileSync(srcPath, value);
}
