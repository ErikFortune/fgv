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

import { Brand } from '@fgv/ts-utils';

/**
 * Nominal identifier for a single {@Link ICell | cell} in a {@link PuzzleSession | puzzle}.
 * @public
 */
export type CellId = Brand<string, 'CellId'>;

/**
 * Nominal identifier for a single {@Link ICage | cage} in a {@link PuzzleSession | puzzle}.
 * @public
 */
export type CageId = Brand<string, 'CageId'>;

/**
 * Identifies the type of a {@Link ICage | cage}.
 * @public
 */
export type CageType = 'row' | 'column' | 'section' | 'x' | 'killer';

/**
 * The row/column coordinate of a single {@Link ICell | cell} in a {@link PuzzleSession | puzzle}.
 * @public
 */
export interface IRowColumn {
  row: number;
  col: number;
}

/**
 * The contents of a single {@Link ICell | cell} in a {@link PuzzleSession | puzzle}.
 * @public
 */
export interface ICellContents {
  /**
   * The value of the {@link ICell | cell}, or `undefined` if no value has been assigned.
   */
  readonly value?: number;
  /**
   * Any notes associated with the {@link ICell | cell}.
   */
  readonly notes: number[];
}

/**
 * Describes the state of or a state update for a single {@link ICell |cell} in a
 * {@link PuzzleSession | puzzle}.
 * @public
 */

export interface ICellState extends ICellContents {
  readonly id: CellId;
}

/**
 * Describes the rules that apply to the puzzle.
 * @public
 */
export type PuzzleType = 'killer-sudoku' | 'sudoku' | 'sudoku-x';

/**
 * All supported public types.
 * @public
 */
export const allPuzzleTypes: PuzzleType[] = ['killer-sudoku', 'sudoku', 'sudoku-x'];

/**
 * The minimum and maximum possible values for a {@link ICage | cage}, by cage size in
 * {@link ICell | cells}.
 * @public
 */
export const totalsByCageSize: readonly { min: number; max: number }[] = [
  { min: 0, max: 0 },
  { min: 1, max: 9 },
  { min: 3, max: 17 },
  { min: 6, max: 24 },
  { min: 10, max: 30 },
  { min: 15, max: 35 },
  { min: 21, max: 39 },
  { min: 28, max: 42 },
  { min: 36, max: 44 },
  { min: 45, max: 45 }
];

/**
 * Navigation direction within a puzzle.
 * @public
 *
 */
export type NavigationDirection = 'down' | 'left' | 'right' | 'up';

/**
 * Wrapping rules when navigating within a puzzle.
 * @public
 */
export type NavigationWrap = 'none' | 'wrap-around' | 'wrap-next';
