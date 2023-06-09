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
import { Cage } from './cage';
import { CellId, ICellContents, ICellState } from './common';
import { ICell } from './public';
import { PuzzleState } from './puzzleState';

/**
 * @internal
 */
export interface ICellInit {
  readonly id: CellId;
  readonly row: number;
  readonly col: number;
  readonly immutableValue?: number;
}

/**
 * @internal
 */
export class Cell implements ICellInit, ICell {
  public readonly id: CellId;
  public readonly row: number;
  public readonly col: number;
  public readonly cages: readonly Cage[];

  public readonly immutable: boolean;
  public readonly immutableValue?: number;

  public constructor(init: ICellInit, cages: readonly Cage[]) {
    this.id = init.id;
    this.row = init.row;
    this.col = init.col;
    this.cages = [...cages];
    this.immutableValue = init.immutableValue;
    this.immutable = init.immutableValue !== undefined;
  }

  public isValid(state: PuzzleState): boolean {
    if (this.immutable) {
      return true;
    }
    const cell = state.getCellContents(this.id).orDefault();
    return cell !== undefined && this.isValidValue(cell.value, state);
  }

  public hasValue(state: PuzzleState): boolean {
    if (this.immutable) {
      return true;
    }
    const cell = state.getCellContents(this.id).orDefault();
    /* c8 ignore next - defense in depth ? should never happen */
    return cell?.value !== undefined;
  }

  public isValidValue(value: number | undefined, state: PuzzleState): boolean {
    if (this.immutable) {
      return false;
    } else if (value === undefined) {
      return true;
    }
    return !this.cages.find((cage) => cage.containsValue(value, state, [this.id]));
  }

  public update(value: number | undefined, notes: number[]): Result<ICellState> {
    if (this.immutable) {
      return fail(`cannot set value "${value}" in immutable cell ${this.id}`);
    }
    return succeed({
      id: this.id,
      value,
      notes
    });
  }

  public updateValue(value: number | undefined, state: PuzzleState): Result<ICellState> {
    return state.getCellContents(this.id).onSuccess((contents: ICellContents) => {
      return this.update(value, contents.notes);
    });
  }

  public updateNotes(notes: number[], state: PuzzleState): Result<ICellState> {
    return state.getCellContents(this.id).onSuccess((contents: ICellContents) => {
      return this.update(contents.value, notes);
    });
  }

  public toString(state?: PuzzleState): string {
    const contents = state?.getCellContents(this.id).orDefault();
    const value = this.immutableValue ?? contents?.value;
    return value && value >= 1 && value <= 9 ? String(value) : '.';
  }
}
