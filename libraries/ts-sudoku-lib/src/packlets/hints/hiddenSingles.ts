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

import { Result, succeed } from '@fgv/ts-utils';
import { CellId, Ids, PuzzleState } from '../common';
import { BaseHintProvider } from './baseHintProvider';
import { ConfidenceLevels, IHint, IHintGenerationOptions, TechniqueIds } from './types';

/**
 * Represents a unit type (row, column, or box) for hidden single analysis.
 */
type UnitType = 'row' | 'column' | 'box';

/**
 * Information about a hidden single found in a specific unit.
 */
interface IHiddenSingleInfo {
  cellId: CellId;
  value: number;
  unitType: UnitType;
  unitIndex: number;
  otherCandidateCells: CellId[];
}

/**
 * Hint provider for the Hidden Singles technique.
 *
 * A Hidden Single occurs when a value can only be placed in one cell within
 * a row, column, or 3x3 box, even though that cell may have multiple candidates.
 *
 * @public
 */
export class HiddenSinglesProvider extends BaseHintProvider {
  /**
   * Creates a new HiddenSinglesProvider instance.
   */
  public constructor() {
    super({
      techniqueId: TechniqueIds.HIDDEN_SINGLES,
      techniqueName: 'Hidden Singles',
      difficulty: 'beginner',
      priority: 2, // Second priority after naked singles
      defaultConfidence: ConfidenceLevels.HIGH
    });
  }

  /**
   * Determines if this provider can potentially generate hints for the given puzzle state.
   * @param state - The current puzzle state
   * @returns true if there are empty cells that might have hidden singles
   */
  public canProvideHints(state: PuzzleState): boolean {
    const emptyCells = this.getEmptyCells(state);
    return emptyCells.length > 0;
  }

  /**
   * Generates all hidden single hints for the given puzzle state.
   * @param state - The current puzzle state
   * @param options - Optional generation options
   * @returns Result containing array of hidden single hints
   */
  public generateHints(state: PuzzleState, options?: IHintGenerationOptions): Result<readonly IHint[]> {
    return this.validateOptions(options).onSuccess(() => {
      const hints: IHint[] = [];
      const hiddenSingles = this._findAllHiddenSingles(state);

      for (const hiddenSingle of hiddenSingles) {
        const hint = this._createHiddenSingleHint(hiddenSingle, state);
        hints.push(hint);
      }

      return succeed(this.filterHints(hints, options));
    });
  }

  /**
   * Finds all hidden singles in the puzzle state.
   * @param state - The current puzzle state
   * @returns Array of hidden single information
   */
  private _findAllHiddenSingles(state: PuzzleState): IHiddenSingleInfo[] {
    const hiddenSingles: IHiddenSingleInfo[] = [];

    // Check rows
    for (let row = 0; row < 9; row++) {
      hiddenSingles.push(...this._findHiddenSinglesInRow(row, state));
    }

    // Check columns
    for (let col = 0; col < 9; col++) {
      hiddenSingles.push(...this._findHiddenSinglesInColumn(col, state));
    }

    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        hiddenSingles.push(...this._findHiddenSinglesInBox(boxRow, boxCol, state));
      }
    }

    // Remove duplicates (a cell might be found as hidden single in multiple units)
    return this._removeDuplicateHiddenSingles(hiddenSingles);
  }

  /**
   * Finds hidden singles in a specific row.
   * @param row - The row index (0-8)
   * @param state - The current puzzle state
   * @returns Array of hidden singles in this row
   */
  private _findHiddenSinglesInRow(row: number, state: PuzzleState): IHiddenSingleInfo[] {
    const hiddenSingles: IHiddenSingleInfo[] = [];

    // For each value 1-9, check if it can only go in one cell in this row
    for (let value = 1; value <= 9; value++) {
      const possibleCells: CellId[] = [];

      for (let col = 0; col < 9; col++) {
        const cellIdResult = Ids.cellId({ row, col });
        if (cellIdResult.isSuccess()) {
          const cellId = cellIdResult.value;
          const candidates = this.getCandidates(cellId, state);

          if (candidates.includes(value)) {
            possibleCells.push(cellId);
          }
        }
      }

      // Hidden single: exactly one cell can contain this value
      if (possibleCells.length === 1) {
        const cellId = possibleCells[0];
        const otherCandidateCells = this._getOtherCandidateCellsInRow(row, cellId, state);

        hiddenSingles.push({
          cellId,
          value,
          unitType: 'row',
          unitIndex: row,
          otherCandidateCells
        });
      }
    }

    return hiddenSingles;
  }

  /**
   * Finds hidden singles in a specific column.
   * @param col - The column index (0-8)
   * @param state - The current puzzle state
   * @returns Array of hidden singles in this column
   */
  private _findHiddenSinglesInColumn(col: number, state: PuzzleState): IHiddenSingleInfo[] {
    const hiddenSingles: IHiddenSingleInfo[] = [];

    for (let value = 1; value <= 9; value++) {
      const possibleCells: CellId[] = [];

      for (let row = 0; row < 9; row++) {
        const cellIdResult = Ids.cellId({ row, col });
        if (cellIdResult.isSuccess()) {
          const cellId = cellIdResult.value;
          const candidates = this.getCandidates(cellId, state);

          if (candidates.includes(value)) {
            possibleCells.push(cellId);
          }
        }
      }

      if (possibleCells.length === 1) {
        const cellId = possibleCells[0];
        const otherCandidateCells = this._getOtherCandidateCellsInColumn(col, cellId, state);

        hiddenSingles.push({
          cellId,
          value,
          unitType: 'column',
          unitIndex: col,
          otherCandidateCells
        });
      }
    }

    return hiddenSingles;
  }

  /**
   * Finds hidden singles in a specific 3x3 box.
   * @param boxRow - The box row (0-2)
   * @param boxCol - The box column (0-2)
   * @param state - The current puzzle state
   * @returns Array of hidden singles in this box
   */
  private _findHiddenSinglesInBox(boxRow: number, boxCol: number, state: PuzzleState): IHiddenSingleInfo[] {
    const hiddenSingles: IHiddenSingleInfo[] = [];
    const boxIndex = boxRow * 3 + boxCol;

    for (let value = 1; value <= 9; value++) {
      const possibleCells: CellId[] = [];

      for (let r = boxRow * 3; r < (boxRow + 1) * 3; r++) {
        for (let c = boxCol * 3; c < (boxCol + 1) * 3; c++) {
          const cellIdResult = Ids.cellId({ row: r, col: c });
          if (cellIdResult.isSuccess()) {
            const cellId = cellIdResult.value;
            const candidates = this.getCandidates(cellId, state);

            if (candidates.includes(value)) {
              possibleCells.push(cellId);
            }
          }
        }
      }

      if (possibleCells.length === 1) {
        const cellId = possibleCells[0];
        const otherCandidateCells = this._getOtherCandidateCellsInBox(boxRow, boxCol, cellId, state);

        hiddenSingles.push({
          cellId,
          value,
          unitType: 'box',
          unitIndex: boxIndex,
          otherCandidateCells
        });
      }
    }

    return hiddenSingles;
  }

  /**
   * Gets other cells in the same row that have candidates.
   * @param row - The row index
   * @param excludeCell - The cell to exclude from results
   * @param state - The current puzzle state
   * @returns Array of cell IDs with candidates in the same row
   */
  private _getOtherCandidateCellsInRow(row: number, excludeCell: CellId, state: PuzzleState): CellId[] {
    const cells: CellId[] = [];

    for (let col = 0; col < 9; col++) {
      const cellIdResult = Ids.cellId({ row, col });
      if (cellIdResult.isSuccess()) {
        const cellId = cellIdResult.value;
        if (cellId !== excludeCell && !state.hasValue(cellId)) {
          cells.push(cellId);
        }
      }
    }

    return cells;
  }

  /**
   * Gets other cells in the same column that have candidates.
   * @param col - The column index
   * @param excludeCell - The cell to exclude from results
   * @param state - The current puzzle state
   * @returns Array of cell IDs with candidates in the same column
   */
  private _getOtherCandidateCellsInColumn(col: number, excludeCell: CellId, state: PuzzleState): CellId[] {
    const cells: CellId[] = [];

    for (let row = 0; row < 9; row++) {
      const cellIdResult = Ids.cellId({ row, col });
      if (cellIdResult.isSuccess()) {
        const cellId = cellIdResult.value;
        if (cellId !== excludeCell && !state.hasValue(cellId)) {
          cells.push(cellId);
        }
      }
    }

    return cells;
  }

  /**
   * Gets other cells in the same box that have candidates.
   * @param boxRow - The box row (0-2)
   * @param boxCol - The box column (0-2)
   * @param excludeCell - The cell to exclude from results
   * @param state - The current puzzle state
   * @returns Array of cell IDs with candidates in the same box
   */
  private _getOtherCandidateCellsInBox(
    boxRow: number,
    boxCol: number,
    excludeCell: CellId,
    state: PuzzleState
  ): CellId[] {
    const cells: CellId[] = [];

    for (let r = boxRow * 3; r < (boxRow + 1) * 3; r++) {
      for (let c = boxCol * 3; c < (boxCol + 1) * 3; c++) {
        const cellIdResult = Ids.cellId({ row: r, col: c });
        if (cellIdResult.isSuccess()) {
          const cellId = cellIdResult.value;
          if (cellId !== excludeCell && !state.hasValue(cellId)) {
            cells.push(cellId);
          }
        }
      }
    }

    return cells;
  }

  /**
   * Removes duplicate hidden singles (same cell and value).
   * @param hiddenSingles - Array of potentially duplicate hidden singles
   * @returns Array with duplicates removed
   */
  private _removeDuplicateHiddenSingles(hiddenSingles: IHiddenSingleInfo[]): IHiddenSingleInfo[] {
    const seen = new Set<string>();
    const unique: IHiddenSingleInfo[] = [];

    for (const hiddenSingle of hiddenSingles) {
      const key = `${hiddenSingle.cellId}-${hiddenSingle.value}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(hiddenSingle);
      }
    }

    return unique;
  }

  /**
   * Creates a hint for a specific hidden single.
   * @param hiddenSingle - The hidden single information
   * @param state - The current puzzle state
   * @returns A complete hint for this hidden single
   */
  private _createHiddenSingleHint(hiddenSingle: IHiddenSingleInfo, state: PuzzleState): IHint {
    const { cellId, value, unitType, unitIndex } = hiddenSingle;

    // Create cell action to set the value
    const cellAction = this.createCellAction(
      cellId,
      'set-value',
      value,
      `Only cell in ${unitType} ${unitIndex} that can contain ${value}`
    );

    // Create relevant cells grouping
    const relevantCells = this.createRelevantCells(
      [cellId], // Primary: the cell with the hidden single
      hiddenSingle.otherCandidateCells, // Secondary: other empty cells in the unit
      [] // Affected: none for hidden singles
    );

    // Create explanations at different levels
    const unitName = this._getUnitName(unitType, unitIndex);
    const explanations = [
      this.createExplanation(
        'brief',
        'Hidden Single',
        `In ${unitName}, the value ${value} can only go in cell ${cellId}.`,
        [`Set ${cellId} = ${value}`],
        ['Look for values that can only go in one cell within a unit']
      ),

      this.createExplanation(
        'detailed',
        'Hidden Single Analysis',
        `In ${unitName}, the value ${value} can only be placed in cell ${cellId}. While this cell ` +
          `may have other candidates, ${value} has no other valid positions in this ${unitType}.`,
        [
          `Examine all empty cells in ${unitName}`,
          `For each empty cell, determine which values are possible candidates`,
          `Check where the value ${value} can be placed`,
          `Identify that ${value} can only go in ${cellId}`,
          `Set ${cellId} = ${value}`
        ],
        [
          'Hidden singles focus on where a value can go, not what can go in a cell',
          'Check each value 1-9 systematically within each unit',
          'A value with only one possible position must go there'
        ]
      ),

      this.createExplanation(
        'educational',
        'Understanding Hidden Singles',
        `A hidden single occurs when a particular value can only be placed in one cell within a ` +
          `row, column, or 3x3 box. In ${unitName}, we need to place the value ${value} somewhere, ` +
          `but due to constraints from other filled cells, it can only go in ${cellId}. This technique ` +
          `is called "hidden" because the single placement might not be obvious when looking at the ` +
          `cell's candidates alone - you need to consider the entire unit.`,
        [
          `Focus on ${unitName}`,
          `Identify that this unit needs the value ${value} to be placed somewhere`,
          `Examine each empty cell in this ${unitType} to see if ${value} could be placed there`,
          `Consider the constraints from the cell's row, column, and box`,
          `Eliminate cells where ${value} cannot go due to conflicts`,
          `Confirm that ${cellId} is the only remaining option for ${value}`,
          `Place ${value} in cell ${cellId}`
        ],
        [
          'Hidden singles complement naked singles - use both techniques together',
          'Systematically check each value 1-9 in each row, column, and box',
          'This technique often reveals itself after placing other numbers',
          'Hidden singles can exist even when a cell has many candidates'
        ]
      )
    ];

    return this.createHint([cellAction], relevantCells, explanations, ConfidenceLevels.HIGH);
  }

  /**
   * Gets a human-readable name for a unit.
   * @param unitType - The type of unit
   * @param unitIndex - The index of the unit
   * @returns Human-readable unit name
   */
  private _getUnitName(unitType: UnitType, unitIndex: number): string {
    switch (unitType) {
      case 'row':
        return `row ${unitIndex + 1}`;
      case 'column':
        return `column ${unitIndex + 1}`;
      case 'box':
        const boxRow = Math.floor(unitIndex / 3);
        const boxCol = unitIndex % 3;
        return `box (${boxRow + 1},${boxCol + 1})`;
      default:
        return `${unitType} ${unitIndex}`;
    }
  }

  /**
   * Static factory method to create a new HiddenSinglesProvider.
   * @returns Result containing the new provider
   */
  public static create(): Result<HiddenSinglesProvider> {
    return succeed(new HiddenSinglesProvider());
  }
}
