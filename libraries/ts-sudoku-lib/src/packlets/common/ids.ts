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
const firstColIdChar: number = '1'.charCodeAt(0);

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
    return succeed(from.id);
  }

  public static cellId(spec: string | IRowColumn | ICell): Result<CellId> {
    if (isRowColumn(spec)) {
      if ('id' in spec) {
        return succeed(spec.id);
      }
      const row = String.fromCharCode(firstRowIdChar + spec.row);
      const col = String.fromCharCode(firstColIdChar + spec.col);
      return succeed(`${row}${col}` as CellId);
    }
    return Converters.cellId.convert(spec);
  }

  public static rowCageId(row: number): CageId {
    return `R${String.fromCharCode(firstRowIdChar + row)}` as CageId;
  }

  public static columnCageId(col: number): CageId {
    return `C${String.fromCharCode(firstColIdChar + col)}` as CageId;
  }

  public static sectionCageId(row: number, col: number): CageId {
    row = Math.floor(row / 3) * 3;
    col = Math.floor(col / 3) * 3;
    return `S${String.fromCharCode(firstRowIdChar + row)}${String.fromCharCode(
      firstColIdChar + col
    )}` as CageId;
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
