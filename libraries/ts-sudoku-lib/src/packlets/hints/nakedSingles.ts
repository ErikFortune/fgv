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
 * Hint provider for the Naked Singles technique.
 *
 * A Naked Single occurs when a cell has only one possible candidate value
 * based on the constraints of its row, column, and 3x3 box.
 *
 * @public
 */
export class NakedSinglesProvider extends BaseHintProvider {
  /**
   * Creates a new NakedSinglesProvider instance.
   */
  public constructor() {
    super({
      techniqueId: TechniqueIds.NAKED_SINGLES,
      techniqueName: 'Naked Singles',
      difficulty: 'beginner',
      priority: 1, // Highest priority - should be checked first
      defaultConfidence: ConfidenceLevels.HIGH
    });
  }

  /**
   * Determines if this provider can potentially generate hints for the given puzzle state.
   * Always returns true since naked singles can potentially exist in any incomplete puzzle.
   * @param state - The current puzzle state
   * @returns true if there are empty cells that might have naked singles
   */
  public canProvideHints(state: PuzzleState): boolean {
    // Quick check: if there are empty cells, there might be naked singles
    const emptyCells = this.getEmptyCells(state);
    return emptyCells.length > 0;
  }

  /**
   * Generates all naked single hints for the given puzzle state.
   * @param state - The current puzzle state
   * @param options - Optional generation options
   * @returns Result containing array of naked single hints
   */
  public generateHints(state: PuzzleState, options?: IHintGenerationOptions): Result<readonly IHint[]> {
    return this.validateOptions(options).onSuccess(() => {
      const hints: IHint[] = [];
      const emptyCells = this.getEmptyCells(state);

      for (const cellId of emptyCells) {
        const candidates = this.getCandidates(cellId, state);

        // A naked single has exactly one candidate
        if (candidates.length === 1) {
          const value = candidates[0];
          const hint = this._createNakedSingleHint(cellId, value, state);
          hints.push(hint);
        }
      }

      return succeed(this.filterHints(hints, options));
    });
  }

  /**
   * Creates a hint for a specific naked single.
   * @param cellId - The cell containing the naked single
   * @param value - The single possible value for the cell
   * @param state - The current puzzle state
   * @returns A complete hint for this naked single
   */
  private _createNakedSingleHint(cellId: CellId, value: number, state: PuzzleState): IHint {
    // Create cell action to set the value
    const cellAction = this.createCellAction(cellId, 'set-value', value, `Only possible value for this cell`);

    // Find related cells that eliminate other candidates
    const relatedCells = this._findRelatedCells(cellId, value, state);

    // Create relevant cells grouping
    const relevantCells = this.createRelevantCells(
      [cellId], // Primary: the cell with the naked single
      relatedCells, // Secondary: cells that constrain this cell
      [] // Affected: none for naked singles
    );

    // Create explanations at different levels
    const explanations = [
      this.createExplanation(
        'brief',
        'Naked Single',
        `Cell ${cellId} can only contain the value ${value}.`,
        [`Set ${cellId} = ${value}`],
        ['Look for cells with only one possible value']
      ),

      this.createExplanation(
        'detailed',
        'Naked Single Analysis',
        `Cell ${cellId} has only one possible candidate: ${value}. All other values (1-9) are ` +
          `eliminated by existing numbers in the same row, column, or 3x3 box.`,
        [
          `Examine cell ${cellId}`,
          `Check which values 1-9 are already used in the same row, column, and 3x3 box`,
          `Identify that only ${value} is not eliminated`,
          `Set ${cellId} = ${value}`
        ],
        [
          'Naked singles are the most basic solving technique',
          'Always check for naked singles first',
          'A cell with one candidate must contain that value'
        ]
      ),

      this.createExplanation(
        'educational',
        'Understanding Naked Singles',
        `A naked single occurs when a cell has only one possible value due to Sudoku's fundamental rules. ` +
          `In cell ${cellId}, the value ${value} is the only number from 1-9 that doesn't already appear in the ` +
          `same row, column, or 3x3 box. This makes it a "naked" single because the solution is immediately visible.`,
        [
          `Locate cell ${cellId} in the grid`,
          `Scan the row containing ${cellId} and note which numbers 1-9 are already placed`,
          `Scan the column containing ${cellId} and note which numbers 1-9 are already placed`,
          `Scan the 3x3 box containing ${cellId} and note which numbers 1-9 are already placed`,
          `Combine all the "used" numbers from row, column, and box`,
          `The remaining unused number is ${value}, which must go in ${cellId}`,
          `Place ${value} in cell ${cellId}`
        ],
        [
          'Naked singles are always correct - there is no risk in placing them',
          'Start every solving session by finding all naked singles',
          'Placing naked singles often reveals new naked singles in related cells',
          'This technique forms the foundation for all other Sudoku solving methods'
        ]
      )
    ];

    return this.createHint([cellAction], relevantCells, explanations, ConfidenceLevels.HIGH);
  }

  /**
   * Finds cells in the same row, column, and box that constrain the given cell.
   * @param cellId - The cell to analyze
   * @param value - The value that will be placed
   * @param state - The current puzzle state
   * @returns Array of cell IDs that are related to this naked single
   */
  private _findRelatedCells(cellId: CellId, value: number, state: PuzzleState): CellId[] {
    const relatedCells: CellId[] = [];

    // Extract row and column from cellId using proper format (e.g., "A1" -> row=0, col=0)
    // CellId format is [A-Z][0-9], where A-I represents rows 0-8 and 1-9 represents cols 0-8
    const cellStr = cellId.toString();
    if (cellStr.length !== 2) {
      return relatedCells;
    }

    const rowChar = cellStr.charCodeAt(0);
    const colChar = cellStr.charCodeAt(1);

    // Validate format and extract coordinates
    if (
      rowChar < 'A'.charCodeAt(0) ||
      rowChar > 'I'.charCodeAt(0) ||
      colChar < '1'.charCodeAt(0) ||
      colChar > '9'.charCodeAt(0)
    ) {
      return relatedCells;
    }

    const row = rowChar - 'A'.charCodeAt(0); // A=0, B=1, ..., I=8
    const col = colChar - '1'.charCodeAt(0); // 1=0, 2=1, ..., 9=8

    // Find cells in the same row, column, and box that contain any value
    // These are the cells that constrain our naked single

    // Same row
    for (let c = 0; c < 9; c++) {
      if (c !== col) {
        const checkIdResult = Ids.cellId({ row, col: c });
        if (checkIdResult.isSuccess() && state.hasValue(checkIdResult.value)) {
          relatedCells.push(checkIdResult.value);
        }
      }
    }

    // Same column
    for (let r = 0; r < 9; r++) {
      if (r !== row) {
        const checkIdResult = Ids.cellId({ row: r, col });
        if (checkIdResult.isSuccess() && state.hasValue(checkIdResult.value)) {
          relatedCells.push(checkIdResult.value);
        }
      }
    }

    // Same 3x3 box
    const boxStartRow = Math.floor(row / 3) * 3;
    const boxStartCol = Math.floor(col / 3) * 3;

    for (let r = boxStartRow; r < boxStartRow + 3; r++) {
      for (let c = boxStartCol; c < boxStartCol + 3; c++) {
        if (r !== row || c !== col) {
          const checkIdResult = Ids.cellId({ row: r, col: c });
          if (checkIdResult.isSuccess() && state.hasValue(checkIdResult.value)) {
            relatedCells.push(checkIdResult.value);
          }
        }
      }
    }

    return relatedCells;
  }

  /**
   * Static factory method to create a new NakedSinglesProvider.
   * @returns Result containing the new provider
   */
  public static create(): Result<NakedSinglesProvider> {
    return succeed(new NakedSinglesProvider());
  }
}
