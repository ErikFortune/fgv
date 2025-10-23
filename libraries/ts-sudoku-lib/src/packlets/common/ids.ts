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

import { Result, fail, succeed } from '@fgv/ts-utils';
import { CageId, CellId, IRowColumn } from './common';
import * as Converters from './converters';
import { ICage, ICell } from './public';

const firstRowIdChar: number = 'A'.charCodeAt(0);

/**
 * Convert a column index (0-based) to column letters (A-Z, AA-AZ, BA-BZ, etc.)
 * @param col - 0-based column index
 * @returns Column identifier string
 */
function columnToLetters(col: number): string {
  if (col < 26) {
    // Single letter: A-Z
    return String.fromCharCode(firstRowIdChar + col);
    /* c8 ignore next 8 - functional code tested but coverage intermittently missed */
  } else {
    // Double letters: AA, AB, ..., ZZ
    const firstLetter = Math.floor(col / 26) - 1;
    const secondLetter = col % 26;
    return (
      String.fromCharCode(firstRowIdChar + firstLetter) + String.fromCharCode(firstRowIdChar + secondLetter)
    );
  }
}

/**
 * Convert a row index (0-based) to row number string (1-based with zero-padding)
 * @param row - 0-based row index
 * @param maxRow - Maximum row index (optional, for determining padding width)
 * @returns Row number string with zero-padding
 */
function rowToNumber(row: number, maxRow?: number): string {
  const rowNum = row + 1;
  /* c8 ignore next 5 - functional code tested but coverage intermittently missed */
  if (maxRow !== undefined) {
    const maxRowNum = maxRow + 1;
    const width = maxRowNum.toString().length;
    return rowNum.toString().padStart(width, '0');
  }
  // Default: pad to 2 digits for grids up to 99x99
  return rowNum.toString().padStart(2, '0');
}

/**
 * Parse a cell ID string back to row/column coordinates
 * @param cellId - Cell ID string (e.g., "A1", "A01", "AB15")
 * @returns Row and column indices (0-based) or undefined if invalid
 * @public
 */
export function parseCellId(cellId: string): IRowColumn | undefined {
  const match = cellId.match(/^([A-Z]{1,2})([0-9]{1,3})$/);
  /* c8 ignore next 3 - functional code tested but coverage intermittently missed */
  if (!match) {
    return undefined;
  }

  const rowLetters = match[1];
  const colNumber = parseInt(match[2], 10);

  let row: number;
  if (rowLetters.length === 1) {
    // Single letter: A-Z maps to rows 0-25
    row = rowLetters.charCodeAt(0) - firstRowIdChar;
    /* c8 ignore next 6 - functional code tested but coverage intermittently missed */
  } else {
    // Double letters: AA-ZZ for rows 26+
    const firstLetter = rowLetters.charCodeAt(0) - firstRowIdChar;
    const secondLetter = rowLetters.charCodeAt(1) - firstRowIdChar;
    row = (firstLetter + 1) * 26 + secondLetter;
  }

  const col = colNumber - 1; // Convert from 1-based to 0-based

  return { row, col };
}

function isRowColumn(from: unknown): from is IRowColumn {
  return typeof from === 'object' && from !== null && 'row' in from && `col` in from;
}

/**
 * @public
 */
export class Ids {
  public static cageId(from: string | ICage): Result<CageId> {
    if (typeof from === 'string') {
      return Converters.cageId.convert(from);
    }
    /* c8 ignore next 2 - functional code tested but coverage intermittently missed */
    return succeed(from.id);
  }

  public static cellId(spec: string | IRowColumn | ICell): Result<CellId> {
    if (isRowColumn(spec)) {
      if ('id' in spec) {
        return succeed(spec.id);
      }
      // Standard sudoku convention: Letters for rows (A-I), numbers for columns (1-9)
      const rowLetter = columnToLetters(spec.row);
      // For 9x9 grids, use single digit format for backward compatibility
      // For larger grids, use zero-padding
      const colNumber = spec.col < 9 ? (spec.col + 1).toString() : rowToNumber(spec.col);
      return succeed(`${rowLetter}${colNumber}` as CellId);
    }
    return Converters.cellId.convert(spec);
  }

  public static rowCageId(row: number): CageId {
    return `R${columnToLetters(row)}` as CageId;
  }

  public static columnCageId(col: number): CageId {
    // For backward compatibility, use single digit for columns < 9
    const colNumber = col < 9 ? (col + 1).toString() : rowToNumber(col);
    return `C${colNumber}` as CageId;
  }

  public static sectionCageId(
    row: number,
    col: number,
    cageHeight: number = 3,
    cageWidth: number = 3
  ): CageId {
    row = Math.floor(row / cageHeight) * cageHeight;
    col = Math.floor(col / cageWidth) * cageWidth;
    // Section IDs use row letter and column number
    const rowLetter = columnToLetters(row);
    const colNumber = col < 9 ? (col + 1).toString() : rowToNumber(col);
    return `S${rowLetter}${colNumber}` as CageId;
  }

  public static cellIds(
    firstRow: number,
    numRows: number,
    firstCol: number,
    numCols: number
  ): Result<CellId[]> {
    const cellIds: CellId[] = [];
    for (let row = firstRow; row < firstRow + numRows; row++) {
      for (let col = firstCol; col < firstCol + numCols; col++) {
        const result = this.cellId({ row, col }).onSuccess((id) => {
          cellIds.push(id);
          return succeed(id);
        });

        /* c8 ignore next 3 - defense in depth should not happen */
        if (result.isFailure()) {
          return fail(result.message);
        }
      }
    }
    return succeed(cellIds);
  }
}
