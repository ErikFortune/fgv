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

import { Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import {
  CageId,
  CellId,
  ICellContents,
  ICellState,
  IRowColumn,
  NavigationDirection,
  NavigationWrap
} from './common';

import { Cage } from './cage';
import { Cell } from './cell';
import { Ids } from './ids';
import { IPuzzleDescription } from './model';
import { ICell } from './public';
import { PuzzleState } from './puzzleState';

const basicCageTotal: number = 45;

/**
 * @internal
 */
export interface ICellUpdate {
  from: ICellState;
  to: ICellState;
}

/**
 * @internal
 */
export interface IPuzzleUpdate {
  from: PuzzleState;
  to: PuzzleState;
  cells: ICellUpdate[];
}

/**
 * @internal
 */
export class Puzzle {
  public readonly id?: string;
  public readonly description: string;
  public readonly initialState: PuzzleState;

  /**
   * @internal
   */
  protected readonly _rows: Map<CageId, Cage>;

  /**
   * @internal
   */
  protected readonly _columns: Map<CageId, Cage>;

  /**
   * @internal
   */
  protected readonly _sections: Map<CageId, Cage>;

  /**
   * @internal
   */
  protected readonly _cages: Map<CageId, Cage>;

  /**
   * @internal
   */
  protected readonly _cells: Map<CellId, Cell>;

  /**
   * Constructs a new puzzle state.
   * @param puzzle - {@Link IPuzzleDescription | Puzzle description} from which this puzzle state
   * is to be initialized.
   */
  protected constructor(puzzle: IPuzzleDescription, extraCages?: [CageId, Cage][]) {
    /* c8 ignore next - ?? is defense in depth */
    extraCages = extraCages ?? [];

    if (puzzle.rows !== 9) {
      throw new Error(`Puzzle '${puzzle.description}' unsupported row count ${puzzle.rows}`);
    }
    if (puzzle.cols !== 9) {
      throw new Error(`Puzzle '${puzzle.description}' unsupported column count ${puzzle.cols}`);
    }
    if (puzzle.cells.length !== puzzle.rows * puzzle.cols) {
      throw new Error(
        `Puzzle '${puzzle.description}" expected ${puzzle.rows * puzzle.cols} cells, found ${
          puzzle.cells.length
        }`
      );
    }

    this.id = puzzle.id;
    this.description = puzzle.description;

    const rows = Puzzle._createRowCages(puzzle.rows, puzzle.cols).orThrow();
    const columns = Puzzle._createColumnCages(puzzle.rows, puzzle.cols).orThrow();
    const sections = Puzzle._createSectionCages(puzzle.rows, puzzle.cols).orThrow();
    const cages = [...rows, ...columns, ...sections, ...extraCages];
    this._rows = new Map(rows);
    this._columns = new Map(columns);
    this._sections = new Map(sections);
    this._cages = new Map(cages);
    this._cells = new Map();

    const cellInit = [...puzzle.cells];
    for (let row = 0; row < this._rows.size; row++) {
      const rowCage = this.getRow(row).orThrow();
      for (let col = 0; col < this._columns.size; col++) {
        const id = Ids.cellId({ row, col }).orThrow();
        const colCage = this.getColumn(col).orThrow();
        const sectionCage = this.getSection({ row, col }).orThrow();
        const otherCages = extraCages.filter(([__key, cage]) => cage.containsCell(id));

        const init = cellInit.shift();
        /* c8 ignore next - defense in depth/make type check happy. undefined init should never happen */
        const immutableValue = init === '.' ? undefined : Number.parseInt(init ?? '0');
        if (
          immutableValue !== undefined &&
          (Number.isNaN(immutableValue) || immutableValue < 1 || immutableValue > 9)
        ) {
          throw new Error(`Puzzle ${puzzle.description} illegal value "${init}" for cell ${id}`);
        }
        const cages = [rowCage, colCage, sectionCage, ...otherCages.map(([__key, state]) => state)];
        const cell = new Cell({ id, immutableValue, row, col }, cages);
        this._cells.set(id, cell);
      }
    }

    this.initialState = PuzzleState.create(
      Array.from(this._cells.entries()).map(([id, state]): ICellState => {
        return { id, value: state.immutableValue, notes: [] };
      })
    ).orThrow();
  }

  public get numRows(): number {
    return this._rows.size;
  }

  public get numColumns(): number {
    return this._columns.size;
  }

  public get rows(): Cage[] {
    return Array.from(this._rows.values());
  }

  public get cols(): Cage[] {
    return Array.from(this._columns.values());
  }

  public get sections(): Cage[] {
    return Array.from(this._sections.values());
  }

  public get cages(): Cage[] {
    return Array.from(this._cages.values());
  }

  public get cells(): Cell[] {
    return Array.from(this._cells.values());
  }

  /**
   * @internal
   */
  protected static _createRowCages(numRows: number, numCols: number): Result<[CageId, Cage][]> {
    const cages: [CageId, Cage][] = [];
    for (let r = 0; r < numRows; r++) {
      const id = Ids.rowCageId(r);
      const cellIds = Ids.cellIds(r, 1, 0, numCols);
      /* c8 ignore next 3 - defense in depth should never happen */
      if (cellIds.isFailure()) {
        return fail(cellIds.message);
      }

      const result = Cage.create(id, 'row', basicCageTotal, cellIds.value).onSuccess((cage) => {
        cages.push([id, cage]);
        return succeed(cage);
      });
      /* c8 ignore next 3 - defense in depth should never happen */
      if (result.isFailure()) {
        return fail(result.message);
      }
    }
    return succeed(cages);
  }

  /**
   * @internal
   */
  protected static _createColumnCages(numRows: number, numCols: number): Result<[CageId, Cage][]> {
    const cages: [CageId, Cage][] = [];
    for (let c = 0; c < numCols; c++) {
      const id = Ids.columnCageId(c);
      const cellIds = Ids.cellIds(0, numRows, c, 1);
      /* c8 ignore next 3 - defense in depth should never happen */
      if (cellIds.isFailure()) {
        return fail(cellIds.message);
      }

      const result = Cage.create(id, 'column', basicCageTotal, cellIds.value).onSuccess((cage) => {
        cages.push([id, cage]);
        return succeed(cage);
      });
      /* c8 ignore next 3 - defense in depth should never happen */
      if (result.isFailure()) {
        return fail(result.message);
      }
    }
    return succeed(cages);
  }

  /**
   * @internal
   */
  private static _createSectionCages(numRows: number, numCols: number): Result<[CageId, Cage][]> {
    const cages: [CageId, Cage][] = [];
    for (let r = 0; r < numRows; r += 3) {
      for (let c = 0; c < numCols; c += 3) {
        const id = Ids.sectionCageId(r, c);
        const cellIds = Ids.cellIds(r, 3, c, 3);
        /* c8 ignore next 3 - defense in depth should never happen */
        if (cellIds.isFailure()) {
          return fail(cellIds.message);
        }

        const result = Cage.create(id, 'section', basicCageTotal, cellIds.value).onSuccess((cage) => {
          cages.push([id, cage]);
          return succeed(cage);
        });
        /* c8 ignore next 3 - defense in depth should never happen */
        if (result.isFailure()) {
          return fail(result.message);
        }
      }
    }
    return succeed(cages);
  }

  public checkIsSolved(state: PuzzleState): boolean {
    for (const id of this._cells.keys()) {
      if (!state.hasValue(id)) {
        return false;
      }
    }
    for (const cell of this._cells.values()) {
      if (!cell.isValid(state)) {
        return false;
      }
    }
    return true;
  }

  public checkIsValid(state: PuzzleState): boolean {
    for (const cell of this._cells.values()) {
      if (!cell.isValid(state)) {
        return false;
      }
    }
    return true;
  }

  public getEmptyCells(state: PuzzleState): Cell[] {
    return Array.from(this._cells.values()).filter((c) => !state.hasValue(c.id));
  }

  public getInvalidCells(state: PuzzleState): Cell[] {
    return Array.from(this._cells.values()).filter((c) => !c.isValid(state));
  }

  public getCellContents(
    spec: string | IRowColumn,
    state: PuzzleState
  ): Result<{ cell: Cell; contents: ICellContents }> {
    return this.getCell(spec).onSuccess((cell) => {
      if (cell.immutable) {
        const contents: ICellContents = { value: cell.immutableValue, notes: [] };
        return succeed({ cell, contents });
      }
      return state.getCellContents(cell.id).onSuccess((contents: ICellContents) => {
        return succeed({ cell, contents });
      });
    });
  }

  public getCell(spec: string | IRowColumn | ICell): Result<Cell> {
    const want = Ids.cellId(spec);
    if (want.isFailure()) {
      return fail(want.message);
    }

    const cell = this._cells.get(want.value);
    return cell ? succeed(cell) : fail(`Cell ${want.value} not found`);
  }

  public getCellNeighbor(
    spec: string | IRowColumn | ICell,
    direction: NavigationDirection,
    wrap: NavigationWrap
  ): Result<ICell> {
    return this.getCell(spec).onSuccess((cell) => {
      const move =
        direction === 'left' || direction === 'right'
          ? this._moveColumn(cell, direction, wrap)
          : this._moveRow(cell, direction, wrap);
      return move.onSuccess((next) => this.getCell(next));
    });
  }

  public updateContents(wantUpdates: ICellState[] | ICellState, state: PuzzleState): Result<IPuzzleUpdate> {
    wantUpdates = Array.isArray(wantUpdates) ? wantUpdates : [wantUpdates];
    return mapResults(
      wantUpdates.map((u) =>
        this.getCellContents(u.id, state).onSuccess((existing) =>
          existing.cell.update(u.value, u.notes).onSuccess((to) => {
            const from: ICellState = { id: u.id, ...existing.contents };
            return succeed({ from, to });
          })
        )
      )
    ).onSuccess((cellUpdates) => {
      return state.update(cellUpdates.map(({ to }) => to)).onSuccess((updatedState: PuzzleState) => {
        return succeed({
          from: state,
          to: updatedState,
          cells: cellUpdates
        });
      });
    });
  }

  public updateValues(wantUpdates: ICellState[] | ICellState, state: PuzzleState): Result<IPuzzleUpdate> {
    wantUpdates = Array.isArray(wantUpdates) ? wantUpdates : [wantUpdates];
    return mapResults(
      wantUpdates.map((u) =>
        this.getCellContents(u.id, state).onSuccess((existing) =>
          existing.cell.update(u.value, existing.contents.notes).onSuccess((to) => {
            const from: ICellState = { id: u.id, ...existing.contents };
            return succeed({ from, to });
          })
        )
      )
    ).onSuccess((cellUpdates) => {
      return state.update(cellUpdates.map(({ to }) => to)).onSuccess((updatedState: PuzzleState) => {
        return succeed({
          from: state,
          to: updatedState,
          cells: cellUpdates
        });
      });
    });
  }

  public updateNotes(wantUpdates: ICellState[] | ICellState, state: PuzzleState): Result<IPuzzleUpdate> {
    wantUpdates = Array.isArray(wantUpdates) ? wantUpdates : [wantUpdates];
    return mapResults(
      wantUpdates.map((u) =>
        this.getCellContents(u.id, state).onSuccess((existing) =>
          existing.cell.update(existing.contents.value, u.notes).onSuccess((to) => {
            const from: ICellState = { id: u.id, ...existing.contents };
            return succeed({ from, to });
          })
        )
      )
    ).onSuccess((cellUpdates) => {
      return state.update(cellUpdates.map(({ to }) => to)).onSuccess((updatedState: PuzzleState) => {
        return succeed({
          from: state,
          to: updatedState,
          cells: cellUpdates
        });
      });
    });
  }

  public updateCellValue(
    want: string | IRowColumn,
    value: number | undefined,
    state: PuzzleState
  ): Result<IPuzzleUpdate> {
    const idResult = Ids.cellId(want);
    const notes: number[] = [];
    return idResult.onSuccess((id) => {
      const update: ICellState = { id, value, notes };
      return this.updateValues([update], state);
    });
  }

  public updateCellNotes(
    want: string | IRowColumn,
    notes: number[],
    state: PuzzleState
  ): Result<IPuzzleUpdate> {
    const idResult = Ids.cellId(want);
    const value = undefined;
    return idResult.onSuccess((id) => {
      const update: ICellState = { id, value, notes };
      return this.updateNotes([update], state);
    });
  }

  public getRow(row: CageId | number): Result<Cage> {
    const id = typeof row === 'number' ? Ids.rowCageId(row) : row;
    const cage = this._rows.get(id);
    return cage ? succeed(cage) : fail(`Row ${id} not found`);
  }

  public getColumn(col: CageId | number): Result<Cage> {
    const id = typeof col === 'number' ? Ids.columnCageId(col) : col;
    const cage = this._columns.get(id);
    return cage ? succeed(cage) : fail(`Column ${id} not found`);
  }

  public getSection(spec: CageId | IRowColumn): Result<Cage> {
    const id = typeof spec === 'object' ? Ids.sectionCageId(spec.row, spec.col) : spec;
    const cage = this._sections.get(id);
    return cage ? succeed(cage) : fail(`Section ${id} not found`);
  }

  public getCage(id: CageId): Result<Cage> {
    const cage = this._cages.get(id);
    return cage ? succeed(cage) : fail(`Cage ${id} not found`);
  }

  public toStrings(state: PuzzleState): string[] {
    return Array.from(this._rows.values()).map((row) => row.toString(state));
  }

  public toString(state: PuzzleState): string {
    return this.toStrings(state).join('\n');
  }

  private _moveColumn(
    current: IRowColumn,
    direction: 'left' | 'right',
    wrap: NavigationWrap
  ): Result<IRowColumn> {
    const row = current.row;

    let col = current.col;
    if (direction === 'left') {
      if (col > 0) {
        col = col - 1;
      } else if (wrap !== 'none') {
        col = this.numColumns - 1;
        if (wrap === 'wrap-next') {
          return this._moveRow({ row, col }, 'up', 'wrap-around');
        }
      } else {
        return fail(`cannot move left from column ${current.col}`);
      }
    } else if (direction === 'right') {
      if (col < this.numColumns - 1) {
        col = col + 1;
      } else if (wrap !== 'none') {
        col = 0;
        if (wrap === 'wrap-next') {
          return this._moveRow({ row, col }, 'down', 'wrap-around');
        }
      } else {
        return fail(`cannot move right from column ${current.col}`);
      }
    }
    return succeed({ row, col });
  }

  private _moveRow(current: IRowColumn, direction: 'up' | 'down', wrap: NavigationWrap): Result<IRowColumn> {
    let row = current.row;
    const col = current.col;

    if (direction === 'up') {
      if (row > 0) {
        row = row - 1;
      } else if (wrap !== 'none') {
        row = this.numRows - 1;
        if (wrap === 'wrap-next') {
          return this._moveColumn({ row, col }, 'left', 'wrap-around');
        }
      } else {
        return fail(`cannot move up from row ${current.row}`);
      }
    } else if (direction === 'down') {
      if (row < this.numRows - 1) {
        row = row + 1;
      } else if (wrap !== 'none') {
        row = 0;
        if (wrap === 'wrap-next') {
          return this._moveColumn({ row, col }, 'right', 'wrap-around');
        }
      } else {
        return fail(`cannot move down from row ${current.row}`);
      }
    }
    return succeed({ row, col });
  }
}
