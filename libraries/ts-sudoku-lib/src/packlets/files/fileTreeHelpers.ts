/*
 * MIT License
 *
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

import { Result } from '@fgv/ts-utils';
import { IPuzzlesFile } from './model';
import { puzzlesFile } from './converters';
import { FileTree, JsonFile } from '@fgv/ts-json-base';

/**
 * Loads a puzzles file from a {@link FileTree.FileTree | FileTree}.
 * @param fileTree - FileTree containing the file
 * @param filePath - Path within the FileTree to the puzzles file
 * @returns `Success` with the resulting file, or `Failure` with details if an
 * error occurs.
 * @public
 */
export function loadJsonPuzzlesFromTree(fileTree: FileTree.FileTree, filePath: string): Result<IPuzzlesFile> {
  return JsonFile.DefaultJsonTreeHelper.convertJsonFromTree(fileTree, filePath, puzzlesFile);
}
