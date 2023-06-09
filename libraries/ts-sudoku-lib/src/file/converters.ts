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

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { CageId, CellId, PuzzleType, allPuzzleTypes } from '../common';
import { IPuzzleDescription, IPuzzlesFile } from './model';

import { File } from '@fgv/ts-json';

const cageIdRegExp: RegExp = /^(R[A-Z]$)|(C[0-9]$)|(S[A-Z][0-9]$)|(X[1-2]$)|(K[A-Za-z]$)/;

function validateCageId(from: string): Result<CageId> {
  if (cageIdRegExp.test(from)) {
    return succeed(from as CageId);
  }
  return fail(`malformed cage ID "${from}" (expected "R[A-Z]", "C[0-9]" or "S[A-Z][0-9]")`);
}

const cellIdRegExp: RegExp = /^[A-Z][0-9]$/;
function validateCellId(from: string): Result<CellId> {
  if (cellIdRegExp.test(from)) {
    return succeed(from as CellId);
  }
  return fail(`malformed cell ID "${from}" (expected "[A-Z][0-9]")`);
}

/**
 * Converts an arbitrary value to a {@link CageId | CageId}.
 * @public
 */
export const cageId: Converter<CageId> = Converters.string.map(validateCageId);

/**
 * Converts an arbitrary value to a {@link CellId | CellId}.
 * @public
 */
export const cellId: Converter<CellId> = Converters.string.map(validateCellId);

/**
 * Converts an arbitrary value to a {@link PuzzleType | PuzzleType}.
 * @public
 */
export const puzzleType: Converter<PuzzleType, PuzzleType[]> =
  Converters.enumeratedValue<PuzzleType>(allPuzzleTypes);

/**
 * Converts an arbitrary object to a {@link Data.Model.PuzzleDescription | PuzzleDescription}.
 * @public
 */
export const puzzleDescription: Converter<IPuzzleDescription> = Converters.strictObject<IPuzzleDescription>(
  {
    id: Converters.string,
    description: Converters.string,
    type: puzzleType,
    level: Converters.number,
    rows: Converters.number,
    cols: Converters.number,
    cells: Converters.oneOf([Converters.string, Converters.stringArray.map((s) => succeed(s.join('')))])
  },
  {
    optionalFields: ['id']
  }
);

/**
 * Converts an arbitrary object to a {@link Data.Model.PuzzlesFile | PuzzlesFile}.
 * @public
 */
export const puzzlesFile: Converter<IPuzzlesFile> = Converters.strictObject<IPuzzlesFile>({
  puzzles: Converters.arrayOf(puzzleDescription)
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
  return File.convertJsonFileSync(path, puzzlesFile);
}
