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

import { Result, captureResult } from '@fgv/ts-utils';
import { CageId, CageType, CellId } from './common';
import { ICage } from './public';
import { PuzzleState } from './puzzleState';

/**
 * @internal
 */
export class Cage implements ICage {
  public readonly id: CageId;
  public readonly cageType: CageType;
  public readonly total: number;

  protected readonly _cellIds: CellId[];
  private _values: Set<number>;

  private constructor(id: CageId, type: CageType, total: number, cells: CellId[]) {
    this.id = id;
    this.cageType = type;
    this.total = total;
    this._cellIds = Array.from(cells);
    this._values = new Set();
  }

  public get cellIds(): CellId[] {
    return Array.from(this._cellIds);
  }

  public get numCells(): number {
    return this._cellIds.length;
  }

  public static create(id: CageId, type: CageType, total: number, cells: CellId[]): Result<Cage> {
    return captureResult(() => new Cage(id, type, total, cells));
  }

  public containsCell(id: CellId): boolean {
    return this._cellIds.includes(id);
  }

  public containsValue(value: number, state: PuzzleState, ignore?: CellId[]): boolean {
    for (const cellId of this._cellIds) {
      if (!ignore?.includes(cellId)) {
        /* c8 ignore next - defense in depth, ? should never happen */
        if (state.getCellContents(cellId).orDefault()?.value === value) {
          return true;
        }
      }
    }
    return false;
  }

  public containedValues(state: PuzzleState): Set<number> {
    const values = new Set<number>();
    for (const cellId of this._cellIds) {
      /* c8 ignore next - defense in depth, ? should never happen */
      const value = state.getCellContents(cellId).orDefault()?.value;
      if (value !== undefined) {
        values.add(value);
      }
    }
    return values;
  }

  public toString(state?: PuzzleState): string {
    return this._cellIds
      .map((id) => {
        /* c8 ignore next - defense in depth, ? should never happen */
        const value = state?.getCellContents(id).orDefault()?.value;
        return value ? String(value) : '.';
      })
      .join('');
  }
}
