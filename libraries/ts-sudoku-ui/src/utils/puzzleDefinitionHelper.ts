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

import { IPuzzleDefinition, PuzzleType } from '@fgv/ts-sudoku-lib';

/**
 * Simple puzzle definition for UI usage
 * @public
 */
export interface ISimplePuzzleDescription {
  readonly id?: string;
  readonly description: string;
  readonly type: PuzzleType;
  readonly level: number;
  readonly totalRows: number;
  readonly totalColumns: number;
  readonly cells: string;
}

/**
 * Helper to create a complete IPuzzleDefinition from simple parameters
 * @public
 */
export function createPuzzleDefinition(simple: ISimplePuzzleDescription): IPuzzleDefinition {
  const { totalRows, totalColumns } = simple;

  // Determine cage dimensions based on grid size
  let cageWidth: number, cageHeight: number;

  if (totalRows === 4 && totalColumns === 4) {
    cageWidth = 2;
    cageHeight = 2;
  } else if (totalRows === 6 && totalColumns === 6) {
    cageWidth = 3;
    cageHeight = 2;
  } else if (totalRows === 9 && totalColumns === 9) {
    cageWidth = 3;
    cageHeight = 3;
  } else if (totalRows === 12 && totalColumns === 12) {
    cageWidth = 4;
    cageHeight = 3;
  } else if (totalRows === 16 && totalColumns === 16) {
    cageWidth = 4;
    cageHeight = 4;
  } else if (totalRows === 25 && totalColumns === 25) {
    cageWidth = 5;
    cageHeight = 5;
  } else {
    // Default to square cages
    const size = Math.sqrt(totalRows);
    cageWidth = Math.floor(size);
    cageHeight = Math.floor(size);
  }

  const boardWidthInCages = totalColumns / cageWidth;
  const boardHeightInCages = totalRows / cageHeight;
  const maxValue = cageWidth * cageHeight;
  const totalCages = boardWidthInCages * boardHeightInCages;
  const basicCageTotal = (maxValue * (maxValue + 1)) / 2;

  return {
    id: simple.id,
    description: simple.description,
    type: simple.type,
    level: simple.level,
    totalRows,
    totalColumns,
    cells: simple.cells,
    cageWidthInCells: cageWidth,
    cageHeightInCells: cageHeight,
    boardWidthInCages,
    boardHeightInCages,
    maxValue,
    totalCages,
    basicCageTotal
  };
}

/**
 * Helper to create an empty puzzle definition
 * @public
 */
export function createEmptyPuzzleDefinition(
  rows: number = 9,
  columns: number = 9,
  type: PuzzleType = 'sudoku'
): IPuzzleDefinition {
  return createPuzzleDefinition({
    id: 'manual-entry',
    description: 'Manual Entry Puzzle',
    type,
    level: 1,
    totalRows: rows,
    totalColumns: columns,
    cells: '.'.repeat(rows * columns)
  });
}
