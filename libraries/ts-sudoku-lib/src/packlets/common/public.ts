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

import { CageId, CageType, CellId } from './common';

/**
 * Describes the structure of a single cage in a {@link PuzzleSession | puzzle}.
 * Does not describe state.
 * @public
 */
export interface ICage {
  /**
   * Unique identifier for the cage.
   */
  readonly id: CageId;

  /**
   * The {@link CageType | type} of the cage.
   */
  readonly cageType: CageType;

  /**
   * The expected sum of all cells in the cage.
   */
  readonly total: number;

  /**
   * The number of cells in the cage.
   */
  readonly numCells: number;

  /**
   * The identity of each cell in the cage.
   */
  readonly cellIds: CellId[];

  /**
   * Determines if a supplied cell is present in the cage.
   * @param id - the identifier to be searched.
   */
  containsCell(id: CellId): boolean;
}

/**
 * Describes the structure of a single cell in a {@link PuzzleSession | puzzle}.
 * Does not describe state.
 * @public
 */
export interface ICell {
  /**
   * Unique identifier for the cell.
   */
  readonly id: CellId;

  /**
   * Row number of the cell.
   */
  readonly row: number;

  /**
   * Column number of the cell.
   */
  readonly col: number;

  /**
   * All of the {@Link ICage | cages} to which this cell belongs.
   */
  readonly cages: readonly ICage[];

  /**
   * Indicates whether this cell is a given value (immutable).
   */
  readonly immutable: boolean;

  /**
   * Given value of this cell, or `undefined` if the cell is not immutable.
   */
  readonly immutableValue?: number;
}
