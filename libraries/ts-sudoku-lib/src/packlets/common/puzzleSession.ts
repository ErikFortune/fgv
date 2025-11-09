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

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { Cage } from './cage';
import { Cell } from './cell';
import { ICellContents, ICellState, IRowColumn, NavigationDirection, NavigationWrap } from './common';
import { Ids } from './ids';
import { ICage, ICell } from './public';
import { ICellUpdate, Puzzle } from './puzzle';
import { PuzzleState } from './puzzleState';

interface IPuzzleStep {
  updates: ICellUpdate[];
}

/**
 * Represents a single puzzle session, including puzzle, current state and redo/undo.
 * @public
 */
export class PuzzleSession {
  /**
   * The current {@link PuzzleState | state} of this puzzle session.
   */
  public state: PuzzleState;

  protected readonly _puzzle: Puzzle;
  protected _nextStep: number;
  protected _numSteps: number;
  protected _steps: IPuzzleStep[];

  /**
   * @internal
   */
  protected constructor(puzzle: Puzzle) {
    this._puzzle = puzzle;
    this.state = puzzle.initialState;
    this._nextStep = 0;
    this._numSteps = 0;
    this._steps = [];
  }

  /**
   * ID of the puzzle being solved.
   */
  public get id(): string | undefined {
    return this._puzzle.id;
  }

  /**
   * Description of the puzzle being solved.
   */
  public get description(): string {
    return this._puzzle.description;
  }

  /**
   * Type of the puzzle being solved.
   */
  public get type(): string {
    return this._puzzle.type;
  }

  /**
   * Number of rows in the puzzle being solved.
   */
  public get numRows(): number {
    return this._puzzle.numRows;
  }

  /**
   * Number of columns in the puzzle being solved.
   */
  public get numColumns(): number {
    return this._puzzle.numColumns;
  }

  /**
   * The row {@link ICage | cages} in the puzzle being solved.
   */
  public get rows(): ICage[] {
    return this._puzzle.rows;
  }

  /**
   * The column {@link ICage | cages} in the puzzle being solved.
   */
  public get cols(): ICage[] {
    return this._puzzle.cols;
  }

  /**
   * The section {@link ICage | cages} in the puzzle being solved.
   */
  public get sections(): ICage[] {
    return this._puzzle.sections;
  }

  /**
   * All {@link ICage | cages} in the puzzle being solved.
   */
  public get cages(): ICage[] {
    return this._puzzle.cages;
  }

  /**
   * The cells {@link ICell | cells} in the puzzle being solved.
   */
  public get cells(): ICell[] {
    return this._puzzle.cells;
  }

  /**
   * The puzzle structure for this session.
   */
  public get puzzle(): Puzzle {
    return this._puzzle;
  }

  /**
   * Index of the next step in this puzzle session.
   */
  public get nextStep(): number {
    return this._nextStep;
  }

  /**
   * Number of steps currently elapsed in this puzzle session.  Note
   * that after undo, `nextStep` will be less than `numSteps`.
   */
  public get numSteps(): number {
    return this._numSteps;
  }

  /***
   * Indicates whether undo is currently possible.
   */
  public get canUndo(): boolean {
    return this._nextStep > 0;
  }

  /**
   * Indicates whether redo is currently possible.
   */
  public get canRedo(): boolean {
    return this._nextStep < this._numSteps;
  }

  /**
   * Creates a new {@link PuzzleSession | puzzle session} from a supplied
   * {@link Puzzle | puzzle}.
   * @param puzzle - The {@link Puzzle | puzzle} from which the session is to be
   * initialized.
   * @returns `Success` with the requested {@link PuzzleSession | puzzle session},
   * or `Failure` with details if an error occurs.
   */
  public static create(puzzle: Puzzle): Result<PuzzleSession> {
    return captureResult(() => new PuzzleSession(puzzle));
  }

  /**
   * Determines if the puzzle is correctly solved.
   * @returns `true` if the puzzle is solved, `false` if the puzzle has
   * empty or invalid cells.
   */
  public checkIsSolved(): boolean {
    return this._puzzle.checkIsSolved(this.state);
  }

  /**
   * Determines if the puzzle is valid in its current state.
   * @returns `true` if all non-empty cells in the puzzle are valid,
   * or `false` if any cells are invalid.
   */
  public checkIsValid(): boolean {
    return this._puzzle.checkIsValid(this.state);
  }

  /**
   * Gets all of the currently empty {@link ICell | cells} in the puzzle.
   * @returns An array of {@link ICell | ICell} with all empty cells.
   */
  public getEmptyCells(): ICell[] {
    return this._puzzle.getEmptyCells(this.state);
  }

  /**
   * Gets all of the currently invalid {@link ICell | cells} in the puzzle.
   * @returns An array of {@link ICell | ICell} with all invalid cells.
   */
  public getInvalidCells(): ICell[] {
    return this._puzzle.getInvalidCells(this.state);
  }

  /**
   * Determines if a cell is valid.
   * @param spec - A `string` ({@link CellId | CellId}), {@link IRowColumn | RowColumn} or {@link ICell | ICell}
   * describing the cell to be tested.
   * @returns `true` if the cell value is valid, `false` if the cell value or the cell itself is invalid.
   */
  public cellIsValid(spec: string | IRowColumn | ICell): boolean {
    return this._cell(spec)?.isValid(this.state) === true;
  }

  /**
   * Determines if a cell has a value.
   * @param spec - A `string` ({@link CellId | CellId}), {@link IRowColumn | RowColumn} or {@link ICell | ICell}
   * describing the cell to be tested.
   * @returns `true` if the cell has a value, `false` if the cell is empty or the cell itself is invalid.
   */
  public cellHasValue(spec: string | IRowColumn | ICell): boolean {
    return this._cell(spec)?.hasValue(this.state) === true;
  }

  /**
   * Determines if supplied value is valid for a specific cell.
   * @param spec - A `string` ({@link CellId | CellId}), {@link IRowColumn | RowColumn} or {@link ICell | ICell}
   * describing the cell to be tested.
   * @param value - The value to be tested.
   * @returns `true` if `value` is valid for the requested cell, `false` if the value or the cell itself is invalid.
   */
  public isValidForCell(spec: string | IRowColumn | ICell, value: number): boolean {
    return this._cell(spec)?.isValidValue(value, this.state) === true;
  }

  /**
   * Gets the neighbor for a cell in a given direction using specified wrapping rules.
   * @param spec - A `string` ({@link CellId | CellId}), {@link IRowColumn | RowColumn} or {@link ICell | ICell}
   * describing the cell to be tested.
   * @param direction - The direction of the desired neighbor.
   * @param wrap - Wrapping rules to be applied.
   * @returns `Success` with the requested {@link ICell | cell}, or `Failure` with details if an error occurs.
   */
  public getCellNeighbor(
    spec: string | IRowColumn | ICell,
    direction: NavigationDirection,
    wrap: NavigationWrap
  ): Result<ICell> {
    return this._puzzle.getCellNeighbor(spec, direction, wrap);
  }

  /**
   * Gets the {@link ICellContents | contents} for a specified cell.
   * @param spec - A `string` ({@link CellId | CellId}), {@link IRowColumn | RowColumn} or {@link ICell | ICell}
   * describing the cell to be queried.
   * @returns `Success` with the {@link ICell | cell description} and {@link ICellContents | cell contents}, or
   * `Failure` with details if an error occurs.
   */
  public getCellContents(spec: string | IRowColumn): Result<{ cell: ICell; contents: ICellContents }> {
    return this._puzzle.getCellContents(spec, this.state);
  }

  /**
   * Updates the value of a cell.
   * @param spec - A `string`, {@link IRowColumn | row and column}, or {@link ICell | cell} identifying
   * the cell to be updated.
   * @param value - A new value for the cell.
   * @returns `Success` with `this` if the update is applied, `Failure` with details if an error occurs.
   */
  public updateCellValue(spec: string | IRowColumn | ICell, value: number | undefined): Result<this> {
    const idResult = Ids.cellId(spec);
    return idResult.onSuccess((id) => {
      const notes: number[] = [];
      const update: ICellState = { id, value, notes };
      return this._puzzle.updateValues(update, this.state).onSuccess((update) => {
        this._addMove(update.cells);
        this.state = update.to;
        return succeed(this);
      });
    });
  }

  /**
   * Updates the notes on a cell.
   * @param spec - A `string`, {@link IRowColumn | row and column}, or {@link ICell | cell} identifying
   * the cell to be updated.
   * @param notes - New notes for the cell.
   * @returns `Success` with `this` if the update is applied, `Failure` with details if an error occurs.
   */
  public updateCellNotes(spec: string | IRowColumn | ICell, notes: number[]): Result<this> {
    const idResult = Ids.cellId(spec);
    return idResult.onSuccess((id) => {
      const value = undefined;
      const update: ICellState = { id, value, notes };
      return this._puzzle.updateNotes(update, this.state).onSuccess((update) => {
        this._addMove(update.cells);
        this.state = update.to;
        return succeed(this);
      });
    });
  }

  /**
   * Updates value & notes for multiple cells.
   * @param updates - An array of {@link ICellState | cell state} objects, each describing
   * one cell to be updated.
   * @returns `Success` with `this` if the updates are applied, `Failure` with details if
   * an error occurs.
   */
  public updateCells(updates: ICellState[]): Result<this> {
    return this._puzzle.updateContents(updates, this.state).onSuccess((update) => {
      this._addMove(update.cells);
      this.state = update.to;
      return succeed(this);
    });
  }

  /**
   * Determines if some {@link ICage | cage} contains a specific value.
   * @param spec - A `string` ({@link CageId | CageId}) or {@link ICage | ICage}
   * indicating the cage to be tested.
   * @param value - The value to be tested.
   * @returns `true` if the cage exists and contains the specified value,
   * `false` otherwise.
   */
  public cageContainsValue(spec: string | ICage, value: number): boolean {
    return this._cage(spec)?.containsValue(value, this.state) === true;
  }

  /**
   * Determines the numbers currently present in some cage.
   * @param spec - A `string` ({@link CageId | CageId}) or {@link ICage | ICage}
   * indicating the cage to be tested.
   * @returns A `Set<number>` containing all numbers present in the cage.
   */
  public cageContainedValues(spec: string | ICage): Set<number> {
    return this._cage(spec)?.containedValues(this.state) ?? new Set<number>();
  }

  /**
   * Undo a single move in this puzzle session.
   * @returns `Success` with `this` if the undo is applied, or `Failure`
   * with details if an error occurs.
   */
  public undo(): Result<this> {
    if (!this.canUndo) {
      return fail(`nothing to undo`);
    }

    return this._puzzle
      .updateContents(
        this._steps[this._nextStep - 1].updates.map((u) => u.from),
        this.state
      )
      .onSuccess((update) => {
        this._nextStep--;
        this.state = update.to;
        return succeed(this);
      });
  }

  /**
   * Redo a single move in this puzzle session.
   * @returns `Success` with `this` if the redo is applied, or `Failure`
   * with details if an error occurs.
   */
  public redo(): Result<this> {
    if (!this.canRedo) {
      return fail('nothing to redo');
    }
    return this._puzzle
      .updateContents(
        this._steps[this._nextStep].updates.map((u) => u.to),
        this.state
      )
      .onSuccess((update) => {
        this._nextStep++;
        this.state = update.to;
        return succeed(this);
      });
  }

  /**
   * Gets a string representation of this puzzle, one string
   * per row.
   */
  public toStrings(): string[] {
    return this._puzzle.toStrings(this.state);
  }

  private _addMove(updates: ICellUpdate[]): void {
    if (this._nextStep < this._steps.length) {
      this._steps[this._nextStep++] = { updates };
    } else {
      this._steps.push({ updates });
      this._nextStep = this._steps.length;
    }
    this._numSteps = this._nextStep;
  }

  private _cage(spec: string | ICage): Cage | undefined {
    if (spec instanceof Cage) {
      return spec;
    }
    return Ids.cageId(spec)
      .onSuccess((id) => {
        return this._puzzle.getCage(id);
      })
      .orDefault();
  }

  private _cell(spec: string | IRowColumn | ICell): Cell | undefined {
    if (spec instanceof Cell) {
      return spec;
    }
    return this._puzzle.getCell(spec as string | IRowColumn).orDefault();
  }
}
