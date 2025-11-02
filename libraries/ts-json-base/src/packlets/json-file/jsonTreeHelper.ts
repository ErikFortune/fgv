/*
 * Copyright (c) 2025 Erik Fortune
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

import { Converter, Result, Validator, mapResults, succeed } from '@fgv/ts-utils';
import * as FileTree from '../file-tree';
import { JsonValue } from '../json';
import { DefaultJsonLike, IJsonLike } from './jsonLike';
import { IReadDirectoryItem } from './jsonFsHelper';

/**
 * Helper class to work with JSON files using FileTree API (web-compatible).
 * @public
 */
export class JsonTreeHelper {
  /**
   * Configuration for this JsonTreeHelper.
   */
  public readonly json: IJsonLike;

  /**
   * Construct a new JsonTreeHelper.
   * @param json - Optional {@link JsonFile.IJsonLike | IJsonLike} used to process strings
   * and JSON values.
   */
  public constructor(json?: IJsonLike) {
    this.json = json ?? DefaultJsonLike;
  }

  /**
   * Read type-safe JSON from a file in a FileTree.
   * @param fileTree - The FileTree to read from
   * @param filePath - Path of the file to read within the tree
   * @returns `Success` with a {@link JsonValue | JsonValue} or `Failure`
   * with a message if an error occurs.
   */
  public readJsonFromTree(fileTree: FileTree.FileTree, filePath: string): Result<JsonValue> {
    return fileTree.getFile(filePath).onSuccess((file) => {
      // Now getContents() returns JsonCompatibleType<unknown> which is assignable to JsonValue!
      return file.getContents() as Result<JsonValue>;
    });
  }

  /**
   * Read a JSON file from a FileTree and apply a supplied converter or validator.
   * @param fileTree - The FileTree to read from
   * @param filePath - Path of the file to read within the tree
   * @param cv - Converter or validator used to process the file.
   * @param context - Optional context for the converter/validator
   * @returns `Success` with a result of type `<T>`, or `Failure`
   * with a message if an error occurs.
   */
  public convertJsonFromTree<T, TC = unknown>(
    fileTree: FileTree.FileTree,
    filePath: string,
    cv: Converter<T, TC> | Validator<T, TC>,
    context?: TC
  ): Result<T> {
    return this.readJsonFromTree(fileTree, filePath).onSuccess((json) => {
      return cv.convert(json, context);
    });
  }

  /**
   * Reads all JSON files from a directory in a FileTree and applies a converter or validator.
   * @param fileTree - The FileTree to read from
   * @param dirPath - The path of the directory within the tree
   * @param cv - Converter or validator to apply to each JSON file
   * @param filePattern - Optional regex pattern to filter files (defaults to .json files)
   * @param context - Optional context for the converter/validator
   * @returns Array of items with filename and converted content
   */
  public convertJsonDirectoryFromTree<T, TC = unknown>(
    fileTree: FileTree.FileTree,
    dirPath: string,
    cv: Converter<T, TC> | Validator<T, TC>,
    filePattern?: RegExp,
    context?: TC
  ): Result<IReadDirectoryItem<T>[]> {
    const pattern = filePattern ?? /\.json$/;

    return fileTree.getDirectory(dirPath).onSuccess((dir) => {
      return dir.getChildren().onSuccess((children) => {
        const results = children
          .filter((child) => child.type === 'file' && pattern.test(child.name))
          .map((file) => {
            return this.convertJsonFromTree(fileTree, file.absolutePath, cv, context).onSuccess((item) => {
              return succeed<IReadDirectoryItem<T>>({
                filename: file.name,
                item
              });
            });
          });
        return mapResults(results);
      });
    });
  }

  /**
   * Reads and converts all JSON files from a directory in a FileTree,
   * returning a Map indexed by file base name.
   * @param fileTree - The FileTree to read from
   * @param dirPath - The path of the directory within the tree
   * @param cv - Converter or validator to apply to each JSON file
   * @param filePattern - Optional regex pattern to filter files
   * @param context - Optional context for the converter/validator
   * @returns Map of basename to converted content
   */
  public convertJsonDirectoryToMapFromTree<T, TC = unknown>(
    fileTree: FileTree.FileTree,
    dirPath: string,
    cv: Converter<T, TC> | Validator<T, TC>,
    filePattern?: RegExp,
    context?: TC
  ): Result<Map<string, T>> {
    return this.convertJsonDirectoryFromTree(fileTree, dirPath, cv, filePattern, context).onSuccess(
      (items) => {
        const map = new Map<string, T>();
        for (const item of items) {
          const basename = item.filename.replace(/\.json$/, '');
          map.set(basename, item.item);
        }
        return succeed(map);
      }
    );
  }
}

/**
 * @public
 */
export const DefaultJsonTreeHelper: JsonTreeHelper = new JsonTreeHelper();
