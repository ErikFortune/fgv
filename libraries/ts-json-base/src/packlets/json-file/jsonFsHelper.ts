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

import {
  Converter,
  Result,
  Validation,
  Validator,
  captureResult,
  fail,
  mapResults,
  succeed
} from '@fgv/ts-utils';
import * as fs from 'fs';
import * as path from 'path';

import { JsonValue } from '../json';
import { DefaultJsonLike, IJsonLike } from './jsonLike';

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
  validator?: undefined;
}

/**
 * Options for directory validation.
 * @public
 */
export interface IDirectoryValidateOptions<T, TC = unknown> {
  converter?: undefined;
  /**
   * The validator used to validate incoming JSON objects
   */
  validator: Validator<T, TC>;
}

/**
 * Options for directory conversion or validation.
 * @public
 */
export type JsonFsDirectoryOptions<T, TC = unknown> =
  | IDirectoryConvertOptions<T, TC>
  | IDirectoryValidateOptions<T, TC>;

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
 * Function to transform the name of a some entity, given an original name
 * and the contents of the entity.
 * @public
 */
export type ItemNameTransformFunction<T> = (name: string, item: T) => Result<string>;

/**
 * Options controlling conversion of a directory to a `Map`.
 * @public
 */
export interface IDirectoryToMapConvertOptions<T, TC = unknown> extends IDirectoryConvertOptions<T, TC> {
  transformName?: ItemNameTransformFunction<T>;
}

/**
 * Options controlling validation of a directory to a `Map`.
 * @public
 */
export interface IDirectoryToMapValidateOptions<T, TC = unknown> extends IDirectoryValidateOptions<T, TC> {
  transformName?: ItemNameTransformFunction<T>;
}

/**
 * Options controlling processing of a directory to a `Map`.
 * @public
 */
export type JsonFsDirectoryToMapOptions<T, TC = unknown> =
  | IDirectoryToMapConvertOptions<T, TC>
  | IDirectoryToMapValidateOptions<T, TC>;

/**
 * Function to transform the name of some entity, given only a previous name. This
 * default implementation always returns `Success` with the value that was passed in.
 * @param n - The name to be transformed.
 * @returns - `Success` with the string that was passed in.
 * @public
 */
const defaultNameTransformer = (n: string): Result<string> => succeed(n);

/**
 * Configuration for {@link JsonFile.JsonFsHelper | JsonFsHelper}.
 * @public
 */
export interface IJsonFsHelperConfig {
  json: IJsonLike;
  allowUndefinedWrite: boolean;
}

/**
 * Initialization options for {@link JsonFile.JsonFsHelper | JsonFsHelper}.
 * @public
 */
export type JsonFsHelperInitOptions = Partial<IJsonFsHelperConfig>;

/**
 * Default configuration for {@link JsonFile.JsonFsHelper | JsonFsHelper}.
 * @public
 */
export const DefaultJsonFsHelperConfig: IJsonFsHelperConfig = {
  json: DefaultJsonLike,
  allowUndefinedWrite: false
};

/**
 * Helper class to simplify common filesystem operations involving JSON (or JSON-like)
 * files.
 * @public
 */
export class JsonFsHelper {
  /**
   * Configuration for this {@link JsonFile.JsonFsHelper | JsonFsHelper}.
   */
  public readonly config: IJsonFsHelperConfig;

  /**
   * Construct a new {@link JsonFile.JsonFsHelper | JsonFsHelper}.
   * @param json - Optional {@link JsonFile.IJsonLike | IJsonLike} used to process strings
   * and JSON values.
   */
  public constructor(init?: JsonFsHelperInitOptions) {
    this.config = {
      ...DefaultJsonFsHelperConfig,
      ...(init ?? {})
    };
  }

  /**
   * Read type-safe JSON from a file.
   * @param srcPath - Path of the file to read
   * @returns `Success` with a {@link JsonValue | JsonValue} or `Failure`
   * with a message if an error occurs.
   */
  public readJsonFileSync(srcPath: string): Result<JsonValue> {
    return captureResult(() => {
      const fullPath = path.resolve(srcPath);
      const body = fs.readFileSync(fullPath, 'utf8').toString();
      return this.config.json.parse(body) as JsonValue;
    });
  }

  /**
   * Read a JSON file and apply a supplied converter or validator.
   * @param srcPath - Path of the file to read.
   * @param cv - Converter or validator used to process the file.
   * @returns `Success` with a result of type `<T>`, or `Failure`
   * with a message if an error occurs.
   */
  public processJsonFileSync<T>(srcPath: string, cv: Validation.Convalidator<T>): Result<T> {
    return this.readJsonFileSync(srcPath).onSuccess((json) => {
      return cv.convalidate(json);
    });
  }

  /**
   * Reads all JSON files from a directory and apply a supplied converter or validator.
   * @param srcPath - The path of the folder to be read.
   * @param options - {@link JsonFile.JsonFsDirectoryOptions | Options} to control
   * conversion and filtering
   */
  public processJsonDirectorySync<T>(
    srcPath: string,
    options: JsonFsDirectoryOptions<T>
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
            return this.processJsonFileSync(filePath, options.converter ?? options.validator)
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
   * Reads and converts or validates all JSON files from a directory, returning a
   * `Map<string, T>` indexed by file base name (i.e. minus the extension)
   * with an optional name transformation applied if present.
   * @param srcPath - The path of the folder to be read.
   * @param options - {@link JsonFile.JsonFsDirectoryToMapOptions | Options} to control conversion,
   * filtering and naming.
   */
  public processJsonDirectoryToMapSync<T, TC = unknown>(
    srcPath: string,
    options: JsonFsDirectoryToMapOptions<T, TC>
  ): Result<Map<string, T>> {
    return this.processJsonDirectorySync(srcPath, options).onSuccess((items) => {
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
   * Write type-safe JSON to a file.
   * @param srcPath - Path of the file to write.
   * @param value - The {@link JsonValue | JsonValue} to be written.
   */
  public writeJsonFileSync(srcPath: string, value: JsonValue): Result<boolean> {
    return captureResult(() => {
      const fullPath = path.resolve(srcPath);
      const stringified = this.config.json.stringify(value, undefined, 2);
      if (stringified === undefined && this.config.allowUndefinedWrite !== true) {
        throw new Error(`Could not stringify ${value}`);
      }
      fs.writeFileSync(fullPath, stringified!);
      return true;
    });
  }
}

/**
 * @public
 */
export const DefaultJsonFsHelper: JsonFsHelper = new JsonFsHelper();
