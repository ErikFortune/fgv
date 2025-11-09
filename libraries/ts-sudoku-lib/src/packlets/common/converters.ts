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
import { CageId, CellId, PuzzleType, allPuzzleTypes } from './common';

// Updated to support larger grids:
// - Row IDs: R followed by A-Z or AA-ZZ for rows
// - Column IDs: C followed by 1-99+ for columns
// - Section IDs: S followed by row letter(s) and column number(s)
// - X diagonals: X1, X2
// - Killer cages: K followed by letter(s)
const cageIdRegExp: RegExp =
  /^(R[A-Z]{1,2}$)|(C[0-9]{1,3}$)|(S[A-Z]{1,2}[0-9]{1,3}$)|(X[1-2]$)|(K[A-Za-z]+$)/;

function validateCageId(from: string): Result<CageId> {
  if (cageIdRegExp.test(from)) {
    return succeed(from as CageId);
  }
  return fail(`malformed cage ID "${from}"`);
}

// Updated to support larger grids:
// - Rows: A-Z for 0-25, then AA-ZZ for 26+
// - Columns: 1-999 for any size grid
const cellIdRegExp: RegExp = /^[A-Z]{1,2}[0-9]{1,3}$/;

function validateCellId(from: string): Result<CellId> {
  // Check basic format
  if (!cellIdRegExp.test(from)) {
    return fail(`malformed cell ID "${from}" (expected row letter(s) followed by column number)`);
  }

  return succeed(from as CellId);
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
export const puzzleType: Converter<
  PuzzleType,
  ReadonlyArray<PuzzleType>
> = Converters.enumeratedValue<PuzzleType>(allPuzzleTypes);
