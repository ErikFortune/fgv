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

import { Result, captureResult } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import * as fs from 'fs';
import * as path from 'path';
import { parseCsvString, CsvOptions } from './csvHelpers';

/**
 * Reads a CSV file from a supplied path.
 * @param srcPath - Source path from which the file is read.
 * @param options - optional parameters to control the processing
 * @returns The contents of the file.
 * @beta
 */
export function readCsvFileSync(srcPath: string, options?: CsvOptions): Result<unknown> {
  return captureResult(() => {
    const fullPath = path.resolve(srcPath);
    return fs.readFileSync(fullPath, 'utf8').toString();
  }).onSuccess((body) => {
    return parseCsvString(body, options);
  });
}

/**
 * Reads a CSV file from a FileTree.
 * @param fileTree - The FileTree to read from.
 * @param filePath - Path of the file within the tree.
 * @param options - optional parameters to control the processing
 * @returns The parsed CSV data.
 * @beta
 */
export function readCsvFromTree(
  fileTree: FileTree.FileTree,
  filePath: string,
  options?: CsvOptions
): Result<unknown> {
  return fileTree
    .getFile(filePath)
    .onSuccess((file) => file.getRawContents())
    .onSuccess((contents) => parseCsvString(contents, options));
}
