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
import { CellId, ICellContents, ICellState } from './common';

/**
 * @public
 */
export class PuzzleState {
  /**
   * @internal
   */
  protected readonly _cells: Map<CellId, ICellContents>;

  /**
   * @internal
   */
  protected constructor(from: Map<CellId, ICellContents>, updates?: ICellState[]) {
    const entries = [...Array.from(from.entries()), ...PuzzleState._toEntries(updates)];
    this._cells = new Map(entries);
  }

  /**
   * Constructs a new {@link PuzzleState | PuzzleState}.
   * @param cells - An array of {@link ICellState | CellState} used to initialize the state.
   * @returns The new {@link PuzzleState | PuzzleState}.
   */
  public static create(cells: ICellState[]): Result<PuzzleState> {
    return succeed(new PuzzleState(new Map(), cells));
  }

  /**
   * Convert {@link ICellContents | CellContents} to `[`{@link CellId | CellId}`,` {@link ICellContents | CellContents}`]`
   * tuple for `Map` construction.
   * @param states - An array of {@link ICellContents | CellContents} to be converted.
   * @returns The corresponding array of `[`{@link CellId | CellId}`,` {@link ICellContents | CellContents}`]`
   * @internal
   */
  protected static _toEntries(states?: ICellState[]): [CellId, ICellContents][] {
    /* c8 ignore next 3 - defense in depth */
    if (!states) {
      return [];
    }
    return states.map((state) => {
      const { id, value, notes } = state;
      return [id, { value, notes }];
    });
  }

  /**
   * Gets the contents of a cell specified by {@link CellId | id}.
   * @param id - The {@link CellId | id} of the cell to be retrieved.
   * @returns A {@link ICellContents | CellContents} with the contents of
   * the requested cell.
   */
  public getCellContents(id: CellId): Result<ICellContents> {
    const cell = this._cells.get(id);
    return cell ? succeed(cell) : fail(`cell ${id} not found`);
  }

  /**
   * Determines if some cell has an assigned value.
   * @param id - The {@link CellId | id} of the cell to be tested.
   * @returns `true` if the cell has a value, `false` if the cell
   * is empty or invalid.
   */
  public hasValue(id: CellId): boolean {
    const cell = this._cells.get(id);
    return cell?.value !== undefined;
  }

  /**
   * Creates a new {@link PuzzleState | PuzzleState} which corresponds
   * to this state with updates applied.
   * @param updates - An array of {@link ICellState | CellState} to be
   * applied.
   * @returns A new {@link PuzzleState} with updates applied.
   */
  public update(updates: ICellState[]): Result<PuzzleState> {
    const updated = new PuzzleState(this._cells, updates);
    if (updated._cells.size > this._cells.size) {
      return fail(`update added cells`);
    }
    return succeed(updated);
  }
}
