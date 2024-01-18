/*
 * MIT License
 *
 * Copyright (c) 2023 Erik Fortune
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

import { Converter, Converters, Result } from '@fgv/ts-utils';
import { IPuzzlesFile } from './model';

import { JsonFile } from '@fgv/ts-json-base';
import { Converters as CommonConverters } from '../common';

/**
 * Converts an arbitrary object to a {@link Data.Model.PuzzlesFile | PuzzlesFile}.
 * @public
 */
export const puzzlesFile: Converter<IPuzzlesFile> = Converters.strictObject<IPuzzlesFile>({
  puzzles: Converters.arrayOf(CommonConverters.puzzleDescription)
});

/**
 * Loads an arbitrary JSON file and parses it to return a validated
 * {@link Data.Model.PuzzlesFile | PuzzlesFile}.
 * @param path - String path to the file
 * @returns `Success` with the resulting file, or `Failure` with details if an
 * error occurs.
 * @public
 */
export function loadJsonPuzzlesFileSync(path: string): Result<IPuzzlesFile> {
  return JsonFile.convertJsonFileSync(path, puzzlesFile);
}
